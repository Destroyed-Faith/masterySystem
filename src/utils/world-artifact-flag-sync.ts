/**
 * Sync `actorLevels` on world artifact tree roots.
 *
 * World Items are GM-owned; players updating their character must not call
 * `rootItem.setFlag` directly. GMs update locally; players emit a socket
 * request so a connected GM client applies the change.
 */

import {
  readActorArtifactProgress,
  serializeActorArtifactProgress,
  type ArtifactActorProgress,
} from './artifact-actor-rules.js';

const SOCKET_NAME = 'system.mastery-system';
let socketRegistered = false;

export function canUpdateWorldItem(item: any): boolean {
  if (typeof game === 'undefined' || !item) return false;
  if (game.user?.isGM) return true;
  try {
    return item.testUserPermission?.(game.user, 'OWNER') ?? false;
  } catch {
    return false;
  }
}

/**
 * Replace the full `actorLevels` map on a world artifact root.
 * Returns true when applied locally; false when deferred to GM socket (non-fatal).
 */
export async function setRootActorLevels(
  rootItem: any,
  levels: Record<string, unknown>,
): Promise<boolean> {
  if (!rootItem?.id) return false;

  if (canUpdateWorldItem(rootItem)) {
    try {
      await rootItem.setFlag('mastery-system', 'actorLevels', levels);
      return true;
    } catch (err) {
      console.warn('[mastery-system] setRootActorLevels failed', err);
      return false;
    }
  }

  requestGmSetRootActorLevels(rootItem.id, levels);
  return false;
}

/** Merge one actor's progress entry onto the root's `actorLevels` flag. */
export async function upsertRootActorProgress(
  rootItem: any,
  actorId: string,
  progress: ArtifactActorProgress,
): Promise<boolean> {
  if (!rootItem?.id || !actorId) return false;
  const levels = {
    ...((rootItem.getFlag?.('mastery-system', 'actorLevels') || {}) as Record<string, unknown>),
  };
  levels[actorId] = serializeActorArtifactProgress(progress);
  return setRootActorLevels(rootItem, levels);
}

/** Convenience: merge progress using the root's default node id when omitted. */
export async function upsertRootActorProgressForActor(
  rootItem: any,
  actorId: string,
  patch: Partial<ArtifactActorProgress> & { nodeId?: string },
): Promise<boolean> {
  const rootNodeId = String(rootItem?.getFlag?.('mastery-system', 'nodeId') || '');
  const levels = {
    ...((rootItem.getFlag?.('mastery-system', 'actorLevels') || {}) as Record<string, unknown>),
  };
  const prev = readActorArtifactProgress(levels[actorId], rootNodeId);
  return upsertRootActorProgress(rootItem, actorId, {
    nodeId: patch.nodeId || prev.nodeId || rootNodeId,
    linked: patch.linked !== undefined ? patch.linked : prev.linked,
  });
}

function requestGmSetRootActorLevels(rootItemId: string, levels: Record<string, unknown>): void {
  if (typeof game === 'undefined' || !game.socket) return;
  game.socket.emit(SOCKET_NAME, {
    action: 'setRootActorLevels',
    rootItemId,
    levels,
  });
}

/** GM client: apply player-requested world artifact flag updates. */
export function registerWorldArtifactFlagSyncSocket(): void {
  if (typeof game === 'undefined' || socketRegistered) return;
  socketRegistered = true;

  game.socket?.on(SOCKET_NAME, async (payload: any) => {
    if (payload?.action !== 'setRootActorLevels') return;
    if (!game.user?.isGM) return;

    const root = game.items?.get(payload.rootItemId);
    if (!root) return;

    const levels = payload.levels;
    if (!levels || typeof levels !== 'object' || Array.isArray(levels)) return;

    try {
      await root.setFlag('mastery-system', 'actorLevels', levels);
    } catch (err) {
      console.warn('[mastery-system] GM socket setRootActorLevels failed', err);
    }
  });
}
