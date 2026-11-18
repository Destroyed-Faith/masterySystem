import { FREEZE_INSTANT, FREEZE_LOOP, LOOP_RESET_FADE } from "./constants.mjs";
import { clamp } from "./geometry.mjs";

/** Seconds the ground keeps shaking after the cracks have fully opened. */
const QUAKE_TAIL = 0.6;

/** Seconds the loop spends clearing before it builds up again. */
export function resetDuration(config) {
  return clamp(clampSeconds(config?.freezeDuration, 2) * 0.4, 0.3, 2);
}

/**
 * Build-up state for one frame of a timed surface (ice, ground cracks).
 * `progress` 0 is untouched ground, 1 is fully built. `fade` scales the whole surface.
 * `quake` is 1 while the surface builds up and dies out shortly after.
 * Once: `elapsed` is seconds since the build started (Infinity = already built).
 * Loop: phase comes from the wall clock so every client sees roughly the same cycle.
 *
 * @param {{ mode: string, duration: number, hold: number, fadeReset: boolean }} settings
 * @param {number} elapsed
 * @param {number} wallSeconds
 * @returns {{ progress: number, fade: number, quake: number }}
 */
export function buildTimeline(settings, elapsed, wallSeconds) {
  if (settings.mode === FREEZE_INSTANT) return { progress: 1, fade: 1, quake: 0 };

  const duration = clampSeconds(settings.duration, 2);
  if (settings.mode !== FREEZE_LOOP) {
    if (!(elapsed < duration)) return { progress: 1, fade: 1, quake: quakeTail(elapsed - duration) };
    return { progress: easeOut(Math.max(0, elapsed) / duration), fade: 1, quake: 1 };
  }

  const hold = clamp(Number(settings.hold) || 0, 0, 30);
  const reset = clamp(duration * 0.4, 0.3, 2);
  const cycle = duration + hold + reset;
  const phase = ((Number(wallSeconds) % cycle) + cycle) % cycle;
  if (phase < duration) return { progress: easeOut(phase / duration), fade: 1, quake: 1 };
  if (phase < duration + hold) return { progress: 1, fade: 1, quake: quakeTail(phase - duration) };
  const u = (phase - duration - hold) / reset;
  if (settings.fadeReset) return { progress: 1, fade: 1 - u, quake: 0 };
  return { progress: 1 - u, fade: 1, quake: 0 };
}

/** Ice: `progress` is how far the freeze front has come. */
export function freezeTimeline(config, elapsed, wallSeconds) {
  const { progress, fade } = buildTimeline(freezeSettings(config), elapsed, wallSeconds);
  return { progress, fade };
}

/** Ground cracks: `progress` is how far the cracks have run, `quake` drives the shake. */
export function crackTimeline(config, elapsed, wallSeconds) {
  return buildTimeline(crackSettings(config), elapsed, wallSeconds);
}

/** Fields whose change should replay the build-up in the open behavior sheet. */
export function freezeTimingSignature(config) {
  return [config?.freezeMode, config?.freezeDuration, config?.holdTime, config?.loopReset].join("|");
}

export function crackTimingSignature(config) {
  return [config?.crackMode, config?.crackDuration, config?.crackHold, config?.crackReset].join("|");
}

function freezeSettings(config) {
  return {
    mode: config?.freezeMode,
    duration: config?.freezeDuration,
    hold: config?.holdTime,
    fadeReset: config?.loopReset === LOOP_RESET_FADE,
  };
}

function crackSettings(config) {
  return {
    mode: config?.crackMode,
    duration: config?.crackDuration ?? 1.5,
    hold: config?.crackHold,
    fadeReset: config?.crackReset === LOOP_RESET_FADE,
  };
}

function quakeTail(seconds) {
  return clamp(1 - seconds / QUAKE_TAIL, 0, 1);
}

function easeOut(x) {
  const t = clamp(x, 0, 1);
  return 1 - (1 - t) * (1 - t);
}

function clampSeconds(value, fallback) {
  const number = Number(value);
  return clamp(Number.isFinite(number) ? number : fallback, 0.2, 20);
}
