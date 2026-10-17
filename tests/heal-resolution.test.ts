import { describe, expect, it, vi } from 'vitest';
import {
  applyHealHpAcrossOpenBars,
  formatHealResultChat,
  formatHealRollPromptChat,
  formatScarredPromptChat,
  getHealDiceFormula,
  getHlrRemainingOnCaster,
  getPowerHlrPoolMax,
  healHealthLevelRecoveryForRank,
  healPowerHlrKey,
  healPowerItemFromRadialOption,
  isHealPowerItem,
  isHealRadialOption,
} from '../src/combat/heal-resolution';
import { countScarredHealthBars } from '../src/stones/remove-scar';
import {
  HL_HEAL_MELEE_POOL,
  HL_HEAL_RANGED_POOL,
} from '../src/utils/powers/templates/actives';

describe('healHealthLevelRecoveryForRank', () => {
  it('matches catalog bands for HP-heal Actives (max 4)', () => {
    expect(healHealthLevelRecoveryForRank(1)).toBe(0);
    expect(healHealthLevelRecoveryForRank(3)).toBe(0);
    expect(healHealthLevelRecoveryForRank(4)).toBe(1);
    expect(healHealthLevelRecoveryForRank(8)).toBe(2);
    expect(healHealthLevelRecoveryForRank(12)).toBe(3);
    expect(healHealthLevelRecoveryForRank(15)).toBe(4);
    expect(healHealthLevelRecoveryForRank(16)).toBe(4);
  });
});

describe('Scarred Bar Restoration pool', () => {
  it('uses Restoration catalog pools, not the HP-heal HLR band', () => {
    // Ranged L11 = 7 (rules); old bug used healHealthLevelRecoveryForRank → 2.
    expect(HL_HEAL_RANGED_POOL[10]).toBe(7);
    expect(HL_HEAL_MELEE_POOL[9]).toBe(7); // Melee L10
    const ranged = {
      id: 'rest-r',
      type: 'power',
      system: {
        rank: 11,
        templateId: 'active-ranged-health-level-heal',
        levels: { '11': { mechanics: { healthLevelRecovery: 7 } } },
      },
    };
    expect(getPowerHlrPoolMax(ranged)).toBe(7);
    expect(healHealthLevelRecoveryForRank(11)).toBe(2);
  });
});

describe('HLR pool on caster', () => {
  it('tracks remaining against spent flag', () => {
    const power = {
      id: 'heal-1',
      type: 'power',
      // R-05: Ranged ST Restoration — pool from the catalog table (PL8 = 5), not the retired HP-heal band.
      system: { rank: 8, templateId: 'active-ranged-health-level-heal' },
    };
    const flags: Record<string, unknown> = {
      'mastery-system:healthLevelRecoverySpent': { 'heal-1': 1 },
    };
    const caster = {
      getFlag: vi.fn((scope: string, key: string) => flags[`${scope}:${key}`]),
    };
    expect(healPowerHlrKey(power)).toBe('heal-1');
    expect(getHlrRemainingOnCaster(caster, power)).toBe(4); // pool 5 − spent 1
  });

  it('Restoration remaining uses the full Scarred pool', () => {
    const power = {
      id: 'rest-1',
      type: 'power',
      system: {
        rank: 11,
        templateId: 'active-ranged-health-level-heal',
        levels: { '11': { mechanics: { healthLevelRecovery: 7 } } },
      },
    };
    const flags: Record<string, unknown> = {
      'mastery-system:healthLevelRecoverySpent': { 'rest-1': 2 },
    };
    const caster = {
      getFlag: vi.fn((scope: string, key: string) => flags[`${scope}:${key}`]),
    };
    expect(getHlrRemainingOnCaster(caster, power)).toBe(5); // 7 − 2
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
      name: 'Melee Scarred Bar Restoration',
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

describe('artifact restoration radial (Moonlight Mending, R-05)', () => {
  const artifactItem = { type: 'artifact', id: 'mg', name: 'Moonlight Greatsword' };
  const mending = (level: number, name: string) => ({
    source: 'power' as const,
    name,
    description: 'Restore Scarred Health Bars · Range: 20 m',
    item: artifactItem,
    artifactPowerTemplateId: 'active-ranged-health-level-heal',
    artifactRowLevel: level,
    aoePlacementProfile: 'heal' as const,
  });

  it('detects artifact restoration rows: no heal dice, pool 2 / 6 / 10 at PL 4 / 10 / 16', () => {
    const stages: Array<[number, string, number, number]> = [
      [1, 'Moonlight Mending I', 4, 2],
      [4, 'Moonlight Mending II', 10, 6],
      [7, 'Moonlight Mending III', 16, 10],
    ];
    for (const [level, name, pl, pool] of stages) {
      const option = mending(level, name);
      expect(isHealRadialOption(option)).toBe(true);
      const power = healPowerItemFromRadialOption(option as any);
      expect(power?.type).toBe('power');
      expect(power.system.rank).toBe(pl);
      expect(getHealDiceFormula(power)).toBeNull();
      expect(getPowerHlrPoolMax(power)).toBe(pool);
    }
  });

  it('maps authored Echo rows (Hearth Circle / Remembered Hands) by template id or printed text', () => {
    const hearth = {
      source: 'power' as const,
      name: 'Hearth Circle II',
      description: 'Restore up to 9 Scarred Health Bars · Melee AoE Restoration (PL 16)',
      item: { type: 'artifact', id: 'rc', name: 'Ringchain of Kept Names' },
      artifactPowerTemplateId: 'active-melee-aoe-restoration',
      artifactRowLevel: 8,
      aoePlacementProfile: 'heal' as const,
    };
    expect(isHealRadialOption(hearth)).toBe(true);
    const hearthPower = healPowerItemFromRadialOption(hearth as any);
    expect(getPowerHlrPoolMax(hearthPower)).toBe(9);

    // No template id on the row (older world copy): inferred from the printed technical reference.
    const textOnly = {
      source: 'power' as const,
      name: 'Remembered Hands II',
      description: 'Restore up to 10 Scarred Health Bars · Ranged Single Target Restoration (PL 16)',
      artifactRowSpecial: 'Ranged Single Target Restoration (PL 16)',
      item: { type: 'artifact', id: 'rc', name: 'Ringchain of Kept Names' },
      artifactRowLevel: 7,
      aoePlacementProfile: 'heal' as const,
    };
    expect(isHealRadialOption(textOnly)).toBe(true);
    const textPower = healPowerItemFromRadialOption(textOnly as any);
    expect(textPower.system.templateId).toBe('active-ranged-health-level-heal');
    expect(getHealDiceFormula(textPower)).toBeNull();
    expect(getPowerHlrPoolMax(textPower)).toBe(10);
  });

  it('migrates legacy "Heal 10d8" artifact rows to Restoration (never an HP dice heal)', () => {
    const legacy = {
      source: 'power' as const,
      name: 'Moonlight Mending I',
      description: 'Heal one creature for 10d8 HP · Range: 20 m',
      item: artifactItem,
      artifactRowLevel: 1,
      aoePlacementProfile: 'heal' as const,
    };
    expect(isHealRadialOption(legacy)).toBe(true);
    const power = healPowerItemFromRadialOption(legacy as any);
    expect(power.system.templateId).toBe('active-ranged-health-level-heal');
    expect(getHealDiceFormula(power)).toBeNull();
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
