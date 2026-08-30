/**
 * Integration tests for the Encounter Forge solver pipeline.
 *
 * Deterministic synthetic parties — same inputs must always produce the
 * identical solution (acceptance criteria 33/34).
 */
import { describe, it, expect } from 'vitest';
import {
  defaultAttackConcept,
  defaultMainEnemy,
  defaultEncounterDesign,
  syncPhaseCount,
  type EncounterDesign,
} from '../src/creation/encounter-forge/encounter-model';
import { analyzePartyActors } from '../src/creation/encounter-forge/party-analyzer';
import { solveEncounterForParty } from '../src/creation/encounter-forge/solve-encounter';
import { validateEncounter } from '../src/creation/encounter-forge/encounter-validator';
import { ENCOUNTER_TUNING } from '../src/creation/encounter-forge/encounter-tuning';

/* ------------------------------------------------------------------ */
/* Synthetic party fixtures                                            */
/* ------------------------------------------------------------------ */

interface PcSpec {
  name: string;
  mr?: number;
  might?: number;
  agility?: number;
  vitality?: number;
  evade?: number;
  armor?: number;
  drPct?: number;
  spellResistance?: number;
  weaponDice?: number;
  weaponSpecials?: string[];
  spell?: { dice: number; level: number };
}

function makePc(spec: PcSpec): any {
  const mr = spec.mr ?? 2;
  const vitality = spec.vitality ?? 10;
  const barMax = vitality * 2;
  const bars = [
    { name: 'Healthy', max: barMax, current: barMax, penalty: 0 },
    { name: 'Bruised', max: barMax, current: barMax, penalty: -1 },
    { name: 'Injured', max: barMax, current: barMax, penalty: -2 },
    { name: 'Wounded', max: barMax, current: barMax, penalty: -4 },
    { name: 'Broken', max: barMax, current: barMax, penalty: -5 },
    { name: 'Incapacitated', max: 1, current: 1, penalty: -6 },
  ];
  const items: any[] = [
    {
      type: 'weapon',
      name: 'Klinge',
      system: {
        equipped: true,
        damage: `${spec.weaponDice ?? 3}d8`,
        specials: spec.weaponSpecials ?? [],
      },
    },
  ];
  if (spec.spell) {
    items.push({
      type: 'power',
      name: 'Zauberstrahl',
      system: {
        isSpell: true,
        rank: spec.spell.level,
        roll: { damage: `${spec.spell.dice}d8` },
        castingAttribute: 'intellect',
      },
    });
  }
  return {
    id: `pc-${spec.name}`,
    name: spec.name,
    system: {
      mastery: { rank: mr },
      attributes: {
        might: { value: spec.might ?? 12 },
        agility: { value: spec.agility ?? 8 },
        vitality: { value: vitality },
        intellect: { value: 8 },
        resolve: { value: 6 },
        influence: { value: 4 },
        wits: { value: 6 },
      },
      combat: {
        evadeTotal: spec.evade ?? mr * 4 + 2,
        armorTotal: spec.armor ?? mr + 4,
        damageReductionPct: spec.drPct ?? 0,
        spellResistanceTotal: spec.spellResistance ?? 0,
      },
      health: { bars, tempHP: 0, currentBar: 0 },
      statusEffects: [],
    },
    items,
  };
}

function freshMr2Party(): any[] {
  return [
    makePc({ name: 'Alaris', mr: 2, might: 14, weaponDice: 4, weaponSpecials: ['Lacerate(2)'] }),
    makePc({ name: 'Thora', mr: 2, might: 12, armor: 9, weaponDice: 3 }),
    makePc({ name: 'Sjossfur', mr: 2, agility: 14, evade: 14, weaponDice: 3 }),
    makePc({ name: 'Fynn', mr: 2, might: 8, spell: { dice: 5, level: 4 }, weaponDice: 2 }),
  ];
}

function experiencedMr3Party(): any[] {
  return [
    makePc({ name: 'Oda', mr: 3, might: 20, vitality: 14, weaponDice: 6, weaponSpecials: ['Corrode(2)'] }),
    makePc({ name: 'Lor-Keth', mr: 3, might: 16, armor: 12, drPct: 10, weaponDice: 5 }),
    makePc({ name: 'Alaris', mr: 3, agility: 18, evade: 18, weaponDice: 5, weaponSpecials: ['Penetration(4)'] }),
    makePc({ name: 'Scurry', mr: 3, might: 10, spell: { dice: 8, level: 6 }, weaponDice: 3, spellResistance: 4 }),
  ];
}

