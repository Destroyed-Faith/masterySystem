import { warnIfPlayerStonesPending } from './stone-round-gate.js';

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
    await combat.nextTurn();
  } catch (error) {
    console.error('Mastery System | Error ending turn', error);
    ui.notifications.error('Failed to end turn');
  } finally {
    requestEndTurnInFlight = false;
  }
}

