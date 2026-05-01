/**
 * Skills configuration for Mastery System
 * Organized by category with their associated attributes
 */

export interface SkillDefinition {
  name: string;
  attributes: string[]; // Primary attributes for this skill
  category: string;
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
    attributes: ['might', 'agility'],
    category: SKILL_CATEGORIES.PHYSICAL
  },
  acrobatics: {
    name: 'Acrobatics',
    attributes: ['agility'],
    category: SKILL_CATEGORIES.PHYSICAL
  },
  stealth: {
    name: 'Stealth',
    attributes: ['agility'],
    category: SKILL_CATEGORIES.PHYSICAL
  },
  concealment: {
    name: 'Concealment',
    attributes: ['wits'],
    category: SKILL_CATEGORIES.PHYSICAL
  },
  ride: {
    name: 'Ride',
    attributes: ['agility'],
    category: SKILL_CATEGORIES.PHYSICAL
  },
  sleightOfHand: {
    name: 'Sleight of Hand',
    attributes: ['agility'],
    category: SKILL_CATEGORIES.PHYSICAL
  },

  // Knowledge & Craft Skills
  lore: {
    name: 'Lore',
    attributes: ['intellect'],
    category: SKILL_CATEGORIES.KNOWLEDGE_CRAFT
  },
  alchemy: {
    name: 'Alchemy',
    attributes: ['intellect'],
    category: SKILL_CATEGORIES.KNOWLEDGE_CRAFT
  },
  crafting: {
    name: 'Crafting',
    attributes: ['might'],
    category: SKILL_CATEGORIES.KNOWLEDGE_CRAFT
  },
  artisanry: {
    name: 'Artisanry',
    attributes: ['intellect'],
    category: SKILL_CATEGORIES.KNOWLEDGE_CRAFT
  },
  engineering: {
    name: 'Engineering',
    attributes: ['intellect'],
    category: SKILL_CATEGORIES.KNOWLEDGE_CRAFT
  },
  medicine: {
    name: 'Medicine',
    attributes: ['intellect'],
    category: SKILL_CATEGORIES.KNOWLEDGE_CRAFT
  },
  navigation: {
    name: 'Navigation',
    attributes: ['wits'],
    category: SKILL_CATEGORIES.KNOWLEDGE_CRAFT
  },
  occultism: {
    name: 'Occultism',
    attributes: ['resolve'],
    category: SKILL_CATEGORIES.KNOWLEDGE_CRAFT
  },

  // Social Skills
  persuasion: {
    name: 'Persuasion',
    attributes: ['influence'],
    category: SKILL_CATEGORIES.SOCIAL
  },
  deception: {
    name: 'Deception',
    attributes: ['influence'],
    category: SKILL_CATEGORIES.SOCIAL
  },
  intimidation: {
    name: 'Intimidation',
    attributes: ['might'],
    category: SKILL_CATEGORIES.SOCIAL
  },
  leadership: {
    name: 'Leadership',
    attributes: ['resolve'],
    category: SKILL_CATEGORIES.SOCIAL
  },
  performance: {
    name: 'Performance',
    attributes: ['influence'],
    category: SKILL_CATEGORIES.SOCIAL
  },
  streetwise: {
    name: 'Streetwise',
    attributes: ['wits'],
    category: SKILL_CATEGORIES.SOCIAL
  },
  empathy: {
    name: 'Empathy',
    attributes: ['resolve'],
    category: SKILL_CATEGORIES.SOCIAL
  },
  negotiation: {
    name: 'Negotiation',
    attributes: ['resolve'],
    category: SKILL_CATEGORIES.SOCIAL
  },
  seduction: {
    name: 'Seduction',
    attributes: ['influence'],
    category: SKILL_CATEGORIES.SOCIAL
  },
  investigation: {
    name: 'Investigation',
    attributes: ['intellect'],
    category: SKILL_CATEGORIES.SOCIAL
  },
  etiquette: {
    name: 'Etiquette',
    attributes: ['influence'],
    category: SKILL_CATEGORIES.SOCIAL
  },

  // Awareness (pinned first on sheet — multi-attribute Perception)
  perception: {
    name: 'Perception',
    attributes: ['wits', 'intellect', 'resolve'],
    category: SKILL_CATEGORIES.AWARENESS
  },

  // Survival Skills
  survival: {
    name: 'Survival',
    attributes: ['vitality'],
    category: SKILL_CATEGORIES.SURVIVAL
  },
  animalHandling: {
    name: 'Animal Handling',
    attributes: ['resolve'],
    category: SKILL_CATEGORIES.SURVIVAL
  },
  tracking: {
    name: 'Tracking',
    attributes: ['wits'],
    category: SKILL_CATEGORIES.SURVIVAL
  },
  herbalism: {
    name: 'Herbalism',
    attributes: ['intellect'],
    category: SKILL_CATEGORIES.SURVIVAL
  },
  weatherSense: {
    name: 'Weather Sense',
    attributes: ['wits'],
    category: SKILL_CATEGORIES.SURVIVAL
  },

  // Martial Skills
  handToHand: {
    name: 'Hand-to-Hand',
    attributes: ['might'],
    category: SKILL_CATEGORIES.MARTIAL
  },
  meleeWeapons: {
    name: 'Melee Weapons',
    attributes: ['might'],
    category: SKILL_CATEGORIES.MARTIAL
  },
  rangedWeapons: {
    name: 'Ranged Weapons',
    attributes: ['agility'],
    category: SKILL_CATEGORIES.MARTIAL
  },
  defensiveCombat: {
    name: 'Defensive Combat',
    attributes: ['vitality'],
    category: SKILL_CATEGORIES.MARTIAL
  },
  combatReflexes: {
    name: 'Combat Reflexes',
    attributes: ['agility'],
    category: SKILL_CATEGORIES.MARTIAL
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

