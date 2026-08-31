/**
 * Rules for upgrading artifact evolution items on actors (Mastery Rank gates, costs)
 * AND binding rules (Artifact Capacity, Echo-bound, slot blocking).
 *
 * XP spec — Artifacts:
 *   • Flat 8 XP per +1 artifact level (`ARTIFACT_UPGRADE_XP_COST`).
 *   • Attunement / Binding Ritual is one-time and free (no Stone Bind/Seal/Burn).
 *   • Artifact Level 1 is free after Attunement. Further levels cost 8 XP.
 *   • Mastery-Rank Artifact Level Gate: min(10, max(1, (MR − 1) × 2)).
 *
 * New Artifact spec (Artefacts.md):
 *   • Artifact Capacity = flat 4 simultaneous bound Artifacts per character
 *     (`ARTIFACT_CAPACITY_DEFAULT`). Echo Artifacts count against this.
 *   • Bindings come in three flavors: `unbound`, `bound`, `echo`.
 *     `echo` bindings cannot be unbound through normal means.
 */

import {
  getActionEconomyActor,
  STONE_POOL_ATTRIBUTE_KEYS,
  type AttributeKey,
} from '../combat/action-economy.js';
import { getStoneGemStyle } from './stone-attribute-ui.js';
import {
  ARTIFACT_MAX_LEVEL as SPEC_ARTIFACT_MAX_LEVEL,
  type ArtifactSlot,
} from './artifact-rules.js';

const STONE_POOL_LABELS: Record<string, string> = {
  might: 'Might',
  agility: 'Agility',
  vitality: 'Vitality',
  intellect: 'Intellect',
  resolve: 'Resolve',
  influence: 'Influence',
  wits: 'Wits',
};

export interface ArtifactStonePoolOption {
  key: string;
  label: string;
  spendable: number;
  fill: string;
  stroke: string;
  canSpend: boolean;
}

export const ARTIFACT_UPGRADE_XP_COST = 8;
/** Attunement / Binding Ritual does not Bind, Seal, Burn, or reserve a Stone. */
export const ARTIFACT_LINK_STONE_COST = 0;
export const ARTIFACT_MAX_SYSTEM_LEVEL = 10;

/**
 * New spec: flat Artifact Capacity. Every character can bind up to four
 * Artifacts at the same time, regardless of Mastery Rank. Echo Artifacts
 * count against this number.
 */
export const ARTIFACT_CAPACITY_DEFAULT = 4;

/**
 * Returns the flat Artifact Capacity for a character. The old MR×2 formula
 * has been replaced by a single value; `masteryRank` is kept in the signature
 * so callers that still pass it do not break.
 */
export function getArtifactCapacityForMasteryRank(_masteryRank?: number): number {
  return ARTIFACT_CAPACITY_DEFAULT;
}

/**
 * Maximum Artifact Level by Mastery Rank.
 *   MR 1 → 1, MR 2 → 2, MR 3 → 4, MR 4 → 6, MR 5 → 8, MR 6+ → 10
 * Formula: min(10, max(1, (Mastery Rank − 1) × 2))
 */
export function getMaxArtifactSystemLevelForMasteryRank(masteryRank?: number): number {
  const mr = Math.max(1, Math.floor(Number(masteryRank) || 1));
  return Math.min(ARTIFACT_MAX_SYSTEM_LEVEL, Math.max(1, (mr - 1) * 2));
}

/** Same MR gate as system level (spec levels 1..10). */
export function getMaxArtifactSpecLevelForMasteryRank(masteryRank?: number): number {
  return Math.min(SPEC_ARTIFACT_MAX_LEVEL, getMaxArtifactSystemLevelForMasteryRank(masteryRank));
}

/**
 * True when an existing Artifact Level is above the actor's current MR cap.
 * Callers must flag this — never silently reduce the stored level.
 */
export function artifactExceedsMasteryRankCap(level: number, masteryRank?: number): boolean {
  const lv = Math.max(0, Math.floor(Number(level) || 0));
  return lv > getMaxArtifactSystemLevelForMasteryRank(masteryRank);
}

/** Attunement has no Mastery-Rank requirement (MR 1 may attune a Level 1 Artifact). */
export function canArtifactLink(_masteryRank?: number): boolean {
  return true;
}

function economyActor(actor: any): any {
  return getActionEconomyActor(actor) ?? actor;
}

