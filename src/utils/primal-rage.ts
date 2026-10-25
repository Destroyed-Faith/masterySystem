/**
 * Primal Rage Disadvantage — auto-granted with Primal Vestment.
 */

export const PRIMAL_RAGE_DISADVANTAGE_ID = 'primal-rage';

export function actorHasPrimalVestment(actor: any): boolean {
  if (!actor?.items) return false;
  const items: any[] = Array.isArray(actor.items)
    ? actor.items
    : typeof actor.items[Symbol.iterator] === 'function'
      ? Array.from(actor.items)
      : [];
  return items.some((it) => {
    if (it?.type !== 'artifact') return false;
    const key = String(it.system?.definitionKey || it.system?.artifactKey || it.system?.key || '');
    const name = String(it.name || '');
    return /primalVestment/i.test(key) || /primal\s*vestment/i.test(name);
  });
}

export function actorHasPrimalRageDisadvantage(actor: any): boolean {
  const list = actor?.system?.disadvantages;
  if (!Array.isArray(list)) return false;
  return list.some(
    (d: any) =>
      String(d?.id || '') === PRIMAL_RAGE_DISADVANTAGE_ID ||
      /primal\s*rage/i.test(String(d?.name || '')),
  );
}

/**
 * Ensure Primal Rage (2 Points) is present while Primal Vestment is equipped.
 * Does not remove legal customizations; only adds the missing Disadvantage.
 */
export async function ensurePrimalRageDisadvantage(actor: any): Promise<boolean> {
  if (!actor || !actorHasPrimalVestment(actor)) return false;
  if (actorHasPrimalRageDisadvantage(actor)) return false;
  const list = Array.isArray(actor.system?.disadvantages)
    ? [...actor.system.disadvantages]
    : [];
  list.push({
    id: PRIMAL_RAGE_DISADVANTAGE_ID,
    name: 'Primal Rage',
    points: 2,
    details: { source: 'primalVestment' },
  });
  if (typeof actor.update === 'function') {
    await actor.update({ 'system.disadvantages': list });
  } else if (actor.system) {
    actor.system.disadvantages = list;
  }
  return true;
}
