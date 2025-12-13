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
    roles: ['Tank', 'DPS'],
    bonus: 'When you move ≥ 4 m before making an attack, gain +2 Armor per Mastery Rank until the start of your next turn.'
  },
  berserkerOfTheBloodMoon: {
    name: 'Berserker of the Blood Moon',
    focus: 'Berserker, thrives on Bleed, heals when wounded',
    roles: ['DPS'],
    bonus: 'At the start of your turn, if you are Bleeding, heal (your Mastery Rank)d8 HP.'
  },
  grimHunter: {
    name: 'Grim Hunter',
    focus: 'Cunning rogue who thrives on mobility and precision',
    roles: ['DPS'],
    bonus: 'At the end of each round, if you have one or more Marked enemies, gain +2 Initiative per Marked enemy (max +2 × your Mastery Rank) until the start of your next turn.'
  },
  wildStalker: {
    name: 'Wild Stalker',
    focus: 'Hunter/assassin, empowered by Marks & Curses, concealment & initiative tricks',
    roles: ['DPS', 'Control'],
    bonus: 'While Hidden in natural terrain (forest, grassland, fields), gain +2 Stealth and +2 Concealment.'
  },
  elementalScholar: {
    name: 'Elemental Scholar',
    focus: 'Elemental synergies (Ignite/Freeze/Shock/Corrode), free casts',
    roles: ['DPS', 'Control'],
    bonus: 'Whenever you cast a Spell with a unique elemental Special (Ignite, Freeze, Shock, Corrode, etc.), you gain +1 Keep on your next Spell Roll this round.'
  },
  sanctifier: {
    name: 'Sanctifier',
    focus: 'Holy warrior devoted to light and purity',
    roles: ['Support', 'Tank'],
    bonus: 'Whenever you cast a Litany, gain +2 Armor until the start of your next turn.'
  },
  werewolf: {
    name: 'Werewolf',
    focus: 'Shapeshifter, fast Claw/Bite attacks, Bleed and tracking',
    roles: ['DPS', 'Control'],
    bonus: '**Passive (Shapechange):** When you invest your first point in this tree, you may **change into Werewolf form** as a full Turn. While changed, gain **+4 Evade** and **+6 Movement**. You cannot use weapons, armor, or shields (except natural armor from this tree). All attacks from this tree require wolf form. Reverting to humanoid form costs a full Turn. Claws and Bite count as melee weapons that deal **1d8 base damage** and have **Penetration (1)**.'
  },
  werebear: {
    name: 'Werebear',
    focus: 'Shapeshifter, cone slams, healing roar, regeneration',
    roles: ['Tank', 'Support'],
    bonus: '**Passive (Shapechange):** When you invest your first point in this tree, you may **change into Werebear form** as a full Turn. While changed, gain **Advantage on Body Saves** and an additional **–1 Health Track**. Your **Initiative Bonus** is halved (rounded up). You cannot use weapons, armor, or shields (except natural armor from this tree). All attacks from this tree require bear form. End the form as a full Turn. **Paws** count as Melee weapons with **2d8 base damage**.'
  },
  dragon: {
    name: 'Dragon',
    focus: 'Claws, Tail, Breath, Wingbeat, fear aura, draconic scales',
    roles: ['Tank', 'DPS', 'Control']
    // No tree bonus listed
  },
  ravenlord: {
    name: 'Ravenlord',
    focus: 'Shadow caster, crows, curses, pact healing',
    roles: ['Control', 'Support'],
    bonus: 'You gain +1 Free Raise on all Spells you cast.'
  },
  wraith: {
    name: 'Wraith',
    focus: 'Ghostly hybrid, Wraith Form (desolid), frost & fear debuffs',
    roles: ['Control', 'Tank'],
    bonus: 'Once per day, you may enter Wraith Form without spending an action on the level you have bought.'
  },
  mesmer: {
    name: 'Mesmer',
    focus: 'Manipulator of perception and thought, weaving illusions, charms, and psychic intrusions',
    roles: ['Control', 'Support'],
    bonus: 'Whenever you inflict Charmed, Disoriented, or Frightened, gain Precision(1) on your next attack this round (once per target per round).'
  },
  alchemist: {
    name: 'Alchemist',
    focus: 'Bombs, toxins, armor-melt effects',
    roles: ['DPS', 'Control'],
    bonus: 'When you use a Power from this list, add +2 to any Healing or Damage-over-Time roll this round.'
  },
  battlemage: {
    name: 'Battlemage',
    focus: 'Armored spellcaster who blends martial prowess with arcane power, striking with steel and sorcery alike',
    roles: ['DPS', 'Control', 'Tank'],
    bonus: 'Whenever you cast a Spells with the Ignite Special, gain +1 Armor and Regeneration(1) until the start of your next turn.'
  },
  markedOne: {
    name: 'Marked One',
    focus: 'Pact-bound caster who brands enemies with dark marks and channels curses for devastating effects',
    roles: ['DPS', 'Control'],
    bonus: 'Whenever you apply or increase Hex on a target, you gain +1 Damage Die against that target until the end of your turn (1/target/round).'
  },
  spellshaper: {
    name: 'Spellshaper',
    focus: 'Adaptive arcanist who reshapes spells in combat, altering power, range, and duration on the fly',
    roles: ['DPS', 'Control'],
    bonus: 'At the start of your turn, you may replace one active Spellcrafting Passive with another you know.'
  },
  titanRunecaster: {
    name: 'Titan Runecaster',
    focus: 'Rune-etched giant who channels primordial symbols for resilience, elemental buffs, and protective magic',
    roles: ['Tank', 'Support']
    // Missing in text
  },
  frostmonger: {
    name: 'Frostmonger',
    focus: 'Master of winter\'s chill, slowing foes, shattering defenses, and locking down the battlefield',
    roles: ['Control'],
    bonus: 'Enemies suffer –1 Body Save Die vs. your Freeze effects.'
  },
  scourge: {
    name: 'Scourge',
    focus: 'Fanatic who sacrifices their own vitality to unleash radiant punishment and healing light for allies',
    roles: ['Support', 'DPS'],
    bonus: 'Whenever you take damage from your own Scourge abilities, you heal 1d8 HP.'
  },
  curseweaver: {
    name: 'Curseweaver',
    focus: 'Witch who spreads debilitating curses and marks, weakening foes and empowering allies',
    roles: ['Control', 'Support'],
    bonus: 'Whenever you inflict a new Curse on an enemy, gain +2 Concealment (this bonus stacks and resets when you move).'
  },
  siren: {
    name: 'Siren',
    focus: 'Enchanting bardic caster who manipulates emotions, charms foes, and grants allies rerolls and evasive grace',
    roles: ['Control', 'Support'],
    bonus: 'When an enemy becomes Charmed by your abilities, you gain +2 Concealment until you move (stacks).'
  },
  crane: {
    name: 'Crane',
    focus: 'Unarmed martial artist mastering grace and precision; balances Might and Agility to redirect force and strike flawlessly',
    roles: ['DPS', 'Tank'],
    bonus: 'While unarmed, your strikes count as a weapon dealing 1d8 base damage and gain Finesse and Find Weakness.'
  },
  lotus: {
    name: 'Lotus',
    focus: 'Martial monk mastering the harmony of body, mind, and spirit; channels inner Ki for balance and resilience',
    roles: ['DPS', 'Support'],
    bonus: 'When you cast a spell that uses Resolve or Intelligence, you gain +2 Free Raises on that roll if you are unarmed and unarmored.'
  },
  catalyst: {
    name: 'Catalyst',
    focus: 'Alchemical warrior using serums, toxins, and mutagens to enhance body and mind; adapts through transformation',
    roles: ['DPS', 'Support'],
    bonus: 'At the start of combat, choose one Body State (no Action required): Stabilized: Gain +1d8 on all Saves vs. Poison & Disease. Volatile: Gain +1d8 Damage on your first successful attack each round. Adaptive: Gain +1 Armor and +1 Evade during the first round of combat. Whenever you activate a Catalyst Power (Active Buff), gain +1 temporary Raise on your next roll that round (expires if unused).'
  },
  forgemaster: {
    name: 'Forgemaster',
    focus: 'Armored craftsman binding soul and steel; channels elemental energy through forged constructs and armor',
    roles: ['Tank', 'Support', 'DPS'],
    bonus: 'When you activate a Forgemaster Charged Ability, gain +4 Armor and Regeneration(2) until the start of your next turn.'
  },
  witchbane: {
    name: 'Witchbane',
    focus: 'Anti-mage hunter who silences and reflects magic; manipulates null-fields and dispels hostile spells',
    roles: ['Control', 'Support'],
    bonus: 'TBD (suggested: immunity to minor magical interference or advantage on saves vs. magic once per scene).'
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









