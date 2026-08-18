import { describe, expect, it } from 'vitest';
import {
  denormalizePoint,
  distance,
  distanceToSegment,
  findDuplicateSegments,
  isShortSegment,
  mergeCloseEndpoints,
  normalizePoint,
  planOpening,
  projectPointOnSegment,
  snapMagnetic,
  splitSegmentAt,
} from '../src/scene-editor/geometry';

const wall = { a: { x: 0, y: 0 }, b: { x: 100, y: 0 } };

describe('projection', () => {
  it('projects onto the middle of a segment', () => {
    const p = projectPointOnSegment({ x: 50, y: 10 }, wall);
    expect(p.point).toEqual({ x: 50, y: 0 });
    expect(p.tClamped).toBe(0.5);
    expect(p.distance).toBe(10);
  });

  it('clamps past the end', () => {
    const p = projectPointOnSegment({ x: 140, y: 0 }, wall);
    expect(p.point).toEqual({ x: 100, y: 0 });
    expect(p.onSegment).toBe(false);
  });
});

describe('distance and short segments', () => {
  it('measures distance to a segment', () => {
    expect(distanceToSegment({ x: 20, y: 5 }, wall)).toBe(5);
  });

  it('flags hairline leftovers', () => {
    expect(isShortSegment({ a: { x: 0, y: 0 }, b: { x: 3, y: 0 } }, 8)).toBe(true);
    expect(isShortSegment(wall, 8)).toBe(false);
  });
});

describe('split and opening', () => {
  it('splits without a gap', () => {
    const [left, right] = splitSegmentAt(wall, 0.4, 1);
    expect(left!.b).toEqual(right!.a);
    expect(distance(left!.a, right!.b)).toBe(100);
  });

  it('inserts a door on the wall axis with leftovers that meet it', () => {
    const plan = planOpening(wall, { x: 50, y: 4 }, 20, 8);
    expect(plan.rejected).toBe(false);
    expect(plan.opening.a.y).toBe(0);
    expect(plan.opening.b.y).toBe(0);
    expect(distance(plan.opening.a, plan.opening.b)).toBeCloseTo(20);
    expect(plan.leftovers).toHaveLength(2);
    expect(plan.leftovers[0]!.b).toEqual(plan.opening.a);
    expect(plan.leftovers[1]!.a).toEqual(plan.opening.b);
  });

  it('drops a leftover that would be a hairline at the wall end', () => {
    const plan = planOpening(wall, { x: 4, y: 0 }, 20, 8);
    expect(plan.leftovers.every((seg) => !isShortSegment(seg, 8))).toBe(true);
    expect(plan.opening.a).toEqual({ x: 0, y: 0 });
  });

  it('uses the whole wall when the opening is wider than the wall', () => {
    const plan = planOpening({ a: { x: 0, y: 0 }, b: { x: 10, y: 0 } }, { x: 5, y: 0 }, 40, 8);
    expect(plan.leftovers).toHaveLength(0);
    expect(plan.opening).toEqual({ a: { x: 0, y: 0 }, b: { x: 10, y: 0 } });
  });
});

describe('snapping and cleanup', () => {
  it('snaps to an existing endpoint first', () => {
    const hit = snapMagnetic({ x: 2, y: 1 }, [wall], [], 8);
    expect(hit.kind).toBe('endpoint');
    expect(hit.point).toEqual({ x: 0, y: 0 });
  });

  it('merges endpoints inside the tolerance', () => {
    const merged = mergeCloseEndpoints(
      [
        { a: { x: 0, y: 0 }, b: { x: 10, y: 0 } },
        { a: { x: 10.4, y: 0.2 }, b: { x: 20, y: 0 } },
      ],
      1,
    );
    expect(merged[0]!.b).toEqual(merged[1]!.a);
  });

  it('finds duplicate segments', () => {
    const dups = findDuplicateSegments([wall, { a: { x: 100, y: 0 }, b: { x: 0, y: 0 } }]);
    expect(dups).toEqual([[0, 1]]);
  });
});

describe('normalised coordinates', () => {
  const origin = { x: 100, y: 50 };
  const size = { x: 200, y: 100 };

  it('round-trips a point', () => {
    const p = { x: 150, y: 100 };
    expect(denormalizePoint(normalizePoint(p, origin, size), origin, size)).toEqual(p);
  });
});
