/**
 * Encounter Generator v2 — concept-driven design + threat report.
 */

import { describe, expect, it } from 'vitest';

import {
  buildPartyMetrics,
  simulateAttackTotals,
} from '../src/creation/encounter-generator/encounter-generator-analysis.js';
import {
  ARCHETYPE_PRESETS,
  addPressureTargetHL,
  avgHealthLevelSize,
  defaultConcept,
  deriveAddsPlan,
  deriveConceptPlan,
  primarySpecialOptions,
} from '../src/creation/encounter-generator/encounter-generator-concept.js';
import { buildThreatReport } from '../src/creation/encounter-generator/encounter-generator-threat.js';
import {
  buildNpcSheetHtml,
  buildProjectAddSystem,
  buildProjectBossSystem,
  buildProjectEnvironmentSystem,
  buildSummaryHtml,
} from '../src/creation/encounter-generator/encounter-generator-apply.js';
import type {
  EncounterConcept,
  PartyMemberMetrics,
} from '../src/creation/encounter-generator/encounter-generator-types.js';

/** Deterministic RNG (mulberry32). */
function seededRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function member(partial: Partial<PartyMemberMetrics>, rng: () => number): PartyMemberMetrics {
  const mr = partial.mr ?? 3;
  const pool = partial.attackPool ?? 10;
  return {
    actorId: 'a',
    name: 'PC',
    mr,
    effectiveHP: 120,
    evade: 14,
    armor: 8,
    drPct: 0,
    attackPool: pool,
    keep: mr,
    weaponDamageMean: 16,
    mightMeleeBonus: 2,
    attacksPerRound: 1,
    attackTotals: simulateAttackTotals(pool, mr, 800, rng),
    barCount: 4,
    canCleanse: false,
    ...partial,
  };
}

function testParty(opts: { cleanse?: boolean } = {}) {
  const rng = seededRng(42);
  return buildPartyMetrics([
    member({ actorId: '1', name: 'Tank', effectiveHP: 160, evade: 12, armor: 12 }, rng),
    member({ actorId: '2', name: 'Skirmisher', effectiveHP: 110, evade: 18, armor: 6 }, rng),
    member({ actorId: '3', name: 'Caster', effectiveHP: 90, evade: 14, armor: 4, canCleanse: !!opts.cleanse }, rng),
    member({ actorId: '4', name: 'Support', effectiveHP: 120, evade: 15, armor: 8 }, rng),
  ]);
}

describe('add pressure + health levels', () => {
  it('pressure targets scale from harassment to lethal', () => {
    expect(addPressureTargetHL('harassment', 4)).toBeLessThan(addPressureTargetHL('noticeable', 4));
    expect(addPressureTargetHL('noticeable', 4)).toBeLessThan(addPressureTargetHL('dangerous', 4));
    expect(addPressureTargetHL('dangerous', 4)).toBeLessThan(addPressureTargetHL('lethal', 4));
  });

  it('avgHealthLevelSize divides party HP by bar count', () => {
    const party = testParty();
    // avg HP 120, 4 bars each → ~30 per level.
    expect(avgHealthLevelSize(party)).toBeGreaterThan(25);
    expect(avgHealthLevelSize(party)).toBeLessThan(35);
  });
});

describe('deriveAddsPlan', () => {
  const redPriest = ARCHETYPE_PRESETS.find((p) => p.id === 'red-priest')!;

  it('returns null when adds are disabled', () => {
    const party = testParty();
    const concept = defaultConcept();
    concept.adds.enabled = false;
    expect(deriveAddsPlan(party, concept, seededRng(1))).toBeNull();
  });

  it('computes Add Threat = lifetime × threat per action and respects the cap', () => {
    const party = testParty();
    const plan = deriveAddsPlan(party, redPriest.concept, seededRng(7));
    expect(plan).not.toBeNull();
    expect(plan!.maxActive).toBe(6);
    expect(plan!.design.addThreat).toBeGreaterThan(0);
    expect(plan!.design.addThreat).toBeCloseTo(
      Math.round(plan!.design.expectedLifetimeRounds * plan!.design.threatPerAction * 10) / 10,
      0,
    );
    // Population projection never exceeds the cap.
    for (const active of plan!.projectedActive) {
      expect(active).toBeLessThanOrEqual(plan!.maxActive);
    }
  });

  it('minion durability yields HP around one expected player action', () => {
    const party = testParty();
    const plan = deriveAddsPlan(party, redPriest.concept, seededRng(9))!;
    // One expected player ACTION (hit chance × damage) — clearly below a
    // full guaranteed hit, clearly above trivial.
    expect(plan.design.hp).toBeGreaterThan(3);
    expect(plan.design.hp).toBeLessThan(25);
  });

  it('higher pressure produces more add damage', () => {
    const party = testParty();
    const low = { ...redPriest.concept, adds: { ...redPriest.concept.adds, pressure: 'harassment' as const } };
    const high = { ...redPriest.concept, adds: { ...redPriest.concept.adds, pressure: 'lethal' as const } };
    const lowPlan = deriveAddsPlan(party, low, seededRng(3))!;
    const highPlan = deriveAddsPlan(party, high, seededRng(3))!;
    expect(highPlan.groupDamageAtFullPop).toBeGreaterThan(lowPlan.groupDamageAtFullPop);
  });
});