/** Spendable stones in one attribute pool (`current − sustained`). */
export function poolSpendableStones(actor: any, attr: string): number {
  const sys = (economyActor(actor)?.system as any) || {};
  const pool = sys.stonePools?.[attr];
  if (!pool) return 0;
  const max = Math.max(0, Number(pool.max) || 0);
  if (max <= 0) return 0;
  // Never treat more stones than the pool can actually hold as spendable. A
  // stale/inflated `current` (e.g. after the attribute max was lowered) must
  // not let a player commit more permanent artifact bindings than capacity.
  const current = Math.min(max, Math.max(0, Number(pool.current) || 0));
  const sustained = Math.max(0, Number(pool.sustained) || 0);
  return Math.max(0, current - sustained);
}

/** Total spendable stones across all attribute pools (falls back to legacy `stones.current`). */
export function actorStonesCurrent(actor: any): number {
  const sys = (economyActor(actor)?.system as any) || {};
  const pools = sys.stonePools;
  if (pools && typeof pools === 'object' && Object.keys(pools).length > 0) {
    let total = 0;
    for (const attr of STONE_POOL_ATTRIBUTE_KEYS) {
      total += poolSpendableStones(actor, attr);
    }
    return total;
  }
  const legacyCur = Math.max(0, Number(sys.stones?.current) || 0);
  const legacyMax = Math.max(0, Number(sys.stones?.maximum) || 0);
  return legacyMax > 0 ? Math.min(legacyCur, legacyMax) : legacyCur;
}

/** True when the actor uses per-attribute `stonePools` (not legacy `stones.current` only). */
export function usesStonePoolEconomy(actor: any): boolean {
  const pools = (economyActor(actor)?.system as any)?.stonePools;
  return !!(pools && typeof pools === 'object' && Object.keys(pools).length > 0);
}

/** Pools the player may choose from when activating an artifact. */
export function listArtifactSpendableStonePools(actor: any): ArtifactStonePoolOption[] {
  if (!usesStonePoolEconomy(actor)) return [];
  const sys = (economyActor(actor)?.system as any) || {};
  const pools = sys.stonePools || {};
  const out: ArtifactStonePoolOption[] = [];
  for (const attr of STONE_POOL_ATTRIBUTE_KEYS) {
    const spendable = poolSpendableStones(actor, attr);
    const max = Math.max(0, Number(pools[attr]?.max) || 0);
    if (max <= 0 && spendable <= 0) continue;
    const style = getStoneGemStyle(attr) ?? { fill: '#888888', stroke: '#aaaaaa' };
    out.push({
      key: attr,
      label: STONE_POOL_LABELS[attr] || attr,
      spendable,
      fill: style.fill,
      stroke: style.stroke,
      canSpend: spendable >= ARTIFACT_LINK_STONE_COST,
    });
  }
  return out;
}

/** Activation is free (Artefacts.md) — always true, kept for callers. */
export function canSpendArtifactLinkStone(_actor: any): boolean {
  return true;
}

/** Activation is free (Artefacts.md) — always true, kept for callers. */
export function canSpendArtifactLinkStoneFromPool(_actor: any, _stoneAttr: string): boolean {
  return true;
}

export function getArtifactStonePoolLabel(attr: string): string {
  return STONE_POOL_LABELS[attr] || attr;
}

/** Activation no longer costs a Stone (Artefacts.md) — no-op, kept for callers. */
export async function spendArtifactLinkStone(_actor: Actor, _stoneAttr?: string): Promise<boolean> {
  return true;
}

/** No activation Stone exists any more — nothing to refund. */
export async function refundArtifactLinkStone(_actor: Actor, _stoneAttr?: string): Promise<boolean> {
  return true;
}

// ----------------------------------------------------------------------
// Binding model
// ----------------------------------------------------------------------

/** Binding kind for an artifact instance on a character. */
export type ArtifactBindingKind = 'unbound' | 'bound' | 'echo';

/** Per-actor progress record kept on the root world item flag. */
export interface ArtifactActorProgress {
  nodeId: string;
  linked: boolean;
}

/** Read progress from root item flag (supports legacy number = old "level" only). */
export function readActorArtifactProgress(flagVal: unknown, rootNodeId: string): ArtifactActorProgress {
  if (flagVal && typeof flagVal === 'object' && !Array.isArray(flagVal) && typeof (flagVal as any).nodeId === 'string') {
    const o = flagVal as any;
    return {
      nodeId: String(o.nodeId || rootNodeId),
      linked: Boolean(o.linked),
    };
  }
  if (typeof flagVal === 'number' && flagVal >= 1) {
    return { nodeId: rootNodeId, linked: false };
  }
  return { nodeId: rootNodeId, linked: false };
}

