/**
 * Upgrade Step Cutover — Coerce `system.xp.currentStep` to the new shape.
 *
 * One-time, idempotent migration that runs once per world at Foundry's
 * `ready` hook (GM only). For every character actor it:
 *   1. Normalizes `system.xp.currentStep` to
 *      `{ attributes: [], skills: [], powers: [], artifacts: [] }`.
 *      Any pre-existing string IDs are preserved if the field happens to
 *      already be the new shape.
 *   2. Deletes `system.xp.spentAttributes` (no longer enforced).
 *
 * All other XP fields (`system.points.xp`, `system.xp.totalEarned`,
 * `system.xp.totalSpent`, `system.xp.history`, `system.xp.attributeBaselines`,
 * `system.xp.postCreationProgress`) are left untouched.
 *
 * The new rule is structural, not numeric, so no XP refund is needed.
 *
 * Rerun guard:
 *   `game.settings.get('mastery-system', 'xpCurrentStepCutoverRun') === true`
 */
export declare function registerXpCurrentStepCutoverSetting(): void;
/** Execute the one-shot XP Upgrade-Step shape cutover. Idempotent per world. */
export declare function runXpCurrentStepCutover(): Promise<void>;
//# sourceMappingURL=xp-currentstep-cutover.d.ts.map