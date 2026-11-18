/**
 * Actives v0.9.9.6 consolidation migration (GM review required).
 *
 * Only the dry-run runs automatically: it reads every PC, NPC, unlinked token
 * actor and Artifact item and builds a report. Nothing is written until the GM
 * confirms Apply in the review dialog. Apply then:
 *   1. downloads a JSON backup of every affected actor / Artifact,
 *   2. stores a per-item backup in `flags.mastery-system.v0996Backup`,
 *   3. remaps legacy `active-{m|r}-damage-tN::X` to
 *      `active-{m|r}-instant-special-tN::X` (same PL, Special, custom name,
 *      favourites and flags; only old default names are renamed),
 *   4. re-bakes owned items of templates whose v0.9.9.6 values changed,
 *   5. remaps legacy `damage-t*` Artifact picks (provenance holds are listed only),
 *   6. flags conflicts (`v0996Conflict`) and Mental Attack (`v0996Retired`)
 *      without changing them — no merge, no deletion, no XP refund,
 *   7. sets `activesV0996MigrationState = applied`, which lifts the resync hold.
 *
 * Idempotent: migrated / flagged items are skipped on later runs. Rollback is
 * per actor from the item backups.
 */

import { findCatalogEntry } from '../utils/power-catalog.js';
import {
    buildPowerItemFromCatalogEntry,
    defaultPowerItemDisplayName,
} from '../utils/power-item-builder.js';
import { renderAoe, renderRange } from '../utils/power-rendering.js';
import { isAttackPowerItem } from '../utils/attack-power.js';
import {
    ACTIVES_V0996_MIGRATION_STATE_KEY,
    getActivesV0996MigrationState,
    isActivesV0996HeldTemplate,
    previewPowerItemResync,
    resyncPowerItemFromTemplate,
    runPowerTemplateResyncMigration,
} from './power-template-resync-migration.js';

const FLAG_SCOPE = 'mastery-system';
export const V0996_MIGRATED_FLAG = 'v0996Migrated';
export const V0996_BACKUP_FLAG = 'v0996Backup';
export const V0996_CONFLICT_FLAG = 'v0996Conflict';
export const V0996_RETIRED_FLAG = 'v0996Retired';
export const V0996_NOTE_FLAG = 'v0996Note';

const LEGACY_DAMAGE_RE = /^active-(melee|ranged)-damage-t([3-6])$/;
const INSTANT_SPECIAL_RE = /^active-(melee|ranged)-instant-special-t[3-6]$/;
const MENTAL_ATTACK_ID = 'active-mental-attack';
const ZONE_ROOT_TEMPLATE = 'active-ranged-zone-t5';

export type V0996ItemKind = 'remap' | 'resync' | 'conflict' | 'retire-mental' | 'unmappable';

export interface V0996ItemChange {
    kind: V0996ItemKind;
    actorId: string;
    actorName: string;
    actorUuid: string;
    itemId: string;
    itemName: string;
    rank: number;
    special: string | null;
    fromTemplateId: string;
    toTemplateId: string | null;
    /** New name when the item still carries an old default name; null = name kept. */
    rename: string | null;
    /** Human-readable value changes at the owned Power Level. */
    valueChanges: string[];
    note: string;
}

export interface V0996ArtifactPickChange {
    kind: 'remap';
    ownerName: string;
    ownerUuid: string | null;
    itemId: string;
    itemName: string;
    pickLevel: number;
    special: string | null;
    fromTemplateId: string;
    toTemplateId: string | null;
    note: string;
}

export interface V0996InfoRow {
    actorName: string;
    actorUuid: string;
    itemName?: string;
    note: string;
}

export interface V0996Report {
    generatedAt: string;
    state: string;
    items: V0996ItemChange[];
    artifactPicks: V0996ArtifactPickChange[];
    zoneRoot: V0996InfoRow[];
    actorsWithoutAttackPower: V0996InfoRow[];
}

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
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

function itemTemplateId(item: any): string {
    return String(item?.system?.templateId ?? '').trim();
}

