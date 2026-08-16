/**
 * Who may show encounter dialogs and who may write combat documents.
 */

export const ENCOUNTER_SOCKET = 'system.mastery-system';

export function canCurrentUserUpdateDocument(doc: unknown): boolean {
  const user = typeof game !== 'undefined' ? game.user : null;
  if (!user || !doc || typeof doc !== 'object') return false;
  const d = doc as {
    canUserModify?: (u: unknown, action: string) => boolean;
    testUserPermission?: (u: unknown, perm: string) => boolean;
    isOwner?: boolean;
  };
  if (user.isGM) return true;
  if (typeof d.canUserModify === 'function') return !!d.canUserModify(user, 'update');
  if (typeof d.testUserPermission === 'function') return !!d.testUserPermission(user, 'OWNER');
  return d.isOwner === true;
}

export function listActiveUsers(): Array<{ id: string; isGM?: boolean; active?: boolean }> {
  const raw = (typeof game !== 'undefined' ? (game as any).users : null) as
    | { contents?: unknown[] }
    | unknown[]
    | null;
  if (!raw) return [];
  const list = Array.isArray(raw) ? raw : Array.isArray(raw.contents) ? raw.contents : [];
  return list as Array<{ id: string; isGM?: boolean; active?: boolean }>;
}

export function findConnectedPlayerOwners(actor: Actor | null | undefined): Array<{
  id: string;
  isGM?: boolean;
  active?: boolean;
}> {
  if (!actor) return [];
  return listActiveUsers().filter(
    (u) =>
      !!u?.active &&
      !u.isGM &&
      typeof (actor as any).testUserPermission === 'function' &&
      (actor as any).testUserPermission(u, 'OWNER'),
  );
}

/** When set to a combat id, the local user sees encounter dialogs (player-view test). */
let simulatePlayerEncounterId: string | null = null;

export function setSimulatePlayerEncounter(combatId: string | null): void {
  simulatePlayerEncounterId = combatId;
}

export function getSimulatePlayerEncounterId(): string | null {
  return simulatePlayerEncounterId;
}

function isSimulatingPlayerEncounter(): boolean {
  if (!simulatePlayerEncounterId) return false;
  const liveId = typeof game !== 'undefined' ? game.combat?.id : null;
  return !liveId || liveId === simulatePlayerEncounterId;
}

/**
 * A connected player who owns the actor should see the dialog.
 * The GM only handles it when no such player is online.
 * Start Encounter (player view) can force local dialogs for the current combat.
 */
export function shouldShowEncounterDialogLocally(actor: Actor | null | undefined): boolean {
  if (!actor || typeof game === 'undefined' || !game.user) return false;
  if (isSimulatingPlayerEncounter()) {
    return !!(game.user.isGM || (actor as any).isOwner);
  }
  const playerOwners = findConnectedPlayerOwners(actor);
  if (playerOwners.length > 0) {
    return playerOwners.some((u) => u.id === game.user!.id);
  }
  return !!(game.user.isGM || (actor as any).isOwner);
}

export function emitEncounterSocketToPlayerOwners(
  actor: Actor | null | undefined,
  payload: Record<string, unknown>,
): number {
  const owners = findConnectedPlayerOwners(actor);
  for (const owner of owners) {
    game.socket?.emit(ENCOUNTER_SOCKET, { ...payload, userId: owner.id });
  }
  return owners.length;
}

export function resolveLiveCombat(combatOrId: Combat | string | null | undefined): Combat | null {
  const id = typeof combatOrId === 'string' ? combatOrId : combatOrId?.id;
  if (!id) return (typeof game !== 'undefined' ? game.combat : null) ?? null;
  const fromCollection = (game.combats?.get(id) as Combat | undefined) ?? null;
  if (fromCollection) return fromCollection;
  return game.combat?.id === id ? game.combat : null;
}