function soloBossDesign(): EncounterDesign {
  const design = defaultEncounterDesign();
  design.name = 'Solo Boss';
  const enemy = defaultMainEnemy('Kerkermeister', 1);
  enemy.attacks = [
    defaultAttackConcept({ name: 'Zerreißende Klaue', specialId: 'lacerate' }),
    defaultAttackConcept({ name: 'Rundumschlag', area: 'radius', areaSize: 3, range: 0 }),
  ];
  enemy.phases[0].attackIds = enemy.attacks.map((a) => a.id);
  enemy.phases[0].defenses = { primary: 'armor', secondary: 'damageReduction' };
  design.enemies = [enemy];
  syncPhaseCount(design);
  return design;
}

/* ------------------------------------------------------------------ */
/* Tests                                                               */
/* ------------------------------------------------------------------ */

describe('party analyzer', () => {
  it('builds per-PC profiles from real actor shapes', () => {
    const party = analyzePartyActors(freshMr2Party());
    expect(party.size).toBe(4);
    const alaris = party.members[0];
    expect(alaris.mr).toBe(2);
    expect(alaris.bestAttack.pool).toBe(14); // full Might, not halved
    expect(alaris.bestAttack.keep).toBe(2);
    expect(alaris.bestAttack.damageDice).toBe(4);
    expect(alaris.bestAttack.specials.some((s) => s.id === 'lacerate')).toBe(true);
    const fynn = party.members[3];
    expect(fynn.attacks.some((a) => a.kind === 'spell')).toBe(true);
  });

  it('warns on transient state instead of using it', () => {
    const clean = makePc({ name: 'Dirty' });
    const pc = makePc({ name: 'Dirty' });
    pc.system.health.tempHP = 25;
    pc.system.statusEffects = [{ id: 'expose', value: 3 }];
    // Prepared actors carry the Expose malus inside evadeTotal — emulate that.
    pc.system.combat.evadeTotal = clean.system.combat.evadeTotal - 3;
    const profile = analyzePartyActors([pc]).members[0];
    // Baseline strips the transient malus back out.
    expect(profile.evade).toBe(clean.system.combat.evadeTotal);
    expect(profile.warnings.length).toBeGreaterThan(0);
  });
});

describe('solo boss solve', () => {
  const design = soloBossDesign();
  const party = analyzePartyActors(freshMr2Party());
  const solution = solveEncounterForParty(design, party);

  it('is deterministic: same inputs, identical outputs', () => {
    const again = solveEncounterForParty(design, party);
    expect(JSON.stringify(again.phases)).toBe(JSON.stringify(solution.phases));
  });

  it('solves phase health near the target duration', () => {
    const phase = solution.phases[0];
    expect(phase.enemies[0].health).toBeGreaterThan(0);
    expect(phase.durability.expectedPhaseRounds).toBeGreaterThan(1.5);
    expect(phase.durability.expectedPhaseRounds).toBeLessThan(4);
  });

  it('primary defense carries the largest measured contribution', () => {
    const contributions = solution.phases[0].enemies[0].defensePackage.contributions;
    const primary = contributions.find((c) => c.slot === 'primary');
    const secondary = contributions.find((c) => c.slot === 'secondary');
    expect(primary).toBeDefined();
    expect(secondary).toBeDefined();
    expect(primary!.preventedPerRound).toBeGreaterThanOrEqual(secondary!.preventedPerRound);
  });

  it('respects the pressure target on the offense side', () => {
    const offense = solution.phases[0].offense;
    const target = party.size * ENCOUNTER_TUNING.targetHealthLevelLossPerPcRound;
    expect(offense.partyHlLostPerRound).toBeGreaterThan(target * 0.4);
    expect(offense.partyHlLostPerRound).toBeLessThan(target * 2.2);
  });

  it('gives every action a distinct attack (no repeats needed here)', () => {
    const enemy = solution.phases[0].enemies[0];
    expect(enemy.attacks.length).toBeGreaterThanOrEqual(2);
  });
});

describe('benchmark expectation: same design, different parties', () => {
  it('solves different numbers without changing the design', () => {
    const design = soloBossDesign();
    const fresh = solveEncounterForParty(design, analyzePartyActors(freshMr2Party()));
    const exp = solveEncounterForParty(design, analyzePartyActors(experiencedMr3Party()));
    const freshBoss = fresh.phases[0].enemies[0];
    const expBoss = exp.phases[0].enemies[0];
    // The experienced party hits harder -> boss needs more durability.
    expect(expBoss.health).toBeGreaterThan(freshBoss.health);
    // And has better defenses -> boss attack values differ too.
    expect(
      expBoss.attacks[0].attackPool !== freshBoss.attacks[0].attackPool ||
        expBoss.attacks[0].damageDice !== freshBoss.attacks[0].damageDice,
    ).toBe(true);
    // The design itself is untouched (fiction stays, numbers change).
    expect(design.enemies[0].attacks[0].overrides.damageDice).toBeNull();
  });
});

