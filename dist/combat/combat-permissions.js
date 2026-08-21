/**
 * Who may show encounter dialogs and who may write combat documents.
 */
export const ENCOUNTER_SOCKET = 'system.mastery-system';
export function canCurrentUserUpdateDocument(doc) {
    const user = typeof game !== 'undefined' ? game.user : null;
    if (!user || !doc || typeof doc !== 'object')
        return false;
    const d = doc;
    if (user.isGM)
        return true;
    if (typeof d.canUserModify === 'function')
        return !!d.canUserModify(user, 'update');
    if (typeof d.testUserPermission === 'function')
        return !!d.testUserPermission(user, 'OWNER');
    return d.isOwner === true;
}
/** Combat documents are GM-only on the server, even if the client reports ownership. */
export function canCurrentUserUpdateCombat(combat) {
    const user = typeof game !== 'undefined' ? game.user : null;
    if (!user?.isGM)
        return false;
    return canCurrentUserUpdateDocument(combat);
}
export function listActiveUsers() {
    const raw = typeof game !== 'undefined' ? game.users : null;
    if (!raw)
        return [];
    if (Array.isArray(raw))
        return raw;
    if (Array.isArray(raw.contents))
        return raw.contents;
    if (typeof raw.filter === 'function') {
        try {
            const filtered = raw.filter((u) => !!u && typeof u === 'object' && !Array.isArray(u));
            if (Array.isArray(filtered) && filtered.length)
                return filtered;
        }
        catch {
            /* Collection.filter may expect a different signature */
        }
    }
    if (typeof raw.values === 'function') {
        return Array.from(raw.values()).filter((u) => !!u && typeof u === 'object' && !Array.isArray(u));
    }
    return [];
}
export function hasActiveGm() {
    return listActiveUsers().some((u) => !!u?.isGM && !!u?.active);
}
export function canCurrentUserCreateCombat() {
    const user = typeof game !== 'undefined' ? game.user : null;
    if (!user)
        return false;
    if (user.isGM)
        return true;
    const CombatCls = (typeof CONFIG !== 'undefined' ? CONFIG.Combat?.documentClass : null) ??
        globalThis.Combat;
    if (typeof CombatCls?.canUserCreate === 'function') {
        try {
            return !!CombatCls.canUserCreate(user);
        }
        catch {
            return false;
        }
    }
    return false;
}
export function findConnectedPlayerOwners(actor) {
    if (!actor)
        return [];
    return listActiveUsers().filter((u) => !!u?.active &&
        !u.isGM &&
        typeof actor.testUserPermission === 'function' &&
        actor.testUserPermission(u, 'OWNER'));
}
/** When set to a combat id, the local user sees encounter dialogs (player-view test). */
let simulatePlayerEncounterId = null;
export function setSimulatePlayerEncounter(combatId) {
    simulatePlayerEncounterId = combatId;
}
export function getSimulatePlayerEncounterId() {
    return simulatePlayerEncounterId;
}
function isSimulatingPlayerEncounter() {
    if (!simulatePlayerEncounterId)
        return false;
    const liveId = typeof game !== 'undefined' ? game.combat?.id : null;
    return !liveId || liveId === simulatePlayerEncounterId;
}
/**
 * Auto-show / socket receive: only the owning player.
 * The GM never gets Passives / Stones automatically — they open those
 * with the per-character buttons when they need to intervene.
 */
export function shouldShowEncounterDialogLocally(actor) {
    if (!actor || typeof game === 'undefined' || !game.user)
        return false;
    if (isSimulatingPlayerEncounter()) {
        return !!(game.user.isGM || actor.isOwner);
    }
    if (game.user.isGM)
        return false;
    const playerOwners = findConnectedPlayerOwners(actor);
    if (playerOwners.length > 0) {
        return playerOwners.some((u) => u.id === game.user.id);
    }
    return !!actor.isOwner;
}
export function emitEncounterSocketToPlayerOwners(actor, payload) {
    const owners = findConnectedPlayerOwners(actor);
    for (const owner of owners) {
        game.socket?.emit(ENCOUNTER_SOCKET, { ...payload, userId: owner.id });
    }
    return owners.length;
}
export function resolveLiveCombat(combatOrId) {
    const id = typeof combatOrId === 'string' ? combatOrId : combatOrId?.id;
    if (!id)
        return (typeof game !== 'undefined' ? game.combat : null) ?? null;
    const fromCollection = game.combats?.get(id) ?? null;
    if (fromCollection)
        return fromCollection;
    return game.combat?.id === id ? game.combat : null;
}
//# sourceMappingURL=combat-permissions.js.map