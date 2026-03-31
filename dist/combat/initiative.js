/**
 * Combat Initiative Hooks (optional entry)
 * Default module wiring uses stone-powers-flow + executeInitiativePhase after stones each round.
 * Avoid registering duplicate initiative phases alongside module.ts / stone-powers-flow.
 */
export function initializeCombatHooks() {
    console.log('Mastery System | initializeCombatHooks: no extra hooks (initiative runs after stone powers)');
}
//# sourceMappingURL=initiative.js.map