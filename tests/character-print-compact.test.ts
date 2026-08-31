import { describe, expect, it } from 'vitest';
import { buildCharacterCompactPrintContext } from '../src/sheets/character-print';

function alarisActor() {
  return {
    type: 'character',
    name: 'Alaris',
    img: 'https://assets.forge-vtt.com/6727fe2e3c793ad173f66d6b/destroyed-Faith%20Adventures/Players/Alaris.png',
    system: {
      bio: { echo: 'Elves' },
      echo: { key: 'elorians', selectedCardIds: ['unseen-grace'] },
      mastery: { rank: 2 },
      attributes: {
        might: { value: 8 },
        agility: { value: 10 },
        vitality: { value: 11 },
        intellect: { value: 8 },
        resolve: { value: 8 },
        influence: { value: 4 },
        wits: { value: 8 },
      },
      stonePools: {
        might: { current: 1, max: 1 },
        agility: { current: 1, max: 1 },
        vitality: { current: 1, max: 1 },
        intellect: { current: 1, max: 1 },
        resolve: { current: 1, max: 1 },
        influence: { current: 0, max: 0 },
        wits: { current: 1, max: 1 },
      },
      combat: {
        speed: 8,
        evadeTotal: 17,
        armorTotal: 2,
        initiative: 0,
        initiativeMasteryRank: 2,
      },
      health: {
        bars: [
          { name: 'Healthy', current: 22, max: 22 },
          { name: 'Bruised', current: 22, max: 22 },
          { name: 'Injured', current: 22, max: 22 },
          { name: 'Wounded', current: 22, max: 22 },
          { name: 'Broken', current: 22, max: 22 },
          { name: 'Incapacitated', current: 1, max: 1 },
        ],
      },
      stress: {
        bars: [
          { current: 16, max: 16 },
          { current: 16, max: 16 },
          { current: 16, max: 16 },
          { current: 16, max: 16 },
        ],
      },
      skills: {
        meleeWeapons: 4,
        perception: 4,
        acrobatics: 4,
        survival: 4,
        combatReflexes: 4,
        defensiveCombat: 4,
        persuasion: 4,
        herbalism: 4,
        occultism: 4,
        stealth: 4,
        athletics: 0,
        lore: 0,
      },
    },
    items: [
      {
        name: 'Passive: Evade',
        type: 'power',
        system: { category: 'passive', rank: 4, level: 4, effect: 'Gain **+8 Evade**.' },
      },
      {
        name: 'Melee Single Attack',
        type: 'power',
        system: {
          category: 'active',
          rank: 2,
          level: 2,
          effect: 'Make **one melee weapon attack**. On hit, deal weapon damage + **4d8 damage**.',
        },
      },
      {
        name: 'Moonlight Greatsword - Level 1-1',
        type: 'artifact',
        system: {
          artifactKind: 'weapon',
          baseTypeKey: 'weapon:greatsword',
          baseProfile: 'twoHandedWeapon',
          freeTrait: 'Finesse',
          currentLevel: 1,
          artifactWeapon: { damage: '5d8' },
          levelProgression: [
            {
              level: 1,
              name: 'Moonlight Mending I',
              type: 'Ranged',
              effect: 'Heal one creature for **10d8 HP**.',
            },
          ],
        },
        flags: { 'mastery-system': { artifactActivated: true } },
      },
    ],
  };
}

describe('compact character print', () => {
  it('uses Alaris play values and omits untrained skills', () => {
    const ctx = buildCharacterCompactPrintContext(alarisActor()) as any;
    expect(ctx.name).toBe('Alaris');
    expect(ctx.echoName).toBe('Elorians');
    expect(ctx.masteryRank).toBe(2);
    expect(ctx.hasPortrait).toBe(true);
    expect(ctx.portrait).toContain('Players/Alaris/Alaris.png');
    expect(ctx.movement).toBe('8 m');
    expect(ctx.evade).toBe(17);
    expect(ctx.armor).toBe(2);
    expect(ctx.initiative).toBe(2);
    expect(ctx.health).toBe('22 × 5 +1');
    expect(ctx.stress).toBe('16 × 4');
    expect(ctx.skills.map((s: any) => s.name)).not.toContain('Athletics');
    expect(ctx.skills.map((s: any) => s.name)).toContain('Melee Weapons');
    expect(ctx.skills.every((s: any) => s.rating > 0)).toBe(true);
    expect(ctx.echoCards[0]?.name).toBe('Unseen Grace');
    expect(ctx.artifacts.some((a: any) => a.name === 'Moonlight Greatsword')).toBe(true);
    expect(JSON.stringify(ctx)).not.toMatch(/Quick Play|Quickplay/i);
  });

  it('marks missing combat totals as [CHECK]', () => {
    const actor = {
      type: 'character',
      name: '',
      system: { mastery: {}, attributes: {}, skills: {}, combat: {} },
      items: [],
    };
    const ctx = buildCharacterCompactPrintContext(actor) as any;
    expect(ctx.name).toBe('[CHECK]');
    expect(ctx.movement).toBe('[CHECK]');
    expect(ctx.evade).toBe('[CHECK]');
    expect(ctx.health).toBe('[CHECK]');
  });
});
