/**
 * Artifact Stone Function aggregator
 *
 * Walks an actor's equipped (or echo-bound) artifacts and resolves their
 * Stone Function (the unique "engine" slot on every artifact). One Stone
 * Function per artifact, attribute-gated by the artifact slot.
 *
 * Surfaces:
 *   - `getArtifactStoneSupportPrefill(actor, powerId, poolAttribute?)`
 *       → tier (0..4) the matching Stone Power Support prefills.
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

import {
    getStonePoolStoredStones,
    getStonePowerSupportPrefillTier,
    getStoneRefreshAmount,
    getStoneBatteryCapacity,
} from './artifact-rules.js';
import { getArtifactBindingKind } from './artifact-actor-rules.js';
import type { ArtifactStoneFunction, ArtifactStoneFunctionKind } from '../types/item.js';

export interface ArtifactStoneFunctionRecord {
    kind: ArtifactStoneFunctionKind;
    /** Attribute pool this function is tied to (e.g. 'might', 'agility'). */
    attribute: string;
    /** Resolved artifact level. */
    level: number;
    /** Numeric value the function contributes (tier for Support, stones for Pool/Refresh/Battery). */
    value: number;
    /** Source artifact item name (for breakdown). */
    source: string;
    /** Source artifact item id. */
    artifactItemId?: string;
    /** Stone Power id (only set for Support). */
    stonePowerId?: string;
}

function isArtifactEquipped(item: any): boolean {
    if (!item) return false;
    if (getArtifactBindingKind(item) === 'echo') return true;
    if ((item.system as any)?.equipped === true) return true;
    try {
        const flagSlot = item.getFlag?.('mastery-system', 'equipment')?.slot;
        if (typeof flagSlot === 'string' && flagSlot.length > 0) return true;
    } catch {
        // ignore
    }
    return false;
}

function resolveStoneFunction(item: any): ArtifactStoneFunction | null {
    const sys = (item?.system as any) || {};
    const fn = sys.stoneFunction;
    if (!fn || typeof fn !== 'object') return null;
    const kind = fn.kind;
    const attr = fn.attribute;
    if (!kind || !attr) return null;
    return fn as ArtifactStoneFunction;
}

function valueForFunction(kind: ArtifactStoneFunctionKind, level: number): number {
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
export function getArtifactStoneFunctions(actor: any): ArtifactStoneFunctionRecord[] {
    const out: ArtifactStoneFunctionRecord[] = [];
    if (!actor?.items) return out;
    const items: any[] = Array.from(actor.items);
    for (const item of items) {
        if (item?.type !== 'artifact') continue;
        if (!isArtifactEquipped(item)) continue;
        const fn = resolveStoneFunction(item);
        if (!fn) continue;
        const sys = (item.system as any) || {};
        const level = Math.max(1, Math.min(10, Number(sys.currentLevel) || Number(sys.level) || 1));
        const value = valueForFunction(fn.kind, level);
        if (value <= 0 && fn.kind !== 'stonePowerSupport') continue;

        const rec: ArtifactStoneFunctionRecord = {
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
    return out;
}

function sumByAttribute(records: ArtifactStoneFunctionRecord[]): Record<string, number> {
    const out: Record<string, number> = {};
    for (const r of records) {
        if (r.attribute) out[r.attribute] = (out[r.attribute] || 0) + r.value;
    }
    return out;
}

export function getArtifactStonePoolExtraByAttribute(actor: any): Record<string, number> {
    return sumByAttribute(getArtifactStoneFunctions(actor).filter((r) => r.kind === 'stonePool'));
}

export function getArtifactStoneRefreshExtraByAttribute(actor: any): Record<string, number> {
    return sumByAttribute(
        getArtifactStoneFunctions(actor).filter((r) => r.kind === 'stoneRefresh'),
    );
}

export function getArtifactStoneBatteryCapacityByAttribute(actor: any): Record<string, number> {
    return sumByAttribute(
        getArtifactStoneFunctions(actor).filter((r) => r.kind === 'stoneBattery'),
    );
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
 * (1..4). The activation pipeline interprets this as "the first
 * activation of `powerId` acts as if it had been used `prefill-1` times
 * already this turn".
 */
export function getArtifactStoneSupportPrefill(
    actor: any,
    powerId: string,
    poolAttribute?: string,
): number {
    if (!actor || !powerId) return 0;
    const supports = getArtifactStoneFunctions(actor).filter(
        (r) => r.kind === 'stonePowerSupport',
    );
    let best = 0;
    for (const s of supports) {
        if (!s.stonePowerId || s.stonePowerId !== powerId) continue;
        if (poolAttribute && s.attribute !== poolAttribute) continue;
        if (s.value > best) best = s.value;
    }
    return best;
}

/**
 * Status summary suitable for the character sheet / stone dialog.
 */
export function getArtifactStoneFunctionStatus(actor: any): {
    records: ArtifactStoneFunctionRecord[];
    pool: Record<string, number>;
    refresh: Record<string, number>;
    battery: Record<string, number>;
    supports: ArtifactStoneFunctionRecord[];
} {
    const records = getArtifactStoneFunctions(actor);
    return {
        records,
        pool: sumByAttribute(records.filter((r) => r.kind === 'stonePool')),
        refresh: sumByAttribute(records.filter((r) => r.kind === 'stoneRefresh')),
        battery: sumByAttribute(records.filter((r) => r.kind === 'stoneBattery')),
        supports: records.filter((r) => r.kind === 'stonePowerSupport'),
    };
}
