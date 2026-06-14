/**
 * Ground-truth XP recalculation.
 *
 * Recomputes a character's *invested* XP directly from the current build
 * (attributes, skills, power levels) measured against the immutable
 * post-creation baseline, then redistributes the two XP pools so that
 * `invested = freeSpent + regularSpent` with the **Free pool spent first**
 * (matching the live spend logic), and derives the correct available XP.
 *
 * This deliberately ignores the XP history log, so it self-corrects accounting
 * drift caused by buggy / duplicated refund entries (e.g. the old Combat
 * Package Wizard "power upgrade refund" over-refund).
 */
export interface XpRecalcResult {
    ok: boolean;
    error?: string;
    /** Lifetime earned regular XP. */
    totalEarned: number;
    /** Lifetime earned Free XP. */
    freeEarned: number;
    attributeSpent: number;
    skillSpent: number;
    powerSpent: number;
    /** Total XP invested in the current build (attributes + skills + powers). */
    totalInvested: number;
    /** Correct regular spent (after Free pool absorbs as much as possible). */
    regularSpent: number;
    /** Correct Free spent. */
    freeSpent: number;
    /** Correct regular available. */
    available: number;
    /** Correct Free available. */
    freeAvailable: number;
    previousAvailable: number;
    previousFreeAvailable: number;
    previousSpent: number;
    previousFreeSpent: number;
    /** Change in regular available. */
    delta: number;
    /** Change in Free available. */
    freeDelta: number;
    /** Change in total spendable (regular + free). */
    totalDelta: number;
    /** True when any pool value changes. */
    changed: boolean;
}
/**
 * Recompute the correct XP balance for `actor` from its current build.
 * Returns `ok:false` with an `error` when no post-creation snapshot exists
 * (attributes / skills cannot be measured without a baseline).
 */
export declare function computeGroundTruthXp(actor: any): XpRecalcResult;
/** HTML breakdown for the GM confirm dialog. */
export declare function formatXpRecalcHtml(actorName: string, r: XpRecalcResult): string;
//# sourceMappingURL=xp-recalc.d.ts.map