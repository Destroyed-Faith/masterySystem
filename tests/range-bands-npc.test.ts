import { describe, expect, it } from 'vitest';

import {
  bandsFromNpcShortLong,
  classifyDistance,
  rangeTextFromBands,
} from '../src/utils/range-bands.js';
import { usesThreatenedRangedWeaponRules } from '../src/combat/threatened-ranged.js';
import { resolveNpcAttackTargeting } from '../src/utils/npc-attack-model.js';

describe('NPC Short/Long range bands', () => {
  it('maps Short/Long to Short/Medium/Long with Medium midway', () => {
    const bands = bandsFromNpcShortLong(12, 24);
    expect(bands).toEqual({ short: 12, medium: 18, long: 24 });
    expect(rangeTextFromBands(bands)).toBe('12/18/24m');
  });

  it('treats Short=0 as derive-from-Long (≈ long/4)', () => {
    const bands = bandsFromNpcShortLong(0, 32);
    expect(bands.long).toBe(32);
    expect(bands.short).toBe(8);
    expect(bands.medium).toBe(20);
  });

  it('allows close distances inside Short (gifted full pool, not a floor)', () => {
    const bands = bandsFromNpcShortLong(12, 24);
    expect(classifyDistance(1, bands)).toBe('short');
    expect(classifyDistance(2, bands)).toBe('short');
    expect(classifyDistance(12, bands)).toBe('short');
    expect(classifyDistance(18, bands)).toBe('medium');
    expect(classifyDistance(24, bands)).toBe('long');
    expect(classifyDistance(25, bands)).toBe('out-of-range');
  });

  it('resolveNpcAttackTargeting does not treat Short as exclusion for targeting metadata', () => {
    const t = resolveNpcAttackTargeting({
      npcRangeKind: 'ranged',
      npcRangeMinMeters: 12,
      npcRangeMeters: 24,
    } as any);
    expect(t.isRanged).toBe(true);
    expect(t.rangedMinM).toBe(12);
    expect(t.rangedMaxM).toBe(24);
    expect(t.rangeM).toBe(24);
  });
});

describe('Threatened Ranged for NPC martial ranged', () => {
  it('applies to npc-attack with ranged tag when not a spell', () => {
    expect(
      usesThreatenedRangedWeaponRules({}, {
        source: 'npc-attack',
        tags: ['attack', 'npc-attack', 'ranged'],
        npcIsSpell: false,
      } as any),
    ).toBe(true);
  });

  it('does not apply to NPC spell ranged attacks', () => {
    expect(
      usesThreatenedRangedWeaponRules({}, {
        source: 'npc-attack',
        tags: ['attack', 'npc-attack', 'ranged'],
        npcIsSpell: true,
      } as any),
    ).toBe(false);
  });

  it('does not apply to melee npc-attack', () => {
    expect(
      usesThreatenedRangedWeaponRules({}, {
        source: 'npc-attack',
        tags: ['attack', 'npc-attack', 'melee'],
      } as any),
    ).toBe(false);
  });
});
