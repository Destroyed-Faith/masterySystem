/**
 * Epic Mastery Roll — GM-authoritative session manager.
 */
import { isSessionReadyToComplete, mergeParticipantResult, skipParticipantInSession, } from './epic-mastery-roll-types.js';
import { broadcastEpicMasteryRollCancel, broadcastEpicMasteryRollStart, broadcastEpicMasteryRollState, } from './epic-mastery-roll-socket.js';
import { postEpicMasteryRollSummary } from './epic-mastery-roll-chat.js';
import { closeEpicMasteryRollApp, openEpicMasteryRollApp } from './epic-mastery-roll-app.js';
let activeSession = null;
/** Sessions closed by GM — ignore late state broadcasts that would reopen the overlay. */
const dismissedEpicRollSessionIds = new Set();
let summaryPostedForSessionId = null;
function markEpicRollSessionDismissed(sessionId) {
    dismissedEpicRollSessionIds.add(sessionId);
}
function isEpicRollSessionDismissed(sessionId) {
    return dismissedEpicRollSessionIds.has(sessionId);
}
function randomId() {
    return foundry.utils?.randomID?.() ?? `emr${Date.now()}`;
}
function buildParticipants(actorIds) {
    const participants = [];
    for (const actorId of actorIds) {
        const actor = game.actors?.get(actorId);
        if (!actor)
            continue;
        participants.push({
            actorId,
            actorName: actor.name ?? 'Unknown',
            status: 'pending',
            img: actor.img ?? '',
        });
    }
    return participants;
}
async function syncEpicMasteryRollSession(session) {
    if (isSessionReadyToComplete(session) && summaryPostedForSessionId !== session.id) {
        summaryPostedForSessionId = session.id;
        await postEpicMasteryRollSummary({ ...session, status: 'complete' });
    }
    broadcastEpicMasteryRollState(session);
    await openEpicMasteryRollApp(session);
}
export function getActiveEpicMasteryRollSession() {
    return activeSession;
}
export async function startEpicMasteryRollSession(config) {
    if (!game.user?.isGM) {
        ui.notifications?.warn('Only the GM can start an Epic Mastery Roll.');
        return null;
    }
    if (activeSession?.status === 'active') {
        ui.notifications?.warn('An Epic Mastery Roll is already in progress.');
        return null;
    }
    const participants = buildParticipants(config.actorIds);
    if (participants.length === 0) {
        ui.notifications?.warn('Select at least one participant.');
        return null;
    }
    const session = {
        id: randomId(),
        title: config.title.trim() || 'Epic Mastery Roll',
        flavor: config.flavor.trim(),
        showTn: config.showTn,
        tn: config.tn,
        roll: config.roll,
        participants,
        results: {},
        status: 'active',
        bandHue: 350,
    };
    activeSession = session;
    summaryPostedForSessionId = null;
    dismissedEpicRollSessionIds.delete(session.id);
    broadcastEpicMasteryRollStart(session);
    await openEpicMasteryRollApp(session);
    return session;
}
export function applyEpicMasteryRollSessionState(session) {
    if (isEpicRollSessionDismissed(session.id)) {
        return;
    }
    if (session.status !== 'active') {
        activeSession = null;
        closeEpicMasteryRollApp();
        return;
    }
    activeSession = session;
    void openEpicMasteryRollApp(session);
}
export async function ingestEpicMasteryRollResult(sessionId, result, opts) {
    if (!game.user?.isGM)
        return;
    if (!activeSession || activeSession.id !== sessionId || activeSession.status !== 'active') {
        return;
    }
    if (!activeSession.participants.some((p) => p.actorId === result.actorId)) {
        return;
    }
    const staged = opts?.staged ?? result.awaitingConfirm === true;
    activeSession = mergeParticipantResult(activeSession, result, { staged });
    await syncEpicMasteryRollSession(activeSession);
}
export async function skipEpicMasteryRollParticipant(actorId) {
    if (!game.user?.isGM || !activeSession || activeSession.status !== 'active')
        return;
    activeSession = skipParticipantInSession(activeSession, actorId);
    await syncEpicMasteryRollSession(activeSession);
}
/** GM closes the cinematic overlay for everyone (X button). Rolls stay recorded; summary posts when all are done. */
export async function cancelEpicMasteryRollSession() {
    if (!game.user?.isGM || !activeSession)
        return;
    const sessionId = activeSession.id;
    markEpicRollSessionDismissed(sessionId);
    activeSession = null;
    if (summaryPostedForSessionId === sessionId) {
        summaryPostedForSessionId = null;
    }
    broadcastEpicMasteryRollCancel(sessionId);
    closeEpicMasteryRollApp();
}
export function clearEpicMasteryRollSessionLocal(sessionId) {
    if (sessionId) {
        markEpicRollSessionDismissed(sessionId);
    }
    else if (activeSession?.id) {
        markEpicRollSessionDismissed(activeSession.id);
    }
    activeSession = null;
    closeEpicMasteryRollApp();
}
//# sourceMappingURL=epic-mastery-roll-session.js.map