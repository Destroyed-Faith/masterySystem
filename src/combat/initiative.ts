/**
 * Combat Integration for Mastery System
 * Handles custom initiative rolling, Initiative Shop, and round management
 * 
 * Initiative is rolled each round:
 * - NPCs roll automatically
 * - PCs roll and then access the Initiative Shop
 */

import { 
  calculateBaseInitiative, 
  rollInitiativeDice, 
  createInitiativeChatMessage,
  rollNpcInitiative,
  applyShopPurchases
} from '../utils/initiative';
import { InitiativeShopDialog } from '../sheets/initiative-shop-dialog';
import { resetActionsForRound, resetActionsForTurn } from './actions';
import { regenerateStones } from './resources';
import { updateConditionsForRound } from '../effects/conditions';
import { resetChargedPowerFlag } from '../powers/charges';
import { updateBuffDurations } from '../powers/buffs';
import { decrementUtilityDurations } from '../powers/utilities';
import { performDeathSave, isIncapacitated } from './death';

/**
 * Initialize combat hooks
 */
export function initializeCombatHooks(): void {
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
function onPreCreateCombat(combat: any, _data: any, _options: any, _userId: string): void {
  // Set flag to track that this combat uses Mastery initiative rules
  combat.updateSource({
    'flags.mastery-system.initiativeSystem': true,
    'flags.mastery-system.currentRound': 0
  });
}

/**
 * Handle combat start
 */
function onCombatStart(_combat: any, _updateData: any): void {
  console.log('Mastery System | Combat Started');
  
  // Prompt for initiative rolls
  ui.notifications?.info('Combat started! Roll initiative for all combatants.');
}

/**
 * Handle new combat round
 * Initiative is rolled each round in Mastery System
 */
async function onCombatRound(combat: any, _updateData: any, _options: any): Promise<void> {
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
async function resetCombatantResources(combat: any): Promise<void> {
  for (const combatant of combat.combatants) {
    const actor = combatant.actor;
    if (!actor) continue;
    
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
async function rollInitiativeForAllCombatants(combat: any): Promise<void> {
  const combatantIds = combat.combatants.map((c: any) => c.id);
  
  // Use the custom roll initiative
  await combat.rollInitiative(combatantIds);
}

/**
 * Handle combat turn change
 * Reset converted Reactions that expired
 */
async function onCombatTurn(combat: any, _updateData: any, _options: any): Promise<void> {
  const currentCombatant = combat.combatant;
  if (!currentCombatant || !currentCombatant.actor) return;
  
  const actor = currentCombatant.actor;
  
  // Check if actor is incapacitated and needs death save
  if (isIncapacitated(actor)) {
    await performDeathSave(actor);
  }
  
  // Reset actions for this actor's turn (expire converted Reactions)
  await resetActionsForTurn(actor);
}

/**
 * Add custom buttons to combat tracker
 */
function onRenderCombatTracker(_app: any, html: any, _data: any): void {
  // Convert to jQuery if needed
  const $html: any = html instanceof jQuery ? html : $(html);
  
  // Add a "Roll Initiative (All)" button
  const header = $html.find('.directory-header');
  
  if (header.find('.roll-initiative-all').length === 0) {
    const button = $(`
      <button class="roll-initiative-all" title="Roll Initiative for All">
        <i class="fas fa-dice-d20"></i> Roll Initiative
      </button>
    `);
    
    button.on('click', async () => {
      const combat = (game as any).combat;
      if (!combat) {
        ui.notifications?.warn('No active combat!');
        return;
      }
      
      await rollInitiativeForAllCombatants(combat);
    });
    
    header.append(button);
  }
}

/**
 * Override the Combat.rollInitiative method to use Mastery System rules
 */
function overrideRollInitiative(): void {
  const originalRollInitiative = (Combat.prototype as any).rollInitiative;
  
  (Combat.prototype as any).rollInitiative = async function(
    ids: string | string[], 
    options: any = {}
  ): Promise<any> {
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
    const pcCombatants: any[] = [];
    const npcCombatants: any[] = [];
    
    for (const id of combatantIds) {
      const combatant = this.combatants.get(id);
      if (!combatant || !combatant.actor) continue;
      
      const isPlayerCharacter = combatant.actor.type === 'character' && combatant.actor.hasPlayerOwner;
      
      if (isPlayerCharacter) {
        pcCombatants.push(combatant);
      } else {
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
async function rollPcInitiative(combatant: any): Promise<void> {
  const actor = combatant.actor;
  if (!actor) return;
  
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
  await createInitiativeChatMessage(
    actor,
    baseInitiative,
    masteryRoll,
    rawInitiative,
    shopResult
  );
}

/**
 * Get initiative data for a combatant
 */
export function getCombatantInitiativeData(combatant: any): any {
  return combatant.getFlag('mastery-system', 'initiativeData') || null;
}

/**
 * Check if a combatant has purchased Initiative Swap
 */
export function canSwapInitiative(combatant: any): boolean {
  const data = getCombatantInitiativeData(combatant);
  return data?.shopPurchases?.initiativeSwap || false;
}

