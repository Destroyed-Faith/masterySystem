/**
 * Perception gating — can an observer perceive / target a creature through Combat Senses?
 *
 * Mechanical perception only. Foundry Token Vision (sight range, vision
 * mode, enabled flag) and the scene lighting layer (`src/vision`) are
 * rendering for the user and are deliberately not consulted here.
 *
 * Invisibility TN (rules):
 *   (4 × MR) + Invisibility Bonus − (Lost Health Bars × MR) + Stealth Spent
 */

import type { CombatSenseId } from './combat-senses.js';
import { COMBAT_SENSES } from './combat-senses.js';
import {
  getActiveCombatSense,
  isNonSightCombatSense,
  listActorCombatSenses,
} from './combat-sense-collection.js';
import {
  getPerceptionCombatState,
  hasLocatedTarget,
  isRevealedThisRound,
  lostHealthBarsForInvis,
  markLocatedTarget,
  markRevealedThisRound,
  setPerceptionCombatState,
} from './perception-state.js';
import {
  effectiveInvisibilityBonusForActor,
  isSenseBlockedForActor,
} from './invisibility-profile.js';
import { buildDifficultyPresets } from '../dice/roll-context-build.js';
import { tokenIsExcludedAsTarget } from './defeated-token.js';
import { getRulesMasteryRank } from '../utils/mastery-rank-sync.js';

export interface PerceptionGateResult {
  canTarget: boolean;
  needsPerceptionCheck: boolean;
  reason: string;
  /** Sense used if already perceived without a fresh check. */
  senseUsed?: CombatSenseId;
}

function targetMasteryRank(actor: any): number {
  return getRulesMasteryRank(actor);
}

function distanceMeters(a: { x: number; y: number }, b: { x: number; y: number }): number {
  try {
    const grid = (globalThis as any).canvas?.grid;
    if (grid?.measurePath) {
      const path = grid.measurePath([{ x: a.x, y: a.y }, { x: b.x, y: b.y }]);
      const d = Number(path?.distance ?? path?.spaces ?? 0);
      if (d > 0) return d;
    }
  } catch {
    /* fall through */
  }
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const gridSize = Number((globalThis as any).canvas?.grid?.size) || 100;
  const pixels = Math.hypot(dx, dy);
  return (pixels / gridSize) * (Number((globalThis as any).canvas?.grid?.distance) || 1);
}

function senseInRange(observerToken: any, targetToken: any, senseId: CombatSenseId): boolean {
  const def = COMBAT_SENSES[senseId];
  if (!def?.rangeM) return true;
  const oc = observerToken?.center ?? observerToken?.document?.center;
  const tc = targetToken?.center ?? targetToken?.document?.center;
  if (!oc || !tc) return true;
  return distanceMeters(oc, tc) <= def.rangeM;
}

/**
 * Perception TN vs an invisible (or hidden+invis) creature.
 * Hidden-only (no invis) still uses legacy stealthRaiseBonus on top of a flat base
 * so non-invis Stealth keeps working until a separate rewrite.
 */
export function computePerceptionTn(target: any, _observer?: any): number {
  const mr = Math.max(1, targetMasteryRank(target));
  const inv = effectiveInvisibilityBonusForActor(target);
  const st = getPerceptionCombatState(target);
  const stealthSpent = Math.max(0, Math.floor(Number(st.stealthSpentThisRound) || 0));
  const stealthRaise = Math.max(0, Math.floor(Number(st.stealthRaiseBonus) || 0));

  if (inv > 0) {
    const lostBars = lostHealthBarsForInvis(target);
    return Math.max(0, 4 * mr + inv - lostBars * mr + stealthSpent);
  }

  // Hidden without Invisibility — legacy raise bonus until Stealth rewrite.
  return Math.max(0, 4 * mr + stealthRaise + stealthSpent);
}

/**
 * Whether `observer` can directly perceive `target` for targeting without a new Perception check.
 */
