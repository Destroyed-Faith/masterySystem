/**
 * Active Buff lifecycle — Preparation-Phase activation, complete-Round duration,
 * Round-End expiry, and Preparation resource refresh (Temp HP / DN Pool).
 *
 * Duration: lastActiveRound = activationRound + effectiveDuration - 1.
 * MR1 activated in Prep for Round 1 lasts all of Round 1 and expires at Round End.
 */

import { getRoundState, setRoundState } from './action-economy.js';
import { refreshBuffDamageNegationPools } from './damage-negation.js';
import {
  activeBuffPrepResourceKey,
  activeBuffResourceIdentity,
  canGrantPrepTempHP,
  markPrepTempHPGranted,
  snapshotPrepDamageNegationOnEnd,
  type ActiveBuffPrepResourceLedger,
} from './active-buff-prep-resources.js';
import {
  getTempHPSources,
  makeSourceKey,
  upsertTempHPSource,
  type TempHPSource,
} from './passive-triggers.js';
async function loadActiveBuffHelpers(): Promise<{
  getActiveBuffs: (actor: Actor) => any[];
  isTrueActiveBuff: (power: any) => boolean;
}> {
  const mod = await import('../utils/active-buffs.js');
  return { getActiveBuffs: mod.getActiveBuffs, isTrueActiveBuff: mod.isTrueActiveBuff };
}

function getActiveBuffsSync(actor: any): any[] {
  // Synchronous read used after effects exist — duplicate minimal filter to avoid
  // circular import with active-buffs.ts at module load.
  const effects = actor?.effects;
  if (!effects) return [];
  const list = Array.isArray(effects)
    ? effects
    : Array.isArray(effects.contents)
      ? effects.contents
      : typeof effects[Symbol.iterator] === 'function'
        ? Array.from(effects)
        : [];
  return list.filter((effect: any) => effect?.flags?.['mastery-system']?.activeBuff === true);
}

/** Pure duration math (authoritative). */
export function computeLastActiveRound(
  activationRound: number,
  effectiveDuration: number,
): number {
  const act = Math.max(1, Math.floor(Number(activationRound) || 1));
  const dur = Math.max(1, Math.floor(Number(effectiveDuration) || 1));
  return act + dur - 1;
}

export function isBuffActiveInRound(
  activationRound: number,
  lastActiveRound: number,
  currentRound: number,
): boolean {
  const cur = Math.max(1, Math.floor(Number(currentRound) || 1));
  const act = Math.max(1, Math.floor(Number(activationRound) || 1));
  const last = Math.max(act, Math.floor(Number(lastActiveRound) || act));
  return cur >= act && cur <= last;
}

/** Upcoming combat Round for Preparation (Foundry prep often uses round 0). */
export function preparationTargetRound(combat: any): number {
  const r = Math.floor(Number(combat?.round) || 0);
  return Math.max(1, r <= 0 ? 1 : r);
}

/** Combat flag: Preparation (for Active Buff activate/replace) closed for this Round. */
export const ACTIVE_BUFF_PREP_CLOSED_ROUND_FLAG = 'activeBuffPrepClosedRound';

/**
 * True when the actor may legally activate/replace an Active Buff.
 *
 * Batch 6.1: Stone Confirmation does **not** close this window. The window
 * stays open for the whole Preparation Phase (including after stones are
 * confirmed) and closes when Round turns begin (`activeBuffPrepClosedRound`).
 */
export function isActiveBuffPreparationWindow(actor: any, combat: any): boolean {
  if (!actor || !combat?.id) return false;
  // Soft open: combat not started yet → Preparation
  if (!(combat as any).started) return true;
  const round = preparationTargetRound(combat);
  try {
    const closed =
      (combat as any).getFlag?.('mastery-system', ACTIVE_BUFF_PREP_CLOSED_ROUND_FLAG) ??
      (combat as any).flags?.['mastery-system']?.[ACTIVE_BUFF_PREP_CLOSED_ROUND_FLAG];
    if (Number(closed) === round) return false;
  } catch {
    /* fall through */
  }
  // Still in Preparation for this Round — even if stones are already confirmed.
  return true;
}

