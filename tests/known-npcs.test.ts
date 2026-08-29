import { describe, expect, it } from 'vitest';
import {
  clampKnownNpcsBarPosition,
  collectReleasedKnownNpcs,
  DEFAULT_KNOWN_NPCS_BAR_POSITION,
  listNpcsForGmDialog,
  sanitizeKnownNpcIds,
  sanitizeKnownNpcsBarPosition,
  toKnownNpcView,
} from '../src/system/known-npcs';

describe('known NPC roster', () => {
  it('dedupes and drops empty ids', () => {
    expect(sanitizeKnownNpcIds({ ids: ['a', '', 'a', 'b', null] })).toEqual(['a', 'b']);
    expect(sanitizeKnownNpcIds(['x', 'x'])).toEqual(['x']);
  });

  it('keeps GM order and skips missing or non-NPC actors', () => {
    const actors = [
      { id: 'n1', type: 'npc', name: 'Mira', img: 'mira.png', system: { bio: { faction: 'Crown' } } },
      { id: 'pc', type: 'character', name: 'Ada', img: 'ada.png' },
      { id: 'n2', type: 'npc', name: 'Rook', img: 'rook.png', system: {} },
    ];
    expect(collectReleasedKnownNpcs(actors, ['n2', 'missing', 'pc', 'n1'])).toEqual([
      { actorId: 'n2', name: 'Rook', img: 'rook.png', faction: '' },
      { actorId: 'n1', name: 'Mira', img: 'mira.png', faction: 'Crown' },
    ]);
  });

  it('lists released NPCs first for the GM, then hidden ones by name', () => {
    const actors = [
      { id: 'z', type: 'npc', name: 'Zed', img: 'z.png' },
      { id: 'a', type: 'npc', name: 'Ada', img: 'a.png' },
      { id: 'm', type: 'npc', name: 'Mira', img: 'm.png' },
    ];
    const rows = listNpcsForGmDialog(actors, ['m', 'z']);
    expect(rows.map((r) => `${r.actorId}:${r.released}`)).toEqual(['m:true', 'z:true', 'a:false']);
  });

  it('ignores summons', () => {
    expect(
      toKnownNpcView({ id: 's', type: 'summon', name: 'Wolf', img: 'w.png' }),
    ).toBeNull();
  });
});

describe('known NPC bar position', () => {
  it('falls back to the default when the stored value is junk', () => {
    expect(sanitizeKnownNpcsBarPosition(null)).toEqual(DEFAULT_KNOWN_NPCS_BAR_POSITION);
    expect(sanitizeKnownNpcsBarPosition({ x: 'nope', y: 12 })).toEqual(DEFAULT_KNOWN_NPCS_BAR_POSITION);
    expect(sanitizeKnownNpcsBarPosition({ x: 140.8, y: 33.2 })).toEqual({ x: 141, y: 33 });
  });

  it('keeps the bar inside the viewport', () => {
    expect(
      clampKnownNpcsBarPosition({ x: -40, y: 9999 }, { width: 800, height: 600 }, { width: 180, height: 80 }),
    ).toEqual({ x: 8, y: 512 });
  });
});
