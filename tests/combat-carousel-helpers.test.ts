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
  it('linked: prefers actor sheet name over a stale token/combatant snapshot', () => {
    expect(
      resolveCombatantDisplayName(
        { name: 'Old', token: { name: 'Old', actorLink: true }, actor: { name: 'Renamed' } },
        { name: 'Old', actorLink: true },
        { name: 'Renamed' },
      ),
    ).toBe('Renamed');
  });

  it('unlinked: prefers live token name over actor/combatant snapshot', () => {
    expect(
      resolveCombatantDisplayName(
        { name: 'Old', token: { name: 'Old', actorLink: false }, actor: { name: 'Actor' } },
        { name: 'Renamed Token', document: { name: 'Renamed Token', actorLink: false } },
        { name: 'Actor' },
      ),
    ).toBe('Renamed Token');
  });

  it('falls back through the linked chain when some names are missing', () => {
    expect(resolveCombatantDisplayName({ name: 'Combatant' }, null, { name: 'Actor' })).toBe(
      'Actor',
    );
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
