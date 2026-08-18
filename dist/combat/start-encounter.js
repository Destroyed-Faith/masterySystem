/**
 * Test/player "Start Encounter": pick scene tokens, create combat, run setup.
 * Players emit to the GM; the GM writes the Combat document.
 */
import { ENCOUNTER_SOCKET, canCurrentUserCreateCombat, hasActiveGm, setSimulatePlayerEncounter, } from './combat-permissions.js';
function asTokenArray(raw) {
    if (!raw)
        return [];
    if (Array.isArray(raw))
        return raw;
    if (Array.isArray(raw.contents))
        return raw.contents;
    if (Array.isArray(raw.placeables))
        return raw.placeables;
    if (typeof raw.values === 'function')
        return Array.from(raw.values());
    return [];
}
function readEncounterToken(token, isGM) {
    const doc = token?.document ?? token;
    const actorId = String(doc?.actorId ?? token?.actorId ?? '');
    const actor = token?.actor ??
        doc?.actor ??
        (actorId && typeof game !== 'undefined' ? game.actors?.get?.(actorId) : null);
    if (!actor)
        return null;
    const hidden = doc?.hidden === true || token?.hidden === true;
    if (hidden && !isGM)
        return null;
    const actorType = String(actor.type ?? '');
    if (actorType !== 'character' && actorType !== 'npc' && actorType !== 'summon')
        return null;
    const tokenId = String(doc?.id ?? token?.id ?? doc?._id ?? token?._id ?? '');
    if (!tokenId)
        return null;
    return {
        tokenId,
        actorId: String(actor.id ?? actorId),
        name: String(doc?.name || token?.name || actor.name || '—'),
        img: String(doc?.texture?.src || token?.texture?.src || actor.img || 'icons/svg/mystery-man.svg'),
        actorType,
        isCharacter: actorType === 'character',
        hidden,
    };
}
export function listSceneEncounterTokens(scene) {
    const sc = scene ??
        (typeof canvas !== 'undefined' ? canvas?.scene : null) ??
        (typeof game !== 'undefined' ? game.scenes?.active : null);
    const isGM = !!(typeof game !== 'undefined' && game.user?.isGM);
    const seen = new Set();
    const out = [];
    const sources = [asTokenArray(sc?.tokens), asTokenArray(sc?.tokens?.contents)];
    if (!scene && typeof canvas !== 'undefined') {
        sources.push(asTokenArray(canvas?.tokens?.placeables));
    }
    for (const list of sources) {
        for (const token of list) {
            const row = readEncounterToken(token, isGM);
            if (!row || seen.has(row.tokenId))
                continue;
            seen.add(row.tokenId);
            out.push(row);
        }
    }
    return out;
}
export async function requestStartEncounter(opts) {
    const tokenIds = [...new Set(opts.tokenIds.map(String).filter(Boolean))];
    if (!tokenIds.length) {
        ui.notifications?.warn(loc('noneSelected', 'Bitte mindestens einen Token anhacken.'));
        return;
    }
    const sceneId = opts.sceneId ||
        String(canvas?.scene?.id ?? game.scenes?.active?.id ?? '');
    if (!sceneId) {
        ui.notifications?.warn(loc('noScene', 'Keine aktive Szene.'));
        return;
    }
    if (game.user?.isGM || canCurrentUserCreateCombat() || !hasActiveGm()) {
        await createAndBeginEncounter({
            tokenIds,
            sceneId,
            openLocally: opts.openLocally || !hasActiveGm(),
        });
        return;
    }
    game.socket?.emit(ENCOUNTER_SOCKET, {
        type: 'playerStartEncounter',
        sceneId,
        tokenIds,
        requesterId: game.user?.id,
        openLocally: opts.openLocally,
    });
    ui.notifications?.info(loc('sent', 'Start Encounter an den SL geschickt.'));
}
export async function createAndBeginEncounter(opts) {
    const scene = game.scenes?.get?.(opts.sceneId);
    if (!scene) {
        ui.notifications?.error(loc('noScene', 'Keine aktive Szene.'));
        return null;
    }
    let combat = game.combat;
    if (combat && combat.scene?.id && combat.scene.id !== opts.sceneId) {
        combat = null;
    }
    if (!combat) {
        const CombatCls = (CONFIG.Combat?.documentClass ?? globalThis.Combat);
        try {
            combat = await CombatCls.create({ scene: opts.sceneId });
        }
        catch (err) {
            console.error('Mastery System | Could not create combat', err);
            ui.notifications?.warn(loc('needGm', 'Ein SL muss online sein, damit der Kampf angelegt wird.'));
            return null;
        }
    }
    if (!combat)
        return null;
    if (typeof combat.activate === 'function' && !combat.isActive) {
        try {
            await combat.activate();
        }
        catch {
            /* already active or no permission */
        }
    }
    const existing = new Set(Array.from(combat.combatants).map((c) => String(c.tokenId ?? '')).filter(Boolean));
    const toAdd = [];
    for (const tokenId of opts.tokenIds) {
        if (existing.has(tokenId))
            continue;
        const token = scene.tokens?.get?.(tokenId);
        toAdd.push({
            tokenId,
            actorId: String(token?.actorId ?? token?.actor?.id ?? ''),
            sceneId: opts.sceneId,
        });
    }
    if (toAdd.length) {
        try {
            await combat.createEmbeddedDocuments('Combatant', toAdd);
        }
        catch (err) {
            console.error('Mastery System | Could not add combatants', err);
            ui.notifications?.warn(loc('needGm', 'Ein SL muss online sein, damit der Kampf angelegt wird.'));
            return null;
        }
    }
    const live = game.combats?.get(combat.id) ?? combat;
    if (opts.openLocally)
        setSimulatePlayerEncounter(live.id);
    const flags = live.flags?.['mastery-system'] || {};
    const setup = flags.encounterSetup;
    if (setup?.started === true || live.round > 0) {
        ui.notifications?.warn(loc('already', 'Dieser Kampf ist schon gestartet.'));
        return live;
    }
    const { beginEncounter } = await import('./encounter-start.js');
    await beginEncounter(live);
    return live;
}
function loc(key, fallback) {
    const full = `MASTERY.startEncounter.${key}`;
    const t = game?.i18n?.localize?.(full);
    return t && t !== full ? t : fallback;
}
//# sourceMappingURL=start-encounter.js.map