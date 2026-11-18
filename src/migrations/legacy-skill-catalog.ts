/**
 * Retired fixed Skill keys (pre-DF 2026). Read-only lookup for migration
 * review screens that display archived Skill ratings; never used by runtime rules.
 */

export const LEGACY_SKILL_CATEGORIES = {
  AWARENESS: "Perception",
  PHYSICAL: "Physical",
  KNOWLEDGE_CRAFT: "Knowledge & Craft",
  SOCIAL: "Social",
  SURVIVAL: "Survival",
} as const;

export interface LegacySkillEntry {
  name: string;
  category: string;
}

export const LEGACY_SKILL_CATALOG: Record<string, LegacySkillEntry> = {
  athletics: { name: "Athletics", category: LEGACY_SKILL_CATEGORIES.PHYSICAL },
  acrobatics: { name: "Acrobatics", category: LEGACY_SKILL_CATEGORIES.PHYSICAL },
  stealth: { name: "Stealth", category: LEGACY_SKILL_CATEGORIES.PHYSICAL },
  concealment: { name: "Concealment", category: LEGACY_SKILL_CATEGORIES.PHYSICAL },
  ride: { name: "Ride", category: LEGACY_SKILL_CATEGORIES.PHYSICAL },
  sleightOfHand: { name: "Sleight of Hand", category: LEGACY_SKILL_CATEGORIES.PHYSICAL },
  lore: { name: "Lore", category: LEGACY_SKILL_CATEGORIES.KNOWLEDGE_CRAFT },
  alchemy: { name: "Alchemy", category: LEGACY_SKILL_CATEGORIES.KNOWLEDGE_CRAFT },
  crafting: { name: "Crafting", category: LEGACY_SKILL_CATEGORIES.KNOWLEDGE_CRAFT },
  artisanry: { name: "Artisanry", category: LEGACY_SKILL_CATEGORIES.KNOWLEDGE_CRAFT },
  engineering: { name: "Engineering", category: LEGACY_SKILL_CATEGORIES.KNOWLEDGE_CRAFT },
  medicine: { name: "Medicine", category: LEGACY_SKILL_CATEGORIES.KNOWLEDGE_CRAFT },
  navigation: { name: "Navigation", category: LEGACY_SKILL_CATEGORIES.KNOWLEDGE_CRAFT },
  occultism: { name: "Occultism", category: LEGACY_SKILL_CATEGORIES.KNOWLEDGE_CRAFT },
  persuasion: { name: "Persuasion", category: LEGACY_SKILL_CATEGORIES.SOCIAL },
  deception: { name: "Deception", category: LEGACY_SKILL_CATEGORIES.SOCIAL },
  intimidation: { name: "Intimidation", category: LEGACY_SKILL_CATEGORIES.SOCIAL },
  leadership: { name: "Leadership", category: LEGACY_SKILL_CATEGORIES.SOCIAL },
  performance: { name: "Performance", category: LEGACY_SKILL_CATEGORIES.SOCIAL },
  streetwise: { name: "Streetwise", category: LEGACY_SKILL_CATEGORIES.SOCIAL },
  empathy: { name: "Empathy", category: LEGACY_SKILL_CATEGORIES.SOCIAL },
  negotiation: { name: "Negotiation", category: LEGACY_SKILL_CATEGORIES.SOCIAL },
  seduction: { name: "Seduction", category: LEGACY_SKILL_CATEGORIES.SOCIAL },
  investigation: { name: "Investigation", category: LEGACY_SKILL_CATEGORIES.SOCIAL },
  etiquette: { name: "Etiquette", category: LEGACY_SKILL_CATEGORIES.SOCIAL },
  perception: { name: "Perception", category: LEGACY_SKILL_CATEGORIES.AWARENESS },
  survival: { name: "Survival", category: LEGACY_SKILL_CATEGORIES.SURVIVAL },
  animalHandling: { name: "Animal Handling", category: LEGACY_SKILL_CATEGORIES.SURVIVAL },
  tracking: { name: "Tracking", category: LEGACY_SKILL_CATEGORIES.SURVIVAL },
  herbalism: { name: "Herbalism", category: LEGACY_SKILL_CATEGORIES.SURVIVAL },
  weatherSense: { name: "Weather Sense", category: LEGACY_SKILL_CATEGORIES.SURVIVAL },
};
