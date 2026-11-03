import { describe, expect, it } from 'vitest';

import {
  carouselSideClass,
  findNextCombatantId,
  resolveCombatantDisplayName,
  resolveCurrentCombatantId,
} from '../src/ui/combat-carousel-helpers.js';

describe('carouselSideClass', () => {
  it('marks player characters blue and everyone else red', () => {
    expect(carouselSideClass('character')).toBe('disp-pc');
    expect(carouselSideClass('npc')).toBe('disp-npc');
    expect(carouselSideClass('summon')).toBe('disp-npc');
  });
});

describe('resolveCombatantDisplayName', () => {
  it('uses combatant.name once rename hooks have synced it', () => {
    expect(
      resolveCombatantDisplayName(
        { name: 'Synced', token: { name: 'Synced', actorLink: true }, actor: { name: 'Synced' } },
        { name: 'Synced', actorLink: true },
        { name: 'Synced' },
      ),
    ).toBe('Synced');
  });

  it('prefers a renamed token while combatant/actor still share the old name', () => {
    expect(
      resolveCombatantDisplayName(
        { name: 'Old', token: { name: 'Old', actorLink: true }, actor: { name: 'Old' } },
        { document: { name: 'Token Rename', actorLink: true } },
        { name: 'Old' },
      ),
    ).toBe('Token Rename');
  });

  it('keeps intentional token nicknames when combatant matches the token', () => {
    expect(
      resolveCombatantDisplayName(
        { name: 'Goblin A', token: { name: 'Goblin A', actorLink: true }, actor: { name: 'Goblin' } },
        { document: { name: 'Goblin A', actorLink: true } },
        { name: 'Goblin' },
      ),
    ).toBe('Goblin A');
  });

  it('falls back to live names when combatant name is empty', () => {
    expect(
      resolveCombatantDisplayName(
        { name: '', token: { name: 'Token', actorLink: true } },
        { document: { name: 'Token', actorLink: true } },
        { name: 'Actor' },
      ),
    ).toBe('Actor');
    expect(resolveCombatantDisplayName({ name: 'Combatant' }, null, null)).toBe('Combatant');
  });
});

describe('resolveCurrentCombatantId', () => {
  it('prefers combat.turns[combat.turn] over a stale combat.combatant', () => {
    expect(
      resolveCurrentCombatantId({
        turn: 1,
        turns: [{ id: 'prev' }, { id: 'current' }, { id: 'next' }],
        combatant: { id: 'prev' },
        current: { combatantId: 'prev' },
      }),
    ).toBe('current');
  });
});

describe('findNextCombatantId', () => {
  const rows = [
    { id: 'a', defeated: false },
    { id: 'b', defeated: true },
    { id: 'c', defeated: false },
  ];

  it('skips defeated combatants and stays off while turns are gated', () => {
    expect(findNextCombatantId(rows, 'a', false)).toBeNull();
    expect(findNextCombatantId(rows, 'a', true)).toBe('c');
    expect(findNextCombatantId(rows, 'c', true)).toBe('a');
  });

  it('returns null when only the current combatant is available', () => {
    expect(findNextCombatantId([{ id: 'solo', defeated: false }], 'solo', true)).toBeNull();
    expect(
      findNextCombatantId(
        [
          { id: 'a', defeated: false },
          { id: 'b', defeated: true },
        ],
        'a',
        true,
      ),
    ).toBeNull();
  });
});
