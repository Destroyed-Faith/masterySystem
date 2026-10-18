/**
 * Stone Powers Dialog — Steine pro Macht in Rank-Segmenten verteilen
 * (Normal 1→2→4→8, Premium 2→4→6→8).
 * Placing Stones only plans. Confirm Stone Assignment pays, applies automatic powers, then walks the resolution queue.
 */

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

// Type workaround for Mixin
const BaseDialog = HandlebarsApplicationMixin(ApplicationV2) as typeof ApplicationV2;

type AttributeKey = 'might' | 'agility' | 'vitality' | 'intellect' | 'resolve' | 'influence' | 'wits';

import {
  STONE_POWERS,
  getAvailableStonePowers,
  activateStonePower,
  activateGenericStonePowerMixed
} from './stone-activation.js';
import {
  STONE_RESOLUTION_QUEUE_FLAG,
  enqueueStoneResolutions,
  markStoneResolutionResolved,
  pendingStoneResolutions,
  readStoneResolutionQueue,
  stoneResolutionKind,
  type PlannedStonePower,
  type StoneResolutionQueue,
} from './stone-resolution.js';
import { presentStoneResolution } from './stone-resolution-ui.js';
import {
  STONE_POWERS_BY_ATTRIBUTE,
  STONE_POWER_SUPPORT_TIER_SHIFT,
  STONE_TIER_HARD_MAX,
  resolveStonePowerId,
  isPremiumStonePower,
  isRetiredStonePower,
  RETIRED_STONE_POWER_MESSAGE,
  effectiveStoneSupportPrefillTier,
  stonePowerRankCost,
  stonePowerSegmentSizes,
  stonePaymentLaneCount,
  stonePaymentLanesForTier,
  stoneSupportPrefillLanes,
  completeStoneRankPayment,
  partitionStoneLanesByCompleteRanks,
  type CompleteStoneRankPayment,
  type StonePower,
  orderWitsDialogColumn,
} from './stone-powers.js';
import {
  getStoneUsageCount,
  getGenericStonePowerUsageCount,
  calculateStoneCost,
  getStonePool,
  setStonePool,
  getRoundState,
  setRoundState,
  isStonePowersConfigurationLocked,
  clearStonePowersConfigurationLock,
  clearCombatStoneTurnBonusesForActor,
  getActionEconomyActor
} from '../combat/action-economy.js';
import { isStonePowersDone } from '../combat/stone-round-gate.js';
import { actorHasSurprise } from '../combat/surprise.js';
import {
  INITIATIVE_ROLLED_FLAG,
  formatInitiativeArmorPenaltyLine,
  formatInitiativeDiceRollLine,
  formatInitiativeExchangeSummary,
  formatSignedInitiativeModifier,
  pcNeedsManualInitiativeRoll,
  releasePcInitiativeRoll,
} from '../combat/initiative-roll.js';
import { getEquippedEquipmentInitiativeModifier } from '../utils/equipment-modifiers.js';
import { getStoneGemStyle } from '../utils/stone-attribute-ui.js';
import {
  assignLaterColorlessRecovery,
  colorlessRecoveryPreparationOpen,
  colorlessRecoverySpec,
  commitColorlessRecovery,
  designatedExhaustedColorlessIds,
  listColorlessStones,
  readColorlessRecovery,
  syncColorlessStoneLedger,
} from './colorless-recovery.js';
import {
  COLORLESS_GEM_STYLE,
  COLORLESS_STONE_ATTR,
  colorlessStoneInitiativeCost,
  addInitiativeColorlessStones,
  convertInitiativeToColorlessStones,
  getExhaustedInitiativeColorlessStones,
  getInitiativeColorlessTotal,
  getItemColorlessStones,
  getMasteryRank,
  getPermanentColorlessStones,
  getSpendableColorlessStones,
  isInitiativeBoostUsedThisCombat,
  isOncePerCombatPowerUsed,
  initiativeBoostAmount,
  maxConvertibleColorlessStones,
} from './colorless-stones.js';
import {
  PREPARATION_PHASE_FLAG,
  applyInitiativeBoost,
  confirmPreparationAssignment,
  initiativeBoostRankCost,
  planInitiativeExchange,
  preparationStep,
  readPreparationPhase,
  reconcilePreparationPhase,
  reopenPreparationAssignment,
  skipInitiativeBoost,
  type PreparationPhaseState,
} from './preparation-phase.js';
import {
  computeRemoveScarPayment,
  getRemoveScarResolvedMaxTier,
  inferRemoveScarTargetTier,
  payAndApplyRemoveScar,
  REMOVE_SCAR_POWER_ID,
} from './remove-scar.js';
import {
  STONE_HELP_TRACKS,
  STONE_POWERS_HELP_COUNT,
  STONE_POWERS_HELP_SCREENS,
  clampStoneHelpPage,
  stoneHelpTrackForPage,
} from './stone-powers-help.js';
import {
  formatPendingStoneActivationWarning,
  orderPowersRampFirst,
  pendingStoneActivation,
  pendingStoneActivationLabel,
  pickStoneFillAttribute,
  shouldSettleStoneWave,
  stonePowerAllowsColorless,
  stonePowerColorlessRejectMessage,
  stoneDialogSectionStartsOpen,
  stonePoolBlockedReason,
  stonePowerActivationRing,
  type PendingStoneActivation,
} from './stone-payment-rules.js';
import {
  clampStoneRecoveryAllocation,
  planStoneRecovery,
  type StoneRecoveryPoolInput,
} from './stone-recovery.js';
import {
  isPassivesReviewedThisEncounter,
  isStoneRegenDone,
  persistCombatantSetupStep,
  readCombatantSetupStep,
} from '../combat/encounter-setup-flags.js';
import {
  canEditEncounterPassives,
  getAvailablePassives,
  getPassiveSlots,
  getPendingPassiveSwaps,
  passiveSlotsHaveOpenChoice,
} from '../powers/passives.js';
import {
  debugPoolSpendableSnapshot,
  poolSpendableStones,
} from '../utils/artifact-actor-rules.js';
import {
  allowStonePowersAutoOpen,
  dismissStonePowersPrompt,
  logStonePowersGate,
  stonePowersReopenBlocked,
} from '../combat/stone-powers-session.js';
import { listAttrStoneReadyViews } from './stone-ready.js';
import { getRulesMasteryRank } from '../utils/mastery-rank-sync.js';
import {
  getArtifactStoneFunctionStatus,
  getArtifactStoneSupportPrefill,
} from '../utils/artifact-stone-functions.js';
import { refreshRadialMenuActionLabelsIfOpenForActor } from '../token-radial-menu.js';
import {
  actorMasteryRank,
  changeNaturalRecoveryAllocation,
  confirmNaturalRecoveryAllocations,
  ensureAutoNaturalRecoveryForSingleEffect,
  listNaturalRecoveryOptions,
  matchingNaturalRecoveryChoice,
  naturalRecoveryAllocatedTotal,
  setNaturalRecoverySkipped,
} from '../combat/special-application.js';

const STONE_DRAG_MIME = 'application/x-mastery-stone-attribute';
const STONE_RETURN_MIME = 'application/x-mastery-stone-return-acc';

/** Payment-Lane geometry per Ability: Normal 1+2+4+8 (15), Premium 2+4+6+8 (20). */
function stoneLaneCountForPower(powerId: string): number {
  return stonePaymentLaneCount(powerId);
}

/** Segment-Index (Rank − 1) für eine Lane dieser Ability. */
function segmentIndexForLane(powerId: string, laneIndex: number): number {
  const sizes = stonePowerSegmentSizes(powerId);
  let acc = 0;
  for (let s = 0; s < sizes.length; s += 1) {
    acc += sizes[s] ?? 0;
    if (laneIndex < acc) return s;
  }
  return sizes.length - 1;
}

/** Lane-Indizes pro Segment (Segment s = Rank s + 1). */
function lanesInStonePaymentSegment(powerId: string, segmentIndex: number): number[] {
  return stonePaymentLanesForTier(powerId, segmentIndex + 1);
}

/** Segment vollständig belegt (Voraussetzung für das nächste Segment). */
function isStoneSegmentComplete(powerId: string, o: Set<number>, seg: number): boolean {
  const lanes = lanesInStonePaymentSegment(powerId, seg);
  return lanes.length > 0 && lanes.every((l) => o.has(l));
}

/** Leere Lane darf einen Stein annehmen (Segment-Freigabe Rank 1 → 2 → 3 → 4). */
function isLaneAllowedBySegmentUnlock(powerId: string, occupied: number[], laneIndex: number): boolean {
  if (laneIndex < 0 || laneIndex >= stoneLaneCountForPower(powerId)) return false;
  const o = new Set(occupied);
  if (o.has(laneIndex)) return false;
  const seg = segmentIndexForLane(powerId, laneIndex);
  for (let s = 0; s < seg; s++) {
    if (!isStoneSegmentComplete(powerId, o, s)) return false;
  }
  return true;
}

/** Alle leeren Lanes, die aktuell dropfähig sind. */
function allowedSegmentDropLanes(powerId: string, occupied: number[]): Set<number> {
  const set = new Set<number>();
  for (let l = 0; l < stoneLaneCountForPower(powerId); l++) {
    if (isLaneAllowedBySegmentUnlock(powerId, occupied, l)) set.add(l);
  }
  return set;
}

/**
 * Niedrigstes Segment mit freien Lanes, sobald alle vorherigen Segmente voll sind.
 * Ein Linksklick füllt nur dieses Segment (teilweise, wenn der Pool nicht reicht).
 */
function nextStoneSegmentToFill(powerId: string, occupied: number[]): number | null {
  const o = new Set(occupied);
  for (let seg = 0; seg <= 3; seg++) {
    if (isStoneSegmentComplete(powerId, o, seg)) continue;
    for (let s = 0; s < seg; s++) {
      if (!isStoneSegmentComplete(powerId, o, s)) return null;
    }
    return seg;
  }
  return null;
}

function pendingStoneCardFields(name: string, placed: number, needed: number): {
  pendingActivation: boolean;
  waveReady: boolean;
  pendingLabel: string;
  pendingRow: PendingStoneActivation | null;
} {
  const row = pendingStoneActivation({ name, placed, needed });
  return {
    pendingActivation: !!row,
    waveReady: placed > 0 && needed > 0 && placed >= needed,
    pendingLabel: row ? pendingStoneActivationLabel(row) : '',
    pendingRow: row,
  };
}

/** Visible Rank line on the card, e.g. "Rank 2: +2 Attack Actions". */
function stoneCardRankCaption(
  tiers: readonly { label?: string }[] | undefined,
  tier: number,
): string {
  if (tier < 1) return '';
  const label = tiers?.[tier - 1]?.label;
  return label ? `Rank ${tier}: ${label}` : `Rank ${tier}`;
}

/**
 * What the card should say before Apply. A full multi-rank pile (Extra Attack
 * with 6 stones) is Rank 2, not an incomplete wave and not a silent no-op.
 * Review mode shows the Rank already recorded on the actor.
 */
function describeStoneCardRank(args: {
  id: string;
  name: string;
  tiers?: readonly { label?: string }[];
  placed: number;
  usesBefore: number;
  prefillRank: number;
  liveUses: number;
  review: boolean;
}): {
  rankCaption: string;
  pendingActivation: boolean;
  pendingLabel: string;
  pendingRow: PendingStoneActivation | null;
  waveReady: boolean;
} {
  const empty = {
    rankCaption: '',
    pendingActivation: false,
    pendingLabel: '',
    pendingRow: null as PendingStoneActivation | null,
    waveReady: false,
  };
  if (args.review && args.liveUses > 0) {
    return {
      ...empty,
      rankCaption: stoneCardRankCaption(args.tiers, Math.min(STONE_TIER_HARD_MAX, args.liveUses)),
      waveReady: true,
    };
  }
  const payment = completeStoneRankPayment(args.id, args.placed, args.usesBefore, args.prefillRank);
  if (!payment) return empty;
  const leftover = args.placed - payment.spendCount;
  const nextNeeded = stonePowerRankCost(args.id, payment.tier + 1);
  const row =
    leftover > 0
      ? pendingStoneActivation({ name: args.name, placed: leftover, needed: nextNeeded })
      : null;
  return {
    rankCaption: stoneCardRankCaption(args.tiers, payment.tier),
    pendingActivation: !!row,
    pendingLabel: row ? pendingStoneActivationLabel(row) : '',
    pendingRow: row,
    waveReady: true,
  };
}

function stonePowerCardVisuals(
  name: string,
  placed: number,
  needed: number,
  liveUses: number,
): ReturnType<typeof stonePowerActivationRing> & ReturnType<typeof pendingStoneCardFields> {
  const ring = stonePowerActivationRing(liveUses);
  const pending = pendingStoneCardFields(name, placed, needed);
  return {
    ...ring,
    ...pending,
    activated: ring.activated || pending.waveReady,
  };
}

/**
 * Occupied lanes augmented with the Support-prefilled Rank's lanes (for
 * segment-unlock only): the pre-filled Rank costs nothing, so its lanes
 * count as full when unlocking the Ranks above it.
 */
function occWithPrefill(occupied: number[], powerId: string, prefillRank: number): number[] {
  const lanes = prefillRank > 0 ? lanesInStonePaymentSegment(powerId, prefillRank - 1) : [];
  return lanes.length ? [...occupied, ...lanes] : occupied;
}

/** Fallback wenn getData im Drop leer bleibt (z. B. Chromium/Foundry) */
let msLastDraggedStoneAttribute = '';

/** Mittelteil im Akku-Schlüssel: General Powers mit Steinen aus mehreren Attribut-Pools. */
const STONE_GENERIC_UNIFIED_MARKER = 'msGenMulti';

type GenericLaneOcc = { lane: number; attr: string };

type PayLane = { lane: number; attr: string };

/** Lane rows the settlement can split by Rank. Number lists belong to one attribute. */
function payLanesFromAccumulator(raw: StoneAccumulatorValue, fallbackAttr: string): PayLane[] | null {
  if (!raw.length) return null;
  if (isGenericLaneOccArray(raw)) {
    return raw.map((row) => ({ lane: row.lane, attr: String(row.attr || '') }));
  }
  if (raw.every((n) => typeof n === 'number' && Number.isFinite(n))) {
    return (raw as number[]).map((lane) => ({ lane, attr: fallbackAttr }));
  }
  return null;
}

type StoneAccumulatorValue = number[] | GenericLaneOcc[];

/** Confirmed assignment for this combat/round — reopen shows it locked. */
const STONE_POWERS_ROUND_PLAN_FLAG = 'stonePowersRoundPlan';

interface StonePowersLaneSnapshot {
  accKey: string;
  value: StoneAccumulatorValue;
}

interface StonePowersRoundPlanStored {
  combatId: string;
  round: number;
  /** Still open (partially filled) waves — editable when the dialog reopens. */
  lanes: StonePowersLaneSnapshot[];
  /** Already paid waves — shown for review, never charged again. */
  receipt?: StonePowersLaneSnapshot[];
}

