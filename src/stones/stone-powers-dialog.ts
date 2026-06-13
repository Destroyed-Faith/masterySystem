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
import { STONE_POWERS_BY_ATTRIBUTE, stonePowerSkipsFirstTier, type StonePower } from './stone-powers.js';
import {
  getStoneUsageCount,
  getGenericStonePowerUsageCount,
  calculateStoneCost,
  getStonePool,
  isStonePowersConfigurationLocked,
  getActionEconomyActor
} from '../combat/action-economy.js';
import { getStoneGemStyle } from '../utils/stone-attribute-ui.js';
import { poolSpendableStones } from '../utils/artifact-actor-rules.js';
import { countArtifactActivationStones } from '../utils/artifact-stone-bound.js';
import { getArtifactStoneFunctionStatus } from '../utils/artifact-stone-functions.js';
import { refreshRadialMenuActionLabelsIfOpenForActor } from '../token-radial-menu.js';
import {
  STONE_RITUALS_CATALOG,
  type RitualCatalogEntry,
  type RitualPoolAttr
} from './rituals-catalog.js';
import {
  FAMILIAR_UPGRADE_CATEGORY_OPTIONS,
  getFamiliarProgressionTableRows,
  getMaxFamiliarCount,
  getMaxStonesPerFamiliar,
  type FamiliarResult,
  type UpgradeCategory,
} from './familiar-rules.js';
import {
  bindFamiliarToActor,
  buildFamiliarResultFromDraft,
  collectDraftStoneCounts,
  countDraftBoundStones,
  emptyFamiliarDraft,
  getActorPoolSpendable,
  getFamiliarsFromActor,
  progressionHighlightTiers,
  releaseFamiliarFromActor,
  SHARED_SENSE_UI,
  validateFamiliarDraft,
  type FamiliarDraft,
  type FamiliarPoolAttr,
} from './familiar-bind.js';
import {
  createSummonActorForFamiliar,
  deleteSummonActor,
  placeFamiliarToken,
} from './familiar-actor-factory.js';

const STONE_DRAG_MIME = 'application/x-mastery-stone-attribute';
const STONE_RETURN_MIME = 'application/x-mastery-stone-return-acc';

/**
 * Konsole nach `StoneDnD` filtern.
 * Abschalten: in F12 `CONFIG.masterySystemDebugStoneDnD = false` (Standard ist an, bis ihr es dauerhaft ausmacht).
 * Rückgabe Pool↔Feld: zusätzlich `CONFIG.masterySystemDebugStoneReturn = true` (Standard aus), dann [StoneReturn]-Logs.
 * Ablage-Raster (wave/acc/nextCost): `CONFIG.masterySystemDebugStoneWave = true` → [StoneWave]-Logs.
 * Lane-UI / Akku / DOM: `CONFIG.masterySystemDebugStoneLanes = true` → [StoneLanes]-Logs.
 * Zahlungs-Wellen / spendableNet / warum Slot locked: `CONFIG.masterySystemDebugStonePayment = true` → [StonePayment]-Logs bei jedem Render + `console.warn` bei Drop auf locked (immer kurz, Details wenn Flag an).
 */
const DEBUG_STONE_POWERS_DND = (globalThis as any).CONFIG?.masterySystemDebugStoneDnD !== false;
const DEBUG_STONE_RETURN =
  (globalThis as any).CONFIG?.masterySystemDebugStoneReturn === true;
const DEBUG_STONE_WAVE = (globalThis as any).CONFIG?.masterySystemDebugStoneWave === true;
/** F12: `CONFIG.masterySystemDebugStoneLanes = true` — Lane-Zustand, Akku-Keys, DOM nach Render. */
const DEBUG_STONE_LANES = (globalThis as any).CONFIG?.masterySystemDebugStoneLanes === true;
/** F12: `CONFIG.masterySystemDebugStonePayment = true` — volle Payment-Snapshots in _prepareContext ([StonePayment]). */
const DEBUG_STONE_PAYMENT = (globalThis as any).CONFIG?.masterySystemDebugStonePayment === true;

function dlogStoneDnD(...args: unknown[]): void {
  if (!DEBUG_STONE_POWERS_DND) return;
  console.log('Mastery System | [StoneDnD]', ...args);
}

function dlogStoneReturn(...args: unknown[]): void {
  if (!DEBUG_STONE_RETURN) return;
  console.log('Mastery System | [StoneReturn]', ...args);
}

function dlogStoneWave(payload: Record<string, unknown>): void {
  console.log('Mastery System | [StoneWave]', payload);
}

function dlogStoneLanes(...args: unknown[]): void {
  if (!DEBUG_STONE_LANES) return;
  console.log('Mastery System | [StoneLanes]', ...args);
}

function dlogStonePayment(...args: unknown[]): void {
  if (!DEBUG_STONE_PAYMENT) return;
  console.log('Mastery System | [StonePayment]', ...args);
}

/** Physische Zahlungs-Lanes im Cluster: 1 + 2 + 4 + 8. */
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

/** Warum ein leeres Feld nicht `slot-active` ist (Debug / Drop-Warn). */
function explainLaneInactiveReason(
  laneIndex: number,
  occ: number[],
  allowed: Set<number>,
  spendableNet: number,
  planLocked: boolean
): string {
  const o = new Set(occ);
  if (planLocked) return 'stonePlanLocked';
  if (o.has(laneIndex)) return 'filled';
  if (spendableNet < 1) {
    return `spendableNet=${spendableNet} (kein freier Pool-Stein; reservierte Felder zählen gegen den Pool)`;
  }
  if (!allowed.has(laneIndex)) {
    const seg = segmentIndexForLane(laneIndex);
    for (let s = 0; s < seg; s++) {
      if (!isStoneSegmentComplete(o, s)) {
        return `Segment ${s} noch unvollständig — erst vorherigen Block voll belegen (Freigabe 1→2→4→8)`;
      }
    }
    return `Lane ${laneIndex} nicht in allowed=[${[...allowed].sort((a, b) => a - b)}]`;
  }
  return 'sollte_active_sein';
}

/** Fallback wenn getData im Drop leer bleibt (z. B. Chromium/Foundry) */
let msLastDraggedStoneAttribute = '';

/** Mittelteil im Akku-Schlüssel: General Powers mit Steinen aus mehreren Attribut-Pools. */
const STONE_GENERIC_UNIFIED_MARKER = 'msGenMulti';

type GenericLaneOcc = { lane: number; attr: string };

type StoneAccumulatorValue = number[] | GenericLaneOcc[];

/** Actor-Flag: gespeicherter Steinplan pro Kampf/Runde (Kampf · Runde 1 „Speichern“). */
const STONE_POWERS_ROUND_PLAN_FLAG = 'stonePowersRoundPlan';

