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

/** Combat documents are GM-only on the server, even if the client reports ownership. */
export function canCurrentUserUpdateCombat(combat: unknown): boolean {
  const user = typeof game !== 'undefined' ? game.user : null;
  if (!user?.isGM) return false;
  return canCurrentUserUpdateDocument(combat);
}

export function listActiveUsers(): Array<{ id: string; isGM?: boolean; active?: boolean }> {
  const raw = typeof game !== 'undefined' ? (game as any).users : null;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.contents)) return raw.contents;
  if (typeof raw.filter === 'function') {
    try {
      const filtered = raw.filter((u: unknown) => !!u && typeof u === 'object' && !Array.isArray(u));
      if (Array.isArray(filtered) && filtered.length) return filtered;
    } catch {
      /* Collection.filter may expect a different signature */
    }
  }
  if (typeof raw.values === 'function') {
    return Array.from(raw.values()).filter((u: unknown) => !!u && typeof u === 'object' && !Array.isArray(u)) as Array<{
      id: string;
      isGM?: boolean;
      active?: boolean;
    }>;
  }
  return [];
}

export function hasActiveGm(): boolean {
  return listActiveUsers().some((u) => !!u?.isGM && !!u?.active);
}

export function canCurrentUserCreateCombat(): boolean {
  const user = typeof game !== 'undefined' ? game.user : null;
  if (!user) return false;
  if (user.isGM) return true;
  const CombatCls =
    (typeof CONFIG !== 'undefined' ? (CONFIG as any).Combat?.documentClass : null) ??
    (globalThis as any).Combat;
  if (typeof CombatCls?.canUserCreate === 'function') {
    try {
      return !!CombatCls.canUserCreate(user);
    } catch {
      return false;
    }
  }
  return false;
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
 * Auto-show / socket receive: the owning player when they are online.
 * If no player owner is connected, the GM runs the setup for that character
 * (Passives / Stones) so a fight can start without switching users.
 */
export function shouldShowEncounterDialogLocally(actor: Actor | null | undefined): boolean {
  if (!actor || typeof game === 'undefined' || !game.user) return false;
  if (isSimulatingPlayerEncounter()) {
    return !!(game.user.isGM || (actor as any).isOwner);
  }
  const playerOwners = findConnectedPlayerOwners(actor);
  if (game.user.isGM) {
    return playerOwners.length === 0;
  }
  if (playerOwners.length > 0) {
    return playerOwners.some((u) => u.id === game.user!.id);
  }
  return !!(actor as any).isOwner;
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
