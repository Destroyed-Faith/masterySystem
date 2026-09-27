/** Per-actor pinned powers for the combat-carousel favorites strip. */

export const POWER_FAVORITES_FLAG = 'powerFavorites';
export const POWER_FAVORITES_MAX = 6;

export function normalizePowerFavorites(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const entry of raw) {
    const id = String(entry || '').trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
    if (out.length >= POWER_FAVORITES_MAX) break;
  }
  return out;
}

export function readPowerFavorites(actor: any): string[] {
  try {
    if (typeof actor?.getFlag === 'function') {
      return normalizePowerFavorites(actor.getFlag('mastery-system', POWER_FAVORITES_FLAG));
    }
    return normalizePowerFavorites(actor?.flags?.['mastery-system']?.[POWER_FAVORITES_FLAG]);
  } catch {
    return [];
  }
}

export async function writePowerFavorites(actor: any, ids: string[]): Promise<string[]> {
  const next = normalizePowerFavorites(ids);
  if (typeof actor?.setFlag === 'function') {
    await actor.setFlag('mastery-system', POWER_FAVORITES_FLAG, next);
  } else if (typeof actor?.update === 'function') {
    await actor.update({ [`flags.mastery-system.${POWER_FAVORITES_FLAG}`]: next });
  }
  return next;
}

export async function togglePowerFavorite(actor: any, itemId: string): Promise<string[]> {
  const id = String(itemId || '').trim();
  if (!id) return readPowerFavorites(actor);
  const cur = readPowerFavorites(actor);
  if (cur.includes(id)) {
    return writePowerFavorites(
      actor,
      cur.filter((x) => x !== id),
    );
  }
  if (cur.length >= POWER_FAVORITES_MAX) {
    const shifted = [...cur.slice(1), id];
    return writePowerFavorites(actor, shifted);
  }
  return writePowerFavorites(actor, [...cur, id]);
}

export function isPowerFavorited(actor: any, itemId: string): boolean {
  return readPowerFavorites(actor).includes(String(itemId || '').trim());
}
