/**
 * Advance combat tracker by one step (next combatant in initiative order).
 */

/**
 * Request to advance the active encounter one turn (same as Foundry's next turn).
 * If user is GM or owns the current combatant, advance turn.
 */
export async function requestEndTurn(): Promise<void> {
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
  
  try {
    await combat.nextTurn();
  } catch (error) {
    console.error('Mastery System | Error ending turn', error);
    ui.notifications.error('Failed to end turn');
  }
}

