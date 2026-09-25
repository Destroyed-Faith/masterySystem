import { describe, expect, it } from 'vitest';
import { appraiseBuild, attributeXpAboveFreePackage, buildValueTableHtml } from '../src/progression/build-value';

describe('build value at current rules', () => {
  it('prices nothing for the free Attribute package', () => {
    expect(attributeXpAboveFreePackage({
      might: 4, agility: 4, vitality: 3, intellect: 3, resolve: 2, influence: 2, wits: 2,
    }).xp).toBe(0);
  });

  it('prices migrated sheets on the compressed table and old sheets on the 1–80 table', () => {
    const sheet = (values: Record<string, number>, migrated: boolean) => appraiseBuild({
      type: 'character',
      system: {
        progression: migrated ? { v099Stones: true } : {},
        attributes: Object.fromEntries(Object.entries(values).map(([key, value]) => [key, { value }])),
        skills: {},
        points: {},
        xp: {},
      },
      items: [],
    });
    // Scurry after respec: two 8s above a free 4 cost 16 each, plus the extra 4s.
    expect(sheet({
      might: 8, agility: 4, vitality: 8, wits: 4, intellect: 2, resolve: 4, influence: 2,
    }, true).attributes).toBe(40);
    // Oda after respec: 8, 8, 8, 4, 4, 4, 2.
    expect(sheet({
      might: 2, agility: 4, vitality: 8, wits: 8, intellect: 4, resolve: 8, influence: 4,
    }, true).attributes).toBe(60);
    // Alaris still on the old scale. 16 is not a new-table 16.
    expect(sheet({
      might: 8, agility: 16, vitality: 16, wits: 16, intellect: 8, resolve: 8, influence: 8,
    }, false).attributes).toBe(66);
    // Lor-Keth still on the old scale.
    expect(sheet({
      might: 9, agility: 8, vitality: 18, wits: 8, intellect: 18, resolve: 9, influence: 7,
    }, false).attributes).toBe(65);
  });

  it('prices only the steps above the free package', () => {
    // Highest value keeps a free 4. 5–8 cost 4 each.
    expect(attributeXpAboveFreePackage({
      might: 8, agility: 4, vitality: 3, intellect: 3, resolve: 2, influence: 2, wits: 2,
    }).xp).toBe(16);
  });

  it('excludes the creation Skill budget and counts later Skill ranks', () => {
    const actor = {
      type: 'character',
      system: {
        attributes: {
          might: { value: 4 }, agility: { value: 4 }, vitality: { value: 3 },
          intellect: { value: 3 }, resolve: { value: 2 }, influence: { value: 2 }, wits: { value: 2 },
        },
        skills: { athletics: 8, lore: 4 },
        skillPoints: { unspent: 4, placed: {} },
        points: { xp: 30, xpFree: 8 },
        xp: {
          postCreationProgress: {
            skills: { athletics: 4, lore: 4 },
          },
        },
      },
      items: [],
    };
    const value = appraiseBuild(actor);
    expect(value.attributes).toBe(0);
    expect(value.skills).toBe(4);
    expect(value.powers).toBe(0);
    expect(value.artifacts).toBe(0);
    expect(value.artifactActivation).toBe(0);
    expect(value.net).toBe(4);
    expect(value.unspentXp).toBe(30);
    expect(value.unspentFreeXp).toBe(8);
    expect(value.unspentSkillPoints).toBe(4);
    expect(value.skillBasis).toBe('creation-cap');
  });

  it('does not charge for activating an Artifact or for level 1', () => {
    const actor = {
      type: 'character',
      system: { attributes: {}, skills: {}, points: {}, xp: {} },
      items: [
        { type: 'artifact', name: 'Lamp', system: { level: 1 } },
        { type: 'artifact', name: 'Blade', system: { level: 2 } },
        { type: 'power', name: 'Strike', system: { level: 2, category: 'active' } },
      ],
    };
    const value = appraiseBuild(actor);
    expect(value.artifacts).toBe(8);
    expect(value.artifactActivation).toBe(0);
    expect(value.powers).toBe(0);
    expect(value.net).toBe(8);
  });

  it('prices Echo Artifact levels above 1, and charges an extra Active from rank 1', () => {
    const actor = {
      type: 'character',
      system: { attributes: {}, skills: {}, points: {}, xp: {} },
      items: [
        { type: 'artifact', name: 'Dragon Claws - Level 3-1', system: { level: 3 }, flags: { 'mastery-system': { echoBound: true } } },
        { type: 'artifact', name: 'Dragon Head - Level 3-1', system: { level: 3 }, flags: { 'mastery-system': { echoBound: true } } },
        { type: 'artifact', name: 'Serpent Scales - Level 2-1', system: { level: 2 }, flags: { 'mastery-system': { echoBound: true } } },
        { type: 'power', name: 'Strike', system: { level: 2, category: 'active' } },
        { type: 'power', name: 'Second', system: { level: 2, category: 'active' } },
        { type: 'power', name: 'Bought', system: { level: 2, category: 'active' } },
      ],
    };
    const value = appraiseBuild(actor);
    // L3 = 8+8, L3 = 8+8, L2 = 8. Level 1 stays free.
    expect(value.artifacts).toBe(40);
    expect(value.powers).toBe(6);
  });

  it('puts Bonus XP, history, and reset on the build table', () => {
    const html = buildValueTableHtml([{
      id: 'scurry',
      type: 'character',
      name: 'Scurry',
      system: { points: { xpFree: 55 }, attributes: {}, skills: {}, xp: {} },
      items: [{ type: 'artifact', name: 'Blade', system: { level: 2 } }],
    }]);
    expect(html).toContain('grant-free-xp-btn');
    expect(html).toContain('deduct-free-xp-btn');
    expect(html).toContain('history-xp-btn');
    expect(html).toContain('reset-progress-xp-btn');
    expect(html).toContain('>55<');
    expect(html).toContain('>63<');
    expect(html).not.toContain('grant-xp-btn');
  });
});
