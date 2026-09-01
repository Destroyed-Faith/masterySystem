/**
 * Artifact Stone Function aggregator
 *
 * Walks an actor's equipped (or echo-bound) artifacts and resolves their
 * Stone Functions. Most artifacts carry a single Stone Function, but an
 * artifact may define up to three (one per Basic-level progression pick) —
 * e.g. the Sentinel frames pair a Stone Battery with a Stone Power Support.
 *
 * Surfaces:
 *   - `getArtifactStoneSupportPrefill(actor, powerId, poolAttribute?)`
 *       → tier (0..8) the matching Stone Power Support prefills.
 *   - `getArtifactStoneFunctionStatus(actor)`
 *       → list of `{kind, attribute, level, value, source, stonePowerId?}`.
 *   - `getArtifactStonePoolExtraByAttribute(actor)` → per-attribute extra
 *     stones from `stonePool` functions.
 *   - `getArtifactStoneRefreshExtraByAttribute(actor)` → per-attribute
 *     per-round refresh from `stoneRefresh` functions.
 *   - `getArtifactStoneBatteryCapacityByAttribute(actor)` → per-attribute
 *     battery slots from `stoneBattery` functions.
 *
 * The helpers never mutate the actor. They're called from
 * `prepareDerivedData` (read-only) and from `activateStonePower` (read-only).
 */
import { getStonePoolStoredStones, getStonePowerSupportPrefillTier, getStoneRefreshAmount, getStoneBatteryCapacity, } from './artifact-rules.js';
import { isArtifactMechanicallyActive } from './artifact-actor-rules.js';
import { resolveStonePowerId, effectiveStoneSupportPrefillTier, STONE_POWER_SUPPORT_TIER_SHIFT, STONE_TIER_HARD_MAX, } from '../stones/stone-powers.js';
function resolveStoneFunction(item) {
    const sys = item?.system || {};
    const fn = sys.stoneFunction;
    if (!fn || typeof fn !== 'object')
        return null;
    const kind = fn.kind;
    const attr = fn.attribute;
    if (!kind || !attr)
        return null;
    return fn;
}
/**
 * Collect every Stone Function active on a single artifact item at its current
 * level. An artifact can carry up to three Stone Functions — one per Basic-level
 * progression pick (e.g. the Sentinel frames: a Resolve Stone Battery on one
 * slot and a Resolve Healing Support on another). Each pick is gated by the
 * Basic level it is introduced at (`pick.level <= currentLevel`).
 *
 * Falls back to the single legacy `sys.stoneFunction` only when the item carries
 * no Stone Function picks (older seeds / hand-built items), so artifacts using
 * the `def.stoneFunction` shortcut keep working without double-counting.
 */
function collectStoneFunctionsForItem(item, currentLevel) {
    const sys = item?.system || {};
    const picks = Array.isArray(sys.progressionPicks) ? sys.progressionPicks : [];
    const fromPicks = [];
    for (const pick of picks) {
        if (!pick || pick.kind !== 'stoneFunction')
            continue;
        const fn = pick.stoneFunction;
        if (!fn || typeof fn !== 'object' || !fn.kind || !fn.attribute)
            continue;
        const baseLevel = Math.max(1, Number(pick.level) || 1);
        if (currentLevel < baseLevel)
            continue;
        fromPicks.push(fn);
    }
    const extras = Array.isArray(sys.extraStoneFunctions) ? sys.extraStoneFunctions : [];
    for (const extra of extras) {
        if (!extra || typeof extra !== 'object' || !extra.kind || !extra.attribute)
            continue;
        if (currentLevel < Math.max(1, Number(extra.level) || 1))
            continue;
        fromPicks.push(extra);
    }
    if (fromPicks.length > 0)
        return fromPicks;
    const legacy = resolveStoneFunction(item);
    return legacy ? [legacy] : [];
}
function stagedSupportPrefill(level, stages) {
    if (level < stages[0])
        return 0;
    if (level < stages[1])
        return 2;
    if (level < stages[2])
        return 3;
    return 4;
}
function stagedPoolValue(level, stages) {
    if (level < stages[0])
        return 0;
    if (level < stages[1])
        return 2;
    if (level < stages[2])
        return 4;
    return 8;
}
function valueForFunction(kind, level) {
    switch (kind) {
        case 'stonePowerSupport':
            return getStonePowerSupportPrefillTier(level);
        case 'stonePool':
            return getStonePoolStoredStones(level);
        case 'stoneRefresh':
            return getStoneRefreshAmount(level);
        case 'stoneBattery':
            return getStoneBatteryCapacity(level);
        default:
            return 0;
    }
}
/**
 * Collect every Stone Function on an equipped / echo-bound artifact.
 * Pure / non-mutating.
 */
