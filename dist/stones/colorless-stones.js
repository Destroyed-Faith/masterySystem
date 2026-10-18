/**
 * Colorless Stones from Initiative Exchange and item grants (Absorption).
 *
 * Initiative Exchange: convert remaining Initiative into Initiative Colorless
 * Stones at `4 × Mastery Rank` Initiative per Stone. They join the Colorless
 * Pool for the current combat and may pay any part of an unlocked Stone
 * Ability's normal cost. Spending one makes it Exhausted. Colorless Stones
 * are not recovered at the end of the Round unless Colorless Recovery has
 * designated them. They disappear when combat ends — Ready or Exhausted —
 * and can never be Burned, Sealed, or Bound.
 *
 * Item-granted stones stay on the actor and follow that item's own rule
 * (Absorption: vanish when spent, gone at the end of the next turn). Combat
 * cleanup must not treat them as leftover Initiative.
 *
 * Permanent Colorless Stones (progression, `system.stonePools.colorless`)
 * are 1:1 after the 2 starting Attribute Stones. Spent Colorless Stones stay
 * Exhausted unless Colorless Recovery designated them. Permanent Colorless
 * Stones return Ready at the end of combat unless Sealed or Bound.
 */
export const COLORLESS_STONE_ATTR = 'colorless';
export const COLORLESS_RECOVERY_FLAG = 'colorlessRecovery';
/**
 * Designated Colorless Stones that are Exhausted right now.
 * A numeric `remaining` budget does not make every Colorless Stone recoverable.
 */
export function colorlessRecoveryBudget(actor) {
    const raw = actor?.getFlag?.('mastery-system', COLORLESS_RECOVERY_FLAG);
    if (!raw || typeof raw !== 'object' || raw.used !== true)
        return 0;
    const combatId = String(globalThis.game?.combat?.id || '');
    const stored = String(raw.combatId || '');
    if (stored && combatId && stored !== combatId)
        return 0;
    const selected = new Set((Array.isArray(raw.selectedIds)
        ? raw.selectedIds
        : []).map((id) => String(id || '')));
    if (!selected.size)
        return 0;
    const ledger = actor?.getFlag?.('mastery-system', 'colorlessStoneLedger');
    return (ledger?.stones ?? []).filter((row) => selected.has(String(row?.id || '')) && row?.state === 'exhausted').length;
}
export const COLORLESS_GEM_STYLE = { fill: '#eceff1', stroke: '#90a4ae' };
const FLAG_COUNT = 'tempColorlessStones';
const FLAG_INITIATIVE = 'initiativeColorlessStones';
const FLAG_INITIATIVE_EXHAUSTED = 'initiativeColorlessExhausted';
const FLAG_ABSORPTION_EXPIRY = 'absorptionStoneExpiry';
const FLAG_ABSORPTION_PENDING = 'absorptionPendingStones';
const FLAG_ABSORPTION_READY = 'absorptionReadyStones';
const FLAG_BOOST_USED = 'msInitiativeBoostUsed';
import { getRulesMasteryRank } from '../utils/mastery-rank-sync.js';
export function getMasteryRank(actor) {
    return getRulesMasteryRank(actor);
}
/** Initiative spent to buy one Temporary Colorless Stone. */
export function colorlessStoneInitiativeCost(masteryRank) {
    return 4 * Math.max(1, Math.floor(Number(masteryRank) || 2));
}
export function getTempColorlessStones(actor) {
    return Math.max(0, Math.floor(Number(actor?.getFlag?.('mastery-system', FLAG_COUNT) ?? 0) || 0));
}
function rawInitiativeColorlessStones(actor) {
    const raw = actor?.getFlag?.('mastery-system', FLAG_INITIATIVE);
    if (raw === undefined || raw === null)
        return undefined;
    return Math.max(0, Math.floor(Number(raw) || 0));
}
/** Ready Initiative Colorless Stones (part of the spendable pile). */
export function getInitiativeColorlessStones(actor) {
    const tagged = rawInitiativeColorlessStones(actor);
    if (tagged === undefined)
        return 0;
    return Math.min(tagged, getTempColorlessStones(actor));
}
/** Exhausted Initiative Colorless Stones — spent, but still part of the combat. */
export function getExhaustedInitiativeColorlessStones(actor) {
    return Math.max(0, Math.floor(Number(actor?.getFlag?.('mastery-system', FLAG_INITIATIVE_EXHAUSTED) ?? 0) || 0));
}
/** All Initiative Colorless Stones alive in this combat (Ready + Exhausted). */
export function getInitiativeColorlessTotal(actor) {
    return getInitiativeColorlessStones(actor) + getExhaustedInitiativeColorlessStones(actor);
}
/** Colorless Stones that did not come from Initiative (Absorption / items). */
export function getItemColorlessStones(actor) {
    return Math.max(0, getTempColorlessStones(actor) - getInitiativeColorlessStones(actor));
}
function knownAbsorptionItemStones(actor) {
    const flag = actor?.getFlag?.('mastery-system', FLAG_ABSORPTION_EXPIRY);
    return Math.max(0, Math.floor(Number(flag?.count) || 0));
}
async function setInitiativeColorlessStones(actor, count) {
    const next = Math.max(0, Math.floor(Number(count) || 0));
    if (next <= 0) {
        await actor?.unsetFlag?.('mastery-system', FLAG_INITIATIVE);
        return;
    }
    await actor?.setFlag?.('mastery-system', FLAG_INITIATIVE, next);
}
export async function setTempColorlessStones(actor, count) {
    const next = Math.max(0, Math.floor(Number(count) || 0));
    if (next <= 0) {
        await actor?.unsetFlag?.('mastery-system', FLAG_COUNT);
        await actor?.unsetFlag?.('mastery-system', FLAG_INITIATIVE);
        return;
    }
    await actor?.setFlag?.('mastery-system', FLAG_COUNT, next);
    const tagged = rawInitiativeColorlessStones(actor);
    if (tagged !== undefined && tagged > next) {
        await setInitiativeColorlessStones(actor, next);
    }
}
/**
 * Absorption Stones wait until the next Preparation Phase. They are not spendable yet.
 */
