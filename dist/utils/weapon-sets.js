/**
 * Prepared weapon sets for the hand slots, plus the shared Weapon Swap.
 *
 * Default: two slots (I / II). GM may add more (III…). Switching is always free
 * (sheet + combat) so forgotten loadouts can be fixed mid-fight.
 *
 * Only the active set is mechanically equipped (`system.equipped` + slot flag).
 * Sets store item-id references — never duplicated items.
 */
import { canCurrentUserUpdateDocument } from '../combat/combat-permissions.js';
import { formatArtifactWeaponRangeDisplay } from './artifact-rules.js';
import { isEchoBoundArtifact } from './echo-artifact-equip.js';
import { migrateActorAmmunition, normalizeAmmoWeaponSetHands, requiresAmmunition, } from './ammunition.js';
export const WEAPON_SWAP_ID = 'weapon-swap';
export const WEAPON_SETS_FLAG = 'weaponSets';
export const WEAPON_SETS_SCHEMA = 1;
/** Always at least two prepared Weaponslots. */
export const DEFAULT_WEAPON_SET_COUNT = 2;
/** Soft cap so the paperdoll row stays usable. */
export const MAX_WEAPON_SET_COUNT = 8;
const swapLocks = new Set();
function loc(key, fallback) {
    const raw = globalThis.game?.i18n?.localize?.(`MASTERY.weaponSets.${key}`);
    return raw && raw !== `MASTERY.weaponSets.${key}` ? raw : fallback;
}
function actorKey(actor) {
    return String(actor?.uuid || actor?.id || '');
}
function collectItems(actor) {
    if (!actor?.items)
        return [];
    const items = actor.items;
    if (Array.isArray(items))
        return items;
    if (items instanceof Map)
        return Array.from(items.values());
    if (typeof items.values === 'function')
        return Array.from(items.values());
    return [];
}
function emptyHands() {
    return { mainhand: null, offhand: null };
}
export function emptyWeaponSetsState() {
    return {
        schemaVersion: WEAPON_SETS_SCHEMA,
        active: 1,
        stowed: false,
        count: DEFAULT_WEAPON_SET_COUNT,
        sets: { 1: emptyHands(), 2: emptyHands() },
    };
}
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
export function weaponSetRoman(index) {
    const n = Math.floor(Number(index) || 0);
    if (n >= 1 && n <= ROMAN.length)
        return ROMAN[n - 1];
    return String(n);
}
export function weaponSetCount(state) {
    if (!state)
        return DEFAULT_WEAPON_SET_COUNT;
    const fromField = Math.floor(Number(state.count) || 0);
    let fromKeys = 0;
    for (const key of Object.keys(state.sets || {})) {
        const n = Math.floor(Number(key) || 0);
        if (n > fromKeys)
            fromKeys = n;
    }
    return Math.min(MAX_WEAPON_SET_COUNT, Math.max(DEFAULT_WEAPON_SET_COUNT, fromField, fromKeys));
}
export function listWeaponSetIndexes(state) {
    const count = weaponSetCount(state);
    return Array.from({ length: count }, (_, i) => i + 1);
}
export function isTwoHandedSet(set) {
    return !!set.mainhand && set.mainhand === set.offhand;
}
export function weaponSetAssignedIds(state) {
    const ids = new Set();
    for (const index of listWeaponSetIndexes(state)) {
        const hands = state.sets[index];
        if (hands?.mainhand)
            ids.add(hands.mainhand);
        if (hands?.offhand)
            ids.add(hands.offhand);
    }
    return ids;
}
function handsEqual(a, b) {
    return (a?.mainhand || null) === (b?.mainhand || null) && (a?.offhand || null) === (b?.offhand || null);
}
function isGameMaster() {
    return !!globalThis.game?.user?.isGM;
}
export function isItemAssignedToWeaponSet(actor, itemId) {
    if (!itemId)
        return false;
    return weaponSetAssignedIds(peekWeaponSets(actor)).has(String(itemId));
}
/** Inactive-set items stay prepared on the character — hidden, not in the carry grid. */
export function isWeaponSetPreparedFlags(flags) {
    return flags?.weaponSetPrepared === true;
}
export function isWeaponSetPreparedItem(item) {
    return isWeaponSetPreparedFlags(getItemEquipmentFlags(item));
}
/** True when an item belongs to a weapon set and must not appear in inventory. */
export function isHiddenInInactiveWeaponSet(actor, item) {
    const id = item?.id != null ? String(item.id) : '';
    if (!id)
        return false;
    if (isWeaponSetPreparedItem(item))
        return true;
    if (!isItemAssignedToWeaponSet(actor, id))
        return false;
    const slot = getItemEquipmentFlags(item).slot;
    return !slot && item?.system?.equipped !== true;
}
export function isNaturallyTwoHandedItem(item) {
    if (!item)
        return false;
    if (requiresAmmunition(item))
        return false;
    const sys = item.system || {};
    if (Number(sys.hands) >= 2)
        return true;
    if (sys.twoHanded === true)
        return true;
    const profile = String(sys.baseProfile || '');
    return profile === 'twoHandedWeapon' || profile === 'twoHandedWeaponRanged';
}
export function isVersatileItem(item) {
    const innates = Array.isArray(item?.system?.innateAbilities) ? item.system.innateAbilities : [];
    return innates.some((a) => /versatile/i.test(String(a)));
}
export function canMarkTwoHandedGrip(item) {
    return isNaturallyTwoHandedItem(item) || isVersatileItem(item);
}
export function getItemEquipmentFlags(item) {
    if (typeof item?.getFlag === 'function') {
        return { ...(item.getFlag('mastery-system', 'equipment') || {}) };
    }
    return { ...(item?.flags?.['mastery-system']?.equipment || {}) };
}
export function getItemInHandSlot(actor, slotKey) {
    const items = collectItems(actor);
    for (const it of items) {
        const flags = getItemEquipmentFlags(it);
        if (flags.slot === slotKey)
            return it;
    }
    if (slotKey === 'mainhand') {
        return items.find((it) => it.type === 'weapon' && it.system?.equipped === true) ?? null;
    }
    if (slotKey === 'offhand') {
        return items.find((it) => it.type === 'shield' && it.system?.equipped === true) ?? null;
    }
    return null;
}
export function readHandsFromEquippedItems(actor) {
    const main = getItemInHandSlot(actor, 'mainhand');
    const off = getItemInHandSlot(actor, 'offhand');
    const mainId = main?.id ? String(main.id) : null;
    if (main && isNaturallyTwoHandedItem(main)) {
        return { mainhand: mainId, offhand: mainId };
    }
    const offId = off?.id ? String(off.id) : null;
    if (mainId && getItemEquipmentFlags(main).twoHanded === true && !requiresAmmunition(main)) {
        return { mainhand: mainId, offhand: mainId };
    }
    if (mainId && offId === mainId && !requiresAmmunition(main)) {
        return { mainhand: mainId, offhand: mainId };
    }
    return { mainhand: mainId, offhand: offId };
}
export function isInitializedWeaponSets(raw) {
    if (!raw || typeof raw !== 'object')
        return false;
    const s = raw;
    if (s.schemaVersion !== WEAPON_SETS_SCHEMA)
        return false;
    const active = Math.floor(Number(s.active) || 0);
    if (active < 1)
        return false;
    if (!s.sets || typeof s.sets !== 'object')
        return false;
    if (!s.sets[1])
        return false;
    return true;
}
/** Normalize count/active and ensure every slot 1..count exists. */
export function normalizeWeaponSetsState(state) {
    const count = weaponSetCount(state);
    const sets = {};
    for (let i = 1; i <= count; i++) {
        const hands = state.sets?.[i] || emptyHands();
        sets[i] = {
            mainhand: hands.mainhand ? String(hands.mainhand) : null,
            offhand: hands.offhand ? String(hands.offhand) : null,
        };
    }
    let active = Math.floor(Number(state.active) || 1);
    if (active < 1 || active > count)
        active = 1;
    return {
        schemaVersion: WEAPON_SETS_SCHEMA,
        active,
        stowed: state.stowed === true,
        count,
        sets,
    };
}
export function pruneWeaponSetRefs(state, validIds) {
    const clean = (hands) => ({
        mainhand: hands.mainhand && validIds.has(hands.mainhand) ? hands.mainhand : null,
        offhand: hands.offhand && validIds.has(hands.offhand) ? hands.offhand : null,
    });
    const base = normalizeWeaponSetsState(state);
    const sets = {};
    for (const index of listWeaponSetIndexes(base)) {
        sets[index] = clean(base.sets[index] || emptyHands());
    }
    return { ...base, sets };
}
export function buildInitialWeaponSets(currentHands) {
    return normalizeWeaponSetsState({
        schemaVersion: WEAPON_SETS_SCHEMA,
        active: 1,
        stowed: false,
        count: DEFAULT_WEAPON_SET_COUNT,
        sets: { 1: { ...currentHands }, 2: emptyHands() },
    });
}
export function resolveSwapTarget(active, requested, count = DEFAULT_WEAPON_SET_COUNT) {
    const n = Math.max(DEFAULT_WEAPON_SET_COUNT, Math.floor(Number(count) || DEFAULT_WEAPON_SET_COUNT));
    const target = requested != null && Number.isFinite(Number(requested))
        ? Math.floor(Number(requested))
        : active >= n
            ? 1
            : active + 1;
    if (target < 1 || target > n)
        return null;
    if (target === active)
        return null;
    return target;
}
function validItemIds(actor) {
    return new Set(collectItems(actor).map((it) => String(it.id)).filter(Boolean));
}
function readStoredState(actor) {
    if (typeof actor?.getFlag === 'function') {
        return actor.getFlag('mastery-system', WEAPON_SETS_FLAG);
    }
    return actor?.flags?.['mastery-system']?.[WEAPON_SETS_FLAG];
}
export function peekWeaponSets(actor) {
    const raw = readStoredState(actor);
    if (isInitializedWeaponSets(raw)) {
        return pruneWeaponSetRefs(raw, validItemIds(actor));
    }
    return buildInitialWeaponSets(readHandsFromEquippedItems(actor));
}
export async function persistWeaponSets(actor, state) {
    const next = pruneWeaponSetRefs(normalizeWeaponSetsState(state), validItemIds(actor));
    if (typeof actor.update === 'function') {
        await actor.update({ [`flags.mastery-system.${WEAPON_SETS_FLAG}`]: next });
        return;
    }
    if (typeof actor.setFlag === 'function') {
        if (typeof actor.unsetFlag === 'function' && readStoredState(actor)) {
            try {
                await actor.unsetFlag('mastery-system', WEAPON_SETS_FLAG);
            }
            catch {
                /* replace via setFlag */
            }
        }
        await actor.setFlag('mastery-system', WEAPON_SETS_FLAG, next);
    }
}
export async function ensureWeaponSets(actor) {
    const raw = readStoredState(actor);
    if (isInitializedWeaponSets(raw)) {
        try {
            await migrateActorAmmunition(actor);
        }
        catch {
            /* field repair is best-effort */
        }
        const pruned = pruneWeaponSetRefs(raw, validItemIds(actor));
        const normalized = {
            ...pruned,
            sets: Object.fromEntries(listWeaponSetIndexes(pruned).map((index) => [
                index,
                normalizeAmmoWeaponSetHands(actor, pruned.sets[index] || emptyHands()),
            ])),
        };
        const countChanged = weaponSetCount(normalized) !== weaponSetCount(raw) || raw.count == null;
        let handsChanged = false;
        for (const index of listWeaponSetIndexes(normalized)) {
            if (!handsEqual(normalized.sets[index], raw.sets?.[index])) {
                handsChanged = true;
                break;
            }
        }
        if (countChanged || handsChanged || normalized.active !== raw.active) {
            await persistWeaponSets(actor, normalized);
        }
        return normalized;
    }
    const initial = buildInitialWeaponSets(readHandsFromEquippedItems(actor));
    await persistWeaponSets(actor, initial);
    return initial;
}
export async function pruneDeletedWeaponSetRefs(actor) {
    const raw = readStoredState(actor);
    if (!isInitializedWeaponSets(raw))
        return null;
    const pruned = pruneWeaponSetRefs(raw, validItemIds(actor));
    let changed = weaponSetCount(pruned) !== weaponSetCount(raw) || pruned.active !== raw.active;
    if (!changed) {
        for (const index of listWeaponSetIndexes(pruned)) {
            if (!handsEqual(pruned.sets[index], raw.sets?.[index])) {
                changed = true;
                break;
            }
        }
    }
    if (changed)
        await persistWeaponSets(actor, pruned);
    return pruned;
}
/** GM: append one empty Weaponslot (III, IV, …). */
export async function addWeaponSetSlot(actor) {
    if (!actor)
        return null;
    if (typeof globalThis.game !== 'undefined' && !isGameMaster()) {
        globalThis.ui?.notifications?.warn?.(loc('addDenied', 'Only the GM can add Weaponslots.'));
        return null;
    }
    const state = await ensureWeaponSets(actor);
    const count = weaponSetCount(state);
    if (count >= MAX_WEAPON_SET_COUNT) {
        globalThis.ui?.notifications?.warn?.(loc('addMax', `At most ${MAX_WEAPON_SET_COUNT} Weaponslots.`));
        return state;
    }
    const next = normalizeWeaponSetsState({
        ...state,
        count: count + 1,
        sets: { ...state.sets, [count + 1]: emptyHands() },
    });
    await persistWeaponSets(actor, next);
    await refreshWeaponSetSurfaces(actor);
    return next;
}
export async function syncActiveWeaponSetFromHands(actor) {
    if (swapLocks.has(actorKey(actor)))
        return peekWeaponSets(actor);
    const state = await ensureWeaponSets(actor);
    const hands = readHandsFromEquippedItems(actor);
    const handsEmpty = !hands.mainhand && !hands.offhand;
    if (state.stowed && handsEmpty)
        return state;
    const next = {
        ...state,
        stowed: false,
        sets: {
            ...state.sets,
            [state.active]: hands,
        },
    };
    await persistWeaponSets(actor, next);
    return next;
}
function equipmentUpdate(item, patch) {
    const flags = getItemEquipmentFlags(item);
    const next = {
        ...flags,
        container: flags.container || 'inventory',
        band: flags.band || 'not',
        slot: patch.slot,
    };
    if (patch.twoHanded)
        next.twoHanded = true;
    else
        delete next.twoHanded;
    if (patch.prepared)
        next.weaponSetPrepared = true;
    else
        delete next.weaponSetPrepared;
    delete next.grid;
    delete next.keepInventoryGrid;
    return {
        _id: item.id,
        'flags.mastery-system.equipment': next,
        'system.equipped': patch.equipped,
    };
}
export async function applyWeaponSetHands(actor, set) {
    const items = collectItems(actor);
    const byId = new Map(items.map((it) => [String(it.id), it]));
    const desiredMain = set.mainhand && byId.get(set.mainhand) ? set.mainhand : null;
    const desiredOff = set.offhand && byId.get(set.offhand) ? set.offhand : null;
    const twoHanded = !!(desiredMain && desiredMain === desiredOff);
    const desiredIds = new Set();
    if (desiredMain)
        desiredIds.add(desiredMain);
    if (desiredOff)
        desiredIds.add(desiredOff);
    const updates = [];
    const seen = new Set();
    const queue = (item, patch) => {
        const id = String(item.id);
        if (seen.has(id))
            return;
        seen.add(id);
        updates.push(equipmentUpdate(item, patch));
    };
    const currentMain = getItemInHandSlot(actor, 'mainhand');
    const currentOff = getItemInHandSlot(actor, 'offhand');
    for (const held of [currentMain, currentOff]) {
        if (!held?.id)
            continue;
        const id = String(held.id);
        if (desiredIds.has(id))
            continue;
        if (isEchoBoundArtifact(held))
            continue;
        queue(held, { slot: null, equipped: false, twoHanded: false, prepared: true });
    }
    if (desiredMain) {
        const item = byId.get(desiredMain);
        if (item)
            queue(item, { slot: 'mainhand', equipped: true, twoHanded });
    }
    if (desiredOff && !twoHanded) {
        const item = byId.get(desiredOff);
        if (item)
            queue(item, { slot: 'offhand', equipped: true, twoHanded: false });
    }
    if (!updates.length)
        return;
    if (typeof actor.updateEmbeddedDocuments === 'function') {
        await actor.updateEmbeddedDocuments('Item', updates);
        return;
    }
    for (const upd of updates) {
        const item = byId.get(String(upd._id));
        if (item && typeof item.update === 'function') {
            const { _id, ...rest } = upd;
            void _id;
            await item.update(rest);
        }
    }
}
async function refreshWeaponSetSurfaces(actor) {
    try {
        actor.prepareDerivedData?.();
    }
    catch {
        /* derived refresh is best-effort */
    }
    try {
        actor.sheet?.render?.(false);
    }
    catch {
        /* ignore */
    }
    try {
        const { refreshRadialMenuActionLabelsIfOpenForActor } = await import('../token-radial-menu.js');
        await refreshRadialMenuActionLabelsIfOpenForActor(actor);
    }
    catch {
        /* radial may be closed */
    }
    try {
        globalThis.Hooks?.callAll?.('masterySystem.weaponSetsChanged', { actorId: actor?.id });
    }
    catch {
        /* ignore */
    }
}
function itemById(actor, id) {
    if (!id)
        return null;
    return collectItems(actor).find((it) => String(it.id) === String(id)) ?? null;
}
function cleanItemName(item) {
    return String(item?.name || 'Weapon')
        .replace(/\s*-\s*Level\s+\d+-\d+\s*$/i, '')
        .trim();
}
/** Short label for one prepared set: weapon names, or empty hands. */
export function describeWeaponSetHands(actor, hands) {
    const set = hands || emptyHands();
    const main = itemById(actor, set.mainhand);
    const off = itemById(actor, set.offhand);
    if (!main && !off)
        return loc('emptyHands', 'empty');
    if (main && set.mainhand && set.mainhand === set.offhand) {
        return `${cleanItemName(main)} (${loc('bothHands', 'both hands')})`;
    }
    const parts = [];
    if (main)
        parts.push(cleanItemName(main));
    if (off && off !== main)
        parts.push(cleanItemName(off));
    return parts.join(' + ') || loc('emptyHands', 'empty');
}
/** What Weapon Swap will do with the sets as they are stored right now. */
export function describeWeaponSwap(actor) {
    const state = peekWeaponSets(actor);
    const count = weaponSetCount(state);
    const next = state.active >= count ? 1 : state.active + 1;
    const from = describeWeaponSetHands(actor, state.sets[state.active]);
    const to = describeWeaponSetHands(actor, state.sets[next]);
    const fromN = weaponSetRoman(state.active);
    const toN = weaponSetRoman(next);
    const formatted = globalThis.game?.i18n?.format?.('MASTERY.weaponSets.swapDetail', {
        fromN,
        from,
        toN,
        to,
    });
    const line = formatted && formatted !== 'MASTERY.weaponSets.swapDetail'
        ? formatted
        : `Set ${fromN}: ${from} → Set ${toN}: ${to}. Free anytime.`;
    return { active: state.active, next, from, to, line };
}
function setChoice(actor, state, index) {
    const summary = describeWeaponSetHands(actor, state.sets[index]);
    const active = state.stowed !== true && state.active === index;
    const roman = weaponSetRoman(index);
    const name = active
        ? fmt('choiceWearing', { n: roman, hands: summary }, `Wearing · Set ${roman}: ${summary}`)
        : fmt('choiceSwitch', { n: roman, hands: summary }, `Set ${roman}: ${summary}`);
    const description = active
        ? fmt('choiceWearingDetail', { n: roman, hands: summary }, `Wearing this. Set ${roman}: ${summary}.`)
        : fmt('choiceSwitchDetail', { n: roman, hands: summary }, `Switch to Set ${roman}: ${summary}. Free anytime.`);
    return { target: index, shortLabel: roman, summary, name, description, active };
}
function unarmedChoice(state) {
    const active = state.stowed === true;
    const summary = loc('stowSummary', 'Stow weapons and fight unarmed');
    return {
        target: 'unarmed',
        shortLabel: loc('stowName', 'Fists'),
        summary,
        name: active ? loc('stowWearing', 'Wearing · Fists') : loc('stowName', 'Fists'),
        description: active
            ? loc('stowWearingDetail', 'Wearing this. Unarmed.')
            : loc('stowDetail', 'Stow weapons and fight unarmed. All Weaponslots stay saved. Free anytime.'),
        active,
    };
}
/**
 * Radial / chat: every prepared Weaponslot (even empty), then Fists.
 * Empty slots stay visible so you can switch onto them and equip mid-fight.
 */
