/**
 * Epic Mastery Roll — GM-authoritative session manager.
 */

import {
  type EpicMasteryRollSession,
  type EpicMasteryRollStartConfig,
  type EpicParticipant,
  type EpicParticipantResult,
  isSessionReadyToComplete,
  mergeParticipantResult,
  skipParticipantInSession,
} from './epic-mastery-roll-types.js';
import {
  broadcastEpicMasteryRollCancel,
  broadcastEpicMasteryRollComplete,
  broadcastEpicMasteryRollStart,
  broadcastEpicMasteryRollState,
} from './epic-mastery-roll-socket.js';
import { postEpicMasteryRollSummary } from './epic-mastery-roll-chat.js';
import { closeEpicMasteryRollApp, openEpicMasteryRollApp } from './epic-mastery-roll-app.js';

let activeSession: EpicMasteryRollSession | null = null;
/** Sessions closed locally — ignore late state broadcasts that would reopen the overlay. */
const dismissedEpicRollSessionIds = new Set<string>();

function markEpicRollSessionDismissed(sessionId: string): void {
  dismissedEpicRollSessionIds.add(sessionId);
}

function isEpicRollSessionDismissed(sessionId: string): boolean {
  return dismissedEpicRollSessionIds.has(sessionId);
}

function randomId(): string {
  return (foundry as any).utils?.randomID?.() ?? `emr${Date.now()}`;
}

function buildParticipants(actorIds: string[]): EpicParticipant[] {
  const participants: EpicParticipant[] = [];
  for (const actorId of actorIds) {
    const actor = game.actors?.get(actorId);
    if (!actor) continue;
    participants.push({
      actorId,
      actorName: actor.name ?? 'Unknown',
      status: 'pending',
      img: actor.img ?? '',
    });
  }
  return participants;
}

export function getActiveEpicMasteryRollSession(): EpicMasteryRollSession | null {
  return activeSession;
}

export async function startEpicMasteryRollSession(
  config: EpicMasteryRollStartConfig,
): Promise<EpicMasteryRollSession | null> {
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

  const session: EpicMasteryRollSession = {
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
  dismissedEpicRollSessionIds.delete(session.id);
  broadcastEpicMasteryRollStart(session);
  await openEpicMasteryRollApp(session);
  return session;
}

export function applyEpicMasteryRollSessionState(session: EpicMasteryRollSession): void {
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

export async function ingestEpicMasteryRollResult(
  sessionId: string,
  result: EpicParticipantResult,
  opts?: { staged?: boolean },
): Promise<void> {
  if (!game.user?.isGM) return;
  if (!activeSession || activeSession.id !== sessionId || activeSession.status !== 'active') {
    return;
  }

  if (!activeSession.participants.some((p) => p.actorId === result.actorId)) {
    return;
  }

  const staged = opts?.staged ?? result.awaitingConfirm === true;
  activeSession = mergeParticipantResult(activeSession, result, { staged });

  if (isSessionReadyToComplete(activeSession)) {
    await completeEpicMasteryRollSession(activeSession);
  } else {
    broadcastEpicMasteryRollState(activeSession);
    await openEpicMasteryRollApp(activeSession);
  }
}

export async function skipEpicMasteryRollParticipant(actorId: string): Promise<void> {
  if (!game.user?.isGM || !activeSession || activeSession.status !== 'active') return;

  activeSession = skipParticipantInSession(activeSession, actorId);

  if (isSessionReadyToComplete(activeSession)) {
    await completeEpicMasteryRollSession(activeSession);
  } else {
    broadcastEpicMasteryRollState(activeSession);
    await openEpicMasteryRollApp(activeSession);
  }
}

export async function cancelEpicMasteryRollSession(): Promise<void> {
  if (!game.user?.isGM || !activeSession) return;

  const sessionId = activeSession.id;
  markEpicRollSessionDismissed(sessionId);
  activeSession = { ...activeSession, status: 'cancelled' };
  broadcastEpicMasteryRollCancel(sessionId);
  closeEpicMasteryRollApp();
  activeSession = null;
}

async function completeEpicMasteryRollSession(session: EpicMasteryRollSession): Promise<void> {
  const completed: EpicMasteryRollSession = { ...session, status: 'complete' };
  markEpicRollSessionDismissed(session.id);
  activeSession = null;
  await postEpicMasteryRollSummary(completed);
  broadcastEpicMasteryRollComplete(completed.id);
  closeEpicMasteryRollApp();
}

export function clearEpicMasteryRollSessionLocal(sessionId?: string): void {
  if (sessionId) {
    markEpicRollSessionDismissed(sessionId);
  } else if (activeSession?.id) {
    markEpicRollSessionDismissed(activeSession.id);
  }
  activeSession = null;
  closeEpicMasteryRollApp();
}
