/**
 * Artifact Safe Haven Rest / Combat use ledgers.
 *
 * Moonlight Judgment Limited uses now share the global Limited charge
 * (`limited-charge.ts`). Moonlight Shadow (ceil(MR/2)), Dragon Head Breath
 * (ceil(MR/2) + once per Combat), and similar Artifact Functions still use
 * these ledgers.
 */
import { isLimitedChargeAvailable, spendLimitedCharge, } from './limited-charge.js';
export const ARTIFACT_REST_USES_FLAG = 'artifactRestUses';
export const ARTIFACT_COMBAT_USES_FLAG = 'artifactCombatUses';
function readMap(actor, flag) {
    if (!actor)
        return {};
    try {
        const raw = actor.getFlag?.('mastery-system', flag);
        if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
            const out = {};
            for (const [k, v] of Object.entries(raw)) {
                out[k] = Math.max(0, Math.floor(Number(v) || 0));
            }
            return out;
        }
    }
    catch {
        /* ignore */
    }
    const nested = actor.flags?.['mastery-system']?.[flag];
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
        const out = {};
        for (const [k, v] of Object.entries(nested)) {
            out[k] = Math.max(0, Math.floor(Number(v) || 0));
        }
        return out;
    }
    return {};
}
async function writeMap(actor, flag, map) {
    if (!actor)
        return;
    if (typeof actor.setFlag === 'function') {
        await actor.setFlag('mastery-system', flag, map);
        return;
    }
    actor.flags = actor.flags || {};
    actor.flags['mastery-system'] = actor.flags['mastery-system'] || {};
    actor.flags['mastery-system'][flag] = map;
}
export function masteryRankOf(actor) {
    return Math.max(1, Math.floor(Number(actor?.system?.mastery?.rank) || 1));
}
/**
 * @deprecated Batch 5 C07 — Limited is one global charge per Safe Haven Rest
 * (see `limited-charge.ts`). Kept for callers; always returns 1.
 */
export function limitedUsesForPowerLevel(_pl) {
    return 1;
}
/** Moonlight Shadow / Breath Weapon rest uses = ceil(MR / 2). */
export function halfMasteryRankUses(masteryRank) {
    return Math.ceil(masteryRankOf({ system: { mastery: { rank: masteryRank } } }) / 2);
}
/**
 * @deprecated Batch 5 C07 — Moonlight Judgment shares the global Limited charge.
 * Always 1 use (ignores artifact stage). Prefer `limitedChargeRemaining`.
 */
