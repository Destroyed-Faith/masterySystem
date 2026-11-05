/**
 * Batch B / K4 — identity preflight (read-only) + catalog gate.
 */
import { describe, expect, it } from 'vitest';
import {
  formatIdentityPreflightMarkdown,
  preflightActor,
  preflightArtifactCatalog,
  preflightCatalogTemplates,
  runIdentityPreflight,
  suggestIdentityForUnresolved,
} from '../src/utils/identity-preflight.js';
import { ALL_POWER_TEMPLATES } from '../src/utils/powers/templates/index.js';

function uniqueTemplateNames(): Array<{ name: string; id: string }> {
  const counts = new Map<string, number>();
  const ids = new Map<string, string>();
  for (const t of ALL_POWER_TEMPLATES) {
    const name = String(t.templateName || '').trim();
    if (!name) continue;
    counts.set(name, (counts.get(name) || 0) + 1);
    ids.set(name, t.templateId);
  }
  const out: Array<{ name: string; id: string }> = [];
  for (const [name, id] of ids) {
    if (counts.get(name) === 1) out.push({ name, id });
  }
  return out;
}

describe('identity preflight', () => {
  it('catalog templates all resolve', () => {
    const report = preflightCatalogTemplates();
    expect(report.totals.unresolved).toBe(0);
    expect(report.totals.resolved).toBe(report.totals.sources);
  });

  it('artifact catalog: 0 blocking unresolved (invalid IDs); missing IDs are informational migration debt', () => {
    const report = preflightArtifactCatalog();
    const blocking = report.entries.filter(
      (e) => e.severity === 'blocks-activation' || e.severity === 'omits-contribution',
    );
    if (blocking.length > 0) {
      // eslint-disable-next-line no-console
      console.log(
        blocking.slice(0, 15).map((e) => ({
          reason: e.reason,
          diagnostic: e.diagnostic,
          ref: e.ref,
          disposition: e.disposition,
        })),
      );
    }
    expect(blocking).toEqual([]);
  });

  it('freigegebene artifacts resolve (Ringchain, Dragon Head breath, Titan Growth, Life Absorption)', () => {
    const report = preflightArtifactCatalog();
    const keys = new Set([
      'ringchainOfKeptNames',
      'dragonHead',
      'titanScars',
      'hollowCrown',
    ]);
    const relevant = report.entries.filter((e) => keys.has(String(e.ref.echoArtifactKey || '')));
    const freigegebeneLevels: Record<string, number[]> = {
      ringchainOfKeptNames: [2, 3, 4, 6, 7, 8, 10],
      dragonHead: [1, 4, 7, 10],
      titanScars: [1, 4, 7, 10],
      hollowCrown: [2, 5, 8, 10],
    };
    for (const e of relevant) {
      const key = String(e.ref.echoArtifactKey);
      const lvl = e.ref.rowLevel;
      if (lvl != null && freigegebeneLevels[key]?.includes(lvl)) {
        expect.fail(`${key} L${lvl}: ${e.reason} — ${e.diagnostic}`);
      }
    }
  });

  it('P1: fixture actor with missing identity is reported without writes', () => {
    const updates: unknown[] = [];
    const actor = {
      id: 'ActorFixture1',
      name: 'Fixture Hero',
      items: [
        {
          id: 'p1',
          type: 'power',
          name: 'Legacy Stance',
          system: { description: 'enter a defensive stance', rank: 4 },
          update: (data: unknown) => updates.push(data),
        },
        {
          id: 'p2',
          type: 'power',
          name: 'Unique Buff Name Fixture',
          // Use a unique templateName that exists exactly once in the catalog.
          system: { templateName: 'Hearth Circle', rank: 4 },
          update: (data: unknown) => updates.push(data),
        },
        {
          id: 'a1',
          type: 'artifact',
          name: 'Unknown Artifact Fixture',
          flags: { 'mastery-system': { echoArtifactKey: '' } },
          system: {
            currentLevel: 3,
            levelProgression: [
              {
                level: 3,
                name: 'Mystery Active',
                type: 'Active',
              },
            ],
          },
          update: (data: unknown) => updates.push(data),
        },
      ],
      effects: [
        {
          id: 'e1',
          name: 'Buff Without Id',
          flags: { 'mastery-system': { activeBuff: true, powerId: 'missing' } },
        },
      ],
    };

    const report = preflightActor(actor);
    expect(report.totals.unresolved).toBeGreaterThan(0);
    expect(updates).toEqual([]);
    expect(report.entries.some((e) => e.reason === 'missing-identity')).toBe(true);
  });

  it('P2: throwing identity source still yields report (no throw)', () => {
    const actor = {
      id: 'boom-actor',
      items: {
        values() {
          throw new Error('boom');
        },
      },
      effects: [],
    };
    // Plan P2: preflight must not throw into the gameplay pipeline.
    expect(() => preflightActor(actor)).not.toThrow();
    const report = preflightActor(actor);
    expect(report.errors?.length).toBeGreaterThan(0);
    expect(() => runIdentityPreflight({ kind: 'catalog' })).not.toThrow();
  });

  it('K4: suggestedIdentity for unique templateName → auto-provenance', () => {
    const unique = uniqueTemplateNames()[0];
    expect(unique).toBeTruthy();
    const suggested = suggestIdentityForUnresolved({
      kind: 'power-item',
      item: { system: { templateName: unique!.name, rank: 2 } },
    });
    expect(suggested?.basis).toBe('templateName-exact');
    expect(suggested?.templateId).toBe(unique!.id);

    const report = preflightActor({
      items: [
        {
          id: 'p',
          type: 'power',
          name: unique!.name,
          system: { templateName: unique!.name, rank: 2 },
        },
      ],
      effects: [],
    });
    const entry = report.entries.find((e) => e.ref.itemId === 'p');
    expect(entry?.disposition).toBe('auto-provenance');
    expect(entry?.suggestedIdentity?.templateId).toBe(unique!.id);
  });

  it('K4: ambiguous templateName yields no suggestion (manual)', () => {
    // "Armor" collides across passive / buff / reaction families.
    const suggested = suggestIdentityForUnresolved({
      kind: 'power-item',
      item: { system: { templateName: 'Armor', rank: 1 } },
    });
    expect(suggested).toBeUndefined();
  });

  it('K4: flags.powerId suggestion when linked power has templateId', () => {
    const suggested = suggestIdentityForUnresolved({
      kind: 'active-effect',
      effect: { flags: { 'mastery-system': { activeBuff: true, powerId: 'pw1' } } },
      actorItems: [{ id: 'pw1', system: { templateId: 'ab-armor', rank: 3 } }],
    });
    expect(suggested?.basis).toBe('flags.powerId');
    expect(suggested?.templateId).toBe('ab-armor');
    expect(suggested?.rank).toBe(3);
  });

  it('K4: markdown export is non-empty', () => {
    const report = preflightCatalogTemplates();
    const md = formatIdentityPreflightMarkdown(report);
    expect(md).toContain('Identity Preflight');
  });
});
