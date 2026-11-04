/**
 * Batch 5 C07 — Limited Powers (2026-11-04):
 * ×4 printed Power Dice once; four Limited Instant Damage templates;
 * one global Limited charge per Safe Haven Rest (shared by learned + artifacts).
 */
import { describe, expect, it } from 'vitest';
import { getTemplate, getTemplatesBySubfamily } from '../src/utils/powers/templates/index.js';
import {
  applyLimitedPowerDamage,
  martialWeaponDamageApplies,
  spellFocusDamageApplies,
} from '../src/combat/damage-transfer.js';
import {
  LIMITED_POWER_TEMPLATE_IDS,
  clearLimitedCharge,
  isForbiddenLimitedTemplateId,
  isLimitedAttackDeclaration,
  isLimitedChargeAvailable,
  isLimitedPowerTemplateId,
  limitedChargeRemaining,
  spendLimitedCharge,
  LIMITED_CHARGE_FLAG,
} from '../src/combat/limited-charge.js';
import {
  moonlightJudgmentMaxUses,
  assertMoonlightJudgmentAvailable,
  spendMoonlightJudgmentUse,
} from '../src/combat/artifact-rest-uses.js';
import { GENERAL_ARTIFACTS } from '../src/utils/general-artifacts.js';
import { buildEchoProgressionPicks } from '../src/utils/echo-artifacts.js';
import { resolveFullLevelProgression } from '../src/utils/artifact-visible-abilities.js';

