import { beforeEach, describe, expect, it, vi } from 'vitest';

const masteryRoll = vi.fn(async () => undefined);

vi.mock('../src/dice/roll-handler.js', () => ({
  masteryRoll: (...args: unknown[]) => masteryRoll(...args),
}));

import {
  executeFaithFractureReroll,
  faithRerollButtonCopy,
  faithRerollNote,
} from '../src/chat/faith-fracture-reroll.js';

function recipeMessage() {
  const flags: Record<string, any> = {
    canReroll: true,
    rollRecipe: {
      numDice: 2,
      keepDice: 1,
      skill: 'Melee',
      tn: 4,
      label: 'Strike',
      flavor: 'base',
      actorId: 'npc-1',
    },
  };
  return {
    id: 'msg-1',
    flags: { 'mastery-system': flags },
    setFlag: vi.fn(async (_scope: string, key: string, value: unknown) => {
      flags[key] = value;
    }),
    unsetFlag: vi.fn(async () => undefined),
  };
}

describe('GM faith reroll', () => {
  beforeEach(() => {
    masteryRoll.mockClear();
    delete (globalThis as any).game;
  });

  it('rerolls without spending a character when the GM presses the button', async () => {
    const message = recipeMessage();
    const actorGet = vi.fn();
    (globalThis as any).game = {
      user: { id: 'gm', isGM: true },
      users: { get: (id: string) => (id === 'gm' ? { id: 'gm', isGM: true, character: null } : null) },
      actors: { get: actorGet },
      messages: { get: () => message },
    };

    const res = await executeFaithFractureReroll('msg-1', '', 'gm', { gmFree: true });

    expect(res).toEqual({ ok: true });
    expect(actorGet).not.toHaveBeenCalled();
    expect(message.setFlag).toHaveBeenCalledWith('mastery-system', 'faithRerollConsumed', true);
    expect(masteryRoll).toHaveBeenCalledWith(
      expect.objectContaining({
        isRerollResult: true,
        flavor: `base${faithRerollNote({ spenderName: 'GM', free: true })}`,
      }),
    );
    expect(String(masteryRoll.mock.calls[0][0].flavor)).toContain('the GM rerolled this roll');
    expect(String(masteryRoll.mock.calls[0][0].flavor)).not.toContain('spent 1 Reroll Point');
  });

  it('still refuses a free reroll from a player', async () => {
    const message = recipeMessage();
    (globalThis as any).game = {
      user: { id: 'gm', isGM: true },
      users: { get: () => ({ id: 'player', isGM: false }) },
      actors: { get: vi.fn() },
      messages: { get: () => message },
    };

    const res = await executeFaithFractureReroll('msg-1', 'hero', 'player', { gmFree: true });

    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/Only the GM/);
    expect(masteryRoll).not.toHaveBeenCalled();
  });

  it('still spends the playing character when a player requests the reroll', async () => {
    const message = recipeMessage();
    const update = vi.fn(async () => undefined);
    const hero = {
      id: 'hero',
      name: 'Oda',
      system: { faithFractures: { current: 2, maximum: 4 } },
      testUserPermission: () => true,
      update,
    };
    (globalThis as any).game = {
      user: { id: 'gm', isGM: true },
      users: { get: () => ({ id: 'player', isGM: false }) },
      actors: { get: (id: string) => (id === 'hero' ? hero : null) },
      messages: { get: () => message },
    };

    const res = await executeFaithFractureReroll('msg-1', 'hero', 'player');

    expect(res).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({ 'system.faithFractures.current': 1 });
    expect(String(masteryRoll.mock.calls[0][0].flavor)).toContain('Oda spent 1 Reroll Point');
  });

  it('labels the chat button as a free GM reroll and a paid player reroll', () => {
    expect(faithRerollButtonCopy(true, false).label).toBe('Reroll');
    expect(faithRerollButtonCopy(true, false).title).not.toMatch(/1 Reroll Point/);
    expect(faithRerollButtonCopy(false, true).label).toBe('Reroll (1 Reroll Point)');
    expect(faithRerollButtonCopy(false, false).label).toBe('Force GM Reroll (1 Reroll Point)');
  });
});