/** Mark Active Buff activate/replace closed for the current Round (turns begun). */
export async function closeActiveBuffPreparationForRound(combat: any): Promise<void> {
  if (!combat?.id || typeof combat.setFlag !== 'function') return;
  const round = preparationTargetRound(combat);
  try {
    await combat.setFlag('mastery-system', ACTIVE_BUFF_PREP_CLOSED_ROUND_FLAG, round);
    if (combat.flags?.['mastery-system']) {
      combat.flags['mastery-system'][ACTIVE_BUFF_PREP_CLOSED_ROUND_FLAG] = round;
    }
  } catch (err) {
    console.warn('Mastery System | closeActiveBuffPreparationForRound failed', err);
  }
}

/** Re-open Active Buff Preparation when a new Round begins. */
export async function openActiveBuffPreparationForRound(combat: any): Promise<void> {
  if (!combat?.id || typeof combat.unsetFlag !== 'function') return;
  try {
    await combat.unsetFlag('mastery-system', ACTIVE_BUFF_PREP_CLOSED_ROUND_FLAG);
    if (combat.flags?.['mastery-system']) {
      delete combat.flags['mastery-system'][ACTIVE_BUFF_PREP_CLOSED_ROUND_FLAG];
    }
  } catch (err) {
    console.warn('Mastery System | openActiveBuffPreparationForRound failed', err);
  }
}

export function readBuffLifecycleFlags(effect: any): {
  activationRound: number;
  effectiveDuration: number;
  lastActiveRound: number;
  combatId: string;
  durationMode: string;
} | null {
  const flags = effect?.flags?.['mastery-system'];
  if (!flags?.activeBuff) return null;
  const activationRound = Math.max(1, Math.floor(Number(flags.activationRound ?? flags.activatedRound) || 1));
  const effectiveDuration = Math.max(
    1,
    Math.floor(Number(flags.effectiveDuration ?? flags.durationRounds) || 1),
  );
  const lastActiveRound = Math.max(
    activationRound,
    Math.floor(
      Number(flags.lastActiveRound) || computeLastActiveRound(activationRound, effectiveDuration),
    ),
  );
  return {
    activationRound,
    effectiveDuration,
    lastActiveRound,
    combatId: String(flags.combatId ?? ''),
    durationMode: String(flags.durationMode || ''),
  };
}

/** Remaining complete Rounds including the current Round (0 if expired). */
export function remainingCompleteRounds(
  lastActiveRound: number,
  currentRound: number,
): number {
  const last = Math.floor(Number(lastActiveRound) || 0);
  const cur = Math.max(1, Math.floor(Number(currentRound) || 1));
  return Math.max(0, last - cur + 1);
}

/**
 * Legacy: commit the base Attack Action for the upcoming Round (survives resetTurnState).
 * Current Active Buff activation no longer calls this — kept for older fights / tests / refunds.
 */
export async function commitPrepBaseAttackAction(
  actor: any,
  combat: any,
): Promise<boolean> {
  if (!actor || !combat) return false;
  const rs = getRoundState(actor, combat);
  if (rs.prepBaseAttackCommitted) return false;
  if (rs.baseAttackLocked) return false;
  // Must still have a base slot conceptually: if used already ate the only action and no extras…
  const total = Math.max(0, Math.floor(Number(rs.attackActions?.total) || 1));
  const used = Math.max(0, Math.floor(Number(rs.attackActions?.used) || 0));
  if (total - used <= 0 && !rs.stoneBonuses?.extraAttacks) {
    // Still allow commit when total≥1 and used=0 — checked via available helpers by caller.
  }
  rs.prepBaseAttackCommitted = true;
  rs.activeBuffUsedThisRound = true;
  await setRoundState(actor, rs);
  return true;
}

