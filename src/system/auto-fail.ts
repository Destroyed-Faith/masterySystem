/**
 * Auto-Fail Engine — declarative mapping from conditions to forced outcomes.
 *
 * Current consumers:
 *   - `Blinded(X)` forces failure on `sight`-tagged checks AND subtracts
 *     `X` dice from any `sight`-tagged attack.
 *   - `Stunned(X)` locks `X` attack actions for the current round (enforced
 *     in `src/combat/action-economy.ts`, not here).
 *
 * Keep this module side-effect-free and purely declarative so roll-handler
 * and attack-roll-handler can call it without pulling in Foundry globals.
 */

import { getSkillTags, type SkillTag } from './skill-tags.js';

export type CheckTag = SkillTag | 'sight' | string;

export interface CheckContext {
  /** Tags carried by this check / attack ("sight", "hearing", "concentration", …). */
  tags?: CheckTag[];
  /** Named skill (optional — looked up in `skill-tags.ts` when tags are empty). */
  skillKey?: string;
}

export interface AutoFailDecision {
  /** `true` when this check should be forced to `success: false`. */
  failed: boolean;
  /** Stable reason string stored on `MasteryRollResult.autoFailReason`. */
  reason?: string;
  /**
   * Dice pool penalty applied before the roll (subtracted from numDice).
   * Pools never go below 1 — the caller is responsible for clamping.
   */
  dicePenalty?: number;
  /** Human-readable note that gets appended to the roll flavor. */
  note?: string;
}

/**
 * Extract the rank from a status-effect label like `"Blinded(2)"` or a
 * status id like `"blinded-2"`. Returns 1 when no rank is encoded.
 */
function extractRank(label: string): number {
  const m = String(label).match(/(\d+)/);
  if (!m) return 1;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/**
 * Return the actor's Blinded rank (0 when not blinded). Reads Foundry's
 * `actor.statuses` set first, then the mastery-flag `conditions`, then
 * effect names — covers the three ways the system tracks conditions.
 */
export function getBlindedRank(actor: any): number {
  if (!actor) return 0;

  // Foundry v13 `actor.statuses` is a Set of status ids.
  const statuses: any = actor?.statuses;
  if (statuses && typeof statuses.has === 'function') {
    if (statuses.has('blinded')) return 1;
  }

  // mastery-system flag bag: { conditions: { blinded: { rank } } }
  const conds = actor?.flags?.['mastery-system']?.conditions;
  const flagRank = conds?.blinded?.rank ?? conds?.blinded?.value;
  if (Number.isFinite(Number(flagRank)) && Number(flagRank) > 0) {
    return Math.floor(Number(flagRank));
  }

  // Active effect name/label scan (fallback).
  const effects: any = actor?.effects;
  if (effects) {
    const iter: any[] =
      typeof effects[Symbol.iterator] === 'function'
        ? Array.from(effects)
        : Array.isArray(effects)
          ? effects
          : [];
    for (const e of iter) {
      const name = String(e?.name ?? e?.label ?? '');
      if (/^blinded/i.test(name)) return extractRank(name);
    }
  }

  return 0;
}

/** Stunned rank (0 when not stunned). Same lookup as Blinded. */
export function getStunnedRank(actor: any): number {
  if (!actor) return 0;
  const statuses: any = actor?.statuses;
  if (statuses && typeof statuses.has === 'function') {
    if (statuses.has('stunned')) return 1;
  }
  const conds = actor?.flags?.['mastery-system']?.conditions;
  const flagRank = conds?.stunned?.rank ?? conds?.stunned?.value;
  if (Number.isFinite(Number(flagRank)) && Number(flagRank) > 0) {
    return Math.floor(Number(flagRank));
  }
  const effects: any = actor?.effects;
  if (effects) {
    const iter: any[] =
      typeof effects[Symbol.iterator] === 'function'
        ? Array.from(effects)
        : Array.isArray(effects)
          ? effects
          : [];
    for (const e of iter) {
      const name = String(e?.name ?? e?.label ?? '');
      if (/^stunned/i.test(name)) return extractRank(name);
    }
  }
  return 0;
}

/**
 * Resolve the effective tag list for a check. When `context.tags` is non-
 * empty, those tags win; otherwise we look up `context.skillKey` in the
 * skill-tag registry.
 */
export function resolveCheckTags(context: CheckContext | undefined): CheckTag[] {
  if (!context) return [];
  if (Array.isArray(context.tags) && context.tags.length > 0) {
    return context.tags.slice();
  }
  if (context.skillKey) {
    return getSkillTags(context.skillKey) as CheckTag[];
  }
  return [];
}

/**
 * Decide whether the given actor's conditions force an auto-fail or pool
 * penalty for the given check context. Called from `masteryRoll` right
 * before the dice are rolled (so the penalty lowers the pool first, and
 * the failure flag overrides `success` post-roll).
 *
 * Returns a flat decision object — the caller decides whether to honor the
 * `dicePenalty` alone (for attacks) or also the `failed` flag (for
 * sight-based skill checks).
 */
export function evaluateAutoFail(
  actor: any,
  context: CheckContext | undefined,
  intent: 'skill' | 'attack',
): AutoFailDecision {
  const tags = resolveCheckTags(context);
  if (tags.length === 0) return { failed: false };

  const blindedRank = getBlindedRank(actor);
  if (blindedRank > 0 && tags.includes('sight')) {
    if (intent === 'skill') {
      return {
        failed: true,
        reason: 'blinded-sight',
        note: `Blinded (${blindedRank}) — sight-based check auto-fails.`,
      };
    }
    // Attack: do not fail outright but subtract ranks from the pool.
    return {
      failed: false,
      dicePenalty: blindedRank,
      reason: 'blinded-sight',
      note: `Blinded (${blindedRank}) — −${blindedRank} dice on sight-based attack.`,
    };
  }

  return { failed: false };
}
