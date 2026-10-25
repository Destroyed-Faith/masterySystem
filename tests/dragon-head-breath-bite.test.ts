/**
 * Dragon Head Breath Weapon — Damage Breath includes Bite; Ruin does not;
 * Might/Agility; shared combat/rest uses; other AoE unchanged.
 */
import { describe, expect, it } from 'vitest';
import { ECHO_ARTIFACTS, buildEchoProgressionPicks } from '../src/utils/echo-artifacts.js';
import { deriveLevelProgressionFromPicks } from '../src/artifacts/progression-compiler.js';
import { getTemplate } from '../src/utils/powers/templates/index.js';
import { weaponDamageForLevel } from '../src/utils/artifact-base-derive.js';
import {
  breathDamageRadiusMeters,
  breathPowerDamageDice,
  breathRuinRadiusMeters,
  breathRuinValue,
  damageBreathSharedPoolFormula,
  dragonHeadBiteDamage,
} from '../src/utils/breath-weapon.js';
import { martialWeaponDamageApplies } from '../src/combat/damage-transfer.js';
import { getAttackAttribute } from '../src/combat/attack-executor.js';
import { buildArtifactRadialOptions } from '../src/radial-menu/artifact-options.js';
import {
  assertDragonBreathAvailable,
  clearArtifactCombatUses,
  spendDragonBreathUse,
} from '../src/combat/artifact-rest-uses.js';

function mockActor(opts: {
  masteryRank?: number;
  combatUses?: Record<string, number>;
  restUses?: Record<string, number>;
} = {}) {
  const flags: Record<string, any> = { 'mastery-system': {} };
  if (opts.restUses) flags['mastery-system'].artifactRestUses = { ...opts.restUses };
  if (opts.combatUses) flags['mastery-system'].artifactCombatUses = { ...opts.combatUses };
  return {
    system: { mastery: { rank: opts.masteryRank ?? 4 } },
    flags,
    getFlag(scope: string, key: string) {
      return this.flags?.[scope]?.[key];
    },
    async setFlag(scope: string, key: string, value: unknown) {
      this.flags[scope] = this.flags[scope] || {};
      this.flags[scope][key] = value;
    },
    async unsetFlag(scope: string, key: string) {
      if (this.flags?.[scope]) delete this.flags[scope][key];
    },
  };
}

describe('Dragon Head Bite damage progression L1–10', () => {
  it('Bite is Nd8 across Artifact Levels', () => {
    for (let lvl = 1; lvl <= 10; lvl++) {
      expect(dragonHeadBiteDamage(lvl)).toBe(`${lvl}d8`);
      expect(weaponDamageForLevel(lvl)).toBe(`${lvl}d8`);
    }
  });

  it('Damage Breath shared pool = Bite + Power Dice at stages I/II/III', () => {
    expect(breathPowerDamageDice(1)).toBe(4);
    expect(breathPowerDamageDice(4)).toBe(7);
    expect(breathPowerDamageDice(7)).toBe(13);
    expect(damageBreathSharedPoolFormula(1)).toBe('1d8+4d8');
    expect(damageBreathSharedPoolFormula(4)).toBe('4d8+7d8');
    expect(damageBreathSharedPoolFormula(7)).toBe('7d8+13d8');
    expect(damageBreathSharedPoolFormula(10)).toBe('10d8+13d8');
  });

  it('Scurry at Dragon Head L3: Damage Breath = 3d8 Bite + 4d8 Power = 7d8; +PL4 Damage Buff = 11d8', () => {
    // L3 still uses Breath stage I (PL 4 Power Dice); Bite scales with Artifact Level.
    expect(dragonHeadBiteDamage(3)).toBe('3d8');
    expect(breathPowerDamageDice(3)).toBe(4);
    expect(damageBreathSharedPoolFormula(3)).toBe('3d8+4d8');
    const biteD8 = 3;
    const powerD8 = breathPowerDamageDice(3);
    const buffD8 = 4; // Active Buff: Damage PL4 (canonical rebalance)
    expect(biteD8 + powerD8).toBe(7);
    expect(biteD8 + powerD8 + buffD8).toBe(11);
    expect(
      martialWeaponDamageApplies({
        ignoreWeaponDamage: false,
        instantAoe: true,
        dragonHeadDamageBreath: true,
      }),
    ).toBe(true);
  });

  it('Ruin values and radii match Core PL 4/10/16', () => {
    expect(breathRuinValue(1)).toBe(5);
    expect(breathRuinValue(4)).toBe(9);
    expect(breathRuinValue(7)).toBe(10);
    expect(breathDamageRadiusMeters(1)).toBe(3);
    expect(breathDamageRadiusMeters(4)).toBe(6);
    expect(breathDamageRadiusMeters(7)).toBe(8);
    expect(breathRuinRadiusMeters(1)).toBe(3);
    expect(breathRuinRadiusMeters(4)).toBe(5);
    expect(breathRuinRadiusMeters(7)).toBe(7);
  });
});

describe('Damage Breath weapon-damage exception', () => {
  it('allows Bite on Instant AoE only when dragonHeadDamageBreath is set', () => {
    expect(
      martialWeaponDamageApplies({
        ignoreWeaponDamage: false,
        instantAoe: true,
        dragonHeadDamageBreath: true,
      }),
    ).toBe(true);
    expect(
      martialWeaponDamageApplies({
        ignoreWeaponDamage: false,
        instantAoe: true,
      }),
    ).toBe(false);
    expect(
      martialWeaponDamageApplies({
        ignoreWeaponDamage: true,
        instantAoe: true,
        dragonHeadDamageBreath: true,
      }),
    ).toBe(false);
  });
});

