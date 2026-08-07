import { describe, expect, it } from 'vitest';

import { buildNpcAttackRadialOptions } from '../src/radial-menu/options.js';

describe('NPC AoE radial options', () => {
  it('does not mark AoE when shape is none/empty even if radius leftover exists', () => {
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
    expect(opts[0].aoeShape).toBe('none');
    expect(opts[0].burstMeleeAoE).toBeFalsy();
    expect(opts[0].aoePlacementProfile).toBeUndefined();
  });

  it('does not mark AoE when shape is set but radius is 0', () => {
    const actor = {
      type: 'npc',
      system: {
        npcBaseAttack: {
          name: 'Hieb',
          attackDiceCount: 6,
          damageDiceCount: 4,
          npcAoeShape: 'radius',
          npcAoeRadiusM: 0,
          npcAttacksPerRound: 1,
        },
        attackValues: [],
      },
    };
    const opts = buildNpcAttackRadialOptions(actor as any);
    expect(opts[0].aoeShape).toBe('none');
    expect(opts[0].burstMeleeAoE).toBeFalsy();
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
  });

  it('marks ranged hostile-zone placement when Fern + radius AoE', () => {
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
  });
});
