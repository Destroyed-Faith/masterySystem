import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import {
  EFFECT_RESTRAINT,
  RESTRAINT_CHAINS,
  RESTRAINT_DEFAULT_COLOR,
  RESTRAINT_ROPE,
  RESTRAINT_SERPENT,
  RESTRAINT_VINES,
  RESTRAINT_WEB,
  SERPENT_MOTION_COIL,
  SERPENT_MOTION_SLITHER,
  STRAND_LAYOUT_COILED,
  STRAND_LAYOUT_CURVED,
  STRAND_LAYOUT_RANDOM,
  STRAND_LAYOUT_STRAIGHT,
  STRAND_MOTION_EXTEND,
  STRAND_MOTION_RETRACT,
  STRAND_MOTION_STATIC,
  STRAND_MOTION_TIGHTEN,
  STRAND_MOTION_WRITHE,
} from "../scripts/constants.mjs";
import { applyFieldVisibility, visibleFields } from "../scripts/field-visibility.mjs";
import { pointInRing } from "../scripts/geometry.mjs";
import { computeEdgeDepth } from "../scripts/ice-depth.mjs";
import { wantedEmberCount, wantedFlameCount } from "../scripts/placement.mjs";
import { readDraft } from "../scripts/preview.mjs";
import { mulberry32 } from "../scripts/random.mjs";
import { fireLayoutSignature, readConfig } from "../scripts/renderer.mjs";
import { RestraintEffect, serpentWidth, strandDrivers } from "../scripts/restraint-effect.mjs";
import {
  RESTRAINT_PRESETS,
  RESTRAINT_STYLES,
  resolveRestraintLook,
  restraintLayoutSignature,
  restraintTimingSignature,
} from "../scripts/restraint-presets.mjs";
import { createDepthSampler, deepestPoint, planStrands, resamplePath } from "../scripts/strand-layout.mjs";
import { LineStrandMotion, SerpentMotion, strandDrive } from "../scripts/strand-motion.mjs";
import { VerletStrand } from "../scripts/strand-physics.mjs";
import { STRAND_FRAGMENT, STRAND_VERTEX } from "../scripts/strand-shader.mjs";
import { createStrandSurface, stripIndices, writeStrip } from "../scripts/strand-surface.mjs";
import { createWebSurface, WEB_FRAGMENT, webLayout } from "../scripts/web-surface-shader.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const CELL = 100;

/** A 10-cell round region with a hole, like a typical AoE that was edited. */
function region() {
  const outer = [];
  for (let i = 0; i < 48; i += 1) {
    const a = (i / 48) * Math.PI * 2;
    outer.push(500 + Math.cos(a) * 480, 500 + Math.sin(a) * 430);
  }
  const hole = [];
  for (let i = 0; i < 16; i += 1) {
    const a = (i / 16) * Math.PI * 2;
    hole.push(640 + Math.cos(a) * 70, 380 + Math.sin(a) * 60);
  }
  const contains = (x, y) => pointInRing(x, y, outer) && !pointInRing(x, y, hole);
  const bounds = { x: 0, y: 0, width: 1000, height: 1000 };
  return { bounds, contains, depth: computeEdgeDepth(bounds, contains) };
}

function restraint(system = {}) {
  return readConfig({ system: { effectType: EFFECT_RESTRAINT, ...system } });
}

function plan(style, system = {}, seed = 4242) {
  const { bounds, depth, contains } = region();
  const config = restraint({ restraintStyle: style, ...system });
  const look = resolveRestraintLook(config);
  const halfWidth = look.halfWidthCells * CELL;
  const strands = planStrands({ style, config, bounds, depth, cellSize: CELL, halfWidth, seed });
  return { strands, config, look, halfWidth, contains, depth, bounds };
}

