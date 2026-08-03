/**
 * Combat Initiative Hooks (optional entry)
 * Default module wiring uses stone-powers-flow + executeInitiativePhase after stones each round.
 * Avoid registering duplicate initiative phases alongside module.ts / stone-powers-flow.
 */
import { log } from '../utils/logger.js';
export function initializeCombatHooks() {
    log.debug('Mastery System | initializeCombatHooks: no extra hooks (initiative runs after stone powers)');
}
//# sourceMappingURL=initiative.js.map