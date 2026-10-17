/**
 * Colorless Recovery (v0.9.9.5) designates specific Colorless Stones.
 * It does not regenerate them and does not raise the shared MR recovery limit.
 */
import { getActionEconomyActor, spendStoneAbility } from '../combat/action-economy.js';
import { COLORLESS_RECOVERY_FLAG, dropItemColorlessStones, getExhaustedInitiativeColorlessStones, getInitiativeColorlessStones, getItemColorlessStones, getPermanentColorlessStones, restoreInitiativeColorlessStones, } from './colorless-stones.js';
import { readPreparationPhase } from './preparation-phase.js';
export const COLORLESS_RECOVERY_COSTS = [1, 3, 7, 15];
export const COLORLESS_RECOVERY_CAPACITIES = [2, 4, 8, 16];
const LEDGER_FLAG = 'colorlessStoneLedger';
const DRAFT_FLAG = 'colorlessRecoveryDraft';
const ABSORPTION_READY = 'absorptionReadyStones';
export function colorlessRecoverySpec(rank) {
    const tier = Math.floor(Number(rank) || 0);
    if (tier < 1 || tier > 4)
        return null;
    return {
        cost: COLORLESS_RECOVERY_COSTS[tier - 1],
        capacity: COLORLESS_RECOVERY_CAPACITIES[tier - 1],
    };
}
export function readColorlessRecovery(actor, combatId) {
    const raw = actor?.getFlag?.('mastery-system', COLORLESS_RECOVERY_FLAG);
    if (!raw || typeof raw !== 'object' || raw.used !== true)
        return null;
    const stored = String(raw.combatId || '');
    const live = combatId ?? String(globalThis.game?.combat?.id || '');
    if (stored && live && stored !== live)
        return null;
    const capacity = Math.max(0, Math.floor(Number(raw.capacity ?? raw.eligible) || 0));
    const selectedIds = [];
    if (Array.isArray(raw.selectedIds)) {
        for (const id of raw.selectedIds) {
            const key = String(id || '');
            if (key && !selectedIds.includes(key))
                selectedIds.push(key);
        }
    }
    return {
        combatId: stored,
        rank: Math.max(1, Math.floor(Number(raw.rank) || 1)),
        eligible: capacity,
        capacity,
        used: true,
        selectedIds: selectedIds.slice(0, capacity || selectedIds.length),
    };
}
/** Designated stones that are Exhausted right now. Not a lifetime regen budget. */
export function designatedExhaustedColorlessIds(actor) {
    const record = readColorlessRecovery(actor);
    if (!record)
        return [];
    const rows = readLedger(actor).stones;
    const chosen = new Set(record.selectedIds);
    return rows
        .filter((row) => chosen.has(row.id) && row.state === 'exhausted')
        .map((row) => row.id);
}
export function colorlessRecoveryPreparationOpen(actor, combat) {
    if (!combat?.id)
        return false;
    const raw = actor?.getFlag?.('mastery-system', 'preparationPhase');
    if (!raw || typeof raw !== 'object')
        return combat.started !== true;
    if (String(raw.combatId || '') !== String(combat.id))
        return false;
    if (Math.floor(Number(raw.round) || 0) !== Math.floor(Number(combat.round) || 0)) {
        return false;
    }
    return readPreparationPhase(raw, String(combat.id), Number(combat.round) || 0).assignment !== 'confirmed';
}
function readLedger(actor) {
    const raw = actor?.getFlag?.('mastery-system', LEDGER_FLAG);
    if (!raw || typeof raw !== 'object' || !Array.isArray(raw.stones)) {
        return { next: 1, stones: [] };
    }
    return {
        next: Math.max(1, Math.floor(Number(raw.next) || 1)),
        stones: raw.stones
            .filter((row) => row && row.id && row.source)
            .map((row) => ({
            id: String(row.id),
            source: row.source,
            state: row.state === 'sealed' || row.state === 'bound' || row.state === 'exhausted' ? row.state : 'ready',
            temporary: row.source !== 'permanent',
        })),
    };
}
function poolNumbers(actor) {
    const pool = actor?.system?.stonePools?.colorless ?? {};
    const max = Math.max(0, Math.floor(Number(pool.max) || 0));
    const ready = Math.max(0, Math.floor(Number(pool.current) || 0));
    const sealed = Math.max(0, Math.floor(Number(pool.sealed) || 0)) +
        Math.max(0, Math.floor(Number(pool.burned) || 0));
    const bound = Math.max(0, Math.floor(Number(pool.bound) || 0));
    return { max, ready: Math.min(ready, max), sealed: Math.min(sealed, max), bound: Math.min(bound, max) };
}
function fitRows(existing, source, total, ready, sealed, bound, mint) {
    const rows = existing.filter((row) => row.source === source).map((row) => ({ ...row }));
    while (rows.length < total) {
        rows.push({
            id: source === 'permanent' ? `permanent:${rows.length}` : mint(),
            source,
            state: 'ready',
            temporary: source !== 'permanent',
        });
    }
    const kept = rows.slice(0, total);
    let sealLeft = sealed;
    let bindLeft = bound;
    for (const row of kept) {
        if (row.state === 'sealed' && sealLeft > 0)
            sealLeft -= 1;
        else if (row.state === 'bound' && bindLeft > 0)
            bindLeft -= 1;
    }
    for (const row of kept) {
        if (sealLeft <= 0)
            break;
        if (row.state === 'ready' || row.state === 'exhausted') {
            row.state = 'sealed';
            sealLeft -= 1;
        }
    }
    for (const row of kept) {
        if (bindLeft <= 0)
            break;
        if (row.state === 'ready' || row.state === 'exhausted') {
            row.state = 'bound';
            bindLeft -= 1;
        }
    }
    const free = kept.filter((row) => row.state === 'ready' || row.state === 'exhausted');
    let readyLeft = Math.min(ready, free.length);
    for (const row of free) {
        if (row.state === 'ready' && readyLeft > 0)
            readyLeft -= 1;
        else if (row.state === 'ready')
            row.state = 'exhausted';
    }
    for (const row of free) {
        if (readyLeft <= 0)
            break;
        if (row.state === 'exhausted') {
            row.state = 'ready';
            readyLeft -= 1;
        }
    }
    return kept;
}
export function listColorlessStones(actor) {
    return readLedger(actor).stones;
}
export async function syncColorlessStoneLedger(actor) {
    const ledger = readLedger(actor);
    let seq = ledger.next;
    const mint = () => `${seq++}`;
    const perm = poolNumbers(actor);
    const permFree = Math.max(0, perm.max - perm.sealed - perm.bound);
    const permReady = Math.min(perm.ready, permFree);
    const initReady = getInitiativeColorlessStones(actor);
    const initExhausted = getExhaustedInitiativeColorlessStones(actor);
    const absorption = Math.max(0, Math.floor(Number(actor?.getFlag?.('mastery-system', ABSORPTION_READY)) || 0));
    const granted = Math.max(0, getItemColorlessStones(actor) - absorption);
    const stones = [
        ...fitRows(ledger.stones, 'permanent', perm.max, permReady, perm.sealed, perm.bound, mint),
        ...fitRows(ledger.stones, 'initiative', initReady + initExhausted, initReady, 0, 0, () => `initiative:${mint()}`),
        ...fitRows(ledger.stones, 'absorption', absorption, absorption, 0, 0, () => `absorption:${mint()}`),
        ...fitRows(ledger.stones, 'granted', granted, granted, 0, 0, () => `granted:${mint()}`),
    ];
    await actor?.setFlag?.('mastery-system', LEDGER_FLAG, { next: seq, stones });
    return stones;
}
export function colorlessRecoveryFreeSlots(actor) {
    const record = readColorlessRecovery(actor);
    if (!record)
        return 0;
    return Math.max(0, record.capacity - record.selectedIds.length);
}
async function writeRecovery(actor, record) {
    await actor?.setFlag?.('mastery-system', COLORLESS_RECOVERY_FLAG, record);
}
/** Called by the Stone Ability apply(). Does not spend Stones and does not regenerate any. */
export async function recordColorlessRecoveryActivation(actor, tier) {
    const spec = colorlessRecoverySpec(tier);
    if (!spec)
        return;
    const combatId = String(globalThis.game?.combat?.id || '');
    const prior = readColorlessRecovery(actor, combatId);
    if (prior && (!combatId || prior.combatId === combatId)) {
        globalThis.ui?.notifications?.warn?.(`${actor?.name ?? 'Character'}: Colorless Recovery was already used this combat.`);
        return;
    }
    const draft = actor?.getFlag?.('mastery-system', DRAFT_FLAG);
    const stones = await syncColorlessStoneLedger(actor);
    const legal = new Set(stones.filter((row) => row.state === 'ready' || row.state === 'exhausted').map((row) => row.id));
    const selectedIds = [];
    for (const id of draft?.ids ?? []) {
        const key = String(id || '');
        if (!key || selectedIds.includes(key) || !legal.has(key))
            continue;
        selectedIds.push(key);
        if (selectedIds.length >= spec.capacity)
            break;
    }
    await writeRecovery(actor, {
        combatId,
        rank: Math.floor(Number(tier) || 1),
        eligible: spec.capacity,
        capacity: spec.capacity,
        used: true,
        selectedIds,
    });
    await actor?.unsetFlag?.('mastery-system', DRAFT_FLAG);
}
export async function commitColorlessRecovery(args) {
    const actor = getActionEconomyActor(args.actor) ?? args.actor;
    const combat = args.combat ?? globalThis.game?.combat ?? null;
    const spec = colorlessRecoverySpec(args.rank);
    if (!spec)
        return { ok: false, reason: 'rank' };
    if (!colorlessRecoveryPreparationOpen(actor, combat))
        return { ok: false, reason: 'preparation' };
    const combatId = String(combat?.id || '');
    if (readColorlessRecovery(actor, combatId))
        return { ok: false, reason: 'once' };
    const unique = [...new Set((args.selectedIds || []).map((id) => String(id || '')).filter(Boolean))];
    if (unique.length > spec.capacity)
        return { ok: false, reason: 'capacity' };
    const stones = await syncColorlessStoneLedger(actor);
    const legal = new Set(stones.filter((row) => row.state === 'ready' || row.state === 'exhausted').map((row) => row.id));
    if (unique.some((id) => !legal.has(id)))
        return { ok: false, reason: 'stone' };
    const pool = actor?.system?.stonePools?.influence ?? {};
    const sealedBefore = Math.floor(Number(pool.sealed) || 0);
    await actor?.setFlag?.('mastery-system', DRAFT_FLAG, { ids: unique });
    const paid = await spendStoneAbility(actor, args.combatant, 'influence', 'influence.colorlessRecovery', async () => {
        const { STONE_POWERS } = await import('./stone-powers.js');
        await STONE_POWERS['influence.colorlessRecovery']?.apply({
            actor,
            combatant: args.combatant,
            tier: Math.floor(Number(args.rank) || 1),
            cost: spec.cost,
        });
    }, spec.cost, 0);
    if (!paid) {
        await actor?.unsetFlag?.('mastery-system', DRAFT_FLAG);
        return { ok: false, reason: 'cost' };
    }
    const sealedAfter = Math.floor(Number(actor?.system?.stonePools?.influence?.sealed) || 0);
    if (sealedAfter !== sealedBefore)
        return { ok: false, reason: 'sealed' };
    return { ok: true };
}
export async function assignLaterColorlessRecovery(actor, ids) {
    const owner = getActionEconomyActor(actor) ?? actor;
    const record = readColorlessRecovery(owner);
    if (!record)
        return { ok: false, added: [], reason: 'inactive' };
    const stones = await syncColorlessStoneLedger(owner);
    const legal = new Set(stones.filter((row) => row.state === 'ready' || row.state === 'exhausted').map((row) => row.id));
    const added = [];
    const selected = [...record.selectedIds];
    for (const id of ids) {
        const key = String(id || '');
        if (!key || selected.includes(key) || !legal.has(key))
            continue;
        if (selected.length >= record.capacity)
            break;
        selected.push(key);
        added.push(key);
    }
    if (!added.length)
        return { ok: false, added, reason: 'none' };
    await writeRecovery(owner, { ...record, selectedIds: selected });
    return { ok: true, added };
}
export async function restoreDesignatedColorlessStones(actor, ids) {
    const owner = getActionEconomyActor(actor) ?? actor;
    const record = readColorlessRecovery(owner);
    if (!record)
        return [];
    const restored = [];
    for (const id of ids) {
        if (!record.selectedIds.includes(id) || restored.includes(id))
            continue;
        const stones = await syncColorlessStoneLedger(owner);
        const row = stones.find((stone) => stone.id === id);
        if (!row || row.state !== 'exhausted')
            continue;
        row.state = 'ready';
        const ledger = readLedger(owner);
        ledger.stones = ledger.stones.map((stone) => (stone.id === row.id ? row : stone));
        if (!ledger.stones.some((stone) => stone.id === row.id))
            ledger.stones.push(row);
        await owner.setFlag?.('mastery-system', LEDGER_FLAG, ledger);
        if (row.source === 'initiative') {
            const back = await restoreInitiativeColorlessStones(owner, 1);
            if (back <= 0) {
                row.state = 'exhausted';
                await owner.setFlag?.('mastery-system', LEDGER_FLAG, ledger);
                continue;
            }
        }
        else if (row.source === 'permanent') {
            const perm = getPermanentColorlessStones(owner);
            const next = perm.current + 1;
            await owner.update?.({ 'system.stonePools.colorless.current': next });
            try {
                const combat = globalThis.game?.combat;
                if (combat?.id) {
                    const { setCombatPoolCurrent } = await import('./stone-combat-ledger.js');
                    await setCombatPoolCurrent(owner, 'colorless', next, combat);
                }
            }
            catch {
                /* pool current already raised */
            }
        }
        else {
            row.state = 'exhausted';
            await owner.setFlag?.('mastery-system', LEDGER_FLAG, ledger);
            continue;
        }
        restored.push(id);
        await syncColorlessStoneLedger(owner);
    }
    return restored;
}
/** Remove a temporary source. Designated slots stay occupied; the Stones are gone. */
export async function expireTemporaryColorlessSource(actor, source) {
    const owner = getActionEconomyActor(actor) ?? actor;
    if (source === 'initiative') {
        const { clearInitiativeColorlessStones } = await import('./colorless-stones.js');
        await clearInitiativeColorlessStones(owner);
    }
    else if (source === 'absorption') {
        const n = Math.max(0, Math.floor(Number(owner?.getFlag?.('mastery-system', ABSORPTION_READY)) || 0));
        if (n > 0)
            await dropItemColorlessStones(owner, n);
        await owner?.unsetFlag?.('mastery-system', ABSORPTION_READY);
    }
    else {
        const absorption = Math.max(0, Math.floor(Number(owner?.getFlag?.('mastery-system', ABSORPTION_READY)) || 0));
        const granted = Math.max(0, getItemColorlessStones(owner) - absorption);
        if (granted > 0)
            await dropItemColorlessStones(owner, granted);
    }
    await syncColorlessStoneLedger(owner);
}
export async function clearColorlessRecovery(actor) {
    await actor?.unsetFlag?.('mastery-system', COLORLESS_RECOVERY_FLAG);
    await actor?.unsetFlag?.('mastery-system', DRAFT_FLAG);
    await actor?.unsetFlag?.('mastery-system', LEDGER_FLAG);
}
//# sourceMappingURL=colorless-recovery.js.map