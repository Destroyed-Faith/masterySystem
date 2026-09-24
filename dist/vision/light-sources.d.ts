/**
 * Mundane light sources and the lighting state at a point.
 *
 * Foundry renders the light itself (token / ambient light `bright` / `dim`
 * radii). The Mastery layer only needs to know whether a location is
 * effectively Daylight (inside a Bright radius), Dim Light (inside a Dim
 * radius) or falls back to the scene lighting state.
 */
import { type LightingState } from './scene-lighting.js';
export type LightSourceProfileId = 'candle' | 'torch' | 'lantern';
export interface LightSourceProfile {
    id: LightSourceProfileId;
    label: string;
    brightM: number;
    dimM: number;
    color: string;
    icon: string;
}
export declare const LIGHT_SOURCE_PROFILES: Record<LightSourceProfileId, LightSourceProfile>;
export declare const LIGHT_SOURCE_PROFILE_IDS: readonly LightSourceProfileId[];
export declare function isLightSourceProfileId(value: unknown): value is LightSourceProfileId;
/** Token / AmbientLight document `light` data for a profile (Foundry native rendering). */
export declare function foundryLightDataForProfile(profile: LightSourceProfile): Record<string, unknown>;
/** Removing a carried light source: no bright, no dim, no animation. */
export declare function foundryLightDataOff(): Record<string, unknown>;
export interface PointLightSource {
    x: number;
    y: number;
    brightM: number;
    dimM: number;
}
/**
 * Lighting at `point`: Bright radius → Daylight, Dim radius → Dim Light,
 * otherwise the scene state. Light only ever improves the scene state.
 */
export declare function lightingStateAtPoint(sceneState: LightingState, sources: readonly PointLightSource[], point: {
    x: number;
    y: number;
}, distanceM: (a: {
    x: number;
    y: number;
}, b: {
    x: number;
    y: number;
}) => number): LightingState;
/** Light sources from Foundry documents (AmbientLight docs and lit tokens). */
export declare function collectPointLightSources(scene: any): PointLightSource[];
//# sourceMappingURL=light-sources.d.ts.map