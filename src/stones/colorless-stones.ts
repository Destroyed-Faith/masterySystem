/**
 * Colorless Stones from Initiative Exchange and item grants (Absorption).
 *
 * Initiative Exchange: convert remaining Initiative into Initiative Colorless
 * Stones at `4 × Mastery Rank` Initiative per Stone. They join the Colorless
 * Pool for the current combat, may pay any part of an unlocked Stone
 * Ability's normal cost, and use Ready / Exhausted normally: spending one
 * makes it Exhausted, and it may return through normal end-of-Round Stone
 * Regeneration. They disappear when combat ends — Ready or Exhausted — and
 * can never be burned, Sealed, or Bound.
 *
 * Item-granted stones stay on the actor and follow that item's own rule
 * (Absorption: vanish when spent, gone at the end of the next turn). Combat
 * cleanup must not treat them as leftover Initiative.
 *
 * Permanent Colorless Stones (progression, `system.stonePools.colorless`)
 * share the same combat Colorless Pool for spending and Regeneration but
 * survive the combat.
 */

export const COLORLESS_STONE_ATTR = 'colorless';

export const COLORLESS_GEM_STYLE = { fill: '#eceff1', stroke: '#90a4ae' };

const FLAG_COUNT = 'tempColorlessStones';
const FLAG_INITIATIVE = 'initiativeColorlessStones';
const FLAG_INITIATIVE_EXHAUSTED = 'initiativeColorlessExhausted';
const FLAG_ABSORPTION_EXPIRY = 'absorptionStoneExpiry';
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

function rawInitiativeColorlessStones(actor: any): number | undefined {
  const raw = actor?.getFlag?.('mastery-system', FLAG_INITIATIVE);
  if (raw === undefined || raw === null) return undefined;
  return Math.max(0, Math.floor(Number(raw) || 0));
}

/** Ready Initiative Colorless Stones (part of the spendable pile). */
export function getInitiativeColorlessStones(actor: any): number {
  const tagged = rawInitiativeColorlessStones(actor);
  if (tagged === undefined) return 0;
  return Math.min(tagged, getTempColorlessStones(actor));
}

/** Exhausted Initiative Colorless Stones — spent, but still part of the combat. */
export function getExhaustedInitiativeColorlessStones(actor: any): number {
  return Math.max(
    0,
    Math.floor(Number(actor?.getFlag?.('mastery-system', FLAG_INITIATIVE_EXHAUSTED) ?? 0) || 0),
  );
}

/** All Initiative Colorless Stones alive in this combat (Ready + Exhausted). */
export function getInitiativeColorlessTotal(actor: any): number {
  return getInitiativeColorlessStones(actor) + getExhaustedInitiativeColorlessStones(actor);
}

/** Colorless Stones that did not come from Initiative (Absorption / items). */
export function getItemColorlessStones(actor: any): number {
  return Math.max(0, getTempColorlessStones(actor) - getInitiativeColorlessStones(actor));
}

function knownAbsorptionItemStones(actor: any): number {
  const flag = actor?.getFlag?.('mastery-system', FLAG_ABSORPTION_EXPIRY) as
    | { count?: unknown }
    | undefined;
  return Math.max(0, Math.floor(Number(flag?.count) || 0));
}

async function setInitiativeColorlessStones(actor: any, count: number): Promise<void> {
  const next = Math.max(0, Math.floor(Number(count) || 0));
  if (next <= 0) {
    await actor?.unsetFlag?.('mastery-system', FLAG_INITIATIVE);
    return;
  }
  await actor?.setFlag?.('mastery-system', FLAG_INITIATIVE, next);
}

export async function setTempColorlessStones(actor: any, count: number): Promise<void> {
  const next = Math.max(0, Math.floor(Number(count) || 0));
  if (next <= 0) {
    await actor?.unsetFlag?.('mastery-system', FLAG_COUNT);
    await actor?.unsetFlag?.('mastery-system', FLAG_INITIATIVE);
    return;
  }
  await actor?.setFlag?.('mastery-system', FLAG_COUNT, next);
  const tagged = rawInitiativeColorlessStones(actor);
  if (tagged !== undefined && tagged > next) {
    await setInitiativeColorlessStones(actor, next);
  }
}

/** Item / Absorption grant — does not count as leftover Initiative. */
export async function addTempColorlessStones(actor: any, amount: number): Promise<number> {
  const add = Math.max(0, Math.floor(Number(amount) || 0));
  const next = getTempColorlessStones(actor) + add;
  await setTempColorlessStones(actor, next);
  return next;
}

/** Initiative Exchange grant — gained Ready, alive until the combat ends. */
export async function addInitiativeColorlessStones(actor: any, amount: number): Promise<number> {
  const add = Math.max(0, Math.floor(Number(amount) || 0));
  if (add <= 0) return getTempColorlessStones(actor);
  const nextTotal = getTempColorlessStones(actor) + add;
  const nextInit = getInitiativeColorlessStones(actor) + add;
  await actor?.setFlag?.('mastery-system', FLAG_COUNT, nextTotal);
  await setInitiativeColorlessStones(actor, nextInit);
  return nextTotal;
}

