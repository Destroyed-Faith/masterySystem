import {
  EFFECT_CRACKS,
  EFFECT_ICE,
  EFFECT_LIQUID,
  EFFECT_NATURAL_FIRE,
  EFFECT_SMOKE,
  FIRE_STYLE_BALL,
  FREEZE_INSTANT,
  FREEZE_LOOP,
} from "./constants.mjs";

const FIRE_FIELDS = ["fireStyle", "arrangement", "density", "flameScale", "flameSpeed", "emberAmount", "edgeFade"];
const BALL_UNUSED = ["arrangement", "density", "emberAmount", "edgeFade"];
const ICE_FIELDS = ["freezeMode", "freezeDuration", "holdTime", "loopReset", "edgeBias", "crystalSize", "refraction"];
const SMOKE_FIELDS = ["smokeColor", "smokeDensity", "smokeScale", "driftSpeed", "driftDirection", "edgeSoftness"];
const CRACK_FIELDS = [
  "crackMode",
  "crackDuration",
  "crackHold",
  "crackReset",
  "crackOrigin",
  "crackScale",
  "crackWidth",
  "glowColor",
  "glowStrength",
  "shake",
  "dust",
];
const LIQUID_FIELDS = [
  "liquidStyle",
  "liquidFlow",
  "liquidViscosity",
  "liquidBubbles",
  "liquidGlow",
  "liquidDistortion",
  "liquidCrust",
  "liquidCustomColor",
  "liquidColor",
];
const SHARED_FIELDS = ["opacity", "randomSeed"];

/**
 * Names of the `system.*` fields that matter for the current form values.
 * Enabled and Effect Type are always shown and not listed here.
 */
export function visibleFields(values) {
  const effectType = values.effectType;
  if (effectType === EFFECT_NATURAL_FIRE) {
    const unused = values.fireStyle === FIRE_STYLE_BALL ? BALL_UNUSED : [];
    return [...FIRE_FIELDS.filter((name) => !unused.includes(name)), ...SHARED_FIELDS];
  }
  if (effectType === EFFECT_ICE) {
    const unused = [];
    if (values.freezeMode === FREEZE_INSTANT) unused.push("freezeDuration");
    if (values.freezeMode !== FREEZE_LOOP) unused.push("holdTime", "loopReset");
    return [...ICE_FIELDS.filter((name) => !unused.includes(name)), ...SHARED_FIELDS];
  }
  if (effectType === EFFECT_SMOKE) return [...SMOKE_FIELDS, ...SHARED_FIELDS];
  if (effectType === EFFECT_CRACKS) {
    const unused = [];
    if (values.crackMode === FREEZE_INSTANT) unused.push("crackDuration");
    if (values.crackMode !== FREEZE_LOOP) unused.push("crackHold", "crackReset");
    return [...CRACK_FIELDS.filter((name) => !unused.includes(name)), ...SHARED_FIELDS];
  }
  if (effectType === EFFECT_LIQUID) {
    const unused = values.liquidCustomColor ? [] : ["liquidColor"];
    return [...LIQUID_FIELDS.filter((name) => !unused.includes(name)), ...SHARED_FIELDS];
  }
  return [];
}

/** Hide the form rows of fields the chosen effect does not use. Values stay in the form. */
export function applyFieldVisibility(form) {
  const value = (name) => form.querySelector(`[name="system.${name}"]`)?.value ?? "";
  const shown = new Set(visibleFields({
    effectType: value("effectType"),
    fireStyle: value("fireStyle"),
    freezeMode: value("freezeMode"),
    crackMode: value("crackMode"),
    liquidCustomColor: form.querySelector('[name="system.liquidCustomColor"]')?.checked === true,
  }));
  for (const name of [...FIRE_FIELDS, ...ICE_FIELDS, ...SMOKE_FIELDS, ...CRACK_FIELDS, ...LIQUID_FIELDS, ...SHARED_FIELDS]) {
    const input = form.querySelector(`[name="system.${name}"]`);
    const row = input?.closest(".form-group");
    if (row) row.style.display = shown.has(name) ? "" : "none";
  }
}
