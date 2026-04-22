/**
 * Sanctioned DR% and Phasing Subsystems
 *
 * These six power definitions are the *only* sources the aggregator allows
 * to contribute to `mechanics.damageReductionPct` or `mechanics.phasing`.
 * They are intentionally kept out of the class/mastery tree lists until
 * tree assignment is confirmed by the GM — they exist here so they can
 * be imported, dropped into an actor as items, or referenced by audit
 * scripts and tests.
 *
 * Rule summary (see plan: new-combat-mechanics):
 *   - DR%:      Damage Reduction (passive)  +  Unyielding Shell (buff)  +  Unyielding Intercept (reaction)
 *   - Phasing:  Ghostform (passive)          +  Ghost Mantle (buff)     +  Ghost Slip (reaction)
 *
 * Buff/Reaction contributions only count when the matching Passive is
 * active — this gating lives in `src/utils/power-mechanics.ts` and is
 * enforced independently of the definitions below.
 */

import type { NewArtifactPowerData } from '../../types/item.js';

export const DAMAGE_REDUCTION_PASSIVE: NewArtifactPowerData = {
  name: 'Damage Reduction',
  category: 'passive',
  tags: [],
  rank: 1,
  cost: { action: 'none', stones: 0 },
  roll: { kind: 'none' },
  levels: {
    '1': {
      type: 'passive',
      range: { kind: 'self' },
      aoe: { shape: 'none' },
      duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
      effect: { text: 'Reduce all incoming damage by 10% (applied after Armor).' },
      specials: [],
      mechanics: {
        damageReductionPct: 10,
        applyWhen: 'passive-slotted-active',
      },
    },
    '2': {
      type: 'passive',
      range: { kind: 'self' },
      aoe: { shape: 'none' },
      duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
      effect: { text: 'Reduce all incoming damage by 20% (applied after Armor).' },
      specials: [],
      mechanics: {
        damageReductionPct: 20,
        applyWhen: 'passive-slotted-active',
      },
    },
    '3': {
      type: 'passive',
      range: { kind: 'self' },
      aoe: { shape: 'none' },
      duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
      effect: { text: 'Reduce all incoming damage by 30% (applied after Armor).' },
      specials: [],
      mechanics: {
        damageReductionPct: 30,
        applyWhen: 'passive-slotted-active',
      },
    },
    '4': {
      type: 'passive',
      range: { kind: 'self' },
      aoe: { shape: 'none' },
      duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
      effect: { text: 'Reduce all incoming damage by 40% (applied after Armor).' },
      specials: [],
      mechanics: {
        damageReductionPct: 40,
        applyWhen: 'passive-slotted-active',
      },
    },
  },
};

export const UNYIELDING_SHELL_BUFF: NewArtifactPowerData = {
  name: 'Unyielding Shell',
  category: 'activeBuff',
  tags: [],
  rank: 1,
  cost: { action: 'attack', stones: 0 },
  roll: { kind: 'none' },
  levels: {
    '1': {
      type: 'buff',
      range: { kind: 'self' },
      aoe: { shape: 'none' },
      duration: { kind: 'masteryRounds' },
      effect: {
        text: '+10% Damage Reduction while active (requires active Damage Reduction passive).',
      },
      specials: [],
      mechanics: {
        damageReductionPct: 10,
        applyWhen: 'activeBuff-active',
        duration: 'masteryRankRounds',
      },
    },
    '2': {
      type: 'buff',
      range: { kind: 'self' },
      aoe: { shape: 'none' },
      duration: { kind: 'masteryRounds' },
      effect: {
        text: '+15% Damage Reduction while active (requires active Damage Reduction passive).',
      },
      specials: [],
      mechanics: {
        damageReductionPct: 15,
        applyWhen: 'activeBuff-active',
        duration: 'masteryRankRounds',
      },
    },
    '3': {
      type: 'buff',
      range: { kind: 'self' },
      aoe: { shape: 'none' },
      duration: { kind: 'masteryRounds' },
      effect: {
        text: '+20% Damage Reduction while active (requires active Damage Reduction passive).',
      },
      specials: [],
      mechanics: {
        damageReductionPct: 20,
        applyWhen: 'activeBuff-active',
        duration: 'masteryRankRounds',
      },
    },
    '4': {
      type: 'buff',
      range: { kind: 'self' },
      aoe: { shape: 'none' },
      duration: { kind: 'masteryRounds' },
      effect: {
        text: '+25% Damage Reduction while active (requires active Damage Reduction passive).',
      },
      specials: [],
      mechanics: {
        damageReductionPct: 25,
        applyWhen: 'activeBuff-active',
        duration: 'masteryRankRounds',
      },
    },
  },
};

