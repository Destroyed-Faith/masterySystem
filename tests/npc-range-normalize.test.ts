import { describe, expect, it } from 'vitest';

// Re-export through a tiny harness: normalizeNpcAttackRowForContext is module-private,
// so we exercise the same rules via radial options + a mirrored helper test of print range.

import { buildNpcAttackRadialOptions } from '../src/radial-menu/options.js';
import { buildNpcPrintContext } from '../src/sheets/npc-print.js';
import { sanitizeNpcAttackTargetingFields } from '../src/utils/npc-attack-model.js';

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
    expect(opts[0].range).toBeGreaterThanOrEqual(8);
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

  it('melee AoE persists as around-self (reach 0) and shows as burst', () => {
    const saved = sanitizeNpcAttackTargetingFields({
      name: 'Burst',
      npcRangeKind: 'melee',
      npcRangeMeters: 4,
      npcAoeRadiusM: 3,
    });
    expect(saved.npcRangeMeters).toBe(0);
    expect(saved.npcAoeShape).toBe('radius');

    const opts = buildNpcAttackRadialOptions({
      type: 'npc',
      system: {
        npcBaseAttack: {
          name: 'Burst',
          attackDiceCount: 6,
          damageDiceCount: 4,
          npcRangeKind: 'melee',
          npcRangeMeters: 0,
          npcAoeShape: 'radius',
          npcAoeRadiusM: 3,
          npcAttacksPerRound: 1,
        },
        attackValues: [],
      },
    } as any);
    expect(opts[0].burstMeleeAoE).toBe(true);
    expect(opts[0].burstMeleeRadiusMeters).toBe(3);
    expect(opts[0].meleeReachMeters).toBe(0);
  });

  it('print sheet shows Short/Long range text, not the range() helper list', () => {
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
    expect(row.rangeText).toMatch(/Short/i);
    expect(row.rangeText).toMatch(/Long/i);
    expect(row.rangeText).not.toContain('1,2,3');
    expect(row.aoe).toMatch(/2 m/);
  });

  it('radial description uses Short/Long wording, not Min–Max exclusion', () => {
    const opts = buildNpcAttackRadialOptions({
      type: 'npc',
      system: {
        npcBaseAttack: {
          name: 'Bolt',
          attackDiceCount: 6,
          damageDiceCount: 4,
          npcRangeKind: 'ranged',
          npcRangeMeters: 24,
          npcRangeMinMeters: 12,
          npcAttacksPerRound: 1,
        },
        attackValues: [],
      },
    } as any);
    expect(opts[0].description).toMatch(/Short ≤12/);
    expect(opts[0].description).toMatch(/Long ≤24/);
    expect(opts[0].description).not.toMatch(/12–24/);
  });
});
