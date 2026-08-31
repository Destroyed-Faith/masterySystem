/**
 * Action Economy Solver + Offense Solver.
 *
 * Action economy: after structure and durability are known, recommend the
 * total hostile offensive actions per round from the PARTY's real action
 * economy (all active hostile bodies share ONE encounter pressure envelope —
 * multiple bosses never each get a full solo budget).
 *
 * Offense: for every NPC attack concept, simulate it against every selected
 * PC individually (attacker/defender matrix — no "average PC") and solve
 * fair Attack Dice, Damage Dice and Special magnitude so the encounter's
 * expected pressure matches the central tuning target. Martial attacks
 * resolve vs each PC's Evade (+ expected defensive reactions); Spells vs the
 * NPC Casting TN (8 × MR) + that PC's Spell Resistance. AoE evaluates
 * explicit occupancy cases instead of a hidden fixed target count.
 */

import { ENCOUNTER_TUNING } from './encounter-tuning.js';
import type { AttackConcept } from './encounter-model.js';
import type { PartyProfile, PcCombatProfile } from './party-analyzer.js';
import {
  expectedHitDamage,
  hitDamageQuantile,
  npcSpellCastingTn,
  rawHitChance,
} from './combat-math.js';
import {
  applyExpectedSpecial,
  processTurnStart,
  totalNegativeStacks,
  type SpecialStacks,
} from './special-sim.js';
import { HEALTH_PENALTY_FRACTIONS } from './combat-math.js';

/* ------------------------------------------------------------------ */
/* Party action economy                                                */
/* ------------------------------------------------------------------ */

export interface PartyActionEconomy {
  /** Sustained offensive actions per round (1 per PC). Stone extras are Burst-only. */
  offensiveActionsPerRound: number;
  /** Always 0 — extra stone actions are not treated as permanently available. */
  sustainableExtraActions: number;
  /** Temporary extra attacks available in a Burst round. */
  burstExtraActions: number;
  reactionsPerRound: number;
}

export function analyzePartyActionEconomy(party: PartyProfile): PartyActionEconomy {
  let offensive = 0;
  let reactions = 0;
  let burstExtras = 0;
  for (const m of party.members) {
    offensive += m.attackActionsPerRound;
    reactions += m.reactionsPerRound;
    burstExtras += m.burstExtraActions ?? 0;
  }
  return {
    offensiveActionsPerRound: offensive,
    sustainableExtraActions: 0,
    burstExtraActions: burstExtras,
    reactionsPerRound: reactions,
  };
}

/* ------------------------------------------------------------------ */
/* Action economy recommendation                                       */
/* ------------------------------------------------------------------ */

export interface ActionEconomyRecommendation {
  totalHostileActions: number;
  /** Recommended offensive actions per main-enemy body (index-aligned). */
  perBody: number[];
  /** Hostile actions consumed by attacking adds. */
  addActions: number;
  /** Party side, for the review. */
  party: PartyActionEconomy;
}

export function recommendActionEconomy(
  party: PartyProfile,
  bodyCount: number,
  attackingAdds: number,
): ActionEconomyRecommendation {
  const tuning = ENCOUNTER_TUNING;
  const pae = analyzePartyActionEconomy(party);
  const partyActions = pae.offensiveActionsPerRound;
  const totalTarget = Math.max(1, Math.round(partyActions * tuning.hostileActionRatio));
  // Attacking adds consume from the same envelope, weighted below full boss
  // actions because their solved attacks are individually weaker.
  const addActions = Math.max(0, attackingAdds);
  const addWeighted = addActions * tuning.addActionWeight;
  const bossBudget = Math.max(bodyCount * tuning.minActionsPerBody, Math.round(totalTarget - addWeighted));
  const perBody: number[] = [];
  let remaining = bossBudget;
  for (let i = 0; i < bodyCount; i += 1) {
    const bodiesLeft = bodyCount - i;
    const share = Math.max(
      tuning.minActionsPerBody,
      Math.min(tuning.maxActionsPerBody, Math.round(remaining / bodiesLeft)),
    );
    perBody.push(share);
    remaining -= share;
  }
  return {
    totalHostileActions: perBody.reduce((a, b) => a + b, 0) + addActions,
    perBody,
    addActions,
    party: pae,
  };
}

/* ------------------------------------------------------------------ */
/* Solved attacks                                                      */
/* ------------------------------------------------------------------ */

export interface AoeOccupancy {
  single: number;
  typical: number;
  dangerous: number;
}

