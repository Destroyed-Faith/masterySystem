import { describe, expect, it } from 'vitest';

import {
  actorMatchesCombatant,
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
  it('uses combatant.name when everything already agrees', () => {
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

  it('prefers actor sheet rename over a stale combatant snapshot (linked)', () => {
    expect(
      resolveCombatantDisplayName(
        { name: 'Old', token: { name: 'Old', actorLink: true }, actor: { name: 'Sheet Rename' } },
        { document: { name: 'Old', actorLink: true } },
        { name: 'Sheet Rename' },
      ),
    ).toBe('Sheet Rename');
  });

  it('prefers live unlinked actor name when combatant+token still show the prototype', () => {
    expect(
      resolveCombatantDisplayName(
        {
          name: 'Aldren, Vaelon...',
          token: { name: 'Aldren, Vaelon...', actorLink: false },
          actor: { name: 'Bandit One' },
        },
        { document: { name: 'Aldren, Vaelon...', actorLink: false } },
        { name: 'Bandit One' },
      ),
    ).toBe('Bandit One');
  });

  it('prefers live name when actor and token were both renamed but combatant lagged', () => {
    expect(
      resolveCombatantDisplayName(
        { name: 'Old', token: { name: 'New', actorLink: true }, actor: { name: 'New' } },
        { document: { name: 'New', actorLink: true } },
        { name: 'New' },
      ),
    ).toBe('New');
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

describe('actorMatchesCombatant', () => {
  it('matches by token id when the sheet actor is token-bound (unlinked copies)', () => {
    const actor = { id: 'baseActor', token: { id: 'tok-b' } };
    expect(
      actorMatchesCombatant(actor, { id: 'c1', actorId: 'baseActor', tokenId: 'tok-a' }),
    ).toBe(false);
    expect(
      actorMatchesCombatant(actor, { id: 'c2', actorId: 'baseActor', tokenId: 'tok-b' }),
    ).toBe(true);
  });

  it('falls back to actorId when no token context exists', () => {
    const actor = { id: 'pc1' };
    expect(actorMatchesCombatant(actor, { id: 'c1', actorId: 'pc1', tokenId: 't1' })).toBe(true);
    expect(actorMatchesCombatant(actor, { id: 'c2', actorId: 'other', tokenId: 't2' })).toBe(false);
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