export async function queueAbsorptionStones(actor, amount, combat) {
    const add = Math.max(0, Math.floor(Number(amount) || 0));
    if (add <= 0 || !actor)
        return 0;
    const prev = actor.getFlag?.('mastery-system', FLAG_ABSORPTION_PENDING);
    const same = prev && String(prev.combatId || '') === String(combat?.id || '');
    const next = (same ? Math.max(0, Math.floor(Number(prev?.amount) || 0)) : 0) + add;
    await actor.setFlag?.('mastery-system', FLAG_ABSORPTION_PENDING, {
        combatId: String(combat?.id || ''),
        earnedRound: Math.max(1, Math.floor(Number(combat?.round) || 1)),
        amount: next,
    });
    return next;
}
/** Move queued Absorption Stones into the spendable pile at the next Preparation Phase. */
export async function releaseAbsorptionStonesForPreparation(actor, combat) {
    const pending = actor?.getFlag?.('mastery-system', FLAG_ABSORPTION_PENDING);
    if (!pending || String(pending.combatId || '') !== String(combat?.id || ''))
        return 0;
    const round = Math.max(1, Math.floor(Number(combat?.round) || 1));
    if (round <= Math.floor(Number(pending.earnedRound) || 1))
        return 0;
    const amount = Math.max(0, Math.floor(Number(pending.amount) || 0));
    await actor.unsetFlag?.('mastery-system', FLAG_ABSORPTION_PENDING);
    if (amount <= 0)
        return 0;
    await addTempColorlessStones(actor, amount);
    const ready = Math.max(0, Math.floor(Number(actor.getFlag?.('mastery-system', FLAG_ABSORPTION_READY)) || 0));
    await actor.setFlag?.('mastery-system', FLAG_ABSORPTION_READY, ready + amount);
    return amount;
}
/** Item / Absorption grant — does not count as leftover Initiative. */
export async function addTempColorlessStones(actor, amount) {
    const add = Math.max(0, Math.floor(Number(amount) || 0));
    const next = getTempColorlessStones(actor) + add;
    await setTempColorlessStones(actor, next);
    return next;
}
/** Initiative Exchange grant — gained Ready, alive until the combat ends. */
export async function addInitiativeColorlessStones(actor, amount) {
    const add = Math.max(0, Math.floor(Number(amount) || 0));
    if (add <= 0)
        return getTempColorlessStones(actor);
    const nextTotal = getTempColorlessStones(actor) + add;
    const nextInit = getInitiativeColorlessStones(actor) + add;
    await actor?.setFlag?.('mastery-system', FLAG_COUNT, nextTotal);
    await setInitiativeColorlessStones(actor, nextInit);
    return nextTotal;
}
async function setExhaustedInitiativeColorlessStones(actor, count) {
    const next = Math.max(0, Math.floor(Number(count) || 0));
    if (next <= 0) {
        await actor?.unsetFlag?.('mastery-system', FLAG_INITIATIVE_EXHAUSTED);
        return;
    }
    await actor?.setFlag?.('mastery-system', FLAG_INITIATIVE_EXHAUSTED, next);
}
export async function copyColorlessPile(from, to) {
    if (!from || !to || from === to)
        return;
    if (String(from.id ?? '') === String(to.id ?? '')) {
        return;
    }
    const total = getTempColorlessStones(from);
    const init = getInitiativeColorlessStones(from);
    const exhausted = getExhaustedInitiativeColorlessStones(from);
    if (total <= 0) {
        await setTempColorlessStones(to, 0);
    }
    else {
        await to?.setFlag?.('mastery-system', FLAG_COUNT, total);
        await setInitiativeColorlessStones(to, init);
    }
    await setExhaustedInitiativeColorlessStones(to, exhausted);
}
/**
 * Permanent Colorless Stones live in `system.stonePools.colorless`.
 * They become Exhausted when spent and are not restored by Stone Recovery
 * unless Colorless Recovery designated them. They return Ready at combat end.
 */
