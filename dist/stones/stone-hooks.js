/**
 * Stone System Hooks
 *
 * Manages:
 * - Turn state resets
 * - End-of-round regeneration
 * - Post-combat full restore
 */
import { resetTurnState, resetRoundState, regenStonesEndOfRound, restoreStonesAfterCombat, initializeCombatRoundState } from '../combat/action-economy.js';
/**
 * Initialize stone system hooks
 */
export function initializeStoneHooks() {
    // Hook: Combat started - initialize round state
    Hooks.on('combatStart', async (combat) => {
        console.log('Mastery System | Combat started, initializing round state');
        await initializeCombatRoundState(combat);
    });
    // Hook: Combat turn/round changes
    Hooks.on('updateCombat', async (combat, changes, _options, _userId) => {
        console.log('Mastery System | updateCombat hook', { changes });
        // Turn changed - reset turn state for new current combatant
        if (changes.turn !== undefined) {
            const currentCombatant = combat.combatant;
            if (currentCombatant && currentCombatant.actor) {
                await resetTurnState(currentCombatant.actor, combat);
                console.log(`Mastery System | Turn state reset for ${currentCombatant.name}`);
            }
        }
        // Round changed - reset round state and trigger stone regeneration
        if (changes.round !== undefined) {
            const newRound = changes.round;
            // Reset round state for all combatants
            for (const combatant of combat.combatants) {
                const actor = combatant.actor;
                if (actor) {
                    await resetRoundState(actor, combatant, combat);
                }
            }
            // Trigger stone regeneration if round > 1
            if (newRound > 1) {
                console.log(`Mastery System | Round changed to ${newRound}, triggering stone regen`);
                await regenStonesEndOfRound(combat);
            }
        }
    });
    // Hook: Combat ended - restore stone pools to full
    Hooks.on('deleteCombat', async (combat, _options, _userId) => {
        console.log('Mastery System | Combat ended, restoring stone pools');
        await restoreStonesAfterCombat(combat);
    });
    // Also trigger on explicit combatEnd
    Hooks.on('combatEnd', async (combat) => {
        console.log('Mastery System | Combat end hook, restoring stone pools');
        await restoreStonesAfterCombat(combat);
    });
}
// Legacy functions removed - now handled by action-economy.ts
//# sourceMappingURL=stone-hooks.js.map