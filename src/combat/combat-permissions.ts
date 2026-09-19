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

function userLooksLikeGm(u: { isGM?: boolean; role?: number } | null | undefined): boolean {
  if (!u) return false;
  if (u.isGM === true) return true;
  const role = Number(u.role);
  return Number.isFinite(role) && role >= 3;
}

export function listActiveUsers(): Array<{ id: string; isGM?: boolean; active?: boolean; role?: number }> {
  const raw = typeof game !== 'undefined' ? (game as any).users : null;
  if (!raw) return [];
  const out: Array<{ id: string; isGM?: boolean; active?: boolean; role?: number }> = [];
  const seen = new Set<string>();
  const add = (u: any): void => {
    if (!u || typeof u !== 'object' || Array.isArray(u)) return;
    const id = String(u.id || u._id || '');
    if (id) {
      if (seen.has(id)) return;
      seen.add(id);
    }
    out.push(u);
  };
  if (raw.activeGM) add(raw.activeGM);
  if (Array.isArray(raw)) {
    for (const u of raw) add(u);
    return out;
  }
  if (Array.isArray(raw.contents)) {
    for (const u of raw.contents) add(u);
  }
  if (typeof raw.forEach === 'function') {
    try {
      raw.forEach((u: unknown) => add(u));
    } catch {
      /* Collection.forEach may expect a different signature */
    }
  }
  if (out.length === 0 && typeof raw.filter === 'function') {
    try {
      const filtered = raw.filter((u: unknown) => !!u && typeof u === 'object' && !Array.isArray(u));
      if (Array.isArray(filtered)) for (const u of filtered) add(u);
    } catch {
      /* ignore */
    }
  }
  if (typeof raw.values === 'function') {
    try {
      for (const u of raw.values()) add(u);
    } catch {
      /* ignore */
    }
  }
  return out;
}

export function hasActiveGm(): boolean {
  const users = typeof game !== 'undefined' ? (game as any).users : null;
  if (users?.activeGM) return true;
  return listActiveUsers().some((u) => userLooksLikeGm(u) && u.active !== false);
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
 * Auto-show / socket receive: only the owning player.
 * The GM never gets Passives / Stones automatically — they open those
 * with the per-character buttons when they need to intervene.
 */
export function shouldShowEncounterDialogLocally(actor: Actor | null | undefined): boolean {
  if (!actor || typeof game === 'undefined' || !game.user) return false;
  if (isSimulatingPlayerEncounter()) {
    return !!(game.user.isGM || (actor as any).isOwner);
  }
  if (game.user.isGM) return false;
  const playerOwners = findConnectedPlayerOwners(actor);
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