function chargeActor(spent = false) {
  const actor: any = {
    flags: {
      'mastery-system': spent ? { [LIMITED_CHARGE_FLAG]: true } : {},
    },
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

function printedDiceAt(templateId: string, pl: number): number {
  const lvl = getTemplate(templateId)?.levels?.[String(pl)];
  const raw = String(lvl?.effect?.dice || lvl?.mechanics?.damageRider?.flat || '');
  const m = raw.match(/(\d+)d8/i);
  return m ? Number(m[1]) : -1;
}

describe('C07 — four Limited Power types in catalog', () => {
  it('registers exactly the four Limited Instant Damage templates', () => {
    expect([...LIMITED_POWER_TEMPLATE_IDS]).toEqual([
      'active-melee-limited-single',
      'active-ranged-limited-single',
      'active-melee-limited-aoe',
      'active-ranged-limited-aoe',
    ]);
    for (const id of LIMITED_POWER_TEMPLATE_IDS) {
      const t = getTemplate(id);
      expect(t, id).toBeTruthy();
      expect(t!.limited).toBe(true);
      expect(isLimitedPowerTemplateId(id)).toBe(true);
    }
  });

  it('keeps own Technical References and independent PL rows (1–16)', () => {
    const limited = getTemplatesBySubfamily('active', 'limited-attack');
    expect(limited.map((t) => t.templateId).sort()).toEqual([...LIMITED_POWER_TEMPLATE_IDS].sort());
    for (const id of LIMITED_POWER_TEMPLATE_IDS) {
      const t = getTemplate(id)!;
      expect(t.templateId).toBe(id);
      expect(t.levels?.['1']).toBeTruthy();
      expect(t.levels?.['16']).toBeTruthy();
      expect(t.templateId).not.toMatch(/weapon-single|weapon-aoe|weapon-split|weapon-autofire/);
    }
  });
});

describe('C07 — ×4 printed Power Dice only', () => {
  it('multiplies printed base Power Dice by 4', () => {
    expect(applyLimitedPowerDamage('8d8', { limited: true })).toBe('32d8');
    expect(applyLimitedPowerDamage('+3d8', { limited: true })).toBe('+12d8');
    expect(applyLimitedPowerDamage('4d8', { limited: false })).toBe('4d8');
  });

  it('does not ×16 when alreadyMultiplied / catalog already stores Limited output', () => {
    expect(applyLimitedPowerDamage('32d8', { limited: true, alreadyMultiplied: true })).toBe('32d8');
    expect(applyLimitedPowerDamage('12d8', { limited: true, alreadyMultiplied: true })).toBe('12d8');
  });

  it('leaves Weapon / Focus / Raise / external bonus terms at ×1 (leading Power only)', () => {
    // Leading Power Dice ×4; trailing weapon/focus/bonus terms unchanged.
    expect(applyLimitedPowerDamage('8d8+4d8', { limited: true })).toBe('32d8+4d8');
    expect(applyLimitedPowerDamage('3d8+4d8+2d8', { limited: true })).toBe('12d8+4d8+2d8');
    expect(martialWeaponDamageApplies({ ignoreWeaponDamage: false, powerIsSpell: false })).toBe(
      true,
    );
    expect(spellFocusDamageApplies({ isSpell: true, instantAoe: true })).toBe(true);
  });

  it("Hunter's Scourge Limited Melee ST curve: PL 4/10/16 → 8→32 / 20→80 / 32→128", () => {
    expect(printedDiceAt('active-melee-limited-single', 4)).toBe(8);
    expect(printedDiceAt('active-melee-limited-single', 10)).toBe(20);
    expect(printedDiceAt('active-melee-limited-single', 16)).toBe(32);
    expect(applyLimitedPowerDamage('8d8', { limited: true })).toBe('32d8');
    expect(applyLimitedPowerDamage('20d8', { limited: true })).toBe('80d8');
    expect(applyLimitedPowerDamage('32d8', { limited: true })).toBe('128d8');
  });

  it('Moonlight Judgment Limited Ranged AoE: PL 4/10/16 → 3→12 / 4→16 / 8→32', () => {
    expect(printedDiceAt('active-ranged-limited-aoe', 4)).toBe(3);
    expect(printedDiceAt('active-ranged-limited-aoe', 10)).toBe(4);
    expect(printedDiceAt('active-ranged-limited-aoe', 16)).toBe(8);
    expect(applyLimitedPowerDamage('3d8', { limited: true })).toBe('12d8');
    expect(applyLimitedPowerDamage('4d8', { limited: true })).toBe('16d8');
    expect(applyLimitedPowerDamage('8d8', { limited: true })).toBe('32d8');
    // Focus once (not ×4) when unlocked — Focus is a trailing term.
    expect(applyLimitedPowerDamage('4d8+4d8', { limited: true })).toBe('16d8+4d8');
  });
});

describe('C07 — global Limited charge', () => {
  it('spends at declaration even when the attack would miss / fail', async () => {
    const actor = chargeActor();
    expect(isLimitedChargeAvailable(actor)).toBe(true);
    const spent = await spendLimitedCharge(actor);
    expect(spent.ok).toBe(true);
    expect(limitedChargeRemaining(actor)).toBe(0);
    // Miss / resisted / empty AoE still leave the charge spent.
    expect(isLimitedChargeAvailable(actor)).toBe(false);
  });

  it('AoE multi-target spends exactly one charge', async () => {
    const actor = chargeActor();
    expect((await spendLimitedCharge(actor)).ok).toBe(true);
    // Second "target" / resolver path with same declaration option flag is idempotent.
    expect(
      (await spendLimitedCharge(actor, { alreadySpentOnOption: true })).ok,
    ).toBe(true);
    expect(limitedChargeRemaining(actor)).toBe(0);
    expect((await spendLimitedCharge(actor)).ok).toBe(false);
  });

  it('second Limited Power of the same character is blocked after spend', async () => {
    const actor = chargeActor();
    await spendLimitedCharge(actor);
    expect(
      isLimitedAttackDeclaration({
        limited: true,
        templateId: 'active-melee-limited-single',
      }),
    ).toBe(true);
    expect(
      isLimitedAttackDeclaration({
        limited: true,
        templateId: 'active-ranged-limited-aoe',
      }),
    ).toBe(true);
    expect(isLimitedChargeAvailable(actor)).toBe(false);
  });

  it('artifact-granted Limited (Moonlight Judgment) shares the global charge', async () => {
    const actor = chargeActor();
    expect(moonlightJudgmentMaxUses(2)).toBe(1);
    expect(moonlightJudgmentMaxUses(8)).toBe(1);
    expect(assertMoonlightJudgmentAvailable(actor, 2)).toBe(true);
    expect(await spendMoonlightJudgmentUse(actor, 2)).toBe(true);
    expect(assertMoonlightJudgmentAvailable(actor, 8)).toBe(false);
    expect(isLimitedChargeAvailable(actor)).toBe(false);
    // Learned Limited after artifact spend is also blocked.
    expect((await spendLimitedCharge(actor)).ok).toBe(false);
  });

  it('new combat does not reset; Safe Haven Rest does', async () => {
    const actor = chargeActor();
    await spendLimitedCharge(actor);
    // Simulate combat end: no clearLimitedCharge call.
    expect(isLimitedChargeAvailable(actor)).toBe(false);
    await clearLimitedCharge(actor);
    expect(isLimitedChargeAvailable(actor)).toBe(true);
  });

  it('reload / re-open sheet keeps spent state via actor flag', () => {
    const actor = chargeActor(true);
    // Fresh reader over the same flag payload (sheet re-open / reload).
    const reopened = chargeActor(false);
    reopened.flags = structuredClone(actor.flags);
    expect(limitedChargeRemaining(reopened)).toBe(0);
    expect(isLimitedChargeAvailable(reopened)).toBe(false);
  });

  it('artifact level-up does not restore a spent charge', async () => {
    const actor = chargeActor();
    await spendLimitedCharge(actor);
    // Raising artifact stage formerly raised Judgment max uses; must stay spent.
    expect(assertMoonlightJudgmentAvailable(actor, 8)).toBe(false);
    expect(moonlightJudgmentMaxUses(8)).toBe(1);
    expect(isLimitedChargeAvailable(actor)).toBe(false);
  });
});

describe('C07 — eligibility + normal attacks', () => {
  it('forbids Special-only, Autofire, Split, and Damage Transfer as Limited', () => {
    const forbidden = [
      'active-melee-instant-special-t3',
      'active-ranged-instant-special-t4',
      'active-ranged-weapon-autofire',
      'active-melee-weapon-split',
      'active-ranged-weapon-split',
      'active-melee-single-target-damage-transfer',
      'active-ranged-single-target-damage-transfer',
    ];
    for (const id of forbidden) {
      expect(isForbiddenLimitedTemplateId(id), id).toBe(true);
      expect(
        isLimitedAttackDeclaration({ limited: true, templateId: id }),
        id,
      ).toBe(false);
    }
  });

  it('Moonlight Judgment uses Limited Ranged AoE template with global-use text', () => {
    const def = GENERAL_ARTIFACTS.moonlightGreatsword;
    const picks = buildEchoProgressionPicks(def as any);
    expect(picks[1].powerTemplateId).toBe('active-ranged-limited-aoe');
    expect(picks[1].limited).toBe(true);
    const table = resolveFullLevelProgression(def.levelProgression, picks as any);
    const j8 = table.find((r) => Number(r.level) === 8) as any;
    expect(String(j8?.effect || '')).toMatch(/12d8|16d8|32d8/);
    expect(String(j8?.effect || '')).toMatch(/global Limited use/i);
    // Mending / Shadow unchanged kinds.
    expect(picks[0].powerTemplateId).toBe('active-ranged-single-heal');
    expect(picks[2].powerTemplateId).toBe('ab-sundered-aura');
  });

  it('normal non-Limited attacks stay unchanged (no ×4, no charge spend)', async () => {
    const actor = chargeActor();
    expect(applyLimitedPowerDamage('8d8', { limited: false })).toBe('8d8');
    expect(
      isLimitedAttackDeclaration({
        templateId: 'active-melee-weapon-single',
        item: { system: { limited: false, templateId: 'active-melee-weapon-single' } },
      }),
    ).toBe(false);
    expect(isLimitedChargeAvailable(actor)).toBe(true);
    expect(printedDiceAt('active-melee-weapon-single', 4)).toBe(8);
    expect(printedDiceAt('active-ranged-weapon-aoe', 16)).toBe(8);
  });
});
