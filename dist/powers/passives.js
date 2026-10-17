/**
 * Passive Abilities System
 * Handles passive ability slots, activation, and management
 */
import { findCombatantByActorId, readCombatantSetupStep } from '../combat/encounter-setup-flags.js';
import { patchForcedDelete } from '../utils/foundry-v14.js';
import { getRulesMasteryRank } from '../utils/mastery-rank-sync.js';
import { resolvePowerCategoryFromItem } from '../utils/power-catalog.js';
import { resolvePowerMechanics } from '../utils/power-mechanics.js';
import { summarizePowerMechanics } from '../utils/power-mechanics-summary.js';
import { resolvePowerSheetLevelDisplay } from '../utils/power-rendering.js';
/**
 * Mastery Rank at which each passive slot unlocks (Players Guide / passives.md).
 * MR1→1, MR2→2, MR3–4→3, MR5–6→4, MR7→5, MR8→6.
 */
export const PASSIVE_SLOT_UNLOCK_RANKS = [1, 2, 3, 5, 7, 8];
export const MAX_PASSIVE_SLOTS = PASSIVE_SLOT_UNLOCK_RANKS.length;
/** How many passive slots are available at the given Mastery Rank. */
export function getPassiveSlotCountForMasteryRank(masteryRank) {
    const mr = Math.max(1, Math.floor(Number(masteryRank) || 1));
    let count = 0;
    for (const unlock of PASSIVE_SLOT_UNLOCK_RANKS) {
        if (mr >= unlock)
            count++;
        else
            break;
    }
    return count;
}
/** Mastery Rank required to unlock a slot index (0-based), or null if out of range. */
export function getPassiveSlotUnlockRank(slotIndex) {
    return PASSIVE_SLOT_UNLOCK_RANKS[slotIndex] ?? null;
}
/**
 * All six Passive Slots for an actor (locked ones included so the UI can show
 * unlock ranks). Combat effects and auto-fill should skip `locked` slots.
 */
export function getPassiveSlots(actor) {
    const system = actor.system;
    const passives = system.passives || {};
    const masteryRank = getRulesMasteryRank(actor);
    const unlocked = getPassiveSlotCountForMasteryRank(masteryRank);
    const slots = [];
    for (let i = 0; i < MAX_PASSIVE_SLOTS; i++) {
        const unlockMasteryRank = getPassiveSlotUnlockRank(i) ?? 1;
        const locked = i >= unlocked;
        const slotData = passives[`slot${i}`] || {};
        const raw = slotData.passive;
        // Deleted power items leave ghost slot data — treat as empty so drops work.
        const stale = !locked &&
            !!raw?.id &&
            !findPassivePowerItem(actor, String(raw.id));
        const hasPassive = !locked && !stale && !!(raw && (raw.id || raw.name));
        slots.push({
            slotIndex: i,
            passive: hasPassive ? raw : null,
            active: hasPassive && !!slotData.active,
            unlockMasteryRank,
            locked,
        });
    }
    return slots;
}
/**
 * Clear combat Passive slots whose power item was deleted (ghost slots block drops).
 * Safe to call often; no-ops when nothing is stale.
 */
