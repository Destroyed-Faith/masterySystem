import { BEHAVIOR_TYPE, TYPE_LABEL_KEY } from "./constants.mjs";
import { registerBehaviorType } from "./region-behavior.mjs";
import { ParticleRenderer, registerSettings } from "./renderer.mjs";

const renderer = new ParticleRenderer();

Hooks.once("init", () => {
  registerBehaviorType();
  registerSettings(renderer);

  Hooks.on("canvasReady", () => renderer.syncScene());
  Hooks.on("canvasTearDown", () => renderer.clear());
  Hooks.on("createRegionBehavior", (behavior) => renderer.onBehaviorUpsert(behavior));
  Hooks.on("updateRegionBehavior", (behavior) => renderer.onBehaviorUpsert(behavior));
  Hooks.on("deleteRegionBehavior", (behavior) => renderer.onBehaviorDelete(behavior));
  Hooks.on("updateRegion", (region, changes) => {
    if (!changes) return;
    if ("shapes" in changes || "elevation" in changes) renderer.onRegionGeometry(region);
  });
  Hooks.on("deleteRegion", (region) => renderer.onRegionDelete(region));
  Hooks.on("updateScene", (scene, changes) => {
    if (changes?.grid) renderer.onRegionGeometry({ parent: scene });
  });
});

Hooks.on("ready", () => {
  const config = globalThis.CONFIG?.RegionBehavior;
  if (!config) return;
  const label = globalThis.game?.i18n?.localize?.(TYPE_LABEL_KEY);
  if (config.typeLabels && label && label !== TYPE_LABEL_KEY) config.typeLabels[BEHAVIOR_TYPE] = label;
  const hint = globalThis.game?.i18n?.localize?.("DF_PARTICLE_EFFECTS.TypeHint");
  if (config.typeHints && hint && hint !== "DF_PARTICLE_EFFECTS.TypeHint") config.typeHints[BEHAVIOR_TYPE] = hint;
});
