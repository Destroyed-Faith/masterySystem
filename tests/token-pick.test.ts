import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { pickTokenAtPoint } from '../src/utils/token-pick.js';

function makeToken(opts: {
  id: string;
  name: string;
  x: number;
  y: number;
  w?: number;
  h?: number;
  zIndex?: number;
}) {
  const w = opts.w ?? 100;
  const h = opts.h ?? 100;
  const left = opts.x - w / 2;
  const top = opts.y - h / 2;
  return {
    id: opts.id,
    name: opts.name,
    w,
    h,
    zIndex: opts.zIndex ?? 0,
    center: { x: opts.x, y: opts.y },
    bounds: {
      contains(px: number, py: number) {
        return px >= left && px <= left + w && py >= top && py <= top + h;
      },
    },
  };
}

describe('pickTokenAtPoint', () => {
  const originalCanvas = (globalThis as any).canvas;

  beforeEach(() => {
    (globalThis as any).canvas = { tokens: { placeables: [] } };
  });

  afterEach(() => {
    (globalThis as any).canvas = originalCanvas;
  });

  it('prefers the token whose center is closer when bounds overlap (not placeables order)', () => {
    const back = makeToken({ id: 'alaris', name: 'Alaris', x: 100, y: 100, zIndex: 1 });
    const front = makeToken({ id: 'sjossfur', name: 'Sjossfur', x: 140, y: 100, zIndex: 2 });
    (globalThis as any).canvas.tokens.placeables = [back, front];

    // Click nearer to Sjossfur's center; both bounds contain the point.
    const picked = pickTokenAtPoint(135, 100);
    expect(picked?.id).toBe('sjossfur');
  });

  it('does not return the first placeables hit when a later overlapping token is closer', () => {
    const first = makeToken({ id: 'a', name: 'A', x: 0, y: 0, w: 200, h: 200 });
    const second = makeToken({ id: 'b', name: 'B', x: 60, y: 0, w: 80, h: 80 });
    (globalThis as any).canvas.tokens.placeables = [first, second];

    const picked = pickTokenAtPoint(60, 0);
    expect(picked?.id).toBe('b');
  });

  it('respects onlyIds / excludeIds', () => {
    const a = makeToken({ id: 'a', name: 'A', x: 0, y: 0 });
    const b = makeToken({ id: 'b', name: 'B', x: 10, y: 0 });
    (globalThis as any).canvas.tokens.placeables = [a, b];

    expect(pickTokenAtPoint(5, 0, { onlyIds: ['b'] })?.id).toBe('b');
    expect(pickTokenAtPoint(5, 0, { excludeIds: ['b'] })?.id).toBe('a');
  });
});
