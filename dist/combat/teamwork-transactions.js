/**
 * Teamwork writes that touch two actors (Core 2026-11-19 Tactical Choices):
 * - Regular Attack Action Transfer (declared in Preparation, spent on the
 *   recipient's own Turn)
 * - Shared Free Raise allocation (the donor assigns part of an unchanged
 *   Intellect Raises pool; the recipient spends only what it was assigned)
 *
 * A client that may write both Round states applies the transaction itself;
 * otherwise the active GM re-validates and applies the identical transaction.
 * Transactions run one at a time per client, write the recipient first and
 * restore it when the donor write fails, so nothing is lost or granted twice.
 */
import { getActionEconomyActor, getRoundState, setRoundState, syncPcExtraAttackTotal, } from './action-economy.js';
import { isActiveBuffPreparationWindow } from './active-buff-lifecycle.js';
import { resolveLiveCombat, userMayPersistActor } from './combat-permissions.js';
import { askGmForResult } from './gm-relay.js';
import { actorsWithinCoordinationRange, areTeamworkAllies, isPlayerCharacter, canPerceiveAlly, } from './tactical-options.js';
const fail = (reason) => ({ ok: false, reason });
let queue = Promise.resolve();
/** Run transactions one after another so two requests never read the same stale state. */
export function serializeTeamwork(fn) {
    const run = queue.then(fn, fn);
    queue = run.catch(() => undefined);
    return run;
}
function economyOwner(actor) {
    return (getActionEconomyActor(actor) ?? actor);
}
function cloneState(rs) {
    return JSON.parse(JSON.stringify(rs));
}
function currentUserIsGm() {
    const user = globalThis.game?.user;
    return !user || user.isGM === true;
}
function coordinationFailure(donor, recipient, ctx) {
    if (!donor?.id || !recipient?.id)
        return 'missing-actor';
    if (String(economyOwner(donor).id) === String(economyOwner(recipient).id))
        return 'self';
    if (ctx.skipRangeCheck && currentUserIsGm())
        return null;
    if (!areTeamworkAllies(donor, recipient, { aToken: ctx.donorToken, bToken: ctx.recipientToken })) {
        return 'not-ally';
    }
    if (ctx.donorToken && ctx.recipientToken) {
        if (!actorsWithinCoordinationRange(ctx.donorToken, ctx.recipientToken))
            return 'range';
    }
    if (!canPerceiveAlly(donor, recipient))
        return 'perception';
    return null;
}
function transferStateFailure(donor, recipient, combat) {
    if (!combat)
        return 'not-in-combat';
    if (!isPlayerCharacter(economyOwner(recipient)))
        return 'not-player';
    if (!isActiveBuffPreparationWindow(donor, combat))
        return 'not-preparation';
    const rs = getRoundState(donor, combat);
    if (rs.baseAttackTransferred || rs.prepBaseAttackCommitted || rs.baseAttackLocked) {
        return 'donor-base-unavailable';
    }
    if ((rs.attackActions?.used ?? 0) > 0)
        return 'donor-already-spent';
    return null;
}
function raisePoolFailure(donor, amount, combat) {
    if (!combat)
        return 'not-in-combat';
    if (!Number.isInteger(amount) || amount < 1)
        return 'invalid-amount';
    const have = Math.max(0, Math.floor(Number(getRoundState(donor, combat).stoneBonuses?.freeRaises) || 0));
    if (have < amount)
        return 'no-raises';
    return null;
}
/**
 * Write the recipient, then the donor. If the donor write fails the recipient
 * is restored, so a failure never leaves a gift without its cost.
 */
