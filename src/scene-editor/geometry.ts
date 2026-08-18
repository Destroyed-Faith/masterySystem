/**
 * Canvas-free geometry for the scene editor. Every function here is unit-tested.
 */

import type { Point, Segment } from './types.js';

export const DEFAULT_MIN_SEGMENT = 8;
export const DEFAULT_SNAP_WORLD = 16;
export const DEFAULT_OPENING_WIDTH = 48;

export function point(x: number, y: number): Point {
  return { x, y };
}

export function clonePoint(p: Point): Point {
  return { x: p.x, y: p.y };
}

export function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export function subtract(a: Point, b: Point): Point {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function add(a: Point, b: Point): Point {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function scale(p: Point, s: number): Point {
  return { x: p.x * s, y: p.y * s };
}

export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function segmentLength(seg: Segment): number {
  return distance(seg.a, seg.b);
}

export function isShortSegment(seg: Segment, min = DEFAULT_MIN_SEGMENT): boolean {
  return segmentLength(seg) < min;
}

export function pointsEqual(a: Point, b: Point, eps = 0.5): boolean {
  return distance(a, b) <= eps;
}

export interface Projection {
  point: Point;
  /** 0 at A, 1 at B, unclamped along the infinite line. */
  t: number;
  /** Clamped to the segment. */
  tClamped: number;
  onSegment: boolean;
  distance: number;
}

/** Closest point on the finite segment, plus the unclamped line parameter. */
export function projectPointOnSegment(p: Point, seg: Segment): Projection {
  const dx = seg.b.x - seg.a.x;
  const dy = seg.b.y - seg.a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 <= 1e-8) {
    const d = distance(p, seg.a);
    return { point: clonePoint(seg.a), t: 0, tClamped: 0, onSegment: true, distance: d };
  }
  const t = ((p.x - seg.a.x) * dx + (p.y - seg.a.y) * dy) / len2;
  const tClamped = Math.max(0, Math.min(1, t));
  const pointOn = { x: seg.a.x + tClamped * dx, y: seg.a.y + tClamped * dy };
  return {
    point: pointOn,
    t,
    tClamped,
    onSegment: t >= 0 && t <= 1,
    distance: distance(p, pointOn),
  };
}

export function distanceToSegment(p: Point, seg: Segment): number {
  return projectPointOnSegment(p, seg).distance;
}

export function pointAlong(seg: Segment, t: number): Point {
  return {
    x: seg.a.x + (seg.b.x - seg.a.x) * t,
    y: seg.a.y + (seg.b.y - seg.a.y) * t,
  };
}

export function unitDirection(seg: Segment): Point {
  const len = segmentLength(seg);
  if (len <= 1e-8) return { x: 0, y: 0 };
  return { x: (seg.b.x - seg.a.x) / len, y: (seg.b.y - seg.a.y) / len };
}

/**
 * Split a segment at parameter t (0..1). Degenerate halves are dropped.
 */
export function splitSegmentAt(seg: Segment, t: number, min = DEFAULT_MIN_SEGMENT): Segment[] {
  const clamped = Math.max(0, Math.min(1, t));
  const mid = pointAlong(seg, clamped);
  const left: Segment = { a: clonePoint(seg.a), b: mid };
  const right: Segment = { a: clonePoint(mid), b: clonePoint(seg.b) };
  return [left, right].filter((part) => !isShortSegment(part, min));
}

export interface OpeningPlan {
  opening: Segment;
  leftovers: Segment[];
  /** True when the opening ate a leftover that would have been unusable. */
  trimmedEnd: boolean;
  rejected: boolean;
  reason: string | null;
}

/**
 * Cut an opening of `width` (scene units) centred near `center` on `wall`.
 * Leftovers shorter than `min` are omitted rather than leaving a hairline gap.
 */
export function planOpening(
  wall: Segment,
  center: Point,
  width: number,
  min = DEFAULT_MIN_SEGMENT,
): OpeningPlan {
  const len = segmentLength(wall);
  const w = Math.max(min, width);
  if (len < w) {
    return {
      opening: { a: clonePoint(wall.a), b: clonePoint(wall.b) },
      leftovers: [],
      trimmedEnd: true,
      rejected: false,
      reason: null,
    };
  }
  const proj = projectPointOnSegment(center, wall);
  const dir = unitDirection(wall);
  const half = w / 2;
  let from = Math.max(0, proj.tClamped * len - half);
  let to = Math.min(len, proj.tClamped * len + half);
  if (to - from < w - 0.01) {
    if (from <= 0) to = Math.min(len, w);
    else if (to >= len) from = Math.max(0, len - w);
  }
  const opening: Segment = {
    a: { x: wall.a.x + dir.x * from, y: wall.a.y + dir.y * from },
    b: { x: wall.a.x + dir.x * to, y: wall.a.y + dir.y * to },
  };
  const leftovers: Segment[] = [];
  let trimmedEnd = false;
  const left: Segment = { a: clonePoint(wall.a), b: clonePoint(opening.a) };
  const right: Segment = { a: clonePoint(opening.b), b: clonePoint(wall.b) };
  if (!isShortSegment(left, min)) leftovers.push(left);
  else if (segmentLength(left) > 0.25) trimmedEnd = true;
  if (!isShortSegment(right, min)) leftovers.push(right);
  else if (segmentLength(right) > 0.25) trimmedEnd = true;
  return { opening, leftovers, trimmedEnd, rejected: false, reason: null };
}

export interface SnapTarget {
  point: Point;
  kind: 'endpoint' | 'segment' | 'suggestion' | 'grid' | 'free';
}

export function nearestEndpoint(p: Point, segments: readonly Segment[], radius: number): Point | null {
  let best: Point | null = null;
  let bestD = radius;
  for (const seg of segments) {
    for (const end of [seg.a, seg.b]) {
      const d = distance(p, end);
      if (d <= bestD) {
        bestD = d;
        best = clonePoint(end);
      }
    }
  }
  return best;
}

export function nearestOnSegments(p: Point, segments: readonly Segment[], radius: number): Point | null {
  let best: Point | null = null;
  let bestD = radius;
  for (const seg of segments) {
    const proj = projectPointOnSegment(p, seg);
    if (proj.distance <= bestD) {
      bestD = proj.distance;
      best = clonePoint(proj.point);
    }
  }
  return best;
}

export function snapMagnetic(
  p: Point,
  confirmed: readonly Segment[],
  suggestions: readonly Segment[],
  radius: number,
): SnapTarget {
  const end = nearestEndpoint(p, confirmed, radius);
  if (end) return { point: end, kind: 'endpoint' };
  const onWall = nearestOnSegments(p, confirmed, radius);
  if (onWall) return { point: onWall, kind: 'segment' };
  const sugEnd = nearestEndpoint(p, suggestions, radius);
  if (sugEnd) return { point: sugEnd, kind: 'suggestion' };
  const sugOn = nearestOnSegments(p, suggestions, radius);
  if (sugOn) return { point: sugOn, kind: 'suggestion' };
  return { point: clonePoint(p), kind: 'free' };
}

export function mergeCloseEndpoints(segments: readonly Segment[], radius: number): Segment[] {
  const pts: Point[] = [];
  for (const seg of segments) {
    pts.push(seg.a, seg.b);
  }
  const reps: Point[] = [];
  const mapTo = (p: Point): Point => {
    for (const r of reps) {
      if (distance(p, r) <= radius) return r;
    }
    const copy = clonePoint(p);
    reps.push(copy);
    return copy;
  };
  return segments.map((seg) => ({ a: mapTo(seg.a), b: mapTo(seg.b) }));
}

export function findDuplicateSegments(segments: readonly Segment[], eps = 2): Array<[number, number]> {
  const pairs: Array<[number, number]> = [];
  for (let i = 0; i < segments.length; i += 1) {
    for (let j = i + 1; j < segments.length; j += 1) {
      const a = segments[i]!;
      const b = segments[j]!;
      const same =
        (pointsEqual(a.a, b.a, eps) && pointsEqual(a.b, b.b, eps)) ||
        (pointsEqual(a.a, b.b, eps) && pointsEqual(a.b, b.a, eps));
      if (same) pairs.push([i, j]);
    }
  }
  return pairs;
}

export function areCollinear(a: Segment, b: Segment, angleEps = 0.08, distEps = 4): boolean {
  const da = unitDirection(a);
  const db = unitDirection(b);
  const dot = Math.abs(da.x * db.x + da.y * db.y);
  if (dot < Math.cos(angleEps)) return false;
  return distanceToSegment(a.a, b) <= distEps && distanceToSegment(a.b, b) <= distEps;
}

export function translateSegment(seg: Segment, dx: number, dy: number): Segment {
  return {
    a: { x: seg.a.x + dx, y: seg.a.y + dy },
    b: { x: seg.b.x + dx, y: seg.b.y + dy },
  };
}

export function moveEndpoint(seg: Segment, which: 'a' | 'b', to: Point): Segment {
  return which === 'a'
    ? { a: clonePoint(to), b: clonePoint(seg.b) }
    : { a: clonePoint(seg.a), b: clonePoint(to) };
}

/** Normalise a scene point into 0..1 of the background box. */
export function normalizePoint(p: Point, origin: Point, size: Point): Point {
  const w = size.x || 1;
  const h = size.y || 1;
  return { x: (p.x - origin.x) / w, y: (p.y - origin.y) / h };
}

export function denormalizePoint(p: Point, origin: Point, size: Point): Point {
  return { x: origin.x + p.x * size.x, y: origin.y + p.y * size.y };
}

export function normalizeSegment(seg: Segment, origin: Point, size: Point): Segment {
  return { a: normalizePoint(seg.a, origin, size), b: normalizePoint(seg.b, origin, size) };
}

export function denormalizeSegment(seg: Segment, origin: Point, size: Point): Segment {
  return { a: denormalizePoint(seg.a, origin, size), b: denormalizePoint(seg.b, origin, size) };
}

export function rectFromPoints(a: Point, b: Point): { x: number; y: number; width: number; height: number } {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return { x, y, width: Math.abs(b.x - a.x), height: Math.abs(b.y - a.y) };
}

export function pointInRect(p: Point, rect: { x: number; y: number; width: number; height: number }): boolean {
  return p.x >= rect.x && p.x <= rect.x + rect.width && p.y >= rect.y && p.y <= rect.y + rect.height;
}

export function segmentHitsRect(seg: Segment, rect: { x: number; y: number; width: number; height: number }): boolean {
  if (pointInRect(seg.a, rect) || pointInRect(seg.b, rect)) return true;
  const corners: Segment[] = [
    { a: { x: rect.x, y: rect.y }, b: { x: rect.x + rect.width, y: rect.y } },
    { a: { x: rect.x + rect.width, y: rect.y }, b: { x: rect.x + rect.width, y: rect.y + rect.height } },
    { a: { x: rect.x + rect.width, y: rect.y + rect.height }, b: { x: rect.x, y: rect.y + rect.height } },
    { a: { x: rect.x, y: rect.y + rect.height }, b: { x: rect.x, y: rect.y } },
  ];
  return corners.some((edge) => segmentsIntersect(seg, edge));
}

export function segmentsIntersect(a: Segment, b: Segment): boolean {
  const o1 = orient(a.a, a.b, b.a);
  const o2 = orient(a.a, a.b, b.b);
  const o3 = orient(b.a, b.b, a.a);
  const o4 = orient(b.a, b.b, a.b);
  return o1 !== o2 && o3 !== o4;
}

function orient(a: Point, b: Point, c: Point): number {
  const v = (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y);
  if (Math.abs(v) < 1e-8) return 0;
  return v > 0 ? 1 : 2;
}

export function newId(prefix = 'se'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}
