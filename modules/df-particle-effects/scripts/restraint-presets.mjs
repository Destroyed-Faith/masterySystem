import {
  EFFECT_RESTRAINT,
  RESTRAINT_CHAINS,
  RESTRAINT_ROPE,
  RESTRAINT_SERPENT,
  RESTRAINT_VINES,
  RESTRAINT_WEB,
} from "./constants.mjs";
import { clamp } from "./geometry.mjs";

/**
 * Restraint / Binding styles. `halfWidth` is the strand half width in grid cells at
 * Thickness 1 (for vines it includes the thorns); `motion` scales Animation Amount so
 * 100 % stays calm for heavy or rooted strands.
 */
export const RESTRAINT_PRESETS = Object.freeze({
  [RESTRAINT_WEB]: Object.freeze({ color: "#e8e6dd", halfWidth: 0.014, motion: 1 }),
  [RESTRAINT_VINES]: Object.freeze({ color: "#56602f", halfWidth: 0.15, motion: 0.35 }),
  [RESTRAINT_ROPE]: Object.freeze({ color: "#b08d57", halfWidth: 0.085, motion: 1 }),
  [RESTRAINT_CHAINS]: Object.freeze({ color: "#8d9298", halfWidth: 0.12, motion: 0.75 }),
  [RESTRAINT_SERPENT]: Object.freeze({ color: "#4d6a3b", halfWidth: 0.19, motion: 1 }),
});

/** Dialog order. */
export const RESTRAINT_STYLES = Object.freeze([
  RESTRAINT_WEB,
  RESTRAINT_VINES,
  RESTRAINT_ROPE,
  RESTRAINT_CHAINS,
  RESTRAINT_SERPENT,
]);

/** Styles drawn as moving strands; the web is a surface shader. */
export const STRAND_STYLES = Object.freeze([RESTRAINT_VINES, RESTRAINT_ROPE, RESTRAINT_CHAINS, RESTRAINT_SERPENT]);

/**
 * @param {object} config from readConfig
 * @returns {{ style: string, color: number[], halfWidthCells: number, motion: number }}
 */
export function resolveRestraintLook(config) {
  const style = RESTRAINT_STYLES.includes(config?.restraintStyle) ? config.restraintStyle : RESTRAINT_WEB;
  const preset = RESTRAINT_PRESETS[style];
  const color = config?.restraintCustomColor === true ? config.restraintColor : preset.color;
  const thickness = clamp(Number(config?.restraintThickness ?? 1) || 1, 0.25, 3);
  const amount = clamp(Number(config?.restraintAnimation ?? 50), 0, 100) / 100;
  return {
    style,
    color: hexToRgb(color, preset.color),
    halfWidthCells: preset.halfWidth * thickness,
    motion: amount * preset.motion,
  };
}

/** Fields that change where strands lie. A change rebuilds the effect. */
export function restraintLayoutSignature(config) {
  if (config?.effectType !== EFFECT_RESTRAINT) return "";
  const style = config.restraintStyle;
  const parts = [style, config.restraintThickness];
  if (style === RESTRAINT_ROPE || style === RESTRAINT_CHAINS) parts.push(config.strandCount, config.strandLayout, config.strandMotion);
  if (style === RESTRAINT_SERPENT) parts.push(config.serpentCount, config.serpentMotion);
  if (style === RESTRAINT_VINES) parts.push(config.restraintDensity, config.vineVariation, config.vineTwist);
  return parts.join(":");
}

/** Strands that extend play once; a change to these replays it. */
export function restraintTimingSignature(config) {
  return [config.restraintStyle, config.strandMotion, config.strandLayout, config.strandCount].join("|");
}

function hexToRgb(value, fallback) {
  const text = /^#[0-9a-f]{6}$/i.test(String(value ?? "")) ? String(value) : fallback;
  const number = Number.parseInt(text.slice(1), 16);
  return [((number >> 16) & 255) / 255, ((number >> 8) & 255) / 255, (number & 255) / 255];
}
