/**
 * Stones permanently committed to activated artifacts (`artifactActivationStoneAttr`).
 * These must stay out of Stone Powers distribution and survive pool refills.
 */
/** Count activation stones locked to artifacts, optionally filtered by pool attribute. */
export declare function countArtifactActivationStones(actor: any, attr?: string): number;
/** Pool capacity minus sustained and artifact-bound stones (round-1 refill target). */
export declare function effectiveStonePoolAfterBindings(maxStones: number, sustained: number, artifactBound: number): number;
//# sourceMappingURL=artifact-stone-bound.d.ts.map