interface StonePowersRoundPlanStored {
  combatId: string;
  round: number;
  lanes: { accKey: string; value: StoneAccumulatorValue }[];
}

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
 * `prefillTier` (2..4).
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

  if (DEBUG_STONE_WAVE && debugLabel) {
    dlogStoneWave({
      label: debugLabel,
      usesThisTurn,
      occupied: [...occupied].sort((a, b) => a - b),
      allowedLanes: [...allowed],
      spendableNet,
      planLocked
    });
  }

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
  private _stonePowersMainTab: 'combat' | 'rituals' | 'summons' = 'combat';
  /** Fixed-cost ritual slots: ritual id → placed stone attribute per slot (null = empty). */
  private _ritualStonePlacements = new Map<string, (RitualPoolAttr | null)[]>();
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
  /** Verhindert, dass jeder Render den Session-Steinplan aus dem Flag neu überschreibt (ungespeicherte UI ging verloren). */
  private _stoneRoundPlanHydratedKey: string | null = null;
  /** Scroll im Dialog-Inhalt vor Re-Render merken (Stein setzen sonst springt nach oben). */
  private _stonePowersContentScrollTop = 0;

  /** Summons tab: list view or new-familiar editor. */
  private _familiarView: 'list' | 'editor' = 'list';
  private _familiarDraft: FamiliarDraft = emptyFamiliarDraft();

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

  #ritualEnsureSlots(entry: RitualCatalogEntry): (RitualPoolAttr | null)[] {
    this.#pullSessionPartialsIntoInstance();
    let arr = this._ritualStonePlacements.get(entry.id);
    if (!arr || arr.length !== entry.slots.length) {
      arr = Array(entry.slots.length).fill(null) as (RitualPoolAttr | null)[];
      this._ritualStonePlacements.set(entry.id, arr);
    }
    return arr;
  }

  /** Erstes erlaubtes Attribut mit mindestens einem freien Pool-Stein (Reihenfolge wie im Ritual-Katalog). */
  #firstSpendableRitualAttr(allowed: RitualPoolAttr[]): RitualPoolAttr | null {
    this.#pullSessionPartialsIntoInstance();
    const poolKeys = getActorStonePoolKeysWithMax(this.actor);
    for (const a of allowed) {
      if (!poolKeys.has(a)) continue;
      if (this.#spendableNetForAttr(a) >= 1) return a;
    }
    return null;
  }

  /** Leeres Ritual-Feld per Klick mit dem nächsten passenden Stein füllen (wie Drop, ohne Drag). */
  async #autoFillRitualSlot(ritualId: string, slotIndex: number): Promise<void> {
    this.#pullSessionPartialsIntoInstance();
    const entry = STONE_RITUALS_CATALOG.find((r) => r.id === ritualId);
    if (!entry || slotIndex < 0 || slotIndex >= entry.slots.length) return;
    const placed = this.#ritualEnsureSlots(entry);
    if (placed[slotIndex]) return;
    const allowed = entry.slots[slotIndex].allow;
    const pick = this.#firstSpendableRitualAttr(allowed);
    if (!pick) {
      ui.notifications?.warn('Kein freier Stein eines erlaubten Attributs.');
      return;
    }
    placed[slotIndex] = pick;
    await (this as any).render({ force: true });
  }

  /** Ritual-Feld leeren (Stein zurück logisch frei — wie Rückzug in den Pool). */
  #clearRitualSlot(ritualId: string, slotIndex: number): void {
    this.#pullSessionPartialsIntoInstance();
    const entry = STONE_RITUALS_CATALOG.find((r) => r.id === ritualId);
    if (!entry || slotIndex < 0 || slotIndex >= entry.slots.length) return;
    const placed = this.#ritualEnsureSlots(entry);
    if (!placed[slotIndex]) return;
    placed[slotIndex] = null;
  }

  #readFamiliarDraftFromDom(root: HTMLElement): void {
    const form = root.querySelector('.stone-familiar-form') as HTMLElement | null;
    if (!form) return;
    const draft = this._familiarDraft;
    draft.name = (form.querySelector('.js-familiar-name') as HTMLInputElement)?.value ?? draft.name;
    draft.img = (form.querySelector('.js-familiar-img') as HTMLInputElement)?.value ?? draft.img;
    const movRaw = (form.querySelector('input[name="familiarMovement"]:checked') as HTMLInputElement)?.value;
    draft.movementType = movRaw === 'flying' ? 'flying' : 'ground';

    const rows: FamiliarDraft['upgradeRows'] = [];
    form.querySelectorAll('.js-familiar-upgrade-row').forEach((el) => {
      const row = el as HTMLElement;
      const id = row.dataset.rowId || '';
      const existing = draft.upgradeRows.find((r) => r.id === id);
      const a = (row.querySelector('.js-familiar-pick-a') as HTMLSelectElement | null)?.value as UpgradeCategory | undefined;
      const b = (row.querySelector('.js-familiar-pick-b') as HTMLSelectElement | null)?.value as UpgradeCategory | undefined;
      if (!id || !a || !b) return;
      rows.push({
        id,
        attribute: existing?.attribute ?? null,
        pickA: a,
        pickB: b,
      });
    });
    draft.upgradeRows = rows;

    for (const s of SHARED_SENSE_UI) {
      const cb = form.querySelector(`.js-familiar-sense-enable[data-sense-field="${s.field}"]`) as HTMLInputElement | null;
      draft[s.field].enabled = !!cb?.checked;
    }
  }

  #firstSpendableFamiliarAttr(): FamiliarPoolAttr | null {
    for (const attr of ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence', 'wits'] as FamiliarPoolAttr[]) {
      if (this.#spendableNetForAttr(attr) >= 1) return attr;
    }
    return null;
  }

  #assignFamiliarStone(slot: 'base' | 'upgrade' | 'sense', rowId?: string, senseField?: keyof FamiliarDraft): void {
    const pick = this.#firstSpendableFamiliarAttr();
    if (!pick) {
      ui.notifications?.warn('No free stones in your pools.');
      return;
    }
    if (slot === 'base') {
      this._familiarDraft.baseStoneAttr = pick;
    } else if (slot === 'upgrade' && rowId) {
      const row = this._familiarDraft.upgradeRows.find((r) => r.id === rowId);
      if (row) row.attribute = pick;
    } else if (slot === 'sense' && senseField && senseField in this._familiarDraft) {
      const key = senseField as keyof Pick<FamiliarDraft, 'sharedSight' | 'sharedHearing' | 'sharedTasteSmell' | 'sharedTouch'>;
      this._familiarDraft[key].attribute = pick;
    }
  }

  #clearFamiliarStone(slot: 'base' | 'upgrade' | 'sense', rowId?: string, senseField?: keyof FamiliarDraft): void {
    if (slot === 'base') {
      this._familiarDraft.baseStoneAttr = null;
    } else if (slot === 'upgrade' && rowId) {
      const row = this._familiarDraft.upgradeRows.find((r) => r.id === rowId);
      if (row) row.attribute = null;
    } else if (slot === 'sense' && senseField && senseField in this._familiarDraft) {
      const key = senseField as keyof Pick<FamiliarDraft, 'sharedSight' | 'sharedHearing' | 'sharedTasteSmell' | 'sharedTouch'>;
      this._familiarDraft[key].attribute = null;
    }
  }

  #stoneUiForAttr(attr: FamiliarPoolAttr | null): { filled: boolean; label: string; gemStyle: { fill: string; stroke: string } } {
    if (!attr) return { filled: false, label: '', gemStyle: { fill: '#888', stroke: '#aaa' } };
    return {
      filled: true,
      label: poolDisplayName(attr),
      gemStyle: getStoneGemStyle(attr) ?? { fill: '#888888', stroke: '#aaaaaa' },
    };
  }

  async #bindFamiliarDraft(createActor: boolean): Promise<void> {
    const mr = Math.max(1, Math.floor(Number((this.actor as any).system?.mastery?.rank) || 1));
    this.#readFamiliarDraftFromDom(getStonePowersContentRoot(this as any) ?? document.body);
    const record = await bindFamiliarToActor(this.actor, this._familiarDraft, mr);
    if (!record) return;

    if (createActor) {
      const summon = await createSummonActorForFamiliar(record, this.actor);
      if (summon) {
        const familiars = getFamiliarsFromActor(this.actor);
        const idx = familiars.findIndex((f) => f.id === record.id);
        if (idx >= 0) {
          familiars[idx] = { ...familiars[idx], summonActorId: (summon as any).id };
          await this.actor.update({ 'system.familiars': familiars });
        }
      }
    }

    this._familiarDraft = emptyFamiliarDraft();
    this._familiarView = 'list';
    ui.notifications?.info(`Bound familiar "${record.name}".`);
    await (this as any).render({ force: true });
  }

  #bindFamiliarForm(root: HTMLElement): void {
    root.querySelector('.js-familiar-new')?.addEventListener('click', (ev: Event) => {
      ev.preventDefault();
      this._familiarDraft = emptyFamiliarDraft();
      this._familiarView = 'editor';
      void (this as any).render({ force: true });
    });

    root.querySelectorAll('.js-familiar-release').forEach((btn) => {
      (btn as HTMLElement).onclick = async (ev: MouseEvent) => {
        ev.preventDefault();
        const id = (btn as HTMLElement).dataset.familiarId;
        if (!id) return;
        const familiars = getFamiliarsFromActor(this.actor);
        const rec = familiars.find((f) => f.id === id);
        if (rec?.summonActorId) await deleteSummonActor(rec.summonActorId);
        await releaseFamiliarFromActor(this.actor, id);
        ui.notifications?.info('Familiar bond released; stones returned to pool.');
        await (this as any).render({ force: true });
      };
    });

    root.querySelectorAll('.js-familiar-create-actor').forEach((btn) => {
      (btn as HTMLElement).onclick = async (ev: MouseEvent) => {
        ev.preventDefault();
        const id = (btn as HTMLElement).dataset.familiarId;
        if (!id) return;
        const familiars = getFamiliarsFromActor(this.actor);
        const rec = familiars.find((f) => f.id === id);
        if (!rec) return;
        const summon = await createSummonActorForFamiliar(rec, this.actor);
        if (!summon) return;
        const idx = familiars.findIndex((f) => f.id === id);
        familiars[idx] = { ...familiars[idx], summonActorId: (summon as any).id };
        await this.actor.update({ 'system.familiars': familiars });
        await (this as any).render({ force: true });
      };
    });

    root.querySelectorAll('.js-familiar-open-actor').forEach((btn) => {
      (btn as HTMLElement).onclick = async (ev: MouseEvent) => {
        ev.preventDefault();
        const id = (btn as HTMLElement).dataset.familiarId;
        const rec = getFamiliarsFromActor(this.actor).find((f) => f.id === id);
        if (!rec?.summonActorId) return;
        const actor = (game as any).actors?.get(rec.summonActorId);
        actor?.sheet?.render(true);
      };
    });

    root.querySelectorAll('.js-familiar-place-token').forEach((btn) => {
      (btn as HTMLElement).onclick = async (ev: MouseEvent) => {
        ev.preventDefault();
        const id = (btn as HTMLElement).dataset.familiarId;
        const rec = getFamiliarsFromActor(this.actor).find((f) => f.id === id);
        if (!rec?.summonActorId) return;
        const summon = (game as any).actors?.get(rec.summonActorId);
        if (!summon) return;
        await placeFamiliarToken(summon, this.actor);
      };
    });

    const form = root.querySelector('.stone-familiar-form') as HTMLElement | null;
    if (!form) return;

    const rerender = () => {
      this.#readFamiliarDraftFromDom(root);
      void (this as any).render({ force: true });
    };

    form.addEventListener('change', (ev: Event) => {
      const t = ev.target as HTMLElement;
      if (t.classList.contains('js-familiar-name') || t.classList.contains('js-familiar-img')) return;
      rerender();
    });
    form.querySelector('.js-familiar-name')?.addEventListener('blur', rerender);
    form.querySelector('.js-familiar-img')?.addEventListener('blur', rerender);

    root.querySelector('.js-familiar-back')?.addEventListener('click', (ev: Event) => {
      ev.preventDefault();
      this._familiarView = 'list';
      void (this as any).render({ force: true });
    });

    form.addEventListener('click', (ev: MouseEvent) => {
      const t = ev.target as HTMLElement;

      if (t.closest('.js-familiar-bind')) {
        ev.preventDefault();
        void this.#bindFamiliarDraft(false);
        return;
      }
      if (t.closest('.js-familiar-bind-and-actor')) {
        ev.preventDefault();
        void this.#bindFamiliarDraft(true);
        return;
      }

      if (t.closest('.js-familiar-add-upgrade-stone')) {
        ev.preventDefault();
        this.#readFamiliarDraftFromDom(root);
        const id = (foundry as any).utils?.randomID?.() ?? `u${Date.now()}`;
        this._familiarDraft.upgradeRows.push({ id, attribute: null, pickA: 'hp', pickB: 'armor' });
        void (this as any).render({ force: true });
        return;
      }

      const rm = t.closest('.js-familiar-remove-upgrade-stone') as HTMLElement | null;
      if (rm) {
        ev.preventDefault();
        const rowId = rm.dataset.rowId || rm.closest('[data-row-id]')?.getAttribute('data-row-id');
        this.#readFamiliarDraftFromDom(root);
        if (rowId) {
          this._familiarDraft.upgradeRows = this._familiarDraft.upgradeRows.filter((r) => r.id !== rowId);
        }
        void (this as any).render({ force: true });
        return;
      }

      const clearBtn = t.closest('.js-familiar-clear-stone') as HTMLElement | null;
      if (clearBtn) {
        ev.preventDefault();
        ev.stopPropagation();
        const kind = clearBtn.dataset.slotKind as 'base' | 'upgrade' | 'sense';
        this.#clearFamiliarStone(kind, clearBtn.dataset.rowId, clearBtn.dataset.senseField as keyof FamiliarDraft);
        void (this as any).render({ force: true });
        return;
      }

      const baseSlot = t.closest('.js-familiar-base-slot');
      if (baseSlot) {
        ev.preventDefault();
        this.#assignFamiliarStone('base');
        void (this as any).render({ force: true });
        return;
      }

      const upgradeSlot = t.closest('.js-familiar-upgrade-slot') as HTMLElement | null;
      if (upgradeSlot) {
        ev.preventDefault();
        this.#assignFamiliarStone('upgrade', upgradeSlot.dataset.rowId);
        void (this as any).render({ force: true });
        return;
      }

      const senseSlot = t.closest('.js-familiar-sense-slot') as HTMLElement | null;
      if (senseSlot) {
        ev.preventDefault();
        this.#assignFamiliarStone('sense', undefined, senseSlot.dataset.senseField as keyof FamiliarDraft);
        void (this as any).render({ force: true });
      }
    });
  }

  async _prepareContext(_options: any): Promise<any> {
    const el = (this as any).element as HTMLElement | undefined;
    const scrollRoot = el ? getStonePowersContentRoot(this as any) : null;
    if (scrollRoot && scrollRoot.scrollTop > 0) {
      this._stonePowersContentScrollTop = scrollRoot.scrollTop;
    }

    await this.#syncStonePowersRoundPlanWithCombat();

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
      for (const s of artifactStoneSupports) {
        if (!s.stonePowerId || s.stonePowerId !== powerId) continue;
        if (attr && s.attribute !== attr) continue;
        if (!best || s.value > best.tier) best = { tier: s.value, source: s.source };
      }
      return best;
    };
    const availablePowers = getAvailableStonePowers(this.actor);
    
    // Filter pools to only show those with max > 0 (includes optional Wits)
    const pools = POOL_DISPLAY_ATTRS.map((attr) => {
        const pool = stonePools[attr];
        const current = pool?.current ?? pool?.value ?? 0;
        const max = pool?.max ?? pool?.maximum ?? 0;
        const sustained = pool?.sustained ?? 0;
        const artifactBound = countArtifactActivationStones(poolOwner, attr);
        const spendable = poolSpendableStones(poolOwner, attr);
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

    const combatMissingFromTracker = combatActive && !this.combatant;
    const hasCombat = combatActive && !!this.combatant;
    const stonePlanLocked = !!(combat && this.combatant && isStonePowersConfigurationLocked(this.actor, combat));

    const mainTab = this._stonePowersMainTab;
    const showStonePools = mainTab === 'combat' || mainTab === 'rituals' || mainTab === 'summons';
    const dragPoolEnabled =
      mainTab === 'rituals' || (mainTab === 'combat' && !stonePlanLocked);
    const ritualDragEnabled = mainTab === 'rituals';
    const tabCombatActive = mainTab === 'combat';
    const tabRitualsActive = mainTab === 'rituals';
    const tabSummonsActive = mainTab === 'summons';

    const ritualRows = STONE_RITUALS_CATALOG.map((entry) => {
      const placed = this.#ritualEnsureSlots(entry);
      const slotsUi = entry.slots.map((rule, idx) => {
        const p = placed[idx];
        if (p) {
          const style = getStoneGemStyle(p) ?? { fill: '#888888', stroke: '#aaaaaa' };
          return {
            slotIndex: idx,
            state: 'filled' as const,
            allowedCsv: rule.allow.join(','),
            placedKey: p,
            gemStyle: style,
            allowTitle: rule.allow.join(' or ')
          };
        }
        const canAny = rule.allow.some((a) => this.#spendableNetForAttr(a) >= 1);
        const state: 'active' | 'locked' = ritualDragEnabled && canAny ? 'active' : 'locked';
        return {
          slotIndex: idx,
          state,
          allowedCsv: rule.allow.join(','),
          placedKey: null as RitualPoolAttr | null,
          gemStyle: null as { fill: string; stroke: string } | null,
          allowTitle: rule.allow.join(' or ')
        };
      });
      return {
        id: entry.id,
        name: entry.name,
        roll: entry.roll,
        duration: entry.duration,
        requirement: entry.requirement,
        intro: entry.intro,
        raises: entry.raises,
        danger: entry.danger,
        lore: entry.lore,
        slotsUi
      };
    });
    const prefsUseDefaults = !!(system.stonePowersPrefs?.useDefaultsEachRound);
    const user = game.user;
    const canSavePrefs =
      !stonePlanLocked && !!user && (user.isGM || (this.actor as any).isOwner);

    const showCombatRoundPlanSave =
      !!combat &&
      !!this.combatant &&
      !stonePlanLocked &&
      !combatMissingFromTracker &&
      !combatStarted &&
      !!user &&
      (user.isGM || (this.actor as any).isOwner);
    
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
      const nextCost = calculateStoneCost(usesThisTurn);
      const pool = getStonePool(this.actor, attrKey);
      const canAfford = pool.current >= nextCost && hasCombat;
      const gross = spendableForAttr(attrKey);
      const reserved = this.#reservedStonesInDialogForAttr(attrKey);
      const spendableNet = Math.max(0, gross - reserved);
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
        supportLanes
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
        for (let i = 0; i < ATTR_MATRIX_COLS; i++) {
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

    if (DEBUG_STONE_PAYMENT) {
      const poolSnapPay = this.#debugPaymentNetwork();
      dlogStonePayment('_prepareContext snapshot', {
        stonePlanLocked,
        combatRound: combat?.round,
        combatTurn: combat?.turn,
        hasCombat,
        totalSpendableNetAllPools: spendableNetAllPoolsCached,
        poolNetByAttr: poolSnapPay.perAttr,
        generics: generalPowers.map((p: any) => {
          this.#mergeLegacyGenericIntoUnified(p.id, p.usesThisTurn);
          const gk = genericUnifiedAccKey(p.id, p.usesThisTurn);
          const occ = this.#stoneOccGet(gk);
          const allowed = allowedSegmentDropLanes(occ);
          return {
            id: p.id,
            payAttr: p.selectedAttrKey,
            usesThisTurn: p.usesThisTurn,
            nextCost: p.nextCost,
            accKey: gk,
            occupied: [...occ].sort((a, b) => a - b),
            allowedLanes: [...allowed].sort((a, b) => a - b),
            lane012: [
              p.paymentAnchor?.[0]?.state,
              p.paymentMid?.[0]?.state,
              p.paymentMid?.[1]?.state
            ],
            whyLane1: explainLaneInactiveReason(
              1,
              occ,
              allowed,
              spendableNetAllPoolsCached,
              stonePlanLocked
            ),
            whyLane2: explainLaneInactiveReason(
              2,
              occ,
              allowed,
              spendableNetAllPoolsCached,
              stonePlanLocked
            )
          };
        })
      });
    }

    if (DEBUG_STONE_LANES) {
      const accDump = Object.fromEntries(
        [...this._stoneDropAccumulators.entries()].map(([k, v]) => {
          if (isGenericUnifiedAccKey(k) && isGenericLaneOccArray(v as StoneAccumulatorValue)) {
            return [k, [...(v as GenericLaneOcc[])].sort((a, b) => a.lane - b.lane)];
          }
          return [k, [...(v as number[])].sort((a, b) => a - b)];
        })
      );
      dlogStoneLanes('_prepareContext', {
        hasCombat,
        combatMissingFromTracker,
        combatRound: combat?.round,
        combatTurn: combat?.turn,
        stonePlanLocked,
        totalSpendableNetAllPools: spendableNetAllPoolsCached,
        accumulators: accDump,
        generalPowersPreview: generalPowers.map((p: any) => {
          this.#mergeLegacyGenericIntoUnified(p.id, p.usesThisTurn);
          const gk = genericUnifiedAccKey(p.id, p.usesThisTurn);
          const occ = this.#stoneOccGet(gk);
          const allowed = allowedSegmentDropLanes(occ);
          return {
            id: p.id,
            attr: p.selectedAttrKey,
            usesThisTurn: p.usesThisTurn,
            nextCost: p.nextCost,
            accKey: gk,
            lane0state: p.paymentAnchor?.[0]?.state,
            lane1state: p.paymentMid?.[0]?.state,
            lane2state: p.paymentMid?.[1]?.state,
            occupied: [...occ].sort((a, b) => a - b),
            allowedLanes: [...allowed].sort((a, b) => a - b),
            whyLane1: explainLaneInactiveReason(
              1,
              occ,
              allowed,
              spendableNetAllPoolsCached,
              stonePlanLocked
            ),
            whyLane2: explainLaneInactiveReason(
              2,
              occ,
              allowed,
              spendableNetAllPoolsCached,
              stonePlanLocked
            ),
            occMatchInMap: accDump[genericUnifiedAccKey(p.id, p.usesThisTurn)] ?? null
          };
        })
      });
    }

    const masteryRankForFamiliar = Math.max(1, Math.floor(Number(system.mastery?.rank) || 1));
    const familiarCap = getMaxStonesPerFamiliar(masteryRankForFamiliar);
    const familiarMaxCount = getMaxFamiliarCount(masteryRankForFamiliar);
    const boundFamiliarsRaw = getFamiliarsFromActor(this.actor);
    const boundFamiliars = boundFamiliarsRaw.map((f) => ({
      ...f,
      hasToken: !!f.summonActorId,
    }));
    const familiarDraft = this._familiarDraft;
    const familiarResult: FamiliarResult | null = buildFamiliarResultFromDraft(
      familiarDraft,
      masteryRankForFamiliar,
    );
    const familiarValidation = validateFamiliarDraft(
      familiarDraft,
      masteryRankForFamiliar,
      boundFamiliarsRaw.length,
      this.#spendableMapForFamiliarValidation(),
    );
    const familiarDraftBoundCount = countDraftBoundStones(familiarDraft);
    const highlightTiers = progressionHighlightTiers(familiarResult);
    const familiarProgressionTable = getFamiliarProgressionTableRows().map((row) => ({
      label: row.label,
      cells: row.cells.map((value, tierIndex) => ({
        value,
        isHighlight: highlightTiers[row.label] === tierIndex,
      })),
    }));
    const familiarSenseOptions = SHARED_SENSE_UI.map((s) => {
      const slot = familiarDraft[s.field];
      const canEnable =
        !slot.enabled &&
        familiarDraftBoundCount < familiarCap &&
        this.#firstSpendableFamiliarAttr() != null;
      return {
        ...s,
        enabled: slot.enabled,
        canEnable: slot.enabled || canEnable,
        stoneUi: this.#stoneUiForAttr(slot.attribute),
      };
    });
    const familiarCanAddUpgrade =
      familiarDraft.baseStoneAttr != null &&
      familiarDraftBoundCount < familiarCap &&
      this.#firstSpendableFamiliarAttr() != null;

    return {
      actor: this.actor,
      pools,
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
      ritualDragEnabled,
      stonePowersMainTab: mainTab,
      showStonePools,
      tabCombatActive,
      tabRitualsActive,
      tabSummonsActive,
      ritualRows,
      familiarView: this._familiarView,
      familiarViewIsList: this._familiarView === 'list',
      familiarViewIsEditor: this._familiarView === 'editor',
      familiarDraft,
      familiarDraftMovementIsGround: familiarDraft.movementType === 'ground',
      familiarDraftMovementIsFlying: familiarDraft.movementType === 'flying',
      familiarDraftBaseStoneUi: this.#stoneUiForAttr(familiarDraft.baseStoneAttr),
      familiarDraftUpgradeRows: familiarDraft.upgradeRows.map((row) => ({
        ...row,
        stoneUi: this.#stoneUiForAttr(row.attribute),
      })),
      familiarUpgradeCategoryOptions: FAMILIAR_UPGRADE_CATEGORY_OPTIONS,
      familiarSenseOptions,
      familiarResult,
      familiarValidation,
      familiarProgressionTable,
      familiarMasteryRank: masteryRankForFamiliar,
      familiarMasteryCap: familiarCap,
      familiarMaxCount,
      familiarListCount: boundFamiliarsRaw.length,
      familiarDraftBoundCount,
      familiarCanAddNew: boundFamiliarsRaw.length < familiarMaxCount,
      familiarCanAddUpgrade,
      familiarCanBind: familiarValidation.canBind,
      boundFamiliars,
      prefsUseDefaults,
      canSavePrefs,
      showCombatRoundPlanSave,
      combatRound: combat?.round,
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
    if (DEBUG_STONE_LANES) this.#logStoneLanesDom(appWindow);

    root.querySelectorAll('.js-stone-powers-tab').forEach((btn) => {
      const el = btn as HTMLElement;
      el.onclick = (ev: MouseEvent) => {
        ev.preventDefault();
        const tab = el.dataset.tab as 'combat' | 'rituals' | 'summons' | undefined;
        if (!tab || tab === this._stonePowersMainTab) return;
        this._stonePowersMainTab = tab;
        void (this as any).render({ force: true });
      };
    });

    this.#bindFamiliarForm(root);

    const savePrefsBtn = root.querySelector('.js-save-stone-prefs') as HTMLElement | null;
    if (savePrefsBtn) {
      savePrefsBtn.onclick = async (ev: MouseEvent) => {
        ev.preventDefault();
        if (savePrefsBtn.classList.contains('is-disabled')) return;
        await this.#saveStonePowersPrefs(root);
      };
    }

    const saveR1CombatBtn = root.querySelector('.js-save-stone-r1-combat-plan') as HTMLElement | null;
    if (saveR1CombatBtn) {
      saveR1CombatBtn.onclick = async (ev: MouseEvent) => {
        ev.preventDefault();
        await this.#persistStonePowersRoundPlan();
        if (this.resolve) {
          this.resolve(false);
          this.resolve = undefined;
        }
        await (this as any).close({ closeSource: 'button' });
      };
    }

    // Close button
    const closeBtn = root.querySelector('.js-close');
    if (closeBtn) {
      (closeBtn as HTMLElement).onclick = async (ev: MouseEvent) => {
        ev.preventDefault();
        if (this.resolve) {
          this.resolve(false);
          this.resolve = undefined;
        }
        await (this as any).close({ closeSource: "button" });
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
    const raw = this.#stoneOccGetRaw(accKey) as number[];
    return [...raw].sort((a, b) => a - b);
  }

  #stoneOccSet(accKey: string, value: StoneAccumulatorValue): void {
    const sk = this.#sessionLaneCompositeKey(accKey);
    if (!value.length) {
      this._stoneDropAccumulators.delete(accKey);
      StonePowersDialog._sessionStoneLanes.delete(sk);
    } else if (isGenericUnifiedAccKey(accKey)) {
      const sorted = [...(value as GenericLaneOcc[])].sort((a, b) => a.lane - b.lane);
      this._stoneDropAccumulators.set(accKey, sorted);
      StonePowersDialog._sessionStoneLanes.set(sk, sorted);
    } else {
      const sorted = [...(value as number[])].sort((a, b) => a - b);
      this._stoneDropAccumulators.set(accKey, sorted);
      StonePowersDialog._sessionStoneLanes.set(sk, sorted);
    }
    if (DEBUG_STONE_LANES) {
      dlogStoneLanes('stoneOccSet', {
        accKey,
        sk,
        value,
        instanceKeys: [...this._stoneDropAccumulators.keys()],
        sessionSize: StonePowersDialog._sessionStoneLanes.size
      });
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
      const raw = this.#stoneOccGetRaw(accKey) as number[];
      if (!raw.length) return false;
      if (raw.length !== nextCost) return false;
      perAttr[String(middle)] = raw.length;
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
        abilityId: powerId
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

  /** Debug/Diagnose: Pool brutto, reserviert im Dialog, netto — pro Attribut + Summe. */
  #debugPaymentNetwork(): {
    totalNet: number;
    perAttr: Record<string, { gross: number; reserved: number; net: number }>;
  } {
    this.#pullSessionPartialsIntoInstance();
    const poolOwner = getActionEconomyActor(this.actor) ?? this.actor;
    const system = (poolOwner as any).system;
    const stonePools = system?.stonePools || {};
    const perAttr: Record<string, { gross: number; reserved: number; net: number }> = {};
    let totalNet = 0;
    for (const attr of POOL_DISPLAY_ATTRS) {
      const pool = stonePools[attr];
      const current = pool?.current ?? pool?.value ?? 0;
      const sustained = pool?.sustained ?? 0;
      const gross = Math.max(0, (Number(current) || 0) - (Number(sustained) || 0));
      const reserved = this.#reservedStonesInDialogForAttr(attr);
      const net = Math.max(0, gross - reserved);
      perAttr[attr] = { gross, reserved, net };
      totalNet += net;
    }
    return { totalNet, perAttr };
  }

  /** Drop auf slot-locked: vollständige Zahlungs-Sicht für Konsole. */
  #slotInactiveDropDiag(slot: HTMLElement): Record<string, unknown> {
    this.#pullSessionPartialsIntoInstance();
    const combat = game.combat;
    const powerId =
      slot.dataset.powerId ||
      (slot.closest('.power-drop-slots') as HTMLElement | null)?.dataset.powerId ||
      '';
    const isGeneric =
      slot.dataset.isGeneric === 'true' || slot.getAttribute('data-is-generic') === 'true';
    const laneRaw = slot.dataset.laneIndex;
    const laneIndex = laneRaw !== undefined && laneRaw !== '' ? Number(laneRaw) : NaN;
    const planLocked = !!(combat && this.combatant && isStonePowersConfigurationLocked(this.actor, combat));

    let payAttr = (slot.dataset.payAttribute || '') as string;
    if (isGeneric && powerId) {
      if (!payAttr) payAttr = (this._generalAttrSelection[powerId] as string) || '';
    }

    if (!powerId) {
      return { error: 'no_powerId', laneIndex, classList: Array.from(slot.classList) };
    }
    if (!isGeneric && !payAttr) {
      return { error: 'no_payAttr', powerId, isGeneric, laneIndex, classList: Array.from(slot.classList) };
    }

    const uses = isGeneric
      ? getGenericStonePowerUsageCount(this.actor, powerId, combat ?? null)
      : getStoneUsageCount(this.actor, payAttr as AttributeKey, powerId, combat ?? null);
    const nextCost = calculateStoneCost(uses);
    let accKey: string;
    let occ: number[];
    if (isGeneric && powerId) {
      this.#mergeLegacyGenericIntoUnified(powerId, uses);
      accKey = genericUnifiedAccKey(powerId, uses);
      occ = this.#stoneOccGet(accKey);
    } else {
      accKey = `${powerId}:${payAttr}:${uses}`;
      occ = this.#stoneOccGet(accKey);
    }
    const allowed = allowedSegmentDropLanes(occ);
    const { totalNet, perAttr } = this.#debugPaymentNetwork();
    const spendableNet = isGeneric ? totalNet : Math.max(0, perAttr[payAttr]?.net ?? 0);
    const why = Number.isFinite(laneIndex)
      ? explainLaneInactiveReason(laneIndex, occ, allowed, spendableNet, planLocked)
      : 'ungültige_laneIndex';

    return {
      powerId,
      isGeneric,
      payAttr,
      laneIndex,
      usesThisTurn: uses,
      nextCost,
      accKey,
      occupied: [...occ].sort((a, b) => a - b),
      allowedLanes: [...allowed].sort((a, b) => a - b),
      spendableNet,
      spendableNetAllPools: totalNet,
      perAttrPoolNet: perAttr,
      stonePlanLocked: planLocked,
      classList: Array.from(slot.classList),
      whyInactive: why
    };
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

  /** Nur bei CONFIG.masterySystemDebugStoneLanes: Lane 0–2 Klassen im gerenderten DOM. */
  #logStoneLanesDom(root: HTMLElement): void {
    const rows: { powerId: string; lane: string; slotClasses: string[] }[] = [];
    root.querySelectorAll('.ms-stone-drop-slot[data-lane-index]').forEach((el) => {
      const he = el as HTMLElement;
      const lane = he.dataset.laneIndex ?? '';
      if (lane !== '0' && lane !== '1' && lane !== '2') return;
      rows.push({
        powerId: he.dataset.powerId ?? '',
        lane,
        slotClasses: Array.from(he.classList).filter((c) => c.startsWith('slot-'))
      });
    });
    dlogStoneLanes('DOM nach sync (Lanes 0–2)', { rowCount: rows.length, rows });
  }

  #reservedStonesNonFamiliar(attr: string): number {
    this.#pullSessionPartialsIntoInstance();
    let sum = 0;
    for (const [accKey, val] of this._stoneDropAccumulators) {
      if (!val?.length) continue;
      if (isGenericUnifiedAccKey(accKey)) {
        if (!isGenericLaneOccArray(val)) continue;
        for (const a of val as GenericLaneOcc[]) {
          if (a.attr === attr) sum += 1;
        }
      } else if (this.#parseAccKeyPayAttr(accKey) === attr) {
        sum += (val as number[]).length;
      }
    }
    for (const slots of this._ritualStonePlacements.values()) {
      for (const a of slots) {
        if (a === attr) sum += 1;
      }
    }
    return sum;
  }

  #reservedStonesInDialogForAttr(attr: string): number {
    let sum = this.#reservedStonesNonFamiliar(attr);
    if (this._stonePowersMainTab === 'summons') {
      const draftCounts = collectDraftStoneCounts(this._familiarDraft);
      sum += draftCounts[attr] ?? 0;
    }
    return sum;
  }

  #spendableMapForFamiliarValidation(): Record<string, number> {
    const out: Record<string, number> = {};
    for (const attr of ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence', 'wits']) {
      out[attr] = Math.max(0, this.#actorPoolSpendable(attr) - this.#reservedStonesNonFamiliar(attr));
    }
    return out;
  }

  #actorPoolSpendable(attr: string): number {
    const poolOwner = getActionEconomyActor(this.actor) ?? this.actor;
    return poolSpendableStones(poolOwner, attr);
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
      dlogStoneDnD('autoFillPowerCluster', { powerId, isGeneric, segment: null, note: 'all_segments_full' });
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

    dlogStoneDnD('autoFillPowerCluster', { powerId, isGeneric, segment: seg });
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

    dlogStoneDnD('clearPowerStonePlan', { powerId, isGeneric, uses });
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
        dlogStoneDnD('syncAccumulatorGems: kein Slots-Host', { accKey, powerId, esc });
        continue;
      }

      const placeGem = (lane: number, payAttr: string) => {
        const style = getStoneGemStyle(payAttr);
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
          dlogStoneDnD('syncAccumulatorGems: kein Ziel-Slot', {
            powerId,
            lane,
            lanesVal,
            hint: 'fehlendes render() oder data-lane-index im Host'
          });
          if (DEBUG_STONE_LANES) {
            dlogStoneLanes('syncAccumulatorGems: Selector-Miss', {
              esc,
              powerId,
              lane,
              slotsInHost: host.querySelectorAll('.ms-stone-drop-slot').length
            });
          }
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
        const payAttrRaw = this.#parseAccKeyPayAttr(accKey);
        if (!payAttrRaw) continue;
        const payAttr = payAttrRaw as AttributeKey;
        for (const lane of [...(lanesVal as number[])].sort((a, b) => a - b)) {
          placeGem(lane, payAttr);
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
    const mainTab = this._stonePowersMainTab;
    const allowDrag = mainTab === 'rituals' || (mainTab === 'combat' && !locked);
    const poolKeys = getActorStonePoolKeysWithMax(this.actor);

    dlogStoneDnD('bind DnD', {
      bindTarget: {
        tag: bindTarget.tagName,
        id: bindTarget.id,
        cls: bindTarget.className?.toString?.()?.slice(0, 120)
      },
      root: { tag: root.tagName, cls: root.className?.toString?.()?.slice(0, 80) },
      allowDrag,
      locked,
      canExecute,
      poolKeys: [...poolKeys]
    });

    let lastDragOverLogKey = '';

    const clearPoolReturnHighlight = () => {
      bindTarget.querySelectorAll('.pool-gems.is-pool-drag-over').forEach((n) => n.classList.remove('is-pool-drag-over'));
    };

    const clearDragOver = () => {
      clearPoolReturnHighlight();
      bindTarget.querySelectorAll('.ms-stone-drop-slot.is-drag-over, .ms-ritual-drop-slot.is-drag-over').forEach((n) => {
        clearStoneSlotDragOverVisual(n as HTMLElement);
      });
    };

    root.querySelectorAll('.js-stone-draggable').forEach((el: Element) => {
      const gem = el as HTMLElement;
      gem.draggable = allowDrag;
      gem.classList.toggle('is-drag-disabled', !allowDrag);

      gem.ondragstart = (ev: DragEvent) => {
        if (!allowDrag || !ev.dataTransfer) {
          dlogStoneDnD('dragstart skipped', { allowDrag, hasDT: !!ev.dataTransfer });
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
        dlogStoneDnD('dragstart', { attr, types: ev.dataTransfer.types ? [...ev.dataTransfer.types] : [] });
      };
      gem.ondragend = () => {
        gem.classList.remove('is-dragging');
        clearDragOver();
        lastDragOverLogKey = '';
        this.#syncPoolGemChips(bindTarget);
        dlogStoneDnD('dragend', {
          msLastDraggedStoneAttribute,
          dialogDragAttr: this._stoneDragAttribute
        });
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
        if (logMiss) dlogStoneDnD('resolveDropSlot: no element', { rawType: raw?.constructor?.name });
        return null;
      }
      if (!bindTarget.contains(el)) {
        if (logMiss)
          dlogStoneDnD('resolveDropSlot: target outside bindTarget', {
            elTag: el.tagName,
            inBind: bindTarget.contains(el)
          });
        return null;
      }
      const slot = el.closest('.ms-stone-drop-slot') as HTMLElement | null;
      if (!slot || !bindTarget.contains(slot)) {
        if (logMiss)
          dlogStoneDnD('resolveDropSlot: no .ms-stone-drop-slot ancestor', {
            elTag: el.tagName,
            elClass: (el as HTMLElement).className
          });
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
              dlogStoneReturn('dragover → pool OK', {
                poolAttr,
                accKey: this._stoneReturnAccKey,
                types: ev.dataTransfer ? [...(ev.dataTransfer.types || [])] : []
              });
            }
            return;
          }
          dlogStoneReturn('dragover → pool mismatch', { payAttr, poolAttr, accKey: this._stoneReturnAccKey });
        }
        clearPoolReturnHighlight();
        dlogStoneReturn('dragover return: not over matching pool, skip slot highlight');
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
        dlogStoneDnD('dragover → highlight', {
          powerId: slot.dataset.powerId,
          slotIndex: slot.dataset.slotIndex,
          state: Array.from(slot.classList).filter((c) => c.startsWith('slot-'))
        });
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
      dlogStoneDnD('drop event', {
        target: ev.target instanceof Element ? ev.target.tagName + '.' + (ev.target as HTMLElement).className?.toString?.()?.slice(0, 80) : ev.target,
        pathHead: pathTags,
        dataTypes: ev.dataTransfer ? [...(ev.dataTransfer.types || [])] : [],
        mime: ev.dataTransfer?.getData(STONE_DRAG_MIME),
        plain: ev.dataTransfer?.getData('text/plain'),
        returnMime: ev.dataTransfer?.getData(STONE_RETURN_MIME),
        dialogDragAttr: this._stoneDragAttribute,
        returnAccKeyField: this._stoneReturnAccKey,
        accKeyReturnResolved: accKeyReturn,
        msLastDraggedStoneAttribute
      });

      const poolGemsDrop = (ev.target as Element)?.closest?.('.pool-gems') as HTMLElement | null;
      if (accKeyReturn) {
        ev.preventDefault();
        clearDragOver();
        if (!poolGemsDrop || !bindTarget.contains(poolGemsDrop)) {
          dlogStoneReturn('abort: Rückgabe nur auf Pool-Zeile', { accKeyReturn, hasPoolEl: !!poolGemsDrop });
          return;
        }
        const payAttr =
          this._stoneReturnPoolAttr ||
          this.#parseAccKeyPayAttr(accKeyReturn) ||
          '';
        const poolAttr = poolGemsDrop.dataset.attributeKey || '';
        dlogStoneReturn('drop auf Pool prüfen', { accKeyReturn, payAttr, poolAttr });
        if (!payAttr || poolAttr !== payAttr) {
          dlogStoneReturn('abort: falscher Pool für diesen Stein', { payAttr, poolAttr });
          return;
        }
        if (accKeyReturn.startsWith('ritual-slot:')) {
          const m = /^ritual-slot:([^:]+):(\d+)$/.exec(accKeyReturn);
          if (!m) {
            dlogStoneReturn('abort: bad ritual-slot key', { accKeyReturn });
            return;
          }
          const ritualId = m[1];
          const slotIndex = Number(m[2]);
          const entry = STONE_RITUALS_CATALOG.find((r) => r.id === ritualId);
          if (!entry || !Number.isFinite(slotIndex) || slotIndex < 0 || slotIndex >= entry.slots.length) {
            return;
          }
          const placed = this.#ritualEnsureSlots(entry);
          const stone = placed[slotIndex];
          if (!stone || stone !== payAttr) {
            dlogStoneReturn('abort: ritual slot mismatch', { stone, payAttr, slotIndex });
            return;
          }
          placed[slotIndex] = null;
          dlogStoneReturn('OK: Ritual-Stein zurück im Pool', { ritualId, slotIndex });
          await (this as any).render({ force: true });
          return;
        }
        const laneRm = this._stoneReturnLane;
        if (isGenericUnifiedAccKey(accKeyReturn)) {
          const raw = this.#stoneOccGetRaw(accKeyReturn) as GenericLaneOcc[];
          if (!raw.length || !isGenericLaneOccArray(raw)) {
            dlogStoneReturn('abort: Akku schon leer', { accKeyReturn });
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
            dlogStoneReturn('abort: Akku schon leer', { accKeyReturn });
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
        dlogStoneReturn('OK: Stein zurück im Pool (Lane entfernt)', {
          accKeyReturn,
          laneRm
        });
        this.#syncAccumulatorGems(bindTarget);
        await (this as any).render({ force: true });
        return;
      }

      const slot =
        resolveMsStoneDropSlotUnderPointer(ev, bindTarget) ?? resolveDropSlot(ev, true);
      if (!slot) {
        const doc = (ev.view?.document ?? (typeof document !== 'undefined' ? document : null)) as Document | null;
        let underStack: string[] = [];
        try {
          if (doc?.elementsFromPoint) {
            underStack = doc.elementsFromPoint(ev.clientX, ev.clientY).slice(0, 10).map((e) => {
              const h = e as HTMLElement;
              return `${h.tagName}.${(h.className?.toString?.() || '').slice(0, 72)}`;
            });
          }
        } catch {
          /* ignore */
        }
        console.warn('Mastery System | [StonePayment] Drop ohne erkanntes Ablagefeld', {
          clientX: ev.clientX,
          clientY: ev.clientY,
          elementsFromPoint: underStack
        });
        dlogStoneDnD('drop abort: kein Slot (resolveDropSlot null)', { elementsFromPoint: underStack });
        if (msLastDraggedStoneAttribute) ev.preventDefault();
        return;
      }
      ev.preventDefault();
      clearDragOver();

      const ritualIdDrop = slot.dataset.ritualId;
      if (ritualIdDrop) {
        if (!slot.classList.contains('slot-active')) {
          ui.notifications?.warn(
            'Dieses Ritual-Feld ist nicht verfügbar (kein passender Stein im Pool oder Feld schon belegt).'
          );
          return;
        }
        const idxR =
          slot.dataset.ritualSlotIndex !== undefined && slot.dataset.ritualSlotIndex !== ''
            ? Number(slot.dataset.ritualSlotIndex)
            : NaN;
        const draggedR =
          this._stoneDragAttribute ||
          ev.dataTransfer?.getData(STONE_DRAG_MIME) ||
          ev.dataTransfer?.getData('text/plain') ||
          msLastDraggedStoneAttribute ||
          '';
        const entryDrop = STONE_RITUALS_CATALOG.find((r) => r.id === ritualIdDrop);
        if (!entryDrop || !Number.isFinite(idxR) || idxR < 0 || idxR >= entryDrop.slots.length) {
          return;
        }
        const ruleDrop = entryDrop.slots[idxR];
        if (!draggedR || !ruleDrop.allow.includes(draggedR as RitualPoolAttr)) {
          ui.notifications?.warn('Falscher Stein — Attribut passt nicht zu diesem Ritual-Feld.');
          return;
        }
        if (!poolKeys.has(draggedR)) {
          ui.notifications?.warn('Dieser Stein gehört zu keinem Pool auf diesem Bogen.');
          return;
        }
        const placedDrop = this.#ritualEnsureSlots(entryDrop);
        if (placedDrop[idxR]) return;
        if (this.#spendableNetForAttr(draggedR) < 1) {
          ui.notifications?.warn('Kein freier Stein dieses Attributs im Pool.');
          return;
        }
        placedDrop[idxR] = draggedR as RitualPoolAttr;
        await (this as any).render({ force: true });
        return;
      }

      if (locked) {
        dlogStoneDnD('drop abort: stonePlanLocked');
        ui.notifications?.warn('Diese Runde ist für Stonepowers gesperrt.');
        return;
      }
      if (!slot.classList.contains('slot-active')) {
        const inactiveDiag = this.#slotInactiveDropDiag(slot);
        console.warn('Mastery System | [StonePayment] Drop abgelehnt (Feld nicht slot-active)', inactiveDiag);
        dlogStoneDnD('drop abort: Slot nicht slot-active', inactiveDiag);
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
      dlogStoneDnD('drop resolved slot', {
        powerId,
        isGeneric,
        dragged,
        slotDataset: { ...slot.dataset }
      });

      let payAttr: AttributeKey;
      if (isGeneric) {
        payAttr = dragged as AttributeKey;
        if (!powerId || !dragged) {
          dlogStoneDnD('drop abort: generic ohne powerId oder dragged', { powerId, dragged });
          return;
        }
        if (!poolKeys.has(dragged)) {
          dlogStoneDnD('drop abort: poolKeys hat dragged nicht', { dragged, poolKeys: [...poolKeys] });
          ui.notifications?.warn('Dieser Stein gehört zu keinem Pool auf diesem Bogen.');
          return;
        }
        this._generalAttrSelection[powerId] = payAttr;
      } else {
        payAttr = (slot.dataset.payAttribute || '') as AttributeKey;
        if (!powerId || !payAttr) {
          dlogStoneDnD('drop abort: Attribut-Macht ohne powerId/payAttr', { powerId, payAttr });
          return;
        }
        if (dragged !== payAttr) {
          dlogStoneDnD('drop abort: falscher Stein', { dragged, payAttr });
          ui.notifications?.warn('Falscher Stein — Attribut passt nicht zu diesem Feld.');
          return;
        }
      }

      const uses = isGeneric
        ? getGenericStonePowerUsageCount(this.actor, powerId, combat)
        : getStoneUsageCount(this.actor, payAttr, powerId, combat);
      const laneRaw = slot.dataset.laneIndex;
      const laneIndex = laneRaw !== undefined && laneRaw !== '' ? Number(laneRaw) : NaN;
      if (!Number.isFinite(laneIndex)) {
        dlogStoneDnD('drop abort: keine gültige data-lane-index', { laneRaw });
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
          dlogStoneDnD('drop abort: Lane schon belegt', { laneIndex, occ });
          return;
        }
        if (!isLaneAllowedBySegmentUnlock(occWithRampSkip(occ, powerId), laneIndex)) {
          dlogStoneDnD('drop abort: Lane durch Segment-Freigabe blockiert', { laneIndex, occ });
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
        accKey = `${powerId}:${payAttr}:${uses}`;
        occ = this.#stoneOccGet(accKey);
        if (occ.includes(laneIndex)) {
          dlogStoneDnD('drop abort: Lane schon belegt', { laneIndex, occ });
          return;
        }
        if (!isLaneAllowedBySegmentUnlock(occ, laneIndex)) {
          dlogStoneDnD('drop abort: Lane durch Segment-Freigabe blockiert', { laneIndex, occ });
          return;
        }
        const nextOcc = [...occ, laneIndex];
        this.#stoneOccSet(accKey, nextOcc);
        paid = nextOcc.length;
      }

      this.#reconcileFilledLaneClasses(bindTarget);
      this.#syncAccumulatorGems(bindTarget);
      dlogStoneDnD('drop Lane+1', { accKey, laneIndex, paid, segmentUnlock: true });
      if (DEBUG_STONE_LANES) {
        dlogStoneLanes('drop angenommen', {
          accKey,
          uses,
          laneIndex,
          occAfter: this.#stoneOccGet(accKey),
          isGeneric
        });
      }

      await (this as any).render({ force: true });
    };

    const onDelegateReturnDragStart = (ev: DragEvent) => {
      const t = ev.target as HTMLElement;
      if (!t?.classList?.contains('js-stone-returnable')) return;
      if (!allowDrag || !ev.dataTransfer || locked) {
        ev.preventDefault();
        dlogStoneReturn('dragstart blocked', { allowDrag, locked });
        return;
      }
      const accKey = t.getAttribute('data-acc-key') || t.dataset.accKey || '';
      if (!accKey) {
        ev.preventDefault();
        dlogStoneReturn('dragstart abort: keine accKey am Element');
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
      dlogStoneReturn('dragstart', {
        accKey,
        powerId: stonePowerAccKeyPowerId(accKey) ?? accKey
      });
    };

    const onDelegateReturnDragEnd = (ev: DragEvent) => {
      const t = ev.target as HTMLElement;
      if (!t?.classList?.contains('js-stone-returnable')) return;
      t.classList.remove('is-dragging');
      clearDragOver();
      lastDragOverLogKey = '';
      this.#syncPoolGemChips(bindTarget);
      const acc = this._stoneReturnAccKey;
      dlogStoneReturn('dragend', { hadAccKey: acc });
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

    /** Linksklick auf grünes Ritual-Feld: ersten passenden Stein automatisch legen. */
    const onRitualSlotClick = async (ev: MouseEvent) => {
      if (ev.button !== 0) return;
      if (!allowDrag) return;
      if (this._stonePowersMainTab !== 'rituals') return;
      const t = ev.target as HTMLElement;
      if (t.closest('.js-stone-draggable') || t.closest('.js-stone-returnable')) return;
      if (t.closest('button, a, input, select, textarea, label')) return;
      const slot = t.closest('.ms-ritual-drop-slot.slot-active') as HTMLElement | null;
      if (!slot || !bindTarget.contains(slot)) return;
      ev.preventDefault();
      ev.stopImmediatePropagation();
      const ritualId = slot.dataset.ritualId || '';
      const idxRaw = slot.dataset.ritualSlotIndex;
      const slotIndex = idxRaw !== undefined && idxRaw !== '' ? Number(idxRaw) : NaN;
      if (!ritualId || !Number.isFinite(slotIndex)) return;
      await this.#autoFillRitualSlot(ritualId, slotIndex);
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

    /** Rechtsklick: Ritual-Feld leeren (Stein freigeben) oder Kampf-Macht leeren. */
    const onPowerCardContextMenu = async (ev: MouseEvent) => {
      if (!allowDrag || locked) return;
      const t = ev.target as HTMLElement;

      if (this._stonePowersMainTab === 'rituals') {
        const rSlot = t.closest('.ms-ritual-drop-slot.slot-filled') as HTMLElement | null;
        if (rSlot && bindTarget.contains(rSlot)) {
          ev.preventDefault();
          ev.stopPropagation();
          const ritualId = rSlot.dataset.ritualId || '';
          const idxRaw = rSlot.dataset.ritualSlotIndex;
          const slotIndex = idxRaw !== undefined && idxRaw !== '' ? Number(idxRaw) : NaN;
          if (ritualId && Number.isFinite(slotIndex)) {
            this.#clearRitualSlot(ritualId, slotIndex);
            this.#reconcileFilledLaneClasses(bindTarget);
            this.#syncAccumulatorGems(bindTarget);
            await (this as any).render({ force: true });
          }
          return;
        }
      }

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
    bindTarget.addEventListener('click', onRitualSlotClick);
    bindTarget.addEventListener('click', onPowerCardClick);
    bindTarget.addEventListener('contextmenu', onPowerCardContextMenu);

    this._stoneDndCleanup = () => {
      bindTarget.removeEventListener('dragstart', onDelegateReturnDragStart, useCapture);
      bindTarget.removeEventListener('dragend', onDelegateReturnDragEnd, useCapture);
      bindTarget.removeEventListener('dragover', onBindDragOver, useCapture);
      bindTarget.removeEventListener('dragleave', onBindDragLeave);
      bindTarget.removeEventListener('drop', onBindDrop, useCapture);
      bindTarget.removeEventListener('click', onRitualSlotClick);
      bindTarget.removeEventListener('click', onPowerCardClick);
      bindTarget.removeEventListener('contextmenu', onPowerCardContextMenu);
    };
  }

  #isValidLaneSnapshotValue(accKey: string, v: unknown): v is StoneAccumulatorValue {
    if (!Array.isArray(v) || v.length === 0) return false;
    if (isGenericUnifiedAccKey(accKey)) {
      return isGenericLaneOccArray(v as StoneAccumulatorValue);
    }
    return (v as unknown[]).every((n) => typeof n === 'number' && Number.isFinite(n));
  }

  async #syncStonePowersRoundPlanWithCombat(): Promise<void> {
    const ownerDoc = (getActionEconomyActor(this.actor) ?? this.actor) as any;
    const combat = game.combat;
    let plan = ownerDoc.getFlag('mastery-system', STONE_POWERS_ROUND_PLAN_FLAG) as
      | StonePowersRoundPlanStored
      | undefined
      | null;

    // Nur bei **aktivem** Kampf verwerfen, wenn Encounter/Runde nicht mehr zum gespeicherten Plan passen.
    // Ohne Kampf: Plan behalten (z. B. Sheet zwischen Szenen) — früheres `!combat` hat den Plan gelöscht und nie wieder geladen.
    if (
      plan &&
      combat &&
      (String(plan.combatId) !== String(combat.id) || plan.round !== combat.round)
    ) {
      try {
        await ownerDoc.unsetFlag('mastery-system', STONE_POWERS_ROUND_PLAN_FLAG);
      } catch (e) {
        console.warn('Mastery System | Could not clear stale stone round plan', e);
      }
      plan = undefined;
      this._stoneRoundPlanHydratedKey = null;
      this.#clearSessionStoneLanesForOwner();
    }

    if (!plan?.lanes?.length) return;

    const hydrateKey = `${plan.combatId}\0${plan.round}`;
    if (this._stoneRoundPlanHydratedKey === hydrateKey) return;

    const aid = this.#stoneLaneOwnerActorId();
    if (!aid) return;

    const prefix = `${aid}\0`;
    for (const k of [...StonePowersDialog._sessionStoneLanes.keys()]) {
      if (k.startsWith(prefix)) StonePowersDialog._sessionStoneLanes.delete(k);
    }

    const dup = (foundry as any).utils?.duplicate as ((x: unknown) => unknown) | undefined;
    for (const row of plan.lanes) {
      if (!row?.accKey) continue;
      const raw = dup ? dup(row.value) : JSON.parse(JSON.stringify(row.value));
      if (!this.#isValidLaneSnapshotValue(row.accKey, raw)) continue;
      StonePowersDialog._sessionStoneLanes.set(`${aid}\0${row.accKey}`, raw as StoneAccumulatorValue);
    }

    this._stoneDropAccumulators.clear();
    this.#pullSessionPartialsIntoInstance();
    this._stoneRoundPlanHydratedKey = hydrateKey;
  }

  async #persistStonePowersRoundPlan(): Promise<void> {
    const combat = game.combat;
    if (!combat) {
      ui.notifications?.warn('Kein aktiver Kampf — Steinplan kann nicht gespeichert werden.');
      return;
    }
    if (!this.combatant) {
      ui.notifications?.warn('Figur nicht im Initiative-Tracker — Steinplan kann nicht zugeordnet werden.');
      return;
    }
    this.#pullSessionPartialsIntoInstance();
    const ownerDoc = (getActionEconomyActor(this.actor) ?? this.actor) as any;
    const aid = this.#stoneLaneOwnerActorId();
    if (!aid) return;

    const prefix = `${aid}\0`;
    const lanes: { accKey: string; value: StoneAccumulatorValue }[] = [];
    const dup = (foundry as any).utils?.duplicate as ((x: unknown) => unknown) | undefined;

    for (const [composite, val] of StonePowersDialog._sessionStoneLanes) {
      if (!composite.startsWith(prefix)) continue;
      if (!val || !Array.isArray(val) || val.length === 0) continue;
      const accKey = composite.slice(prefix.length);
      const cloned = (dup ? dup(val) : JSON.parse(JSON.stringify(val))) as StoneAccumulatorValue;
      lanes.push({ accKey, value: cloned });
    }

    await ownerDoc.setFlag('mastery-system', STONE_POWERS_ROUND_PLAN_FLAG, {
      combatId: combat.id,
      round: combat.round,
      lanes
    } as any);

    ui.notifications?.info(`Steinplan für Runde ${combat.round} gespeichert.`);
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
    this.#pullSessionPartialsIntoInstance();
    await this.#flushCompletedStonePaymentsFromAccumulators();
    this.#clearSessionStoneLanesForOwner();
    this._stoneDragAttribute = null;
    this._stoneReturnAccKey = null;
    this._stoneDndCleanup?.();
    this._stoneDndCleanup = undefined;
    if (this.resolve) {
      this.resolve(false);
      this.resolve = undefined;
    }
    return super._onClose(_options);
  }
}
