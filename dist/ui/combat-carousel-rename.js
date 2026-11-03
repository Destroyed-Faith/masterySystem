/**
 * Keep Combat Carousel (and combatant.name) in sync when a sheet renames an Actor.
 * Only writes / re-renders when a displayed name actually changes.
 */
import { CombatCarouselApp } from './combat-carousel.js';
import { nameFromUpdateDiff, resolveCombatantDisplayName, updateDiffHasNameChange, } from './combat-carousel-helpers.js';
const LOG = 'Mastery System | [CAROUSEL-RENAME]';
/** Opt-in console tracing: `game.masteryCarouselRenameDebug(true)`. */
export let CAROUSEL_RENAME_DEBUG = false;
export function setCarouselRenameDebug(on) {
    CAROUSEL_RENAME_DEBUG = !!on;
}
export function logCarouselRename(...args) {
    if (!CAROUSEL_RENAME_DEBUG)
        return;
    console.log(LOG, ...args);
}
function combatantsList(combat) {
    const raw = combat?.combatants;
    if (!raw)
        return [];
    if (typeof raw.contents !== 'undefined')
        return Array.from(raw.contents);
    if (typeof raw.values === 'function')
        return Array.from(raw.values());
    return Array.isArray(raw) ? raw : [];
}
function refreshCarousel(reason) {
    try {
        const carousel = CombatCarouselApp.instance;
        const rendered = !!(carousel?.rendered || carousel?.state?.rendered);
        logCarouselRename('refresh', { reason, hasInstance: !!carousel, rendered });
        if (carousel && rendered) {
            void carousel.render({ force: true });
        }
        else {
            CombatCarouselApp.refresh();
        }
    }
    catch (err) {
        console.warn(LOG, 'refresh failed', err);
    }
}
function actorMatchesCombatant(actor, combatant) {
    const actorId = String(actor?.id ?? '');
    const cActorId = String(combatant?.actorId ?? combatant?.actor?.id ?? '');
    if (actorId && cActorId && actorId === cActorId)
        return true;
    if (combatant?.actor && actor && combatant.actor === actor)
        return true;
    const tokenId = String(actor?.token?.id ?? actor?.token?.document?.id ?? '');
    const cTokenId = String(combatant?.tokenId ?? combatant?.token?.id ?? '');
    if (tokenId && cTokenId && tokenId === cTokenId)
        return true;
    return false;
}
/**
 * Push the live Actor name onto matching combatants (+ linked tokens) and re-render
 * only when something actually changed.
 */