async function writeRecipientThenDonor(recipient, nextRecipient, prevRecipient, donor, nextDonor) {
    try {
        await setRoundState(recipient, nextRecipient);
    }
    catch (err) {
        console.warn('Mastery System | teamwork recipient write failed', err);
        return fail('write-failed');
    }
    try {
        await setRoundState(donor, nextDonor);
    }
    catch (err) {
        console.warn('Mastery System | teamwork donor write failed; restoring recipient', err);
        try {
            await setRoundState(recipient, prevRecipient);
        }
        catch (rollbackErr) {
            console.error('Mastery System | teamwork recipient restore failed', rollbackErr);
        }
        return fail('write-failed');
    }
    return { ok: true };
}
/** Validate and apply a transfer on a client that may write both actors. */
export async function applyAttackActionTransfer(donor, recipient, combat, ctx = {}) {
    const coordination = coordinationFailure(donor, recipient, ctx);
    if (coordination)
        return fail(coordination);
    const state = transferStateFailure(donor, recipient, combat);
    if (state)
        return fail(state);
    const donorOwner = economyOwner(donor);
    const recipientOwner = economyOwner(recipient);
    const transfer = {
        fromActorId: String(donorOwner.id),
        toActorId: String(recipientOwner.id),
        status: 'granted',
    };
    const prevRecipient = cloneState(getRoundState(recipient, combat));
    const nextRecipient = cloneState(prevRecipient);
    if (!nextRecipient.stoneBonuses) {
        nextRecipient.stoneBonuses = { extraAttacks: 0, extraReactions: 0, extraMoveMeters: 0 };
    }
    const donated = Math.max(0, Math.floor(Number(nextRecipient.stoneBonuses.donatedAttackActions) || 0));
    nextRecipient.stoneBonuses.donatedAttackActions = donated + 1;
    nextRecipient.receivedAttackTransfer = transfer;
    if (nextRecipient.isPC) {
        syncPcExtraAttackTotal(nextRecipient);
    }
    else {
        // NPC totals are reconciled from live slots + donatedAttackActions on read.
        const used = Math.max(0, Math.floor(Number(nextRecipient.attackActions?.used) || 0));
        const total = Math.max(1, Math.floor(Number(nextRecipient.attackActions?.total) || 1)) + 1;
        nextRecipient.attackActions = { total, used: Math.min(used, total) };
    }
    const nextDonor = cloneState(getRoundState(donor, combat));
    nextDonor.baseAttackTransferred = true;
    nextDonor.attackActionTransfer = transfer;
    return writeRecipientThenDonor(recipient, nextRecipient, prevRecipient, donor, nextDonor);
}
/** Validate and apply a Free Raise allocation on a client that may write both actors. */
export async function applyFreeRaiseAllocation(donor, recipient, amount, combat, ctx = {}) {
    const coordination = coordinationFailure(donor, recipient, ctx);
    if (coordination)
        return fail(coordination);
    const pool = raisePoolFailure(donor, amount, combat);
    if (pool)
        return fail(pool);
    const donorOwner = economyOwner(donor);
    const recipientOwner = economyOwner(recipient);
    const donorId = String(donorOwner.id);
    const recipientId = String(recipientOwner.id);
    const prevRecipient = cloneState(getRoundState(recipient, combat));
    const nextRecipient = cloneState(prevRecipient);
    const grants = Array.isArray(nextRecipient.sharedFreeRaisesReceived)
        ? nextRecipient.sharedFreeRaisesReceived
        : [];
    const grant = grants.find((g) => g.fromActorId === donorId);
    if (grant)
        grant.remaining = Math.max(0, Math.floor(Number(grant.remaining) || 0)) + amount;
    else
        grants.push({ fromActorId: donorId, fromName: String(donorOwner.name || donorId), remaining: amount });
    nextRecipient.sharedFreeRaisesReceived = grants;
    const nextDonor = cloneState(getRoundState(donor, combat));
    const sb = nextDonor.stoneBonuses;
    sb.freeRaises = Math.max(0, Math.floor(Number(sb.freeRaises) || 0)) - amount;
    const given = Array.isArray(nextDonor.sharedFreeRaisesGiven)
        ? nextDonor.sharedFreeRaisesGiven
        : [];
    const row = given.find((g) => g.toActorId === recipientId);
    if (row)
        row.amount = Math.max(0, Math.floor(Number(row.amount) || 0)) + amount;
    else {
        given.push({
            toActorId: recipientId,
            toUuid: String(recipientOwner.uuid || ''),
            toName: String(recipientOwner.name || recipientId),
            amount,
        });
    }
    nextDonor.sharedFreeRaisesGiven = given;
    return writeRecipientThenDonor(recipient, nextRecipient, prevRecipient, donor, nextDonor);
}
async function requestTeamwork(kind, donor, recipient, combat, ctx, amount = 0) {
    // Same checks the GM repeats, so a player gets an immediate, specific answer.
    const coordination = coordinationFailure(donor, recipient, ctx);
    if (coordination)
        return fail(coordination);
    const state = kind === 'transfer' ? transferStateFailure(donor, recipient, combat) : raisePoolFailure(donor, amount, combat);
    if (state)
        return fail(state);
    const donorOwner = economyOwner(donor);
    const recipientOwner = economyOwner(recipient);
    if (!userMayPersistActor(donorOwner))
        return fail('permission');
    if (userMayPersistActor(recipientOwner)) {
        return serializeTeamwork(() => kind === 'transfer'
            ? applyAttackActionTransfer(donor, recipient, combat, ctx)
            : applyFreeRaiseAllocation(donor, recipient, amount, combat, ctx));
    }
    const res = await askGmForResult({
        type: kind === 'transfer' ? 'gmTeamworkTransfer' : 'gmTeamworkFreeRaises',
        combatId: String(combat?.id ?? ''),
        round: Math.max(1, Math.floor(Number(combat?.round ?? 1) || 1)),
        donorId: String(donorOwner.id ?? ''),
        donorUuid: String(donorOwner.uuid ?? ''),
        recipientId: String(recipientOwner.id ?? ''),
        recipientUuid: String(recipientOwner.uuid ?? ''),
        amount,
    });
    return res.ok ? { ok: true } : fail(res.reason ?? 'gm-rejected');
}
/** Prep: give the regular Attack Action to an ally (directly or through the GM). */
export function requestAttackActionTransfer(donor, recipient, combat, ctx = {}) {
    return requestTeamwork('transfer', donor, recipient, combat, ctx);
}
/** Donor assigns `amount` of its current Intellect Free Raises to an ally. */
export function requestFreeRaiseAllocation(donor, recipient, amount, combat, ctx = {}) {
    return requestTeamwork('freeRaises', donor, recipient, combat, ctx, Math.floor(Number(amount)));
}
async function resolveActorRef(uuid, id) {
    const g = globalThis;
    let actor = null;
    const u = String(uuid || '');
    if (u && typeof g.fromUuid === 'function') {
        try {
            actor = await g.fromUuid(u);
        }
        catch {
            actor = null;
        }
    }
    if (actor?.documentName === 'Token' && actor.actor)
        actor = actor.actor;
    if (!actor && id)
        actor = g.game?.actors?.get?.(String(id)) ?? null;
    return actor;
}
function combatantFor(combat, actor) {
    const rows = Array.from(combat?.combatants ?? []);
    const uuid = String(actor?.uuid || '');
    const id = String(actor?.id || '');
    return (rows.find((c) => uuid && String(c?.actor?.uuid || '') === uuid) ??
        rows.find((c) => String(c?.actor?.id || c?.actorId || '') === id) ??
        null);
}
function userControlsActor(user, actor) {
    if (!user || !actor)
        return false;
    if (user.isGM)
        return true;
    const owns = (doc) => {
        try {
            return typeof doc?.testUserPermission === 'function' && doc.testUserPermission(user, 'OWNER') === true;
        }
        catch {
            return false;
        }
    };
    return owns(actor) || owns(economyOwner(actor)) || owns(actor?.token);
}
/**
 * Active GM side of a relayed request. Nothing from the requester is trusted:
 * ownership, live combat/Round, allegiance, range, perception and the donor's
 * remaining budget are all checked again against the GM's documents.
 */
