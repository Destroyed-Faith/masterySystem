/**
 * Last Breath (Core v0.9.9.6) — once per Safe Haven Rest, when you would drop to
 * Incapacitated, Seal 1 Attribute Stone and stay conscious with 1 HP in the
 * Broken Health Bar. The Sealed Stone returns at the next Safe Haven Rest.
 */

import { getStonePool, STONE_POOL_ATTRIBUTE_KEYS } from '../combat/action-economy.js';

export const LAST_BREATH_FLAG = 'lastBreathUsed';

export function lastBreathUsedThisRest(actor: {
  getFlag?: (scope: string, key: string) => unknown;
}): boolean {
  return actor.getFlag?.('mastery-system', LAST_BREATH_FLAG) === true;
}

export function actorHasReadyStone(actor: any): boolean {
  for (const attr of STONE_POOL_ATTRIBUTE_KEYS) {
    if (getStonePool(actor, attr).current > 0) return true;
  }
  return false;
}

export function canUseLastBreath(actor: any): boolean {
  if (!actor || lastBreathUsedThisRest(actor)) return false;
  return actorHasReadyStone(actor);
}

function barIndexByName(bars: Array<{ name?: string }>, name: string): number {
  const needle = name.toLowerCase();
  return bars.findIndex((b) => String(b?.name || '').toLowerCase() === needle);
}

export function wouldDropToIncapacitated(bars: Array<{ name?: string; current?: number }>): boolean {
  const incapIdx = barIndexByName(bars, 'incapacitated');
  if (incapIdx >= 0) return Math.max(0, Number(bars[incapIdx]?.current) || 0) <= 0;
  return bars.every((b) => Math.max(0, Number(b?.current) || 0) <= 0);
}

/** Mutate bars in place: 1 HP in Broken, later bars restored. Returns the Broken index. */
export function applyLastBreathBars(bars: Array<{ name?: string; current?: number; max?: number }>): number {
  const broken = barIndexByName(bars, 'broken');
  const idx = broken >= 0 ? broken : Math.max(0, bars.length - 2);
  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i];
    if (!bar) continue;
    if (i === idx) bar.current = 1;
    else if (i > idx) bar.current = Math.max(0, Number(bar.max) || 0);
  }
  return idx;
}

async function sealOneReadyStone(actor: any): Promise<string | null> {
  for (const attr of STONE_POOL_ATTRIBUTE_KEYS) {
    const pool = getStonePool(actor, attr);
    if (pool.current <= 0) continue;
    // `sealed` blocks regen and end-of-combat refills until a Safe Haven Rest.
    const sealedNow = Math.max(0, Number(actor?.system?.stonePools?.[attr]?.sealed) || 0);
    await actor.update?.({
      [`system.stonePools.${attr}.current`]: pool.current - 1,
      [`system.stonePools.${attr}.sealed`]: sealedNow + 1,
    });
    return attr;
  }
  return null;
}

async function confirmLastBreath(actor: any): Promise<boolean> {
  const DialogV2 = (globalThis as any).foundry?.applications?.api?.DialogV2;
  const name = String(actor?.name || 'You');
  const content = `${name} would drop to Incapacitated. Seal <strong>1 Attribute Stone</strong> (it returns at the next Safe Haven Rest) to stay conscious with 1 HP in the Broken Health Bar? Remaining damage from this hit is ignored.`;
  if (typeof DialogV2?.confirm === 'function') {
    return !!(await DialogV2.confirm({
      window: { title: 'Last Breath' },
      content: `<p>${content}</p>`,
      yes: { label: 'Last Breath' },
      no: { label: 'Fall' },
    }));
  }
  const DialogCls = (globalThis as any).Dialog;
  if (typeof DialogCls?.confirm === 'function') {
    return !!(await DialogCls.confirm({
      title: 'Last Breath',
      content: `<p>${content}</p>`,
      yes: () => true,
      no: () => false,
    }));
  }
  return true;
}

/**
 * If this hit would drop the actor to Incapacitated, offer Last Breath.
 * Mutates `bars` when accepted. Returns the Broken bar index, or null.
 */
export async function maybeApplyLastBreath(
  actor: any,
  bars: Array<{ name?: string; current?: number; max?: number }>,
): Promise<number | null> {
  if (!wouldDropToIncapacitated(bars) || !canUseLastBreath(actor)) return null;
  const accepted = await confirmLastBreath(actor);
  if (!accepted) return null;
  const sealed = await sealOneReadyStone(actor);
  if (!sealed) return null;
  await actor.setFlag?.('mastery-system', LAST_BREATH_FLAG, true);
  const brokenIdx = applyLastBreathBars(bars);
  (globalThis as any).ui?.notifications?.info(
    `${actor.name}: Last Breath — stays conscious with 1 HP in the Broken bar (Sealed 1 ${sealed} Stone).`,
  );
  return brokenIdx;
}

export async function clearLastBreathOnRest(actor: {
  getFlag?: (scope: string, key: string) => unknown;
  unsetFlag?: (scope: string, key: string) => Promise<unknown>;
}): Promise<void> {
  if (actor.getFlag?.('mastery-system', LAST_BREATH_FLAG) !== true) return;
  await actor.unsetFlag?.('mastery-system', LAST_BREATH_FLAG);
}