function mockPixi() {
  const destroyed = { meshes: 0, geometries: 0, containers: 0, textures: 0 };
  class Display {
    constructor() {
      this.children = [];
      this.position = { set: (x, y) => { this.position.x = x; this.position.y = y; } };
    }
    addChild(...children) {
      for (const child of children) {
        child.parent = this;
        this.children.push(child);
      }
      return children[0];
    }
    removeChild(child) {
      this.children = this.children.filter((c) => c !== child);
    }
    destroy() {
      this.destroyed = true;
      for (const child of this.children) child.destroy?.();
    }
  }
  class Container extends Display {
    destroy() {
      super.destroy();
      destroyed.containers += 1;
    }
  }
  class Mesh extends Display {
    constructor(geometry, shader) {
      super();
      this.geometry = geometry;
      this.shader = shader;
    }
    destroy() {
      super.destroy();
      destroyed.meshes += 1;
    }
  }
  class MeshGeometry {
    constructor(positions, uvs, indices) {
      this.buffers = { aVertexPosition: { data: positions, updates: 0 }, aTextureCoord: { data: uvs, updates: 0 } };
      for (const buffer of Object.values(this.buffers)) buffer.update = () => { buffer.updates += 1; };
      this.indices = indices;
    }
    addAttribute(name, data) {
      this.buffers[name] = { data, updates: 0, update() { this.updates += 1; } };
      return this;
    }
    getBuffer(name) {
      return this.buffers[name];
    }
    destroy() {
      destroyed.geometries += 1;
    }
  }
  return {
    destroyed,
    PIXI: {
      VERSION: "7.4.3",
      Container,
      Mesh,
      MeshGeometry,
      Shader: { from: (vertex, fragment, uniforms) => ({ vertex, fragment, uniforms }) },
      Texture: { WHITE: {}, fromBuffer: () => ({ destroy: () => { destroyed.textures += 1; } }) },
    },
  };
}

test("Restraint / Binding has the five styles in dialog order", () => {
  assert.deepEqual([...RESTRAINT_STYLES], [RESTRAINT_WEB, RESTRAINT_VINES, RESTRAINT_ROPE, RESTRAINT_CHAINS, RESTRAINT_SERPENT]);
});

test("restraint config has safe defaults and clamps", () => {
  const config = restraint();
  assert.equal(config.restraintStyle, RESTRAINT_WEB);
  assert.equal(config.restraintCustomColor, false);
  assert.equal(config.restraintColor, RESTRAINT_DEFAULT_COLOR);
  assert.equal(config.restraintAnimation, 50);
  assert.equal(config.restraintThickness, 1);
  assert.equal(config.restraintDensity, 80);
  assert.equal(config.webRadials, 16);
  assert.equal(config.webRings, 12);
  assert.equal(config.strandCount, 3);
  assert.equal(config.strandLayout, STRAND_LAYOUT_CURVED);
  assert.equal(config.strandMotion, STRAND_MOTION_WRITHE);
  assert.equal(config.serpentCount, 1);
  assert.equal(config.serpentMotion, SERPENT_MOTION_SLITHER);

  const odd = restraint({
    restraintStyle: "net",
    strandCount: 9,
    serpentCount: 0,
    strandLayout: "knot",
    strandMotion: "fly",
    serpentMotion: "fly",
    restraintThickness: 10,
    webRadials: 2.4,
    restraintCustomColor: "yes",
  });
  assert.equal(odd.restraintStyle, RESTRAINT_WEB);
  assert.equal(odd.strandCount, 5);
  assert.equal(odd.serpentCount, 1);
  assert.equal(odd.strandLayout, STRAND_LAYOUT_CURVED);
  assert.equal(odd.strandMotion, STRAND_MOTION_WRITHE);
  assert.equal(odd.serpentMotion, SERPENT_MOTION_SLITHER);
  assert.equal(odd.restraintThickness, 3);
  assert.equal(odd.webRadials, 5);
  assert.equal(odd.restraintCustomColor, false);
});

