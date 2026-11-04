/**
 * Artifact Safe Haven Rest / Combat use ledgers.
 *
 * Moonlight Judgment Limited uses now share the global Limited charge
 * (`limited-charge.ts`). Moonlight Shadow (ceil(MR/2)), Dragon Head Breath
 * (ceil(MR/2) + once per Combat), and similar Artifact Functions still use
 * these ledgers.
 */

import {
  isLimitedChargeAvailable,
  spendLimitedCharge,
} from './limited-charge.js';

export const ARTIFACT_REST_USES_FLAG = 'artifactRestUses';
export const ARTIFACT_COMBAT_USES_FLAG = 'artifactCombatUses';

export type ArtifactUseBucket =
  | 'moonlightJudgment'
  | 'moonlightShadow'
  | 'dragonBreath'
  | string;

function readMap(actor: any, flag: string): Record<string, number> {
  if (!actor) return {};
  try {
    const raw = actor.getFlag?.('mastery-system', flag);
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      const out: Record<string, number> = {};
      for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
        out[k] = Math.max(0, Math.floor(Number(v) || 0));
      }
      return out;
    }
  } catch {
    /* ignore */
  }
  const nested = actor.flags?.['mastery-system']?.[flag];
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(nested as Record<string, unknown>)) {
      out[k] = Math.max(0, Math.floor(Number(v) || 0));
    }
    return out;
  }
  return {};
}

async function writeMap(actor: any, flag: string, map: Record<string, number>): Promise<void> {
  if (!actor) return;
  if (typeof actor.setFlag === 'function') {
    await actor.setFlag('mastery-system', flag, map);
    return;
  }
  actor.flags = actor.flags || {};
  actor.flags['mastery-system'] = actor.flags['mastery-system'] || {};
  actor.flags['mastery-system'][flag] = map;
}

export function masteryRankOf(actor: any): number {
  return Math.max(1, Math.floor(Number(actor?.system?.mastery?.rank) || 1));
}

/**
 * @deprecated Batch 5 C07 — Limited is one global charge per Safe Haven Rest
 * (see `limited-charge.ts`). Kept for callers; always returns 1.
 */
export function limitedUsesForPowerLevel(_pl: number): number {
  return 1;
}

/** Moonlight Shadow / Breath Weapon rest uses = ceil(MR / 2). */
export function halfMasteryRankUses(masteryRank: number): number {
  return Math.ceil(masteryRankOf({ system: { mastery: { rank: masteryRank } } }) / 2);
}

/**
 * @deprecated Batch 5 C07 — Moonlight Judgment shares the global Limited charge.
 * Always 1 use (ignores artifact stage). Prefer `limitedChargeRemaining`.
 */
export function moonlightJudgmentMaxUses(_artifactLevel?: number): number {
  return 1;
}

export function moonlightShadowMaxUses(masteryRank: number): number {
  return Math.ceil(Math.max(1, Math.floor(Number(masteryRank) || 1)) / 2);
}

export function dragonBreathRestMaxUses(masteryRank: number): number {
  return moonlightShadowMaxUses(masteryRank);
}

export function getArtifactRestUsesSpent(actor: any, bucket: ArtifactUseBucket): number {
  return readMap(actor, ARTIFACT_REST_USES_FLAG)[bucket] || 0;
}

export function getArtifactCombatUsesSpent(actor: any, bucket: ArtifactUseBucket): number {
  return readMap(actor, ARTIFACT_COMBAT_USES_FLAG)[bucket] || 0;
}

export function remainingArtifactRestUses(
  actor: any,
  bucket: ArtifactUseBucket,
  maxUses: number,
): number {
  return Math.max(0, Math.floor(Number(maxUses) || 0) - getArtifactRestUsesSpent(actor, bucket));
}

export function canSpendArtifactRestUse(
  actor: any,
  bucket: ArtifactUseBucket,
  maxUses: number,
): boolean {
  return remainingArtifactRestUses(actor, bucket, maxUses) > 0;
}

export function canSpendArtifactCombatUse(actor: any, bucket: ArtifactUseBucket): boolean {
  return getArtifactCombatUsesSpent(actor, bucket) < 1;
}

export async function spendArtifactRestUse(
  actor: any,
  bucket: ArtifactUseBucket,
  maxUses: number,
): Promise<{ ok: true; spent: number; remaining: number } | { ok: false; reason: 'exhausted' }> {
  const spent = getArtifactRestUsesSpent(actor, bucket);
  if (spent >= maxUses) return { ok: false, reason: 'exhausted' };
  const map = readMap(actor, ARTIFACT_REST_USES_FLAG);
  map[bucket] = spent + 1;
  await writeMap(actor, ARTIFACT_REST_USES_FLAG, map);
  return { ok: true, spent: spent + 1, remaining: Math.max(0, maxUses - spent - 1) };
}

