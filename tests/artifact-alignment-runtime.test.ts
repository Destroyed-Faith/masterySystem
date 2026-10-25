/**
 * Runtime helpers for Artifact alignment (Growth bars, Deathless Body,
 * Primal Rage, Limited doubling, migration dry-run against fixture actors).
 */
import { describe, expect, it } from 'vitest';
import {
  applyLimitedPowerDamage,
  doublePrintedPowerDice,
} from '../src/combat/damage-transfer.js';
import {
  ensureGrowthBarStates,
  growthGeometry,
  titanScarsMaxGrowth,
} from '../src/combat/transformation-growth.js';
import {
  applyDeathlessBodyToFraction,
  deathlessBodyStageForArtifactLevel,
  hollowCrownLevel,
  lifeAbsorptionMaxStones,
} from '../src/combat/hollow-crown.js';
import { HEALTH_PENALTY_FRACTIONS } from '../src/utils/constants.js';
import {
  actorHasPrimalRageDisadvantage,
  ensurePrimalRageDisadvantage,
  PRIMAL_RAGE_DISADVANTAGE_ID,
} from '../src/utils/primal-rage.js';
import { ECHO_ARTIFACTS, buildEchoProgressionPicks } from '../src/utils/echo-artifacts.js';
import { resolveFullLevelProgression } from '../src/utils/artifact-visible-abilities.js';
import { runArtifactAlignmentMigration } from '../src/migrations/artifact-alignment-2026-10-25.js';
import { GENERAL_ARTIFACTS } from '../src/utils/general-artifacts.js';

describe('Limited Power damage doubling', () => {
  it('doubles printed Power Dice only', () => {
    expect(doublePrintedPowerDice('3d8')).toBe('6d8');
    expect(doublePrintedPowerDice('4d8')).toBe('8d8');
    expect(doublePrintedPowerDice('8d8')).toBe('16d8');
    expect(applyLimitedPowerDamage('3d8', { limited: true })).toBe('6d8');
    expect(applyLimitedPowerDamage('3d8', { limited: false })).toBe('3d8');
  });
});

describe('Transformation Growth Health Bars', () => {
  it('persists Growth Bar damage when shrinking', () => {
    const hp = 16;
    let bars = ensureGrowthBarStates([], 2, hp);
    expect(bars).toHaveLength(2);
    bars[0].current = 4;
    bars[1].current = 0;
    bars[1].scarred = true;
    // Shrink to Growth 1 — keep both persisted; only 1 visible in sync.
    bars = ensureGrowthBarStates(bars, 1, hp);
    expect(bars[0].current).toBe(4);
    expect(bars[1].current).toBe(0);
    expect(bars[1].scarred).toBe(true);
    expect(growthGeometry(3).additionalHealthBars).toBe(3);
    expect(titanScarsMaxGrowth(7)).toBe(3);
  });
});

describe('Hollow Crown Deathless Body', () => {
  it('shifts Health Penalty fractions toward Healthy and caps max penalty', () => {
    expect(deathlessBodyStageForArtifactLevel(1)).toBe(1);
    expect(deathlessBodyStageForArtifactLevel(4)).toBe(2);
    expect(deathlessBodyStageForArtifactLevel(7)).toBe(3);
    // Bruised (index 1 = 10%) → shift 2 → Healthy 0%.
    expect(applyDeathlessBodyToFraction(1, HEALTH_PENALTY_FRACTIONS, 1)).toBe(0);
    // Wounded (index 3 = 40%) → shift 2 → Bruised 10%.
    expect(applyDeathlessBodyToFraction(3, HEALTH_PENALTY_FRACTIONS, 1)).toBe(0.1);
    // Broken (index 4 = 50%) with Body III → 0%.
    expect(applyDeathlessBodyToFraction(4, HEALTH_PENALTY_FRACTIONS, 3)).toBe(0);
    expect(lifeAbsorptionMaxStones(2)).toBe(2);
    expect(lifeAbsorptionMaxStones(5)).toBe(4);
    expect(lifeAbsorptionMaxStones(8)).toBe(8);
  });

  it('detects Hollow Crown level on actor items', () => {
    const actor = {
      items: [
        {
          type: 'artifact',
          name: 'Hollow Crown',
          system: { definitionKey: 'hollowCrown', currentLevel: 5 },
        },
      ],
    };
    expect(hollowCrownLevel(actor)).toBe(5);
  });
});

describe('Primal Rage Disadvantage', () => {
  it('auto-grants Primal Rage when Primal Vestment is present', async () => {
    const actor: any = {
      system: { disadvantages: [] },
      items: [
        {
          type: 'artifact',
          name: 'Primal Vestment',
          system: { definitionKey: 'primalVestment', currentLevel: 1 },
        },
      ],
      async update(data: any) {
        if (data['system.disadvantages']) {
          this.system.disadvantages = data['system.disadvantages'];
        }
      },
    };
    expect(actorHasPrimalRageDisadvantage(actor)).toBe(false);
    expect(await ensurePrimalRageDisadvantage(actor)).toBe(true);
    expect(actorHasPrimalRageDisadvantage(actor)).toBe(true);
    expect(actor.system.disadvantages[0].id).toBe(PRIMAL_RAGE_DISADVANTAGE_ID);
    expect(actor.system.disadvantages[0].points).toBe(2);
    // Idempotent.
    expect(await ensurePrimalRageDisadvantage(actor)).toBe(false);
  });
});