export const UNYIELDING_INTERCEPT_REACTION: NewArtifactPowerData = {
  name: 'Unyielding Intercept',
  category: 'reaction',
  tags: [],
  rank: 1,
  cost: { action: 'reaction', stones: 0 },
  roll: { kind: 'none' },
  trigger: 'When you or an adjacent ally is about to take damage',
  levels: {
    '1': {
      type: 'reaction',
      range: { kind: 'self' },
      aoe: { shape: 'none' },
      duration: { kind: 'instant' },
      effect: {
        text: '+10% Damage Reduction vs. triggering hit (requires active Damage Reduction passive).',
      },
      specials: [],
      mechanics: {
        damageReductionPct: 10,
        applyWhen: 'reaction-once-per-round',
        duration: 'instant',
        usageLimit: { per: 'round', max: 1 },
      },
    },
    '2': {
      type: 'reaction',
      range: { kind: 'self' },
      aoe: { shape: 'none' },
      duration: { kind: 'instant' },
      effect: {
        text: '+15% Damage Reduction vs. triggering hit (requires active Damage Reduction passive).',
      },
      specials: [],
      mechanics: {
        damageReductionPct: 15,
        applyWhen: 'reaction-once-per-round',
        duration: 'instant',
        usageLimit: { per: 'round', max: 1 },
      },
    },
    '3': {
      type: 'reaction',
      range: { kind: 'self' },
      aoe: { shape: 'none' },
      duration: { kind: 'instant' },
      effect: {
        text: '+20% Damage Reduction vs. triggering hit (requires active Damage Reduction passive).',
      },
      specials: [],
      mechanics: {
        damageReductionPct: 20,
        applyWhen: 'reaction-once-per-round',
        duration: 'instant',
        usageLimit: { per: 'round', max: 1 },
      },
    },
    '4': {
      type: 'reaction',
      range: { kind: 'self' },
      aoe: { shape: 'none' },
      duration: { kind: 'instant' },
      effect: {
        text: '+25% Damage Reduction vs. triggering hit (requires active Damage Reduction passive).',
      },
      specials: [],
      mechanics: {
        damageReductionPct: 25,
        applyWhen: 'reaction-once-per-round',
        duration: 'instant',
        usageLimit: { per: 'round', max: 1 },
      },
    },
  },
};

export const GHOSTFORM_PASSIVE: NewArtifactPowerData = {
  name: 'Ghostform',
  category: 'passive',
  tags: [],
  rank: 1,
  cost: { action: 'none', stones: 0 },
  roll: { kind: 'none' },
  levels: {
    '1': {
      type: 'passive',
      range: { kind: 'self' },
      aoe: { shape: 'none' },
      duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
      effect: { text: 'Gain 1 Phasing charge at the start of each combat.' },
      specials: [],
      mechanics: {
        phasing: { combatStart: { charges: 1 } },
        triggers: { combatStart: { phasingCharges: 1 } },
        applyWhen: 'passive-slotted-active',
      },
    },
    '2': {
      type: 'passive',
      range: { kind: 'self' },
      aoe: { shape: 'none' },
      duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
      effect: { text: 'Gain 2 Phasing charges at the start of each combat.' },
      specials: [],
      mechanics: {
        phasing: { combatStart: { charges: 2 } },
        triggers: { combatStart: { phasingCharges: 2 } },
        applyWhen: 'passive-slotted-active',
      },
    },
    '3': {
      type: 'passive',
      range: { kind: 'self' },
      aoe: { shape: 'none' },
      duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
      effect: { text: 'Gain 3 Phasing charges at the start of each combat.' },
      specials: [],
      mechanics: {
        phasing: { combatStart: { charges: 3 } },
        triggers: { combatStart: { phasingCharges: 3 } },
        applyWhen: 'passive-slotted-active',
      },
    },
    '4': {
      type: 'passive',
      range: { kind: 'self' },
      aoe: { shape: 'none' },
      duration: { kind: 'rounds', rounds: 999, note: 'permanent' },
      effect: { text: 'Gain 4 Phasing charges at the start of each combat.' },
      specials: [],
      mechanics: {
        phasing: { combatStart: { charges: 4 } },
        triggers: { combatStart: { phasingCharges: 4 } },
        applyWhen: 'passive-slotted-active',
      },
    },
  },
};