export function listWeaponSwapChoices(actor) {
    const state = peekWeaponSets(actor);
    const indexes = listWeaponSetIndexes(state);
    const fists = unarmedChoice(state);
    if (state.stowed) {
        return [fists, ...indexes.map((index) => setChoice(actor, state, index))];
    }
    const worn = indexes
        .filter((index) => index === state.active)
        .map((index) => setChoice(actor, state, index));
    const others = indexes
        .filter((index) => index !== state.active)
        .map((index) => setChoice(actor, state, index));
    return [...worn, ...others, fists];
}
/**
 * Sheet / paperdoll: every prepared Weaponslot (I, II, …), including empty ones.
 * Unarmed is not a paperdoll slot — it stays on the radial menu.
 */
export function listEquipmentWeaponSetChoices(actor) {
    const state = peekWeaponSets(actor);
    return listWeaponSetIndexes(state).map((index) => setChoice(actor, state, index));
}
export function parseWeaponSwapTarget(raw) {
    if (raw === 'unarmed')
        return 'unarmed';
    const n = Math.floor(Number(raw) || 0);
    if (n >= 1 && n <= MAX_WEAPON_SET_COUNT)
        return n;
    return null;
}
function fmt(key, data, fallback) {
    const formatted = globalThis.game?.i18n?.format?.(`MASTERY.weaponSets.${key}`, data);
    return formatted && formatted !== `MASTERY.weaponSets.${key}` ? formatted : fallback;
}
function profileFromItem(item) {
    const sys = item?.system || {};
    if (item?.type === 'artifact') {
        const display = formatArtifactWeaponRangeDisplay(sys.artifactWeapon, sys.baseProfile);
        const damage = String(sys.artifactWeapon?.damage || '1d8');
        if (display.kind === 'ranged') {
            return { attackType: 'ranged', rangeM: Math.max(8, display.meters || 8), damage };
        }
        return { attackType: 'melee', rangeM: 2, damage };
    }
    const innates = Array.isArray(sys.innateAbilities) ? sys.innateAbilities.map(String) : [];
    const rangedInnate = innates.find((a) => /\b(ranged|thrown)\b/i.test(a));
    const damage = String(sys.damage || sys.weaponDamage || '1d8');
    if (sys.weaponType === 'ranged' || rangedInnate) {
        const match = String(rangedInnate || sys.range || '').match(/(\d+)/);
        const meters = match ? parseInt(match[1], 10) : 12;
        return { attackType: 'ranged', rangeM: Math.max(8, meters), damage };
    }
    return { attackType: 'melee', rangeM: 2, damage };
}
/**
 * What Basic Attack rolls right now: the active set's main-hand weapon, or
 * Unarmed 1d8 when that set is empty.
 */
