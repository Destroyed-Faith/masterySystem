/**
 * R-05 §8 — Resolve Ability: Healing pending timing.
 *
 * Paying `resolve.healing` in Preparation does NOT roll. Confirm Stone
 * Assignment only *prepares* a pending heal for the Round:
 *
 *   actor flag `resolveHealingPending` = { combatId, round, rank, spent:false }
 *
 * The owner triggers it later in the same Round — during their turn, between
 * actions, or when incoming damage is about to take HP (see
 * `offerPendingResolveHealingBeforeDamage` in `stone-resolution-ui.ts`).
 * The roll, target choice and Maximization all happen at trigger time.
 *
 * A pending heal that is not used by the end of its Round expires. The Stones
 * stay spent.
 *
 * This file is pure (no Foundry globals) so the rules are unit-testable. The
 * Foundry presentation lives in `stone-resolution-ui.ts`.
 */
import { escapeStoneChat, healingRankProfile, resolveHealingSelection, } from './stone-resolution.js';
import { resolveStonePowerId } from './stone-powers.js';
export const RESOLVE_HEALING_PENDING_FLAG = 'resolveHealingPending';
/** Power id the pending heal belongs to. */
export const RESOLVE_HEALING_POWER_ID = 'resolve.healing';
function clampRank(rank) {
    return Math.max(1, Math.min(4, Math.floor(Number(rank) || 0)));
}
export function isResolveHealingPowerId(powerId) {
    return resolveStonePowerId(powerId) === RESOLVE_HEALING_POWER_ID;
}
/** Normalise whatever is stored on the flag. Returns null for junk. */
export function readResolveHealingPending(raw) {
    if (!raw || typeof raw !== 'object')
        return null;
    const row = raw;
    const combatId = String(row.combatId || '').trim();
    const rank = Math.floor(Number(row.rank) || 0);
    if (!combatId || rank < 1)
        return null;
    return {
        combatId,
        round: Math.max(1, Math.floor(Number(row.round) || 0)),
        rank: clampRank(rank),
        spent: row.spent === true,
    };
}
/**
 * Prepare (or upgrade) the pending heal for this Round. A second Healing payment in the same
 * Round before the first was used keeps the higher rank; once spent, a new payment re-arms.
 */
export function armResolveHealingPending(existing, combatId, round, rank) {
    const next = {
        combatId: String(combatId || ''),
        round: Math.max(1, Math.floor(Number(round) || 0)),
        rank: clampRank(rank),
        spent: false,
    };
    const prev = readResolveHealingPending(existing);
    if (prev &&
        !prev.spent &&
        prev.combatId === next.combatId &&
        prev.round === next.round) {
        next.rank = Math.max(prev.rank, next.rank);
    }
    return next;
}
/** Same Round clock as Stone Assignment: Preparation (round 0) counts as Round 1. */
export function pendingHealingRound(combat) {
    return Math.max(1, Math.floor(Number(combat?.round) || 0));
}
function sameRound(pending, combat) {
    if (!combat?.id)
        return false;
    return pending.combatId === String(combat.id) && pending.round === pendingHealingRound(combat);
}
/** Usable right now: same combat, same Round, not yet spent. */
export function isResolveHealingPendingLive(pending, combat) {
    if (!pending || pending.spent)
        return false;
    return sameRound(pending, combat);
}
/**
 * True once the flag no longer has any use and should be cleared:
 * spent, wrong combat, no combat, or the Round has moved on.
 */
export function isResolveHealingPendingExpired(pending, combat) {
    if (!pending)
        return false;
    if (pending.spent)
        return true;
    return !sameRound(pending, combat);
}
export function markResolveHealingSpent(pending) {
    return { ...pending, spent: true };
}
/** `4d8 within 2 m` style label for chat / prompts. */
export function describePendingHealing(rank) {
    const profile = healingRankProfile(clampRank(rank));
    return `${profile.dice}d8 within ${profile.rangeM} m`;
}
export function pendingHealingChatContent(args) {
    const source = escapeStoneChat(args.sourceName);
    const label = escapeStoneChat(describePendingHealing(args.rank));
    return (`<div class="mastery-stone-resolution mastery-resolve-healing-pending" data-actor-id="${escapeStoneChat(args.actorId)}" data-round="${Math.floor(Number(args.round) || 0)}">` +
        `<p><strong>${source}</strong> — Healing prepared (Rank ${clampRank(args.rank)}, ${label}).</p>` +
        `<p>Nothing is rolled yet. Use it this Round: during your turn, between actions, or when damage is about to reduce HP. ` +
        `It expires at the end of the Round; the Stones stay spent.</p>` +
        `<div class="mastery-heal-scarred-actions"><button type="button" class="mastery-resolve-healing-use">Use Healing now</button></div>` +
        `</div>`);
}
/**
 * Resolve a prepared heal. Cancelling the target choice keeps it pending.
 * A successful heal marks it spent so it can never run twice.
 */
export async function triggerResolveHealing(args) {
    const pending = args.pending ?? null;
    if (!pending)
        return { ok: false, restored: 0, targetId: null, reason: 'none' };
    if (pending.spent)
        return { ok: false, restored: 0, targetId: null, reason: 'spent' };
    if (!isResolveHealingPendingLive(pending, args.combat)) {
        return { ok: false, restored: 0, targetId: null, reason: 'expired' };
    }
    const forced = String(args.preselectedTargetId || '').trim();
    const result = await resolveHealingSelection({
        sourceName: args.sourceName,
        tier: pending.rank,
        candidates: args.candidates,
        choose: forced ? async () => forced : args.choose,
        roll: args.roll,
        healthOf: args.healthOf,
        writeHealth: args.writeHealth,
        chat: args.chat,
    });
    if (!result.ok)
        return { ok: false, restored: 0, targetId: null, reason: 'cancelled' };
    await args.persist(markResolveHealingSpent(pending));
    return { ok: true, restored: result.restored, targetId: result.targetId };
}
/** Candidate ids that could receive the prepared heal (self + allies in the rank's range). */
export function pendingHealingLegalTargetIds(pending, candidates) {
    const { rangeM } = healingRankProfile(pending.rank);
    return candidates
        .filter((c) => c.self || (c.distanceM != null && Number.isFinite(c.distanceM) && c.distanceM <= rangeM))
        .map((c) => c.id);
}
//# sourceMappingURL=resolve-healing-pending.js.map