test("each style has its own color unless Custom Color is on; thickness and animation scale the look", () => {
  for (const style of RESTRAINT_STYLES) {
    const look = resolveRestraintLook(restraint({ restraintStyle: style }));
    const hex = RESTRAINT_PRESETS[style].color;
    assert.equal(Math.round(look.color[0] * 255), Number.parseInt(hex.slice(1, 3), 16), style);
  }
  const custom = resolveRestraintLook(restraint({ restraintStyle: RESTRAINT_ROPE, restraintCustomColor: true, restraintColor: "#ff0000" }));
  assert.deepEqual(custom.color, [1, 0, 0]);
  const thick = resolveRestraintLook(restraint({ restraintStyle: RESTRAINT_ROPE, restraintThickness: 2 }));
  assert.equal(thick.halfWidthCells, RESTRAINT_PRESETS[RESTRAINT_ROPE].halfWidth * 2);
  assert.equal(resolveRestraintLook(restraint({ restraintAnimation: 0 })).motion, 0);
  const vines = resolveRestraintLook(restraint({ restraintStyle: RESTRAINT_VINES, restraintAnimation: 100 }));
  const rope = resolveRestraintLook(restraint({ restraintStyle: RESTRAINT_ROPE, restraintAnimation: 100 }));
  assert.ok(vines.motion < rope.motion * 0.5, "vines only move a little");
  const chains = resolveRestraintLook(restraint({ restraintStyle: RESTRAINT_CHAINS }));
  assert.ok(chains.halfWidthCells > rope.halfWidthCells, "chains are heavier than rope");
});

test("restraints place no flame sprites and no embers", () => {
  const config = { ...restraint({ emberAmount: 80 }), fieldRenderer: "legacy" };
  assert.equal(wantedFlameCount(config, 10000, 100), 0);
  assert.equal(wantedEmberCount(config, 10, 10000, 100), 0);
});

test("the sheet shows only the options of the chosen style", () => {
  const shown = (values) => visibleFields({ effectType: EFFECT_RESTRAINT, ...values });
  const web = shown({ restraintStyle: RESTRAINT_WEB });
  for (const name of ["restraintStyle", "restraintCustomColor", "restraintThickness", "webRadials", "webRings", "restraintDensity", "restraintAnimation", "opacity"]) {
    assert.ok(web.includes(name), `web ${name}`);
  }
  assert.ok(!web.includes("strandCount") && !web.includes("vineThorns") && !web.includes("restraintColor"));

  const vines = shown({ restraintStyle: RESTRAINT_VINES });
  for (const name of ["restraintDensity", "vineVariation", "vineTwist", "vineThorns", "restraintAnimation"]) assert.ok(vines.includes(name), name);
  assert.ok(!vines.includes("webRadials") && !vines.includes("strandLayout"));

  const rope = shown({ restraintStyle: RESTRAINT_ROPE, strandMotion: STRAND_MOTION_WRITHE });
  for (const name of ["strandCount", "strandLayout", "strandMotion", "restraintAnimation"]) assert.ok(rope.includes(name), name);
  assert.ok(!rope.includes("chainWeight") && !rope.includes("restraintDensity") && !rope.includes("serpentMotion"));
  assert.ok(!shown({ restraintStyle: RESTRAINT_ROPE, strandMotion: STRAND_MOTION_STATIC }).includes("restraintAnimation"));

  const chains = shown({ restraintStyle: RESTRAINT_CHAINS });
  assert.ok(chains.includes("chainWeight") && chains.includes("strandCount"));

  const serpent = shown({ restraintStyle: RESTRAINT_SERPENT });
  for (const name of ["serpentCount", "serpentMotion", "serpentScales", "restraintThickness"]) assert.ok(serpent.includes(name), name);
  assert.ok(!serpent.includes("strandCount") && !serpent.includes("strandLayout"));

  assert.ok(shown({ restraintStyle: RESTRAINT_SERPENT, restraintCustomColor: true }).includes("restraintColor"));
  assert.ok(!visibleFields({ effectType: "smoke" }).includes("restraintStyle"));
  assert.ok(!visibleFields({ effectType: EFFECT_RESTRAINT }).includes("liquidStyle"));

  const dom = new JSDOM(`<form>
    <div class="form-group"><select name="system.effectType"><option value="${EFFECT_RESTRAINT}" selected></option></select></div>
    <div class="form-group"><select name="system.restraintStyle"><option value="${RESTRAINT_CHAINS}" selected></option></select></div>
    <div class="form-group"><select name="system.strandMotion"><option value="${STRAND_MOTION_TIGHTEN}" selected></option></select></div>
    <div class="form-group"><input type="checkbox" name="system.restraintCustomColor"></div>
    <div class="form-group"><input name="system.restraintColor" value="#ff0000"></div>
    <div class="form-group"><input name="system.chainWeight" value="60"></div>
    <div class="form-group"><input name="system.webRadials" value="16"></div>
  </form>`);
  const form = dom.window.document.querySelector("form");
  const row = (name) => form.querySelector(`[name="system.${name}"]`).closest(".form-group").style.display;
  applyFieldVisibility(form);
  assert.equal(row("chainWeight"), "");
  assert.equal(row("webRadials"), "none");
  assert.equal(row("restraintColor"), "none");
  form.querySelector('[name="system.restraintCustomColor"]').checked = true;
  applyFieldVisibility(form);
  assert.equal(row("restraintColor"), "");
});

