/**
 * Shared Intellect Free Raises.
 * The Stone user decides how its unchanged pool is split: an allocation moves
 * Raises from the donor's `stoneBonuses.freeRaises` into the recipient's
 * `sharedFreeRaisesReceived` (see `teamwork-transactions.ts`). A recipient
 * spends only its own pool and what it was assigned — never a donor's pool —
 * so each Raise is spent once and nobody confirms individual attacks.
 */
import { freeRaisePool, getActionEconomyActor, getRoundState, setRoundState, } from './action-economy.js';
function liveGrants(rs) {
    const rows = Array.isArray(rs?.sharedFreeRaisesReceived) ? rs.sharedFreeRaisesReceived : [];
    return rows.filter((g) => Math.floor(Number(g?.remaining) || 0) > 0);
}
/** Raises assigned to this actor by allies for the current Round. */
export function receivedSharedFreeRaises(recipient, combat) {
    if (!recipient)
        return 0;
    try {
        return liveGrants(getRoundState(recipient, combat)).reduce((n, g) => n + Math.floor(Number(g.remaining) || 0), 0);
    }
    catch {
        return 0;
    }
}
/** Own pool first, then each ally assignment. */
export function listFreeRaiseSources(recipient, combat) {
    if (!recipient)
        return [];
    const out = [];
    const own = freeRaisePool(recipient);
    if (own > 0) {
        out.push({ actorId: String(recipient.id), name: String(recipient.name || 'Self'), remaining: own, self: true });
    }
    try {
        for (const g of liveGrants(getRoundState(recipient, combat))) {
            out.push({
                actorId: String(g.fromActorId),
                name: String(g.fromName || g.fromActorId),
                remaining: Math.floor(Number(g.remaining) || 0),
                self: false,
            });
        }
    }
    catch {
        /* no Round state */
    }
    return out;
}
/** Total Free Raises the recipient may commit (own pool + assigned Raises). */
export function totalAvailableSharedFreeRaises(recipient, combat) {
    return listFreeRaiseSources(recipient, combat).reduce((n, s) => n + s.remaining, 0);
}
const spendQueues = new Map();
function serializePerActor(key, fn) {
    const prev = spendQueues.get(key) ?? Promise.resolve();
    const run = prev.then(fn, fn);
    spendQueues.set(key, run.catch(() => undefined));
    return run;
}
/**
 * Commit `amount` Free Raises: own pool first, then assigned Raises in the
 * order they were given. One Round-state write on the recipient; a failed
 * write spends nothing.
 */
export async function consumeFreeRaisesPreferSelfThenDonors(recipient, amount, combat) {
    const want = Math.max(0, Math.floor(Number(amount) || 0));
    if (!recipient || want <= 0)
        return { spent: 0, from: [] };
    return serializePerActor(String(recipient.uuid || recipient.id), async () => {
        const rs = JSON.parse(JSON.stringify(getRoundState(recipient, combat)));
        const from = [];
        let left = want;
        const sb = rs.stoneBonuses;
        const own = Math.max(0, Math.floor(Number(sb?.freeRaises) || 0));
        const takeOwn = Math.min(own, left);
        if (takeOwn > 0 && sb) {
            sb.freeRaises = own - takeOwn;
            sb.freeRaisesUsed = Math.max(0, Math.floor(Number(sb.freeRaisesUsed) || 0)) + takeOwn;
            from.push({ actorId: String(recipient.id), amount: takeOwn });
            left -= takeOwn;
        }
        for (const g of rs.sharedFreeRaisesReceived ?? []) {
            if (left <= 0)
                break;
            const have = Math.max(0, Math.floor(Number(g.remaining) || 0));
            const take = Math.min(have, left);
            if (take <= 0)
                continue;
            g.remaining = have - take;
            from.push({ actorId: String(g.fromActorId), amount: take });
            left -= take;
        }
        if (from.length === 0)
            return { spent: 0, from: [] };
        try {
            await setRoundState(recipient, rs);
        }
        catch (err) {
            console.warn('Mastery System | Free Raise spend could not be saved', err);
            return { spent: 0, from: [] };
        }
        return { spent: want - left, from };
    });
}
/**
 * GM Stone reset of a donor: unspent Raises it assigned to allies return with
 * the refunded Stones, so the reset never leaves Raises without a Stone cost.
 * Raises a recipient already spent stay spent.
 */
export async function reclaimSharedFreeRaises(donor, combat) {
    if (!donor)
        return 0;
    const g = globalThis;
    const donorId = String((getActionEconomyActor(donor) ?? donor).id);
    const donorState = getRoundState(donor, combat);
    const given = donorState.sharedFreeRaisesGiven ?? [];
    let reclaimed = 0;
    for (const row of given) {
        let recipient = null;
        try {
            recipient = row.toUuid && typeof g.fromUuidSync === 'function' ? g.fromUuidSync(row.toUuid) : null;
        }
        catch {
            recipient = null;
        }
        if (recipient?.documentName === 'Token' && recipient.actor)
            recipient = recipient.actor;
        recipient = recipient ?? g.game?.actors?.get?.(String(row.toActorId)) ?? null;
        if (!recipient)
            continue;
        try {
            const rs = JSON.parse(JSON.stringify(getRoundState(recipient, combat)));
            const grants = rs.sharedFreeRaisesReceived ?? [];
            const mine = grants.find((x) => String(x.fromActorId) === donorId);
            const left = Math.max(0, Math.floor(Number(mine?.remaining) || 0));
            if (!mine || left <= 0)
                continue;
            rs.sharedFreeRaisesReceived = grants.filter((x) => x !== mine);
            await setRoundState(recipient, rs);
            reclaimed += left;
        }
        catch (err) {
            console.warn('Mastery System | reclaiming shared Free Raises failed', err);
        }
    }
    return reclaimed;
}
//# sourceMappingURL=shared-free-raises.js.map