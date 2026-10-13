/**
 * Session flags for Stone Powers encounter prompts.
 * Kept separate so close handlers can mark dismiss synchronously
 * without importing the full encounter pipeline (no cycles / no await).
 */

const dismissedThisSession = new Set<string>();
let stonePowersClosedAt = 0;

function stepKey(combatId: string, actorId: string, step: string, round?: number): string {
  return round == null ? `${combatId}:${actorId}:${step}` : `${combatId}:${actorId}:${step}:${round}`;
}

export function clearStonePowersSession(): void {
  dismissedThisSession.clear();
  stonePowersClosedAt = 0;
}

export function stonePowersReopenBlocked(cooldownMs = 2500): boolean {
  return Date.now() - stonePowersClosedAt < cooldownMs;
}

export function isStonePowersDismissed(
  combatId: string,
  actorId: string,
  round: number,
  combatantId?: string | null,
): boolean {
  if (dismissedThisSession.has(stepKey(combatId, actorId, 'stones', round))) return true;
  if (combatantId && dismissedThisSession.has(stepKey(combatId, String(combatantId), 'stones', round))) {
    return true;
  }
  return false;
}

/**
 * Mark Stone Powers as dismissed for this combat round.
 * Call synchronously on ✕ / Escape — before any await — so a concurrent
 * encounter resume cannot reopen the dialog.
 */
export function dismissStonePowersPrompt(
  combat: Combat | null | undefined,
  actor: Actor | null | undefined,
  combatant?: Combatant | null,
): void {
  stonePowersClosedAt = Date.now();
  const combatId = String((combat as { id?: string } | null | undefined)?.id ?? (game as any)?.combat?.id ?? '');
  const actorId = String((actor as { id?: string } | null | undefined)?.id ?? '');
  if (!combatId || !actorId) return;
  const round = Math.max(
    1,
    Number((combat as { round?: number } | null | undefined)?.round ?? (game as any)?.combat?.round) || 1,
  );
  dismissedThisSession.add(stepKey(combatId, actorId, 'stones', round));
  const combatantId = (combatant as { id?: string } | null | undefined)?.id;
  if (combatantId) {
    dismissedThisSession.add(stepKey(combatId, String(combatantId), 'stones', round));
  }
}
