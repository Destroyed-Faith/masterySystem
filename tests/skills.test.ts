import { describe, it, expect } from 'vitest';
import { SKILLS, SKILL_CATEGORIES, getSkillsByCategory, getSkill } from '../src/utils/skills';

describe('Skill Definitions (Player\'s Guide compliance)', () => {
  describe('Physical Skills', () => {
    it('Athletics primary attribute is Might', () => {
      expect(SKILLS.athletics.attributes[0]).toBe('might');
    });

    it('Acrobatics primary attribute is Agility', () => {
      expect(SKILLS.acrobatics.attributes[0]).toBe('agility');
    });

    it('Stealth primary attribute is Agility', () => {
      expect(SKILLS.stealth.attributes[0]).toBe('agility');
    });

    it('Concealment primary attribute is Wits', () => {
      expect(SKILLS.concealment.attributes[0]).toBe('wits');
    });

    it('Ride primary attribute is Agility', () => {
      expect(SKILLS.ride.attributes[0]).toBe('agility');
    });

    it('Sleight of Hand primary attribute is Agility', () => {
      expect(SKILLS.sleightOfHand.attributes[0]).toBe('agility');
    });
  });

  describe('Knowledge & Craft Skills', () => {
    it('Lore primary attribute is Intellect', () => {
      expect(SKILLS.lore.attributes[0]).toBe('intellect');
    });

    it('Alchemy primary attribute is Intellect', () => {
      expect(SKILLS.alchemy.attributes[0]).toBe('intellect');
    });

    it('Crafting primary attribute is Might', () => {
      expect(SKILLS.crafting.attributes[0]).toBe('might');
    });

    it('Artisanry primary attribute is Intellect', () => {
      expect(SKILLS.artisanry.attributes[0]).toBe('intellect');
    });

    it('Engineering primary attribute is Intellect', () => {
      expect(SKILLS.engineering.attributes[0]).toBe('intellect');
    });

    it('Medicine primary attribute is Intellect', () => {
      expect(SKILLS.medicine.attributes[0]).toBe('intellect');
    });

    it('Navigation primary attribute is Wits', () => {
      expect(SKILLS.navigation.attributes[0]).toBe('wits');
    });

    it('Occultism primary attribute is Resolve', () => {
      expect(SKILLS.occultism.attributes[0]).toBe('resolve');
    });
  });

  describe('Social Skills', () => {
    it('Persuasion primary attribute is Influence', () => {
      expect(SKILLS.persuasion.attributes[0]).toBe('influence');
    });

    it('Deception primary attribute is Influence', () => {
      expect(SKILLS.deception.attributes[0]).toBe('influence');
    });

    it('Intimidation primary attribute is Might', () => {
      expect(SKILLS.intimidation.attributes[0]).toBe('might');
    });

    it('Leadership primary attribute is Resolve', () => {
      expect(SKILLS.leadership.attributes[0]).toBe('resolve');
    });

    it('Performance primary attribute is Influence', () => {
      expect(SKILLS.performance.attributes[0]).toBe('influence');
    });

    it('Streetwise primary attribute is Wits', () => {
      expect(SKILLS.streetwise.attributes[0]).toBe('wits');
    });

    it('Empathy primary attribute is Resolve', () => {
      expect(SKILLS.empathy.attributes[0]).toBe('resolve');
    });

    it('Negotiation exists with Resolve', () => {
      expect(SKILLS.negotiation).toBeDefined();
      expect(SKILLS.negotiation.attributes[0]).toBe('resolve');
    });

    it('Seduction exists with Influence', () => {
      expect(SKILLS.seduction).toBeDefined();
      expect(SKILLS.seduction.attributes[0]).toBe('influence');
    });

    it('Investigation exists with Intellect', () => {
      expect(SKILLS.investigation).toBeDefined();
      expect(SKILLS.investigation.attributes[0]).toBe('intellect');
    });

    it('Etiquette exists with Influence', () => {
      expect(SKILLS.etiquette).toBeDefined();
      expect(SKILLS.etiquette.attributes[0]).toBe('influence');
    });
  });

  describe('Awareness', () => {
    it('Perception has multi-focus attributes (Wits, Intellect, Resolve) and is not under Survival', () => {
      expect(SKILLS.perception.attributes).toContain('wits');
      expect(SKILLS.perception.attributes).toContain('intellect');
      expect(SKILLS.perception.attributes).toContain('resolve');
      expect(SKILLS.perception.category).toBe(SKILL_CATEGORIES.AWARENESS);
    });
  });

  describe('Survival Skills', () => {
    it('Survival primary attribute is Vitality', () => {
      expect(SKILLS.survival.attributes[0]).toBe('vitality');
    });

    it('Animal Handling primary attribute is Resolve', () => {
      expect(SKILLS.animalHandling.attributes[0]).toBe('resolve');
    });

    it('Tracking primary attribute is Wits', () => {
      expect(SKILLS.tracking.attributes[0]).toBe('wits');
    });

    it('Herbalism exists with Intellect', () => {
      expect(SKILLS.herbalism).toBeDefined();
      expect(SKILLS.herbalism.attributes[0]).toBe('intellect');
    });

    it('Weather Sense primary attribute is Wits', () => {
      expect(SKILLS.weatherSense.attributes[0]).toBe('wits');
    });
  });

  describe('Martial Skills', () => {
    it('Hand-to-Hand uses Might and Agility', () => {
      expect(SKILLS.handToHand.attributes).toContain('might');
      expect(SKILLS.handToHand.attributes).toContain('agility');
    });

    it('Melee Weapons primary attribute is Might', () => {
      expect(SKILLS.meleeWeapons.attributes[0]).toBe('might');
    });

    it('Ranged Weapons primary attribute is Agility', () => {
      expect(SKILLS.rangedWeapons.attributes[0]).toBe('agility');
    });

    it('Defensive Combat uses Agility and Vitality', () => {
      expect(SKILLS.defensiveCombat.attributes).toContain('agility');
      expect(SKILLS.defensiveCombat.attributes).toContain('vitality');
    });

    it('Combat Reflexes primary attribute is Agility', () => {
      expect(SKILLS.combatReflexes.attributes[0]).toBe('agility');
    });
  });
});