describe('deriveConceptPlan', () => {
  it('builds phase plans with cycles from the power catalog', () => {
    const party = testParty();
    const preset = ARCHETYPE_PRESETS.find((p) => p.id === 'ruin-spellcaster')!;
    const plan = deriveConceptPlan(party, preset.concept, seededRng(11));

    expect(plan.phasePlans).toHaveLength(preset.concept.phaseCount);
    expect(plan.boss.phases).toHaveLength(preset.concept.phaseCount);
    for (const phase of plan.phasePlans) {
      expect(phase.cycle).toHaveLength(preset.concept.cycleLength);
      // Primary special appears on damage powers.
      const withSpecial = phase.cycle.filter((c) => c.special === 'ruin');
      expect(withSpecial.length).toBeGreaterThan(0);
      for (const c of withSpecial) expect(c.specialValue).toBeGreaterThan(0);
      // Real catalog names, not placeholders.
      expect(phase.cycle.some((c) => c.templateId !== '')).toBe(true);
    }
    expect(plan.adds).toBeNull();
    expect(plan.environment).toBeNull();
  });

  it('martial style produces melee cycles', () => {
    const party = testParty();
    const preset = ARCHETYPE_PRESETS.find((p) => p.id === 'kerkermeister')!;
    const plan = deriveConceptPlan(party, preset.concept, seededRng(13));
    const damageRows = plan.phasePlans[0].cycle.filter((c) => !c.isControl && !c.isSummon);
    const melee = plan.phasePlans[0].cycle.filter((c) => c.rangeKind === 'melee');
    expect(melee.length).toBeGreaterThan(0);
    expect(damageRows.some((c) => c.special === 'lacerate')).toBe(true);
  });

  it('summoner reserves a summon slot and prices adds into the budget', () => {
    const party = testParty();
    const preset = ARCHETYPE_PRESETS.find((p) => p.id === 'red-priest')!;
    const plan = deriveConceptPlan(party, preset.concept, seededRng(17));
    expect(plan.adds).not.toBeNull();
    expect(plan.phasePlans[0].cycle.some((c) => c.isSummon)).toBe(true);

    // Boss personal damage stays clearly below a pure spell boss of same rank.
    const pure = deriveConceptPlan(
      party,
      { ...preset.concept, style: 'spell', adds: { ...preset.concept.adds, enabled: false } },
      seededRng(17),
    );
    const avgDice = (p: typeof plan) => {
      const rows = p.phasePlans[0].cycle.filter((c) => !c.isSummon && !c.isControl);
      return rows.reduce((a, c) => a + c.damageDiceCount, 0) / rows.length;
    };
    expect(avgDice(plan)).toBeLessThan(avgDice(pure));
  });

  it('environmental style yields an environment plan sharing the budget', () => {
    const party = testParty();
    const preset = ARCHETYPE_PRESETS.find((p) => p.id === 'burning-portal')!;
    const plan = deriveConceptPlan(party, preset.concept, seededRng(19));
    expect(plan.environment).not.toBeNull();
    expect(plan.environment!.damageDiceCount).toBeGreaterThan(0);
    expect(plan.phasePlans).toHaveLength(3);
    // Last phase escalates: more damage dice than phase 1, less armor.
    const p1 = plan.phasePlans[0];
    const p3 = plan.phasePlans[2];
    expect(p3.stat.damageDiceCount).toBeGreaterThanOrEqual(p1.stat.damageDiceCount);
    expect(p3.stat.armor).toBeLessThanOrEqual(p1.stat.armor);
    expect(p3.addsActive).toBe(false);
  });

  it('mythic hybrid (Samael) gets distinct phase themes', () => {
    const party = testParty();
    const preset = ARCHETYPE_PRESETS.find((p) => p.id === 'samael')!;
    const plan = deriveConceptPlan(party, preset.concept, seededRng(23));
    const names = plan.phasePlans.map((p) => p.theme);
    expect(new Set(names).size).toBe(3);
    expect(plan.phasePlans.every((p) => p.changes.length > 0)).toBe(true);
  });
});

