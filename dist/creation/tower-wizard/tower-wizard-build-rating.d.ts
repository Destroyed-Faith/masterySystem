/**
 * Tower Wizard — Build Role Matrix.
 *
 * Scores a finished 6-power package across five axes (Offense, Defense,
 * Control, Sustain, Mobility/Utility) and derives a radar/pentagon geometry
 * plus a short verdict (dominant archetype + focus/coherence).
 *
 * Pure module: no DOM, all trig done here so Handlebars only interpolates
 * precomputed coordinates.
 */
import type { ReviewPowerRow } from './tower-wizard-types.js';
export type RoleAxisKey = 'offense' | 'defense' | 'control' | 'sustain' | 'mobility';
export interface RoleAxisScore {
    key: RoleAxisKey;
    label: string;
    score: number;
}
export interface RoleRadarLabel {
    x: number;
    y: number;
    anchor: 'start' | 'middle' | 'end';
    label: string;
    score: number;
}
export interface RoleRadarGeometry {
    size: number;
    center: number;
    gridPolygons: string[];
    axisLines: Array<{
        x2: number;
        y2: number;
    }>;
    dataPolygon: string;
    labels: RoleRadarLabel[];
}
export type RoleFocusKey = 'sharp' | 'balanced' | 'unfocused';
export interface BuildRoleRating {
    axes: RoleAxisScore[];
    radar: RoleRadarGeometry;
    directionLabel: string;
    focusKey: RoleFocusKey;
    focusLabel: string;
    summary: string;
}
export declare const AXIS_LABELS: Record<RoleAxisKey, string>;
/** Compute the full role rating (axes + radar geometry + verdict) for a build. */
export declare function computeBuildRoleRating(rows: ReviewPowerRow[]): BuildRoleRating;
//# sourceMappingURL=tower-wizard-build-rating.d.ts.map