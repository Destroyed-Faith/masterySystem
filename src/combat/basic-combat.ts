/**
 * Basic Combat Maneuvers helpers (universal options for every combatant).
 *
 * Basic Attack damage: Weapon Damage + MR × 2d8.
 * Basic Reactions: Guard (+MR×2 Armor), Evade (+MR×2 Evade), Dive for Cover (AoE).
 * Counterattack is no longer a universal Basic Reaction (NPC config / powers only).
 */

import { getRulesMasteryRank } from '../utils/mastery-rank-sync.js';

export function getMasteryRank(actor: any): number {
  return getRulesMasteryRank(actor);
}

/** MR × 2 — used for Basic Attack bonus dice and Guard/Evade bonuses. */
export function basicCombatMrTimesTwo(actor: any): number {
  return getMasteryRank(actor) * 2;
}

/** Dice formula for the Basic Attack MR bonus pool, e.g. `"8d8"`. */
export function basicAttackMrDamageFormula(actor: any): string {
  const n = basicCombatMrTimesTwo(actor);
  return n > 0 ? `${n}d8` : '0';
}

export const BASIC_REACTION_IDS = {
  guard: 'basic-reaction-guard',
  evade: 'basic-reaction-evade',
  diveForCover: 'basic-reaction-dive-for-cover',
  /** @deprecated Not injected as a universal Basic Reaction. */
  counterattack: 'basic-reaction-counterattack',
} as const;

/** Synthetic power-like items injected into the Reaction Window. */
export function buildBasicReactionItems(actor: any): any[] {
  const mr2 = basicCombatMrTimesTwo(actor);
  const moveM = mr2;
  return [
    {
      id: BASIC_REACTION_IDS.guard,
      name: 'Guard',
      type: 'basic-reaction',
      system: {
        powerType: 'reaction',
        templateId: 'basic-guard',
        description: `Gain +${mr2} Armor (MR × 2) against the triggering attack or damage.`,
      },
      basicReaction: 'guard',
      mechanics: { armor: mr2 },
    },
    {
      id: BASIC_REACTION_IDS.evade,
      name: 'Evade',
      type: 'basic-reaction',
      system: {
        powerType: 'reaction',
        templateId: 'basic-evade',
        description: `Gain +${mr2} Evade (MR × 2) against the triggering attack.`,
      },
      basicReaction: 'evade',
      mechanics: { evade: mr2 },
    },
    {
      id: BASIC_REACTION_IDS.diveForCover,
      name: 'Dive for Cover',
      type: 'basic-reaction',
      system: {
        powerType: 'reaction',
        templateId: 'basic-dive-for-cover',
        description: `Move up to ${moveM} m (2 × MR). If you leave the AoE completely, you are not affected.`,
      },
      basicReaction: 'dive-for-cover',
      mechanics: {},
    },
  ];
}

/**
 * Counterattack item for NPC reaction config / legacy callers.
 * Not included in {@link buildBasicReactionItems}.
 */
export function buildCounterattackReactionItem(actor: any): any {
  const mr2 = basicCombatMrTimesTwo(actor);
  return {
    id: BASIC_REACTION_IDS.counterattack,
    name: 'Counterattack',
    type: 'basic-reaction',
    system: {
      powerType: 'reaction',
      templateId: 'basic-counterattack',
      description: `Make a Basic Attack (Weapon + ${mr2}d8) against the triggering creature.`,
    },
    basicReaction: 'counterattack',
    mechanics: {},
  };
}

export function isBasicReactionItem(item: any): boolean {
  return (
    item?.type === 'basic-reaction' ||
    String(item?.id ?? '').startsWith('basic-reaction-') ||
    !!item?.basicReaction
  );
}