export function describeActiveWeaponProfile(actor) {
    const state = peekWeaponSets(actor);
    if (state.stowed) {
        const fists = loc('stowName', 'Fists');
        return {
            unarmed: true,
            name: fists,
            damage: '1d8',
            attackType: 'melee',
            rangeM: 2,
            summary: `${fists} · 1d8 + MR × 2d8. No weapon Specials.`,
        };
    }
    const hands = state.sets[state.active] || emptyHands();
    const main = itemById(actor, hands.mainhand);
    const carriesWeapon = !!main &&
        (main.type === 'weapon' ||
            main.type === 'artifact' && (main.system?.artifactWeapon || main.system?.artifactKind === 'weapon'));
    if (!carriesWeapon) {
        const fists = loc('stowName', 'Fists');
        return {
            unarmed: true,
            name: fists,
            damage: '1d8',
            attackType: 'melee',
            rangeM: 2,
            summary: `${fists} · 1d8 + MR × 2d8. No weapon Specials.`,
        };
    }
    const spec = profileFromItem(main);
    const name = cleanItemName(main);
    return {
        unarmed: false,
        name,
        damage: spec.damage,
        attackType: spec.attackType,
        rangeM: spec.rangeM,
        summary: `${name} · ${spec.damage} + MR × 2d8`,
    };
}
/**
 * Shared Weapon Swap. Sheet buttons and the radial pass a target:
 * set index (1..N) or `unarmed` (stow all sets and fight with fists).
 * `target` omitted = cycle to the next prepared slot.
 * Always free (in or out of combat) so loadouts can be fixed anytime.
 */
