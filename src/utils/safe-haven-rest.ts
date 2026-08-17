/**
 * Safe Haven Rest — restore per-rest resources on a character.
 * Players Guide: one night rest in a Safe Haven (secure + comfortable).
 */

import { SKILLS } from './skills.js';
import { buildFreshTraitUses } from './echos/index.js';
import { beginMinorMagicRest } from './minor-magic-items.js';
import { clearLastBreathOnRest } from '../stones/last-breath.js';

export const SAFE_HAVEN_REST_INFO =
  'Safe Haven Rest: HP, Stress, Scars, Stones, Mastery Charges, Skills, Reroll Points and Echo uses fully restored. You may create, replace, or dismiss Minor Magic Items.';

/** Actor updates for one Safe Haven Rest (no flags / side effects). */
export function buildSafeHavenRestUpdates(system: any): Record<string, unknown> {
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

  const hpBars = Array.isArray(system?.health?.bars) ? system.health.bars : [];
  if (hpBars.length > 0) {
    updates['system.health.bars'] = hpBars.map((b: any) => ({ ...b, current: b.max }));
    updates['system.health.currentBar'] = 0;
    updates['system.health.tempHP'] = 0;
    updates['system.health.scarred'] = 0;
  }

  const stressBars = Array.isArray(system?.stress?.bars) ? system.stress.bars : [];
  if (stressBars.length > 0) {
    updates['system.stress.bars'] = stressBars.map((b: any) => ({ ...b, current: b.max }));
    updates['system.stress.currentBar'] = 0;
    updates['system.stress.scarred'] = 0;
  }

  if (system?.mastery && Object.prototype.hasOwnProperty.call(system.mastery, 'charges')) {
    updates['system.mastery.charges'] = masteryRank;
  }

  if (system?.stones) {
    if (Object.prototype.hasOwnProperty.call(system.stones, 'sealed')) {
      updates['system.stones.sealed'] = 0;
    }
    if (Object.prototype.hasOwnProperty.call(system.stones, 'lost')) {
      updates['system.stones.lost'] = 0;
    }
    if (Object.prototype.hasOwnProperty.call(system.stones, 'bound')) {
      updates['system.stones.bound'] = 0;
    }
    if (Object.prototype.hasOwnProperty.call(system.stones, 'bondedFormActive')) {
      updates['system.stones.bondedFormActive'] = false;
    }
  }

  if (Array.isArray(system?.statusEffects) && system.statusEffects.length > 0) {
    updates['system.statusEffects'] = [];
  }

  return updates;
}

export async function applySafeHavenRest(actor: any): Promise<void> {
  if (!actor) return;
  const updates = buildSafeHavenRestUpdates(actor.system);
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
}

export function listWorldCharacters(): any[] {
  return ((game as any).actors?.filter((actor: any) => actor.type === 'character') as any[]) || [];
}

async function confirmPartySafeHaven(count: number): Promise<boolean> {
  const content =
    `Apply Safe Haven Rest to <strong>${count}</strong> character${count === 1 ? '' : 's'}? ` +
    `This restores HP, Stress, Scars, Stones, Mastery Charges, Skills, Reroll Points, and Echo uses.`;
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
