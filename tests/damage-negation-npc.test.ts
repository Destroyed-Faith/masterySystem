import { describe, expect, it, vi } from 'vitest';

import {
  damageNegationHalfPoolCap,
  damageNegationSpendCap,
  getNpcDamageNegationDice,
  promptDamageNegationSpend,
  resolveNpcActiveCombatBlock,
} from '../src/combat/damage-negation.js';

describe('NPC Damage Negation', () => {
  it('R-01: deprecated half-pool helper returns full dice count', () => {
    expect(damageNegationHalfPoolCap(4)).toBe(4);
    expect(damageNegationHalfPoolCap(5)).toBe(5);
    expect(damageNegationHalfPoolCap(1)).toBe(1);
  });

  it('spend cap is min(dice, available) with no half-pool limit', () => {
    expect(damageNegationSpendCap(8, 16)).toBe(8);
    expect(damageNegationSpendCap(8, 3)).toBe(3);
    expect(damageNegationSpendCap(1, 1)).toBe(1);
    expect(damageNegationSpendCap(7, 7)).toBe(7);
  });

  it('reads root combat.damageNegation for plain NPCs', () => {
    const actor = {
      type: 'npc',
      system: { combat: { damageNegation: 2, armor: 4 } },
    };
    expect(getNpcDamageNegationDice(actor)).toBe(2);
    expect(resolveNpcActiveCombatBlock(actor).damageNegation).toBe(2);
  });

  it('reads active phase combat for boss NPCs', () => {
    const actor = {
      type: 'npc',
      system: {
        npcActivePhaseIndex: 1,
        combat: { damageNegation: 1 },
        phases: [
          { combat: { damageNegation: 0 } },
          { combat: { damageNegation: 3 } },
        ],
      },
    };
    expect(getNpcDamageNegationDice(actor)).toBe(3);
  });

  it('ignores characters (Passive reserve path)', () => {
    expect(
      getNpcDamageNegationDice({
        type: 'character',
        system: { combat: { damageNegation: 9 } },
      }),
    ).toBe(0);
  });

  it('auto-applies NPC DN without a dialog; full pool may be removed', async () => {
    const DialogSpy = vi.fn();
    (globalThis as any).Dialog = DialogSpy;

    const spend = await promptDamageNegationSpend(
      { type: 'npc', system: { combat: { damageNegation: 2 } }, name: 'Golem' },
      { totalDice: 6, attacker: { name: 'Hero' } },
    );
    expect(spend.diceRemoved).toBe(2);
    expect(spend.note).toMatch(/NPC auto/);
    expect(DialogSpy).not.toHaveBeenCalled();

    const full = await promptDamageNegationSpend(
      { type: 'npc', system: { combat: { damageNegation: 10 } }, name: 'Golem' },
      { totalDice: 4 },
    );
    expect(full.diceRemoved).toBe(4);
  });

  it('does nothing when NPC DN is 0', async () => {
    (globalThis as any).Dialog = vi.fn();
    const spend = await promptDamageNegationSpend(
      { type: 'npc', system: { combat: { damageNegation: 0 } } },
      { totalDice: 6 },
    );
    expect(spend.diceRemoved).toBe(0);
  });
});
