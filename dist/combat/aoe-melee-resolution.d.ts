/**
 * Melee weapon AoE — secondary target resolution.
 *
 * Since the Area-TN rework the AoE roll hits every target in the area with a
 * single roll. Secondaries may spend their Reaction on **Dive for Cover**
 * (move up to 2 × own Mastery Rank meters; fully outside the area = not
 * affected). Targets that stay take the power splash dice, plus Hex/Sundered
 * vulnerability dice depending on whether the power was a spell.
 */
/**
 * @deprecated Legacy Body-save DC (pre Area-TN rules). Kept for old callers.
 */
export declare function aoeSecondaryBodySaveDc(masteryRank: number): number;
/** Dive-for-Cover movement allowance of the diving creature (2 × own MR). */
export declare function diveForCoverDistanceM(actor: any): number;
/**
 * After the AoE roll reached the Area TN and primary damage is resolved:
 * every secondary is hit. Before the payload lands, each may spend a Reaction
 * on Dive for Cover (move up to 2 × own MR meters; fully outside = not
 * affected). Targets that stay take the splash dice + Hex/Sundered dice.
 */
export declare function resolveAoeMeleeSecondaries(params: {
    attacker: any;
    attackerMasteryRank: number;
    secondaryTokenIds: string[];
    powerBonusDice: number;
    /** True when the AoE power is a spell (Hex applies); otherwise Sundered. */
    isSpell?: boolean;
}): Promise<void>;
//# sourceMappingURL=aoe-melee-resolution.d.ts.map