import { describe, expect, it, vi } from 'vitest';
import {
  applyHealHpAcrossOpenBars,
  formatHealResultChat,
  formatHealRollPromptChat,
  formatScarredPromptChat,
  getHealDiceFormula,
  getHlrRemainingOnCaster,
  healHealthLevelRecoveryForRank,
  healPowerHlrKey,
  healPowerItemFromRadialOption,
  isHealPowerItem,
  isHealRadialOption,
} from '../src/combat/heal-resolution';
import { countScarredHealthBars } from '../src/stones/remove-scar';

describe('healHealthLevelRecoveryForRank', () => {
  it('matches catalog bands (max 4)', () => {
    expect(healHealthLevelRecoveryForRank(1)).toBe(0);
    expect(healHealthLevelRecoveryForRank(3)).toBe(0);
    expect(healHealthLevelRecoveryForRank(4)).toBe(1);
    expect(healHealthLevelRecoveryForRank(8)).toBe(2);
    expect(healHealthLevelRecoveryForRank(12)).toBe(3);
    expect(healHealthLevelRecoveryForRank(15)).toBe(4);
    expect(healHealthLevelRecoveryForRank(16)).toBe(4);
  });
});

describe('HLR pool on caster', () => {
  it('tracks remaining against spent flag', () => {
    const power = {
      id: 'heal-1',
      type: 'power',
      system: { rank: 8, templateId: 'active-ranged-single-heal' },
    };
    const flags: Record<string, unknown> = {
      'mastery-system:healthLevelRecoverySpent': { 'heal-1': 1 },
    };
    const caster = {
      getFlag: vi.fn((scope: string, key: string) => flags[`${scope}:${key}`]),
    };
    expect(healPowerHlrKey(power)).toBe('heal-1');
    expect(getHlrRemainingOnCaster(caster, power)).toBe(1); // pool 2 − spent 1
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

describe('artifact heal radial (Moonlight Mending)', () => {
  it('detects artifact heal rows and resolves 10d8 at stage I', () => {
    const artifactItem = { type: 'artifact', id: 'mg', name: 'Moonlight Greatsword' };
    const option = {
      source: 'power' as const,
      name: 'Moonlight Mending I',
      description: 'Heal one creature for 10d8 HP · Range: 20 m',
      item: artifactItem,
      artifactPowerTemplateId: 'active-ranged-single-heal',
      artifactRowLevel: 1,
      aoePlacementProfile: 'heal' as const,
    };
    expect(isHealRadialOption(option)).toBe(true);
    const power = healPowerItemFromRadialOption(option as any);
    expect(power?.type).toBe('power');
    expect(getHealDiceFormula(power)).toBe('10d8');
  });
});

describe('countScarredHealthBars', () => {
  it('counts Scarred on array and numeric-key object bars', () => {
    const bars = [
      { name: 'Healthy', max: 40, current: 0 },
      { name: 'Bruised', max: 40, current: 0 },
      { name: 'Injured', max: 40, current: 0 },
      { name: 'Wounded', max: 40, current: 12 },
    ];
    expect(countScarredHealthBars({ system: { health: { bars } } })).toBe(3);
    expect(
      countScarredHealthBars({
        system: { health: { bars: { 0: bars[0], 1: bars[1], 2: bars[2], 3: bars[3] } } },
      }),
    ).toBe(3);
  });
});

describe('applyHealHpAcrossOpenBars', () => {
  it('fills only the active bar and does not spill into other open bars', () => {
    const applied = applyHealHpAcrossOpenBars(
      {
        currentBar: 2,
        bars: [
          { name: 'Healthy', max: 40, current: 40 },
          { name: 'Bruised', max: 40, current: 0 },
          { name: 'Injured', max: 40, current: 10 },
        ],
      },
      50,
    );
    expect(applied.bars[1].current).toBe(0);
    expect(applied.bars[2].current).toBe(40);
    expect(applied.bars[0].current).toBe(40);
    expect(applied.restored).toBe(30);
  });
});

describe('heal chat formatting', () => {
  it('includes restored HP and numbered scarred pick buttons', () => {
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
      maxBars: 2,
      scarred: 3,
      poolRemaining: 2,
      poolMax: 2,
      powerName: 'Moonlight Mending',
      formula: '10d8',
    });
    expect(prompt).toMatch(/10d8/);
    expect(prompt).toMatch(/mastery-heal-scarred-pick/);
    expect(prompt).toMatch(/data-bars="0"/);
    expect(prompt).toMatch(/data-bars="1"/);
    expect(prompt).toMatch(/data-bars="2"/);
    expect(prompt).not.toMatch(/data-bars="3"/);
    expect(prompt).toMatch(/2<\/strong> \/ 2/);
    expect(prompt).toMatch(/a1/);
    expect(prompt).toMatch(/roll 10d8/);

    const spent = formatScarredPromptChat({
      healerName: 'Oda',
      targetName: 'Alaris',
      targetActorId: 'a1',
      maxBars: 1,
      scarred: 2,
      poolRemaining: 0,
      poolMax: 1,
      formula: '10d8',
    });
    expect(spent).toMatch(/data-bars="0"/);
    expect(spent).toMatch(/data-bars="1"/);
    expect(spent).toMatch(/disabled/);
    expect(spent).toMatch(/used up/);

    const rollOnly = formatHealRollPromptChat({
      healerName: 'Oda',
      targetName: 'Alaris',
      powerName: 'Moonlight Mending',
      formula: '10d8',
    });
    expect(rollOnly).toMatch(/Roll heal 10d8/);
    expect(rollOnly).toMatch(/mastery-heal-roll-only/);

    const result = formatHealResultChat({
      sourceName: 'Oda',
      powerName: 'Moonlight Mending',
      formula: '10d8',
      scarredRecovered: 1,
      results: [
        {
          tokenId: 't1',
          actorId: 'a1',
          name: 'Alaris',
          rolled: 42,
          afterBlight: 42,
          restored: 30,
          blight: 0,
          scarredBefore: 0,
        },
      ],
    });
    expect(result).toMatch(/ms-heal-amount/);
    expect(result).toMatch(/30/);
    expect(result).toMatch(/42/);
    expect(result).toMatch(/Scarred Health Bars restored/);
  });
});
