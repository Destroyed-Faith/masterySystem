/**
 * Ritual System - Foundation
 * Per Player's Guide: Out-of-combat casting, Stone Sealing, TN 20 + 4/Raise
 *
 * Rituals are a special type of power used outside of combat.
 * They require sealing stones (bound for the duration) and a
 * ritual roll against TN 20 + 4 per declared raise.
 */

export interface RitualDefinition {
  name: string;
  description: string;
  stoneCost: number;
  sealDuration: string;
  tn: number;
  raises: string[];
  attribute: string;
}

export const RITUAL_BASE_TN = 20;
export const RITUAL_RAISE_TN_INCREASE = 4;

/**
 * Calculate ritual TN based on declared raises
 */
export function calculateRitualTN(declaredRaises: number): number {
  return RITUAL_BASE_TN + (declaredRaises * RITUAL_RAISE_TN_INCREASE);
}

/**
 * Core ritual definitions from the Player's Guide
 */
export const RITUALS: RitualDefinition[] = [
  {
    name: 'Ward',
    description: 'Create a protective barrier over an area. Seals the stone for the duration.',
    stoneCost: 1,
    sealDuration: '1 SHR',
    tn: RITUAL_BASE_TN,
    raises: ['+1 Raise: Extend duration', '+2 Raises: Larger area'],
    attribute: 'resolve'
  },
  {
    name: 'Scrying',
    description: 'View a distant location or person through a reflective surface.',
    stoneCost: 1,
    sealDuration: '1 scene',
    tn: RITUAL_BASE_TN,
    raises: ['+1 Raise: Clearer vision', '+2 Raises: Audio included'],
    attribute: 'intellect'
  },
  {
    name: 'Binding',
    description: 'Bind a willing or helpless entity to an object or location.',
    stoneCost: 2,
    sealDuration: 'Permanent (until broken)',
    tn: RITUAL_BASE_TN,
    raises: ['+1 Raise: Stronger binding', '+2 Raises: Hidden binding'],
    attribute: 'resolve'
  },
  {
    name: 'Cleansing',
    description: 'Remove curses, corruption, or lingering magical effects from a target.',
    stoneCost: 1,
    sealDuration: 'Instant',
    tn: RITUAL_BASE_TN,
    raises: ['+1 Raise: More thorough cleansing'],
    attribute: 'resolve'
  },
  {
    name: 'Communion',
    description: 'Communicate with spirits, ancestors, or divine entities.',
    stoneCost: 1,
    sealDuration: '1 scene',
    tn: RITUAL_BASE_TN,
    raises: ['+1 Raise: Longer conversation', '+2 Raises: More clarity'],
    attribute: 'influence'
  },
  {
    name: 'Crafting',
    description: 'Infuse an item with temporary magical properties.',
    stoneCost: 1,
    sealDuration: '1 SHR',
    tn: RITUAL_BASE_TN,
    raises: ['+1 Raise: Stronger effect', '+2 Raises: Longer duration'],
    attribute: 'intellect'
  },
  {
    name: 'Divination',
    description: 'Gain insight into future events or hidden truths.',
    stoneCost: 1,
    sealDuration: 'Instant',
    tn: RITUAL_BASE_TN,
    raises: ['+1 Raise: More specific answer'],
    attribute: 'wits'
  },
  {
    name: 'Healing',
    description: 'Heal wounds beyond normal rest. Restores one health bar level.',
    stoneCost: 2,
    sealDuration: 'Instant',
    tn: RITUAL_BASE_TN,
    raises: ['+1 Raise: Heal additional bar'],
    attribute: 'vitality'
  },
  {
    name: 'Summoning',
    description: 'Call forth a creature or entity to serve temporarily.',
    stoneCost: 2,
    sealDuration: '1 scene',
    tn: RITUAL_BASE_TN,
    raises: ['+1 Raise: Stronger summon', '+2 Raises: Longer duration'],
    attribute: 'resolve'
  },
  {
    name: 'Translocation',
    description: 'Teleport to a known location. Range and accuracy depend on raises.',
    stoneCost: 2,
    sealDuration: 'Instant',
    tn: RITUAL_BASE_TN,
    raises: ['+1 Raise: More passengers', '+2 Raises: Greater distance'],
    attribute: 'intellect'
  },
  {
    name: 'Transformation',
    description: 'Alter the physical form of yourself or a willing target.',
    stoneCost: 2,
    sealDuration: '1 SHR',
    tn: RITUAL_BASE_TN,
    raises: ['+1 Raise: More drastic change', '+2 Raises: Longer duration'],
    attribute: 'vitality'
  },
  {
    name: 'Illusion',
    description: 'Create a convincing sensory illusion.',
    stoneCost: 1,
    sealDuration: '1 scene',
    tn: RITUAL_BASE_TN,
    raises: ['+1 Raise: More senses affected', '+2 Raises: Larger area'],
    attribute: 'influence'
  }
];
