/**
 * Per-character combat ledger of remaining Ready stones.
 *
 * Actor `system.stonePools.*.current` alone is not enough: world vs token
 * copies can disagree and `livePoolFields` used to take MAX, so spent stones
 * looked full again at Round 2. This flag is the combat source of truth for
 * how many Ready stones each pool still has.
 */
// Keys duplicated (not imported from action-economy) so this module can be
// imported synchronously from getStonePool without a circular init crash.
import { getActionEconomyActor } from '../combat/action-economy.js';
import { listStonePoolSyncActors } from './stone-pool-sync.js';
export const STONE_COMBAT_READY_FLAG = 'stoneCombatReady';
const POOL_KEYS = [
    'might',
    'agility',
    'vitality',
    'intellect',
    'resolve',
    'influence',
    'wits',
    'colorless',
];
function currentCombatId() {
    try {
        const combat = globalThis.game?.combat;
        if (!combat?.started)
            return '';
        return String(combat.id ?? '');
    }
    catch {
        return '';
    }
}
function readPoolCurrent(actor, attr) {
    return Math.max(0, Math.floor(Number(actor?.system?.stonePools?.[attr]?.current) || 0));
}
/** Most depleted live current across world/token copies (never MAX). */
export function minLivePoolCurrent(actor, attr) {
    let found = false;
    let min = Number.POSITIVE_INFINITY;
    try {
        for (const a of listStonePoolSyncActors(actor)) {
            const n = readPoolCurrent(a, attr);
            found = true;
            if (n < min)
                min = n;
        }
    }
    catch {
        /* canvas/game optional */
    }
    if (!found) {
        let owner = actor;
        try {
            owner = getActionEconomyActor(actor) ?? actor;
        }
        catch {
            owner = actor;
        }
        return readPoolCurrent(owner, attr);
    }
    return Number.isFinite(min) ? min : 0;
}
function readFlagFrom(actor) {
    if (!actor)
        return undefined;
    try {
        if (typeof actor.getFlag === 'function') {
            return actor.getFlag('mastery-system', STONE_COMBAT_READY_FLAG);
        }
    }
    catch {
        /* ignore */
    }
    return actor?.flags?.['mastery-system']?.[STONE_COMBAT_READY_FLAG];
}
export function readStoneCombatReady(actor, combatId) {
    const cid = String(combatId ?? currentCombatId() ?? '').trim();
    if (!cid)
        return null;
    let raw = readFlagFrom(actor);
    if (!raw || String(raw.combatId) !== cid) {
        try {
            const owner = getActionEconomyActor(actor);
            if (owner && owner !== actor)
                raw = readFlagFrom(owner);
        }
        catch {
            /* game/canvas optional in unit tests */
        }
    }
    if (!raw || String(raw.combatId) !== cid)
        return null;
    const pools = {};
    for (const [k, v] of Object.entries(raw.pools || {})) {
        pools[k] = Math.max(0, Math.floor(Number(v) || 0));
    }
    return { combatId: cid, pools };
}
/**
 * Remaining Ready for one pool while this combat's ledger is active.
 * Returns null when out of combat or no ledger yet (caller falls back to pools).
 */
export function combatReadyRemaining(actor, attr, combatId) {
    const ledger = readStoneCombatReady(actor, combatId);
    if (!ledger)
        return null;
    if (!Object.prototype.hasOwnProperty.call(ledger.pools, attr)) {
        // Ledger exists but this key was never seeded — treat as 0 only if other
        // pools exist; otherwise fall back so partial ledgers don't blank a pool.
        if (Object.keys(ledger.pools).length === 0)
            return null;
        return Math.max(0, Math.floor(Number(ledger.pools[attr]) || 0));
    }
    return Math.max(0, Math.floor(Number(ledger.pools[attr]) || 0));
}
export async function writeStoneCombatReady(actor, ledger) {
    let owner = actor;
    try {
        owner = getActionEconomyActor(actor) ?? actor;
    }
    catch {
        owner = actor;
    }
    if (!owner?.setFlag)
        return;
    const pools = {};
    for (const key of POOL_KEYS) {
        if (!Object.prototype.hasOwnProperty.call(ledger.pools, key))
            continue;
        pools[key] = Math.max(0, Math.floor(Number(ledger.pools[key]) || 0));
    }
    // Preserve any extra keys (future-proof).
    for (const [k, v] of Object.entries(ledger.pools || {})) {
        if (Object.prototype.hasOwnProperty.call(pools, k))
            continue;
        pools[k] = Math.max(0, Math.floor(Number(v) || 0));
    }
    await owner.setFlag('mastery-system', STONE_COMBAT_READY_FLAG, {
        combatId: String(ledger.combatId),
        pools,
    });
}
export async function clearStoneCombatReady(actor) {
    let owner = actor;
    try {
        owner = getActionEconomyActor(actor) ?? actor;
    }
    catch {
        owner = actor;
    }
    if (!owner)
        return;
    try {
        await owner.unsetFlag?.('mastery-system', STONE_COMBAT_READY_FLAG);
    }
    catch {
        try {
            await owner.setFlag?.('mastery-system', STONE_COMBAT_READY_FLAG, { combatId: '', pools: {} });
        }
        catch {
            /* ignore */
        }
    }
}
/** Snapshot remaining Ready from the most depleted live pools. */
export function snapshotStoneCombatReadyPools(actor) {
    const pools = {};
    for (const key of POOL_KEYS) {
        pools[key] = minLivePoolCurrent(actor, key);
    }
    return pools;
}
/**
 * Mirror ledger Ready values onto every world/token pool copy so a stale full
 * sibling cannot win the next Available read.
 */