describe('Skill Categories', () => {
  it('has all 6 categories', () => {
    expect(Object.keys(SKILL_CATEGORIES)).toHaveLength(6);
    expect(SKILL_CATEGORIES.AWARENESS).toBe('Awareness');
    expect(SKILL_CATEGORIES.PHYSICAL).toBe('Physical');
    expect(SKILL_CATEGORIES.KNOWLEDGE_CRAFT).toBe('Knowledge & Craft');
    expect(SKILL_CATEGORIES.SOCIAL).toBe('Social');
    expect(SKILL_CATEGORIES.SURVIVAL).toBe('Survival');
    expect(SKILL_CATEGORIES.MARTIAL).toBe('Martial');
  });

  it('getSkillsByCategory groups correctly', () => {
    const grouped = getSkillsByCategory();
    expect(Object.keys(grouped)).toHaveLength(6);

    const physicalSkills = grouped[SKILL_CATEGORIES.PHYSICAL];
    expect(physicalSkills.length).toBe(6);

    const martialSkills = grouped[SKILL_CATEGORIES.MARTIAL];
    expect(martialSkills.length).toBe(5);

    expect(grouped[SKILL_CATEGORIES.AWARENESS].map((s) => s.name)).toContain('Perception');
  });
});

describe('Total Skill Count', () => {
  it('has the correct number of skills (Player\'s Guide)', () => {
    const totalSkills = Object.keys(SKILLS).length;
    expect(totalSkills).toBeGreaterThanOrEqual(30);
  });
});

describe('getSkill helper', () => {
  it('returns skill by key', () => {
    const skill = getSkill('athletics');
    expect(skill).toBeDefined();
    expect(skill!.name).toBe('Athletics');
  });

  it('returns undefined for unknown key', () => {
    expect(getSkill('nonexistent')).toBeUndefined();
  });
});
