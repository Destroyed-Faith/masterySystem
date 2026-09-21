import { describe, expect, it } from 'vitest';

import {
  buildCarouselHpSegments,
  carouselHpBarShortName,
  hideCarouselHpNumbers,
} from '../src/ui/combat-carousel-hp.js';

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

describe('carousel HP scar overview', () => {
  it('shortens wound-level names for the legend', () => {
    expect(carouselHpBarShortName('Healthy')).toBe('H');
    expect(carouselHpBarShortName('Bruised')).toBe('B');
    expect(carouselHpBarShortName('Incapacitated')).toBe('Out');
  });

  it('marks empty Health Bars as Scarred and drops the mark once they have HP again', () => {
    const segs = buildCarouselHpSegments([
      { name: 'Healthy', current: 0, max: 16 },
      { name: 'Bruised', current: 8, max: 16 },
      { name: 'Injured', current: 16, max: 16 },
    ]);
    expect(segs).toHaveLength(3);
    expect(segs[0]).toMatchObject({ shortName: 'H', scarred: true, current: 0 });
    expect(segs[0].widthPct).toBeCloseTo(100 / 3);
    expect(segs[1].scarred).toBe(false);
    expect(segs[2].scarred).toBe(false);

    const healed = buildCarouselHpSegments([
      { name: 'Healthy', current: 16, max: 16 },
      { name: 'Bruised', current: 8, max: 16 },
    ]);
    expect(healed[0].scarred).toBe(false);
  });
});
