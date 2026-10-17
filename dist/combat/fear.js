/**
 * Fear — accumulated dread that removes dice from attribute pools.
 * Only GM-driven or explicit rule calls should invoke Fear Checks.
 *
 * Pending graded Fear Check (canvas decision, 2026-10-17):
 * Resolve k1 — no TN picker. Bands: <8 → +2 Fear, <16 → +1 Fear, ≥16 → +0.
 * Official players-guide still describes TN 8/12 binary until rulebooks are updated.
 */
/** Soft band: below this total → +2 Fear. */
export const FEAR_CHECK_BAND_HARD = 8;
/** Clear band: at/above this total → +0 Fear; between hard and clear → +1. */
export const FEAR_CHECK_BAND_CLEAR = 16;
/** @deprecated Use FEAR_CHECK_BAND_HARD — kept for older imports. */
export const FEAR_CHECK_TN_NORMAL = FEAR_CHECK_BAND_HARD;
/** @deprecated Graded Fear Check no longer uses a separate extreme TN. */
export const FEAR_CHECK_TN_EXTREME = FEAR_CHECK_BAND_CLEAR;
export function getFear(actor) {
    return Math.max(0, Math.floor(Number(actor?.system?.fear) || 0));
}
export async function setFear(actor, value) {
    if (!actor?.update)
        return;
    const v = Math.max(0, Math.floor(Number(value) || 0));
    await actor.update({ 'system.fear': v });
}
/** Apply a signed delta; returns the new Fear total. */
export async function applyFearDelta(actor, delta) {
    const next = Math.max(0, getFear(actor) + Math.floor(Number(delta) || 0));
    await setFear(actor, next);
    return next;
}
/**
 * Fear gained from a Resolve k1 Fear Check total.
 * < 8 → 2, < 16 → 1, ≥ 16 → 0.
 */
export function fearGainedFromCheckTotal(total) {
    const t = Math.floor(Number(total) || 0);
    if (t < FEAR_CHECK_BAND_HARD)
        return 2;
    if (t < FEAR_CHECK_BAND_CLEAR)
        return 1;
    return 0;
}
export function formatFearCheckBandNote(total, fearGained) {
    if (fearGained >= 2)
        return `Total ${total} < ${FEAR_CHECK_BAND_HARD} → +2 Fear`;
    if (fearGained === 1) {
        return `Total ${total} < ${FEAR_CHECK_BAND_CLEAR} → +1 Fear`;
    }
    return `Total ${total} ≥ ${FEAR_CHECK_BAND_CLEAR} → no Fear`;
}
/**
 * Resolve k1 Fear Check. No Skill Points, no Raises, no TN picker.
 * Graded outcome vs bands 8 / 16.
 */
export async function runFearCheck(actor, _ignoredTn) {
    if (!actor)
        return { rolled: false, tn: FEAR_CHECK_BAND_CLEAR };
    const fearBefore = getFear(actor);
    const resolveRaw = Math.max(0, Math.floor(Number(actor?.system?.attributes?.resolve?.value) || 0));
    const { finalizeRolledPool } = await import('../dice/pool-finalize.js');
    const finalized = finalizeRolledPool(actor, resolveRaw, 1, {
        rollKind: 'generic',
        poolAttribute: 'resolve',
        applyPoolPenalties: true,
    });
    const poolDice = finalized.numDice;
    const { masteryRoll } = await import('../dice/roll-handler.js');
    const label = `Fear Check (Resolve k1 — bands ${FEAR_CHECK_BAND_HARD} / ${FEAR_CHECK_BAND_CLEAR})`;
    const flavorParts = [
        `No Skill Points / Raises · <${FEAR_CHECK_BAND_HARD} → +2 Fear · <${FEAR_CHECK_BAND_CLEAR} → +1 Fear · ≥${FEAR_CHECK_BAND_CLEAR} → none`,
        ...finalized.notes,
    ];
    if (poolDice <= 0) {
        const fearGained = fearGainedFromCheckTotal(0);
        const fearAfter = await applyFearDelta(actor, fearGained);
        try {
            await globalThis.ChatMessage?.create?.({
                speaker: globalThis.ChatMessage?.getSpeaker?.({ actor }),
                content: `<div class="mastery-fear-check"><strong>${actor.name}</strong> — ${label}: ` +
                    `<strong>Pool 0</strong> → ${formatFearCheckBandNote(0, fearGained)}. ` +
                    `Fear ${fearBefore} → <strong>${fearAfter}</strong>.</div>`,
            });
        }
        catch {
            /* chat optional in tests */
        }
        return {
            rolled: true,
            total: 0,
            tn: FEAR_CHECK_BAND_CLEAR,
            success: false,
            fearGained,
            fearBefore,
            fearAfter,
            poolDice: 0,
        };
    }
    const result = await masteryRoll({
        numDice: poolDice,
        keepDice: 1,
        skill: 0,
        tn: FEAR_CHECK_BAND_CLEAR,
        normalTn: FEAR_CHECK_BAND_CLEAR,
        label,
        flavor: flavorParts.join(' · '),
        actorId: String(actor.id ?? ''),
        actorRef: actor,
        rollKind: 'generic',
        poolAttribute: 'resolve',
        applyPoolPenalties: false,
        applyFear: false,
        guaranteedEights: 0,
        raiseModel: 'margin',
        isSkillRoll: false,
        skipChat: true,
    });
    const total = Math.floor(Number(result?.total) || 0);
    const fearGained = fearGainedFromCheckTotal(total);
    let fearAfter = fearBefore;
    if (fearGained > 0) {
        fearAfter = await applyFearDelta(actor, fearGained);
    }
    try {
        await globalThis.ChatMessage?.create?.({
            speaker: globalThis.ChatMessage?.getSpeaker?.({ actor }),
            content: `<div class="mastery-fear-check"><strong>${actor.name}</strong> — ${label}: ` +
                `${formatFearCheckBandNote(total, fearGained)}. Fear ${fearBefore} → <strong>${fearAfter}</strong>.</div>`,
        });
    }
    catch {
        /* optional */
    }
    return {
        rolled: true,
        total,
        tn: FEAR_CHECK_BAND_CLEAR,
        success: fearGained === 0,
        fearGained,
        fearBefore,
        fearAfter,
        poolDice,
    };
}
/** GM helper: run a graded Fear Check for one actor (no TN picker). */
export async function promptGmFearCheck(actor) {
    if (!actor)
        return null;
    return runFearCheck(actor);
}
//# sourceMappingURL=fear.js.map