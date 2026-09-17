/**
 * Portable “wall lesson” JSON from a prepared scene. Describes how existing
 * walls/doors/windows are structured so the drawer can be tuned against real maps.
 * Separate from the full mastery-scene import/export document.
 */
import type { GeometryKind, Point } from './types.js';
export declare const WALL_LESSON_SCHEMA_VERSION = 1;
export declare const WALL_LESSON_KIND = "mastery-wall-lesson";
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
        colinearMergeCandidates: Array<{
            a: string;
            b: string;
        }>;
    };
    recommendations: {
        preferredSegmentLength: number | null;
        doorWidthRange: {
            min: number;
            max: number;
            median: number;
        } | null;
        preferredSnapMode: 'magnetic' | 'grid' | 'free';
        preferChainOverDrag: boolean;
        notes: string[];
    };
}
export declare function buildWallLesson(opts: {
    sceneName: string;
    fingerprint: string;
    origin: Point;
    size: Point;
    gridSize?: number;
    walls: WallLessonInputWall[];
}): WallLessonDocument;
/** Convenience: world length between two points (exported for tests). */
export declare function lessonSegmentDistance(a: Point, b: Point): number;
//# sourceMappingURL=wall-lesson.d.ts.map