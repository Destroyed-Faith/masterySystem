/**
 * Actives v0.9.9.6 migration: dry-run plan, Apply, conflicts, Mental Attack,
 * idempotency, backup / rollback, Artifact picks and the resync hold.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { findCatalogEntry } from '../src/utils/power-catalog.js';
import { buildPowerItemFromCatalogEntry } from '../src/utils/power-item-builder.js';
import { getEligibleSpecialsForTier } from '../src/utils/powers/templates/_specials.js';
import {
    applyActivesV0996Report,
    buildActivesV0996Report,
    planActorV0996,
    rollbackActorV0996,
    runActivesV0996DryRunOnReady,
} from '../src/migrations/actives-v0996-migration.js';
import {
    isActivesV0996HeldTemplate,
    resyncPowerItemFromTemplate,
} from '../src/migrations/power-template-resync-migration.js';

const settings = new Map<string, unknown>();

/** A stored pre-v0.9.9.6 Damage + Special item (its template no longer exists in the catalog). */
function legacyDamagePower(delivery: 'melee' | 'ranged', tier: number, special: string, rank: number, id: string, name?: string): any {
    const item = powerFromCatalog(`active-${delivery}-instant-special-t${tier}`, special, rank, id, name);
    item.system.templateId = `active-${delivery}-damage-t${tier}`;
    item.system.levels[String(rank)].mechanics = { ...(item.system.levels[String(rank)].mechanics ?? {}), damageRider: { flat: '+2d8' } };
    return item;
}

function setPath(obj: any, path: string, value: unknown): void {
    const parts = path.split('.');
    let cur = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        const p = parts[i]!;
        if (cur[p] == null || typeof cur[p] !== 'object') cur[p] = {};
        cur = cur[p];
    }
    const last = parts[parts.length - 1]!;
    if (last.startsWith('-=')) delete cur[last.slice(2)];
    else cur[last] = value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

let writes = 0;

function mockItem(data: any): any {
    const item: any = {
        ...data,
        flags: data.flags ?? {},
        getFlag(scope: string, key: string) {
            return item.flags?.[scope]?.[key];
        },
        async update(patch: Record<string, unknown>) {
            writes += 1;
            for (const [k, v] of Object.entries(patch)) setPath(item, k, v);
            return item;
        },
    };
    return item;
}

function powerFromCatalog(templateId: string, special: string | null, rank: number, id: string, name?: string): any {
    const entry = findCatalogEntry(templateId, special);
    if (!entry) throw new Error(`no entry ${templateId}::${special}`);
    const data: any = buildPowerItemFromCatalogEntry(entry, rank);
    return mockItem({ ...data, id, name: name ?? data.name });
}

function mockActor(id: string, name: string, items: any[], type = 'character'): any {
    const map = new Map(items.map((i) => [i.id, i]));
    return {
        id,
        uuid: `Actor.${id}`,
        name,
        type,
        items: { contents: items, get: (k: string) => map.get(k), values: () => map.values() },
        toObject() {
            return { id, name, items: items.map((i) => ({ id: i.id, name: i.name })) };
        },
    };
}

function installGame(actors: any[], worldItems: any[] = []): any {
    const g: any = {
        user: { isGM: true },
        actors: { contents: actors },
        scenes: { contents: [] },
        items: { contents: worldItems, get: (id: string) => worldItems.find((i) => i.id === id) },
        settings: {
            get: (_ns: string, key: string) => settings.get(key),
            set: async (_ns: string, key: string, v: unknown) => {
                settings.set(key, v);
                return v;
            },
        },
    };
    (globalThis as any).game = g;
    (globalThis as any).ui = { notifications: { warn: () => undefined, info: () => undefined } };
    (globalThis as any).foundry = { utils: { saveDataToFile: () => undefined } };
    return g;
}

const T4 = getEligibleSpecialsForTier(4);
const S4 = T4[0]!;
const S4b = T4[1]!;

