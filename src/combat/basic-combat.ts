/**
 * Basic Combat Maneuvers helpers (universal options for every combatant).
 *
 * There is no automatic Basic Attack (Actives v0.9.9.6): damage attacks come
 * from learned or granted Attack Powers.
 * Basic Reactions (Core v0.9.9.6): only Dive for Cover (AoE). There is no Basic
 * Evade or Guard; Reaction: Evade / Reaction: Armor are purchased Powers.
 * Counterattack is not a Basic Reaction; legacy Counterattack items are never offered.
 */

import { getRulesMasteryRank } from '../utils/mastery-rank-sync.js';

export function getMasteryRank(actor: any): number {
  return getRulesMasteryRank(actor);
}

/** MR × 2 — Dive for Cover distance (legacy Basic Guard used the same value). */
export function basicCombatMrTimesTwo(actor: any): number {
  return getMasteryRank(actor) * 2;
}

export const BASIC_REACTION_IDS = {
  /** @deprecated Not injected; Armor comes from Reaction: Armor. */
  guard: 'basic-reaction-guard',
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
 * @deprecated Legacy Counterattack item (old NPC configs / chat cards). Never
 * offered: reaction eligibility hides every `basicReaction: 'counterattack'`.
 */
export function buildCounterattackReactionItem(_actor: any): any {
  return {
    id: BASIC_REACTION_IDS.counterattack,
    name: 'Counterattack',
    type: 'basic-reaction',
    system: {
      powerType: 'reaction',
      templateId: 'basic-counterattack',
      description: 'Retired: there is no Basic Attack (Actives v0.9.9.6).',
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