async function setExhaustedInitiativeColorlessStones(actor: any, count: number): Promise<void> {
  const next = Math.max(0, Math.floor(Number(count) || 0));
  if (next <= 0) {
    await actor?.unsetFlag?.('mastery-system', FLAG_INITIATIVE_EXHAUSTED);
    return;
  }
  await actor?.setFlag?.('mastery-system', FLAG_INITIATIVE_EXHAUSTED, next);
}

export async function copyColorlessPile(from: any, to: any): Promise<void> {
  if (!from || !to || from === to) return;
  if (String((from as { id?: string }).id ?? '') === String((to as { id?: string }).id ?? '')) {
    return;
  }
  const total = getTempColorlessStones(from);
  const init = getInitiativeColorlessStones(from);
  const exhausted = getExhaustedInitiativeColorlessStones(from);
  if (total <= 0) {
    await setTempColorlessStones(to, 0);
  } else {
    await to?.setFlag?.('mastery-system', FLAG_COUNT, total);
    await setInitiativeColorlessStones(to, init);
  }
  await setExhaustedInitiativeColorlessStones(to, exhausted);
}

/**
 * Permanent Colorless Stones (v0.9.9): converted 2:1 from unassigned
 * permanent progression Stones. They live in `system.stonePools.colorless`,
 * use the normal Stone states, become Exhausted when spent, and regenerate
 * normally. Temporary Colorless Stones stay a separate combat resource.
 */
export function getPermanentColorlessStones(actor: any): { current: number; max: number } {
  const pool = actor?.system?.stonePools?.colorless ?? {};
  return {
    current: Math.max(0, Math.floor(Number(pool.current) || 0)),
    max: Math.max(0, Math.floor(Number(pool.max) || 0)),
  };
}

/**
 * Colorless Stones spendable right now: item-granted pile + Ready Initiative
 * Colorless + Ready Permanent Colorless.
 */
export function getSpendableColorlessStones(actor: any): number {
  return getTempColorlessStones(actor) + getPermanentColorlessStones(actor).current;
}

/**
 * Spend Colorless Stones. Deterministic, player-favorable source order:
 * item-granted first (they vanish on spend and expire soonest), then Ready
 * Initiative Colorless (combat-limited; they become Exhausted and may
 * regenerate), then Ready Permanent Colorless (they become Exhausted and
 * survive the combat).
 */
export async function spendColorlessStones(actor: any, amount: number): Promise<boolean> {
  const n = Math.max(0, Math.floor(Number(amount) || 0));
  if (n <= 0) return true;
  const temp = getTempColorlessStones(actor);
  const fromTemp = Math.min(n, temp);
  const fromPermanent = n - fromTemp;
  if (fromPermanent > 0) {
    const perm = getPermanentColorlessStones(actor);
    if (perm.current < fromPermanent) return false;
  }
  if (fromTemp > 0 && !(await spendTempColorlessStones(actor, fromTemp))) return false;
  if (fromPermanent > 0) {
    const perm = getPermanentColorlessStones(actor);
    await actor?.update?.({
      'system.stonePools.colorless.current': Math.max(0, perm.current - fromPermanent),
    });
  }
  return true;
}

/**
 * Spend from the temporary pile: item-granted stones first (source rule —
 * they vanish when spent), then Ready Initiative Colorless Stones, which
 * become Exhausted instead of disappearing.
 */
export async function spendTempColorlessStones(actor: any, amount: number): Promise<boolean> {
  const n = Math.max(0, Math.floor(Number(amount) || 0));
  if (n <= 0) return true;
  const have = getTempColorlessStones(actor);
  if (have < n) return false;
  const init = getInitiativeColorlessStones(actor);
  const item = Math.max(0, have - init);
  const fromItem = Math.min(n, item);
  const fromInit = n - fromItem;
  const nextTotal = have - n;
  const nextInit = init - fromInit;
  if (nextTotal <= 0) {
    await setTempColorlessStones(actor, 0);
  } else {
    await actor?.setFlag?.('mastery-system', FLAG_COUNT, nextTotal);
    await setInitiativeColorlessStones(actor, nextInit);
  }
  if (fromInit > 0) {
    await setExhaustedInitiativeColorlessStones(
      actor,
      getExhaustedInitiativeColorlessStones(actor) + fromInit,
    );
  }
  return true;
}

/**
 * Normal Stone Regeneration on Initiative Colorless Stones: move up to
 * `amount` Exhausted Initiative Colorless Stones back to Ready. Returns how
 * many actually came back.
 */
