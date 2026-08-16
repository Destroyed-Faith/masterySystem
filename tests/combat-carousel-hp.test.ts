import { describe, expect, it } from 'vitest';

import { hideCarouselHpNumbers } from '../src/ui/combat-carousel-hp.js';

describe('hideCarouselHpNumbers', () => {
  it('hides numbers on hostile and secret NPCs', () => {
    expect(hideCarouselHpNumbers('npc', -1)).toBe(true);
    expect(hideCarouselHpNumbers('npc', -2)).toBe(true);
  });

  it('keeps numbers on PCs and friendly or neutral NPCs', () => {
    expect(hideCarouselHpNumbers('character', -1)).toBe(false);
    expect(hideCarouselHpNumbers('npc', 1)).toBe(false);
    expect(hideCarouselHpNumbers('npc', 0)).toBe(false);
  });
});