test("the behavior form draft carries the restraint fields", () => {
  const values = {
    "system.effectType": { value: EFFECT_RESTRAINT },
    "system.restraintStyle": { value: RESTRAINT_SERPENT },
    "system.serpentMotion": { value: SERPENT_MOTION_COIL },
    "system.strandCount": { value: "4" },
    "system.restraintCustomColor": { value: "on", checked: true },
    "system.restraintColor": { value: "#123456" },
  };
  const form = { querySelector: (selector) => values[/name="([^"]+)"/.exec(selector)?.[1]] ?? null };
  const draft = readDraft(form).system;
  assert.equal(draft.restraintStyle, RESTRAINT_SERPENT);
  assert.equal(draft.serpentMotion, SERPENT_MOTION_COIL);
  assert.equal(draft.strandCount, 4);
  assert.equal(draft.restraintCustomColor, true);
  assert.equal(draft.restraintColor, "#123456");
  assert.equal(draft.webRadials, 16);
  assert.equal(draft.strandMotion, STRAND_MOTION_WRITHE);
});

test("layout fields rebuild the effect; look fields update it live", () => {
  const base = restraint({ restraintStyle: RESTRAINT_ROPE });
  const sig = fireLayoutSignature(base);
  for (const change of [{ strandCount: 1 }, { strandLayout: STRAND_LAYOUT_COILED }, { strandMotion: STRAND_MOTION_EXTEND }, { restraintStyle: RESTRAINT_CHAINS }, { restraintThickness: 2 }]) {
    assert.notEqual(fireLayoutSignature(restraint({ restraintStyle: RESTRAINT_ROPE, ...change })), sig, JSON.stringify(change));
  }
  for (const change of [{ opacity: 0.4 }, { restraintAnimation: 90 }, { restraintCustomColor: true, restraintColor: "#00ff00" }, { webRadials: 30 }]) {
    assert.equal(fireLayoutSignature(restraint({ restraintStyle: RESTRAINT_ROPE, ...change })), sig, JSON.stringify(change));
  }
  assert.equal(restraintLayoutSignature({ effectType: "smoke" }), "");
  assert.notEqual(restraintTimingSignature(base), restraintTimingSignature(restraint({ restraintStyle: RESTRAINT_ROPE, strandMotion: STRAND_MOTION_EXTEND })));
});

