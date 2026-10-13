/**
 * Canonical Ready / Available Stones math.
 *
 * Single source of truth shared by:
 * - GM Stone-Übersicht (`readyExpected`)
 * - Stone Powers "Available Stones" gems
 * - `poolSpendableStones` / payment
 *
 * Formula (Lifetime track):
 *   max = assigned stones on the Lifetime XP track
 *   readyExpected = max − sealed − burned − max(sustained, summon/familiar hold)
 *
 * Does NOT use Attribute÷8, pool.current, or retired artifact activation flags
 * for Available. `pool.current` is only mirrored for Audit mismatch notes.
 */
import { getActionEconomyActor } from '../combat/action-economy.js';
import { ATTRIBUTE_KEYS, effectiveStoneAssignments, isLifetimeStoneMode, permanentColorlessCount, } from '../progression/v099-rules.js';
import { familiarStoneAssignments, getFamiliarsFromActor } from './familiar-bind.js';
import { combatReadyRemaining } from './stone-combat-ledger.js';
import { listStonePoolSyncActors, resolveActorStoneSystem, stonePoolReadyMax, } from './stone-pool-sync.js';
import { bondStoneAssignments, getSummonBondsFromActor } from './summon-bond-bind.js';
/** Sustained counts that Summon Bonds / Familiars currently hold. */
export function summonBoundSustainedByAttr(actor) {
    const out = {};
    const bump = (attr, n) => {
        if (!attr || n <= 0)
            return;
        out[attr] = (out[attr] ?? 0) + n;
    };
    try {
        for (const bond of getSummonBondsFromActor(actor)) {
            for (const [attr, n] of Object.entries(bondStoneAssignments(bond))) {
                bump(attr, Math.max(0, Math.floor(Number(n) || 0)));
            }
        }
    }
    catch {
        /* optional */
    }
    try {
        for (const fam of getFamiliarsFromActor(actor)) {
            for (const [attr, n] of Object.entries(familiarStoneAssignments(fam))) {
                bump(attr, Math.max(0, Math.floor(Number(n) || 0)));
            }
        }
    }
    catch {
        /* optional */
    }
    return out;
}
/**
 * Live seal / sustain / current across world + token economy copies.
 * `current` must never take MAX across copies — a stale full sibling would
 * erase spent stones. Prefer the combat ledger, else the minimum live current.
 */
function livePoolFields(actor, attr) {
    const acc = { current: 0, max: 0, sealed: 0, burned: 0, sustained: 0 };
    const currents = [];
    const seen = new Set();
    const add = (a) => {
        if (!a)
            return;
        const key = a.isToken
            ? `token:${String(a.token?.id ?? a.id ?? '')}`
            : `world:${String(a.id ?? '')}`;
        if (seen.has(key))
            return;
        seen.add(key);
        const pool = a?.system?.stonePools?.[attr];
        if (pool) {
            currents.push(Math.max(0, Math.floor(Number(pool.current) || 0)));
            // Seal / sustain still take the high watermark (those fields are rarely
            // spent-down incorrectly; under-reading them would inflate Available).
            acc.max = Math.max(acc.max, Math.max(0, Math.floor(Number(pool.max) || 0)));
            acc.sealed = Math.max(acc.sealed, Math.max(0, Math.floor(Number(pool.sealed) || 0)));
            acc.burned = Math.max(acc.burned, Math.max(0, Math.floor(Number(pool.burned) || 0)));
            acc.sustained = Math.max(acc.sustained, Math.max(0, Math.floor(Number(pool.sustained) || 0)));
        }
    };
    add(actor);
    try {
        add(getActionEconomyActor(actor));
    }
    catch {
        /* optional */
    }
    try {
        for (const t of listStonePoolSyncActors(actor))
            add(t);
    }
    catch {
        /* optional */
    }
    const ledgerCurrent = combatReadyRemaining(actor, attr);
    if (ledgerCurrent != null) {
        acc.current = ledgerCurrent;
    }
    else if (currents.length) {
        acc.current = Math.min(...currents);
    }
    else {
        acc.current = 0;
    }
    return acc;
}
/**
 * Audit-identical Ready view for one attribute (or `colorless`).
 */
