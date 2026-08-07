import { describe, expect, it } from 'vitest';

import { buildNpcAttackRadialOptions } from '../src/radial-menu/options.js';

describe('NPC AoE radial options', () => {
  it('treats radius ≥ 2 as AoE even when shape is empty/stale-off', () => {
    const actor = {
      type: 'npc',
      system: {
        npcBaseAttack: {
          name: 'Hieb',
          attackDiceCount: 6,
          damageDiceCount: 4,
          npcAoeShape: '',
          npcAoeRadiusM: 4,
          npcAttacksPerRound: 1,
        },
        attackValues: [],
      },
    };
    const opts = buildNpcAttackRadialOptions(actor as any);
    expect(opts).toHaveLength(1);
    expect(opts[0].aoeShape).toBe('radius');
    expect(opts[0].burstMeleeAoE).toBe(true);
    expect(opts[0].burstMeleeRadiusMeters).toBe(4);
  });

  it('does not mark AoE when radius is 0 or 1 even if shape leftover is radius', () => {
    for (const rad of [0, 1]) {
      const actor = {
        type: 'npc',
        system: {
          npcBaseAttack: {
            name: 'Hieb',
            attackDiceCount: 6,
            damageDiceCount: 4,
            npcAoeShape: 'radius',
            npcAoeRadiusM: rad,
            npcAttacksPerRound: 1,
          },
          attackValues: [],
        },
      };
      const opts = buildNpcAttackRadialOptions(actor as any);
      expect(opts[0].aoeShape).toBe('none');
      expect(opts[0].burstMeleeAoE).toBeFalsy();
      expect(opts[0].description).toMatch(/Melee/);
      expect(opts[0].description).not.toMatch(/AoE/);
    }
  });

  it('marks melee burst when radius AoE is configured', () => {
    const actor = {
      type: 'npc',
      system: {
        npcBaseAttack: {
          name: 'Stampfer',
          attackDiceCount: 8,
          damageDiceCount: 6,
          npcAoeShape: 'radius',
          npcAoeRadiusM: 3,
          npcAttacksPerRound: 1,
        },
        attackValues: [],
      },
    };
    const opts = buildNpcAttackRadialOptions(actor as any);
    expect(opts[0].burstMeleeAoE).toBe(true);
    expect(opts[0].burstMeleeRadiusMeters).toBe(3);
    expect(opts[0].aoePlacementProfile).toBeUndefined();
    expect(opts[0].description).toContain('AoE burst 3 m');
  });

  it('marks ranged hostile-zone placement when Range + radius AoE', () => {
    const actor = {
      type: 'npc',
      system: {
        npcBaseAttack: {
          name: 'Feuerball',
          attackDiceCount: 8,
          damageDiceCount: 6,
          npcRangeKind: 'ranged',
          npcRangeMeters: 24,
          npcRangeMinMeters: 12,
          npcAoeShape: 'radius',
          npcAoeRadiusM: 4,
          npcAttacksPerRound: 1,
        },
        attackValues: [],
      },
    };
    const opts = buildNpcAttackRadialOptions(actor as any);
    expect(opts[0].tags).toContain('ranged');
    expect(opts[0].aoeShape).toBe('radius');
    expect(opts[0].aoeRadiusMeters).toBe(4);
    expect(opts[0].aoePlacementProfile).toBe('hostile-zone');
    expect(opts[0].burstMeleeAoE).toBeFalsy();
    expect(opts[0].description).toContain('Range 12–24 m');
    expect(opts[0].description).toContain('AoE 4 m');
  });

  it('treats melee range kind as non-ranged even with leftover Range meters', () => {
    const actor = {
      type: 'npc',
      system: {
        npcBaseAttack: {
          name: 'Slash',
          attackDiceCount: 6,
          damageDiceCount: 4,
          npcRangeKind: 'melee',
          npcRangeMeters: 24,
          npcAoeShape: 'none',
          npcAoeRadiusM: 0,
          npcAttacksPerRound: 1,
        },
        attackValues: [],
      },
    };
    const opts = buildNpcAttackRadialOptions(actor as any);
    expect(opts[0].tags).toContain('melee');
    expect(opts[0].tags).not.toContain('ranged');
    expect(opts[0].aoeShape).toBe('none');
    expect(opts[0].burstMeleeAoE).toBeFalsy();
    expect(opts[0].description).toContain('Melee');
    expect(opts[0].description).not.toMatch(/AoE/);
  });
});
