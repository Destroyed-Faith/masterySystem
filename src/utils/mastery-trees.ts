/**
 * Mastery Trees configuration for Mastery System
 */

export interface MasteryTreeDefinition {
  name: string;
  focus: string;
  roles: string[];
  requirements?: string;
  bonus?: string;
}

export const MASTERY_TREES: Record<string, MasteryTreeDefinition> = {
  crusader: {
    name: 'Crusader',
    focus: 'Frontline warrior, Litany & Judgment synergy, resilient through Armor of Belief',
    roles: ['Tank', 'DPS', 'Support'],
    requirements: 'Melee Weapon required',
    bonus: 'When you use a power from this tree while wearing Heavy Armor, gain +2 Armor per Mastery Rank until the start of your next turn.'
  },
  juggernaut: {
    name: 'Juggernaut',
    focus: 'Unstoppable charges, CC immunity, scales with armor',
    roles: ['Tank', 'DPS']
  },
  berserkerOfTheBloodMoon: {
    name: 'Berserker of the Blood Moon',
    focus: 'Berserker, thrives on Bleed, heals when wounded',
    roles: ['DPS']
  },
  grimHunter: {
    name: 'Grim Hunter',
    focus: 'Cunning rogue who thrives on mobility and precision',
    roles: ['DPS']
  },
  wildStalker: {
    name: 'Wild Stalker',
    focus: 'Hunter/assassin, empowered by Marks & Curses, concealment & initiative tricks',
    roles: ['DPS', 'Control']
  },
  elementalScholar: {
    name: 'Elemental Scholar',
    focus: 'Elemental synergies (Ignite/Freeze/Shock/Corrode), free casts',
    roles: ['DPS', 'Control']
  },
  sanctifier: {
    name: 'Sanctifier',
    focus: 'Holy warrior devoted to light and purity',
    roles: ['Support', 'Tank']
  },
  werewolf: {
    name: 'Werewolf',
    focus: 'Shapeshifter, fast Claw/Bite attacks, Bleed and tracking',
    roles: ['DPS', 'Control']
  },
  werebear: {
    name: 'Werebear',
    focus: 'Shapeshifter, cone slams, healing roar, regeneration',
    roles: ['Tank', 'Support']
  },
  dragon: {
    name: 'Dragon',
    focus: 'Claws, Tail, Breath, Wingbeat, fear aura, draconic scales',
    roles: ['Tank', 'DPS', 'Control']
  },
  ravenlord: {
    name: 'Ravenlord',
    focus: 'Shadow caster, crows, curses, pact healing',
    roles: ['Control', 'Support']
  },
  wraith: {
    name: 'Wraith',
    focus: 'Ghostly hybrid, Wraith Form (desolid), frost & fear debuffs',
    roles: ['Control', 'Tank']
  },
  mesmer: {
    name: 'Mesmer',
    focus: 'Manipulator of perception and thought, weaving illusions, charms, and psychic intrusions',
    roles: ['Control', 'Support']
  },
  alchemist: {
    name: 'Alchemist',
    focus: 'Bombs, toxins, armor-melt effects',
    roles: ['DPS', 'Control']
  },
  battlemage: {
    name: 'Battlemage',
    focus: 'Armored spellcaster who blends martial prowess with arcane power, striking with steel and sorcery alike',
    roles: ['DPS', 'Control', 'Tank']
  },
  markedOne: {
    name: 'Marked One',
    focus: 'Pact-bound caster who brands enemies with dark marks and channels curses for devastating effects',
    roles: ['DPS', 'Control']
  },
  spellshaper: {
    name: 'Spellshaper',
    focus: 'Adaptive arcanist who reshapes spells in combat, altering power, range, and duration on the fly',
    roles: ['DPS', 'Control']
  },
  titanRunecaster: {
    name: 'Titan Runecaster',
    focus: 'Rune-etched giant who channels primordial symbols for resilience, elemental buffs, and protective magic',
    roles: ['Tank', 'Support']
  },
  frostmonger: {
    name: 'Frostmonger',
    focus: 'Master of winter\'s chill, slowing foes, shattering defenses, and locking down the battlefield',
    roles: ['Control']
  },
  scourge: {
    name: 'Scourge',
    focus: 'Fanatic who sacrifices their own vitality to unleash radiant punishment and healing light for allies',
    roles: ['Support', 'DPS']
  },
  curseweaver: {
    name: 'Curseweaver',
    focus: 'Witch who spreads debilitating curses and marks, weakening foes and empowering allies',
    roles: ['Control', 'Support']
  },
  siren: {
    name: 'Siren',
    focus: 'Enchanting bardic caster who manipulates emotions, charms foes, and grants allies rerolls and evasive grace',
    roles: ['Control', 'Support']
  },
  crane: {
    name: 'Crane',
    focus: 'Unarmed martial artist mastering grace and precision; balances Might and Agility to redirect force and strike flawlessly',
    roles: ['DPS', 'Tank']
  },
  lotus: {
    name: 'Lotus',
    focus: 'Martial monk mastering the harmony of body, mind, and spirit; channels inner Ki for balance and resilience',
    roles: ['DPS', 'Support']
  },
  catalyst: {
    name: 'Catalyst',
    focus: 'Alchemical warrior using serums, toxins, and mutagens to enhance body and mind; adapts through transformation',
    roles: ['DPS', 'Support']
  },
  forgemaster: {
    name: 'Forgemaster',
    focus: 'Armored craftsman binding soul and steel; channels elemental energy through forged constructs and armor',
    roles: ['Tank', 'Support', 'DPS']
  },
  witchbane: {
    name: 'Witchbane',
    focus: 'Anti-mage hunter who silences and reflects magic; manipulates null-fields and dispels hostile spells',
    roles: ['Control', 'Support']
  }
};

/**
 * Get all mastery trees
 */
export function getAllMasteryTrees(): MasteryTreeDefinition[] {
  return Object.values(MASTERY_TREES).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get mastery tree by key
 */
export function getMasteryTree(key: string): MasteryTreeDefinition | undefined {
  return MASTERY_TREES[key];
}

