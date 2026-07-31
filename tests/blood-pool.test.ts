import { describe, expect, it } from 'vitest';
import {
  didLoseHealthLevel,
  resolveBloodIntensity,
} from '../src/utils/blood-pool';

describe('resolveBloodIntensity', () => {
  it('returns puddle when a health level is lost', () => {
    expect(
      resolveBloodIntensity({ barDamage: 3, healthLevelLost: true })
    ).toBe('puddle');
  });

  it('returns splatter for HP chip without level loss', () => {
    expect(
      resolveBloodIntensity({ barDamage: 5, healthLevelLost: false })
    ).toBe('splatter');
  });

  it('returns null when no bar damage and no level loss', () => {
    expect(
      resolveBloodIntensity({ barDamage: 0, healthLevelLost: false })
    ).toBeNull();
  });

  it('honors explicit intensity override', () => {
    expect(
      resolveBloodIntensity({
        barDamage: 0,
        healthLevelLost: false,
        intensity: 'puddle',
      })
    ).toBe('puddle');
  });
});

describe('didLoseHealthLevel', () => {
  it('detects currentBar advance', () => {
    expect(
      didLoseHealthLevel({
        oldBarIndex: 0,
        newBarIndex: 1,
        barsBefore: [{ current: 4 }, { current: 10 }],
        barsAfter: [{ current: 0 }, { current: 8 }],
      })
    ).toBe(true);
  });

  it('detects a newly emptied bar even if index unchanged', () => {
    expect(
      didLoseHealthLevel({
        oldBarIndex: 1,
        newBarIndex: 1,
        barsBefore: [{ current: 0 }, { current: 2 }, { current: 10 }],
        barsAfter: [{ current: 0 }, { current: 0 }, { current: 10 }],
      })
    ).toBe(true);
  });

  it('is false for a simple chip inside the same bar', () => {
    expect(
      didLoseHealthLevel({
        oldBarIndex: 0,
        newBarIndex: 0,
        barsBefore: [{ current: 10 }, { current: 10 }],
        barsAfter: [{ current: 7 }, { current: 10 }],
      })
    ).toBe(false);
  });
});
