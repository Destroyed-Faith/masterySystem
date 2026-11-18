import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import {
  EFFECT_ICE,
  FREEZE_INSTANT,
  FREEZE_LOOP,
  FREEZE_ONCE,
  LOOP_RESET_FADE,
  LOOP_RESET_THAW,
} from "../scripts/constants.mjs";
import { applyFieldVisibility, visibleFields } from "../scripts/field-visibility.mjs";
import { computeEdgeDepth, edgeDepthToRgba } from "../scripts/ice-depth.mjs";
import { createIceSurface, ICE_FRAGMENT, textureFrameUv } from "../scripts/ice-surface-shader.mjs";
import { freezeTimeline, freezeTimingSignature, resetDuration } from "../scripts/ice-timeline.mjs";
import { wantedEmberCount, wantedFlameCount } from "../scripts/placement.mjs";
import { readDraft } from "../scripts/preview.mjs";
import { readConfig } from "../scripts/renderer.mjs";
import { resolveSceneBackground } from "../scripts/scene-background.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));

test("instant ice is frozen at once", () => {
  assert.deepEqual(freezeTimeline({ freezeMode: FREEZE_INSTANT }, 0, 0), { progress: 1, fade: 1 });
});

test("freeze once grows over the duration, then stays frozen", () => {
  const config = { freezeMode: FREEZE_ONCE, freezeDuration: 4 };
  assert.equal(freezeTimeline(config, 0, 0).progress, 0);
  const half = freezeTimeline(config, 2, 0).progress;
  assert.ok(half > 0.5 && half < 1, "eases out: more than half done at half time");
  assert.equal(freezeTimeline(config, 4, 0).progress, 1);
  assert.equal(freezeTimeline(config, 400, 0).progress, 1);
  assert.equal(freezeTimeline(config, Infinity, 0).progress, 1, "already frozen after a reload");
});

test("loop freezes, holds, then thaws or fades and starts over", () => {
  const thaw = { freezeMode: FREEZE_LOOP, freezeDuration: 2, holdTime: 3, loopReset: LOOP_RESET_THAW };
  const reset = resetDuration(thaw);
  const cycle = 2 + 3 + reset;
  assert.equal(freezeTimeline(thaw, 0, 0).progress, 0);
  assert.deepEqual(freezeTimeline(thaw, 0, 3), { progress: 1, fade: 1 });
  const thawing = freezeTimeline(thaw, 0, 5 + reset / 2);
  assert.ok(Math.abs(thawing.progress - 0.5) < 1e-9);
  assert.equal(thawing.fade, 1);
  assert.ok(freezeTimeline(thaw, 0, cycle * 7).progress < 1e-9, "the cycle repeats");

  const fading = freezeTimeline({ ...thaw, loopReset: LOOP_RESET_FADE }, 0, 5 + reset / 2);
  assert.equal(fading.progress, 1);
  assert.ok(Math.abs(fading.fade - 0.5) < 1e-9);
});

test("only timing fields replay the freeze in the open sheet", () => {
  const base = { freezeMode: FREEZE_ONCE, freezeDuration: 2, holdTime: 2.5, loopReset: LOOP_RESET_THAW };
  assert.equal(freezeTimingSignature(base), freezeTimingSignature({ ...base, refraction: 90, opacity: 0.2 }));
  assert.notEqual(freezeTimingSignature(base), freezeTimingSignature({ ...base, freezeDuration: 5 }));
});

test("edge depth is 0 outside, low at the edge, 1 deep inside, and holes count as edges", () => {
  const bounds = { x: 0, y: 0, width: 100, height: 100 };
  const inSquare = (x, y) => x > 10 && x < 90 && y > 10 && y < 90;
  const depth = computeEdgeDepth(bounds, inSquare, 50);
  const at = (x, y) => depth.values[Math.floor(y / 2) * depth.width + Math.floor(x / 2)];
  assert.equal(depth.width, 50);
  assert.equal(at(5, 5), 0);
  assert.ok(at(12, 50) < 0.15);
  assert.ok(at(50, 50) > 0.95);

  const withHole = computeEdgeDepth(bounds, (x, y) => inSquare(x, y) && Math.hypot(x - 50, y - 50) > 8, 50);
  const holeAt = (x, y) => withHole.values[Math.floor(y / 2) * withHole.width + Math.floor(x / 2)];
  assert.equal(holeAt(50, 50), 0);
  assert.ok(holeAt(50, 61) < holeAt(50, 70), "depth rises away from the hole");

  const bytes = edgeDepthToRgba(depth);
  assert.equal(bytes.length, depth.width * depth.height * 4);
  assert.equal(bytes[3], 255);
});

