/**
 * Encounter Forge orchestrator.
 *
 * Runs the full pipeline for a GM design against the selected party:
 *
 *   Party analysis -> per-phase: Defense Solver -> Health Solver (residual)
 *   -> Action Economy Solver -> Offense Solver (per-PC matrix) -> NPC offense
 *   simulation -> injury feedback pass -> phase report.
 *
 * Everything is deterministic: the same design + the same party always
 * produces the identical solution (no Math.random anywhere downstream).
 *
 * NPC Mastery Rank is set to the party's median MR — its only roles are the
 * legitimate system ones (keep dice, NPC spell TN, natural recovery). It is
 * NOT a balancing lever; all balancing derives from the solvers.
 */

import { ENCOUNTER_TUNING } from './encounter-tuning.js';
import type {
  AddGroupConcept,
  EncounterDesign,
  MainEnemyConcept,
} from './encounter-model.js';
import { analyzePartyActors, type PartyProfile } from './party-analyzer.js';
import {
  solveDefenses,
  solvePhaseHealth,
  type HealthSolveResult,
  type SolvedDefensePackage,
} from './defense-solver.js';
import {
  recommendActionEconomy,
  simulateNpcOffense,
  solveAttack,
  type ActionEconomyRecommendation,
  type OffenseSimulationResult,
  type SolvedAttack,
} from './offense-solver.js';
import type { AddClearWave, BodyDurabilityConfig } from './encounter-simulator.js';
import { defaultAttackConcept } from './encounter-model.js';

/* ------------------------------------------------------------------ */
/* Solution types                                                      */
/* ------------------------------------------------------------------ */

export interface SolvedEnemyPhase {
  enemyId: string;
  enemyName: string;
  phaseIndex: number;
  mr: number;
  defensePackage: SolvedDefensePackage;
  /** Solved phase health for THIS phase pool. */
  health: number;
  offensiveActions: number;
  attacks: SolvedAttack[];
  /** True when the enemy pays an attack action to summon in this phase. */
  paysSummonAction: boolean;
}

export interface SolvedAddGroup {
  groupId: string;
  name: string;
  count: number;
  arrivalRound: number;
  attacks: SolvedAttack | null;
  /** Health per add body (from hits-to-kill vs this party). */
  healthPerAdd: number;
}

export interface SolvedPhase {
  phaseIndex: number;
  enemies: SolvedEnemyPhase[];
  adds: SolvedAddGroup[];
  actionEconomy: ActionEconomyRecommendation;
  durability: HealthSolveResult;
  offense: OffenseSimulationResult;
  /** Hostile offensive actions remaining after the first body drops. */
  hostileActionsAfterFirstDrop: number;
}