export function evaluatePerceptionGate(
  observer: any,
  target: any,
  opts?: {
    observerToken?: any;
    targetToken?: any;
    combatRound?: number;
    forTargeting?: boolean;
  },
): PerceptionGateResult {
  if (!observer || !target) {
    return { canTarget: false, needsPerceptionCheck: false, reason: 'Missing actor.' };
  }
  if (String(observer.id) === String(target.id)) {
    return { canTarget: true, needsPerceptionCheck: false, reason: 'Self.' };
  }

  const round = Math.max(
    1,
    Math.floor(Number(opts?.combatRound) || (globalThis as any).game?.combat?.round || 1),
  );

  if (isRevealedThisRound(target, round)) {
    return {
      canTarget: true,
      needsPerceptionCheck: false,
      reason: 'Revealed by attacking this round.',
      senseUsed: getActiveCombatSense(observer),
    };
  }

  if (hasLocatedTarget(observer, target, round)) {
    return {
      canTarget: true,
      needsPerceptionCheck: false,
      reason: 'Located this round via Perception.',
      senseUsed: getActiveCombatSense(observer),
    };
  }

  const tgtState = getPerceptionCombatState(target);
  const hidden = !!tgtState.hidden;
  const inv = effectiveInvisibilityBonusForActor(target);
  const senses = listActorCombatSenses(observer);

  for (const senseId of senses) {
    if (isSenseBlockedForActor(target, senseId)) continue;
    if (
      opts?.observerToken &&
      opts?.targetToken &&
      !senseInRange(opts.observerToken, opts.targetToken, senseId)
    ) {
      continue;
    }
    // Uncovered / unaffected sense + not hidden → normal perception.
    if (!hidden && inv <= 0) {
      return {
        canTarget: true,
        needsPerceptionCheck: false,
        reason: 'Ordinary awareness.',
        senseUsed: senseId,
      };
    }
    // Uncovered Special Combat Sense ignores Invisibility entirely.
    if (inv > 0 && senseId !== 'normalCombatAwareness' && senseId !== 'darkvision') {
      return {
        canTarget: true,
        needsPerceptionCheck: false,
        reason: `Uncovered sense: ${COMBAT_SENSES[senseId].label}.`,
        senseUsed: senseId,
      };
    }
    if (hidden && !inv && senseId !== 'normalCombatAwareness') {
      return {
        canTarget: true,
        needsPerceptionCheck: false,
        reason: `Hidden target perceived via ${COMBAT_SENSES[senseId].label}.`,
        senseUsed: senseId,
      };
    }
  }

  if (hidden || inv > 0) {
    return {
      canTarget: false,
      needsPerceptionCheck: true,
      reason:
        hidden && inv > 0
          ? 'Hidden and invisible to Covered senses.'
          : hidden
            ? 'Hidden.'
            : 'Invisible — Covered senses only.',
    };
  }

  return { canTarget: true, needsPerceptionCheck: false, reason: 'No concealment.' };
}

/** Filter token ids to those the attacker can attempt to target (may still need Perception). */
export function filterPerceivableTargetIds(
  attackerActor: any,
  candidateTokenIds: Iterable<string>,
  attackerToken?: any,
): Set<string> {
  const out = new Set<string>();
  const tokens = (globalThis as any).canvas?.tokens?.placeables ?? [];
  const byId = new Map<string, any>();
  for (const t of tokens) {
    if (t?.id) byId.set(t.id, t);
  }

  for (const tid of candidateTokenIds) {
    const tok = byId.get(tid);
    const targetActor = tok?.actor;
    if (!targetActor) continue;
    if (tokenIsExcludedAsTarget(tok)) continue;
    const gate = evaluatePerceptionGate(attackerActor, targetActor, {
      observerToken: attackerToken,
      targetToken: tok,
      forTargeting: true,
    });
    if (gate.canTarget || gate.needsPerceptionCheck) out.add(tid);
  }
  return out;
}

