import { describe, expect, it } from 'vitest';
import {
  CAROUSEL_MIN_HEIGHT,
  CAROUSEL_SIZE_STORAGE_KEY,
  CAROUSEL_Z_INDEX,
  applyCarouselUserSize,
  carouselDensityForHeight,
  clampCarouselHeight,
  clampCarouselWidth,
  isCompactCarouselViewport,
  readCarouselUserSize,
  writeCarouselUserSize,
} from '../src/ui/combat-carousel-layout.js';

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

describe('carousel user size', () => {
  it('stays behind Foundry application windows', () => {
    expect(CAROUSEL_Z_INDEX).toBeLessThan(100);
  });

  it('maps height to portrait / medium / rail density', () => {
    expect(carouselDensityForHeight(null)).toBe('full');
    expect(carouselDensityForHeight(220)).toBe('full');
    expect(carouselDensityForHeight(140)).toBe('medium');
    expect(carouselDensityForHeight(100)).toBe('medium');
    expect(carouselDensityForHeight(72)).toBe('rail');
    expect(carouselDensityForHeight(44)).toBe('rail');
  });

  it('clamps to the right-hand button rail', () => {
    expect(clampCarouselHeight(10)).toBe(CAROUSEL_MIN_HEIGHT);
    expect(clampCarouselHeight(400, 180)).toBe(180);
    expect(clampCarouselWidth(40, 800)).toBe(220);
  });

  it('persists and restores a dragged size', () => {
    const mem = new Map<string, string>();
    const store = {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => void mem.set(k, v),
      removeItem: (k: string) => void mem.delete(k),
    } as Storage;
    writeCarouselUserSize({ width: 640, height: 64 }, store);
    expect(readCarouselUserSize(store)).toEqual({ width: 640, height: 64 });
    expect(mem.get(CAROUSEL_SIZE_STORAGE_KEY)).toContain('64');
    writeCarouselUserSize({ width: null, height: null }, store);
    expect(readCarouselUserSize(store)).toEqual({ width: null, height: null });
  });

  it('applies rail classes when the user height is a button strip', () => {
    const inner = { classList: { toggle: (name: string, on: boolean) => void (inner.flags[name] = on) }, flags: {} as Record<string, boolean> };
    const root = {
      classList: { toggle: (name: string, on: boolean) => void (root.flags[name] = on) },
      flags: {} as Record<string, boolean>,
      style: {
        props: {} as Record<string, string>,
        setProperty(k: string, v: string) { this.props[k] = v; },
        removeProperty(k: string) { delete this.props[k]; },
      },
      querySelector: () => inner,
    };
    applyCarouselUserSize(root as any, { width: 400, height: 60 });
    expect(root.flags['is-user-sized']).toBe(true);
    expect(root.flags['is-user-rail']).toBe(true);
    expect(root.style.props['--ms-carousel-user-height']).toBe('60px');
  });
});
