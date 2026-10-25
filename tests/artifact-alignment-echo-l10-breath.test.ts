/**
 * Echo Artifact L1–10 Core alignment: every L10 is Artifact Awakening,
 * Dragon Head Breath maps to Melee AoE Attack / Ruin (no Bite), and
 * Safe Haven / combat-once rest-use helpers.
 */
import { describe, expect, it } from 'vitest';
import { ECHO_ARTIFACTS, buildEchoProgressionPicks } from '../src/utils/echo-artifacts.js';
import { GENERAL_ARTIFACTS } from '../src/utils/general-artifacts.js';
import { deriveLevelProgressionFromPicks } from '../src/artifacts/progression-compiler.js';
import { resolveFullLevelProgression } from '../src/utils/artifact-visible-abilities.js';
import { getTemplate } from '../src/utils/powers/templates/index.js';
import {
  breathDamageRadiusMeters,
  breathRuinRadiusMeters,
  breathWeaponRowDisplay,
} from '../src/utils/breath-weapon.js';
import {
  assertDragonBreathAvailable,
  assertMoonlightJudgmentAvailable,
  assertMoonlightShadowAvailable,
  clearArtifactCombatUses,
  clearArtifactRestUses,
  dragonBreathRestMaxUses,
  halfMasteryRankUses,
  moonlightJudgmentMaxUses,
  moonlightShadowMaxUses,
  spendDragonBreathUse,
  spendMoonlightJudgmentUse,
  spendMoonlightShadowUse,
} from '../src/combat/artifact-rest-uses.js';

/** Core-printed Echo Artifact display names → registry keys (variants collapsed). */
const CORE_ECHO_L10_NAMES: Record<string, string> = {
  stoneboundSoles: 'Stonebound Soles',
  elorianStride: 'Elorian Stride',
  ringchainOfKeptNames: 'Ringchain of Kept Names',
  oracleFrame: 'Oracle Frame',
  sentinelFrame: 'Sentinel Frame',
  judicatorFrame: 'Judicator Frame',
  titanScars: 'Titan Scars',
  wyrmScalesHeavy: 'Wyrm Scales',
  wyrmScalesLight: 'Serpent Scales',
  dragonHead: 'Dragon Head',
  dragonClaws: 'Dragon Claws',
  predatorCrownMight: 'Predator Crown',
  predatorCrownWits: 'Predator Crown',
  predatorCrownIntellect: 'Predator Crown',
  primalVestment: 'Primal Vestment',
  witchStaffRoot: 'Witch Staff',
  witchStaffRuin: 'Witch Staff',
  witchStaffBlight: 'Witch Staff',
  alchemistCoat: 'Alchemist Coat',
  greenWardenMantle: 'Green Warden Mantle',
  huntersScourge: "Hunter's Scourge",
  hollowCrown: 'Hollow Crown',
};

