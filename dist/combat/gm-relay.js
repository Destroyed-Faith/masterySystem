/**
 * Player → GM relays for writes Foundry only accepts from a GM
 * (combat turns, NPC/unlinked-target actor updates).
 */
import { ENCOUNTER_SOCKET, canCurrentUserUpdateDocument, hasActiveGm } from './combat-permissions.js';
const pending = new Map();
export function settleGmRelay(requestId, ok) {
    const fn = pending.get(requestId);
    if (!fn)
        return;
    pending.delete(requestId);
    fn(!!ok);
}
function newRequestId() {
    return `gm-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}
async function askGm(payload) {
    const g = globalThis;
    if (!g.game?.socket)
        return false;
    const requestId = newRequestId();
    const replyTo = String(g.game.user?.id || '');
    const gmVisible = hasActiveGm();
    const ok = await new Promise((resolve) => {
        const timer = setTimeout(() => {
            pending.delete(requestId);
            resolve(false);
        }, 8000);
        pending.set(requestId, (answered) => {
            clearTimeout(timer);
            resolve(answered);
        });
        g.game.socket.emit(ENCOUNTER_SOCKET, { ...payload, requestId, replyTo });
    });
    if (!ok && !gmVisible) {
        g.ui?.notifications?.warn?.('Kein GM verbunden — Änderung nicht möglich.');
    }
    return ok;
}
/** Keys a player may ask the GM to write onto a target actor. */
export function isRelayableActorUpdate(update) {
    if (!update || typeof update !== 'object' || Array.isArray(update))
        return false;
    const keys = Object.keys(update);
    if (!keys.length)
        return false;
    return keys.every((k) => k === 'system.health' ||
        k.startsWith('system.health.') ||
        k === 'system.statusEffects' ||
        k.startsWith('system.statusEffects.') ||
        k === 'system.phases' ||
        k.startsWith('system.phases.') ||
        k === 'system.npcActivePhaseIndex' ||
        k.startsWith('flags.mastery-system.'));
}
export async function updateActorViaGm(actor, update, options) {
    if (!actor)
        return;
    const g = globalThis;
    if (canCurrentUserUpdateDocument(actor) || typeof g.game === 'undefined' || !g.game?.user) {
        await actor.update(update, options);
        return;
    }
    if (!isRelayableActorUpdate(update)) {
        console.warn('Mastery System | Refusing non-relayable actor update', Object.keys(update));
        return;
    }
    const ok = await askGm({
        type: 'gmActorUpdate',
        actorId: String(actor.id || ''),
        tokenActorUuid: String(actor.uuid || ''),
        update,
        options: options ?? {},
    });
    if (!ok) {
        throw new Error('GM actor update failed or timed out');
    }
}
/** Only contest cards may be rewritten by a non-author through the GM. */
export function isRelayableMessageUpdate(message, update) {
    if (!message || !update || typeof update !== 'object' || Array.isArray(update))
        return false;
    const flags = message.flags?.['mastery-system'] ?? {};
    if (!flags.attributeContest)
        return false;
    const keys = Object.keys(update);
    if (!keys.length)
        return false;
    return keys.every((k) => k === 'content' || k === 'flags' || k.startsWith('flags.mastery-system.'));
}
/**
 * Update a chat message that the current user may not own (the opponent in
 * an Attribute Contest answers on the initiator's card). Authors and GMs
 * write directly; everyone else asks the GM.
 */
export async function updateChatMessageViaGm(message, update) {
    if (!message)
        return;
    const g = globalThis;
    const user = g.game?.user;
    const isAuthor = !!user && (String(message.author?.id ?? message.user?.id ?? '') === String(user.id ?? ''));
    if (!user || user.isGM || isAuthor) {
        await message.update(update);
        return;
    }
    if (!isRelayableMessageUpdate(message, update)) {
        console.warn('Mastery System | Refusing non-relayable message update', Object.keys(update));
        return;
    }
    const ok = await askGm({
        type: 'gmMessageUpdate',
        messageId: String(message.id || ''),
        update,
    });
    if (!ok) {
        throw new Error('GM message update failed or timed out');
    }
}
export async function requestCombatNextTurn() {
    const g = globalThis;
    const combat = g.game?.combat;
    if (!combat)
        return false;
    const user = g.game?.user;
    if (user?.isGM) {
        await combat.nextTurn();
        return true;
    }
    const beforeTurn = combat.turn;
    const beforeRound = combat.round;
    try {
        await combat.nextTurn();
        if (combat.turn !== beforeTurn || combat.round !== beforeRound)
            return true;
    }
    catch (err) {
        console.warn('Mastery System | player nextTurn local failed, asking GM', err);
    }
    return askGm({ type: 'gmNextTurn', combatId: combat.id });
}
/** Write a combatant's initiative. Players cannot update the Combat document. */
export async function requestSetCombatantInitiative(combatant, initiative, flags = {}) {
    const g = globalThis;
    const combat = g.game?.combat;
    const combatId = String(combat?.id || combatant.parent?.id || combatant.combat?.id || '');
    const combatantId = String(combatant.id || '');
    if (!combatId || !combatantId || !Number.isFinite(Number(initiative)))
        return false;
    if (g.game?.user?.isGM) {
        const live = combat?.combatants?.get?.(combatantId) ?? combatant;
        await live.update?.({ initiative: Number(initiative) });
        for (const [key, value] of Object.entries(flags)) {
            if (value == null)
                await live.unsetFlag?.('mastery-system', key);
            else
                await live.setFlag?.('mastery-system', key, value);
        }
        return true;
    }
    return askGm({
        type: 'gmSetInitiative',
        combatId,
        combatantId,
        initiative: Number(initiative),
        flags,
    });
}
/**
 * Yield to the next combatant: set this initiative just below theirs, then advance.
 * Returns false when already last in the round.
 */
export function initiativeAfterDelay(nextInitiative) {
    const next = Number(nextInitiative);
    if (!Number.isFinite(next))
        return next;
    return Math.round((next - 0.01) * 100) / 100;
}
/** Ghost / restore a defeated enemy token + combatant. Players cannot write these. */
export async function requestDefeatedPresentation(args) {
    const g = globalThis;
    if (g.game?.user?.isGM) {
        const { writeDefeatedPresentation } = await import('./defeated-token.js');
        await writeDefeatedPresentation(args);
        return true;
    }
    return askGm({
        type: 'gmDefeatedPresentation',
        actorId: String(args.actor?.id || ''),
        tokenActorUuid: String(args.actor?.uuid || ''),
        tokenId: String(args.tokenId || ''),
        defeated: !!args.defeated,
    });
}
export async function requestDelayInitiative() {
    const g = globalThis;
    const combat = g.game?.combat;
    if (!combat?.combatant)
        return false;
    const turns = Array.isArray(combat.turns) ? combat.turns : [];
    const idx = turns.findIndex((c) => c?.id === combat.combatant.id);
    const next = idx >= 0 ? turns[idx + 1] : null;
    if (!next || next.initiative == null || !Number.isFinite(Number(next.initiative))) {
        g.ui?.notifications?.info?.('Initiative verzögern: du bist bereits der letzte in der Runde.');
        return false;
    }
    const initiative = initiativeAfterDelay(Number(next.initiative));
    if (g.game.user?.isGM) {
        await combat.combatant.update({ initiative });
        await combat.nextTurn();
        return true;
    }
    return askGm({
        type: 'gmDelayInitiative',
        combatId: combat.id,
        combatantId: combat.combatant.id,
        initiative,
    });
}
//# sourceMappingURL=gm-relay.js.map