function itemRank(item: any): number {
    const sys = item?.system ?? {};
    return Math.max(1, Math.min(16, Math.floor(Number(sys.rank ?? sys.level ?? 1) || 1)));
}

function itemSpecial(item: any): string | null {
    const key = item?.system?.chosenSpecial?.key;
    return key ? String(key) : null;
}

function deliveryOf(templateId: string): string {
    return /ranged/.test(templateId) ? 'ranged' : /melee/.test(templateId) ? 'melee' : '';
}

function actorUuid(actor: any): string {
    return String(actor?.uuid ?? actor?.id ?? '');
}

function specialTitle(key: string): string {
    return key
        .split('-')
        .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1) : w))
        .join(' ');
}

/** One-line summary of a level row (specials, dice, range, radius). */
function rowSummary(row: any): string {
    if (!row || typeof row !== 'object') return '—';
    const parts: string[] = [];
    const specials = Array.isArray(row.specials)
        ? row.specials.map((s: any) => (s?.rank !== undefined ? `${s.key}(${s.rank})` : String(s?.key ?? '')))
        : [];
    if (specials.length) parts.push(specials.join(', '));
    const dice = row.effect?.dice ?? row.damage?.dice;
    if (dice) parts.push(String(dice));
    try {
        const range = renderRange(row.range);
        if (range) parts.push(`range ${range}`);
    } catch {
        /* optional */
    }
    try {
        const aoe = renderAoe(row.aoe);
        if (aoe) parts.push(`area ${aoe}`);
    } catch {
        /* optional */
    }
    return parts.join(' · ') || '—';
}

function rowChanges(before: any, after: any): string[] {
    const a = rowSummary(before);
    const b = rowSummary(after);
    return a === b ? [] : [`${a} → ${b}`];
}

/**
 * Default names an item could carry from older catalog versions (before the
 * v0.9.9.6 titles). Only items still named like this are renamed.
 */
export function legacyDefaultNames(templateId: string, specialKey: string | null): Set<string> {
    const out = new Set<string>();
    if (!specialKey) return out;
    const label = specialTitle(specialKey);
    const d = deliveryOf(templateId) === 'ranged' ? 'Ranged' : 'Melee';
    const shape = /zone|persistent/.test(templateId) ? ' Zone' : /aoe/.test(templateId) ? ' AoE' : '';
    out.add(`${d}${shape} ${label}`.replace(/\s+/g, ' ').trim());
    const tier = /-t([3-6])$/.exec(templateId)?.[1];
    if (tier) {
        if (LEGACY_DAMAGE_RE.test(templateId)) out.add(`${d} Damage — Tier ${tier} — ${label}`);
        if (/-aoe-damage-/.test(templateId)) out.add(`${d} AoE Damage — Tier ${tier} — ${label}`);
        if (/-instant-special-/.test(templateId)) out.add(`${d} Instant Special — Tier ${tier} — ${label}`);
        if (/-zone-/.test(templateId)) out.add(`Ranged Persistent Zone — Tier ${tier} — ${label}`);
    }
    const current = findCatalogEntry(templateId, specialKey);
    if (current) {
        out.add(String(current.name));
        out.add(defaultPowerItemDisplayName(current));
    }
    return out;
}

/* ------------------------------------------------------------------ */
/* Actor collection                                                    */
/* ------------------------------------------------------------------ */

/** World actors plus unlinked token actors on every scene. */
export function collectV0996Actors(g: any = (globalThis as any).game): any[] {
    const out: any[] = [];
    const seen = new Set<string>();
    const push = (a: any) => {
        if (!a) return;
        const key = actorUuid(a) || `${a.id}:${a.name}`;
        if (seen.has(key)) return;
        seen.add(key);
        out.push(a);
    };
    for (const a of g?.actors?.contents ?? []) push(a);
    for (const scene of g?.scenes?.contents ?? []) {
        const tokens = scene?.tokens?.contents ?? (Array.isArray(scene?.tokens) ? scene.tokens : []);
        for (const t of tokens) {
            if (t?.actorLink) continue;
            push(t?.actor);
        }
    }
    return out;
}