describe('Echo Artifact L1–10 coverage matrix', () => {
  const keys = Object.keys(ECHO_ARTIFACTS);
  it(`verifies ${keys.length} Echo Artifacts have 10 levels and Awakening L10`, () => {
    expect(keys.length).toBeGreaterThanOrEqual(15);
    let levelsChecked = 0;
    for (const key of keys) {
      const def = ECHO_ARTIFACTS[key];
      const picks = buildEchoProgressionPicks(def);
      const table = resolveFullLevelProgression(def.levelProgression, picks as any);
      const byLevel = new Map<number, typeof table>();
      for (const row of table) {
        const lvl = Number(row.level) || 0;
        if (!byLevel.has(lvl)) byLevel.set(lvl, []);
        byLevel.get(lvl)!.push(row);
        levelsChecked += 1;
      }
      // Every Artifact should expose levels 1–10 somehow (authored or derived).
      for (let lvl = 1; lvl <= 10; lvl++) {
        // Some Artifacts (Primal Vestment) start grants at L2 — allow gaps only
        // when progressionPickSpecs / authored rows intentionally skip.
        if (key === 'primalVestment' && (lvl === 1 || lvl === 4 || lvl === 7)) continue;
        expect(byLevel.has(lvl) || lvl === 10, `${key} missing L${lvl}`).toBe(true);
      }
      const l10 = table.find((r) => Number(r.level) === 10);
      expect(l10?.name, key).toMatch(/Artifact Awakening/i);
    }
    expect(levelsChecked).toBeGreaterThanOrEqual(keys.length * 8);
  });

  it('Moonlight Greatsword has L1–10 catalogue rows', () => {
    const def = GENERAL_ARTIFACTS.moonlightGreatsword;
    const picks = buildEchoProgressionPicks(def as any);
    const table = resolveFullLevelProgression(def.levelProgression, picks as any);
    for (const lvl of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
      expect(table.some((r) => Number(r.level) === lvl), `Moonlight L${lvl}`).toBe(true);
    }
  });
});

describe('Migration dry-run (fixture Actors)', () => {
  it('scans Lor-Keth / Alaris / Scurry / Oda without writing', async () => {
    const fixtures = [
      { id: 'lor-keth', name: 'Lor-Keth', items: [{ id: 'ts1', type: 'artifact', name: 'Titan Scars', system: { currentLevel: 2 }, flags: { 'mastery-system': { echoArtifactKey: 'titanScars', seedVersion: 50 } } }] },
      { id: 'alaris', name: 'Alaris', items: [{ id: 'mg1', type: 'artifact', name: 'Moonlight Greatsword', system: { currentLevel: 2 }, flags: { 'mastery-system': { echoArtifactKey: 'moonlightGreatsword', seedVersion: 50 } } }] },
      { id: 'scurry', name: 'Scurry', items: [{ id: 'dh1', type: 'artifact', name: 'Dragon Head', system: { currentLevel: 3 }, flags: { 'mastery-system': { echoArtifactKey: 'dragonHead', seedVersion: 56 } } }] },
      { id: 'oda', name: 'Oda', items: [] },
    ];
    (globalThis as any).game = {
      actors: {
        values: () =>
          fixtures.map((f) => ({
            id: f.id,
            name: f.name,
            items: f.items.map((it) => ({
              ...it,
              getFlag: (scope: string, key: string) =>
                (it as any).flags?.[scope]?.[key],
            })),
          })),
      },
      scenes: [],
    };
    const report = await runArtifactAlignmentMigration({ dryRun: true });
    expect(report.dryRun).toBe(true);
    expect(report.seedVersion).toBeGreaterThanOrEqual(57);
    expect(report.scannedActors).toBeGreaterThanOrEqual(4);
    expect(report.wouldUpdate.some((u) => u.actorId === 'lor-keth' || u.actorId === 'alaris')).toBe(
      true,
    );
    // Prior seedVersion 56 must still be queued for the new target seed.
    expect(report.wouldUpdate.some((u) => u.actorId === 'scurry' && u.previousSeed === 56)).toBe(
      true,
    );
    // Dry-run must not mutate fixture levels.
    expect((fixtures[0].items[0] as any).system.currentLevel).toBe(2);
    expect((fixtures[1].items[0] as any).system.currentLevel).toBe(2);
    expect((fixtures[2].items[0] as any).system.currentLevel).toBe(3);
    expect((fixtures[2].items[0] as any).flags['mastery-system'].seedVersion).toBe(56);
    delete (globalThis as any).game;
  });

  it('skips embeds already at the current seedVersion', async () => {
    const { ECHO_ARTIFACT_SEED_VERSION } = await import(
      '../src/artifacts/echo-artifact-tree-builder.js'
    );
    const fixtures = [
      {
        id: 'scurry',
        name: 'Scurry',
        items: [
          {
            id: 'dh1',
            type: 'artifact',
            name: 'Dragon Head',
            system: { currentLevel: 3 },
            flags: {
              'mastery-system': {
                echoArtifactKey: 'dragonHead',
                seedVersion: ECHO_ARTIFACT_SEED_VERSION,
              },
            },
          },
        ],
      },
    ];
    (globalThis as any).game = {
      actors: {
        values: () =>
          fixtures.map((f) => ({
            id: f.id,
            name: f.name,
            items: f.items.map((it) => ({
              ...it,
              getFlag: (scope: string, key: string) =>
                (it as any).flags?.[scope]?.[key],
            })),
          })),
      },
      scenes: [],
    };
    const report = await runArtifactAlignmentMigration({ dryRun: true });
    expect(report.wouldUpdate.some((u) => u.actorId === 'scurry')).toBe(false);
    delete (globalThis as any).game;
  });
});
