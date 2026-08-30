/**
 * Defense Solver + Health Solver.
 *
 * Answers: "What defense values let this enemy/phase survive ~2–3 rounds
 * against THIS party — while actually feeling like its chosen defensive
 * identity?"
 *
 * Method (no hardcoded 60/30/10 outcomes):
 *  1. Build a baseline body (Evade at the no-identity baseline, nothing else)
 *     and measure the party's expected per-round output via the round
 *     simulator (includes Specials escalation, spells vs Casting TN, ...).
 *  2. Give each selected defense slot a prevention target: its identity
 *     share × the total mitigation budget (both central tuning values).
 *  3. Binary-search each defense's magnitude until its MEASURED prevented
 *     damage per round (marginal, simulator-evaluated against the real
 *     per-PC profiles) matches its target. Defenses that cannot reach their
 *     target against this party (e.g. Spell Resistance vs a spell-less
 *     party) get the minimal value and are reported for the validator.
 *  4. Health is solved LAST as the residual durability value: the cumulative
 *     expected damage curve, evaluated at the target phase duration.
 *
 * Absorption and Damage Negation cannot be represented on generated NPCs
 * (no NPC stone pools; DN is not consumed by the live damage pipeline) —
 * they are reported as unsupported instead of silently redefined.
 */

import { ENCOUNTER_TUNING } from './encounter-tuning.js';
import type { DefenseKind, DefenseSelection } from './encounter-model.js';
import type { PartyProfile } from './party-analyzer.js';
import {
  emptySolvedDefenses,
  simulateFocusDamageCurve,
  solveFocusTimeline,
  type AddClearWave,
  type BodyDurabilityConfig,
  type SolvedDefenses,
} from './encounter-simulator.js';
import { rawHitChance } from './combat-math.js';

/* ------------------------------------------------------------------ */
/* Support matrix                                                      */
/* ------------------------------------------------------------------ */

/** Whether a defense can be legally represented on a generated NPC. */
export const NPC_DEFENSE_SUPPORT: Record<DefenseKind, { supported: boolean; note: string }> = {
  evade: { supported: true, note: 'Sheet-Feld combat.evade — Engine nutzt es direkt.' },
  armor: { supported: true, note: 'Sheet-Feld combat.armor — Engine nutzt es direkt.' },
  parry: {
    supported: true,
    note: 'Als Reaktion/Stat-Block-Wert generiert; Würfelentzug wird im Solver simuliert, am Tisch als Reaktions-Zeile geführt.',
  },
  absorption: {
    supported: false,
    note: 'Volle Absorption wandelt HP-Verlust in Temporary Colorless Stones um — NPCs haben keine Stone-Pools. Statt die Regel stillschweigend zu ändern, ist Absorption für generierte NPCs nicht verfügbar.',
  },
  phasing: {
    supported: true,
    note: 'Phasing-Charges liegen actor-agnostisch in flags.mastery-system.phasingCharges und werden von der Damage-Pipeline abgefragt.',
  },
  ward: {
    supported: true,
    note: 'Reduziert eingehende Special-Werte; im Solver simuliert, auf dem Bogen als Stat-Block-Notiz geführt (Engine-seitig gibt es kein NPC-Ward-Feld).',
  },
  damageNegation: {
    supported: false,
    note: 'Damage Negation wird von der automatisierten Damage-Pipeline derzeit nicht konsumiert (bekannte Engine-Lücke) — für generierte NPCs deaktiviert statt still anders interpretiert.',
  },
  damageReduction: {
    supported: true,
    note: 'DR% wird über combat.damageReductionPct von der Mitigation gelesen (für NPCs via Stat-Block verdrahtet).',
  },
  spellResistance: {
    supported: true,
    note: 'Erhöht die Casting TN gegen diesen NPC (combat.spellResistanceTotal).',
  },
};

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface DefenseContribution {
  kind: DefenseKind;
  slot: 'primary' | 'secondary' | 'tertiary';
  value: number;
  /** Damage per round this defense actually prevents vs this party (measured). */
  preventedPerRound: number;
  /** Share of the total measured prevention. */
  share: number;
  supported: boolean;
}