export async function spendArtifactCombatUse(
  actor: any,
  bucket: ArtifactUseBucket,
): Promise<{ ok: true } | { ok: false; reason: 'exhausted' }> {
  if (!canSpendArtifactCombatUse(actor, bucket)) return { ok: false, reason: 'exhausted' };
  const map = readMap(actor, ARTIFACT_COMBAT_USES_FLAG);
  map[bucket] = 1;
  await writeMap(actor, ARTIFACT_COMBAT_USES_FLAG, map);
  return { ok: true };
}

export async function clearArtifactRestUses(actor: any): Promise<void> {
  if (!actor) return;
  try {
    if (typeof actor.unsetFlag === 'function') {
      if (actor.getFlag?.('mastery-system', ARTIFACT_REST_USES_FLAG) != null) {
        await actor.unsetFlag('mastery-system', ARTIFACT_REST_USES_FLAG);
      }
      return;
    }
  } catch {
    /* fall through */
  }
  if (actor.flags?.['mastery-system']) {
    delete actor.flags['mastery-system'][ARTIFACT_REST_USES_FLAG];
  }
}

export async function clearArtifactCombatUses(actor: any): Promise<void> {
  if (!actor) return;
  try {
    if (typeof actor.unsetFlag === 'function') {
      if (actor.getFlag?.('mastery-system', ARTIFACT_COMBAT_USES_FLAG) != null) {
        await actor.unsetFlag('mastery-system', ARTIFACT_COMBAT_USES_FLAG);
      }
      return;
    }
  } catch {
    /* fall through */
  }
  if (actor.flags?.['mastery-system']) {
    delete actor.flags['mastery-system'][ARTIFACT_COMBAT_USES_FLAG];
  }
}

/** Clear combat-once ledgers for every combatant on combat end/delete. */
export async function clearArtifactCombatUsesForCombat(combat: any): Promise<void> {
  const combatants = combat?.combatants;
  if (!combatants) return;
  const list = typeof combatants.values === 'function' ? Array.from(combatants.values()) : combatants;
  for (const c of list as any[]) {
    const actor = c?.actor;
    if (actor) await clearArtifactCombatUses(actor);
  }
}

/**
 * Moonlight Judgment gate — delegates to the global Limited charge (C07).
 */
export function assertMoonlightJudgmentAvailable(actor: any, _artifactLevel?: number): boolean {
  return isLimitedChargeAvailable(actor);
}

export async function spendMoonlightJudgmentUse(
  actor: any,
  _artifactLevel?: number,
): Promise<boolean> {
  const r = await spendLimitedCharge(actor);
  return r.ok;
}

export function assertMoonlightShadowAvailable(actor: any): boolean {
  return canSpendArtifactRestUse(
    actor,
    'moonlightShadow',
    moonlightShadowMaxUses(masteryRankOf(actor)),
  );
}

export async function spendMoonlightShadowUse(actor: any): Promise<boolean> {
  const r = await spendArtifactRestUse(
    actor,
    'moonlightShadow',
    moonlightShadowMaxUses(masteryRankOf(actor)),
  );
  return r.ok;
}

/**
 * Dragon Breath: shared Damage/Ruin counter.
 * Must have remaining Safe Haven uses AND not already used this Combat.
 * Artifact Awakening must not bypass the combat-once gate.
 */
export function assertDragonBreathAvailable(actor: any): {
  ok: boolean;
  reason?: 'rest' | 'combat';
} {
  const restMax = dragonBreathRestMaxUses(masteryRankOf(actor));
  if (!canSpendArtifactRestUse(actor, 'dragonBreath', restMax)) {
    return { ok: false, reason: 'rest' };
  }
  if (!canSpendArtifactCombatUse(actor, 'dragonBreath')) {
    return { ok: false, reason: 'combat' };
  }
  return { ok: true };
}

export async function spendDragonBreathUse(actor: any): Promise<boolean> {
  const gate = assertDragonBreathAvailable(actor);
  if (!gate.ok) return false;
  const rest = await spendArtifactRestUse(
    actor,
    'dragonBreath',
    dragonBreathRestMaxUses(masteryRankOf(actor)),
  );
  if (!rest.ok) return false;
  const combat = await spendArtifactCombatUse(actor, 'dragonBreath');
  return combat.ok;
}
