/**
 * Epic Mastery Roll — socket transport.
 */

import type { EpicMasteryRollSession, EpicParticipantResult } from './epic-mastery-roll-types.js';
import {
  applyEpicMasteryRollSessionState,
  clearEpicMasteryRollSessionLocal,
  ingestEpicMasteryRollResult,
} from './epic-mastery-roll-session.js';
import { openEpicMasteryRollApp } from './epic-mastery-roll-app.js';

export const EPIC_ROLL_SOCKET = 'system.mastery-system';

let socketRegistered = false;

export function broadcastEpicMasteryRollStart(session: EpicMasteryRollSession): void {
  game.socket?.emit(EPIC_ROLL_SOCKET, {
    type: 'epicMasteryRollStart',
    session,
  });
}

export function broadcastEpicMasteryRollState(session: EpicMasteryRollSession): void {
  game.socket?.emit(EPIC_ROLL_SOCKET, {
    type: 'epicMasteryRollState',
    session,
  });
}

export function broadcastEpicMasteryRollComplete(sessionId: string): void {
  game.socket?.emit(EPIC_ROLL_SOCKET, {
    type: 'epicMasteryRollComplete',
    sessionId,
  });
}

export function broadcastEpicMasteryRollCancel(sessionId: string): void {
  game.socket?.emit(EPIC_ROLL_SOCKET, {
    type: 'epicMasteryRollCancel',
    sessionId,
  });
}

export function emitEpicMasteryRollResult(
  sessionId: string,
  result: EpicParticipantResult,
  opts?: { staged?: boolean },
): void {
  game.socket?.emit(EPIC_ROLL_SOCKET, {
    type: 'epicMasteryRollResult',
    sessionId,
    result,
    staged: opts?.staged ?? result.awaitingConfirm === true,
    userId: game.user?.id,
  });
}

async function handleEpicRollSocket(payload: any): Promise<void> {
  const { type } = payload ?? {};
  if (!type?.startsWith?.('epicMasteryRoll')) return;

  switch (type) {
    case 'epicMasteryRollStart': {
      if (payload.session) {
        applyEpicMasteryRollSessionState(payload.session);
      }
      break;
    }

    case 'epicMasteryRollState': {
      if (payload.session) {
        applyEpicMasteryRollSessionState(payload.session);
      }
      break;
    }

    case 'epicMasteryRollResult': {
      if (game.user?.isGM) {
        await ingestEpicMasteryRollResult(payload.sessionId, payload.result, {
          staged: payload.staged,
        });
      }
      break;
    }

    case 'epicMasteryRollComplete':
    case 'epicMasteryRollCancel': {
      clearEpicMasteryRollSessionLocal(payload.sessionId);
      break;
    }

    default:
      break;
  }
}

export function registerEpicMasteryRollSocket(): void {
  if (socketRegistered) return;
  socketRegistered = true;

  game.socket?.on(EPIC_ROLL_SOCKET, async (payload: any) => {
    try {
      await handleEpicRollSocket(payload);
    } catch (err) {
      console.error('Mastery System | Epic Mastery Roll socket error', err);
    }
  });
}

export async function syncEpicMasteryRollApp(session: EpicMasteryRollSession): Promise<void> {
  await openEpicMasteryRollApp(session);
}
