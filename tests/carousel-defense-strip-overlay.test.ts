/**
 * Closeout Fix 1: carousel DR overlay replaces only mechanics-derived DR.
 * Preserves NPC stat-block (max), manual, and Stone DR Boost.
 */
import { describe, expect, it, vi } from 'vitest';
import {
  overlayCarouselDefenseStrip,
  readNpcBlockDrPctFromCombat,
} from '../src/ui/combat-carousel-helpers.js';
import { peekSelfFacingDefenseMechanics } from '../src/utils/power-mechanics.js';

describe('overlayCarouselDefenseStrip', () => {
  it('preserves NPC stat-block DR via max when peek mechanics are lower', () => {
    const out = overlayCarouselDefenseStrip({
      actorType: 'npc',
      armorTotal: 5,
      evadeTotal: 3,
      damageReductionPct: 50,
      armorFromMechanics: 0,
      evadeFromMechanics: 0,
      damageReductionFromMechanics: 20,
      npcBlockDrPct: 50,
      manualDrPct: 0,
      stoneDrBonusPct: 0,
      peek: { armorPassive: 0, evadePassive: 0, damageReductionPct: 20 },
    });
    expect(out.drPct).toBe(50);
  });

  it('NPC: peek above block wins the max; manual + stone stay additive', () => {
    const out = overlayCarouselDefenseStrip({
      actorType: 'npc',
      armorTotal: 0,
      evadeTotal: 0,
      damageReductionPct: 55,
      armorFromMechanics: 0,
      evadeFromMechanics: 0,
      damageReductionFromMechanics: 20,
      npcBlockDrPct: 50,
      manualDrPct: 5,
      stoneDrBonusPct: 10,
      peek: { armorPassive: 0, evadePassive: 0, damageReductionPct: 60 },
    });
    // max(60, 50) + 5 + 10
    expect(out.drPct).toBe(75);
  });

  it('preserves manual DR when mechanics peek changes (character)', () => {
    const out = overlayCarouselDefenseStrip({
      actorType: 'character',
      armorTotal: 10,
      evadeTotal: 8,
      // stored = mech 20 + manual 15
      damageReductionPct: 35,
      armorFromMechanics: 2,
      evadeFromMechanics: 1,
      damageReductionFromMechanics: 20,
      manualDrPct: 15,
      stoneDrBonusPct: 0,
      peek: { armorPassive: 4, evadePassive: 3, damageReductionPct: 25 },
    });
    expect(out.drPct).toBe(40); // 35 - 20 + 25
    expect(out.armor).toBe(12); // 10 - 2 + 4
    expect(out.evade).toBe(10); // 8 - 1 + 3
  });

  it('adds live Active Buff Armor/Evade on top of sheet totals', () => {
    const out = overlayCarouselDefenseStrip({
      actorType: 'character',
      armorTotal: 10,
      evadeTotal: 8,
      damageReductionPct: 0,
      armorFromMechanics: 0,
      evadeFromMechanics: 0,
      damageReductionFromMechanics: 0,
      peek: {
        armorPassive: 0,
        evadePassive: 0,
        armorBuff: 6,
        evadeBuff: 2,
        damageReductionPct: 0,
      },
    });
    expect(out.armor).toBe(16);
    expect(out.evade).toBe(10);
    expect(out.drPct).toBe(0);
  });

  it('preserves Stone DR Boost when mechanics peek changes (character)', () => {
    const out = overlayCarouselDefenseStrip({
      actorType: 'character',
      armorTotal: 0,
      evadeTotal: 0,
      // stored = mech 10 + stone 25
      damageReductionPct: 35,
      armorFromMechanics: 0,
      evadeFromMechanics: 0,
      damageReductionFromMechanics: 10,
      manualDrPct: 0,
      stoneDrBonusPct: 25,
      peek: { armorPassive: 0, evadePassive: 0, damageReductionPct: 10 },
    });
    expect(out.drPct).toBe(35);
  });

  it('updates passive/mechanics DR from peek without dropping other sources', () => {
    const before = overlayCarouselDefenseStrip({
      actorType: 'character',
      armorTotal: 6,
      evadeTotal: 4,
      damageReductionPct: 30, // mech 10 + manual 5 + stone 15
      armorFromMechanics: 1,
      evadeFromMechanics: 0,
      damageReductionFromMechanics: 10,
      manualDrPct: 5,
      stoneDrBonusPct: 15,
      peek: { armorPassive: 1, evadePassive: 0, damageReductionPct: 10 },
    });
    expect(before.drPct).toBe(30);

    // Adjacency satisfied → mechanics DR rises to 20
    const after = overlayCarouselDefenseStrip({
      actorType: 'character',
      armorTotal: 6,
      evadeTotal: 4,
      damageReductionPct: 30,
      armorFromMechanics: 1,
      evadeFromMechanics: 0,
      damageReductionFromMechanics: 10,
      manualDrPct: 5,
      stoneDrBonusPct: 15,
      peek: { armorPassive: 1, evadePassive: 0, damageReductionPct: 20 },
    });
    expect(after.drPct).toBe(40); // 30 - 10 + 20
  });

  it('summon uses the same max(block, peek) + additive path as npc', () => {
    const out = overlayCarouselDefenseStrip({
      actorType: 'summon',
      armorTotal: 0,
      evadeTotal: 0,
      damageReductionPct: 40,
      armorFromMechanics: 0,
      evadeFromMechanics: 0,
      damageReductionFromMechanics: 0,
      npcBlockDrPct: 40,
      peek: { armorPassive: 0, evadePassive: 0, damageReductionPct: 0 },
    });
    expect(out.drPct).toBe(40);
  });
});

