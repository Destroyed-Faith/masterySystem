import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import {
  EFFECT_LIQUID,
  LIQUID_ACID,
  LIQUID_ARCANE,
  LIQUID_DEFAULT_COLOR,
  LIQUID_LAVA,
  LIQUID_SLIME,
  LIQUID_TAR,
} from "../scripts/constants.mjs";
import { CRACK_FRAGMENT } from "../scripts/crack-surface-shader.mjs";
import { applyFieldVisibility, visibleFields } from "../scripts/field-visibility.mjs";
import { computeEdgeDepth } from "../scripts/ice-depth.mjs";
import { LIQUID_PRESETS, LIQUID_STYLES, resolveLiquidLook } from "../scripts/liquid-presets.mjs";
import { createLiquidSurface, LIQUID_FRAGMENT } from "../scripts/liquid-surface-shader.mjs";
import { wantedEmberCount, wantedFlameCount } from "../scripts/placement.mjs";
import { readDraft } from "../scripts/preview.mjs";
import { readConfig } from "../scripts/renderer.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));

test("there are exactly the five planned styles", () => {
  assert.deepEqual([...LIQUID_STYLES].sort(), [LIQUID_ACID, LIQUID_ARCANE, LIQUID_LAVA, LIQUID_SLIME, LIQUID_TAR].sort());
});

test("viscous config has safe defaults and clamps", () => {
  const config = readConfig({ system: { effectType: EFFECT_LIQUID } });
  assert.equal(config.effectType, EFFECT_LIQUID);
  assert.equal(config.liquidStyle, LIQUID_LAVA);
  for (const key of ["liquidFlow", "liquidViscosity", "liquidBubbles", "liquidGlow", "liquidDistortion", "liquidCrust"]) {
    assert.equal(config[key], 100, key);
  }
  assert.equal(config.liquidCustomColor, false);
  assert.equal(config.liquidColor, LIQUID_DEFAULT_COLOR);

  const odd = readConfig({ system: { liquidStyle: "honey", liquidFlow: 900, liquidGlow: -4, liquidCustomColor: "yes", liquidColor: "blue" } });
  assert.equal(odd.liquidStyle, LIQUID_LAVA);
  assert.equal(odd.liquidFlow, 300);
  assert.equal(odd.liquidGlow, 0);
  assert.equal(odd.liquidCustomColor, false);
  assert.equal(odd.liquidColor, LIQUID_DEFAULT_COLOR);
});

test("sliders at 100 % give the preset, other values scale it", () => {
  for (const style of LIQUID_STYLES) {
    const look = resolveLiquidLook(readConfig({ system: { effectType: EFFECT_LIQUID, liquidStyle: style } }));
    const preset = LIQUID_PRESETS[style];
    for (const key of ["speed", "viscosity", "bubbles", "emission", "distortion", "crust", "body", "deep"]) {
      assert.deepEqual(look[key], preset[key], `${style} ${key}`);
    }
  }
  const tar = LIQUID_PRESETS[LIQUID_TAR];
  const scaled = resolveLiquidLook({ liquidStyle: LIQUID_TAR, liquidFlow: 200, liquidBubbles: 0, liquidGlow: 300 });
  assert.equal(scaled.speed, tar.speed * 2);
  assert.equal(scaled.bubbles, 0);
  assert.ok(Math.abs(scaled.emission - tar.emission * 3) < 1e-12);
  assert.equal(resolveLiquidLook({ liquidStyle: LIQUID_ACID, liquidBubbles: 300 }).bubbles, 1, "capped");
});

