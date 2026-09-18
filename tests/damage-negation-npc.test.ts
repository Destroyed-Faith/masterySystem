import { describe, expect, it, vi } from 'vitest';

import {
  damageNegationHalfPoolCap,
  getNpcDamageNegationDice,
  promptDamageNegationSpend,
  resolveNpcActiveCombatBlock,
} from '../src/combat/damage-negation.js';

describe('NPC Damage Negation', () => {
  it('half-pool cap is floor(dice/2)', () => {
    expect(damageNegationHalfPoolCap(4)).toBe(2);
    expect(damageNegationHalfPoolCap(5)).toBe(2);
    expect(damageNegationHalfPoolCap(1)).toBe(0);
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

  it('auto-applies NPC DN without a dialog, capped at half pool', async () => {
    const DialogSpy = vi.fn();
    (globalThis as any).Dialog = DialogSpy;

    const spend = await promptDamageNegationSpend(
      { type: 'npc', system: { combat: { damageNegation: 2 } }, name: 'Golem' },
      { totalDice: 6, attacker: { name: 'Hero' } },
    );
    expect(spend.diceRemoved).toBe(2);
    expect(spend.note).toMatch(/NPC auto/);
    expect(DialogSpy).not.toHaveBeenCalled();

    const capped = await promptDamageNegationSpend(
      { type: 'npc', system: { combat: { damageNegation: 10 } }, name: 'Golem' },
      { totalDice: 4 },
    );
    expect(capped.diceRemoved).toBe(2);
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
