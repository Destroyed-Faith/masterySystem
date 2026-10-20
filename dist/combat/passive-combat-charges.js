/**
 * Per-combat Passive charge pools for Critical and Maximization.
 *
 * Separate from Active Buff Critical (per Round) and Vitality Stone Maximization.
 * Granted at combat start from the slotted Passive Power Level; expire at combat end.
 */
import { getPassiveSlots, findPassivePowerItem } from '../powers/passives.js';
import { phasingStyleCombatCharges } from '../utils/powers/templates/passives.js';
const FLAG_SCOPE = 'mastery-system';
export const PASSIVE_CRIT_FLAG = 'passiveCriticalCharges';
export const PASSIVE_MAX_FLAG = 'passiveMaximizationCharges';
export const PASSIVE_CRITICAL_TEMPLATE_ID = 'passive-critical';
export const PASSIVE_MAXIMIZATION_TEMPLATE_ID = 'passive-maximization';
export const PASSIVE_ARMOR_REDUCTION_TEMPLATE_ID = 'passive-armor-reduction';
function actorItems(actor) {
    const items = actor?.items;
    if (!items)
        return [];
    if (Array.isArray(items))
        return items;
    if (items instanceof Map)
        return Array.from(items.values());
    if (typeof items.values === 'function')
        return Array.from(items.values());
    return [];
}
/** Highest Power Level of a slotted Passive matching templateId (0 if none). */
export function slottedPassiveLevel(actor, templateId) {
    const want = String(templateId || '').toLowerCase();
    if (!actor || !want)
        return 0;
    let best = 0;
    for (const slot of getPassiveSlots(actor)) {
        if (slot.locked || !slot.passive?.id)
            continue;
        const item = findPassivePowerItem(actor, String(slot.passive.id));
        if (!item)
            continue;
        const tid = String(item.system?.templateId ?? '').toLowerCase();
        if (tid !== want)
            continue;
        const lvl = Math.max(1, Math.min(16, Math.floor(Number(item.system?.level ?? item.system?.rank ?? slot.passive.level ?? 1) || 1)));
        if (lvl > best)
            best = lvl;
    }
    // Fallback: owned Power with matching template (sheet display / unslotted check).
    if (best > 0)
        return best;
    return 0;
}
/** Owned (not necessarily slotted) Passive level — used for catalogue tests. */
export function ownedPassiveLevel(actor, templateId) {
    const want = String(templateId || '').toLowerCase();
    let best = 0;
    for (const item of actorItems(actor)) {
        if (item?.type !== 'power')
            continue;
        if (String(item.system?.templateId ?? '').toLowerCase() !== want)
            continue;
        const lvl = Math.max(1, Math.min(16, Math.floor(Number(item.system?.level ?? item.system?.rank ?? 1) || 1)));
        if (lvl > best)
            best = lvl;
    }
    return best;
}
export function passiveCriticalChargesForLevel(level) {
    return phasingStyleCombatCharges(level);
}
export function passiveMaximizationChargesForLevel(level) {
    return phasingStyleCombatCharges(level);
}
function readChargeFlag(actor, key, combatId) {
    const raw = actor?.getFlag?.(FLAG_SCOPE, key);
    if (!raw || String(raw.combatId || '') !== String(combatId || ''))
        return null;
    return {
        combatId: String(raw.combatId),
        granted: Math.max(0, Math.floor(Number(raw.granted) || 0)),
        remaining: Math.max(0, Math.floor(Number(raw.remaining) || 0)),
    };
}
export function getPassiveCriticalRemaining(actor, combat) {
    const c = combat ?? globalThis.game?.combat;
    if (!actor || !c?.id)
        return 0;
    const flag = readChargeFlag(actor, PASSIVE_CRIT_FLAG, String(c.id));
    if (flag)
        return flag.remaining;
    // Not yet granted this combat — report allowance from slotted PL (UI preview).
    return passiveCriticalChargesForLevel(slottedPassiveLevel(actor, PASSIVE_CRITICAL_TEMPLATE_ID));
}
export function getPassiveMaximizationRemaining(actor, combat) {
    const c = combat ?? globalThis.game?.combat;
    if (!actor || !c?.id)
        return 0;
    const flag = readChargeFlag(actor, PASSIVE_MAX_FLAG, String(c.id));
    if (flag)
        return flag.remaining;
    return passiveMaximizationChargesForLevel(slottedPassiveLevel(actor, PASSIVE_MAXIMIZATION_TEMPLATE_ID));
}
export async function grantPassiveCombatCharges(actor, combat) {
    if (!actor || !combat?.id)
        return;
    const combatId = String(combat.id);
    const critGranted = passiveCriticalChargesForLevel(slottedPassiveLevel(actor, PASSIVE_CRITICAL_TEMPLATE_ID));
    const maxGranted = passiveMaximizationChargesForLevel(slottedPassiveLevel(actor, PASSIVE_MAXIMIZATION_TEMPLATE_ID));
    const priorCrit = readChargeFlag(actor, PASSIVE_CRIT_FLAG, combatId);
    if (!priorCrit && critGranted > 0) {
        await actor.setFlag?.(FLAG_SCOPE, PASSIVE_CRIT_FLAG, {
            combatId,
            granted: critGranted,
            remaining: critGranted,
        });
    }
    const priorMax = readChargeFlag(actor, PASSIVE_MAX_FLAG, combatId);
    if (!priorMax && maxGranted > 0) {
        await actor.setFlag?.(FLAG_SCOPE, PASSIVE_MAX_FLAG, {
            combatId,
            granted: maxGranted,
            remaining: maxGranted,
        });
    }
}
export async function spendPassiveCriticalCharge(actor, combat) {
    const c = combat ?? globalThis.game?.combat;
    if (!actor || !c?.id)
        return false;
    const combatId = String(c.id);
    let flag = readChargeFlag(actor, PASSIVE_CRIT_FLAG, combatId);
    if (!flag) {
        await grantPassiveCombatCharges(actor, c);
        flag = readChargeFlag(actor, PASSIVE_CRIT_FLAG, combatId);
    }
    if (!flag || flag.remaining <= 0)
        return false;
    await actor.setFlag?.(FLAG_SCOPE, PASSIVE_CRIT_FLAG, {
        ...flag,
        remaining: flag.remaining - 1,
    });
    return true;
}
export async function spendPassiveMaximizationCharge(actor, combat) {
    const c = combat ?? globalThis.game?.combat;
    if (!actor || !c?.id)
        return false;
    const combatId = String(c.id);
    let flag = readChargeFlag(actor, PASSIVE_MAX_FLAG, combatId);
    if (!flag) {
        await grantPassiveCombatCharges(actor, c);
        flag = readChargeFlag(actor, PASSIVE_MAX_FLAG, combatId);
    }
    if (!flag || flag.remaining <= 0)
        return false;
    await actor.setFlag?.(FLAG_SCOPE, PASSIVE_MAX_FLAG, {
        ...flag,
        remaining: flag.remaining - 1,
    });
    return true;
}
/** Pure helper for tests / sync spend on in-memory state. */
export function applyPassiveCriticalSpend(flag) {
    if (!flag || flag.remaining <= 0)
        return flag ?? null;
    return { ...flag, remaining: flag.remaining - 1 };
}
export async function clearPassiveCombatChargesForCombat(combat) {
    if (!combat)
        return;
    const combatId = String(combat.id || '');
    const bag = combat.combatants;
    const rows = bag
        ? typeof bag.values === 'function'
            ? Array.from(bag.values())
            : Array.isArray(bag)
                ? bag
                : []
        : [];
    const seen = new Set();
    for (const c of rows) {
        const actor = c?.actor;
        const id = String(actor?.id || '');
        if (!id || seen.has(id) || !actor)
            continue;
        seen.add(id);
        for (const key of [PASSIVE_CRIT_FLAG, PASSIVE_MAX_FLAG]) {
            const raw = actor.getFlag?.(FLAG_SCOPE, key);
            if (raw && String(raw.combatId || '') === combatId) {
                await actor.unsetFlag?.(FLAG_SCOPE, key);
            }
        }
    }
}
//# sourceMappingURL=passive-combat-charges.js.map