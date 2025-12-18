/**
 * Canonical Stone Powers Definition
 * 
 * Single authoritative source for all stone powers in the Mastery System.
 * Powers are organized by attribute, with generic powers available to all.
 */

import { 
  getRoundState,
  setRoundState,
  type AttributeKey
} from '../combat/action-economy.js';

export interface StonePower {
  id: string;
  name: string;
  attribute: AttributeKey | 'generic';
  category: 'action' | 'passive' | 'reaction';
  description: string;
  effect: string;  // Detailed effect description
  apply: (actor: Actor, combatant: Combatant) => Promise<void>;
}

/**
 * Generic Powers - Available for EVERY attribute pool
 * Cost is paid from the CURRENT attribute section pool
 */
const GENERIC_POWERS: StonePower[] = [
  {
    id: 'generic.extraAttack',
    name: 'Extra Attack',
    attribute: 'generic',
    category: 'action',
    description: 'Make 1 additional attack action this round',
    effect: 'Make 1 additional attack action this round (can be used for active Powers without the Spell tag).',
    apply: async (actor, _combatant) => {
      const combat = game.combat;
      const roundState = getRoundState(actor, combat);
      roundState.attackActions.total += 1;
      if (!roundState.stoneBonuses) {
        roundState.stoneBonuses = { extraAttacks: 0, extraReactions: 0, extraMoveMeters: 0 };
      }
      roundState.stoneBonuses.extraAttacks += 1;
      await setRoundState(actor, roundState);
    }
  },
  {
    id: 'generic.rerollAny',
    name: 'Reroll (Any)',
    attribute: 'generic',
    category: 'action',
    description: 'Reroll a failed Attack, Save, or Skill roll',
    effect: 'Reroll a failed Attack, Save, or Skill roll.',
    apply: async (actor, _combatant) => {
      // Store flag for reroll availability
      await (actor as any).setFlag('mastery-system', 'rerollAvailable', true);
      await (actor as any).setFlag('mastery-system', 'rerollType', 'any');
    }
  },
  {
    id: 'generic.movePlus8m',
    name: '+8m Move',
    attribute: 'generic',
    category: 'action',
    description: 'Gain +8m movement distance this round',
    effect: 'Gain +8m movement distance this round.',
    apply: async (actor, _combatant) => {
      const combat = game.combat;
      const roundState = getRoundState(actor, combat);
      roundState.moveBonusMeters += 8;
      if (!roundState.stoneBonuses) {
        roundState.stoneBonuses = { extraAttacks: 0, extraReactions: 0, extraMoveMeters: 0 };
      }
      roundState.stoneBonuses.extraMoveMeters += 8;
      await setRoundState(actor, roundState);
    }
  },
  {
    id: 'generic.reactionPlus1',
    name: '+1 Reaction',
    attribute: 'generic',
    category: 'reaction',
    description: 'Gain +1 Reaction this round',
    effect: 'Gain +1 Reaction this round.',
    apply: async (actor, _combatant) => {
      const combat = game.combat;
      const roundState = getRoundState(actor, combat);
      roundState.reactionActions.total += 1;
      if (!roundState.stoneBonuses) {
        roundState.stoneBonuses = { extraAttacks: 0, extraReactions: 0, extraMoveMeters: 0 };
      }
      roundState.stoneBonuses.extraReactions += 1;
      await setRoundState(actor, roundState);
    }
  }
];

/**
 * Might Powers - Paid from Might pool
 */
