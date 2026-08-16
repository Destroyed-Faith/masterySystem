import { describe, expect, it } from 'vitest';
import { isCompactCarouselViewport } from '../src/ui/combat-carousel-layout.js';

describe('isCompactCarouselViewport', () => {
  it('stays full-size on a normal desktop window', () => {
    expect(isCompactCarouselViewport(1920, 1080)).toBe(false);
    expect(isCompactCarouselViewport(1470, 900)).toBe(false);
  });

  it('compacts when Foundry height or width is below the usable floor', () => {
    expect(isCompactCarouselViewport(1470, 752)).toBe(true);
    expect(isCompactCarouselViewport(915, 752)).toBe(true);
    expect(isCompactCarouselViewport(1023, 900)).toBe(true);
    expect(isCompactCarouselViewport(1200, 799)).toBe(true);
  });
});
