/**
 * Advance combat tracker by one step (next combatant in initiative order).
 */

import { buildCombatTurnSnapshot, logCombatTrace } from '../utils/combat-trace-debug.js';
import { postSaveEndsPromptForActor } from './save-ends.js';

let requestEndTurnInFlight = false;

/**
 * Request to advance the active encounter one turn (same as Foundry's next turn).
 * If user is GM or owns the current combatant, advance turn.
 */
export async function requestEndTurn(): Promise<void> {
  if (requestEndTurnInFlight) return;

  const combat = game.combat;
  
  if (!combat) {
    ui.notifications.warn('No active combat!');
    return;
  }
  
  const currentCombatant = combat.combatant;
  if (!currentCombatant) {
    ui.notifications.warn('No current combatant!');
    return;
  }
  
  const user = game.user;
  if (!user) return;
  
  const actor = currentCombatant.actor;
  
  // Check permissions: GM or owner of current combatant
  if (!user.isGM && (!actor || !actor.isOwner)) {
    ui.notifications.warn('You can only end your own turn!');
    return;
  }
  
  console.log(`Mastery System | Next turn from ${currentCombatant.name}`);
  logCombatTrace('before-nextTurn', {
    fromCombatantId: currentCombatant.id,
    fromName: currentCombatant.name,
    snapshot: buildCombatTurnSnapshot(combat),
  });

  // Players Guide ~6052–6067: each creature gets one free save against an
  // active diminishing effect at the *end* of their turn. Post the prompt
  // before `nextTurn()` so the active actor still owns the chat-card click.
  try {
    if (actor) {
      await postSaveEndsPromptForActor(actor, combat);
    }
  } catch (err) {
    console.warn('Mastery System | save-ends prompt failed', err);
  }

  requestEndTurnInFlight = true;
  try {
    await combat.nextTurn();
  } catch (error) {
    console.error('Mastery System | Error ending turn', error);
    ui.notifications.error('Failed to end turn');
  } finally {
    requestEndTurnInFlight = false;
  }
}