export function serializeActorArtifactProgress(p: ArtifactActorProgress): Record<string, unknown> {
  return {
    nodeId: p.nodeId,
    linked: p.linked,
  };
}

/**
 * Read the binding kind off an embedded artifact item.
 * - `flags['mastery-system'].echoBound` set → `'echo'`
 * - `system.binding === 'bound'` OR linked progress on root → `'bound'`
 * - else `'unbound'`
 */
export function getArtifactBindingKind(item: any): ArtifactBindingKind {
  if (!item) return 'unbound';
  const echoBound = item.getFlag?.('mastery-system', 'echoBound');
  if (echoBound) return 'echo';
  const sysBinding = (item.system as any)?.binding;
  if (sysBinding === 'echo') return 'echo';
  if (sysBinding === 'bound') return 'bound';
  return 'unbound';
}

/** True when the artifact occupies a paperdoll slot or is echo-bound (always worn). */
export function isArtifactEquippedOnActor(item: any): boolean {
  if (!item) return false;
  if (getArtifactBindingKind(item) === 'echo') return true;
  if ((item.system as any)?.equipped === true) return true;
  try {
    const flagSlot = item.getFlag?.('mastery-system', 'equipment')?.slot;
    if (typeof flagSlot === 'string' && flagSlot.length > 0) return true;
  } catch {
    // ignore
  }
  return false;
}

/**
 * Read whether this embedded artifact is activated for the actor.
 * Level 1 is free and artifacts start active. `artifactActivated === false`
 * is the player opt-out; a missing flag counts as active for echo / bound /
 * equipped items.
 */
export function isArtifactLinkedOnActor(actor: any, item: any): boolean {
  if (!item || !actor?.id) return false;

  const activated = item.getFlag?.('mastery-system', 'artifactActivated');
  if (activated === true) return true;
  if (activated === false) return false;

  const kind = getArtifactBindingKind(item);
  if (kind === 'echo' || kind === 'bound') return true;
  if (isArtifactEquippedOnActor(item)) return true;

  const rootWorldId = item.getFlag?.('mastery-system', 'evolutionRootItemId');
  if (!rootWorldId) return false;
  const root = (typeof game !== 'undefined' ? (game as any)?.items?.get(rootWorldId) : null);
  if (!root) return false;
  const rootNodeId = root.getFlag?.('mastery-system', 'nodeId') as string | undefined;
  if (!rootNodeId) return false;
  const actorLevels = (root.getFlag?.('mastery-system', 'actorLevels') || {}) as Record<string, unknown>;
  return readActorArtifactProgress(actorLevels[actor.id], rootNodeId).linked;
}

/** Equipped and activated — required for mechanical artifact benefits. */
export function isArtifactMechanicallyActive(actor: any, item: any): boolean {
  if (!item || item.type !== 'artifact') return false;
  return isArtifactEquippedOnActor(item) && isArtifactLinkedOnActor(actor, item);
}

/**
 * True when the artifact's POWERS (level-progression actives, movement,
 * reactions, its own attack entry) are available to the actor.
 *
 * An explicitly inactive artifact keeps its passive weapon damage — an
 * inactive artifact greatsword still swings for its derived dice — but grants
 * none of its powers. Missing flags default to active (Level 1 is free).
 * Ad-hoc artifacts without a tree stay fully enabled.
 */
export function artifactPowersUnlocked(actor: any, item: any): boolean {
  if (!item || item.type !== 'artifact') return false;
  const activated = item.getFlag?.('mastery-system', 'artifactActivated');
  if (activated === true) return true;
  if (activated === false) return false;
  if (item.getFlag?.('mastery-system', 'evolutionRootItemId')) {
    return isArtifactLinkedOnActor(actor, item);
  }
  return true;
}

/**
 * Count how many of the actor's embedded artifact items currently count
 * against Artifact Capacity. An item counts when its binding is `bound`
 * or `echo`. Unbound items in inventory do not count.
 */
export function countBoundArtifacts(actor: any): number {
  if (!actor) return 0;
  let count = 0;
  const items = actor.items;
  if (!items?.filter) return 0;
  const list: any[] = Array.from(items.filter((it: any) => it.type === 'artifact'));
  for (const it of list) {
    const kind = getArtifactBindingKind(it);
    if (kind === 'bound' || kind === 'echo') count++;
  }
  return count;
}

