/**
 * Hold the new round until every PC confirms stone assignment.
 * NPCs do not block. The GM cannot skip the wait with Next Turn.
 */

import { readCombatantSetupStep } from './encounter-setup-flags.js';

export function isStonePowersDone(combat: Combat, combatantId: string, round: number): boolean {
  const done = (combat.flags as any)?.['mastery-system']?.stonePowersState?.stonesDone?.[combatantId];
  if (Number(done) === Number(round)) return true;
  const combatant = combat.combatants.get(combatantId);
  return Number(readCombatantSetupStep(combatant, combat)?.stonesDoneRound) === Number(round);
}

function isPlayerCharacter(combatant: Combatant): boolean {
  return combatant.actor?.type === 'character';
}

export function pendingStoneCombatants(
  combat: Combat,
  round: number = Math.max(1, Number(combat.round) || 1),
): Combatant[] {
  return (Array.from(combat.combatants) as Combatant[]).filter(
    (c) => isPlayerCharacter(c) && !isStonePowersDone(combat, c.id, round),
  );
}

export function pendingStonePlayerNames(
  combat: Combat,
  round: number = Math.max(1, Number(combat.round) || 1),
): string[] {
  return pendingStoneCombatants(combat, round).map((c) => {
    const name = String((c.actor as { name?: string } | null)?.name || (c as { name?: string }).name || '').trim();
    return name || 'Unbekannt';
  });
}

export function arePlayerStonesReadyForRound(
  combat: Combat,
  round: number = Math.max(1, Number(combat.round) || 1),
): boolean {
  return pendingStoneCombatants(combat, round).length === 0;
}

function stoneWaitMessage(combat: Combat): string {
  const names = pendingStonePlayerNames(combat);
  const who = names.length ? ` Noch offen: ${names.join(', ')}.` : '';
  return `Neue Runde: alle Spieler müssen ihre Steine bestätigen, bevor jemand den Zug wechselt.${who}`;
}

/** @returns true if actions / turn advance must wait for stone confirm. */
export function warnIfPlayerStonesPending(combat: Combat | null | undefined): boolean {
  if (!combat?.started) return false;
  if (arePlayerStonesReadyForRound(combat)) return false;
  ui.notifications?.warn(stoneWaitMessage(combat));
  void import('./player-encounter-setup.js').then(({ resumePlayerEncounterSetup }) => {
    void resumePlayerEncounterSetup(combat);
  });
  return true;
}

/** Blocks Foundry tracker Next Turn / Next Round while PC stones are still open. */
export function initializeStoneRoundGate(): void {
  Hooks.on('preUpdateCombat', (combat: Combat, changes: any, _options: any, userId: string) => {
    if (userId !== game.user?.id) return;
    if (changes?.turn === undefined && changes?.round === undefined) return;
    if (warnIfPlayerStonesPending(combat)) return false;
    return;
  });
}
