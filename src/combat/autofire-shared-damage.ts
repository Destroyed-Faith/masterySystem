/**
 * Stepped Autofire — shared ordered Damage Roll (pure helpers + session registry).
 * No Foundry globals: everything Foundry-specific is injected by the caller.
 *
 * Players Guide §Apply Damage Negation: for a shared Autofire Damage Roll every
 * defender declares Negation BEFORE rolling, separately for each eligible hit
 * (repeats on one creature included). The common Damage Pool is rolled ONCE; for
 * each hit, that hit's declared number of dice is omitted from the SAME ordered
 * shared roll, for that hit only.
 *
 * DICE-OMIT CONVENTION (deterministic, cannot be cherry-picked after the reveal):
 *   The omittable pool is the ordered list of negatable d8s in the exact order
 *   `calculateDamageResult` rolls them — Weapon/base, Martial Damage, Power,
 *   Passive, Raise d8s, NSC auto d8s (the same order the single-target negation
 *   strips them from the formula). Omission removes the FIRST `omitCount` dice of
 *   that list (index 0 .. omitCount-1). Omitted dice contribute nothing to total
 *   damage and nothing to the natural-8 minimum count.
 *
 * Non-negatable dice (Summon aura, conditional / vulnerability / buff riders,
 * Precision, manual bonus dice) and flat bonuses are NOT part of the omittable
 * pool; they are common to every hit.
 */

import type { SharedAoeDamagePayload } from './aoe-melee-resolution.js';
import {
  autofireRaiseShareKey,
  forgetSharedRaiseAllocation,
} from './shared-raise-allocation.js';

export {
  autofireRaiseShareKey,
  forgetSharedRaiseAllocation,
  peekSharedRaiseAllocation,
  raiseAllocShareKey,
  readAutofirePowerUseId,
  rememberSharedRaiseAllocation,
} from './shared-raise-allocation.js';

/** The full negatable pool of one shared roll, in roll order. */
export type SharedDicePool = {
  /** One entry per negatable d8, in roll order (full pool, before per-hit omission). */
  orderedDieFaces: number[];
  /** Maximization: every face is an artificial 8 (not a natural 8). */
  artificial: boolean;
  /** Per-die floor already applied to the full total (Brutal Impact / Mark spend). */
  dieFloor: number;
};

export type SharedDiceTotals = {
  /** Sum of the kept (non-omitted) dice. */
  total: number;
  /** Natural 8s among the kept dice. */
  natural8s: number;
  omittedCount: number;
  keptCount: number;
  /** Contribution of the omitted dice to the full total (to subtract). */
  omittedTotal: number;
  /** Natural 8s among the omitted dice (to subtract from the full count8s). */
  omittedNatural8s: number;
};

function normalizeFaces(faces: readonly number[] | null | undefined): number[] {
  return (faces ?? []).map((f) => Math.max(0, Math.floor(Number(f) || 0)));
}

/** Clamp a declared omit count to [0, poolSize]. */
export function normalizeOmitCount(omit: number, poolSize: number): number {
  const pool = Math.max(0, Math.floor(Number(poolSize) || 0));
  const n = Math.max(0, Math.floor(Number(omit) || 0));
  return Math.min(pool, n);
}

/**
 * Damage from a shared ordered die list when `omitCount` dice are omitted.
 * Omits the FIRST `omitCount` entries (see DICE-OMIT CONVENTION above). Pure; never
 * rolls. Omitted dice count toward neither `total` nor `natural8s`.
 */
export function damageFromSharedDice(
  faces: readonly number[],
  omitCount: number,
  opts?: { artificial?: boolean; dieFloor?: number },
): SharedDiceTotals {
  const list = normalizeFaces(faces);
  const omit = normalizeOmitCount(omitCount, list.length);
  const artificial = opts?.artificial === true;
  const floor = Math.max(0, Math.floor(Number(opts?.dieFloor) || 0));
  const value = (face: number) => (artificial ? 8 : Math.max(face, floor));
  const isNatural8 = (face: number) => !artificial && face === 8;

  let total = 0;
  let natural8s = 0;
  let omittedTotal = 0;
  let omittedNatural8s = 0;
  list.forEach((face, i) => {
    if (i < omit) {
      omittedTotal += value(face);
      if (isNatural8(face)) omittedNatural8s += 1;
    } else {
      total += value(face);
      if (isNatural8(face)) natural8s += 1;
    }
  });
  return {
    total,
    natural8s,
    omittedCount: omit,
    keptCount: list.length - omit,
    omittedTotal,
    omittedNatural8s,
  };
}

/**
 * Per-hit payload derived from the ONE shared roll. `totalDamage` and `count8s`
 * drop the omitted dice only; the shared faces are never re-rolled or mutated.
 */
