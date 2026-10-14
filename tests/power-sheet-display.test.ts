import { describe, expect, it } from 'vitest';
import { resolvePowerSheetLevelDisplay } from '../src/utils/power-rendering';

describe('resolvePowerSheetLevelDisplay', () => {
  it('reads Cleanse rank from the current power level row, not root specials', () => {
    const system = {
      level: 6,
      specials: [{ key: 'cleanse', rank: 1 }],
      effect: 'stale L1',
      levels: {
        '1': { specials: [{ key: 'cleanse', rank: 1 }], effectText: 'Cleanse(1)' },
        '5': { specials: [{ key: 'cleanse', rank: 4 }], effectText: 'Cleanse(4)' },
        '6': { specials: [{ key: 'cleanse', rank: 5 }], effectText: 'Remove up to **Cleanse(5)**.' },
      },
    };
    const at6 = resolvePowerSheetLevelDisplay(system);
    expect(at6.definitionRank).toBe(6);
    expect(at6.specialsLabel).toMatch(/Cleanse\(5\)/i);
    expect(at6.effect).toContain('Cleanse(5)');

    const pending8 = resolvePowerSheetLevelDisplay(system, 8);
    // No row 8 → highest defined (6)
    expect(pending8.definitionRank).toBe(6);
  });

  it('scales Hex with the level row', () => {
    const system = {
      level: 2,
      specials: [{ key: 'hex', rank: 2 }],
      levels: {
        '2': { specials: [{ key: 'hex', rank: 2 }], effectText: 'Hex(2)' },
        '4': { specials: [{ key: 'hex', rank: 3 }], effectText: 'Hex(3)' },
      },
    };
    expect(resolvePowerSheetLevelDisplay(system, 2).specialsLabel).toMatch(/Hex\(2\)/i);
    expect(resolvePowerSheetLevelDisplay(system, 4).specialsLabel).toMatch(/Hex\(3\)/i);
  });
});
