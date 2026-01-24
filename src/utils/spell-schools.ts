/**
 * Spell Schools (Mastery Spell Trees) configuration for Mastery System
 */

export interface SpellSchoolDefinition {
  name: string;
  fullName: string;
  focus: string;
  roles: string[];
  bonus?: string;
  requirements?: string;
}

export const SPELL_SCHOOLS: Record<string, SpellSchoolDefinition> = {
  pyromancy: {
    name: 'Pyromancy',
    fullName: 'Pyromancy — School of Flame',
    focus: 'Fire nukes, Ignite stacks, cones/lines, speed buffs (Blazing Speed, Firewall)',
    roles: ['DPS', 'Control'],
    bonus: 'When you deal Fire damage, add +2 to one damage die rolled OR increase Ignite stacks by +1.'
  },
  maleficArts: {
    name: 'Malefic Arts',
    fullName: 'Malefic Arts — School of Hex',
    focus: 'Hex/Marks, soul drain, darkness, mind-pressure (Eldritch Bolt, Soul Drain, Void Maw)',
    roles: ['DPS', 'Control'],
    bonus: 'Whenever you deal damage to a Hexed target, you may reroll 1 damage die.'
  },
  oldPact: {
    name: 'Old Pact',
    fullName: 'Old Pact — School of Forgotten Nature',
    focus: 'Nature control, heals, lightning, fear auras (Entangle, Healing Pulse, Call Lightning)',
    roles: ['Support', 'Control'],
    bonus: 'Whenever you cast an Old Pact spell, allies within 4m heal 1d8 HP.'
  },
  thornWhisper: {
    name: 'Thorn & Whisper',
    fullName: 'Thorn & Whisper — Enchantment & Venom',
    focus: 'Charm & Poison, cones/lines, social control (Beguiling Glance, Nightshade Cloud)',
    roles: ['Control', 'DPS'],
    requirements: 'Resolve 3+ or Influence 3+, Mind Save +2',
    bonus: 'When you deal damage to a Poisoned target, you may reroll 1 damage d8 (once per attack).'
  },
  breachBreak: {
    name: 'Breach & Break',
    fullName: 'Breach & Break — Force & Impact',
    focus: 'Force damage, Penetration, Stun/Prone, lines/cones (Arcane Pierce, Thunder Knell)',
    roles: ['DPS', 'Control'],
    requirements: 'Might 3+ or Intellect 3+, Combat Reflexes 2+',
    bonus: 'When you inflict Prone or Stunned, your next Penetration spell this round gains Penetration(+1) (max +2).'
  },
  aegisBenedictions: {
    name: 'Aegis & Benedictions',
    fullName: 'Aegis & Benedictions — Aid',
    focus: 'Team buffs, saves, flight/feather fall, attribute boosts (Aid, Bless, Beacon of Grace)',
    roles: ['Support'],
    requirements: 'Resolve 3+ or Influence 3+, Devotion 2+',
    bonus: 'Whenever you cast a Utility spell that targets an ally, that ally heals 1d8 HP (once per spell cast).'
  },
  boundMind: {
    name: 'School of the Bound Mind',
    fullName: 'School of the Bound Mind',
    focus: 'Mind control, illusion, telekinesis, telepathy (Telekinetic Manipulation, Telepathic Link, Veil of Invisibility)',
    roles: ['Control', 'Support'],
    bonus: 'Whenever you cast a Mind or Illusion spell, you may either add +2 to the target\'s Save DC or extend its duration by +1 round.'
  }
};

/**
 * Get all spell schools
 */
export function getAllSpellSchools(): SpellSchoolDefinition[] {
  return Object.values(SPELL_SCHOOLS).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get spell school by key
 */
export function getSpellSchool(key: string): SpellSchoolDefinition | undefined {
  return SPELL_SCHOOLS[key];
}









