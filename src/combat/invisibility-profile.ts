/**
 * Resolve Passive / Active Buff Invisibility into a combat profile.
 * Powers are the source of truth. Cloak Disruption no longer applies.
 */

import type { CombatSenseId } from './combat-senses.js';
import { resolvePowerMechanics } from '../utils/power-mechanics.js';
import { getTemplate } from '../utils/powers/templates/index.js';
import {
  getPerceptionCombatState,
  isInvisibilitySuppressedByHealth,
  setPerceptionCombatState,
  type PerceptionCombatState,
} from './perception-state.js';

/** Default Special Combat Senses Obscured when the Passive grants slots (until the player picks). */
export const DEFAULT_SPECIAL_SENSE_BLOCK_ORDER: CombatSenseId[] = [
  'lifeSense',
  'tremorSense',
  'mageSense',
  'sonarSense',
  'predatorSense',
];

export interface InvisibilityProfile {
  /** Combined Passive + Active Buff Invisibility Bonus. */
  baseBonus: number;
  /** How many Special Combat Sense slots the Passive grants (Active Buff adds 0). */
  specialSenseSlots: number;
  /**
   * Covered (Obscured) senses — Normal + Darkvision always when active,
   * plus chosen Special Combat Senses from the Passive.
   */
  blockedSenses: CombatSenseId[];
  /** True when any invisibility source is present and not health-suppressed. */
  active: boolean;
}

function powerRank(item: any): number {
  const sys = item?.system ?? {};
  const raw = Number(sys.rank ?? sys.level ?? 1);
  return Math.max(1, Math.min(16, Number.isFinite(raw) ? Math.floor(raw) : 1));
}

function catalogInvisibilityBonus(templateId: string, rank: number): number {
  const tpl = getTemplate(templateId);
  if (!tpl?.levels) return 0;
  const row = (tpl.levels as any)[String(rank)];
  const fromMech = Number(row?.mechanics?.invisibilityBonus);
  if (Number.isFinite(fromMech) && fromMech > 0) return Math.floor(fromMech);
  return 0;
}

function catalogSpecialSenseSlots(templateId: string, rank: number): number {
  const tpl = getTemplate(templateId);
  if (!tpl?.levels) return 0;
  const row = (tpl.levels as any)[String(rank)];
  const fromMech = Number(row?.mechanics?.blockedSpecialSenseSlots);
  if (Number.isFinite(fromMech) && fromMech > 0) return Math.floor(fromMech);
  return 0;
}

function readChosenSpecialSenses(item: any, slots: number): CombatSenseId[] {
  if (slots <= 0) return [];
  const sys = item?.system ?? {};
  const raw =
    sys.blockedCombatSenses ??
    sys.chosenBlockedSenses ??
    item?.getFlag?.('mastery-system', 'blockedCombatSenses');
  const chosen: CombatSenseId[] = [];
  if (Array.isArray(raw)) {
    for (const id of raw) {
      const s = String(id || '') as CombatSenseId;
      if (DEFAULT_SPECIAL_SENSE_BLOCK_ORDER.includes(s) && !chosen.includes(s)) chosen.push(s);
      if (chosen.length >= slots) break;
    }
  }
  for (const id of DEFAULT_SPECIAL_SENSE_BLOCK_ORDER) {
    if (chosen.length >= slots) break;
    if (!chosen.includes(id)) chosen.push(id);
  }
  return chosen.slice(0, slots);
}

function iterActorPowerItems(actor: any): any[] {
  const items = actor?.items;
  if (!items) return [];
  if (Array.isArray(items)) return items;
  try {
    return Array.from(items);
  } catch {
    return [];
  }
}

/**
 * Live Invisibility profile from owned Passive: Invisibility + Active Buff: Invisibility.
 */
