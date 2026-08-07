import { describe, expect, it } from 'vitest';

// Re-export through a tiny harness: normalizeNpcAttackRowForContext is module-private,
// so we exercise the same rules via radial options + a mirrored helper test of print range.

import { buildNpcAttackRadialOptions } from '../src/radial-menu/options.js';
import { buildNpcPrintContext } from '../src/sheets/npc-print.js';

describe('NPC Fernkampf / AoE sheet persistence rules', () => {
  it('Fern + low leftover meters still routes as ranged in radial', () => {
    const opts = buildNpcAttackRadialOptions({
      type: 'npc',
      system: {
        npcBaseAttack: {
          name: 'Bolt',
          attackDiceCount: 6,
          damageDiceCount: 4,
          npcRangeKind: 'ranged',
          npcRangeMeters: 2, // leftover melee value
          npcAttacksPerRound: 1,
        },
        attackValues: [],
      },
    } as any);
    expect(opts[0].tags).toContain('ranged');
    expect(opts[0].range).toBeGreaterThanOrEqual(12);
  });

  it('AoE radius 0 disables burst even if shape string is radius', () => {
    const opts = buildNpcAttackRadialOptions({
      type: 'npc',
      system: {
        npcBaseAttack: {
          name: 'Slash',
          attackDiceCount: 6,
          damageDiceCount: 4,
          npcRangeKind: 'melee',
          npcRangeMeters: 2,
          npcAoeShape: 'radius',
          npcAoeRadiusM: 0,
          npcAttacksPerRound: 1,
        },
        attackValues: [],
      },
    } as any);
    expect(opts[0].burstMeleeAoE).toBeFalsy();
    expect(opts[0].aoeShape).toBe('none');
  });

  it('print sheet shows Reach/Fern text, not the range() helper list', () => {
    const ctx = buildNpcPrintContext({
      type: 'npc',
      name: 'Dummy',
      system: {
        mastery: { rank: 2 },
        creatureType: 'humanoid',
        combat: { evade: 16, armor: 12, speed: 8 },
        health: { bars: [{ name: 'HP', current: 10, max: 10, penalty: 0 }] },
        npcBaseAttack: {
          name: 'Slash',
          attackDiceCount: 12,
          damageDiceCount: 8,
          npcRangeKind: 'ranged',
          npcRangeMeters: 24,
          npcRangeMinMeters: 12,
          npcAoeShape: 'radius',
          npcAoeRadiusM: 2,
          npcAttacksPerRound: 1,
        },
        attackValues: [],
      },
    } as any) as any;
    const row = ctx.pages[0].attacks[0];
    expect(row.rangeText).toMatch(/Fern/i);
    expect(row.rangeText).not.toContain('1,2,3');
    expect(row.aoe).toBe('Radius 2 m');
  });
});
