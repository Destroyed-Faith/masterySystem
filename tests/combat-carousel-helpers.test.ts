import { describe, expect, it } from 'vitest';

import {
  carouselDispositionClass,
  findNextCombatantId,
} from '../src/ui/combat-carousel-helpers.js';

describe('carouselDispositionClass', () => {
  it('maps Foundry disposition to friendly / neutral / hostile', () => {
    expect(carouselDispositionClass(1)).toBe('disp-friendly');
    expect(carouselDispositionClass(0)).toBe('disp-neutral');
    expect(carouselDispositionClass(-1)).toBe('disp-hostile');
    expect(carouselDispositionClass(-2)).toBe('disp-hostile');
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