/* ------------------------------------------------------------------ */
/* Planning (pure reads)                                               */
/* ------------------------------------------------------------------ */

function isAlreadyHandled(item: any): boolean {
    return (
        readFlag(item, V0996_MIGRATED_FLAG) === true ||
        !!readFlag(item, V0996_CONFLICT_FLAG) ||
        readFlag(item, V0996_RETIRED_FLAG) === true
    );
}

/** Plan all power-item changes for one actor. */
export function planActorV0996(actor: any): V0996ItemChange[] {
    const changes: V0996ItemChange[] = [];
    const powers = docItems(actor).filter((i) => i?.type === 'power');
    const base = {
        actorId: String(actor?.id ?? ''),
        actorName: String(actor?.name ?? 'Actor'),
        actorUuid: actorUuid(actor),
    };

    // Conflict buckets: `${delivery}::${special}` → items that end up as
    // Single Target Special for that Special after the remap.
    const buckets = new Map<string, any[]>();
    for (const item of powers) {
        const tid = itemTemplateId(item);
        const special = itemSpecial(item);
        if (!special) continue;
        if (LEGACY_DAMAGE_RE.test(tid) || INSTANT_SPECIAL_RE.test(tid)) {
            const key = `${deliveryOf(tid)}::${special}`;
            const list = buckets.get(key) ?? [];
            list.push(item);
            buckets.set(key, list);
        }
    }

    for (const item of powers) {
        if (isAlreadyHandled(item)) continue;
        const tid = itemTemplateId(item);
        const special = itemSpecial(item);
        const rank = itemRank(item);
        const common = {
            ...base,
            itemId: String(item?.id ?? ''),
            itemName: String(item?.name ?? ''),
            rank,
            special,
            fromTemplateId: tid,
        };

        if (tid === MENTAL_ATTACK_ID) {
            changes.push({
                ...common,
                kind: 'retire-mental',
                toTemplateId: null,
                rename: null,
                valueChanges: [],
                note: 'Mental Attack is retired in Actives v0.9.9.6. Flagged retired (not usable in the radial); not deleted, not converted, no XP refund.',
            });
            continue;
        }

        const legacy = LEGACY_DAMAGE_RE.exec(tid);
        if (legacy) {
            const bucket = special ? buckets.get(`${legacy[1]}::${special}`) ?? [] : [];
            if (bucket.length > 1) {
                changes.push({
                    ...common,
                    kind: 'conflict',
                    toTemplateId: null,
                    rename: null,
                    valueChanges: [],
                    note: `Conflict: ${bucket.length} ${legacy[1]} Single Target ${special} powers would exist after the remap. Both kept unchanged for GM decision (no merge, no deletion, no XP refund).`,
                });
                continue;
            }
            const target = `active-${legacy[1]}-instant-special-t${legacy[2]}`;
            const entry = special ? findCatalogEntry(target, special) : null;
            if (!entry || entry.chosenSpecial?.key !== special) {
                changes.push({
                    ...common,
                    kind: 'unmappable',
                    toTemplateId: null,
                    rename: null,
                    valueChanges: [],
                    note: `No ${target}::${special ?? '(none)'} catalog entry — item left unchanged.`,
                });
                continue;
            }
            const built = buildPowerItemFromCatalogEntry(entry, rank);
            const newRow = (built?.system as any)?.levels?.[String(rank)];
            const oldRow = item?.system?.levels?.[String(rank)];
            const name = String(item?.name ?? '');
            const rename = legacyDefaultNames(tid, special).has(name) ? String(built?.name ?? '') || null : null;
            changes.push({
                ...common,
                kind: 'remap',
                toTemplateId: target,
                rename: rename && rename !== name ? rename : null,
                valueChanges: rowChanges(oldRow, newRow),
                note: 'Damage + Special → Single Target Special (no direct Attack Damage).',
            });
            continue;
        }

        if (INSTANT_SPECIAL_RE.test(tid) && special) {
            const bucket = buckets.get(`${deliveryOf(tid)}::${special}`) ?? [];
            if (bucket.some((o) => o !== item && LEGACY_DAMAGE_RE.test(itemTemplateId(o)))) {
                changes.push({
                    ...common,
                    kind: 'conflict',
                    toTemplateId: null,
                    rename: null,
                    valueChanges: [],
                    note: `Conflict: also owns a legacy Damage + ${special} power of the same delivery. Both kept unchanged for GM decision.`,
                });
                continue;
            }
        }

        if (isActivesV0996HeldTemplate(tid)) {
            const preview = previewPowerItemResync(item);
            const name = String(item?.name ?? '');
            let rename: string | null = null;
            if (special && legacyDefaultNames(tid, special).has(name)) {
                const entry = findCatalogEntry(tid, special);
                const next = entry ? defaultPowerItemDisplayName(entry) : '';
                rename = next && next !== name ? next : null;
            }
            if (!preview?.changed && !rename) continue;
            changes.push({
                ...common,
                kind: 'resync',
                toTemplateId: tid,
                rename,
                valueChanges: preview?.changed
                    ? rowChanges(item?.system?.levels?.[String(rank)], (preview.levels as Record<string, unknown>)?.[String(rank)])
                    : [],
                note: 'Stored values re-baked from the v0.9.9.6 table.',
            });
        }
    }
    return changes;
}