function encounterStoneRound(combat: Combat | null | undefined): number {
  return Math.max(1, Number(combat?.round) || 1);
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

function stonesPaidInLane(accKey: string, value: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!Array.isArray(value) || value.length === 0) return out;
  const first = value[0];
  if (first && typeof first === 'object') {
    for (const occ of value as GenericLaneOcc[]) {
      const attr = String(occ?.attr || '');
      if (!attr) continue;
      out[attr] = (out[attr] || 0) + 1;
    }
    return out;
  }
  const attr = parseStonePowerAccKey(accKey)?.middle || '';
  if (!attr) return out;
  out[attr] = value.length;
  return out;
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

function cloneLaneValue(value: StoneAccumulatorValue): StoneAccumulatorValue {
  const dup = (foundry as any)?.utils?.duplicate as ((x: unknown) => unknown) | undefined;
  return (dup ? dup(value) : JSON.parse(JSON.stringify(value))) as StoneAccumulatorValue;
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
  'influence',
  'wits',
];

/** Pools shown in the dialog (core six + Wits when the actor has a wits pool). */
const POOL_DISPLAY_ATTRS: AttributeKey[] = [...ALL_STONE_ATTRS];

type StoneDialogPoolKey = AttributeKey | 'wits' | typeof COLORLESS_STONE_ATTR;

type StoneDialogPoolRow = {
  key: StoneDialogPoolKey;
  name: string;
  current: number;
  max: number;
  sustained: number;
  /** Sealed (Rituals) + Burned (until Safe Haven Rest) — no regen space. */
  sealedBurned: number;
  artifactBound: number;
  available: number;
  gemStyle: { fill: string; stroke: string };
  gemSlots: Array<{ index: number }>;
  boundSlots: Array<{ index: number }>;
  blocked: boolean;
  blockedReason: string;
  /** Extra line under the gems (Colorless source breakdown). */
  note?: string;
  /** Stone Recovery controls (+ recovers, − marks as spent). */
  recoverShow?: boolean;
  recoverAlloc?: number;
  recoverAllocLabel?: string;
  recoverSpace?: number;
  recoverCanAdd?: boolean;
  recoverCanRemove?: boolean;
  /** GM override: directly add / take away Ready stones (always visible for the GM). */
  gmAdjustShow?: boolean;
  gmAdjustCanAdd?: boolean;
  gmAdjustCanRemove?: boolean;
  gmAdjustLabel?: string;
};

/** Summary of the recovery step rendered above the power matrix. */
type StoneRecoveryContext = {
  active: boolean;
  points: number;
  allocated: number;
  remaining: number;
  saturated: boolean;
  canFinish: boolean;
  colorlessChoices?: Array<{ id: string; label: string; picked: boolean; canPick: boolean }>;
};

const STONE_RECOVERY_INACTIVE: StoneRecoveryContext = {
  active: false,
  points: 0,
  allocated: 0,
  remaining: 0,
  saturated: false,
  canFinish: true,
  colorlessChoices: [],
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

type DropSlotState = 'done' | 'filled' | 'active' | 'locked' | 'support' | 'empty';

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
 * Gold Artifact Support Stone lanes for this wave. Shown on the first unpaid
 * activation so players can see the prefill and cannot drop into those slots.
 * After the wave is used, the next climb is a normal paid segment.
 */
function buildSupportLaneSet(
  prefillTier: number,
  usesThisTurn: number,
  powerId?: string,
): Set<number> | undefined {
  const rank = effectiveStoneSupportPrefillTier(powerId ?? '', prefillTier);
  if (rank <= 0 || usesThisTurn >= rank) return undefined;
  const lanes = stoneSupportPrefillLanes(powerId ?? '', prefillTier);
  return lanes.length ? new Set(lanes) : undefined;
}

/**
 * Additional cost of the next wave (Rank = usesThisTurn + 1) for this
 * Ability. The Support-prefilled Rank costs 0; Rank 5+ does not exist.
 */
function nextStoneWaveCost(powerId: string, usesThisTurn: number, prefillTier = 0): number {
  const rank = Math.max(0, Math.floor(Number(usesThisTurn) || 0)) + 1;
  if (rank > STONE_TIER_HARD_MAX) return 0;
  const prefill = effectiveStoneSupportPrefillTier(powerId, prefillTier);
  if (prefill === rank) return 0;
  return stonePowerRankCost(powerId, rank);
}

/**
 * UI/Drop: Segment-Freigabe — erst Anchor (1), nach Stein die beiden Mitten (2), dann Quad (4), dann Oct (8).
 * Innerhalb eines freigeschalteten Segments beliebige leere Lane; Reihenfolge innerhalb Mid/Quad/Oct frei.
 */
function buildStonePaymentLanes(
  powerId: string,
  usesThisTurn: number,
  spendableNet: number,
  planLocked: boolean,
  occupied: number[],
  debugLabel?: string,
  supportLanes?: Set<number>,
): {
  paymentAnchor: StonePayLaneCell[];
  paymentMid: StonePayLaneCell[];
  paymentQuad: StonePayLaneCell[];
  paymentOct: StonePayLaneCell[];
} {
  void debugLabel;
  const o = new Set(occupied);
  // The Support-prefilled Rank costs nothing: its lanes count as full when
  // unlocking the Ranks above it, but are never payable by the player.
  const allowed = allowedSegmentDropLanes(
    powerId,
    supportLanes?.size ? [...occupied, ...supportLanes] : occupied
  );

  const laneState = (laneIndex: number): DropSlotState => {
    if (laneIndex < 0 || laneIndex >= stoneLaneCountForPower(powerId)) return 'locked';
    if (o.has(laneIndex)) return 'filled';
    // Artifact "Stone Power Support" pre-fills exactly one Rank with Artifact
    // Support Stones (free, artifact-provided). Purely visual: not in the
    // `occupied` player set, so they never participate in settle.
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

  const segmentCells = (seg: number): StonePayLaneCell[] =>
    lanesInStonePaymentSegment(powerId, seg).map((lane) => cell(lane));

  return {
    paymentAnchor: segmentCells(0),
    paymentMid: segmentCells(1),
    paymentQuad: segmentCells(2),
    paymentOct: segmentCells(3),
  };
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
  /** Avoid re-hydrating the confirmed plan over in-progress edits on every render. */
  private _stoneRoundPlanHydratedKey: string | null = null;
  /** Stones already confirmed this round — show assignment, do not spend again. */
  private _stoneReviewMode = false;
  /** Interactive powers staged by the confirm that is currently paying. */
  private _resolutionBatch: PlannedStonePower[] = [];
  /** Free support ranks the player accepted while planning. Spent only on confirm. */
  private _plannedFreeRankIds = new Set<string>();
  private _resolutionRunning = false;
  /** Stops a cancelled resolution dialog from opening again on the next render. */
  private _resolutionResumeStarted = false;
  /** Waves paid in this combat round: displayed, never charged again. */
  private _stonePaidLanes = new Map<string, StoneAccumulatorValue>();
  /** True while a render triggered from `_onRender` is still pending. */
  private _stoneRenderQueued = false;
  /**
   * Scroll vor dem Re-Render. Fenster (`.window-content`) und die innere
   * Dialogfläche scrollen getrennt — nur eine davon zu merken setzt die
   * Ansicht auf Damage Reduction bzw. die erste offene Attribut-Sektion.
   */
  private _stoneScroll = { content: 0, dialog: 0, frame: 0 };
  /** Stone Recovery (round 2+): stones the player takes back, per pool. */
  private _recoveryAlloc: Record<string, number> = {};
  private _recoveryColorlessIds: string[] = [];
  private _crRank = 1;
  private _crPicked: string[] = [];
  /** Round the current recovery belongs to — a new round starts from scratch. */
  private _recoveryRound = 0;
  /** Recovery still open: the power matrix below stays locked. */
  private _recoveryActive = false;
  /** Guard against a second click while the recovery is being written. */
  private _recoveryCommitting = false;
  /** Stones staged for the Initiative Exchange (the convert button spends them). */
  private _colorlessConvertCount: number | null = null;
  /** Player toggles for attribute / General sections in this dialog session. */
  private _sectionOpenOverride: Record<string, boolean> = {};
  /** Removes the Help overlay key listener (Escape / arrows). */
  private _helpKeyCleanup?: () => void;

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
   * Show stone powers dialog for an actor.
   * Pass `{ explicit: true }` for sheet/carousel/button opens so ✕-dismiss does not block.
   * Auto resume / encounter pipeline must omit that flag.
   */
  static async showForActor(
    actor: Actor,
    combatant?: Combatant | null,
    opts?: { explicit?: boolean },
  ): Promise<boolean> {
    if (opts?.explicit) {
      allowStonePowersAutoOpen();
    } else if (stonePowersReopenBlocked()) {
      logStonePowersGate('showForActor-blocked', {
        actorId: (actor as { id?: string }).id,
        explicit: false,
      });
      return false;
    }

    // Never stack a second instance — especially not while one is still closing.
    try {
      const existing = (foundry as any)?.applications?.instances?.get?.('mastery-stone-powers');
      if (existing) {
        const closing =
          !!(existing as any).closing || !!(existing as any).state?.closing;
        const gone = (existing as any).rendered === false;
        if (!closing && !gone) {
          try {
            existing.bringToFront?.();
          } catch {
            /* ignore */
          }
          logStonePowersGate('showForActor-reuse-open', {
            actorId: (actor as { id?: string }).id,
          });
          return false;
        }
        if (opts?.explicit) {
          // Explicit open (carousel name / sheet button): a stale or closing
          // instance must not swallow the click — wait for it, then open fresh.
          if (closing) {
            for (let i = 0; i < 20 && (foundry as any)?.applications?.instances?.get?.('mastery-stone-powers'); i++) {
              await new Promise((r) => setTimeout(r, 50));
            }
          }
          logStonePowersGate('showForActor-explicit-after-stale', {
            actorId: (actor as { id?: string }).id,
          });
        } else {
          dismissStonePowersPrompt(game.combat, actor, combatant ?? null);
          logStonePowersGate('showForActor-blocked-closing', {
            actorId: (actor as { id?: string }).id,
          });
          return false;
        }
      }
    } catch {
      /* ignore */
    }

    // Sync caps / out-of-combat refill. In combat this must NOT restore spent
    // stones — Round 2+ Stone Recovery (Mastery Rank) owns mid-fight regen.
    try {
      const { alignStonePoolsToAuditReady } = await import('./stone-ready.js');
      await alignStonePoolsToAuditReady(actor);
    } catch (err) {
      console.warn('Mastery System | alignStonePoolsToAuditReady on open failed', err);
    }
    try {
      const combat = (game as any).combat;
      // Prepare phase included: Round-1 stones are bought there.
      if (combat?.id) {
        const { ensureStoneCombatReady } = await import('./stone-combat-ledger.js');
        await ensureStoneCombatReady(actor, combat);
      }
    } catch (err) {
      console.warn('Mastery System | ensureStoneCombatReady on open failed', err);
    }

    try {
      const { ensureDefaultPassiveSlots } = await import('../powers/passives.js');
      await ensureDefaultPassiveSlots(actor);
      const combat = (game as any).combat;
      const actorId = String((actor as { id?: string }).id ?? '');
      const round = Math.max(1, Number(combat?.round) || 1);
      if (combat && actorId && round <= 1) {
        const { handlePassiveSelectionComplete } = await import('../combat/encounter-start.js');
        await handlePassiveSelectionComplete(combat, actorId, {});
      }
    } catch (err) {
      console.warn('Mastery System | Could not apply default passives before Stone Powers', err);
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
    this.#rememberStonePowersScroll();

    const combat = game.combat;
    const combatActive = !!combat;
    const combatStarted = !!(combat as any)?.started;
    if (!this.combatant && combat) {
      this.combatant = resolveStonePowersCombatant(this.actor, combat);
    }
    this._stoneReviewMode = this.#isStoneAssignmentReviewMode();
    await this.#syncStonePowersRoundPlanWithCombat();
    this.#pullSessionPartialsIntoInstance();
    // Player + exactly one Special → auto-fill Natural Recovery (visible, no click).
    if (combat && String((this.actor as any)?.type || '') === 'character') {
      try {
        await ensureAutoNaturalRecoveryForSingleEffect(this.actor, combat);
      } catch (err) {
        console.warn('Mastery System | auto Natural Recovery skipped', err);
      }
    }

    const poolOwner = getActionEconomyActor(this.actor) ?? this.actor;
    const system = (poolOwner as any).system;
    try {
      await syncColorlessStoneLedger(poolOwner);
    } catch {
      /* ledger is optional until Colorless Stones exist */
    }

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
        const printed = Math.min(STONE_TIER_HARD_MAX, Math.max(0, s.value + shift));
        const tier = effectiveStoneSupportPrefillTier(resolvedId, printed);
        if (!best || tier > best.tier) best = { tier, source: s.source };
      }
      return best;
    };
    const availablePowers = getAvailableStonePowers(this.actor);

    // Available Stones = live pool.current (spent this fight), capped by Audit
    // readyExpected. Round 2+ Stone Recovery puts Mastery Rank stones back here.
    const readyViews = listAttrStoneReadyViews(this.actor);
    const lifetimeStoneMode = readyViews.some((v) => v.lifetimeStoneMode);

    const pools: StoneDialogPoolRow[] = readyViews.map((view) => {
      const attr = view.key as AttributeKey;
      const sealedBurned = view.sealed + view.burned;
      const spendable = poolSpendableStones(this.actor, attr);
      const reserved = this.#reservedStonesInDialogForAttr(attr);
      const poolDisplay = Math.max(0, spendable - reserved);
      const gemStyle = getStoneGemStyle(attr) ?? { fill: '#888888', stroke: '#aaaaaa' };
      const gemSlots = Array.from({ length: poolDisplay }, (_, i) => ({ index: i }));
      const blockedReason = stonePoolBlockedReason({
        max: view.max,
        available: poolDisplay,
        sustained: Math.max(view.sustained, view.summonBound),
        artifactBound: 0,
        sealedBurned,
        current: spendable,
        lifetimeStoneMode: view.lifetimeStoneMode,
      });

      return {
        key: attr,
        name: poolDisplayName(attr),
        current: spendable,
        max: view.max,
        sustained: Math.max(view.sustained, view.summonBound),
        sealedBurned,
        artifactBound: 0,
        available: spendable,
        gemStyle,
        gemSlots,
        boundSlots: [],
        blocked: !!blockedReason,
        blockedReason,
      };
    });

    if (!(this as any)._loggedAvailableSnapshot) {
      (this as any)._loggedAvailableSnapshot = true;
      try {
        console.log('Mastery Stones | Available = live current ∩ Audit readyExpected', {
          dialogActor: {
            id: (this.actor as any)?.id,
            name: (this.actor as any)?.name,
            isToken: !!(this.actor as any)?.isToken,
          },
          poolOwner: {
            id: (poolOwner as any)?.id,
            name: (poolOwner as any)?.name,
            isToken: !!(poolOwner as any)?.isToken,
          },
          lifetimeStoneMode,
          views: readyViews,
          reservedByAttr: Object.fromEntries(
            readyViews.map((v) => [v.key, this.#reservedStonesInDialogForAttr(v.key)]),
          ),
          debug: POOL_DISPLAY_ATTRS.map((a) => debugPoolSpendableSnapshot(this.actor, a)),
        });
      } catch (err) {
        console.warn('Mastery Stones | Available snapshot failed', err);
      }
    }

    // One combat Colorless Pool: item-granted pile + Initiative Colorless
    // (this combat) + Permanent Colorless. Gems show Ready stones; Exhausted
    // Permanent / Initiative Colorless come back through Stone Recovery.
    const colorless = this.#colorlessPoolSnapshot();
    const colorlessHave = colorless.spendable;
    const colorlessReserved = this.#reservedStonesInDialogForAttr(COLORLESS_STONE_ATTR);
    const colorlessDisplay = Math.max(0, colorlessHave - colorlessReserved);
    const colorlessNoteParts: string[] = [];
    if (colorless.perm.max > 0) {
      colorlessNoteParts.push(`${colorless.perm.current}/${colorless.perm.max} Permanent`);
    }
    if (colorless.initTotal > 0) {
      colorlessNoteParts.push(
        `${colorless.initReady}/${colorless.initTotal} Initiative — gone when combat ends`,
      );
    }
    if (colorless.item > 0) colorlessNoteParts.push(`${colorless.item} granted`);
    pools.push({
      key: COLORLESS_STONE_ATTR,
      name: 'Colorless',
      current: colorlessHave,
      max: colorless.max,
      sustained: 0,
      sealedBurned: colorless.permReserved,
      artifactBound: 0,
      available: colorlessHave,
      gemStyle: COLORLESS_GEM_STYLE,
      gemSlots: Array.from({ length: colorlessDisplay }, (_, i) => ({ index: i })),
      boundSlots: [],
      blocked: colorlessDisplay <= 0,
      blockedReason: colorlessDisplay > 0 ? '' : 'Convert Initiative to get Colorless Stones',
      note: colorlessNoteParts.join(' · '),
    });

    const combatMissingFromTracker = combatActive && !this.combatant;
    const hasCombat = combatActive && !!this.combatant;
    const stoneReviewMode = this.#isStoneAssignmentReviewMode();
    this._stoneReviewMode = stoneReviewMode;
    const stoneResolutionHold = this.#stoneResolutionPending();
    const stonePlanLocked = this.#isStoneDialogLocked();

    const recovery = this.#buildStoneRecovery(combat, pools);
    this._recoveryActive = recovery.active;
    this.#buildGmPoolAdjust(pools);

    let showStonePools = true;
    const dragPoolEnabled = !stonePlanLocked && !recovery.active && !stoneResolutionHold;
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
      const retired = isRetiredStonePower(power.id);
    const isRemoveScar = power.id === REMOVE_SCAR_POWER_ID;
      const liveUses = isRemoveScar
        ? getRemoveScarResolvedMaxTier(this.actor)
        : getStoneUsageCount(this.actor, attrKey, power.id, combat);
      const usesThisTurn = this._stoneReviewMode && liveUses > 0 ? liveUses - 1 : liveUses;
      const support = supportForPower(power.id, attrKey);
      const supportTier = support?.tier ?? 0;
      const removeScarPayment = isRemoveScar
        ? computeRemoveScarPayment(
            liveUses,
            inferRemoveScarTargetTier(liveUses, supportTier),
            supportTier,
          )
        : null;
      const waveCost = nextStoneWaveCost(power.id, usesThisTurn, supportTier);
      const tierCapped = !removeScarPayment && usesThisTurn >= STONE_TIER_HARD_MAX;
      const nextCost = removeScarPayment ? removeScarPayment.sealCost : waveCost;
      const pool = getStonePool(this.actor, attrKey);
      const removeScarOpen =
        !removeScarPayment ||
        removeScarPayment.sealCost > 0 ||
        removeScarPayment.barsRecovered > 0;
      const oncePerCombatUsed =
        !!power.oncePerCombat &&
        isOncePerCombatPowerUsed(this.combatant, power.id, this.actor);
      const barSpend = power.id === 'wits.initiativeBoost';
      const canAfford =
        !retired &&
        !barSpend &&
        !tierCapped && !oncePerCombatUsed && pool.current >= nextCost && hasCombat && removeScarOpen;
      const gross = spendableForAttr(attrKey);
      const reserved = this.#reservedStonesInDialogForAttr(attrKey);
      const spendableNet = oncePerCombatUsed
        ? 0
        : Math.max(0, gross - reserved) +
          (stonePowerAllowsColorless(power.id)
            ? this.#spendableNetForAttr(COLORLESS_STONE_ATTR)
            : 0);
      const description = power.description || power.effect || '';
      const accKey = `${power.id}:${attrKey}:${usesThisTurn}`;
      const occupiedPay = this.#stoneOccGet(accKey);
      const occupied = this._stoneReviewMode ? this.#laneIndexesForPower(power.id) : occupiedPay;
      const rankFields = describeStoneCardRank({
        id: power.id,
        name: power.name,
        tiers: power.tiers,
        placed: occupiedPay.length,
        usesBefore: usesThisTurn,
        prefillRank: supportTier,
        liveUses,
        review: this._stoneReviewMode,
      });
      const supportLanes = buildSupportLaneSet(supportTier, usesThisTurn, power.id);
      const laneSegs = buildStonePaymentLanes(
        power.id,
        usesThisTurn,
        barSpend ? 0 : spendableNet,
        stonePlanLocked || stoneResolutionHold || retired || barSpend,
        barSpend ? [] : occupied,
        `${power.id}/${attrKey}`,
        barSpend ? undefined : supportLanes,
      );

      return {
        id: power.id,
        name: power.name,
        description,
        effectLong: power.effect || description,
        attribute: power.attribute,
        accKey,
        nextCost,
        canAfford,
        selectedAttrKey: attrKey,
        usesThisTurn,
        supportTier,
        supportSource: support?.source ?? '',
        supportActive: !!supportLanes,
        supportHint: support
          ? `Rank ${supportTier} is provided by ${support.source}. All lower Ranks are paid normally.`
          : '',
        boostUsed: oncePerCombatUsed,
        hideLeadSegment: false,
        ...stonePowerCardVisuals(power.name, occupied.length, nextCost, liveUses),
        ...(rankFields.waveReady ? rankFields : { rankCaption: rankFields.rankCaption }),
        activated: retired
          ? stonePowerActivationRing(liveUses).activated
          : stonePowerActivationRing(liveUses).activated || rankFields.waveReady,
        retired,
        ...(retired
          ? {
              rankCaption: 'Parked — use Extra Attack',
              pendingActivation: false,
              pendingLabel: '',
              waveReady: false,
              canAfford: false,
            }
          : {}),
        ...(barSpend
          ? {
              rankCaption: 'Spent in the Initiative bar',
              pendingActivation: false,
              pendingLabel: '',
              waveReady: false,
              depositLocked: true,
            }
          : { depositLocked: false }),
        ...laneSegs
      };
    };

    const resolveGenericAttrAndStats = (powerId: string) => {
      const liveUses = getGenericStonePowerUsageCount(this.actor, powerId, combat);
      const usesThisTurn = this._stoneReviewMode && liveUses > 0 ? liveUses - 1 : liveUses;
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

      const nextCost = nextStoneWaveCost(powerId, usesThisTurn);
      const spendable = spendableForAttr(attrKey);

      this._generalAttrSelection[powerId] = attrKey;
      return { attrKey, usesThisTurn, spendable, nextCost };
    };
    
    // Separate generic and attribute-specific powers (Premium leads the row)
    const genericPowers = orderPowersRampFirst(
      availablePowers.filter((p) => p.attribute === 'generic'),
      (p) => isPremiumStonePower(p.id),
      (p) => !!p.oncePerCombat,
    );
    const attributeSpecificPowers = availablePowers.filter((p) => p.attribute !== 'generic');
    
    const generalPowers = genericPowers.map((power) => {
      const { attrKey, usesThisTurn } = resolveGenericAttrAndStats(power.id);
      const retired = isRetiredStonePower(power.id);
      const support = supportForPower(power.id);
      const supportTier = support?.tier ?? 0;
      const nextCost = nextStoneWaveCost(power.id, usesThisTurn, supportTier);
      const canAfford = !retired && nextCost > 0 && canAffordGenericNextCost(nextCost);
      const description = power.description || power.effect || '';
      const spendableNet = totalSpendableNetAllPools();
      const genericKey = genericUnifiedAccKey(power.id, usesThisTurn);
      const occupiedPay = this.#stoneOccGet(genericKey);
      const occupied = this._stoneReviewMode ? this.#laneIndexesForPower(power.id) : occupiedPay;
      const liveUses = getGenericStonePowerUsageCount(this.actor, power.id, combat);
      const rankFields = describeStoneCardRank({
        id: power.id,
        name: power.name,
        tiers: power.tiers,
        placed: occupiedPay.length,
        usesBefore: usesThisTurn,
        prefillRank: supportTier,
        liveUses,
        review: this._stoneReviewMode,
      });
      const sp = STONE_POWERS[power.id];
      const supportLanes = buildSupportLaneSet(supportTier, usesThisTurn, power.id);
      const laneSegs = buildStonePaymentLanes(
        power.id,
        usesThisTurn,
        spendableNet,
        stonePlanLocked || stoneResolutionHold || retired,
        occupied,
        `${power.id}/general`,
        supportLanes,
      );
      return {
        id: power.id,
        name: power.name,
        description,
        effectLong: sp?.effect || description,
        attribute: power.attribute,
        accKey: genericUnifiedAccKey(power.id, usesThisTurn),
        nextCost,
        canAfford,
        selectedAttrKey: attrKey,
        usesThisTurn,
        supportTier,
        supportSource: support?.source ?? '',
        supportActive: !!supportLanes,
        supportHint: support
          ? `Rank ${supportTier} is provided by ${support.source}. All lower Ranks are paid normally.`
          : '',
        hideLeadSegment: false,
        ...stonePowerCardVisuals(power.name, occupied.length, nextCost, liveUses),
        ...(rankFields.waveReady ? rankFields : { rankCaption: rankFields.rankCaption }),
        activated: retired
          ? stonePowerActivationRing(liveUses).activated
          : stonePowerActivationRing(liveUses).activated || rankFields.waveReady,
        retired,
        ...(retired
          ? {
              rankCaption: 'Parked — use Extra Attack',
              pendingActivation: false,
              pendingLabel: '',
              waveReady: false,
              canAfford: false,
            }
          : {}),
        ...laneSegs
      };
    });

    const powersByAttribute: Record<string, any[]> = {};
    for (const attr of [...ALL_STONE_ATTRS, 'wits']) {
      powersByAttribute[attr] = [];
    }
    for (const pool of pools) {
      if (!powersByAttribute[pool.key]) powersByAttribute[pool.key] = [];
    }
    for (const power of attributeSpecificPowers) {
      const attr = power.attribute as AttributeKey;
      if (powersByAttribute[attr]) {
        powersByAttribute[attr].push(preparePowerData(power, attr));
      }
    }

    const ATTR_MATRIX_COLS = 4;
    const matrixAttrs: AttributeKey[] = [...ALL_STONE_ATTRS];
    const attributePowerMatrix = matrixAttrs
      .map((attr) => {
        const rawDefs: StonePower[] | undefined = STONE_POWERS_BY_ATTRIBUTE[attr as AttributeKey];
        if (!rawDefs?.length) return null;
        const defs = attr === 'wits'
          ? orderWitsDialogColumn(rawDefs)
          : orderPowersRampFirst(
              rawDefs,
              (def) => isPremiumStonePower(def.id),
              (def) => !!def.oncePerCombat,
            );

        const preparedMap = new Map((powersByAttribute[attr] || []).map((p: any) => [p.id, p]));
        const cells: any[] = [];
        const cols = Math.max(ATTR_MATRIX_COLS, defs.length);
        for (let i = 0; i < cols; i++) {
          const def = defs[i];
          if (!def) {
            cells.push(null);
            continue;
          }
          let p: any = preparedMap.get(def.id);
          if (!p) {
            p = preparePowerData(def, attr as AttributeKey);
          }
          cells.push({
            ...p,
            oncePerCombat: !!def.oncePerCombat,
            effectLong: def.effect || p.description || '',
          });
        }

        const hasSpendable = this.#sectionHasSpendable(attr, pools);
        const hasOncePerCombat = defs.some((def) => !!def.oncePerCombat);
        return {
          attrKey: attr,
          attrName: poolDisplayName(attr),
          cells,
          hasSpendable,
          hasOncePerCombat,
          sectionOpen: stoneDialogSectionStartsOpen({
            sectionHasSpendable: hasSpendable,
            sectionHasAssigned: this.#sectionHasAssigned(attr),
            userOverride: this._sectionOpenOverride[attr],
          }),
        };
      })
      .filter(
        (row): row is {
          attrKey: AttributeKey;
          attrName: string;
          cells: any[];
          hasSpendable: boolean;
          hasOncePerCombat: boolean;
          sectionOpen: boolean;
        } => !!row
      );

    const spendableNetAllPoolsCached = totalSpendableNetAllPools();
    const generalHasSpendable = spendableNetAllPoolsCached > 0;
    const generalSectionOpen = stoneDialogSectionStartsOpen({
      sectionHasSpendable: generalHasSpendable,
      sectionHasAssigned: this.#sectionHasAssigned('general'),
      userOverride: this._sectionOpenOverride.general,
    });
    const unactivatedStones = [
      ...generalPowers,
      ...attributePowerMatrix.flatMap((row) => row.cells),
    ].flatMap((card) => (card?.pendingRow ? [card.pendingRow] : []));

    const mr = getMasteryRank(poolOwner);
    const initiativeScore = Math.max(0, Math.floor(Number(this.combatant?.initiative) || 0));
    const stoneIniCost = colorlessStoneInitiativeCost(mr);
    const rolledFlag = ((this.actor as any).getFlag?.('mastery-system', INITIATIVE_ROLLED_FLAG) ??
      (poolOwner as any).getFlag?.('mastery-system', INITIATIVE_ROLLED_FLAG)) as
      | { combatId?: string; total?: number; diceTotal?: number }
      | null
      | undefined;
    const surprised = actorHasSurprise(this.actor) || actorHasSurprise(poolOwner);
    const needsRoll = pcNeedsManualInitiativeRoll({
      actorType: (this.actor as any).type,
      surprised,
      combatId: combat?.id ?? null,
      recordedCombatId: rolledFlag?.combatId ?? null,
      recordedTotal: rolledFlag?.total ?? null,
      initiative: this.combatant?.initiative ?? null,
      combatantHasRecordedValue:
        this.combatant?.getFlag?.('mastery-system', 'msInitiativeValue') != null,
    });
    const maxConvert = needsRoll ? 0 : maxConvertibleColorlessStones(initiativeScore, mr);
    const preparation = this.#preparationView(needsRoll, recovery.active, stonePlanLocked);
    const exchangeLocked =
      stonePlanLocked || !this.combatant || recovery.active || needsRoll || preparation.step !== 'exchange';
    // Default 0: Convert is optional. Confirm works without pressing it.
    const convertCount = Math.max(0, Math.min(maxConvert, this._colorlessConvertCount ?? 0));
    this._colorlessConvertCount = convertCount;
    const diceTotal = Number.isFinite(Number(rolledFlag?.diceTotal))
      ? Math.floor(Number(rolledFlag?.diceTotal))
      : null;
    const equipmentModifier = getEquippedEquipmentInitiativeModifier(this.actor);
    const initiativeExchange = {
      show: !!this.combatant && preparation.exchangeMode !== 'hidden',
      needsRoll,
      surprised: surprised && (this.actor as any).type === 'character',
      diceTotal,
      equipmentModifier,
      equipmentSigned: formatSignedInitiativeModifier(equipmentModifier),
      diceRollLine:
        !needsRoll && !surprised
          ? formatInitiativeDiceRollLine(diceTotal ?? initiativeScore)
          : '',
      armorPenaltyLine:
        !needsRoll && !surprised ? formatInitiativeArmorPenaltyLine(equipmentModifier) : '',
      summary: needsRoll
        ? ''
        : formatInitiativeExchangeSummary({
            diceTotal,
            initiative: initiativeScore,
          }),
      initiative: initiativeScore,
      masteryRank: mr,
      costPerStone: stoneIniCost,
      maxConvert,
      convertCount,
      canConvertMore: !exchangeLocked && convertCount < maxConvert,
      canConvertLess: !exchangeLocked && convertCount > 0,
      locked: exchangeLocked,
      boostUsed: isInitiativeBoostUsedThisCombat(this.combatant, this.actor),
      mode: preparation.exchangeMode,
      receipt: preparation.exchangeReceipt,
    };
    // Always show Available Stones — hiding them during Boost/Exchange made the
    // dialog look empty (only Wits/Initiative chrome). Dragging stays gated below.
    showStonePools = true;

    return {
      actor: this.actor,
      pools,
      passivesCta: this.#passivesCtaContext(combat),
      initiativeExchange,
      preparation,
      attributePowerMatrix,
      generalPowers,
      generalHasSpendable,
      generalSectionOpen,
      defaultGeneralAttrKey,
      combatActive,
      combatStarted,
      combatMissingFromTracker,
      hasCombat,
      stonePlanLocked,
      stoneReviewMode,
      stoneResolutionHold,
      unactivatedStones,
      recovery,
      /** Ziehen sobald Initiative steht — Convert/Boost müssen nicht erst bestätigt sein. */
      dragStonesEnabled:
        !stonePlanLocked &&
        !recovery.active &&
        !stoneResolutionHold &&
        (preparation.step === 'assignment' ||
          preparation.step === 'boost' ||
          preparation.step === 'exchange'),
      dragPoolEnabled,
      showStonePools,
      prefsUseDefaults,
      canSavePrefs,
      combatLabel: combat ? `Round ${combat.round}` : '',
      naturalRecovery: this.#naturalRecoveryContext(combat, stonePlanLocked),
      helpScreens: STONE_POWERS_HELP_SCREENS,
      helpScreenCount: STONE_POWERS_HELP_COUNT,
    };
  }

  #naturalRecoveryContext(combat: Combat | null, locked: boolean) {
    const options = listNaturalRecoveryOptions(this.actor, combat);
    const choice = matchingNaturalRecoveryChoice(this.actor, combat);
    const masteryRank = actorMasteryRank(this.actor);
    const allocated = options.reduce((sum, row) => sum + row.allocated, 0);
    const skipped = choice?.chosen === true && naturalRecoveryAllocatedTotal(choice.allocations) <= 0;
    const confirmed = choice?.chosen === true && allocated > 0 && !skipped;
    const autoSingle = choice?.autoSingle === true && allocated > 0 && !skipped;
    const show =
      !!this.combatant &&
      (this.actor as any).type === 'character' &&
      (options.length > 0 || skipped);
    const i18n = (globalThis as any).game?.i18n;
    const loc = (key: string, fallback: string) => {
      const raw = i18n?.localize?.(`MASTERY.specials.${key}`);
      return raw && raw !== `MASTERY.specials.${key}` ? String(raw) : fallback;
    };
    const locFormat = (key: string, data: Record<string, unknown>, fallback: string) => {
      const raw = i18n?.format?.(`MASTERY.specials.${key}`, data);
      return raw && raw !== `MASTERY.specials.${key}` ? String(raw) : fallback;
    };
    return {
      show,
      locked,
      masteryRank,
      allocated,
      remaining: Math.max(0, masteryRank - allocated),
      options: options.map((row) => ({
        ...row,
        canAdd: row.canAdd && !locked,
        canRemove: row.canRemove && !locked,
        isAuto: autoSingle && row.allocated > 0,
      })),
      skipped,
      confirmed,
      canConfirm: allocated > 0 && !locked,
      autoSingle,
      title: loc('naturalRecoveryPick', 'Natural Special Recovery'),
      hint: locFormat(
        'naturalRecoveryDistributeHint',
        { rank: masteryRank },
        `At the start of your turn, after Ticks, reduce negative Diminishing Specials by a total of your Mastery Rank (${masteryRank}). Distribute with +/−, then Apply. Unused reduction is lost.`,
      ),
      confirmLabel: loc('naturalRecoveryApply', 'Apply Natural Recovery'),
      noneLabel: loc('naturalRecoverySkip', 'Skip Natural Recovery'),
    };
  }

  #passivesCtaContext(combat: Combat | null) {
    const actorType = (this.actor as { type?: string }).type;
    const reviewed = isPassivesReviewedThisEncounter(combat, this.combatant);
    const round = Math.max(1, Math.floor(Number(combat?.round) || 1));
    const pendingSwaps = getPendingPassiveSwaps(this.actor);
    const canEdit = canEditEncounterPassives(combat, this.actor);
    const show = !!this.combatant && actorType === 'character';
    const slots = getPassiveSlots(this.actor);
    const names = slots
      .map((slot) => String(slot.passive?.name ?? '').trim())
      .filter(Boolean);
    const gmOpen = readCombatantSetupStep(this.combatant, combat)?.passivesGmOpen === true;
    const needsPrompt =
      show &&
      (gmOpen ||
        passiveSlotsHaveOpenChoice(slots, getAvailablePassives(this.actor).length, pendingSwaps));
    const label = 'Assign Passives';
    const hint = canEdit
      ? pendingSwaps > 0
        ? 'Exchange Passive is paid — you may swap now.'
        : 'Change the pre-selected Passives. Your last choice is kept.'
      : 'View only. Passives stay set until you pay Exchange Passive.';
    return {
      show: needsPrompt,
      glow: gmOpen || (needsPrompt && ((round <= 1 && !reviewed) || pendingSwaps > 0)),
      canEdit,
      names,
      namesLabel: names.length ? names.join(', ') : '—',
      label,
      hint,
    };
  }

  async #openPassivesFromCta(): Promise<void> {
    if (!this.combatant) return;
    const combat = (game as any).combat ?? null;
    await persistCombatantSetupStep(this.combatant, combat, { passivesReviewed: true });
    const readOnly = !canEditEncounterPassives(combat, this.actor);
    const { PassiveSelectionDialog } = await import('../sheets/passive-selection-dialog.js');
    const outcome = await PassiveSelectionDialog.showForCombatant(this.combatant, readOnly);
    if (outcome.alreadyOpen) return;
    const actorId = String((this.actor as { id?: string }).id ?? '');
    if (outcome.confirmed && combat && actorId) {
      try {
        const { handlePassiveSelectionComplete } = await import('../combat/encounter-start.js');
        await handlePassiveSelectionComplete(combat, actorId, {});
      } catch (err) {
        console.warn('Mastery System | Could not lock passives after picker', err);
      }
    }
    await this.#renderKeepingScroll();
  }
  
  #colorlessRecoveryPanel(combat: any, owner: any) {
    const character = String(owner?.type || (this.actor as any)?.type || '') === 'character';
    const record = readColorlessRecovery(owner, combat?.id ? String(combat.id) : undefined);
    const open = colorlessRecoveryPreparationOpen(owner, combat);
    const stones = listColorlessStones(owner).filter((row) => row.state === 'ready' || row.state === 'exhausted');
    if (!character || !combat) return { show: false };
    if (!record) {
      const rank = Math.min(4, Math.max(1, this._crRank || 1));
      const spec = colorlessRecoverySpec(rank);
      const picked = this._crPicked.filter((id) => stones.some((row) => row.id === id));
      return {
        show: open,
        mode: 'activate',
        rank,
        cost: spec?.cost ?? 0,
        capacity: spec?.capacity ?? 0,
        free: Math.max(0, (spec?.capacity ?? 0) - picked.length),
        stones: stones.map((row) => ({
          id: row.id,
          label: `${row.source} · ${row.state}`,
          checked: picked.includes(row.id),
          disabled: !picked.includes(row.id) && picked.length >= (spec?.capacity ?? 0),
        })),
      };
    }
    const free = Math.max(0, record.capacity - record.selectedIds.length);
    const fresh = this._crPicked.filter((id) => !record.selectedIds.includes(id) && stones.some((row) => row.id === id));
    return {
      show: true,
      mode: 'assign',
      rank: record.rank,
      cost: 0,
      capacity: record.capacity,
      free,
      stones: stones.map((row) => {
        const held = record.selectedIds.includes(row.id);
        return {
          id: row.id,
          label: `${row.source} · ${row.state}${held ? ' · designated' : ''}`,
          checked: held || fresh.includes(row.id),
          disabled: held || (!fresh.includes(row.id) && fresh.length >= free),
        };
      }),
    };
  }

  /** Stones Mastery Rank buys back at the start of a round (Lifetime-XP MR). */
  #stoneRecoveryPoints(): number {
    const owner = getActionEconomyActor(this.actor) ?? this.actor;
    return Math.max(1, getRulesMasteryRank(owner));
  }

  #pickedRecoverableColorless(): string[] {
    const owner = getActionEconomyActor(this.actor) ?? this.actor;
    const legal = new Set(designatedExhaustedColorlessIds(owner));
    return this._recoveryColorlessIds.filter((id) => legal.has(id));
  }

  #colorlessRecoveryChoices(): Array<{ id: string; label: string; picked: boolean; canPick: boolean }> {
    const owner = getActionEconomyActor(this.actor) ?? this.actor;
    const rows = listColorlessStones(owner);
    const record = readColorlessRecovery(owner);
    if (!record) return [];
    const picked = new Set(this.#pickedRecoverableColorless());
    const room = Math.max(
      0,
      this.#stoneRecoveryPoints() - this.#currentAttributeRecoveryCount() - picked.size,
    );
    return rows
      .filter((row) => record.selectedIds.includes(row.id) && row.state === 'exhausted')
      .map((row) => {
        const isPicked = picked.has(row.id);
        return {
          id: row.id,
          label: `${row.source} ${row.id}`,
          picked: isPicked,
          canPick: isPicked || room > 0,
        };
      });
  }

  #currentAttributeRecoveryCount(): number {
    return Object.values(this._recoveryAlloc).reduce((sum, n) => sum + Math.max(0, Math.floor(Number(n) || 0)), 0);
  }

  /**
   * Attribute pools only. Designated Colorless Stones are individual choices
   * and share this same Mastery Rank limit.
   */
  #recoveryPoolInputs(pools: StoneDialogPoolRow[]): StoneRecoveryPoolInput[] {
    return pools
      .filter((pool) => String(pool.key) !== COLORLESS_STONE_ATTR)
      .map((pool) => ({
        key: String(pool.key),
        max: pool.max,
        current: pool.current,
        sustained: pool.sustained + (pool.sealedBurned ?? 0),
      }));
  }

  /**
   * Recovery is owed from round 2 on, until the player confirms it. Round 1
   * pools start full, and a confirmed assignment (review mode) is history.
   */
  #isStoneRecoveryPending(combat: any): boolean {
    if (!combat || !this.combatant) return false;
    if (this._stoneReviewMode) return false;
    const round = Math.floor(Number(combat.round) || 0);
    if (round <= 1) return false;
    return !isStoneRegenDone(combat, this.combatant.id, round);
  }

  /**
   * Recovery rows for the Available Stones area. Pools that cannot take a stone
   * back get no steppers — but Confirm stays available so the step never blocks.
   */
  #buildStoneRecovery(combat: any, pools: StoneDialogPoolRow[]): StoneRecoveryContext {
    for (const pool of pools) {
      pool.recoverShow = false;
      pool.recoverAlloc = 0;
      pool.recoverAllocLabel = '0';
      pool.recoverSpace = 0;
      pool.recoverCanAdd = false;
      pool.recoverCanRemove = false;
    }
    if (!this.#isStoneRecoveryPending(combat)) return STONE_RECOVERY_INACTIVE;

    const round = Math.floor(Number(combat.round) || 0);
    if (this._recoveryRound !== round) {
      this._recoveryRound = round;
      this._recoveryAlloc = {};
      this._recoveryColorlessIds = [];
    }

    const inputs = this.#recoveryPoolInputs(pools);
    const pickedColorless = this.#pickedRecoverableColorless();
    const plan = planStoneRecovery(
      inputs,
      this._recoveryAlloc,
      Math.max(0, this.#stoneRecoveryPoints() - pickedColorless.length),
    );

    const byKey = new Map(plan.rows.map((row) => [row.key, row]));
    for (const pool of pools) {
      const row = byKey.get(String(pool.key));
      if (!row) continue;
      pool.recoverShow = true;
      pool.recoverAlloc = row.allocated;
      pool.recoverAllocLabel = String(row.allocated);
      pool.recoverSpace = row.space;
      pool.recoverCanAdd = row.canAdd;
      pool.recoverCanRemove = row.canRemove;
    }

    const choices = this.#colorlessRecoveryChoices();
    return {
      active: true,
      points: this.#stoneRecoveryPoints(),
      allocated: plan.allocated + pickedColorless.length,
      remaining: plan.remaining,
      saturated: plan.saturated && choices.every((row) => !row.canPick),
      canFinish: true,
      colorlessChoices: choices,
    };
  }

  /** Current recovery plan, rebuilt from live pool numbers (handlers, commit). */
  #currentRecoveryPlan(): {
    inputs: StoneRecoveryPoolInput[];
    plan: ReturnType<typeof planStoneRecovery>;
  } {
    const owner = getActionEconomyActor(this.actor) ?? this.actor;
    const stonePools = ((owner as any).system?.stonePools || {}) as Record<string, any>;
    const inputs: StoneRecoveryPoolInput[] = POOL_DISPLAY_ATTRS.map((attr) => {
      const pool = stonePools[attr];
      return {
        key: attr,
        max: Number(pool?.max ?? pool?.maximum ?? 0) || 0,
        current: Number(pool?.current ?? pool?.value ?? 0) || 0,
        sustained:
          (Number(pool?.sustained ?? 0) || 0) +
          Math.max(0, Number(pool?.sealed) || 0) +
          Math.max(0, Number(pool?.burned) || 0),
      };
    });
    return {
      inputs,
      plan: planStoneRecovery(
        inputs,
        this._recoveryAlloc,
        Math.max(0, this.#stoneRecoveryPoints() - this.#pickedRecoverableColorless().length),
      ),
    };
  }

  /**
   * Colorless Pool numbers from the economy owner. Falls back to the sheet
   * actor when the owner mirror is empty (same convention as
   * #actorPoolSpendable for unlinked tokens).
   */
  #colorlessPoolSnapshot(): {
    perm: { current: number; max: number };
    permReserved: number;
    initTotal: number;
    initReady: number;
    initExhausted: number;
    item: number;
    spendable: number;
    max: number;
  } {
    const owner = getActionEconomyActor(this.actor) ?? this.actor;
    let source: any = owner;
    if (
      owner !== this.actor &&
      getSpendableColorlessStones(owner) <= 0 &&
      getInitiativeColorlessTotal(owner) <= 0 &&
      getPermanentColorlessStones(owner).max <= 0
    ) {
      source = this.actor;
    }
    const perm = getPermanentColorlessStones(source);
    const permPool = (source as any).system?.stonePools?.colorless ?? {};
    const permReserved =
      Math.max(0, Math.floor(Number(permPool.sustained) || 0)) +
      Math.max(0, Math.floor(Number(permPool.sealed) || 0)) +
      Math.max(0, Math.floor(Number(permPool.burned) || 0));
    const initExhausted = getExhaustedInitiativeColorlessStones(source);
    const initTotal = getInitiativeColorlessTotal(source);
    const initReady = Math.max(0, initTotal - initExhausted);
    const item = getItemColorlessStones(source);
    return {
      perm,
      permReserved,
      initTotal,
      initReady,
      initExhausted,
      item,
      spendable: getSpendableColorlessStones(source),
      max: item + initTotal + perm.max,
    };
  }

  #changeStoneRecovery(attr: string, delta: number): boolean {
    const { plan } = this.#currentRecoveryPlan();
    const row = plan.rows.find((r) => r.key === attr);
    if (!row) return false;
    if (delta > 0 && !row.canAdd) return false;
    if (delta < 0 && !row.canRemove) return false;
    const next = Math.max(0, row.allocated + (delta > 0 ? 1 : -1));
    if (next > 0) this._recoveryAlloc[attr] = next;
    else delete this._recoveryAlloc[attr];
    return true;
  }

  /** Write the recovery to the pools and unlock the power matrix for the round. */
  async #commitStoneRecovery(): Promise<void> {
    if (!this._recoveryActive || this._recoveryCommitting) return;
    const combat = game.combat;
    if (!combat || !this.combatant) return;

    const { inputs, plan } = this.#currentRecoveryPlan();
    // Confirm always proceeds — unused Mastery Rank points are skipped.

    this._recoveryCommitting = true;
    try {
      const allocation = clampStoneRecoveryAllocation(inputs, this._recoveryAlloc, plan.points);
      const total = Object.values(allocation).reduce((sum, n) => sum + n, 0);
      const { canCurrentUserUpdateDocument } = await import('../combat/combat-permissions.js');
      const owner = getActionEconomyActor(this.actor) ?? this.actor;
      const mayWrite = canCurrentUserUpdateDocument(this.actor) || canCurrentUserUpdateDocument(owner);
      if (total > 0 && mayWrite) {
        const { applyStoneRegenAllocation } = await import('../combat/action-economy.js');
        await applyStoneRegenAllocation(this.actor, {
          ...allocation,
          colorlessIds: this.#pickedRecoverableColorless(),
          recoveryLimit: this.#stoneRecoveryPoints(),
        });
      }
      const { confirmStoneRecoveryForCombatant } = await import('../combat/stone-powers-flow.js');
      await confirmStoneRecoveryForCombatant(combat, this.combatant);
      this._recoveryActive = false;
      this._recoveryAlloc = {};
      ui.notifications?.info(
        total > 0
          ? `Stone Recovery: ${total} stone(s) back in your pools.`
          : 'Stone Recovery done — no stones were taken back.',
      );
    } catch (err) {
      console.error('Mastery System | Stone Recovery failed', err);
      ui.notifications?.error('Stone Recovery failed — see the console.');
    } finally {
      this._recoveryCommitting = false;
    }
    await this.#renderKeepingScroll();
  }

  /**
   * GM override steppers: the GM can always add or take away Ready stones on
   * every pool, independent of Stone Recovery. Bounded by 0 and the pool's
   * free capacity (max − sustained − sealed/burned).
   */
  #buildGmPoolAdjust(pools: StoneDialogPoolRow[]): void {
    const isGM = !!(game as any).user?.isGM;
    for (const pool of pools) {
      pool.gmAdjustShow = false;
      pool.gmAdjustCanAdd = false;
      pool.gmAdjustCanRemove = false;
      pool.gmAdjustLabel = '';
      if (!isGM) continue;
      const key = String(pool.key);
      let current: number;
      let cap: number;
      if (key === COLORLESS_STONE_ATTR) {
        const owner = getActionEconomyActor(this.actor) ?? this.actor;
        const perm = getPermanentColorlessStones(owner);
        if (perm.max <= 0) continue;
        current = perm.current;
        cap = Math.max(0, perm.max - Math.max(0, Math.floor(Number(pool.sealedBurned) || 0)));
      } else {
        if (pool.max <= 0) continue;
        current = Math.max(0, Math.floor(Number(pool.current) || 0));
        cap = Math.max(0, pool.max - pool.sustained - pool.sealedBurned);
      }
      pool.gmAdjustShow = true;
      pool.gmAdjustCanAdd = current < cap;
      pool.gmAdjustCanRemove = current > 0;
      pool.gmAdjustLabel = `${current}/${cap}`;
    }
  }

  /** GM override: write the new Ready count (ledger-aware) for one pool. */
  async #gmAdjustPool(attr: string, delta: number): Promise<void> {
    if (!(game as any).user?.isGM) return;
    const owner = getActionEconomyActor(this.actor) ?? this.actor;
    const step = delta > 0 ? 1 : -1;
    try {
      if (attr === COLORLESS_STONE_ATTR) {
        const perm = getPermanentColorlessStones(owner);
        if (perm.max <= 0) return;
        const next = Math.max(0, Math.min(perm.max, perm.current + step));
        if (next === perm.current) return;
        const { setCombatPoolCurrent } = await import('./stone-combat-ledger.js');
        await setCombatPoolCurrent(owner, COLORLESS_STONE_ATTR, next, (game as any).combat ?? null);
      } else {
        const pool = getStonePool(owner, attr as AttributeKey);
        const sys = (owner as any).system ?? {};
        const p = sys.stonePools?.[attr] ?? {};
        const reserved =
          Math.max(0, Math.floor(Number(p.sustained) || 0)) +
          Math.max(0, Math.floor(Number(p.sealed) || 0)) +
          Math.max(0, Math.floor(Number(p.burned) || 0));
        const cap = Math.max(0, pool.max - reserved);
        const next = Math.max(0, Math.min(cap, pool.current + step));
        if (next === pool.current) return;
        await setStonePool(owner, attr as AttributeKey, next);
      }
    } catch (err) {
      console.error('Mastery System | GM stone override failed', err);
      ui.notifications?.error('Stone override failed — see the console.');
    }
    await this.#renderKeepingScroll();
  }

  #bindGmPoolAdjustControls(root: HTMLElement): void {
    root.querySelectorAll('.js-gm-pool-add, .js-gm-pool-remove').forEach((el: Element) => {
      const btn = el as HTMLButtonElement;
      btn.onclick = async (ev: MouseEvent) => {
        ev.preventDefault();
        ev.stopPropagation();
        if (btn.disabled) return;
        const attr = btn.dataset.attribute || '';
        if (!attr) return;
        await this.#gmAdjustPool(attr, btn.classList.contains('js-gm-pool-add') ? 1 : -1);
      };
    });
  }

  #bindStoneRecoveryControls(root: HTMLElement): void {
    root.querySelectorAll('.js-recover-add').forEach((btn: Element) => {
      (btn as HTMLElement).onclick = async (ev: MouseEvent) => {
        ev.preventDefault();
        const attr = (btn as HTMLElement).dataset.attribute || '';
        if (this.#changeStoneRecovery(attr, 1)) await this.#renderKeepingScroll();
      };
    });

    root.querySelectorAll('.js-recover-remove').forEach((btn: Element) => {
      (btn as HTMLElement).onclick = async (ev: MouseEvent) => {
        ev.preventDefault();
        const attr = (btn as HTMLElement).dataset.attribute || '';
        if (this.#changeStoneRecovery(attr, -1)) await this.#renderKeepingScroll();
      };
    });

    root.querySelectorAll('.js-recover-colorless').forEach((el: Element) => {
      (el as HTMLInputElement).onchange = async () => {
        const id = (el as HTMLInputElement).dataset.stoneId || '';
        if (!id) return;
        const on = (el as HTMLInputElement).checked;
        this._recoveryColorlessIds = this._recoveryColorlessIds.filter((row) => row !== id);
        if (on) this._recoveryColorlessIds.push(id);
        await this.#renderKeepingScroll();
      };
    });

    root.querySelectorAll('.js-cr-rank').forEach((el: Element) => {
      (el as HTMLButtonElement).onclick = async (ev: MouseEvent) => {
        ev.preventDefault();
        this._crRank = Math.min(4, Math.max(1, Number((el as HTMLButtonElement).dataset.rank) || 1));
        const spec = colorlessRecoverySpec(this._crRank);
        this._crPicked = this._crPicked.slice(0, spec?.capacity ?? 0);
        await this.#renderKeepingScroll();
      };
    });
    root.querySelectorAll('.js-cr-stone').forEach((el: Element) => {
      (el as HTMLInputElement).onchange = async () => {
        const id = (el as HTMLInputElement).dataset.stoneId || '';
        if (!id) return;
        const on = (el as HTMLInputElement).checked;
        this._crPicked = this._crPicked.filter((row) => row !== id);
        if (on) this._crPicked.push(id);
        await this.#renderKeepingScroll();
      };
    });
    const crConfirm = root.querySelector('.js-cr-confirm') as HTMLButtonElement | null;
    if (crConfirm) {
      crConfirm.onclick = async (ev: MouseEvent) => {
        ev.preventDefault();
        const combat = game.combat;
        const owner = getActionEconomyActor(this.actor) ?? this.actor;
        const record = readColorlessRecovery(owner, combat?.id ? String(combat.id) : undefined);
        if (!record) {
          const result = await commitColorlessRecovery({
            actor: this.actor,
            combatant: this.combatant,
            rank: this._crRank,
            selectedIds: this._crPicked,
            combat,
          });
          if (!result.ok) {
            ui.notifications?.warn(
              result.reason === 'preparation'
                ? 'Colorless Recovery can only be activated during a Preparation Phase.'
                : result.reason === 'once'
                  ? 'Colorless Recovery was already used this combat.'
                  : result.reason === 'cost'
                    ? 'Not enough Stones. The cost is Exhausted, not Sealed.'
                    : 'Colorless Recovery was not activated.',
            );
          } else {
            this._crPicked = [];
            ui.notifications?.info('Colorless Recovery designated the chosen Stones. None were regenerated.');
          }
        } else {
          const fresh = this._crPicked.filter((id) => !record.selectedIds.includes(id));
          const result = await assignLaterColorlessRecovery(owner, fresh);
          if (!result.ok) ui.notifications?.warn('No free Colorless Recovery slot was filled.');
          else {
            this._crPicked = [];
            ui.notifications?.info(`Designated ${result.added.length} more Colorless Stone(s).`);
          }
        }
        await this.#renderKeepingScroll();
      };
    }

    const doneBtn = root.querySelector('.js-recovery-done') as HTMLButtonElement | null;
    if (doneBtn) {
      doneBtn.onclick = async (ev: MouseEvent) => {
        ev.preventDefault();
        if (doneBtn.disabled) return;
        await this.#commitStoneRecovery();
      };
    }
  }

  /** Natural Special Recovery steppers, Apply, and Skip. */
  #bindNaturalRecoveryControls(root: HTMLElement): void {
    root.querySelectorAll('.js-nsr-add, .js-nsr-remove').forEach((el) => {
      const btn = el as HTMLButtonElement;
      btn.addEventListener('click', (ev) => {
        ev.preventDefault();
        if (btn.disabled) return;
        const delta = btn.classList.contains('js-nsr-add') ? 1 : -1;
        void this.#changeNaturalRecovery(btn.dataset.specialId ?? '', delta);
      });
    });
    const confirm = root.querySelector('.js-nsr-confirm') as HTMLButtonElement | null;
    if (confirm) {
      confirm.addEventListener('click', (ev) => {
        ev.preventDefault();
        if (confirm.disabled) return;
        void this.#confirmNaturalRecovery();
      });
    }
    const skip = root.querySelector('.js-nsr-skip') as HTMLButtonElement | null;
    if (skip) {
      skip.addEventListener('click', (ev) => {
        ev.preventDefault();
        if (skip.disabled) return;
        void this.#skipNaturalRecovery();
      });
    }
  }

  async #changeNaturalRecovery(specialId: string, delta: number): Promise<void> {
    const combat = (game as any).combat as Combat | null;
    if (!combat || this.#isStoneDialogLocked()) return;
    const id = String(specialId || '').trim();
    if (!id) return;
    await changeNaturalRecoveryAllocation(this.actor, combat, id, delta);
    await this.#renderKeepingScroll();
  }

  async #confirmNaturalRecovery(): Promise<void> {
    const combat = (game as any).combat as Combat | null;
    if (!combat || this.#isStoneDialogLocked()) return;
    const ok = await confirmNaturalRecoveryAllocations(this.actor, combat);
    if (!ok) {
      (globalThis as any).ui?.notifications?.warn?.(
        (globalThis as any).game?.i18n?.localize?.('MASTERY.specials.naturalRecoveryApplyEmpty') ||
          'Allocate at least 1 Mastery Rank to a Special, or Skip.',
      );
      return;
    }
    await this.#renderKeepingScroll();
  }

  async #skipNaturalRecovery(): Promise<void> {
    const combat = (game as any).combat as Combat | null;
    if (!combat || this.#isStoneDialogLocked()) return;
    await setNaturalRecoverySkipped(this.actor, combat);
    await this.#renderKeepingScroll();
  }

  #dialogNeedsInitiativeRoll(): boolean {
    const combat = (game as any).combat as Combat | null;
    const actor = this.actor as any;
    const poolOwner = getActionEconomyActor(this.actor) ?? this.actor;
    const rolledFlag = (actor.getFlag?.('mastery-system', INITIATIVE_ROLLED_FLAG) ??
      (poolOwner as any).getFlag?.('mastery-system', INITIATIVE_ROLLED_FLAG)) as
      | { combatId?: string; total?: number }
      | null
      | undefined;
    return pcNeedsManualInitiativeRoll({
      actorType: actor.type,
      surprised: actorHasSurprise(actor) || actorHasSurprise(poolOwner),
      combatId: combat?.id ?? null,
      recordedCombatId: rolledFlag?.combatId ?? null,
      recordedTotal: rolledFlag?.total ?? null,
      initiative: this.combatant?.initiative ?? null,
      combatantHasRecordedValue: this.combatant?.getFlag?.('mastery-system', 'msInitiativeValue') != null,
    });
  }

  async #rollInitiativeFromDialog(button: HTMLButtonElement): Promise<void> {
    if (!this.combatant || button.disabled) return;
    button.disabled = true;
    try {
      const { rollInitiativeForCombatant } = await import('../combat/initiative-roll.js');
      const breakdown = await rollInitiativeForCombatant(this.combatant);
      const rolled = Math.floor(Number(breakdown.diceTotal) || 0);
      const now = Math.floor(Number(breakdown.totalInitiative) || 0);
      ui.notifications?.info(
        rolled === now
          ? `${(this.actor as any).name}: ${formatInitiativeDiceRollLine(rolled)}`
          : `${(this.actor as any).name}: ${formatInitiativeDiceRollLine(rolled)} Initiative is now ${now}.`,
      );
      this._colorlessConvertCount = null;
      await this.#renderKeepingScroll();
    } catch (err) {
      console.warn('Mastery System | Initiative roll from dialog failed', err);
      ui.notifications?.warn('Could not roll Initiative.');
      button.disabled = false;
    }
  }

  #readPreparation(): PreparationPhaseState {
    const combat = (game as any).combat as Combat | null;
    const owner = (getActionEconomyActor(this.actor) ?? this.actor) as any;
    const round = encounterStoneRound(combat);
    const raw = owner?.getFlag?.('mastery-system', PREPARATION_PHASE_FLAG);
    return reconcilePreparationPhase(readPreparationPhase(raw, String(combat?.id || ''), round), {
      boostAlreadyUsed: isInitiativeBoostUsedThisCombat(this.combatant, this.actor),
      assignmentConfirmed: this.#isStoneAssignmentReviewMode(),
    });
  }

  async #writePreparation(state: PreparationPhaseState): Promise<void> {
    const owner = (getActionEconomyActor(this.actor) ?? this.actor) as any;
    if (typeof owner?.setFlag !== 'function') return;
    await owner.setFlag('mastery-system', PREPARATION_PHASE_FLAG, state);
  }

  #preparationView(needsRoll: boolean, recoveryActive: boolean, locked = false) {
    const state = this.combatant
      ? this.#readPreparation()
      : readPreparationPhase(null, '', 0);
    const step = this.combatant ? preparationStep(state, needsRoll) : 'assignment';
    const prefill = effectiveStoneSupportPrefillTier(
      'wits.initiativeBoost',
      getArtifactStoneSupportPrefill(this.actor, 'wits.initiativeBoost', 'wits'),
    );
    const wits = poolSpendableStones(this.actor, 'wits');
    const mr = getMasteryRank(getActionEconomyActor(this.actor) ?? this.actor);
    const ranks = [1, 2, 3, 4]
      .map((tier) => {
        const cost = initiativeBoostRankCost(tier, prefill) ?? 0;
        const bonus = initiativeBoostAmount(tier, mr);
        return {
          tier,
          cost,
          bonus,
          // Cost is the Wits Stones this click spends. Bonus is Initiative gained.
          label:
            cost === 0
              ? `Artifact already paid this rank · +${bonus} Initiative`
              : `Spend ${cost} Wits Stone${cost === 1 ? '' : 's'} · +${bonus} Initiative`,
          button: cost === 0 ? `Support → +${bonus}` : `${cost} Wits → +${bonus}`,
          affordable: !locked && wits >= cost,
        };
      })
      .filter((row) => row.affordable);
    const exchangeMode =
      step === 'roll' ? 'roll' : step === 'exchange' ? 'buy' : state.exchange === 'done' ? 'receipt' : 'hidden';
    const exchangeReceipt =
      state.exchangeStones > 0
        ? `${state.exchangeStones} Initiative Colorless Stone(s) are Ready and can be spent in this Round.`
        : 'No Initiative was converted. Stone Assignment can use the Stones you already have.';
    return {
      step,
      showBoost: step === 'boost',
      showAssignment: step === 'assignment' || step === 'locked',
      // Boost + Convert are optional; Confirm auto-skips pending steps.
      canConfirm:
        !recoveryActive &&
        (step === 'assignment' || step === 'boost' || step === 'exchange'),
      boostLocked: locked,
      ranks,
      exchangeMode,
      exchangeReceipt,
    };
  }

  async #skipInitiativeBoost(): Promise<void> {
    if (this.#isStoneDialogLocked()) return;
    const skipped = skipInitiativeBoost(this.#readPreparation());
    if (!skipped.changed) return;
    await this.#writePreparation(skipped.state);
    this._colorlessConvertCount = null;
    await this.#renderKeepingScroll();
  }

  async #activateInitiativeBoost(tier: number): Promise<void> {
    if (!this.combatant || this.#isStoneDialogLocked()) return;
    const prep = this.#readPreparation();
    const committed = applyInitiativeBoost(prep, tier);
    if (!committed.changed) return;
    const prefill = effectiveStoneSupportPrefillTier(
      'wits.initiativeBoost',
      getArtifactStoneSupportPrefill(this.actor, 'wits.initiativeBoost', 'wits'),
    );
    const cost = initiativeBoostRankCost(tier, prefill);
    if (cost == null) return;
    const have = poolSpendableStones(this.actor, 'wits');
    if (have < cost) {
      ui.notifications?.warn(`Initiative Boost Rank ${tier} needs ${cost} Wits Stones.`);
      return;
    }
    const ok = await activateStonePower({
      actor: this.actor,
      combatant: this.combatant,
      abilityId: 'wits.initiativeBoost',
      tier,
      cost,
      ranksGained: tier,
      colorlessSpent: 0,
    });
    if (!ok) return;
    await this.#writePreparation(committed.state);
    this._colorlessConvertCount = null;
    await this.#renderKeepingScroll();
  }

  async #commitInitiativeExchange(): Promise<void> {
    if (!this.combatant || this.#isStoneDialogLocked()) return;
    const prep = this.#readPreparation();
    const n = Math.max(0, Math.floor(Number(this._colorlessConvertCount) || 0));
    const planned = planInitiativeExchange(prep, n);
    if (!planned.changed) return;
    if (planned.stones > 0) {
      const result = await convertInitiativeToColorlessStones(this.actor, this.combatant, planned.stones);
      if (!result) {
        ui.notifications?.warn('Not enough Initiative to convert.');
        return;
      }
      await this.#writePreparation(planInitiativeExchange(prep, result.stones).state);
      ui.notifications?.info(
        `${(this.actor as any).name}: ${result.stones} Colorless Stone(s) are Ready. Initiative now ${result.remainingInitiative}.`,
      );
    } else {
      await this.#writePreparation(planned.state);
    }
    this._colorlessConvertCount = null;
    await this.#renderKeepingScroll();
  }

  #bindInitiativeExchangeControls(root: HTMLElement): void {
    const rollBtn = root.querySelector('.js-roll-initiative') as HTMLButtonElement | null;
    if (rollBtn) {
      rollBtn.addEventListener('click', (ev) => {
        ev.preventDefault();
        void this.#rollInitiativeFromDialog(rollBtn);
      });
    }

    const stepConvert = async (delta: number) => {
      const mr = getMasteryRank(getActionEconomyActor(this.actor) ?? this.actor);
      const max = maxConvertibleColorlessStones(
        Math.max(0, Math.floor(Number(this.combatant?.initiative) || 0)),
        mr,
      );
      const current = Math.max(0, Math.min(max, Number(this._colorlessConvertCount ?? 0)));
      const next = Math.max(0, Math.min(max, current + delta));
      if (next === current) return;
      this._colorlessConvertCount = next;
      await this.#renderKeepingScroll();
    };

    (root.querySelector('.js-convert-count-add') as HTMLButtonElement | null)?.addEventListener(
      'click',
      (ev) => {
        ev.preventDefault();
        void stepConvert(1);
      },
    );
    (root.querySelector('.js-convert-count-remove') as HTMLButtonElement | null)?.addEventListener(
      'click',
      (ev) => {
        ev.preventDefault();
        void stepConvert(-1);
      },
    );
  }

  /** Scroll position of every surface that can move when a stone is placed. */
  #rememberStonePowersScroll(): void {
    const el = (this as any).element as HTMLElement | undefined;
    if (!el?.isConnected) return;
    const dialog = el.querySelector('.stone-powers-dialog') as HTMLElement | null;
    const content = el.querySelector('.window-content') as HTMLElement | null;
    // A render that already tore the template down reads 0 everywhere and
    // would throw the view back to the first open section.
    if (!dialog) return;
    this._stoneScroll = {
      content: content?.scrollTop ?? 0,
      dialog: dialog.scrollTop ?? 0,
      frame: el.scrollTop ?? 0,
    };
  }

  #restoreStonePowersScroll(): void {
    const el = (this as any).element as HTMLElement | undefined;
    if (!el) return;
    const content = el.querySelector('.window-content') as HTMLElement | null;
    const dialog = el.querySelector('.stone-powers-dialog') as HTMLElement | null;
    if (content) content.scrollTop = this._stoneScroll.content;
    if (dialog) dialog.scrollTop = this._stoneScroll.dialog;
    el.scrollTop = this._stoneScroll.frame;
  }

  /** Re-render that keeps the scroll position (used after every stone edit). */
  async #renderKeepingScroll(): Promise<void> {
    this.#rememberStonePowersScroll();
    await (this as any).render({ force: true });
  }

  /**
   * GM tools sit in the window header after "Stone Powers", before ⋮ / close,
   * so the dialog body keeps that vertical space.
   */
  #syncGmHeaderTools(appEl: HTMLElement): void {
    const header =
      (appEl.querySelector('.window-header') as HTMLElement | null) ||
      ((this as any).window?.header as HTMLElement | undefined) ||
      null;
    if (!header) return;

    const show = !!(game as any).user?.isGM && !!this.combatant;
    let row = header.querySelector('.stone-gm-header-tools') as HTMLElement | null;
    if (!show) {
      row?.remove();
      return;
    }

    const showPassives = (this.actor as any).type === 'character';
    if (!row) {
      row = document.createElement('div');
      row.className = 'stone-gm-header-tools';
      const anchor =
        (header.querySelector(
          '.header-control, [data-action="toggleControls"], [data-action="close"]',
        ) as HTMLElement | null) || null;
      if (anchor) header.insertBefore(row, anchor);
      else header.appendChild(row);
    }

    row.innerHTML = `
      ${
        showPassives
          ? `<button type="button" class="stone-gm-tool js-gm-release-passives" title="Let this figure change Passives again">Reopen Passives</button>`
          : ''
      }
      <button type="button" class="stone-gm-tool js-gm-reset-stones" title="Return this round's paid stones to the pools and reopen assignment">Reset Stone Assignments</button>
      <button type="button" class="stone-gm-tool js-gm-release-initiative" title="Clear the stored Initiative so it can be rolled again">Reopen Initiative</button>
    `;
  }

  #bindGmHeaderTools(scope: HTMLElement): void {
    const resetStones = scope.querySelector('.js-gm-reset-stones') as HTMLButtonElement | null;
    if (resetStones) {
      resetStones.onclick = async (ev: MouseEvent) => {
        ev.preventDefault();
        if (resetStones.disabled) return;
        resetStones.disabled = true;
        try {
          await this.#gmResetStoneAssignment();
        } finally {
          resetStones.disabled = false;
        }
      };
    }
    const releasePassives = scope.querySelector('.js-gm-release-passives') as HTMLButtonElement | null;
    if (releasePassives) {
      releasePassives.onclick = async (ev: MouseEvent) => {
        ev.preventDefault();
        if (releasePassives.disabled) return;
        releasePassives.disabled = true;
        try {
          await this.#gmReleasePassives();
        } finally {
          releasePassives.disabled = false;
        }
      };
    }
    const releaseInitiative = scope.querySelector(
      '.js-gm-release-initiative',
    ) as HTMLButtonElement | null;
    if (releaseInitiative) {
      releaseInitiative.onclick = async (ev: MouseEvent) => {
        ev.preventDefault();
        if (releaseInitiative.disabled) return;
        releaseInitiative.disabled = true;
        try {
          await this.#gmReleaseInitiative();
        } finally {
          releaseInitiative.disabled = false;
        }
      };
    }
  }

  async _onRender(_context: any, _options: any): Promise<void> {
    super._onRender?.(_context, _options);

    this._stoneRenderQueued = false;
    this.#pullSessionPartialsIntoInstance();

    const restoreScroll = () => this.#restoreStonePowersScroll();
    restoreScroll();
    requestAnimationFrame(() => {
      restoreScroll();
      requestAnimationFrame(restoreScroll);
    });

    const root = getStonePowersContentRoot(this);
    if (!root) {
      console.warn('Mastery System | StonePowersDialog: kein Content-Root für Event-Handler');
      return;
    }

    const appWindow = ((this as any).element as HTMLElement | undefined) ?? root;
    this.#syncGmHeaderTools(appWindow);
    this.#bindGmHeaderTools(appWindow);
    this.#bindGmPoolAdjustControls(root);
    if (this._recoveryActive) {
      // Recovery first: no stone may move into a power while pools are still
      // being refilled, so the drag/drop and click-fill handlers stay unbound.
      this.#bindStoneRecoveryControls(root);
    } else {
      this.#bindStoneDragAndDrop(root, appWindow);
      this.#bindStoneRecoveryControls(root);
    }
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

    this.#bindInitiativeExchangeControls(root);
    this.#bindNaturalRecoveryControls(root);
    this.#bindSectionToggles(root);
    this.#bindStoneHelp(root);
    const passivesCta = root.querySelector('.js-open-passives') as HTMLElement | null;
    if (passivesCta) {
      passivesCta.onclick = async (ev: MouseEvent) => {
        ev.preventDefault();
        await this.#openPassivesFromCta();
      };
    }

    const convertBtn = root.querySelector('.js-convert-initiative-colorless') as HTMLButtonElement | null;
    if (convertBtn) {
      convertBtn.onclick = async (ev: MouseEvent) => {
        ev.preventDefault();
        if (convertBtn.disabled) return;
        await this.#commitInitiativeExchange();
      };
    }
    (root.querySelector('.js-skip-initiative-boost') as HTMLButtonElement | null)?.addEventListener(
      'click',
      (ev) => {
        ev.preventDefault();
        void this.#skipInitiativeBoost();
      },
    );
    for (const button of Array.from(root.querySelectorAll('.js-initiative-boost'))) {
      const el = button as HTMLButtonElement;
      el.addEventListener('click', (ev) => {
        ev.preventDefault();
        const tier = Math.floor(Number(el.dataset.tier) || 0);
        void this.#activateInitiativeBoost(tier);
      });
    }

    const confirmBtn = root.querySelector('.js-confirm-stones');
    if (confirmBtn) {
      (confirmBtn as HTMLElement).onclick = (ev: MouseEvent) => {
        ev.preventDefault();
        void this.#confirmStoneAssignment();
      };
    }

    // Review mode only closes. The assignment was already paid.
    const closeBtn = root.querySelector('.js-close');
    if (closeBtn) {
      (closeBtn as HTMLElement).onclick = async (ev: MouseEvent) => {
        ev.preventDefault();
        await (this as any).close({ closeSource: 'button', committed: true, alreadySettled: true });
      };
    }
    // Header ✕: dismiss synchronously on pointerdown so resume cannot race close.
    const headerClose =
      (appWindow.querySelector('.header-control[data-action="close"]') as HTMLElement | null) ||
      (appWindow.querySelector('[data-action="close"]') as HTMLElement | null);
    if (headerClose && !(headerClose as any)._masteryDismissBound) {
      (headerClose as any)._masteryDismissBound = true;
      headerClose.addEventListener(
        'pointerdown',
        () => {
          dismissStonePowersPrompt(game.combat, this.actor, this.combatant);
        },
        { capture: true },
      );
    }

    // Escape hatch when Confirm / combat hooks hang — never leave the dialog stuck.
    const forceCloseBtn = root.querySelector('.js-force-close');
    if (forceCloseBtn) {
      (forceCloseBtn as HTMLElement).onclick = async (ev: MouseEvent) => {
        ev.preventDefault();
        await (this as any).close({ closeSource: 'button', committed: false, force: true });
      };
    }

    if (!this._resolutionRunning && !this._resolutionResumeStarted && this.#stoneResolutionPending()) {
      this._resolutionResumeStarted = true;
      void this.#confirmStoneAssignment();
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

  /**
   * Every lane already on this power (open wave and paid receipt). Review
   * mode looks at `liveUses - 1`, which misses a card that jumped two Ranks
   * in one Apply — the stones were stored under the uses key they were
   * placed on.
   */
  #laneIndexesForPower(powerId: string): number[] {
    const lanes = new Set<number>();
    const take = (key: string, value: unknown) => {
      if (stonePowerAccKeyPowerId(key) !== powerId || !Array.isArray(value)) return;
      for (const item of value) {
        if (typeof item === 'number' && Number.isFinite(item)) lanes.add(item);
        else if (item && typeof item === 'object' && 'lane' in item) {
          const lane = Number((item as { lane: number }).lane);
          if (Number.isFinite(lane)) lanes.add(lane);
        }
      }
    };
    for (const [key, value] of this._stoneDropAccumulators) take(key, value);
    for (const [key, value] of this._stonePaidLanes) take(key, value);
    return [...lanes].sort((a, b) => a - b);
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

  #stonesEditable(): boolean {
    return !this.#isStoneDialogLocked() && !this.#stoneResolutionPending();
  }

  #resolutionOwner(): any {
    return (getActionEconomyActor(this.actor) ?? this.actor) as any;
  }

  #readResolutionQueue(): StoneResolutionQueue | null {
    return readStoneResolutionQueue(
      this.#resolutionOwner().getFlag?.('mastery-system', STONE_RESOLUTION_QUEUE_FLAG),
    );
  }

  #stoneResolutionPending(): boolean {
    const combat = game.combat;
    if (!combat) return false;
    const queue = this.#readResolutionQueue();
    if (!queue) return false;
    if (String(queue.combatId) !== String(combat.id)) return false;
    if (Number(queue.round) !== encounterStoneRound(combat)) return false;
    return pendingStoneResolutions(queue).length > 0;
  }

  async #persistResolutionQueue(queue: StoneResolutionQueue): Promise<void> {
    const owner = this.#resolutionOwner();
    if (typeof owner.setFlag !== 'function') return;
    await owner.setFlag('mastery-system', STONE_RESOLUTION_QUEUE_FLAG, queue);
  }

  #stageResolution(powerId: string, tier: number): void {
    if (stoneResolutionKind(powerId) !== 'interactive') return;
    const rank = Math.floor(Number(tier) || 0);
    if (rank < 1) return;
    this._resolutionBatch.push({ powerId: resolveStonePowerId(powerId), tier: rank });
  }

  /** Free support ranks accepted during planning are paid here, still without resolving. */
  async #commitPlannedFreeRanks(): Promise<void> {
    const combat = game.combat;
    if (!combat || !this._plannedFreeRankIds.size) return;
    const combatant = this.combatant || resolveStonePowersCombatant(this.actor, combat);
    if (!combatant) return;
    const planned = [...this._plannedFreeRankIds];
    this._plannedFreeRankIds.clear();
    for (const key of planned) {
      const splitAt = key.lastIndexOf(':');
      const powerId = key.slice(0, splitAt);
      const tier = Math.floor(Number(key.slice(splitAt + 1)) || 0);
      const def = STONE_POWERS[powerId];
      if (!def || tier < 1 || stoneResolutionKind(powerId) !== 'interactive') continue;
      const isGeneric = def.attribute === 'generic';
      const ok = isGeneric
        ? await activateGenericStonePowerMixed({
            actor: this.actor,
            combatant,
            abilityId: powerId,
            perAttributeStones: {},
            deferApply: true,
          })
        : await activateStonePower({
            actor: this.actor,
            combatant,
            abilityId: powerId,
            colorlessSpent: 0,
            deferApply: true,
          });
      if (ok) this.#stageResolution(powerId, tier);
    }
  }

  async #drainResolutions(queue: StoneResolutionQueue | null): Promise<boolean> {
    if (!queue || !pendingStoneResolutions(queue).length) return true;
    const actor = this.#resolutionOwner();
    let current = queue;
    for (;;) {
      const ticket = pendingStoneResolutions(current)[0];
      if (!ticket) {
        await this.#persistResolutionQueue(current);
        return true;
      }
      const ok = await presentStoneResolution(actor, this.combatant, ticket);
      if (!ok) {
        await this.#persistResolutionQueue(current);
        return false;
      }
      current = markStoneResolutionResolved(current, ticket.id);
      await this.#persistResolutionQueue(current);
    }
  }

  /**
   * Single commit point. Planning stays editable until this runs.
   * Automatic powers apply inside the payment. Interactive powers open one
   * after another. View-only starts only after the queue is empty.
   */
  async #confirmStoneAssignment(): Promise<void> {
    if (this._resolutionRunning) return;
    if (this._recoveryActive) {
      ui.notifications?.warn('Finish Stone Recovery first, then assign your stones.');
      return;
    }
    if (this.#dialogNeedsInitiativeRoll()) {
      ui.notifications?.warn('Roll Initiative first — the button is in the Initiative row.');
      return;
    }
    if (!this.#stoneResolutionPending()) {
      const step = preparationStep(this.#readPreparation(), false);
      if (step !== 'assignment' && step !== 'boost' && step !== 'exchange') {
        ui.notifications?.warn(
          'Roll Initiative first — then you can confirm Stone Assignment.',
        );
        return;
      }
    }
    this._resolutionRunning = true;
    this._resolutionResumeStarted = true;
    this._resolutionBatch = [];
    try {
      const combatForNr = game.combat;
      if (combatForNr && String((this.actor as any)?.type || '') === 'character') {
        await ensureAutoNaturalRecoveryForSingleEffect(this.actor, combatForNr);
      }
      await this.#commitPlannedFreeRanks();
      await this.#flushCompletedStonePaymentsFromAccumulators();
      this.#warnUnactivatedStones();
      await this.#persistStonePowersRoundPlan();
      const combat = game.combat;
      let queue = this.#readResolutionQueue();
      if (combat) {
        queue = enqueueStoneResolutions(
          queue,
          String(combat.id),
          encounterStoneRound(combat),
          this._resolutionBatch,
        );
        await this.#persistResolutionQueue(queue);
      }
      await this.#writePreparation(confirmPreparationAssignment(this.#readPreparation()));
      const done = await this.#drainResolutions(queue);
      if (!done) {
        ui.notifications?.info(
          'Stone assignment is committed. Finish the remaining resolution.',
        );
        await this.#renderKeepingScroll();
        return;
      }
      await (this as any).close({ closeSource: 'button', committed: true, alreadySettled: true });
    } catch (err) {
      console.error('Mastery System | Stone assignment confirm failed', err);
      ui.notifications?.warn('Could not confirm the stone assignment.');
      try {
        const combat = game.combat;
        if (combat && this._resolutionBatch.length) {
          await this.#persistResolutionQueue(
            enqueueStoneResolutions(
              this.#readResolutionQueue(),
              String(combat.id),
              encounterStoneRound(combat),
              this._resolutionBatch,
            ),
          );
        }
      } catch {
        /* the in-memory batch is the fallback until the next confirm */
      }
    } finally {
      this._resolutionRunning = false;
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
    if (powerId === 'wits.initiativeBoost') {
      if (this.#stoneOccGetRaw(accKey).length) this.#stoneOccDelete(accKey);
      return false;
    }
    if (isRetiredStonePower(powerId)) {
      if (this.#stoneOccGetRaw(accKey).length) {
        this.#stoneOccDelete(accKey);
        ui.notifications?.warn(RETIRED_STONE_POWER_MESSAGE);
      }
      return false;
    }

    const combat = game.combat;
    if (!combat) return false;
    if (powerId === 'influence.colorlessRecovery') {
      const { colorlessRecoveryPreparationOpen } = await import('./colorless-recovery.js');
      if (!colorlessRecoveryPreparationOpen(this.actor, combat)) {
        ui.notifications?.warn('Colorless Recovery can only be activated during a Preparation Phase.');
        return false;
      }
    }

    const currentUses =
      powerId === REMOVE_SCAR_POWER_ID
        ? getRemoveScarResolvedMaxTier(this.actor)
        : isGenericUnifiedAccKey(accKey)
          ? getGenericStonePowerUsageCount(this.actor, powerId, combat)
          : getStoneUsageCount(this.actor, middle as AttributeKey, powerId, combat);

    if (
      !shouldSettleStoneWave({
        reviewMode: this._stoneReviewMode,
        paidAccKeys: this._stonePaidLanes.keys(),
        accKey,
        currentUses,
        usesInKey,
      })
    ) {
      return false;
    }

    // The wave cost follows the Ability's Normal / Premium Rank curve; a
    // Support-prefilled Rank costs 0. Remove Scar pays remaining unresolved
    // Ranks (Seal 1/2/4/8), not the per-round wave counter.
    const removeScarSupport =
      powerId === REMOVE_SCAR_POWER_ID
        ? getArtifactStoneSupportPrefill(this.actor, powerId, 'vitality')
        : 0;
    const settleSupport =
      powerId === REMOVE_SCAR_POWER_ID
        ? 0
        : getArtifactStoneSupportPrefill(
            this.actor,
            powerId,
            middle !== STONE_GENERIC_UNIFIED_MARKER ? (middle as AttributeKey) : undefined,
          );
    const nextCost =
      powerId === REMOVE_SCAR_POWER_ID
        ? computeRemoveScarPayment(
            currentUses,
            inferRemoveScarTargetTier(currentUses, removeScarSupport),
            removeScarSupport,
          ).sealCost
        : nextStoneWaveCost(powerId, usesInKey, settleSupport);
    const onceCluster = !!def.oncePerCombat;
    const perAttr: Record<string, number> = {};
    const raw = this.#stoneOccGetRaw(accKey);
    if (!raw.length) return false;
    if (!isGenericUnifiedAccKey(accKey) && def.attribute !== 'generic' && middle !== def.attribute) {
      return false;
    }
    const payLanes = payLanesFromAccumulator(raw, String(middle));
    if (!payLanes) return false;

    // One card can hold several complete Ranks. Extra Attack Rank 2 is 2+4
    // stones; requiring the pile to equal only the next wave (2) dropped the
    // whole payment and left the radial at one attack.
    let spendLanes = payLanes;
    let leftoverLanes: PayLane[] = [];
    let clusterPayment: CompleteStoneRankPayment | null = null;
    if (powerId === REMOVE_SCAR_POWER_ID) {
      if (payLanes.length !== nextCost) return false;
    } else if (!onceCluster) {
      const split = partitionStoneLanesByCompleteRanks(
        powerId,
        payLanes,
        usesInKey,
        settleSupport,
      );
      if (!split) return false;
      spendLanes = split.spend;
      leftoverLanes = split.leftover;
      clusterPayment = split.payment;
    }
    for (const { attr } of spendLanes) {
      if (!attr) return false;
      perAttr[attr] = (perAttr[attr] || 0) + 1;
    }

    const combatant = this.combatant || resolveStonePowersCombatant(this.actor, combat);
    if (!combatant) return false;

    if (!stonePowerAllowsColorless(powerId) && (perAttr[COLORLESS_STONE_ATTR] || 0) > 0) {
      ui.notifications?.warn(stonePowerColorlessRejectMessage(powerId));
      return false;
    }

    const deferApply = stoneResolutionKind(powerId) === 'interactive';
    let ok: boolean;
    if (powerId === REMOVE_SCAR_POWER_ID) {
      ok = await payAndApplyRemoveScar(this.actor, {
        colorlessSpent: 0,
        supportPrefillTier: removeScarSupport,
      });
    } else if (isGenericUnifiedAccKey(accKey)) {
      ok = await activateGenericStonePowerMixed({
        actor: this.actor,
        combatant,
        abilityId: powerId,
        perAttributeStones: perAttr,
        deferApply,
        ...(clusterPayment
          ? {
              tier: clusterPayment.tier,
              cost: clusterPayment.spendCount,
              ranksGained: clusterPayment.ranksGained,
            }
          : {}),
      });
    } else {
      const placed = Object.values(perAttr).reduce((sum, n) => sum + (Number(n) || 0), 0);
      ok = await activateStonePower({
        actor: this.actor,
        combatant,
        abilityId: powerId,
        colorlessSpent: perAttr[COLORLESS_STONE_ATTR] || 0,
        placedCount: onceCluster ? placed : undefined,
        deferApply,
        ...(clusterPayment
          ? {
              tier: clusterPayment.tier,
              cost: clusterPayment.spendCount,
              ranksGained: clusterPayment.ranksGained,
            }
          : {}),
      });
    }
    if (ok && deferApply) {
      this.#stageResolution(powerId, clusterPayment?.tier ?? usesInKey + 1);
    }

    if (ok) {
      // Keep the assignment as a receipt (review view) and lock it against a
      // second charge, then free the lanes for the next wave. Stones past the
      // last complete Rank move onto the next usage key so they stay visible.
      const paidValue: GenericLaneOcc[] = spendLanes.map((row) => ({ lane: row.lane, attr: row.attr }));
      this._stonePaidLanes.set(accKey, cloneLaneValue(paidValue));
      if (leftoverLanes.length && clusterPayment) {
        const newUses = usesInKey + clusterPayment.ranksGained;
        const newKey = isGenericUnifiedAccKey(accKey)
          ? genericUnifiedAccKey(powerId, newUses)
          : `${powerId}:${middle}:${newUses}`;
        const leftValue: GenericLaneOcc[] = leftoverLanes.map((row) => ({
          lane: row.lane,
          attr: row.attr,
        }));
        this.#stoneOccSet(newKey, leftValue);
      }
      this.#stoneOccSet(accKey, []);
      // If the NEXT Rank is the Support-prefilled one, it costs no Stones and
      // applies as soon as the lower Ranks are active — activate it directly.
      if (powerId !== REMOVE_SCAR_POWER_ID && !def.oncePerCombat && settleSupport > 0) {
        const usesNow = isGenericUnifiedAccKey(accKey)
          ? getGenericStonePowerUsageCount(this.actor, powerId, combat)
          : getStoneUsageCount(this.actor, middle as AttributeKey, powerId, combat);
        if (
          usesNow < STONE_TIER_HARD_MAX &&
          nextStoneWaveCost(powerId, usesNow, settleSupport) === 0 &&
          effectiveStoneSupportPrefillTier(powerId, settleSupport) === usesNow + 1
        ) {
          const deferSupport = stoneResolutionKind(powerId) === 'interactive';
          const supportTier = usesNow + 1;
          let supportOk = false;
          if (isGenericUnifiedAccKey(accKey)) {
            supportOk = await activateGenericStonePowerMixed({
              actor: this.actor,
              combatant,
              abilityId: powerId,
              perAttributeStones: {},
              deferApply: deferSupport,
            });
          } else {
            supportOk = await activateStonePower({
              actor: this.actor,
              combatant,
              abilityId: powerId,
              colorlessSpent: 0,
              deferApply: deferSupport,
            });
          }
          if (supportOk && deferSupport) this.#stageResolution(powerId, supportTier);
        }
      }
    }
    return ok;
  }

  /** Stones in a slot that do not fill the wave are not turned on. Say so. */
  #warnUnactivatedStones(): void {
    const rows = this.#listUnactivatedPlacements();
    const text = formatPendingStoneActivationWarning(rows);
    if (text) ui.notifications?.warn(text);
  }

  #listUnactivatedPlacements(): PendingStoneActivation[] {
    this.#pullSessionPartialsIntoInstance();
    const out: PendingStoneActivation[] = [];
    for (const [accKey, value] of this._stoneDropAccumulators) {
      const parsed = parseStonePowerAccKey(accKey);
      if (!parsed || !Array.isArray(value) || !value.length) continue;
      const def = STONE_POWERS[parsed.powerId];
      if (!def || this._stonePaidLanes.has(accKey)) continue;
      const payment = completeStoneRankPayment(parsed.powerId, value.length, parsed.uses, 0);
      if (payment && value.length === payment.spendCount) continue;
      const placed = payment ? value.length - payment.spendCount : value.length;
      const needed = payment
        ? stonePowerRankCost(parsed.powerId, payment.tier + 1)
        : stonePowerRankCost(parsed.powerId, parsed.uses + 1);
      const row = pendingStoneActivation({ name: def.name, placed, needed });
      if (row) out.push(row);
    }
    return out;
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

  async #gmReleasePassives(): Promise<void> {
    if (!(game as any).user?.isGM) return;
    const combat = (game as any).combat as Combat | null;
    if (!combat || !this.combatant) return;
    const actorId = String((this.actor as { id?: string }).id ?? '');
    await persistCombatantSetupStep(this.combatant, combat, {
      passivesLocked: false,
      passivesGmOpen: true,
      passivesReviewed: false,
    });
    try {
      const setup = ((combat as any).getFlag?.('mastery-system', 'encounterSetup') ?? {}) as {
        passives?: Record<string, { locked?: boolean; data?: unknown }>;
      };
      const passives = { ...(setup.passives || {}) };
      if (actorId && passives[actorId]) {
        passives[actorId] = { ...passives[actorId], locked: false };
        await (combat as any).setFlag('mastery-system', 'encounterSetup', { ...setup, passives });
      }
    } catch {
      /* combat flag is best-effort; the combatant flag is enough to edit */
    }
    ui.notifications?.info(`${(this.actor as any).name}: Passives are open again.`);
    await this.#renderKeepingScroll();
  }

  async #gmReleaseInitiative(): Promise<void> {
    if (!(game as any).user?.isGM || !this.combatant) return;
    const owner = getActionEconomyActor(this.actor) ?? this.actor;
    await releasePcInitiativeRoll(owner, this.combatant);
    if (owner !== this.actor) await releasePcInitiativeRoll(this.actor, this.combatant);
    this._colorlessConvertCount = null;
    ui.notifications?.info(
      `${(this.actor as any).name}: Initiative is open again. Roll it again.`,
    );
    await this.#renderKeepingScroll();
  }

  async #gmResetStoneAssignment(): Promise<void> {
    if (!(game as any).user?.isGM) return;
    const combat = (game as any).combat as Combat | null;
    if (!combat || !this.combatant) return;
    const owner = (getActionEconomyActor(this.actor) ?? this.actor) as any;
    const plan = owner.getFlag?.('mastery-system', STONE_POWERS_ROUND_PLAN_FLAG) as
      | StonePowersRoundPlanStored
      | undefined;
    const refund: Record<string, number> = {};
    for (const row of plan?.receipt ?? []) {
      for (const [attr, n] of Object.entries(stonesPaidInLane(row.accKey, row.value))) {
        refund[attr] = (refund[attr] || 0) + n;
      }
    }
    for (const [attr, n] of Object.entries(refund)) {
      if (n <= 0) continue;
      if (attr === COLORLESS_STONE_ATTR) {
        await addInitiativeColorlessStones(owner, n);
        continue;
      }
      const pool = getStonePool(owner, attr as AttributeKey);
      const cap = Math.max(pool.current, Math.floor(Number(pool.max) || pool.current));
      await setStonePool(owner, attr as AttributeKey, Math.min(cap, pool.current + n));
    }

    const round = Math.max(1, Number(combat.round) || 1);
    const usage = {
      ...((owner.getFlag?.('mastery-system', 'stoneUsage') as Record<string, number>) || {}),
    };
    for (const key of Object.keys(usage)) {
      if (key.includes(`:${round}:`)) delete usage[key];
    }
    try {
      await owner.setFlag('mastery-system', 'stoneUsage', usage);
    } catch {
      /* best-effort */
    }
    try {
      await clearCombatStoneTurnBonusesForActor(owner, combat);
    } catch {
      /* best-effort */
    }
    try {
      const roundState = getRoundState(owner, combat);
      if (roundState.stoneBonuses) {
        roundState.stoneBonuses.extraAttacks = 0;
        roundState.stoneBonuses.extraReactions = 0;
        roundState.stoneBonuses.extraMoveMeters = 0;
        await setRoundState(owner, roundState);
      }
    } catch {
      /* best-effort */
    }
    try {
      await owner.unsetFlag('mastery-system', STONE_POWERS_ROUND_PLAN_FLAG);
    } catch {
      /* best-effort */
    }
    try {
      await owner.unsetFlag('mastery-system', STONE_RESOLUTION_QUEUE_FLAG);
    } catch {
      /* best-effort */
    }
    this._plannedFreeRankIds.clear();
    this._resolutionBatch = [];
    this._stoneRoundPlanHydratedKey = null;
    try {
      await clearStonePowersConfigurationLock(owner);
    } catch {
      /* best-effort */
    }

    // Clear done markers with ForcedDeletion — object setFlag does not drop keys.
    try {
      const { clearStonePowersDoneForCombatant } = await import('../combat/stone-round-gate.js');
      await clearStonePowersDoneForCombatant(combat, this.combatant);
    } catch (err) {
      console.warn('Mastery System | clearStonePowersDoneForCombatant failed', err);
    }

    this.#clearSessionStoneLanesForOwner();
    this._stonePaidLanes.clear();
    this._stoneReviewMode = false;
    allowStonePowersAutoOpen();

    // Reopen prep only after done flags are cleared — otherwise reconcile
    // sees assignmentConfirmed and locks assignment again.
    try {
      const prep = readPreparationPhase(
        (owner as any).getFlag?.('mastery-system', PREPARATION_PHASE_FLAG),
        String(combat.id || ''),
        encounterStoneRound(combat),
      );
      await this.#writePreparation(reopenPreparationAssignment(prep));
    } catch {
      /* the cleared stones-done flag still reopens the round */
    }

    if (this.#isStoneAssignmentReviewMode()) {
      ui.notifications?.warn(
        `${String(owner.name || 'Character')}: Reset ran, but assignment is still locked. Check combat flags / reload.`,
      );
    } else {
      ui.notifications?.info(
        `${String(owner.name || 'Character')}: Stone assignment reset. Paid stones are back in the pool.`,
      );
    }
    await this.#renderKeepingScroll();
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
      // Paid waves already left the pool; reserving them again would hide
      // stones the player still has.
      if (this._stonePaidLanes.has(accKey)) continue;
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
    if (this._stoneReviewMode) return 0;
    return this.#reservedStonesNonFamiliar(attr);
  }

  #isStoneAssignmentReviewMode(): boolean {
    const combat = game.combat;
    if (!combat || !this.combatant) return false;
    return isStonePowersDone(combat, this.combatant.id, encounterStoneRound(combat));
  }

  #isStoneDialogLocked(): boolean {
    const combat = game.combat;
    if (!combat || !this.combatant) return false;
    if (this.#isStoneAssignmentReviewMode()) return true;
    return isStonePowersConfigurationLocked(this.actor, combat);
  }

  #actorPoolSpendable(attr: string): number {
    if (attr === COLORLESS_STONE_ATTR) {
      const owner = getActionEconomyActor(this.actor) ?? this.actor;
      const fromOwner = getSpendableColorlessStones(owner);
      if (fromOwner > 0) return fromOwner;
      return getSpendableColorlessStones(this.actor);
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

  /** Freely distributable stones left in this attribute's pool (or any pool for General). */
  #sectionHasSpendable(sectionKey: string, pools: StoneDialogPoolRow[]): boolean {
    if (sectionKey === 'general') {
      return pools.some((p) => Math.max(0, p.available - this.#reservedStonesInDialogForAttr(String(p.key))) > 0);
    }
    const pool = pools.find((p) => p.key === sectionKey);
    if (!pool) return false;
    return Math.max(0, pool.available - this.#reservedStonesInDialogForAttr(sectionKey)) > 0;
  }

  /** Stones already sitting on a power in this section (open wave or paid receipt). */
  #sectionHasAssigned(sectionKey: string): boolean {
    this.#pullSessionPartialsIntoInstance();
    const matches = (accKey: string): boolean => {
      const powerId = stonePowerAccKeyPowerId(accKey);
      if (!powerId) return false;
      const def = STONE_POWERS[powerId];
      if (!def) return false;
      if (sectionKey === 'general') return def.attribute === 'generic';
      return def.attribute === sectionKey;
    };
    for (const [accKey, val] of this._stoneDropAccumulators) {
      if (val?.length && matches(accKey)) return true;
    }
    for (const [accKey, val] of this._stonePaidLanes) {
      if (val?.length && matches(accKey)) return true;
    }
    return false;
  }

  #helpOverlay(root: HTMLElement): HTMLElement | null {
    return (
      root.querySelector('.stone-help-overlay') ||
      ((this as any).element as HTMLElement | undefined)?.querySelector('.stone-help-overlay') ||
      null
    );
  }

  #helpIsOpen(root: HTMLElement): boolean {
    const overlay = this.#helpOverlay(root);
    return !!overlay && !overlay.hasAttribute('hidden');
  }

  #bindStoneHelp(root: HTMLElement): void {
    this._helpKeyCleanup?.();
    this._helpKeyCleanup = undefined;

    root.querySelectorAll<HTMLButtonElement>('.js-stone-help').forEach((btn) => {
      btn.onclick = (ev: MouseEvent) => {
        ev.preventDefault();
        ev.stopPropagation();
        this.#openStoneHelp(root, Number(btn.dataset.helpStart || '1'));
      };
    });

    const overlay = this.#helpOverlay(root);
    if (!overlay) return;
    const frame =
      (((this as any).element as HTMLElement | undefined)?.querySelector('.window-content') as
        | HTMLElement
        | null) ?? root;
    if (overlay.parentElement !== frame) frame.appendChild(overlay);

    const closeBtn = overlay.querySelector<HTMLButtonElement>('.js-stone-help-close');
    if (closeBtn) {
      closeBtn.onclick = (ev: MouseEvent) => {
        ev.preventDefault();
        ev.stopPropagation();
        this.#closeStoneHelp(root);
      };
    }
    overlay.onclick = (ev: MouseEvent) => {
      if (ev.target === overlay) {
        ev.preventDefault();
        this.#closeStoneHelp(root);
      }
    };
    const prevBtn = overlay.querySelector<HTMLButtonElement>('.js-stone-help-prev');
    if (prevBtn) {
      prevBtn.onclick = (ev: MouseEvent) => {
        ev.preventDefault();
        ev.stopPropagation();
        this.#stepStoneHelp(root, -1);
      };
    }
    const nextBtn = overlay.querySelector<HTMLButtonElement>('.js-stone-help-next');
    if (nextBtn) {
      nextBtn.onclick = (ev: MouseEvent) => {
        ev.preventDefault();
        ev.stopPropagation();
        if (this.#readHelpPage(overlay) >= this.#helpTrack(overlay).last) {
          this.#closeStoneHelp(root);
          return;
        }
        this.#stepStoneHelp(root, 1);
      };
    }
    overlay.querySelectorAll<HTMLButtonElement>('.js-stone-help-dot').forEach((dot) => {
      dot.onclick = (ev: MouseEvent) => {
        ev.preventDefault();
        ev.stopPropagation();
        this.#showStoneHelpPage(root, Number(dot.dataset.helpIndex || '1'));
      };
    });

    const onKey = (ev: KeyboardEvent) => {
      if (!this.#helpIsOpen(root)) return;
      if (ev.key === 'Escape') {
        ev.preventDefault();
        ev.stopImmediatePropagation();
        this.#closeStoneHelp(root);
        return;
      }
      if (ev.key === 'ArrowRight') {
        ev.preventDefault();
        if (this.#readHelpPage(overlay) >= this.#helpTrack(overlay).last) return;
        this.#stepStoneHelp(root, 1);
        return;
      }
      if (ev.key === 'ArrowLeft') {
        ev.preventDefault();
        this.#stepStoneHelp(root, -1);
      }
    };
    const host = ((this as any).element as HTMLElement | undefined) ?? root;
    host.addEventListener('keydown', onKey, true);
    this._helpKeyCleanup = () => host.removeEventListener('keydown', onKey, true);
  }

  #helpTrack(overlay: HTMLElement) {
    const raw = String(overlay.dataset.helpTrack || '');
    return raw === 'stones' ? STONE_HELP_TRACKS.stones : STONE_HELP_TRACKS.initiative;
  }

  #readHelpPage(overlay: HTMLElement): number {
    return clampStoneHelpPage(Number(overlay.dataset.helpPage || '1'), this.#helpTrack(overlay));
  }

  #openStoneHelp(root: HTMLElement, startPage: number): void {
    const overlay = this.#helpOverlay(root);
    if (!overlay) return;
    const track = stoneHelpTrackForPage(startPage);
    overlay.dataset.helpTrack = track.id;
    overlay.hidden = false;
    overlay.classList.remove('is-hidden');
    const title = overlay.querySelector('#stone-help-title');
    if (title) title.textContent = track.title;
    this.#showStoneHelpPage(root, startPage);
    const closeBtn = overlay.querySelector<HTMLButtonElement>('.js-stone-help-close');
    closeBtn?.focus();
  }

  #closeStoneHelp(root: HTMLElement): void {
    const overlay = this.#helpOverlay(root);
    if (!overlay) return;
    overlay.hidden = true;
    overlay.classList.add('is-hidden');
    overlay.dataset.helpPage = String(this.#helpTrack(overlay).first);
  }

  #stepStoneHelp(root: HTMLElement, delta: number): void {
    const overlay = this.#helpOverlay(root);
    if (!overlay || !this.#helpIsOpen(root)) return;
    this.#showStoneHelpPage(root, this.#readHelpPage(overlay) + delta);
  }

  #showStoneHelpPage(root: HTMLElement, page: number): void {
    const overlay = this.#helpOverlay(root);
    if (!overlay) return;
    const track = this.#helpTrack(overlay);
    const current = clampStoneHelpPage(page, track);
    overlay.dataset.helpPage = String(current);
    overlay.querySelectorAll<HTMLElement>('.stone-help-screen').forEach((screen) => {
      const inTrack = screen.dataset.helpTrack === track.id;
      const active = inTrack && Number(screen.dataset.helpIndex) === current;
      screen.classList.toggle('is-current', active);
      screen.hidden = !active;
    });
    overlay.querySelectorAll<HTMLButtonElement>('.js-stone-help-dot').forEach((dot) => {
      const inTrack = dot.dataset.helpTrack === track.id;
      dot.hidden = !inTrack;
      dot.classList.toggle('is-current', inTrack && Number(dot.dataset.helpIndex) === current);
    });
    const total = track.last - track.first + 1;
    const index = current - track.first + 1;
    const counter = overlay.querySelector('.js-stone-help-counter');
    if (counter) counter.textContent = `${index} / ${total}`;
    const prevBtn = overlay.querySelector<HTMLButtonElement>('.js-stone-help-prev');
    if (prevBtn) prevBtn.disabled = current <= track.first;
    const nextBtn = overlay.querySelector<HTMLButtonElement>('.js-stone-help-next');
    if (nextBtn) nextBtn.textContent = current >= track.last ? 'Done' : 'Next';
  }

  #bindSectionToggles(root: HTMLElement): void {
    root.querySelectorAll<HTMLDetailsElement>('details.power-group[data-section]').forEach((el) => {
      el.addEventListener('toggle', () => {
        const key = el.dataset.section || '';
        if (!key) return;
        this._sectionOpenOverride[key] = el.open;
      });
    });
  }

  /**
   * General Power: erstes Attribut mit mindestens einem freien Stein,
   * Wits eingeschlossen. Colorless Stones sind der letzte Ausweg — sie
   * sollen nur zahlen, wenn kein Attribut-Pool mehr trägt.
   */
  #firstGenericAttrWithSpendable(poolKeys: Set<string>): string | null {
    return pickStoneFillAttribute(
      ALL_STONE_ATTRS,
      (attr) => poolKeys.has(attr),
      (attr) => this.#spendableNetForAttr(attr)
    );
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
    if (isRetiredStonePower(powerId)) {
      ui.notifications?.warn(RETIRED_STONE_POWER_MESSAGE);
      return;
    }
    if (powerId === 'wits.initiativeBoost') {
      ui.notifications?.info('Initiative Boost is spent in the Initiative bar.');
      return;
    }
    const onceDef = STONE_POWERS[powerId];
    if (onceDef?.oncePerCombat && isOncePerCombatPowerUsed(this.combatant, powerId, this.actor)) {
      ui.notifications?.warn(`${onceDef.name} may be used only once per combat.`);
      return;
    }

    const uses =
      powerId === REMOVE_SCAR_POWER_ID
        ? getRemoveScarResolvedMaxTier(this.actor)
        : isGeneric
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
    const prefillTier = getArtifactStoneSupportPrefill(
      this.actor,
      powerId,
      isGeneric ? undefined : fixedPayAttr || undefined,
    );
    const prefillRank = effectiveStoneSupportPrefillTier(powerId, prefillTier);

    // The Support-prefilled Rank costs nothing: activating it directly needs
    // no lanes at all once the lower Ranks are active.
    if (
      prefillRank > 0 &&
      uses < STONE_TIER_HARD_MAX &&
      uses + 1 === prefillRank &&
      !occ.length
    ) {
      if (stoneResolutionKind(powerId) === 'interactive') {
        this._plannedFreeRankIds.add(`${resolveStonePowerId(powerId)}:${uses + 1}`);
        ui.notifications?.info(
          `${onceDef?.name || 'Stone Power'} is planned. Confirm Stone Assignment to commit it.`,
        );
        return;
      }
      const combatant = this.combatant || resolveStonePowersCombatant(this.actor, combat);
      if (combatant) {
        if (isGeneric) {
          await activateGenericStonePowerMixed({
            actor: this.actor,
            combatant,
            abilityId: powerId,
            perAttributeStones: {},
          });
        } else {
          await activateStonePower({
            actor: this.actor,
            combatant,
            abilityId: powerId,
            colorlessSpent: 0,
          });
        }
      }
      return;
    }

    const seg = nextStoneSegmentToFill(powerId, occWithPrefill(occ, powerId, prefillRank));
    if (seg === null) {
      return;
    }

    const occSet = new Set(occ);
    const supportSet = new Set(stoneSupportPrefillLanes(powerId, prefillTier));
    const emptyInSeg = lanesInStonePaymentSegment(powerId, seg).filter(
      (l) => !occSet.has(l) && !supportSet.has(l),
    );
    emptyInSeg.sort((a, b) => a - b);

    for (const lane of emptyInSeg) {
      this.#pullSessionPartialsIntoInstance();
      occ = this.#stoneOccGet(accKey);
      if (!isLaneAllowedBySegmentUnlock(powerId, occWithPrefill(occ, powerId, prefillRank), lane)) break;

      let chosenAttr: string;
      if (isGeneric) {
        const pick = this.#firstGenericAttrWithSpendable(poolKeys);
        if (!pick) break;
        chosenAttr = pick;
      } else {
        // Attribute powers pay in their own colour; Colorless Stones fill in
        // once that pool is empty (same rule as dropping one by hand).
        const pick = pickStoneFillAttribute(
          [fixedPayAttr!],
          (attr) => stonePowerAllowsColorless(powerId) || attr !== COLORLESS_STONE_ATTR,
          (attr) => this.#spendableNetForAttr(attr)
        );
        if (!pick) break;
        chosenAttr = pick;
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
        // Per-lane form like the drop handler: a wave may mix the power's own
        // colour with Colorless Stones, and settlement needs to know which.
        const prev = this.#stoneOccGetRaw(accKey);
        const base: GenericLaneOcc[] = isGenericLaneOccArray(prev)
          ? [...(prev as GenericLaneOcc[])]
          : (prev as number[]).map((l) => ({ lane: l, attr: fixedPayAttr! }));
        base.push({ lane, attr: chosenAttr });
        base.sort((a, b) => a.lane - b.lane);
        this.#stoneOccSet(accKey, base);
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
    const uses =
      powerId === REMOVE_SCAR_POWER_ID
        ? getRemoveScarResolvedMaxTier(this.actor)
        : isGeneric
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
      // Only trim extras. Never force a full re-render here — that reset scroll
      // and fought the Available gem count from `_prepareContext`.
      while (chips.length > want) {
        const el = chips.pop();
        el?.remove();
      }
      if (chips.length < want) {
        console.log('Mastery Stones | pool chips short (no re-render)', {
          attr,
          chips: chips.length,
          want,
          spendable,
          reserved,
        });
      }
    });
  }

  /** Zeigt Steine in `slot-filled`-Zellen (ein Stein pro Feld, zurück zum Pool ziehbar). */
  #syncAccumulatorGems(root: HTMLElement): void {
    const locked = !this.#stonesEditable();
    const allowReturnDrag = !locked;

    root.querySelectorAll('.ms-stone-slot-fill .ms-slot-gem-partial').forEach((n) => n.remove());
    this.#pullSessionPartialsIntoInstance();
    for (const [accKey, lanesVal] of this._stoneDropAccumulators) {
      if (!lanesVal?.length) continue;
      const powerId = stonePowerAccKeyPowerId(accKey);
      if (!powerId) continue;
      const host = this.#powerSlotHostForAccKey(root, powerId, accKey);
      if (!host) {
        continue;
      }
      const paid = this._stonePaidLanes.has(accKey);

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

        const canReturn = allowReturnDrag && !paid;
        const gem = document.createElement('span');
        gem.className = 'ms-stone-gem-chip ms-slot-gem-partial js-stone-returnable';
        gem.setAttribute('data-acc-key', accKey);
        gem.setAttribute('data-lane-index', String(lane));
        gem.setAttribute('data-return-attribute-key', payAttr);
        gem.title = paid
          ? 'Already paid — stays booked for this round'
          : canReturn
            ? 'Drag back to the matching pool'
            : this._stoneReviewMode
              ? 'This round is confirmed — view only'
              : 'Round locked — cannot return';
        gem.draggable = canReturn;
        gem.classList.toggle('is-drag-disabled', !canReturn);
        gem.classList.toggle('is-paid', paid);
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
   * Slot host of a power, but only when the rendered wave matches `accKey`.
   * A restored snapshot of an older wave must not paint into the lanes of the
   * next one (that made paid stones look assigned again).
   */
  #powerSlotHostForAccKey(root: HTMLElement, powerId: string, accKey: string): HTMLElement | null {
    const esc = escapeAttrValueInCssSelector(powerId);
    const host = root.querySelector(`.power-drop-slots[data-power-id="${esc}"]`) as HTMLElement | null;
    if (!host) return null;
    const rendered = host.getAttribute('data-acc-key') || host.dataset.accKey || '';
    if (rendered && rendered !== accKey) return null;
    return host;
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
      const host = this.#powerSlotHostForAccKey(root, powerId, accKey);
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
        const pending = !!el.closest('.power-card-general')?.classList.contains('is-pending');
        el.style.setProperty(
          'background',
          pending ? 'rgba(255, 152, 0, 0.2)' : 'rgba(76, 175, 80, 0.28)',
          'important',
        );
        el.style.setProperty(
          'border-color',
          pending ? '#ff9800' : 'rgba(102, 187, 106, 0.95)',
          'important',
        );
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
      const cluster = host.querySelector('.ms-stone-drop-slot-cluster');
      const firstLanes = cluster?.classList.contains('is-ramp-skip') ? [1, 2] : [0];
      const primed = firstLanes.every((lane) => {
        const slot = host.querySelector(`.ms-stone-drop-slot[data-lane-index="${lane}"]`);
        return !!slot && slot.classList.contains('slot-filled');
      });
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
    const editingLocked = () => !this.#stonesEditable();
    const locked = editingLocked();
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
        if (editingLocked() || !ev.dataTransfer) {
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
      if (editingLocked()) {
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
        await this.#renderKeepingScroll();
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

      if (editingLocked()) {
        ui.notifications?.warn(
          this.#stoneResolutionPending() || this._resolutionRunning
            ? 'Stone assignment is already committed.'
            : 'This round is locked for Stone Powers.',
        );
        return;
      }
      const dropPowerId =
        slot.dataset.powerId ||
        (slot.closest('.power-drop-slots') as HTMLElement | null)?.dataset.powerId ||
        '';
      if (isRetiredStonePower(dropPowerId)) {
        ui.notifications?.warn(RETIRED_STONE_POWER_MESSAGE);
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
      if (powerId === 'wits.initiativeBoost') {
        ui.notifications?.info('Initiative Boost is spent in the Initiative bar.');
        return;
      }
      if (
        STONE_POWERS[powerId]?.oncePerCombat &&
        isOncePerCombatPowerUsed(this.combatant, powerId, this.actor)
      ) {
        ui.notifications?.warn(`${STONE_POWERS[powerId].name} may be used only once per combat.`);
        return;
      }
      const isColorless = dragged === COLORLESS_STONE_ATTR;
      if (isColorless && !stonePowerAllowsColorless(powerId)) {
        ui.notifications?.warn(stonePowerColorlessRejectMessage(powerId));
        return;
      }
      let payAttr: AttributeKey | typeof COLORLESS_STONE_ATTR;
      if (isGeneric) {
        payAttr = dragged as AttributeKey | typeof COLORLESS_STONE_ATTR;
        if (!powerId || !dragged) {
          return;
        }
        if (!poolKeys.has(dragged) && !isColorless) {
          ui.notifications?.warn('This stone belongs to no pool on this sheet.');
          return;
        }
        if (!isColorless) this._generalAttrSelection[powerId] = payAttr as AttributeKey;
      } else {
        payAttr = (slot.dataset.payAttribute || '') as AttributeKey;
        if (!powerId || !payAttr) {
          return;
        }
        if (dragged !== payAttr && !isColorless) {
          ui.notifications?.warn('Wrong stone — attribute does not match this slot.');
          return;
        }
        if (isColorless) payAttr = COLORLESS_STONE_ATTR;
      }

      const slotPayAttr = (slot.dataset.payAttribute || payAttr) as AttributeKey;
      const uses =
        powerId === REMOVE_SCAR_POWER_ID
          ? getRemoveScarResolvedMaxTier(this.actor)
          : isGeneric
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

      const dropPrefillRank = effectiveStoneSupportPrefillTier(
        powerId,
        getArtifactStoneSupportPrefill(
          this.actor,
          powerId,
          isGeneric ? undefined : slotPayAttr,
        ),
      );
      if (isGeneric) {
        this.#mergeLegacyGenericIntoUnified(powerId, uses);
        accKey = genericUnifiedAccKey(powerId, uses);
        occ = this.#stoneOccGet(accKey);
        if (occ.includes(laneIndex)) {
          return;
        }
        if (!isLaneAllowedBySegmentUnlock(powerId, occWithPrefill(occ, powerId, dropPrefillRank), laneIndex)) {
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
        if (!isLaneAllowedBySegmentUnlock(powerId, occWithPrefill(occ, powerId, dropPrefillRank), laneIndex)) {
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
      await this.#renderKeepingScroll();
    };

    const onDelegateReturnDragStart = (ev: DragEvent) => {
      const t = ev.target as HTMLElement;
      if (!t?.classList?.contains('js-stone-returnable')) return;
      if (editingLocked() || !ev.dataTransfer) {
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
      if (editingLocked()) return;
      const t = ev.target as HTMLElement;
      if (t.closest('.js-stone-draggable') || t.closest('.js-stone-returnable')) return;
      if (t.closest('button, a, input, select, textarea, label, summary, .js-stone-section-toggle')) return;
      const resolved = resolvePowerCardContext(t);
      if (!resolved) return;
      if (resolved.powerId === 'wits.initiativeBoost') return;

      ev.preventDefault();
      ev.stopPropagation();
      const { powerId, isGeneric, fixedPayAttr } = resolved;
      await this.#autoFillPowerCluster(powerId, isGeneric, fixedPayAttr, poolKeys);
      await this.#renderKeepingScroll();
    };

    /** Rechtsklick: Kampf-Macht leeren. */
    const onPowerCardContextMenu = async (ev: MouseEvent) => {
      if (editingLocked()) return;
      const t = ev.target as HTMLElement;

      if (t.closest('.js-stone-draggable') || t.closest('.js-stone-returnable')) return;

      const resolved = resolvePowerCardContext(t);
      if (!resolved) return;

      ev.preventDefault();
      const { powerId, isGeneric, fixedPayAttr } = resolved;
      this.#clearPowerStonePlan(powerId, isGeneric, fixedPayAttr);
      this.#reconcileFilledLaneClasses(bindTarget);
      this.#syncAccumulatorGems(bindTarget);
      await this.#renderKeepingScroll();
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

  #isValidLaneSnapshotValue(accKey: string, v: unknown): v is StoneAccumulatorValue {
    if (!Array.isArray(v) || v.length === 0) return false;
    if (isGenericLaneOccArray(v as StoneAccumulatorValue)) {
      // Attribute powers also use the per-lane form once a Colorless Stone
      // pays part of the wave.
      return (v as GenericLaneOcc[]).every(
        (o) => Number.isFinite(o?.lane) && typeof o?.attr === 'string' && !!o.attr
      );
    }
    if (isGenericUnifiedAccKey(accKey)) return false;
    return (v as unknown[]).every((n) => typeof n === 'number' && Number.isFinite(n));
  }

  async #syncStonePowersRoundPlanWithCombat(): Promise<void> {
    const ownerDoc = (getActionEconomyActor(this.actor) ?? this.actor) as any;
    const combat = game.combat;
    let plan = ownerDoc.getFlag('mastery-system', STONE_POWERS_ROUND_PLAN_FLAG) as
      | StonePowersRoundPlanStored
      | undefined
      | null;

    if (
      plan &&
      combat &&
      (String(plan.combatId) !== String(combat.id) || Number(plan.round) !== encounterStoneRound(combat))
    ) {
      try {
        await ownerDoc.unsetFlag('mastery-system', STONE_POWERS_ROUND_PLAN_FLAG);
      } catch (e) {
        console.warn('Mastery System | Could not clear stale stone round plan', e);
      }
      try {
        await ownerDoc.unsetFlag('mastery-system', STONE_RESOLUTION_QUEUE_FLAG);
      } catch (e) {
        console.warn('Mastery System | Could not clear stale stone resolution queue', e);
      }
      plan = undefined;
      this._stoneRoundPlanHydratedKey = null;
      this._stonePaidLanes.clear();
      if (!this._stoneReviewMode) this.#clearSessionStoneLanesForOwner();
    }

    if (!plan) return;
    const receipt = plan.receipt ?? [];
    if (!plan.lanes?.length && !receipt.length) return;

    const hydrateKey = `${plan.combatId}\0${plan.round}`;
    if (this._stoneRoundPlanHydratedKey === hydrateKey) return;

    const aid = this.#stoneLaneOwnerActorId();
    if (!aid) return;

    const prefix = `${aid}\0`;
    for (const k of [...StonePowersDialog._sessionStoneLanes.keys()]) {
      if (k.startsWith(prefix)) StonePowersDialog._sessionStoneLanes.delete(k);
    }

    for (const row of plan.lanes ?? []) {
      if (!row?.accKey) continue;
      const raw = cloneLaneValue(row.value);
      if (!this.#isValidLaneSnapshotValue(row.accKey, raw)) continue;
      StonePowersDialog._sessionStoneLanes.set(`${aid}\0${row.accKey}`, raw);
    }

    // Paid waves come back for display only — `#trySettleStonePayment` refuses
    // every accKey in `_stonePaidLanes`, so reopening can never charge again.
    for (const row of receipt) {
      if (!row?.accKey) continue;
      const raw = cloneLaneValue(row.value);
      if (!this.#isValidLaneSnapshotValue(row.accKey, raw)) continue;
      this._stonePaidLanes.set(row.accKey, raw);
      StonePowersDialog._sessionStoneLanes.set(`${aid}\0${row.accKey}`, cloneLaneValue(raw));
    }

    this._stoneDropAccumulators.clear();
    this.#pullSessionPartialsIntoInstance();
    this._stoneRoundPlanHydratedKey = hydrateKey;
  }

  async #persistStonePowersRoundPlan(): Promise<void> {
    const combat = game.combat;
    if (!combat || !this.combatant) return;
    this.#pullSessionPartialsIntoInstance();
    const ownerDoc = (getActionEconomyActor(this.actor) ?? this.actor) as any;
    const aid = this.#stoneLaneOwnerActorId();
    if (!aid) return;

    const prefix = `${aid}\0`;
    const lanes: StonePowersLaneSnapshot[] = [];

    for (const [composite, val] of StonePowersDialog._sessionStoneLanes) {
      if (!composite.startsWith(prefix)) continue;
      if (!val || !Array.isArray(val) || val.length === 0) continue;
      const accKey = composite.slice(prefix.length);
      if (this._stonePaidLanes.has(accKey)) continue;
      lanes.push({ accKey, value: cloneLaneValue(val) });
    }

    const receipt: StonePowersLaneSnapshot[] = [];
    for (const [accKey, val] of this._stonePaidLanes) {
      if (!val?.length) continue;
      receipt.push({ accKey, value: cloneLaneValue(val) });
    }

    try {
      await ownerDoc.setFlag('mastery-system', STONE_POWERS_ROUND_PLAN_FLAG, {
        combatId: combat.id,
        round: encounterStoneRound(combat),
        lanes,
        receipt,
      } as any);
    } catch (err) {
      console.warn('Mastery System | Could not persist stone assignment snapshot', err);
    }
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

    ui.notifications?.info('Stone Power defaults saved (applied on new rounds while enabled).');
  }
  
  async _onClose(_options: any): Promise<void> {
    const committed = _options?.committed === true;
    const force = _options?.force === true;
    // Sync dismiss BEFORE any await — otherwise resume reopens mid-close.
    if (!committed) {
      try {
        dismissStonePowersPrompt(game.combat, this.actor, this.combatant);
      } catch {
        /* optional outside combat */
      }
    }
    this.#pullSessionPartialsIntoInstance();
    const withTimeout = async <T>(p: Promise<T>, ms = 4000): Promise<T | undefined> => {
      try {
        return await Promise.race([
          p,
          new Promise<undefined>((resolve) => {
            window.setTimeout(() => resolve(undefined), ms);
          }),
        ]);
      } catch (err) {
        console.warn('Mastery System | Stone Powers close step failed', err);
        return undefined;
      }
    };
    if (committed && !force) {
      // Confirm pays before close and passes alreadySettled. A plain close
      // (the window control during planning) must not pay or resolve.
      if (_options?.alreadySettled !== true) {
        try {
          await this.#flushCompletedStonePaymentsFromAccumulators();
          this.#warnUnactivatedStones();
          await this.#persistStonePowersRoundPlan();
        } catch (err) {
          console.error('Mastery System | Stone payment on confirm failed', err);
        }
      }
      // Immediate per-player chat (stones + Natural Recovery), then mark done.
      try {
        if (game.combat) {
          await ensureAutoNaturalRecoveryForSingleEffect(this.actor, game.combat);
          const { announceActorStoneAssignment } = await import('../combat/stone-assignment-chat.js');
          const { getActionEconomyActor } = await import('../combat/action-economy.js');
          const owner = getActionEconomyActor(this.actor) ?? this.actor;
          const plan = (owner as any).getFlag?.('mastery-system', STONE_POWERS_ROUND_PLAN_FLAG) as
            | StonePowersRoundPlanStored
            | null
            | undefined;
          await announceActorStoneAssignment(
            this.actor,
            plan?.receipt ?? null,
            encounterStoneRound(game.combat),
          );
        }
      } catch (err) {
        console.warn('Mastery System | stone assignment chat skipped', err);
      }
      // Every entry point counts as confirmed (player pipeline, GM fill, setup
      // status row, forced dialog) — otherwise the encounter stays blocked
      // although the player pressed the button.
      try {
        const { confirmStonePowersForCombatant } = await import('../combat/stone-powers-flow.js');
        await withTimeout(confirmStonePowersForCombatant(game.combat, this.combatant));
      } catch (err) {
        console.warn('Mastery System | Could not register stone confirmation', err);
      }
      if (this.combatant && game.combat) {
        try {
          const { handleInitiativeConfirmed } = await import('../combat/encounter-start.js');
          const ini = Math.max(0, Math.floor(Number(this.combatant.initiative) || 0));
          await withTimeout(handleInitiativeConfirmed(game.combat, this.combatant.id, ini));
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
    this._helpKeyCleanup?.();
    this._helpKeyCleanup = undefined;
    if (this.resolve) {
      this.resolve(committed && !force);
      this.resolve = undefined;
    }
    return super._onClose(_options);
  }
}
