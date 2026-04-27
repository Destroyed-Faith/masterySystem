/**
 * Optional diagnostics for combat rounds, turn order, and initiative values.
 *
 * Enable any of:
 * - World setting **Debug: Combat turns & initiative** (`debugCombatTurns`)
 * - Client setting **Debug Mode** (`debugMode`)
 * - Console: `globalThis.MSY_DEBUG_COMBAT = true` then reload.
 *
 * Initiative / Karussell / `turns` vs. `combatants` (extra detail):
 * - Console: `globalThis.MSY_DEBUG_INITIATIVE = true` (reload optional if hooks miss it)
 * - Or enable any of the flags above — then `logInitiativeOrderDebug` also fires.
 */
function duplicateNonEmptyIds(ids) {
    const seen = new Set();
    const dups = new Set();
    for (const id of ids) {
        if (id == null || id === '')
            continue;
        if (seen.has(id))
            dups.add(id);
        else
            seen.add(id);
    }
    return [...dups];
}
export function isCombatTraceDebugEnabled() {
    try {
        if (globalThis.MSY_DEBUG_COMBAT === true)
            return true;
        const g = globalThis.game;
        if (!g?.settings?.get)
            return false;
        if (g.settings.get('mastery-system', 'debugCombatTurns') === true)
            return true;
        return g.settings.get('mastery-system', 'debugMode') === true;
    }
    catch {
        return false;
    }
}
/** Verbose initiative / `combat.turns` / carousel alignment (console). */
export function isInitiativeOrderDebugEnabled() {
    try {
        if (globalThis.MSY_DEBUG_INITIATIVE === true)
            return true;
        return isCombatTraceDebugEnabled();
    }
    catch {
        return false;
    }
}
/**
 * `combat.combatants` iteration order (often encounter / sheet order — not necessarily `turns`).
 * Compare to `buildCombatTurnSnapshot().turnOrder` to spot mismatches.
 */
export function buildCombatantsIteratorOrder(combat) {
    if (!combat?.combatants)
        return [];
    try {
        return Array.from(combat.combatants).map((c, i) => ({
            iteratorIndex: i,
            combatantId: c?.id ?? null,
            name: c?.name ?? null,
            initiative: c?.initiative ?? null,
            defeated: !!c?.defeated,
            actorId: c?.actor?.id ?? null,
        }));
    }
    catch (e) {
        return [{ error: String(e) }];
    }
}
export function logInitiativeOrderDebug(phase, payload) {
    if (!isInitiativeOrderDebugEnabled())
        return;
    try {
        console.warn(`Mastery System | [INI-ORDER-DEBUG] ${phase}`, payload);
    }
    catch {
        /* ignore */
    }
}
/** Serialize `combat.turns` + current pointer for console diagnosis (init order, ini 0 vs 42, etc.). */
export function buildCombatTurnSnapshot(combat) {
    if (!combat)
        return { error: 'no-combat' };
    try {
        const turns = Array.isArray(combat.turns) ? [...combat.turns] : [];
        const turnOrder = turns.map((c, i) => ({
            turnArrayIndex: i,
            combatantId: c?.id ?? null,
            name: c?.name ?? null,
            initiative: c?.initiative ?? null,
            msInitiativeValueFlag: typeof c?.getFlag === 'function'
                ? c.getFlag('mastery-system', 'msInitiativeValue')
                : undefined,
            defeated: !!c?.defeated,
            hidden: !!c?.hidden,
            actorId: c?.actor?.id ?? null,
            actorName: c?.actor?.name ?? null,
            tokenId: (c?.tokenId ?? c?.token?.id ?? null),
        }));
        const cur = combat.combatant;
        const trace = isCombatTraceDebugEnabled();
        const dupActors = trace ? duplicateNonEmptyIds(turnOrder.map((t) => t.actorId)) : [];
        const dupTokens = trace ? duplicateNonEmptyIds(turnOrder.map((t) => t.tokenId)) : [];
        const base = {
            combatId: combat.id,
            round: combat.round,
            turnIndex: combat.turn,
            started: combat.started,
            totalCombatants: combat.combatants?.size ?? null,
            turnsArrayLength: turns.length,
            current: cur
                ? {
                    combatantId: cur.id,
                    name: cur.name,
                    initiative: cur.initiative ?? null,
                    msInitiativeValueFlag: typeof cur.getFlag === 'function'
                        ? cur.getFlag('mastery-system', 'msInitiativeValue')
                        : undefined,
                    actorId: cur.actor?.id ?? null,
                    actorName: cur.actor?.name ?? null,
                }
                : null,
            /** Order Foundry uses for `nextTurn` / round wrap (index 0 goes first after round reset). */
            turnOrder,
        };
        if (trace && (dupActors.length > 0 || dupTokens.length > 0)) {
            base.duplicateActorIdsInTurnOrder = dupActors;
            base.duplicateTokenIdsInTurnOrder = dupTokens;
            base.duplicateTurnOrderNote =
                'Same actor or token appears more than once in `turns` — each entry gets its own turn in Foundry.';
        }
        return base;
    }
    catch (e) {
        return { error: String(e) };
    }
}
export function logCombatTrace(phase, payload) {
    if (!isCombatTraceDebugEnabled())
        return;
    try {
        console.warn(`Mastery System | [COMBAT-TRACE] ${phase}`, payload);
    }
    catch {
        /* ignore */
    }
}
//# sourceMappingURL=combat-trace-debug.js.map