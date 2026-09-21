import { describe, expect, it } from 'vitest';
import {
  currentRegenerationValue,
  listSelectablePlayerActors,
  nextRegenerationValue,
} from '../src/stones/ally-stone-target';

describe('ally player picker', () => {
  it('lists other player characters before self and skips NPCs', () => {
    const rows = listSelectablePlayerActors(
      [
        { id: 'npc1', type: 'npc', name: 'Goblin' },
        { id: 'p2', type: 'character', name: 'Mira' },
        { id: 'p1', type: 'character', name: 'Ada' },
        { actor: { id: 'p2', type: 'character', name: 'Mira Dup' } },
      ],
      'p1',
    );
    expect(rows.map((r) => `${r.id}:${r.isSelf}`)).toEqual(['p2:false', 'p1:true']);
  });

  it('keeps the stronger Regeneration value', () => {
    expect(nextRegenerationValue(4, 8)).toBe(8);
    expect(nextRegenerationValue(32, 16)).toBe(32);
    expect(nextRegenerationValue(0, 8)).toBe(8);
  });

  it('reads the current Regeneration rank', () => {
    expect(
      currentRegenerationValue({
        system: { statusEffects: [{ id: 'regeneration', name: 'Regeneration', value: 16 }] },
      }),
    ).toBe(16);
    expect(currentRegenerationValue({ system: { statusEffects: [] } })).toBe(0);
  });
});