describe('buildThreatReport', () => {
  it('reports hit chances, damage, health levels and duration', () => {
    const party = testParty();
    const preset = ARCHETYPE_PRESETS.find((p) => p.id === 'ruin-spellcaster')!;
    const plan = deriveConceptPlan(party, preset.concept, seededRng(29));
    const report = buildThreatReport(party, plan, seededRng(29));

    expect(report.hitChanceLowEvade).toBeGreaterThanOrEqual(report.hitChanceAvgEvade);
    expect(report.hitChanceAvgEvade).toBeGreaterThanOrEqual(report.hitChanceHighEvade);
    expect(report.expectedHitDamageRaw).toBeGreaterThan(report.expectedHitDamageAfterArmor);
    expect(report.persistentDamagePerRound).toBeGreaterThan(0);
    expect(report.firstRoundBurstOneTarget).toBeGreaterThan(0);
    expect(report.avgHealthLevelSize).toBeGreaterThan(0);
    expect(report.expectedDurationRounds).toBeGreaterThan(0);
    expect(report.enemyActionsByRound).toHaveLength(5);
  });

  it('warns when the party has no Cleanse but persistent specials are used', () => {
    const noCleanse = testParty({ cleanse: false });
    const withCleanse = testParty({ cleanse: true });
    const preset = ARCHETYPE_PRESETS.find((p) => p.id === 'ruin-spellcaster')!;

    const planA = deriveConceptPlan(noCleanse, preset.concept, seededRng(31));
    const reportA = buildThreatReport(noCleanse, planA, seededRng(31));
    expect(reportA.warnings.some((w) => w.includes('Cleanse'))).toBe(true);

    const planB = deriveConceptPlan(withCleanse, preset.concept, seededRng(31));
    const reportB = buildThreatReport(withCleanse, planB, seededRng(31));
    expect(reportB.warnings.some((w) => w.includes('Cleanse'))).toBe(false);
  });

  it('adds contribute to enemy actions per round', () => {
    const party = testParty();
    const preset = ARCHETYPE_PRESETS.find((p) => p.id === 'red-priest')!;
    const plan = deriveConceptPlan(party, preset.concept, seededRng(37));
    const report = buildThreatReport(party, plan, seededRng(37));
    // Round 3 has more enemy actions than round 1 (population grows).
    expect(report.enemyActionsByRound[2]).toBeGreaterThan(report.enemyActionsByRound[0]);
  });

  it('exactly one boss cycle attack per phase carries stress damage (1–2d8)', () => {
    const party = testParty();
    for (const preset of ARCHETYPE_PRESETS) {
      const plan = deriveConceptPlan(party, preset.concept, seededRng(47));
      for (const phase of plan.phasePlans) {
        const stressRows = phase.cycle.filter((c) => (c.stressD8 ?? 0) > 0);
        expect(stressRows.length).toBe(1);
        expect(stressRows[0].stressD8!).toBeGreaterThanOrEqual(1);
        expect(stressRows[0].stressD8!).toBeLessThanOrEqual(2);
        // major/mythic bosses hit the mind harder
        if (preset.concept.rank === 'major' || preset.concept.rank === 'mythic') {
          expect(stressRows[0].stressD8).toBe(2);
        }
      }
    }
  });

  it('AoE rows report a fixed Area TN (8 × MR) hit chance, independent of evade', () => {
    const party = testParty();
    // Ruin spellcaster uses mixed targeting → the cycle contains AoE rows.
    const preset = ARCHETYPE_PRESETS.find((p) => p.id === 'ruin-spellcaster')!;
    const plan = deriveConceptPlan(party, preset.concept, seededRng(43));
    const report = buildThreatReport(party, plan, seededRng(43));

    expect(report.areaTn).toBe(8 * plan.boss.mr);
    expect(report.hitChanceAreaTn).not.toBeNull();
    expect(report.hitChanceAreaTn!).toBeGreaterThan(0);
    expect(report.hitChanceAreaTn!).toBeLessThanOrEqual(100);

    // A single-target-only enemy has no Area TN line.
    const jailer = ARCHETYPE_PRESETS.find((p) => p.id === 'kerkermeister')!;
    const planSingle = deriveConceptPlan(party, jailer.concept, seededRng(43));
    const reportSingle = buildThreatReport(party, planSingle, seededRng(43));
    expect(reportSingle.areaTn).toBeNull();
    expect(reportSingle.hitChanceAreaTn).toBeNull();
  });
});