test("strands of every layout and style lie inside the region, and the layout is stable", () => {
  const cases = [
    [RESTRAINT_ROPE, { strandLayout: STRAND_LAYOUT_STRAIGHT }],
    [RESTRAINT_ROPE, { strandLayout: STRAND_LAYOUT_CURVED, strandCount: 5 }],
    [RESTRAINT_ROPE, { strandLayout: STRAND_LAYOUT_COILED }],
    [RESTRAINT_CHAINS, { strandLayout: STRAND_LAYOUT_RANDOM, strandCount: 1 }],
    [RESTRAINT_VINES, { restraintDensity: 100 }],
  ];
  for (const [style, system] of cases) {
    const { strands, contains, config } = plan(style, system);
    assert.ok(strands.length > 0, `${style} ${JSON.stringify(system)}`);
    if (style !== RESTRAINT_VINES) assert.ok(strands.length <= config.strandCount);
    for (const strand of strands) {
      assert.ok(strand.path.length >= 2);
      for (const [x, y] of strand.path) assert.ok(contains(x, y), `${style} point outside at ${x},${y}`);
    }
    const again = plan(style, system).strands;
    assert.deepEqual(again.map((s) => s.path), strands.map((s) => s.path));
  }
  const vines = plan(RESTRAINT_VINES).strands;
  assert.ok(vines.filter((s) => s.kind === "vine").length >= 4, "several intertwined vines");
  assert.ok(vines.some((s) => s.kind === "tendril"));
  assert.ok(vines.every((s) => !s.shade || s.shade.length === s.path.length));
});

test("the depth sampler reads edge distance in pixels and the hub is the deepest point", () => {
  const { bounds, depth, contains } = region();
  const at = createDepthSampler(depth, bounds);
  const hub = deepestPoint(depth, bounds);
  assert.ok(contains(hub.x, hub.y));
  assert.ok(Math.abs(at(hub.x, hub.y) - depth.maxDistance) < depth.maxDistance * 0.1);
  assert.equal(at(-50, -50), 0);
  const even = resamplePath([[0, 0], [100, 0], [100, 100]], 10);
  assert.equal(even.length, 21);
});

test("Verlet links keep their length; tightening shortens them; hidden points wait at the tip", () => {
  const points = Array.from({ length: 21 }, (_, i) => [i * 10, 0]);
  const strand = new VerletStrand(points);
  const targets = new Float64Array(42);
  points.forEach(([x, y], i) => {
    targets[i * 2] = x;
    targets[i * 2 + 1] = y + Math.sin(i) * 30;
  });
  for (let i = 0; i < 200; i += 1) strand.step({ targets, follow: 0.1, damping: 0.9, iterations: 12 });
  for (let i = 0; i < 20; i += 1) {
    const length = Math.hypot(strand.pos[i * 2 + 2] - strand.pos[i * 2], strand.pos[i * 2 + 3] - strand.pos[i * 2 + 1]);
    assert.ok(Math.abs(length - 10) < 0.6, `link ${i} is ${length}`);
  }
  const straight = Float64Array.from(points.flat());
  const taut = new VerletStrand(points);
  for (let i = 0; i < 100; i += 1) taut.step({ targets: straight, follow: 0, damping: 0.9, iterations: 12, restScale: 0.8 });
  const end = Math.hypot(taut.pos[40] - taut.pos[0], taut.pos[41] - taut.pos[1]);
  assert.ok(end < 180, "free end pulled in");
  const last = taut.step({ targets: straight, follow: 0.1, damping: 0.9, iterations: 4, visible: 5.5 });
  assert.equal(last, 6);
  assert.equal(taut.pos[20 * 2], taut.pos[6 * 2]);
});

