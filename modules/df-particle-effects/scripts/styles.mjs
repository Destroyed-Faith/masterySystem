import { EFFECT_NATURAL_FIRE, FIRE_STYLE_AREA, FIRE_STYLE_BALL } from "./constants.mjs";

/** Selectable visual styles per effect type. Only implemented styles belong here. */
export const EFFECT_STYLES = {
  [EFFECT_NATURAL_FIRE]: [
    { id: FIRE_STYLE_AREA, key: "areaFire" },
    { id: FIRE_STYLE_BALL, key: "ballOfFire" },
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