export interface SolvedAttack {
  conceptId: string;
  name: string;
  resolution: 'martial' | 'spell';
  delivery: 'melee' | 'ranged';
  area: AttackConcept['area'];
  areaSize: number;
  range: number;
  attackPool: number;
  keep: number;
  damageDice: number;
  penetration: number;
  specialId: string | null;
  specialValue: number;
  stress: boolean;
  /** Uses per round (1 unless the GM assigned more actions than concepts). */
  usesPerRound: number;
  /** Explicit occupancy assumptions for AoE review lines. */
  occupancy: AoeOccupancy | null;
  /** True when pool 20 still cannot reach the target hit chance. */
  poolAtCap: boolean;
  /** Matrix-average connect chance the solver used (same TN as Review). */
  achievedHitChance: number;
}

/** Occupancy cases when map geometry is unknown (explicit, never hidden). */
export function aoeOccupancy(partySize: number): AoeOccupancy {
  const t = ENCOUNTER_TUNING.aoeOccupancyCases;
  return {
    single: 1,
    typical: Math.max(1, Math.round(partySize * t.typicalFraction)),
    dangerous: Math.max(1, Math.round(partySize * t.dangerousFraction)),
  };
}

/* ------------------------------------------------------------------ */
/* Matrix evaluation helpers                                            */
/* ------------------------------------------------------------------ */

interface PcDefenseView {
  evade: number;
  armor: number;
  drPct: number;
  spellResistance: number;
  hlSize: number;
  mr: number;
  ward: number;
  damageNegationDice: number;
  phasingCharges: number;
}

function pcDefenseView(pc: PcCombatProfile): PcDefenseView {
  return {
    evade: pc.evade,
    armor: pc.armor,
    drPct: pc.drPct,
    spellResistance: pc.spellResistance,
    hlSize: pc.healthLevelSize,
    mr: pc.mr,
    ward: pc.ward ?? 0,
    damageNegationDice: pc.damageNegationDice ?? 0,
    phasingCharges: pc.phasingCharges ?? 0,
  };
}

/**
 * Connect chance of one NPC attack against one PC, including the expected
 * value of the PC's defensive reactions (Evade reaction +2×MR on the TN /
 * Guard +2×MR armor), spread across all hostile attacks per round since a PC
 * has one reaction.
 */
function npcConnectChance(
  pool: number,
  npcMr: number,
  isSpell: boolean,
  pc: PcDefenseView,
  totalHostileAttacks: number,
): number {
  const reactionShare =
    (ENCOUNTER_TUNING.reactionUsageRate * (2 * pc.mr)) / Math.max(1, totalHostileAttacks);
  if (isSpell) {
    const tn = npcSpellCastingTn(npcMr, pc.spellResistance);
    return rawHitChance(pool, npcMr, tn);
  }
  return rawHitChance(pool, npcMr, pc.evade + reactionShare);
}

function npcExpectedHitDamage(
  damageDice: number,
  penetration: number,
  pc: PcDefenseView,
  totalHostileAttacks: number,
): number {
  // Guard reaction EV: +2×MR armor against a share of incoming attacks.
  const guardShare =
    (ENCOUNTER_TUNING.reactionUsageRate * (2 * pc.mr)) / Math.max(1, totalHostileAttacks);
  return expectedHitDamage({
    dice: damageDice,
    penetration,
    armor: pc.armor + guardShare,
    drPct: pc.drPct,
    damageNegationDice: pc.damageNegationDice,
  });
}

/* ------------------------------------------------------------------ */
/* Special pressure estimation                                          */
/* ------------------------------------------------------------------ */

/**
 * Damage-equivalent pressure of ONE point of a special applied to a PC,
 * integrated over its lifetime (victim ticks, recovers MR, decays 1).
 *
 * Estimators follow the canonical special rules; control-type specials use
 * the equivalence "1 point of prevented/lost party output = 1 damage".
 * Unknown specials use a conservative 1 damage-equivalent per point-round.
 */