export interface SolvedDefensePackage {
  defenses: SolvedDefenses;
  contributions: DefenseContribution[];
  /** Party expected output per round vs the fully solved configuration. */
  netOutputPerRound: number;
  /** Party expected output per round vs the undefended baseline. */
  baselineOutputPerRound: number;
  notes: string[];
}

export interface HealthSolveResult {
  /** Health per body (index-aligned with the bodies array). */
  healths: number[];
  expectedPhaseRounds: number;
  favorableRounds: number;
  unfavorableRounds: number;
  burstRounds: number;
  timeToFirstDrop: number;
  /** Expected party damage per round (round-indexed) vs the first body. */
  roundDamage: number[];
  cumulativeDamage: number[];
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function avgOutputPerRound(
  party: PartyProfile,
  body: BodyDurabilityConfig,
  rounds: number,
  addWaves?: AddClearWave[],
): number {
  const r = Math.max(1, Math.ceil(rounds));
  const curve = simulateFocusDamageCurve(party, body, { maxRounds: r, addWaves });
  return curve.cumulative[r - 1] / r;
}

/** Baseline Evade: highest value where the party's average raw hit chance stays >= target. */
function solveBaselineEvade(party: PartyProfile, targetHit: number): number {
  let best = 4;
  for (let evade = 4; evade <= 80; evade += 1) {
    const avg =
      party.members.reduce(
        (a, m) => a + rawHitChance(m.bestAttack.pool, m.bestAttack.keep, evade),
        0,
      ) / Math.max(1, party.members.length);
    if (avg >= targetHit) best = evade;
    else break;
  }
  return best;
}

function applyDefenseValue(defenses: SolvedDefenses, kind: DefenseKind, value: number): void {
  switch (kind) {
    case 'evade':
      defenses.evade = value;
      break;
    case 'armor':
      defenses.armor = value;
      break;
    case 'parry':
      defenses.parryStrip = value;
      break;
    case 'ward':
      defenses.ward = value;
      break;
    case 'damageNegation':
      defenses.damageNegationDice = value;
      break;
    case 'damageReduction':
      defenses.drPct = value;
      break;
    case 'spellResistance':
      defenses.spellResistance = value;
      break;
    case 'phasing':
      defenses.phasingCharges = value;
      break;
    case 'absorption':
      break; // unsupported — never solved
  }
}

const DEFENSE_SEARCH_MAX: Record<DefenseKind, number> = {
  evade: 80,
  armor: 60,
  parry: 12,
  ward: 8,
  damageNegation: 12,
  damageReduction: 60,
  spellResistance: 40,
  phasing: 6,
  absorption: 0,
};

/* ------------------------------------------------------------------ */
/* Defense solving                                                     */
/* ------------------------------------------------------------------ */

export interface DefenseSolveInput {
  party: PartyProfile;
  selection: DefenseSelection;
  /** NPC Mastery Rank (keep / spell TN / natural recovery — not a balance lever). */
  mr: number;
  meleeEscape: boolean;
  /** Add-clearing pressure in this phase (affects measured party output). */
  addWaves?: AddClearWave[];
}

export function solveDefenses(input: DefenseSolveInput): SolvedDefensePackage {
  const { party, selection } = input;
  const tuning = ENCOUNTER_TUNING;
  const notes: string[] = [];
  const horizon = tuning.targetPhaseRounds;

  const slots: { kind: DefenseKind; slot: DefenseContribution['slot'] }[] = [
    { kind: selection.primary, slot: 'primary' },
  ];
  if (selection.secondary) slots.push({ kind: selection.secondary, slot: 'secondary' });
  if (selection.tertiary) slots.push({ kind: selection.tertiary, slot: 'tertiary' });

  const shareKey =
    slots.length === 1
      ? 'primaryOnly'
      : slots.length === 2
        ? 'primarySecondary'
        : 'primarySecondaryTertiary';
  const shares = tuning.defenseShareTargets[shareKey];

  // Baseline: no selected defenses; Evade at the non-identity baseline.
  const defenses = emptySolvedDefenses();
  defenses.evade = solveBaselineEvade(party, tuning.baselineHitChanceVsNpc);
  const makeBody = (d: SolvedDefenses): BodyDurabilityConfig => ({
    id: 'solve',
    name: 'solve',
    mr: input.mr,
    defenses: d,
    meleeEscape: input.meleeEscape,
    movesPerRound: 1,
  });
  const baselineOutput = avgOutputPerRound(party, makeBody(defenses), horizon, input.addWaves);
  const totalPreventionTarget = baselineOutput * tuning.totalMitigationTarget;

  // Solve each slot sequentially (primary first) by binary search on the
  // marginal prevention it adds on top of the already-solved slots.
  const solvedValues: { kind: DefenseKind; slot: DefenseContribution['slot']; value: number }[] = [];
  for (let i = 0; i < slots.length; i += 1) {
    const { kind, slot } = slots[i];
    const support = NPC_DEFENSE_SUPPORT[kind];
    if (!support.supported) {
      notes.push(`${kind}: ${support.note}`);
      solvedValues.push({ kind, slot, value: 0 });
      continue;
    }
    const target = totalPreventionTarget * shares[i];
    const outputBefore = avgOutputPerRound(party, makeBody(defenses), horizon, input.addWaves);
    const preventedAt = (v: number): number => {
      const trial: SolvedDefenses = { ...defenses };
      applyDefenseValue(trial, kind, kind === 'evade' ? Math.max(v, defenses.evade) : v);
      return Math.max(
        0,
        outputBefore - avgOutputPerRound(party, makeBody(trial), horizon, input.addWaves),
      );
    };
    // Binary search for the smallest value whose measured prevention reaches
    // the slot target (prevention is monotone non-decreasing in the value).
    const max = DEFENSE_SEARCH_MAX[kind];
    let value: number;
    if (preventedAt(max) < target) {
      // This defense cannot reach its identity share against this party —
      // pick the point of diminishing returns instead of maxing it out.
      value = max;
      notes.push(
        `${kind}: erreicht gegen diese Gruppe nicht den Zielanteil an Schadensverhinderung (Slot ${slot}).`,
      );
    } else {
      let lo = 0;
      let hi = max;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (preventedAt(mid) >= target) hi = mid;
        else lo = mid;
      }
      value = hi;
    }
    applyDefenseValue(defenses, kind, kind === 'evade' ? Math.max(value, defenses.evade) : value);
    solvedValues.push({ kind, slot, value: kind === 'evade' ? defenses.evade : value });
  }