describe('readNpcBlockDrPctFromCombat', () => {
  it('reads Stat block / NPC DR % rows', () => {
    expect(
      readNpcBlockDrPctFromCombat({
        damageReductionRows: [{ label: 'Stat block', detail: 'NPC DR %', value: 35 }],
      }),
    ).toBe(35);
    expect(readNpcBlockDrPctFromCombat({ damageReductionRows: [] })).toBe(0);
  });
});

describe('peekSelfFacingDefenseMechanics adjacency', () => {
  it('token adjacency changes refresh mechanics peek; overlay keeps stone DR', async () => {
    const adj = await import('../src/utils/mechanics-adjacency.js');
    // No catalog templateId — baked levels keep conditionExpr (catalog DR has none).
    const power = {
      id: 'p-adj-dr',
      type: 'power',
      name: 'Damage Reduction',
      system: {
        category: 'passive',
        powerType: 'passive',
        rank: 4,
        levels: {
          '4': {
            mechanics: {
              damageReductionPct: 20,
              applyWhen: 'passive-slotted-active',
              conditionExpr: 'self.adjacentEnemies >= 1',
            },
          },
        },
      },
    };
    const actor: any = {
      id: 'hero-adj',
      type: 'character',
      items: [power],
      effects: [],
      system: {
        passives: {},
        health: { bars: [{ name: 'Healthy' }], currentBar: 0 },
        combat: { stoneDrBonusPct: 15, damageReductionPct: 15 },
        derived: { mechanicsBreakdown: { totals: { damageReductionPct: 0 } } },
        manual: { combat: {} },
      },
    };

    const g = globalThis as any;
    const prevCanvas = g.canvas;
    const prevGame = g.game;
    const selfTok = {
      id: 't-self',
      scene: { id: 'sc1' },
      actor,
      center: { x: 0, y: 0 },
      controlled: true,
    };
    try {
      g.canvas = {
        scene: { id: 'sc1' },
        grid: { distance: 2 },
        tokens: { placeables: [selfTok] },
      };
      g.game = { canvas: g.canvas };

      const countSpy = vi
        .spyOn(adj, 'countAdjacentHostileTokenCount')
        .mockReturnValue(0);
      const cold = peekSelfFacingDefenseMechanics(actor);
      expect(cold.damageReductionPct).toBe(0);

      countSpy.mockReturnValue(2);
      const hot = peekSelfFacingDefenseMechanics(actor);
      expect(hot.damageReductionPct).toBeGreaterThan(0);

      const stripCold = overlayCarouselDefenseStrip({
        actorType: 'character',
        armorTotal: 0,
        evadeTotal: 0,
        damageReductionPct: 15,
        armorFromMechanics: 0,
        evadeFromMechanics: 0,
        damageReductionFromMechanics: 0,
        stoneDrBonusPct: 15,
        peek: cold,
      });
      expect(stripCold.drPct).toBe(15);

      const stripHot = overlayCarouselDefenseStrip({
        actorType: 'character',
        armorTotal: 0,
        evadeTotal: 0,
        damageReductionPct: 15,
        armorFromMechanics: 0,
        evadeFromMechanics: 0,
        damageReductionFromMechanics: 0,
        stoneDrBonusPct: 15,
        peek: hot,
      });
      expect(stripHot.drPct).toBe(15 + hot.damageReductionPct);
    } finally {
      g.canvas = prevCanvas;
      g.game = prevGame;
      vi.restoreAllMocks();
    }
  });
});
