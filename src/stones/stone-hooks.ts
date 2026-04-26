/**
 * Stone System Hooks
 * 
 * Manages:
 * - Turn state resets
 * - End-of-round regeneration
 * - Post-combat full restore
 */

import {
  resetTurnState,
  restoreStonesAfterCombat,
  initializeCombatRoundState,
  clearStonePowersConfigurationLocksInCombat,
} from '../combat/action-economy.js';
import { clearMasteryActiveBuffsForCombatants } from '../utils/active-buffs.js';
import { runMasteryCombatRoundAdvancePipeline } from '../combat/stone-powers-flow.js';

/**
 * Initialize stone system hooks
 */
export function initializeStoneHooks(): void {
  // Hook: Combat started - initialize round state
  Hooks.on('combatStart', async (combat: Combat) => {
    console.log('Mastery System | Combat started, initializing round state');
    await initializeCombatRoundState(combat);
  });
  
  // Hook: Combat turn/round changes
  Hooks.on('updateCombat', async (combat: Combat, changes: any, _options: any, _userId: string) => {
    console.log('Mastery System | updateCombat hook', { changes });
    
    // Turn changed - reset turn state for new current combatant
    if (changes.turn !== undefined) {
      const currentCombatant = combat.combatant;
      
      if (currentCombatant && currentCombatant.actor) {
        await resetTurnState(currentCombatant.actor, combat);
        console.log(`Mastery System | Turn state reset for ${currentCombatant.name}`);
      }
    }
    
    // Round changed: ein Pfad — Reset, ggf. Regen, dann Stone Powers (Runde 2+)
    if (changes.round !== undefined) {
      const newRound = changes.round;
      console.log(`Mastery System | Round changed to ${newRound}, running stone round pipeline`);
      await runMasteryCombatRoundAdvancePipeline(combat, newRound);
    }
  });
  
  // Hook: Combat ended - restore stone pools to full
  Hooks.on('deleteCombat', async (combat: Combat, _options: any, _userId: string) => {
    console.log('Mastery System | Combat ended, restoring stone pools');
    await clearStonePowersConfigurationLocksInCombat(combat);
    try {
      await clearMasteryActiveBuffsForCombatants(combat);
    } catch (e) {
      console.warn('Mastery System | Active buff cleanup on deleteCombat failed', e);
    }
    await restoreStonesAfterCombat(combat);
  });
  
  // Also trigger on explicit combatEnd
  Hooks.on('combatEnd', async (combat: Combat) => {
    console.log('Mastery System | Combat end hook, restoring stone pools');
    await clearStonePowersConfigurationLocksInCombat(combat);
    try {
      await clearMasteryActiveBuffsForCombatants(combat);
    } catch (e) {
      console.warn('Mastery System | Active buff cleanup on combatEnd failed', e);
    }
    await restoreStonesAfterCombat(combat);
  });
}

// Legacy functions removed - now handled by action-economy.ts