export async function clearPrepBaseAttackCommitment(actor: any, combat: any): Promise<void> {
  if (!actor || !combat) return;
  const rs = getRoundState(actor, combat);
  if (!rs.prepBaseAttackCommitted) return;
  rs.prepBaseAttackCommitted = false;
  await setRoundState(actor, rs);
}

/**
 * Full rollback of a Preparation Active Buff activation cost:
 * clears prepBaseAttackCommitted and activeBuffUsedThisRound.
 * Call only when the base Attack was committed for that activation.
 */
export async function refundPrepActiveBuffActivation(
  actor: any,
  combat: any,
): Promise<boolean> {
  if (!actor || !combat) return false;
  const rs = getRoundState(actor, combat);
  if (!rs.prepBaseAttackCommitted && !rs.activeBuffUsedThisRound) return false;
  const hadCommit = !!rs.prepBaseAttackCommitted;
  rs.prepBaseAttackCommitted = false;
  rs.activeBuffUsedThisRound = false;
  await setRoundState(actor, rs);
  return hadCommit;
}

/**
 * Expire Active Buffs whose lastActiveRound is strictly before the new Round
 * (i.e. Round End of lastActiveRound has passed). Call when advancing to `newRound`.
 */
export async function expireActiveBuffsAtRoundEnd(
  actor: any,
  combat: any,
  endingRound: number,
): Promise<string[]> {
  if (!actor) return [];
  const ended = Math.max(1, Math.floor(Number(endingRound) || 1));
  const expiredNames: string[] = [];
  const effects = getActiveBuffsSync(actor);
  for (const effect of effects) {
    const life = readBuffLifecycleFlags(effect);
    if (!life) continue;
    if (combat?.id && life.combatId && life.combatId !== String(combat.id)) continue;
    // Expire when the Round that just ended was the last active Round.
    if (life.lastActiveRound <= ended) {
      expiredNames.push(String(effect.name || 'Active Buff'));
      try {
        await effect.delete?.();
      } catch (err) {
        console.warn('Mastery System | Active Buff Round-End expiry failed', err);
      }
    }
  }
  return expiredNames;
}

/**
 * Snapshot Prep-scoped DN remaining before an Active Buff effect ends
 * (replace / voluntary end). Survives A→B→A within the same Preparation.
 */
export async function snapshotActiveBuffPrepResourcesBeforeEnd(
  actor: any,
  combat: any,
  effect: any,
): Promise<void> {
  if (!actor || !effect) return;
  const flags = effect?.flags?.['mastery-system'];
  if (!flags?.activeBuff) return;
  const identity = activeBuffResourceIdentity(flags);
  if (!identity || !combat?.id) return;
  const round = preparationTargetRound(combat);
  const key = activeBuffPrepResourceKey(String(combat.id), round, identity);
  const mech = flags.mechanics && typeof flags.mechanics === 'object' ? flags.mechanics : {};
  const tid = String(flags.powerTemplateId ?? flags.templateId ?? '').toLowerCase();
  const name = String(effect?.name ?? flags.powerName ?? '').toLowerCase();
  const isDnBuff =
    tid === 'ab-reinforced-damage-negation' ||
    name.includes('damage negation pool') ||
    name.includes('reinforced damage negation');
  if (!isDnBuff) return;
  const max = Math.max(
    0,
    Math.floor(Number(mech.damageNegationPoolMax ?? mech.damageNegation ?? flags.damageNegationPoolMax) || 0),
  );
  const remaining = Math.max(0, Math.floor(Number(mech.damageNegation) || 0));
  try {
    const rs = getRoundState(actor, combat);
    const ledger = (rs.activeBuffPrepResourceLedger || {}) as ActiveBuffPrepResourceLedger;
    rs.activeBuffPrepResourceLedger = snapshotPrepDamageNegationOnEnd(ledger, key, remaining, max);
    await setRoundState(actor, rs);
  } catch (err) {
    console.warn('Mastery System | Active Buff Prep DN snapshot failed', err);
  }
}