export function getArtifactStoneFunctions(actor) {
    const out = [];
    if (!actor?.items)
        return out;
    const items = Array.from(actor.items);
    for (const item of items) {
        if (item?.type !== 'artifact')
            continue;
        if (!isArtifactMechanicallyActive(actor, item))
            continue;
        const sys = item.system || {};
        const level = Math.max(1, Math.min(10, Number(sys.currentLevel) || Number(sys.level) || 1));
        for (const fn of collectStoneFunctionsForItem(item, level)) {
            const extra = fn;
            const value = extra.kind === 'stonePowerSupport' && extra.supportStages
                ? stagedSupportPrefill(level, extra.supportStages)
                : extra.kind === 'stonePool' && extra.poolStages
                    ? stagedPoolValue(level, extra.poolStages)
                    : valueForFunction(fn.kind, level);
            if (value <= 0 && fn.kind !== 'stonePowerSupport')
                continue;
            const rec = {
                kind: fn.kind,
                attribute: String(fn.attribute || ''),
                level,
                value,
                source: item.name || 'Artifact',
                artifactItemId: item.id,
            };
            if (fn.kind === 'stonePowerSupport' && fn.stonePowerId) {
                rec.stonePowerId = String(fn.stonePowerId);
            }
            out.push(rec);
        }
    }
    return out;
}
function sumByAttribute(records) {
    const out = {};
    for (const r of records) {
        if (r.attribute)
            out[r.attribute] = (out[r.attribute] || 0) + r.value;
    }
    return out;
}
export function getArtifactStonePoolExtraByAttribute(actor) {
    return sumByAttribute(getArtifactStoneFunctions(actor).filter((r) => r.kind === 'stonePool'));
}
export function getArtifactStoneRefreshExtraByAttribute(actor) {
    return sumByAttribute(getArtifactStoneFunctions(actor).filter((r) => r.kind === 'stoneRefresh'));
}
export function getArtifactStoneBatteryCapacityByAttribute(actor) {
    return sumByAttribute(getArtifactStoneFunctions(actor).filter((r) => r.kind === 'stoneBattery'));
}
/**
 * Highest tier prefilled by any matching Stone Power Support on the actor.
 *
 * Match rules:
 *   • Support's `stonePowerId` must equal `powerId` exactly.
 *   • If `poolAttribute` is provided, the Support's attribute must also
 *     equal the pool attribute (for attribute-scoped pools).
 *
 * Returns 0 when no matching Support exists, otherwise the prefill tier
 * (1..8). The activation pipeline interprets this as "the first
 * activation of `powerId` acts as if it had been used `prefill-1` times
 * already this turn". Shifted tables (Crit, Not a Target) can land on T5.
 */
export function getArtifactStoneSupportPrefill(actor, powerId, poolAttribute) {
    if (!actor || !powerId)
        return 0;
    const supports = getArtifactStoneFunctions(actor).filter((r) => r.kind === 'stonePowerSupport');
    let best = 0;
    const resolvedId = resolveStonePowerId(powerId);
    for (const s of supports) {
        const supportId = resolveStonePowerId(String(s.stonePowerId || ''));
        if (!supportId || supportId !== resolvedId)
            continue;
        if (poolAttribute && s.attribute !== poolAttribute)
            continue;
        const shift = STONE_POWER_SUPPORT_TIER_SHIFT[resolvedId] ?? 0;
        const printed = Math.min(STONE_TIER_HARD_MAX, Math.max(0, s.value + shift));
        const value = effectiveStoneSupportPrefillTier(resolvedId, printed);
        if (value > best)
            best = value;
    }
    return best;
}
/**
 * Status summary suitable for the character sheet / stone dialog.
 */
export function getArtifactStoneFunctionStatus(actor) {
    const records = getArtifactStoneFunctions(actor);
    return {
        records,
        pool: sumByAttribute(records.filter((r) => r.kind === 'stonePool')),
        refresh: sumByAttribute(records.filter((r) => r.kind === 'stoneRefresh')),
        battery: sumByAttribute(records.filter((r) => r.kind === 'stoneBattery')),
        supports: records.filter((r) => r.kind === 'stonePowerSupport'),
    };
}
//# sourceMappingURL=artifact-stone-functions.js.map