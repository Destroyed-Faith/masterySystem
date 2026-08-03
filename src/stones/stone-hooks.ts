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
  clearCombatStoneTurnBonusesForActor,
} from '../combat/action-economy.js';
import { clearMasteryActiveBuffsForCombatants } from '../utils/active-buffs.js';
import { runMasteryCombatRoundAdvancePipeline } from '../combat/stone-powers-flow.js';
import { buildCombatTurnSnapshot, logCombatTrace } from '../utils/combat-trace-debug.js';

import { log } from '../utils/logger.js';
/**
 * Initialize stone system hooks
 */
export function initializeStoneHooks(): void {
  // Hook: Combat started - initialize round state
  Hooks.on('combatStart', async (combat: Combat) => {
    log.debug('Mastery System | Combat started, initializing round state');
    await initializeCombatRoundState(combat);
  });
  
  // Hook: Combat turn/round changes
  Hooks.on('updateCombat', async (combat: Combat, changes: any, _options: any, _userId: string) => {
    log.debug('Mastery System | updateCombat hook', { changes });
    if (changes?.turn !== undefined || changes?.round !== undefined) {
      logCombatTrace('updateCombat', {
        changes,
        snapshot: buildCombatTurnSnapshot(combat),
      });
    }

    // Turn changed — expire the previous combatant's "this turn" stone bonuses
    // (+8 Evade, damage dice from stones, etc.) then reset counters for the new current.
    if (changes.turn !== undefined && combat.started && combat.turns?.length) {
      const turns = combat.turns as any[];
      const len = turns.length;
      const prevIdx = (combat.turn - 1 + len) % len;
      const prevCombatant = turns[prevIdx];
      const prevActor = prevCombatant?.actor;
      if (prevActor) {
        try {
          await clearCombatStoneTurnBonusesForActor(prevActor, combat);
        } catch (e) {
          console.warn('Mastery System | clearCombatStoneTurnBonusesForActor failed', e);
        }
      }
    }

    if (changes.turn !== undefined) {
      const currentCombatant = combat.combatant;

      if (currentCombatant && currentCombatant.actor) {
        await resetTurnState(currentCombatant.actor, combat);
        log.debug(`Turn state reset for ${currentCombatant.name}`);
      }
    }
    
    // Round changed: ein Pfad — Reset, ggf. Regen, dann Stone Powers (Runde 2+)
    if (changes.round !== undefined) {
      const newRound = changes.round;
      log.debug(`Round changed to ${newRound}, running stone round pipeline`);
      await runMasteryCombatRoundAdvancePipeline(combat, newRound);
    }
  });
  
  // Hook: Combat ended - restore stone pools to full
  Hooks.on('deleteCombat', async (combat: Combat, _options: any, _userId: string) => {
    log.debug('Mastery System | Combat ended, restoring stone pools');
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
    log.debug('Mastery System | Combat end hook, restoring stone pools');
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