export async function syncCombatCarouselNamesForActor(actor, reason = 'sync') {
    const combat = game.combats?.active;
    const newName = String(actor?.name || '').trim();
    logCarouselRename('syncForActor', {
        reason,
        actorId: actor?.id,
        actorName: newName,
        isToken: !!actor?.isToken,
        isGM: !!game.user?.isGM,
        hasActiveCombat: !!combat,
    });
    if (!combat || !newName)
        return false;
    const matched = combatantsList(combat).filter((c) => actorMatchesCombatant(actor, c));
    if (!matched.length)
        return false;
    let wrote = false;
    if (game.user?.isGM) {
        const combatantUpdates = matched
            .filter((c) => String(c?.name || '').trim() !== newName)
            .map((c) => ({ _id: c.id, name: newName }));
        if (combatantUpdates.length) {
            try {
                logCarouselRename('updateEmbeddedDocuments Combatant', combatantUpdates);
                await combat.updateEmbeddedDocuments('Combatant', combatantUpdates);
                wrote = true;
            }
            catch (err) {
                console.warn(LOG, 'combatant rename sync failed', err);
            }
        }
        for (const c of matched) {
            const tokenDoc = c?.token?.document ??
                c?.token ??
                (c?.tokenId ? canvas.tokens?.get(c.tokenId)?.document : null);
            if (!tokenDoc || tokenDoc.actorLink === false)
                continue;
            if (String(tokenDoc.name || '').trim() === newName)
                continue;
            try {
                logCarouselRename('sync linked token name', {
                    tokenId: tokenDoc.id,
                    from: tokenDoc.name,
                    to: newName,
                });
                await tokenDoc.update({ name: newName });
                wrote = true;
            }
            catch (err) {
                console.warn(LOG, 'token rename sync failed', err);
            }
        }
    }
    // Non-GM: carousel label may still need a soft refresh if combatant.name lagged.
    const needsVisualRefresh = wrote ||
        matched.some((c) => resolveCombatantDisplayName(c, c?.token, c?.actor) !== newName);
    if (needsVisualRefresh) {
        refreshCarousel(`${reason}:done`);
        return true;
    }
    logCarouselRename('sync skipped — names already match', { reason, newName });
    return false;
}
/** Persist a typed name on the Actor, then sync the carousel if needed. */
export async function applyActorDisplayName(actor, rawName, reason = 'applyName') {
    const newName = String(rawName || '').trim();
    logCarouselRename('applyActorDisplayName', {
        reason,
        actorId: actor?.id,
        from: actor?.name,
        to: newName,
    });
    if (!actor || !newName)
        return;
    if (String(actor.name || '').trim() === newName) {
        // Name already persisted — only sync combatant snapshots if they lag.
        await syncCombatCarouselNamesForActor(actor, reason);
        return;
    }
    try {
        await actor.update({ name: newName });
        logCarouselRename('actor.update({ name }) ok', { actorId: actor.id, name: actor.name });
    }
    catch (err) {
        console.warn(LOG, 'actor.update name failed', err);
        return;
    }
    // updateActor hook also syncs; call here so Save works even if the hook is late.
    await syncCombatCarouselNamesForActor(actor, reason);
}
export function registerCombatCarouselRenameHooks() {
    Hooks.on('updateToken', (tokenDoc, changed) => {
        const hasName = updateDiffHasNameChange(changed);
        logCarouselRename('hook updateToken', {
            tokenId: tokenDoc?.id,
            hasNameChange: hasName,
            nameFromDiff: nameFromUpdateDiff(changed, tokenDoc?.name),
        });
        if (!hasName)
            return;
        const combat = game.combats?.active;
        if (!combat)
            return;
        const tokenId = String(tokenDoc?.id ?? '');
        const actorId = String(tokenDoc?.actorId ?? tokenDoc?.actor?.id ?? '');
        const newName = nameFromUpdateDiff(changed, tokenDoc?.name);
        if (!newName)
            return;
        void (async () => {
            let wrote = false;
            if (game.user?.isGM) {
                const matched = combatantsList(combat).filter((c) => {
                    const cToken = String(c.tokenId ?? c.token?.id ?? '');
                    if (cToken && cToken === tokenId)
                        return true;
                    const cActor = String(c.actorId ?? c.actor?.id ?? '');
                    return !!actorId && !!cActor && cActor === actorId;
                });
                const updates = matched
                    .filter((c) => String(c?.name || '').trim() !== newName)
                    .map((c) => ({ _id: c.id, name: newName }));
                if (updates.length) {
                    try {
                        await combat.updateEmbeddedDocuments('Combatant', updates);
                        wrote = true;
                    }
                    catch (err) {
                        console.warn(LOG, 'combatant rename from token failed', err);
                    }
                }
            }
            if (wrote)
                refreshCarousel('updateToken');
        })();
    });
    Hooks.on('updateActor', (actor, changed) => {
        const hasName = updateDiffHasNameChange(changed);
        logCarouselRename('hook updateActor', {
            actorId: actor?.id,
            hasNameChange: hasName,
            nameFromDiff: nameFromUpdateDiff(changed, actor?.name),
        });
        if (!hasName)
            return;
        void syncCombatCarouselNamesForActor(actor, 'updateActor');
    });
    // Do NOT sync on sheet open/close — that force-refreshed the carousel and
    // made names jump whenever a Character/NPC sheet was opened.
    Hooks.once('ready', () => {
        try {
            game.masteryCarouselRenameDebug = setCarouselRenameDebug;
            game.masterySyncCarouselName = (actor) => syncCombatCarouselNamesForActor(actor, 'console');
            logCarouselRename('hooks registered');
        }
        catch {
            /* ignore */
        }
    });
}
//# sourceMappingURL=combat-carousel-rename.js.map