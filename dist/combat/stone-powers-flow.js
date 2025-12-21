/**
 * Stone Powers Flow Management
 * Handles opening Stone Powers dialogs for all combatants at the start of each round
 */
import { StonePowersDialog } from '../stones/stone-powers-dialog.js';
import { InitiativeShopDialog } from './initiative-shop-dialog.js';
import { rollInitiativeForCombatant } from './initiative-roll.js';
const SOCKET_NAME = 'system.mastery-system';
/**
 * Get stone powers state from combat flags
 */
function getStonePowersState(combat) {
    const flags = combat.flags['mastery-system'] || {};
    const state = flags.stonePowersState;
    if (!state) {
        return {
            roundStonesPrompted: {},
            stonesDone: {},
            initiativeShopDone: false
        };
    }
    return state;
}
/**
 * Update stone powers state in combat flags
 */
async function updateStonePowersState(combat, updates) {
    const current = getStonePowersState(combat);
    const updated = { ...current, ...updates };
    await combat.setFlag('mastery-system', 'stonePowersState', updated);
}
/**
 * Mark a combatant as done with stone powers for a round
 */
async function markStonePowersDone(combat, combatantId, round) {
    const state = getStonePowersState(combat);
    state.stonesDone[combatantId] = round;
    await updateStonePowersState(combat, { stonesDone: state.stonesDone });
}
/**
 * Check if all combatants have completed stone powers for a round
 */
function areAllCombatantsDone(combat, round) {
    const state = getStonePowersState(combat);
    const allCombatants = Array.from(combat.combatants);
    return allCombatants.every((combatant) => {
        return state.stonesDone[combatant.id] === round;
    });
}
/**
 * Open Stone Powers dialog for a single combatant
 * For NPCs, auto-resolve (mark as done immediately)
 */
async function openStonePowersForCombatant(combat, combatant, round) {
    const actor = combatant.actor;
    if (!actor) {
        console.warn('Mastery System | Cannot open stone powers: no actor for combatant', combatant.id);
        await markStonePowersDone(combat, combatant.id, round);
        return;
    }
    // For NPCs, auto-resolve (just mark as done)
    if (actor.type === 'npc' || actor.type === 'summon' || actor.type === 'divine') {
        console.log('Mastery System | Auto-resolving stone powers for NPC', actor.name);
        await markStonePowersDone(combat, combatant.id, round);
        return;
    }
    // For PCs, check if user owns this actor
    const user = game.user;
    if (!user) {
        await markStonePowersDone(combat, combatant.id, round);
        return;
    }
    // Only show to owner or GM
    if (!user.isGM && !actor.isOwner) {
        // Not the owner - mark as done (will be handled by owner's client)
        await markStonePowersDone(combat, combatant.id, round);
        return;
    }
    // Show dialog to owner/GM
    try {
        console.log('Mastery System | Opening stone powers dialog for', actor.name, 'round', round);
        await StonePowersDialog.showForActor(actor, combatant);
        // Dialog closed - mark as done
        await markStonePowersDone(combat, combatant.id, round);
        console.log('Mastery System | Stone powers completed for', actor.name, 'round', round);
    }
    catch (error) {
        console.error('Mastery System | Error in stone powers dialog', error);
        // Mark as done even on error to prevent blocking
        await markStonePowersDone(combat, combatant.id, round);
    }
}
/**
 * Open Stone Powers for all combatants in a round
 */
export async function openStonePowersForAllCombatants(combat, round) {
    const state = getStonePowersState(combat);
    // Check if already prompted for this round
    if (state.roundStonesPrompted[round]) {
        console.log('Mastery System | Stone powers already prompted for round', round);
        return;
    }
    // Mark as prompted
    await updateStonePowersState(combat, {
        roundStonesPrompted: { ...state.roundStonesPrompted, [round]: true }
    });
    console.log('Mastery System | Opening stone powers for all combatants, round', round);
    // Get all combatants
    const allCombatants = Array.from(combat.combatants);
    // Open dialogs sequentially (one at a time to avoid UI spam)
    for (const combatant of allCombatants) {
        await openStonePowersForCombatant(combat, combatant, round);
        // Small delay between dialogs
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    // Check if all are done (should be, but verify)
    if (areAllCombatantsDone(combat, round)) {
        console.log('Mastery System | All combatants completed stone powers for round', round);
        // If round 1 and initiative shop not done, open it
        if (round === 1 && !state.initiativeShopDone) {
            await openInitiativeShopForRound1(combat);
        }
    }
}
/**
 * Open Initiative Shop for all PCs (round 1 only)
 */
async function openInitiativeShopForRound1(combat) {
    const state = getStonePowersState(combat);
    if (state.initiativeShopDone) {
        console.log('Mastery System | Initiative shop already done for round 1');
        return;
    }
    console.log('Mastery System | Opening initiative shop for round 1');
    // Mark as done to prevent re-opening
    await updateStonePowersState(combat, { initiativeShopDone: true });
    // Get all PCs
    const pcs = Array.from(combat.combatants).filter((c) => c.actor?.type === 'character');
    // Open initiative shop for each PC
    for (const pc of pcs) {
        const actor = pc.actor;
        if (!actor)
            continue;
        const user = game.user;
        if (!user)
            continue;
        // Only show to owner or GM
        if (user.isGM || actor.isOwner) {
            try {
                // Auto-roll initiative first
                const breakdown = await rollInitiativeForCombatant(pc);
                // Show initiative shop
                await InitiativeShopDialog.showForCombatant(pc, breakdown, combat);
            }
            catch (error) {
                console.error('Mastery System | Error in initiative shop', error);
            }
            // Small delay between shops
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
}
/**
 * Handle socket message for stone powers completion
 */
async function handleStonePowersComplete(combat, combatantId, round) {
    await markStonePowersDone(combat, combatantId, round);
    // Check if all are done
    if (areAllCombatantsDone(combat, round)) {
        console.log('Mastery System | All combatants completed stone powers for round', round);
        const state = getStonePowersState(combat);
        // If round 1 and initiative shop not done, open it
        if (round === 1 && !state.initiativeShopDone) {
            await openInitiativeShopForRound1(combat);
        }
    }
}
/**
 * Initialize stone powers flow system
 */
export function initializeStonePowersFlow() {
    console.log('Mastery System | Initializing stone powers flow system');
    // Register socket handler for stone powers completion
    game.socket?.on(SOCKET_NAME, async (payload) => {
        const { type, combatId, combatantId, round } = payload;
        if (type !== 'stonePowersComplete')
            return;
        const combat = game.combat;
        if (!combat || combat.id !== combatId)
            return;
        await handleStonePowersComplete(combat, combatantId, round);
    });
}
//# sourceMappingURL=stone-powers-flow.js.map