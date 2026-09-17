/**
 * Portable “wall lesson” JSON from a prepared scene. Describes how existing
 * walls/doors/windows are structured so the drawer can be tuned against real maps.
 * Separate from the full mastery-scene import/export document.
 */

import {
  areCollinear,
  distance,
  normalizePoint,
  pointsEqual,
  projectPointOnSegment,
  segmentLength,
  unitDirection,
} from './geometry.js';
import type { GeometryKind, Point, Segment } from './types.js';

export const WALL_LESSON_SCHEMA_VERSION = 1;
export const WALL_LESSON_KIND = 'mastery-wall-lesson';

export interface WallLessonInputWall {
  id?: string;
  kind: GeometryKind;
  a: Point;
  b: Point;
}

export interface WallLessonSegment {
  id: string;
  kind: GeometryKind;
  a: Point;
  b: Point;
  length: number;
  angleDeg: number;
  snapResidual: number;
  axisAligned: boolean;
}

export interface WallLessonOpening {
  id: string;
  kind: 'door' | 'window';
  hostWallId: string | null;
  center: Point;
  width: number;
  widthFractionOfHost: number | null;
  a: Point;
  b: Point;
}

export interface WallLessonDocument {
  kind: typeof WALL_LESSON_KIND;
  schemaVersion: number;
  scene: {
    name: string;
    fingerprint: string;
    width: number;
    height: number;
    gridSize: number;
  };
  segments: WallLessonSegment[];
  openings: WallLessonOpening[];
  clustering: {
    axisAlignedRuns: number;
    sharedJunctions: number;
    colinearMergeCandidates: Array<{ a: string; b: string }>;
  };
  recommendations: {
    preferredSegmentLength: number | null;
    doorWidthRange: { min: number; max: number; median: number } | null;
    preferredSnapMode: 'magnetic' | 'grid' | 'free';
    preferChainOverDrag: boolean;
    notes: string[];
  };
}

function angleDeg(seg: Segment): number {
  const d = unitDirection(seg);
  return (Math.atan2(d.y, d.x) * 180) / Math.PI;
}

function isAxisAligned(seg: Segment, eps = 0.02): boolean {
  const d = unitDirection(seg);
  return Math.abs(d.x) < eps || Math.abs(d.y) < eps;
}

function snapResidual(seg: Segment, gridSize: number): number {
  if (!(gridSize > 0)) return 0;
  const ra = Math.hypot(seg.a.x % gridSize, seg.a.y % gridSize);
  const rb = Math.hypot(seg.b.x % gridSize, seg.b.y % gridSize);
  const near = (r: number) => Math.min(r, Math.abs(r - gridSize));
  return Number(((near(ra) + near(rb)) / 2).toFixed(3));
}