const MIGHT_POWERS: StonePower[] = [
  {
    id: 'might.damagePlus2d8',
    name: '+2 Damage Die',
    attribute: 'might',
    category: 'action',
    description: 'Add +2d8 damage per activation to ALL your attacks this turn',
    effect: 'Add +2d8 damage per activation to ALL your attacks this turn.',
    apply: async (actor, _combatant) => {
      const combat = game.combat;
      const roundState = getRoundState(actor, combat);
      if (!roundState.stoneBonuses) {
        roundState.stoneBonuses = { extraAttacks: 0, extraReactions: 0, extraMoveMeters: 0 };
      }
      if (!roundState.stoneBonuses.damageBonus) {
        roundState.stoneBonuses.damageBonus = 0;
      }
      roundState.stoneBonuses.damageBonus += 2;
      await setRoundState(actor, roundState);
    }
  },
  {
    id: 'might.ignoreArmor4',
    name: 'Ignore 4 Armor',
    attribute: 'might',
    category: 'action',
    description: 'Ignore 4 Armor with ALL your attacks this turn',
    effect: 'Ignore 4 Armor with ALL your attacks this turn.',
    apply: async (actor, _combatant) => {
      const combat = game.combat;
      const roundState = getRoundState(actor, combat);
      if (!roundState.stoneBonuses) {
        roundState.stoneBonuses = { extraAttacks: 0, extraReactions: 0, extraMoveMeters: 0 };
      }
      if (!roundState.stoneBonuses.armorPenetration) {
        roundState.stoneBonuses.armorPenetration = 0;
      }
      roundState.stoneBonuses.armorPenetration += 4;
      await setRoundState(actor, roundState);
    }
  },
  {
    id: 'might.enemyLoseAttack1',
    name: '-1 Attack (Enemy)',
    attribute: 'might',
    category: 'action',
    description: 'Target loses 1 Attack for this round, but can prevent with a successful Body Save',
    effect: 'Target loses 1 Attack for this round, but can prevent with a successful Body Save.',
    apply: async (_actor, combatant) => {
      // This requires target selection - store flag for later processing
      await (combatant as any).setFlag('mastery-system', 'pendingEnemyAttackReduction', 1);
    }
  },
  {
    id: 'might.removeSpecialsPhysical',
    name: 'Remove Specials',
    attribute: 'might',
    category: 'action',
    description: 'Remove from yourself or an ally within 6m one: Bleeding / Entangle / Grappled',
    effect: 'Remove from yourself or an ally within 6m one: Bleeding / Entangle / Grappled.',
    apply: async (_actor, _combatant) => {
      // Requires target selection - store flag
      await (_actor as any).setFlag('mastery-system', 'pendingRemoveSpecials', ['Bleeding', 'Entangle', 'Grappled']);
    }
  }
];

/**
 * Agility Powers - Paid from Agility pool
 */
const AGILITY_POWERS: StonePower[] = [
  {
    id: 'agility.evadePlus8',
    name: '+8 Evade per Stone',
    attribute: 'agility',
    category: 'passive',
    description: 'Gain +8 Evade per activation until your next turn',
    effect: 'Gain +8 Evade per activation until your next turn.',
    apply: async (actor, _combatant) => {
      const combat = game.combat;
      const roundState = getRoundState(actor, combat);
      if (!roundState.stoneBonuses) {
        roundState.stoneBonuses = { extraAttacks: 0, extraReactions: 0, extraMoveMeters: 0 };
      }
      if (!roundState.stoneBonuses.evadeBonus) {
        roundState.stoneBonuses.evadeBonus = 0;
      }
      roundState.stoneBonuses.evadeBonus += 8;
      await setRoundState(actor, roundState);
    }
  },
  {
    id: 'agility.extraReaction',
    name: 'Extra Reaction',
    attribute: 'agility',
    category: 'reaction',
    description: 'Gain +1 Reaction this turn',
    effect: 'Gain +1 Reaction this turn.',
    apply: async (actor, _combatant) => {
      const combat = game.combat;
      const roundState = getRoundState(actor, combat);
      roundState.reactionActions.total += 1;
      if (!roundState.stoneBonuses) {
        roundState.stoneBonuses = { extraAttacks: 0, extraReactions: 0, extraMoveMeters: 0 };
      }
      roundState.stoneBonuses.extraReactions += 1;
      await setRoundState(actor, roundState);
    }
  },
  {
    id: 'agility.critX',
    name: 'Crit (X)',
    attribute: 'agility',
    category: 'action',
    description: 'Each activation grants 1 automatic Raise used for Crit (activation number)',
    effect: 'Each activation grants 1 automatic Raise used for Crit (activation number).',
    apply: async (actor, _combatant) => {
      const combat = game.combat;
      const roundState = getRoundState(actor, combat);
      if (!roundState.stoneBonuses) {
        roundState.stoneBonuses = { extraAttacks: 0, extraReactions: 0, extraMoveMeters: 0 };
      }
      if (!roundState.stoneBonuses.critRaises) {
        roundState.stoneBonuses.critRaises = 0;
      }
      roundState.stoneBonuses.critRaises += 1;
      await setRoundState(actor, roundState);
    }
  },
  {
    id: 'agility.removeSpecialsElemental',
    name: 'Remove Specials',
    attribute: 'agility',
    category: 'action',
    description: 'Remove from yourself or an ally within 6m one: Ignite / Freeze / Shock',
    effect: 'Remove from yourself or an ally within 6m one: Ignite / Freeze / Shock.',
    apply: async (_actor, _combatant) => {
      await (_actor as any).setFlag('mastery-system', 'pendingRemoveSpecials', ['Ignite', 'Freeze', 'Shock']);
    }
  }
];

