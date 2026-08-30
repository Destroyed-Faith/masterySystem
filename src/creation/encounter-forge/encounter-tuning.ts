/**
 * Central tuning configuration for the Encounter Forge.
 *
 * Every balance constant that is NOT directly defined by the Mastery System
 * core rules lives here. Nothing in the solvers may introduce its own magic
 * numbers.
 *
 * Two kinds of constants exist and must not be mixed:
 *
 * RULE constants — direct consequences of the core rules (d8, exploding 8,
 * keep = Mastery Rank, +4 per raise, defense order, Power Use Limit, ...).
 * These live in `combat-math.ts` next to the mechanic they implement, or are
 * read from the canonical combat engine. They are not tunable.
 *
 * PLAYTEST constants — empirical design targets (expected phase duration,
 * warning thresholds, pressure targets, ...). They live in this file, are
 * documented, and are expected to be adjusted through playtesting.
 */

export const ENCOUNTER_TUNING = {
  /**
   * Expected phase duration target, in rounds of expected (sustainable) play.
   * The Defense/Health solver sizes each phase so the party's expected
   * cumulative damage kills the phase at about this point.
   * Playtest constant — the core design target of the whole generator.
   */
  targetPhaseRounds: 2.5,

  /**
   * A phase whose EXPECTED duration exceeds this many rounds gets a
   * durability warning ("phase likely lasts too long").
   */
  phaseDurationWarnRounds: 3.2,

  /**
   * A phase whose UNFAVORABLE (bad-rolls) duration exceeds this many rounds
   * gets a strong warning.
   */
  phaseDurationBadCaseWarnRounds: 4.5,

  /**
   * A phase that is expected to end during Round 1 gets a collapse warning
   * ("boss likely collapses in one round"). Expressed as expected rounds.
   */
  phaseCollapseWarnRounds: 1.35,

  /**
   * Favorable / unfavorable duration bands are computed by scaling the
   * party's expected per-round output. Favorable play = players roll and
   * play well; unfavorable = poor rolls / difficult execution.
   * These factors approximate the outcome spread of exploding-d8 play
   * without simulating full variance trees.
   */
  favorableOutputFactor: 1.3,
  unfavorableOutputFactor: 0.75,

  /**
   * Burst validation: the phase should survive an obvious opening burst.
   * If the party's burst output kills the phase in fewer rounds than this,
   * a warning is raised. (The boss must not collapse to one obvious nova.)
   */
  minRoundsUnderBurst: 1.5,

  /**
   * Offensive pressure target: expected party-wide Health Levels lost per
   * round in a normal phase, per player character. 0.35 means a 4-PC party
   * is expected to lose ~1.4 HL per round in total — meaningful danger
   * without an expected wipe of a healthy party within one phase.
   * Primary lethality playtest constant.
   */
  targetHealthLevelLossPerPcRound: 0.35,

  /**
   * Warning threshold: a single PC expected to lose more than this many
   * Health Levels in one round is a vulnerability outlier.
   */
  pcRoundHealthLevelWarn: 1.0,

  /**
   * Warning threshold: a single attack whose expected one-hit damage exceeds
   * this fraction of the softest PC's total Health is flagged as
   * unreasonable burst.
   */
  singleHitHealthFractionWarn: 0.45,

  /**
   * Hostile action economy: recommended total hostile offensive actions per
   * round is `partyOffensiveActions * hostileActionRatio`, clamped by the
   * per-body limits below. Ratio < 1 because NPC actions are solved to be
   * individually meaningful (full-strength actions).
   */
  hostileActionRatio: 0.8,

  /** A single main enemy body gets at most this many offensive actions. */
  maxActionsPerBody: 4,

  /**
   * Weight of one attacking-add action within the hostile pressure envelope
   * relative to a main-enemy action (add attacks are solved weaker).
   */
  addActionWeight: 0.5,

  /** Minimum offensive actions for any active main enemy body. */
  minActionsPerBody: 1,

  /**
   * Warning threshold: total hostile actions per round exceeding
   * `partyOffensiveActions * excessiveActionRatio` is flagged as excessive.
   */
  excessiveActionRatio: 1.5,

  /**
   * Attack solver targets: desired chance for a solved NPC attack to hit the
   * PC it is evaluated against. The solver picks the attack pool whose
   * matrix-average hit chance is closest to this value.
   * Playtest constant — "attacks should feel threatening but dodgeable".
   */
  targetNpcHitChance: 0.6,

  /** Solver search space for NPC attack pools (exploding d8 count). */
  minAttackPool: 2,
  maxAttackPool: 20,

  /** Solver search space for NPC damage dice per attack. */
  minDamageDice: 1,
  maxDamageDice: 16,

  /** Solver search space for solved NPC special magnitudes. */
  minSpecialValue: 1,
  maxSpecialValue: 6,

  /**
   * Party hit chance target used when solving NPC Evade: the solver picks
   * the Evade at which the party's expected hit chance is closest to this.
   * Playtest constant — below ~0.5 play feels swingy, above ~0.8 defenses
   * feel irrelevant.
   */
  targetPartyHitChanceVsNpc: 0.65,

  /**
   * Defensive identity weights: share of total mitigated pressure each
   * selected defense slot should carry. Used as the solver's objective, not
   * as a hardcoded outcome — the review reports the actually measured
   * contribution of each defense.
   */
  defenseShareTargets: {
    primaryOnly: [1.0],
    primarySecondary: [0.62, 0.38],
    primarySecondaryTertiary: [0.52, 0.3, 0.18],
  } as Record<string, number[]>,

  /**
   * When a selected defense contributes less than this fraction of the total
   * mitigated pressure, the validator warns that the defense has almost no
   * value against this party.
   */
  defenseUselessShareWarn: 0.06,

  /**
   * AoE occupancy cases evaluated when map geometry is unknown. Expressed as
   * a fraction of party size (rounded, min 1): single target, typical
   * grouping, dangerous high-occupancy case.
   */
  aoeOccupancyCases: { single: 1, typicalFraction: 0.5, dangerousFraction: 0.85 },

  /**
   * Specials escalation warning: if simulated hostile Special accumulation
   * on any PC reaches this fraction of that PC's per-round Special
   * application limit capacity by the expected phase end, warn.
   */
  specialAccumulationWarnFraction: 0.75,

  /**
   * Focus-fire model: fraction of party offense assumed to be directed at
   * the current focus target when several hostile bodies are active. The
   * remainder covers forced target switches, positioning and opportunistic
   * attacks. 1.0 would assume perfect focus every round.
   */
  focusFireEfficiency: 0.9,

  /**
   * Melee uptime against an enemy whose movement reliably escapes melee
   * (teleport, flight vs a ground party): fraction of rounds a melee PC
   * still reaches the target. Playtest constant.
   */
  meleeUptimeVsEscaping: 0.75,

  /**
   * Share of one attack's pressure budget carried by its Special when the
   * GM picked one (the rest is direct damage). The Offense Solver sizes the
   * Special magnitude so its simulated Health-Level pressure over the phase
   * matches this share.
   */
  specialShareOfAttackBudget: 0.3,

  /**
   * Total mitigation target: fraction of the party's raw (undefended)
   * output the solved defenses should prevent in total. Health carries the
   * remaining durability. Splitting this budget across the selected
   * defenses (defenseShareTargets) is what preserves defensive identity.
   */
  totalMitigationTarget: 0.45,

  /**
   * Baseline hit chance versus an enemy that did NOT select Evade as a
   * defense: Evade is set so the party still misses occasionally. Rules-wise
   * every creature has some Evade; this keeps unselected Evade meaningless
   * for identity but non-degenerate.
   */
  baselineHitChanceVsNpc: 0.85,

  /**
   * Reaction value model: expected number of times a defensive reaction is
   * actually used per round, per body, when relevant attacks exist. Used to
   * convert reaction slots into expected mitigation. Playtest constant.
   */
  reactionUsageRate: 0.75,

  /**
   * Sustainable vs burst resources: how many rounds of a typical encounter
   * limited resources (stones, once-per-combat powers) are amortized over
   * when computing sustainable output. Matches the two-phase expected fight
   * length of ~5 rounds.
   */
  burstAmortizationRounds: 5,

  /** Numeric tolerance for solver convergence / probability comparisons. */
  probabilityTolerance: 1e-9,
} as const;

export type EncounterTuning = typeof ENCOUNTER_TUNING;
