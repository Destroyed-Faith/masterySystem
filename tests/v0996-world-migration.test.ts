/**
 * Rules v0.9.9.6 world migration: plan, apply once with backups, chat report,
 * idempotency and rollback.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const repaired = vi.hoisted(() => [] as string[]);
vi.mock('../src/utils/seed-artifact-library.js', () => ({
    repairArtifactTreeByKey: async (key: string) => {
        repaired.push(key);
        return 10;
    },
}));

import { findCatalogEntry } from '../src/utils/power-catalog.js';
import { buildPowerItemFromCatalogEntry } from '../src/utils/power-item-builder.js';
import {
    buildV0996WorldReport,
    rollbackV0996WorldActor,
    runV0996WorldMigrationOnReady,
    V0996_WORLD_BACKUP_FLAG,
    V0996_WORLD_STATE_KEY,
} from '../src/migrations/v0996-world-migration.js';

const settings = new Map<string, unknown>();
const chat: any[] = [];

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

function mockDoc(data: any): any {
    const doc: any = {
        ...data,
        flags: data.flags ?? {},
        getFlag(scope: string, key: string) {
            return doc.flags?.[scope]?.[key];
        },
        async update(patch: Record<string, unknown>) {
            for (const [k, v] of Object.entries(patch)) setPath(doc, k, v);
            return doc;
        },
    };
    return doc;
}

function power(templateId: string, rank: number, id: string, name?: string): any {
    const entry = findCatalogEntry(templateId, null);
    if (!entry) throw new Error(`no entry ${templateId}`);
    const data: any = structuredClone(buildPowerItemFromCatalogEntry(entry, rank));
    return mockDoc({ ...data, id, name: name ?? data.name });
}

function mockActor(id: string, name: string, items: any[], extra: any = {}): any {
    const map = new Map(items.map((i) => [i.id, i]));
    return mockDoc({
        id,
        uuid: `Actor.${id}`,
        name,
        type: 'character',
        system: {},
        items: { contents: items, get: (k: string) => map.get(k), values: () => map.values() },
        ...extra,
    });
}

function installGame(actors: any[], worldItems: any[] = []): any {
    const g: any = {
        user: { id: 'gm', isGM: true },
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
    (globalThis as any).ChatMessage = {
        create: async (m: any) => chat.push(m),
        getWhisperRecipients: () => [{ id: 'gm' }],
    };
    return g;
}

/** Reaction: Reposition as stored before v0.9.9.6 (3 m at PL 6). */
function oldReposition(id: string): any {
    const item = power('reaction-reposition', 6, id);
    item.system.levels['6'].effect.text = 'After the triggering event fully resolves, move up to **3 m** using normal legal movement.';
    item.system.levels['6'].mechanics = { ...(item.system.levels['6'].mechanics ?? {}), movementBonus: 3 };
    return item;
}

