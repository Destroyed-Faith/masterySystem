import { behaviorTypeId, EFFECT_NATURAL_FIRE } from "./constants.mjs";

/**
 * While the behavior sheet is open, mirror its fields onto the map.
 * Nothing is written. Closing the sheet drops the preview.
 */
export function registerPreview(renderer) {
  const HooksApi = globalThis.Hooks;
  if (!HooksApi) return;

  HooksApi.on("renderRegionBehaviorConfig", (app) => {
    const behavior = app?.document;
    if (!isParticleBehavior(behavior)) return;
    const form = findForm(app);
    if (!form) return;
    const apply = () => renderer.setPreview(behavior, readDraft(form));
    if (form.dataset.dfFirePreview !== "1") {
      form.dataset.dfFirePreview = "1";
      let timer = 0;
      const schedule = () => {
        globalThis.clearTimeout(timer);
        timer = globalThis.setTimeout(apply, 70);
      };
      form.addEventListener("input", schedule);
      form.addEventListener("change", schedule);
    }
    apply();
  });

  HooksApi.on("closeRegionBehaviorConfig", (app) => {
    const behavior = app?.document;
    if (!isParticleBehavior(behavior)) return;
    renderer.clearPreview(behavior);
  });
}

function isParticleBehavior(behavior) {
  return behavior?.type === behaviorTypeId();
}

function findForm(app) {
  const form = app?.form;
  if (form?.tagName === "FORM") return form;
  const element = app?.element;
  if (element?.tagName === "FORM") return element;
  return element?.querySelector?.("form") ?? null;
}

export function readDraft(form) {
  return {
    disabled: checked(form, "disabled"),
    system: {
      enabled: checked(form, "system.enabled", true),
      effectType: text(form, "system.effectType") || EFFECT_NATURAL_FIRE,
      arrangement: text(form, "system.arrangement") || "field",
      density: numberValue(form, "system.density", 40),
      flameScale: numberValue(form, "system.flameScale", 1),
      flameSpeed: numberValue(form, "system.flameSpeed", 1),
      opacity: numberValue(form, "system.opacity", 0.9),
      emberAmount: numberValue(form, "system.emberAmount", 20),
      edgeFade: numberValue(form, "system.edgeFade", 5),
      randomSeed: text(form, "system.randomSeed"),
    },
  };
}

function field(form, name) {
  return form?.querySelector?.(`[name="${name}"]`) ?? null;
}

function checked(form, name, fallback = false) {
  const element = field(form, name);
  if (!element) return fallback;
  return element.checked === true;
}

function text(form, name) {
  const element = field(form, name);
  return element ? String(element.value ?? "") : "";
}

function numberValue(form, name, fallback) {
  const element = field(form, name);
  if (!element) return fallback;
  const number = Number(element.value);
  return Number.isFinite(number) ? number : fallback;
}
