/**
 * Rules v0.9.9.6 world migration (GM, once per world, chat report).
 *
 * Runs on GM world load after the Actives v0.9.9.6 dry run and before the
 * gate-free template resync, so every value change is reported with its old
 * value. Every written document keeps a backup in
 * `flags.mastery-system.v0996WorldBackup`; `rollbackV0996WorldActor` restores it.
 *
 *   1. Power items whose template changed outside the Actives review
 *      (e.g. Reaction: Reposition, Mental Control, Protective Auras): re-baked
 *      from the current template; "Reaction: Reactive Cleanse" default names
 *      become "Reaction: Cleanse". Actives held for the Actives v0.9.9.6
 *      review are only counted.
 *   2. Artifact trees changed by v0.9.9.6 (Dragon Head, Elorian Stride,
 *      Ringchain of Kept Names, Hunter's Scourge, Frostbound Returning Axe,
 *      Lor-Keth's Titanstorm Staff): library refreshed and pushed to linked
 *      actor copies; unlinked copies are listed only.
 *   3. NPC Basic Evade / Guard Reaction rows (no longer a rule) are removed.
 *   4. Last Breath: when the flag is set and an Attribute Stone is Burned,
 *      convert 1 Burned → Sealed of that Attribute (identical Rest return).
 *   5. Unprinted catalogue Powers still owned: mark Retired (v0.9.9.6); they
 *      cannot be used; the GM chat report lists them for a free same-type swap.
 *
 * Nothing is merged, refunded or deleted except inert NPC Basic Evade/Guard rows.
 * Idempotent: the world state is set to `applied`; per-document markers skip
 * already migrated documents.
 */

import {
    collectV0996Actors,
} from './actives-v0996-migration.js';
import {
    isActivesV0996HeldTemplate,
    isActivesV0996ResyncHeld,
    previewPowerItemResync,
    resyncPowerItemFromTemplate,
} from './power-template-resync-migration.js';
import {
    coerceNpcReactionsArray,
    isNpcLikeActor,
    isNpcRetiredBasicReactionRow,
} from '../utils/npc-reactions.js';
import { coerceNpcPhasesArray } from '../utils/npc-attack-model.js';
import { LAST_BREATH_FLAG } from '../stones/last-breath.js';
import { STONE_POOL_ATTRIBUTE_KEYS } from '../combat/action-economy.js';
import {
    isCanonicalPassiveTemplateId,
    isSelectableActiveBuffTemplateId,
    isSelectableReactionTemplateId,
} from '../utils/power-catalog.js';
import { V0996_RETIRED_FLAG } from './actives-v0996-migration.js';

const FLAG_SCOPE = 'mastery-system';
export const V0996_WORLD_STATE_KEY = 'v0996WorldMigrationState';
/** Second pass for worlds that already applied the first v0.9.9.6 migration. */
export const V0996_DELTA_B_STATE_KEY = 'v0996DeltaBMigrationState';
export const V0996_WORLD_BACKUP_FLAG = 'v0996WorldBackup';
export const V0996_WORLD_MIGRATED_FLAG = 'v0996WorldMigrated';
export const V0996_LAST_BREATH_CONVERTED_FLAG = 'v0996LastBreathConverted';

/** Artifact library keys whose generator output changed in v0.9.9.6. */
export const V0996_CHANGED_ARTIFACT_KEYS = [
    'dragonHead',
    'elorianStride',
    'ringchainOfKeptNames',
    'huntersScourge',
    'frostboundReturningAxe',
    'lorKethsStaff',
] as const;

/** Old default item names → v0.9.9.6 name (per templateId). */
const V0996_RENAMES: Record<string, { from: string[]; to: string; templateName: string }> = {
    'reaction-reactive-cleanse': {
        from: ['Reaction: Reactive Cleanse', 'Reactive Cleanse'],
        to: 'Reaction: Cleanse',
        templateName: 'Cleanse',
    },
};

export interface V0996WorldPowerChange {
    actorName: string;
    actorUuid: string;
    itemId: string;
    itemName: string;
    templateId: string;
    rank: number;
    rename: string | null;
    before: string;
    after: string;
}

export interface V0996WorldArtifactRow {
    actorName: string;
    actorUuid: string;
    itemId: string;
    itemName: string;
    key: string;
    linked: boolean;
}