/**
 * Vitality Powers - Paid from Vitality pool
 */
const VITALITY_POWERS: StonePower[] = [
  {
    id: 'vitality.secondChance',
    name: 'Second Chance',
    attribute: 'vitality',
    category: 'passive',
    description: 'When you would drop to Incapacitated, you may spend points (if any left) and instead remain at 1 free box in Wounded',
    effect: 'When you would drop to Incapacitated, you may spend points (if any left) and instead remain at 1 free box in Wounded.',
    apply: async (actor, _combatant) => {
      await (actor as any).setFlag('mastery-system', 'secondChanceActive', true);
    }
  },
  {
    id: 'vitality.heal2d8',
    name: 'Heal 2d8',
    attribute: 'vitality',
    category: 'action',
    description: 'Recover 2d8 HP per activation',
    effect: 'Recover 2d8 HP per activation.',
    apply: async (actor, _combatant) => {
      const healAmount = await new Roll('2d8').evaluate({ async: true });
      const total = healAmount.total || 0;
      await (actor as any).heal(total);
      ui.notifications?.info(`${(actor as any).name} healed ${total} HP`);
    }
  },
  {
    id: 'vitality.armorPlus4',
    name: '4+ Armor',
    attribute: 'vitality',
    category: 'passive',
    description: 'Gain temporary Armor until next turn',
    effect: 'Gain temporary Armor until next turn.',
    apply: async (actor, _combatant) => {
      const combat = game.combat;
      const roundState = getRoundState(actor, combat);
      if (!roundState.stoneBonuses) {
        roundState.stoneBonuses = { extraAttacks: 0, extraReactions: 0, extraMoveMeters: 0 };
      }
      if (!roundState.stoneBonuses.tempArmor) {
        roundState.stoneBonuses.tempArmor = 0;
      }
      roundState.stoneBonuses.tempArmor += 4;
      await setRoundState(actor, roundState);
    }
  },
  {
    id: 'vitality.removeSpecialsControl',
    name: 'Remove Specials',
    attribute: 'vitality',
    category: 'action',
    description: 'Remove from yourself or an ally within 6m one: Stunned / Disoriented / Prone',
    effect: 'Remove from yourself or an ally within 6m one: Stunned / Disoriented / Prone.',
    apply: async (_actor, _combatant) => {
      await (_actor as any).setFlag('mastery-system', 'pendingRemoveSpecials', ['Stunned', 'Disoriented', 'Prone']);
    }
  }
];

/**
 * Intellect Powers - Paid from Intellect pool
 */