function median(nums: number[]): number | null {
  if (!nums.length) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

function findHostWall(
  opening: Segment,
  walls: Array<WallLessonInputWall & { id: string }>,
): { host: WallLessonInputWall & { id: string }; center: Point; fraction: number } | null {
  let best: { host: WallLessonInputWall & { id: string }; center: Point; fraction: number; score: number } | null =
    null;
  const mid = { x: (opening.a.x + opening.b.x) / 2, y: (opening.a.y + opening.b.y) / 2 };
  for (const wall of walls) {
    if (wall.kind !== 'wall') continue;
    const hostSeg = { a: wall.a, b: wall.b };
    if (!areCollinear(opening, hostSeg, 0.12, 6)) continue;
    const proj = projectPointOnSegment(mid, hostSeg);
    const hostLen = segmentLength(hostSeg);
    const openLen = segmentLength(opening);
    if (hostLen < openLen - 1) continue;
    const score = proj.distance + Math.abs(hostLen - openLen) * 0.01;
    if (!best || score < best.score) {
      best = {
        host: wall,
        center: proj.point,
        fraction: hostLen > 0 ? openLen / hostLen : 0,
        score,
      };
    }
  }
  return best ? { host: best.host, center: best.center, fraction: best.fraction } : null;
}

function countSharedJunctions(segs: Segment[], eps = 2): number {
  const ends: Point[] = [];
  for (const s of segs) ends.push(s.a, s.b);
  let shared = 0;
  const seen = new Set<number>();
  for (let i = 0; i < ends.length; i += 1) {
    if (seen.has(i)) continue;
    let cluster = 1;
    for (let j = i + 1; j < ends.length; j += 1) {
      if (pointsEqual(ends[i]!, ends[j]!, eps)) {
        seen.add(j);
        cluster += 1;
      }
    }
    if (cluster >= 2) shared += 1;
  }
  return shared;
}

export function buildWallLesson(opts: {
  sceneName: string;
  fingerprint: string;
  origin: Point;
  size: Point;
  gridSize?: number;
  walls: WallLessonInputWall[];
}): WallLessonDocument {
  const gridSize = Number(opts.gridSize) || 0;
  const origin = opts.origin;
  const size = opts.size;
  const norm = (p: Point) => normalizePoint(p, origin, size);

  const withIds = opts.walls.map((w, i) => ({
    ...w,
    id: w.id || `wall-${i}`,
  }));

  const wallSegs = withIds.filter((w) => w.kind === 'wall');
  const openingsRaw = withIds.filter((w) => w.kind === 'door' || w.kind === 'window');

  const segments: WallLessonSegment[] = wallSegs.map((w) => {
    const seg = { a: w.a, b: w.b };
    const len = segmentLength(seg);
    return {
      id: w.id,
      kind: 'wall' as const,
      a: norm(w.a),
      b: norm(w.b),
      length: Number(len.toFixed(3)),
      angleDeg: Number(angleDeg(seg).toFixed(2)),
      snapResidual: snapResidual(seg, gridSize),
      axisAligned: isAxisAligned(seg),
    };
  });

  const openings: WallLessonOpening[] = openingsRaw.map((o) => {
    const seg = { a: o.a, b: o.b };
    const host = findHostWall(seg, wallSegs);
    const width = segmentLength(seg);
    return {
      id: o.id,
      kind: o.kind as 'door' | 'window',
      hostWallId: host?.host.id ?? null,
      center: norm(host?.center ?? { x: (o.a.x + o.b.x) / 2, y: (o.a.y + o.b.y) / 2 }),
      width: Number(width.toFixed(3)),
      widthFractionOfHost: host ? Number(host.fraction.toFixed(4)) : null,
      a: norm(o.a),
      b: norm(o.b),
    };
  });

  const colinearMergeCandidates: Array<{ a: string; b: string }> = [];
  for (let i = 0; i < wallSegs.length; i += 1) {
    for (let j = i + 1; j < wallSegs.length; j += 1) {
      const a = wallSegs[i]!;
      const b = wallSegs[j]!;
      if (areCollinear({ a: a.a, b: a.b }, { a: b.a, b: b.b })) {
        const touch =
          pointsEqual(a.a, b.a, 3) ||
          pointsEqual(a.a, b.b, 3) ||
          pointsEqual(a.b, b.a, 3) ||
          pointsEqual(a.b, b.b, 3);
        if (touch) colinearMergeCandidates.push({ a: a.id, b: b.id });
      }
    }
  }

  const wallLengths = segments.map((s) => s.length).filter((n) => n > 0);
  const doorWidths = openings.filter((o) => o.kind === 'door').map((o) => o.width);
  const avgSnap =
    segments.length > 0 ? segments.reduce((acc, s) => acc + s.snapResidual, 0) / segments.length : 0;
  const axisAlignedRuns = segments.filter((s) => s.axisAligned).length;
  const preferGrid = gridSize > 0 && avgSnap < gridSize * 0.08;

  const notes: string[] = [];
  if (axisAlignedRuns / Math.max(1, segments.length) > 0.7) {
    notes.push('Most walls are axis-aligned; prefer orthogonal chaining.');
  }
  if (openings.some((o) => o.hostWallId)) {
    notes.push('Doors/windows sit on host wall segments; clamp width to host length.');
  }
  if (colinearMergeCandidates.length) {
    notes.push('Colinear abutting walls detected; drawer should merge or chain cleanly at junctions.');
  }
  notes.push('Prefer click–click chaining for walls; Esc/Enter/double-click end the chain.');

  return {
    kind: WALL_LESSON_KIND,
    schemaVersion: WALL_LESSON_SCHEMA_VERSION,
    scene: {
      name: opts.sceneName,
      fingerprint: opts.fingerprint,
      width: size.x,
      height: size.y,
      gridSize,
    },
    segments,
    openings,
    clustering: {
      axisAlignedRuns,
      sharedJunctions: countSharedJunctions(wallSegs.map((w) => ({ a: w.a, b: w.b }))),
      colinearMergeCandidates,
    },
    recommendations: {
      preferredSegmentLength: median(wallLengths),
      doorWidthRange: doorWidths.length
        ? {
            min: Math.min(...doorWidths),
            max: Math.max(...doorWidths),
            median: median(doorWidths) ?? doorWidths[0]!,
          }
        : null,
      preferredSnapMode: preferGrid ? 'grid' : 'magnetic',
      preferChainOverDrag: true,
      notes,
    },
  };
}

/** Convenience: world length between two points (exported for tests). */
export function lessonSegmentDistance(a: Point, b: Point): number {
  return distance(a, b);
}
