import { describe, expect, it } from 'vitest';
import {
  formatCleansePromptChat,
  getCleanseRankFromPower,
  isCleansePowerItem,
  listCleansableForActor,
} from '../src/combat/cleanse-resolution';

describe('isCleansePowerItem / getCleanseRankFromPower', () => {
  it('reads Cleanse rank from level specials', () => {
    const item = {
      type: 'power',
      name: 'Melee Single-Target Cleanse',
      system: {
        category: 'active',
        subfamily: 'support-cleanse',
        templateId: 'active-melee-single-cleanse',
        rank: 4,
        levels: {
          '4': {
            specials: [{ key: 'cleanse', rank: 2 }],
            effectText: 'Remove one negative effect up to **Cleanse(2)**.',
          },
        },
      },
    };
    expect(isCleansePowerItem(item)).toBe(true);
    expect(getCleanseRankFromPower(item)).toBe(2);
  });

  it('parses Cleanse(N) from effect text when specials missing', () => {
    const item = {
      type: 'power',
      name: 'Cleanse',
      system: {
        category: 'active',
        subfamily: 'support-cleanse',
        templateId: 'active-ranged-single-cleanse',
        rank: 6,
        levels: {
          '6': { effectText: 'Remove one negative effect up to **Cleanse(3)**.' },
        },
      },
    };
    expect(getCleanseRankFromPower(item)).toBe(3);
  });
});

describe('formatCleansePromptChat', () => {
  it('renders heal-style +/− allocation controls for eligible specials', () => {
    const html = formatCleansePromptChat({
      casterName: 'Oda',
      powerName: 'Cleanse',
      targetName: 'Alaris',
      targetActorId: 'a1',
      cleanseX: 5,
      specials: [
        { id: 'hex', label: 'Hex', value: 4 },
        { id: 'sundered', label: 'Sundered', value: 2 },
      ],
    });
    expect(html).toMatch(/Cleanse\(5\)/);
    expect(html).toMatch(/ms-cleanse-plus/);
    expect(html).toMatch(/ms-cleanse-minus/);
    expect(html).toMatch(/ms-cleanse-apply/);
    expect(html).toMatch(/Apply Cleanse/);
    expect(html).toMatch(/Hex/);
    expect(html).toMatch(/\(4\)/);
    expect(html).toMatch(/data-target-actor-id="a1"/);
    expect(html).toMatch(/ms-cleanse-remaining/);
  });
});

describe('listCleansableForActor', () => {
  it('reads cleansable stacks from the battle actor system data', () => {
    const actor = {
      id: 'tok-a',
      system: {
        statusEffects: [
          { id: 'hex', name: 'Hex', value: 3 },
          { id: 'stunned', name: 'Stunned', value: 1 },
        ],
      },
    };
    const rows = listCleansableForActor(actor);
    expect(rows.some((r) => r.id === 'hex' && r.value === 3)).toBe(true);
  });
});