describe('Rules v0.9.9.6 world migration', () => {
    beforeEach(() => {
        settings.clear();
        settings.set('activesV0996MigrationState', 'applied');
        settings.set('legacyCleanup2026MigrationState', 'applied');
        settings.set(V0996_WORLD_STATE_KEY, 'pending');
        chat.length = 0;
        repaired.length = 0;
    });

    it('plans re-bakes, renames, Artifact copies, NPC Basic Evade rows and Last Breath info', () => {
        const pc = mockActor('pc', 'Kael', [
            oldReposition('rep'),
            power('reaction-reactive-cleanse', 4, 'cl', 'Reaction: Reactive Cleanse'),
            power('reaction-armor', 4, 'arm'),
            mockDoc({ id: 'dh', name: 'Dragon Head', type: 'artifact', flags: { 'mastery-system': { echoArtifactKey: 'dragonHead', evolutionRootItemId: 'r', evolutionNodeId: 'dragonHead-l1' } } }),
            mockDoc({ id: 'fx', name: 'Frostbound Axe', type: 'artifact', flags: { 'mastery-system': { echoArtifactKey: 'frostboundReturningAxe' } } }),
        ], {
            flags: { 'mastery-system': { lastBreathUsed: true } },
            system: { stonePools: { might: { burned: 1 } } },
        });
        const npc = mockActor('npc', 'Ghoul', [], {
            type: 'npc',
            system: {
                npcReactions: [
                    { id: 'a', name: 'Evade', source: 'basic', basicId: 'evade' },
                    { id: 'b', name: 'Guard', source: 'basic', basicId: 'guard' },
                ],
                phases: [{ npcReactions: [{ id: 'c', name: 'Evade', source: 'basic', basicId: 'evade' }] }],
            },
        });
        const tree = mockDoc({ id: 'w1', type: 'artifact', flags: { 'mastery-system': { echoArtifactKey: 'dragonHead' } } });
        const g = installGame([pc, npc], [tree]);
        const report = buildV0996WorldReport(g);

        expect(report.powers.map((p) => p.itemId).sort()).toEqual(['cl', 'rep']);
        const rep = report.powers.find((p) => p.itemId === 'rep')!;
        expect(rep.before).toContain('3 m');
        expect(rep.after).toContain('2 m');
        expect(report.powers.find((p) => p.itemId === 'cl')!.rename).toBe('Reaction: Cleanse');
        expect(report.artifactTrees).toEqual(['dragonHead']);
        expect(report.artifacts.map((a) => [a.itemId, a.linked])).toEqual([['dh', true], ['fx', false]]);
        expect(report.npcEvade).toEqual([{ actorName: 'Ghoul', actorUuid: 'Actor.npc', removed: 2 }]);
        expect(report.lastBreath).toHaveLength(1);
        expect(report.lastBreath[0]!.note).toContain('might');
    });

    it('applies once with backups, whispers the report, and rolls back', async () => {
        const rep = oldReposition('rep');
        const cleanse = power('reaction-reactive-cleanse', 4, 'cl', 'Reaction: Reactive Cleanse');
        const pc = mockActor('pc', 'Kael', [rep, cleanse]);
        const npc = mockActor('npc', 'Ghoul', [], {
            type: 'npc',
            system: { npcReactions: [{ id: 'a', name: 'Evade', source: 'basic', basicId: 'evade' }, { id: 'b', name: 'Guard', source: 'basic', basicId: 'guard' }] },
        });
        const tree = mockDoc({ id: 'w1', type: 'artifact', flags: { 'mastery-system': { echoArtifactKey: 'lorKethsStaff' } } });
        installGame([pc, npc], [tree]);

        await runV0996WorldMigrationOnReady();

        expect(settings.get(V0996_WORLD_STATE_KEY)).toBe('applied');
        expect(rep.system.levels['6'].effect.text).toContain('**2 m**');
        expect(rep.flags['mastery-system'][V0996_WORLD_BACKUP_FLAG].system.levels['6'].effect.text).toContain('3 m');
        expect(cleanse.name).toBe('Reaction: Cleanse');
        expect(cleanse.system.templateName).toBe('Cleanse');
        expect(npc.system.npcReactions.map((r: any) => r.basicId)).toEqual(['guard']);
        expect(npc.flags['mastery-system'][V0996_WORLD_BACKUP_FLAG].npcReactions).toHaveLength(2);
        expect(repaired).toEqual(['lorKethsStaff']);
        expect(chat).toHaveLength(1);
        expect(chat[0].whisper).toEqual(['gm']);
        expect(chat[0].content).toContain('Rules v0.9.9.6 world migration');
        expect(chat[0].content).toContain('removed 1 Basic Evade row');

        // Idempotent: a second load does nothing.
        await runV0996WorldMigrationOnReady();
        expect(chat).toHaveLength(1);

        await rollbackV0996WorldActor(pc);
        expect(rep.system.levels['6'].effect.text).toContain('3 m');
        expect(cleanse.name).toBe('Reaction: Reactive Cleanse');
        await rollbackV0996WorldActor(npc);
        expect(npc.system.npcReactions.map((r: any) => r.basicId)).toEqual(['evade', 'guard']);
    });

    it('leaves Actives held for the Actives v0.9.9.6 review alone and marks a clean world applied', async () => {
        settings.set('activesV0996MigrationState', 'pending');
        const restoration = power('active-ranged-aoe-restoration', 8, 'ar');
        restoration.system.levels['8'].mechanics = { ...(restoration.system.levels['8'].mechanics ?? {}), healthLevelRecovery: 9 };
        const g = installGame([mockActor('pc', 'Kael', [restoration])]);
        const report = buildV0996WorldReport(g);
        expect(report.powers).toEqual([]);
        expect(report.heldForActivesReview).toBe(1);

        installGame([mockActor('pc2', 'Clean', [power('reaction-armor', 4, 'arm')])]);
        await runV0996WorldMigrationOnReady();
        expect(settings.get(V0996_WORLD_STATE_KEY)).toBe('applied');
        expect(chat).toHaveLength(0);
    });
});
