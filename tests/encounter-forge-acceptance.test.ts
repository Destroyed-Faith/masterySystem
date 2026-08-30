/**
 * Encounter Forge acceptance cases:
 *
 *  1. "Nargat" — phased solo boss with summoned adds (the design acceptance
 *     case): GM concept stays identical, generator solves all numbers,
 *     phases carry their own health pools, actor payload is sheet-true.
 *  2. Special escalation — round-based Special simulation must produce
 *     escalating pressure and the validator must warn about it.
 *  3. Party specials escalate the durability curve (Corrode vs armor boss).
 */
import { describe, it, expect } from 'vitest';
import {
  defaultAttackConcept,
  defaultEncounterDesign,
  defaultMainEnemy,
  syncPhaseCount,
  type EncounterDesign,
} from '../src/creation/encounter-forge/encounter-model';
import { analyzePartyActors } from '../src/creation/encounter-forge/party-analyzer';
import { solveEncounterForParty } from '../src/creation/encounter-forge/solve-encounter';
import { validateEncounter } from '../src/creation/encounter-forge/encounter-validator';
import {
  buildForgeNpcSystem,
  solvedAttackToNpcRow,
} from '../src/creation/encounter-forge/encounter-forge-apply';
import { simulateFocusDamageCurve } from '../src/creation/encounter-forge/encounter-simulator';
import { ENCOUNTER_TUNING } from '../src/creation/encounter-forge/encounter-tuning';

function makePc(spec: {
  name: string;
  mr?: number;
  might?: number;
  vitality?: number;
  evade?: number;
  armor?: number;
  weaponDice?: number;
  weaponSpecials?: string[];
}): any {
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
  return {
    id: `pc-${spec.name}`,
    name: spec.name,
    system: {
      mastery: { rank: mr },
      attributes: {
        might: { value: spec.might ?? 12 },
        agility: { value: 8 },
        vitality: { value: vitality },
        intellect: { value: 8 },
        resolve: { value: 6 },
        influence: { value: 4 },
        wits: { value: 6 },
      },
      combat: {
        evadeTotal: spec.evade ?? mr * 4 + 2,
        armorTotal: spec.armor ?? mr + 4,
        damageReductionPct: 0,
        spellResistanceTotal: 0,
      },
      health: { bars, tempHP: 0, currentBar: 0 },
      statusEffects: [],
    },
    items: [
      {
        type: 'weapon',
        name: 'Waffe',
        system: {
          equipped: true,
          damage: `${spec.weaponDice ?? 3}d8`,
          specials: spec.weaponSpecials ?? [],
        },
      },
    ],
  };
}

function benchmarkParty(): any[] {
  return [
    makePc({ name: 'Myrial', mr: 2, might: 14, weaponDice: 4 }),
    makePc({ name: 'Brakk', mr: 2, might: 12, armor: 9 }),
    makePc({ name: 'Ivo', mr: 2, might: 10, evade: 14 }),
    makePc({ name: 'Senna', mr: 2, might: 10 }),
  ];
}

function nargatDesign(): EncounterDesign {
  const design = defaultEncounterDesign();
  design.name = 'Nargat, Herr der Grube';
  design.phaseCount = 2;

  const nargat = defaultMainEnemy('Nargat', 2);
  nargat.concept = 'Gepanzerter Grubenherr; wirft in Phase 2 die Rüstung ab und wird schnell.';
  nargat.attacks = [
    defaultAttackConcept({ name: 'Kettenpeitsche', specialId: 'lacerate', range: 4 }),
    defaultAttackConcept({ name: 'Grubenfeuer', resolution: 'spell', delivery: 'ranged', area: 'radius', areaSize: 3, range: 16 }),
    defaultAttackConcept({ name: 'Schmetterschlag' }),
  ];
  // Phase 1: armored juggernaut with parry.
  nargat.phases[0].defenses = { primary: 'armor', secondary: 'parry' };
  nargat.phases[0].attackIds = [nargat.attacks[0].id, nargat.attacks[2].id];
  nargat.phases[0].reactions = [{ id: 'guard' }];
  // Phase 2: sheds armor, becomes evasive, unlocks the fire spell.
  nargat.phases[1].defenses = { primary: 'evade', secondary: 'spellResistance' };
  nargat.phases[1].attackIds = nargat.attacks.map((a) => a.id);
  nargat.phases[1].movement = { kind: 'teleport', name: 'Schattensprung', escapesMelee: true };
  nargat.phases[1].mechanicsNote = 'Die Grube brennt; Nargat springt zwischen Plattformen.';

  design.enemies = [nargat];
  design.addGroups.push({
    id: 'brood',
    name: 'Grubenbrut',
    count: 2,
    role: 'damage',
    arrival: { type: 'summon', summonerEnemyId: nargat.id },
    specialId: null,
    hitsToKill: 1,
    attacks: true,
  });
  syncPhaseCount(design);
  return design;
}

