import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { EFFECT_SMOKE, SMOKE_DEFAULT_COLOR } from "../scripts/constants.mjs";
import { visibleFields } from "../scripts/field-visibility.mjs";
import { computeEdgeDepth } from "../scripts/ice-depth.mjs";
import { wantedEmberCount, wantedFlameCount } from "../scripts/placement.mjs";
import { readDraft } from "../scripts/preview.mjs";
import { readConfig } from "../scripts/renderer.mjs";
import { colorToRgb, createSmokeSurface, driftVector, SMOKE_FRAGMENT } from "../scripts/smoke-surface-shader.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));

test("smoke config has safe defaults and accepts Foundry colors", () => {
  const config = readConfig({ system: { effectType: EFFECT_SMOKE } });
  assert.equal(config.effectType, EFFECT_SMOKE);
  assert.equal(config.smokeColor, SMOKE_DEFAULT_COLOR);
  assert.equal(config.smokeDensity, 60);
  assert.equal(config.driftDirection, 90);
  assert.equal(config.edgeSoftness, 1);

  assert.equal(readConfig({ system: { smokeColor: "#40FF20" } }).smokeColor, "#40ff20");
  assert.equal(readConfig({ system: { smokeColor: new Number(0x336699) } }).smokeColor, "#336699");
  assert.equal(readConfig({ system: { smokeColor: "green" } }).smokeColor, SMOKE_DEFAULT_COLOR);
  assert.equal(readConfig({ system: { driftDirection: 720, smokeScale: 9 } }).driftDirection, 360);
});

test("smoke colors become 0-1 RGB", () => {
  assert.deepEqual(colorToRgb("#ff0000"), [1, 0, 0]);
  assert.deepEqual(colorToRgb(0x0000ff), [0, 0, 1]);
  assert.deepEqual(colorToRgb("nope", [0.5, 0.5, 0.5]), [0.5, 0.5, 0.5]);
});

test("drift direction is a compass: 0 up, 90 right; the flow vector points against the motion", () => {
  const [upX, upY] = driftVector(0);
  assert.ok(Math.abs(upX) < 1e-12 && upY > 0, "pattern samples ahead below, so it moves up");
  const [rightX, rightY] = driftVector(90);
  assert.ok(rightX < 0 && Math.abs(rightY) < 1e-12);
});

test("smoke places no flame sprites and no embers", () => {
  const config = { ...readConfig({ system: { effectType: EFFECT_SMOKE, emberAmount: 80 } }), fieldRenderer: "legacy" };
  assert.equal(wantedFlameCount(config, 10000, 100), 0);
  assert.equal(wantedEmberCount(config, 10, 10000, 100), 0);
  assert.ok(wantedFlameCount({ ...config, effectType: undefined }, 10000, 100) > 0, "older fire behaviors still burn");
});

test("the sheet shows the smoke fields for smoke only", () => {
  const smoke = visibleFields({ effectType: EFFECT_SMOKE });
  for (const name of ["smokeColor", "smokeDensity", "smokeScale", "driftSpeed", "driftDirection", "edgeSoftness", "opacity"]) {
    assert.ok(smoke.includes(name), name);
  }
  assert.ok(!smoke.includes("density") && !smoke.includes("freezeMode"));
  assert.ok(!visibleFields({ effectType: "ice" }).includes("smokeColor"));
});

test("the behavior form draft carries the smoke fields", () => {
  const values = { "system.effectType": EFFECT_SMOKE, "system.smokeColor": "#55aa33", "system.driftDirection": "180" };
  const form = {
    querySelector(selector) {
      const name = /name="([^"]+)"/.exec(selector)?.[1];
      return name in values ? { value: values[name], checked: false } : null;
    },
  };
  const draft = readDraft(form).system;
  assert.equal(draft.smokeColor, "#55aa33");
  assert.equal(draft.driftDirection, 180);
  assert.equal(draft.smokeDensity, 60);
});

test("smoke fragment is generative and written for this module", () => {
  assert.match(SMOKE_FRAGMENT, /precision highp float/);
  assert.match(SMOKE_FRAGMENT, /uniform sampler2D uDepth/);
  assert.doesNotMatch(SMOKE_FRAGMENT, /mainImage|iTime|iResolution|iChannel|noise_texture|SCREEN_TEXTURE|43758/);
});

test("createSmokeSurface sizes the edge fade from the region depth", () => {
  const calls = {};
  const PIXI = {
    VERSION: "7.4.3",
    Texture: { fromBuffer: () => ({ destroy: () => { calls.textureDestroyed = true; } }) },
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
  const bounds = { x: 0, y: 0, width: 400, height: 200 };
  const depth = computeEdgeDepth(bounds, () => true, 40);
  assert.ok(Math.abs(depth.maxDistance - 100) < 10, "a 400×200 box is about 100 px deep");
  const surface = createSmokeSurface(PIXI, bounds, depth);
  assert.equal(surface.display.shader.fragment, SMOKE_FRAGMENT);
  assert.equal(surface.display.shader.uniforms.uDepthRange, depth.maxDistance);
  surface.update({
    time: 2, opacity: 0.5, color: [1, 0, 0], density: 0.4, scale: 1, drift: [0.1, 0], edgeSoftness: 2,
    seed: 0.1, cellSize: 100, worldMinX: 0, worldMinY: 0, worldWidth: 400, worldHeight: 200,
  });
  assert.equal(surface.display.shader.uniforms.uColor[0], 1);
  assert.equal(surface.display.shader.uniforms.uDrift[0], Math.fround(0.1));
  surface.destroy();
  assert.equal(calls.textureDestroyed, true);
});

test("smoke labels exist in both languages and the system copy matches the module", () => {
  for (const lang of ["en", "de"]) {
    const moduleLang = JSON.parse(fs.readFileSync(path.join(here, "..", "lang", `${lang}.json`), "utf8"));
    const rootLang = JSON.parse(fs.readFileSync(path.join(here, "..", "..", "..", "lang", `${lang}.json`), "utf8"));
    const text = moduleLang.DF_PARTICLE_EFFECTS;
    assert.ok(text.EFFECTS.smoke);
    for (const field of ["smokeColor", "smokeDensity", "smokeScale", "driftSpeed", "driftDirection", "edgeSoftness"]) {
      assert.ok(text.FIELDS[field]?.label && text.FIELDS[field]?.hint, `${lang} ${field}`);
    }
    assert.deepEqual(rootLang.DF_PARTICLE_EFFECTS, text);
  }
});
