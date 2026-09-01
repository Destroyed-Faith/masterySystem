import { describe, expect, it } from 'vitest';
import { attributeBandCost, artifactLevelXpCost, powerLevelCost } from '../src/utils/constants.js';
import {
  appendXpHistory,
  buildBandedStepEntries,
  expandHistoryRows,
  inferMissingArtifactHistoryEntries,
} from '../src/utils/xp-history.js';

describe('expandHistoryRows', () => {
  it('keeps grant rows as a single Regular / Free XP line', () => {
    const rows = expandHistoryRows([
      { ts: 1, kind: 'grant', category: 'xp', amount: 12 },
      { ts: 2, kind: 'grant', category: 'xp', amount: 5, note: 'free' },
    ]);
    expect(rows).toHaveLength(2);
    expect(rows[0].what).toBe('Regular XP');
    expect(rows[0].signedAmount).toBe(12);
    expect(rows[1].what).toBe('Free XP');
    expect(rows[1].signedAmount).toBe(5);
  });

  it('splits a batched attribute confirm into one row per +1', () => {
    const rows = expandHistoryRows([
      {
        ts: 10,
        kind: 'spend',
        category: 'attribute',
        amount: 3,
        details: {
          changes: [
            { attr: 'might', from: 8, to: 10, cost: 3 },
            { attr: 'wits', from: 6, to: 7, cost: 1 },
          ],
          netCost: 3,
        },
      },
    ]);
    expect(rows.map(r => r.what)).toEqual(['Might 8 → 9', 'Might 9 → 10', 'Wits 6 → 7']);
    expect(rows.map(r => r.key)).toEqual(['might', 'might', 'wits']);
    expect(rows[0].from).toBe(8);
    expect(rows[0].to).toBe(9);
    expect(rows[0].signedAmount).toBe(-attributeBandCost(9));
    expect(rows[1].signedAmount).toBe(-attributeBandCost(10));
    expect(rows[2].signedAmount).toBe(-attributeBandCost(7));
  });

  it('shows an artifact upgrade as its own row with banded cost', () => {
    const rows = expandHistoryRows([
      {
        ts: 20,
        kind: 'spend',
        category: 'artifact',
        amount: artifactLevelXpCost(2),
        note: 'Dragon Claws 1 → 2',
        details: { name: 'Dragon Claws', from: 1, to: 2 },
      },
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].what).toBe('Dragon Claws 1 → 2');
    expect(rows[0].key).toBe('');
    expect(rows[0].from).toBe(1);
    expect(rows[0].to).toBe(2);
    expect(rows[0].signedAmount).toBe(-artifactLevelXpCost(2));
    expect(rows[0].category).toBe('artifact');
  });

  it('uses the new-level band cost when expanding artifact history', () => {
    const rows = expandHistoryRows([
      {
        ts: 21,
        kind: 'spend',
        category: 'artifact',
        amount: artifactLevelXpCost(4),
        note: 'Dragon Claws 3 → 4',
        details: { name: 'Dragon Claws', from: 3, to: 4 },
      },
    ]);
    expect(rows[0].signedAmount).toBe(-16);
  });
});

describe('buildBandedStepEntries', () => {
  const balances = {
    before: { available: 20, totalEarned: 20, totalSpent: 0 },
    after: { available: 17, totalEarned: 20, totalSpent: 3 },
  };

  it('writes one spend entry per attribute step', () => {
    const entries = buildBandedStepEntries({
      category: 'attribute',
      pendingMap: { might: 2, wits: 1 },
      getCurrent: key => (key === 'might' ? 8 : 6),
      getLabel: key => (key === 'might' ? 'Might' : 'Wits'),
      costForTarget: attributeBandCost,
      ...balances,
      user: { userId: 'u1', userName: 'GM' },
      ts: 100,
    });
    expect(entries.map(e => e.note)).toEqual(['Might 8 → 9', 'Might 9 → 10', 'Wits 6 → 7']);
    expect(entries.every(e => e.kind === 'spend')).toBe(true);
    expect(entries.every(e => e.category === 'attribute')).toBe(true);
  });

  it('writes refund entries for skill decreases', () => {
    const entries = buildBandedStepEntries({
      category: 'skill',
      pendingMap: { athletics: -1 },
      getCurrent: () => 4,
      getLabel: () => 'Athletics',
      costForTarget: attributeBandCost,
      ...balances,
      ts: 200,
    });
    expect(entries).toHaveLength(1);
    expect(entries[0].kind).toBe('adjust');
    expect(entries[0].note).toBe('refund: Athletics 4 → 3');
    expect(entries[0].amount).toBe(attributeBandCost(4));
  });

  it('uses power level cost for power steps', () => {
    const entries = buildBandedStepEntries({
      category: 'power',
      pendingMap: { p1: 1 },
      getCurrent: () => 2,
      getLabel: () => 'Fireball',
      costForTarget: powerLevelCost,
      ...balances,
      ts: 300,
    });
    expect(entries).toHaveLength(1);
    expect(entries[0].note).toBe('Fireball 2 → 3');
    expect(entries[0].amount).toBe(powerLevelCost(3));
  });
});

