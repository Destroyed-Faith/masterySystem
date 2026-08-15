import { describe, expect, it } from 'vitest';
import { attributeBandCost, powerLevelCost } from '../src/utils/constants.js';
import { ARTIFACT_UPGRADE_XP_COST } from '../src/utils/artifact-actor-rules.js';
import {
  appendXpHistory,
  buildBandedStepEntries,
  expandHistoryRows,
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
    expect(rows[0].signedAmount).toBe(-attributeBandCost(9));
    expect(rows[1].signedAmount).toBe(-attributeBandCost(10));
    expect(rows[2].signedAmount).toBe(-attributeBandCost(7));
  });

  it('shows an artifact upgrade as its own row', () => {
    const rows = expandHistoryRows([
      {
        ts: 20,
        kind: 'spend',
        category: 'artifact',
        amount: ARTIFACT_UPGRADE_XP_COST,
        note: 'Dragon Claws 1 → 2',
        details: { name: 'Dragon Claws', from: 1, to: 2 },
      },
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].what).toBe('Dragon Claws 1 → 2');
    expect(rows[0].signedAmount).toBe(-ARTIFACT_UPGRADE_XP_COST);
    expect(rows[0].category).toBe('artifact');
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

describe('appendXpHistory', () => {
  it('keeps only the last 200 entries', () => {
    const actor = { system: { xp: { history: Array.from({ length: 199 }, (_, i) => ({ ts: i })) } } };
    const next = appendXpHistory(actor, [{ ts: 1000, kind: 'grant' }, { ts: 1001, kind: 'spend' }]);
    expect(next).toHaveLength(200);
    expect(next[0].ts).toBe(1);
    expect(next[199].ts).toBe(1001);
  });
});
