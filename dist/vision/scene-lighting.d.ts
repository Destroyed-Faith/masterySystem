/**
 * Mastery scene lighting — the environment's cap on ordinary sight.
 *
 * Normal Combat Awareness reaches 60 m. Scene lighting limits how far the
 * ordinary Sight channel currently yields useful visual information; hearing,
 * smell, touch and instinct still exist, so Total Darkness never makes a
 * creature mechanically unaware by itself. Foundry rendering follows this
 * model; the mechanical perception gate (Combat Senses) stays the source of
 * truth for whether one creature perceives another.
 */
import type { CombatSenseId } from '../combat/combat-senses.js';
export type LightingState = 'daylight' | 'dim' | 'night' | 'darkness';
export type LightingMode = 'auto' | 'day' | 'dim' | 'night' | 'dark';
export declare const LIGHTING_MODES: readonly LightingMode[];
export declare const LIGHTING_STATES: readonly LightingState[];
/** Normal Combat Awareness — maximum ordinary visual range. */
export declare const NORMAL_VISION_RANGE_M: number;
/** Darkvision — ordinary darkness stops blocking sight within this range. */
export declare const DARKVISION_RANGE_M: number;
/** Effective range of ordinary visual perception per lighting state. */
export declare const LIGHTING_VISUAL_RANGE_M: Record<LightingState, number>;
export declare const LIGHTING_STATE_LABEL: Record<LightingState, string>;
export declare const LIGHTING_MODE_LABEL: Record<LightingMode, string>;
export declare const LIGHTING_STATE_ICON: Record<LightingState, string>;
/** 0 = First Watch … 3 = Fourth Watch. */
export type WatchIndex = 0 | 1 | 2 | 3;
export declare const WATCH_LABEL: Record<WatchIndex, string>;
export declare function isLightingMode(value: unknown): value is LightingMode;
export declare function isLightingState(value: unknown): value is LightingState;
export declare function normalizeLightingMode(raw: unknown): LightingMode;
/** Manual modes map 1:1 to a state; `auto` has none of its own. */
export declare function lightingStateForManualMode(mode: LightingMode): LightingState | null;
/** A Day has four Watches of equal length. */
export declare function watchFromHour(hour: number, hoursPerDay?: number): WatchIndex;
/** First + Second Watch → Daylight, Third → Dim Light, Fourth → Night. */
export declare function lightingStateForWatch(watch: WatchIndex): LightingState;
/**
 * Effective scene lighting state. Manual modes override the Watch. In AUTO
 * without Watch information the current state is preserved (`fallback`);
 * `null` means "unknown — do not change anything".
 */
export declare function resolveLightingState(mode: LightingMode, watch: WatchIndex | null, fallback?: LightingState | null): LightingState | null;
/** Ordinary visual range under a lighting state (no Darkvision). */
export declare function normalVisualRangeM(state: LightingState): number;
/**
 * Sight range a creature actually gets under the scene state. Darkvision
 * only matters where ordinary darkness would otherwise reduce sight below
 * 30 m: Night and Total Darkness become 30 m. Daylight (60) and Dim Light
 * (30) are untouched — Darkvision never replaces the normal 60 m baseline.
 */
export declare function effectiveSightRangeM(state: LightingState, opts?: {
    darkvision?: boolean;
}): number;
/** Only the ordinary Sight channel is capped by scene lighting. */
export declare function isLightingAffectedSense(senseId: CombatSenseId): boolean;
/**
 * Range of one Combat Sense under the scene lighting. Special Combat Senses
 * (Tremor, Life, Mage, Sonar, Predator) keep their listed range — darkness
 * does not reduce them unless their own rules say so. Normal Combat
 * Awareness reports its Sight-channel range; its other channels are not
 * modelled as a range here.
 */
export declare function senseRangeUnderLighting(senseId: CombatSenseId, state: LightingState, opts?: {
    darkvision?: boolean;
}): number;
/** The brighter of two states (light sources only ever improve lighting). */
export declare function brighterLighting(a: LightingState, b: LightingState): LightingState;
/**
 * Foundry rendering values for a state. Daylight and Dim Light keep global
 * illumination on (Dim only tints); Night and Total Darkness switch it off so
 * Basic Vision only renders light sources plus the token's own capped range.
 */
export declare function foundryEnvironmentForLighting(state: LightingState): {
    darknessLevel: number;
    globalLight: boolean;
};
export interface LightingStatus {
    mode: LightingMode;
    watch: WatchIndex | null;
    state: LightingState | null;
    label: string;
}
/** "Lighting: AUTO — Fourth Watch → NIGHT" / "Lighting: DARK — Manual Override". */
export declare function describeLighting(mode: LightingMode, watch: WatchIndex | null, state: LightingState | null): LightingStatus;
export declare function modeForState(state: LightingState): LightingMode;
//# sourceMappingURL=scene-lighting.d.ts.map