export interface EncounterSolution {
  party: PartyProfile;
  phases: SolvedPhase[];
  totalExpectedRounds: number;
  /** Developer-facing derivation notes (diagnostics, not GM UI). */
  diagnostics: string[];
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function addArrivalRound(add: AddGroupConcept, phaseIndex: number): number | null {
  switch (add.arrival.type) {
    case 'fixed':
      return phaseIndex === 0 ? 1 : null;
    case 'reinforcement': {
      const t = add.arrival.trigger;
      if (t.kind === 'round') return phaseIndex === 0 ? Math.max(1, t.round) : null;
      if (t.kind === 'phaseStart') return t.phase - 1 === phaseIndex ? 1 : null;
      return phaseIndex === 0 ? 2 : null; // custom trigger: assume mid-phase-1
    }
    case 'summon':
      // Summons are cast during the phase: body active from round 2 on.
      return phaseIndex === 0 ? 2 : null;
  }
}

/** Expected damage of one average party hit (for add health from hits-to-kill). */
function averagePartyHitDamage(party: PartyProfile): number {
  let total = 0;
  for (const m of party.members) {
    total += 4.5 * m.bestAttack.damageDice + m.bestAttack.flatDamage;
  }
  return total / Math.max(1, party.members.length);
}

/* ------------------------------------------------------------------ */
/* Main solve                                                          */
/* ------------------------------------------------------------------ */

export function solveEncounter(design: EncounterDesign, partyActors: any[]): EncounterSolution {
  const party = analyzePartyActors(partyActors);
  return solveEncounterForParty(design, party);
}

export function solveEncounterForParty(
  design: EncounterDesign,
  party: PartyProfile,
): EncounterSolution {
  const tuning = ENCOUNTER_TUNING;
  const diagnostics: string[] = [];
  const npcMr = Math.max(1, Math.min(8, party.medianMr));
  diagnostics.push(
    `NPC MR = ${npcMr} (Median der Gruppe; nur Keep/Spell-TN/Recovery — kein Balancing-Hebel).`,
  );

  const phases: SolvedPhase[] = [];
  let totalRounds = 0;

  for (let phaseIndex = 0; phaseIndex < design.phaseCount; phaseIndex += 1) {
    const enemies = design.enemies;

    /* ---- Adds in this phase ---- */
    const phaseAdds = design.addGroups
      .map((g) => ({ group: g, arrival: addArrivalRound(g, phaseIndex) }))
      .filter((x): x is { group: AddGroupConcept; arrival: number } => x.arrival != null);
    const avgHit = averagePartyHitDamage(party);
    const addWaves: AddClearWave[] = phaseAdds
      .filter((x) => x.group.role !== 'position')
      .map((x) => ({
        round: x.arrival,
        hits: Math.max(1, x.group.count) * Math.max(1, x.group.hitsToKill),
      }));

    // Copies: independent copies are target dilution -> extra clear hits;
    // shared-health copies only contribute attacks (damage hits the shared pool).
    for (const enemy of enemies) {
      const c = enemy.copies;
      if (!c.enabled || c.count <= 0) continue;
      if (c.health === 'independent') {
        addWaves.push({ round: 1, hits: c.count * (c.fragile ? 1 : 2) });
      }
    }

    const attackingAdds = phaseAdds
      .filter((x) => x.group.attacks)
      .reduce((a, x) => a + Math.max(1, x.group.count), 0);
    const attackingCopies = enemies.reduce(
      (a, e) => a + (e.copies.enabled && e.copies.attack ? e.copies.count : 0),
      0,
    );

    /* ---- Action economy ---- */
    const economy = recommendActionEconomy(party, enemies.length, attackingAdds + attackingCopies);

    /* ---- Defense solving per enemy ---- */
    const defensePackages: SolvedDefensePackage[] = [];
    const bodies: BodyDurabilityConfig[] = [];
    enemies.forEach((enemy, i) => {
      const phase = enemy.phases[Math.min(phaseIndex, enemy.phases.length - 1)];
      const pkg = solveDefenses({
        party,
        selection: phase.defenses,
        mr: npcMr,
        meleeEscape: phase.movement.escapesMelee,
        addWaves,
      });
      // GM defense overrides replace solved values (validation reruns below).
      const o = phase.overrides;
      if (o.evade != null) pkg.defenses.evade = o.evade;
      if (o.armor != null) pkg.defenses.armor = o.armor;
      if (o.parry != null) pkg.defenses.parryStrip = o.parry;
      if (o.ward != null) pkg.defenses.ward = o.ward;
      if (o.damageNegation != null) pkg.defenses.damageNegationDice = o.damageNegation;
      if (o.damageReductionPct != null) pkg.defenses.drPct = o.damageReductionPct;
      if (o.spellResistance != null) pkg.defenses.spellResistance = o.spellResistance;
      if (o.phasingCharges != null) pkg.defenses.phasingCharges = o.phasingCharges;
      defensePackages.push(pkg);
      bodies.push({
        id: enemy.id,
        name: enemy.name,
        mr: npcMr,
        defenses: pkg.defenses,
        meleeEscape: phase.movement.escapesMelee,
        movesPerRound: 1,
      });
    });

    /* ---- Health solving (residual durability) ---- */
    const healthOverrides = enemies.map(
      (e) => e.phases[Math.min(phaseIndex, e.phases.length - 1)].overrides.health,
    );
    let durability = solvePhaseHealth({ party, bodies, addWaves, healthOverrides });

    /* ---- Offense solving ---- */
    const perBodyActions = enemies.map((enemy, i) => {
      const o = enemy.phases[Math.min(phaseIndex, enemy.phases.length - 1)].overrides;
      return o.offensiveActions != null
        ? Math.max(1, o.offensiveActions)
        : (economy.perBody[i] ?? tuning.minActionsPerBody);
    });
    const bossInstances = perBodyActions.reduce((a, b) => a + b, 0) + attackingCopies;
    const addInstanceWeight = attackingAdds * tuning.addActionWeight;
    const totalWeightedInstances = bossInstances + addInstanceWeight;
    const totalHostileAttacks = bossInstances + attackingAdds;
    const partyHlBudget = party.size * tuning.targetHealthLevelLossPerPcRound;
    const perInstanceBudget =
      totalWeightedInstances > 0 ? partyHlBudget / totalWeightedInstances : partyHlBudget;

    const solvedEnemies: SolvedEnemyPhase[] = [];
    const allPhaseAttacks: SolvedAttack[] = [];
    enemies.forEach((enemy, i) => {
      const phase = enemy.phases[Math.min(phaseIndex, enemy.phases.length - 1)];
      const activeConcepts = enemy.attacks.filter((a) => phase.attackIds.includes(a.id));
      const concepts = activeConcepts.length > 0 ? activeConcepts : enemy.attacks.slice(0, 1);
      const actions = perBodyActions[i];
      const paysSummonAction =
        phaseIndex === 0 &&
        design.addGroups.some(
          (g) => g.arrival.type === 'summon' && g.arrival.summonerEnemyId === enemy.id,
        );

      const solved: SolvedAttack[] = concepts.map((concept) =>
        solveAttack(concept, {
          party,
          npcMr,
          totalHostileAttacks,
          hlBudget: perInstanceBudget,
        }),
      );
      // Distribute the enemy's actions across its DISTINCT attacks first;
      // only if the GM assigned more actions than attacks does a row get a
      // second use per round (legal via npcAttacksPerRound; validator warns).
      let remaining = actions - solved.length;
      let idx = 0;
      while (remaining > 0 && solved.length > 0) {
        solved[idx % solved.length].usesPerRound += 1;
        idx += 1;
        remaining -= 1;
      }

      // Copies that attack: extra uses of the enemy's first attack.
      if (enemy.copies.enabled && enemy.copies.attack && solved.length > 0) {
        solved[0].usesPerRound += enemy.copies.count;
      }

      solvedEnemies.push({
        enemyId: enemy.id,
        enemyName: enemy.name,
        phaseIndex,
        mr: npcMr,
        defensePackage: defensePackages[i],
        health: durability.healths[i],
        offensiveActions: actions,
        attacks: solved,
        paysSummonAction,
      });
      allPhaseAttacks.push(...solved);
    });

    /* ---- Add attacks ---- */
    const solvedAdds: SolvedAddGroup[] = phaseAdds.map(({ group, arrival }) => {
      let attack: SolvedAttack | null = null;
      if (group.attacks) {
        const concept = defaultAttackConcept({
          // Deterministic id: identical design+party must yield an identical
          // solution, including generated concept ids.
          id: `addatk-${group.id}`,
          name: `${group.name} — Angriff`,
          specialId: group.role === 'special' ? group.specialId : null,
        });
        attack = solveAttack(concept, {
          party,
          npcMr: Math.max(1, npcMr - 1),
          totalHostileAttacks,
          hlBudget: perInstanceBudget * tuning.addActionWeight,
        });
        attack.usesPerRound = Math.max(1, group.count);
        allPhaseAttacks.push(attack);
      }
      return {
        groupId: group.id,
        name: group.name,
        count: group.count,
        arrivalRound: arrival,
        attacks: attack,
        healthPerAdd: Math.max(1, Math.round(avgHit * Math.max(1, group.hitsToKill) * 0.9)),
      };
    });

    /* ---- NPC offense simulation + injury feedback ---- */
    const offense = simulateNpcOffense(
      party,
      allPhaseAttacks,
      npcMr,
      Math.max(1, durability.expectedPhaseRounds),
    );
    // Second durability pass: expected injuries shrink party dice pools.
    const poolPenaltyByRound = offense.perPc.map((r) => r.poolPenaltyByRound);
    durability = solvePhaseHealth({
      party,
      bodies,
      addWaves,
      poolPenaltyByRound,
      // Keep the already-solved health values fixed for the feedback pass.
      healthOverrides: durability.healths,
    });
    solvedEnemies.forEach((e, i) => {
      e.health = durability.healths[i];
    });

    const hostileAfterFirstDrop =
      solvedEnemies.reduce((a, e) => a + e.offensiveActions, 0) -
      (solvedEnemies[0]?.offensiveActions ?? 0) +
      economy.addActions;

    diagnostics.push(
      `Phase ${phaseIndex + 1}: Basis-Output ${defensePackages[0]?.baselineOutputPerRound.toFixed(1)} dmg/R, ` +
        `netto ${defensePackages[0]?.netOutputPerRound.toFixed(1)} dmg/R, ` +
        `Health = kumulierte Kurve @ ${tuning.targetPhaseRounds} R (Fokusfeuer-Effizienz ${tuning.focusFireEfficiency}).`,
    );

    phases.push({
      phaseIndex,
      enemies: solvedEnemies,
      adds: solvedAdds,
      actionEconomy: economy,
      durability,
      offense,
      hostileActionsAfterFirstDrop: hostileAfterFirstDrop,
    });
    totalRounds += durability.expectedPhaseRounds;
  }

  return { party, phases, totalExpectedRounds: totalRounds, diagnostics };
}
