/**
 * Combat Integration for Mastery System
 * Handles custom initiative rolling, Initiative Shop, and round management
 *
 * Initiative is rolled each round:
 * - NPCs roll automatically
 * - PCs roll and then access the Initiative Shop
 */
import { calculateBaseInitiative, rollInitiativeDice, createInitiativeChatMessage, rollNpcInitiative, applyShopPurchases } from '../utils/initiative.js';
import { InitiativeShopDialog } from '../sheets/initiative-shop-dialog.js';
import { resetActionsForRound, resetActionsForTurn } from './actions.js';
import { regenerateStones } from './resources.js';
import { updateConditionsForRound } from '../effects/conditions.js';
import { resetChargedPowerFlag } from '../powers/charges.js';
import { updateBuffDurations } from '../powers/buffs.js';
import { decrementUtilityDurations } from '../powers/utilities.js';
import { performDeathSave, isIncapacitated } from './death.js';
/**
 * Initialize combat hooks
 */
export function initializeCombatHooks() {
    console.log('Mastery System | Initializing Combat Hooks');
    // Override Combat.rollInitiative to use Mastery System rules
    Hooks.on('preCreateCombat', onPreCreateCombat);
    Hooks.on('combatStart', onCombatStart);
    Hooks.on('combatRound', onCombatRound);
    Hooks.on('combatTurn', onCombatTurn);
    Hooks.on('renderCombatTracker', onRenderCombatTracker);
    // Override the Combat class's rollInitiative method
    overrideRollInitiative();
}
/**
 * Handle combat creation
 */
function onPreCreateCombat(combat, _data, _options, _userId) {
    // Set flag to track that this combat uses Mastery initiative rules
    combat.updateSource({
        'flags.mastery-system.initiativeSystem': true,
        'flags.mastery-system.currentRound': 0
    });
}
/**
 * Handle combat start
 */
async function onCombatStart(combat, _updateData) {
    console.log('Mastery System | Combat Started');
    
    // Step 1: Show Passive Selection Overlay
    ui.notifications?.info('Combat started! Select your passive abilities.');
    
    // Import and show the passive selection dialog
    const { PassiveSelectionDialog } = await import('../sheets/passive-selection-dialog.js');
    await PassiveSelectionDialog.showForCombat(combat);
    
    // Step 2: Automatically roll initiative for all combatants
    ui.notifications?.info('Rolling initiative for all combatants...');
    await rollInitiativeForAllCombatants(combat);
}
/**
 * Handle new combat round
 * Initiative is rolled each round in Mastery System
 */
async function onCombatRound(combat, _updateData, _options) {
    const currentRound = combat.round;
    console.log(`Mastery System | Round ${currentRound} started`);
    // If this is round 2 or later, automatically trigger re-roll
    if (currentRound > 1) {
        ui.notifications?.info(`Round ${currentRound}: Re-rolling initiative for all combatants!`);
        // Wait a moment for the UI to update
        setTimeout(async () => {
            await rollInitiativeForAllCombatants(combat);
        }, 500);
    }
    // Reset action economy for all combatants at round start
    await resetCombatantResources(combat);
}
/**
 * Reset resources for all combatants at the start of a round
 */
async function resetCombatantResources(combat) {
    for (const combatant of combat.combatants) {
        const actor = combatant.actor;
        if (!actor)
            continue;
        // Reset actions for the round
        await resetActionsForRound(actor);
        // Regenerate Stones
        await regenerateStones(actor);
        // Update conditions (duration, diminishing, etc.)
        await updateConditionsForRound(actor);
        // Update buff durations
        await updateBuffDurations(actor);
        // Update utility durations
        await decrementUtilityDurations(actor);
        // Reset Charged Power flag (can use 1 per round)
        await resetChargedPowerFlag(actor);
        // Clear initiative shop flags
        if (actor.system.combat?.initiativeShop) {
            await actor.update({
                'system.combat.initiativeShop': {
                    movement: 0,
                    swap: false,
                    extraAttack: false
                }
            });
        }
    }
}
/**
 * Roll initiative for all combatants (used when starting new round)
 */
