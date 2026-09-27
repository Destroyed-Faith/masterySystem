/**
 * Side color for a combatant card: player characters blue, everyone else red.
 * Not Foundry token disposition — that was always hostile for most NPCs.
 */
export function carouselSideClass(actorType: string | undefined): 'disp-pc' | 'disp-npc' {
  return String(actorType || '').toLowerCase() === 'character' ? 'disp-pc' : 'disp-npc';
}

/** @deprecated Use carouselSideClass — kept for older tests/callers. */
export function carouselDispositionClass(
  disposition: number,
): 'disp-friendly' | 'disp-neutral' | 'disp-hostile' {
  const d = Number(disposition);
  if (d > 0) return 'disp-friendly';
  if (d < 0) return 'disp-hostile';
  return 'disp-neutral';
}

export type CarouselTurnRow = { id: string; defeated?: boolean };

/**
 * Current combatant id from Foundry's turn index into `combat.turns`.
 * Prefer the index over `combat.combatant`, which can lag one step after nextTurn.
 */
export function resolveCurrentCombatantId(combat: {
  turn?: unknown;
  turns?: Array<{ id?: unknown } | null | undefined>;
  combatant?: { id?: unknown } | null;
  current?: { combatantId?: unknown } | null;
} | null | undefined): string | null {
  if (!combat) return null;
  const turns = Array.isArray(combat.turns) ? combat.turns : [];
  const turnIdx = Math.floor(Number(combat.turn));
  if (Number.isFinite(turnIdx) && turnIdx >= 0 && turnIdx < turns.length) {
    const id = turns[turnIdx]?.id;
    if (id != null && String(id)) return String(id);
  }
  const fallback = combat.combatant?.id ?? combat.current?.combatantId;
  return fallback != null && String(fallback) ? String(fallback) : null;
}

/**
 * Id of the next non-defeated combatant after the current one in tracker order.
 * Null while turns are gated (preparation / stones) or when there is no distinct next.
 */
export function findNextCombatantId(
  combatants: CarouselTurnRow[],
  currentId: string | null | undefined,
  turnsActive: boolean,
): string | null {
  if (!turnsActive || !currentId || !combatants.length) return null;
  const current = String(currentId);
  const idx = combatants.findIndex((c) => String(c.id) === current);
  if (idx < 0) return null;
  for (let step = 1; step < combatants.length; step++) {
    const c = combatants[(idx + step) % combatants.length];
    if (!c?.id || c.defeated) continue;
    if (String(c.id) === current) return null;
    return String(c.id);
  }
  return null;
}