/**
 * True if the actor can bind one more Artifact. Echo-bound artifacts
 * still count against capacity but can never be unbound, so we treat
 * them as occupying a permanent capacity slot.
 */
export function canBindMoreArtifacts(actor: any): boolean {
  return countBoundArtifacts(actor) < ARTIFACT_CAPACITY_DEFAULT;
}

/**
 * True if the actor can equip an artifact that occupies the given slot keys
 * (paperdoll keys, e.g. `['mainhand','offhand']` for a two-handed weapon).
 * Returns false when any of the requested slots is already occupied by a
 * different artifact / equipped item.
 */
export function canEquipArtifactInSlots(actor: any, slotKeys: string[]): boolean {
  if (!actor || !Array.isArray(slotKeys) || slotKeys.length === 0) return false;
  const items = actor.items;
  if (!items?.filter) return true;
  const occupied = new Set<string>();
  for (const it of Array.from<any>(items)) {
    const flagSlot = it.getFlag?.('mastery-system', 'equipment')?.slot;
    if (typeof flagSlot === 'string' && flagSlot) occupied.add(flagSlot);
    const sysEq = (it.system as any)?.equipped;
    if (sysEq && Array.isArray((it.system as any)?.equipSlots)) {
      for (const s of (it.system as any).equipSlots) {
        if (typeof s === 'string') occupied.add(s);
      }
    }
  }
  return slotKeys.every((s) => !occupied.has(s));
}

/**
 * Look up the canonical artifact slot stored on an item. Falls back to
 * inferring from artifactKind / gearSlot if the new `slot` field is missing.
 */
export function getArtifactSlot(item: any): ArtifactSlot | null {
  if (!item) return null;
  const sys = item.system as any;
  const explicit = sys?.slot;
  if (typeof explicit === 'string' && explicit) {
    return explicit as ArtifactSlot;
  }
  // Legacy fallback — map old artifactKind/gearSlot to canonical slot.
  const kind = String(sys?.artifactKind || 'weapon');
  const hands = Number(sys?.artifactWeapon?.hands || 1);
  if (kind === 'weapon') return hands >= 2 ? 'mainHand' : 'mainHand';
  if (kind === 'shield') return 'offHand';
  if (kind === 'armor') return 'body';
  if (kind === 'gear') {
    const g = String(sys?.gearSlot || '');
    // Canonical paperdoll keys
    if (g === 'head' || g === 'helmet') return 'head';
    if (g === 'feet' || g === 'boot') return 'feet';
    if (g === 'amulet' || g === 'necklace') return 'amulet';
    if (g === 'ring' || g === 'ring1' || g === 'ring2') return 'ring';
    if (g === 'body' || g === 'chest') return 'body';
  }
  return null;
}

// ----------------------------------------------------------------------
// Taint stages (declarative — unused at runtime)
// ----------------------------------------------------------------------

export type TaintStage = 0 | 1 | 2 | 3 | 4;

export interface TaintStageDefinition {
  stage: TaintStage;
  name: string;
  trigger: string;
  effect: string;
}

export const TAINT_STAGES: readonly TaintStageDefinition[] = [
  {
    stage: 0,
    name: 'Harmony',
    trigger: 'The bearer lives in alignment with the Taint.',
    effect: 'The item grows as intended. New powers unlock normally.',
  },
  {
    stage: 1,
    name: 'Irritation',
    trigger: 'The Taint is ignored for an extended period.',
    effect: 'No new powers. The item "goes silent."',
  },
  {
    stage: 2,
    name: 'Fracture',
    trigger: 'Repeated, active disobedience or contradictory behavior.',
    effect: 'One ability of the item is blocked or shut down.',
  },
  {
    stage: 3,
    name: 'Wrath',
    trigger: 'Mockery, cleansing, or rejection of the Taint.',
    effect:
      'The item harms the bearer (e.g. 1d10 psychic), inflicts nightmares, or imposes disadvantage on checks.',
  },
  {
    stage: 4,
    name: 'Collapse / Corruption',
    trigger: 'Permanent disobedience.',
    effect: 'The item breaks and becomes unusable for this bearer.',
  },
];

export function getTaintStage(stage: number): TaintStageDefinition {
  const idx = Math.min(4, Math.max(0, Math.floor(Number(stage) || 0))) as TaintStage;
  return TAINT_STAGES[idx];
}
