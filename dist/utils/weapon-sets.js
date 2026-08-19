/**
 * Prepared weapon sets for the two hand slots, plus the shared Weapon Swap.
 *
 * Only the active set is mechanically equipped (`system.equipped` + slot flag).
 * Sets store item-id references — never duplicated items.
 */
import { consumeMovementAction, getActionEconomyActor, getAvailableMovementActions, isNormalMovementReplaced, refundMovementAction, } from '../combat/action-economy.js';
import { canCurrentUserUpdateDocument } from '../combat/combat-permissions.js';
import { actorParticipatesInActiveCombat } from './consumable-slots.js';
import { isEchoBoundArtifact } from './echo-artifact-equip.js';
import { keepsInventoryGridWhenEquipped, migrateActorAmmunition, normalizeAmmoWeaponSetHands, requiresAmmunition, } from './ammunition.js';
export const WEAPON_SWAP_ID = 'weapon-swap';
export const WEAPON_SETS_FLAG = 'weaponSets';
export const WEAPON_SETS_SCHEMA = 1;
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
        sets: { 1: emptyHands(), 2: emptyHands() },
    };
}
export function isTwoHandedSet(set) {
    return !!set.mainhand && set.mainhand === set.offhand;
}
export function weaponSetAssignedIds(state) {
    const ids = new Set();
    for (const hands of [state.sets[1], state.sets[2]]) {
        if (hands?.mainhand)
            ids.add(hands.mainhand);
        if (hands?.offhand)
            ids.add(hands.offhand);
    }
    return ids;
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
    if (s.active !== 1 && s.active !== 2)
        return false;
    if (!s.sets?.[1] || !s.sets?.[2])
        return false;
    return true;
}
export function pruneWeaponSetRefs(state, validIds) {
    const clean = (hands) => ({
        mainhand: hands.mainhand && validIds.has(hands.mainhand) ? hands.mainhand : null,
        offhand: hands.offhand && validIds.has(hands.offhand) ? hands.offhand : null,
    });
    return {
        schemaVersion: WEAPON_SETS_SCHEMA,
        active: state.active === 2 ? 2 : 1,
        sets: {
            1: clean(state.sets[1] || emptyHands()),
            2: clean(state.sets[2] || emptyHands()),
        },
    };
}
export function buildInitialWeaponSets(currentHands) {
    return {
        schemaVersion: WEAPON_SETS_SCHEMA,
        active: 1,
        sets: { 1: { ...currentHands }, 2: emptyHands() },
    };
}
export function resolveSwapTarget(active, requested) {
    const target = requested ?? (active === 1 ? 2 : 1);
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
    const next = pruneWeaponSetRefs(state, validItemIds(actor));
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
            sets: {
                1: normalizeAmmoWeaponSetHands(actor, pruned.sets[1]),
                2: normalizeAmmoWeaponSetHands(actor, pruned.sets[2]),
            },
        };
        const changed = normalized.sets[1].mainhand !== raw.sets[1].mainhand ||
            normalized.sets[1].offhand !== raw.sets[1].offhand ||
            normalized.sets[2].mainhand !== raw.sets[2].mainhand ||
            normalized.sets[2].offhand !== raw.sets[2].offhand;
        if (changed)
            await persistWeaponSets(actor, normalized);
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
    const changed = pruned.sets[1].mainhand !== raw.sets[1].mainhand ||
        pruned.sets[1].offhand !== raw.sets[1].offhand ||
        pruned.sets[2].mainhand !== raw.sets[2].mainhand ||
        pruned.sets[2].offhand !== raw.sets[2].offhand;
    if (changed)
        await persistWeaponSets(actor, pruned);
    return pruned;
}
export async function syncActiveWeaponSetFromHands(actor) {
    const state = await ensureWeaponSets(actor);
    const hands = readHandsFromEquippedItems(actor);
    const next = {
        ...state,
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
    if (keepsInventoryGridWhenEquipped(item) && !patch.prepared && patch.equipped && flags.grid) {
        next.grid = flags.grid;
        next.keepInventoryGrid = true;
    }
    else {
        delete next.grid;
        delete next.keepInventoryGrid;
    }
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
function activeCombat() {
    const combat = globalThis.game?.combat;
    return combat?.active ? combat : null;
}
/**
 * Shared Weapon Swap. Used by the [1]/[2] sheet switches and the movement action.
 * `target` omitted = toggle to the inactive set.
 */
export async function swapWeaponSet(actor, target) {
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
        const next = resolveSwapTarget(state.active, target);
        if (next == null) {
            return { ok: true, swapped: false, active: state.active };
        }
        const combat = activeCombat();
        const inCombat = !!combat && actorParticipatesInActiveCombat(actor);
        let spentMovement = false;
        const economyActor = (getActionEconomyActor(actor) ?? actor);
        if (inCombat) {
            if (isNormalMovementReplaced(economyActor, combat)) {
                globalThis.ui?.notifications?.warn(loc('movementReplaced', 'A Movement Power already replaced your normal Movement this round.'));
                return { ok: false, reason: 'no-movement' };
            }
            if (getAvailableMovementActions(economyActor, combat) <= 0) {
                globalThis.ui?.notifications?.warn(loc('noMovement', 'No Movement Action available to switch Weapon Sets.'));
                return { ok: false, reason: 'no-movement' };
            }
            const spent = await consumeMovementAction(economyActor, combat);
            if (!spent) {
                return { ok: false, reason: 'spend-failed' };
            }
            spentMovement = true;
        }
        try {
            await applyWeaponSetHands(actor, state.sets[next] || emptyHands());
            await persistWeaponSets(actor, { ...state, active: next });
        }
        catch (err) {
            console.warn('Mastery System | Weapon set apply failed', err);
            if (spentMovement) {
                try {
                    await refundMovementAction(economyActor, combat);
                }
                catch {
                    /* ignore */
                }
            }
            return { ok: false, reason: 'apply-failed' };
        }
        await refreshWeaponSetSurfaces(actor);
        return { ok: true, swapped: true, active: next, spentMovement };
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