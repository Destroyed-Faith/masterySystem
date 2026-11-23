/**
 * Describes the outcome of flat Armor + DR% mitigation.
 * `mitigatedDamage` is the value the caller forwards to Temp-HP/bars.
 * Damage reduced to 0 deals 0 (Core v0.9.9.6: there is no natural-8 minimum).
 */
export interface DefensiveMitigationResult {
    /** Raw damage passed in (unchanged). */
    rawDamage: number;
    /** Flat Armor subtracted before DR% (sheet + Guard / reaction armor). */
    armorApplied: number;
    /** Portion of `armorApplied` that came from Guard / reaction Armor this hit. */
    reactionArmorApplied: number;
    /** Effective DR% on the post-armor pool (0–100), after sequential base + reaction steps. */
    drPercent: number;
    /** Damage value fed into Temp-HP consumption. */
    mitigatedDamage: number;
    /**
     * Human-readable single-line summary for the chat card, e.g.
     *   "Raw 14 → Armor 4 → Guard +8 → DR 20% → 8"
     */
    breakdownLine: string;
}
export interface DefensiveMitigationInput {
    rawDamage: number;
    /** Flat Armor pool on the target (from `system.combat.armorTotal`). */
    armorTotal: number;
    /** Percentage DR on the target (from `system.combat.damageReductionPct`). */
    damageReductionPct: number;
    /**
     * Per-hit Reaction Armor (Basic Guard, Ally Armor, …). Added after sheet Armor
     * for this strike only; shown separately in the breakdown.
     */
    reactionArmorFlat?: number;
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
//# sourceMappingURL=damage-mitigation.d.ts.map