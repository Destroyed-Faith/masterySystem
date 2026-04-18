/**
 * Spell Schools — thematic groupings for spells (short + full display names).
 */

export interface SpellSchoolDefinition {
  name: string;
  fullName: string;
}

export const SPELL_SCHOOLS: Record<string, SpellSchoolDefinition> = {
  blackWrit: {
    name: 'Black Writ',
    fullName: 'Black Writ — School of Ink & Execution'
  },
  pactBreach: {
    name: 'Pact Breach',
    fullName: 'Pact Breach — Single-Target Wardbreaker Magic'
  },
  splitTempest: {
    name: 'Split Tempest',
    fullName: 'Split Tempest — Ranged Shock Pressure / Precision Follow-Up'
  },
  pyreCalculus: {
    name: 'Pyre Calculus',
    fullName: 'Pyre Calculus — Burn Pressure / Frontline Firecasting'
  }
  // Deprecated schools (kept for existing actor items, no longer selectable):
  // pyromancy, maleficArts, oldPact, thornWhisper, breachBreak, aegisBenedictions, boundMind
};

export function getAllSpellSchools(): SpellSchoolDefinition[] {
  return Object.values(SPELL_SCHOOLS).sort((a, b) => a.name.localeCompare(b.name));
}

export function getSpellSchool(key: string): SpellSchoolDefinition | undefined {
  return SPELL_SCHOOLS[key];
}
