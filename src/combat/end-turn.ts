import { warnIfPlayerStonesPending } from './stone-round-gate.js';
import { requestCombatNextTurn, requestDelayInitiative } from './gm-relay.js';

let requestEndTurnInFlight = false;

/** Players never see/use Next Turn on NPCs — it only confuses them. */
export function canViewerSeeEndTurn(actor: any, user: any): boolean {
  if (!user) return false;
  if (user.isGM) return true;
  if (!actor) return false;
  if (String(actor.type || '') === 'npc') return false;
  return actor.isOwner === true;
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
    if (!ok) ui.notifications?.error?.('Nächster Zug fehlgeschlagen');
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
    ui.notifications?.warn?.('Kein aktiver Zug.');
    return;
  }
  const user = game.user;
  const actor = combat.combatant.actor;
  if (!canViewerSeeEndTurn(actor, user)) {
    ui.notifications?.warn?.('Nur der eigene Zug kann verzögert werden.');
    return;
  }
  delayInFlight = true;
  try {
    const ok = await requestDelayInitiative();
    if (!ok) ui.notifications?.warn?.('Initiative verzögern fehlgeschlagen.');
  } catch (error) {
    console.error('Mastery System | delay initiative failed', error);
    ui.notifications?.error?.('Initiative verzögern fehlgeschlagen.');
  } finally {
    delayInFlight = false;
  }
}

