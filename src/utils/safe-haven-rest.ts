/**
 * Safe Haven Rest — restore per-rest resources on a character.
 * Players Guide: one night rest in a Safe Haven (secure + comfortable).
 */

import { SKILLS } from './skills.js';
import { buildFreshTraitUses } from './echos/index.js';
import { beginMinorMagicRest } from './minor-magic-items.js';
import { clearLastBreathOnRest } from '../stones/last-breath.js';

export const SAFE_HAVEN_REST_INFO =
  'Safe Haven Rest: active Health Bar + 1 Scarred Bar restored; Skill Points, Reroll Points, Mastery Charges, daily resources, Sealed Stones and Stones lost until Safe Haven Rest refreshed. You may create, replace, or dismiss Minor Magic Items.';

interface HealthBarLike {
  current?: number;
  max?: number;
}

/**
 * Health-bar updates for a rest (Players Guide "Rests"):
 *   - Night Rest / Safe Haven Rest: restore the current ACTIVE Health Bar to
 *     full (boxes only).
 *   - Safe Haven Rest additionally restores ONE Scarred Health Bar
 *     (counts as a Day of Rest).
 * Bars deplete from index 0 first, so scarred (fully emptied) bars form a
 * prefix and the active bar is the first bar with boxes left.
 */
export function buildRestHealthBarUpdates(
  system: any,
  opts: { restoreOneScarredBar: boolean },
): Record<string, unknown> {
  const src: HealthBarLike[] = Array.isArray(system?.health?.bars) ? system.health.bars : [];
  if (src.length === 0) return {};
  const bars = src.map((b: any) => ({ ...b }));

  // Active bar = first bar with boxes left; if everything is depleted the
  // last bar acts as the one being reopened.
  let activeIdx = bars.findIndex((b) => (Number(b?.current) || 0) > 0);
  if (activeIdx < 0) activeIdx = bars.length - 1;

  bars[activeIdx] = { ...bars[activeIdx], current: Number(bars[activeIdx]?.max) || 0 };

  // One Scarred Bar: the most recent one (directly before the active bar).
  if (opts.restoreOneScarredBar) {
    for (let i = activeIdx - 1; i >= 0; i--) {
      if ((Number(src[i]?.current) || 0) === 0) {
        bars[i] = { ...bars[i], current: Number(bars[i]?.max) || 0 };
        break;
      }
    }
  }

  const newActive = bars.findIndex((b) => (Number(b?.current) || 0) > 0);
  const scarredCount = bars.filter((b) => (Number(b?.current) || 0) === 0).length;
  return {
    'system.health.bars': bars,
    'system.health.currentBar': Math.max(0, newActive),
    'system.health.tempHP': 0,
    ...(Object.prototype.hasOwnProperty.call(system?.health ?? {}, 'scarred')
      ? { 'system.health.scarred': scarredCount }
      : {}),
  };
}

/** Sealed stones a Word of Recall mark keeps out of the refresh. */
export interface SafeHavenSealHold {
  /** Per stone-pool attribute counts that must stay Sealed. */
  attrCounts?: Record<string, number>;
  /** Generic `system.stones.sealed` count that must stay Sealed. */
  generic?: number;
}