describe('Nargat acceptance case', () => {
  const design = nargatDesign();
  const party = analyzePartyActors(benchmarkParty());
  const solution = solveEncounterForParty(design, party);
  const warnings = validateEncounter(design, solution);

  it('solves both phases with own health pools and phase-true defenses', () => {
    expect(solution.phases.length).toBe(2);
    const p1 = solution.phases[0].enemies[0];
    const p2 = solution.phases[1].enemies[0];
    expect(p1.health).toBeGreaterThan(0);
    expect(p2.health).toBeGreaterThan(0);
    // Phase 1 identity: armor; phase 2 identity: evade.
    expect(p1.defensePackage.defenses.armor).toBeGreaterThan(p2.defensePackage.defenses.armor);
    expect(p2.defensePackage.defenses.evade).toBeGreaterThan(p1.defensePackage.defenses.evade);
    // Parry chosen in phase 1 -> solved strip value present.
    expect(p1.defensePackage.defenses.parryStrip).toBeGreaterThan(0);
  });

  it('keeps each phase near the duration target', () => {
    for (const phase of solution.phases) {
      expect(phase.durability.expectedPhaseRounds).toBeGreaterThan(1.4);
      expect(phase.durability.expectedPhaseRounds).toBeLessThan(4.5);
    }
  });

  it('summon costs the boss an action and the brood arrives round 2', () => {
    expect(solution.phases[0].enemies[0].paysSummonAction).toBe(true);
    expect(solution.phases[0].adds[0].arrivalRound).toBe(2);
    expect(warnings.some((w) => w.code === 'summon-cost')).toBe(true);
  });

  it('writes a sheet-true actor payload without fake attributes', () => {
    const system: any = buildForgeNpcSystem(design, design.enemies[0], solution.phases);
    // No attribute block written at all — NPC combat math never reads it.
    expect(system.attributes).toBeUndefined();
    // Phase pools: top-level health mirrors phase 1; phases carry their own.
    expect(system.health.bars[0].max).toBe(solution.phases[0].enemies[0].health);
    expect(Array.isArray(system.phases)).toBe(true);
    expect(system.phases.length).toBe(2);
    expect(system.phases[1].health.bars[0].max).toBe(solution.phases[1].enemies[0].health);
    // Defenses land in editable stat-block fields.
    const d1 = solution.phases[0].enemies[0].defensePackage.defenses;
    expect(system.combat.evade).toBe(Math.round(d1.evade));
    expect(system.combat.armor).toBe(Math.round(d1.armor));
    const d2 = solution.phases[1].enemies[0].defensePackage.defenses;
    expect(system.phases[1].combat.spellResistance).toBe(Math.round(d2.spellResistance));
    // Parry appears as a table-facing reaction row.
    const reactionNames = (system.npcReactions as any[]).map((r) => String(r.name));
    expect(reactionNames.some((n) => n.includes('Parade'))).toBe(true);
    // Attack rows carry solver values and legality metadata.
    const row: any = system.npcBaseAttack;
    expect(row.attackDiceCount).toBeGreaterThan(0);
    expect(row.damageDiceCount).toBeGreaterThan(0);
    // Phase 2 unlocks the spell — its row must be marked as spell.
    const p2Rows = [system.phases[1].npcBaseAttack, ...system.phases[1].attackValues];
    expect(p2Rows.some((r: any) => r.npcIsSpell === true)).toBe(true);
  });

  it('is deterministic across repeated solves', () => {
    const again = solveEncounterForParty(design, party);
    expect(JSON.stringify(again)).toBe(JSON.stringify(solution));
  });
});