const INTELLECT_POWERS: StonePower[] = [
  {
    id: 'intellect.freeRaisesPlus2',
    name: '+2 Free Raises per Stone',
    attribute: 'intellect',
    category: 'action',
    description: 'Add +2 Raises per activation to your next Spell or Skill',
    effect: 'Add +2 Raises per activation to your next Spell or Skill.',
    apply: async (actor, _combatant) => {
      const combat = game.combat;
      const roundState = getRoundState(actor, combat);
      if (!roundState.stoneBonuses) {
        roundState.stoneBonuses = { extraAttacks: 0, extraReactions: 0, extraMoveMeters: 0 };
      }
      if (!roundState.stoneBonuses.freeRaises) {
        roundState.stoneBonuses.freeRaises = 0;
      }
      roundState.stoneBonuses.freeRaises += 2;
      await setRoundState(actor, roundState);
    }
  },
  {
    id: 'intellect.extraSpell',
    name: 'Extra Spell',
    attribute: 'intellect',
    category: 'action',
    description: 'Gain +1 Attack action this round, but it must have the tag: Spell',
    effect: 'Gain +1 Attack action this round, but it must have the tag: Spell.',
    apply: async (actor, _combatant) => {
      const combat = game.combat;
      const roundState = getRoundState(actor, combat);
      roundState.attackActions.total += 1;
      if (!roundState.stoneBonuses) {
        roundState.stoneBonuses = { extraAttacks: 0, extraReactions: 0, extraMoveMeters: 0 };
      }
      roundState.stoneBonuses.extraAttacks += 1;
      await setRoundState(actor, roundState);
      await (_combatant as any).setFlag('mastery-system', 'extraSpellAction', true);
    }
  },
  {
    id: 'intellect.keepPlus1Saves',
    name: '+1 Keep (Saves)',
    attribute: 'intellect',
    category: 'passive',
    description: 'Gain +1 Keep on Mind & Spirit saves this round',
    effect: 'Gain +1 Keep on Mind & Spirit saves this round.',
    apply: async (actor, _combatant) => {
      const combat = game.combat;
      const roundState = getRoundState(actor, combat);
      if (!roundState.stoneBonuses) {
        roundState.stoneBonuses = { extraAttacks: 0, extraReactions: 0, extraMoveMeters: 0 };
      }
      if (!roundState.stoneBonuses.saveKeepBonus) {
        roundState.stoneBonuses.saveKeepBonus = 0;
      }
      roundState.stoneBonuses.saveKeepBonus += 1;
      await setRoundState(actor, roundState);
    }
  },
  {
    id: 'intellect.removeSpecialsMental',
    name: 'Remove Specials',
    attribute: 'intellect',
    category: 'action',
    description: 'Remove from yourself or an ally within 6m one: Torment / Mark / Bleed',
    effect: 'Remove from yourself or an ally within 6m one: Torment / Mark / Bleed.',
    apply: async (_actor, _combatant) => {
      await (_actor as any).setFlag('mastery-system', 'pendingRemoveSpecials', ['Torment', 'Mark', 'Bleed']);
    }
  }
];

/**
 * Resolve Powers - Paid from Resolve pool
 */
const RESOLVE_POWERS: StonePower[] = [
  {
    id: 'resolve.rerollMindSave',
    name: 'Reroll (Mind Save)',
    attribute: 'resolve',
    category: 'reaction',
    description: 'Reroll 1 failed Mind or Spirit Save',
    effect: 'Reroll 1 failed Mind or Spirit Save.',
    apply: async (actor, _combatant) => {
      await (actor as any).setFlag('mastery-system', 'rerollAvailable', true);
      await (actor as any).setFlag('mastery-system', 'rerollType', 'mindSpirit');
    }
  },
  {
    id: 'resolve.poolDieSpell',
    name: '+1 Pool Die (Spell)',
    attribute: 'resolve',
    category: 'action',
    description: 'Add +1d8 per activation to next Spell or Skill roll; every 2 activations you also get +1 die to keep',
    effect: 'Add +1d8 per activation to next Spell or Skill roll; every 2 activations you also get +1 die to keep.',
    apply: async (actor, _combatant) => {
      const combat = game.combat;
      const roundState = getRoundState(actor, combat);
      if (!roundState.stoneBonuses) {
        roundState.stoneBonuses = { extraAttacks: 0, extraReactions: 0, extraMoveMeters: 0 };
      }
      if (!roundState.stoneBonuses.spellPoolDice) {
        roundState.stoneBonuses.spellPoolDice = 0;
      }
      if (!roundState.stoneBonuses.spellKeepDice) {
        roundState.stoneBonuses.spellKeepDice = 0;
      }
      roundState.stoneBonuses.spellPoolDice += 1;
      // Every 2 activations = +1 keep
      const activations = Math.floor((roundState.stoneBonuses.spellPoolDice || 0) / 2);
      roundState.stoneBonuses.spellKeepDice = activations;
      await setRoundState(actor, roundState);
    }
  },
  {
    id: 'resolve.stressImmunity',
    name: 'Stress Immunity',
    attribute: 'resolve',
    category: 'passive',
    description: 'Gain Stress Immunity for the rest of the turn',
    effect: 'Gain Stress Immunity for the rest of the turn.',
    apply: async (actor, _combatant) => {
      await (actor as any).setFlag('mastery-system', 'stressImmunity', true);
    }
  },
  {
    id: 'resolve.removeSpecialsSoul',
    name: 'Remove Specials',
    attribute: 'resolve',
    category: 'action',
    description: 'Remove from yourself or an ally within 6m one: Soulburn / Curse / Hex',
    effect: 'Remove from yourself or an ally within 6m one: Soulburn / Curse / Hex.',
    apply: async (_actor, _combatant) => {
      await (_actor as any).setFlag('mastery-system', 'pendingRemoveSpecials', ['Soulburn', 'Curse', 'Hex']);
    }
  }
];

