/**
 * Auto-Fail Engine — declarative mapping from conditions to forced outcomes.
 *
 * Current consumers:
 *   - `Disoriented(X)` subtracts `X` Attack Dice (and `X` dice from sight /
 *     perception checks used to notice, locate, track, or identify), down to
 *     a minimum of the roller's Mastery Rank.
 *   - `Stunned(X)` locks `X` attack actions for the current round (enforced
 *     in `src/combat/action-economy.ts`, not here).
 *
 * Keep this module side-effect-free and purely declarative so roll-handler
 * and attack-roll-handler can call it without pulling in Foundry globals.
 */

import { getSkillTags, type SkillTag } from './skill-tags.js';
import { getActiveSpecialValue } from './active-specials.js';

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
   * The caller clamps the pool to `minFloor` (default 1).
   */
  dicePenalty?: number;
  /** Minimum pool size after applying `dicePenalty` (e.g. Mastery Rank for Disoriented). */
  minFloor?: number;
  /** Human-readable note that gets appended to the roll flavor. */
  note?: string;
}

/**
 * Extract the rank from a status-effect label like `"Disoriented(2)"` or a
 * status id like `"disoriented-2"`. Returns 1 when no rank is encoded.
 */
function extractRank(label: string): number {
  const m = String(label).match(/(\d+)/);
  if (!m) return 1;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/**
 * Return the actor's Disoriented rank (0 when not disoriented). Reads the
 * `system.statusEffects` view first, then Foundry's `actor.statuses` set, the
 * mastery-flag `conditions`, then effect names.
 */
export function getDisorientedRank(actor: any): number {
  if (!actor) return 0;

  const fromStatus = getActiveSpecialValue(actor, 'disoriented');
  if (fromStatus > 0) return fromStatus;

  // Foundry v13 `actor.statuses` is a Set of status ids.
  const statuses: any = actor?.statuses;
  if (statuses && typeof statuses.has === 'function') {
    if (statuses.has('disoriented')) return 1;
  }

  // mastery-system flag bag: { conditions: { disoriented: { rank } } }
  const conds = actor?.flags?.['mastery-system']?.conditions;
  const flagRank = conds?.disoriented?.rank ?? conds?.disoriented?.value;
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
      if (/^disoriented/i.test(name)) return extractRank(name);
    }
  }

  return 0;
}

/** Stunned rank (0 when not stunned). Same lookup as Disoriented. */
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
  const disorientedRank = getDisorientedRank(actor);
  if (disorientedRank <= 0) return { failed: false };

  // Attacks are always affected; skill checks only when sight/perception-tagged.
  if (intent === 'attack') {
    return {
      failed: false,
      dicePenalty: disorientedRank,
      minFloor: 0, // roll-handler substitutes the Mastery-Rank floor
      reason: 'disoriented',
      note: `Disoriented (${disorientedRank}) — −${disorientedRank} Attack Dice (min MR).`,
    };
  }

  const tags = resolveCheckTags(context);
  if (tags.includes('sight')) {
    return {
      failed: false,
      dicePenalty: disorientedRank,
      minFloor: 0,
      reason: 'disoriented',
      note: `Disoriented (${disorientedRank}) — −${disorientedRank} dice on perception check (min MR).`,
    };
  }

  return { failed: false };
}
