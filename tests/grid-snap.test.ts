import { describe, expect, it, beforeEach, afterEach } from 'vitest';

import { snapWorldCenter, snapWorldTopLeft, eventWorldPoint } from '../src/utils/grid-snap.js';

describe('grid-snap helpers (Foundry v14)', () => {
  const prevCanvas = (globalThis as any).canvas;
  const prevConst = (globalThis as any).CONST;

  beforeEach(() => {
    (globalThis as any).CONST = {
      GRID_SNAPPING_MODES: { CENTER: 1, TOP_LEFT_CORNER: 2 },
    };
  });

  afterEach(() => {
    (globalThis as any).canvas = prevCanvas;
    (globalThis as any).CONST = prevConst;
  });

  it('snapWorldCenter prefers getCenterPoint', () => {
    (globalThis as any).canvas = {
      grid: {
        getCenterPoint: ({ x, y }: { x: number; y: number }) => ({ x: Math.floor(x / 100) * 100 + 50, y: Math.floor(y / 100) * 100 + 50 }),
        getSnappedPoint: () => ({ x: 999, y: 999 }),
        getSnappedPosition: () => ({ x: 888, y: 888 }),
      },
    };
    expect(snapWorldCenter(120, 180)).toEqual({ x: 150, y: 150 });
  });

  it('snapWorldCenter falls back to getSnappedPoint when getCenterPoint missing', () => {
    (globalThis as any).canvas = {
      grid: {
        getSnappedPoint: (p: { x: number; y: number }, behavior: { mode: number }) => {
          expect(behavior.mode).toBe(1);
          return { x: p.x + 1, y: p.y + 2 };
        },
      },
    };
    expect(snapWorldCenter(10, 20)).toEqual({ x: 11, y: 22 });
  });

  it('snapWorldCenter never calls removed getSnappedPosition when modern APIs exist', () => {
    let legacyCalled = false;
    (globalThis as any).canvas = {
      grid: {
        getSnappedPoint: () => ({ x: 5, y: 6 }),
        getSnappedPosition: () => {
          legacyCalled = true;
          return { x: 0, y: 0 };
        },
      },
    };
    expect(snapWorldCenter(1, 2)).toEqual({ x: 5, y: 6 });
    expect(legacyCalled).toBe(false);
  });

  it('snapWorldTopLeft uses getOffset + getTopLeftPoint', () => {
    (globalThis as any).canvas = {
      grid: {
        getOffset: () => ({ i: 2, j: 3 }),
        getTopLeftPoint: (o: { i: number; j: number }) => ({ x: o.i * 100, y: o.j * 100 }),
      },
    };
    expect(snapWorldTopLeft(250, 350)).toEqual({ x: 200, y: 300 });
  });

  it('eventWorldPoint uses FederatedEvent.getLocalPosition', () => {
    (globalThis as any).canvas = { stage: {}, app: { stage: {} } };
    const ev = {
      getLocalPosition: (stage: unknown) => {
        expect(stage).toBe((globalThis as any).canvas.stage);
        return { x: 42, y: 84 };
      },
    };
    expect(eventWorldPoint(ev)).toEqual({ x: 42, y: 84 });
  });
});