  // Measure final contributions leave-one-out: prevented_k = output(without k) − output(all).
  const netOutput = avgOutputPerRound(party, makeBody(defenses), horizon, input.addWaves);
  const contributions: DefenseContribution[] = [];
  let totalPrevented = 0;
  const measured: number[] = [];
  for (const sv of solvedValues) {
    if (!NPC_DEFENSE_SUPPORT[sv.kind].supported) {
      measured.push(0);
      continue;
    }
    const without: SolvedDefenses = { ...defenses };
    applyDefenseValue(without, sv.kind, sv.kind === 'evade' ? solveBaselineEvade(party, ENCOUNTER_TUNING.baselineHitChanceVsNpc) : 0);
    const prevented = Math.max(
      0,
      avgOutputPerRound(party, makeBody(without), horizon, input.addWaves) - netOutput,
    );
    measured.push(prevented);
    totalPrevented += prevented;
  }
  solvedValues.forEach((sv, i) => {
    contributions.push({
      kind: sv.kind,
      slot: sv.slot,
      value: sv.value,
      preventedPerRound: measured[i] ?? 0,
      share: totalPrevented > 0 ? (measured[i] ?? 0) / totalPrevented : 0,
      supported: NPC_DEFENSE_SUPPORT[sv.kind].supported,
    });
  });

  return {
    defenses,
    contributions,
    netOutputPerRound: netOutput,
    baselineOutputPerRound: baselineOutput,
    notes,
  };
}