/**
 * Influence Powers - Paid from Influence pool
 */
const INFLUENCE_POWERS: StonePower[] = [
  {
    id: 'influence.allyPlus1Pool',
    name: 'Ally +1 Pool',
    attribute: 'influence',
    category: 'action',
    description: 'Each activation gives +1d8 pool dice to you or an ally within 8m for the next roll; every second activation also grants +1 die to keep',
    effect: 'Each activation gives +1d8 pool dice to you or an ally within 8m for the next roll; every second activation also grants +1 die to keep.',
    apply: async (_actor, _combatant) => {
      await (_actor as any).setFlag('mastery-system', 'pendingAllyPoolBonus', { poolDice: 1, keepDice: 0 });
    }
  },
  {
    id: 'influence.fear',
    name: 'Fear',
    attribute: 'influence',
    category: 'action',
    description: 'Enemies within 5m must make a Spirit Save or cannot attack you this round',
    effect: 'Enemies within 5m must make a Spirit Save or cannot attack you this round.',
    apply: async (_actor, _combatant) => {
      await (_actor as any).setFlag('mastery-system', 'pendingFear', { range: 5 });
    }
  },
  {
    id: 'influence.rally',
    name: 'Rally',
    attribute: 'influence',
    category: 'action',
    description: 'All allies within 5m heal 2d8 HP and 2d8 Stress, up to their current Health/Stress Bar',
    effect: 'All allies within 5m heal 2d8 HP and 2d8 Stress, up to their current Health/Stress Bar.',
    apply: async (_actor, _combatant) => {
      await (_actor as any).setFlag('mastery-system', 'pendingRally', { range: 5, hpHeal: '2d8', stressHeal: '2d8' });
    }
  },
  {
    id: 'influence.removeSpecialsSocial',
    name: 'Remove Specials',
    attribute: 'influence',
    category: 'action',
    description: 'Remove from yourself or an ally within 6m one: Frightened / Charmed / Disorient',
    effect: 'Remove from yourself or an ally within 6m one: Frightened / Charmed / Disorient.',
    apply: async (_actor, _combatant) => {
      await (_actor as any).setFlag('mastery-system', 'pendingRemoveSpecials', ['Frightened', 'Charmed', 'Disorient']);
    }
  }
];

/**
 * Combined registry of all stone powers
 * Organized by attribute for easy lookup
 */
export const STONE_POWERS: Record<string, StonePower> = {};

// Add all powers to registry
[...GENERIC_POWERS, ...MIGHT_POWERS, ...AGILITY_POWERS, ...VITALITY_POWERS, ...INTELLECT_POWERS, ...RESOLVE_POWERS, ...INFLUENCE_POWERS].forEach(power => {
  STONE_POWERS[power.id] = power;
});

/**
 * Organized by attribute for UI display
 */
export const STONE_POWERS_BY_ATTRIBUTE: Record<AttributeKey | 'generic', StonePower[]> = {
  generic: GENERIC_POWERS,
  might: MIGHT_POWERS,
  agility: AGILITY_POWERS,
  vitality: VITALITY_POWERS,
  intellect: INTELLECT_POWERS,
  resolve: RESOLVE_POWERS,
  influence: INFLUENCE_POWERS
};
