import { behaviorTypeId, hostedBySystem, SYSTEM_ID, typeLabelKey } from "./constants.mjs";
import { registerBehaviorType } from "./region-behavior.mjs";
import { ParticleRenderer, registerSettings } from "./renderer.mjs";

const renderer = new ParticleRenderer();

Hooks.once("init", () => {
  if (skipBecauseSystemProvidesIt()) return;
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
  if (skipBecauseSystemProvidesIt()) return;
  const labelKey = typeLabelKey();
  const behaviorType = behaviorTypeId();
  const label = globalThis.game?.i18n?.localize?.(labelKey);
  if (config.typeLabels && label && label !== labelKey) config.typeLabels[behaviorType] = label;
  const hint = globalThis.game?.i18n?.localize?.("DF_PARTICLE_EFFECTS.TypeHint");
  if (config.typeHints && hint && hint !== "DF_PARTICLE_EFFECTS.TypeHint") config.typeHints[behaviorType] = hint;
});

function skipBecauseSystemProvidesIt() {
  if (hostedBySystem()) return false;
  const system = globalThis.game?.system;
  if (system?.id !== SYSTEM_ID) return false;
  return globalThis.foundry?.utils?.isNewerVersion?.(system.version, "0.9.723") === true;
}
