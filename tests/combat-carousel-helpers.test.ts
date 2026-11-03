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
  it('prefers the live token name over a stale combatant snapshot', () => {
    expect(
      resolveCombatantDisplayName(
        { name: 'Old Name', token: { name: 'Also Old' }, actor: { name: 'Actor' } },
        { name: 'Renamed Token' },
        { name: 'Actor' },
      ),
    ).toBe('Renamed Token');
  });

  it('falls back to combatant then actor when no token name is present', () => {
    expect(resolveCombatantDisplayName({ name: 'Combatant' }, null, { name: 'Actor' })).toBe(
      'Combatant',
    );
    expect(resolveCombatantDisplayName({}, null, { name: 'Actor' })).toBe('Actor');
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
