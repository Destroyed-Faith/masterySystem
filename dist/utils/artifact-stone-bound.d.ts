/**
 * Stones permanently committed to activated artifacts (`artifactActivationStoneAttr`).
 * These must stay out of Stone Powers distribution and survive pool refills.
 */
export interface ArtifactActivationBinding {
    /** Canonical key for the artifact tree (root world id / echo key / item id). */
    rootKey: string;
    /** Attribute pool the activation stone is bound to. */
    stoneAttr: string;
}
/**
 * Collect the actor's currently-binding artifact activations, deduplicated per
 * artifact tree. Self-healing: only counts artifacts that are still
 * `artifactActivated === true` AND worn — so a GM reset / unequip / stale
 * duplicate immediately releases the stone. Duplicate embedded copies of the
 * same artifact tree only ever bind a single stone.
 */
export declare function collectArtifactActivationBindings(actor: any): ArtifactActivationBinding[];
/** Count activation stones locked to artifacts, optionally filtered by pool attribute. */
export declare function countArtifactActivationStones(actor: any, attr?: string): number;
/** Pool capacity minus sustained and artifact-bound stones (round-1 refill target). */
export declare function effectiveStonePoolAfterBindings(maxStones: number, sustained: number, artifactBound: number): number;
//# sourceMappingURL=artifact-stone-bound.d.ts.map