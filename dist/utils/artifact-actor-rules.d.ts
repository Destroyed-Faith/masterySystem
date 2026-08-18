/**
 * Rules for upgrading artifact evolution items on actors (Mastery Rank gates, costs)
 * AND binding rules (Artifact Capacity, Echo-bound, slot blocking).
 *
 * New XP spec — Artifacts:
 *   • Flat 8 XP per +1 artifact level (`ARTIFACT_UPGRADE_XP_COST`).
 *   • Maximum reachable artifact level = `(MR - 1) × 2`, capped at 16
 *     (`getMaxArtifactSystemLevelForMasteryRank`). MR 1 cannot evolve at all.
 *   • Link / activation: 1 Stone once per artifact (`ARTIFACT_LINK_STONE_COST`).
 *   • Per-upgrade Stone costs and the legacy XP Ultimate cost have been removed.
 *
 * New Artifact spec (Artefacts.md):
 *   • Artifact Capacity = flat 4 simultaneous bound Artifacts per character
 *     (`ARTIFACT_CAPACITY_DEFAULT`). Echo Artifacts count against this.
 *   • Bindings come in three flavors: `unbound`, `bound`, `echo`.
 *     `echo` bindings cannot be unbound through normal means.
 */
import { type ArtifactSlot } from './artifact-rules.js';
export interface ArtifactStonePoolOption {
    key: string;
    label: string;
    spendable: number;
    fill: string;
    stroke: string;
    canSpend: boolean;
}
export declare const ARTIFACT_UPGRADE_XP_COST = 8;
export declare const ARTIFACT_LINK_STONE_COST = 1;
export declare const ARTIFACT_MAX_SYSTEM_LEVEL = 10;
/**
 * New spec: flat Artifact Capacity. Every character can bind up to four
 * Artifacts at the same time, regardless of Mastery Rank. Echo Artifacts
 * count against this number.
 */
export declare const ARTIFACT_CAPACITY_DEFAULT = 4;
/**
 * Returns the flat Artifact Capacity for a character. The old MR×2 formula
 * has been replaced by a single value; `masteryRank` is kept in the signature
 * so callers that still pass it do not break.
 */
export declare function getArtifactCapacityForMasteryRank(_masteryRank?: number): number;
/**
 * Max artifact system.level the actor may reach:
 *   `(MR - 1) × 2`, capped at `ARTIFACT_MAX_SYSTEM_LEVEL` (10).
 *   MR 1 → 0 (no link / no upgrades). MR 6+ → 10.
 */
export declare function getMaxArtifactSystemLevelForMasteryRank(masteryRank: number): number;
/**
 * Max spec-level (1..10) an actor may reach. Mirrors the spec ARTIFACT_MAX_LEVEL
 * but allows MR gating in the future. For now: MR 2+ may reach level 10.
 */
export declare function getMaxArtifactSpecLevelForMasteryRank(masteryRank: number): number;
export declare function canArtifactLink(masteryRank: number): boolean;
/** Spendable stones in one attribute pool (`current − sustained − artifact-bound`). */
export declare function poolSpendableStones(actor: any, attr: string): number;
/** Total spendable stones across all attribute pools (falls back to legacy `stones.current`). */
export declare function actorStonesCurrent(actor: any): number;
/** True when the actor uses per-attribute `stonePools` (not legacy `stones.current` only). */
export declare function usesStonePoolEconomy(actor: any): boolean;
/** Pools the player may choose from when activating an artifact. */
export declare function listArtifactSpendableStonePools(actor: any): ArtifactStonePoolOption[];
export declare function canSpendArtifactLinkStone(actor: any): boolean;
export declare function canSpendArtifactLinkStoneFromPool(actor: any, stoneAttr: string): boolean;
export declare function getArtifactStonePoolLabel(attr: string): string;
/** Deduct one Stone from the chosen attribute pool (or legacy `stones.current`). */
export declare function spendArtifactLinkStone(actor: Actor, stoneAttr?: string): Promise<boolean>;
/** Refund one activation Stone to the pool it was spent from (GM reset). */
export declare function refundArtifactLinkStone(actor: Actor, stoneAttr?: string): Promise<boolean>;
/** Binding kind for an artifact instance on a character. */
export type ArtifactBindingKind = 'unbound' | 'bound' | 'echo';
/** Per-actor progress record kept on the root world item flag. */
export interface ArtifactActorProgress {
    nodeId: string;
    linked: boolean;
}
/** Read progress from root item flag (supports legacy number = old "level" only). */
export declare function readActorArtifactProgress(flagVal: unknown, rootNodeId: string): ArtifactActorProgress;
export declare function serializeActorArtifactProgress(p: ArtifactActorProgress): Record<string, unknown>;
/**
 * Read the binding kind off an embedded artifact item.
 * - `flags['mastery-system'].echoBound` set → `'echo'`
 * - `system.binding === 'bound'` OR linked progress on root → `'bound'`
 * - else `'unbound'`
 */
export declare function getArtifactBindingKind(item: any): ArtifactBindingKind;
/** True when the artifact occupies a paperdoll slot or is echo-bound (always worn). */
export declare function isArtifactEquippedOnActor(item: any): boolean;
/**
 * Read whether this embedded artifact is activated for the actor.
 * Echo artifacts use `artifactActivated` on the item; legacy world `linked`
 * alone does not activate Echo items (prevents auto-linked grant state).
 */
export declare function isArtifactLinkedOnActor(actor: any, item: any): boolean;
/** Equipped and activated — required for mechanical artifact benefits. */
export declare function isArtifactMechanicallyActive(actor: any, item: any): boolean;
/**
 * True when the artifact's POWERS (level-progression actives, movement,
 * reactions, its own attack entry) are available to the actor.
 *
 * An inactive (not yet activated / linked) artifact keeps its passive weapon
 * damage — an inactive artifact greatsword still swings for its derived dice —
 * but grants none of its powers. Ad-hoc artifacts without activation tracking
 * (no `artifactActivated` flag and not wired to an evolution tree) stay fully
 * enabled for backwards compatibility.
 */
export declare function artifactPowersUnlocked(actor: any, item: any): boolean;
/**
 * Count how many of the actor's embedded artifact items currently count
 * against Artifact Capacity. An item counts when its binding is `bound`
 * or `echo`. Unbound items in inventory do not count.
 */
export declare function countBoundArtifacts(actor: any): number;
/**
 * True if the actor can bind one more Artifact. Echo-bound artifacts
 * still count against capacity but can never be unbound, so we treat
 * them as occupying a permanent capacity slot.
 */
export declare function canBindMoreArtifacts(actor: any): boolean;
/**
 * True if the actor can equip an artifact that occupies the given slot keys
 * (paperdoll keys, e.g. `['mainhand','offhand']` for a two-handed weapon).
 * Returns false when any of the requested slots is already occupied by a
 * different artifact / equipped item.
 */
export declare function canEquipArtifactInSlots(actor: any, slotKeys: string[]): boolean;
/**
 * Look up the canonical artifact slot stored on an item. Falls back to
 * inferring from artifactKind / gearSlot if the new `slot` field is missing.
 */
export declare function getArtifactSlot(item: any): ArtifactSlot | null;
export type TaintStage = 0 | 1 | 2 | 3 | 4;
export interface TaintStageDefinition {
    stage: TaintStage;
    name: string;
    trigger: string;
    effect: string;
}
export declare const TAINT_STAGES: readonly TaintStageDefinition[];
export declare function getTaintStage(stage: number): TaintStageDefinition;
//# sourceMappingURL=artifact-actor-rules.d.ts.map