/** Actor updates for one Safe Haven Rest (no flags / side effects). */
export function buildSafeHavenRestUpdates(
  system: any,
  opts?: { sealHold?: SafeHavenSealHold | null },
): Record<string, unknown> {
  const skillsSpent: Record<string, number> = {};
  for (const skillKey of Object.keys(SKILLS)) {
    skillsSpent[skillKey] = 0;
  }
  if (system?.skills && typeof system.skills === 'object') {
    for (const skillKey of Object.keys(system.skills)) {
      if (!Object.prototype.hasOwnProperty.call(skillsSpent, skillKey)) {
        skillsSpent[skillKey] = 0;
      }
    }
  }

  const faithMax = Math.max(0, Number(system?.faithFractures?.maximum) || 0);
  const echo = system?.echo || {};
  const masteryRank = Math.max(1, Number(system?.mastery?.rank) || 1);
  const echoUpdates: Record<string, unknown> = {};
  if (echo && echo.key) {
    echoUpdates['system.echo.cardUses'] = {};
    echoUpdates['system.echo.traitUses'] = buildFreshTraitUses(
      echo.key,
      echo.subChoiceKey || null,
      masteryRank,
    );
  }

  const updates: Record<string, unknown> = {
    'system.skillsSpent': skillsSpent,
    ...(faithMax > 0 ? { 'system.faithFractures.current': faithMax } : {}),
    ...echoUpdates,
  };

  // Health: restore the active Health Bar to full and reopen ONE Scarred Bar
  // (Players Guide "Safe Haven Rest" benefits 3 + 4). No full-track reset,
  // and Stress is not part of the documented Safe Haven refresh list.
  Object.assign(updates, buildRestHealthBarUpdates(system, { restoreOneScarredBar: true }));

  if (system?.mastery && Object.prototype.hasOwnProperty.call(system.mastery, 'charges')) {
    updates['system.mastery.charges'] = masteryRank;
  }

  // Word of Recall: Stones stay Sealed while the mark exists (PG Special
  // Cost Rule) — they return only after the mark ends AND a Safe Haven Rest.
  const holdGeneric = Math.max(0, Math.floor(Number(opts?.sealHold?.generic) || 0));
  const holdAttrs: Record<string, number> = {};
  for (const [attr, n] of Object.entries(opts?.sealHold?.attrCounts ?? {})) {
    const v = Math.max(0, Math.floor(Number(n) || 0));
    if (v > 0) holdAttrs[attr] = v;
  }

  if (system?.stones) {
    if (Object.prototype.hasOwnProperty.call(system.stones, 'sealed')) {
      updates['system.stones.sealed'] = holdGeneric;
    }
    if (Object.prototype.hasOwnProperty.call(system.stones, 'lost')) {
      updates['system.stones.lost'] = 0;
    }
    // `stones.bound` (Artifacts / Familiars / permanent bonds) does NOT
    // return on rest — only Stone-Bound Form is released.
    if (Object.prototype.hasOwnProperty.call(system.stones, 'bondedFormActive')) {
      updates['system.stones.bondedFormActive'] = false;
    }
  }

  // Sealed (Rituals) and Burned (Last Breath, Remove Scar, daily effects)
  // stones return on Safe Haven Rest: clear the per-pool counters and refill
  // each pool to capacity minus Sustain.
  const pools = system?.stonePools;
  if (pools && typeof pools === 'object') {
    for (const attr of Object.keys(pools)) {
      const pool = pools[attr] ?? {};
      const sealed = Math.max(0, Number(pool.sealed) || 0);
      const burned = Math.max(0, Number(pool.burned) || 0);
      const sustained = Math.max(0, Number(pool.sustained) || 0);
      const attrValue = Math.max(0, Number(system?.attributes?.[attr]?.value) || 0);
      const maxStones = attrValue > 0 ? Math.floor(attrValue / 8) : Math.max(0, Number(pool.max) || 0);
      const heldSealed = Math.min(holdAttrs[attr] ?? 0, maxStones);
      if (sealed !== heldSealed) updates[`system.stonePools.${attr}.sealed`] = heldSealed;
      if (burned > 0) updates[`system.stonePools.${attr}.burned`] = 0;
      const fullCurrent = Math.max(0, maxStones - sustained - heldSealed);
      if ((Number(pool.current) || 0) !== fullCurrent) {
        updates[`system.stonePools.${attr}.current`] = fullCurrent;
      }
    }
  }

  if (Array.isArray(system?.statusEffects) && system.statusEffects.length > 0) {
    updates['system.statusEffects'] = [];
  }

  return updates;
}

export async function applySafeHavenRest(actor: any): Promise<void> {
  if (!actor) return;
  // Word of Recall: Stones stay Sealed while the mark exists.
  let sealHold: SafeHavenSealHold | null = null;
  try {
    const { getWordOfRecallMark } = await import('../stones/word-of-recall-mark.js');
    const mark = getWordOfRecallMark(actor);
    if (mark) sealHold = { attrCounts: mark.attrCounts, generic: mark.generic };
  } catch {
    /* mark module unavailable */
  }
  const updates = buildSafeHavenRestUpdates(actor.system, { sealHold });
  try {
    if (actor.getFlag?.('mastery-system', 'bloodRaiseHpLostThisCombat') != null) {
      await actor.unsetFlag?.('mastery-system', 'bloodRaiseHpLostThisCombat');
    }
    if (actor.getFlag?.('mastery-system', 'bloodRaiseHpLost') != null) {
      await actor.unsetFlag?.('mastery-system', 'bloodRaiseHpLost');
    }
  } catch (err) {
    console.warn('Mastery System | Safe Haven blood raise flag clear failed', err);
  }
  await actor.update(updates);
  await beginMinorMagicRest(actor);
  await clearLastBreathOnRest(actor);
  try {
    const { clearDeathState } = await import('../combat/death-check.js');
    await clearDeathState(actor);
  } catch {
    /* death-check module unavailable */
  }
}

