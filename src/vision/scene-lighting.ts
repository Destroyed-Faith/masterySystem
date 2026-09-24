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
import { COMBAT_SENSES } from '../combat/combat-senses.js';

export type LightingState = 'daylight' | 'dim' | 'night' | 'darkness';
export type LightingMode = 'auto' | 'day' | 'dim' | 'night' | 'dark';

export const LIGHTING_MODES: readonly LightingMode[] = ['auto', 'day', 'dim', 'night', 'dark'];
export const LIGHTING_STATES: readonly LightingState[] = ['daylight', 'dim', 'night', 'darkness'];

/** Normal Combat Awareness — maximum ordinary visual range. */
export const NORMAL_VISION_RANGE_M = COMBAT_SENSES.normalCombatAwareness.rangeM;
/** Darkvision — ordinary darkness stops blocking sight within this range. */
export const DARKVISION_RANGE_M = COMBAT_SENSES.darkvision.rangeM;

/** Effective range of ordinary visual perception per lighting state. */
export const LIGHTING_VISUAL_RANGE_M: Record<LightingState, number> = {
  daylight: 60,
  dim: 30,
  night: 8,
  darkness: 0,
};

export const LIGHTING_STATE_LABEL: Record<LightingState, string> = {
  daylight: 'Daylight',
  dim: 'Dim Light',
  night: 'Night',
  darkness: 'Total Darkness',
};

export const LIGHTING_MODE_LABEL: Record<LightingMode, string> = {
  auto: 'AUTO',
  day: 'DAY',
  dim: 'DIM',
  night: 'NIGHT',
  dark: 'DARK',
};

export const LIGHTING_STATE_ICON: Record<LightingState, string> = {
  daylight: 'fas fa-sun',
  dim: 'fas fa-cloud-sun',
  night: 'fas fa-moon',
  darkness: 'fas fa-circle',
};

/** 0 = First Watch … 3 = Fourth Watch. */
export type WatchIndex = 0 | 1 | 2 | 3;

export const WATCH_LABEL: Record<WatchIndex, string> = {
  0: 'First Watch',
  1: 'Second Watch',
  2: 'Third Watch',
  3: 'Fourth Watch',
};

const STATE_RANK: Record<LightingState, number> = { daylight: 3, dim: 2, night: 1, darkness: 0 };

export function isLightingMode(value: unknown): value is LightingMode {
  return typeof value === 'string' && (LIGHTING_MODES as readonly string[]).includes(value);
}

export function isLightingState(value: unknown): value is LightingState {
  return typeof value === 'string' && (LIGHTING_STATES as readonly string[]).includes(value);
}

export function normalizeLightingMode(raw: unknown): LightingMode {
  return isLightingMode(raw) ? raw : 'auto';
}

/** Manual modes map 1:1 to a state; `auto` has none of its own. */
export function lightingStateForManualMode(mode: LightingMode): LightingState | null {
  switch (mode) {
    case 'day':
      return 'daylight';
    case 'dim':
      return 'dim';
    case 'night':
      return 'night';
    case 'dark':
      return 'darkness';
    default:
      return null;
  }
}

/** A Day has four Watches of equal length. */
export function watchFromHour(hour: number, hoursPerDay = 40): WatchIndex {
  const perWatch = Math.max(1, Math.floor(hoursPerDay / 4));
  const h = Math.max(0, Math.floor(Number(hour) || 0));
  const idx = Math.min(3, Math.floor(h / perWatch));
  return idx as WatchIndex;
}

/** First + Second Watch → Daylight, Third → Dim Light, Fourth → Night. */
export function lightingStateForWatch(watch: WatchIndex): LightingState {
  if (watch === 0 || watch === 1) return 'daylight';
  if (watch === 2) return 'dim';
  return 'night';
}

/**
 * Effective scene lighting state. Manual modes override the Watch. In AUTO
 * without Watch information the current state is preserved (`fallback`);
 * `null` means "unknown — do not change anything".
 */