export function getPermanentColorlessStones(actor) {
    const pool = actor?.system?.stonePools?.colorless ?? {};
    return {
        current: Math.max(0, Math.floor(Number(pool.current) || 0)),
        max: Math.max(0, Math.floor(Number(pool.max) || 0)),
    };
}
/**
 * Colorless Stones spendable right now: item-granted pile + Ready Initiative
 * Colorless + Ready Permanent Colorless.
 */
export function getSpendableColorlessStones(actor) {
    return getTempColorlessStones(actor) + getPermanentColorlessStones(actor).current;
}
/**
 * Spend Colorless Stones. Deterministic, player-favorable source order:
 * item-granted first (they vanish on spend and expire soonest), then Ready
 * Initiative Colorless (combat-limited; they become Exhausted and may
 * regenerate), then Ready Permanent Colorless (they become Exhausted and
 * survive the combat).
 */
export async function spendColorlessStones(actor, amount) {
    const n = Math.max(0, Math.floor(Number(amount) || 0));
    if (n <= 0)
        return true;
    try {
        const combat = globalThis.game?.combat ?? null;
        const { isFleeLocked } = await import('../combat/action-economy.js');
        if (combat && isFleeLocked(actor, combat)) {
            globalThis.ui?.notifications?.warn?.('Flee: you cannot spend Stones until the start of your next Turn.');
            return false;
        }
    }
    catch {
        /* economy unavailable */
    }
    const temp = getTempColorlessStones(actor);
    const fromTemp = Math.min(n, temp);
    const fromPermanent = n - fromTemp;
    if (fromPermanent > 0) {
        const perm = getPermanentColorlessStones(actor);
        if (perm.current < fromPermanent)
            return false;
    }
    if (fromTemp > 0 && !(await spendTempColorlessStones(actor, fromTemp)))
        return false;
    if (fromPermanent > 0) {
        const perm = getPermanentColorlessStones(actor);
        const next = Math.max(0, perm.current - fromPermanent);
        try {
            const combat = globalThis.game?.combat;
            if (combat?.id) {
                const { setCombatPoolCurrent } = await import('./stone-combat-ledger.js');
                await setCombatPoolCurrent(actor, 'colorless', next, combat);
            }
            else {
                await actor?.update?.({ 'system.stonePools.colorless.current': next });
            }
        }
        catch {
            await actor?.update?.({ 'system.stonePools.colorless.current': next });
        }
    }
    return true;
}
/**
 * Spend from the temporary pile: item-granted stones first (source rule —
 * they vanish when spent), then Ready Initiative Colorless Stones, which
 * become Exhausted instead of disappearing.
 */
