/**
 * What a character's current sheet is worth under today's XP tables.
 *
 * This ignores granted XP, history, and migrations. The free start is not
 * XP: the Attribute package, up to 40 Character Creation Skill Points (max 4
 * per Skill), creation Power ranks, and Artifact level 1. Ranks paid with
 * unspent Skill Points are Skill Points, not XP. Artifact activation costs
 * nothing beyond the level table, and level 1 is free. Echo Artifacts use that
 * same level table: the granted level 1 costs nothing, later levels cost XP.
 */
export interface BuildValue {
    attributes: number;
    skills: number;
    powers: number;
    artifacts: number;
    /** Attributes + Skills + Powers + Artifacts. Unspent XP is not included. */
    net: number;
    unspentSkillPoints: number;
    /** Regular XP still in the pool. Not part of `net`. */
    unspentXp: number;
    unspentFreeXp: number;
    skillBasis: 'snapshot' | 'creation-cap';
    /** Artifact level 1 and equipping an Artifact. Always 0 under current rules. */
    artifactActivation: number;
    notes: string[];
}
/** Compressed XP above the free 4/4/3/3/2/2/2 package. The highest values keep the highest free ranks. */
export declare function attributeXpAboveFreePackage(values: Record<string, number>): {
    xp: number;
    belowPackage: boolean;
};
export declare function appraiseBuild(actor: any): BuildValue;
/** XP still to grant so Nach Ausgabe reaches `target`. Already at or above the target needs nothing. */
export declare function xpGrantToTarget(afterSpend: number, target: number): number;
/** GM settings table, with Bonus XP, history, and progression reset. */
export declare function buildValueTableHtml(actors: any[]): string;
//# sourceMappingURL=build-value.d.ts.map