/**
 * Interactive gate before attack targeting. Returns true if targeting may proceed.
 * On failure the action is not spent.
 */
export async function ensureCanTargetWithPerception(
  observer: any,
  target: any,
  opts?: { observerToken?: any; targetToken?: any },
): Promise<boolean> {
  const gate = evaluatePerceptionGate(observer, target, { ...opts, forTargeting: true });
  if (gate.canTarget) return true;
  if (!gate.needsPerceptionCheck) return false;

  const st = getPerceptionCombatState(observer);
  const tgtId = String(target?.id ?? '');
  if (st.perceptionUsedVs?.[tgtId]) {
    (globalThis as any).ui?.notifications?.warn?.(
      `Already attempted Perception vs ${target.name ?? 'target'} this round.`,
    );
    return false;
  }

  const baseTn = computePerceptionTn(target, observer);
  const outcome = await promptPerceptionCheck(observer, target, baseTn);
  const round = Math.max(1, Math.floor(Number((globalThis as any).game?.combat?.round) || 1));

  // Cancel / close without rolling must not burn the once-per-round attempt.
  if (outcome.cancelled) return false;

  const used = { ...(st.perceptionUsedVs ?? {}), [tgtId]: true };
  await setPerceptionCombatState(observer, { perceptionUsedVs: used });

  if (outcome.success) {
    await markLocatedTarget(observer, target, round);
    return true;
  }
  const finalTn = computePerceptionTn(target, observer);
  (globalThis as any).ui?.notifications?.info?.(
    `Perception failed (TN ${finalTn}). Choose another target or action — your action is not spent.`,
  );
  return false;
}

function stealthPoolRemaining(actor: any): number {
  const rating = Math.max(0, Math.floor(Number(actor?.system?.skills?.stealth) || 0));
  const spent = Math.max(0, Math.floor(Number(actor?.system?.skillsSpent?.stealth) || 0));
  return Math.max(0, rating - spent);
}

/**
 * After the observer's final Perception result is known, the invisible creature
 * may spend Stealth Skill Points (min = MR, steps of MR, All-in ok) to raise TN.
 * Returns points actually spent this prompt (already added to stealthSpentThisRound).
 */