test("the styles keep their character", () => {
  const [tar, lava, acid, slime, arcane] = [LIQUID_TAR, LIQUID_LAVA, LIQUID_ACID, LIQUID_SLIME, LIQUID_ARCANE].map((s) => LIQUID_PRESETS[s]);
  assert.ok(Math.max(...tar.body) < 0.1 && tar.emission < 0.1 && tar.viscosity > 0.9, "tar is dark, dull and thick");
  assert.ok(lava.emission >= 1 && lava.plates > 0.5, "lava glows between crust plates");
  assert.ok(acid.body[1] > acid.body[0] && acid.body[1] > acid.body[2] && acid.clarity > 0 && acid.bubbles > 0.5);
  assert.ok(slime.clarity >= 0.5 && slime.distortion >= 0.8 && slime.bubbleSize > 0.6);
  assert.ok(arcane.gradient > 0 && arcane.distortion > slime.distortion * 0.9 && arcane.gloss > 0.9);
});

test("a custom color replaces the style color; for lava it colors the glow and keeps the dark crust", () => {
  const slime = resolveLiquidLook({ liquidStyle: LIQUID_SLIME, liquidCustomColor: true, liquidColor: "#ff0000" });
  assert.deepEqual(slime.body, [1, 0, 0]);
  assert.ok(slime.deep[0] < 0.5 && slime.deep[1] === 0);
  const lava = resolveLiquidLook({ liquidStyle: LIQUID_LAVA, liquidCustomColor: true, liquidColor: "#0000ff" });
  assert.deepEqual(lava.body, [0, 0, 1]);
  assert.deepEqual(lava.deep, LIQUID_PRESETS[LIQUID_LAVA].deep);
  assert.ok(lava.glowColor[2] === 1);
  const off = resolveLiquidLook({ liquidStyle: LIQUID_SLIME, liquidCustomColor: false, liquidColor: "#ff0000" });
  assert.deepEqual(off.body, LIQUID_PRESETS[LIQUID_SLIME].body);
});

test("liquids place no flame sprites and no embers", () => {
  const config = { ...readConfig({ system: { effectType: EFFECT_LIQUID, emberAmount: 80 } }), fieldRenderer: "legacy" };
  assert.equal(wantedFlameCount(config, 10000, 100), 0);
  assert.equal(wantedEmberCount(config, 10, 10000, 100), 0);
});

test("the sheet shows the liquid fields, and the color only with Custom Color", () => {
  const plain = visibleFields({ effectType: EFFECT_LIQUID, liquidCustomColor: false });
  for (const name of ["liquidStyle", "liquidFlow", "liquidViscosity", "liquidBubbles", "liquidGlow", "liquidDistortion", "liquidCrust", "liquidCustomColor", "opacity"]) {
    assert.ok(plain.includes(name), name);
  }
  assert.ok(!plain.includes("liquidColor") && !plain.includes("glowColor") && !plain.includes("smokeColor"));
  assert.ok(visibleFields({ effectType: EFFECT_LIQUID, liquidCustomColor: true }).includes("liquidColor"));
  assert.ok(!visibleFields({ effectType: "smoke" }).includes("liquidStyle"));

  const dom = new JSDOM(`<form>
    <div class="form-group"><select name="system.effectType"><option value="${EFFECT_LIQUID}" selected></option></select></div>
    <div class="form-group"><input type="checkbox" name="system.liquidCustomColor"></div>
    <div class="form-group"><input name="system.liquidColor" value="#ff0000"></div>
    <div class="form-group"><input name="system.liquidFlow" value="100"></div>
  </form>`);
  const form = dom.window.document.querySelector("form");
  const row = (name) => form.querySelector(`[name="system.${name}"]`).closest(".form-group").style.display;
  applyFieldVisibility(form);
  assert.equal(row("liquidColor"), "none");
  assert.equal(row("liquidFlow"), "");
  form.querySelector('[name="system.liquidCustomColor"]').checked = true;
  applyFieldVisibility(form);
  assert.equal(row("liquidColor"), "");
});

