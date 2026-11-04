/**
 * Hunter's Scourge — Scourge Strike Limited Active (Core / Batch 5 C07 final check).
 */
import { describe, expect, it } from 'vitest';
import { ECHO_ARTIFACTS, buildEchoProgressionPicks } from '../src/utils/echo-artifacts.js';
import { resolveFullLevelProgression } from '../src/utils/artifact-visible-abilities.js';
import { visibleAbilityRows } from '../src/utils/artifact-visible-abilities.js';
import { buildEchoArtifactTree } from '../src/artifacts/echo-artifact-tree-builder.js';
import { buildArtifactRadialOptions } from '../src/radial-menu/artifact-options.js';
import {
  applyLimitedPowerDamage,
  isSpecialOnlyAttack,
  isSpecialOnlyTemplateId,
  martialWeaponDamageApplies,
  spellFocusDamageApplies,
} from '../src/combat/damage-transfer.js';
import {
  isLimitedAttackDeclaration,
  isLimitedChargeAvailable,
  spendLimitedCharge,
  LIMITED_CHARGE_FLAG,
} from '../src/combat/limited-charge.js';
import { getTemplate } from '../src/utils/powers/templates/index.js';
import { instantSpecialRank } from '../src/utils/powers/instant-special-ranks.js';
import { bindChosenSpecialIntoLevelData } from '../src/combat/raise-resolution.js';
import { shouldSpendMaximizationAfterNegation } from '../src/combat/maximization-order.js';

const def = ECHO_ARTIFACTS.huntersScourge;