export function resolveLightingState(
  mode: LightingMode,
  watch: WatchIndex | null,
  fallback: LightingState | null = null,
): LightingState | null {
  const manual = lightingStateForManualMode(mode);
  if (manual) return manual;
  if (watch === null || watch === undefined) return fallback;
  return lightingStateForWatch(watch);
}

/** Ordinary visual range under a lighting state (no Darkvision). */
export function normalVisualRangeM(state: LightingState): number {
  return LIGHTING_VISUAL_RANGE_M[state];
}

/**
 * Sight range a creature actually gets under the scene state. Darkvision
 * only matters where ordinary darkness would otherwise reduce sight below
 * 30 m: Night and Total Darkness become 30 m. Daylight (60) and Dim Light
 * (30) are untouched — Darkvision never replaces the normal 60 m baseline.
 */
export function effectiveSightRangeM(state: LightingState, opts: { darkvision?: boolean } = {}): number {
  const normal = normalVisualRangeM(state);
  if (!opts.darkvision) return normal;
  if (state === 'night' || state === 'darkness') return Math.max(normal, DARKVISION_RANGE_M);
  return normal;
}

/** Only the ordinary Sight channel is capped by scene lighting. */
export function isLightingAffectedSense(senseId: CombatSenseId): boolean {
  return senseId === 'normalCombatAwareness' || senseId === 'darkvision';
}

/**
 * Range of one Combat Sense under the scene lighting. Special Combat Senses
 * (Tremor, Life, Mage, Sonar, Predator) keep their listed range — darkness
 * does not reduce them unless their own rules say so. Normal Combat
 * Awareness reports its Sight-channel range; its other channels are not
 * modelled as a range here.
 */
export function senseRangeUnderLighting(
  senseId: CombatSenseId,
  state: LightingState,
  opts: { darkvision?: boolean } = {},
): number {
  const def = COMBAT_SENSES[senseId];
  if (!isLightingAffectedSense(senseId)) return def.rangeM;
  if (senseId === 'darkvision') return effectiveSightRangeM(state, { darkvision: true });
  return effectiveSightRangeM(state, opts);
}

/** The brighter of two states (light sources only ever improve lighting). */
export function brighterLighting(a: LightingState, b: LightingState): LightingState {
  return STATE_RANK[a] >= STATE_RANK[b] ? a : b;
}

/**
 * Foundry rendering values for a state. Daylight and Dim Light keep global
 * illumination on (Dim only tints); Night and Total Darkness switch it off so
 * Basic Vision only renders light sources plus the token's own capped range.
 */
export function foundryEnvironmentForLighting(state: LightingState): {
  darknessLevel: number;
  globalLight: boolean;
} {
  switch (state) {
    case 'daylight':
      return { darknessLevel: 0, globalLight: true };
    case 'dim':
      return { darknessLevel: 0.45, globalLight: true };
    case 'night':
      return { darknessLevel: 0.85, globalLight: false };
    default:
      return { darknessLevel: 1, globalLight: false };
  }
}

export interface LightingStatus {
  mode: LightingMode;
  watch: WatchIndex | null;
  state: LightingState | null;
  label: string;
}

/** "Lighting: AUTO — Fourth Watch → NIGHT" / "Lighting: DARK — Manual Override". */
export function describeLighting(mode: LightingMode, watch: WatchIndex | null, state: LightingState | null): LightingStatus {
  const stateLabel = state ? LIGHTING_MODE_LABEL[modeForState(state)] : 'unknown';
  let label: string;
  if (mode === 'auto') {
    label =
      watch === null
        ? `Lighting: AUTO — no Watch information → ${stateLabel}`
        : `Lighting: AUTO — ${WATCH_LABEL[watch]} → ${stateLabel}`;
  } else {
    label = `Lighting: ${LIGHTING_MODE_LABEL[mode]} — Manual Override`;
  }
  return { mode, watch, state, label };
}

export function modeForState(state: LightingState): LightingMode {
  switch (state) {
    case 'daylight':
      return 'day';
    case 'dim':
      return 'dim';
    case 'night':
      return 'night';
    default:
      return 'dark';
  }
}
