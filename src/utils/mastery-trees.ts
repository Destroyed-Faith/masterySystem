/**
 * Mastery Trees — thematic groupings for powers (display name only).
 */

export interface MasteryTreeDefinition {
  name: string;
}

export const MASTERY_TREES: Record<string, MasteryTreeDefinition> = {
  crusader: { name: 'Crusader' },
  juggernaut: { name: 'Juggernaut' },
  berserkerOfTheBloodMoon: { name: 'Berserker of the Blood Moon' },
  grimHunter: { name: 'Grim Hunter' },
  wildStalker: { name: 'Wild Stalker' },
  elementalScholar: { name: 'Elemental Scholar' },
  sanctifier: { name: 'Sanctifier' },
  werewolf: { name: 'Werewolf' },
  werebear: { name: 'Werebear' },
  dragon: { name: 'Dragon' },
  ravenlord: { name: 'Ravenlord' },
  wraith: { name: 'Wraith' },
  mesmer: { name: 'Mesmer' },
  alchemist: { name: 'Alchemist' },
  battlemage: { name: 'Battlemage' },
  markedOne: { name: 'Marked One' },
  spellshaper: { name: 'Spellshaper' },
  thunderer: { name: 'Thunderer' },
  titanRunecaster: { name: 'Titan Runecaster' },
  frostmonger: { name: 'Frostmonger' },
  scourge: { name: 'Scourge' },
  curseweaver: { name: 'Curseweaver' },
  siren: { name: 'Siren' },
  crane: { name: 'Crane' },
  lotus: { name: 'Lotus' },
  catalyst: { name: 'Catalyst' },
  forgemaster: { name: 'Forgemaster' },
  witchbane: { name: 'Witchbane' }
};

export function getAllMasteryTrees(): MasteryTreeDefinition[] {
  return Object.values(MASTERY_TREES).sort((a, b) => a.name.localeCompare(b.name));
}

export function getMasteryTree(key: string): MasteryTreeDefinition | undefined {
  return MASTERY_TREES[key];
}
