/**
 * Mid-combat Initiative Gain (Reaction: Initiative Gain and similar rules).
 * Updates the combatant's Initiative Score and re-sorts remaining turn order.
 */

/** Resolve the Combatant document for an actor in the active encounter. */
export function findCombatantForActor(combat: Combat, actor: Actor): Combatant | null {
  if (!combat || !actor) return null;
  const actorId = String((actor as any).id ?? '');
  const turns: any[] = Array.isArray(combat.turns) ? [...combat.turns] : [];
  for (const c of turns) {
    if (String(c?.actor?.id ?? '') === actorId) return c as Combatant;
  }
  try {
    const tokens = (actor as any).getActiveTokens?.() ?? [];
    for (const tok of tokens) {
      const tid = String(tok?.id ?? tok?.document?.id ?? '');
      if (!tid) continue;
      const byToken = turns.find((c) => String(c?.tokenId ?? '') === tid);
      if (byToken) return byToken as Combatant;
    }
  } catch {
    /* ignore */
  }
  try {
    for (const c of combat.combatants ?? []) {
      if (String((c as any)?.actor?.id ?? '') === actorId) return c as Combatant;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export interface InitiativeGainResult {
  applied: boolean;
  oldInitiative: number;
  newInitiative: number;
  /** Human-readable summary for chat / notifications. */
  note: string;
}

/**
 * Add flat Initiative to a combatant after an attack resolves.
 * If they have not yet acted this round, re-sorts turn order for remaining turns.
 * If they already acted, only updates the score (order applies next round).
 */
export async function applyMidCombatInitiativeGain(
  combat: Combat,
  actor: Actor,
  amount: number,
): Promise<InitiativeGainResult> {
  const fail = (note: string): InitiativeGainResult => ({
    applied: false,
    oldInitiative: 0,
    newInitiative: 0,
    note,
  });

  const gain = Math.max(0, Math.floor(Number(amount) || 0));
  if (!combat || gain <= 0) return fail('No Initiative to gain.');

  const combatant = findCombatantForActor(combat, actor);
  if (!combatant) return fail('Combatant not found in encounter.');

  const oldIni = Math.floor(Number(combatant.initiative ?? 0) || 0);
  const newIni = oldIni + gain;

  const turnsBefore: any[] = Array.isArray(combat.turns) ? [...combat.turns] : [];
  const currentTurnIdx = Math.max(0, Math.floor(Number(combat.turn) || 0));
  const gainerIdxBefore = turnsBefore.findIndex((c) => c?.id === combatant.id);
  const hasActedThisRound = gainerIdxBefore >= 0 && gainerIdxBefore < currentTurnIdx;

  await combatant.update({ initiative: newIni });

  if (hasActedThisRound) {
    return {
      applied: true,
      oldInitiative: oldIni,
      newInitiative: newIni,
      note: `Initiative ${oldIni} → ${newIni} (+${gain}). Already acted this round — new position applies from the next round.`,
    };
  }

  try {
    if (typeof (combat as any).setupTurns === 'function') {
      await (combat as any).setupTurns();
    }
  } catch (e) {
    console.warn('Mastery System | applyMidCombatInitiativeGain setupTurns failed', e);
  }

  return {
    applied: true,
    oldInitiative: oldIni,
    newInitiative: newIni,
    note: `Initiative ${oldIni} → ${newIni} (+${gain}). Turn order updated for remaining combatants this round.`,
  };
}
