/**
 * The four skill-use boxes on the sheet / printout.
 *
 * A skill is not spent point-by-point: it has four uses per Safe Haven Rest
 * and each use costs the current Mastery Rank. The rating (capped at MR × 4)
 * fills those boxes left to right, so raising MR recomputes every box.
 * Example: 8 points at MR 2 → [2, 2, 2, 2]; the same 8 at MR 3 → [3, 3, 2, 0].
 * All four boxes read 3 only at MR 3 with 12 points invested.
 */
export declare const SKILL_USE_BOX_COUNT = 4;
export interface SkillUseBoxView {
    index: number;
    /** Points this box holds — Mastery Rank, or less on a short leftover. */
    size: number;
    used: number;
    remaining: number;
    unavailable: boolean;
    spent: boolean;
    state: 'available' | 'spent' | 'locked';
}
export declare function skillUsePointsPerBox(masteryRank: number): number;
export declare function buildSkillUseBoxes(rating: number, spent: number, masteryRank: number): SkillUseBoxView[];
//# sourceMappingURL=skill-use-boxes.d.ts.map