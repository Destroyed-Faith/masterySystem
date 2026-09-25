import { describe, expect, it } from 'vitest';
import { appraiseBuild, attributeXpAboveFreePackage } from '../src/progression/build-value';

describe('build value at current rules', () => {
  it('prices nothing for the free Attribute package', () => {
    expect(attributeXpAboveFreePackage({
      might: 4, agility: 4, vitality: 3, intellect: 3, resolve: 2, influence: 2, wits: 2,
    }).xp).toBe(0);
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

  it('does not price an Echo Artifact, and charges an extra Active from rank 1', () => {
    const actor = {
      type: 'character',
      system: { attributes: {}, skills: {}, points: {}, xp: {} },
      items: [
        { type: 'artifact', name: 'Echo', system: { level: 8 }, flags: { 'mastery-system': { echoBound: true } } },
        { type: 'power', name: 'Strike', system: { level: 2, category: 'active' } },
        { type: 'power', name: 'Second', system: { level: 2, category: 'active' } },
        { type: 'power', name: 'Bought', system: { level: 2, category: 'active' } },
      ],
    };
    const value = appraiseBuild(actor);
    expect(value.artifacts).toBe(0);
    expect(value.powers).toBe(6);
  });
});