function mockActor(opts: {
  masteryRank?: number;
  restUses?: Record<string, number>;
  combatUses?: Record<string, number>;
} = {}) {
  const flags: Record<string, any> = { 'mastery-system': {} };
  if (opts.restUses) flags['mastery-system'].artifactRestUses = { ...opts.restUses };
  if (opts.combatUses) flags['mastery-system'].artifactCombatUses = { ...opts.combatUses };
  return {
    system: { mastery: { rank: opts.masteryRank ?? 1 } },
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

describe('Every Echo Artifact L10 is Artifact Awakening', () => {
  for (const [key, expectedName] of Object.entries(CORE_ECHO_L10_NAMES)) {
    it(`${key} → Awakening (${expectedName})`, () => {
      const def = ECHO_ARTIFACTS[key];
      expect(def, `missing registry key ${key}`).toBeTruthy();
      const picks = buildEchoProgressionPicks(def);
      const table = resolveFullLevelProgression(def.levelProgression, picks as any);
      const l10 = table.filter((r) => Number(r.level) === 10);
      expect(l10.length).toBeGreaterThanOrEqual(1);
      for (const row of l10) {
        expect(row.name).toMatch(/Artifact Awakening/i);
        expect(row.name).not.toMatch(/^True\b/i);
        expect(String(row.type)).toMatch(/Artifact Function/i);
        expect(String(row.special)).toContain(`Awakening (${expectedName})`);
        expect(String(row.effect)).toMatch(/universal Artifact Awakening/i);
      }
    });
  }

  it('registry has no remaining True … / Ultimate L10 rows', () => {
    for (const [key, def] of Object.entries(ECHO_ARTIFACTS)) {
      const picks = buildEchoProgressionPicks(def);
      const table = resolveFullLevelProgression(def.levelProgression, picks as any);
      const l10 = table.find((r) => Number(r.level) === 10);
      expect(l10?.name, key).toMatch(/Artifact Awakening/i);
      expect(String(l10?.type || ''), key).not.toMatch(/^Ultimate$/i);
    }
  });
});

describe('Moonlight Greatsword L10 Awakening (artefacts.md)', () => {
  it('is Artifact Awakening, not True Moonlight', () => {
    const def = GENERAL_ARTIFACTS.moonlightGreatsword;
    const picks = buildEchoProgressionPicks(def as any);
    const table = resolveFullLevelProgression(def.levelProgression, picks as any);
    const l10 = table.find((r) => Number(r.level) === 10);
    expect(l10?.name).toMatch(/Artifact Awakening/i);
    expect(l10?.special).toContain('Moonlight Greatsword');
  });
});

describe('Dragon Head Breath Weapon — Core Melee AoE', () => {
  const def = ECHO_ARTIFACTS.dragonHead;
  const picks = buildEchoProgressionPicks(def);
  const fromPicks = deriveLevelProgressionFromPicks(picks as any);
  const table = resolveFullLevelProgression(def.levelProgression, picks as any);

  it('maps Breath to active-melee-weapon-aoe (Damage + Dragon Head Bite exception)', () => {
    expect(picks[0].powerTemplateId).toBe('active-melee-weapon-aoe');
    expect(picks[0].displayName).toMatch(/Breath Weapon/i);
    expect(JSON.stringify(picks[0])).not.toMatch(/ranged-aoe/);
    const melee = getTemplate('active-melee-weapon-aoe');
    expect(melee?.levels?.['4']?.aoe?.radiusM).toBe(3);
    expect(String(melee?.levels?.['4']?.effect?.dice || melee?.levels?.['4']?.mechanics?.damageRider?.flat)).toMatch(
      /4d8/,
    );
    expect(melee?.levels?.['10']?.aoe?.radiusM).toBe(6);
    expect(String(melee?.levels?.['10']?.effect?.dice || melee?.levels?.['10']?.mechanics?.damageRider?.flat)).toMatch(
      /7d8/,
    );
    expect(melee?.levels?.['16']?.aoe?.radiusM).toBe(8);
    expect(String(melee?.levels?.['16']?.effect?.dice || melee?.levels?.['16']?.mechanics?.damageRider?.flat)).toMatch(
      /13d8/,
    );
  });

  it('compiled Breath rows print Damage (+ Bite) OR Ruin modes and dual radii', () => {
    const b1 = fromPicks.find((r) => r.level === 1);
    const b2 = fromPicks.find((r) => r.level === 4);
    const b3 = fromPicks.find((r) => r.level === 7);
    expect(b1?.name).toBe('Breath Weapon I');
    expect(String(b1?.effect)).toMatch(/Damage Breath/);
    expect(String(b1?.effect)).toMatch(/Ruin Breath/);
    expect(String(b1?.effect)).toMatch(/Bite Weapon Damage \+ 4d8/);
    expect(String(b1?.effect)).toMatch(/Ruin\(5\)/);
    expect(String(b1?.effect)).toMatch(/Might or Agility/);
    expect(String(b1?.effect)).not.toMatch(/no Bite damage/i);
    expect(String(b2?.effect)).toMatch(/Bite Weapon Damage \+ 7d8/);
    expect(String(b2?.effect)).toMatch(/Ruin\(9\)/);
    expect(String(b3?.effect)).toMatch(/Bite Weapon Damage \+ 13d8/);
    expect(String(b3?.effect)).toMatch(/Ruin\(10\)/);
    expect(breathWeaponRowDisplay(1).aoe).toBe('Damage: radius 3 m / Ruin: radius 3 m');
    expect(breathWeaponRowDisplay(4).aoe).toBe('Damage: radius 6 m / Ruin: radius 5 m');
    expect(breathWeaponRowDisplay(7).aoe).toBe('Damage: radius 8 m / Ruin: radius 7 m');
    expect(breathDamageRadiusMeters(1)).toBe(3);
    expect(breathRuinRadiusMeters(4)).toBe(5);
    expect(breathRuinRadiusMeters(7)).toBe(7);
  });

  it('L10 is Artifact Awakening', () => {
    const l10 = table.find((r) => Number(r.level) === 10);
    expect(l10?.name).toBe('Artifact Awakening');
    expect(l10?.special).toContain('Dragon Head');
  });
});

describe('Artifact rest / combat use helpers', () => {
  it('Moonlight Judgment Limited uses are 2 / 5 / 8 by artifact stage', () => {
    expect(moonlightJudgmentMaxUses(2)).toBe(2);
    expect(moonlightJudgmentMaxUses(4)).toBe(2);
    expect(moonlightJudgmentMaxUses(5)).toBe(5);
    expect(moonlightJudgmentMaxUses(7)).toBe(5);
    expect(moonlightJudgmentMaxUses(8)).toBe(8);
    expect(moonlightJudgmentMaxUses(10)).toBe(8);
  });

  it('Moonlight Shadow / Breath rest uses are ceil(MR/2)', () => {
    expect(halfMasteryRankUses(1)).toBe(1);
    expect(halfMasteryRankUses(2)).toBe(1);
    expect(halfMasteryRankUses(3)).toBe(2);
    expect(halfMasteryRankUses(5)).toBe(3);
    expect(moonlightShadowMaxUses(4)).toBe(2);
    expect(dragonBreathRestMaxUses(8)).toBe(4);
  });

  it('Judgment spends Safe Haven uses until exhausted', async () => {
    const actor = mockActor({ masteryRank: 3 });
    expect(assertMoonlightJudgmentAvailable(actor, 2)).toBe(true);
    expect(await spendMoonlightJudgmentUse(actor, 2)).toBe(true);
    expect(await spendMoonlightJudgmentUse(actor, 2)).toBe(true);
    expect(assertMoonlightJudgmentAvailable(actor, 2)).toBe(false);
    expect(await spendMoonlightJudgmentUse(actor, 2)).toBe(false);
    await clearArtifactRestUses(actor);
    expect(assertMoonlightJudgmentAvailable(actor, 2)).toBe(true);
  });

  it('Shadow spends ceil(MR/2) Safe Haven uses', async () => {
    const actor = mockActor({ masteryRank: 3 });
    expect(assertMoonlightShadowAvailable(actor)).toBe(true);
    expect(await spendMoonlightShadowUse(actor)).toBe(true);
    expect(await spendMoonlightShadowUse(actor)).toBe(true);
    expect(assertMoonlightShadowAvailable(actor)).toBe(false);
  });

  it('Dragon Breath requires rest uses AND once-per-combat; Damage/Ruin share the gate', async () => {
    const actor = mockActor({ masteryRank: 4 });
    expect(assertDragonBreathAvailable(actor)).toEqual({ ok: true });
    expect(await spendDragonBreathUse(actor)).toBe(true);
    // Shared combat-once: second use in same combat blocked even with rest uses left.
    expect(assertDragonBreathAvailable(actor)).toEqual({ ok: false, reason: 'combat' });
    expect(await spendDragonBreathUse(actor)).toBe(false);
    await clearArtifactCombatUses(actor);
    expect(assertDragonBreathAvailable(actor)).toEqual({ ok: true });
    expect(await spendDragonBreathUse(actor)).toBe(true);
    await clearArtifactCombatUses(actor);
    // Rest exhausted (MR4 → 2 uses).
    expect(assertDragonBreathAvailable(actor)).toEqual({ ok: false, reason: 'rest' });
  });

  it('Awakening does not bypass Breath combat-once (ledger still blocks)', async () => {
    const actor = mockActor({
      masteryRank: 6,
      combatUses: { dragonBreath: 1 },
    });
    expect(assertDragonBreathAvailable(actor)).toEqual({ ok: false, reason: 'combat' });
  });
});