export function specialPressurePerPoint(
  id: string,
  pc: PcCombatProfile,
  avgNpcHitDamage: number,
  avgNpcConnect: number,
): number {
  // Expected lifetime in victim turns of one applied point under
  // recovery MR + decay 1 — a single point almost always clears in 1 turn,
  // but pressure scales with value; we estimate per-point lifetime ≈ 1 turn
  // and let the solver scale the value linearly.
  const lifetime = 1;
  switch (id) {
    case 'ruin':
    case 'exorcism':
    case 'requiem':
      return 1 * lifetime; // 1 HP per point per tick, ignores Armor
    case 'lacerate':
      return 1 * lifetime; // ~1 voluntary move per round expected
    case 'slow':
      return 0.5 * lifetime; // movement tax or damage when standing
    case 'blight':
      return 0.5 * lifetime; // stress pressure — no HL impact, discounted
    case 'corrode':
      // Armor −1 → future NPC hits deal more; measure the derivative.
      return Math.max(
        0,
        (expectedHitDamage({ dice: 4, armor: Math.max(0, pc.armor - 1), drPct: pc.drPct }) -
          expectedHitDamage({ dice: 4, armor: pc.armor, drPct: pc.drPct })) *
          avgNpcConnect *
          2,
      );
    case 'expose':
      // Evade −1 → higher future connect chance (~2.5% per point) on hits.
      return avgNpcHitDamage * 0.05;
    case 'disoriented':
    case 'weaken':
    case 'soulburn':
    case 'challenge': {
      // Attack/pool dice −1 → the PC's future output drops; prevented party
      // damage counts as pressure 1:1.
      const perDie = pc.bestAttack.damageDice > 0 ? 4.5 * 0.15 : 0.5;
      return perDie * lifetime + 0.5;
    }
    case 'hex':
    case 'sundered':
      return avgNpcConnect * 4.5 * 0.5; // +1d8 per 2 points on future hits
    case 'mark':
      return 0.75;
    case 'root':
      return 1.5; // hard positional control
    default:
      return 1;
  }
}

/* ------------------------------------------------------------------ */
/* Attack solving                                                      */
/* ------------------------------------------------------------------ */

export interface AttackSolveContext {
  party: PartyProfile;
  npcMr: number;
  /** Total hostile attack instances per round in this phase (reaction spread). */
  totalHostileAttacks: number;
  /** HL-per-round pressure budget for this single attack instance. */
  hlBudget: number;
}

/** Solve pool, damage dice and special value for one attack concept. */
export function solveAttack(concept: AttackConcept, ctx: AttackSolveContext): SolvedAttack {
  const tuning = ENCOUNTER_TUNING;
  const members = ctx.party.members;
  const views = members.map(pcDefenseView);
  const isSpell = concept.resolution === 'spell';
  const isAoe = concept.area !== 'single';
  const occupancy = isAoe ? aoeOccupancy(members.length) : null;

  // --- Attack pool: matrix-average connect chance ≈ target. ---
  let attackPool = concept.overrides.attackDice ?? 0;
  if (attackPool <= 0) {
    let best = tuning.minAttackPool;
    let bestDelta = Number.POSITIVE_INFINITY;
    for (let pool = tuning.minAttackPool; pool <= tuning.maxAttackPool; pool += 1) {
      const avg =
        views.reduce(
          (a, v) => a + npcConnectChance(pool, ctx.npcMr, isSpell, v, ctx.totalHostileAttacks),
          0,
        ) / views.length;
      const delta = Math.abs(avg - tuning.targetNpcHitChance);
      if (delta < bestDelta) {
        bestDelta = delta;
        best = pool;
      }
    }
    attackPool = best;
  }

  const connects = views.map((v) =>
    npcConnectChance(attackPool, ctx.npcMr, isSpell, v, ctx.totalHostileAttacks),
  );
  const avgConnect = connects.length
    ? connects.reduce((a, b) => a + b, 0) / connects.length
    : 0;
  const atCap = attackPool >= tuning.maxAttackPool && avgConnect + tuning.probabilityTolerance < tuning.targetNpcHitChance;

  // --- Damage dice: this attack's expected HL/round ≈ its budget share. ---
  const hasSpecial = Boolean(concept.specialId);
  const specialShare = hasSpecial ? tuning.specialShareOfAttackBudget : 0;
  const damageBudget = ctx.hlBudget * (1 - specialShare);
  const penetration = concept.overrides.penetration ?? 0;
  // AoE: budget accounting uses the TYPICAL occupancy case (explicit in review).
  const targetsPerUse = occupancy ? occupancy.typical : 1;

  const expectedHlPerUse = (dice: number): number => {
    let hl = 0;
    for (let j = 0; j < views.length; j += 1) {
      const dmg =
        connects[j] * npcExpectedHitDamage(dice, penetration, views[j], ctx.totalHostileAttacks);
      hl += dmg / views[j].hlSize;
    }
    // Single target: expected across the matrix = average PC. AoE: typical
    // occupancy × average per-target payload.
    return (hl / views.length) * targetsPerUse;
  };

  let damageDice = concept.overrides.damageDice ?? 0;
  if (damageDice <= 0) {
    let best = tuning.minDamageDice;
    let bestDelta = Number.POSITIVE_INFINITY;
    for (let dice = tuning.minDamageDice; dice <= tuning.maxDamageDice; dice += 1) {
      const delta = Math.abs(expectedHlPerUse(dice) - damageBudget);
      if (delta < bestDelta) {
        bestDelta = delta;
        best = dice;
      }
    }
    damageDice = best;
  }

  // --- Special value: simulated pressure ≈ special share of the budget. ---
  let specialValue = concept.overrides.specialValue ?? 0;
  if (hasSpecial && specialValue <= 0) {
    const avgHitDamage =
      views.reduce(
        (a, v) => a + npcExpectedHitDamage(damageDice, penetration, v, ctx.totalHostileAttacks),
        0,
      ) / views.length;
    const avgHlSize = views.reduce((a, v) => a + v.hlSize, 0) / views.length;
    // Damage-equivalent pressure per applied point, averaged over the party.
    const perPoint =
      members.reduce(
        (a, m) => a + specialPressurePerPoint(concept.specialId as string, m, avgHitDamage, avgConnect),
        0,
      ) / members.length;
    const specialBudgetDamage = ctx.hlBudget * specialShare * avgHlSize;
    // Expected applied points per use ≈ connect × value (× targets for AoE).
    const appliedFactor = avgConnect * targetsPerUse;
    const rawValue = perPoint > 0 && appliedFactor > 0
      ? specialBudgetDamage / (perPoint * appliedFactor)
      : tuning.minSpecialValue;
    specialValue = Math.round(
      Math.min(tuning.maxSpecialValue, Math.max(tuning.minSpecialValue, rawValue)),
    );
  }

  return {
    conceptId: concept.id,
    name: concept.name || 'Attacke',
    resolution: concept.resolution,
    delivery: concept.delivery,
    area: concept.area,
    areaSize: concept.areaSize,
    range: concept.range,
    attackPool,
    keep: ctx.npcMr,
    damageDice,
    penetration,
    specialId: concept.specialId,
    specialValue: hasSpecial ? specialValue : 0,
    stress: concept.stress,
    usesPerRound: 1,
    occupancy,
    poolAtCap: atCap,
    achievedHitChance: avgConnect,
  };
}