describe('multi-boss focus fire', () => {
  it('duo bosses share the encounter durability envelope', () => {
    const solo = soloBossDesign();
    const party = analyzePartyActors(freshMr2Party());
    const soloSolution = solveEncounterForParty(solo, party);

    const duo = soloBossDesign();
    const second = defaultMainEnemy('Zweiter Wächter', 1);
    second.phases[0].defenses = { primary: 'evade' };
    duo.enemies.push(second);
    syncPhaseCount(duo);
    const duoSolution = solveEncounterForParty(duo, party);

    const soloHp = soloSolution.phases[0].enemies[0].health;
    const duoHpSum = duoSolution.phases[0].enemies.reduce((a, e) => a + e.health, 0);
    // Two bodies must NOT get 2× solo durability — the 2–3 round target
    // applies to the PHASE, and focus fire is modeled.
    expect(duoHpSum).toBeLessThan(soloHp * 1.6);
    expect(duoSolution.phases[0].durability.timeToFirstDrop).toBeLessThan(
      duoSolution.phases[0].durability.expectedPhaseRounds,
    );
    // Actions after first drop are reported.
    expect(duoSolution.phases[0].hostileActionsAfterFirstDrop).toBeGreaterThan(0);
  });
});

describe('phases', () => {
  it('each phase gets its own health pool and phase-specific solve', () => {
    const design = soloBossDesign();
    design.phaseCount = 2;
    syncPhaseCount(design);
    // Phase 2: defense identity changes to evade/phasing.
    design.enemies[0].phases[1].defenses = { primary: 'evade', secondary: 'phasing' };
    const party = analyzePartyActors(freshMr2Party());
    const solution = solveEncounterForParty(design, party);
    expect(solution.phases.length).toBe(2);
    const p1 = solution.phases[0].enemies[0];
    const p2 = solution.phases[1].enemies[0];
    expect(p1.health).toBeGreaterThan(0);
    expect(p2.health).toBeGreaterThan(0);
    expect(p2.defensePackage.defenses.evade).toBeGreaterThan(p1.defensePackage.defenses.evade);
    expect(solution.totalExpectedRounds).toBeGreaterThan(3);
  });
});

describe('adds / reinforcements / summons', () => {
  it('fixed adds divert party attacks and extend the phase', () => {
    const base = soloBossDesign();
    const party = analyzePartyActors(freshMr2Party());
    const noAdds = solveEncounterForParty(base, party);

    const withAdds = soloBossDesign();
    withAdds.addGroups.push({
      id: 'g1',
      name: 'Akolythen',
      count: 2,
      role: 'damage',
      arrival: { type: 'fixed' },
      specialId: null,
      hitsToKill: 1,
      attacks: true,
    });
    const solved = solveEncounterForParty(withAdds, party);
    // Same boss health target duration, but add-clearing means the boss
    // receives less focus damage -> solved boss health is lower.
    expect(solved.phases[0].enemies[0].health).toBeLessThanOrEqual(
      noAdds.phases[0].enemies[0].health,
    );
    expect(solved.phases[0].adds.length).toBe(1);
    expect(solved.phases[0].adds[0].attacks).not.toBeNull();
  });

  it('summons cost the summoner an action and arrive later', () => {
    const design = soloBossDesign();
    design.addGroups.push({
      id: 's1',
      name: 'Schattenwesen',
      count: 1,
      role: 'damage',
      arrival: { type: 'summon', summonerEnemyId: design.enemies[0].id },
      specialId: null,
      hitsToKill: 2,
      attacks: true,
    });
    const party = analyzePartyActors(freshMr2Party());
    const solution = solveEncounterForParty(design, party);
    expect(solution.phases[0].enemies[0].paysSummonAction).toBe(true);
    expect(solution.phases[0].adds[0].arrivalRound).toBe(2);
  });
});

describe('validator', () => {
  it('produces explained warnings and flags absorption as unsupported', () => {
    const design = soloBossDesign();
    design.enemies[0].phases[0].defenses = { primary: 'absorption' };
    const party = analyzePartyActors(freshMr2Party());
    const solution = solveEncounterForParty(design, party);
    const warnings = validateEncounter(design, solution);
    expect(warnings.some((w) => w.code === 'defense-unsupported')).toBe(true);
    // Warnings explain WHY (contain reasoning text, not just labels).
    for (const w of warnings) expect(w.message.length).toBeGreaterThan(20);
  });

  it('warns when a GM health override stretches the phase', () => {
    const design = soloBossDesign();
    const party = analyzePartyActors(freshMr2Party());
    const base = solveEncounterForParty(design, party);
    design.enemies[0].phases[0].overrides.health = base.phases[0].enemies[0].health * 3;
    const solution = solveEncounterForParty(design, party);
    const warnings = validateEncounter(design, solution);
    expect(solution.phases[0].durability.expectedPhaseRounds).toBeGreaterThan(
      base.phases[0].durability.expectedPhaseRounds,
    );
    expect(warnings.some((w) => w.code === 'phase-too-long')).toBe(true);
  });
});
