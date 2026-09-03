/**
 * Temporary Colorless Stones — Initiative Exchange and Absorption.
 *
 * Initiative Exchange: convert remaining Initiative into Temporary Colorless
 * Stones at `4 × Mastery Rank` Initiative per Stone. They may pay any part of
 * an unlocked Stone Ability's normal cost. When spent they disappear (they
 * are never Exhausted, burned, sealed, or bound) and leftover stones vanish
 * at the end of combat.
 */

export const COLORLESS_STONE_ATTR = 'colorless';

export const COLORLESS_GEM_STYLE = { fill: '#eceff1', stroke: '#90a4ae' };

const FLAG_COUNT = 'tempColorlessStones';
const FLAG_BOOST_USED = 'msInitiativeBoostUsed';

export function getMasteryRank(actor: any): number {
  const raw = Number(actor?.system?.mastery?.rank ?? 2) || 2;
  return Math.max(2, Math.min(8, Math.floor(raw)));
}

/** Initiative spent to buy one Temporary Colorless Stone. */
export function colorlessStoneInitiativeCost(masteryRank: number): number {
  return 4 * Math.max(1, Math.floor(Number(masteryRank) || 2));
}

export function getTempColorlessStones(actor: any): number {
  return Math.max(0, Math.floor(Number(actor?.getFlag?.('mastery-system', FLAG_COUNT) ?? 0) || 0));
}

export async function setTempColorlessStones(actor: any, count: number): Promise<void> {
  const next = Math.max(0, Math.floor(Number(count) || 0));
  if (next <= 0) {
    await actor?.unsetFlag?.('mastery-system', FLAG_COUNT);
    return;
  }
  await actor?.setFlag?.('mastery-system', FLAG_COUNT, next);
}

export async function addTempColorlessStones(actor: any, amount: number): Promise<number> {
  const add = Math.max(0, Math.floor(Number(amount) || 0));
  const next = getTempColorlessStones(actor) + add;
  await setTempColorlessStones(actor, next);
  return next;
}

export async function spendTempColorlessStones(actor: any, amount: number): Promise<boolean> {
  const n = Math.max(0, Math.floor(Number(amount) || 0));
  if (n <= 0) return true;
  const have = getTempColorlessStones(actor);
  if (have < n) return false;
  await setTempColorlessStones(actor, have - n);
  return true;
}

export async function clearTempColorlessStones(actor: any): Promise<void> {
  await setTempColorlessStones(actor, 0);
}

export function isInitiativeBoostUsedThisCombat(combatant: any): boolean {
  return !!combatant?.getFlag?.('mastery-system', FLAG_BOOST_USED);
}

export async function markInitiativeBoostUsedThisCombat(combatant: any): Promise<void> {
  await combatant?.setFlag?.('mastery-system', FLAG_BOOST_USED, true);
}

const FLAG_PHASING_STONE = 'msPhasingStoneUsed';

export function isPhasingStoneUsedThisCombat(combatant: any): boolean {
  return !!combatant?.getFlag?.('mastery-system', FLAG_PHASING_STONE);
}

export async function markPhasingStoneUsedThisCombat(combatant: any): Promise<void> {
  await combatant?.setFlag?.('mastery-system', FLAG_PHASING_STONE, true);
}

/** Initiative Boost tier scale: 1 / 2 / 4 / 8 × Mastery Rank (then keep doubling). */
export function initiativeBoostAmount(tier: number, masteryRank: number): number {
  const t = Math.max(1, Math.floor(Number(tier) || 1));
  const mr = Math.max(1, Math.floor(Number(masteryRank) || 2));
  const mult = 2 ** (t - 1);
  return mr * mult;
}

export function maxConvertibleColorlessStones(initiative: number, masteryRank: number): number {
  const cost = colorlessStoneInitiativeCost(masteryRank);
  if (cost <= 0) return 0;
  return Math.max(0, Math.floor(Math.max(0, Number(initiative) || 0) / cost));
}

export function convertInitiativeToColorlessPreview(
  initiative: number,
  stones: number,
  masteryRank: number,
): { stones: number; initiativeCost: number; remainingInitiative: number } {
  const costEach = colorlessStoneInitiativeCost(masteryRank);
  const max = maxConvertibleColorlessStones(initiative, masteryRank);
  const n = Math.max(0, Math.min(max, Math.floor(Number(stones) || 0)));
  const initiativeCost = n * costEach;
  return {
    stones: n,
    initiativeCost,
    remainingInitiative: Math.max(0, Math.floor(Number(initiative) || 0) - initiativeCost),
  };
}

export async function convertInitiativeToColorlessStones(
  actor: any,
  combatant: any,
  stones: number,
): Promise<{ stones: number; remainingInitiative: number } | null> {
  if (!actor || !combatant) return null;
  const { getActionEconomyActor } = await import('../combat/action-economy.js');
  const owner = getActionEconomyActor(actor) ?? actor;
  const mr = getMasteryRank(owner);
  const current = Math.max(0, Math.floor(Number(combatant.initiative) || 0));
  const preview = convertInitiativeToColorlessPreview(current, stones, mr);
  if (preview.stones <= 0) return null;
  await combatant.update?.({ initiative: preview.remainingInitiative });
  await combatant.setFlag?.('mastery-system', 'msInitiativeValue', preview.remainingInitiative);
  await addTempColorlessStones(owner, preview.stones);
  if (owner !== actor && (owner as { id?: string }).id !== (actor as { id?: string }).id) {
    await setTempColorlessStones(actor, getTempColorlessStones(owner));
  }
  return { stones: preview.stones, remainingInitiative: preview.remainingInitiative };
}

export async function clearColorlessStonesForCombat(combat: any): Promise<void> {
  if (!combat?.combatants) return;
  for (const c of combat.combatants) {
    const actor = c?.actor;
    if (!actor) continue;
    try {
      await clearTempColorlessStones(actor);
    } catch {
      /* best-effort */
    }
  }
}
