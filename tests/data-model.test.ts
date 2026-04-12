import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { SKILLS } from '../src/utils/skills';

const templatePath = resolve(__dirname, '..', 'template.json');
const template = JSON.parse(readFileSync(templatePath, 'utf8'));

describe('Actor Data Model - template.json', () => {
  describe('Actor Types', () => {
    it('defines character, npc, summon types', () => {
      expect(template.Actor.types).toContain('character');
      expect(template.Actor.types).toContain('npc');
      expect(template.Actor.types).toContain('summon');
      expect(template.Actor.types).not.toContain('divine');
    });
  });

  describe('Base Attributes', () => {
    const attrs = template.Actor.templates.base.attributes;

    it('has all 7 attributes', () => {
      const required = ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence', 'wits'];
      for (const attr of required) {
        expect(attrs[attr]).toBeDefined();
        expect(attrs[attr].value).toBeDefined();
        expect(attrs[attr].stones).toBeDefined();
      }
    });

    it('attributes start at 2 (Mastery Rank 2 base)', () => {
      for (const attr of Object.values(attrs) as any[]) {
        expect(attr.value).toBe(2);
      }
    });

    it('stones start at 0', () => {
      for (const attr of Object.values(attrs) as any[]) {
        expect(attr.stones).toBe(0);
      }
    });
  });

  describe('Mastery', () => {
    const mastery = template.Actor.templates.base.mastery;

    it('has rank, points, and experience', () => {
      expect(mastery.rank).toBeDefined();
      expect(mastery.points).toBeDefined();
      expect(mastery.experience).toBeDefined();
    });

    it('starts at rank 2', () => {
      expect(mastery.rank).toBe(2);
    });
  });

  describe('Combatant Template', () => {
    const combatant = template.Actor.templates.combatant;

    it('has combat stats', () => {
      expect(combatant.combat.initiative).toBeDefined();
      expect(combatant.combat.evade).toBeDefined();
      expect(combatant.combat.armor).toBeDefined();
      expect(combatant.combat.shield).toBeDefined();
      expect(combatant.combat.speed).toBeDefined();
    });

    it('has resources (reactions, movement, actions)', () => {
      expect(combatant.resources.reactions).toEqual({ value: 1, max: 1 });
      expect(combatant.resources.movement).toEqual({ value: 1, max: 1 });
      expect(combatant.resources.actions).toEqual({ value: 1, max: 1 });
    });

    it('has faith fractures', () => {
      expect(combatant.faithFractures.current).toBe(0);
      expect(combatant.faithFractures.maximum).toBe(10);
    });
  });

  describe('Character Stone Pools', () => {
    const pools = template.Actor.character.stonePools;

    it('has stone pools for all 7 attributes', () => {
      const required = ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence', 'wits'];
      for (const attr of required) {
        expect(pools[attr]).toBeDefined();
        expect(pools[attr].current).toBeDefined();
        expect(pools[attr].max).toBeDefined();
        expect(pools[attr].sustained).toBeDefined();
      }
    });
  });

  describe('Character Health Bars', () => {
    const health = template.Actor.character.health;

    it('has 4 health bars', () => {
      expect(health.bars).toHaveLength(4);
    });

    it('has correct bar names and penalties', () => {
      expect(health.bars[0].name).toBe('Healthy');
      expect(health.bars[0].penalty).toBe(0);
      expect(health.bars[1].name).toBe('Bruised');
      expect(health.bars[1].penalty).toBe(-1);
      expect(health.bars[2].name).toBe('Injured');
      expect(health.bars[2].penalty).toBe(-2);
      expect(health.bars[3].name).toBe('Wounded');
      expect(health.bars[3].penalty).toBe(-4);
    });

    it('has currentBar and tempHP', () => {
      expect(health.currentBar).toBeDefined();
      expect(health.tempHP).toBeDefined();
    });
  });

  describe('Character Creation', () => {
    const creation = template.Actor.character.creation;

    it('has complete flag', () => {
      expect(creation.complete).toBe(false);
    });
  });

  describe('Saving Throws', () => {
    const saves = template.Actor.character.savingThrows;

    it('has saving throw fields for all attributes', () => {
      const required = ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence', 'wits'];
      for (const attr of required) {
        expect(saves[attr]).toBeDefined();
      }
    });
  });

  describe('NPC Saving Throws', () => {
    const npcSaves = template.Actor.npc.savingThrows;

    it('uses Body/Mind/Spirit categories', () => {
      expect(npcSaves.body).toBeDefined();
      expect(npcSaves.mind).toBeDefined();
      expect(npcSaves.spirit).toBeDefined();
    });
  });
});

