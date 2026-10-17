import { describe, expect, it } from 'vitest';
import { buildHealingBarModel, healingHandleLabel, resolveHealingBarActor } from '../src/system/healing-bar';

const restoration = { poolMax: 2, remaining: 1, scarred: 2, blocked: false };

describe('Healing bar model', () => {
  it('shows a prepared heal and the restoration pool on the grip', () => {
    const model = buildHealingBarModel({
      resolveStatus: 'ready',
      resolveDetail: 'Rank 2 · 8d8 within 4 m. Use it this Round.',
      dice: 8,
      inCombat: true,
      restoration,
    });
    expect(model.show).toBe(true);
    expect(model.resolveCanUse).toBe(true);
    expect(model.restorationCanUse).toBe(true);
    expect(model.handleLabel).toBe('Heal 8d8 · Rest 1/2');
  });

  it('keeps Use off when Healing is not prepared and Restoration has no scar', () => {
    const model = buildHealingBarModel({
      resolveStatus: 'idle',
      resolveDetail: 'Not prepared.',
      dice: 0,
      inCombat: true,
      restoration: { poolMax: 2, remaining: 2, scarred: 0, blocked: false },
    });
    expect(model.resolveCanUse).toBe(false);
    expect(model.restorationCanUse).toBe(false);
    expect(model.handleLabel).toBe('Heal — · Rest 2/2');
  });

  it('hides outside combat when nothing is prepared and there is no Restoration pool', () => {
    const model = buildHealingBarModel({
      resolveStatus: 'idle',
      resolveDetail: '',
      dice: 0,
      inCombat: false,
      restoration: { poolMax: 0, remaining: 0, scarred: 0, blocked: false },
    });
    expect(model.show).toBe(false);
    expect(healingHandleLabel({
      resolveStatus: 'spent',
      dice: 0,
      inCombat: true,
      poolMax: 0,
      remaining: 0,
    })).toBe('Heal used');
  });

  it('uses the player character, and the GM selected character', () => {
    const mine = { id: 'pc', type: 'character', isOwner: true };
    const other = { id: 'npc', type: 'npc' };
    const player = { isGM: false, character: mine };
    expect(resolveHealingBarActor(player, [other, mine], other)).toBe(mine);
    const gm = { isGM: true, character: null };
    expect(resolveHealingBarActor(gm, [], { type: 'character', id: 'oda' })?.id).toBe('oda');
    expect(resolveHealingBarActor(gm, [], other)).toBeNull();
  });
});