/* ------------------------------------------------------------------ */
/* NPC offense simulation (per-PC threat matrix over rounds)            */
/* ------------------------------------------------------------------ */

export interface PcAttackThreat {
  attackName: string;
  connectChance: number;
  expectedDamageOnHit: number;
  expectedHlOnHit: number;
}

export interface PcThreatReport {
  actorId: string;
  name: string;
  byAttack: PcAttackThreat[];
  expectedHlLostPerRound: number;
  expectedHlLostPerPhase: number;
  /** Peak accumulated negative special stack total during the phase. */
  peakSpecialStacks: number;
  /** Pool penalty fraction per round caused by expected injuries. */
  poolPenaltyByRound: number[];
}

export interface OffenseSimulationResult {
  perPc: PcThreatReport[];
  partyHlLostPerRound: number;
  partyHlLostPerPhase: number;
  highestRiskPcName: string;
  /** 90th-percentile single-hit damage of the hardest attack vs softest PC. */
  worstSingleHitQ90: number;
  worstSingleHitTargetName: string;
  worstSingleHitAttackName: string;
}

/**
 * Simulate the solved hostile attacks against every PC individually across
 * the expected phase duration. Uniform target spread for totals (single
 * target attacks pick each PC 1/partySize of the time; AoE hits the typical
 * occupancy); per-PC rows report the "when targeted" values. Tracks Special
 * accumulation with canonical tick/recovery/decay, expected Health-Level
 * loss and the resulting dice-pool penalties (injury feedback).
 */
