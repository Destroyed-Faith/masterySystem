/**
 * Ritual System — Core Ritual TN helpers.
 *
 * Base Ritual TN = 4 × max(3, Task Level) (DF Guide 2026-10-23).
 * Final Ritual TN = Base + 4 × Paid Raises (one final TN; no partial named tier).
 * Stones Sealed by total Raises (Paid+Free): 0–1→1, 2–3→2, 4–8→3.
 * All 16 Core Rituals are universally available — see `src/rules/core-rituals.ts`.
 */

import {
  ritualBaseTn as canonicalRitualBaseTn,
  ritualSealedStoneCost,
} from '../rules/ritual-tn.js';
import { CORE_RITUALS } from '../rules/core-rituals.js';

/**
 * Base Ritual TN from Task Level (minimum 3 → TN 12).
 * The first argument is the Task Level / source level, not caster MR.
 */
export function calculateRitualTN(taskLevel: number, modifier = 0): number {
  const mod = Math.floor(Number(modifier) || 0);
  return canonicalRitualBaseTn(taskLevel) + mod;
}

/** Universal Core Ritual catalogue (16). */
export function listUniversalCoreRituals() {
  return CORE_RITUALS;
}

export function sealedStonesForRitualRaises(totalRaises: number): number {
  return ritualSealedStoneCost(totalRaises);
}

export function calculateRitualRaiseTN(baseTn: number, declaredRaises: number): number {
  const base = Math.max(0, Math.floor(Number(baseTn) || 0));
  const declared = Math.max(0, Math.floor(Number(declaredRaises) || 0));
  return base + declared * 4;
}

export type RitualDeclaredOutcome = {
  success: boolean;
  appliedRaise: number;
  /** `raise0` kept for type compat; DF 2026 no longer awards partial named tiers. */
  kind: 'fail' | 'raise0' | 'full';
};

/**
 * One final Ritual TN: Base + 4×Paid Raises.
 * Missing the final TN fails the entire declared attempt (no partial named tier).
 */
export function resolveRitualDeclaredOutcome(opts: {
  rollTotal: number;
  baseTn: number;
  declaredRaises: number;
}): RitualDeclaredOutcome {
  const declared = Math.max(0, Math.floor(Number(opts.declaredRaises) || 0));
  const finalTn = calculateRitualRaiseTN(opts.baseTn, declared);
  const total = Math.floor(Number(opts.rollTotal) || 0);
  if (total < finalTn) return { success: false, appliedRaise: 0, kind: 'fail' };
  return { success: true, appliedRaise: declared, kind: 'full' };
}