export async function spendTempColorlessStones(actor, amount) {
    const n = Math.max(0, Math.floor(Number(amount) || 0));
    if (n <= 0)
        return true;
    const have = getTempColorlessStones(actor);
    if (have < n)
        return false;
    const init = getInitiativeColorlessStones(actor);
    const item = Math.max(0, have - init);
    const fromItem = Math.min(n, item);
    const fromInit = n - fromItem;
    const nextTotal = have - n;
    const nextInit = init - fromInit;
    if (nextTotal <= 0) {
        await setTempColorlessStones(actor, 0);
    }
    else {
        await actor?.setFlag?.('mastery-system', FLAG_COUNT, nextTotal);
        await setInitiativeColorlessStones(actor, nextInit);
    }
    if (fromInit > 0) {
        await setExhaustedInitiativeColorlessStones(actor, getExhaustedInitiativeColorlessStones(actor) + fromInit);
    }
    return true;
}
/**
 * Normal Stone Regeneration on Initiative Colorless Stones: move up to
 * `amount` Exhausted Initiative Colorless Stones back to Ready. Returns how
 * many actually came back.
 */
export async function restoreInitiativeColorlessStones(actor, amount) {
    const n = Math.max(0, Math.floor(Number(amount) || 0));
    if (n <= 0)
        return 0;
    const exhausted = getExhaustedInitiativeColorlessStones(actor);
    const restore = Math.min(n, exhausted);
    if (restore <= 0)
        return 0;
    await setExhaustedInitiativeColorlessStones(actor, exhausted - restore);
    await actor?.setFlag?.('mastery-system', FLAG_COUNT, getTempColorlessStones(actor) + restore);
    await setInitiativeColorlessStones(actor, getInitiativeColorlessStones(actor) + restore);
    return restore;
}
/** Drop item-granted stones without touching the Initiative leftover count. */
export async function dropItemColorlessStones(actor, amount) {
    const n = Math.max(0, Math.floor(Number(amount) || 0));
    if (n <= 0)
        return 0;
    const item = getItemColorlessStones(actor);
    const drop = Math.min(item, n);
    if (drop <= 0)
        return 0;
    const next = getTempColorlessStones(actor) - drop;
    if (next <= 0) {
        await actor?.unsetFlag?.('mastery-system', FLAG_COUNT);
        return drop;
    }
    await actor?.setFlag?.('mastery-system', FLAG_COUNT, next);
    return drop;
}
export async function clearTempColorlessStones(actor) {
    await setTempColorlessStones(actor, 0);
    await actor?.unsetFlag?.('mastery-system', FLAG_INITIATIVE_EXHAUSTED);
}
/**
 * End of combat: all Initiative Colorless Stones disappear, Ready or
 * Exhausted. Item-granted stones stay. Untagged leftovers from before source
 * tracking count as Initiative, minus any Absorption expiry still on the
 * actor.
 */
