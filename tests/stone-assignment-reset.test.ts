import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  receiptPowerTiers,
  tempHpFromStoneReceipt,
  revertStoneAssignmentEffects,
} from '../src/stones/stone-assignment-reset.js';
import { isHostileNpcStoneTarget } from '../src/stones/stone-combat-effects.js';

describe('stone assignment reset — receipt math', () => {
  it('computes Temp HP from a vitality.tempHp receipt and removes it on revert', async () => {
    // Rank costs 1+2+4 = 7 stones → Rank 3 → 80 Temp HP
    const receipt = [{ accKey: 'vitality.tempHp:vitality:0', value: [1, 2, 3, 4, 5, 6, 7] }];
    expect(receiptPowerTiers(receipt).get('vitality.tempHp')).toBe(3);
    expect(tempHpFromStoneReceipt(receipt)).toBe(80);

    const updates: Record<string, unknown>[] = [];
    const flags: Record<string, unknown> = {
      msTempHpStoneUsed: { combatId: 'cmb1', used: true },
    };
    const actor = {
      id: 'a1',
      name: 'Hero',
      system: { health: { tempHP: 95 } },
      flags: { 'mastery-system': flags },
      getFlag: (_s: string, k: string) => flags[k],
      setFlag: async (_s: string, k: string, v: unknown) => {
        flags[k] = v;
      },
      unsetFlag: async (_s: string, k: string) => {
        delete flags[k];
      },
      update: async (patch: Record<string, unknown>) => {
        updates.push(patch);
        if (patch['system.health.tempHP'] != null) {
          actor.system.health.tempHP = Number(patch['system.health.tempHP']);
        }
      },
    };
    const combatant = {
      unsetFlag: vi.fn(async () => undefined),
    };
    const combat = { id: 'cmb1', round: 1, combatants: [] };

    const result = await revertStoneAssignmentEffects({
      actor,
      combat,
      combatant,
      receipt,
    });
    expect(result.tempHpRemoved).toBe(80);
    expect(actor.system.health.tempHP).toBe(15);
    expect(flags.msTempHpStoneUsed).toBeUndefined();
  });
});

describe('isHostileNpcStoneTarget', () => {
  beforeEach(() => {
    (globalThis as any).CONST = {
      TOKEN_DISPOSITIONS: { HOSTILE: -1, NEUTRAL: 0, FRIENDLY: 1, SECRET: -2 },
    };
    (globalThis as any).game = { users: { get: () => null } };
  });

  it('PC caster rejects other PCs and player-owned summons', () => {
    const caster = { id: 'pc1', type: 'character', hasPlayerOwner: true };
    const allyPc = { id: 'pc2', type: 'character', hasPlayerOwner: true };
    const summon = { id: 'sum1', type: 'npc', hasPlayerOwner: true };
    expect(isHostileNpcStoneTarget(caster, allyPc)).toBe(false);
    expect(isHostileNpcStoneTarget(caster, summon)).toBe(false);
  });

  it('PC caster accepts hostile NPCs (including Friendly-disposition Dummy)', () => {
    const caster = {
      id: 'pc1',
      type: 'character',
      hasPlayerOwner: true,
      prototypeToken: { disposition: 1 },
    };
    const enemy = {
      id: 'npc1',
      type: 'npc',
      hasPlayerOwner: false,
      prototypeToken: { disposition: -1 },
    };
    const dummy = {
      id: 'dummy1',
      type: 'npc',
      hasPlayerOwner: false,
      prototypeToken: { disposition: 1 },
    };
    expect(isHostileNpcStoneTarget(caster, enemy)).toBe(true);
    expect(isHostileNpcStoneTarget(caster, dummy)).toBe(true);
  });

  it('NPC caster may still target opposing PCs', () => {
    const npc = {
      id: 'npc1',
      type: 'npc',
      hasPlayerOwner: false,
      prototypeToken: { disposition: -1 },
    };
    const pc = {
      id: 'pc1',
      type: 'character',
      hasPlayerOwner: true,
      prototypeToken: { disposition: 1 },
    };
    expect(isHostileNpcStoneTarget(npc, pc)).toBe(true);
  });
});