async function rollInitiativeForAllCombatants(combat) {
    const combatantIds = combat.combatants.map((c) => c.id);
    // Use the custom roll initiative
    await combat.rollInitiative(combatantIds);
}
/**
 * Handle combat turn change
 * Reset converted Reactions that expired and show Combat Action Overlay
 */
async function onCombatTurn(combat, _updateData, _options) {
    const currentCombatant = combat.combatant;
    if (!currentCombatant || !currentCombatant.actor)
        return;
    const actor = currentCombatant.actor;
    
    // Check if actor is incapacitated and needs death save
    if (isIncapacitated(actor)) {
        await performDeathSave(actor);
    }
    
    // Reset actions for this actor's turn (expire converted Reactions)
    await resetActionsForTurn(actor);
    
    // Show Combat Action Overlay for the current turn
    const { CombatActionOverlay } = await import('../sheets/combat-action-overlay.js');
    await CombatActionOverlay.showForCurrentTurn(combat);
}
/**
 * Add custom buttons to combat tracker
 */
function onRenderCombatTracker(_app, html, _data) {
    // Convert to jQuery if needed
    const $html = html instanceof jQuery ? html : $(html);
    const combat = game.combat;
    
    // Add a "Select Passives" button in the header
    const header = $html.find('.directory-header');
    if (header.find('.select-passives-btn').length === 0) {
        const passivesButton = $(`
      <button class="select-passives-btn" title="Select Passive Abilities">
        <i class="fas fa-shield-alt"></i> Passives
      </button>
    `);
        passivesButton.on('click', async () => {
            if (!combat) {
                ui.notifications?.warn('No active combat!');
                return;
            }
            const { PassiveSelectionDialog } = await import('../sheets/passive-selection-dialog.js');
            await PassiveSelectionDialog.showForCombat(combat);
        });
        header.append(passivesButton);
    }
    
    // Replace default initiative roll button behavior
    // Find all initiative roll icons in the combat tracker
    $html.find('.combatant .token-initiative').each(function() {
        const $initiativeDiv = $(this);
        const combatantId = $initiativeDiv.closest('.combatant').data('combatant-id');
        
        // Remove default click handler and add our custom one for Passive Selection
        $initiativeDiv.off('click');
        $initiativeDiv.on('click', async (event) => {
            event.preventDefault();
            event.stopPropagation();
            
            if (!combat) return;
            
            const combatant = combat.combatants.get(combatantId);
            if (!combatant || !combatant.actor) return;
            
            // If it's a player character, show passive selection first
            if (combatant.actor.type === 'character' && combatant.actor.hasPlayerOwner) {
                const { PassiveSelectionDialog } = await import('../sheets/passive-selection-dialog.js');
                await PassiveSelectionDialog.showForCombat(combat);
            }
            
            // Then roll initiative
            await combat.rollInitiative([combatantId]);
        });
    });
    
    // Add double-click handler to combatants for Combat Action Overlay
    $html.find('.combatant').each(function() {
        const $combatant = $(this);
        const combatantId = $combatant.data('combatant-id');
        
        $combatant.off('dblclick');
        $combatant.on('dblclick', async (event) => {
            event.preventDefault();
            event.stopPropagation();
            
            if (!combat) return;
            
            const combatant = combat.combatants.get(combatantId);
            if (!combatant || !combatant.actor) return;
            
            // Show Combat Action Overlay
            const { CombatActionOverlay } = await import('../sheets/combat-action-overlay.js');
            const overlay = new CombatActionOverlay(combatant.actor);
            overlay.render(true);
        });
    });
}
/**
 * Override the Combat.rollInitiative method to use Mastery System rules
 */