export async function promptRetroactiveStealthSpend(
  invisibleActor: any,
  observerResult: number,
  currentTn: number,
): Promise<number> {
  if (!invisibleActor) return 0;
  const inv = effectiveInvisibilityBonusForActor(invisibleActor);
  if (inv <= 0) return 0;

  // Already failing the check — no need to spend.
  if (observerResult < currentTn) return 0;

  const mr = Math.max(1, targetMasteryRank(invisibleActor));
  const remaining = stealthPoolRemaining(invisibleActor);
  if (remaining < mr && remaining <= 0) return 0;

  const needed = observerResult - currentTn + 1; // must exceed result
  const Dialog: any = (globalThis as any).Dialog;
  if (!Dialog) return 0;

  const name = String(invisibleActor.name || 'Invisible');
  return new Promise((resolve) => {
    try {
      new Dialog({
        title: `Retroactive Stealth — ${name}`,
        content: `<p>Observer Perception result: <strong>${observerResult}</strong> vs TN <strong>${currentTn}</strong>.</p>
          <p>Spend Stealth Skill Points to raise the Invisibility TN for the rest of this Round (min ${mr}, steps of ${mr}, All-in allowed). Need at least <strong>${needed}</strong> to prevent detection.</p>
          <p>Stealth pool remaining: <strong>${remaining}</strong></p>
          <div class="form-group"><label>Points to spend</label>
            <input type="number" name="spend" value="${Math.min(remaining, Math.max(mr, needed))}" min="0" max="${remaining}" step="${mr}"/></div>`,
        buttons: {
          spend: {
            label: 'Spend',
            callback: async (html: any) => {
              const root = html?.jquery ? html[0] : html;
              const el =
                (root?.querySelector?.('input[name="spend"]') as HTMLInputElement | null) ||
                (typeof html?.find === 'function' ? html.find('input[name="spend"]')[0] : null);
              let spend = Math.max(0, Math.floor(Number(el?.value) || 0));
              if (spend > remaining) spend = remaining;
              if (spend > 0 && spend < mr && spend !== remaining) {
                // Enforce min MR unless All-in (spend === remaining).
                (globalThis as any).ui?.notifications?.warn?.(
                  `Minimum Stealth spend is ${mr} (or All-in remaining ${remaining}).`,
                );
                resolve(0);
                return;
              }
              if (spend > 0 && spend !== remaining && spend % mr !== 0) {
                (globalThis as any).ui?.notifications?.warn?.(
                  `Stealth spend must be in steps of ${mr} (or All-in).`,
                );
                resolve(0);
                return;
              }
              if (spend <= 0) {
                resolve(0);
                return;
              }
              try {
                const curSpent = Math.max(
                  0,
                  Math.floor(Number(invisibleActor.system?.skillsSpent?.stealth) || 0),
                );
                await invisibleActor.update?.({
                  'system.skillsSpent.stealth': curSpent + spend,
                });
                const st = getPerceptionCombatState(invisibleActor);
                const prev = Math.max(0, Math.floor(Number(st.stealthSpentThisRound) || 0));
                await setPerceptionCombatState(invisibleActor, {
                  stealthSpentThisRound: prev + spend,
                });
                (globalThis as any).ui?.notifications?.info?.(
                  `${name} spends ${spend} Stealth — Invisibility TN +${spend} this Round.`,
                );
                resolve(spend);
              } catch (err) {
                console.warn('Mastery System | retroactive Stealth spend failed', err);
                resolve(0);
              }
            },
          },
          skip: {
            label: 'No spend',
            callback: () => resolve(0),
          },
        },
        default: 'spend',
        close: () => resolve(0),
      }).render(true);
    } catch {
      resolve(0);
    }
  });
}

