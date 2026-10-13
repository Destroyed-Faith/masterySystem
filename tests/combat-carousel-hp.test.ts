import { describe, expect, it } from 'vitest';

import {
  buildCarouselHpSegments,
  carouselHpBarShortName,
  carouselHpPenaltyLabel,
  hideCarouselHpNumbers,
  hideCarouselNpcHpBars,
} from '../src/ui/combat-carousel-hp.js';

describe('hideCarouselHpNumbers / NPC bars', () => {
  it('hides all NPC Health Bars from players (any disposition)', () => {
    expect(hideCarouselHpNumbers('npc', -1)).toBe(true);
    expect(hideCarouselHpNumbers('npc', 0)).toBe(true);
    expect(hideCarouselHpNumbers('npc', 1)).toBe(true);
    expect(hideCarouselNpcHpBars('npc', false)).toBe(true);
  });

  it('keeps PC bars for players and NPC bars for the GM', () => {
    expect(hideCarouselHpNumbers('character', -1)).toBe(false);
    expect(hideCarouselNpcHpBars('character', false)).toBe(false);
    expect(hideCarouselNpcHpBars('npc', true)).toBe(false);
  });
});

describe('carousel HP scar overview', () => {
  it('prints the deducted pool percent under each bar', () => {
    expect(carouselHpPenaltyLabel(0)).toBe('0%');
    expect(carouselHpPenaltyLabel(1)).toBe('−10%');
    expect(carouselHpPenaltyLabel(2)).toBe('−20%');
    expect(carouselHpPenaltyLabel(3)).toBe('−40%');
    expect(carouselHpPenaltyLabel(4)).toBe('−50%');
    expect(carouselHpPenaltyLabel(5)).toBe('−100%');
  });

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
    expect(segs[0]).toMatchObject({
      shortName: 'H',
      penaltyLabel: '0%',
      hoverTitle: 'Healthy · 0% · Scarred',
      scarred: true,
      current: 0,
    });
    expect(segs[1].penaltyLabel).toBe('−10%');
    expect(segs[1].hoverTitle).toBe('Bruised · −10%');
    expect(segs[2].penaltyLabel).toBe('−20%');
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
