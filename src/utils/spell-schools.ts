/**
 * Spell Schools — thematic groupings for spells (short + full display names).
 */

export interface SpellSchoolDefinition {
  name: string;
  fullName: string;
}

export const SPELL_SCHOOLS: Record<string, SpellSchoolDefinition> = {
  pyromancy: {
    name: 'Pyromancy',
    fullName: 'Pyromancy — School of Flame'
  },
  maleficArts: {
    name: 'Malefic Arts',
    fullName: 'Malefic Arts — School of Hex'
  },
  oldPact: {
    name: 'Old Pact',
    fullName: 'Old Pact — School of Forgotten Nature'
  },
  thornWhisper: {
    name: 'Thorn & Whisper',
    fullName: 'Thorn & Whisper — Enchantment & Venom'
  },
  breachBreak: {
    name: 'Breach & Break',
    fullName: 'Breach & Break — Force & Impact'
  },
  aegisBenedictions: {
    name: 'Aegis & Benedictions',
    fullName: 'Aegis & Benedictions — Aid'
  },
  boundMind: {
    name: 'School of the Bound Mind',
    fullName: 'School of the Bound Mind'
  }
};

export function getAllSpellSchools(): SpellSchoolDefinition[] {
  return Object.values(SPELL_SCHOOLS).sort((a, b) => a.name.localeCompare(b.name));
}

export function getSpellSchool(key: string): SpellSchoolDefinition | undefined {
  return SPELL_SCHOOLS[key];
}