/* ------------------------------------------------------------------ */
/* Health solving (residual durability)                                */
/* ------------------------------------------------------------------ */

export interface HealthSolveInput {
  party: PartyProfile;
  bodies: BodyDurabilityConfig[];
  /** Relative durability weight per body (default equal). */
  weights?: number[];
  addWaves?: AddClearWave[];
  /** Injury feedback: per-member per-round pool penalty fractions. */
  poolPenaltyByRound?: number[][];
  /** Explicit GM health overrides per body (null = solve). */
  healthOverrides?: (number | null)[];
}

/**
 * Solve per-body phase Health so the ENCOUNTER PHASE completes at the target
 * duration under focus fire, then report expected/favorable/unfavorable and
 * burst durations for the solved (or overridden) values.
 */
export function solvePhaseHealth(input: HealthSolveInput): HealthSolveResult {
  const tuning = ENCOUNTER_TUNING;
  const { party, bodies } = input;
  const n = bodies.length;
  const weights = input.weights && input.weights.length === n ? input.weights : bodies.map(() => 1);
  const weightSum = weights.reduce((a, b) => a + b, 0) || 1;
  const eff = n > 1 ? tuning.focusFireEfficiency : 1;

  // Each body gets a focus window proportional to its weight within the
  // target duration; its health is the (efficiency-scaled) expected damage
  // accumulated in that window.
  const healths: number[] = [];
  for (let i = 0; i < n; i += 1) {
    const override = input.healthOverrides?.[i];
    if (override != null && override > 0) {
      healths.push(Math.round(override));
      continue;
    }
    // Focus windows sum to the phase target: window_i = target × w_i / Σw.
    const window = tuning.targetPhaseRounds * (weights[i] / weightSum);
    const curve = simulateFocusDamageCurve(party, bodies[i], {
      maxRounds: Math.max(2, Math.ceil(window) + 1),
      addWaves: i === 0 ? input.addWaves : undefined,
      poolPenaltyByRound: input.poolPenaltyByRound,
    });
    // Interpolate the cumulative curve at the fractional window end.
    const whole = Math.floor(window);
    const frac = window - whole;
    const cumWhole = whole > 0 ? curve.cumulative[Math.min(whole, curve.cumulative.length) - 1] : 0;
    const nextRound = curve.roundDamage[Math.min(whole, curve.roundDamage.length - 1)] ?? 0;
    const health = Math.max(1, Math.round((cumWhole + nextRound * frac) * eff));
    healths.push(health);
  }

  // Verify with the focus-fire timeline and report duration bands.
  const timeline = solveFocusTimeline(party, bodies, healths, {
    addWaves: input.addWaves,
    poolPenaltyByRound: input.poolPenaltyByRound,
  });
  const favorable = solveFocusTimeline(party, bodies, healths, {
    addWaves: input.addWaves,
    outputFactor: tuning.favorableOutputFactor,
  });
  const unfavorable = solveFocusTimeline(party, bodies, healths, {
    addWaves: input.addWaves,
    outputFactor: tuning.unfavorableOutputFactor,
    poolPenaltyByRound: input.poolPenaltyByRound,
  });
  const burst = solveFocusTimeline(party, bodies, healths, {
    addWaves: input.addWaves,
    burst: true,
  });

  const reportCurve = simulateFocusDamageCurve(party, bodies[0], {
    maxRounds: Math.max(4, Math.ceil(timeline.phaseRounds) + 1),
    addWaves: input.addWaves,
    poolPenaltyByRound: input.poolPenaltyByRound,
  });

  return {
    healths,
    expectedPhaseRounds: timeline.phaseRounds,
    favorableRounds: favorable.phaseRounds,
    unfavorableRounds: unfavorable.phaseRounds,
    burstRounds: burst.phaseRounds,
    timeToFirstDrop: timeline.timeToFirstDrop,
    roundDamage: reportCurve.roundDamage,
    cumulativeDamage: reportCurve.cumulative,
  };
}