export interface V0996WorldNpcEvadeRow {
    actorName: string;
    actorUuid: string;
    removed: number;
}

export interface V0996WorldInfoRow {
    actorName: string;
    actorUuid: string;
    note: string;
}

export interface V0996WorldRetiredRow {
    actorName: string;
    actorUuid: string;
    itemId: string;
    itemName: string;
    templateId: string;
    rank: number;
    category: string;
}

export interface V0996WorldLastBreathConvertRow {
    actorName: string;
    actorUuid: string;
    attribute: string | null;
    note: string;
}

export interface V0996WorldReport {
    generatedAt: string;
    powers: V0996WorldPowerChange[];
    heldForActivesReview: number;
    artifactTrees: string[];
    artifacts: V0996WorldArtifactRow[];
    npcEvade: V0996WorldNpcEvadeRow[];
    lastBreath: V0996WorldLastBreathConvertRow[];
    retired: V0996WorldRetiredRow[];
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function readFlag(doc: any, key: string): unknown {
    if (typeof doc?.getFlag === 'function') {
        try {
            return doc.getFlag(FLAG_SCOPE, key);
        } catch {
            /* fall through */
        }
    }
    return doc?.flags?.[FLAG_SCOPE]?.[key];
}

function docItems(doc: any): any[] {
    const items = doc?.items;
    if (!items) return [];
    if (Array.isArray(items)) return items;
    if (Array.isArray(items.contents)) return items.contents;
    if (typeof items.values === 'function') return Array.from(items.values());
    return [];
}

function actorUuid(actor: any): string {
    return String(actor?.uuid ?? actor?.id ?? '');
}

function itemRank(item: any): number {
    const sys = item?.system ?? {};
    return Math.max(1, Math.min(16, Math.floor(Number(sys.rank ?? sys.level ?? 1) || 1)));
}

function plainText(s: unknown): string {
    return String(s ?? '')
        .replace(/\*\*/g, '')
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function clone<T>(v: T): T {
    return v === undefined ? v : JSON.parse(JSON.stringify(v));
}

function escHtml(s: string): string {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export function getV0996WorldMigrationState(g: any = (globalThis as any).game): string {
    try {
        return String(g?.settings?.get?.(FLAG_SCOPE, V0996_WORLD_STATE_KEY) ?? '');
    } catch {
        return '';
    }
}

export function getV0996DeltaBMigrationState(g: any = (globalThis as any).game): string {
    try {
        return String(g?.settings?.get?.(FLAG_SCOPE, V0996_DELTA_B_STATE_KEY) ?? '');
    } catch {
        return '';
    }
}

export function registerV0996WorldMigrationSetting(): void {
    try {
        (game as any).settings.register(FLAG_SCOPE, V0996_WORLD_STATE_KEY, {
            name: 'Rules v0.9.9.6 World Migration State',
            hint: 'Internal: "applied" once the v0.9.9.6 world migration ran.',
            scope: 'world',
            config: false,
            type: String,
            default: 'pending',
        });
        (game as any).settings.register(FLAG_SCOPE, V0996_DELTA_B_STATE_KEY, {
            name: 'Rules v0.9.9.6 Delta B Migration State',
            hint: 'Internal: Guard removal, Last Breath seal convert, unprinted Power retirement.',
            scope: 'world',
            config: false,
            type: String,
            default: 'pending',
        });
    } catch (err) {
        console.warn('Mastery System | v0.9.9.6 world migration: setting register failed', err);
    }
}

/** Owned template-backed Powers that are not printed in the v0.9.9.6 catalogues. */
export function isUnprintedV0996CatalogueTemplate(
    templateId: string,
    category: string,
): boolean {
    const tid = String(templateId || '').trim();
    if (!tid || tid.startsWith('basic-')) return false;
    const cat = String(category || '').trim();
    if (cat === 'reaction') return !isSelectableReactionTemplateId(tid);
    if (cat === 'activeBuff') return !isSelectableActiveBuffTemplateId(tid);
    if (cat === 'passive') return !isCanonicalPassiveTemplateId(tid);
    return false;
}

/* ------------------------------------------------------------------ */
/* Planning (pure reads)                                               */
/* ------------------------------------------------------------------ */

/** Power items whose stored values or default name differ from v0.9.9.6. */
export function planV0996WorldPowers(actor: any): { changes: V0996WorldPowerChange[]; held: number } {
    const changes: V0996WorldPowerChange[] = [];
    let held = 0;
    const activesHeld = isActivesV0996ResyncHeld();
    for (const item of docItems(actor)) {
        if (item?.type !== 'power') continue;
        if (readFlag(item, V0996_WORLD_MIGRATED_FLAG) === true) continue;
        if (readFlag(item, 'v0996Conflict') || readFlag(item, 'v0996Retired') === true) continue;
        const preview = previewPowerItemResync(item);
        if (!preview) continue;
        const templateId = preview.templateId;
        const renameSpec = V0996_RENAMES[templateId];
        const name = String(item?.name ?? '');
        const rename = renameSpec && renameSpec.from.includes(name) ? renameSpec.to : null;
        if (!preview.changed && !rename) continue;
        if (preview.changed && activesHeld && isActivesV0996HeldTemplate(templateId)) {
            held += 1;
            continue;
        }
        const rank = itemRank(item);
        const before = plainText(item?.system?.levels?.[String(rank)]?.effect?.text ?? item?.system?.effect);
        const after = plainText((preview.levels as any)?.[String(rank)]?.effect?.text);
        changes.push({
            actorName: String(actor?.name ?? 'Actor'),
            actorUuid: actorUuid(actor),
            itemId: String(item?.id ?? ''),
            itemName: name,
            templateId,
            rank,
            rename,
            before: preview.changed ? before : '',
            after: preview.changed ? (after === before ? '(same text at this PL; other PL rows changed)' : after) : '',
        });
    }
    return { changes, held };
}

/** Actor-owned copies of the changed Artifact trees. */
export function planV0996WorldArtifacts(actor: any): V0996WorldArtifactRow[] {
    const keys = new Set<string>(V0996_CHANGED_ARTIFACT_KEYS);
    const out: V0996WorldArtifactRow[] = [];
    for (const item of docItems(actor)) {
        if (item?.type !== 'artifact') continue;
        if (readFlag(item, V0996_WORLD_MIGRATED_FLAG) === true) continue;
        const key = String(readFlag(item, 'echoArtifactKey') ?? '');
        if (!keys.has(key)) continue;
        out.push({
            actorName: String(actor?.name ?? 'Actor'),
            actorUuid: actorUuid(actor),
            itemId: String(item?.id ?? ''),
            itemName: String(item?.name ?? ''),
            key,
            linked: !!readFlag(item, 'evolutionRootItemId') && !!readFlag(item, 'evolutionNodeId'),
        });
    }
    return out;
}

function countRetiredBasicRows(raw: unknown): number {
    return coerceNpcReactionsArray(raw).filter((r) => isNpcRetiredBasicReactionRow(r)).length;
}

/** Stored NPC Basic Evade / Guard rows (top level + every phase). */
export function planV0996WorldNpcEvade(actor: any): V0996WorldNpcEvadeRow | null {
    if (!isNpcLikeActor(actor)) return null;
    const sys = actor?.system ?? {};
    let removed = countRetiredBasicRows(sys.npcReactions);
    for (const phase of coerceNpcPhasesArray(sys.phases)) {
        removed += countRetiredBasicRows(phase?.npcReactions);
    }
    if (removed <= 0) return null;
    return { actorName: String(actor?.name ?? 'NPC'), actorUuid: actorUuid(actor), removed };
}

/** Actors with Last Breath used and a Burned Attribute Stone to convert → Sealed. */
export function planV0996WorldLastBreath(actor: any): V0996WorldLastBreathConvertRow | null {
    if (readFlag(actor, LAST_BREATH_FLAG) !== true) return null;
    if (readFlag(actor, V0996_LAST_BREATH_CONVERTED_FLAG) === true) return null;
    const pools = actor?.system?.stonePools ?? {};
    const attr = STONE_POOL_ATTRIBUTE_KEYS.find((k) => Math.floor(Number(pools?.[k]?.burned) || 0) > 0) ?? null;
    const colorlessBurned = Math.floor(Number(pools?.colorless?.burned) || 0) > 0;
    if (!attr && !colorlessBurned) return null;
    return {
        actorName: String(actor?.name ?? 'Actor'),
        actorUuid: actorUuid(actor),
        attribute: attr,
        note: attr
            ? `Convert 1 Burned ${attr} Stone → Sealed (Last Breath under the old rule).`
            : 'Last Breath used; only temporary Colorless Stone(s) Burned — not restored.',
    };
}

/** Owned unprinted Reactions / Active Buffs / Passives still usable before retirement. */
export function planV0996WorldRetired(actor: any): V0996WorldRetiredRow[] {
    const out: V0996WorldRetiredRow[] = [];
    for (const item of docItems(actor)) {
        if (item?.type !== 'power') continue;
        if (readFlag(item, V0996_RETIRED_FLAG) === true) continue;
        const sys = item?.system ?? {};
        const tid = String(sys.templateId ?? '').trim();
        const cat = String(sys.powerType ?? sys.category ?? '').trim();
        if (!isUnprintedV0996CatalogueTemplate(tid, cat)) continue;
        out.push({
            actorName: String(actor?.name ?? 'Actor'),
            actorUuid: actorUuid(actor),
            itemId: String(item?.id ?? ''),
            itemName: String(item?.name ?? ''),
            templateId: tid,
            rank: Math.max(1, Math.min(16, Number(sys.rank ?? sys.level ?? 1))),
            category: cat,
        });
    }
    return out;
}

export function buildV0996WorldReport(g: any = (globalThis as any).game): V0996WorldReport {
    const report: V0996WorldReport = {
        generatedAt: new Date().toISOString(),
        powers: [],
        heldForActivesReview: 0,
        artifactTrees: [],
        artifacts: [],
        npcEvade: [],
        lastBreath: [],
        retired: [],
    };
    for (const actor of collectV0996Actors(g)) {
        const p = planV0996WorldPowers(actor);
        report.powers.push(...p.changes);
        report.heldForActivesReview += p.held;
        report.artifacts.push(...planV0996WorldArtifacts(actor));
        const npc = planV0996WorldNpcEvade(actor);
        if (npc) report.npcEvade.push(npc);
        const lb = planV0996WorldLastBreath(actor);
        if (lb) report.lastBreath.push(lb);
        report.retired.push(...planV0996WorldRetired(actor));
    }
    const keys = new Set<string>(V0996_CHANGED_ARTIFACT_KEYS);
    const seen = new Set<string>();
    for (const it of g?.items?.contents ?? []) {
        if (it?.type !== 'artifact') continue;
        const key = String(readFlag(it, 'echoArtifactKey') ?? '');
        if (keys.has(key)) seen.add(key);
    }
    report.artifactTrees = V0996_CHANGED_ARTIFACT_KEYS.filter((k) => seen.has(k));
    return report;
}

/** Delta B: Guard rows, Last Breath convert, unprinted retirement (no Power re-bake). */
export function buildV0996DeltaBReport(g: any = (globalThis as any).game): V0996WorldReport {
    const report: V0996WorldReport = {
        generatedAt: new Date().toISOString(),
        powers: [],
        heldForActivesReview: 0,
        artifactTrees: [],
        artifacts: [],
        npcEvade: [],
        lastBreath: [],
        retired: [],
    };
    for (const actor of collectV0996Actors(g)) {
        const npc = planV0996WorldNpcEvade(actor);
        if (npc) report.npcEvade.push(npc);
        const lb = planV0996WorldLastBreath(actor);
        if (lb) report.lastBreath.push(lb);
        report.retired.push(...planV0996WorldRetired(actor));
    }
    return report;
}

/* ------------------------------------------------------------------ */
/* Apply                                                               */
/* ------------------------------------------------------------------ */

function findActor(uuid: string, g: any): any | null {
    return collectV0996Actors(g).find((a) => actorUuid(a) === uuid) ?? null;
}

function findItem(actor: any, id: string): any | null {
    const items = actor?.items;
    if (typeof items?.get === 'function') return items.get(id) ?? null;
    return docItems(actor).find((i) => String(i?.id) === id) ?? null;
}

function powerBackup(item: any): Record<string, unknown> {
    const sys = item?.system ?? {};
    return {
        at: new Date().toISOString(),
        name: item?.name,
        system: {
            templateName: sys.templateName,
            levels: clone(sys.levels),
            range: sys.range,
            aoe: sys.aoe,
            duration: sys.duration,
            effect: sys.effect,
            specials: clone(sys.specials),
            fluff: sys.fluff,
            description: sys.description,
        },
    };
}

export interface V0996WorldApplySummary {
    powers: number;
    artifactNodes: number;
    artifactCopies: number;
    npcEvadeRows: number;
    lastBreathConverted: number;
    retired: number;
    failed: number;
}

async function applyPowers(report: V0996WorldReport, g: any, summary: V0996WorldApplySummary): Promise<void> {
    for (const change of report.powers) {
        const actor = findActor(change.actorUuid, g);
        const item = actor ? findItem(actor, change.itemId) : null;
        if (!item || readFlag(item, V0996_WORLD_MIGRATED_FLAG) === true) continue;
        try {
            const backup = powerBackup(item);
            const wrote = await resyncPowerItemFromTemplate(item);
            if (!wrote && !change.rename) continue;
            const tail: Record<string, unknown> = {
                [`flags.${FLAG_SCOPE}.${V0996_WORLD_BACKUP_FLAG}`]: backup,
                [`flags.${FLAG_SCOPE}.${V0996_WORLD_MIGRATED_FLAG}`]: true,
            };
            if (change.rename) {
                tail.name = change.rename;
                const spec = V0996_RENAMES[change.templateId];
                if (spec) tail['system.templateName'] = spec.templateName;
            }
            await item.update(tail);
            summary.powers += 1;
        } catch (err) {
            summary.failed += 1;
            console.warn(`Mastery System | v0.9.9.6 world migration: power "${change.itemName}" on ${change.actorName} failed`, err);
        }
    }
}

async function applyArtifacts(report: V0996WorldReport, g: any, summary: V0996WorldApplySummary): Promise<void> {
    for (const row of report.artifacts) {
        if (!row.linked) continue;
        const actor = findActor(row.actorUuid, g);
        const item = actor ? findItem(actor, row.itemId) : null;
        if (!item) continue;
        try {
            await item.update({
                [`flags.${FLAG_SCOPE}.${V0996_WORLD_BACKUP_FLAG}`]: {
                    at: new Date().toISOString(),
                    name: item.name,
                    system: clone(item.system?.toObject?.() ?? item.system),
                },
                [`flags.${FLAG_SCOPE}.${V0996_WORLD_MIGRATED_FLAG}`]: true,
            });
            summary.artifactCopies += 1;
        } catch (err) {
            summary.failed += 1;
            console.warn(`Mastery System | v0.9.9.6 world migration: Artifact backup "${row.itemName}" failed`, err);
        }
    }
    if (!report.artifactTrees.length || summary.failed > 0) return;
    const { repairArtifactTreeByKey } = await import('../utils/seed-artifact-library.js');
    for (const key of report.artifactTrees) {
        try {
            summary.artifactNodes += await repairArtifactTreeByKey(key);
        } catch (err) {
            summary.failed += 1;
            console.warn(`Mastery System | v0.9.9.6 world migration: Artifact tree ${key} refresh failed`, err);
        }
    }
}

function withoutRetiredBasics(raw: unknown): unknown[] {
    return coerceNpcReactionsArray(raw).filter((r) => !isNpcRetiredBasicReactionRow(r));
}

async function applyNpcEvade(report: V0996WorldReport, g: any, summary: V0996WorldApplySummary): Promise<void> {
    for (const row of report.npcEvade) {
        const actor = findActor(row.actorUuid, g);
        if (!actor) continue;
        const sys = actor.system ?? {};
        try {
            const phases = coerceNpcPhasesArray(sys.phases);
            const patch: Record<string, unknown> = {
                [`flags.${FLAG_SCOPE}.${V0996_WORLD_BACKUP_FLAG}`]: {
                    at: new Date().toISOString(),
                    npcReactions: clone(coerceNpcReactionsArray(sys.npcReactions)),
                    phases: clone(phases),
                },
                'system.npcReactions': withoutRetiredBasics(sys.npcReactions),
            };
            if (phases.length) {
                patch['system.phases'] = phases.map((p: any) =>
                    p && typeof p === 'object' && p.npcReactions !== undefined
                        ? { ...p, npcReactions: withoutRetiredBasics(p.npcReactions) }
                        : p,
                );
            }
            await actor.update(patch);
            summary.npcEvadeRows += row.removed;
        } catch (err) {
            summary.failed += 1;
            console.warn(
                `Mastery System | v0.9.9.6 world migration: NPC Basic Evade/Guard on ${row.actorName} failed`,
                err,
            );
        }
    }
}

async function applyLastBreath(
    report: V0996WorldReport,
    g: any,
    summary: V0996WorldApplySummary,
): Promise<void> {
    for (const row of report.lastBreath) {
        const actor = findActor(row.actorUuid, g);
        if (!actor || readFlag(actor, V0996_LAST_BREATH_CONVERTED_FLAG) === true) continue;
        try {
            const attr = row.attribute;
            if (!attr) {
                await actor.update({
                    [`flags.${FLAG_SCOPE}.${V0996_LAST_BREATH_CONVERTED_FLAG}`]: true,
                });
                continue;
            }
            const pools = actor.system?.stonePools ?? {};
            const burned = Math.floor(Number(pools?.[attr]?.burned) || 0);
            const sealed = Math.floor(Number(pools?.[attr]?.sealed) || 0);
            if (burned <= 0) {
                await actor.update({
                    [`flags.${FLAG_SCOPE}.${V0996_LAST_BREATH_CONVERTED_FLAG}`]: true,
                });
                continue;
            }
            await actor.update({
                [`flags.${FLAG_SCOPE}.${V0996_WORLD_BACKUP_FLAG}`]: {
                    at: new Date().toISOString(),
                    lastBreath: { attribute: attr, burned, sealed },
                },
                [`flags.${FLAG_SCOPE}.${V0996_LAST_BREATH_CONVERTED_FLAG}`]: true,
                [`system.stonePools.${attr}.burned`]: burned - 1,
                [`system.stonePools.${attr}.sealed`]: sealed + 1,
            });
            summary.lastBreathConverted += 1;
        } catch (err) {
            summary.failed += 1;
            console.warn(
                `Mastery System | v0.9.9.6 world migration: Last Breath convert on ${row.actorName} failed`,
                err,
            );
        }
    }
}

async function applyRetired(
    report: V0996WorldReport,
    g: any,
    summary: V0996WorldApplySummary,
): Promise<void> {
    for (const row of report.retired) {
        const actor = findActor(row.actorUuid, g);
        const item = actor ? findItem(actor, row.itemId) : null;
        if (!item || readFlag(item, V0996_RETIRED_FLAG) === true) continue;
        try {
            const name = String(item.name || row.itemName);
            const retiredName = /retired/i.test(name) ? name : `${name} [Retired (v0.9.9.6)]`;
            await item.update({
                name: retiredName,
                [`flags.${FLAG_SCOPE}.${V0996_RETIRED_FLAG}`]: true,
                [`flags.${FLAG_SCOPE}.${V0996_WORLD_BACKUP_FLAG}`]: {
                    at: new Date().toISOString(),
                    name,
                },
            });
            summary.retired += 1;
        } catch (err) {
            summary.failed += 1;
            console.warn(
                `Mastery System | v0.9.9.6 world migration: retire "${row.itemName}" on ${row.actorName} failed`,
                err,
            );
        }
    }
}

export async function applyV0996WorldReport(
    report: V0996WorldReport,
    g: any = (globalThis as any).game,
): Promise<V0996WorldApplySummary> {
    const summary: V0996WorldApplySummary = {
        powers: 0,
        artifactNodes: 0,
        artifactCopies: 0,
        npcEvadeRows: 0,
        lastBreathConverted: 0,
        retired: 0,
        failed: 0,
    };
    if (!g?.user?.isGM) return summary;
    await applyPowers(report, g, summary);
    await applyArtifacts(report, g, summary);
    await applyNpcEvade(report, g, summary);
    await applyLastBreath(report, g, summary);
    await applyRetired(report, g, summary);
    if (summary.failed === 0) {
        await g.settings.set(FLAG_SCOPE, V0996_WORLD_STATE_KEY, 'applied');
        await g.settings.set(FLAG_SCOPE, V0996_DELTA_B_STATE_KEY, 'applied');
    }
    return summary;
}

export async function applyV0996DeltaBReport(
    report: V0996WorldReport,
    g: any = (globalThis as any).game,
): Promise<V0996WorldApplySummary> {
    const summary: V0996WorldApplySummary = {
        powers: 0,
        artifactNodes: 0,
        artifactCopies: 0,
        npcEvadeRows: 0,
        lastBreathConverted: 0,
        retired: 0,
        failed: 0,
    };
    if (!g?.user?.isGM) return summary;
    await applyNpcEvade(report, g, summary);
    await applyLastBreath(report, g, summary);
    await applyRetired(report, g, summary);
    if (summary.failed === 0) {
        await g.settings.set(FLAG_SCOPE, V0996_DELTA_B_STATE_KEY, 'applied');
    }
    return summary;
}

/**
 * Restore one actor from its v0.9.9.6 world backups (Power items, Artifact
 * copies, NPC Reaction rows) and clear the markers.
 */
export async function rollbackV0996WorldActor(actor: any): Promise<number> {
    let restored = 0;
    const clear = {
        [`flags.${FLAG_SCOPE}.-=${V0996_WORLD_BACKUP_FLAG}`]: null,
        [`flags.${FLAG_SCOPE}.-=${V0996_WORLD_MIGRATED_FLAG}`]: null,
        [`flags.${FLAG_SCOPE}.-=${V0996_RETIRED_FLAG}`]: null,
    };
    for (const item of docItems(actor)) {
        const backup = readFlag(item, V0996_WORLD_BACKUP_FLAG) as any;
        const retired = readFlag(item, V0996_RETIRED_FLAG) === true;
        if (!backup && readFlag(item, V0996_WORLD_MIGRATED_FLAG) !== true && !retired) continue;
        const patch: Record<string, unknown> = { ...clear };
        if (backup?.name !== undefined) patch.name = backup.name;
        for (const [k, v] of Object.entries(backup?.system ?? {})) {
            if (v !== undefined) patch[`system.${k}`] = v;
        }
        await item.update(patch);
        restored += 1;
    }
    const actorBackup = readFlag(actor, V0996_WORLD_BACKUP_FLAG) as any;
    if (actorBackup && typeof actorBackup === 'object') {
        const patch: Record<string, unknown> = { ...clear };
        if (Array.isArray(actorBackup.npcReactions)) {
            patch['system.npcReactions'] = actorBackup.npcReactions;
        }
        if (Array.isArray(actorBackup.phases) && actorBackup.phases.length) {
            patch['system.phases'] = actorBackup.phases;
        }
        if (actorBackup.lastBreath?.attribute) {
            const attr = String(actorBackup.lastBreath.attribute);
            patch[`system.stonePools.${attr}.burned`] = actorBackup.lastBreath.burned;
            patch[`system.stonePools.${attr}.sealed`] = actorBackup.lastBreath.sealed;
            patch[`flags.${FLAG_SCOPE}.-=${V0996_LAST_BREATH_CONVERTED_FLAG}`] = null;
        }
        await actor.update(patch);
        restored += 1;
    }
    return restored;
}

/* ------------------------------------------------------------------ */
/* Chat report                                                         */
/* ------------------------------------------------------------------ */

export function formatV0996WorldReportHtml(report: V0996WorldReport, summary: V0996WorldApplySummary | null): string {
    const li = (s: string) => `<li>${s}</li>`;
    const block = (title: string, rows: string[]) =>
        rows.length
            ? `<details><summary><strong>${escHtml(title)}</strong> (${rows.length})</summary><ul>${rows.join('')}</ul></details>`
            : '';
    const powers = report.powers.map((c) => {
        const rn = c.rename ? ` · renamed to <em>${escHtml(c.rename)}</em>` : '';
        const vc = c.before || c.after ? `<br><small>${escHtml(c.before || '—')} → ${escHtml(c.after || '—')}</small>` : '';
        return li(`<strong>${escHtml(c.actorName)}</strong>: ${escHtml(c.itemName)} (PL ${c.rank})${rn}${vc}`);
    });
    const artifacts = report.artifacts.map((a) =>
        li(
            `<strong>${escHtml(a.actorName)}</strong>: ${escHtml(a.itemName)}` +
                (a.linked ? '' : ' — <em>not linked to the library, not refreshed (re-grant or refresh manually)</em>'),
        ),
    );
    const npc = report.npcEvade.map((n) =>
        li(
            `<strong>${escHtml(n.actorName)}</strong>: removed ${n.removed} Basic Evade/Guard row${n.removed === 1 ? '' : 's'}`,
        ),
    );
    const lb = report.lastBreath.map((r) => li(`<strong>${escHtml(r.actorName)}</strong>: ${escHtml(r.note)}`));
    const retired = report.retired.map((r) =>
        li(
            `<strong>${escHtml(r.actorName)}</strong>: ${escHtml(r.itemName)} (${escHtml(r.templateId)}, PL ${r.rank}) — free same-type swap after GM review`,
        ),
    );
    const counts = summary
        ? `<p>Applied: ${summary.powers} Power(s), ${summary.artifactNodes} Artifact library node(s), ` +
          `${summary.artifactCopies} Artifact copy backup(s), ${summary.npcEvadeRows} NPC Basic Evade/Guard row(s), ` +
          `${summary.lastBreathConverted} Last Breath convert(s), ${summary.retired} retired Power(s)` +
          `${summary.failed ? ` · <strong>${summary.failed} failed (see console; migration will retry next load)</strong>` : ''}.</p>`
        : '';
    const held = report.heldForActivesReview
        ? `<p>${report.heldForActivesReview} Active Power(s) wait for the Actives v0.9.9.6 review (<code>game.masterySystem.activesV0996Review()</code>).</p>`
        : '';
    const trees = report.artifactTrees.length
        ? `<p>Artifact library refreshed: ${report.artifactTrees.map(escHtml).join(', ')}.</p>`
        : '';
    return `<div class="mastery-migration-report">
  <h3>Rules v0.9.9.6 world migration</h3>
  ${counts}${held}${trees}
  ${block('Power values re-baked', powers)}
  ${block('Artifact copies', artifacts)}
  ${block('NPC Basic Evade/Guard removed', npc)}
  ${block('Last Breath Burned → Sealed', lb)}
  ${block('Retired unprinted Powers (free swap)', retired)}
  <p><small>Backups: <code>flags.mastery-system.${V0996_WORLD_BACKUP_FLAG}</code> on each changed document. Restore an actor with <code>game.masterySystem.v0996WorldRollback(actor)</code>.</small></p>
</div>`;
}

function reportIsEmpty(report: V0996WorldReport): boolean {
    return (
        !report.powers.length &&
        !report.artifacts.length &&
        !report.artifactTrees.length &&
        !report.npcEvade.length &&
        !report.lastBreath.length &&
        !report.retired.length
    );
}

async function whisperV0996Report(
    report: V0996WorldReport,
    summary: V0996WorldApplySummary,
    g: any,
): Promise<void> {
    try {
        const CM = (globalThis as any).ChatMessage;
        const whisper = CM?.getWhisperRecipients?.('GM')?.map((u: any) => u.id) ?? [g.user.id];
        await CM?.create?.({
            user: g.user.id,
            whisper,
            content: formatV0996WorldReportHtml(report, summary),
            flags: { [FLAG_SCOPE]: { type: 'v0996WorldMigrationReport' } },
        });
    } catch (err) {
        console.warn('Mastery System | v0.9.9.6 world migration: chat report failed', err);
    }
}

/** GM world load: plan, apply once, whisper the report to the GM(s). */
export async function runV0996WorldMigrationOnReady(g: any = (globalThis as any).game): Promise<V0996WorldReport | null> {
    if (!g?.user?.isGM) return null;
    if (getV0996WorldMigrationState(g) !== 'applied') {
        const report = buildV0996WorldReport(g);
        if (reportIsEmpty(report)) {
            await g.settings.set(FLAG_SCOPE, V0996_WORLD_STATE_KEY, 'applied');
            await g.settings.set(FLAG_SCOPE, V0996_DELTA_B_STATE_KEY, 'applied');
        } else {
            const summary = await applyV0996WorldReport(report, g);
            await whisperV0996Report(report, summary, g);
            return report;
        }
    }
    return runV0996DeltaBOnReady(g);
}

/** Second pass for worlds that already applied the first migration (Guard / Last Breath / C2). */
export async function runV0996DeltaBOnReady(g: any = (globalThis as any).game): Promise<V0996WorldReport | null> {
    if (!g?.user?.isGM) return null;
    if (getV0996DeltaBMigrationState(g) === 'applied') return null;
    const report = buildV0996DeltaBReport(g);
    if (reportIsEmpty(report)) {
        await g.settings.set(FLAG_SCOPE, V0996_DELTA_B_STATE_KEY, 'applied');
        return report;
    }
    const summary = await applyV0996DeltaBReport(report, g);
    await whisperV0996Report(report, summary, g);
    return report;
}