test("extend plays once, retract and tighten repeat", () => {
  assert.equal(strandDrive(STRAND_MOTION_EXTEND, 0, 0).reveal, 0);
  assert.equal(strandDrive(STRAND_MOTION_EXTEND, 0, Infinity).reveal, 1);
  assert.equal(strandDrive(STRAND_MOTION_EXTEND, 0, 60).reveal, 1);
  const retract = Array.from({ length: 50 }, (_, i) => strandDrive(STRAND_MOTION_RETRACT, i * 0.11, 0).reveal);
  assert.ok(Math.min(...retract) < 0.3 && Math.max(...retract) === 1);
  const tight = Array.from({ length: 50 }, (_, i) => strandDrive(STRAND_MOTION_TIGHTEN, i * 0.09, 0).tight);
  assert.ok(Math.min(...tight) === 0 && Math.max(...tight) === 1);
  assert.deepEqual(strandDrive(STRAND_MOTION_WRITHE, 3, 0), { wave: 1, reveal: 1, tight: 0 });
});

test("ropes and chains stay finite, keep their length and stay near their layout while moving", () => {
  for (const [style, motion] of [[RESTRAINT_ROPE, STRAND_MOTION_WRITHE], [RESTRAINT_CHAINS, STRAND_MOTION_TIGHTEN], [RESTRAINT_ROPE, STRAND_MOTION_RETRACT]]) {
    const { strands, config, look } = plan(style, { strandMotion: motion, strandLayout: STRAND_LAYOUT_CURVED });
    const motionDriver = new LineStrandMotion(strands[0], {
      motion,
      layout: config.strandLayout,
      heavy: style === RESTRAINT_CHAINS,
      weight: 0.6,
      cell: CELL,
      phase: 0.2,
    });
    let pose;
    for (let frame = 0; frame < 600; frame += 1) pose = motionDriver.pose(frame / 60, Infinity, look.motion);
    const { points, last } = pose;
    assert.ok(Array.from(points).every(Number.isFinite), `${style} ${motion}`);
    let length = 0;
    for (let i = 1; i <= last; i += 1) length += Math.hypot(points[i * 2] - points[i * 2 - 2], points[i * 2 + 1] - points[i * 2 - 1]);
    assert.ok(length <= motionDriver.length * 1.08, `${style} ${motion} does not stretch like rubber`);
    for (let i = 0; i <= last; i += 1) {
      const dx = points[i * 2] - motionDriver.base[i][0];
      const dy = points[i * 2 + 1] - motionDriver.base[i][1];
      assert.ok(Math.hypot(dx, dy) < CELL * 3, `${style} ${motion} point ${i} wandered off`);
    }
  }
  const { strands } = plan(RESTRAINT_ROPE, { strandMotion: STRAND_MOTION_STATIC });
  const still = new LineStrandMotion(strands[0], { motion: STRAND_MOTION_STATIC, layout: STRAND_LAYOUT_CURVED, heavy: false, cell: CELL, phase: 0 });
  assert.deepEqual(Array.from(still.pose(5, Infinity, 1).points), strands[0].path.flat());
});

test("a serpent slides smoothly along its track and a coil stays inside", () => {
  for (const serpentMotion of [SERPENT_MOTION_SLITHER, SERPENT_MOTION_COIL]) {
    const { strands, halfWidth, contains } = plan(RESTRAINT_SERPENT, { serpentMotion });
    assert.equal(strands.length, 1);
    const motion = new SerpentMotion(strands[0], { cell: CELL, halfWidth });
    const a = Array.from(motion.pose(10, 0.5));
    const b = Array.from(motion.pose(10 + 1 / 60, 0.5));
    for (let i = 0; i < a.length; i += 1) assert.ok(Math.abs(a[i] - b[i]) < CELL * 0.1, `${serpentMotion} jumps`);
    for (let k = 0; k < motion.count; k += 1) assert.ok(contains(a[k * 2], a[k * 2 + 1]), `${serpentMotion} body outside`);
    for (let k = 1; k < motion.count; k += 1) {
      const gap = Math.hypot(a[k * 2] - a[k * 2 - 2], a[k * 2 + 1] - a[k * 2 - 1]);
      assert.ok(gap < motion.segment * 1.5, `${serpentMotion} body tears apart`);
    }
  }
  assert.equal(plan(RESTRAINT_SERPENT, { serpentCount: 3 }).strands.length, 3);
  assert.equal(serpentWidth(0), 0);
  assert.equal(serpentWidth(0.4), 1);
  assert.ok(serpentWidth(0.05) > serpentWidth(0.085), "a slight neck behind the head");
  assert.ok(serpentWidth(0.97) < 0.15, "tapered tail");
});

