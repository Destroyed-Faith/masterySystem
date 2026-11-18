import {
  EFFECT_CRACKS,
  EFFECT_ICE,
  EFFECT_LIQUID,
  EFFECT_NATURAL_FIRE,
  EFFECT_SMOKE,
  FIRE_STYLE_BALL,
  FREEZE_INSTANT,
  FREEZE_LOOP,
  EFFECT_RESTRAINT,
  RESTRAINT_CHAINS,
  RESTRAINT_ROPE,
  RESTRAINT_SERPENT,
  RESTRAINT_VINES,
  RESTRAINT_WEB,
  STRAND_MOTION_STATIC,
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
const RESTRAINT_FIELDS = [
  "restraintStyle",
  "restraintCustomColor",
  "restraintColor",
  "restraintAnimation",
  "restraintThickness",
  "restraintDensity",
  "webRadials",
  "webRings",
  "vineVariation",
  "vineTwist",
  "vineThorns",
  "strandCount",
  "strandLayout",
  "strandMotion",
  "chainWeight",
  "serpentCount",
  "serpentMotion",
  "serpentScales",
];
/** Restraint fields each style uses, besides style, color and thickness. */
const RESTRAINT_STYLE_FIELDS = {
  [RESTRAINT_WEB]: ["webRadials", "webRings", "restraintDensity", "restraintAnimation"],
  [RESTRAINT_VINES]: ["restraintDensity", "vineVariation", "vineTwist", "vineThorns", "restraintAnimation"],
  [RESTRAINT_ROPE]: ["strandCount", "strandLayout", "strandMotion", "restraintAnimation"],
  [RESTRAINT_CHAINS]: ["strandCount", "strandLayout", "strandMotion", "chainWeight", "restraintAnimation"],
  [RESTRAINT_SERPENT]: ["serpentCount", "serpentMotion", "serpentScales", "restraintAnimation"],
};
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
  if (effectType === EFFECT_RESTRAINT) {
    const style = RESTRAINT_STYLE_FIELDS[values.restraintStyle] ? values.restraintStyle : RESTRAINT_WEB;
    const used = new Set(["restraintStyle", "restraintCustomColor", "restraintThickness", ...RESTRAINT_STYLE_FIELDS[style]]);
    if (values.restraintCustomColor) used.add("restraintColor");
    const strands = style === RESTRAINT_ROPE || style === RESTRAINT_CHAINS;
    if (strands && values.strandMotion === STRAND_MOTION_STATIC) used.delete("restraintAnimation");
    return [...RESTRAINT_FIELDS.filter((name) => used.has(name)), ...SHARED_FIELDS];
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
    restraintStyle: value("restraintStyle"),
    restraintCustomColor: form.querySelector('[name="system.restraintCustomColor"]')?.checked === true,
    strandMotion: value("strandMotion"),
  }));
  const all = [...FIRE_FIELDS, ...ICE_FIELDS, ...SMOKE_FIELDS, ...CRACK_FIELDS, ...LIQUID_FIELDS, ...RESTRAINT_FIELDS, ...SHARED_FIELDS];
  for (const name of all) {
    const input = form.querySelector(`[name="system.${name}"]`);
    const row = input?.closest(".form-group");
    if (row) row.style.display = shown.has(name) ? "" : "none";
  }
}
