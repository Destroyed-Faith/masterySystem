/**
 * Side color for a combatant card: player characters blue, everyone else red.
 * Not Foundry token disposition — that was always hostile for most NPCs.
 */
export function carouselSideClass(actorType: string | undefined): 'disp-pc' | 'disp-npc' {
  return String(actorType || '').toLowerCase() === 'character' ? 'disp-pc' : 'disp-npc';
}

function tokenDocFrom(combatant: any, token?: any): any {
  return token?.document ?? token ?? combatant?.token?.document ?? combatant?.token ?? null;
}

/** Whether the placeable is linked to the world Actor (sheet renames are authoritative). */
export function isCombatantActorLinked(combatant: any, token?: any): boolean {
  const tokenDoc = tokenDocFrom(combatant, token);
  if (tokenDoc?.actorLink === false || tokenDoc?.actorLink === 0) return false;
  return true;
}

/**
 * Label for a carousel combatant.
 * Prefer combatant.name — rename hooks keep it synced from Token and Actor updates.
 * If the Token was renamed but combatant/actor still agree on the old label, use the Token.
 */
export function resolveCombatantDisplayName(combatant: any, token?: any, actor?: any): string {
  const tokenDoc = tokenDocFrom(combatant, token);
  const resolvedActor = actor ?? combatant?.actor;
  const linked = isCombatantActorLinked(combatant, token);
  const actorName = String(resolvedActor?.name || '').trim();
  const tokenName = String(tokenDoc?.name ?? token?.name ?? '').trim();
  const combatantName = String(combatant?.name || '').trim();

  // Token renamed; combatant snapshot (+ actor) still on the old shared name.
  if (
    tokenName &&
    actorName &&
    combatantName &&
    tokenName !== actorName &&
    actorName === combatantName
  ) {
    return tokenName;
  }

  if (combatantName) return combatantName;
  if (linked) return actorName || tokenName;
  return tokenName || actorName;
}

/** True when a Foundry update diff touches the document display name. */
export function updateDiffHasNameChange(changed: any): boolean {
  if (!changed || typeof changed !== 'object') return false;
  if (changed.name !== undefined) return true;
  if (changed.delta?.name !== undefined) return true;
  if (changed.actorData?.name !== undefined) return true;
  return false;
}

/** New name from an update diff, or empty string. */
export function nameFromUpdateDiff(changed: any, fallback?: unknown): string {
  const raw =
    changed?.name ?? changed?.delta?.name ?? changed?.actorData?.name ?? fallback ?? '';
  return String(raw || '').trim();
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
