import { describe, expect, it } from 'vitest';
import {
  formatXpAccountResetConfirmHtml,
  hasAnyXpAccounting,
  readXpAccounting,
} from '../src/utils/xp-account-reset.js';

describe('xp-account-reset', () => {
  it('readXpAccounting reads all pools', () => {
    const snap = readXpAccounting({
      system: {
        points: { xp: 5, xpFree: 3 },
        xp: {
          totalEarned: 20,
          totalSpent: 12,
          freeEarned: 3,
          freeSpent: 0,
          history: [{ ts: 1 }],
        },
      },
    });
    expect(snap.regularAvailable).toBe(5);
    expect(snap.freeAvailable).toBe(3);
    expect(snap.totalEarned).toBe(20);
    expect(snap.historyLength).toBe(1);
    expect(hasAnyXpAccounting(snap)).toBe(true);
  });

  it('hasAnyXpAccounting is false on a clean actor', () => {
    const snap = readXpAccounting({ system: { points: {}, xp: {} } });
    expect(hasAnyXpAccounting(snap)).toBe(false);
  });

  it('formatXpAccountResetConfirmHtml includes actor name and totals', () => {
    const html = formatXpAccountResetConfirmHtml('Aldric', {
      regularAvailable: 4,
      freeAvailable: 2,
      totalEarned: 10,
      totalSpent: 4,
      freeEarned: 2,
      freeSpent: 0,
      historyLength: 3,
    });
    expect(html).toContain('Aldric');
    expect(html).toContain('History-Einträge: 3');
  });
});
