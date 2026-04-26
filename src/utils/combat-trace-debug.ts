/**
 * Optional diagnostics for combat rounds, turn order, and initiative values.
 *
 * Enable any of:
 * - World setting **Debug: Combat turns & initiative** (`debugCombatTurns`)
 * - Client setting **Debug Mode** (`debugMode`)
 * - Console: `globalThis.MSY_DEBUG_COMBAT = true` then reload.
 */

function duplicateNonEmptyIds(ids: (string | null | undefined)[]): string[] {
  const seen = new Set<string>();
  const dups = new Set<string>();
  for (const id of ids) {
    if (id == null || id === '') continue;
    if (seen.has(id)) dups.add(id);
    else seen.add(id);
  }
  return [...dups];
}

export function isCombatTraceDebugEnabled(): boolean {
  try {
    if ((globalThis as any).MSY_DEBUG_COMBAT === true) return true;
    const g = (globalThis as any).game;
    if (!g?.settings?.get) return false;
    if (g.settings.get('mastery-system', 'debugCombatTurns') === true) return true;
    return g.settings.get('mastery-system', 'debugMode') === true;
  } catch {
    return false;
  }
}

/** Serialize `combat.turns` + current pointer for console diagnosis (init order, ini 0 vs 42, etc.). */
export function buildCombatTurnSnapshot(combat: any): Record<string, unknown> {
  if (!combat) return { error: 'no-combat' };
  try {
    const turns: any[] = Array.isArray(combat.turns) ? [...combat.turns] : [];
    const turnOrder = turns.map((c, i) => ({
      turnArrayIndex: i,
      combatantId: c?.id ?? null,
      name: c?.name ?? null,
      initiative: c?.initiative ?? null,
      msInitiativeValueFlag:
        typeof c?.getFlag === 'function'
          ? c.getFlag('mastery-system', 'msInitiativeValue')
          : undefined,
      defeated: !!c?.defeated,
      hidden: !!c?.hidden,
      actorId: c?.actor?.id ?? null,
      actorName: c?.actor?.name ?? null,
      tokenId: (c?.tokenId ?? c?.token?.id ?? null) as string | null,
    }));
    const cur = combat.combatant;
    const trace = isCombatTraceDebugEnabled();
    const dupActors = trace ? duplicateNonEmptyIds(turnOrder.map((t) => t.actorId)) : [];
    const dupTokens = trace ? duplicateNonEmptyIds(turnOrder.map((t) => t.tokenId)) : [];
    const base: Record<string, unknown> = {
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
            msInitiativeValueFlag:
              typeof cur.getFlag === 'function'
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
  } catch (e) {
    return { error: String(e) };
  }
}

export function logCombatTrace(phase: string, payload: Record<string, unknown>): void {
  if (!isCombatTraceDebugEnabled()) return;
  try {
    console.warn(`Mastery System | [COMBAT-TRACE] ${phase}`, payload);
  } catch {
    /* ignore */
  }
}