async function promptPerceptionCheck(
  observer: any,
  target: any,
  tn: number,
): Promise<{ success: boolean; total: number; tn: number; cancelled?: boolean }> {
  const Dialog: any = (globalThis as any).Dialog;
  if (!Dialog) return { success: false, total: 0, tn, cancelled: true };

  const obsName = String(observer?.name ?? 'Observer');
  const tgtName = String(target?.name ?? 'Target');
  const inv = effectiveInvisibilityBonusForActor(target);
  const mr = targetMasteryRank(target);
  const lost = lostHealthBarsForInvis(target);
  const formulaNote =
    inv > 0
      ? `(4×MR ${mr}) + Invis ${inv} − (${lost}×MR) + Stealth spent`
      : `(4×MR ${mr}) + Stealth`;

  return new Promise((resolve) => {
    try {
      new Dialog({
        title: `Perception — ${obsName}`,
        content: `<p>Locate <strong>${tgtName}</strong>?</p>
          <p>Perception TN: <strong>${tn}</strong> <span class="notes">${formulaNote}</span></p>
          <p class="notes">One attempt per target per Round. Success → located until end of this Round. Failure → cannot target this Turn (action not spent). Invisible targets may spend Stealth after the roll.</p>`,
        buttons: {
          roll: {
            label: 'Roll Perception',
            callback: async () => {
              try {
                const { masteryRoll } = await import('../dice/roll-handler.js');
                const { buildSkillRollContext } = await import('../dice/roll-context-build.js');
                const obsMr = targetMasteryRank(observer);
                const presets = buildDifficultyPresets(obsMr);
                const raises = Math.max(0, Math.ceil((tn - presets.standard) / 4));
                const ctx = buildSkillRollContext(observer, 'perception', 'wits', {
                  baseTN: tn,
                  raises,
                });
                if (!ctx) {
                  resolve({ success: false, total: 0, tn, cancelled: true });
                  return;
                }
                const result = await masteryRoll({
                  ...ctx.rollOptions,
                  label: ctx.label,
                  flavor: ctx.rollOptions.flavor,
                  actorId: String(observer?.id ?? ''),
                  skillKey: 'perception',
                  isSkillRoll: true,
                  rollKind: 'skill',
                  checkContext: { skillKey: 'perception', tags: ['sight'] },
                  autoFailIntent: 'skill',
                  skipChat: false,
                });
                const total = Math.max(
                  0,
                  Math.floor(Number((result as any)?.total ?? (result as any)?.rollTotal) || 0),
                );
                // Observer finished normal Skill Point spending inside masteryRoll chat flow;
                // then invisible target may respond.
                let effectiveTn = tn;
                if (inv > 0 && total > 0) {
                  await promptRetroactiveStealthSpend(target, total, effectiveTn);
                  effectiveTn = computePerceptionTn(target, observer);
                }
                // Equal to TN succeeds.
                const success = total >= effectiveTn;
                resolve({ success, total, tn: effectiveTn });
              } catch (e) {
                console.warn('Mastery System | perception roll failed', e);
                resolve({ success: false, total: 0, tn, cancelled: true });
              }
            },
          },
          manualSuccess: {
            label: 'GM: Success',
            callback: () => resolve({ success: true, total: tn, tn }),
          },
          manualFail: {
            label: 'GM: Failure',
            callback: () => resolve({ success: false, total: 0, tn }),
          },
          cancel: {
            label: 'Cancel',
            callback: () => resolve({ success: false, total: 0, tn, cancelled: true }),
          },
        },
        default: 'roll',
        close: () => resolve({ success: false, total: 0, tn, cancelled: true }),
      }).render(true);
    } catch {
      resolve({ success: false, total: 0, tn, cancelled: true });
    }
  });
}

/** For conditional passives: target perceived through non-sight sense? */
export function targetPerceivedByNonSightSense(observer: any, target: any): boolean {
  const gate = evaluatePerceptionGate(observer, target);
  if (!gate.canTarget || !gate.senseUsed) return false;
  return isNonSightCombatSense(gate.senseUsed);
}

/** For ambusher passive: target unseen by observer? */
export function targetUnseenByObserver(observer: any, target: any): boolean {
  const gate = evaluatePerceptionGate(observer, target);
  return !gate.canTarget && gate.needsPerceptionCheck;
}

/**
 * @deprecated Half-Evade vs invisible attackers removed — always full Evade.
 * Kept as a stub so older call sites compile until cleaned.
 */
export function shouldUseHalfEvadeVsAttacker(
  _defender: any,
  _attacker: any,
  _round: number,
): boolean {
  return false;
}

/**
 * Attacking while invisible: reveal position for the rest of the Round.
 * Evade is never halved.
 */
export async function resolveEvadeVsInvisibleAttacker(
  _defender: any,
  attacker: any,
  _opts?: { defenderToken?: any; attackerToken?: any },
): Promise<{ evadeMultiplier: 1 }> {
  const inv = effectiveInvisibilityBonusForActor(attacker);
  if (inv > 0 || getPerceptionCombatState(attacker).hidden) {
    await markRevealedThisRound(attacker);
  }
  return { evadeMultiplier: 1 };
}

/** Mark an invisible attacker as revealed for the current Round (public helper). */
export async function revealInvisibleAttacker(attacker: any): Promise<void> {
  const inv = effectiveInvisibilityBonusForActor(attacker);
  if (inv <= 0 && !getPerceptionCombatState(attacker).hidden) return;
  await markRevealedThisRound(attacker);
  const g = globalThis as any;
  g.ui?.notifications?.info?.(
    `${attacker?.name ?? 'Creature'} revealed — Invisibility no longer hides them this Round.`,
  );
}
