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
 *
 * Live Actor / Token names beat a stale `combatant.name` snapshot. Rename hooks
 * still write the combatant for persistence, but the card must update as soon as
 * the sheet (or token) name changes — especially for unlinked NPC copies.
 */
export function resolveCombatantDisplayName(combatant: any, token?: any, actor?: any): string {
  const tokenDoc = tokenDocFrom(combatant, token);
  const resolvedActor = actor ?? combatant?.actor;
  const linked = isCombatantActorLinked(combatant, token);
  const actorName = String(resolvedActor?.name || '').trim();
  const tokenName = String(tokenDoc?.name ?? token?.name ?? '').trim();
  const combatantName = String(combatant?.name || '').trim();

  // Live source of truth: linked → Actor sheet; unlinked → synthetic Actor then Token.
  const liveName = linked
    ? actorName || tokenName
    : actorName || tokenName;

  if (liveName && liveName !== combatantName) return liveName;

  // Token renamed independently; combatant (+ actor) still share the old label.
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
  return liveName;
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

/** Token id for a sheet Actor (synthetic token actor or first active placeable). */
export function actorTokenId(actor: any): string {
  return String(
    actor?.token?.id ??
      actor?.token?.document?.id ??
      actor?.getActiveTokens?.()?.[0]?.id ??
      actor?.getActiveTokens?.()?.[0]?.document?.id ??
      '',
  );
}

/** Clamp sustained Damage Reduction % to the sheet range. */
function clampDrPct(n: unknown): number {
  return Math.max(0, Math.min(100, Math.floor(Number(n) || 0)));
}

/**
 * Read NPC/summon stat-block DR % from the prepared combat breakdown rows.
 * `prepareDerivedData` records it as label "Stat block" / detail "NPC DR %".
 */
export function readNpcBlockDrPctFromCombat(combat: any): number {
  const rows = (combat?.damageReductionRows as any[]) || [];
  for (const r of rows) {
    if (r?.detail === 'NPC DR %' || r?.label === 'Stat block') {
      return clampDrPct(r.value);
    }
  }
  return 0;
}

export type CarouselDefensePeek = {
  armorPassive: number;
  evadePassive: number;
  damageReductionPct: number;
};

/**
 * Overlay self-facing mechanics peek onto stored combat totals for the carousel
 * strip (A4). Replaces only the mechanics-derived portion of Armor / Evade / DR;
 * preserves NPC stat-block DR (max), manual DR, and Stone DR Boost.
 */
export function overlayCarouselDefenseStrip(input: {
  actorType?: string;
  armorTotal: number;
  evadeTotal: number;
  damageReductionPct: number;
  armorFromMechanics: number;
  evadeFromMechanics: number;
  /** Mechanics DR total from last `prepareDerivedData` (`derived.mechanicsBreakdown`). */
  damageReductionFromMechanics: number;
  /** NPC/summon stat-block DR % (0 when absent). */
  npcBlockDrPct?: number;
  /** Manual sheet DR adjustment (may be negative). */
  manualDrPct?: number;
  /** Stone DR Boost % (`combat.stoneDrBonusPct`). */
  stoneDrBonusPct?: number;
  peek: CarouselDefensePeek;
}): { armor: number; evade: number; drPct: number } {
  const armor =
    Math.floor(Number(input.armorTotal) || 0) -
    Math.max(0, Math.floor(Number(input.armorFromMechanics) || 0)) +
    Math.max(0, Math.floor(Number(input.peek.armorPassive) || 0));
  const evade =
    Math.floor(Number(input.evadeTotal) || 0) -
    Math.floor(Number(input.evadeFromMechanics) || 0) +
    Math.floor(Number(input.peek.evadePassive) || 0);

  const peekDr = clampDrPct(input.peek.damageReductionPct);
  const storedMech = clampDrPct(input.damageReductionFromMechanics);
  const storedTotal = clampDrPct(input.damageReductionPct);
  const type = String(input.actorType || '').toLowerCase();

  let drPct: number;
  if (type === 'npc' || type === 'summon') {
    // Match prepareDerivedData: max(mechanics, block) then additive manual + stone.
    const block = clampDrPct(input.npcBlockDrPct ?? 0);
    const manual = Math.floor(Number(input.manualDrPct) || 0);
    const stone = Math.max(0, Math.floor(Number(input.stoneDrBonusPct) || 0));
    drPct = clampDrPct(Math.max(peekDr, block) + manual + stone);
  } else {
    // Replace mechanics portion only; residual retains manual / stone / other.
    drPct = clampDrPct(storedTotal - storedMech + peekDr);
  }

  return { armor, evade, drPct };
}

/**
 * Match a sheet Actor to combatants.
 * Token-bound sheets match that Token only (unlinked NPC copies share actorId).
 */
export function actorMatchesCombatant(actor: any, combatant: any): boolean {
  const tokenId = actorTokenId(actor);
  const cTokenId = String(combatant?.tokenId ?? combatant?.token?.id ?? '');
  if (tokenId) {
    return !!cTokenId && cTokenId === tokenId;
  }
  if (combatant?.actor && actor && combatant.actor === actor) return true;
  const actorId = String(actor?.id ?? '');
  const cActorId = String(combatant?.actorId ?? combatant?.actor?.id ?? '');
  return !!actorId && !!cActorId && actorId === cActorId;
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
  const n = combatants.length;
  for (let step = 1; step < n; step++) {
    const row = combatants[(idx + step) % n];
    if (!row?.defeated) return String(row.id);
  }
  return null;
}