export async function mirrorStoneCombatReadyToPools(actor, ledger) {
    for (const target of listStonePoolSyncActors(actor)) {
        const patch = {};
        for (const [attr, n] of Object.entries(ledger.pools || {})) {
            const want = Math.max(0, Math.floor(Number(n) || 0));
            if (readPoolCurrent(target, attr) !== want) {
                patch[`system.stonePools.${attr}.current`] = want;
            }
        }
        if (!Object.keys(patch).length)
            continue;
        try {
            await target.update?.(patch);
        }
        catch (err) {
            console.warn('Mastery System | mirrorStoneCombatReadyToPools failed', target?.name, err);
        }
    }
}
/**
 * Ensure a combat ledger exists for this fight. Seeds from the lowest live
 * `current` across sync copies so a stale full world actor cannot inflate Ready.
 * Always re-mirrors onto sync copies (Round 2 open must crush stale full pools).
 */
export async function ensureStoneCombatReady(actor, combat) {
    if (!combat?.started || !combat.id)
        return null;
    const cid = String(combat.id);
    let ledger = readStoneCombatReady(actor, cid);
    if (!ledger) {
        ledger = {
            combatId: cid,
            pools: snapshotStoneCombatReadyPools(actor),
        };
        await writeStoneCombatReady(actor, ledger);
    }
    await mirrorStoneCombatReadyToPools(actor, ledger);
    return ledger;
}
/**
 * Force-overwrite the combat ledger (Round-1 refill / prep).
 * Pass explicit `pools` when you just wrote them — do not re-snapshot MIN across
 * stale token copies or the refill would be undone.
 */
export async function resealStoneCombatReadyFromPools(actor, combat, pools) {
    if (!combat?.started || !combat.id)
        return;
    const next = pools ?? snapshotStoneCombatReadyPools(actor);
    await writeStoneCombatReady(actor, { combatId: String(combat.id), pools: next });
    for (const target of listStonePoolSyncActors(actor)) {
        const patch = {};
        for (const [attr, n] of Object.entries(next)) {
            const want = Math.max(0, Math.floor(Number(n) || 0));
            if (readPoolCurrent(target, attr) !== want) {
                patch[`system.stonePools.${attr}.current`] = want;
            }
        }
        if (!Object.keys(patch).length)
            continue;
        try {
            await target.update?.(patch);
        }
        catch (err) {
            console.warn('Mastery System | resealStoneCombatReady mirror failed', target?.name, err);
        }
    }
}
/**
 * Set remaining Ready for one pool: update ledger + mirror `current` onto every
 * sync document so world/token copies cannot diverge again.
 */
export async function setCombatPoolCurrent(actor, attr, current, combat) {
    const next = Math.max(0, Math.floor(Number(current) || 0));
    const liveCombat = combat ??
        (() => {
            try {
                return globalThis.game?.combat ?? null;
            }
            catch {
                return null;
            }
        })();
    if (liveCombat?.started && liveCombat.id) {
        const ledger = (await ensureStoneCombatReady(actor, liveCombat)) ??
            { combatId: String(liveCombat.id), pools: snapshotStoneCombatReadyPools(actor) };
        ledger.pools[attr] = next;
        await writeStoneCombatReady(actor, ledger);
    }
    const path = `system.stonePools.${attr}.current`;
    for (const target of listStonePoolSyncActors(actor)) {
        const cur = readPoolCurrent(target, attr);
        if (cur === next)
            continue;
        try {
            await target.update?.({ [path]: next });
        }
        catch (err) {
            console.warn('Mastery System | setCombatPoolCurrent mirror failed for', target?.name, err);
        }
    }
}
/**
 * Add recovered stones into ledger + pools (capped by caller before call).
 */
export async function addCombatPoolCurrent(actor, attr, add, combat) {
    const delta = Math.max(0, Math.floor(Number(add) || 0));
    if (!delta)
        return combatReadyRemaining(actor, attr) ?? minLivePoolCurrent(actor, attr);
    const before = combatReadyRemaining(actor, attr) ?? minLivePoolCurrent(actor, attr);
    const next = before + delta;
    await setCombatPoolCurrent(actor, attr, next, combat);
    return next;
}
//# sourceMappingURL=stone-combat-ledger.js.map