describe('Breath Attack Attribute Might or Agility', () => {
  it('honours attackAttributeOverride without combining pools', () => {
    const actor = { system: { attributes: { might: { value: 4 }, agility: { value: 3 } } } };
    expect(
      getAttackAttribute(actor, null, { attackAttributeOverride: 'might' } as any, 'melee'),
    ).toBe('might');
    expect(
      getAttackAttribute(actor, null, { attackAttributeOverride: 'agility' } as any, 'melee'),
    ).toBe('agility');
  });
});

describe('Shared Combat / Rest Breath uses', () => {
  it('Damage and Ruin share once-per-Combat and SHR ledger', async () => {
    const actor = mockActor({ masteryRank: 4 });
    expect(assertDragonBreathAvailable(actor)).toEqual({ ok: true });
    expect(await spendDragonBreathUse(actor)).toBe(true);
    expect(assertDragonBreathAvailable(actor)).toEqual({ ok: false, reason: 'combat' });
    await clearArtifactCombatUses(actor);
    expect(await spendDragonBreathUse(actor)).toBe(true);
    await clearArtifactCombatUses(actor);
    expect(assertDragonBreathAvailable(actor)).toEqual({ ok: false, reason: 'rest' });
  });
});

describe('Radial emits Damage Breath + Ruin Breath', () => {
  it('surfaces both modes; Damage carries Bite; Ruin does not', () => {
    const flag = (extra: Record<string, unknown> = {}) => (scope: string, key: string) => {
      if (scope !== 'mastery-system') return undefined;
      if (key === 'artifactActivated') return true;
      if (key === 'equipment') return { equipped: true, slot: 'head' };
      return (extra as any)[key];
    };
    const head: any = {
      id: 'dh1',
      type: 'artifact',
      name: 'Dragon Head',
      system: {
        binding: 'echo',
        currentLevel: 4,
        naturalWeapon: { name: 'Bite', weaponType: 'melee', hands: 0 },
        artifactWeapon: { damage: '4d8', name: 'Bite', isNatural: true },
        levelProgression: [
          {
            level: 4,
            name: 'Breath Weapon II',
            type: 'Melee AoE',
            range: 'Self',
            aoe: 'Damage: radius 6 m / Ruin: radius 5 m',
            effect: 'Damage or Ruin',
            powerTemplateId: 'active-melee-weapon-aoe',
          },
        ],
      },
      getFlag: flag(),
      flags: {
        'mastery-system': {
          artifactActivated: true,
          equipment: { equipped: true, slot: 'head' },
        },
      },
    };
    const actor: any = {
      items: [head],
      system: { mastery: { rank: 4 } },
      getFlag: () => undefined,
    };
    const opts = buildArtifactRadialOptions(actor);
    const damage = opts.find((o) => /Damage Breath/i.test(o.name));
    const ruin = opts.find((o) => /Ruin Breath/i.test(o.name));
    expect(damage).toBeTruthy();
    expect(ruin).toBeTruthy();
    expect(damage?.dragonHeadDamageBreath).toBe(true);
    expect(damage?.forcedWeaponItemId).toBe('dh1');
    expect(damage?.ignoreWeaponDamage).toBe(false);
    expect(damage?.burstMeleeRadiusMeters).toBe(6);
    expect(ruin?.dragonHeadBreathMode).toBe('ruin');
    expect(ruin?.ignoreWeaponDamage).toBe(true);
    expect(ruin?.forcedWeaponItemId).toBeUndefined();
    expect(ruin?.artifactRowSpecial).toMatch(/Ruin\(9\)/);
    expect(ruin?.burstMeleeRadiusMeters).toBe(5);
  });
});

describe('Core mapping still uses canonical Melee AoE Attack', () => {
  it('Damage Breath power dice match active-melee-weapon-aoe; texts include Bite', () => {
    const def = ECHO_ARTIFACTS.dragonHead;
    const picks = buildEchoProgressionPicks(def);
    const fromPicks = deriveLevelProgressionFromPicks(picks as any);
    expect(picks[0].powerTemplateId).toBe('active-melee-weapon-aoe');
    const melee = getTemplate('active-melee-weapon-aoe');
    expect(String(melee?.levels?.['4']?.effect?.dice || melee?.levels?.['4']?.mechanics?.damageRider?.flat)).toMatch(
      /4d8/,
    );
    const b1 = fromPicks.find((r) => r.level === 1);
    expect(String(b1?.effect)).toMatch(/Bite Weapon Damage \+ 4d8/);
    expect(String(b1?.effect)).toMatch(/Ruin\(5\)/);
    expect(String(b1?.effect)).toMatch(/Might or Agility/);
    expect(String(b1?.effect)).not.toMatch(/no Bite damage/i);
  });

  it('other Instant AoE templates are unchanged (still no weapon damage by default)', () => {
    expect(
      martialWeaponDamageApplies({
        ignoreWeaponDamage: false,
        instantAoe: true,
      }),
    ).toBe(false);
    const ranged = getTemplate('active-ranged-weapon-aoe');
    expect(ranged?.levels?.['4']?.aoe?.radiusM).toBe(3);
  });
});
