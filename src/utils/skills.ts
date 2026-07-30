/**
 * Skills configuration for Mastery System
 * Organized by category with their associated attributes
 */

export interface SkillDefinition {
  name: string;
  attributes: string[]; // Primary attributes for this skill
  category: string;
  /** Player's Guide summary for hover tooltips. */
  description: string;
}

export const SKILL_CATEGORIES = {
  AWARENESS: 'Awareness',
  PHYSICAL: 'Physical',
  KNOWLEDGE_CRAFT: 'Knowledge & Craft',
  SOCIAL: 'Social',
  SURVIVAL: 'Survival',
  MARTIAL: 'Martial'
} as const;

export const SKILLS: Record<string, SkillDefinition> = {
  // Physical Skills
  athletics: {
    name: 'Athletics',
    attributes: ['might'],
    category: SKILL_CATEGORIES.PHYSICAL,
    description: `“Endurance is the courage of the body.”

Raw power and control — climbing, swimming, holding fast when others fall.
Roll: Might (or Agility) keep Mastery · Opposed by: Environment
Typical Raises: more weight, less equipment, speed, silence.`,
  },
  acrobatics: {
    name: 'Acrobatics',
    attributes: ['agility'],
    category: SKILL_CATEGORIES.PHYSICAL,
    description: `“Grace is control disguised as freedom.”

Balance, agility, and precision in motion — rolling under blades, rafters, catching yourself before the fall.
Roll: Agility keep Mastery · Opposed by: Environment
Typical Raises: more weight, less equipment, speed, silence.`,
  },
  stealth: {
    name: 'Stealth',
    attributes: ['agility'],
    category: SKILL_CATEGORIES.PHYSICAL,
    description: `“To disappear, you must first accept being unseen.”

Silence and shadow — sightlines, sound, and rhythm. Patience made physical.
Roll: Agility keep Mastery · Opposed by: Perception
Typical Raises: brighter light, faster movement, closer distance, multiple observers, open ground, while acting.`,
  },
  concealment: {
    name: 'Concealment',
    attributes: ['wits'],
    category: SKILL_CATEGORIES.PHYSICAL,
    description: `“Stillness is the loudest form of patience.”

Become part of the environment — choosing where to vanish rather than how. Calm over motion.
Roll: Wits keep Mastery · Opposed by: Perception or Intuition
Typical Raises: poor cover, shifting light, leaving no trace, hiding equipment, resisting search, longer duration.`,
  },
  ride: {
    name: 'Ride',
    attributes: ['agility'],
    category: SKILL_CATEGORIES.PHYSICAL,
    description: `“Trust is the rein that guides every mount.”

Connection between rider and steed — balance, communication, unity in motion.
Roll: Agility keep Mastery · Opposed by: Animal’s Instinct or Environment
Typical Raises: obstacles/jumps, high speed, rough terrain, panic, mounted combat, hands-free.`,
  },
  sleightOfHand: {
    name: 'Sleight of Hand',
    attributes: ['agility'],
    category: SKILL_CATEGORIES.PHYSICAL,
    description: `“A heartbeat of distraction is a lifetime of opportunity.”

Dexterity refined into deception — theft, traps, planting or swapping with steady hands.
Roll: Agility keep Mastery · Opposed by: Perception or Reflex
Typical Raises: larger object, direct observation, time pressure, multiple items, one-handed use.`,
  },

  // Knowledge & Craft Skills
  lore: {
    name: 'Lore',
    attributes: ['intellect'],
    category: SKILL_CATEGORIES.KNOWLEDGE_CRAFT,
    description: `“Stories are the bones of the world.”

Memory of history, faith, myth, and forgotten tongues — truth that survives in fragments.
Roll: Intellect keep Mastery · Opposed by: Deception or Uncertainty (GM)
Typical Raises: rare topic, ancient language, foreign culture, obscure religion, fragmented sources.`,
  },
  alchemy: {
    name: 'Alchemy',
    attributes: ['intellect'],
    category: SKILL_CATEGORIES.KNOWLEDGE_CRAFT,
    description: `“Every leaf remembers what it was made to heal.”

Mixing, boiling, and binding natural essences — medicine and poison a heartbeat apart.
Roll: Intellect keep Mastery · Opposed by: Complexity or Purity of Materials
Typical Raises: rare herbs, dangerous terrain, short time, large quantity, complex/toxic mixtures.`,
  },
  crafting: {
    name: 'Crafting',
    attributes: ['might'],
    category: SKILL_CATEGORIES.KNOWLEDGE_CRAFT,
    description: `“Creation is memory made solid.”

Hard, resisting materials — wood, stone, metal, bone. Forging, framing, heavy repairs, toolmaking.
Roll: Might keep Mastery · Opposed by: Material quality or Design complexity
Typical Raises: fine detail, poor tools, limited materials, large scale, hostile conditions, time.`,
  },
  artisanry: {
    name: 'Artisanry',
    attributes: ['intellect'],
    category: SKILL_CATEGORIES.KNOWLEDGE_CRAFT,
    description: `“The finest work is technique turned into beauty.”

Soft goods and fine precision — textiles, jewelry, pottery finishing, dyes, decorative work.
Roll: Intellect keep Mastery · Opposed by: Pattern complexity or Material delicacy
Typical Raises: fragile materials, ultra-fine detail, complex patterns, rare pigments, rushed work.`,
  },
  engineering: {
    name: 'Engineering',
    attributes: ['intellect'],
    category: SKILL_CATEGORIES.KNOWLEDGE_CRAFT,
    description: `“Every structure is a prayer to logic.”

Applied intellect — machines, fortifications, bending matter through design.
Roll: Intellect keep Mastery · Opposed by: Complexity or Environmental stress
Typical Raises: complex mechanisms, unstable materials, siege scale, limited tools, time pressure.`,
  },
  medicine: {
    name: 'Medicine',
    attributes: ['intellect'],
    category: SKILL_CATEGORIES.KNOWLEDGE_CRAFT,
    description: `“To heal is to borrow time from death.”

Study of life’s fragility — steady hands and the courage to oppose injury and disease.
Roll: Intellect keep Mastery · Opposed by: Injury severity or Disease virulence
Typical Raises: severe wound, lack of tools, multiple patients, limited time, infection/poison.`,
  },
  navigation: {
    name: 'Navigation',
    attributes: ['wits'],
    category: SKILL_CATEGORIES.KNOWLEDGE_CRAFT,
    description: `“The world is a map that only patience can read.”

Guide through land, sea, or stars — wind, current, landmarks, and omen.
Roll: Wits keep Mastery · Opposed by: Weather or Terrain Difficulty
Typical Raises: poor visibility, bad weather, no landmarks, magical interference, long distance.`,
  },
  occultism: {
    name: 'Occultism',
    attributes: ['resolve'],
    category: SKILL_CATEGORIES.KNOWLEDGE_CRAFT,
    description: `“The veil remembers every whisper.”

Hidden truths — Echoes of gods, forbidden magic, rituals between will, word, and memory.
Roll: Resolve keep Mastery · Opposed by: Deception
Typical Raises: ancient script, fragmented ritual, false leads, divine/demonic interference, unstable magic.`,
  },

  // Social Skills
  persuasion: {
    name: 'Persuasion',
    attributes: ['influence'],
    category: SKILL_CATEGORIES.SOCIAL,
    description: `“A steady voice can move mountains where force cannot.”

Turn intent into agreement through patience, empathy, and rhetoric — guide, don’t dominate.
Roll: Influence keep Mastery · Opposed by: Deception
Typical Raises: hostile audience, complex request, limited time, conflicting interests, moral resistance.`,
  },
  deception: {
    name: 'Deception',
    attributes: ['influence'],
    category: SKILL_CATEGORIES.SOCIAL,
    description: `“Truth is only the lie we agree upon.”

Misdirection — weave truth and falsehood until neither can be told apart.
Roll: Influence keep Mastery · Opposed by: Empathy
Typical Raises: skeptical target, extended lie, partial truth, multiple listeners, prior suspicion.`,
  },
  intimidation: {
    name: 'Intimidation',
    attributes: ['might'],
    category: SKILL_CATEGORIES.SOCIAL,
    description: `“Fear is the most honest language.”

Project dominance — presence that bends others without a blow.
Roll: Might keep Mastery · Opposed by: Leadership
Typical Raises: fearless target, public setting, armed opponents, multiple targets, moral resistance.`,
  },
  leadership: {
    name: 'Leadership',
    attributes: ['resolve'],
    category: SKILL_CATEGORIES.SOCIAL,
    description: `“To lead is to bear the weight of every step behind you.”

Command by conviction — unite voices, restore courage, turn chaos into purpose.
Roll: Resolve keep Mastery · Opposed by: Intimidation
Typical Raises: chaotic situation, low morale, mixed loyalties, split groups, high stress.`,
  },
  performance: {
    name: 'Performance',
    attributes: ['influence'],
    category: SKILL_CATEGORIES.SOCIAL,
    description: `“A lie told with beauty becomes truth for a heartbeat.”

Channel emotion into expression — voice, movement, or art that moves an audience.
Roll: Influence keep Mastery · Opposed by: Empathy
Typical Raises: hostile/distracted crowd, poor acoustics, large audience, improvised act, duration.`,
  },
  streetwise: {
    name: 'Streetwise',
    attributes: ['wits'],
    category: SKILL_CATEGORIES.SOCIAL,
    description: `“Every city speaks. You just have to know which alleys whisper.”

Read society’s undercurrents — rumor, greed, survival, and the unspoken laws of the street.
Roll: Wits keep Mastery · Opposed by: Deception or Authority
Typical Raises: foreign district, high surveillance, secret networks, rival gangs, misinformation.`,
  },
  empathy: {
    name: 'Empathy',
    attributes: ['resolve'],
    category: SKILL_CATEGORIES.SOCIAL,
    description: `“The eyes reveal what the mouth conceals.”

Listen between words — feel deceit, faltering faith, and the pain that shapes choices.
Roll: Resolve keep Mastery · Opposed by: Deception or Performance
Typical Raises: evasive subject, strong emotion, conflicting signals, group interaction, brief contact.`,
  },
  negotiation: {
    name: 'Negotiation',
    attributes: ['resolve'],
    category: SKILL_CATEGORIES.SOCIAL,
    description: `“A deal is a battlefield with smiles.”

Reach terms under pressure — leverage, compromises, hidden costs. Changes outcomes, not just minds.
Roll: Resolve keep Mastery · Opposed by: Negotiation or Deception (bad faith)
Typical Raises: scarce goods, complex terms, asymmetric information, hostile counterparty.`,
  },
  seduction: {
    name: 'Seduction',
    attributes: ['influence'],
    category: SKILL_CATEGORIES.SOCIAL,
    description: `“Desire is a door — the question is who holds the key.”

Draw someone toward you through allure, tension, and carefully chosen vulnerability.
Roll: Influence keep Mastery · Opposed by: Empathy or Resolve
Typical Raises: guarded target, moral barrier, high-stakes setting, reputational risk, wards.`,
  },
  investigation: {
    name: 'Investigation',
    attributes: ['intellect'],
    category: SKILL_CATEGORIES.SOCIAL,
    description: `“Clues don’t speak — until you learn their language.”

Extract truth from fragments — crime scenes, timelines, documents, archives.
Roll: Intellect keep Mastery · Opposed by: Deception or Investigation (counter-analysis)
Typical Raises: contaminated evidence, coded text, forged records, time pressure, misleading testimony.`,
  },
  etiquette: {
    name: 'Etiquette',
    attributes: ['influence'],
    category: SKILL_CATEGORIES.SOCIAL,
    description: `“In the right room, one wrong word is a weapon.”

Formal society — titles, rituals, hierarchy, courts and clergy. Signal belonging.
Roll: Influence keep Mastery · Opposed by: Empathy, Deception, or Etiquette
Typical Raises: foreign customs, strict hierarchy, hostile court, obscure ritual, public scrutiny.`,
  },

  // Awareness (pinned first on sheet — multi-attribute Perception)
  perception: {
    name: 'Perception',
    attributes: ['wits', 'intellect', 'resolve'],
    category: SKILL_CATEGORIES.AWARENESS,
    description: `“Awareness is the thin line between hunter and prey.”

Discipline of awareness — notice danger and meaning before they become obvious. Choose a Focus when you roll:
• Wits — Immediate Senses (ambush, movement, sound)
• Intellect — Patterns & Analysis (traps, tracks, forensic detail)
• Resolve — Presence & Occult (intent, glamours, wrongness)
Opposed by Stealth/Concealment (or Deception/Intimidation/Occultism by Focus).`,
  },

  // Survival Skills
  survival: {
    name: 'Survival',
    attributes: ['vitality'],
    category: SKILL_CATEGORIES.SURVIVAL,
    description: `“The world provides for those who respect its cruelty.”

Shelter, warmth, and courage when nothing else remains — learn the land’s rhythm.
Roll: Vitality keep Mastery · Opposed by: Environment
Typical Raises: harsh terrain, lack of tools, group survival, extreme weather, scarce resources.`,
  },
  animalHandling: {
    name: 'Animal Handling',
    attributes: ['resolve'],
    category: SKILL_CATEGORIES.SURVIVAL,
    description: `“Trust is the oldest magic between man and beast.”

Calm fear, guide strength, speak without words — patience as much as skill.
Roll: Resolve keep Mastery · Opposed by: Creature’s Resolve
Typical Raises: frightened/injured beast, unfamiliar species, groups, combat conditions.`,
  },
  tracking: {
    name: 'Tracking',
    attributes: ['wits'],
    category: SKILL_CATEGORIES.SURVIVAL,
    description: `“Every step leaves a story written in dust and silence.”

Read signs left behind — where someone went, how fast, and what they feared.
Roll: Wits keep Mastery · Opposed by: Stealth or Survival
Typical Raises: mixed tracks, long duration, weather, false trails, night pursuit, high speed.`,
  },
  herbalism: {
    name: 'Herbalism',
    attributes: ['intellect'],
    category: SKILL_CATEGORIES.SURVIVAL,
    description: `“The earth hides generosity beneath patience.”

Draw sustenance from the land — food, herbs, soil and bark; poison vs healing.
Roll: Intellect keep Mastery · Opposed by: Environment
Typical Raises: rare ingredients, hostile terrain, limited daylight, dangerous flora.`,
  },
  weatherSense: {
    name: 'Weather Sense',
    attributes: ['wits'],
    category: SKILL_CATEGORIES.SURVIVAL,
    description: `“The sky remembers every storm.”

Read temperature, scent, and sound — clouds whisper intent; the wind carries warnings.
Roll: Wits keep Mastery · Opposed by: None (Environmental TN)
Typical Raises: magical storms, rapid climate shifts, mountain/sea, long-range forecast.`,
  },

  // Martial Skills
  handToHand: {
    name: 'Hand-to-Hand',
    attributes: ['might', 'agility'],
    category: SKILL_CATEGORIES.MARTIAL,
    description: `“A weapon is a convenience — the body is the truth.”

Unarmed combat, grappling, and improvised violence at arm’s length.
Spend Skill Points after an unarmed attack or grapple/control check to add a flat bonus to the result.`,
  },
  meleeWeapons: {
    name: 'Melee Weapons',
    attributes: ['might'],
    category: SKILL_CATEGORIES.MARTIAL,
    description: `“Steel remembers the will that wields it.”

Blades, axes, hammers, polearms — timing, reach, and decisive pressure.
Spend Skill Points after a melee attack roll to add a flat bonus to the result.`,
  },
  rangedWeapons: {
    name: 'Ranged Weapons',
    attributes: ['agility'],
    category: SKILL_CATEGORIES.MARTIAL,
    description: `“Patience is the space between heartbeat and flight.”

Bows, crossbows, firearms, thrown weapons — breath, stability, the right second to release.
Spend Skill Points after a ranged attack roll to add a flat bonus to the result.`,
  },
  defensiveCombat: {
    name: 'Defensive Combat',
    attributes: ['agility', 'vitality'],
    category: SKILL_CATEGORIES.MARTIAL,
    description: `“Survival is the art of not being where the blade lands.”

Parries, shields, footwork, and evasive instincts under pressure.
When targeted by an attack, spend Skill Points to raise Evade against that single attack only.`,
  },
  combatReflexes: {
    name: 'Combat Reflexes',
    attributes: ['agility'],
    category: SKILL_CATEGORIES.MARTIAL,
    description: `“The first move is not speed — it’s noticing the opening.”

Explosive reaction and timing under pressure.
Spend once after the Initiative roll to increase your Initiative Score before the Initiative Shop.`,
  }
};

/**
 * Get all skills grouped by category
 */
export function getSkillsByCategory(): Record<string, SkillDefinition[]> {
  const grouped: Record<string, SkillDefinition[]> = {};
  
  for (const skill of Object.values(SKILLS)) {
    if (!grouped[skill.category]) {
      grouped[skill.category] = [];
    }
    grouped[skill.category].push(skill);
  }
  
  // Sort skills within each category alphabetically
  for (const category in grouped) {
    grouped[category].sort((a, b) => a.name.localeCompare(b.name));
  }
  
  return grouped;
}

/**
 * Get skill definition by key
 */
export function getSkill(key: string): SkillDefinition | undefined {
  return SKILLS[key];
}

/** Hover tooltip text for a skill key (Player's Guide summary). */
export function getSkillDescription(key: string): string {
  return SKILLS[key]?.description ?? '';
}
