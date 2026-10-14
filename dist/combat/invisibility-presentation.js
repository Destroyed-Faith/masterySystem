/**
 * Visual presentation for live Invisibility:
 * - status entry on the actor (sheet + carousel coins)
 * - token status-bar ActiveEffect icon
 * - reduced token opacity while Invisible (not when Downed)
 */
import { effectiveInvisibilityBonusForActor } from './invisibility-profile.js';
import { readActorStatusEffects, statusEntryId } from '../system/active-specials.js';
import { writeActorStatusList } from '../system/assign-status.js';
import { tokenDocOfActor } from '../system/status-target.js';
import { tokenHasDownedFlag } from './defeated-token.js';
export const INVISIBLE_STATUS_ID = 'invisible';
export const INVISIBLE_STATUS_NAME = 'Invisible';
export const INVISIBLE_IMG = 'systems/mastery-system/assets/icons/status/invisible.svg';
/** Soft ghosting so allies/enemies still see the footprint. */
export const INVIS_TOKEN_ALPHA = 0.5;
export const PRE_INVIS_ALPHA_FLAG = 'preInvisAlpha';
export const INVIS_ALPHA_ACTIVE_FLAG = 'invisAlphaActive';
function asTokenDoc(token) {
    if (!token)
        return null;
    if (token.documentName === 'Token')
        return token;
    const doc = token.document;
    return doc?.documentName === 'Token' ? doc : null;
}
function collectTokenDocs(actor) {
    const out = [];
    const seen = new Set();
    const add = (raw) => {
        const doc = asTokenDoc(raw) ?? (raw?.documentName === 'Token' ? raw : null);
        if (!doc)
            return;
        const id = String(doc.id || '');
        if (!id || seen.has(id))
            return;
        seen.add(id);
        out.push(doc);
    };
    add(tokenDocOfActor(actor));
    for (const t of actor?.getActiveTokens?.(true) || [])
        add(t);
    return out;
}
function listHasInvisible(list) {
    return list.some((e) => statusEntryId(e) === INVISIBLE_STATUS_ID || String(e?.id || '') === INVISIBLE_STATUS_ID);
}
async function syncInvisibleStatusEntry(actor, want, bonus) {
    if (!actor)
        return;
    const before = readActorStatusEffects(actor);
    const had = listHasInvisible(before);
    if (want && had) {
        // Refresh displayed bonus value when it changed.
        const next = before.map((e) => {
            if (statusEntryId(e) !== INVISIBLE_STATUS_ID && String(e?.id || '') !== INVISIBLE_STATUS_ID) {
                return e;
            }
            return { ...e, id: INVISIBLE_STATUS_ID, name: INVISIBLE_STATUS_NAME, value: bonus };
        });
        const changed = next.some((e, i) => Number(e.value) !== Number(before[i]?.value));
        if (changed)
            await writeActorStatusList(actor, next);
        return;
    }
    if (want === had)
        return;
    if (want) {
        const next = [
            ...before.filter((e) => statusEntryId(e) !== INVISIBLE_STATUS_ID && String(e?.id || '') !== INVISIBLE_STATUS_ID),
            { id: INVISIBLE_STATUS_ID, name: INVISIBLE_STATUS_NAME, value: bonus },
        ];
        await writeActorStatusList(actor, next);
        return;
    }
    const next = before.filter((e) => statusEntryId(e) !== INVISIBLE_STATUS_ID && String(e?.id || '') !== INVISIBLE_STATUS_ID);
    await writeActorStatusList(actor, next);
}
async function syncInvisibleTokenEffect(actor, want) {
    if (!actor)
        return;
    const has = !!actor?.statuses?.has?.(INVISIBLE_STATUS_ID) ||
        (Array.isArray(actor.effects)
            ? actor.effects
            : actor.effects?.contents
                ? Array.from(actor.effects.contents)
                : []).some((ef) => {
            const statuses = ef?.statuses;
            if (statuses?.has?.(INVISIBLE_STATUS_ID))
                return true;
            if (Array.isArray(statuses) && statuses.includes(INVISIBLE_STATUS_ID))
                return true;
            return String(ef?.name || '').toLowerCase() === 'invisible';
        });
    if (want === has)
        return;
    try {
        if (typeof actor.toggleStatusEffect === 'function') {
            await actor.toggleStatusEffect(INVISIBLE_STATUS_ID, { active: want, overlay: false });
            return;
        }
    }
    catch (err) {
        console.warn('Mastery System | invisibility token status toggle failed', err);
    }
    try {
        if (want && typeof actor.createEmbeddedDocuments === 'function') {
            await actor.createEmbeddedDocuments('ActiveEffect', [
                {
                    name: INVISIBLE_STATUS_NAME,
                    img: INVISIBLE_IMG,
                    icon: INVISIBLE_IMG,
                    statuses: [INVISIBLE_STATUS_ID],
                    flags: { 'mastery-system': { invisibilityPresentation: true } },
                },
            ]);
        }
        else if (!want && typeof actor.deleteEmbeddedDocuments === 'function') {
            const effects = Array.isArray(actor.effects)
                ? actor.effects
                : actor.effects?.contents
                    ? Array.from(actor.effects.contents)
                    : [];
            const ids = effects
                .filter((ef) => {
                const statuses = ef?.statuses;
                if (statuses?.has?.(INVISIBLE_STATUS_ID))
                    return true;
                if (Array.isArray(statuses) && statuses.includes(INVISIBLE_STATUS_ID))
                    return true;
                return ef?.flags?.['mastery-system']?.invisibilityPresentation === true;
            })
                .map((ef) => String(ef.id || ef._id || ''))
                .filter(Boolean);
            if (ids.length)
                await actor.deleteEmbeddedDocuments('ActiveEffect', ids);
        }
    }
    catch (err) {
        console.warn('Mastery System | invisibility ActiveEffect sync failed', err);
    }
}
async function syncInvisibleTokenAlpha(actor, want) {
    for (const doc of collectTokenDocs(actor)) {
        try {
            if (tokenHasDownedFlag(doc))
                continue;
            const alphaActive = (typeof doc.getFlag === 'function'
                ? doc.getFlag('mastery-system', INVIS_ALPHA_ACTIVE_FLAG)
                : doc.flags?.['mastery-system']?.[INVIS_ALPHA_ACTIVE_FLAG]) === true;
            if (want) {
                if (alphaActive) {
                    // Keep ghosting; refresh placeable alpha if Foundry reset it.
                    if (doc.object && Math.abs(Number(doc.object.alpha) - INVIS_TOKEN_ALPHA) > 0.05) {
                        doc.object.alpha = INVIS_TOKEN_ALPHA;
                    }
                    continue;
                }
                const current = Number(doc.alpha ?? 1);
                const original = current > INVIS_TOKEN_ALPHA + 0.05 ? current : 1;
                if (typeof doc.setFlag === 'function') {
                    await doc.setFlag('mastery-system', PRE_INVIS_ALPHA_FLAG, original);
                    await doc.setFlag('mastery-system', INVIS_ALPHA_ACTIVE_FLAG, true);
                }
                if (typeof doc.update === 'function')
                    await doc.update({ alpha: INVIS_TOKEN_ALPHA });
                else
                    doc.alpha = INVIS_TOKEN_ALPHA;
                if (doc.object)
                    doc.object.alpha = INVIS_TOKEN_ALPHA;
                continue;
            }
            if (!alphaActive)
                continue;
            const restoreRaw = typeof doc.getFlag === 'function'
                ? doc.getFlag('mastery-system', PRE_INVIS_ALPHA_FLAG)
                : doc.flags?.['mastery-system']?.[PRE_INVIS_ALPHA_FLAG];
            const restore = Number(restoreRaw);
            const alpha = Number.isFinite(restore) && restore > 0 ? restore : 1;
            if (typeof doc.update === 'function')
                await doc.update({ alpha });
            else
                doc.alpha = alpha;
            if (doc.object)
                doc.object.alpha = alpha;
            if (typeof doc.unsetFlag === 'function') {
                await doc.unsetFlag('mastery-system', INVIS_ALPHA_ACTIVE_FLAG);
                await doc.unsetFlag('mastery-system', PRE_INVIS_ALPHA_FLAG);
            }
        }
        catch (err) {
            console.warn('Mastery System | invisibility token alpha sync failed', err);
        }
    }
}
const presentationSyncInFlight = new Set();
/**
 * Keep sheet status, token icon, and opacity in sync with live Invisibility bonus.
 * Call after power sync / health changes that may suppress Invisibility.
 */
export async function syncInvisibilityPresentation(actor) {
    if (!actor)
        return;
    const actorId = String(actor.id || actor.uuid || '');
    if (actorId && presentationSyncInFlight.has(actorId))
        return;
    if (actorId)
        presentationSyncInFlight.add(actorId);
    try {
        const bonus = effectiveInvisibilityBonusForActor(actor);
        const want = bonus > 0;
        await syncInvisibleStatusEntry(actor, want, bonus);
        await syncInvisibleTokenEffect(actor, want);
        await syncInvisibleTokenAlpha(actor, want);
    }
    finally {
        if (actorId)
            presentationSyncInFlight.delete(actorId);
    }
}
//# sourceMappingURL=invisibility-presentation.js.map