export async function clearInitiativeColorlessStones(actor) {
    const total = getTempColorlessStones(actor);
    const tagged = rawInitiativeColorlessStones(actor);
    let drop;
    if (tagged !== undefined) {
        drop = Math.min(total, tagged);
    }
    else {
        drop = Math.max(0, total - knownAbsorptionItemStones(actor));
    }
    const remain = total - drop;
    await actor?.unsetFlag?.('mastery-system', FLAG_INITIATIVE);
    await actor?.unsetFlag?.('mastery-system', FLAG_INITIATIVE_EXHAUSTED);
    await actor?.unsetFlag?.('mastery-system', FLAG_ABSORPTION_PENDING);
    const absorptionReady = Math.max(0, Math.floor(Number(actor?.getFlag?.('mastery-system', FLAG_ABSORPTION_READY)) || 0));
    await actor?.unsetFlag?.('mastery-system', FLAG_ABSORPTION_READY);
    if (absorptionReady > 0) {
        const afterInit = Math.max(0, (total - drop) - absorptionReady);
        if (afterInit <= 0) {
            await actor?.unsetFlag?.('mastery-system', FLAG_COUNT);
            return;
        }
        await actor?.setFlag?.('mastery-system', FLAG_COUNT, afterInit);
        return;
    }
    if (remain <= 0) {
        await actor?.unsetFlag?.('mastery-system', FLAG_COUNT);
        return;
    }
    await actor?.setFlag?.('mastery-system', FLAG_COUNT, remain);
}
const FLAG_PHASING_STONE = 'msPhasingStoneUsed';
const FLAG_TEMP_HP_STONE = 'msTempHpStoneUsed';
/** Combatant / actor flags for Stone Powers that may fire only once per encounter. */
const ONCE_PER_COMBAT_FLAGS = {
    'wits.initiativeBoost': FLAG_BOOST_USED,
    'wits.phasing': FLAG_PHASING_STONE,
    'vitality.tempHp': FLAG_TEMP_HP_STONE,
};
/** All once-per-combat flag keys (for combat-end cleanup). */
export const ONCE_PER_COMBAT_STONE_FLAGS = [
    FLAG_BOOST_USED,
    FLAG_PHASING_STONE,
    FLAG_TEMP_HP_STONE,
];
export function oncePerCombatFlagForPower(powerId) {
    return ONCE_PER_COMBAT_FLAGS[String(powerId || '')] ?? null;
}
function currentCombatId() {
    return String(globalThis.game?.combat?.id || '');
}
function resolveOncePerCombatActor(combatant, actor) {
    return actor ?? combatant?.actor ?? null;
}
/** True when a once-per-combat flag is set for the live combat (actor preferred). */
function readOncePerCombatFlag(holder, flag, combatId) {
    const raw = holder?.getFlag?.('mastery-system', flag);
    if (raw === true)
        return true;
    if (raw && typeof raw === 'object' && raw.used === true) {
        const stored = String(raw.combatId || '');
        if (!combatId || !stored || stored === combatId)
            return true;
    }
    return false;
}
/**
 * Once-per-combat Stone Powers are stored on the **actor** (combatId-scoped),
 * with a legacy combatant boolean kept in sync. Actor is authoritative so
 * round-2 stone confirm cannot re-grant Temp HP / Boost / Phasing when the
 * combatant flag failed to stick for a player-owned combatant.
 */
