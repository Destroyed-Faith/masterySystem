/**
 * Mid-combat Initiative Gain (Reaction: Initiative Gain and similar rules).
 * Updates the combatant's Initiative Score and re-sorts remaining turn order.
 */
/** Resolve the Combatant document for an actor in the active encounter. */
export function findCombatantForActor(combat, actor) {
    if (!combat || !actor)
        return null;
    const actorId = String(actor.id ?? '');
    const turns = Array.isArray(combat.turns) ? [...combat.turns] : [];
    for (const c of turns) {
        if (String(c?.actor?.id ?? '') === actorId)
            return c;
    }
    try {
        const tokens = actor.getActiveTokens?.() ?? [];
        for (const tok of tokens) {
            const tid = String(tok?.id ?? tok?.document?.id ?? '');
            if (!tid)
                continue;
            const byToken = turns.find((c) => String(c?.tokenId ?? '') === tid);
            if (byToken)
                return byToken;
        }
    }
    catch {
        /* ignore */
    }
    try {
        for (const c of combat.combatants ?? []) {
            if (String(c?.actor?.id ?? '') === actorId)
                return c;
        }
    }
    catch {
        /* ignore */
    }
    return null;
}
/**
 * Add flat Initiative to a combatant after an attack resolves.
 * If they have not yet acted this round, re-sorts turn order for remaining turns.
 * If they already acted, only updates the score (order applies next round).
 */
export async function applyMidCombatInitiativeGain(combat, actor, amount) {
    const fail = (note) => ({
        applied: false,
        oldInitiative: 0,
        newInitiative: 0,
        note,
    });
    const gain = Math.max(0, Math.floor(Number(amount) || 0));
    if (!combat || gain <= 0)
        return fail('No Initiative to gain.');
    const combatant = findCombatantForActor(combat, actor);
    if (!combatant)
        return fail('Combatant not found in encounter.');
    const oldIni = Math.floor(Number(combatant.initiative ?? 0) || 0);
    const newIni = oldIni + gain;
    const turnsBefore = Array.isArray(combat.turns) ? [...combat.turns] : [];
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
        if (typeof combat.setupTurns === 'function') {
            await combat.setupTurns();
        }
    }
    catch (e) {
        console.warn('Mastery System | applyMidCombatInitiativeGain setupTurns failed', e);
    }
    return {
        applied: true,
        oldInitiative: oldIni,
        newInitiative: newIni,
        note: `Initiative ${oldIni} → ${newIni} (+${gain}). Turn order updated for remaining combatants this round.`,
    };
}
//# sourceMappingURL=initiative-gain.js.map