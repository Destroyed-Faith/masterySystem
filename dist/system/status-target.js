/**
 * Resolve the live scene token for status + damage writes.
 *
 * Unlinked NPCs share the world actor's id. `game.actors.get(id)` and
 * `canvas.tokens.find(t => t.actor.id === id)` both miss the token that
 * was actually hit. Scene TokenDocument flags survive ActorDelta; actor
 * `system.statusEffects` arrays with `{ id }` do not.
 */
export function tokenDocOfActor(actor) {
    if (!actor)
        return null;
    if (isSceneTokenDoc(actor))
        return actor;
    const raw = actor.token ?? (actor.isToken ? actor.parent : null);
    const doc = raw?.documentName === 'Token' ? raw : raw?.document;
    return isSceneTokenDoc(doc) ? doc : null;
}
function isSceneTokenDoc(doc) {
    if (!doc || doc.documentName !== 'Token')
        return false;
    const parentName = doc.parent?.documentName;
    return parentName === 'Scene' || parentName == null;
}
export function tokenIdOfActor(actor, fallback) {
    const fromFlag = String(fallback ?? '').trim();
    if (fromFlag)
        return fromFlag;
    return String(tokenDocOfActor(actor)?.id || '').trim();
}
function tokenActorFromScene(scene, tokenId) {
    if (!scene || !tokenId)
        return null;
    const doc = scene.tokens?.get?.(tokenId);
    if (doc?.actor)
        return doc.actor;
    return null;
}
/** Prefer the placed token actor; world actor is last resort. */
export function resolveLiveActor(actorId, tokenId) {
    const tid = String(tokenId || '').trim();
    const g = globalThis;
    if (tid) {
        const scenes = [g.canvas?.scene, g.game?.scenes?.viewed, g.game?.scenes?.active];
        for (const scene of scenes) {
            const actor = tokenActorFromScene(scene, tid);
            if (actor)
                return actor;
        }
        const placeable = g.canvas?.tokens?.get?.(tid);
        if (placeable?.actor)
            return placeable.actor;
        const combat = g.game?.combat;
        const combatant = combat?.combatants?.find?.((c) => String(c?.tokenId || c?.token?.id || '') === tid);
        if (combatant?.actor)
            return combatant.actor;
        if (combatant?.token?.actor)
            return combatant.token.actor;
    }
    const aid = String(actorId || '').trim();
    if (!aid)
        return null;
    const combat = g.game?.combat;
    if (combat) {
        const matches = [...(combat.combatants ?? [])].filter((c) => String(c?.actorId || c?.actor?.id || '') === aid);
        if (matches.length === 1) {
            const only = matches[0];
            if (only?.token?.actor)
                return only.token.actor;
            if (only?.actor)
                return only.actor;
        }
    }
    return g.game?.actors?.get?.(aid) ?? null;
}
//# sourceMappingURL=status-target.js.map