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
import {
  runMasteryCombatRoundAdvancePipeline,
  runPlayerOwnedRoundAdvance,
} from '../combat/stone-powers-flow.js';
import { endMinorMagicRestForCombat } from '../utils/minor-magic-items.js';
import { canCurrentUserUpdateDocument } from '../combat/combat-permissions.js';

/**
 * Initialize stone system hooks
 */
export function initializeStoneHooks(): void {
  // Hook: Combat started - initialize round state
  Hooks.on('combatStart', async (combat: Combat) => {
    if (!game.user?.isGM) return;
    await initializeCombatRoundState(combat);
    try {
      await endMinorMagicRestForCombat(combat);
    } catch (err) {
      console.warn('Mastery System | endMinorMagicRestForCombat failed', err);
    }
  });
  
  // Hook: Combat turn/round changes
  Hooks.on('updateCombat', async (combat: Combat, changes: any, _options: any, _userId: string) => {
    // Turn changed — expire the previous combatant's "this turn" stone bonuses
    // (+8 Evade, damage dice from stones, etc.) then reset counters for the new current.
    if (changes.turn !== undefined && combat.started && combat.turns?.length) {
      const turns = combat.turns as any[];
      const len = turns.length;
      const prevIdx = (combat.turn - 1 + len) % len;
      const prevCombatant = turns[prevIdx];
      const prevActor = prevCombatant?.actor;
      if (prevActor && canCurrentUserUpdateDocument(prevActor)) {
        try {
          await clearCombatStoneTurnBonusesForActor(prevActor, combat);
        } catch (e) {
          console.warn('Mastery System | clearCombatStoneTurnBonusesForActor failed', e);
        }
      }
    }

    if (changes.turn !== undefined) {
      const currentCombatant = combat.combatant;

      if (currentCombatant && currentCombatant.actor && canCurrentUserUpdateDocument(currentCombatant.actor)) {
        await resetTurnState(currentCombatant.actor, combat);
      }
    }
    
    // Round changed: GM resets everyone; players still open their own stone dialogs
    // (Join Game As has no GM client, so that path is the only prompt).
    if (changes.round !== undefined) {
      const newRound = changes.round;
      if (game.user?.isGM) {
        await runMasteryCombatRoundAdvancePipeline(combat, newRound);
      } else {
        await runPlayerOwnedRoundAdvance(combat, newRound);
      }
    }
  });
  
  // Hook: Combat ended - restore stone pools to full
  Hooks.on('deleteCombat', async (combat: Combat, _options: any, _userId: string) => {
    await finishCombat(combat, 'deleteCombat');
  });
  
  // Also trigger on explicit combatEnd
  Hooks.on('combatEnd', async (combat: Combat) => {
    await finishCombat(combat, 'combatEnd');
  });
}

/**
 * Post-encounter cleanup: locks, Temp HP, Colorless Stones, NPC-side ongoing
 * effects, then refill the stone pools. Runs for whichever of `combatEnd` /
 * `deleteCombat` Foundry emits first; every step is idempotent.
 */
async function finishCombat(combat: Combat, hook: string): Promise<void> {
  if (!game.user?.isGM) return;
  await clearStonePowersConfigurationLocksInCombat(combat);
  try {
    const { runCombatEndCleanup } = await import('../combat/combat-end-cleanup.js');
    await runCombatEndCleanup(combat);
  } catch (e) {
    console.warn(`Mastery System | Combat end cleanup on ${hook} failed`, e);
  }
  await restoreStonesAfterCombat(combat);
}

// Legacy functions removed - now handled by action-economy.ts

