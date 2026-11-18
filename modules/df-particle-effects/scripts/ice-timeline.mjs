import { FREEZE_INSTANT, FREEZE_LOOP, LOOP_RESET_FADE } from "./constants.mjs";
import { clamp } from "./geometry.mjs";

/** Seconds the loop spends thawing or fading before it freezes again. */
export function resetDuration(config) {
  return clamp(clampSeconds(config?.freezeDuration, 2) * 0.4, 0.3, 2);
}

/**
 * Freeze state for one frame.
 * `progress` 0 is clear ground, 1 is a fully frozen surface. `fade` scales the whole surface.
 * Once: `elapsed` is seconds since the freeze started (Infinity = already frozen).
 * Loop: phase comes from the wall clock so every client sees roughly the same cycle.
 *
 * @param {object} config
 * @param {number} elapsed
 * @param {number} wallSeconds
 * @returns {{ progress: number, fade: number }}
 */
export function freezeTimeline(config, elapsed, wallSeconds) {
  const mode = config?.freezeMode;
  if (mode === FREEZE_INSTANT) return { progress: 1, fade: 1 };

  const duration = clampSeconds(config?.freezeDuration, 2);
  if (mode !== FREEZE_LOOP) {
    if (!(elapsed < duration)) return { progress: 1, fade: 1 };
    return { progress: easeOut(Math.max(0, elapsed) / duration), fade: 1 };
  }

  const hold = clamp(Number(config?.holdTime) || 0, 0, 30);
  const reset = resetDuration(config);
  const cycle = duration + hold + reset;
  const phase = ((Number(wallSeconds) % cycle) + cycle) % cycle;
  if (phase < duration) return { progress: easeOut(phase / duration), fade: 1 };
  if (phase < duration + hold) return { progress: 1, fade: 1 };
  const u = (phase - duration - hold) / reset;
  if (config?.loopReset === LOOP_RESET_FADE) return { progress: 1, fade: 1 - u };
  return { progress: 1 - u, fade: 1 };
}

/** Fields whose change should replay the freeze in the open behavior sheet. */
export function freezeTimingSignature(config) {
  return [config?.freezeMode, config?.freezeDuration, config?.holdTime, config?.loopReset].join("|");
}

function easeOut(x) {
  const t = clamp(x, 0, 1);
  return 1 - (1 - t) * (1 - t);
}

function clampSeconds(value, fallback) {
  const number = Number(value);
  return clamp(Number.isFinite(number) ? number : fallback, 0.2, 20);
}
