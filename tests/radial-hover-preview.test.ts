import { describe, expect, it } from 'vitest';
import { resolveHoverPreviewMeters } from '../src/radial-menu/range-preview.js';
import type { RadialCombatOption } from '../src/radial-menu/types.js';

function opt(partial: Partial<RadialCombatOption>): RadialCombatOption {
  return {
    id: 't',
    name: 'Test',
    description: '',
    slot: 'attack',
    source: 'power',
    ...partial,
  };
}

describe('resolveHoverPreviewMeters', () => {
  it('prefers melee burst radius over weapon/cast range', () => {
    expect(
      resolveHoverPreviewMeters(
        opt({
          range: 2,
          burstMeleeAoE: true,
          burstMeleeRadiusMeters: 7,
          aoeShape: 'radius',
          aoeRadiusMeters: 7,
        }),
      ),
    ).toBe(7);
  });

  it('prefers ranged AoE radius over long cast range (e.g. 68 m → 7 m)', () => {
    expect(
      resolveHoverPreviewMeters(
        opt({
          range: 68,
          rangeMeters: 68,
          aoeShape: 'radius',
          aoeRadiusMeters: 7,
          aoePlacementProfile: 'hostile-zone',
        }),
      ),
    ).toBe(7);
  });

  it('falls back to range when no AoE footprint', () => {
    expect(resolveHoverPreviewMeters(opt({ range: 12 }))).toBe(12);
  });

  it('returns undefined for Self / zero with no AoE', () => {
    expect(resolveHoverPreviewMeters(opt({ range: 0 }))).toBeUndefined();
  });
});