export function isOncePerCombatPowerUsed(combatant, powerId, actor) {
    const flag = oncePerCombatFlagForPower(powerId);
    if (!flag)
        return false;
    const combatId = currentCombatId();
    const economy = resolveOncePerCombatActor(combatant, actor);
    if (economy && readOncePerCombatFlag(economy, flag, combatId))
        return true;
    if (combatant && readOncePerCombatFlag(combatant, flag, combatId))
        return true;
    return false;
}
export async function markOncePerCombatPowerUsed(combatant, powerId, actor) {
    const flag = oncePerCombatFlagForPower(powerId);
    if (!flag)
        return;
    const combatId = currentCombatId();
    const payload = combatId ? { combatId, used: true } : true;
    const economy = resolveOncePerCombatActor(combatant, actor);
    if (economy?.setFlag) {
        await economy.setFlag('mastery-system', flag, payload);
    }
    // Dual-write legacy combatant boolean for older snapshots / GM views.
    if (combatant?.setFlag) {
        await combatant.setFlag('mastery-system', flag, true);
    }
}
/** Clear actor once-per-combat stone marks (new fight / combat end). */
export async function clearOncePerCombatStoneFlags(actor) {
    if (!actor?.unsetFlag)
        return;
    for (const flag of ONCE_PER_COMBAT_STONE_FLAGS) {
        try {
            await actor.unsetFlag('mastery-system', flag);
        }
        catch {
            /* ignore */
        }
    }
}
export function isInitiativeBoostUsedThisCombat(combatant, actor) {
    return isOncePerCombatPowerUsed(combatant, 'wits.initiativeBoost', actor);
}
export async function markInitiativeBoostUsedThisCombat(combatant, actor) {
    await markOncePerCombatPowerUsed(combatant, 'wits.initiativeBoost', actor);
}
export function isPhasingStoneUsedThisCombat(combatant, actor) {
    return isOncePerCombatPowerUsed(combatant, 'wits.phasing', actor);
}
export async function markPhasingStoneUsedThisCombat(combatant, actor) {
    await markOncePerCombatPowerUsed(combatant, 'wits.phasing', actor);
}
export function isTempHpStoneUsedThisCombat(combatant, actor) {
    return isOncePerCombatPowerUsed(combatant, 'vitality.tempHp', actor);
}
export async function markTempHpStoneUsedThisCombat(combatant, actor) {
    await markOncePerCombatPowerUsed(combatant, 'vitality.tempHp', actor);
}
/** Initiative Boost tier scale: 1 / 2 / 4 / 8 × Mastery Rank. Tier 4 is the last tier. */
export function initiativeBoostAmount(tier, masteryRank) {
    const t = Math.floor(Number(tier) || 1);
    if (t < 1 || t > 4)
        return 0;
    const mr = Math.max(1, Math.floor(Number(masteryRank) || 2));
    const mult = 2 ** (t - 1);
    return mr * mult;
}
export function maxConvertibleColorlessStones(initiative, masteryRank) {
    const cost = colorlessStoneInitiativeCost(masteryRank);
    if (cost <= 0)
        return 0;
    return Math.max(0, Math.floor(Math.max(0, Number(initiative) || 0) / cost));
}
export function convertInitiativeToColorlessPreview(initiative, stones, masteryRank) {
    const costEach = colorlessStoneInitiativeCost(masteryRank);
    const max = maxConvertibleColorlessStones(initiative, masteryRank);
    const n = Math.max(0, Math.min(max, Math.floor(Number(stones) || 0)));
    const initiativeCost = n * costEach;
    return {
        stones: n,
        initiativeCost,
        remainingInitiative: Math.max(0, Math.floor(Number(initiative) || 0) - initiativeCost),
    };
}
export async function convertInitiativeToColorlessStones(actor, combatant, stones) {
    if (!actor || !combatant)
        return null;
    const { getActionEconomyActor } = await import('../combat/action-economy.js');
    const owner = getActionEconomyActor(actor) ?? actor;
    const mr = getMasteryRank(owner);
    const current = Math.max(0, Math.floor(Number(combatant.initiative) || 0));
    const preview = convertInitiativeToColorlessPreview(current, stones, mr);
    if (preview.stones <= 0)
        return null;
    await combatant.update?.({ initiative: preview.remainingInitiative });
    await combatant.setFlag?.('mastery-system', 'msInitiativeValue', preview.remainingInitiative);
    await addInitiativeColorlessStones(owner, preview.stones);
    await copyColorlessPile(owner, actor);
    return { stones: preview.stones, remainingInitiative: preview.remainingInitiative };
}
export async function clearColorlessStonesForCombat(combat) {
    if (!combat?.combatants)
        return;
    for (const c of combat.combatants) {
        const actor = c?.actor;
        if (!actor)
            continue;
        try {
            await clearInitiativeColorlessStones(actor);
        }
        catch {
            /* best-effort */
        }
        try {
            const { clearColorlessRecovery } = await import('./colorless-recovery.js');
            await clearColorlessRecovery(actor);
        }
        catch {
            /* best-effort */
        }
    }
}
//# sourceMappingURL=colorless-stones.js.map