test("the behavior form draft carries the liquid fields", () => {
  const values = {
    "system.effectType": { value: EFFECT_LIQUID },
    "system.liquidStyle": { value: LIQUID_ARCANE },
    "system.liquidFlow": { value: "150" },
    "system.liquidCustomColor": { value: "on", checked: true },
    "system.liquidColor": { value: "#123456" },
  };
  const form = {
    querySelector(selector) {
      const name = /name="([^"]+)"/.exec(selector)?.[1];
      return values[name] ?? null;
    },
  };
  const draft = readDraft(form).system;
  assert.equal(draft.liquidStyle, LIQUID_ARCANE);
  assert.equal(draft.liquidFlow, 150);
  assert.equal(draft.liquidCustomColor, true);
  assert.equal(draft.liquidColor, "#123456");
  assert.equal(draft.liquidCrust, 100);
});

test("liquid fragment is generative, high precision and shares the plate helper with the cracks", () => {
  assert.match(LIQUID_FRAGMENT, /precision highp float/);
  assert.match(LIQUID_FRAGMENT, /uniform sampler2D uDepth/);
  assert.doesNotMatch(LIQUID_FRAGMENT, /mainImage|iTime|iResolution|iChannel|SCREEN_TEXTURE|TIME|43758/);
  assert.match(LIQUID_FRAGMENT, /vec2 plateBorder\(vec2 p\)/);
  assert.match(CRACK_FRAGMENT, /vec2 plateBorder\(vec2 p\)/);
});

test("createLiquidSurface feeds the resolved look into its uniforms", () => {
  const calls = { destroyedTextures: 0 };
  const PIXI = {
    VERSION: "7.4.3",
    Texture: { WHITE: { white: true }, fromBuffer: () => ({ destroy: () => { calls.destroyedTextures += 1; } }) },
    MeshGeometry: class {},
    Mesh: class {
      constructor(geometry, shader) {
        this.shader = shader;
        this.position = { set: () => {} };
      }
      destroy() {
        this.destroyed = true;
      }
    },
    Shader: { from: (vertex, fragment, uniforms) => ({ fragment, uniforms }) },
  };
  const bounds = { x: 0, y: 0, width: 200, height: 200 };
  const depth = computeEdgeDepth(bounds, () => true, 20);
  const surface = createLiquidSurface(PIXI, bounds, depth, null);
  assert.equal(surface.refracts, false);
  const look = resolveLiquidLook({ liquidStyle: LIQUID_LAVA });
  surface.update({ time: 1, opacity: 0.8, look, seed: 0.3, cellSize: 100, worldMinX: 0, worldMinY: 0, worldWidth: 200, worldHeight: 200 });
  const uniforms = surface.display.shader.uniforms;
  assert.equal(uniforms.uPlates, look.plates);
  assert.equal(uniforms.uGlow, look.emission);
  assert.equal(uniforms.uBody[0], Math.fround(look.body[0]));
  assert.equal(uniforms.uDepthRange, depth.maxDistance);
  surface.destroy();
  assert.equal(calls.destroyedTextures, 1);
});

test("liquid labels exist in both languages and the system copy matches the module", () => {
  for (const lang of ["en", "de"]) {
    const moduleLang = JSON.parse(fs.readFileSync(path.join(here, "..", "lang", `${lang}.json`), "utf8"));
    const rootLang = JSON.parse(fs.readFileSync(path.join(here, "..", "..", "..", "lang", `${lang}.json`), "utf8"));
    const text = moduleLang.DF_PARTICLE_EFFECTS;
    assert.ok(text.EFFECTS.viscous);
    for (const style of LIQUID_STYLES) assert.ok(text.LIQUID_STYLE[style], `${lang} ${style}`);
    for (const field of ["liquidStyle", "liquidFlow", "liquidViscosity", "liquidBubbles", "liquidGlow", "liquidDistortion", "liquidCrust", "liquidCustomColor", "liquidColor"]) {
      assert.ok(text.FIELDS[field]?.label && text.FIELDS[field]?.hint, `${lang} ${field}`);
    }
    assert.deepEqual(rootLang.DF_PARTICLE_EFFECTS, text);
  }
});
