import { describe, expect, it } from 'vitest';
import { formatPowerSpecialLabel, renderSpecials } from '../src/utils/power-rendering';

describe('power special table labels', () => {
  it('prints canonical rank as Ruin(3), not a bare key', () => {
    expect(formatPowerSpecialLabel({ key: 'ruin', rank: 3 })).toBe('Ruin(3)');
    expect(formatPowerSpecialLabel({ key: 'root', rank: 2 })).toBe('Root(2)');
  });

  it('still reads the legacy value field', () => {
    expect(formatPowerSpecialLabel({ key: 'ruin', value: 5 })).toBe('Ruin(5)');
  });

  it('binds the SPECIAL placeholder to the chosen special', () => {
    expect(formatPowerSpecialLabel({ key: 'SPECIAL', rank: 8 }, 'ruin')).toBe('Ruin(8)');
  });

  it('capitalizes names and shows (X) when a valued special has no number', () => {
    expect(formatPowerSpecialLabel({ key: 'ruin' })).toBe('Ruin(X)');
    expect(formatPowerSpecialLabel({ key: 'prone' })).toBe('Prone');
  });

  it('joins a progression row', () => {
    expect(
      renderSpecials([
        { key: 'ruin', rank: 2 },
        { key: 'root', rank: 1 },
      ]),
    ).toBe('Ruin(2), Root(1)');
  });
});
