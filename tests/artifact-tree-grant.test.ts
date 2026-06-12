import { describe, expect, it, vi } from 'vitest';
import {
  actorHasProgressionArtifacts,
  inferArtifactKeyFromName,
  listUnwiredEmbeddedArtifacts,
} from '../src/utils/artifact-tree-grant.js';
import { buildProgressionHubContext } from '../src/progression/progression-hub-actions.js';

function mkItem(opts: {
  id?: string;
  name?: string;
  type?: string;
  flags?: Record<string, unknown>;
  system?: Record<string, unknown>;
}): any {
  const flags: Record<string, Record<string, unknown>> = {
    'mastery-system': {},
  };
  for (const [k, v] of Object.entries(opts.flags || {})) {
    flags['mastery-system'][k] = v;
  }
  return {
    id: opts.id ?? 'item1',
    name: opts.name ?? 'Moonlight Greatsword',
    type: opts.type ?? 'artifact',
    system: opts.system ?? { binding: 'bound', level: 1 },
    getFlag(ns: string, key: string) {
      return flags[ns]?.[key];
    },
    setFlag: vi.fn(async (ns: string, key: string, val: unknown) => {
      if (!flags[ns]) flags[ns] = {};
      flags[ns][key] = val;
    }),
    update: vi.fn(async () => undefined),
  };
}

function mkActor(items: any[], system: Record<string, unknown> = {}): any {
  return {
    id: 'actor1',
    system: {
      mastery: { rank: 2 },
      points: { xp: 20, xpFree: 0 },
      attributes: {
        might: { value: 8 },
        agility: { value: 6 },
        vitality: { value: 6 },
        intellect: { value: 4 },
        resolve: { value: 4 },
        influence: { value: 2 },
        wits: { value: 2 },
      },
      skills: {},
      stones: { current: 1 },
      xp: { currentStep: { attributes: [], skills: [], powers: [], artifacts: [] } },
      ...system,
    },
    items: {
      filter(fn: (i: any) => boolean) {
        return items.filter(fn);
      },
      get(id: string) {
        return items.find((i) => i.id === id);
      },
    },
  };
}

describe('inferArtifactKeyFromName', () => {
  it('matches general artifact display names', () => {
    expect(inferArtifactKeyFromName('Moonlight Greatsword (L1)')).toBe('moonlightGreatsword');
    expect(inferArtifactKeyFromName('Dragon Head')).toBe('dragonHead');
  });

  it('returns null for unrelated names', () => {
    expect(inferArtifactKeyFromName('Rusty Dagger')).toBeNull();
  });
});

describe('actorHasProgressionArtifacts / listUnwiredEmbeddedArtifacts', () => {
  it('detects any embedded artifact', () => {
    const actor = mkActor([mkItem({})]);
    expect(actorHasProgressionArtifacts(actor)).toBe(true);
  });

  it('lists unwired artifacts with inferable keys', () => {
    const actor = mkActor([
      mkItem({ id: 'a1', flags: {} }),
      mkItem({ id: 'a2', flags: { evolutionRootItemId: 'root1', evolutionNodeId: 'n1' } }),
    ]);
    const unwired = listUnwiredEmbeddedArtifacts(actor);
    expect(unwired).toHaveLength(1);
    expect(unwired[0].id).toBe('a1');
  });
});

describe('buildProgressionHubContext', () => {
  it('includes unwired artifacts and xp summary', () => {
    const actor = mkActor([
      mkItem({ id: 'emb1', name: 'Moonlight Greatsword' }),
    ]);
    const ctx = buildProgressionHubContext(actor);
    expect(ctx.hasArtifacts).toBe(true);
    expect(ctx.unwiredArtifacts).toHaveLength(1);
    expect(ctx.xp.available).toBe(20);
    expect(ctx.artifactCards).toHaveLength(0);
  });
});

describe('calculateAttributePendingNetCost', () => {
  it('computes positive net cost for attribute increases', async () => {
    const { calculateAttributePendingNetCost } = await import(
      '../src/progression/progression-hub-actions.js'
    );
    const actor = mkActor([]);
    const net = calculateAttributePendingNetCost(actor, { might: 1 });
    expect(net).toBeGreaterThan(0);
  });
});
