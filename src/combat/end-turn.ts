import { warnIfPlayerStonesPending } from './stone-round-gate.js';
import { requestCombatNextTurn, requestDelayInitiative } from './gm-relay.js';

let requestEndTurnInFlight = false;

/** The assigned character, an owned PC, or the GM. Not an NPC. */
export function canViewerSeeEndTurn(actor: any, user: any): boolean {
  if (!user) return false;
  if (user.isGM) return true;
  if (!actor) return false;
  if (String(actor.type || '') === 'npc') return false;
  if (actor.isOwner === true) return true;
  if (typeof actor.testUserPermission === 'function' && actor.testUserPermission(user, 'OWNER')) {
    return true;
  }
  const assigned = user.character;
  const assignedId = assigned && typeof assigned === 'object' ? assigned.id : assigned;
  return !!assignedId && String(assignedId) === String(actor.id);
}

/** Current combatant is this viewer's own turn. */
export function userMayEndCurrentTurn(user: any, combat: any): boolean {
  if (!user || !combat?.combatant) return false;
  if (!combat.started) return false;
  return canViewerSeeEndTurn(combat.combatant.actor, user);
}

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

  if (warnIfPlayerStonesPending(combat)) return;
  
  const currentCombatant = combat.combatant;
  if (!currentCombatant) {
    ui.notifications.warn('No current combatant!');
    return;
  }
  
  const user = game.user;
  if (!user) return;
  
  const actor = currentCombatant.actor;
  
  if (!canViewerSeeEndTurn(actor, user)) {
    ui.notifications.warn('You can only end your own turn!');
    return;
  }
  requestEndTurnInFlight = true;
  try {
    const ok = await requestCombatNextTurn();
    if (!ok) ui.notifications?.error?.('Next Turn failed');
  } catch (error) {
    console.error('Mastery System | Error ending turn', error);
    ui.notifications.error('Failed to end turn');
  } finally {
    requestEndTurnInFlight = false;
  }
}

let delayInFlight = false;

/** Hold this turn: drop just below the next combatant, then advance. */
export async function requestDelayTurn(): Promise<void> {
  if (delayInFlight) return;
  const combat = game.combat;
  if (!combat?.combatant) {
    ui.notifications?.warn?.('No active turn.');
    return;
  }
  const user = game.user;
  const actor = combat.combatant.actor;
  if (!canViewerSeeEndTurn(actor, user)) {
    ui.notifications?.warn?.('Only your own turn can be delayed.');
    return;
  }
  delayInFlight = true;
  try {
    const ok = await requestDelayInitiative();
    if (!ok) ui.notifications?.warn?.('Delay Initiative failed.');
  } catch (error) {
    console.error('Mastery System | delay initiative failed', error);
    ui.notifications?.error?.('Delay Initiative failed.');
  } finally {
    delayInFlight = false;
  }
}