test("strips get two vertices per point and hidden points have no width", () => {
  const out = { positions: new Float32Array(16), uvs: new Float32Array(16), info: new Float32Array(16) };
  writeStrip(out, 0, [0, 0, 10, 0, 20, 0, 30, 0], 4, 2, 5, [1, 1, 1, 1], null, 10);
  assert.deepEqual(Array.from(out.positions.slice(0, 4)), [0, 5, 0, -5]);
  assert.equal(out.uvs[8], 2);
  assert.equal(out.uvs[11], 1);
  assert.equal(out.positions[12], out.positions[14], "point past the tip is collapsed");
  assert.equal(out.positions[13], out.positions[15]);
  const indices = stripIndices([4, 3]);
  assert.equal(indices.length, (3 + 2) * 6);
  assert.equal(Math.max(...indices), 13);
  assert.ok(indices.slice(18).every((v) => v >= 8), "strands are not joined");
});

test("strand surfaces build a shadow and a body mesh, update every frame and clean up", () => {
  const { PIXI, destroyed } = mockPixi();
  const { strands, config, halfWidth } = plan(RESTRAINT_CHAINS);
  const drivers = strandDrivers(RESTRAINT_CHAINS, strands, config, CELL, halfWidth, mulberry32(1));
  const surface = createStrandSurface(PIXI, drivers, { styleId: 1, halfWidth, cell: CELL, label: "chains" });
  assert.equal(surface.display.children.length, 2);
  const [shadow, body] = surface.display.children;
  assert.equal(shadow.shader.uniforms.uShadow, 1);
  assert.equal(body.shader.uniforms.uShadow, 0);
  assert.ok(shadow.position.x > 0 && shadow.position.y > 0);
  surface.update({ time: 1, elapsed: Infinity, amount: 0.5, opacity: 0.7, color: [0.2, 0.3, 0.4], detail: 0, seed: 0.1 });
  assert.equal(body.shader.uniforms.uOpacity, 0.7);
  assert.equal(body.geometry.getBuffer("aVertexPosition").updates, 1);
  assert.ok(Array.from(body.geometry.getBuffer("aVertexPosition").data).every(Number.isFinite));
  surface.destroy();
  assert.equal(destroyed.meshes, 2);
  assert.equal(destroyed.geometries, 1);
  assert.equal(createStrandSurface({ VERSION: "8.0.0" }, drivers, { styleId: 1, halfWidth, cell: CELL, label: "x" }), null);
});

test("RestraintEffect builds web or strands, is silent to the pointer and destroys cleanly", () => {
  const { PIXI, destroyed } = mockPixi();
  const previous = globalThis.PIXI;
  globalThis.PIXI = PIXI;
  try {
    const { bounds, depth } = region();
    for (const style of RESTRAINT_STYLES) {
      const effect = new RestraintEffect({
        config: restraint({ restraintStyle: style }),
        bounds,
        mask: new PIXI.Container(),
        gridSize: CELL,
        seed: 99,
        depth,
        startedAt: -Infinity,
      });
      assert.equal(effect.root.eventMode, "none", style);
      assert.equal(effect.root.interactiveChildren, false, style);
      effect.tick(2);
      effect.tick(2.5);
      effect.destroy();
      assert.equal(effect.root, null);
      effect.destroy();
    }
    assert.ok(destroyed.geometries >= 4, "strand geometries freed");
    assert.ok(destroyed.textures >= 1, "web depth texture freed");
  } finally {
    globalThis.PIXI = previous;
  }
});

