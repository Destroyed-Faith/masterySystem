/**
 * Encounter Forge parity — live combat aggregators, legal attack profiles,
 * action-economy bands, solver/review hit-chance, attack-pool cap warning.
 */
import { describe, it, expect } from 'vitest';
import { analyzePartyActors } from '../src/creation/encounter-forge/party-analyzer';
import { analyzePartyActionEconomy, simulateNpcOffense, solveAttack } from '../src/creation/encounter-forge/offense-solver';
import { defaultAttackConcept, defaultEncounterDesign, defaultMainEnemy, syncPhaseCount } from '../src/creation/encounter-forge/encounter-model';
import { solveEncounterForParty } from '../src/creation/encounter-forge/solve-encounter';
import { validateEncounter } from '../src/creation/encounter-forge/encounter-validator';
import { pcSpellCastingTn, rawHitChance } from '../src/creation/encounter-forge/combat-math';
import { ENCOUNTER_TUNING } from '../src/creation/encounter-forge/encounter-tuning';
import { getTargetArmor, getTargetEvade, getTargetSpellResistance } from '../src/combat/target-defenses';

function makeActor(spec: {
  name: string;
  mr?: number;
  might?: number;
  agility?: number;
  vitality?: number;
  intellect?: number;
  resolve?: number;
  wits?: number;
  evade?: number;
  armor?: number;
  evadeBuff?: number;
  armorBuff?: number;
  srBuff?: number;
  drPct?: number;
  spellResistance?: number;
  weaponDice?: number;
  power?: { name: string; dice: number; once?: boolean; ignoreWeapon?: boolean };
  spell?: { name?: string; dice: number; level: number; mental?: boolean };
}): any {
  const mr = spec.mr ?? 2;
  const vitality = spec.vitality ?? 10;
  const barMax = vitality * 2;
  const items: any[] = [
    {
      type: 'weapon',
      name: 'Klinge',
      system: { equipped: true, damage: `${spec.weaponDice ?? 3}d8`, specials: [] },
    },
  ];
  if (spec.power) {
    items.push({
      type: 'power',
      name: spec.power.name,
      system: {
        rank: 3,
        roll: { damage: `${spec.power.dice}d8` },
        oncePerCombat: spec.power.once === true,
        ignoreWeaponDamage: spec.power.ignoreWeapon === true,
      },
    });
  }
  if (spec.spell) {
    items.push({
      type: 'power',
      name: spec.spell.name ?? 'Zauberstrahl',
      system: {
        isSpell: true,
        rank: spec.spell.level,
        roll: { damage: `${spec.spell.dice}d8` },
        castingAttribute: 'intellect',
        tags: spec.spell.mental ? ['mental'] : [],
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
        intellect: { value: spec.intellect ?? 8 },
        resolve: { value: spec.resolve ?? 6 },
        influence: { value: 4 },
        wits: { value: spec.wits ?? 6 },
      },
      combat: {
        evadeTotal: spec.evade ?? mr * 4 + 2,
        armorTotal: spec.armor ?? mr + 4,
        evadeFromActiveBuffs: spec.evadeBuff ?? 0,
        armorFromActiveBuffs: spec.armorBuff ?? 0,
        spellResistanceFromActiveBuffs: spec.srBuff ?? 0,
        damageReductionPct: spec.drPct ?? 0,
        spellResistanceTotal: spec.spellResistance ?? 0,
      },
      health: {
        bars: [
          { name: 'Healthy', max: barMax, current: barMax, penalty: 0 },
          { name: 'Bruised', max: barMax, current: barMax, penalty: -1 },
        ],
        tempHP: 0,
        currentBar: 0,
      },
      statusEffects: [],
    },
    items,
  };
}

describe('defense: live aggregators', () => {
  it('uses Evade + Active Buff (getTargetEvade), not bare evadeTotal', () => {
    const actor = makeActor({ name: 'Buffed', evade: 17, evadeBuff: 8, armor: 7, armorBuff: 3 });
    expect(getTargetEvade(actor)).toBe(25);
    expect(getTargetArmor(actor)).toBe(10);
    const profile = analyzePartyActors([actor]).members[0];
    expect(profile.defense.baseline.evade).toBe(17);
    expect(profile.defense.sustained.evade).toBe(25);
    expect(profile.evade).toBe(25);
    expect(profile.defense.baseline.armor).toBe(7);
    expect(profile.defense.sustained.armor).toBe(10);
    expect(profile.armor).toBe(10);
  });

  it('includes Spell Resistance from active buffs in Sustained', () => {
    const actor = makeActor({ name: 'Ward', spellResistance: 4, srBuff: 6 });
    expect(getTargetSpellResistance(actor)).toBe(10);
    const profile = analyzePartyActors([actor]).members[0];
    expect(profile.defense.baseline.spellResistance).toBe(4);
    expect(profile.spellResistance).toBe(10);
  });
});

describe('offense: legal attack profiles', () => {
  it('Basic Attack scales as Weapon + MR × 2d8', () => {
    const cases = [
      { mr: 1, weapon: 3, expect: 5 },
      { mr: 2, weapon: 3, expect: 7 },
      { mr: 3, weapon: 4, expect: 10 },
      { mr: 4, weapon: 2, expect: 10 },
    ];
    for (const c of cases) {
      const profile = analyzePartyActors([
        makeActor({ name: `MR${c.mr}`, mr: c.mr, weaponDice: c.weapon, might: 10, agility: 7, intellect: 7, resolve: 7, wits: 7 }),
      ]).members[0];
      const basic = profile.offense.baseline.attack;
      expect(basic.role).toBe('basic');
      expect(basic.damageDice).toBe(c.expect);
    }
  });

  it('keeps Basic, Power-rider and Spell as distinct legal profiles', () => {
    const profile = analyzePartyActors([
      makeActor({
        name: 'Mixed',
        mr: 2,
        weaponDice: 4,
        power: { name: 'Schwung', dice: 5 },
        spell: { dice: 6, level: 4 },
      }),
    ]).members[0];
    const roles = profile.offense.sustained.attacks.map((a) => a.role);
    expect(roles).toContain('basic');
    expect(roles).toContain('power-rider');
    expect(roles).toContain('spell');
    const basic = profile.offense.sustained.attacks.find((a) => a.role === 'basic')!;
    const rider = profile.offense.sustained.attacks.find((a) => a.role === 'power-rider')!;
    const spell = profile.offense.sustained.attacks.find((a) => a.role === 'spell')!;
    expect(basic.damageDice).toBe(8); // 4 + MR×2
    expect(rider.damageDice).toBe(9); // 4 weapon + 5 power, no MR×2
    expect(spell.damageDice).toBe(6);
    expect(rider.notes.some((n) => /kein MR/.test(n))).toBe(true);
  });

  it('puts once-per-combat Power only in Burst', () => {
    const profile = analyzePartyActors([
      makeActor({
        name: 'Nova',
        mr: 2,
        weaponDice: 3,
        power: { name: 'Finisher', dice: 10, once: true },
      }),
    ]).members[0];
    expect(profile.offense.sustained.attacks.some((a) => a.label === 'Finisher + Klinge')).toBe(false);
    expect(profile.offense.burst.attacks.some((a) => a.label === 'Finisher + Klinge')).toBe(true);
    expect(profile.offense.sustained.attack.role).toBe('basic');
  });
});

describe('action economy: extra actions only in Burst', () => {
  it('does not treat Stone extra actions as permanently available', () => {
    const rich = makeActor({
      name: 'Rich',
      might: 24,
      agility: 16,
      vitality: 16,
      intellect: 16,
      resolve: 16,
      wits: 8,
    });
    const poor = makeActor({
      name: 'Poor',
      might: 7,
      agility: 7,
      vitality: 7,
      intellect: 7,
      resolve: 7,
      wits: 7,
    });
    const party = analyzePartyActors([rich, poor]);
    const richP = party.members[0];
    const poorP = party.members[1];
    expect(richP.stonesTotal).toBeGreaterThanOrEqual(3);
    expect(richP.attackActionsPerRound).toBe(1);
    expect(richP.offense.sustained.attackActions).toBe(1);
    expect(richP.burstExtraActions).toBe(2);
    expect(richP.offense.burst.attackActions).toBe(3);
    expect(poorP.burstExtraActions).toBe(0);
    expect(poorP.offense.burst.attackActions).toBe(1);

    const economy = analyzePartyActionEconomy(party);
    expect(economy.offensiveActionsPerRound).toBe(2);
    expect(economy.sustainableExtraActions).toBe(0);
    expect(economy.burstExtraActions).toBe(2);
  });
});

describe('spell TN from caster MR', () => {
  it('is 8 × caster MR (+4 Mental), not Power Level', () => {
    expect(pcSpellCastingTn(2)).toBe(16);
    expect(pcSpellCastingTn(3)).toBe(24);
    expect(pcSpellCastingTn(3, 4)).toBe(28);
    expect(pcSpellCastingTn(3, 0, { mental: true })).toBe(28);
    expect(pcSpellCastingTn(3, 2, { mental: true })).toBe(30);
    // Old PL formula 8×ceil(PL/2) for PL 4 would be 16 — must differ at MR 3.
    expect(pcSpellCastingTn(3)).not.toBe(8 * Math.ceil(4 / 2));
  });

  it('stores caster MR on the Spell profile', () => {
    const profile = analyzePartyActors([
      makeActor({ name: 'Caster', mr: 3, spell: { dice: 5, level: 4, mental: true } }),
    ]).members[0];
    const spell = profile.attacks.find((a) => a.role === 'spell')!;
    expect(spell.casterMr).toBe(3);
    expect(spell.isMental).toBe(true);
    expect(spell.notes.some((n) => /8×MR/.test(n))).toBe(true);
  });
});

describe('solver / review hit-chance parity', () => {
  it('review connect chance uses the same TN as the pool search', () => {
    const party = analyzePartyActors([
      makeActor({ name: 'A', mr: 2, evade: 12 }),
      makeActor({ name: 'B', mr: 2, evade: 16 }),
    ]);
    const hostile = 3;
    const solved = solveAttack(defaultAttackConcept({ id: 'parity-claw', name: 'Klaue' }), {
      party,
      npcMr: 2,
      totalHostileAttacks: hostile,
      hlBudget: 0.35,
    });
    const review = simulateNpcOffense(party, [solved], 2, 2.5, hostile);
    const avgReview =
      review.perPc.reduce((a, pc) => a + pc.byAttack[0].connectChance, 0) / review.perPc.length;
    expect(avgReview).toBeCloseTo(solved.achievedHitChance, 10);

    const reactionShare = (ENCOUNTER_TUNING.reactionUsageRate * (2 * 2)) / hostile;
    for (let i = 0; i < party.members.length; i += 1) {
      const expected = rawHitChance(
        solved.attackPool,
        solved.keep,
        party.members[i].evade + reactionShare,
      );
      expect(review.perPc[i].byAttack[0].connectChance).toBeCloseTo(expected, 10);
    }
  });
});

describe('attack-pool cap warning', () => {
  it('flags the encounter when pool 20 cannot reach the target hit chance', () => {
    const party = analyzePartyActors([
      makeActor({ name: 'Ghost', mr: 3, evade: 55 }),
      makeActor({ name: 'Shade', mr: 3, evade: 50 }),
    ]);
    const solved = solveAttack(defaultAttackConcept({ id: 'cap-hit', name: 'Verfehlung' }), {
      party,
      npcMr: 3,
      totalHostileAttacks: 2,
      hlBudget: 0.35,
    });
    expect(solved.attackPool).toBe(ENCOUNTER_TUNING.maxAttackPool);
    expect(solved.achievedHitChance).toBeLessThan(ENCOUNTER_TUNING.targetNpcHitChance);
    expect(solved.poolAtCap).toBe(true);

    const design = defaultEncounterDesign();
    design.name = 'Cap';
    const enemy = defaultMainEnemy('Phantom', 1);
    enemy.attacks = [defaultAttackConcept({ name: 'Verfehlung' })];
    enemy.phases[0].attackIds = enemy.attacks.map((a) => a.id);
    design.enemies = [enemy];
    syncPhaseCount(design);
    const solution = solveEncounterForParty(design, party);
    expect(solution.phases[0].enemies[0].attacks.some((a) => a.poolAtCap)).toBe(true);
    const warnings = validateEncounter(design, solution);
    expect(warnings.some((w) => w.code === 'attack-pool-cap')).toBe(true);
    expect(warnings.find((w) => w.code === 'attack-pool-cap')!.message).toMatch(/außerhalb|Deckel|Suchraum/i);
  });
});
