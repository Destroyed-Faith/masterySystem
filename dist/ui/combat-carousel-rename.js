/**
 * Keep Combat Carousel (and combatant.name) in sync when a sheet renames an Actor.
 *
 * Unlinked NPC copies must match by Token id only — never by shared actorId.
 * Save always pushes combatant.name even when the Actor already holds the new name.
 */
import { CombatCarouselApp } from './combat-carousel.js';
import { actorMatchesCombatant, actorTokenId, nameFromUpdateDiff, resolveCombatantDisplayName, updateDiffHasNameChange, } from './combat-carousel-helpers.js';
export { actorMatchesCombatant, actorTokenId } from './combat-carousel-helpers.js';
const LOG = 'Mastery System | [CAROUSEL-RENAME]';
/**
 * Off by default — enable with: game.masteryCarouselRenameDebug(true)
 */
export let CAROUSEL_RENAME_DEBUG = false;
export function setCarouselRenameDebug(on) {
    CAROUSEL_RENAME_DEBUG = !!on;
    console.log(LOG, `debug ${CAROUSEL_RENAME_DEBUG ? 'ON' : 'OFF'}`);
}
/** Debug one-liner (readable without expanding Objects). */
function note(msg, parts = {}) {
    if (!CAROUSEL_RENAME_DEBUG)
        return;
    const flat = Object.entries(parts)
        .map(([k, v]) => `${k}=${v === undefined || v === null ? '∅' : String(v)}`)
        .join(' ');
    console.log(LOG, msg, flat);
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
        note('refresh', { reason, rendered: rendered ? 1 : 0 });
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
/**
 * Push the live Actor name onto matching combatants (+ linked tokens) and re-render
 * when the displayed label would change.
 */
export async function syncCombatCarouselNamesForActor(actor, reason = 'sync') {
    const combat = game.combats?.active;
    const newName = String(actor?.name || '').trim();
    const tokenId = actorTokenId(actor);
    note('syncForActor', {
        reason,
        actorId: actor?.id,
        actorName: newName,
        tokenId: tokenId || '∅',
        isToken: actor?.isToken ? 1 : 0,
        isGM: game.user?.isGM ? 1 : 0,
        combat: combat?.id || '∅',
    });
    if (!combat || !newName) {
        note('sync abort', { why: !combat ? 'no-combat' : 'empty-name' });
        return false;
    }
    const all = combatantsList(combat);
    const matched = all.filter((c) => actorMatchesCombatant(actor, c));
    note('matched', {
        reason,
        count: matched.length,
        ids: matched.map((c) => c?.id).join(',') || '∅',
        names: matched.map((c) => c?.name).join(' | ') || '∅',
        tokenIds: matched.map((c) => c?.tokenId ?? c?.token?.id).join(',') || '∅',
    });
    if (!matched.length) {
        note('sync abort', { why: 'no-matching-combatant', actorId: actor?.id, tokenId: tokenId || '∅' });
        return false;
    }
    let wrote = false;
    if (game.user?.isGM) {
        const combatantUpdates = matched
            .filter((c) => String(c?.name || '').trim() !== newName)
            .map((c) => ({ _id: c.id, name: newName }));
        if (combatantUpdates.length) {
            try {
                note('write combatants', {
                    n: combatantUpdates.length,
                    to: newName,
                    ids: combatantUpdates.map((u) => u._id).join(','),
                });
                await combat.updateEmbeddedDocuments('Combatant', combatantUpdates);
                wrote = true;
            }
            catch (err) {
                console.warn(LOG, 'combatant rename sync failed', err);
            }
        }
        else {
            note('combatant names already equal', { newName });
        }
        for (const c of matched) {
            const tokenDoc = c?.token?.document ??
                c?.token ??
                (c?.tokenId ? canvas.tokens?.get(c.tokenId)?.document : null);
            if (!tokenDoc)
                continue;
            // Linked tokens: keep token.name aligned with Actor.
            // Unlinked: still update the placeable name so the canvas label matches.
            if (String(tokenDoc.name || '').trim() === newName)
                continue;
            try {
                note('write token name', {
                    tokenId: tokenDoc.id,
                    actorLink: tokenDoc.actorLink === false ? 0 : 1,
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
    else {
        note('non-GM — no combatant/token write');
    }
    const displayLag = matched.some((c) => {
        const shown = resolveCombatantDisplayName(c, c?.token, c?.actor);
        return shown !== newName || String(c?.name || '').trim() !== newName;
    });
    if (wrote || displayLag) {
        refreshCarousel(`${reason}:done`);
        return true;
    }
    note('sync skipped — already in sync', { reason, newName });
    return false;
}
/** Persist a typed name on the Actor, then always attempt combatant sync. */
export async function applyActorDisplayName(actor, rawName, reason = 'applyName') {
    const newName = String(rawName || '').trim();
    note('applyActorDisplayName', {
        reason,
        actorId: actor?.id,
        from: actor?.name,
        to: newName,
        tokenId: actorTokenId(actor) || '∅',
        isToken: actor?.isToken ? 1 : 0,
    });
    if (!actor || !newName)
        return;
    if (String(actor.name || '').trim() !== newName) {
        try {
            await actor.update({ name: newName });
            note('actor.update name ok', { actorId: actor.id, name: actor.name });
        }
        catch (err) {
            console.warn(LOG, 'actor.update name failed', err);
            return;
        }
    }
    else {
        note('actor name already set — syncing combatants anyway', { newName });
    }
    await syncCombatCarouselNamesForActor(actor, reason);
}
export function registerCombatCarouselRenameHooks() {
    Hooks.on('updateToken', (tokenDoc, changed) => {
        const hasName = updateDiffHasNameChange(changed);
        note('hook updateToken', {
            tokenId: tokenDoc?.id,
            hasName: hasName ? 1 : 0,
            name: nameFromUpdateDiff(changed, tokenDoc?.name),
            actorLink: tokenDoc?.actorLink === false ? 0 : 1,
        });
        if (!hasName)
            return;
        const combat = game.combats?.active;
        if (!combat)
            return;
        const tokenId = String(tokenDoc?.id ?? '');
        const newName = nameFromUpdateDiff(changed, tokenDoc?.name);
        if (!newName || !tokenId)
            return;
        void (async () => {
            let wrote = false;
            if (game.user?.isGM) {
                // Token rename: only the combatant on THIS token (never all copies of actorId).
                const matched = combatantsList(combat).filter((c) => {
                    const cToken = String(c.tokenId ?? c.token?.id ?? '');
                    return !!cToken && cToken === tokenId;
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
            else
                refreshCarousel('updateToken:display');
        })();
    });
    Hooks.on('updateActor', (actor, changed) => {
        const hasName = updateDiffHasNameChange(changed);
        note('hook updateActor', {
            actorId: actor?.id,
            hasName: hasName ? 1 : 0,
            name: nameFromUpdateDiff(changed, actor?.name),
            isToken: actor?.isToken ? 1 : 0,
            tokenId: actorTokenId(actor) || '∅',
        });
        if (!hasName)
            return;
        void syncCombatCarouselNamesForActor(actor, 'updateActor');
    });
    Hooks.once('ready', () => {
        try {
            game.masteryCarouselRenameDebug = setCarouselRenameDebug;
            game.masterySyncCarouselName = (actor) => syncCombatCarouselNamesForActor(actor, 'console');
            note('hooks registered', { debug: CAROUSEL_RENAME_DEBUG ? 1 : 0 });
        }
        catch {
            /* ignore */
        }
    });
}
//# sourceMappingURL=combat-carousel-rename.js.map