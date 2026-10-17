/**
 * Ghost Passive slots (item deleted, slot data left behind) must not block picks.
 */
import { describe, expect, it } from 'vitest';
import { getPassiveSlots, getSlottedPassiveIds } from '../src/powers/passives';

function makeActor(opts: {
  passives?: Record<string, { active?: boolean; passive?: { id: string; name: string } }>;
  items?: Array<{ id: string; type: string; name: string; system?: Record<string, unknown> }>;
  masteryRank?: number;
}) {
  const items = opts.items ?? [];
  return {
    id: 'actor1',
    name: 'Test',
    type: 'character',
    system: {
      mastery: { rank: opts.masteryRank ?? 5 },
      passives: opts.passives ?? {},
    },
    items: {
      [Symbol.iterator]: function* () {
        for (const it of items) yield it;
      },
      filter: (fn: (i: any) => boolean) => items.filter(fn),
      get: (id: string) => items.find((i) => i.id === id) ?? null,
      contents: items,
    },
  } as any;
}

describe('stale Passive slots after item delete', () => {
  it('treats slots whose power item is gone as empty', () => {
    const actor = makeActor({
      passives: {
        slot0: { active: true, passive: { id: 'gone-armor', name: 'Armor' } },
        slot1: { active: true, passive: { id: 'live-rest', name: 'Restoration' } },
      },
      items: [
        {
          id: 'live-rest',
          type: 'power',
          name: 'Passive: Restoration',
          system: { category: 'passive', templateId: 'passive-regeneration', level: 4 },
        },
      ],
    });
    const slots = getPassiveSlots(actor);
    expect(slots[0]?.passive).toBeNull();
    expect(slots[1]?.passive?.id).toBe('live-rest');
    expect(getSlottedPassiveIds(actor).has('gone-armor')).toBe(false);
    expect(getSlottedPassiveIds(actor).has('live-rest')).toBe(true);
  });
});