describe('inferMissingArtifactHistoryEntries', () => {
  function actorWithArtifacts(artifacts: Array<{ id: string; name: string; level: number }>, history: any[] = []) {
    const items = artifacts.map(a => ({
      id: a.id,
      type: 'artifact',
      name: a.name,
      system: { level: a.level },
    }));
    return {
      items: {
        filter: (fn: (i: any) => boolean) => items.filter(fn),
      },
      system: { xp: { history } },
    };
  }

  it('synthesizes one banded XP spend per level above 1', () => {
    const actor = actorWithArtifacts([{ id: 'art1', name: 'Dragon Claws', level: 3 }]);
    const missing = inferMissingArtifactHistoryEntries(actor);
    expect(missing).toHaveLength(2);
    expect(missing.map(e => `${e.details.from}→${e.details.to}`)).toEqual(['1→2', '2→3']);
    expect(missing.every(e => e.kind === 'spend' && e.category === 'artifact')).toBe(true);
    expect(missing[0].amount).toBe(artifactLevelXpCost(2));
    expect(missing[1].amount).toBe(artifactLevelXpCost(3));
    expect(missing[0].details.artifactId).toBe('art1');
  });

  it('uses higher bands when inferring L4+ history', () => {
    const actor = actorWithArtifacts([{ id: 'art1', name: 'Dragon Claws', level: 4 }]);
    const missing = inferMissingArtifactHistoryEntries(actor);
    expect(missing).toHaveLength(3);
    expect(missing.map(e => e.amount)).toEqual([8, 8, 16]);
  });

  it('skips steps that are already in the history log', () => {
    const actor = actorWithArtifacts(
      [{ id: 'art1', name: 'Dragon Claws', level: 3 }],
      [
        {
          ts: 1,
          kind: 'spend',
          category: 'artifact',
          amount: artifactLevelXpCost(2),
          details: { artifactId: 'art1', name: 'Dragon Claws', from: 1, to: 2 },
        },
      ],
    );
    const missing = inferMissingArtifactHistoryEntries(actor);
    expect(missing).toHaveLength(1);
    expect(missing[0].details.from).toBe(2);
    expect(missing[0].details.to).toBe(3);
  });

  it('does not invent rows when the log already covers the current level', () => {
    const actor = actorWithArtifacts(
      [{ id: 'art1', name: 'Dragon Claws', level: 2 }],
      [
        {
          ts: 1,
          kind: 'spend',
          category: 'artifact',
          amount: artifactLevelXpCost(2),
          details: { artifactId: 'art1', name: 'Dragon Claws', from: 1, to: 2 },
        },
      ],
    );
    expect(inferMissingArtifactHistoryEntries(actor)).toEqual([]);
  });

  it('matches nameless older log rows by artifact name', () => {
    const actor = actorWithArtifacts(
      [{ id: 'art1', name: 'Dragon Claws', level: 2 }],
      [
        {
          ts: 1,
          kind: 'spend',
          category: 'artifact',
          amount: artifactLevelXpCost(2),
          note: 'Dragon Claws 1 → 2',
          details: { name: 'Dragon Claws', from: 1, to: 2 },
        },
      ],
    );
    expect(inferMissingArtifactHistoryEntries(actor)).toEqual([]);
  });

  it('ignores level-1 artifacts', () => {
    const actor = actorWithArtifacts([{ id: 'art1', name: 'Starter Blade', level: 1 }]);
    expect(inferMissingArtifactHistoryEntries(actor)).toEqual([]);
  });
});

describe('appendXpHistory', () => {
  it('keeps only the last 200 entries', () => {
    const actor = { system: { xp: { history: Array.from({ length: 199 }, (_, i) => ({ ts: i })) } } };
    const next = appendXpHistory(actor, [{ ts: 1000, kind: 'grant' }, { ts: 1001, kind: 'spend' }]);
    expect(next).toHaveLength(200);
    expect(next[0].ts).toBe(1);
    expect(next[199].ts).toBe(1001);
  });
});
