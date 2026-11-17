import { behaviorTypeId, hostedBySystem, SYSTEM_ID } from "./constants.mjs";
import { applyBehaviorLabels, registerBehaviorType } from "./region-behavior.mjs";
import { ParticleRenderer, registerSettings } from "./renderer.mjs";
import { registerPreview } from "./preview.mjs";

const renderer = new ParticleRenderer();

Hooks.once("init", () => {
  if (skipBecauseSystemProvidesIt()) return;
  const registered = registerBehaviorType();
  if (registered) {
    console.info(`df-particle-effects | registered region behavior "${behaviorTypeId()}"`);
  }
  registerSettings(renderer);
  registerPreview(renderer);

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
  if (skipBecauseSystemProvidesIt()) return;
  applyBehaviorLabels();
});

function skipBecauseSystemProvidesIt() {
  if (hostedBySystem()) return false;
  const system = globalThis.game?.system;
  if (system?.id !== SYSTEM_ID) return false;
  return globalThis.foundry?.utils?.isNewerVersion?.(system.version, "0.9.723") === true;
}
