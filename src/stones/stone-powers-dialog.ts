/**
 * Stone Powers Dialog — Steine pro Macht in Segmenten (1→2→4→8) verteilen.
 * Voll bezahlte Wellen werden beim Schließen des Dialogs abgerechnet (Pools, RoundState, Radial); beim Klick/Drop bleiben Steine in den Slots.
 */

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

// Type workaround for Mixin
const BaseDialog = HandlebarsApplicationMixin(ApplicationV2) as typeof ApplicationV2;

type AttributeKey = 'might' | 'agility' | 'vitality' | 'intellect' | 'resolve' | 'influence';

import {
  STONE_POWERS,
  getAvailableStonePowers,
  activateStonePower,
  activateGenericStonePowerMixed
} from './stone-activation.js';
import {
  STONE_POWERS_BY_ATTRIBUTE,
  STONE_POWER_SUPPORT_TIER_SHIFT,
  STONE_TIER_HARD_MAX,
  resolveStonePowerId,
  stonePowerSkipsFirstTier,
  type StonePower,
} from './stone-powers.js';
import {
  getStoneUsageCount,
  getGenericStonePowerUsageCount,
  calculateStoneCost,
  getStonePool,
  isStonePowersConfigurationLocked,
  getActionEconomyActor
} from '../combat/action-economy.js';
import { getStoneGemStyle } from '../utils/stone-attribute-ui.js';
import {
  COLORLESS_GEM_STYLE,
  COLORLESS_STONE_ATTR,
  colorlessStoneInitiativeCost,
  convertInitiativeToColorlessStones,
  getMasteryRank,
  getTempColorlessStones,
  isInitiativeBoostUsedThisCombat,
  maxConvertibleColorlessStones,
} from './colorless-stones.js';
import { poolSpendableStones } from '../utils/artifact-actor-rules.js';
import { countArtifactActivationStones } from '../utils/artifact-stone-bound.js';
import { getArtifactStoneFunctionStatus } from '../utils/artifact-stone-functions.js';
import { refreshRadialMenuActionLabelsIfOpenForActor } from '../token-radial-menu.js';

const STONE_DRAG_MIME = 'application/x-mastery-stone-attribute';
const STONE_RETURN_MIME = 'application/x-mastery-stone-return-acc';

/** Physische Zahlungs-Lanes im Cluster: 1 + 2 + 4 + 8. T5+ (16/32) is future UI. */
const STONE_PAYMENT_LANE_COUNT = 15;

/** Segment-Index für Lane: 0=Anchor(1), 1=Mid(2), 2=Quad(4), 3=Oct(8). */
function segmentIndexForLane(laneIndex: number): number {
  if (laneIndex === 0) return 0;
  if (laneIndex <= 2) return 1;
  if (laneIndex <= 6) return 2;
  return 3;
}

/** Segment vollständig belegt (Voraussetzung für das nächste Segment). */
function isStoneSegmentComplete(o: Set<number>, seg: number): boolean {
  if (seg === 0) return o.has(0);
  if (seg === 1) return o.has(1) && o.has(2);
  if (seg === 2) return [3, 4, 5, 6].every((l) => o.has(l));
  if (seg === 3) return [7, 8, 9, 10, 11, 12, 13, 14].every((l) => o.has(l));
  return false;
}

/** Leere Lane darf einen Stein annehmen (Segment-Freigabe 1 → 2 → 4 → 8). */
function isLaneAllowedBySegmentUnlock(occupied: number[], laneIndex: number): boolean {
  if (laneIndex < 0 || laneIndex >= STONE_PAYMENT_LANE_COUNT) return false;
  const o = new Set(occupied);
  if (o.has(laneIndex)) return false;
  const seg = segmentIndexForLane(laneIndex);
  for (let s = 0; s < seg; s++) {
    if (!isStoneSegmentComplete(o, s)) return false;
  }
  return true;
}

/** Alle leeren Lanes, die aktuell dropfähig sind. */
function allowedSegmentDropLanes(occupied: number[]): Set<number> {
  const set = new Set<number>();
  for (let l = 0; l < STONE_PAYMENT_LANE_COUNT; l++) {
    if (isLaneAllowedBySegmentUnlock(occupied, l)) set.add(l);
  }
  return set;
}

/** Lane-Indizes pro Segment: 0=1, 1=2, 2=4, 3=8. */
function lanesInStonePaymentSegment(segmentIndex: number): number[] {
  if (segmentIndex === 0) return [0];
  if (segmentIndex === 1) return [1, 2];
  if (segmentIndex === 2) return [3, 4, 5, 6];
  if (segmentIndex === 3) return [7, 8, 9, 10, 11, 12, 13, 14];
  return [];
}

/**
 * Niedrigstes Segment mit freien Lanes, sobald alle vorherigen Segmente voll sind.
 * Ein Linksklick füllt nur dieses Segment (teilweise, wenn der Pool nicht reicht).
 */
function nextStoneSegmentToFill(occupied: number[]): number | null {
  const o = new Set(occupied);
  for (let seg = 0; seg <= 3; seg++) {
    if (isStoneSegmentComplete(o, seg)) continue;
    for (let s = 0; s < seg; s++) {
      if (!isStoneSegmentComplete(o, s)) return null;
    }
    return seg;
  }
  return null;
}

/**
 * Some powers have a no-op Tier 1 "ramp step" (e.g. Extra Attack), so their
 * first real activation is Tier 2 = the Mid segment (2 stones). Such powers
 * skip the leading segment(s): the Anchor renders disabled and the first
 * payable wave is the Mid segment.
 */
function rampSkipSegmentsForPower(powerId: string): number {
  return stonePowerSkipsFirstTier(powerId) ? 1 : 0;
}

/** Lane indices of the leading segments skipped by a ramp power (e.g. [0]). */
function rampSkipLeadLanes(powerId: string): number[] {
  const segs = rampSkipSegmentsForPower(powerId);
  if (segs <= 0) return [];
  const lanes: number[] = [];
  for (let s = 0; s < segs; s++) lanes.push(...lanesInStonePaymentSegment(s));
  return lanes;
}

/** Occupied lanes augmented with skipped lead lanes (for segment-unlock only). */
function occWithRampSkip(occupied: number[], powerId: string): number[] {
  const lead = rampSkipLeadLanes(powerId);
  return lead.length ? [...occupied, ...lead] : occupied;
}

/** Fallback wenn getData im Drop leer bleibt (z. B. Chromium/Foundry) */
let msLastDraggedStoneAttribute = '';

/** Mittelteil im Akku-Schlüssel: General Powers mit Steinen aus mehreren Attribut-Pools. */
const STONE_GENERIC_UNIFIED_MARKER = 'msGenMulti';

type GenericLaneOcc = { lane: number; attr: string };

type StoneAccumulatorValue = number[] | GenericLaneOcc[];

/** `powerId:middle:uses` — powerId darf Punkte (und künftig Doppelpunkte) enthalten. */
function parseStonePowerAccKey(accKey: string): { powerId: string; middle: string; uses: number } | null {
  const j = accKey.lastIndexOf(':');
  if (j <= 0) return null;
  const uses = Number(accKey.slice(j + 1));
  if (!Number.isFinite(uses)) return null;
  const rest = accKey.slice(0, j);
  const i = rest.lastIndexOf(':');
  if (i <= 0) return null;
  return { powerId: rest.slice(0, i), middle: rest.slice(i + 1), uses };
}

function stonePowerAccKeyPowerId(accKey: string): string | null {
  return parseStonePowerAccKey(accKey)?.powerId ?? null;
}

function accKeyPayAttrSegment(accKey: string): string | null {
  return parseStonePowerAccKey(accKey)?.middle ?? null;
}

function accKeyUsesSegment(accKey: string): number | null {
  const p = parseStonePowerAccKey(accKey);
  return p != null && Number.isFinite(p.uses) ? p.uses : null;
}

function isGenericUnifiedAccKey(accKey: string): boolean {
  return accKeyPayAttrSegment(accKey) === STONE_GENERIC_UNIFIED_MARKER;
}

function genericUnifiedAccKey(powerId: string, uses: number): string {
  return `${powerId}:${STONE_GENERIC_UNIFIED_MARKER}:${uses}`;
}

function isGenericLaneOccArray(v: StoneAccumulatorValue): v is GenericLaneOcc[] {
  const x = v[0] as unknown;
  return x !== undefined && typeof x === 'object' && x !== null && 'lane' in (x as object);
}

const ALL_STONE_ATTRS: AttributeKey[] = [
  'might',
  'agility',
  'vitality',
  'intellect',
  'resolve',
  'influence'
];

/** Pools shown in the dialog (core six + optional Wits if the actor has a wits pool). */
const POOL_DISPLAY_ATTRS: (AttributeKey | 'wits')[] = [...ALL_STONE_ATTRS, 'wits'];

type StoneDialogPoolKey = AttributeKey | 'wits' | typeof COLORLESS_STONE_ATTR;

type StoneDialogPoolRow = {
  key: StoneDialogPoolKey;
  name: string;
  current: number;
  max: number;
  sustained: number;
  artifactBound: number;
  available: number;
  gemStyle: { fill: string; stroke: string };
  gemSlots: Array<{ index: number }>;
  boundSlots: Array<{ index: number }>;
};

function poolDisplayName(key: string): string {
  if (key === 'wits') return 'Wits';
  return key.charAt(0).toUpperCase() + key.slice(1);
}

function getActorStonePoolKeysWithMax(actor: Actor): Set<string> {
  const owner = getActionEconomyActor(actor) ?? actor;
  const sp = ((owner as any).system?.stonePools || {}) as Record<string, { max?: number }>;
  const keys = new Set<string>();
  for (const k of POOL_DISPLAY_ATTRS) {
    const max = Number(sp[k]?.max) || 0;
    if (max > 0) keys.add(k);
  }
  keys.add(COLORLESS_STONE_ATTR);
  return keys;
}

