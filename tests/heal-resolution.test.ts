import { describe, expect, it } from 'vitest';
import {
  formatHealResultChat,
  formatScarredPromptChat,
  getHealDiceFormula,
  healHealthLevelRecoveryForRank,
  isHealPowerItem,
} from '../src/combat/heal-resolution';

describe('healHealthLevelRecoveryForRank', () => {
  it('matches catalog bands', () => {
    expect(healHealthLevelRecoveryForRank(1)).toBe(0);
    expect(healHealthLevelRecoveryForRank(3)).toBe(0);
    expect(healHealthLevelRecoveryForRank(4)).toBe(1);
    expect(healHealthLevelRecoveryForRank(8)).toBe(2);
    expect(healHealthLevelRecoveryForRank(12)).toBe(3);
    expect(healHealthLevelRecoveryForRank(15)).toBe(4);
  });
});

describe('isHealPowerItem / getHealDiceFormula', () => {
  it('detects support-heal with damageRider-style healing mechanics', () => {
    const item = {
      type: 'power',
      name: 'Melee Heal',
      system: {
        category: 'active',
        subfamily: 'support-heal',
        templateId: 'active-melee-heal-single',
        rank: 4,
        mechanics: { healing: { flat: '4d8', target: 'target' } },
      },
    };
    expect(isHealPowerItem(item)).toBe(true);
    expect(getHealDiceFormula(item)).toBe('4d8');
  });

  it('detects Health Level Heal without HP formula', () => {
    const item = {
      type: 'power',
      name: 'Melee Health Level Heal',
      system: {
        category: 'active',
        subfamily: 'support-heal',
        templateId: 'active-melee-health-level-heal',
        rank: 8,
        mechanics: {},
      },
    };
    expect(isHealPowerItem(item)).toBe(true);
    expect(getHealDiceFormula(item)).toBeNull();
  });

  it('rejects cleanse support', () => {
    const item = {
      type: 'power',
      name: 'Cleanse',
      system: {
        category: 'active',
        subfamily: 'support-cleanse',
        templateId: 'active-melee-cleanse-single',
        rank: 4,
        mechanics: {},
      },
    };
    expect(isHealPowerItem(item)).toBe(false);
  });
});

describe('heal chat formatting', () => {
  it('includes restored HP and scarred prompt buttons', () => {
    const html = formatHealResultChat({
      sourceName: 'Oda',
      powerName: 'Melee Heal',
      formula: '4d8',
      results: [
        {
          tokenId: 't1',
          actorId: 'a1',
          name: 'Alaris',
          rolled: 20,
          afterBlight: 20,
          restored: 12,
          blight: 0,
          scarredBefore: 1,
        },
      ],
    });
    expect(html).toMatch(/Oda/);
    expect(html).toMatch(/Alaris/);
    expect(html).toMatch(/12/);

    const prompt = formatScarredPromptChat({
      healerName: 'Oda',
      targetName: 'Alaris',
      targetActorId: 'a1',
      maxBars: 1,
      scarred: 1,
    });
    expect(prompt).toMatch(/mastery-heal-scarred-yes/);
    expect(prompt).toMatch(/mastery-heal-scarred-no/);
    expect(prompt).toMatch(/a1/);
  });
});