describe('special escalation acceptance case', () => {
  it('round-based simulation escalates and the review warns', () => {
    const design = defaultEncounterDesign();
    design.name = 'Fäulnisherold';
    const boss = defaultMainEnemy('Fäulnisherold', 1);
    const ruinAttack = defaultAttackConcept({ name: 'Fäulnisgriff', specialId: 'ruin' });
    ruinAttack.overrides.specialValue = 7; // deliberately hot Special
    boss.attacks = [ruinAttack, defaultAttackConcept({ name: 'Klauenhieb' })];
    boss.phases[0].attackIds = boss.attacks.map((a) => a.id);
    boss.phases[0].defenses = { primary: 'armor' };
    // GM override: extra-durable boss -> long phase -> escalation shows.
    design.enemies = [boss];
    syncPhaseCount(design);

    const party = analyzePartyActors(benchmarkParty());
    const base = solveEncounterForParty(design, party);
    boss.phases[0].overrides.health = base.phases[0].enemies[0].health * 2.2;
    const solution = solveEncounterForParty(design, party);
    const warnings = validateEncounter(design, solution);

    // Specials accumulate across rounds (peak > single application value).
    const peak = Math.max(...solution.phases[0].offense.perPc.map((p) => p.peakSpecialStacks));
    expect(peak).toBeGreaterThan(0);
    // Review warns about escalating danger / accumulation / duration.
    expect(
      warnings.some((w) =>
        ['special-accumulation', 'late-round-escalation', 'phase-too-long', 'pc-outlier'].includes(
          w.code,
        ),
      ),
    ).toBe(true);
  });

  it('party Corrode escalates the damage curve against an armor boss', () => {
    const party = analyzePartyActors([
      makePc({ name: 'A', might: 14, weaponDice: 4, weaponSpecials: ['Corrode(3)'] }),
      makePc({ name: 'B', might: 12, weaponDice: 3, weaponSpecials: ['Corrode(3)'] }),
      makePc({ name: 'C', might: 12, weaponDice: 3 }),
    ]);
    const body = {
      id: 'x',
      name: 'Panzer',
      mr: 2,
      defenses: {
        evade: 10,
        armor: 18,
        parryStrip: 0,
        ward: 0,
        damageNegationDice: 0,
        drPct: 0,
        spellResistance: 0,
        phasingCharges: 0,
      },
      meleeEscape: false,
      movesPerRound: 1,
    };
    const curve = simulateFocusDamageCurve(party, body, { maxRounds: 5 });
    // Corrode strips armor round over round -> later rounds hit harder.
    expect(curve.roundDamage[3]).toBeGreaterThan(curve.roundDamage[0] * 1.15);
    expect(curve.peakSpecialStacks).toBeGreaterThan(0);
  });
});

describe('attack row mapping', () => {
  it('maps AoE spells to canonical NPC row fields', () => {
    const row: any = solvedAttackToNpcRow({
      conceptId: 'c',
      name: 'Grubenfeuer',
      resolution: 'spell',
      delivery: 'ranged',
      area: 'radius',
      areaSize: 3,
      range: 16,
      attackPool: 9,
      keep: 2,
      damageDice: 4,
      penetration: 0,
      specialId: 'ruin',
      specialValue: 3,
      stress: true,
      usesPerRound: 1,
      occupancy: { single: 1, typical: 2, dangerous: 3 },
    });
    expect(row.npcIsSpell).toBe(true);
    expect(row.npcRangeKind).toBe('ranged');
    expect(row.npcAoeShape).toBe('radius');
    expect(row.npcAoeRadiusM).toBe(3);
    expect(row.specials[0].special).toBe('Ruin');
    expect(row.specials[0].specialValue).toBe(3);
    expect(row.npcAttacksPerRound).toBe(1);
  });
});