/** Plan Artifact pick remaps for one Artifact item. */
export function planArtifactV0996(item: any, owner: any | null): V0996ArtifactPickChange[] {
    const out: V0996ArtifactPickChange[] = [];
    if (item?.type !== 'artifact') return out;
    if (readFlag(item, V0996_MIGRATED_FLAG) === true) return out;
    const picks = Array.isArray(item?.system?.progressionPicks) ? item.system.progressionPicks : [];
    for (const pick of picks) {
        const tid = String(pick?.powerTemplateId ?? '');
        const m = LEGACY_DAMAGE_RE.exec(tid);
        if (!m) continue;
        const special = pick?.chosenSpecial?.key ? String(pick.chosenSpecial.key) : null;
        const base = {
            ownerName: String(owner?.name ?? 'World'),
            ownerUuid: owner ? actorUuid(owner) : null,
            itemId: String(item?.id ?? ''),
            itemName: String(item?.name ?? ''),
            pickLevel: Number(pick?.level) || 0,
            special,
            fromTemplateId: tid,
        };
        out.push({
            ...base,
            kind: 'remap',
            toTemplateId: `active-${m[1]}-instant-special-t${m[2]}`,
            note: 'Artifact pick: Damage + Special → Single Target Special.',
        });
    }
    return out;
}

/** Build the full dry-run report. Reads only. */
export function buildActivesV0996Report(g: any = (globalThis as any).game): V0996Report {
    const report: V0996Report = {
        generatedAt: new Date().toISOString(),
        state: getActivesV0996MigrationState(),
        items: [],
        artifactPicks: [],
        zoneRoot: [],
        actorsWithoutAttackPower: [],
    };
    for (const actor of collectV0996Actors(g)) {
        report.items.push(...planActorV0996(actor));
        const items = docItems(actor);
        for (const item of items) {
            if (item?.type === 'artifact') report.artifactPicks.push(...planArtifactV0996(item, actor));
            const tid = itemTemplateId(item);
            if (item?.type === 'power' && tid === ZONE_ROOT_TEMPLATE && itemSpecial(item) === 'root') {
                report.zoneRoot.push({
                    actorName: String(actor?.name ?? ''),
                    actorUuid: actorUuid(actor),
                    itemName: String(item?.name ?? ''),
                    note: 'Zone Root (T5) is not printed in Actives v0.9.9.6 — documented only, unchanged.',
                });
            }
        }
        if (actor?.type === 'character' && !items.some((i) => isAttackPowerItem(i))) {
            report.actorsWithoutAttackPower.push({
                actorName: String(actor?.name ?? ''),
                actorUuid: actorUuid(actor),
                note: 'No learned Attack Power (there is no automatic Basic Attack). Listed only — nothing is granted.',
            });
        }
    }
    for (const item of g?.items?.contents ?? []) {
        report.artifactPicks.push(...planArtifactV0996(item, null));
    }
    return report;
}

