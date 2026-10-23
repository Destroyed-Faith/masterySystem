/**
 * @deprecated DF 2026-10-23 retired post-roll Skill Point spending.
 * Skill rolls use Specialization Raises declared before the roll.
 * Kept as a no-op so module bootstrap and legacy imports keep working;
 * old chat cards with `spend-skill-success` buttons are inert.
 */
export function registerSkillSpendClickHandler() {
    console.info('Mastery System | registerSkillSpendClickHandler is deprecated (DF 2026: Skill Spend retired); no handler registered.');
}
//# sourceMappingURL=skill-spend-handler.js.map