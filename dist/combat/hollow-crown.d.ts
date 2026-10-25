/**
 * Hollow Crown (Deathless Echo) runtime helpers.
 * Deathless Body, Life Absorption caps, Hollow Stillness.
 */
export type DeathlessBodyStage = 0 | 1 | 2 | 3;
/** Shift steps and max penalty fraction by Hollow Crown level. */
export declare function deathlessBodyStageForArtifactLevel(artifactLevel: number): DeathlessBodyStage;
export declare function deathlessBodyShiftSteps(stage: DeathlessBodyStage): number;
/** Maximum normal Health Penalty fraction after Deathless Body. */
export declare function deathlessBodyMaxPenaltyFraction(stage: DeathlessBodyStage): number;
export declare function lifeAbsorptionMaxStones(artifactLevel: number): number;
export declare function hollowStillnessPoolBonus(artifactLevel: number): number;
export declare function hollowStillnessHasAdvantage(artifactLevel: number): boolean;
/** Highest Hollow Crown currentLevel on the actor (0 if none). */
export declare function hollowCrownLevel(actor: any): number;
/**
 * Apply Deathless Body to a Health Penalty fraction for the active bar index.
 * Shifts the index toward Healthy (lower index) by `shift` steps, then caps.
 */
export declare function applyDeathlessBodyToFraction(activeIndex: number, fractionTable: readonly number[], stage: DeathlessBodyStage): number;
//# sourceMappingURL=hollow-crown.d.ts.map