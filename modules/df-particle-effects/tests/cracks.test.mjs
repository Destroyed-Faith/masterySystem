import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  CRACK_DEFAULT_GLOW,
  CRACK_ORIGIN_CENTER,
  CRACK_ORIGIN_SCATTERED,
  CRACK_RESET_CLOSE,
  EFFECT_CRACKS,
  FREEZE_INSTANT,
  FREEZE_LOOP,
  FREEZE_ONCE,
  LOOP_RESET_FADE,
} from "../scripts/constants.mjs";
import { CRACK_FRAGMENT, createCrackSurface, shakeOffset } from "../scripts/crack-surface-shader.mjs";
import { visibleFields } from "../scripts/field-visibility.mjs";
import { computeEdgeDepth } from "../scripts/ice-depth.mjs";
import { wantedEmberCount, wantedFlameCount } from "../scripts/placement.mjs";
import { readDraft } from "../scripts/preview.mjs";
import { readConfig } from "../scripts/renderer.mjs";
import { crackTimeline, crackTimingSignature, freezeTimeline } from "../scripts/timeline.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));

test("crack config has safe defaults and clamps", () => {
  const config = readConfig({ system: { effectType: EFFECT_CRACKS } });
  assert.equal(config.effectType, EFFECT_CRACKS);
  assert.equal(config.crackMode, FREEZE_ONCE);
  assert.equal(config.crackDuration, 1.5);
  assert.equal(config.crackReset, CRACK_RESET_CLOSE);
  assert.equal(config.crackOrigin, CRACK_ORIGIN_CENTER);
  assert.equal(config.glowColor, CRACK_DEFAULT_GLOW);
  assert.equal(config.glowStrength, 60);
  assert.equal(config.shake, 30);
  assert.equal(config.dust, 40);

  const odd = readConfig({ system: { crackMode: "up", crackOrigin: "moon", crackWidth: 9, shake: -3, glowColor: "red" } });
  assert.equal(odd.crackMode, FREEZE_ONCE);
  assert.equal(odd.crackOrigin, CRACK_ORIGIN_CENTER);
  assert.equal(odd.crackWidth, 3);
  assert.equal(odd.shake, 0);
  assert.equal(odd.glowColor, CRACK_DEFAULT_GLOW);
});

test("cracks open once, shake while breaking and stop shaking shortly after", () => {
  const config = { crackMode: FREEZE_ONCE, crackDuration: 2 };
  const start = crackTimeline(config, 0, 0);
  assert.equal(start.progress, 0);
  assert.equal(start.quake, 1);
  assert.equal(crackTimeline(config, 2.3, 0).progress, 1);
  const tail = crackTimeline(config, 2.3, 0).quake;
  assert.ok(tail > 0 && tail < 1, "the shake dies out after the break");
  assert.equal(crackTimeline(config, 10, 0).quake, 0);
  assert.deepEqual(crackTimeline(config, Infinity, 0), { progress: 1, fade: 1, quake: 0 }, "already broken after a reload");
  assert.deepEqual(crackTimeline({ crackMode: FREEZE_INSTANT }, 0, 0), { progress: 1, fade: 1, quake: 0 });
});

test("looping cracks close back or fade, and their timing is independent of the ice fields", () => {
  const close = { crackMode: FREEZE_LOOP, crackDuration: 2, crackHold: 3, crackReset: CRACK_RESET_CLOSE };
  const reset = 0.8;
  const closing = crackTimeline(close, 0, 5 + reset / 2);
  assert.ok(Math.abs(closing.progress - 0.5) < 1e-9);
  assert.equal(closing.fade, 1);
  const fading = crackTimeline({ ...close, crackReset: LOOP_RESET_FADE }, 0, 5 + reset / 2);
  assert.equal(fading.progress, 1);
  assert.ok(Math.abs(fading.fade - 0.5) < 1e-9);

  const mixed = { ...close, freezeMode: FREEZE_INSTANT };
  assert.equal(crackTimeline(mixed, 0, 1).progress < 1, true);
  assert.deepEqual(freezeTimeline(mixed, 0, 1), { progress: 1, fade: 1 });
  assert.notEqual(crackTimingSignature(close), crackTimingSignature({ ...close, crackDuration: 4 }));
  assert.equal(crackTimingSignature(close), crackTimingSignature({ ...close, glowStrength: 10, shake: 90 }));
});

test("shake offset stays within its amplitude and is still at 0", () => {
  assert.deepEqual(shakeOffset(12.3, 0), [0, 0]);
  for (let t = 0; t < 3; t += 0.037) {
    const [x, y] = shakeOffset(t, 6);
    assert.ok(Math.abs(x) <= 6 + 1e-9 && Math.abs(y) <= 6 + 1e-9);
  }
});

test("cracks place no flame sprites and no embers", () => {
  const config = { ...readConfig({ system: { effectType: EFFECT_CRACKS, emberAmount: 80 } }), fieldRenderer: "legacy" };
  assert.equal(wantedFlameCount(config, 10000, 100), 0);
  assert.equal(wantedEmberCount(config, 10, 10000, 100), 0);
});

