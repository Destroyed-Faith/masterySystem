/**
 * Hold the new round until connected PCs confirm stone assignment.
 * Unattended characters and NPCs do not block the table.
 */

import {
  findConnectedPlayerOwners,
  shouldShowEncounterDialogLocally,
} from './combat-permissions.js';
import { readCombatantSetupStep } from './encounter-setup-flags.js';

export function isStonePowersDone(combat: Combat, combatantId: string, round: number): boolean {
  const done = (combat.flags as any)?.['mastery-system']?.stonePowersState?.stonesDone?.[combatantId];
  if (Number(done) === Number(round)) return true;
  const combatant = combat.combatants.get(combatantId);
  return Number(readCombatantSetupStep(combatant, combat)?.stonesDoneRound) === Number(round);
}

function isStoneGateCombatant(combatant: Combatant): boolean {
  const actor = combatant.actor as { type?: string } | null;
  if (!actor || actor.type !== 'character') return false;
  if (shouldShowEncounterDialogLocally(actor as Actor)) return true;
  return findConnectedPlayerOwners(actor as Actor).length > 0;
}

export function arePlayerStonesReadyForRound(
  combat: Combat,
  round: number = Math.max(1, Number(combat.round) || 1),
): boolean {
  const pcs = Array.from(combat.combatants).filter((c) => isStoneGateCombatant(c)) as Combatant[];
  if (!pcs.length) return true;
  return pcs.every((c) => isStonePowersDone(combat, c.id, round));
}

/** @returns true if actions must wait for stone confirm. */
export function warnIfPlayerStonesPending(combat: Combat | null | undefined): boolean {
  if (!combat?.started) return false;
  if (arePlayerStonesReadyForRound(combat)) return false;
  ui.notifications?.warn(
    'Neue Runde: alle Spieler müssen ihre Steine bestätigen, bevor jemand handelt.',
  );
  void import('./player-encounter-setup.js').then(({ resumePlayerEncounterSetup }) => {
    void resumePlayerEncounterSetup(combat);
  });
  return true;
}