/**
 * Refresh Active Buff Temporary HP pools at Preparation (once per Round).
 * Raises each buff-owned refresh source to its declared printed value.
 * A→B→A in the same Prep does not re-grant Temp HP for the same template.
 */
export async function refreshActiveBuffTempHPAtPreparation(
  actor: any,
  combat: any,
): Promise<void> {
  if (!actor) return;
  const combatId = String(combat?.id ?? '');
  const effects = getActiveBuffsSync(actor);
  let ledger: ActiveBuffPrepResourceLedger =
    combat
      ? (((getRoundState(actor, combat).activeBuffPrepResourceLedger ||
          {}) as ActiveBuffPrepResourceLedger))
      : {};
  let ledgerDirty = false;
  for (const effect of effects) {
    const flags = effect?.flags?.['mastery-system'];
    if (!flags?.activeBuff) continue;
    if (!buffUsesPreparationTempHPRefresh(effect)) continue;
    const mech = flags.mechanics && typeof flags.mechanics === 'object' ? flags.mechanics : {};
    const raw =
      mech.tempHP ??
      mech.triggers?.preparation?.tempHP ??
      mech.triggers?.turnStartSelf?.tempHP;
    if (raw == null || raw === '') continue;
    const target = Math.max(0, Math.floor(Number(String(raw).replace(/[^\d.-]/g, '')) || 0));
    if (target <= 0) continue;
    // Skip if this Round already refreshed (idempotent per combatId:round).
    const round = preparationTargetRound(combat);
    const refreshKey = `prepTempHP:${combatId}:${round}`;
    if (flags[refreshKey]) continue;

    const identity = activeBuffResourceIdentity(flags);
    const ledgerKey = identity
      ? activeBuffPrepResourceKey(combatId, round, identity)
      : '';
    if (ledgerKey && !canGrantPrepTempHP(ledger, ledgerKey)) {
      // Same template already granted Temp HP this Prep (A→B→A) — skip re-grant.
      try {
        if (typeof effect.update === 'function') {
          await effect.update({ [`flags.mastery-system.${refreshKey}`]: true });
        } else if (flags) {
          flags[refreshKey] = true;
        }
      } catch {
        /* best-effort */
      }
      continue;
    }

    const effectId = String(effect?.id ?? effect?._id ?? '');
    if (!effectId) continue;
    const key = makeSourceKey('buff', effectId, 'turnStartSelf');
    const existing = getTempHPSources(actor)[key];
    const source: TempHPSource = {
      value: Math.max(existing?.value ?? 0, target),
      declared: target,
      kind: 'refresh',
      origin: {
        ownerKind: 'buff',
        powerId: effectId,
        name: String(flags.powerName ?? effect?.name ?? 'Active Buff'),
        triggerKind: 'turnStartSelf',
      },
      combatId,
      createdAt: existing?.createdAt ?? Date.now(),
    };
    await upsertTempHPSource(actor, key, source);
    if (ledgerKey) {
      ledger = markPrepTempHPGranted(ledger, ledgerKey);
      ledgerDirty = true;
    }
    try {
      if (typeof effect.update === 'function') {
        await effect.update({ [`flags.mastery-system.${refreshKey}`]: true });
      } else if (flags) {
        flags[refreshKey] = true;
      }
    } catch {
      /* best-effort idempotence mark */
    }
  }
  if (ledgerDirty && combat) {
    try {
      const rs = getRoundState(actor, combat);
      rs.activeBuffPrepResourceLedger = ledger;
      await setRoundState(actor, rs);
    } catch (err) {
      console.warn('Mastery System | Active Buff Prep Temp HP ledger write failed', err);
    }
  }
}

/**
 * Preparation tick for one actor: refresh Round resources for maintained Buffs.
 * Call after Round End expiry for the previous Round / at Prep open for the new Round.
 */