test("the sheet shows the crack fields for cracks only", () => {
  const once = visibleFields({ effectType: EFFECT_CRACKS, crackMode: FREEZE_ONCE });
  for (const name of ["crackMode", "crackDuration", "crackOrigin", "crackScale", "crackWidth", "glowColor", "glowStrength", "shake", "dust", "opacity"]) {
    assert.ok(once.includes(name), name);
  }
  assert.ok(!once.includes("crackHold") && !once.includes("freezeMode") && !once.includes("smokeColor"));
  assert.ok(!visibleFields({ effectType: EFFECT_CRACKS, crackMode: FREEZE_INSTANT }).includes("crackDuration"));
  const loop = visibleFields({ effectType: EFFECT_CRACKS, crackMode: FREEZE_LOOP });
  assert.ok(loop.includes("crackHold") && loop.includes("crackReset"));
  assert.ok(!visibleFields({ effectType: "ice", freezeMode: FREEZE_LOOP }).includes("crackHold"));
});

test("the behavior form draft carries the crack fields", () => {
  const values = {
    "system.effectType": EFFECT_CRACKS,
    "system.crackMode": FREEZE_LOOP,
    "system.crackOrigin": CRACK_ORIGIN_SCATTERED,
    "system.glowColor": "#3399ff",
    "system.shake": "75",
  };
  const form = {
    querySelector(selector) {
      const name = /name="([^"]+)"/.exec(selector)?.[1];
      return name in values ? { value: values[name], checked: false } : null;
    },
  };
  const draft = readDraft(form).system;
  assert.equal(draft.crackMode, FREEZE_LOOP);
  assert.equal(draft.crackOrigin, CRACK_ORIGIN_SCATTERED);
  assert.equal(draft.glowColor, "#3399ff");
  assert.equal(draft.shake, 75);
  assert.equal(draft.dust, 40);
});

test("crack fragment is generative, high precision and written for this module", () => {
  assert.match(CRACK_FRAGMENT, /precision highp float/);
  assert.match(CRACK_FRAGMENT, /uniform sampler2D uDepth/);
  assert.match(CRACK_FRAGMENT, /uniform vec2 uShake/);
  assert.doesNotMatch(CRACK_FRAGMENT, /mainImage|iTime|iResolution|iChannel|SCREEN_TEXTURE|_Time|43758/);
});

test("createCrackSurface shifts plates only with a background and feeds its uniforms", () => {
  const calls = { destroyedTextures: 0 };
  const PIXI = {
    VERSION: "7.4.3",
    Texture: {
      WHITE: { white: true },
      fromBuffer: () => ({ destroy: () => { calls.destroyedTextures += 1; } }),
    },
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
  const bounds = { x: 0, y: 0, width: 300, height: 300 };
  const depth = computeEdgeDepth(bounds, () => true, 30);
  const background = {
    texture: { frame: { x: 0, y: 0, width: 1000, height: 1000 }, baseTexture: { width: 1000, height: 1000 } },
    rect: { x: 0, y: 0, width: 1000, height: 1000 },
  };
  const surface = createCrackSurface(PIXI, bounds, depth, background);
  assert.equal(surface.shiftsPlates, true);
  assert.equal(surface.display.shader.fragment, CRACK_FRAGMENT);
  surface.update({
    time: 1, opacity: 0.8, progress: 0.4, fade: 1, origin: 0, scale: 1.5, width: 2, glow: 0.3,
    glowColor: [0, 0.5, 1], dust: 0.2, shake: [3, -2],
    seed: 0.1, cellSize: 100, worldMinX: 0, worldMinY: 0, worldWidth: 300, worldHeight: 300,
  });
  const uniforms = surface.display.shader.uniforms;
  assert.equal(uniforms.uProgress, 0.4);
  assert.equal(uniforms.uOrigin, 0);
  assert.equal(uniforms.uGlowColor[2], 1);
  assert.equal(uniforms.uShake[1], -2);
  surface.destroy();
  assert.equal(calls.destroyedTextures, 1);

  assert.equal(createCrackSurface(PIXI, bounds, depth, null).shiftsPlates, false);
});

test("crack labels exist in both languages and the system copy matches the module", () => {
  for (const lang of ["en", "de"]) {
    const moduleLang = JSON.parse(fs.readFileSync(path.join(here, "..", "lang", `${lang}.json`), "utf8"));
    const rootLang = JSON.parse(fs.readFileSync(path.join(here, "..", "..", "..", "lang", `${lang}.json`), "utf8"));
    const text = moduleLang.DF_PARTICLE_EFFECTS;
    assert.ok(text.EFFECTS.groundCracks);
    for (const mode of [FREEZE_ONCE, FREEZE_INSTANT, FREEZE_LOOP]) assert.ok(text.CRACK_MODE[mode]);
    for (const reset of [CRACK_RESET_CLOSE, LOOP_RESET_FADE]) assert.ok(text.CRACK_RESET[reset]);
    for (const origin of [CRACK_ORIGIN_CENTER, CRACK_ORIGIN_SCATTERED]) assert.ok(text.CRACK_ORIGIN[origin]);
    for (const field of ["crackMode", "crackDuration", "crackHold", "crackReset", "crackOrigin", "crackScale", "crackWidth", "glowColor", "glowStrength", "shake", "dust"]) {
      assert.ok(text.FIELDS[field]?.label && text.FIELDS[field]?.hint, `${lang} ${field}`);
    }
    assert.deepEqual(rootLang.DF_PARTICLE_EFFECTS, text);
  }
});