function chargeActor() {
  const actor: any = {
    flags: { 'mastery-system': {} },
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
  return actor;
}

function actorWithScourge(level: number) {
  const tree = buildEchoArtifactTree(def);
  const node = tree.nodes.find(
    (n: any) =>
      n.nodeId === `huntersScourge-l${level}` ||
      Number(n.itemData?.system?.currentLevel) === level,
  );
  expect(node, `Hunter's Scourge L${level}`).toBeTruthy();
  const item = {
    id: (node as any).nodeId,
    type: 'artifact',
    name: (node as any).itemData.name,
    system: { ...(node as any).itemData.system, equipped: true, currentLevel: level },
    getFlag: (_ns: string, key: string) => {
      if (key === 'artifactActivated') return true;
      if (key === 'equipment') return { equipped: true, slot: 'bothHands' };
      return undefined;
    },
    flags: {
      'mastery-system': {
        artifactActivated: true,
        equipment: { equipped: true },
      },
    },
  };
  const actor: any = {
    items: [item],
    system: { mastery: { rank: 4 } },
    flags: { 'mastery-system': {} },
    getFlag(scope: string, key: string) {
      return this.flags?.[scope]?.[key];
    },
    async setFlag(scope: string, key: string, value: unknown) {
      this.flags[scope] = this.flags[scope] || {};
      this.flags[scope][key] = value;
    },
  };
  return actor;
}

describe("Hunter's Scourge — Core progression picks", () => {
  const picks = buildEchoProgressionPicks(def);
  const table = resolveFullLevelProgression(def.levelProgression, picks as any);

  it('pick 1 is Scourge Strike Limited Melee Single Target', () => {
    expect(picks[0].displayName || picks[0].powerTemplateId).toBeTruthy();
    expect(picks[0].powerTemplateId).toBe('active-melee-limited-single');
    expect(picks[0].limited).toBe(true);
    expect(picks[0].kind).toBe('power');
  });

  it('pick 2 is Maximization Support (Vitality); pick 3 is Unmask the Prey (Instant Special Expose)', () => {
    expect(picks[1].kind).toBe('stoneFunction');
    expect((picks[1].stoneFunction as any)?.stonePowerId).toBe('vitality.damageMaximization');
    expect(picks[2].kind).toBe('power');
    expect(picks[2].powerTemplateId).toBe('active-melee-instant-special-t6');
    expect(picks[2].chosenSpecial?.key).toBe('expose');
    expect(String(picks[2].displayName || '')).toMatch(/Unmask the Prey/i);
  });

  it('stages at Artifact L1 / L4 / L7 are Scourge Strike I / II / III', () => {
    const byLevel = new Map(table.map((r) => [Number(r.level), r]));
    expect(byLevel.get(1)?.name).toMatch(/Scourge Strike I/i);
    expect(byLevel.get(4)?.name).toMatch(/Scourge Strike II/i);
    expect(byLevel.get(7)?.name).toMatch(/Scourge Strike III/i);
    for (const lvl of [1, 4, 7] as const) {
      const row = byLevel.get(lvl) as any;
      expect(row?.limited).toBe(true);
      expect(row?.powerTemplateId).toBe('active-melee-limited-single');
      expect(String(row?.effect || '')).toMatch(/global Limited use/i);
    }
    expect(String((byLevel.get(1) as any)?.effect || '')).toMatch(/32d8/);
    expect(String((byLevel.get(4) as any)?.effect || '')).toMatch(/80d8/);
    expect(String((byLevel.get(7) as any)?.effect || '')).toMatch(/128d8/);
  });

  it('higher Scourge Strike stages replace the previous visible row', () => {
    const at1 = visibleAbilityRows(table, 1).map((r) => r.name);
    const at4 = visibleAbilityRows(table, 4).map((r) => r.name);
    const at7 = visibleAbilityRows(table, 7).map((r) => r.name);
    expect(at1.some((n) => /Scourge Strike I/i.test(n))).toBe(true);
    expect(at4.some((n) => /Scourge Strike II/i.test(n))).toBe(true);
    expect(at4.some((n) => /Scourge Strike I\b/i.test(n))).toBe(false);
    expect(at7.some((n) => /Scourge Strike III/i.test(n))).toBe(true);
    expect(at7.some((n) => /Scourge Strike (I|II)\b/i.test(n))).toBe(false);
  });
});

describe("Hunter's Scourge — Scourge Strike damage + Limited charge", () => {
  it('printed PL 4/10/16 Power Dice ×4 → 32 / 80 / 128; Weapon stays ×1', () => {
    const t = getTemplate('active-melee-limited-single')!;
    expect(String(t.levels?.['4']?.effect?.dice)).toMatch(/8d8/);
    expect(String(t.levels?.['10']?.effect?.dice)).toMatch(/20d8/);
    expect(String(t.levels?.['16']?.effect?.dice)).toMatch(/32d8/);
    expect(applyLimitedPowerDamage('8d8', { limited: true })).toBe('32d8');
    expect(applyLimitedPowerDamage('20d8', { limited: true })).toBe('80d8');
    expect(applyLimitedPowerDamage('32d8', { limited: true })).toBe('128d8');
    // Weapon as trailing term is not multiplied.
    expect(applyLimitedPowerDamage('8d8+5d8', { limited: true })).toBe('32d8+5d8');
    expect(
      martialWeaponDamageApplies({
        ignoreWeaponDamage: false,
        powerIsSpell: false,
      }),
    ).toBe(true);
  });

  it('radial options at L1 / L4 / L7 expose Limited Scourge Strike with shared charge gate', async () => {
    for (const level of [1, 4, 7] as const) {
      const actor = actorWithScourge(level);
      const opts = buildArtifactRadialOptions(actor);
      const strike = opts.find((o) => /Scourge Strike/i.test(o.name));
      expect(strike, `L${level} Scourge Strike`).toBeTruthy();
      expect((strike as any).artifactLimited).toBe(true);
      expect((strike as any).limited).toBe(true);
      expect(strike!.ignoreWeaponDamage).not.toBe(true);
      expect(
        isLimitedAttackDeclaration({
          limited: true,
          artifactLimited: true,
          templateId: 'active-melee-limited-single',
        }),
      ).toBe(true);
      expect(isLimitedChargeAvailable(actor)).toBe(true);
      expect(strike!.disabled).not.toBe(true);

      await spendLimitedCharge(actor);
      expect(actor.flags['mastery-system'][LIMITED_CHARGE_FLAG]).toBe(true);
      const after = buildArtifactRadialOptions(actor);
      const locked = after.find((o) => /Scourge Strike/i.test(o.name));
      expect(locked?.disabled).toBe(true);
      expect(isLimitedChargeAvailable(actor)).toBe(false);
    }
  });

  it('Maximization Support does not restore or grant Limited charges', async () => {
    const actor = chargeActor();
    await spendLimitedCharge(actor);
    // Artifact level-up into Maximization Support stages must leave charge spent.
    expect(isLimitedChargeAvailable(actor)).toBe(false);
    const picks = buildEchoProgressionPicks(def);
    expect((picks[1].stoneFunction as any)?.stonePowerId).toBe('vitality.damageMaximization');
  });
});

describe("Hunter's Scourge — Unmask the Prey (Special-only Expose)", () => {
  const picks = buildEchoProgressionPicks(def);
  const table = resolveFullLevelProgression(def.levelProgression, picks as any);

  it('uses Instant Special T6 + Expose with specialOnly mechanics (not Special Damage)', () => {
    expect(picks[2].powerTemplateId).toBe('active-melee-instant-special-t6');
    expect(picks[2].powerTemplateId).not.toMatch(/damage-t/);
    expect(isSpecialOnlyTemplateId('active-melee-instant-special-t6')).toBe(true);
    const tpl = getTemplate('active-melee-instant-special-t6')!;
    expect(tpl.levels?.['4']?.mechanics?.specialOnly).toBe(true);
    expect(tpl.levels?.['10']?.mechanics?.specialOnly).toBe(true);
    expect(tpl.levels?.['16']?.mechanics?.specialOnly).toBe(true);
  });

  it('binds Expose(5)/(8)/(10) at PL 4/10/16', () => {
    expect(instantSpecialRank('melee', 'expose', 4)).toBe(5);
    expect(instantSpecialRank('melee', 'expose', 10)).toBe(8);
    expect(instantSpecialRank('melee', 'expose', 16)).toBe(10);
    const tpl = getTemplate('active-melee-instant-special-t6')!;
    for (const [pl, rank] of [
      [4, 5],
      [10, 8],
      [16, 10],
    ] as const) {
      const bound = bindChosenSpecialIntoLevelData(
        (tpl.levels as any)[String(pl)],
        'expose',
        'active-melee-instant-special-t6',
        pl,
      );
      expect(bound.specials[0]).toEqual(expect.objectContaining({ key: 'expose', rank }));
    }
  });

  it('compiled L3/6/9 rows keep Instant Special identity and special-only effect text', () => {
    for (const lvl of [3, 6, 9] as const) {
      const row = table.find((r) => Number(r.level) === lvl) as any;
      expect(row?.name).toMatch(/Unmask the Prey/i);
      expect(row?.powerTemplateId).toBe('active-melee-instant-special-t6');
      expect(row?.chosenSpecialKey).toBe('expose');
      expect(String(row?.effect || '')).toMatch(/Special-only/i);
      expect(String(row?.effect || '')).not.toMatch(/Weapon Damage normally/i);
    }
  });

  it('runtime axes: no Weapon / Focus / Maximization on the Unmask template', () => {
    const flags = {
      selectedPowerTemplateId: 'active-melee-instant-special-t6',
    };
    expect(isSpecialOnlyAttack(flags)).toBe(true);
    expect(martialWeaponDamageApplies(flags as any)).toBe(false);
    expect(spellFocusDamageApplies({ isSpell: true, ...flags } as any)).toBe(false);
    expect(
      shouldSpendMaximizationAfterNegation({
        wantMaximization: true,
        remainingDice: 8,
        specialOnly: true,
      }),
    ).toBe(false);
  });

  it('radial Unmask option is specialOnly and ignores weapon damage', () => {
    const actor = actorWithScourge(3);
    const opts = buildArtifactRadialOptions(actor);
    const unmask = opts.find((o) => /Unmask the Prey/i.test(o.name));
    expect(unmask).toBeTruthy();
    expect((unmask as any).artifactPowerTemplateId).toBe('active-melee-instant-special-t6');
    expect((unmask as any).specialOnly).toBe(true);
    expect(unmask!.ignoreWeaponDamage).toBe(true);
    expect((unmask as any).artifactChosenSpecialKey).toBe('expose');
  });
});
