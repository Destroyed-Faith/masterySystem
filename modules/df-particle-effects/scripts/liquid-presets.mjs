import { LIQUID_ACID, LIQUID_ARCANE, LIQUID_LAVA, LIQUID_SLIME, LIQUID_TAR } from "./constants.mjs";
import { clamp } from "./geometry.mjs";
import { colorToRgb } from "./smoke-surface-shader.mjs";

/**
 * Look of each Viscous Surface style. Colors are linear 0–1 RGB.
 *
 * deep/body: trough and crest color of the liquid. sheen: highlight color.
 * glowColor/emission: light the liquid gives off. accent: second hue for gradients
 * and molten crests. speed: flow tempo. viscosity: 0 runny, 1 thick (bigger, slower,
 * smoother forms). bubbles: share of bubble cells. bubbleSize: bubble cell size in
 * grid cells. clarity: how much floor shows through. distortion: refraction strength.
 * gloss: highlight strength and tightness. plates: floating crust plates. crust: edge
 * crust width in grid cells. foam: edge crust is foam rather than a dried skin.
 * iridescence: oily rainbow in the highlights. gradient: soft multi-hue flow.
 * colorRole: which colors a custom color replaces.
 */
export const LIQUID_PRESETS = Object.freeze({
  [LIQUID_TAR]: preset({
    deep: [0.01, 0.01, 0.012],
    body: [0.06, 0.055, 0.05],
    sheen: [0.75, 0.78, 0.85],
    glowColor: [0.35, 0.18, 0.06],
    accent: [0.06, 0.055, 0.05],
    speed: 0.25,
    viscosity: 0.95,
    bubbles: 0.12,
    bubbleSize: 0.85,
    clarity: 0,
    distortion: 0.1,
    gloss: 0.85,
    emission: 0.03,
    plates: 0,
    crust: 0.35,
    foam: 0,
    iridescence: 0.7,
    gradient: 0,
    colorRole: "body",
  }),
  [LIQUID_LAVA]: preset({
    deep: [0.07, 0.025, 0.015],
    body: [0.85, 0.2, 0.02],
    sheen: [1, 0.85, 0.45],
    glowColor: [1, 0.42, 0.08],
    accent: [1, 0.72, 0.18],
    speed: 0.45,
    viscosity: 0.75,
    bubbles: 0.3,
    bubbleSize: 0.6,
    clarity: 0,
    distortion: 0.15,
    gloss: 0.2,
    emission: 1,
    plates: 0.65,
    crust: 0.6,
    foam: 0,
    iridescence: 0,
    gradient: 0,
    colorRole: "glow",
  }),
  [LIQUID_ACID]: preset({
    deep: [0.16, 0.32, 0.02],
    body: [0.55, 0.85, 0.08],
    sheen: [0.95, 1, 0.7],
    glowColor: [0.6, 1, 0.15],
    accent: [0.55, 0.85, 0.08],
    speed: 0.8,
    viscosity: 0.35,
    bubbles: 0.7,
    bubbleSize: 0.38,
    clarity: 0.35,
    distortion: 0.3,
    gloss: 0.6,
    emission: 0.35,
    plates: 0,
    crust: 0.3,
    foam: 0.7,
    iridescence: 0,
    gradient: 0,
    colorRole: "body",
  }),
  [LIQUID_SLIME]: preset({
    deep: [0.06, 0.3, 0.08],
    body: [0.25, 0.75, 0.29],
    sheen: [0.85, 1, 0.85],
    glowColor: [0.4, 1, 0.4],
    accent: [0.25, 0.75, 0.29],
    speed: 0.4,
    viscosity: 0.8,
    bubbles: 0.35,
    bubbleSize: 1.05,
    clarity: 0.5,
    distortion: 0.8,
    gloss: 0.75,
    emission: 0.1,
    plates: 0,
    crust: 0.45,
    foam: 0,
    iridescence: 0,
    gradient: 0,
    colorRole: "body",
  }),
  [LIQUID_ARCANE]: preset({
    deep: [0.25, 0.05, 0.45],
    body: [0.88, 0.2, 0.85],
    sheen: [1, 0.9, 1],
    glowColor: [0.7, 0.4, 1],
    accent: [0.15, 0.8, 1],
    speed: 0.3,
    viscosity: 0.65,
    bubbles: 0.25,
    bubbleSize: 0.7,
    clarity: 0.45,
    distortion: 0.9,
    gloss: 0.95,
    emission: 0.45,
    plates: 0,
    crust: 0.2,
    foam: 0,
    iridescence: 0,
    gradient: 1,
    colorRole: "body",
  }),
});

export const LIQUID_STYLES = Object.freeze(Object.keys(LIQUID_PRESETS));

/**
 * Preset scaled by the relative sliders (100 = preset value) with the color applied.
 * @param {object} config readConfig() output
 */
export function resolveLiquidLook(config) {
  const base = LIQUID_PRESETS[config?.liquidStyle] ?? LIQUID_PRESETS[LIQUID_LAVA];
  const factor = (value) => clamp(Number.isFinite(Number(value)) ? Number(value) : 100, 0, 300) / 100;
  const look = {
    ...base,
    speed: base.speed * factor(config?.liquidFlow),
    viscosity: clamp(base.viscosity * factor(config?.liquidViscosity), 0.05, 1.5),
    bubbles: clamp(base.bubbles * factor(config?.liquidBubbles), 0, 1),
    emission: clamp(base.emission * factor(config?.liquidGlow), 0, 2),
    distortion: clamp(base.distortion * factor(config?.liquidDistortion), 0, 1.5),
    crust: clamp(base.crust * factor(config?.liquidCrust), 0, 2),
  };
  if (config?.liquidCustomColor) return { ...look, ...customColors(base, colorToRgb(config.liquidColor, base.body)) };
  return look;
}

function customColors(base, color) {
  const deep = color.map((c) => c * 0.28);
  const light = color.map((c) => c + (1 - c) * 0.25);
  if (base.colorRole === "glow") {
    return { body: color, glowColor: light, accent: color.map((c) => c + (1 - c) * 0.45) };
  }
  const accent = base.gradient > 0
    ? [color[2], color[0], color[1]].map((c, i) => (c + color[i]) / 2)
    : color;
  return { deep, body: color, glowColor: light, accent };
}

function preset(values) {
  return Object.freeze(values);
}