/** True when the report contains anything that Apply would write or the GM must see. */
export function reportHasChanges(report: V0996Report): boolean {
    return (
        report.items.length > 0 ||
        report.artifactPicks.length > 0 ||
        report.zoneRoot.length > 0
    );
}

/* ------------------------------------------------------------------ */
/* Report formatting                                                   */
/* ------------------------------------------------------------------ */

export function formatActivesV0996ReportMarkdown(report: V0996Report): string {
    const lines: string[] = [];
    lines.push(`# Actives v0.9.9.6 migration report`, '', `Generated ${report.generatedAt} · state: ${report.state || 'pending'}`, '');
    const byKind = (k: V0996ItemKind) => report.items.filter((c) => c.kind === k);
    const section = (title: string, rows: V0996ItemChange[]) => {
        lines.push(`## ${title} (${rows.length})`);
        for (const c of rows) {
            const to = c.toTemplateId && c.toTemplateId !== c.fromTemplateId ? ` → ${c.toTemplateId}` : '';
            const rn = c.rename ? ` · rename "${c.itemName}" → "${c.rename}"` : '';
            const vc = c.valueChanges.length ? ` · ${c.valueChanges.join('; ')}` : '';
            lines.push(`- **${c.actorName}** — ${c.itemName} (PL ${c.rank}${c.special ? `, ${c.special}` : ''}): ${c.fromTemplateId}${to}${rn}${vc}. ${c.note}`);
        }
        lines.push('');
    };
    section('Remap Damage + Special → Single Target Special', byKind('remap'));
    section('Re-bake changed v0.9.9.6 values', byKind('resync'));
    section('Conflicts (kept unchanged)', byKind('conflict'));
    section('Mental Attack (flag retired)', byKind('retire-mental'));
    section('Unmappable (kept unchanged)', byKind('unmappable'));
    lines.push(`## Artifact picks (${report.artifactPicks.length})`);
    for (const p of report.artifactPicks) {
        lines.push(`- **${p.ownerName}** — ${p.itemName} L${p.pickLevel}${p.special ? ` (${p.special})` : ''}: ${p.fromTemplateId}${p.toTemplateId ? ` → ${p.toTemplateId}` : ''}. ${p.note}`);
    }
    lines.push('');
    const info = (title: string, rows: V0996InfoRow[]) => {
        lines.push(`## ${title} (${rows.length})`);
        for (const r of rows) lines.push(`- **${r.actorName}**${r.itemName ? ` — ${r.itemName}` : ''}: ${r.note}`);
        lines.push('');
    };
    info('Zone Root (documented only)', report.zoneRoot);
    info('Actors without an Attack Power', report.actorsWithoutAttackPower);
    return lines.join('\n');
}

/* ------------------------------------------------------------------ */
/* Backup + Apply + Rollback                                           */
/* ------------------------------------------------------------------ */

function itemBackupSnapshot(item: any): Record<string, unknown> {
    const sys = item?.system ?? {};
    const clone = (v: unknown) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
    return {
        at: new Date().toISOString(),
        name: item?.name,
        system: {
            templateId: sys.templateId,
            templateName: sys.templateName,
            subfamily: sys.subfamily,
            chosenSpecial: clone(sys.chosenSpecial),
            tags: clone(sys.tags),
            cost: clone(sys.cost),
            roll: clone(sys.roll),
            levels: clone(sys.levels),
            range: sys.range,
            aoe: sys.aoe,
            duration: sys.duration,
            effect: sys.effect,
            specials: clone(sys.specials),
            fluff: sys.fluff,
            description: sys.description,
            progressionPicks: clone(sys.progressionPicks),
            levelProgression: clone(sys.levelProgression),
        },
    };
}

