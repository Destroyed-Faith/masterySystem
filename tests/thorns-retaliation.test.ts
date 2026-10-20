/**
 * Active Buff: Thorns / Passive: Thorns — final HP damage retaliation.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { maybeApplyThornsRetaliation, resolveThornsDice } from '../src/combat/thorns';

vi.mock('../src/dice/damage-dialog.js', () => ({
  applyDamageToTarget: vi.fn(async () => ({
    rawDamage: 0,
    armorApplied: 0,
    reactionArmorApplied: 0,
    drPercent: 0,
    mitigatedDamage: 0,
    tempHPAbsorbed: 0,
    barDamage: 0,
    min8sUsed: false,
    breakdownLine: '',
    phased: false,
  })),
}));

describe('Thorns retaliation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).ChatMessage = { create: vi.fn(async () => undefined) };
    (globalThis as any).game = { user: { id: 'u1' } };
  });

  it('reads Active Buff thornsDice from maintained effect', () => {
    const actor: any = {
      id: 'def',
      name: 'Defender',
      system: { passives: {}, mastery: { rank: 2 } },
      items: [],
      effects: [
        {
          flags: {
            'mastery-system': {
              activeBuff: true,
              powerTemplateId: 'ab-thorns',
              effectiveLevel: 4,
              mechanics: { thornsDice: 4 },
            },
          },
        },
      ],
    };
    expect(resolveThornsDice(actor)).toBe(4);
  });

  it('caps reflected damage at final HP loss and skips self', async () => {
    const { applyDamageToTarget } = await import('../src/dice/damage-dialog.js');
    const defender: any = {
      id: 'def',
      name: 'Defender',
      system: { passives: {}, mastery: { rank: 2 } },
      items: [],
      effects: [
        {
          flags: {
            'mastery-system': {
              activeBuff: true,
              powerTemplateId: 'ab-thorns',
              mechanics: { thornsDice: 8 },
            },
          },
        },
      ],
    };
    const attacker: any = { id: 'atk', name: 'Attacker' };

    const self = await maybeApplyThornsRetaliation(defender, defender, 10);
    expect(self).toBeNull();

    const result = await maybeApplyThornsRetaliation(defender, attacker, 3);
    expect(result).not.toBeNull();
    expect(result!.dice).toBe(8);
    expect(result!.applied).toBeLessThanOrEqual(3);
    expect(applyDamageToTarget).toHaveBeenCalledOnce();
    const call = (applyDamageToTarget as any).mock.calls[0];
    expect(call[0]).toBe(attacker);
    expect(call[2]).toBe(defender);
    expect(call[1]).toBeLessThanOrEqual(3);
    expect(call[4]?.skipThorns).toBe(true);
  });

  it('does nothing when there is no Thorns source', async () => {
    const { applyDamageToTarget } = await import('../src/dice/damage-dialog.js');
    const result = await maybeApplyThornsRetaliation(
      { id: 'def', system: { passives: {} }, items: [], effects: [] },
      { id: 'atk' },
      12,
    );
    expect(result).toBeNull();
    expect(applyDamageToTarget).not.toHaveBeenCalled();
  });
});
