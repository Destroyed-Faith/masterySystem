import { describe, expect, it, beforeEach } from 'vitest';
import { formatStoneReceiptLines } from '../src/combat/stone-assignment-chat';
import { getIncomingWardTotal } from '../src/dice/damage-dialog';

describe('formatStoneReceiptLines', () => {
  it('groups paid lanes by stone power name', () => {
    const lines = formatStoneReceiptLines([
      { accKey: 'might.meleeDamage:might:0', value: [1, 2] },
      { accKey: 'agility.evade:agility:0', value: [3] },
      { accKey: 'might.meleeDamage:might:1', value: [4] },
    ]);
    expect(lines.some((l) => /Martial Damage \(3 stones\)/.test(l))).toBe(true);
    expect(lines.some((l) => /Evade \(1 stone\)/.test(l))).toBe(true);
  });

  it('returns empty for no receipt', () => {
    expect(formatStoneReceiptLines([])).toEqual([]);
    expect(formatStoneReceiptLines(null)).toEqual([]);
  });
});

describe('getIncomingWardTotal', () => {
  beforeEach(() => {
    (globalThis as any).game = { combat: null, user: { isGM: true } };
  });

  it('sums passive wardIncoming from mechanics breakdown', () => {
    const actor = {
      system: {
        derived: { mechanicsBreakdown: { totals: { wardIncoming: 2 } } },
      },
    };
    expect(getIncomingWardTotal(actor as any)).toBe(2);
  });

  it('returns 0 when target is missing', () => {
    expect(getIncomingWardTotal(null)).toBe(0);
  });
});