describe('apply payload builders', () => {
  function samaelPlan() {
    const party = testParty();
    const preset = ARCHETYPE_PRESETS.find((p) => p.id === 'samael')!;
    const plan = deriveConceptPlan(party, preset.concept, seededRng(41));
    const report = buildThreatReport(party, plan, seededRng(41));
    return { party, plan, report };
  }

  it('boss system carries per-phase attack rows with specials', () => {
    const { plan } = samaelPlan();
    const system = buildProjectBossSystem(plan) as any;
    expect(system.attackSlots).toBe(plan.phasePlans[0].actionsPerRound);
    expect(Array.isArray(system.phases)).toBe(true);
    expect(system.phases).toHaveLength(3);
    for (const phase of system.phases) {
      expect(phase.npcBaseAttack?.name).toBeTruthy();
      const rows = [phase.npcBaseAttack, ...(phase.attackValues ?? [])];
      const hasSpecial = rows.some((r: any) => Array.isArray(r.specials) && r.specials.length > 0);
      expect(hasSpecial).toBe(true);
    }
  });

  it('spell-style bosses write npcIsSpell and attacks-per-round onto attack rows', () => {
    const party = testParty();
    const preset = ARCHETYPE_PRESETS.find((p) => p.id === 'ruin-spellcaster')!;
    const plan = deriveConceptPlan(party, preset.concept, seededRng(41));
    for (const phase of plan.phasePlans) {
      const attackRows = phase.cycle.filter((c) => !c.isSummon);
      expect(attackRows.length).toBeGreaterThan(0);
      expect(attackRows.every((c) => c.isSpell === true)).toBe(true);
      expect(attackRows.every((c) => (c.attacksPerRound ?? 0) >= 1 && (c.attacksPerRound ?? 0) <= 5)).toBe(
        true,
      );
      const sumApr = attackRows.reduce((s, c) => s + (c.attacksPerRound ?? 0), 0);
      // Enough per-power uses to spend the phase action budget (capped at 5 each).
      expect(sumApr).toBeGreaterThanOrEqual(
        Math.min(phase.actionsPerRound, attackRows.length * 5),
      );
    }
    const system = buildProjectBossSystem(plan) as any;
    const rows = [system.npcBaseAttack, ...(system.attackValues ?? [])];
    expect(rows.every((r: any) => r.npcIsSpell === true)).toBe(true);
    expect(rows.every((r: any) => r.npcAttacksPerRound >= 1 && r.npcAttacksPerRound <= 5)).toBe(true);
  });

  it('martial bosses keep Evade attacks (no npcIsSpell)', () => {
    const party = testParty();
    const preset = ARCHETYPE_PRESETS.find((p) => p.concept.style === 'martial')!;
    const plan = deriveConceptPlan(party, preset.concept, seededRng(41));
    for (const phase of plan.phasePlans) {
      const attackRows = phase.cycle.filter((c) => !c.isSummon);
      expect(attackRows.every((c) => !c.isSpell)).toBe(true);
    }
    const system = buildProjectBossSystem(plan) as any;
    const rows = [system.npcBaseAttack, ...(system.attackValues ?? [])];
    expect(rows.every((r: any) => !r.npcIsSpell)).toBe(true);
    expect(rows.every((r: any) => r.npcAttacksPerRound >= 1)).toBe(true);
  });

  it('add prototype and environment actor are built when planned', () => {
    const { plan } = samaelPlan();
    expect(buildProjectAddSystem(plan)).not.toBeNull();

    const party = testParty();
    const portal = ARCHETYPE_PRESETS.find((p) => p.id === 'burning-portal')!;
    const envPlan = deriveConceptPlan(party, portal.concept, seededRng(43));
    const envSystem = buildProjectEnvironmentSystem(envPlan) as any;
    expect(envSystem).not.toBeNull();
    expect(envSystem.npcBaseAttack.npcAoeShape).toBe('radius');
  });

  it('journal HTML contains threat report and power cycle', () => {
    const { party, plan, report } = samaelPlan();
    const summary = buildSummaryHtml('Samael', plan, report, party);
    expect(summary).toContain('Threat Report');
    expect(summary).toContain('Health Levels');
    const sheet = buildNpcSheetHtml('Samael', plan);
    expect(sheet).toContain('Power Cycle');
    expect(sheet).toContain(plan.phasePlans[0].cycle[0].name);
  });
});

describe('option lists', () => {
  it('primary special options come from the diminishing catalog', () => {
    const options = primarySpecialOptions();
    const ids = options.map((o) => o.value);
    expect(ids).toContain('ruin');
    expect(ids).toContain('lacerate');
    expect(ids).toContain('none');
    expect(ids).not.toContain('regeneration');
  });

  it('all archetype presets produce valid plans', () => {
    const party = testParty();
    for (const preset of ARCHETYPE_PRESETS) {
      const plan = deriveConceptPlan(party, preset.concept as EncounterConcept, seededRng(47));
      expect(plan.phasePlans.length).toBe(preset.concept.phaseCount);
      const report = buildThreatReport(party, plan, seededRng(47));
      expect(report.expectedGroupDamagePerRound).toBeGreaterThan(0);
    }
  });
});