export async function processActiveBuffPreparation(
  actor: any,
  combat: any,
): Promise<void> {
  if (!actor) return;
  await refreshBuffDamageNegationPools(actor);
  await refreshActiveBuffTempHPAtPreparation(actor, combat);
}

/**
 * Round advance pipeline helper: expire buffs that ended with `previousRound`,
 * then refresh surviving buffs for `newRound` Preparation.
 */
export async function onCombatRoundAdvanceActiveBuffs(
  combat: any,
  newRound: number,
): Promise<void> {
  if (!combat?.combatants) return;
  const prev = Math.max(1, Math.floor(Number(newRound) || 1) - 1);
  for (const c of combat.combatants) {
    const actor = c?.actor;
    if (!actor) continue;
    if (prev >= 1 && Math.floor(Number(newRound) || 1) >= 2) {
      await expireActiveBuffsAtRoundEnd(actor, combat, prev);
    }
    await processActiveBuffPreparation(actor, combat);
  }
}

/** List true Active Buff power items the actor owns (for Preparation UI). */
export async function listActivatableActiveBuffPowers(actor: any): Promise<any[]> {
  if (!actor?.items) return [];
  const { isTrueActiveBuff } = await loadActiveBuffHelpers();
  const items = Array.isArray(actor.items)
    ? actor.items
    : Array.isArray(actor.items.contents)
      ? actor.items.contents
      : typeof actor.items[Symbol.iterator] === 'function'
        ? Array.from(actor.items)
        : [];
  const powers = items.filter((it: any) => {
    if (it?.type !== 'power') return false;
    try {
      return isTrueActiveBuff(it);
    } catch {
      return false;
    }
  });
  // Artifact Active Buff rows (e.g. Moonlight Shadow) — no backing power item.
  try {
    const { buildArtifactRadialOptions } = await import('../radial-menu/artifact-options.js');
    const artifactOpts = buildArtifactRadialOptions(actor) || [];
    for (const opt of artifactOpts) {
      if (opt?.powerType !== 'active-buff') continue;
      powers.push({
        id: String(opt.id || ''),
        _id: String(opt.id || ''),
        name: String(opt.name || 'Artifact Active Buff'),
        type: 'artifact-active-buff',
        system: {
          rank: Number(opt.artifactRowLevel) || 1,
          level: Number(opt.artifactRowLevel) || 1,
          templateId: opt.artifactPowerTemplateId || null,
        },
        __artifactOption: opt,
        __artifactItem: opt.item,
      });
    }
  } catch (err) {
    console.warn('Mastery System | Artifact Active Buff list failed', err);
  }
  return powers;
}

export function formatActiveBuffDurationLabel(
  activationRound: number,
  lastActiveRound: number,
  currentRound: number,
): string {
  const rem = remainingCompleteRounds(lastActiveRound, currentRound);
  if (rem <= 0) return 'Expired';
  if (rem === 1) return `Active through Round ${lastActiveRound} (this Round)`;
  return `Active through Round ${lastActiveRound} (${rem} Rounds left)`;
}

/** Skip turnStartSelf Temp HP for Active Buffs that refresh at Preparation. */
export function buffUsesPreparationTempHPRefresh(effect: any): boolean {
  const flags = effect?.flags?.['mastery-system'];
  if (!flags?.activeBuff) return false;
  const tid = String(flags.powerTemplateId ?? '').toLowerCase();
  if (tid === 'ab-temp-hp' || tid === 'ab-temp-hp-healing') return true;
  const mech = flags.mechanics;
  if (mech?.preparationTempHP === true) return true;
  // Prefer Prep refresh whenever a buff declares tempHP without an explicit turn pulse.
  if (mech?.tempHP != null && mech?.triggers?.turnStartSelf?.tempHP == null) return true;
  if (mech?.triggers?.preparation?.tempHP) return true;
  return tid.includes('temp-hp') || tid.includes('temphp');
}
