/**
 * Spell Schools Index
 * Exports all spells from active spell schools.
 *
 * Deprecated schools are kept on disk for backward compatibility with existing
 * actor items, but are no longer exported or aggregated here so they cannot
 * appear in the Power Picker / search.
 */

export * from './types.js';
export * from './black-writ.js';
export * from './pact-breach.js';
export * from './split-tempest.js';
export * from './pyre-calculus.js';

// Deprecated — intentionally not re-exported / not aggregated:
// export * from './pyromancy.js';
// export * from './malefic-arts.js';
// export * from './old-pact.js';
// export * from './thorn-whisper.js';
// export * from './breach-break.js';
// export * from './aegis-benedictions.js';
// export * from './bound-mind.js';

import type { SpellDefinition } from './types.js';
import { BLACK_WRIT_SPELLS } from './black-writ.js';
import { PACT_BREACH_SPELLS } from './pact-breach.js';
import { SPLIT_TEMPEST_SPELLS } from './split-tempest.js';
import { PYRE_CALCULUS_SPELLS } from './pyre-calculus.js';

// Deprecated — kept for existing actor items, no longer selectable in the Power Picker:
// import { PYROMANCY_SPELLS } from './pyromancy.js';
// import { MALEFIC_ARTS_SPELLS } from './malefic-arts.js';
// import { OLD_PACT_SPELLS } from './old-pact.js';
// import { THORN_WHISPER_SPELLS } from './thorn-whisper.js';
// import { BREACH_BREAK_SPELLS } from './breach-break.js';
// import { AEGIS_BENEDICTIONS_SPELLS } from './aegis-benedictions.js';
// import { BOUND_MIND_SPELLS } from './bound-mind.js';

/**
 * All active spells grouped by school (deprecated schools excluded).
 */
export const ALL_SPELLS: Record<string, SpellDefinition[]> = {
  blackWrit: BLACK_WRIT_SPELLS,
  pactBreach: PACT_BREACH_SPELLS,
  splitTempest: SPLIT_TEMPEST_SPELLS,
  pyreCalculus: PYRE_CALCULUS_SPELLS
};

/**
 * Get all spells from all active schools.
 */
export function getAllSpells(): SpellDefinition[] {
  return Object.values(ALL_SPELLS).flat();
}

/**
 * Get spells by school key (active schools only).
 */
export function getSpellsBySchool(schoolKey: string): SpellDefinition[] {
  return ALL_SPELLS[schoolKey] || [];
}

/**
 * Get spell by name (searches all active schools).
 */
export function getSpellByName(name: string): SpellDefinition | undefined {
  return getAllSpells().find(spell => spell.name === name);
}