export async function pruneStalePassiveSlots(actor) {
    if (!actor)
        return 0;
    const system = actor.system || {};
    const passives = system.passives || {};
    const patch = {};
    let cleared = 0;
    for (let i = 0; i < MAX_PASSIVE_SLOTS; i++) {
        const slotKey = `slot${i}`;
        const raw = passives[slotKey]?.passive;
        if (!raw?.id)
            continue;
        if (findPassivePowerItem(actor, String(raw.id)))
            continue;
        patchForcedDelete(patch, `system.passives.${slotKey}`);
        cleared += 1;
    }
    if (cleared > 0) {
        try {
            await actor.update(patch);
        }
        catch (err) {
            console.warn('Mastery System | pruneStalePassiveSlots failed', err);
            return 0;
        }
    }
    return cleared;
}
/** Unlocked Passive Slots only (usable at current Mastery Rank). */
export function getUnlockedPassiveSlots(actor) {
    return getPassiveSlots(actor).filter((s) => !s.locked);
}
/** Plain combat-facing blurb for a Passive power item (Available + slotted). */
export function formatPassiveDescription(item) {
    if (!item)
        return '';
    try {
        const mech = resolvePowerMechanics(item);
        const sum = summarizePowerMechanics(mech);
        if (sum)
            return sum;
    }
    catch {
        /* ignore */
    }
    try {
        const display = resolvePowerSheetLevelDisplay(item.system);
        const effect = String(display.effect || '')
            .replace(/\*\*/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        if (effect && effect !== '—')
            return effect;
    }
    catch {
        /* ignore */
    }
    const sys = item.system || {};
    const raw = String(sys.effect || sys.description || sys.fluff || '')
        .replace(/\*\*/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    if (raw && raw !== '—')
        return raw;
    return '';
}
function actorItemList(actor) {
    const raw = actor.items;
    if (!raw)
        return [];
    if (Array.isArray(raw))
        return raw;
    if (Array.isArray(raw.contents))
        return raw.contents;
    if (typeof raw[Symbol.iterator] === 'function')
        return [...raw];
    return [];
}
/**
 * World prototype + unlinked token actor often diverge: GM may grant a Passive on
 * the sheet while Combat Select Passives reads the other. Union both.
 */
export function passiveItemSourceActors(actor) {
    if (!actor)
        return [];
    const sources = [];
    const seen = new Set();
    const seenObj = new WeakSet();
    const add = (a) => {
        if (!a)
            return;
        if (typeof a === 'object') {
            if (seenObj.has(a))
                return;
            seenObj.add(a);
        }
        const key = String(a.uuid ?? a.id ?? '');
        // Actors without id/uuid (tests / transient sheets) still contribute items.
        if (key) {
            if (seen.has(key))
                return;
            seen.add(key);
        }
        sources.push(a);
    };
    add(actor);
    const anyA = actor;
    const g = globalThis;
    const worldId = String(anyA.isToken
        ? (anyA.token?.actorId ?? anyA.token?.document?.actorId ?? anyA.id ?? '')
        : (anyA.id ?? ''));
    if (anyA.isToken && worldId) {
        add(g.game?.actors?.get?.(worldId));
    }
    const considerTokenDoc = (doc) => {
        if (!doc || doc.actorLink === true)
            return;
        if (worldId && String(doc.actorId ?? '') !== worldId)
            return;
        // Prefer the synthetic actor on the placeable; fall back to TokenDocument.actor.
        const placeable = doc.object ?? doc;
        add(placeable?.actor ?? doc.actor);
    };
    const placeables = g.canvas?.tokens?.placeables;
    if (Array.isArray(placeables)) {
        for (const t of placeables)
            considerTokenDoc(t?.document ?? t);
    }
    const combatants = g.game?.combat?.combatants;
    const bag = combatants
        ? Array.isArray(combatants)
            ? combatants
            : Array.isArray(combatants.contents)
                ? combatants.contents
                : typeof combatants[Symbol.iterator] === 'function'
                    ? [...combatants]
                    : []
        : [];
    for (const c of bag) {
        const tok = c?.token;
        if (tok)
            considerTokenDoc(tok.document ?? tok);
        // Combatant.actor may already be the unlinked synthetic copy — only same world.
        const ca = c?.actor;
        if (!ca?.isToken)
            continue;
        const caWorld = String(c?.actorId ??
            ca.token?.actorId ??
            ca.token?.document?.actorId ??
            '');
        if (worldId && caWorld !== worldId)
            continue;
        add(ca);
    }
    return sources;
}
/** True when a power item is a Passive (category, powerType, or catalog template). */
export function isPassivePowerItem(item) {
    if (!item || item.type !== 'power')
        return false;
    const sys = item.system || {};
    const tags = Array.isArray(sys.tags) ? sys.tags.map((t) => String(t).toLowerCase()) : [];
    // Artifact meta (Empowerment / Extension) are not Combat Passive Slot picks.
    if (tags.includes('artifact-only'))
        return false;
    const tid = String(sys.templateId || '').trim().toLowerCase();
    if (tid.startsWith('empower-buff-') || tid.startsWith('extend-buff-'))
        return false;
    if (sys.category === 'passive')
        return true;
    if (sys.powerType === 'passive')
        return true;
    if (tid.startsWith('passive-'))
        return true;
    // Match Powers-tab grouping (legacy category / powerType shapes).
    return resolvePowerCategoryFromItem(item) === 'passive';
}
function passiveAbilityFromItem(item) {
    const itemSystem = item.system || {};
    const name = String(item.name || 'Unknown Passive');
    // Strip category prefix for compact combat UI ("Passive: Armor" → "Armor").
    const shortName = name.replace(/^Passive:\s*/i, '').trim() || name;
    return {
        id: String(item.id || item._id || item.name || ''),
        name: shortName,
        description: formatPassiveDescription(item),
        category: itemSystem.tree || itemSystem.category || 'General',
        level: itemSystem.level || itemSystem.rank || 1,
    };
}
/** Passive powers owned by the actor (sheet Passives + combat Available list). */
export function getAvailablePassives(actor) {
    const byId = new Map();
    for (const source of passiveItemSourceActors(actor)) {
        for (const item of actorItemList(source)) {
            if (!isPassivePowerItem(item))
                continue;
            const row = passiveAbilityFromItem(item);
            if (!row.id)
                continue;
            if (!byId.has(row.id))
                byId.set(row.id, row);
        }
    }
    return [...byId.values()];
}
/** Find a Passive power item on the actor or its world/token counterpart. */
export function findPassivePowerItem(actor, passiveId) {
    const want = String(passiveId || '');
    if (!want)
        return null;
    for (const source of passiveItemSourceActors(actor)) {
        for (const item of actorItemList(source)) {
            if (!isPassivePowerItem(item))
                continue;
            if (String(item.id) === want ||
                String(item._id) === want ||
                String(item.name) === want) {
                return item;
            }
        }
    }
    return null;
}
/**
 * Item ids (or legacy fallbacks stored on slotted passive) already placed in a passive slot.
 * Used so the combat passive UI still lists other passives from the same tree.
 */
export function getSlottedPassiveIds(actor) {
    const ids = new Set();
    for (const slot of getPassiveSlots(actor)) {
        const pid = slot.passive?.id;
        if (pid != null && String(pid).length > 0) {
            ids.add(String(pid));
        }
    }
    return ids;
}
/**
 * Slot a passive ability into a slot
 */
export async function slotPassive(actor, slotIndex, passiveId) {
    const unlockAt = getPassiveSlotUnlockRank(slotIndex);
    if (unlockAt == null) {
        ui.notifications?.warn('That Passive Slot does not exist.');
        return;
    }
    const masteryRank = getRulesMasteryRank(actor);
    if (masteryRank < unlockAt) {
        ui.notifications?.warn(`Passive Slot ${slotIndex + 1} unlocks at Mastery Rank ${unlockAt}.`);
        return;
    }
    const system = actor.system;
    if (!system.passives) {
        system.passives = {};
    }
    const slotKey = `slot${slotIndex}`;
    if (!system.passives[slotKey]) {
        system.passives[slotKey] = {};
    }
    const passiveItem = findPassivePowerItem(actor, passiveId);
    if (passiveItem) {
        const itemSystem = passiveItem.system || {};
        const templateId = String(itemSystem.templateId || '');
        const specialChoice = String(itemSystem.chosenSpecial?.key || itemSystem.specialChoice || '')
            .trim()
            .toLowerCase();
        if (templateId === 'passive-special-aura') {
            const { SPECIAL_AURA_ELIGIBLE, SPECIAL_AURA_RADIUS_M } = await import('../combat/aura-modifiers.js');
            const level = Math.floor(Number(itemSystem.level || itemSystem.rank) || 1);
            const radius = level >= 1 && level <= 16 ? SPECIAL_AURA_RADIUS_M[level - 1] : 0;
            if (!radius || !SPECIAL_AURA_ELIGIBLE.has(specialChoice)) {
                ui.notifications?.warn('Special Aura needs one eligible diminishing Special and an available Power Level.');
                return;
            }
        }
        const row = passiveAbilityFromItem(passiveItem);
        system.passives[slotKey].passive = {
            id: row.id,
            name: row.name,
            description: row.description,
            category: row.category,
            level: row.level,
            templateId,
            specialChoice,
        };
    }
    else {
        ui.notifications?.warn(`Could not find Passive "${passiveId}" on this character (check world vs token actor items).`);
        system.passives[slotKey].passive = {
            id: passiveId,
            name: passiveId,
            description: '',
            category: 'General',
        };
    }
    // Slotted passives are always treated as active (no separate activate step).
    system.passives[slotKey].active = true;
    await actor.update({ 'system.passives': system.passives });
}
/**
 * Activate or deactivate a passive in a slot
 */
export async function activatePassive(actor, slotIndex) {
    const system = actor.system;
    if (!system.passives) {
        system.passives = {};
    }
    const slotKey = `slot${slotIndex}`;
    if (!system.passives[slotKey] || !system.passives[slotKey].passive) {
        return; // Can't activate empty slot
    }
    const masteryRank = getRulesMasteryRank(actor);
    const maxActive = getPassiveSlotCountForMasteryRank(masteryRank);
    const activeCount = getActivePassiveCount(actor);
    // Toggle active state
    const currentActive = system.passives[slotKey].active || false;
    if (!currentActive && activeCount >= maxActive) {
        ui.notifications.warn(`You can only have ${maxActive} active passives at Mastery Rank ${masteryRank}.`);
        return;
    }
    system.passives[slotKey].active = !currentActive;
    await actor.update({ 'system.passives': system.passives });
}
/**
 * Remove a passive from a slot
 */
export async function unslotPassive(actor, slotIndex) {
    const slotKey = `slot${slotIndex}`;
    // Foundry diffs drop `null` on object replace, so the old passive would stay.
    // V14+: ForcedDeletion; legacy: `-=slotN`.
    const patch = {};
    patchForcedDelete(patch, `system.passives.${slotKey}`);
    await actor.update(patch);
}
/**
 * Get count of active passives
 */
function getActivePassiveCount(actor) {
    const slots = getPassiveSlots(actor);
    return slots.filter(slot => slot.active && slot.passive).length;
}
function hashSeed(text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
        h ^= text.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}
function seededUnit(seed) {
    let t = seed >>> 0;
    return () => {
        t += 0x6d2b79f5;
        let r = Math.imul(t ^ (t >>> 15), 1 | t);
        r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
}
/**
 * Choose default passive ids for empty slots. Deterministic per `seed`
 * (normally the actor id) so the first fight does not reshuffle.
 */
export function pickDefaultPassiveIds(available, slotCount, seed) {
    const count = Math.max(0, Math.floor(Number(slotCount) || 0));
    const ids = [
        ...new Set(available
            .map((p) => String(p?.id ?? '').trim())
            .filter(Boolean)),
    ].sort((a, b) => a.localeCompare(b));
    if (count <= 0 || ids.length === 0)
        return [];
    if (ids.length <= count)
        return ids;
    const rng = seededUnit(hashSeed(String(seed || 'passives')));
    const shuffled = [...ids];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
        const j = Math.floor(rng() * (i + 1));
        const tmp = shuffled[i];
        shuffled[i] = shuffled[j];
        shuffled[j] = tmp;
    }
    return shuffled.slice(0, count);
}
/**
 * If the actor has no slotted passives yet, fill unlocked slots from known
 * passives (all of them when they fit; otherwise a stable random subset).
 * Already-slotted picks are the saved default and are left alone.
 */
export async function ensureDefaultPassiveSlots(actor) {
    await pruneStalePassiveSlots(actor);
    const unlocked = getUnlockedPassiveSlots(actor);
    if (unlocked.some((s) => s.passive)) {
        return unlocked.map((s) => String(s.passive?.id ?? '')).filter(Boolean);
    }
    const available = getAvailablePassives(actor);
    const picked = pickDefaultPassiveIds(available, unlocked.length, String(actor.id ?? actor.name ?? ''));
    for (let i = 0; i < picked.length; i += 1) {
        await slotPassive(actor, i, picked[i]);
    }
    return picked;
}
/** Stone Power `generic.exchangePassive` stores leftover mid-combat swaps here. */
export const EXCHANGE_PASSIVE_SWAPS_FLAG = 'exchangePassiveSwapsPending';
/**
 * Rainbow "pick passives" prompt only when a slot is still empty and there is
 * a passive left to put in it, or Exchange Passive paid a swap.
 * A full set (no third slot, or nothing left to assign) stays quiet.
 */
export function passiveSlotsHaveOpenChoice(slots, availablePassiveCount, pendingSwaps) {
    if (Math.max(0, Math.floor(pendingSwaps)) > 0)
        return true;
    const usable = slots.filter((slot) => !slot?.locked);
    const filled = usable.filter((slot) => slot?.passive).length;
    const empty = Math.max(0, usable.length - filled);
    const spare = Math.max(0, Math.floor(availablePassiveCount) - filled);
    return empty > 0 && spare > 0;
}
export function getPendingPassiveSwaps(actor) {
    if (!actor)
        return 0;
    return Math.max(0, Math.floor(Number(actor.getFlag?.('mastery-system', EXCHANGE_PASSIVE_SWAPS_FLAG) ?? 0) || 0));
}
export async function consumePendingPassiveSwap(actor) {
    const left = getPendingPassiveSwaps(actor);
    if (left <= 0)
        return 0;
    const next = left - 1;
    await actor.setFlag?.('mastery-system', EXCHANGE_PASSIVE_SWAPS_FLAG, next);
    return next;
}
/**
 * Round 1 (and prepare) is free. Later rounds stay locked unless Exchange
 * Passive (or leftover swap tokens) has been paid this fight.
 */
export function canEditEncounterPassives(combat, actor) {
    const round = Math.max(1, Math.floor(Number(combat?.round) || 1));
    if (round <= 1)
        return true;
    if (getPendingPassiveSwaps(actor) > 0)
        return true;
    const bag = combat?.combatants;
    const actorId = String(actor?.id ?? '');
    if (!combat || !bag || !actorId)
        return false;
    const combatant = findCombatantByActorId(combat, actorId);
    return readCombatantSetupStep(combatant, combat)?.passivesGmOpen === true;
}
//# sourceMappingURL=passives.js.map