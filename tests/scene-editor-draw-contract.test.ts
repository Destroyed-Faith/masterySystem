import { describe, expect, it } from 'vitest';
import {
  CLICK_CHAIN_EPS,
  clampOpeningWidth,
  resolveChainPointerDown,
  resolveChainPointerUp,
} from '../src/scene-editor/draw-contract';
import { DEFAULT_MIN_SEGMENT, DEFAULT_OPENING_WIDTH } from '../src/scene-editor/geometry';

describe('clampOpeningWidth', () => {
  it('clamps to the host wall length', () => {
    expect(clampOpeningWidth(100, 400)).toBe(100);
  });

  it('enforces a minimum width when the wall is long enough', () => {
    expect(clampOpeningWidth(100, 2)).toBe(DEFAULT_MIN_SEGMENT);
  });

  it('never exceeds a short host wall', () => {
    expect(clampOpeningWidth(6, 40)).toBe(6);
  });

  it('keeps a sensible default on degenerate hosts', () => {
    expect(clampOpeningWidth(0, 999)).toBeGreaterThanOrEqual(DEFAULT_OPENING_WIDTH);
  });
});

describe('click–click chain contract', () => {
  const a = { x: 10, y: 10 };
  const b = { x: 80, y: 10 };

  it('places the first start on pointerdown', () => {
    const first = resolveChainPointerDown(null, a);
    expect(first.placedStart).toBe(true);
    expect(first.drawStart).toEqual(a);
  });

  it('does not overwrite an active chain start on the second down', () => {
    const second = resolveChainPointerDown(a, b);
    expect(second.placedStart).toBe(false);
    expect(second.drawStart).toEqual(a);
  });

  it('holds start on a short click', () => {
    const near = { x: a.x + CLICK_CHAIN_EPS / 2, y: a.y };
    const up = resolveChainPointerUp(a, near);
    expect(up.action).toBe('hold-start');
  });

  it('commits and chains when the second point is far enough', () => {
    const up = resolveChainPointerUp(a, b);
    expect(up).toEqual({
      action: 'commit',
      a,
      b,
      nextStart: b,
    });
  });
});