test("the web surface takes its hub, spacing and sliders as uniforms", () => {
  const { PIXI } = mockPixi();
  const { bounds, depth } = region();
  const hub = deepestPoint(depth, bounds);
  const surface = createWebSurface(PIXI, bounds, depth, hub);
  surface.update({
    time: 1, opacity: 0.8, seed: 0.2, cellSize: CELL, worldMinX: 0, worldMinY: 0, worldWidth: 1000, worldHeight: 1000,
    radials: 20, rings: 10, coverage: 0.5, motion: 0.3, halfWidthCells: 0.014, color: [1, 1, 1],
  });
  const u = surface.display.shader.uniforms;
  assert.equal(u.uRadials, 20);
  assert.equal(u.uCoverage, 0.5);
  assert.equal(u.uHub[0], Math.fround(hub.x));
  const more = webLayout({ maxDistance: depth.maxDistance, cellSize: CELL, rings: 20, halfWidthCells: 0.014 });
  assert.ok(more.spacing < u.uSpacing, "more rings sit closer together");
  surface.destroy();
});

test("restraint shaders are generative, written for this module and draw no light", () => {
  for (const source of [WEB_FRAGMENT, STRAND_FRAGMENT]) {
    assert.match(source, /precision highp float/);
    assert.doesNotMatch(source, /mainImage|iTime|iResolution|iChannel|SCREEN_TEXTURE|TIME|43758/);
    assert.doesNotMatch(source.replace(/\/\/[^\n]*/g, ""), /\bout\b|\bround\s*\(/, "no GLSL ES 3 keywords as names");
  }
  assert.match(STRAND_VERTEX, /attribute vec2 aInfo/);
  for (const file of ["restraint-effect.mjs", "strand-surface.mjs", "web-surface-shader.mjs", "strand-motion.mjs"]) {
    const text = fs.readFileSync(path.join(here, "..", "scripts", file), "utf8");
    assert.doesNotMatch(text, /AmbientLight|createEmbeddedDocuments|LightSource|\.update\(\{\s*system/, file);
  }
});

test("restraint labels exist in both languages and the system copy matches the module", () => {
  const fields = [
    "restraintStyle", "restraintCustomColor", "restraintColor", "restraintAnimation", "restraintThickness", "restraintDensity",
    "webRadials", "webRings", "vineVariation", "vineTwist", "vineThorns", "strandCount", "strandLayout", "strandMotion",
    "chainWeight", "serpentCount", "serpentMotion", "serpentScales",
  ];
  for (const lang of ["en", "de"]) {
    const moduleLang = JSON.parse(fs.readFileSync(path.join(here, "..", "lang", `${lang}.json`), "utf8"));
    const rootLang = JSON.parse(fs.readFileSync(path.join(here, "..", "..", "..", "lang", `${lang}.json`), "utf8"));
    const text = moduleLang.DF_PARTICLE_EFFECTS;
    assert.ok(text.EFFECTS.restraint);
    for (const style of RESTRAINT_STYLES) assert.ok(text.RESTRAINT_STYLE[style], `${lang} ${style}`);
    for (const layout of [STRAND_LAYOUT_STRAIGHT, STRAND_LAYOUT_CURVED, STRAND_LAYOUT_COILED, STRAND_LAYOUT_RANDOM]) assert.ok(text.STRAND_LAYOUT[layout]);
    for (const motion of [STRAND_MOTION_STATIC, STRAND_MOTION_WRITHE, STRAND_MOTION_EXTEND, STRAND_MOTION_RETRACT, STRAND_MOTION_TIGHTEN]) assert.ok(text.STRAND_MOTION[motion]);
    for (const motion of [SERPENT_MOTION_SLITHER, SERPENT_MOTION_COIL]) assert.ok(text.SERPENT_MOTION[motion]);
    for (const field of fields) assert.ok(text.FIELDS[field]?.label && text.FIELDS[field]?.hint, `${lang} ${field}`);
    assert.deepEqual(rootLang.DF_PARTICLE_EFFECTS, text);
  }
});