export function getAttrStoneReadyView(actor, attr) {
    const stoneSystem = resolveActorStoneSystem(actor);
    const lifetimeStoneMode = isLifetimeStoneMode(stoneSystem);
    const assignments = effectiveStoneAssignments(stoneSystem);
    const assigned = attr === 'colorless'
        ? permanentColorlessCount(stoneSystem)
        : Math.max(0, Math.floor(Number(assignments[attr]) || 0));
    const live = livePoolFields(actor, attr);
    const summonBound = attr === 'colorless' ? 0 : Math.max(0, Math.floor(Number(summonBoundSustainedByAttr(actor)[attr]) || 0));
    // Lifetime mode: exact assignment. Legacy: keep stored pool.max / ÷8 via helper.
    const max = stonePoolReadyMax(stoneSystem, attr, {
        max: lifetimeStoneMode ? assigned : Math.max(assigned, live.max),
    });
    const hold = Math.max(live.sustained, summonBound);
    const readyExpected = Math.max(0, max - live.sealed - live.burned - hold);
    return {
        key: attr,
        assigned,
        max,
        current: live.current,
        sealed: live.sealed,
        burned: live.burned,
        sustained: live.sustained,
        summonBound,
        readyExpected,
        lifetimeStoneMode,
    };
}
/** All attribute pools (no colorless) — Stone Powers Available row source. */
export function listAttrStoneReadyViews(actor) {
    return ATTRIBUTE_KEYS.map((k) => getAttrStoneReadyView(actor, k));
}
/**
 * Sync pool `max` / summon holds to the Lifetime Audit track.
 *
 * Out of combat: also refill `current` to readyExpected.
 * In combat: never refill spent stones — round 2+ Stone Recovery (Mastery Rank)
 * is the only way pools come back mid-fight. Only clamp `current` down when it
 * exceeds readyExpected (e.g. after a sustain/seal increase).
 */
export async function alignStonePoolsToAuditReady(actor) {
    if (!actor)
        return false;
    let inCombat = false;
    try {
        const combat = globalThis.game?.combat;
        inCombat = !!(combat?.started && Math.floor(Number(combat.round) || 0) >= 1);
    }
    catch {
        inCombat = false;
    }
    let changed = false;
    const boundMap = summonBoundSustainedByAttr(actor);
    for (const target of listStonePoolSyncActors(actor)) {
        const stoneSystem = resolveActorStoneSystem(target);
        if (!isLifetimeStoneMode(stoneSystem))
            continue;
        const assignments = effectiveStoneAssignments(stoneSystem);
        const updates = {};
        for (const attr of ATTRIBUTE_KEYS) {
            const want = Math.max(0, Math.floor(Number(assignments[attr]) || 0));
            const pool = target?.system?.stonePools?.[attr] ?? {};
            const sealed = Math.max(0, Math.floor(Number(pool.sealed) || 0));
            const burned = Math.max(0, Math.floor(Number(pool.burned) || 0));
            let sustained = Math.max(0, Math.floor(Number(pool.sustained) || 0));
            const bound = Math.max(0, Math.floor(Number(boundMap[attr]) || 0));
            if (bound > sustained) {
                sustained = bound;
                updates[`system.stonePools.${attr}.sustained`] = sustained;
            }
            const readyExpected = Math.max(0, want - sealed - burned - Math.max(sustained, bound));
            const curMax = Math.max(0, Math.floor(Number(pool.max) || 0));
            const curCurrent = Math.max(0, Math.floor(Number(pool.current) || 0));
            if (curMax !== want)
                updates[`system.stonePools.${attr}.max`] = want;
            if (!inCombat) {
                if (curCurrent !== readyExpected)
                    updates[`system.stonePools.${attr}.current`] = readyExpected;
            }
            else if (curCurrent > readyExpected) {
                updates[`system.stonePools.${attr}.current`] = readyExpected;
            }
        }
        if (!Object.keys(updates).length)
            continue;
        try {
            await target.update?.(updates);
            changed = true;
        }
        catch (err) {
            console.warn('Mastery System | alignStonePoolsToAuditReady failed for', target?.name, err);
        }
    }
    return changed;
}
//# sourceMappingURL=stone-ready.js.map