export async function restoreInitiativeColorlessStones(actor: any, amount: number): Promise<number> {
  const n = Math.max(0, Math.floor(Number(amount) || 0));
  if (n <= 0) return 0;
  const exhausted = getExhaustedInitiativeColorlessStones(actor);
  const restore = Math.min(n, exhausted);
  if (restore <= 0) return 0;
  await setExhaustedInitiativeColorlessStones(actor, exhausted - restore);
  await actor?.setFlag?.('mastery-system', FLAG_COUNT, getTempColorlessStones(actor) + restore);
  await setInitiativeColorlessStones(actor, getInitiativeColorlessStones(actor) + restore);
  return restore;
}

/** Drop item-granted stones without touching the Initiative leftover count. */
export async function dropItemColorlessStones(actor: any, amount: number): Promise<number> {
  const n = Math.max(0, Math.floor(Number(amount) || 0));
  if (n <= 0) return 0;
  const item = getItemColorlessStones(actor);
  const drop = Math.min(item, n);
  if (drop <= 0) return 0;
  const next = getTempColorlessStones(actor) - drop;
  if (next <= 0) {
    await actor?.unsetFlag?.('mastery-system', FLAG_COUNT);
    return drop;
  }
  await actor?.setFlag?.('mastery-system', FLAG_COUNT, next);
  return drop;
}

export async function clearTempColorlessStones(actor: any): Promise<void> {
  await setTempColorlessStones(actor, 0);
  await actor?.unsetFlag?.('mastery-system', FLAG_INITIATIVE_EXHAUSTED);
}

/**
 * End of combat: all Initiative Colorless Stones disappear, Ready or
 * Exhausted. Item-granted stones stay. Untagged leftovers from before source
 * tracking count as Initiative, minus any Absorption expiry still on the
 * actor.
 */
export async function clearInitiativeColorlessStones(actor: any): Promise<void> {
  const total = getTempColorlessStones(actor);
  const tagged = rawInitiativeColorlessStones(actor);
  let drop: number;
  if (tagged !== undefined) {
    drop = Math.min(total, tagged);
  } else {
    drop = Math.max(0, total - knownAbsorptionItemStones(actor));
  }
  const remain = total - drop;
  await actor?.unsetFlag?.('mastery-system', FLAG_INITIATIVE);
  await actor?.unsetFlag?.('mastery-system', FLAG_INITIATIVE_EXHAUSTED);
  if (remain <= 0) {
    await actor?.unsetFlag?.('mastery-system', FLAG_COUNT);
    return;
  }
  await actor?.setFlag?.('mastery-system', FLAG_COUNT, remain);
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

const FLAG_TEMP_HP_STONE = 'msTempHpStoneUsed';

export function isTempHpStoneUsedThisCombat(combatant: any): boolean {
  return !!combatant?.getFlag?.('mastery-system', FLAG_TEMP_HP_STONE);
}

export async function markTempHpStoneUsedThisCombat(combatant: any): Promise<void> {
  await combatant?.setFlag?.('mastery-system', FLAG_TEMP_HP_STONE, true);
}

/** Combatant flags for Stone Powers that may fire only once per encounter. */
const ONCE_PER_COMBAT_FLAGS: Record<string, string> = {
  'wits.initiativeBoost': FLAG_BOOST_USED,
  'wits.phasing': FLAG_PHASING_STONE,
  'vitality.tempHp': FLAG_TEMP_HP_STONE,
};

export function oncePerCombatFlagForPower(powerId: string): string | null {
  return ONCE_PER_COMBAT_FLAGS[String(powerId || '')] ?? null;
}

export function isOncePerCombatPowerUsed(combatant: any, powerId: string): boolean {
  const flag = oncePerCombatFlagForPower(powerId);
  if (!flag) return false;
  return !!combatant?.getFlag?.('mastery-system', flag);
}

export async function markOncePerCombatPowerUsed(combatant: any, powerId: string): Promise<void> {
  const flag = oncePerCombatFlagForPower(powerId);
  if (!flag) return;
  await combatant?.setFlag?.('mastery-system', flag, true);
}

/** Initiative Boost tier scale: 1 / 2 / 4 / 8 × Mastery Rank. Tier 4 is the last tier. */
export function initiativeBoostAmount(tier: number, masteryRank: number): number {
  const t = Math.floor(Number(tier) || 1);
  if (t < 1 || t > 4) return 0;
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
  await addInitiativeColorlessStones(owner, preview.stones);
  await copyColorlessPile(owner, actor);
  return { stones: preview.stones, remainingInitiative: preview.remainingInitiative };
}

export async function clearColorlessStonesForCombat(combat: any): Promise<void> {
  if (!combat?.combatants) return;
  for (const c of combat.combatants) {
    const actor = c?.actor;
    if (!actor) continue;
    try {
      await clearInitiativeColorlessStones(actor);
    } catch {
      /* best-effort */
    }
  }
}