export function simulateNpcOffense(
  party: PartyProfile,
  attacks: SolvedAttack[],
  npcMr: number,
  phaseRounds: number,
  /** Must match the hostile-attack count `solveAttack` used for the TN. */
  solverHostileAttacks?: number,
): OffenseSimulationResult {
  const rounds = Math.max(1, Math.ceil(phaseRounds));
  const members = party.members;
  const views = members.map(pcDefenseView);
  const totalAttacks = Math.max(
    1,
    solverHostileAttacks ?? attacks.reduce((a, atk) => a + atk.usesPerRound, 0),
  );

  const cumulativeDamage = members.map(() => 0);
  const stacks: SpecialStacks[] = members.map(() => new Map());
  const peakStacks = members.map(() => 0);
  const hlPerRound = members.map(() => 0);
  const poolPenaltyByRound: number[][] = members.map(() => []);
  const hlTotals = members.map(() => 0);

  const perAttackThreat: PcAttackThreat[][] = members.map((_, j) =>
    attacks.map((atk) => {
      const connect = npcConnectChance(
        atk.attackPool,
        npcMr,
        atk.resolution === 'spell',
        views[j],
        totalAttacks,
      );
      const dmg = npcExpectedHitDamage(atk.damageDice, atk.penetration, views[j], totalAttacks);
      return {
        attackName: atk.name,
        connectChance: connect,
        expectedDamageOnHit: dmg,
        expectedHlOnHit: dmg / views[j].hlSize,
      };
    }),
  );

  for (let round = 1; round <= rounds; round += 1) {
    const appliedThisRound: SpecialStacks[] = members.map(() => new Map());
    members.forEach((member, j) => {
      // PC turn start: ticks damage the PC, then recovery + decay.
      const turn = processTurnStart(stacks[j], member.mr);
      let roundDamage = turn.tickDamage;

      for (let a = 0; a < attacks.length; a += 1) {
        const atk = attacks[a];
        const threat = perAttackThreat[j][a];
        // Target spread: single-target attacks reach this PC 1/partySize of
        // uses; AoE reaches it typical/partySize of uses (full payload each).
        const reach = atk.occupancy
          ? Math.min(1, atk.occupancy.typical / members.length)
          : 1 / members.length;
        const uses = atk.usesPerRound * reach;
        roundDamage += uses * threat.connectChance * threat.expectedDamageOnHit;
        if (atk.specialId && atk.specialValue > 0) {
          applyExpectedSpecial(
            stacks[j],
            appliedThisRound[j],
            atk.specialId,
            uses * threat.connectChance * atk.specialValue,
            member.mr,
            views[j].ward,
          );
        }
      }

      cumulativeDamage[j] += roundDamage;
      const hl = roundDamage / member.healthLevelSize;
      hlPerRound[j] += hl;
      hlTotals[j] += hl;
      peakStacks[j] = Math.max(peakStacks[j], totalNegativeStacks(stacks[j]));

      // Injury feedback: which bar is the PC in after this cumulative damage?
      let remaining = cumulativeDamage[j];
      let barIndex = 0;
      for (let b = 0; b < member.healthBars.length; b += 1) {
        if (remaining >= member.healthBars[b]) {
          remaining -= member.healthBars[b];
          barIndex = Math.min(member.healthBars.length - 1, b + 1);
        } else {
          break;
        }
      }
      const fraction =
        HEALTH_PENALTY_FRACTIONS[Math.min(barIndex, HEALTH_PENALTY_FRACTIONS.length - 1)];
      poolPenaltyByRound[j].push(fraction);
    });
  }

  const perPc: PcThreatReport[] = members.map((member, j) => ({
    actorId: member.actorId,
    name: member.name,
    byAttack: perAttackThreat[j],
    expectedHlLostPerRound: hlTotals[j] / rounds,
    expectedHlLostPerPhase: hlTotals[j],
    peakSpecialStacks: peakStacks[j],
    poolPenaltyByRound: poolPenaltyByRound[j],
  }));

  // Burst danger: hardest single hit (q90) vs the softest PC.
  let worstQ90 = 0;
  let worstTarget = '';
  let worstAttack = '';
  members.forEach((member, j) => {
    for (const atk of attacks) {
      const q90 = hitDamageQuantile(
        {
          dice: atk.damageDice,
          penetration: atk.penetration,
          armor: views[j].armor,
          drPct: views[j].drPct,
          damageNegationDice: views[j].damageNegationDice,
        },
        0.9,
      );
      if (q90 / member.totalHealth > worstQ90) {
        worstQ90 = q90 / member.totalHealth;
        worstTarget = member.name;
        worstAttack = atk.name;
      }
    }
  });

  const partyPerPhase = perPc.reduce((a, r) => a + r.expectedHlLostPerPhase, 0);
  const highestRisk = perPc.reduce((best, r) =>
    r.expectedHlLostPerPhase > best.expectedHlLostPerPhase ? r : best,
  );

  return {
    perPc,
    partyHlLostPerRound: partyPerPhase / rounds,
    partyHlLostPerPhase: partyPerPhase,
    highestRiskPcName: highestRisk.name,
    worstSingleHitQ90: worstQ90,
    worstSingleHitTargetName: worstTarget,
    worstSingleHitAttackName: worstAttack,
  };
}