/**
 * Night Rest (8 h, anywhere): restores the current active Health Bar to full
 * (boxes only). No Scarred Bars, no daily/Sealed refresh.
 */
export async function applyNightRest(actor: any): Promise<void> {
  if (!actor) return;
  const updates = buildRestHealthBarUpdates(actor.system, { restoreOneScarredBar: false });
  if (Object.keys(updates).length > 0) await actor.update(updates);
}

/**
 * Day of Rest (24 h natural recovery): restores 1 Scarred Health Bar.
 * Lacerate / Blight block natural recovery until treated.
 */
export async function applyDayOfRest(actor: any): Promise<boolean> {
  if (!actor) return false;
  const list: any[] = Array.isArray(actor.system?.statusEffects) ? actor.system.statusEffects : [];
  const blocked = list.some((e: any) => {
    const id = String(e?.id ?? e?.name ?? '').toLowerCase();
    return id.includes('lacerate') || id.includes('blight');
  });
  if (blocked) {
    (ui as any).notifications?.warn?.(
      `${actor.name}: Lacerate/Blight prevents natural recovery until treated.`,
    );
    return false;
  }
  const src: any[] = Array.isArray(actor.system?.health?.bars) ? actor.system.health.bars : [];
  const idx = (() => {
    let active = src.findIndex((b: any) => (Number(b?.current) || 0) > 0);
    if (active < 0) active = src.length;
    for (let i = active - 1; i >= 0; i--) {
      if ((Number(src[i]?.current) || 0) === 0) return i;
    }
    return -1;
  })();
  if (idx < 0) return false;
  const bars = src.map((b: any) => ({ ...b }));
  bars[idx] = { ...bars[idx], current: Number(bars[idx]?.max) || 0 };
  const newActive = bars.findIndex((b: any) => (Number(b?.current) || 0) > 0);
  const scarredCount = bars.filter((b: any) => (Number(b?.current) || 0) === 0).length;
  await actor.update({
    'system.health.bars': bars,
    'system.health.currentBar': Math.max(0, newActive),
    ...(Object.prototype.hasOwnProperty.call(actor.system?.health ?? {}, 'scarred')
      ? { 'system.health.scarred': scarredCount }
      : {}),
  });
  return true;
}

export function listWorldCharacters(): any[] {
  return ((game as any).actors?.filter((actor: any) => actor.type === 'character') as any[]) || [];
}

async function confirmPartySafeHaven(count: number): Promise<boolean> {
  const content =
    `Apply Safe Haven Rest to <strong>${count}</strong> character${count === 1 ? '' : 's'}? ` +
    `This restores the active Health Bar + 1 Scarred Bar and refreshes Skill Points, Reroll Points, ` +
    `Mastery Charges, daily resources, Sealed Stones and Stones lost until Safe Haven Rest.`;
  const DialogV2 = (globalThis as any).foundry?.applications?.api?.DialogV2;
  if (typeof DialogV2?.confirm === 'function') {
    return !!(await DialogV2.confirm({
      window: { title: 'Safe Haven Rest — All Characters' },
      content: `<p>${content}</p>`,
      yes: { label: 'Rest' },
      no: { label: 'Cancel' },
    }));
  }
  return !!(await (Dialog as any).confirm({
    title: 'Safe Haven Rest — All Characters',
    content: `<p>${content}</p>`,
    yes: () => true,
    no: () => false,
  }));
}

/** GM: confirm, then rest every world character actor. */
export async function confirmAndApplySafeHavenRestToAllCharacters(): Promise<number> {
  if (!(game as any).user?.isGM) {
    (ui as any).notifications?.warn('Only the GM can rest all characters.');
    return 0;
  }
  const characters = listWorldCharacters();
  if (characters.length === 0) {
    (ui as any).notifications?.warn('No player characters found.');
    return 0;
  }
  const ok = await confirmPartySafeHaven(characters.length);
  if (!ok) return 0;

  let updated = 0;
  for (const actor of characters) {
    try {
      await applySafeHavenRest(actor);
      updated += 1;
    } catch (err) {
      console.warn('Mastery System | Safe Haven Rest failed for', actor?.name, err);
    }
  }
  (ui as any).notifications?.info(
    `Safe Haven Rest applied to ${updated} character${updated === 1 ? '' : 's'}. ${SAFE_HAVEN_REST_INFO}`,
  );
  return updated;
}