function saveJson(data: unknown, filename: string): void {
    const json = JSON.stringify(data, null, 2);
    const fu = (globalThis as any).foundry?.utils;
    const save = fu?.saveDataToFile ?? (globalThis as any).saveDataToFile;
    if (typeof save === 'function') save(json, 'application/json', filename);
}

/** Download a JSON backup of every affected actor / world Artifact before Apply. */
export function downloadActivesV0996Backup(report: V0996Report, g: any = (globalThis as any).game): number {
    const uuids = new Set<string>();
    for (const c of report.items) uuids.add(c.actorUuid);
    for (const p of report.artifactPicks) if (p.ownerUuid) uuids.add(p.ownerUuid);
    const actors = collectV0996Actors(g).filter((a) => uuids.has(actorUuid(a)));
    const worldArtifactIds = new Set(report.artifactPicks.filter((p) => !p.ownerUuid).map((p) => p.itemId));
    const worldItems = (g?.items?.contents ?? []).filter((i: any) => worldArtifactIds.has(String(i?.id)));
    const payload = {
        kind: 'mastery-system/actives-v0996-backup',
        generatedAt: new Date().toISOString(),
        actors: actors.map((a) => (typeof a.toObject === 'function' ? a.toObject() : a)),
        items: worldItems.map((i: any) => (typeof i.toObject === 'function' ? i.toObject() : i)),
    };
    saveJson(payload, `actives-v0996-backup-${Date.now()}.json`);
    return actors.length + worldItems.length;
}

function findActorByUuid(uuid: string, g: any): any | null {
    return collectV0996Actors(g).find((a) => actorUuid(a) === uuid) ?? null;
}

function findItem(actor: any, id: string): any | null {
    const items = actor?.items;
    if (typeof items?.get === 'function') return items.get(id) ?? null;
    return docItems(actor).find((i) => String(i?.id) === id) ?? null;
}

async function applyItemChange(item: any, change: V0996ItemChange): Promise<boolean> {
    const backup = { [`flags.${FLAG_SCOPE}.${V0996_BACKUP_FLAG}`]: itemBackupSnapshot(item) };
    switch (change.kind) {
        case 'conflict':
            await item.update({
                ...backup,
                [`flags.${FLAG_SCOPE}.${V0996_CONFLICT_FLAG}`]: true,
                [`flags.${FLAG_SCOPE}.${V0996_NOTE_FLAG}`]: change.note,
            });
            return true;
        case 'retire-mental':
            await item.update({
                ...backup,
                [`flags.${FLAG_SCOPE}.${V0996_RETIRED_FLAG}`]: true,
                [`flags.${FLAG_SCOPE}.${V0996_NOTE_FLAG}`]: change.note,
            });
            return true;
        case 'remap': {
            const entry = change.special && change.toTemplateId
                ? findCatalogEntry(change.toTemplateId, change.special)
                : null;
            if (!entry) return false;
            const sys = item.system ?? {};
            const built = buildPowerItemFromCatalogEntry(entry, change.rank, {
                isSpell: sys.isSpell === true,
                castingAttribute: sys.castingAttribute,
                spellResolution: sys.spellResolution,
            } as any);
            const nb = (built?.system ?? null) as any;
            if (!nb) return false;
            const patch: Record<string, unknown> = {
                ...backup,
                'system.templateId': nb.templateId,
                'system.templateName': nb.templateName,
                'system.subfamily': nb.subfamily,
                'system.chosenSpecial': nb.chosenSpecial,
                'system.tags': nb.tags,
                'system.cost': nb.cost,
                'system.roll': nb.roll,
                'system.levels': nb.levels,
                'system.range': nb.range,
                'system.aoe': nb.aoe,
                'system.duration': nb.duration,
                'system.effect': nb.effect,
                'system.specials': nb.specials,
                'system.fluff': nb.fluff,
                'system.description': nb.description,
                [`flags.${FLAG_SCOPE}.${V0996_MIGRATED_FLAG}`]: true,
            };
            if (change.rename) patch.name = change.rename;
            await item.update(patch);
            return true;
        }
        case 'resync': {
            await item.update(backup);
            await resyncPowerItemFromTemplate(item, { ignoreV0996Hold: true });
            const tail: Record<string, unknown> = { [`flags.${FLAG_SCOPE}.${V0996_MIGRATED_FLAG}`]: true };
            if (change.rename) tail.name = change.rename;
            await item.update(tail);
            return true;
        }
        default:
            return false;
    }
}