export const GHOST_MANTLE_BUFF: NewArtifactPowerData = {
  name: 'Ghost Mantle',
  category: 'activeBuff',
  tags: [],
  rank: 1,
  cost: { action: 'attack', stones: 0 },
  roll: { kind: 'none' },
  levels: {
    '1': {
      type: 'buff',
      range: { kind: 'self' },
      aoe: { shape: 'none' },
      duration: { kind: 'masteryRounds' },
      effect: { text: 'Gain +1 Phasing charge (requires active Ghostform passive).' },
      specials: [],
      mechanics: {
        phasing: { augment: { addCharges: 1 } },
        applyWhen: 'activeBuff-active',
        duration: 'masteryRankRounds',
      },
    },
    '2': {
      type: 'buff',
      range: { kind: 'self' },
      aoe: { shape: 'none' },
      duration: { kind: 'masteryRounds' },
      effect: { text: 'Gain +1 Phasing charge (requires active Ghostform passive).' },
      specials: [],
      mechanics: {
        phasing: { augment: { addCharges: 1 } },
        applyWhen: 'activeBuff-active',
        duration: 'masteryRankRounds',
      },
    },
    '3': {
      type: 'buff',
      range: { kind: 'self' },
      aoe: { shape: 'none' },
      duration: { kind: 'masteryRounds' },
      effect: { text: 'Gain +2 Phasing charges (requires active Ghostform passive).' },
      specials: [],
      mechanics: {
        phasing: { augment: { addCharges: 2 } },
        applyWhen: 'activeBuff-active',
        duration: 'masteryRankRounds',
      },
    },
    '4': {
      type: 'buff',
      range: { kind: 'self' },
      aoe: { shape: 'none' },
      duration: { kind: 'masteryRounds' },
      effect: { text: 'Gain +2 Phasing charges (requires active Ghostform passive).' },
      specials: [],
      mechanics: {
        phasing: { augment: { addCharges: 2 } },
        applyWhen: 'activeBuff-active',
        duration: 'masteryRankRounds',
      },
    },
  },
};

export const GHOST_SLIP_REACTION: NewArtifactPowerData = {
  name: 'Ghost Slip',
  category: 'reaction',
  tags: [],
  rank: 1,
  cost: { action: 'reaction', stones: 0 },
  roll: { kind: 'none' },
  trigger: 'When you are hit by an attack',
  levels: {
    '1': {
      type: 'reaction',
      range: { kind: 'self' },
      aoe: { shape: 'none' },
      duration: { kind: 'instant' },
      effect: { text: 'Gain 1 Phasing charge for exactly the triggering hit.' },
      specials: [],
      mechanics: {
        phasing: { reactionSingleHit: true },
        applyWhen: 'reaction-once-per-round',
        duration: 'instant',
        usageLimit: { per: 'round', max: 1 },
      },
    },
    '2': {
      type: 'reaction',
      range: { kind: 'self' },
      aoe: { shape: 'none' },
      duration: { kind: 'instant' },
      effect: { text: 'Gain 1 Phasing charge for exactly the triggering hit.' },
      specials: [],
      mechanics: {
        phasing: { reactionSingleHit: true },
        applyWhen: 'reaction-once-per-round',
        duration: 'instant',
        usageLimit: { per: 'round', max: 1 },
      },
    },
    '3': {
      type: 'reaction',
      range: { kind: 'self' },
      aoe: { shape: 'none' },
      duration: { kind: 'instant' },
      effect: { text: 'Gain 1 Phasing charge for exactly the triggering hit.' },
      specials: [],
      mechanics: {
        phasing: { reactionSingleHit: true },
        applyWhen: 'reaction-once-per-round',
        duration: 'instant',
        usageLimit: { per: 'round', max: 1 },
      },
    },
    '4': {
      type: 'reaction',
      range: { kind: 'self' },
      aoe: { shape: 'none' },
      duration: { kind: 'instant' },
      effect: { text: 'Gain 1 Phasing charge for exactly the triggering hit.' },
      specials: [],
      mechanics: {
        phasing: { reactionSingleHit: true },
        applyWhen: 'reaction-once-per-round',
        duration: 'instant',
        usageLimit: { per: 'round', max: 1 },
      },
    },
  },
};

/** Flat list of all six sanctioned subsystem powers. */
export const SANCTIONED_SUBSYSTEM_POWERS: NewArtifactPowerData[] = [
  DAMAGE_REDUCTION_PASSIVE,
  UNYIELDING_SHELL_BUFF,
  UNYIELDING_INTERCEPT_REACTION,
  GHOSTFORM_PASSIVE,
  GHOST_MANTLE_BUFF,
  GHOST_SLIP_REACTION,
];

/** Names that may legally declare `damageReductionPct`. */
export const SANCTIONED_DR_NAMES = [
  'Damage Reduction',
  'Unyielding Shell',
  'Unyielding Intercept',
] as const;

/** Names that may legally declare `phasing` / `triggers.combatStart.phasingCharges`. */
export const SANCTIONED_PHASING_NAMES = ['Ghostform', 'Ghost Mantle', 'Ghost Slip'] as const;
