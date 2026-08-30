/**
 * Important NPCs released to players (portraits + names).
 * GM controls the roster; order is preserved in a world setting.
 */
export const KNOWN_NPCS_SETTING = 'knownNpcs';
export const KNOWN_NPCS_COLLAPSED_SETTING = 'knownNpcsBarCollapsed';
export const KNOWN_NPCS_POSITION_SETTING = 'knownNpcsBarPosition';
export const FLAG_SCOPE = 'mastery-system';
export const DEFAULT_KNOWN_NPCS_BAR_POSITION = { x: 90, y: 76 };
const BAR_EDGE_PAD = 8;
const EMPTY = { ids: [] };
export function sanitizeKnownNpcIds(raw) {
    const list = Array.isArray(raw)
        ? raw
        : raw && typeof raw === 'object' && Array.isArray(raw.ids)
            ? raw.ids
            : [];
    const seen = new Set();
    const out = [];
    for (const value of list) {
        const id = String(value || '').trim();
        if (!id || seen.has(id))
            continue;
        seen.add(id);
        out.push(id);
    }
    return out;
}
export function sanitizeKnownNpcsBarPosition(raw) {
    const obj = raw && typeof raw === 'object' ? raw : {};
    const x = Number(obj.x);
    const y = Number(obj.y);
    if (!Number.isFinite(x) || !Number.isFinite(y))
        return { ...DEFAULT_KNOWN_NPCS_BAR_POSITION };
    return { x: Math.round(x), y: Math.round(y) };
}
export function clampKnownNpcsBarPosition(pos, viewport, size) {
    const width = Math.max(0, Number(size.width) || 0);
    const height = Math.max(0, Number(size.height) || 0);
    const maxX = Math.max(BAR_EDGE_PAD, (Number(viewport.width) || 0) - width - BAR_EDGE_PAD);
    const maxY = Math.max(BAR_EDGE_PAD, (Number(viewport.height) || 0) - height - BAR_EDGE_PAD);
    return {
        x: Math.min(maxX, Math.max(BAR_EDGE_PAD, pos.x)),
        y: Math.min(maxY, Math.max(BAR_EDGE_PAD, pos.y)),
    };
}
function actorById(actors, id) {
    if (actors && typeof actors.get === 'function') {
        return actors.get(id);
    }
    for (const actor of actors ?? []) {
        if (String(actor?.id || '') === id)
            return actor;
    }
    return null;
}
export function portraitSrcForActor(actor) {
    const raw = actor?.img ||
        actor?.prototypeToken?.texture?.src ||
        actor?.texture?.src ||
        'icons/svg/mystery-man.svg';
    return String(raw || 'icons/svg/mystery-man.svg');
}
export function toKnownNpcView(actor) {
    if (!actor || String(actor.type || '') !== 'npc')
        return null;
    const actorId = String(actor.id || '').trim();
    if (!actorId)
        return null;
    return {
        actorId,
        name: String(actor.name || 'NPC'),
        img: portraitSrcForActor(actor),
        faction: String(actor.system?.bio?.faction || '').trim(),
    };
}
export function collectReleasedKnownNpcs(actors, ids) {
    const out = [];
    for (const id of sanitizeKnownNpcIds(ids)) {
        const view = toKnownNpcView(actorById(actors, id));
        if (view)
            out.push(view);
    }
    return out;
}
export function listNpcsForGmDialog(actors, releasedIds) {
    const order = sanitizeKnownNpcIds(releasedIds);
    const rank = new Map(order.map((id, i) => [id, i]));
    const released = [];
    const hidden = [];
    for (const actor of actors ?? []) {
        const view = toKnownNpcView(actor);
        if (!view)
            continue;
        if (rank.has(view.actorId))
            released.push({ ...view, released: true });
        else
            hidden.push({ ...view, released: false });
    }
    released.sort((a, b) => (rank.get(a.actorId) ?? 0) - (rank.get(b.actorId) ?? 0));
    hidden.sort((a, b) => a.name.localeCompare(b.name));
    return [...released, ...hidden];
}
export function registerKnownNpcSettings() {
    const g = globalThis;
    if (!g.game?.settings?.register)
        return;
    try {
        g.game.settings.register(FLAG_SCOPE, KNOWN_NPCS_SETTING, {
            name: 'Important NPCs',
            hint: 'Actor IDs the GM has released to the player portrait bar.',
            scope: 'world',
            config: false,
            type: Object,
            default: EMPTY,
        });
    }
    catch (err) {
        console.warn('Mastery System | knownNpcs setting register failed', err);
    }
    try {
        g.game.settings.register(FLAG_SCOPE, KNOWN_NPCS_COLLAPSED_SETTING, {
            name: 'Important NPCs bar collapsed',
            scope: 'client',
            config: false,
            type: Boolean,
            default: false,
        });
    }
    catch (err) {
        console.warn('Mastery System | knownNpcsBarCollapsed setting register failed', err);
    }
    try {
        g.game.settings.register(FLAG_SCOPE, KNOWN_NPCS_POSITION_SETTING, {
            name: 'Important NPCs bar position',
            scope: 'client',
            config: false,
            type: Object,
            default: DEFAULT_KNOWN_NPCS_BAR_POSITION,
        });
    }
    catch (err) {
        console.warn('Mastery System | knownNpcsBarPosition setting register failed', err);
    }
}
export function readKnownNpcIds() {
    const g = globalThis;
    try {
        return sanitizeKnownNpcIds(g.game?.settings?.get?.(FLAG_SCOPE, KNOWN_NPCS_SETTING));
    }
    catch {
        return [];
    }
}
export function isKnownNpcReleased(actorId) {
    const id = String(actorId || '').trim();
    return !!id && readKnownNpcIds().includes(id);
}
async function writeKnownNpcIds(ids) {
    const next = sanitizeKnownNpcIds(ids);
    const g = globalThis;
    try {
        await g.game?.settings?.set?.(FLAG_SCOPE, KNOWN_NPCS_SETTING, { ids: next });
    }
    catch (err) {
        console.warn('Mastery System | knownNpcs set failed', err);
    }
    return next;
}
export async function setKnownNpcReleased(actorId, released) {
    const id = String(actorId || '').trim();
    const ids = readKnownNpcIds();
    if (!id)
        return ids;
    const has = ids.includes(id);
    if (released && !has)
        return writeKnownNpcIds([...ids, id]);
    if (!released && has)
        return writeKnownNpcIds(ids.filter((x) => x !== id));
    return ids;
}
export async function toggleKnownNpc(actorId) {
    const released = !isKnownNpcReleased(actorId);
    const ids = await setKnownNpcReleased(actorId, released);
    return { released, ids };
}
export async function moveKnownNpc(actorId, delta) {
    const id = String(actorId || '').trim();
    const ids = readKnownNpcIds();
    const i = ids.indexOf(id);
    if (i < 0)
        return ids;
    const j = i + delta;
    if (j < 0 || j >= ids.length)
        return ids;
    const next = [...ids];
    const swap = next[i];
    next[i] = next[j];
    next[j] = swap;
    return writeKnownNpcIds(next);
}
export async function removeKnownNpc(actorId) {
    return setKnownNpcReleased(actorId, false);
}
export function readKnownNpcsBarCollapsed() {
    const g = globalThis;
    try {
        return !!g.game?.settings?.get?.(FLAG_SCOPE, KNOWN_NPCS_COLLAPSED_SETTING);
    }
    catch {
        return false;
    }
}
export async function setKnownNpcsBarCollapsed(collapsed) {
    const g = globalThis;
    try {
        await g.game?.settings?.set?.(FLAG_SCOPE, KNOWN_NPCS_COLLAPSED_SETTING, !!collapsed);
    }
    catch (err) {
        console.warn('Mastery System | knownNpcsBarCollapsed set failed', err);
    }
}
export function readKnownNpcsBarPosition() {
    const g = globalThis;
    try {
        return sanitizeKnownNpcsBarPosition(g.game?.settings?.get?.(FLAG_SCOPE, KNOWN_NPCS_POSITION_SETTING));
    }
    catch {
        return { ...DEFAULT_KNOWN_NPCS_BAR_POSITION };
    }
}
export async function setKnownNpcsBarPosition(pos) {
    const next = sanitizeKnownNpcsBarPosition(pos);
    const g = globalThis;
    try {
        await g.game?.settings?.set?.(FLAG_SCOPE, KNOWN_NPCS_POSITION_SETTING, next);
    }
    catch (err) {
        console.warn('Mastery System | knownNpcsBarPosition set failed', err);
    }
    return next;
}
//# sourceMappingURL=known-npcs.js.map