function overrideRollInitiative() {
    const originalRollInitiative = Combat.prototype.rollInitiative;
    Combat.prototype.rollInitiative = async function (ids, options = {}) {
        // Normalize to array
        const combatantIds = typeof ids === 'string' ? [ids] : ids;
        // Check if this combat uses Mastery initiative
        const useMasteryInitiative = this.getFlag('mastery-system', 'initiativeSystem');
        if (!useMasteryInitiative) {
            // Fall back to default Foundry initiative
            return originalRollInitiative.call(this, ids, options);
        }
        // Roll initiative using Mastery System rules
        console.log('Mastery System | Rolling initiative for combatants:', combatantIds);
        // Separate PCs and NPCs
        const pcCombatants = [];
        const npcCombatants = [];
        for (const id of combatantIds) {
            const combatant = this.combatants.get(id);
            if (!combatant || !combatant.actor)
                continue;
            const isPlayerCharacter = combatant.actor.type === 'character' && combatant.actor.hasPlayerOwner;
            if (isPlayerCharacter) {
                pcCombatants.push(combatant);
            }
            else {
                npcCombatants.push(combatant);
            }
        }
        // Roll for NPCs first (automatic, no shop)
        for (const combatant of npcCombatants) {
            const initiative = await rollNpcInitiative(combatant.actor, combatant);
            await combatant.update({ initiative });
        }
        // Roll for PCs (with Initiative Shop dialog)
        for (const combatant of pcCombatants) {
            await rollPcInitiative(combatant);
        }
        return this;
    };
    console.log('Mastery System | Overrode Combat.rollInitiative');
}
/**
 * Roll initiative for a PC with Initiative Shop
 */
async function rollPcInitiative(combatant) {
    const actor = combatant.actor;
    if (!actor)
        return;
    // Calculate base initiative
    const baseInitiative = calculateBaseInitiative(actor);
    // Roll mastery dice
    const masteryRoll = await rollInitiativeDice(actor, false, 0);
    // Calculate raw initiative (before shop)
    const rawInitiative = baseInitiative + masteryRoll.total;
    // Show Initiative Shop dialog
    const shopResult = await InitiativeShopDialog.show(actor, rawInitiative);
    if (!shopResult) {
        // Cancelled or closed - use raw initiative
        await combatant.update({ initiative: rawInitiative });
        await combatant.setFlag('mastery-system', 'initiativeData', {
            baseInitiative,
            masteryRoll: masteryRoll.total,
            masteryRollDetails: masteryRoll,
            rawInitiative,
            finalInitiative: rawInitiative,
            shopSpent: 0,
            shopPurchases: {
                extraMovement: 0,
                initiativeSwap: false,
                extraAttack: false
            }
        });
        return;
    }
    // Apply shop purchases to actor
    await applyShopPurchases(actor, shopResult.purchases);
    // Update actor with shop purchases
    await actor.update({
        'system.combat.initiativeShop': shopResult.purchases
    });
    // Set final initiative on combatant
    await combatant.update({ initiative: shopResult.finalInitiative });
    // Store detailed data in flags
    await combatant.setFlag('mastery-system', 'initiativeData', {
        baseInitiative,
        masteryRoll: masteryRoll.total,
        masteryRollDetails: masteryRoll,
        rawInitiative,
        finalInitiative: shopResult.finalInitiative,
        shopSpent: shopResult.spentPoints,
        shopPurchases: shopResult.purchases
    });
    // Create chat message
    await createInitiativeChatMessage(actor, baseInitiative, masteryRoll, rawInitiative, shopResult);
}
/**
 * Get initiative data for a combatant
 */
export function getCombatantInitiativeData(combatant) {
    return combatant.getFlag('mastery-system', 'initiativeData') || null;
}
/**
 * Check if a combatant has purchased Initiative Swap
 */
export function canSwapInitiative(combatant) {
    const data = getCombatantInitiativeData(combatant);
    return data?.shopPurchases?.initiativeSwap || false;
}
//# sourceMappingURL=initiative.js.map