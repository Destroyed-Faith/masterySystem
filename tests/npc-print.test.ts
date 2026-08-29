import { describe, expect, it } from 'vitest';

import { buildNpcPrintContext } from '../src/sheets/npc-print.js';

describe('buildNpcPrintContext', () => {
  it('builds one page for a phase-less NPC', () => {
    const actor = {
      type: 'npc',
      name: 'Wache',
      system: {
        mastery: { rank: 3 },
        creatureType: 'humanoid',
        combat: { evade: 12, armor: 2, speed: 6 },
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

    const ctx = buildNpcPrintContext(actor) as any;
    expect(ctx.pageCount).toBe(1);
    expect(ctx.pages).toHaveLength(1);
    const page = ctx.pages[0];
    expect(page.name).toBe('Wache');
    expect(page.masteryRank).toBe(3);
    expect(page.specialRecovery).toBe(3);
    expect(page.specialCap).toBe(12);
    expect(page.castingTn).toBe(24);
    expect(page.creatureType).toBe('Humanoid');
    expect(page.hasPhases).toBe(false);
    expect(page.evade).toBe(12);
    expect(page.armor).toBe(2);
    expect(page.attackSlots).toBe(3);
    expect(page.attacks).toHaveLength(2);
    expect(page.attacks[0].name).toBe('Speer');
    expect(page.attacks[0].pool).toBe('6d8');
    expect(page.attacks[0].rangeText).toMatch(/Melee|Reach/i);
    expect(page.attacks[1].flags).toContain('Spell');
    expect(page.attacks[1].specials.toLowerCase()).toContain('ruin');
  });

  it('builds one page per boss phase with phase-local stats', () => {
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
            combat: { evade: 14, armor: 3, speed: 8 },
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
            combat: { evade: 18, armor: 1, speed: 10 },
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
                npcAoeShape: 'radius',
                npcAoeRadiusM: 4,
                npcAttacksPerRound: 1,
              },
            ],
          },
        ],
      },
    };

    const ctx = buildNpcPrintContext(actor) as any;
    expect(ctx.pageCount).toBe(2);
    expect(ctx.pages[0].phaseName).toBe('Erwachen');
    expect(ctx.pages[0].evade).toBe(14);
    expect(ctx.pages[0].attackSlots).toBe(2);
    expect(ctx.pages[0].attacks).toHaveLength(1);

    expect(ctx.pages[1].phaseName).toBe('Raserei');
    expect(ctx.pages[1].evade).toBe(18);
    expect(ctx.pages[1].health.hasMultipleBars).toBe(true);
    expect(ctx.pages[1].attackSlots).toBe(4);
    expect(ctx.pages[1].attacks).toHaveLength(2);
    expect(ctx.pages[1].attacks[0].flags).toContain('Split');
    expect(ctx.pages[1].attacks[1].aoe).toMatch(/4 m/);
    expect(ctx.pages[1].castingTn).toBe(40);
  });
});
