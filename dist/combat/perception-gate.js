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
import { COMBAT_SENSES } from './combat-senses.js';
import { getActiveCombatSense, isNonSightCombatSense, listActorCombatSenses, } from './combat-sense-collection.js';
import { getPerceptionCombatState, hasLocatedTarget, lostHealthBarsForInvis, markLocatedTarget, setPerceptionCombatState, } from './perception-state.js';
import { effectiveInvisibilityBonusForActor, isSenseBlockedForActor, } from './invisibility-profile.js';
import { buildDifficultyPresets } from '../dice/roll-context-build.js';
import { tokenIsExcludedAsTarget } from './defeated-token.js';
import { getRulesMasteryRank } from '../utils/mastery-rank-sync.js';
function targetMasteryRank(actor) {
    return getRulesMasteryRank(actor);
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
/**
 * Perception TN vs an invisible creature, or the Stealth Final Result when only Hidden.
 * A Stealth check is not added on top of an Invisibility TN.
 */
export function computePerceptionTn(target, _observer) {
    const mr = Math.max(1, targetMasteryRank(target));
    const inv = effectiveInvisibilityBonusForActor(target);
    const st = getPerceptionCombatState(target);
    const stealthSpent = Math.max(0, Math.floor(Number(st.stealthSpentThisRound) || 0));
    if (inv > 0) {
        const lostBars = lostHealthBarsForInvis(target);
        return Math.max(0, 4 * mr + inv - lostBars * mr + stealthSpent);
    }
    const stealthTn = Math.max(0, Math.floor(Number(st.stealthPerceptionTn) || 0));
    if (st.hidden && stealthTn > 0)
        return stealthTn;
    return Math.max(0, 4 * mr);
}
/**
 * Whether `observer` can directly perceive `target` for targeting without a new Perception check.
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
    const inv = effectiveInvisibilityBonusForActor(target);
    const senses = listActorCombatSenses(observer);
    for (const senseId of senses) {
        if (isSenseBlockedForActor(target, senseId))
            continue;
        if (opts?.observerToken &&
            opts?.targetToken &&
            !senseInRange(opts.observerToken, opts.targetToken, senseId)) {
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
            reason: hidden && inv > 0
                ? 'Hidden and invisible to Covered senses.'
                : hidden
                    ? 'Hidden.'
                    : 'Invisible — Covered senses only.',
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
        if (tokenIsExcludedAsTarget(tok))
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
 * On failure the action is not spent.
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
    const baseTn = computePerceptionTn(target, observer);
    const outcome = await promptPerceptionCheck(observer, target, baseTn);
    const round = Math.max(1, Math.floor(Number(globalThis.game?.combat?.round) || 1));
    // Cancel / close without rolling must not burn the once-per-round attempt.
    if (outcome.cancelled)
        return false;
    const used = { ...(st.perceptionUsedVs ?? {}), [tgtId]: true };
    await setPerceptionCombatState(observer, { perceptionUsedVs: used });
    if (outcome.success) {
        await markLocatedTarget(observer, target, round);
        return true;
    }
    const finalTn = computePerceptionTn(target, observer);
    globalThis.ui?.notifications?.info?.(`Perception failed (TN ${finalTn}). Choose another target or action — your action is not spent.`);
    return false;
}
/**
 * @deprecated DF 2026-10-23: Retroactive Stealth Points are retired.
 * Stealth is a setup-first opposition (the Stealth Final Result is the TN); no post-roll spend.
 * Always returns 0 and changes nothing.
 */
export async function promptRetroactiveStealthSpend(_invisibleActor, _observerResult, _currentTn) {
    return 0;
}
async function promptPerceptionCheck(observer, target, tn) {
    const Dialog = globalThis.Dialog;
    if (!Dialog)
        return { success: false, total: 0, tn, cancelled: true };
    const obsName = String(observer?.name ?? 'Observer');
    const tgtName = String(target?.name ?? 'Target');
    const inv = effectiveInvisibilityBonusForActor(target);
    const mr = targetMasteryRank(target);
    const lost = lostHealthBarsForInvis(target);
    const formulaNote = inv > 0
        ? `(4×MR ${mr}) + Invis ${inv} − (${lost}×MR) `
        : `(4×MR ${mr}) + Stealth`;
    return new Promise((resolve) => {
        try {
            new Dialog({
                title: `Perception — ${obsName}`,
                content: `<p>Locate <strong>${tgtName}</strong>?</p>
          <p>Perception TN: <strong>${tn}</strong> <span class="notes">${formulaNote}</span></p>
          <p class="notes">One attempt per target per Round. Success → located until end of this Round. Failure → cannot target this Turn (action not spent). Stealth is setup-first (no retroactive Stealth Points).</p>`,
                buttons: {
                    roll: {
                        label: 'Roll Perception',
                        callback: async () => {
                            try {
                                const { masteryRoll } = await import('../dice/roll-handler.js');
                                const { buildSkillRollContext, buildSkillRollPoolPreview, readSkillRating, } = await import('../dice/roll-context-build.js');
                                const { resolveNpcPerceptionSituational, suggestNpcPool, } = await import('../rules/npc-situational-skills.js');
                                const obsMr = targetMasteryRank(observer);
                                const presets = buildDifficultyPresets(obsMr);
                                const raises = Math.max(0, Math.ceil((tn - presets.standard) / 4));
                                const obsType = String(observer?.type || '');
                                const isNpcLike = obsType === 'npc' || obsType === 'summon';
                                let result;
                                if (isNpcLike) {
                                    const sit = resolveNpcPerceptionSituational(observer?.system);
                                    const legacyRating = readSkillRating(observer?.system, 'perception');
                                    if (sit) {
                                        const numDice = Math.max(0, Math.floor(Number(sit.poolDice) || 0));
                                        const keepDice = numDice <= 0 ? 0 : Math.min(obsMr, numDice);
                                        const poolNote = `NPC situational Perception (Rank ${sit.skillRank}) · Pool ${numDice}k${keepDice}`;
                                        result = await masteryRoll({
                                            numDice,
                                            keepDice,
                                            skill: 0,
                                            tn,
                                            normalTn: tn,
                                            raiseTn: tn,
                                            declaredRaiseSlots: raises,
                                            label: 'Perception Check',
                                            flavor: `${poolNote}. Locate check vs TN ${tn}.`,
                                            actorId: String(observer?.id ?? ''),
                                            skillKey: 'perception',
                                            isSkillRoll: true,
                                            rollKind: 'skill',
                                            applyPoolPenalties: false,
                                            checkContext: { skillKey: 'perception', tags: ['sight'] },
                                            autoFailIntent: 'skill',
                                            skipChat: false,
                                        });
                                    }
                                    else if (legacyRating > 0) {
                                        const preview = buildSkillRollPoolPreview(observer, 'perception', 'wits');
                                        const ctx = buildSkillRollContext(observer, 'perception', 'wits', {
                                            baseTN: tn,
                                            raises,
                                        });
                                        if (!ctx) {
                                            resolve({ success: false, total: 0, tn, cancelled: true });
                                            return;
                                        }
                                        const poolNote = `Legacy Perception ${legacyRating} · Wits pool ${preview.rollLabel}${preview.fullPoolReady ? ' (full)' : ' (half)'}`;
                                        result = await masteryRoll({
                                            ...ctx.rollOptions,
                                            label: ctx.label,
                                            flavor: `${poolNote}. ${ctx.rollOptions.flavor ?? ''}`.trim(),
                                            actorId: String(observer?.id ?? ''),
                                            skillKey: 'perception',
                                            isSkillRoll: true,
                                            rollKind: 'skill',
                                            checkContext: { skillKey: 'perception', tags: ['sight'] },
                                            autoFailIntent: 'skill',
                                            skipChat: false,
                                        });
                                    }
                                    else {
                                        const numDice = suggestNpcPool(obsMr, 'capable');
                                        const keepDice = Math.min(obsMr, numDice);
                                        const poolNote = `NPC Capable default · Pool ${numDice}k${keepDice}`;
                                        result = await masteryRoll({
                                            numDice,
                                            keepDice,
                                            skill: 0,
                                            tn,
                                            normalTn: tn,
                                            raiseTn: tn,
                                            declaredRaiseSlots: raises,
                                            label: 'Perception Check',
                                            flavor: `${poolNote}. Locate check vs TN ${tn}.`,
                                            actorId: String(observer?.id ?? ''),
                                            skillKey: 'perception',
                                            isSkillRoll: true,
                                            rollKind: 'skill',
                                            applyPoolPenalties: false,
                                            checkContext: { skillKey: 'perception', tags: ['sight'] },
                                            autoFailIntent: 'skill',
                                            skipChat: false,
                                        });
                                    }
                                }
                                else {
                                    const skillRating = readSkillRating(observer?.system, 'perception');
                                    const preview = buildSkillRollPoolPreview(observer, 'perception', 'wits');
                                    const ctx = buildSkillRollContext(observer, 'perception', 'wits', {
                                        baseTN: tn,
                                        raises,
                                    });
                                    if (!ctx) {
                                        resolve({ success: false, total: 0, tn, cancelled: true });
                                        return;
                                    }
                                    const poolNote = `Perception ${skillRating} · Wits pool ${preview.rollLabel}${preview.fullPoolReady ? ' (full)' : ' (half)'}`;
                                    result = await masteryRoll({
                                        ...ctx.rollOptions,
                                        label: ctx.label,
                                        flavor: `${poolNote}. ${ctx.rollOptions.flavor ?? ''}`.trim(),
                                        actorId: String(observer?.id ?? ''),
                                        skillKey: 'perception',
                                        isSkillRoll: true,
                                        rollKind: 'skill',
                                        checkContext: { skillKey: 'perception', tags: ['sight'] },
                                        autoFailIntent: 'skill',
                                        skipChat: false,
                                    });
                                }
                                const total = Math.max(0, Math.floor(Number(result?.total ?? result?.rollTotal) || 0));
                                // DF 2026: no retroactive Stealth spend; TN is fixed before the observer rolls.
                                const effectiveTn = tn;
                                // Equal to TN succeeds.
                                const success = total >= effectiveTn;
                                resolve({ success, total, tn: effectiveTn });
                            }
                            catch (e) {
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
        }
        catch {
            resolve({ success: false, total: 0, tn, cancelled: true });
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
/**
 * @deprecated Half-Evade vs invisible attackers removed — always full Evade.
 * Kept as a stub so older call sites compile until cleaned.
 */
export function shouldUseHalfEvadeVsAttacker(_defender, _attacker, _round) {
    return false;
}
/**
 * Attacking does not interrupt Invisibility. Evade is never halved.
 * Ordinary Stealth hiding still ends on the attacker's side.
 */
export async function resolveEvadeVsInvisibleAttacker(_defender, attacker, _opts) {
    await endOrdinaryStealthOnAttack(attacker);
    return { evadeMultiplier: 1 };
}
/**
 * Attacking does not interrupt Invisibility — the creature stays Obscured to
 * covered Combat Senses; observers use normal Perception to locate/target.
 * Ordinary Stealth hiding (no Invisibility) ends when attacking.
 */
export async function endOrdinaryStealthOnAttack(attacker) {
    if (!attacker)
        return;
    const st = getPerceptionCombatState(attacker);
    if (!st.hidden && !(st.stealthRaiseBonus ?? 0) && !(st.stealthPerceptionTn ?? 0))
        return;
    await setPerceptionCombatState(attacker, {
        hidden: false,
        stealthRaiseBonus: 0,
        stealthPerceptionTn: 0,
    });
}
/** @deprecated Use {@link endOrdinaryStealthOnAttack} — Invisibility is no longer revealed by attacking. */
export async function revealInvisibleAttacker(attacker) {
    await endOrdinaryStealthOnAttack(attacker);
}
//# sourceMappingURL=perception-gate.js.map