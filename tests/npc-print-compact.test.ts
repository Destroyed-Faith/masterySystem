import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  buildNpcCompactPrintContext,
  formatNpcCompactAttackPlayLine,
} from '../src/sheets/npc-print.js';

const npcPrintCss = readFileSync(resolve('styles/npc-print.css'), 'utf8');

describe('NPC compact combat strip', () => {
  it('uses the dark Quick Play palette for full and compact NPC print', () => {
    expect(npcPrintCss).toContain('background: #141210');
    expect(npcPrintCss).toContain('color: #e6e1d6');
    expect(npcPrintCss).toContain('.mastery-npc-print.is-compact');
    expect(npcPrintCss).not.toMatch(/\.mastery-npc-print\.is-compact\s*\{[^}]*background:\s*#f4f1ea/s);
    expect(npcPrintCss).not.toMatch(/\.mastery-npc-print\s*\{[^}]*background:\s*#ffffff/s);
  });

  it('formats a ready-to-play attack line with keep, damage, range, and specials', () => {
    const line = formatNpcCompactAttackPlayLine(
      {
        name: 'Speer',
        attackDiceCount: 6,
        damageDiceCount: 4,
        npcAttacksPerRound: 2,
        npcRangeMeters: 3,
      } as any,
      { masteryRank: 3, castingTn: 24, index: 0 },
    );
    expect(line).toBe('Speer — 6k3 · 4d8 · Melee 3 m · ×2');
  });

  it('includes Spell TN and specials on spell attacks', () => {
    const line = formatNpcCompactAttackPlayLine(
      {
        name: 'Flammenstoß',
        attackDiceCount: 8,
        damageDiceCount: 6,
        npcIsSpell: true,
        npcAttacksPerRound: 1,
        specials: [{ special: 'ruin', specialValue: 2 }],
      } as any,
      { masteryRank: 3, castingTn: 24, index: 1 },
    );
    expect(line).toContain('Flammenstoß — 8k3 · 6d8');
    expect(line).toContain('Spell TN 24');
    expect(line.toLowerCase()).toContain('ruin');
    expect(line).not.toContain('×1');
  });

  it('builds one strip for a phase-less NPC with precalculated cores and attacks', () => {
    const actor = {
      type: 'npc',
      name: 'Wache',
      system: {
        mastery: { rank: 3 },
        creatureType: 'humanoid',
        combat: { evade: 12, armor: 2, speed: 6, initiative: 2 },
        health: { bars: [{ name: 'HP', current: 40, max: 40, penalty: 0 }] },
        npcBaseAttack: {
          name: 'Speer',
          attackDiceCount: 6,
          damageDiceCount: 4,
          npcAttacksPerRound: 2,
          npcRangeMeters: 3,
        },
        attackValues: [
          {
            name: 'Flammenstoß',
            attackDiceCount: 8,
            damageDiceCount: 6,
            npcIsSpell: true,
            npcAttacksPerRound: 1,
            specials: [{ special: 'ruin', specialValue: 2 }],
          },
        ],
        npcMovementSlots: 1,
      },
    };

    const ctx = buildNpcCompactPrintContext(actor) as any;
    expect(ctx.stripCount).toBe(1);
    expect(ctx.strips).toHaveLength(1);
    const strip = ctx.strips[0];
    expect(strip.title).toBe('Wache');
    expect(strip.hasPhases).toBe(false);
    expect(strip.cores.find((c: any) => c.label === 'Evade')?.value).toBe('12');
    expect(strip.cores.find((c: any) => c.label === 'Init')?.value).toBe('3d8 +2');
    expect(strip.cores.find((c: any) => c.label === 'Spell TN')?.value).toBe('24');
    expect(strip.cores.find((c: any) => c.label === 'ATK')?.value).toBe('3');
    expect(strip.attacks).toHaveLength(2);
    expect(strip.attacks[0].line).toBe('Speer — 6k3 · 4d8 · Melee 3 m · ×2');
    expect(strip.attacks[1].isSpell).toBe(true);
    expect(strip.attacks[1].line).toContain('Spell TN 24');
  });

  it('builds one strip per boss phase with phase-local combat values', () => {
    const actor = {
      type: 'npc',
      name: 'Boss',
      system: {
        mastery: { rank: 5 },
        creatureType: 'fiend',
        npcActivePhaseIndex: 0,
        phases: [
          {
            name: 'Erwachen',
            combat: { evade: 14, armor: 3, speed: 8, initiative: 0 },
            health: { bars: [{ name: 'HP', current: 80, max: 80, penalty: 0 }] },
            npcBaseAttack: {
              name: 'Klaue',
              attackDiceCount: 8,
              damageDiceCount: 6,
              npcAttacksPerRound: 2,
            },
            attackValues: [],
          },
          {
            name: 'Raserei',
            combat: { evade: 18, armor: 1, speed: 10, initiative: -2 },
            health: {
              bars: [
                { name: 'A', current: 30, max: 30, penalty: 0 },
                { name: 'B', current: 30, max: 30, penalty: 0 },
              ],
            },
            npcBaseAttack: {
              name: 'Reißzahn',
              attackDiceCount: 10,
              damageDiceCount: 8,
              npcAttacksPerRound: 3,
              npcSplitAttack: true,
            },
            attackValues: [
              {
                name: 'Höllenfeuer',
                attackDiceCount: 8,
                damageDiceCount: 8,
                npcIsSpell: true,
                npcAoeRadiusM: 4,
                npcAttacksPerRound: 1,
              },
            ],
          },
        ],
      },
    };

    const ctx = buildNpcCompactPrintContext(actor) as any;
    expect(ctx.stripCount).toBe(2);
    expect(ctx.strips[0].title).toBe('Boss — Erwachen');
    expect(ctx.strips[0].cores.find((c: any) => c.label === 'Evade')?.value).toBe('14');
    expect(ctx.strips[0].attacks[0].line).toContain('Klaue — 8k5 · 6d8');

    expect(ctx.strips[1].title).toBe('Boss — Raserei');
    expect(ctx.strips[1].cores.find((c: any) => c.label === 'Init')?.value).toBe('5d8 -2');
    expect(ctx.strips[1].attacks).toHaveLength(2);
    expect(ctx.strips[1].attacks[0].line).toContain('Split');
    expect(ctx.strips[1].attacks[0].line).toContain('×3');
    expect(ctx.strips[1].attacks[1].line).toContain('AoE');
  });
});
