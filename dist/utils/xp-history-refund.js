/**
 * Cascade refund of one XP-history spend row.
 *
 * Drops the live value from current down to the row's `from` (floored at the
 * creation baseline) and refunds the *current* cost table, not the stored amount.
 */
import { applyAttributePendingChanges, applyPowerPendingChanges, applySkillPendingChanges, getAttributeXpBaseline, } from '../progression/progression-hub-actions.js';
import { downgradeArtifactForActor } from '../artifacts/artifact-evolution-actions.js';
import { attributeBandCost, powerLevelCost } from './constants.js';
import { getPowerMinLevel } from './power-xp-refund.js';
const ARTIFACT_STEP_XP = 8;
const REFUNDABLE_CATEGORIES = new Set(['attribute', 'skill', 'power', 'artifact']);
export function liveRefundXp(category, current, target) {
    if (current <= target)
        return 0;
    if (category === 'artifact')
        return (current - target) * ARTIFACT_STEP_XP;
    let sum = 0;
    for (let v = current; v > target; v--) {
        sum += category === 'power' ? powerLevelCost(v) : attributeBandCost(v);
    }
    return sum;
}
function resolveArtifactItem(actor, key, label) {
    const items = actor?.items;
    if (!items)
        return undefined;
    if (key && typeof items.get === 'function') {
        const byId = items.get(key);
        if (byId)
            return byId;
    }
    const list = typeof items.filter === 'function' ? Array.from(items.filter((i) => i.type === 'artifact')) : [];
    if (key) {
        const byId = list.find(i => i.id === key);
        if (byId)
            return byId;
    }
    if (label) {
        return list.find(i => String(i.name || '') === label);
    }
    return undefined;
}
function readCurrentAndFloor(actor, category, key, label) {
    if (category === 'attribute') {
        const current = Number(actor?.system?.attributes?.[key]?.value ?? NaN);
        if (!Number.isFinite(current))
            return { error: 'Attribute not found.' };
        return { current, floor: getAttributeXpBaseline(actor, key), resolvedKey: key };
    }
    if (category === 'skill') {
        const current = Number(actor?.system?.skills?.[key] ?? NaN);
        if (!Number.isFinite(current))
            return { error: 'Skill not found.' };
        return { current, floor: 0, resolvedKey: key };
    }
    if (category === 'power') {
        const item = actor?.items?.get?.(key);
        if (!item)
            return { error: 'Power not found.' };
        const current = Number(item.system?.level ?? 1) || 1;
        return { current, floor: getPowerMinLevel(item), resolvedKey: key };
    }
    if (category === 'artifact') {
        const item = resolveArtifactItem(actor, key, label);
        if (!item)
            return { error: 'Artifact not found.' };
        const current = Number(item.system?.level ?? 1) || 1;
        return { current, floor: 1, resolvedKey: String(item.id || key) };
    }
    return { error: 'Not a spend that can be refunded.' };
}
export function planHistoryRefund(actor, row) {
    const category = String(row.category || '');
    const key = String(row.key || '').trim();
    const label = String(row.what || key || category);
    const base = {
        refundable: false,
        category,
        key,
        label,
        current: 0,
        target: 0,
        floor: 0,
        pending: 0,
        refundXp: 0,
    };
    if (row.kind !== 'spend') {
        return { ...base, reason: 'Only spend rows can be refunded.' };
    }
    if (!REFUNDABLE_CATEGORIES.has(category)) {
        return { ...base, reason: 'This category cannot be refunded from history.' };
    }
    if (!key && category !== 'artifact') {
        return { ...base, reason: 'History row is missing its target key.' };
    }
    const from = Number(row.from);
    if (!Number.isFinite(from)) {
        return { ...base, reason: 'History row is missing its from-value.' };
    }
    const nameHint = String(row.what || '').replace(/\s+\d+\s*→\s*\d+\s*$/, '').trim();
    const read = readCurrentAndFloor(actor, category, key, nameHint);
    if ('error' in read) {
        return { ...base, reason: read.error };
    }
    const target = Math.max(from, read.floor);
    const pending = target - read.current;
    const refundXp = liveRefundXp(category, read.current, target);
    if (read.current <= target) {
        return {
            ...base,
            key: read.resolvedKey,
            current: read.current,
            target,
            floor: read.floor,
            pending: 0,
            refundXp: 0,
            reason: 'This step is no longer in effect.',
        };
    }
    return {
        refundable: true,
        category,
        key: read.resolvedKey,
        label,
        current: read.current,
        target,
        floor: read.floor,
        pending,
        refundXp,
    };
}
export function canRefundHistoryRow(actor, row) {
    return planHistoryRefund(actor, row).refundable;
}
export async function refundHistoryRow(actor, row) {
    const isGM = Boolean(globalThis.game?.user?.isGM);
    if (!isGM) {
        return { ok: false, error: 'Only the GM can refund XP history steps.' };
    }
    const plan = planHistoryRefund(actor, row);
    if (!plan.refundable) {
        return { ok: false, error: plan.reason || 'This step cannot be refunded.', plan };
    }
    if (plan.category === 'attribute') {
        const res = await applyAttributePendingChanges(actor, { [plan.key]: plan.pending });
        return { ok: res.ok, error: res.error, plan };
    }
    if (plan.category === 'skill') {
        const res = await applySkillPendingChanges(actor, { [plan.key]: plan.pending });
        return { ok: res.ok, error: res.error, plan };
    }
    if (plan.category === 'power') {
        const res = await applyPowerPendingChanges(actor, { [plan.key]: plan.pending });
        return { ok: res.ok, error: res.error, plan };
    }
    if (plan.category === 'artifact') {
        const res = await downgradeArtifactForActor(actor, plan.key, plan.target);
        return { ok: res.ok, error: res.error, plan };
    }
    return { ok: false, error: 'Unsupported refund category.', plan };
}
//# sourceMappingURL=xp-history-refund.js.map