async function applyArtifactChanges(item: any, changes: V0996ArtifactPickChange[]): Promise<boolean> {
    const remaps = changes.filter((c) => c.kind === 'remap' && c.toTemplateId);
    if (!remaps.length) return false;
    const sys = item?.system ?? {};
    const swap = (tid: string, level: number | null) =>
        remaps.find((c) => c.fromTemplateId === tid && (level == null || c.pickLevel === level))?.toTemplateId ?? null;
    const picks = (Array.isArray(sys.progressionPicks) ? sys.progressionPicks : []).map((p: any) => {
        const to = swap(String(p?.powerTemplateId ?? ''), Number(p?.level) || 0);
        return to ? { ...p, powerTemplateId: to } : p;
    });
    const patch: Record<string, unknown> = {
        [`flags.${FLAG_SCOPE}.${V0996_BACKUP_FLAG}`]: itemBackupSnapshot(item),
        'system.progressionPicks': picks,
        [`flags.${FLAG_SCOPE}.${V0996_MIGRATED_FLAG}`]: true,
    };
    if (Array.isArray(sys.levelProgression)) {
        patch['system.levelProgression'] = sys.levelProgression.map((r: any) => {
            const to = swap(String(r?.powerTemplateId ?? ''), null);
            return to ? { ...r, powerTemplateId: to } : r;
        });
    }
    await item.update(patch);
    return true;
}

export interface V0996ApplySummary {
    applied: number;
    skipped: number;
    artifacts: number;
    failed: number;
}

/**
 * Apply a reviewed report. GM only. Writes per-item backups first; sets the
 * world state to `applied` and runs the (now unblocked) template resync.
 */
export async function applyActivesV0996Report(
    report: V0996Report,
    g: any = (globalThis as any).game,
): Promise<V0996ApplySummary> {
    const summary: V0996ApplySummary = { applied: 0, skipped: 0, artifacts: 0, failed: 0 };
    if (!g?.user?.isGM) return summary;

    for (const change of report.items) {
        if (change.kind === 'unmappable') {
            summary.skipped += 1;
            continue;
        }
        const actor = findActorByUuid(change.actorUuid, g);
        const item = actor ? findItem(actor, change.itemId) : null;
        if (!item || isAlreadyHandled(item)) {
            summary.skipped += 1;
            continue;
        }
        try {
            if (await applyItemChange(item, change)) summary.applied += 1;
            else summary.skipped += 1;
        } catch (err) {
            summary.failed += 1;
            console.warn(`Mastery System | v0.9.9.6 migration failed for "${change.itemName}" on ${change.actorName}`, err);
        }
    }

    const byItem = new Map<string, V0996ArtifactPickChange[]>();
    for (const p of report.artifactPicks) {
        const key = `${p.ownerUuid ?? 'world'}::${p.itemId}`;
        const list = byItem.get(key) ?? [];
        list.push(p);
        byItem.set(key, list);
    }
    for (const [key, list] of byItem) {
        const first = list[0]!;
        const owner = first.ownerUuid ? findActorByUuid(first.ownerUuid, g) : null;
        const item = owner
            ? findItem(owner, first.itemId)
            : (g?.items?.get?.(first.itemId) ?? (g?.items?.contents ?? []).find((i: any) => String(i?.id) === first.itemId));
        if (!item || readFlag(item, V0996_MIGRATED_FLAG) === true) continue;
        try {
            if (await applyArtifactChanges(item, list)) summary.artifacts += 1;
        } catch (err) {
            summary.failed += 1;
            console.warn(`Mastery System | v0.9.9.6 artifact pick migration failed (${key})`, err);
        }
    }

    if (summary.failed === 0) {
        await g.settings.set(FLAG_SCOPE, ACTIVES_V0996_MIGRATION_STATE_KEY, 'applied');
        try {
            await runPowerTemplateResyncMigration();
        } catch (err) {
            console.warn('Mastery System | post-v0.9.9.6 resync failed', err);
        }
    }
    return summary;
}