export async function swapWeaponSet(actor, target, options) {
    if (!actor)
        return { ok: false, reason: 'apply-failed' };
    const key = actorKey(actor);
    if (key && swapLocks.has(key))
        return { ok: false, reason: 'busy' };
    if (key)
        swapLocks.add(key);
    try {
        if (typeof globalThis.game !== 'undefined' && !canCurrentUserUpdateDocument(actor)) {
            return { ok: false, reason: 'permission' };
        }
        const state = await ensureWeaponSets(actor);
        const count = weaponSetCount(state);
        let next;
        if (target === 'unarmed') {
            next = 'unarmed';
        }
        else if (typeof target === 'number' && target >= 1 && target <= count) {
            next = target;
        }
        else {
            next = resolveSwapTarget(state.active, undefined, count) ?? (state.active >= count ? 1 : state.active + 1);
        }
        const alreadyThere = next === 'unarmed' ? state.stowed === true : state.stowed !== true && state.active === next;
        if (alreadyThere) {
            return { ok: true, swapped: false, active: state.active };
        }
        const nextActive = next === 'unarmed' ? state.active : next;
        const nextState = {
            ...state,
            active: nextActive,
            stowed: next === 'unarmed',
        };
        const destination = next === 'unarmed'
            ? loc('stowedNow', 'Weapons stowed — unarmed.')
            : `Set ${weaponSetRoman(next)}: ${describeWeaponSetHands(actor, state.sets[next])}`;
        try {
            await persistWeaponSets(actor, nextState);
            await applyWeaponSetHands(actor, next === 'unarmed' ? emptyHands() : state.sets[next] || emptyHands());
        }
        catch (err) {
            console.warn('Mastery System | Weapon set apply failed', err);
            return { ok: false, reason: 'apply-failed' };
        }
        await refreshWeaponSetSurfaces(actor);
        try {
            const ChatMessage = globalThis.ChatMessage;
            if (!options?.quiet && typeof ChatMessage?.create === 'function') {
                const note = loc('swappedFree', 'Free anytime.');
                await ChatMessage.create({
                    speaker: typeof ChatMessage.getSpeaker === 'function' ? ChatMessage.getSpeaker({ actor }) : undefined,
                    content: `<p><strong>${loc('actionName', 'Weapon Swap')}</strong> — ${destination} ${note}</p>`,
                });
            }
        }
        catch (err) {
            console.warn('Mastery System | Weapon swap chat note failed', err);
        }
        return { ok: true, swapped: true, active: nextActive, spentMovement: false };
    }
    finally {
        if (key)
            swapLocks.delete(key);
    }
}
/** Test helper — do not use from production UI. */
export function resetWeaponSetLocks() {
    swapLocks.clear();
}
//# sourceMappingURL=weapon-sets.js.map