export async function handleGmTeamworkRequest(payload, requester) {
    const combat = resolveLiveCombat(String(payload?.combatId || ''));
    if (!combat || String(combat.id) !== String(payload?.combatId || ''))
        return fail('not-in-combat');
    const round = Math.max(1, Math.floor(Number(combat.round ?? 1) || 1));
    if (Math.floor(Number(payload?.round) || 0) !== round)
        return fail('stale-round');
    const donor = await resolveActorRef(payload?.donorUuid, payload?.donorId);
    const recipient = await resolveActorRef(payload?.recipientUuid, payload?.recipientId);
    if (!donor || !recipient)
        return fail('missing-actor');
    if (!userControlsActor(requester, donor))
        return fail('permission');
    const donorCombatant = combatantFor(combat, donor);
    const recipientCombatant = combatantFor(combat, recipient);
    if (!donorCombatant || !recipientCombatant)
        return fail('not-in-combat');
    const ctx = {
        donorToken: donorCombatant.token?.object ?? donorCombatant.token ?? undefined,
        recipientToken: recipientCombatant.token?.object ?? recipientCombatant.token ?? undefined,
    };
    if (payload?.type === 'gmTeamworkTransfer') {
        return serializeTeamwork(() => applyAttackActionTransfer(donor, recipient, combat, ctx));
    }
    if (payload?.type === 'gmTeamworkFreeRaises') {
        const amount = Math.floor(Number(payload?.amount));
        return serializeTeamwork(() => applyFreeRaiseAllocation(donor, recipient, amount, combat, ctx));
    }
    return fail('gm-rejected');
}
/** Player-facing text for a rejected teamwork request. */
export function teamworkFailureMessage(reason, what) {
    const label = what === 'transfer' ? 'Transfer' : 'Sharing Free Raises';
    switch (reason) {
        case 'not-ally':
            return `${label}: only allies can receive this.`;
        case 'not-player':
            return `${label}: only another player's character can receive this.`;
        case 'range':
            return `${label}: the ally must be within 20 m.`;
        case 'perception':
            return `${label}: the ally must be able to perceive your coordination.`;
        case 'permission':
            return `${label}: you can only give from a character you control.`;
        case 'not-preparation':
            return 'Transfer: the regular Attack Action can only be given during Preparation.';
        case 'donor-base-unavailable':
            return 'Transfer: your regular Attack Action is already given away or committed this Round.';
        case 'donor-already-spent':
            return 'Transfer: you already used an Attack Action this Round.';
        case 'no-raises':
            return 'Sharing Free Raises: not enough unused Free Raises left.';
        case 'invalid-amount':
            return 'Sharing Free Raises: choose at least 1 Raise.';
        case 'gm-unavailable':
            return `${label}: no GM is connected to record it for the other character.`;
        case 'gm-timeout':
            return `${label}: the GM did not confirm in time. Check the tracker before trying again.`;
        case 'write-failed':
            return `${label} could not be saved. Nothing was changed.`;
        default:
            return `${label} failed (${reason}).`;
    }
}
//# sourceMappingURL=teamwork-transactions.js.map