/**
 * Find the combatant row for this actor (linked sheet, prototype actor, or token document actorId).
 */
function resolveStonePowersCombatant(actor: Actor, combat: Combat): Combatant | null {
  const owner = getActionEconomyActor(actor) ?? actor;
  const sheetId = (actor as any).id as string;
  const worldId = (owner as any).id as string;
  const ids = new Set<string>([sheetId, worldId].filter(Boolean));

  for (const c of combat.combatants) {
    const ca = (c as any).actor;
    if (ca && ids.has(ca.id)) return c as Combatant;
  }
  for (const c of combat.combatants) {
    const td = (c as any).token;
    const aid = td?.actorId as string | undefined;
    if (aid && ids.has(aid)) return c as Combatant;
  }
  return null;
}

type DropSlotState = 'done' | 'filled' | 'active' | 'locked' | 'support' | 'disabled';

/**
 * Wert für Attribut-Selektoren `[data-power-id="…"]` in querySelector.
 * Nicht `CSS.escape` verwenden: Macht-IDs enthalten Punkte (`generic.extraAttack`); als Ident escaped
 * matcht der Selektor nicht das literal gesetzte HTML-Attribut → keine Zelle, kein grünes Feld / kein Gem.
 */
function escapeAttrValueInCssSelector(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

type StonePayLaneCell = {
  laneIndex: number;
  slotIndex: number;
  state: DropSlotState;
};

/**
 * Lanes pre-filled by Artifact Support Stones for a Stone Power Support of
 * `prefillTier` (2..8). T5+ support still only needs the player to pay
 * the anchor; extra 16/32 lanes are future UI.
 *
 * The support covers the tier's wave cost (2^(tier-1) stones) and sits
 * directly above the anchor: tier 2 → lanes [1,2], tier 3 → [1..4],
 * tier 4 → [1..8]. The player still primes the power by dropping a single
 * own stone into the anchor (lane 0); the support lanes are decorative and
 * are not part of the player `occupied` set. Returns `undefined` when there
 * is no support or it is no longer available this turn.
 */
function buildSupportLaneSet(prefillTier: number, usesThisTurn: number): Set<number> | undefined {
  if (!(prefillTier >= 2)) return undefined;
  // The support only applies to the very first activation of the power this turn.
  if (usesThisTurn !== 0) return undefined;
  const count = Math.min(STONE_PAYMENT_LANE_COUNT - 1, Math.pow(2, prefillTier - 1));
  const set = new Set<number>();
  for (let i = 1; i <= count; i++) set.add(i);
  return set;
}

/**
 * UI/Drop: Segment-Freigabe — erst Anchor (1), nach Stein die beiden Mitten (2), dann Quad (4), dann Oct (8).
 * Innerhalb eines freigeschalteten Segments beliebige leere Lane; Reihenfolge innerhalb Mid/Quad/Oct frei.
 */
function buildStonePaymentLanes(
  usesThisTurn: number,
  spendableNet: number,
  planLocked: boolean,
  occupied: number[],
  debugLabel?: string,
  supportLanes?: Set<number>,
  leadLockedLanes?: number[]
): {
  paymentAnchor: StonePayLaneCell[];
  paymentMid: StonePayLaneCell[];
  paymentQuad: StonePayLaneCell[];
  paymentOct: StonePayLaneCell[];
} {
  const o = new Set(occupied);
  const leadLocked = new Set(leadLockedLanes ?? []);
  // Ramp powers (no Tier 1) treat their leading segment as already satisfied so
  // the next segment unlocks immediately; those lanes are disabled, not payable.
  const allowed = allowedSegmentDropLanes(
    leadLocked.size ? [...occupied, ...leadLocked] : occupied
  );

  const laneState = (laneIndex: number): DropSlotState => {
    if (laneIndex < 0 || laneIndex >= STONE_PAYMENT_LANE_COUNT) return 'locked';
    if (o.has(laneIndex)) return 'filled';
    // Disabled lead lane of a ramp power (e.g. Extra Attack Tier 1): greyed,
    // not droppable — the player must start in the next (Tier 2) segment.
    if (leadLocked.has(laneIndex)) return 'disabled';
    // Artifact "Stone Power Support" pre-fills lanes above the anchor with
    // Artifact Support Stones (free, artifact-provided). They are purely
    // visual: not in the `occupied` player set, so they never participate in
    // segment-unlock or settle.
    if (supportLanes?.has(laneIndex)) return 'support';
    if (planLocked) return 'locked';
    if (spendableNet < 1) return 'locked';
    if (allowed.has(laneIndex)) return 'active';
    return 'locked';
  };

  const cell = (laneIndex: number): StonePayLaneCell => ({
    laneIndex,
    slotIndex: usesThisTurn + laneIndex,
    state: laneState(laneIndex)
  });

  const segments = {
    paymentAnchor: [cell(0)],
    paymentMid: [cell(1), cell(2)],
    paymentQuad: [cell(3), cell(4), cell(5), cell(6)],
    paymentOct: Array.from({ length: 8 }, (_, j) => cell(7 + j))
  };
  return segments;
}

/** DOM root for listeners (ApplicationV2 legt Inhalt unter part=content / .window-content). */
function getStonePowersContentRoot(app: any): HTMLElement | null {
  const el = app?.element as HTMLElement | undefined;
  if (!el) return null;
  return (
    (el.querySelector('[data-application-part="content"]') as HTMLElement) ||
    (el.querySelector('.window-content') as HTMLElement) ||
    el
  );
}

/**
 * Slot unter dem Mauszeiger — `ev.target` beim drop/dragover sitzt oft auf Kindern oder einer
 * benachbarten Zelle; sonst akzeptiert der Browser den Drop auf `slot-locked` obwohl visuell „aktiv“ wirkte.
 */
function resolveMsStoneDropSlotUnderPointer(ev: DragEvent, bindTarget: HTMLElement): HTMLElement | null {
  const doc = (ev.view?.document ?? (typeof document !== 'undefined' ? document : null)) as Document | null;
  if (!doc?.elementsFromPoint) return null;
  try {
    const stack = doc.elementsFromPoint(ev.clientX, ev.clientY);
    for (const el of stack) {
      if (!(el instanceof HTMLElement)) continue;
      if (!bindTarget.contains(el)) continue;
      const slot = el.closest('.ms-stone-drop-slot');
      if (slot instanceof HTMLElement && bindTarget.contains(slot)) return slot;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function applyStoneSlotDragOverVisual(slot: HTMLElement): void {
  slot.classList.add('is-drag-over');
  slot.style.setProperty('outline', '2px solid rgba(255, 255, 255, 0.98)', 'important');
  slot.style.setProperty('outline-offset', '2px', 'important');
  slot.style.setProperty(
    'box-shadow',
    '0 0 0 3px rgba(255, 200, 60, 0.95), 0 0 14px rgba(255, 235, 120, 0.55)',
    'important'
  );
}

function clearStoneSlotDragOverVisual(slot: HTMLElement): void {
  slot.classList.remove('is-drag-over');
  slot.style.removeProperty('outline');
  slot.style.removeProperty('outline-offset');
  slot.style.removeProperty('box-shadow');
}

export class StonePowersDialog extends BaseDialog {
  /**
   * Teilzahlungs-Lanes überleben Foundry-V2-`render`/`_prepareContext`, falls die App-Instanz
   * intern neu verdrahtet wird (Akku-Map sonst leer → nie slot-filled / kein Grün).
   * Schlüssel: `${ownerActorId}\\0${powerId}:${attr}:${uses}` oder unified `...:msGenMulti:${uses}`
   */
  private static _sessionStoneLanes = new Map<string, StoneAccumulatorValue>();

  private actor: Actor;
  private combatant: Combatant | null;
  private resolve?: (success: boolean) => void;
  private _generalAttrSelection: Record<string, string> = {}; // Track selected attribute per generic power
  /** Belegte Lanes: Attribut-Macht `number[]`; General `GenericLaneOcc[]` unter `genericUnifiedAccKey`. */
  private _stoneDropAccumulators = new Map<string, StoneAccumulatorValue>();
  /** Lane des Steins bei Rückzug Pool←Feld (dragstart). */
  private _stoneReturnLane: number | null = null;
  /** Entfernt Root‑Listener von #bindStoneDragAndDrop (bei jedem Render neu binden). */
  private _stoneDndCleanup?: () => void;
  /** Attribut des aktuellen Zugs — Foundry/Electron liefert oft kein dataTransfer.getData beim drop. */
  private _stoneDragAttribute: string | null = null;
  /** Akku-Schlüssel beim Ziehen eines Steins aus dem Feld zurück in den Pool. */
  private _stoneReturnAccKey: string | null = null;
  /** Pool-Zeile für Rückgabe (bei General-Multi aus data-return-attribute-key). */
  private _stoneReturnPoolAttr: string | null = null;
  /** Scroll im Dialog-Inhalt vor Re-Render merken (Stein setzen sonst springt nach oben). */
  private _stonePowersContentScrollTop = 0;

  static DEFAULT_OPTIONS = {
    id: "mastery-stone-powers",
    classes: ["mastery-system", "stone-powers-dialog"],
    position: { width: 980, height: 680 },
    window: { title: 'Stone Powers', resizable: true }
  };
  
  static PARTS = {
    content: { template: "systems/mastery-system/templates/dialogs/stone-powers.hbs" }
  };
  
  /**
   * Show stone powers dialog for an actor
   */
  static async showForActor(actor: Actor, combatant?: Combatant | null): Promise<boolean> {
    if (combatant && (combatant.initiative === null || combatant.initiative === undefined)) {
      try {
        const { rollInitiativeForCombatant } = await import('../combat/initiative-roll.js');
        await rollInitiativeForCombatant(combatant, { promptCombatReflexes: true });
      } catch (err) {
        console.warn('Mastery System | Could not roll initiative before Stone Powers', err);
      }
    }
    return new Promise(resolve => {
      const app = new StonePowersDialog(actor, combatant || null, resolve);
      (app as any).render({ force: true });
    });
  }
  
  constructor(actor: Actor, combatant: Combatant | null, resolve: (success: boolean) => void) {
    super({});
    this.actor = actor;
    this.combatant = combatant;
    this.resolve = resolve;

    const prefs = ((getActionEconomyActor(actor) ?? actor) as any).system?.stonePowersPrefs;
    if (prefs?.useDefaultsEachRound && prefs.defaultAttributesByPowerId) {
      for (const [powerId, attr] of Object.entries(prefs.defaultAttributesByPowerId)) {
        if (typeof attr === 'string') {
          this._generalAttrSelection[powerId] = attr;
        }
      }
    }
  }

  async _prepareContext(_options: any): Promise<any> {
    const el = (this as any).element as HTMLElement | undefined;
    const scrollRoot = el ? getStonePowersContentRoot(this as any) : null;
    if (scrollRoot && scrollRoot.scrollTop > 0) {
      this._stonePowersContentScrollTop = scrollRoot.scrollTop;
    }

    this.#pullSessionPartialsIntoInstance();

    const combat = game.combat;
    const combatActive = !!combat;
    const combatStarted = !!(combat as any)?.started;
    if (!this.combatant && combat) {
      this.combatant = resolveStonePowersCombatant(this.actor, combat);
    }

    const poolOwner = getActionEconomyActor(this.actor) ?? this.actor;
    const system = (poolOwner as any).system;
    const stonePools = system.stonePools || {};

    // Artifact "Stone Power Support" Stone Functions pre-fill an activation to
    // a higher tier. Resolve them once (off the same actor the economy uses)
    // so power cards can surface the Artifact Support Stones + their source.
    const artifactStoneSupports = getArtifactStoneFunctionStatus(poolOwner).supports;
    const supportForPower = (
      powerId: string,
      attr?: string
    ): { tier: number; source: string } | null => {
      let best: { tier: number; source: string } | null = null;
      const resolvedId = resolveStonePowerId(powerId);
      for (const s of artifactStoneSupports) {
        const supportId = resolveStonePowerId(String(s.stonePowerId || ''));
        if (!supportId || supportId !== resolvedId) continue;
        if (attr && s.attribute !== attr) continue;
        const shift = STONE_POWER_SUPPORT_TIER_SHIFT[resolvedId] ?? 0;
        const tier = Math.min(STONE_TIER_HARD_MAX, Math.max(0, s.value + shift));
        if (!best || tier > best.tier) best = { tier, source: s.source };
      }
      return best;
    };
    const availablePowers = getAvailableStonePowers(this.actor);
    
    // Filter pools to only show those with max > 0 (includes optional Wits)
    const pools: StoneDialogPoolRow[] = POOL_DISPLAY_ATTRS.map((attr) => {
        const pool = stonePools[attr];
        const current = pool?.current ?? pool?.value ?? 0;
        const max = pool?.max ?? pool?.maximum ?? 0;
        const sustained = pool?.sustained ?? 0;
        // Artifact activation flags live on the embedded items of the actor the
        // sheet / evolution dialog edit (`this.actor`). For unlinked tokens the
        // economy actor (`poolOwner`) can be a different document whose item
        // flags are stale, so always read the binding from `this.actor`.
        const artifactBound = countArtifactActivationStones(this.actor, attr);
        const spendable = poolSpendableStones(this.actor, attr);
        const reserved = this.#reservedStonesInDialogForAttr(attr);
        const poolDisplay = Math.max(0, spendable - reserved);
        const gemStyle = getStoneGemStyle(attr) ?? { fill: '#888888', stroke: '#aaaaaa' };
        const gemSlots = Array.from({ length: poolDisplay }, (_, i) => ({ index: i }));
        const boundSlots = Array.from({ length: artifactBound }, (_, i) => ({ index: i }));

        return {
          key: attr,
          name: poolDisplayName(attr),
          current: Number(current) || 0,
          max: Number(max) || 0,
          sustained: Number(sustained) || 0,
          artifactBound,
          available: spendable,
          gemStyle,
          gemSlots,
          boundSlots,
        };
      })
      .filter((pool) => pool.max > 0);

    let colorlessHave = getTempColorlessStones(poolOwner);
    if (colorlessHave <= 0 && poolOwner !== this.actor) {
      colorlessHave = getTempColorlessStones(this.actor);
    }
    const colorlessReserved = this.#reservedStonesInDialogForAttr(COLORLESS_STONE_ATTR);
    const colorlessDisplay = Math.max(0, colorlessHave - colorlessReserved);
    pools.push({
      key: COLORLESS_STONE_ATTR,
      name: 'Colorless',
      current: colorlessHave,
      max: Math.max(colorlessHave, 0),
      sustained: 0,
      artifactBound: 0,
      available: colorlessHave,
      gemStyle: COLORLESS_GEM_STYLE,
      gemSlots: Array.from({ length: colorlessDisplay }, (_, i) => ({ index: i })),
      boundSlots: [],
    });

    const combatMissingFromTracker = combatActive && !this.combatant;
    const hasCombat = combatActive && !!this.combatant;
    const stonePlanLocked = !!(combat && this.combatant && isStonePowersConfigurationLocked(this.actor, combat));

    const showStonePools = true;
    const dragPoolEnabled = !stonePlanLocked;
    const prefsUseDefaults = !!(system.stonePowersPrefs?.useDefaultsEachRound);
    const user = game.user;
    const canSavePrefs =
      !stonePlanLocked && !!user && (user.isGM || (this.actor as any).isOwner);

    // Determine default attribute for generic powers
    // First pool with current > 0, else first pool with max > 0
    const defaultGeneralAttrKey: string = (() => {
      const withCurrent = pools.find(p => p.current > 0);
      if (withCurrent) return String(withCurrent.key);
      if (pools.length > 0) return String(pools[0].key);
      return 'might';
    })();

    const spendableForAttr = (key: string): number =>
      pools.find((p) => p.key === key)?.available ?? 0;

    const totalSpendableNetAllPools = (): number => {
      let sum = 0;
      for (const p of pools) {
        const gross = spendableForAttr(String(p.key));
        const reserved = this.#reservedStonesInDialogForAttr(String(p.key));
        sum += Math.max(0, gross - reserved);
      }
      return sum;
    };

    const canAffordGenericNextCost = (cost: number): boolean =>
      hasCombat && pools.some((p) => (Number(p.current) || 0) >= cost);

    const preparePowerData = (power: any, attrKey: AttributeKey) => {
      /** Wie im Drop-Handler: `getStoneUsageCount(..., combat)` — auch wenn `combat` null (dann Runde 1 / Zug 0). Nicht `combat ? … : 0`, sonst anderer accKey als beim Drop. */
      const usesThisTurn = getStoneUsageCount(this.actor, attrKey, power.id, combat);
      const rampSkip = rampSkipSegmentsForPower(power.id);
      const leadLockedLanes = rampSkipLeadLanes(power.id);
      const nextCost = calculateStoneCost(usesThisTurn + rampSkip);
      const pool = getStonePool(this.actor, attrKey);
      const canAfford = pool.current >= nextCost && hasCombat;
      const gross = spendableForAttr(attrKey);
      const reserved = this.#reservedStonesInDialogForAttr(attrKey);
      const spendableNet =
        Math.max(0, gross - reserved) + this.#spendableNetForAttr(COLORLESS_STONE_ATTR);
      const description = power.description || power.effect || '';
      const accKey = `${power.id}:${attrKey}:${usesThisTurn}`;
      const occupied = this.#stoneOccGet(accKey);
      const support = supportForPower(power.id, attrKey);
      const supportTier = support?.tier ?? 0;
      const supportLanes = buildSupportLaneSet(supportTier, usesThisTurn);
      const laneSegs = buildStonePaymentLanes(
        usesThisTurn,
        spendableNet,
        stonePlanLocked,
        occupied,
        `${power.id}/${attrKey}`,
        supportLanes,
        leadLockedLanes
      );

      return {
        id: power.id,
        name: power.name,
        description,
        attribute: power.attribute,
        nextCost,
        canAfford,
        selectedAttrKey: attrKey,
        usesThisTurn,
        supportTier,
        supportSource: support?.source ?? '',
        supportActive: !!supportLanes,
        boostUsed:
          power.id === 'wits.initiativeBoost' &&
          !!this.combatant &&
          isInitiativeBoostUsedThisCombat(this.combatant),
        ...laneSegs
      };
    };

    const resolveGenericAttrAndStats = (powerId: string) => {
      const usesThisTurn = getGenericStonePowerUsageCount(this.actor, powerId, combat);
      this.#mergeLegacyGenericIntoUnified(powerId, usesThisTurn);
      const unifiedKey = genericUnifiedAccKey(powerId, usesThisTurn);
      const raw = this.#stoneOccGetRaw(unifiedKey) as GenericLaneOcc[];
      const last =
        raw.length && isGenericLaneOccArray(raw) ? raw[raw.length - 1] : undefined;

      let attrKey: string =
        last?.attr ||
        (this._generalAttrSelection[powerId] as string | undefined) ||
        defaultGeneralAttrKey;
      if (!pools.some((p) => p.key === attrKey)) attrKey = defaultGeneralAttrKey;

      const nextCost = calculateStoneCost(usesThisTurn);
      const spendable = spendableForAttr(attrKey);

      this._generalAttrSelection[powerId] = attrKey;
      return { attrKey, usesThisTurn, spendable, nextCost };
    };
    
    // Separate generic and attribute-specific powers
    const genericPowers = availablePowers.filter(p => p.attribute === 'generic');
    const attributeSpecificPowers = availablePowers.filter(p => p.attribute !== 'generic');
    
    const generalPowers = genericPowers.map((power) => {
      const { attrKey, usesThisTurn } = resolveGenericAttrAndStats(power.id);
      // Ramp powers (no Tier 1, e.g. Extra Attack) start one segment higher:
      // first activation = Tier 2 (2 stones), Anchor disabled.
      const rampSkip = rampSkipSegmentsForPower(power.id);
      const leadLockedLanes = rampSkipLeadLanes(power.id);
      const nextCost = calculateStoneCost(usesThisTurn + rampSkip);
      const canAfford = canAffordGenericNextCost(nextCost);
      const description = power.description || power.effect || '';
      const spendableNet = totalSpendableNetAllPools();
      const occupied = this.#stoneOccGet(genericUnifiedAccKey(power.id, usesThisTurn));
      const sp = STONE_POWERS[power.id];
      const support = supportForPower(power.id);
      const supportTier = support?.tier ?? 0;
      const supportLanes = buildSupportLaneSet(supportTier, usesThisTurn);
      const laneSegs = buildStonePaymentLanes(
        usesThisTurn,
        spendableNet,
        stonePlanLocked,
        occupied,
        `${power.id}/general`,
        supportLanes,
        leadLockedLanes
      );
      return {
        id: power.id,
        name: power.name,
        description,
        effectLong: sp?.effect || description,
        attribute: power.attribute,
        nextCost,
        canAfford,
        selectedAttrKey: attrKey,
        usesThisTurn,
        supportTier,
        supportSource: support?.source ?? '',
        supportActive: !!supportLanes,
        ...laneSegs
      };
    });

    const powersByAttribute: Record<string, any[]> = {};
    for (const pool of pools) {
      powersByAttribute[pool.key] = [];
    }
    for (const power of attributeSpecificPowers) {
      const attr = power.attribute as AttributeKey;
      if (powersByAttribute[attr]) {
        powersByAttribute[attr].push(preparePowerData(power, attr));
      }
    }

    const ATTR_MATRIX_COLS = 4;
    const attributePowerMatrix = pools
      .map((pool) => {
        const attr = pool.key as AttributeKey;
        const defs: StonePower[] | undefined = STONE_POWERS_BY_ATTRIBUTE[attr];
        if (!defs?.length) return null;

        const preparedMap = new Map((powersByAttribute[attr] || []).map((p: any) => [p.id, p]));
        const cells: any[] = [];
        // Render every pool power, padding shorter pools to the base column count.
        const cols = Math.max(ATTR_MATRIX_COLS, defs.length);
        for (let i = 0; i < cols; i++) {
          const def = defs[i];
          if (!def) {
            cells.push(null);
            continue;
          }
          let p: any = preparedMap.get(def.id);
          if (!p) {
            p = preparePowerData(def, attr);
          }
          cells.push({
            ...p,
            effectLong: def.effect || p.description || ''
          });
        }

        return {
          attrKey: attr,
          cells
        };
      })
      .filter((row): row is { attrKey: AttributeKey; cells: any[] } => {
        if (!row) return false;
        const spendable = spendableForAttr(row.attrKey);
        const reserved = this.#reservedStonesInDialogForAttr(row.attrKey);
        return spendable > 0 || reserved > 0;
      });

    const spendableNetAllPoolsCached = totalSpendableNetAllPools();

    const mr = getMasteryRank(poolOwner);
    const initiativeScore = Math.max(0, Math.floor(Number(this.combatant?.initiative) || 0));
    const stoneIniCost = colorlessStoneInitiativeCost(mr);
    const maxConvert = maxConvertibleColorlessStones(initiativeScore, mr);
    const exchangeLocked = stonePlanLocked || !this.combatant;
    const initiativeExchange = {
      show: !!this.combatant,
      initiative: initiativeScore,
      masteryRank: mr,
      costPerStone: stoneIniCost,
      maxConvert,
      convertCount: maxConvert,
      locked: exchangeLocked,
      boostUsed: this.combatant ? isInitiativeBoostUsedThisCombat(this.combatant) : false,
    };

    return {
      actor: this.actor,
      pools,
      initiativeExchange,
      attributePowerMatrix,
      generalPowers,
      defaultGeneralAttrKey,
      combatActive,
      combatStarted,
      combatMissingFromTracker,
      hasCombat,
      stonePlanLocked,
      /** Ziehen erlaubt sobald Runde nicht gesperrt (auch ohne Kampf — Ausführung nur im Kampf). */
      dragStonesEnabled: !stonePlanLocked,
      dragPoolEnabled,
      showStonePools,
      prefsUseDefaults,
      canSavePrefs,
      combatLabel: combat ? `Runde ${combat.round}` : ''
    };
  }
  
  async _onRender(_context: any, _options: any): Promise<void> {
    super._onRender?.(_context, _options);

    this.#pullSessionPartialsIntoInstance();

    const st = this._stonePowersContentScrollTop;
    if (st > 0) {
      requestAnimationFrame(() => {
        const scrollRoot = getStonePowersContentRoot(this as any);
        if (scrollRoot) scrollRoot.scrollTop = st;
      });
    }

    const root = getStonePowersContentRoot(this);
    if (!root) {
      console.warn('Mastery System | StonePowersDialog: kein Content-Root für Event-Handler');
      return;
    }

    const appWindow = ((this as any).element as HTMLElement | undefined) ?? root;
    this.#bindStoneDragAndDrop(root, appWindow);
    this.#reconcileFilledLaneClasses(appWindow);
    this.#syncAccumulatorGems(appWindow);
    const savePrefsBtn = root.querySelector('.js-save-stone-prefs') as HTMLElement | null;
    if (savePrefsBtn) {
      savePrefsBtn.onclick = async (ev: MouseEvent) => {
        ev.preventDefault();
        if (savePrefsBtn.classList.contains('is-disabled')) return;
        await this.#saveStonePowersPrefs(root);
      };
    }

    const convertBtn = root.querySelector('.js-convert-initiative-colorless') as HTMLButtonElement | null;
    if (convertBtn) {
      convertBtn.onclick = async (ev: MouseEvent) => {
        ev.preventDefault();
        if (convertBtn.disabled) return;
        const input = root.querySelector('.js-colorless-convert-count') as HTMLInputElement | null;
        const n = Math.max(0, Math.floor(Number(input?.value) || 0));
        if (!this.combatant || n <= 0) return;
        const result = await convertInitiativeToColorlessStones(this.actor, this.combatant, n);
        if (!result) {
          ui.notifications?.warn('Not enough Initiative to convert.');
          return;
        }
        ui.notifications?.info(
          `${(this.actor as any).name}: ${result.stones} Colorless Stone(s). Initiative now ${result.remainingInitiative}.`,
        );
        await (this as any).render({ force: true });
      };
    }

    // Close button
    const closeBtn = root.querySelector('.js-close');
    if (closeBtn) {
      (closeBtn as HTMLElement).onclick = async (ev: MouseEvent) => {
        ev.preventDefault();
        if (this.resolve) {
          this.resolve(true);
          this.resolve = undefined;
        }
        await (this as any).close({ closeSource: 'button', committed: true });
      };
    }
  }

  /** payAttr / Marker aus Schlüssel `powerId:middle:uses` (vollständiger powerId über parseStonePowerAccKey). */
  #parseAccKeyPayAttr(accKey: string): string | null {
    return accKeyPayAttrSegment(accKey);
  }

  /** Stellt den Akku aus dem sessionweiten Backup wieder her (wichtig nach jedem render). */
  #pullSessionPartialsIntoInstance(): void {
    const aid = this.#stoneLaneOwnerActorId();
    if (!aid) return;
    const prefix = `${aid}\0`;
    for (const [composite, lanes] of StonePowersDialog._sessionStoneLanes) {
      if (!composite.startsWith(prefix) || !lanes?.length) continue;
      const accKey = composite.slice(prefix.length);
      if (isGenericUnifiedAccKey(accKey) && isGenericLaneOccArray(lanes as StoneAccumulatorValue)) {
        this._stoneDropAccumulators.set(
          accKey,
          [...(lanes as GenericLaneOcc[])].sort((a, b) => a.lane - b.lane)
        );
      } else if (!isGenericUnifiedAccKey(accKey)) {
        const nums = lanes as number[];
        this._stoneDropAccumulators.set(accKey, [...nums].sort((a, b) => a - b));
      }
    }
  }

  /** Legacy `powerId:echtesAttr:uses` in einen Eintrag `genericUnifiedAccKey` zusammenführen. */
  #mergeLegacyGenericIntoUnified(powerId: string, uses: number): void {
    this.#pullSessionPartialsIntoInstance();
    const unifiedKey = genericUnifiedAccKey(powerId, uses);
    const collected: GenericLaneOcc[] = [];
    const rawU = this._stoneDropAccumulators.get(unifiedKey);
    if (rawU?.length && isGenericLaneOccArray(rawU)) {
      collected.push(...(rawU as GenericLaneOcc[]));
    }
    const toDelete: string[] = [];
    for (const [k, v] of [...this._stoneDropAccumulators.entries()]) {
      if (!k.startsWith(`${powerId}:`)) continue;
      if (accKeyUsesSegment(k) !== uses) continue;
      const mid = accKeyPayAttrSegment(k);
      if (!mid || mid === STONE_GENERIC_UNIFIED_MARKER) continue;
      if (!v?.length || isGenericLaneOccArray(v as StoneAccumulatorValue)) continue;
      for (const lane of v as number[]) {
        if (!collected.some((c) => c.lane === lane)) {
          collected.push({ lane, attr: mid as AttributeKey });
        }
      }
      toDelete.push(k);
    }
    for (const k of toDelete) {
      this.#stoneOccDelete(k);
    }
    collected.sort((a, b) => a.lane - b.lane);
    if (collected.length) {
      this.#stoneOccSet(unifiedKey, collected);
    }
  }

  #stoneOccDelete(accKey: string): void {
    this._stoneDropAccumulators.delete(accKey);
    StonePowersDialog._sessionStoneLanes.delete(this.#sessionLaneCompositeKey(accKey));
  }

  /** Rohwert aus Map/Session (Typ je nach Schlüssel). */
  #stoneOccGetRaw(accKey: string): StoneAccumulatorValue {
    let v = this._stoneDropAccumulators.get(accKey);
    if (!v?.length) {
      const sk = this.#sessionLaneCompositeKey(accKey);
      const fromS = StonePowersDialog._sessionStoneLanes.get(sk);
      if (fromS?.length) {
        if (isGenericUnifiedAccKey(accKey) && isGenericLaneOccArray(fromS)) {
          v = [...(fromS as GenericLaneOcc[])].sort((a, b) => a.lane - b.lane);
        } else if (!isGenericUnifiedAccKey(accKey) && !isGenericLaneOccArray(fromS as StoneAccumulatorValue)) {
          v = [...(fromS as number[])].sort((a, b) => a - b);
        } else {
          v = fromS as StoneAccumulatorValue;
        }
        this._stoneDropAccumulators.set(accKey, v);
      }
    }
    return v ?? [];
  }

  /** Nur Lane-Indizes (Segment-Logik / Template). */
  #stoneOccGet(accKey: string): number[] {
    if (isGenericUnifiedAccKey(accKey)) {
      const raw = this.#stoneOccGetRaw(accKey) as GenericLaneOcc[];
      if (!raw.length) return [];
      if (!isGenericLaneOccArray(raw)) return [];
      return raw.map((x) => x.lane).sort((a, b) => a - b);
    }
    const raw = this.#stoneOccGetRaw(accKey);
    if (isGenericLaneOccArray(raw)) {
      return raw.map((x) => x.lane).sort((a, b) => a - b);
    }
    return [...(raw as number[])].sort((a, b) => a - b);
  }

  #stoneOccSet(accKey: string, value: StoneAccumulatorValue): void {
    const sk = this.#sessionLaneCompositeKey(accKey);
    if (!value.length) {
      this._stoneDropAccumulators.delete(accKey);
      StonePowersDialog._sessionStoneLanes.delete(sk);
    } else if (isGenericUnifiedAccKey(accKey) || isGenericLaneOccArray(value)) {
      const sorted = [...(value as GenericLaneOcc[])].sort((a, b) => a.lane - b.lane);
      this._stoneDropAccumulators.set(accKey, sorted);
      StonePowersDialog._sessionStoneLanes.set(sk, sorted);
    } else {
      const sorted = [...(value as number[])].sort((a, b) => a - b);
      this._stoneDropAccumulators.set(accKey, sorted);
      StonePowersDialog._sessionStoneLanes.set(sk, sorted);
    }
  }

  /**
   * Vollständige Zahlungswelle → Pools abziehen, Macht anwenden, Akku leeren. Keine UI-Strukturänderung.
   */
  async #trySettleStonePayment(accKey: string): Promise<boolean> {
    this.#pullSessionPartialsIntoInstance();
    const parsed = parseStonePowerAccKey(accKey);
    if (!parsed) return false;
    const { powerId, middle, uses: usesInKey } = parsed;
    const def = STONE_POWERS[powerId];
    if (!def) return false;

    const combat = game.combat;
    if (!combat) return false;

    const currentUses = isGenericUnifiedAccKey(accKey)
      ? getGenericStonePowerUsageCount(this.actor, powerId, combat)
      : getStoneUsageCount(this.actor, middle as AttributeKey, powerId, combat);

    if (currentUses !== usesInKey) return false;

    // Ramp powers (no Tier 1) start one segment higher, so the first wave
    // costs the Tier-2 amount; mirror the dialog's nextCost here.
    const nextCost = calculateStoneCost(usesInKey + rampSkipSegmentsForPower(powerId));
    const perAttr: Record<string, number> = {};

    if (isGenericUnifiedAccKey(accKey)) {
      const raw = this.#stoneOccGetRaw(accKey) as GenericLaneOcc[];
      if (!raw.length || !isGenericLaneOccArray(raw)) return false;
      if (raw.length !== nextCost) return false;
      for (const { attr } of raw) {
        perAttr[attr] = (perAttr[attr] || 0) + 1;
      }
    } else {
      if (def.attribute !== 'generic' && middle !== def.attribute) return false;
      const raw = this.#stoneOccGetRaw(accKey);
      if (!raw.length) return false;
      if (isGenericLaneOccArray(raw)) {
        if (raw.length !== nextCost) return false;
        for (const { attr } of raw) {
          perAttr[attr] = (perAttr[attr] || 0) + 1;
        }
      } else {
        if (raw.length !== nextCost) return false;
        perAttr[String(middle)] = raw.length;
      }
    }

    const combatant = this.combatant || resolveStonePowersCombatant(this.actor, combat);
    if (!combatant) return false;

    let ok: boolean;
    if (isGenericUnifiedAccKey(accKey)) {
      ok = await activateGenericStonePowerMixed({
        actor: this.actor,
        combatant,
        abilityId: powerId,
        perAttributeStones: perAttr
      });
    } else {
      ok = await activateStonePower({
        actor: this.actor,
        combatant,
        abilityId: powerId,
        colorlessSpent: perAttr[COLORLESS_STONE_ATTR] || 0,
      });
    }

    if (ok) this.#stoneOccSet(accKey, []);
    return ok;
  }

  async #flushCompletedStonePaymentsFromAccumulators(): Promise<boolean> {
    this.#pullSessionPartialsIntoInstance();
    const keys = [...this._stoneDropAccumulators.keys()];
    let anyOk = false;
    for (const accKey of keys) {
      if (await this.#trySettleStonePayment(accKey)) anyOk = true;
    }
    if (anyOk) {
      const owner = getActionEconomyActor(this.actor) ?? this.actor;
      void refreshRadialMenuActionLabelsIfOpenForActor(owner as Actor);
    }
    return anyOk;
  }

  /** Gleicher Owner wie Stein-Nutzung (unverlinkter Token → Prototyp-Actor). */
  #stoneLaneOwnerActorId(): string {
    const owner = getActionEconomyActor(this.actor) ?? this.actor;
    return String((owner as any)?.id ?? '');
  }

  #sessionLaneCompositeKey(accKey: string): string {
    return `${this.#stoneLaneOwnerActorId()}\0${accKey}`;
  }

  #clearSessionStoneLanesForOwner(): void {
    const aid = this.#stoneLaneOwnerActorId();
    if (!aid) return;
    const prefix = `${aid}\0`;
    for (const k of [...StonePowersDialog._sessionStoneLanes.keys()]) {
      if (k.startsWith(prefix)) StonePowersDialog._sessionStoneLanes.delete(k);
    }
    this._stoneDropAccumulators.clear();
  }

  #reservedStonesNonFamiliar(attr: string): number {
    this.#pullSessionPartialsIntoInstance();
    let sum = 0;
    for (const [accKey, val] of this._stoneDropAccumulators) {
      if (!val?.length) continue;
      if (isGenericUnifiedAccKey(accKey) || isGenericLaneOccArray(val)) {
        if (!isGenericLaneOccArray(val)) continue;
        for (const a of val as GenericLaneOcc[]) {
          if (a.attr === attr) sum += 1;
        }
      } else if (this.#parseAccKeyPayAttr(accKey) === attr) {
        sum += (val as number[]).length;
      }
    }
    return sum;
  }

  #reservedStonesInDialogForAttr(attr: string): number {
    return this.#reservedStonesNonFamiliar(attr);
  }

  #actorPoolSpendable(attr: string): number {
    if (attr === COLORLESS_STONE_ATTR) {
      const owner = getActionEconomyActor(this.actor) ?? this.actor;
      const fromOwner = getTempColorlessStones(owner);
      if (fromOwner > 0) return fromOwner;
      return getTempColorlessStones(this.actor);
    }
    // Read from `this.actor` so artifact activation bindings match the sheet /
    // evolution dialog (pool capacity is still derived via the economy actor
    // inside poolSpendableStones).
    return poolSpendableStones(this.actor, attr);
  }

  /** Brutto-Pool minus bereits im Dialog reservierte Steine dieser Farbe. */
  #spendableNetForAttr(attr: string): number {
    return Math.max(0, this.#actorPoolSpendable(attr) - this.#reservedStonesInDialogForAttr(attr));
  }

  /** General Power: erstes Attribut mit mindestens einem freien Stein (Kern-Attribute; Wits nur für Rituale). */
  #firstGenericAttrWithSpendable(poolKeys: Set<string>): string | null {
    for (const attr of ALL_STONE_ATTRS) {
      if (!poolKeys.has(attr)) continue;
      if (this.#spendableNetForAttr(attr) > 0) return attr;
    }
    return null;
  }

  /**
   * Klick-Befüllung: **ein** Segment pro Klick (1 → 2 → 4 → 8 Lanes), begrenzt durch Pool.
   * Attribut-Macht: nur `fixedPayAttr`. General: jeweils erstes Attribut mit Netto > 0.
   */
  async #autoFillPowerCluster(
    powerId: string,
    isGeneric: boolean,
    fixedPayAttr: AttributeKey | null,
    poolKeys: Set<string>
  ): Promise<void> {
    const combat = game.combat;
    if (!isGeneric && !fixedPayAttr) return;

    const uses = isGeneric
      ? getGenericStonePowerUsageCount(this.actor, powerId, combat)
      : getStoneUsageCount(this.actor, fixedPayAttr!, powerId, combat);

    if (isGeneric) {
      this.#mergeLegacyGenericIntoUnified(powerId, uses);
    }

    this.#pullSessionPartialsIntoInstance();

    const accKey = isGeneric
      ? genericUnifiedAccKey(powerId, uses)
      : `${powerId}:${fixedPayAttr!}:${uses}`;
    let occ = this.#stoneOccGet(accKey);
    const seg = nextStoneSegmentToFill(occWithRampSkip(occ, powerId));
    if (seg === null) {
      return;
    }

    const occSet = new Set(occ);
    const emptyInSeg = lanesInStonePaymentSegment(seg).filter((l) => !occSet.has(l));
    emptyInSeg.sort((a, b) => a - b);

    for (const lane of emptyInSeg) {
      this.#pullSessionPartialsIntoInstance();
      occ = this.#stoneOccGet(accKey);
      if (!isLaneAllowedBySegmentUnlock(occWithRampSkip(occ, powerId), lane)) break;

      let chosenAttr: string;
      if (isGeneric) {
        const pick = this.#firstGenericAttrWithSpendable(poolKeys);
        if (!pick) break;
        chosenAttr = pick;
      } else {
        if (this.#spendableNetForAttr(fixedPayAttr!) < 1) break;
        chosenAttr = fixedPayAttr!;
      }

      if (isGeneric) {
        const prev = this.#stoneOccGetRaw(accKey) as GenericLaneOcc[];
        const base: GenericLaneOcc[] =
          prev.length && isGenericLaneOccArray(prev) ? [...prev] : [];
        base.push({ lane, attr: chosenAttr });
        base.sort((a, b) => a.lane - b.lane);
        this.#stoneOccSet(accKey, base);
        this._generalAttrSelection[powerId] = chosenAttr;
      } else {
        this.#stoneOccSet(accKey, [...occ, lane].sort((a, b) => a - b));
      }
    }
  }

  /** Alle Akku-Einträge dieser Macht für die aktuelle uses-Stufe leeren (inkl. Session-Backup). */
  #clearPowerStonePlan(
    powerId: string,
    isGeneric: boolean,
    fixedPayAttr: AttributeKey | null
  ): void {
    this.#pullSessionPartialsIntoInstance();
    const combat = game.combat;
    if (!isGeneric && !fixedPayAttr) return;
    const uses = isGeneric
      ? getGenericStonePowerUsageCount(this.actor, powerId, combat)
      : getStoneUsageCount(this.actor, fixedPayAttr!, powerId, combat);

    const shouldDeleteAccKey = (accKey: string): boolean => {
      if (!accKey.startsWith(`${powerId}:`)) return false;
      if (accKeyUsesSegment(accKey) !== uses) return false;
      if (isGeneric) return true;
      return accKeyPayAttrSegment(accKey) === fixedPayAttr;
    };

    for (const k of [...this._stoneDropAccumulators.keys()]) {
      if (shouldDeleteAccKey(k)) this.#stoneOccDelete(k);
    }

    const aid = this.#stoneLaneOwnerActorId();
    const prefix = `${aid}\0`;
    for (const composite of [...StonePowersDialog._sessionStoneLanes.keys()]) {
      if (!composite.startsWith(prefix)) continue;
      const accKey = composite.slice(prefix.length);
      if (shouldDeleteAccKey(accKey)) {
        StonePowersDialog._sessionStoneLanes.delete(composite);
        this._stoneDropAccumulators.delete(accKey);
      }
    }
  }

  /** Entfernt Pool-Chips, die bereits in Ablagefeldern (Akku) stecken — inkl. Teilbelegung. */
  #syncPoolGemChips(root: HTMLElement): void {
    root.querySelectorAll('.pool-gems[data-attribute-key]').forEach((node) => {
      const poolGems = node as HTMLElement;
      const attr = poolGems.dataset.attributeKey || '';
      if (!attr) return;
      const spendable = this.#actorPoolSpendable(attr);
      const reserved = this.#reservedStonesInDialogForAttr(attr);
      const want = Math.max(0, spendable - reserved);
      const chips = Array.from(poolGems.querySelectorAll<HTMLElement>('.js-stone-draggable')).filter(
        (c) => !c.classList.contains('is-dragging')
      );
      while (chips.length > want) {
        const el = chips.pop();
        el?.remove();
      }
      if (chips.length < want) {
        void (this as any).render({ force: true });
      }
    });
  }

  /** Zeigt Steine in `slot-filled`-Zellen (ein Stein pro Feld, zurück zum Pool ziehbar). */
  #syncAccumulatorGems(root: HTMLElement): void {
    const combat = game.combat;
    const locked = !!(combat && this.combatant && isStonePowersConfigurationLocked(this.actor, combat));
    const allowReturnDrag = !locked;

    root.querySelectorAll('.ms-stone-slot-fill .ms-slot-gem-partial').forEach((n) => n.remove());
    this.#pullSessionPartialsIntoInstance();
    for (const [accKey, lanesVal] of this._stoneDropAccumulators) {
      if (!lanesVal?.length) continue;
      const powerId = stonePowerAccKeyPowerId(accKey);
      if (!powerId) continue;
      const esc = escapeAttrValueInCssSelector(powerId);
      const host = root.querySelector(
        `.power-drop-slots[data-power-id="${esc}"]`
      ) as HTMLElement | null;
      if (!host) {
        continue;
      }

      const placeGem = (lane: number, payAttr: string) => {
        const style = payAttr === COLORLESS_STONE_ATTR ? COLORLESS_GEM_STYLE : getStoneGemStyle(payAttr);
        const fillC = style?.fill ?? '#888888';
        const strokeC = style?.stroke ?? '#aaaaaa';
        let slot = host.querySelector(
          `.ms-stone-drop-slot.slot-filled[data-lane-index="${lane}"]`
        ) as HTMLElement | null;
        if (!slot) {
          slot = host.querySelector(
            `.ms-stone-drop-slot.slot-active[data-lane-index="${lane}"]`
          ) as HTMLElement | null;
        }
        if (!slot) {
          return;
        }
        const fill = slot.querySelector('.ms-stone-slot-fill') as HTMLElement | null;
        if (!fill) return;

        const gem = document.createElement('span');
        gem.className = 'ms-stone-gem-chip ms-slot-gem-partial js-stone-returnable';
        gem.setAttribute('data-acc-key', accKey);
        gem.setAttribute('data-lane-index', String(lane));
        gem.setAttribute('data-return-attribute-key', payAttr);
        gem.title = allowReturnDrag
          ? 'Zurück in den passenden Pool ziehen'
          : 'Runde gesperrt — Rückgabe nicht möglich';
        gem.draggable = allowReturnDrag;
        gem.classList.toggle('is-drag-disabled', !allowReturnDrag);
        gem.style.background = fillC;
        gem.style.boxShadow = `0 0 0 2px ${strokeC} inset, 0 1px 3px rgba(0,0,0,0.45)`;
        fill.appendChild(gem);
      };

      if (isGenericUnifiedAccKey(accKey) && isGenericLaneOccArray(lanesVal as StoneAccumulatorValue)) {
        for (const { lane, attr } of lanesVal as GenericLaneOcc[]) {
          placeGem(lane, attr);
        }
      } else if (!isGenericUnifiedAccKey(accKey)) {
        if (isGenericLaneOccArray(lanesVal as StoneAccumulatorValue)) {
          for (const { lane, attr } of lanesVal as GenericLaneOcc[]) {
            placeGem(lane, attr);
          }
        } else {
          const payAttrRaw = this.#parseAccKeyPayAttr(accKey);
          if (!payAttrRaw) continue;
          const payAttr = payAttrRaw as AttributeKey;
          for (const lane of [...(lanesVal as number[])].sort((a, b) => a - b)) {
            placeGem(lane, payAttr);
          }
        }
      }
    }
    this.#syncPoolGemChips(root);
  }

  /**
   * Nach Template-Render: belegte Lanes am DOM kennzeichnen (slot-filled), falls Kontext/Theme abweicht.
   * Verwendet dieselben data-Attribute wie das HBS; Werte wie bei #syncAccumulatorGems escapen.
   */
  #reconcileFilledLaneClasses(root: HTMLElement): void {
    this.#pullSessionPartialsIntoInstance();
    for (const [accKey, lanesVal] of this._stoneDropAccumulators) {
      if (!lanesVal?.length) continue;
      const powerId = stonePowerAccKeyPowerId(accKey);
      if (!powerId) continue;
      const attrEsc = escapeAttrValueInCssSelector(powerId);
      const host = root.querySelector(
        `.power-drop-slots[data-power-id="${attrEsc}"]`
      ) as HTMLElement | null;
      if (!host) continue;
      const laneList: number[] =
        isGenericUnifiedAccKey(accKey) && isGenericLaneOccArray(lanesVal as StoneAccumulatorValue)
          ? (lanesVal as GenericLaneOcc[]).map((x) => x.lane)
          : (lanesVal as number[]);
      for (const lane of laneList) {
        const el = host.querySelector(
          `.ms-stone-drop-slot[data-lane-index="${lane}"]`
        ) as HTMLElement | null;
        if (!el) continue;
        el.classList.remove('slot-active', 'slot-locked');
        el.classList.add('slot-filled');
        el.style.setProperty('background', 'rgba(76, 175, 80, 0.28)', 'important');
        el.style.setProperty('border-color', 'rgba(102, 187, 106, 0.95)', 'important');
      }
    }
    this.#reconcilePrimedSupportLanes(root);
  }

  /**
   * Stone Power Support: once the player primes a supported power by placing
   * the anchor stone (lane 0 → slot-filled), flip its gold Artifact Support
   * Stones to a "primed/active" green look so it's clear the higher tier is now
   * in effect. Runs over every power host so it also clears when the anchor is
   * removed (the accumulator for that power may already be empty by then).
   */
  #reconcilePrimedSupportLanes(root: HTMLElement): void {
    root.querySelectorAll('.power-drop-slots').forEach((host) => {
      const anchor = host.querySelector('.ms-stone-drop-slot[data-lane-index="0"]');
      const primed = !!anchor && anchor.classList.contains('slot-filled');
      host
        .querySelectorAll('.ms-stone-drop-slot.slot-support')
        .forEach((s) => s.classList.toggle('is-primed', primed));
    });
  }

  /**
   * @param root Content-Part (Queries für Buttons)
   * @param bindTarget App-Fenster-Element: DnD hier binden (Foundry V2: Slots liegen zuverlässig darunter)
   */
  #bindStoneDragAndDrop(root: HTMLElement, bindTarget: HTMLElement): void {
    this._stoneDndCleanup?.();
    this._stoneDndCleanup = undefined;

    const combat = game.combat;
    const canExecute = !!combat && !!this.combatant;
    const locked = !!(combat && this.combatant && isStonePowersConfigurationLocked(this.actor, combat));
    const allowDrag = !locked;
    const poolKeys = getActorStonePoolKeysWithMax(this.actor);
    let lastDragOverLogKey = '';

    const clearPoolReturnHighlight = () => {
      bindTarget.querySelectorAll('.pool-gems.is-pool-drag-over').forEach((n) => n.classList.remove('is-pool-drag-over'));
    };

    const clearDragOver = () => {
      clearPoolReturnHighlight();
      bindTarget.querySelectorAll('.ms-stone-drop-slot.is-drag-over').forEach((n) => {
        clearStoneSlotDragOverVisual(n as HTMLElement);
      });
    };

    root.querySelectorAll('.js-stone-draggable').forEach((el: Element) => {
      const gem = el as HTMLElement;
      gem.draggable = allowDrag;
      gem.classList.toggle('is-drag-disabled', !allowDrag);

      gem.ondragstart = (ev: DragEvent) => {
        if (!allowDrag || !ev.dataTransfer) {
          return;
        }
        this._stoneReturnAccKey = null;
        const attr =
          gem.dataset.attributeKey ||
          (gem.closest('.pool-gems') as HTMLElement | null)?.dataset?.attributeKey ||
          (gem.closest('.pool-item') as HTMLElement | null)?.dataset?.attribute ||
          '';
        this._stoneDragAttribute = attr;
        msLastDraggedStoneAttribute = attr;
        ev.dataTransfer.setData(STONE_DRAG_MIME, attr);
        ev.dataTransfer.setData('text/plain', attr);
        ev.dataTransfer.effectAllowed = 'copy';
        gem.classList.add('is-dragging');
      };
      gem.ondragend = () => {
        gem.classList.remove('is-dragging');
        clearDragOver();
        lastDragOverLogKey = '';
        this.#syncPoolGemChips(bindTarget);
        queueMicrotask(() => {
          this._stoneDragAttribute = null;
        });
      };
    });

    const resolveDropSlot = (ev: DragEvent, logMiss: boolean): HTMLElement | null => {
      const raw = ev.target;
      const el =
        raw instanceof Element
          ? raw
          : raw && (raw as Node).parentElement instanceof Element
            ? ((raw as Node).parentElement as Element)
            : null;
      if (!el) {
        return null;
      }
      if (!bindTarget.contains(el)) {
        return null;
      }
      const slot = el.closest('.ms-stone-drop-slot') as HTMLElement | null;
      if (!slot || !bindTarget.contains(slot)) {
        return null;
      }
      return slot;
    };

    /** Slot: Pool→Feld; Return-Drag: Feld→Pool (nutzt `_stoneReturnAccKey`, da types in dragover unzuverlässig sind). */
    const onBindDragOver = (ev: DragEvent) => {
      if (!allowDrag || locked) {
        return;
      }

      if (this._stoneReturnAccKey) {
        const poolGems = (ev.target as Element)?.closest?.('.pool-gems') as HTMLElement | null;
        if (poolGems && bindTarget.contains(poolGems)) {
          const payAttr =
            this._stoneReturnPoolAttr ||
            this.#parseAccKeyPayAttr(this._stoneReturnAccKey) ||
            '';
          const poolAttr = poolGems.dataset.attributeKey || '';
          if (payAttr && poolAttr === payAttr) {
            ev.preventDefault();
            if (ev.dataTransfer) ev.dataTransfer.dropEffect = 'move';
            bindTarget.querySelectorAll('.ms-stone-drop-slot.is-drag-over').forEach((n) => {
              clearStoneSlotDragOverVisual(n as HTMLElement);
            });
            clearPoolReturnHighlight();
            poolGems.classList.add('is-pool-drag-over');
            const k = `return-pool:${poolAttr}`;
            if (k !== lastDragOverLogKey) {
              lastDragOverLogKey = k;
            }
            return;
          }
        }
        clearPoolReturnHighlight();
        return;
      }

      const slot =
        resolveMsStoneDropSlotUnderPointer(ev, bindTarget) ?? resolveDropSlot(ev, false);
      if (!slot?.classList.contains('slot-active')) {
        clearDragOver();
        return;
      }
      ev.preventDefault();
      if (ev.dataTransfer) ev.dataTransfer.dropEffect = 'copy';
      clearDragOver();
      applyStoneSlotDragOverVisual(slot);
      const k = `${slot.dataset.powerId ?? ''}:${slot.dataset.slotIndex ?? ''}`;
      if (k !== lastDragOverLogKey) {
        lastDragOverLogKey = k;
      }
    };

    const onBindDragLeave = (ev: DragEvent) => {
      const rel = ev.relatedTarget as Node | null;
      if (rel && bindTarget.contains(rel)) return;
      clearDragOver();
    };

    const onBindDrop = async (ev: DragEvent) => {
      this.#pullSessionPartialsIntoInstance();
      const pathTags = (ev.composedPath?.() || [])
        .slice(0, 12)
        .map((n) => (n instanceof Element ? n.tagName + (n.id ? `#${n.id}` : '') : String(n)));
      const accKeyReturn =
        this._stoneReturnAccKey ||
        ev.dataTransfer?.getData(STONE_RETURN_MIME) ||
        '';
      const poolGemsDrop = (ev.target as Element)?.closest?.('.pool-gems') as HTMLElement | null;
      if (accKeyReturn) {
        ev.preventDefault();
        clearDragOver();
        if (!poolGemsDrop || !bindTarget.contains(poolGemsDrop)) {
          return;
        }
        const payAttr =
          this._stoneReturnPoolAttr ||
          this.#parseAccKeyPayAttr(accKeyReturn) ||
          '';
        const poolAttr = poolGemsDrop.dataset.attributeKey || '';
        if (!payAttr || poolAttr !== payAttr) {
          return;
        }
        const laneRm = this._stoneReturnLane;
        const rawReturn = this.#stoneOccGetRaw(accKeyReturn);
        if (isGenericUnifiedAccKey(accKeyReturn) || isGenericLaneOccArray(rawReturn)) {
          const raw = rawReturn as GenericLaneOcc[];
          if (!raw.length || !isGenericLaneOccArray(raw)) {
            return;
          }
          let nextAssign: GenericLaneOcc[];
          if (laneRm != null) {
            nextAssign = raw.filter((a) => a.lane !== laneRm);
          } else {
            const hi = Math.max(...raw.map((a) => a.lane));
            nextAssign = raw.filter((a) => a.lane !== hi);
          }
          this.#stoneOccSet(accKeyReturn, nextAssign);
        } else {
          const occ = this.#stoneOccGet(accKeyReturn);
          if (!occ.length) {
            return;
          }
          let nextOcc: number[];
          if (laneRm != null && occ.includes(laneRm)) {
            nextOcc = occ.filter((l) => l !== laneRm);
          } else {
            const hi = Math.max(...occ);
            nextOcc = occ.filter((l) => l !== hi);
          }
          this.#stoneOccSet(accKeyReturn, nextOcc);
        }
        this.#syncAccumulatorGems(bindTarget);
        await (this as any).render({ force: true });
        return;
      }

      const slot =
        resolveMsStoneDropSlotUnderPointer(ev, bindTarget) ?? resolveDropSlot(ev, true);
      if (!slot) {
        if (msLastDraggedStoneAttribute) ev.preventDefault();
        return;
      }
      ev.preventDefault();
      clearDragOver();

      if (locked) {
        ui.notifications?.warn('Diese Runde ist für Stonepowers gesperrt.');
        return;
      }
      if (!slot.classList.contains('slot-active')) {
        return;
      }

      const dragged =
        this._stoneDragAttribute ||
        ev.dataTransfer?.getData(STONE_DRAG_MIME) ||
        ev.dataTransfer?.getData('text/plain') ||
        msLastDraggedStoneAttribute ||
        '';
      const powerId =
        slot.dataset.powerId ||
        (slot.closest('.power-drop-slots') as HTMLElement | null)?.dataset.powerId ||
        '';
      const isGeneric =
        slot.dataset.isGeneric === 'true' ||
        slot.getAttribute('data-is-generic') === 'true';
      const isColorless = dragged === COLORLESS_STONE_ATTR;
      let payAttr: AttributeKey | typeof COLORLESS_STONE_ATTR;
      if (isGeneric) {
        payAttr = dragged as AttributeKey | typeof COLORLESS_STONE_ATTR;
        if (!powerId || !dragged) {
          return;
        }
        if (!poolKeys.has(dragged) && !isColorless) {
          ui.notifications?.warn('Dieser Stein gehört zu keinem Pool auf diesem Bogen.');
          return;
        }
        if (!isColorless) this._generalAttrSelection[powerId] = payAttr as AttributeKey;
      } else {
        payAttr = (slot.dataset.payAttribute || '') as AttributeKey;
        if (!powerId || !payAttr) {
          return;
        }
        if (dragged !== payAttr && !isColorless) {
          ui.notifications?.warn('Falscher Stein — Attribut passt nicht zu diesem Feld.');
          return;
        }
        if (isColorless) payAttr = COLORLESS_STONE_ATTR;
      }

      const slotPayAttr = (slot.dataset.payAttribute || payAttr) as AttributeKey;
      const uses = isGeneric
        ? getGenericStonePowerUsageCount(this.actor, powerId, combat)
        : getStoneUsageCount(this.actor, slotPayAttr, powerId, combat);
      const laneRaw = slot.dataset.laneIndex;
      const laneIndex = laneRaw !== undefined && laneRaw !== '' ? Number(laneRaw) : NaN;
      if (!Number.isFinite(laneIndex)) {
        return;
      }

      let accKey: string;
      let occ: number[];
      let paid: number;

      if (isGeneric) {
        this.#mergeLegacyGenericIntoUnified(powerId, uses);
        accKey = genericUnifiedAccKey(powerId, uses);
        occ = this.#stoneOccGet(accKey);
        if (occ.includes(laneIndex)) {
          return;
        }
        if (!isLaneAllowedBySegmentUnlock(occWithRampSkip(occ, powerId), laneIndex)) {
          return;
        }
        const prev = this.#stoneOccGetRaw(accKey) as GenericLaneOcc[];
        const base: GenericLaneOcc[] =
          prev.length && isGenericLaneOccArray(prev) ? [...prev] : [];
        base.push({ lane: laneIndex, attr: payAttr });
        base.sort((a, b) => a.lane - b.lane);
        this.#stoneOccSet(accKey, base);
        paid = base.length;
      } else {
        accKey = `${powerId}:${slotPayAttr}:${uses}`;
        occ = this.#stoneOccGet(accKey);
        if (occ.includes(laneIndex)) {
          return;
        }
        if (!isLaneAllowedBySegmentUnlock(occWithRampSkip(occ, powerId), laneIndex)) {
          return;
        }
        const prev = this.#stoneOccGetRaw(accKey);
        const asOcc: GenericLaneOcc[] = isGenericLaneOccArray(prev)
          ? [...prev]
          : (prev as number[]).map((lane) => ({ lane, attr: slotPayAttr }));
        asOcc.push({ lane: laneIndex, attr: payAttr });
        asOcc.sort((a, b) => a.lane - b.lane);
        this.#stoneOccSet(accKey, asOcc);
        paid = asOcc.length;
      }

      this.#reconcileFilledLaneClasses(bindTarget);
      this.#syncAccumulatorGems(bindTarget);
      await (this as any).render({ force: true });
    };

    const onDelegateReturnDragStart = (ev: DragEvent) => {
      const t = ev.target as HTMLElement;
      if (!t?.classList?.contains('js-stone-returnable')) return;
      if (!allowDrag || !ev.dataTransfer || locked) {
        ev.preventDefault();
        return;
      }
      const accKey = t.getAttribute('data-acc-key') || t.dataset.accKey || '';
      if (!accKey) {
        ev.preventDefault();
        return;
      }
      this._stoneReturnAccKey = accKey;
      this._stoneReturnPoolAttr =
        t.getAttribute('data-return-attribute-key') ||
        t.dataset.returnAttributeKey ||
        this.#parseAccKeyPayAttr(accKey) ||
        null;
      const lr = t.getAttribute('data-lane-index') ?? t.dataset.laneIndex ?? '';
      const ln = lr !== '' ? Number(lr) : NaN;
      this._stoneReturnLane = Number.isFinite(ln) ? ln : null;
      this._stoneDragAttribute = null;
      ev.dataTransfer.setData(STONE_RETURN_MIME, accKey);
      ev.dataTransfer.setData('text/plain', accKey);
      ev.dataTransfer.effectAllowed = 'move';
      t.classList.add('is-dragging');
      lastDragOverLogKey = '';
    };

    const onDelegateReturnDragEnd = (ev: DragEvent) => {
      const t = ev.target as HTMLElement;
      if (!t?.classList?.contains('js-stone-returnable')) return;
      t.classList.remove('is-dragging');
      clearDragOver();
      lastDragOverLogKey = '';
      this.#syncPoolGemChips(bindTarget);
      const acc = this._stoneReturnAccKey;
      queueMicrotask(() => {
        this._stoneReturnAccKey = null;
        this._stoneReturnPoolAttr = null;
        this._stoneReturnLane = null;
      });
    };

    const resolvePowerCardContext = (
      t: HTMLElement
    ): { powerId: string; isGeneric: boolean; fixedPayAttr: AttributeKey | null } | null => {
      const card = t.closest(
        '.power-card.power-card-general:not(.power-card-placeholder)'
      ) as HTMLElement | null;
      if (!card || !bindTarget.contains(card)) return null;
      const slotsHost = card.querySelector('.power-drop-slots[data-power-id]') as HTMLElement | null;
      const powerId = slotsHost?.dataset.powerId || slotsHost?.getAttribute('data-power-id') || '';
      if (!powerId) return null;
      const isGeneric = !!card.querySelector('.ms-stone-drop-slot[data-is-generic="true"]');
      let fixedPayAttr: AttributeKey | null = null;
      if (!isGeneric) {
        fixedPayAttr =
          (card
            .querySelector('.ms-stone-drop-slot[data-pay-attribute]')
            ?.getAttribute('data-pay-attribute') as AttributeKey) || null;
        if (!fixedPayAttr) return null;
      }
      return { powerId, isGeneric, fixedPayAttr };
    };

    /** Linksklick auf ganze Power-Karte (inkl. Titel): Slots aus Pools füllen. */
    const onPowerCardClick = async (ev: MouseEvent) => {
      if (ev.button !== 0) return;
      if (!allowDrag || locked) return;
      const t = ev.target as HTMLElement;
      if (t.closest('.js-stone-draggable') || t.closest('.js-stone-returnable')) return;
      if (t.closest('button, a, input, select, textarea, label')) return;
      const resolved = resolvePowerCardContext(t);
      if (!resolved) return;

      ev.preventDefault();
      ev.stopPropagation();
      const { powerId, isGeneric, fixedPayAttr } = resolved;
      await this.#autoFillPowerCluster(powerId, isGeneric, fixedPayAttr, poolKeys);
      await (this as any).render({ force: true });
    };

    /** Rechtsklick: Kampf-Macht leeren. */
    const onPowerCardContextMenu = async (ev: MouseEvent) => {
      if (!allowDrag || locked) return;
      const t = ev.target as HTMLElement;

      if (t.closest('.js-stone-draggable') || t.closest('.js-stone-returnable')) return;

      const resolved = resolvePowerCardContext(t);
      if (!resolved) return;

      ev.preventDefault();
      const { powerId, isGeneric, fixedPayAttr } = resolved;
      this.#clearPowerStonePlan(powerId, isGeneric, fixedPayAttr);
      this.#reconcileFilledLaneClasses(bindTarget);
      this.#syncAccumulatorGems(bindTarget);
      await (this as any).render({ force: true });
    };

    const useCapture = true;
    bindTarget.addEventListener('dragstart', onDelegateReturnDragStart, useCapture);
    bindTarget.addEventListener('dragend', onDelegateReturnDragEnd, useCapture);
    bindTarget.addEventListener('dragover', onBindDragOver, useCapture);
    bindTarget.addEventListener('dragleave', onBindDragLeave);
    bindTarget.addEventListener('drop', onBindDrop, useCapture);
    bindTarget.addEventListener('click', onPowerCardClick);
    bindTarget.addEventListener('contextmenu', onPowerCardContextMenu);

    this._stoneDndCleanup = () => {
      bindTarget.removeEventListener('dragstart', onDelegateReturnDragStart, useCapture);
      bindTarget.removeEventListener('dragend', onDelegateReturnDragEnd, useCapture);
      bindTarget.removeEventListener('dragover', onBindDragOver, useCapture);
      bindTarget.removeEventListener('dragleave', onBindDragLeave);
      bindTarget.removeEventListener('drop', onBindDrop, useCapture);
      bindTarget.removeEventListener('click', onPowerCardClick);
      bindTarget.removeEventListener('contextmenu', onPowerCardContextMenu);
    };
  }

  async #saveStonePowersPrefs(root: HTMLElement): Promise<void> {
    const doc = getActionEconomyActor(this.actor) ?? this.actor;
    const useEl = root.querySelector('.js-stone-prefs-use-defaults') as HTMLInputElement | null;
    const useDefaultsEachRound = !!useEl?.checked;
    const map: Record<string, string> = {};
    for (const [pid, attr] of Object.entries(this._generalAttrSelection)) {
      map[pid] = attr;
    }

    await doc.update({
      'system.stonePowersPrefs': {
        useDefaultsEachRound,
        defaultAttributesByPowerId: map
      }
    } as any);

    ui.notifications?.info('Steinmacht-Standard gespeichert (wird bei neuen Runden übernommen, solange aktiviert).');
  }
  
  async _onClose(_options: any): Promise<void> {
    const committed = _options?.committed === true;
    this.#pullSessionPartialsIntoInstance();
    if (committed) {
      await this.#flushCompletedStonePaymentsFromAccumulators();
      if (this.combatant && game.combat) {
        try {
          const { handleInitiativeConfirmed } = await import('../combat/encounter-start.js');
          const ini = Math.max(0, Math.floor(Number(this.combatant.initiative) || 0));
          await handleInitiativeConfirmed(game.combat, this.combatant.id, ini);
        } catch (err) {
          console.warn('Mastery System | Could not confirm Initiative Exchange', err);
        }
      }
      try {
        const { getActionEconomyActor } = await import('../combat/action-economy.js');
        const owner = getActionEconomyActor(this.actor) ?? this.actor;
        const tempHP = Number((owner as any)?.system?.health?.tempHP ?? 0) || 0;
        if (owner !== this.actor && tempHP > 0) {
          await (this.actor as any).update?.({ 'system.health.tempHP': tempHP });
        }
      } catch {
        /* best-effort sheet/token sync */
      }
      try {
        const { CombatCarouselApp } = await import('../ui/combat-carousel.js');
        CombatCarouselApp.refresh();
      } catch {
        /* carousel may not be open */
      }
      try {
        void (this.actor as any)?.sheet?.render?.(false);
      } catch {
        /* ignore */
      }
    }
    this.#clearSessionStoneLanesForOwner();
    this._stoneDragAttribute = null;
    this._stoneReturnAccKey = null;
    this._stoneDndCleanup?.();
    this._stoneDndCleanup = undefined;
    if (this.resolve) {
      this.resolve(committed);
      this.resolve = undefined;
    }
    return super._onClose(_options);
  }
}
