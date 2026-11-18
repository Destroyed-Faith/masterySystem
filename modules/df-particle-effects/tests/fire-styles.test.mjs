import assert from "node:assert/strict";
import test from "node:test";
import { FIRE_STYLE_AREA, FIRE_STYLE_BALL } from "../scripts/constants.mjs";
import { BALL_FRAGMENT, BALL_QUAD_EXTENT, ballQuad, createFireSurface } from "../scripts/fire-surface-shader.mjs";
import { wantedEmberCount, wantedFlameCount } from "../scripts/placement.mjs";
import { readDraft } from "../scripts/preview.mjs";
import { fireLayoutSignature, readConfig } from "../scripts/renderer.mjs";
import { fireStyleChoices, resolveFireStyle, stylesFor } from "../scripts/styles.mjs";

test("only implemented fire styles are selectable", () => {
  assert.deepEqual(Object.keys(fireStyleChoices()), [FIRE_STYLE_AREA, FIRE_STYLE_BALL]);
  assert.equal(stylesFor("ice").length, 0);
});

test("unknown or missing fire styles fall back to Area Fire", () => {
  assert.equal(resolveFireStyle(undefined), FIRE_STYLE_AREA);
  assert.equal(resolveFireStyle("greatFire"), FIRE_STYLE_AREA);
  assert.equal(resolveFireStyle(FIRE_STYLE_BALL), FIRE_STYLE_BALL);
  assert.equal(readConfig({ system: {} }).fireStyle, FIRE_STYLE_AREA);
  assert.equal(readConfig({ system: { fireStyle: FIRE_STYLE_BALL } }).fireStyle, FIRE_STYLE_BALL);
  assert.equal(readConfig({ system: { effectType: "none" } }).effectType, "none");
});

test("switching style rebuilds the effect, speed and opacity do not", () => {
  const base = readConfig({ system: { fireStyle: FIRE_STYLE_AREA } });
  const ball = { ...base, fireStyle: FIRE_STYLE_BALL };
  assert.notEqual(fireLayoutSignature(base), fireLayoutSignature(ball));
  assert.equal(fireLayoutSignature(ball), fireLayoutSignature({ ...ball, flameSpeed: 2.5, opacity: 0.3 }));
});

test("the behavior form draft carries the fire style", () => {
  const values = { "system.fireStyle": FIRE_STYLE_BALL, "system.effectType": "naturalFire" };
  const form = {
    querySelector(selector) {
      const name = /name="([^"]+)"/.exec(selector)?.[1];
      return name in values ? { value: values[name], checked: false } : null;
    },
  };
  assert.equal(readDraft(form).system.fireStyle, FIRE_STYLE_BALL);
});

test("Ball Of Fire places no flame sprites and no embers", () => {
  const config = { fireStyle: FIRE_STYLE_BALL, arrangement: "field", fieldRenderer: "shader", density: 80, emberAmount: 80 };
  assert.equal(wantedFlameCount(config, 10000, 100), 0);
  assert.equal(wantedEmberCount(config, 0, 10000, 100), 0);
  assert.ok(wantedEmberCount({ ...config, fireStyle: FIRE_STYLE_AREA }, 0, 10000, 100) > 0);
});

test("ball quad is a centered square that stays round on wide regions", () => {
  const quad = ballQuad({ x: 0, y: 0, width: 1000, height: 400 });
  assert.equal(quad.width, quad.height);
  assert.equal(quad.x + quad.width / 2, 500);
  assert.equal(quad.y + quad.height / 2, 200);
  const core = 200 * 0.62;
  assert.ok(Math.abs(quad.width / 2 - (core * BALL_QUAD_EXTENT) / 0.5) < 1e-9);
  assert.ok(Math.abs(ballQuad({ x: 0, y: 0, width: 400, height: 400 }, 2).width - quad.width * 2) < 1e-9);
});

test("ball fragment is generative, high precision and loops time seamlessly", () => {
  assert.match(BALL_FRAGMENT, /precision highp float/);
  assert.match(BALL_FRAGMENT, /mod\(uTime, 100\.0\)/);
  assert.match(BALL_FRAGMENT, /atan\(p\.x, p\.y\)/);
  assert.doesNotMatch(BALL_FRAGMENT, /sampler2D/);
  assert.doesNotMatch(BALL_FRAGMENT, /snoise|mainImage|iTime|iResolution|hash13/);
});

test("createFireSurface builds the ball program on its own centered quad", () => {
  const calls = {};
  const PIXI = {
    VERSION: "7.4.3",
    MeshGeometry: class {
      constructor(vertices) {
        calls.vertices = vertices;
      }
    },
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
  const bounds = { x: 100, y: 100, width: 400, height: 400 };
  const surface = createFireSurface(PIXI, bounds, { style: FIRE_STYLE_BALL, scale: 1 });
  assert.equal(surface.style, FIRE_STYLE_BALL);
  assert.equal(calls.fragment, BALL_FRAGMENT);
  const quad = ballQuad(bounds, 1);
  assert.equal(surface.display.x, quad.x);
  assert.equal(calls.vertices[2], Math.fround(quad.width));
  surface.update({ time: 7, opacity: 0.5, seed: 0.25, worldMinX: 0 });
  assert.deepEqual(surface.display.shader.uniforms, { uTime: 7, uOpacity: 0.5, uSeed: 0.25 });
  surface.destroy();
  assert.equal(surface.display.destroyed, true);
});