/**
 * Restore every item on one actor from its v0.9.9.6 backup flag and clear the
 * markers. Resets the world state to `pending` (unless disabled) so the resync
 * does not re-bake the restored values before the GM reviews again.
 */
export async function rollbackActorV0996(
    actor: any,
    options: { resetState?: boolean } = {},
): Promise<number> {
    let restored = 0;
    if (options.resetState !== false) {
        try {
            await (globalThis as any).game?.settings?.set(FLAG_SCOPE, ACTIVES_V0996_MIGRATION_STATE_KEY, 'pending');
        } catch (err) {
            console.warn('Mastery System | v0.9.9.6 rollback: state reset failed', err);
        }
    }
    for (const item of docItems(actor)) {
        const backup = readFlag(item, V0996_BACKUP_FLAG) as any;
        const marked =
            backup ||
            readFlag(item, V0996_MIGRATED_FLAG) ||
            readFlag(item, V0996_CONFLICT_FLAG) ||
            readFlag(item, V0996_RETIRED_FLAG);
        if (!marked) continue;
        const patch: Record<string, unknown> = {
            [`flags.${FLAG_SCOPE}.-=${V0996_BACKUP_FLAG}`]: null,
            [`flags.${FLAG_SCOPE}.-=${V0996_MIGRATED_FLAG}`]: null,
            [`flags.${FLAG_SCOPE}.-=${V0996_CONFLICT_FLAG}`]: null,
            [`flags.${FLAG_SCOPE}.-=${V0996_RETIRED_FLAG}`]: null,
            [`flags.${FLAG_SCOPE}.-=${V0996_NOTE_FLAG}`]: null,
        };
        if (backup && typeof backup === 'object') {
            if (backup.name !== undefined) patch.name = backup.name;
            for (const [k, v] of Object.entries(backup.system ?? {})) {
                if (v !== undefined) patch[`system.${k}`] = v;
            }
        }
        await item.update(patch);
        restored += 1;
    }
    return restored;
}

/* ------------------------------------------------------------------ */
/* World-load entry point                                              */
/* ------------------------------------------------------------------ */

/**
 * GM world load: build the dry-run report (reads only). A clean world with
 * nothing to migrate is marked `applied`; otherwise a persistent banner is
 * shown and the review dialog opens. Must run before the template resync.
 */
export async function runActivesV0996DryRunOnReady(g: any = (globalThis as any).game): Promise<V0996Report | null> {
    if (!g?.user?.isGM) return null;
    if (getActivesV0996MigrationState() === 'applied') return null;
    const report = buildActivesV0996Report(g);
    if (!reportHasChanges(report)) {
        await g.settings.set(FLAG_SCOPE, ACTIVES_V0996_MIGRATION_STATE_KEY, 'applied');
        return report;
    }
    const n = report.items.length + report.artifactPicks.length;
    try {
        (globalThis as any).ui?.notifications?.warn?.(
            `Actives v0.9.9.6: ${n} owned power(s) / Artifact pick(s) still use their old values. ` +
                'Review and apply the migration (game.masterySystem.activesV0996Review()). ' +
                'Until then, new purchases use v0.9.9.6 values and owned items keep their stored values.',
            { permanent: true },
        );
    } catch {
        /* optional */
    }
    try {
        const { openActivesV0996Review } = await import('./actives-v0996-review-dialog.js');
        openActivesV0996Review(report);
    } catch (err) {
        console.warn('Mastery System | v0.9.9.6 review dialog failed to open', err);
    }
    return report;
}