test("ice config has safe defaults and clamps", () => {
  const config = readConfig({ system: { effectType: EFFECT_ICE } });
  assert.equal(config.effectType, EFFECT_ICE);
  assert.equal(config.freezeMode, FREEZE_ONCE);
  assert.equal(config.loopReset, LOOP_RESET_THAW);
  assert.equal(config.freezeDuration, 2);
  assert.equal(config.edgeBias, 70);
  assert.equal(config.refraction, 40);

  const odd = readConfig({ system: { freezeMode: "sideways", freezeDuration: 99, crystalSize: 0, refraction: -5 } });
  assert.equal(odd.freezeMode, FREEZE_ONCE);
  assert.equal(odd.freezeDuration, 20);
  assert.equal(odd.crystalSize, 0.25);
  assert.equal(odd.refraction, 0);
});

test("ice places no flame sprites and no embers", () => {
  const config = { ...readConfig({ system: { effectType: EFFECT_ICE, emberAmount: 80 } }), fieldRenderer: "legacy" };
  assert.equal(wantedFlameCount(config, 10000, 100), 0);
  assert.equal(wantedEmberCount(config, 10, 10000, 100), 0);
});

test("the behavior form draft carries the ice fields", () => {
  const values = {
    "system.effectType": EFFECT_ICE,
    "system.freezeMode": FREEZE_LOOP,
    "system.freezeDuration": "3.5",
    "system.holdTime": "1",
    "system.loopReset": LOOP_RESET_FADE,
    "system.edgeBias": "20",
    "system.crystalSize": "1.5",
    "system.refraction": "75",
  };
  const form = {
    querySelector(selector) {
      const name = /name="([^"]+)"/.exec(selector)?.[1];
      return name in values ? { value: values[name], checked: false } : null;
    },
  };
  const draft = readDraft(form).system;
  assert.equal(draft.freezeMode, FREEZE_LOOP);
  assert.equal(draft.freezeDuration, 3.5);
  assert.equal(draft.loopReset, LOOP_RESET_FADE);
  assert.equal(draft.refraction, 75);
});

test("the sheet shows only the fields the chosen effect uses", () => {
  assert.ok(visibleFields({ effectType: "naturalFire", fireStyle: "areaFire" }).includes("density"));
  assert.ok(!visibleFields({ effectType: "naturalFire", fireStyle: "ballOfFire" }).includes("density"));
  assert.ok(!visibleFields({ effectType: "naturalFire" }).includes("freezeMode"));
  assert.deepEqual(visibleFields({ effectType: "none" }), []);

  const once = visibleFields({ effectType: EFFECT_ICE, freezeMode: FREEZE_ONCE });
  assert.ok(once.includes("freezeDuration") && !once.includes("holdTime") && !once.includes("density"));
  assert.ok(!visibleFields({ effectType: EFFECT_ICE, freezeMode: FREEZE_INSTANT }).includes("freezeDuration"));
  const loop = visibleFields({ effectType: EFFECT_ICE, freezeMode: FREEZE_LOOP });
  assert.ok(loop.includes("holdTime") && loop.includes("loopReset"));

  const dom = new JSDOM(`<form>
    <div class="form-group"><select name="system.effectType"><option value="${EFFECT_ICE}" selected></option></select></div>
    <div class="form-group"><select name="system.freezeMode"><option value="${FREEZE_ONCE}" selected></option></select></div>
    <div class="form-group"><input name="system.holdTime" value="2"></div>
    <div class="form-group"><input name="system.density" value="40"></div>
    <div class="form-group"><input name="system.opacity" value="0.9"></div>
  </form>`);
  const formElement = dom.window.document.querySelector("form");
  applyFieldVisibility(formElement);
  const row = (name) => formElement.querySelector(`[name="system.${name}"]`).closest(".form-group").style.display;
  assert.equal(row("holdTime"), "none");
  assert.equal(row("density"), "none");
  assert.equal(row("opacity"), "");
  assert.equal(row("effectType"), "");
});

test("ice fragment is generative, high precision and written for this module", () => {
  assert.match(ICE_FRAGMENT, /precision highp float/);
  assert.match(ICE_FRAGMENT, /uniform float uProgress/);
  assert.match(ICE_FRAGMENT, /uniform sampler2D uDepth/);
  assert.doesNotMatch(ICE_FRAGMENT, /mainImage|iTime|iResolution|iChannel|hash13|snoise|SCREEN_TEXTURE/);
});

