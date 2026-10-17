/**
 * Stone System Hooks
 *
 * Manages:
 * - Turn state resets
 * - End-of-round regeneration
 * - Post-combat full restore
 */
import { resetTurnState, restoreStonesAfterCombat, initializeCombatRoundState, clearStonePowersConfigurationLocksInCombat, clearCombatStoneTurnBonusesForActor, armDefensiveStoneExpiry, releaseDefensiveStoneExpiry, } from '../combat/action-economy.js';
import { runMasteryCombatRoundAdvancePipeline, runPlayerOwnedRoundAdvance, } from '../combat/stone-powers-flow.js';
import { endMinorMagicRestForCombat } from '../utils/minor-magic-items.js';
import { canCurrentUserUpdateDocument } from '../combat/combat-permissions.js';
import { MASTERY_SKIP_TURN_BONUS_CLEAR, shouldClearTurnStoneBonuses, } from '../combat/combat-update-options.js';
/**
 * Last combatant who actually held the spotlight, per combat id.
 * Used instead of `(turn - 1) % len`, which falsely expires prepare-phase /
 * post-stone bonuses when initiative sync jumps `combat.turn` before anyone acted.
 */
const lastSpotlightCombatantIdByCombat = new Map();
/**
 * Initialize stone system hooks
 */
export function initializeStoneHooks() {
    // Hook: Combat started - initialize round state
    Hooks.on('combatStart', async (combat) => {
        if (!game.user?.isGM)
            return;
        await initializeCombatRoundState(combat);
        try {
            await endMinorMagicRestForCombat(combat);
        }
        catch (err) {
            console.warn('Mastery System | endMinorMagicRestForCombat failed', err);
        }
    });
    // Hook: Combat turn/round changes
    Hooks.on('updateCombat', async (combat, changes, options, _userId) => {
        const combatId = String(combat?.id ?? '');
        const newSpotlightId = String(combat.combatant?.id ?? '');
        // Turn changed — expire the previous spotlight's "this turn" stone bonuses
        // (+8 Evade, Martial Damage dice, armor pen, …). Skip administrative jumps
        // (initiative sync after Stone Powers, round wrap) so prepare/round buys survive.
        if (changes.turn !== undefined && combat.started) {
            const prevSpotlightId = combatId
                ? lastSpotlightCombatantIdByCombat.get(combatId)
                : undefined;
            const clearPrev = shouldClearTurnStoneBonuses({
                skipFlag: options?.[MASTERY_SKIP_TURN_BONUS_CLEAR] === true,
                roundChanged: changes.round !== undefined,
                prevSpotlightId,
                newSpotlightId,
            });
            if (clearPrev && prevSpotlightId) {
                const prevCombatant = combat.combatants?.get?.(prevSpotlightId) ??
                    Array.from(combat.combatants ?? []).find((c) => String(c?.id ?? '') === prevSpotlightId);
                const prevActor = prevCombatant?.actor;
                if (prevActor && canCurrentUserUpdateDocument(prevActor)) {
                    try {
                        await clearCombatStoneTurnBonusesForActor(prevActor, combat);
                        await armDefensiveStoneExpiry(prevActor, combat);
                    }
                    catch (e) {
                        console.warn('Mastery System | clearCombatStoneTurnBonusesForActor failed', e);
                    }
                }
            }
            if (combatId && newSpotlightId) {
                lastSpotlightCombatantIdByCombat.set(combatId, newSpotlightId);
            }
        }
        if (changes.turn !== undefined) {
            const currentCombatant = combat.combatant;
            if (currentCombatant && currentCombatant.actor && canCurrentUserUpdateDocument(currentCombatant.actor)) {
                try {
                    await releaseDefensiveStoneExpiry(currentCombatant.actor, combat);
                }
                catch (e) {
                    console.warn('Mastery System | releaseDefensiveStoneExpiry failed', e);
                }
                await resetTurnState(currentCombatant.actor, combat);
            }
        }
        // Round changed: GM resets everyone; players still open their own stone dialogs
        // (Join Game As has no GM client, so that path is the only prompt).
        if (changes.round !== undefined) {
            const newRound = changes.round;
            if (game.user?.isGM) {
                await runMasteryCombatRoundAdvancePipeline(combat, newRound);
            }
            else {
                await runPlayerOwnedRoundAdvance(combat, newRound);
            }
        }
    });
    // Hook: Combat ended - restore stone pools to full
    Hooks.on('deleteCombat', async (combat, _options, _userId) => {
        const id = String(combat?.id ?? '');
        if (id)
            lastSpotlightCombatantIdByCombat.delete(id);
        await finishCombat(combat, 'deleteCombat');
    });
    // Also trigger on explicit combatEnd
    Hooks.on('combatEnd', async (combat) => {
        const id = String(combat?.id ?? '');
        if (id)
            lastSpotlightCombatantIdByCombat.delete(id);
        await finishCombat(combat, 'combatEnd');
    });
}
/**
 * Post-encounter cleanup: locks, Temp HP, Colorless Stones, NPC-side ongoing
 * effects, then refill the stone pools. Runs for whichever of `combatEnd` /
 * `deleteCombat` Foundry emits first; every step is idempotent.
 */
async function finishCombat(combat, hook) {
    if (!game.user?.isGM) {
        try {
            const { clearOwnedInitiativeColorlessAfterCombat } = await import('../combat/combat-end-cleanup.js');
            await clearOwnedInitiativeColorlessAfterCombat(combat);
        }
        catch (e) {
            console.warn(`Mastery System | Owned colorless leftover cleanup on ${hook} failed`, e);
        }
        return;
    }
    await clearStonePowersConfigurationLocksInCombat(combat);
    try {
        const { runCombatEndCleanup } = await import('../combat/combat-end-cleanup.js');
        await runCombatEndCleanup(combat);
    }
    catch (e) {
        console.warn(`Mastery System | Combat end cleanup on ${hook} failed`, e);
    }
    await restoreStonesAfterCombat(combat);
}
// Legacy functions removed - now handled by action-economy.ts
//# sourceMappingURL=stone-hooks.js.map