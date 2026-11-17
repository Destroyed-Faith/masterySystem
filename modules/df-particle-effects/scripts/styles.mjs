import { EFFECT_NATURAL_FIRE, FIRE_STYLE_AREA, FIRE_STYLE_BALL } from "./constants.mjs";

/**
 * Selectable visual styles per effect type. Every entry here is implemented;
 * candidate references that are not implemented live in the README, not here.
 *
 * `source` names the visual reference. Shadertoy shaders without their own
 * license are CC BY-NC-SA 3.0, so no third-party GLSL is shipped: styles with a
 * source are independently authored to match the reference's look.
 */
export const EFFECT_STYLES = {
  [EFFECT_NATURAL_FIRE]: [
    {
      id: FIRE_STYLE_AREA,
      key: "areaFire",
      source: null,
    },
    {
      id: FIRE_STYLE_BALL,
      key: "ballOfFire",
      source: {
        title: "Ball Of Fire",
        author: "Trisomie21",
        url: "https://www.shadertoy.com/view/lsf3RH",
        license: "CC BY-NC-SA 3.0",
      },
    },
  ],
};

export function stylesFor(effectType) {
  return EFFECT_STYLES[effectType] ?? [];
}

export function findStyle(effectType, styleId) {
  return stylesFor(effectType).find((style) => style.id === styleId) ?? null;
}

/** Unknown or retired style ids fall back to the first style of the effect. */
export function resolveFireStyle(value) {
  return findStyle(EFFECT_NATURAL_FIRE, value)?.id ?? FIRE_STYLE_AREA;
}

export function fireStyleChoices() {
  return Object.fromEntries(
    stylesFor(EFFECT_NATURAL_FIRE).map((style) => [style.id, `DF_PARTICLE_EFFECTS.FIRE_STYLE.${style.key}.label`]),
  );
}
