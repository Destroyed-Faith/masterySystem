/**
 * Mastery Trees — thematic groupings for powers (display name only).
 */

export interface MasteryTreeDefinition {
  name: string;
}

export const MASTERY_TREES: Record<string, MasteryTreeDefinition> = {
  dreadstalker: { name: 'Dreadstalker' },
  doomscribe: { name: 'Doomscribe' },
  hexboundHarrier: { name: 'Hexbound Harrier' },
  voidTestament: { name: 'Void Testament' },
  galeBreaker: { name: 'Gale Breaker' },
  stormVeil: { name: 'Storm Veil' },
  ashguard: { name: 'Ashguard' },
  infernalBastion: { name: 'Infernal Bastion' },
  wardenDragon: { name: 'Warden Dragon' },
  raptorDragon: { name: 'Raptor Dragon' },
  dreadwyrm: { name: 'Dreadwyrm' },
  skyTyrant: { name: 'Sky Tyrant' }
  // Deprecated trees (kept for existing actor items, no longer selectable):
  // crusader, juggernaut, berserkerOfTheBloodMoon, grimHunter, wildStalker,
  // elementalScholar, sanctifier, werewolf, werebear, dragon, ravenlord,
  // wraith, mesmer, alchemist, battlemage, markedOne, spellshaper, thunderer,
  // titanRunecaster, frostmonger, scourge, curseweaver, siren, crane, lotus,
  // catalyst, forgemaster, witchbane
};

export function getAllMasteryTrees(): MasteryTreeDefinition[] {
  return Object.values(MASTERY_TREES).sort((a, b) => a.name.localeCompare(b.name));
}

export function getMasteryTree(key: string): MasteryTreeDefinition | undefined {
  return MASTERY_TREES[key];
}
