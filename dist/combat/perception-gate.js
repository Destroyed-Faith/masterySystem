/**
 * Perception gating — can an observer perceive / target a creature through Combat Senses?
 */
import { COMBAT_SENSES, skillCheckTnByMasteryRank } from './combat-senses.js';
import { getActiveCombatSense, isNonSightCombatSense, listActorCombatSenses, } from './combat-sense-collection.js';
import { effectiveInvisibilityBonus, getPerceptionCombatState, hasLocatedTarget, isSenseBlockedOnTarget, markLocatedTarget, } from './perception-state.js';
import { buildDifficultyPresets } from '../dice/roll-context-build.js';
function targetMasteryRank(actor) {
    return Math.max(1, Math.floor(Number(actor?.system?.mastery?.rank) || 1));
}
function distanceMeters(a, b) {
    try {
        const grid = globalThis.canvas?.grid;
        if (grid?.measurePath) {
            const path = grid.measurePath([{ x: a.x, y: a.y }, { x: b.x, y: b.y }]);
            const d = Number(path?.distance ?? path?.spaces ?? 0);
            if (d > 0)
                return d;
        }
    }
    catch {
        /* fall through */
    }
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const gridSize = Number(globalThis.canvas?.grid?.size) || 100;
    const pixels = Math.hypot(dx, dy);
    return (pixels / gridSize) * (Number(globalThis.canvas?.grid?.distance) || 1);
}
function senseInRange(observerToken, targetToken, senseId) {
    const def = COMBAT_SENSES[senseId];
    if (!def?.rangeM)
        return true;
    const oc = observerToken?.center ?? observerToken?.document?.center;
    const tc = targetToken?.center ?? targetToken?.document?.center;
    if (!oc || !tc)
        return true;
    return distanceMeters(oc, tc) <= def.rangeM;
}
/** Perception TN to locate/read a hidden or invisible target. */
export function computePerceptionTn(target, observer) {
    const tgtMr = targetMasteryRank(target);
    const base = skillCheckTnByMasteryRank(tgtMr);
    const st = getPerceptionCombatState(target);
    const inv = effectiveInvisibilityBonus(st);
    const stealth = Math.max(0, Math.floor(Number(st.stealthRaiseBonus) || 0));
    return base + inv + stealth;
}
/**
 * Whether `observer` can directly perceive `target` for targeting without a new Perception check.
 * Does not prompt — use `ensureCanTarget` for interactive flow.
 */
