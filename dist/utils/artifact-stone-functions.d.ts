/**
 * Artifact Stone Function aggregator
 *
 * Walks an actor's equipped (or echo-bound) artifacts and resolves their
 * Stone Function (the unique "engine" slot on every artifact). One Stone
 * Function per artifact, attribute-gated by the artifact slot.
 *
 * Surfaces:
 *   - `getArtifactStoneSupportPrefill(actor, powerId, poolAttribute?)`
 *       → tier (0..4) the matching Stone Power Support prefills.
 *   - `getArtifactStoneFunctionStatus(actor)`
 *       → list of `{kind, attribute, level, value, source, stonePowerId?}`.
 *   - `getArtifactStonePoolExtraByAttribute(actor)` → per-attribute extra
 *     stones from `stonePool` functions.
 *   - `getArtifactStoneRefreshExtraByAttribute(actor)` → per-attribute
 *     per-round refresh from `stoneRefresh` functions.
 *   - `getArtifactStoneBatteryCapacityByAttribute(actor)` → per-attribute
 *     battery slots from `stoneBattery` functions.
 *
 * The helpers never mutate the actor. They're called from
 * `prepareDerivedData` (read-only) and from `activateStonePower` (read-only).
 */
import type { ArtifactStoneFunctionKind } from '../types/item.js';
export interface ArtifactStoneFunctionRecord {
    kind: ArtifactStoneFunctionKind;
    /** Attribute pool this function is tied to (e.g. 'might', 'agility'). */
    attribute: string;
    /** Resolved artifact level. */
    level: number;
    /** Numeric value the function contributes (tier for Support, stones for Pool/Refresh/Battery). */
    value: number;
    /** Source artifact item name (for breakdown). */
    source: string;
    /** Source artifact item id. */
    artifactItemId?: string;
    /** Stone Power id (only set for Support). */
    stonePowerId?: string;
}
/**
 * Collect every Stone Function on an equipped / echo-bound artifact.
 * Pure / non-mutating.
 */
export declare function getArtifactStoneFunctions(actor: any): ArtifactStoneFunctionRecord[];
export declare function getArtifactStonePoolExtraByAttribute(actor: any): Record<string, number>;
export declare function getArtifactStoneRefreshExtraByAttribute(actor: any): Record<string, number>;
export declare function getArtifactStoneBatteryCapacityByAttribute(actor: any): Record<string, number>;
/**
 * Highest tier prefilled by any matching Stone Power Support on the actor.
 *
 * Match rules:
 *   • Support's `stonePowerId` must equal `powerId` exactly.
 *   • If `poolAttribute` is provided, the Support's attribute must also
 *     equal the pool attribute (for attribute-scoped pools).
 *
 * Returns 0 when no matching Support exists, otherwise the prefill tier
 * (1..4). The activation pipeline interprets this as "the first
 * activation of `powerId` acts as if it had been used `prefill-1` times
 * already this turn".
 */
export declare function getArtifactStoneSupportPrefill(actor: any, powerId: string, poolAttribute?: string): number;
/**
 * Status summary suitable for the character sheet / stone dialog.
 */
export declare function getArtifactStoneFunctionStatus(actor: any): {
    records: ArtifactStoneFunctionRecord[];
    pool: Record<string, number>;
    refresh: Record<string, number>;
    battery: Record<string, number>;
    supports: ArtifactStoneFunctionRecord[];
};
//# sourceMappingURL=artifact-stone-functions.d.ts.map