describe('Item Data Model - template.json', () => {
  describe('Item Types', () => {
    it('defines all required item types', () => {
      const required = ['power', 'masteryNode', 'echo', 'schtick', 'artifact',
                        'condition', 'weapon', 'armor', 'shield', 'gear'];
      for (const type of required) {
        expect(template.Item.types).toContain(type);
      }
    });
  });

  describe('Power Item', () => {
    const power = template.Item.power;

    it('has powerType field', () => {
      expect(power.powerType).toBeDefined();
    });

    it('has level field', () => {
      expect(power.level).toBeDefined();
    });

    it('has tree field', () => {
      expect(power.tree).toBeDefined();
    });

    it('has tags array', () => {
      expect(Array.isArray(power.tags)).toBe(true);
    });

    it('has range, aoe, duration, effect', () => {
      expect(power.range).toBeDefined();
      expect(power.aoe).toBeDefined();
      expect(power.duration).toBeDefined();
      expect(power.effect).toBeDefined();
    });

    it('has cost structure (action, movement, reaction, stones, charges)', () => {
      expect(power.cost.action).toBeDefined();
      expect(power.cost.movement).toBeDefined();
      expect(power.cost.reaction).toBeDefined();
      expect(power.cost.stones).toBeDefined();
      expect(power.cost.charges).toBeDefined();
    });

    it('has roll structure (attribute, tn, damage, healing, raises)', () => {
      expect(power.roll.attribute).toBeDefined();
      expect(power.roll.tn).toBeDefined();
      expect(power.roll.damage).toBeDefined();
    });

    it('has requirements (masteryRank)', () => {
      expect(power.requirements.masteryRank).toBeDefined();
    });
  });

  describe('Condition Item', () => {
    const condition = template.Item.condition;

    it('has conditionType', () => {
      expect(condition.conditionType).toBeDefined();
    });

    it('has value for stack tracking', () => {
      expect(condition.value).toBeDefined();
    });

    it('has diminishing flag', () => {
      expect(condition.diminishing).toBe(true);
    });

    it('has save type', () => {
      expect(condition.save).toBeDefined();
    });
  });

  describe('Weapon Item', () => {
    const weapon = template.Item.weapon;

    it('has weaponType', () => {
      expect(weapon.weaponType).toBeDefined();
    });

    it('has damage dice', () => {
      expect(weapon.damage).toBeDefined();
    });

    it('has equipped flag', () => {
      expect(weapon.equipped).toBe(false);
    });

    it('has specials array', () => {
      expect(Array.isArray(weapon.specials)).toBe(true);
    });
  });

  describe('Armor Item', () => {
    const armor = template.Item.armor;

    it('has armorValue', () => {
      expect(armor.armorValue).toBeDefined();
    });

    it('has type (light/medium/heavy)', () => {
      expect(armor.type).toBeDefined();
    });

    it('has equipped flag', () => {
      expect(armor.equipped).toBe(false);
    });
  });

  describe('Shield Item', () => {
    const shield = template.Item.shield;

    it('has shieldValue', () => {
      expect(shield.shieldValue).toBeDefined();
    });

    it('has type', () => {
      expect(shield.type).toBeDefined();
    });
  });

  describe('Echo Item', () => {
    const echo = template.Item.echo;

    it('has echoType', () => {
      expect(echo.echoType).toBeDefined();
    });

    it('has traits array', () => {
      expect(Array.isArray(echo.traits)).toBe(true);
    });

    it('has bonuses', () => {
      expect(echo.bonuses).toBeDefined();
    });
  });

  describe('Schtick Item', () => {
    const schtick = template.Item.schtick;

    it('has manifestation', () => {
      expect(schtick.manifestation).toBeDefined();
    });

    it('has masteryRank', () => {
      expect(schtick.masteryRank).toBeDefined();
    });
  });
});

describe('Skill Keys Match Between skills.ts and Data Model', () => {
  it('all skill keys in SKILLS are valid identifiers', () => {
    for (const key of Object.keys(SKILLS)) {
      expect(key).toMatch(/^[a-zA-Z][a-zA-Z0-9]*$/);
    }
  });

  it('every skill has a valid category', () => {
    const validCategories = ['Awareness', 'Physical', 'Knowledge & Craft', 'Social', 'Survival', 'Martial'];
    for (const skill of Object.values(SKILLS)) {
      expect(validCategories).toContain(skill.category);
    }
  });

  it('every skill has at least one attribute', () => {
    for (const [key, skill] of Object.entries(SKILLS)) {
      expect(skill.attributes.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('all skill attributes reference valid attribute names', () => {
    const validAttrs = ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence', 'wits'];
    for (const skill of Object.values(SKILLS)) {
      for (const attr of skill.attributes) {
        expect(validAttrs).toContain(attr);
      }
    }
  });
});
