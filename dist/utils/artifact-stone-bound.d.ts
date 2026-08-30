/**
 * Legacy leftover: older worlds stored `artifactActivationStoneAttr` as a
 * permanent Link-Stone reservation. Attunement no longer reserves a Stone.
 * Collectors remain so a GM can clear stale flags; spendable-pool math
 * must not subtract these bindings.
 */
export interface ArtifactActivationBinding {
    /** Canonical key for the artifact tree (root world id / echo key / item id). */
    rootKey: string;
    /** Attribute pool the activation stone is bound to. */
    stoneAttr: string;
    /** Display name of the artifact that binds the stone. */
    artifactName: string;
}
/**
 * Collect the actor's currently-binding artifact activations, deduplicated per
 * artifact tree. Self-healing: only counts artifacts that are still
 * `artifactActivated === true` AND worn — so a GM reset / unequip / stale
 * duplicate immediately releases the stone. Duplicate embedded copies of the
 * same artifact tree only ever bind a single stone.
 */
export declare function collectArtifactActivationBindings(actor: any): ArtifactActivationBinding[];
/** Artifact names binding a stone, grouped by attribute pool. */
export declare function artifactBindingNamesByAttr(actor: any): Record<string, string[]>;
/**
 * Permanent Link-Stone reservation is retired. Always returns 0 so spendable
 * pools, Stone Power gems, and printouts never treat Attunement as a Bind.
 * Use `collectArtifactActivationBindings` only to find leftover flags to clear.
 */
export declare function countArtifactActivationStones(_actor?: any, _attr?: string): number;
/** Pool capacity minus sustained and artifact-bound stones (round-1 refill target). */
export declare function effectiveStonePoolAfterBindings(maxStones: number, sustained: number, artifactBound: number): number;
//# sourceMappingURL=artifact-stone-bound.d.ts.map