export function sharedDamageForHit(
  shared: SharedAoeDamagePayload,
  omitCount: number,
  opts?: { keepRolls?: boolean },
): SharedAoeDamagePayload {
  const faces = shared.orderedDieFaces ?? [];
  const omit = normalizeOmitCount(omitCount, faces.length);
  const t = damageFromSharedDice(faces, omit, {
    artificial: shared.artificialDice === true,
    dieFloor: shared.dieFloor,
  });
  const fullTotal = Math.max(0, Math.floor(Number(shared.totalDamage) || 0));
  const fullCount8s = Math.max(0, Math.floor(Number(shared.count8s) || 0));
  const rollDetails = Array.isArray(shared.rollDetails) ? [...shared.rollDetails] : [];
  if (omit > 0) {
    rollDetails.unshift(
      `Damage Negation for this hit: first ${omit} of ${faces.length} shared dice omitted (−${t.omittedTotal})`,
    );
  }
  return {
    ...shared,
    totalDamage: Math.max(0, fullTotal - t.omittedTotal),
    count8s: Math.max(0, fullCount8s - t.omittedNatural8s),
    omitCount: omit,
    rollDetails: rollDetails.length ? rollDetails : undefined,
    damageChatRolls: opts?.keepRolls === false ? undefined : shared.damageChatRolls,
  };
}

/** Unique id for one Autofire Power use (stored as `powerUseId` / `autofireUseId`). */
export function newAutofirePowerUseId(attackerId?: string | null): string {
  const g = globalThis as any;
  let rand = '';
  try {
    rand = String(g.crypto?.randomUUID?.() ?? '').replace(/-/g, '').slice(0, 12);
  } catch {
    rand = '';
  }
  if (!rand) rand = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);
  const who = String(attackerId ?? '').trim() || 'anon';
  return `af-${who}-${Date.now().toString(36)}-${rand}`;
}

/* ------------------------------------------------------------------ */
/* Session: Negation commitments for one Autofire Power use            */
/* ------------------------------------------------------------------ */

export type NegationPromptResult = {
  diceRemoved: number;
  note?: string;
  /** Gives the spent resources back (cancellation of the Power use's damage roll). */
  refund?: () => Promise<void>;
};

export interface AutofireDamageSession {
  readonly useId: string;
  readonly hitCount: number;
  /** One omit count per pending hit, in chain order (zeros until collected). */
  readonly omitCounts: number[];
  /** Size of the negatable pool the commitments were made against (null until collected). */
  poolDice: number | null;
  collected: boolean;
  /**
   * Prompt every hit in order (before any die is revealed) and record omit counts.
   * Idempotent: a second call (e.g. Faith reroll) returns the same commitments.
   */
  collectNegation(poolDice: number): Promise<number[]>;
  /** Resource refunds recorded for this Power use. */
  readonly refunds: Array<() => Promise<void>>;
  /** Notes for chat (one per hit that omitted dice). */
  readonly notes: string[];
}

export function createAutofireDamageSession(opts: {
  useId: string;
  hitCount: number;
  promptNegation: (hitIndex: number, poolDice: number) => Promise<NegationPromptResult>;
}): AutofireDamageSession {
  const hitCount = Math.max(0, Math.floor(Number(opts.hitCount) || 0));
  const session: AutofireDamageSession = {
    useId: String(opts.useId),
    hitCount,
    omitCounts: new Array(hitCount).fill(0),
    poolDice: null,
    collected: false,
    refunds: [],
    notes: [],
    async collectNegation(poolDice: number): Promise<number[]> {
      if (session.collected) return [...session.omitCounts];
      session.collected = true;
      const pool = Math.max(0, Math.floor(Number(poolDice) || 0));
      session.poolDice = pool;
      for (let i = 0; i < hitCount; i++) {
        let res: NegationPromptResult;
        try {
          res = await opts.promptNegation(i, pool);
        } catch (err) {
          console.warn('Mastery System | Autofire Damage Negation prompt failed', err);
          continue;
        }
        const omit = normalizeOmitCount(res.diceRemoved, pool);
        session.omitCounts[i] = omit;
        if (res.refund) session.refunds.push(res.refund);
        if (omit > 0 && res.note) session.notes.push(`Hit ${i + 1}: ${res.note}`);
      }
      return [...session.omitCounts];
    },
  };
  return session;
}

const sessions = new Map<string, AutofireDamageSession>();

export function registerAutofireSession(session: AutofireDamageSession): void {
  sessions.set(session.useId, session);
}

export function getAutofireSession(useId: string | null | undefined): AutofireDamageSession | null {
  const id = String(useId ?? '').trim();
  return id ? (sessions.get(id) ?? null) : null;
}

/**
 * End an Autofire Power use: drop the in-memory session and its shared Raise
 * allocation. With `refund`, committed Negation spends are given back first (damage
 * roll cancelled / failed — no orphan spends).
 *
 * @returns number of refunds that ran.
 */
export async function endAutofireSession(
  useId: string | null | undefined,
  opts: { refund?: boolean } = {},
): Promise<number> {
  const id = String(useId ?? '').trim();
  if (!id) return 0;
  const session = sessions.get(id) ?? null;
  let refunded = 0;
  if (session && opts.refund) {
    for (const fn of [...session.refunds].reverse()) {
      try {
        await fn();
        refunded += 1;
      } catch (err) {
        console.warn('Mastery System | Autofire Negation refund failed', err);
      }
    }
    session.refunds.length = 0;
  }
  sessions.delete(id);
  forgetSharedRaiseAllocation(autofireRaiseShareKey(id));
  return refunded;
}

/** Test helper: number of live sessions. */
export function autofireSessionCount(): number {
  return sessions.size;
}