export function evaluatePerceptionGate(observer, target, opts) {
    if (!observer || !target) {
        return { canTarget: false, needsPerceptionCheck: false, reason: 'Missing actor.' };
    }
    if (String(observer.id) === String(target.id)) {
        return { canTarget: true, needsPerceptionCheck: false, reason: 'Self.' };
    }
    const round = Math.max(1, Math.floor(Number(opts?.combatRound) || globalThis.game?.combat?.round || 1));
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
    const inv = effectiveInvisibilityBonus(tgtState);
    const senses = listActorCombatSenses(observer);
    for (const senseId of senses) {
        if (isSenseBlockedOnTarget(target, senseId))
            continue;
        if (opts?.observerToken && opts?.targetToken && !senseInRange(opts.observerToken, opts.targetToken, senseId)) {
            continue;
        }
        // Unblocked sense + not hidden/invisible through that channel → normal perception.
        if (!hidden && inv <= 0) {
            return { canTarget: true, needsPerceptionCheck: false, reason: 'Ordinary awareness.', senseUsed: senseId };
        }
        // Special sense may perceive invisible-to-normal targets (Life Sense, etc.) when not blocked.
        if (inv > 0 && senseId !== 'normalCombatAwareness' && senseId !== 'darkvision') {
            return {
                canTarget: true,
                needsPerceptionCheck: false,
                reason: `Perceived via ${COMBAT_SENSES[senseId].label}.`,
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
            reason: hidden && inv > 0 ? 'Hidden and invisible to available senses.' : hidden ? 'Hidden.' : 'Invisible to available senses.',
        };
    }
    return { canTarget: true, needsPerceptionCheck: false, reason: 'No concealment.' };
}
/** Filter token ids to those the attacker can attempt to target (may still need Perception). */
export function filterPerceivableTargetIds(attackerActor, candidateTokenIds, attackerToken) {
    const out = new Set();
    const tokens = globalThis.canvas?.tokens?.placeables ?? [];
    const byId = new Map();
    for (const t of tokens) {
        if (t?.id)
            byId.set(t.id, t);
    }
    for (const tid of candidateTokenIds) {
        const tok = byId.get(tid);
        const targetActor = tok?.actor;
        if (!targetActor)
            continue;
        const gate = evaluatePerceptionGate(attackerActor, targetActor, {
            observerToken: attackerToken,
            targetToken: tok,
            forTargeting: true,
        });
        if (gate.canTarget || gate.needsPerceptionCheck)
            out.add(tid);
    }
    return out;
}
/**
 * Interactive gate before attack targeting. Returns true if targeting may proceed.
 * On failure without spending action, returns false (per rules).
 */
export async function ensureCanTargetWithPerception(observer, target, opts) {
    const gate = evaluatePerceptionGate(observer, target, { ...opts, forTargeting: true });
    if (gate.canTarget)
        return true;
    if (!gate.needsPerceptionCheck)
        return false;
    const st = getPerceptionCombatState(observer);
    const tgtId = String(target?.id ?? '');
    if (st.perceptionUsedVs?.[tgtId]) {
        globalThis.ui?.notifications?.warn?.(`Already attempted Perception vs ${target.name ?? 'target'} this round.`);
        return false;
    }
    const tn = computePerceptionTn(target, observer);
    const confirmed = await promptPerceptionCheck(observer, target, tn);
    const round = Math.max(1, Math.floor(Number(globalThis.game?.combat?.round) || 1));
    const used = { ...(st.perceptionUsedVs ?? {}), [tgtId]: true };
    const { setPerceptionCombatState } = await import('./perception-state.js');
    await setPerceptionCombatState(observer, { perceptionUsedVs: used });
    if (confirmed) {
        await markLocatedTarget(observer, target, round);
        return true;
    }
    globalThis.ui?.notifications?.info?.(`Perception failed (TN ${tn}). Choose another target or action — your action is not spent.`);
    return false;
}
async function promptPerceptionCheck(observer, target, tn) {
    const Dialog = globalThis.Dialog;
    if (!Dialog)
        return false;
    const obsName = String(observer?.name ?? 'Observer');
    const tgtName = String(target?.name ?? 'Target');
    return new Promise((resolve) => {
        try {
            new Dialog({
                title: `Perception — ${obsName}`,
                content: `<p>Locate or read <strong>${tgtName}</strong>?</p>
          <p>Perception TN: <strong>${tn}</strong></p>
          <p class="notes">On success, you may target until the end of your next turn. On failure, you cannot target this turn (action not spent).</p>`,
                buttons: {
                    roll: {
                        label: 'Roll Perception',
                        callback: async () => {
                            try {
                                const { masteryRoll } = await import('../dice/roll-handler.js');
                                const { buildSkillRollContext } = await import('../dice/roll-context-build.js');
                                const mr = Math.max(1, Math.floor(Number(observer?.system?.mastery?.rank) || 1));
                                const presets = buildDifficultyPresets(mr);
                                const raises = Math.max(0, Math.ceil((tn - presets.standard) / 4));
                                const ctx = buildSkillRollContext(observer, 'perception', 'wits', { baseTN: tn, raises });
                                if (!ctx) {
                                    resolve(false);
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
                                resolve(!!result?.success);
                            }
                            catch (e) {
                                console.warn('Mastery System | perception roll failed', e);
                                resolve(false);
                            }
                        },
                    },
                    manualSuccess: {
                        label: 'GM: Success',
                        callback: () => resolve(true),
                    },
                    manualFail: {
                        label: 'GM: Failure',
                        callback: () => resolve(false),
                    },
                    cancel: {
                        label: 'Cancel',
                        callback: () => resolve(false),
                    },
                },
                default: 'roll',
                close: () => resolve(false),
            }).render(true);
        }
        catch {
            resolve(false);
        }
    });
}
/** For conditional passives: target perceived through non-sight sense? */
export function targetPerceivedByNonSightSense(observer, target) {
    const gate = evaluatePerceptionGate(observer, target);
    if (!gate.canTarget || !gate.senseUsed)
        return false;
    return isNonSightCombatSense(gate.senseUsed);
}
/** For ambusher passive: target unseen by observer? */
export function targetUnseenByObserver(observer, target) {
    const gate = evaluatePerceptionGate(observer, target);
    return !gate.canTarget && gate.needsPerceptionCheck;
}
/** Half Evade when defender failed to perceive invisible attacker. */
export function shouldUseHalfEvadeVsAttacker(defender, attacker, round) {
    const st = getPerceptionCombatState(defender);
    const atkId = String(attacker?.id ?? '');
    const inv = effectiveInvisibilityBonus(getPerceptionCombatState(attacker));
    if (inv <= 0)
        return false;
    const entry = st.perceivedInvisibleAttacker?.[atkId];
    if (!entry || entry.round !== round)
        return false;
    return entry.success === false;
}
export async function recordInvisibleAttackerPerception(defender, attacker, success, round) {
    const { setPerceptionCombatState, getPerceptionCombatState: getSt } = await import('./perception-state.js');
    const st = getSt(defender);
    const atkId = String(attacker?.id ?? '');
    const map = { ...(st.perceivedInvisibleAttacker ?? {}), [atkId]: { success, round } };
    await setPerceptionCombatState(defender, { perceivedInvisibleAttacker: map });
}
/**
 * Attacking from Invisibility — defender Perception vs attacker; half Evade on failure.
 * Returns multiplier 1 (full Evade) or 0.5 (half Evade).
 */
export async function resolveEvadeVsInvisibleAttacker(defender, attacker, opts) {
    const atkInv = effectiveInvisibilityBonus(getPerceptionCombatState(attacker));
    if (atkInv <= 0)
        return { evadeMultiplier: 1 };
    const gate = evaluatePerceptionGate(defender, attacker, {
        observerToken: opts?.defenderToken,
        targetToken: opts?.attackerToken,
        forTargeting: true,
    });
    if (gate.canTarget)
        return { evadeMultiplier: 1 };
    const round = Math.max(1, Math.floor(Number(globalThis.game?.combat?.round) || 1));
    const st = getPerceptionCombatState(defender);
    const atkId = String(attacker?.id ?? '');
    const cached = st.perceivedInvisibleAttacker?.[atkId];
    if (cached && cached.round === round) {
        return { evadeMultiplier: cached.success ? 1 : 0.5 };
    }
    const tn = computePerceptionTn(attacker, defender);
    const success = await promptPerceptionCheck(defender, attacker, tn);
    await recordInvisibleAttackerPerception(defender, attacker, success, round);
    const used = { ...(st.perceptionUsedVs ?? {}), [atkId]: true };
    const { setPerceptionCombatState } = await import('./perception-state.js');
    await setPerceptionCombatState(defender, { perceptionUsedVs: used });
    return { evadeMultiplier: success ? 1 : 0.5 };
}
//# sourceMappingURL=perception-gate.js.map