function fakePixi() {
  const calls = { destroyedTextures: 0 };
  const PIXI = {
    VERSION: "7.4.3",
    SCALE_MODES: { LINEAR: 1 },
    MIPMAP_MODES: { OFF: 0 },
    Texture: {
      WHITE: { white: true },
      fromBuffer(bytes, width, height) {
        calls.buffer = { bytes, width, height };
        return { destroy: () => { calls.destroyedTextures += 1; } };
      },
    },
    MeshGeometry: class {},
    Mesh: class {
      constructor(geometry, shader) {
        this.shader = shader;
        this.position = { set: (x, y) => Object.assign(this, { x, y }) };
      }
      destroy() {
        this.destroyed = true;
      }
    },
    Shader: {
      from(vertex, fragment, uniforms) {
        calls.fragment = fragment;
        return { uniforms };
      },
    },
  };
  return { PIXI, calls };
}

test("createIceSurface uploads the edge map and refracts a background when given one", () => {
  const { PIXI, calls } = fakePixi();
  const bounds = { x: 10, y: 20, width: 100, height: 50 };
  const depth = computeEdgeDepth(bounds, () => true, 20);
  const background = {
    texture: { frame: { x: 0, y: 0, width: 2000, height: 1000 }, baseTexture: { width: 2000, height: 1000 } },
    rect: { x: 0, y: 0, width: 2000, height: 1000 },
  };
  const surface = createIceSurface(PIXI, bounds, depth, background);
  assert.equal(calls.fragment, ICE_FRAGMENT);
  assert.equal(calls.buffer.width, depth.width);
  assert.equal(surface.refracts, true);
  assert.equal(surface.display.x, 10);
  assert.equal(surface.display.shader.uniforms.uHasBackground, 1);
  assert.equal(surface.display.shader.uniforms.uBackground, background.texture);
  surface.update({
    time: 1, opacity: 0.5, progress: 0.3, fade: 1, edgeBias: 0.7, crystal: 1, refraction: 0.4,
    seed: 0.2, cellSize: 100, worldMinX: 10, worldMinY: 20, worldWidth: 100, worldHeight: 50,
  });
  assert.equal(surface.display.shader.uniforms.uProgress, 0.3);
  surface.destroy();
  assert.equal(surface.display.destroyed, true);
  assert.equal(calls.destroyedTextures, 1);

  const plain = createIceSurface(fakePixi().PIXI, bounds, depth, null);
  assert.equal(plain.refracts, false);
  assert.equal(plain.display.shader.uniforms.uHasBackground, 0);
});

test("scene background is found on the primary group and skipped while not loaded", () => {
  const PIXI = { Texture: { EMPTY: {}, WHITE: {} }, utils: { TextureCache: {} } };
  const texture = { baseTexture: { valid: true }, frame: { width: 4000, height: 3000 } };
  const canvasRef = {
    dimensions: { sceneRect: { x: 250, y: 200, width: 4000, height: 3000 } },
    primary: { background: { texture } },
  };
  assert.deepEqual(resolveSceneBackground(canvasRef, PIXI), { texture, rect: { x: 250, y: 200, width: 4000, height: 3000 } });
  const loading = { ...canvasRef, primary: { background: { texture: { ...texture, baseTexture: { valid: false } } } } };
  assert.equal(resolveSceneBackground(loading, PIXI), null);
  assert.equal(resolveSceneBackground({ ...canvasRef, primary: { background: { texture: PIXI.Texture.EMPTY } } }, PIXI), null);
  assert.deepEqual(textureFrameUv({ frame: { x: 100, y: 0, width: 400, height: 200 }, baseTexture: { width: 800, height: 400 } }), [0.125, 0, 0.5, 0.5]);
});

test("ice labels exist in both languages and the system copy matches the module", () => {
  for (const lang of ["en", "de"]) {
    const moduleLang = JSON.parse(fs.readFileSync(path.join(here, "..", "lang", `${lang}.json`), "utf8"));
    const rootLang = JSON.parse(fs.readFileSync(path.join(here, "..", "..", "..", "lang", `${lang}.json`), "utf8"));
    const text = moduleLang.DF_PARTICLE_EFFECTS;
    assert.ok(text.EFFECTS.ice);
    for (const mode of [FREEZE_ONCE, FREEZE_INSTANT, FREEZE_LOOP]) assert.ok(text.FREEZE_MODE[mode]);
    for (const reset of [LOOP_RESET_THAW, LOOP_RESET_FADE]) assert.ok(text.LOOP_RESET[reset]);
    for (const field of ["freezeMode", "freezeDuration", "holdTime", "loopReset", "edgeBias", "crystalSize", "refraction"]) {
      assert.ok(text.FIELDS[field]?.label && text.FIELDS[field]?.hint, `${lang} ${field}`);
    }
    assert.deepEqual(rootLang.DF_PARTICLE_EFFECTS, text);
  }
});