export function moonlightJudgmentMaxUses(_artifactLevel) {
    return 1;
}
export function moonlightShadowMaxUses(masteryRank) {
    return Math.ceil(Math.max(1, Math.floor(Number(masteryRank) || 1)) / 2);
}
export function dragonBreathRestMaxUses(masteryRank) {
    return moonlightShadowMaxUses(masteryRank);
}
export function getArtifactRestUsesSpent(actor, bucket) {
    return readMap(actor, ARTIFACT_REST_USES_FLAG)[bucket] || 0;
}
export function getArtifactCombatUsesSpent(actor, bucket) {
    return readMap(actor, ARTIFACT_COMBAT_USES_FLAG)[bucket] || 0;
}
export function remainingArtifactRestUses(actor, bucket, maxUses) {
    return Math.max(0, Math.floor(Number(maxUses) || 0) - getArtifactRestUsesSpent(actor, bucket));
}
export function canSpendArtifactRestUse(actor, bucket, maxUses) {
    return remainingArtifactRestUses(actor, bucket, maxUses) > 0;
}
export function canSpendArtifactCombatUse(actor, bucket) {
    return getArtifactCombatUsesSpent(actor, bucket) < 1;
}
export async function spendArtifactRestUse(actor, bucket, maxUses) {
    const spent = getArtifactRestUsesSpent(actor, bucket);
    if (spent >= maxUses)
        return { ok: false, reason: 'exhausted' };
    const map = readMap(actor, ARTIFACT_REST_USES_FLAG);
    map[bucket] = spent + 1;
    await writeMap(actor, ARTIFACT_REST_USES_FLAG, map);
    return { ok: true, spent: spent + 1, remaining: Math.max(0, maxUses - spent - 1) };
}
export async function spendArtifactCombatUse(actor, bucket) {
    if (!canSpendArtifactCombatUse(actor, bucket))
        return { ok: false, reason: 'exhausted' };
    const map = readMap(actor, ARTIFACT_COMBAT_USES_FLAG);
    map[bucket] = 1;
    await writeMap(actor, ARTIFACT_COMBAT_USES_FLAG, map);
    return { ok: true };
}
export async function clearArtifactRestUses(actor) {
    if (!actor)
        return;
    try {
        if (typeof actor.unsetFlag === 'function') {
            if (actor.getFlag?.('mastery-system', ARTIFACT_REST_USES_FLAG) != null) {
                await actor.unsetFlag('mastery-system', ARTIFACT_REST_USES_FLAG);
            }
            return;
        }
    }
    catch {
        /* fall through */
    }
    if (actor.flags?.['mastery-system']) {
        delete actor.flags['mastery-system'][ARTIFACT_REST_USES_FLAG];
    }
}
export async function clearArtifactCombatUses(actor) {
    if (!actor)
        return;
    try {
        if (typeof actor.unsetFlag === 'function') {
            if (actor.getFlag?.('mastery-system', ARTIFACT_COMBAT_USES_FLAG) != null) {
                await actor.unsetFlag('mastery-system', ARTIFACT_COMBAT_USES_FLAG);
            }
            return;
        }
    }
    catch {
        /* fall through */
    }
    if (actor.flags?.['mastery-system']) {
        delete actor.flags['mastery-system'][ARTIFACT_COMBAT_USES_FLAG];
    }
}
/** Clear combat-once ledgers for every combatant on combat end/delete. */
export async function clearArtifactCombatUsesForCombat(combat) {
    const combatants = combat?.combatants;
    if (!combatants)
        return;
    const list = typeof combatants.values === 'function' ? Array.from(combatants.values()) : combatants;
    for (const c of list) {
        const actor = c?.actor;
        if (actor)
            await clearArtifactCombatUses(actor);
    }
}
/**
 * Moonlight Judgment gate — delegates to the global Limited charge (C07).
 */
export function assertMoonlightJudgmentAvailable(actor, _artifactLevel) {
    return isLimitedChargeAvailable(actor);
}
export async function spendMoonlightJudgmentUse(actor, _artifactLevel) {
    const r = await spendLimitedCharge(actor);
    return r.ok;
}
export function assertMoonlightShadowAvailable(actor) {
    return canSpendArtifactRestUse(actor, 'moonlightShadow', moonlightShadowMaxUses(masteryRankOf(actor)));
}
export async function spendMoonlightShadowUse(actor) {
    const r = await spendArtifactRestUse(actor, 'moonlightShadow', moonlightShadowMaxUses(masteryRankOf(actor)));
    return r.ok;
}
/**
 * Dragon Breath: shared Damage/Ruin counter.
 * Must have remaining Safe Haven uses AND not already used this Combat.
 * Artifact Awakening must not bypass the combat-once gate.
 */
export function assertDragonBreathAvailable(actor) {
    const restMax = dragonBreathRestMaxUses(masteryRankOf(actor));
    if (!canSpendArtifactRestUse(actor, 'dragonBreath', restMax)) {
        return { ok: false, reason: 'rest' };
    }
    if (!canSpendArtifactCombatUse(actor, 'dragonBreath')) {
        return { ok: false, reason: 'combat' };
    }
    return { ok: true };
}
export async function spendDragonBreathUse(actor) {
    const gate = assertDragonBreathAvailable(actor);
    if (!gate.ok)
        return false;
    const rest = await spendArtifactRestUse(actor, 'dragonBreath', dragonBreathRestMaxUses(masteryRankOf(actor)));
    if (!rest.ok)
        return false;
    const combat = await spendArtifactCombatUse(actor, 'dragonBreath');
    return combat.ok;
}
//# sourceMappingURL=artifact-rest-uses.js.map