describe('Actives v0.9.9.6 migration', () => {
    beforeEach(() => {
        settings.clear();
        settings.set('activesV0996MigrationState', 'pending');
        writes = 0;
    });

    it('remaps damage-t* to instant-special-t* keeping PL, Special and custom names', async () => {
        const a = legacyDamagePower('melee', 4, S4, 7, 'i1');
        a.name = 'Melee ' + S4.split('-').map((w: string) => w[0]!.toUpperCase() + w.slice(1)).join(' ');
        a.flags = { 'mastery-system': { favorite: true } };
        const b = legacyDamagePower('ranged', 4, S4b, 3, 'i2', 'My Thunder Shot');
        const actor = mockActor('a1', 'Oda', [a, b]);
        const g = installGame([actor]);
        expect(findCatalogEntry('active-melee-damage-t4', S4)).toBeNull();

        const plan = planActorV0996(actor);
        const remaps = plan.filter((c) => c.kind === 'remap');
        expect(remaps).toHaveLength(2);
        expect(remaps[0]!.toTemplateId).toBe('active-melee-instant-special-t4');
        expect(remaps[0]!.rename).toBe(findCatalogEntry('active-melee-instant-special-t4', S4)!.name);
        expect(remaps[1]!.rename).toBeNull();

        const report = buildActivesV0996Report(g);
        const summary = await applyActivesV0996Report(report, g);
        expect(summary.failed).toBe(0);
        expect(a.system.templateId).toBe('active-melee-instant-special-t4');
        expect(a.system.rank).toBe(7);
        expect(a.system.chosenSpecial.key).toBe(S4);
        expect(a.flags['mastery-system'].favorite).toBe(true);
        expect(a.flags['mastery-system'].v0996Migrated).toBe(true);
        expect(a.flags['mastery-system'].v0996Backup.system.templateId).toBe('active-melee-damage-t4');
        expect(b.name).toBe('My Thunder Shot');
        expect(b.system.templateId).toBe('active-ranged-instant-special-t4');
        expect(settings.get('activesV0996MigrationState')).toBe('applied');
    });

    it('flags conflicts and Mental Attack without changing them', async () => {
        const legacy = legacyDamagePower('melee', 4, S4, 5, 'c1');
        const modern = powerFromCatalog('active-melee-instant-special-t4', S4, 5, 'c2');
        const mental = mockItem({
            id: 'm1',
            type: 'power',
            name: 'Mind Spike',
            system: { templateId: 'active-mental-attack', rank: 4, levels: {} },
        });
        const actor = mockActor('a2', 'Scurry', [legacy, modern, mental]);
        const g = installGame([actor]);
        const legacyLevels = JSON.stringify(legacy.system.levels);

        const report = buildActivesV0996Report(g);
        expect(report.items.filter((c) => c.kind === 'conflict')).toHaveLength(2);
        expect(report.items.find((c) => c.itemId === 'm1')?.kind).toBe('retire-mental');

        await applyActivesV0996Report(report, g);
        expect(legacy.system.templateId).toBe('active-melee-damage-t4');
        expect(JSON.stringify(legacy.system.levels)).toBe(legacyLevels);
        expect(legacy.flags['mastery-system'].v0996Conflict).toBe(true);
        expect(modern.flags['mastery-system'].v0996Conflict).toBe(true);
        expect(mental.system.templateId).toBe('active-mental-attack');
        expect(mental.flags['mastery-system'].v0996Retired).toBe(true);
        expect(actor.items.contents).toHaveLength(3);
    });

    it('is idempotent and rolls back per actor from the item backups', async () => {
        const a = legacyDamagePower('ranged', 4, S4, 4, 'r1');
        const actor = mockActor('a3', 'Alaris', [a]);
        const g = installGame([actor]);
        await applyActivesV0996Report(buildActivesV0996Report(g), g);
        expect(a.system.templateId).toBe('active-ranged-instant-special-t4');

        settings.set('activesV0996MigrationState', 'pending');
        const second = buildActivesV0996Report(g);
        expect(second.items).toHaveLength(0);
        const before = writes;
        await applyActivesV0996Report(second, g);
        expect(writes).toBe(before);

        await rollbackActorV0996(actor);
        expect(a.system.templateId).toBe('active-ranged-damage-t4');
        expect(a.flags['mastery-system'].v0996Migrated).toBeUndefined();
        expect(a.flags['mastery-system'].v0996Backup).toBeUndefined();
        expect(settings.get('activesV0996MigrationState')).toBe('pending');
    });

    it('remaps Artifact picks, including the Lor-Keth L1 pick', async () => {
        const custom = mockItem({
            id: 'art1',
            type: 'artifact',
            name: 'Storm Hammer',
            system: {
                progressionPicks: [{ level: 1, kind: 'power', powerTemplateId: 'active-melee-damage-t4', chosenSpecial: { key: S4, tier: 4 } }],
                levelProgression: [{ level: 1, powerTemplateId: 'active-melee-damage-t4' }],
            },
        });
        const lorKeth = mockItem({
            id: 'art2',
            type: 'artifact',
            name: "Lor-Keth's Staff",
            system: {
                progressionPicks: [{ level: 1, kind: 'power', powerTemplateId: 'active-melee-damage-t5', chosenSpecial: { key: 'challenge', tier: 5 } }],
            },
        });
        const actor = mockActor('a4', 'Lor', [custom, lorKeth]);
        const g = installGame([actor]);
        const report = buildActivesV0996Report(g);
        expect(report.artifactPicks.map((p) => p.kind)).toEqual(['remap', 'remap']);
        await applyActivesV0996Report(report, g);
        expect(custom.system.progressionPicks[0].powerTemplateId).toBe('active-melee-instant-special-t4');
        expect(custom.system.levelProgression[0].powerTemplateId).toBe('active-melee-instant-special-t4');
        expect(lorKeth.system.progressionPicks[0].powerTemplateId).toBe('active-melee-instant-special-t5');
    });

    it('holds the template resync for changed templates until the migration is applied', async () => {
        const aoe = powerFromCatalog('active-melee-aoe-damage-t4', S4, 6, 'h1');
        aoe.system.levels['6'].specials = [{ key: S4, rank: 99 }];
        installGame([mockActor('a5', 'Fynn', [aoe])]);
        expect(isActivesV0996HeldTemplate('active-melee-aoe-damage-t4')).toBe(true);
        expect(isActivesV0996HeldTemplate('active-melee-weapon-single')).toBe(false);

        expect(await resyncPowerItemFromTemplate(aoe, { force: true })).toBe(false);
        expect(aoe.system.levels['6'].specials[0].rank).toBe(99);

        settings.set('activesV0996MigrationState', 'applied');
        expect(await resyncPowerItemFromTemplate(aoe)).toBe(true);
        expect(aoe.system.levels['6'].specials[0].rank).not.toBe(99);
    });

    it('lists stale held-template items as re-bake changes in the dry-run', () => {
        const aoe = powerFromCatalog('active-melee-aoe-damage-t4', S4, 6, 'h2');
        aoe.system.levels['6'].specials = [{ key: S4, rank: 99 }];
        const g = installGame([mockActor('a6', 'Fynn', [aoe])]);
        const report = buildActivesV0996Report(g);
        const row = report.items.find((c) => c.itemId === 'h2');
        expect(row?.kind).toBe('resync');
        expect(row?.valueChanges[0]).toMatch(/99/);
    });

    it('a clean world is marked applied by the dry-run without writing items', async () => {
        const ok = powerFromCatalog('active-melee-weapon-single', null, 2, 'w1');
        installGame([mockActor('a7', 'Clean', [ok])]);
        await runActivesV0996DryRunOnReady();
        expect(settings.get('activesV0996MigrationState')).toBe('applied');
        expect(writes).toBe(0);
    });
});
