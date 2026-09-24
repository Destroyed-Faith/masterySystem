import { describe, it, expect } from 'vitest';
import { SKILLS, SKILL_CATEGORIES, getSkillsByCategory, getSkill } from '../src/utils/skills';

describe('Skill Definitions (Player\'s Guide compliance)', () => {
  describe('Physical Skills', () => {
    it('Athletics primary attribute is Might', () => {
      expect(SKILLS.athletics.attributes).toEqual(['might']);
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

  describe('Martial Skills (removed from the rules)', () => {
    it('no longer defines Hand-to-Hand, Melee Weapons, Ranged Weapons, Defensive Combat, or Combat Reflexes', () => {
      for (const key of ['handToHand', 'meleeWeapons', 'rangedWeapons', 'defensiveCombat', 'combatReflexes']) {
        expect(SKILLS[key]).toBeUndefined();
        expect(getSkill(key)).toBeUndefined();
      }
      const names = Object.values(SKILLS).map((s) => s.name);
      for (const name of ['Hand-to-Hand', 'Melee Weapons', 'Ranged Weapons', 'Defensive Combat', 'Combat Reflexes']) {
        expect(names).not.toContain(name);
      }
    });

    it('has no Martial category', () => {
      expect((SKILL_CATEGORIES as Record<string, string>).MARTIAL).toBeUndefined();
      expect(Object.values(SKILL_CATEGORIES)).not.toContain('Martial');
      expect(Object.values(SKILLS).some((s) => s.category === 'Martial')).toBe(false);
    });
  });
});

describe('Skill Categories', () => {
  it('has all 5 categories', () => {
    expect(Object.keys(SKILL_CATEGORIES)).toHaveLength(5);
    expect(SKILL_CATEGORIES.AWARENESS).toBe('Perception');
    expect(SKILL_CATEGORIES.PHYSICAL).toBe('Physical');
    expect(SKILL_CATEGORIES.KNOWLEDGE_CRAFT).toBe('Knowledge & Craft');
    expect(SKILL_CATEGORIES.SOCIAL).toBe('Social');
    expect(SKILL_CATEGORIES.SURVIVAL).toBe('Survival');
  });

  it('getSkillsByCategory groups correctly', () => {
    const grouped = getSkillsByCategory();
    expect(Object.keys(grouped)).toHaveLength(5);
    expect(grouped['Martial']).toBeUndefined();

    const physicalSkills = grouped[SKILL_CATEGORIES.PHYSICAL];
    expect(physicalSkills.length).toBe(6);

    expect(grouped[SKILL_CATEGORIES.AWARENESS].map((s) => s.name)).toContain('Perception');
  });
});

describe('Total Skill Count', () => {
  it('has the correct number of skills (Player\'s Guide)', () => {
    const totalSkills = Object.keys(SKILLS).length;
    expect(totalSkills).toBe(31);
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
