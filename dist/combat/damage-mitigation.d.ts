/**
 * Describes the outcome of flat Armor + DR% mitigation.
 * `mitigatedDamage` is the value the caller forwards to Temp-HP/bars.
 */
export interface DefensiveMitigationResult {
    /** Raw damage passed in (unchanged). */
    rawDamage: number;
    /** Flat Armor subtracted before DR%. */
    armorApplied: number;
    /** Effective DR% on the post-armor pool (0–100), after sequential base + reaction steps. */
    drPercent: number;
    /** Damage value fed into Temp-HP consumption after the 8s-floor. */
    mitigatedDamage: number;
    /** `true` if the 8s-minimum-rule kicked in (post-mitigation ≤ 0 but 8s > 0). */
    min8sUsed: boolean;
    /** Number of natural 8s that propagated into this mitigation call. */
    count8s: number;
    /**
     * Human-readable single-line summary for the chat card, e.g.
     *   "Raw 14 → Armor 4 → DR 20% → 8"
     */
    breakdownLine: string;
}
export interface DefensiveMitigationInput {
    rawDamage: number;
    /** Natural 8s rolled across all damage dice for this strike. */
    count8s: number;
    /** Flat Armor pool on the target (from `system.combat.armorTotal`). */
    armorTotal: number;
    /** Percentage DR on the target (from `system.combat.damageReductionPct`). */
    damageReductionPct: number;
    /**
     * Per-hit Reaction-DR bonus (%). Applied **after** continuous `damageReductionPct`
     * on the post-armor remainder for this strike only.
     */
    reactionDrPct?: number;
    /**
     * Armor Penetration for THIS hit (Penetration(X) Special, weapon riders,
     * Might "Ignore Armor" stones). Rulebook defense sequence: "Penetration
     * reduces Armor first, then subtract the remaining Armor." Never reduces
     * Armor below 0 and never adds damage on its own.
     */
    armorPenetration?: number;
}
/**
 * Pure helper — no actor mutations. See module docstring for pipeline order.
 */
export declare function applyDefensiveMitigation(input: DefensiveMitigationInput): DefensiveMitigationResult;
/** Extract `count8s` from a Foundry Roll (sums natural 8s across all d8 terms). */
export declare function countNaturalEightsInRoll(roll: any): number;
/** Sum `count8s` across a list of Foundry Rolls. */
export declare function countNaturalEights(rolls: Iterable<any>): number;
//# sourceMappingURL=damage-mitigation.d.ts.map