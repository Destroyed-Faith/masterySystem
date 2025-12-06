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
    roles: ['DPS', 'Control']
  },
  oldPact: {
    name: 'Old Pact',
    fullName: 'Old Pact — School of Forgotten Nature',
    focus: 'Nature control, heals, lightning, fear auras (Entangle, Healing Pulse, Call Lightning)',
    roles: ['Support', 'Control']
  },
  thornWhisper: {
    name: 'Thorn & Whisper',
    fullName: 'Thorn & Whisper — Enchantment & Venom',
    focus: 'Charm & Poison, cones/lines, social control (Beguiling Glance, Nightshade Cloud)',
    roles: ['Control', 'DPS']
  },
  breachBreak: {
    name: 'Breach & Break',
    fullName: 'Breach & Break — Force & Impact',
    focus: 'Force damage, Penetration, Stun/Prone, lines/cones (Arcane Pierce, Thunder Knell)',
    roles: ['DPS', 'Control']
  },
  aegisBenedictions: {
    name: 'Aegis & Benedictions',
    fullName: 'Aegis & Benedictions — Aid',
    focus: 'Team buffs, saves, flight/feather fall, attribute boosts (Aid, Bless, Beacon of Grace)',
    roles: ['Support']
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