export function resolveInvisibilityFromActor(actor: any): InvisibilityProfile {
  let baseBonus = 0;
  let specialSenseSlots = 0;
  const specialBlocked: CombatSenseId[] = [];

  for (const item of iterActorPowerItems(actor)) {
    if (item?.type !== 'power') continue;
    const tid = String(item.system?.templateId || '');
    const sub = String(item.system?.subfamily || '').toLowerCase();
    const isPassiveInv =
      tid === 'passive-invisibility' ||
      (sub === 'invisibility' && String(item.system?.category || '').toLowerCase() === 'passive');
    const isBuffInv = tid === 'ab-invisibility';
    if (!isPassiveInv && !isBuffInv) continue;

    const rank = powerRank(item);
    let bonus = 0;
    let slots = 0;
    try {
      const mech = resolvePowerMechanics(item);
      bonus = Math.max(0, Math.floor(Number(mech?.invisibilityBonus) || 0));
      slots = Math.max(0, Math.floor(Number((mech as any)?.blockedSpecialSenseSlots) || 0));
    } catch {
      /* catalog fallback below */
    }
    if (bonus <= 0) {
      bonus = catalogInvisibilityBonus(
        tid || (isPassiveInv ? 'passive-invisibility' : 'ab-invisibility'),
        rank,
      );
    }
    if (isPassiveInv && slots <= 0) {
      slots = catalogSpecialSenseSlots('passive-invisibility', rank);
    }

    baseBonus += bonus;
    if (isPassiveInv) {
      specialSenseSlots = Math.max(specialSenseSlots, slots);
      for (const s of readChosenSpecialSenses(item, slots)) {
        if (!specialBlocked.includes(s)) specialBlocked.push(s);
      }
    }
  }

  // Active Buff effects may carry mechanics without a live power item.
  const effects = actor?.effects;
  if (effects) {
    const list: any[] =
      typeof effects[Symbol.iterator] === 'function'
        ? Array.from(effects)
        : Array.isArray(effects)
          ? effects
          : [];
    for (const effect of list) {
      if (effect?.disabled) continue;
      const flags = effect?.flags?.['mastery-system'] ?? effect?.getFlag?.('mastery-system');
      if (!flags || flags.activeBuff !== true) continue;
      const tid = String(flags.powerTemplateId || '');
      const mech = flags.mechanics && typeof flags.mechanics === 'object' ? flags.mechanics : null;
      let bonus = Math.max(0, Math.floor(Number(mech?.invisibilityBonus) || 0));
      if (
        bonus <= 0 &&
        (tid === 'ab-invisibility' || /invisibility/i.test(String(flags.powerName || effect.name || '')))
      ) {
        const rank = Math.max(1, Math.min(16, Math.floor(Number(flags.powerRank || flags.rank || 1) || 1)));
        bonus = catalogInvisibilityBonus('ab-invisibility', rank);
      }
      if (bonus > 0) baseBonus += bonus;
    }
  }

  if (isInvisibilitySuppressedByHealth(actor)) {
    return {
      baseBonus: 0,
      specialSenseSlots,
      blockedSenses: [],
      active: false,
    };
  }

  const blockedSenses: CombatSenseId[] =
    baseBonus > 0
      ? (['normalCombatAwareness', 'darkvision', ...specialBlocked] as CombatSenseId[])
      : [];

  return {
    baseBonus,
    specialSenseSlots,
    blockedSenses: [...new Set(blockedSenses)],
    active: baseBonus > 0,
  };
}

/** Live Invisibility Bonus (0 when Incapacitated / suppressed). */
export function effectiveInvisibilityBonusForActor(actor: any): number {
  if (isInvisibilitySuppressedByHealth(actor)) return 0;
  const profile = resolveInvisibilityFromActor(actor);
  const st = getPerceptionCombatState(actor);
  let bonus = profile.baseBonus > 0
    ? profile.baseBonus
    : Math.max(0, Math.floor(Number(st.invisibilityBonus) || 0));
  if (bonus <= 0) return 0;
  try {
    const rs = actor.getFlag?.('mastery-system', 'roundState');
    bonus += Math.max(0, Math.floor(Number(rs?.stoneBonuses?.invisibilityBonus) || 0));
  } catch {
    /* ignore */
  }
  return bonus;
}

/**
 * Covered (Obscured) sense under Invisibility.
 * Uncovered Special Combat Senses are unaffected — callers treat them as auto-perceive.
 */
export function isSenseBlockedForActor(target: any, senseId: CombatSenseId): boolean {
  const profile = resolveInvisibilityFromActor(target);
  if (profile.blockedSenses.includes(senseId)) return true;
  const st = getPerceptionCombatState(target);
  if ((st.blockedSenses ?? []).includes(senseId)) return true;
  const inv = effectiveInvisibilityBonusForActor(target);
  return inv > 0 && (senseId === 'normalCombatAwareness' || senseId === 'darkvision');
}

/** Sync perceptionCombat base + covered senses from powers (+ visual presentation). */
export async function syncInvisibilityFromPowers(actor: any): Promise<InvisibilityProfile> {
  const profile = resolveInvisibilityFromActor(actor);
  if (!actor?.setFlag) return profile;
  const patch: Partial<PerceptionCombatState> = {
    invisibilityBonus: profile.baseBonus,
    blockedSenses: profile.blockedSenses,
  };
  await setPerceptionCombatState(actor, patch);
  try {
    const { syncInvisibilityPresentation } = await import('./invisibility-presentation.js');
    await syncInvisibilityPresentation(actor);
  } catch (err) {
    console.warn('Mastery System | invisibility presentation sync failed', err);
  }
  return profile;
}
