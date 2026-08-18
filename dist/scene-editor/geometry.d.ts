/**
 * Canvas-free geometry for the scene editor. Every function here is unit-tested.
 */
import type { Point, Segment } from './types.js';
export declare const DEFAULT_MIN_SEGMENT = 8;
export declare const DEFAULT_SNAP_WORLD = 16;
export declare const DEFAULT_OPENING_WIDTH = 48;
export declare function point(x: number, y: number): Point;
export declare function clonePoint(p: Point): Point;
export declare function midpoint(a: Point, b: Point): Point;
export declare function subtract(a: Point, b: Point): Point;
export declare function add(a: Point, b: Point): Point;
export declare function scale(p: Point, s: number): Point;
export declare function distance(a: Point, b: Point): number;
export declare function segmentLength(seg: Segment): number;
export declare function isShortSegment(seg: Segment, min?: number): boolean;
export declare function pointsEqual(a: Point, b: Point, eps?: number): boolean;
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
export declare function projectPointOnSegment(p: Point, seg: Segment): Projection;
export declare function distanceToSegment(p: Point, seg: Segment): number;
export declare function pointAlong(seg: Segment, t: number): Point;
export declare function unitDirection(seg: Segment): Point;
/**
 * Split a segment at parameter t (0..1). Degenerate halves are dropped.
 */
export declare function splitSegmentAt(seg: Segment, t: number, min?: number): Segment[];
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
export declare function planOpening(wall: Segment, center: Point, width: number, min?: number): OpeningPlan;
export interface SnapTarget {
    point: Point;
    kind: 'endpoint' | 'segment' | 'suggestion' | 'grid' | 'free';
}
export declare function nearestEndpoint(p: Point, segments: readonly Segment[], radius: number): Point | null;
export declare function nearestOnSegments(p: Point, segments: readonly Segment[], radius: number): Point | null;
export declare function snapMagnetic(p: Point, confirmed: readonly Segment[], suggestions: readonly Segment[], radius: number): SnapTarget;
export declare function mergeCloseEndpoints(segments: readonly Segment[], radius: number): Segment[];
export declare function findDuplicateSegments(segments: readonly Segment[], eps?: number): Array<[number, number]>;
export declare function areCollinear(a: Segment, b: Segment, angleEps?: number, distEps?: number): boolean;
export declare function translateSegment(seg: Segment, dx: number, dy: number): Segment;
export declare function moveEndpoint(seg: Segment, which: 'a' | 'b', to: Point): Segment;
/** Normalise a scene point into 0..1 of the background box. */
export declare function normalizePoint(p: Point, origin: Point, size: Point): Point;
export declare function denormalizePoint(p: Point, origin: Point, size: Point): Point;
export declare function normalizeSegment(seg: Segment, origin: Point, size: Point): Segment;
export declare function denormalizeSegment(seg: Segment, origin: Point, size: Point): Segment;
export declare function rectFromPoints(a: Point, b: Point): {
    x: number;
    y: number;
    width: number;
    height: number;
};
export declare function pointInRect(p: Point, rect: {
    x: number;
    y: number;
    width: number;
    height: number;
}): boolean;
export declare function segmentHitsRect(seg: Segment, rect: {
    x: number;
    y: number;
    width: number;
    height: number;
}): boolean;
export declare function segmentsIntersect(a: Segment, b: Segment): boolean;
export declare function newId(prefix?: string): string;
//# sourceMappingURL=geometry.d.ts.map