/**
 * Canonical dice-pool finalization — single source of truth for the
 * Player's Guide "Order of Pool Reduction". Used by `masteryRoll` for the
 * actual roll AND by UI previews so both always agree.
 *
 * Input pool = base attribute pool + skill full-/half-pool rule + situational
 * caller modifiers (range band, split attack) + mechanics/manual flat dice.
 *
 * This stage then applies, in this exact order:
 *   (a) flat Special reductions — Disoriented (Auto-Fail engine),
 *       Weaken / Soulburn (by pool attribute), Challenge (attack targeting)
 *   (b) percentage-based Health / Encumbrance penalty (dice loss floored)
 *   (c) A pool of 0 dice fails. Keep cannot exceed the dice that remain.
 */

import { evaluateAutoFail, type CheckContext } from '../system/auto-fail.js';
import {
  attributePoolReduction,
  challengePoolReduction,
  normalizeTargetRefs,
} from '../system/pool-reduction.js';
import { applyHealthAndEncumbrancePenalties } from '../utils/encumbrance.js';

export interface FinalizePoolOptions {
  /** 'attack' enables the Challenge reduction and attack-intent auto-fail. */
  rollKind?: 'attack' | 'skill' | 'damage' | 'contest' | 'generic';
  /** Attribute the pool is built from — drives Weaken / Soulburn. */
  poolAttribute?: string;
  /** Target refs of the attack (actor ids / uuids / token ids). */
  targetRefs?: string[];
  /** Auto-Fail engine context (Disoriented etc.). */
  checkContext?: CheckContext;
  autoFailIntent?: 'skill' | 'attack';
  /** Apply the percentage Health / Encumbrance penalty (default true). */
  applyPoolPenalties?: boolean;
}

export interface FinalizePoolResult {
  numDice: number;
  /** Notes describing each applied stage (for flavor / preview tooltips). */
  notes: string[];
  /** Forced-failure reason from the Auto-Fail engine, if any. */
  autoFailReason?: string;
}

/**
 * Apply canonical stages (a)–(c) to `basePool`. Pure & synchronous so UI
 * previews can call it directly.
 */
export function finalizeRolledPool(
  actor: any,
  basePool: number,
  keepDice: number,
  options: FinalizePoolOptions = {},
): FinalizePoolResult {
  const notes: string[] = [];
  let numDice = Math.max(0, Math.floor(basePool));
  let autoFailReason: string | undefined;
  if (!actor) return { numDice, notes };

  const kind = options.rollKind;
  let flatReduction = 0;

  // (a1) Auto-Fail engine — Disoriented pool penalty + forced failures.
  if (options.checkContext) {
    const intent: 'skill' | 'attack' =
      options.autoFailIntent ?? (kind === 'attack' ? 'attack' : 'skill');
    const decision = evaluateAutoFail(actor, options.checkContext, intent);
    if (decision.dicePenalty && decision.dicePenalty > 0) {
      flatReduction += decision.dicePenalty;
      notes.push(decision.note ?? `−${decision.dicePenalty} dice`);
    }
    if (decision.failed) {
      autoFailReason = decision.reason ?? 'auto-fail';
      notes.push(decision.note ?? `Auto-Fail (${autoFailReason})`);
    }
  }

  // (a2) Weaken / Soulburn by pool attribute.
  const attrReduction = attributePoolReduction(actor, options.poolAttribute);
  if (attrReduction.reduction > 0) {
    flatReduction += attrReduction.reduction;
    notes.push(...attrReduction.notes);
  }

  // (a3) Challenge — Attack Pools only.
  if (kind === 'attack') {
    const refs = normalizeTargetRefs(options.targetRefs ?? []);
    const challenge = challengePoolReduction(actor, refs);
    flatReduction += challenge.reduction;
    notes.push(...challenge.notes);
  }

  if (flatReduction > 0) {
    numDice = Math.max(0, numDice - flatReduction);
  }

  // (b) Percentage Health penalty (encumbrance affects Movement only).
  if (options.applyPoolPenalties !== false) {
    const penalties = applyHealthAndEncumbrancePenalties(numDice, actor);
    if (penalties.healthPenaltyDice > 0) {
      notes.push(`Health penalty: −${penalties.healthPenaltyDice} dice`);
    }
    numDice = penalties.numDice;
  }

  if (numDice <= 0) {
    notes.push('Pool of 0 dice — the roll fails');
    return { numDice: 0, notes, autoFailReason: autoFailReason ?? 'Pool of 0 dice' };
  }

  return { numDice, notes, ...(autoFailReason ? { autoFailReason } : {}) };
}
