import assert from "node:assert/strict";
import test from "node:test";
import {
  FIRE_SURFACE_FRAGMENT,
  FIRE_SURFACE_FRAGMENT_V7,
  DEFAULT_VERTEX_V7,
  createFireSurfaceFilter,
  createFireSurfacePlate,
  destroyFireSurfaceFilter,
  updateFireSurfaceUniforms,
} from "../scripts/fire-surface-shader.mjs";

test("fire surface shader ships Pixi v7 and v8 fragment programs", () => {
  assert.match(FIRE_SURFACE_FRAGMENT, /uWorldMin/);
  assert.match(FIRE_SURFACE_FRAGMENT, /uCoverage/);
  assert.match(FIRE_SURFACE_FRAGMENT, /fbm/);
  assert.match(FIRE_SURFACE_FRAGMENT, /finalColor/);
  assert.doesNotMatch(FIRE_SURFACE_FRAGMENT, /texture2D/);
  assert.doesNotMatch(FIRE_SURFACE_FRAGMENT, /gl_FragColor/);

  assert.match(FIRE_SURFACE_FRAGMENT_V7, /uSampler/);
  assert.match(FIRE_SURFACE_FRAGMENT_V7, /gl_FragColor/);
  assert.match(FIRE_SURFACE_FRAGMENT_V7, /texture2D/);
  assert.match(DEFAULT_VERTEX_V7, /projectionMatrix/);
});

test("filter factory returns null without PIXI and cleans up destroy safely", () => {
  const previous = globalThis.PIXI;
  globalThis.PIXI = undefined;
  assert.equal(createFireSurfaceFilter(), null);
  destroyFireSurfaceFilter(null);
  destroyFireSurfaceFilter({ destroyed: true });
  globalThis.PIXI = previous;
});

test("filter factory uses classic Filter(vertex, fragment, uniforms) when available", () => {
  const previous = globalThis.PIXI;
  class FakeFilter {
    constructor(vertex, fragment, uniforms) {
      this.vertex = vertex;
      this.fragment = fragment;
      this.uniforms = uniforms;
      this.resolution = 1;
    }
  }
  globalThis.PIXI = { Filter: FakeFilter };
  const filter = createFireSurfaceFilter({ resolution: 0.5 });
  assert.ok(filter);
  assert.equal(filter.dfFireApi, "v7");
  assert.match(filter.vertex, /projectionMatrix/);
  assert.match(filter.fragment, /uSampler/);
  assert.equal(filter.resolution, 0.5);
  assert.equal(typeof filter.uniforms.uTime, "number");
  globalThis.PIXI = previous;
});

test("surface plate uses a white sprite when available", () => {
  class FakeRectangle {
    constructor(x, y, width, height) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
    }
  }
  class FakeSprite {
    constructor(texture) {
      this.texture = texture;
      this.x = 0;
      this.y = 0;
      this.position = {
        set: (x, y) => {
          this.x = x;
          this.y = y;
        },
      };
    }
  }
  const plate = createFireSurfacePlate({
    Texture: { WHITE: { label: "white" } },
    Sprite: FakeSprite,
    Rectangle: FakeRectangle,
  }, { x: 10, y: 20, width: 100, height: 50 });
  assert.equal(plate.x, 10);
  assert.equal(plate.y, 20);
  assert.equal(plate.width, 100);
  assert.equal(plate.height, 50);
  assert.equal(plate.filterArea.width, 100);
  assert.equal(plate.filterArea.height, 50);
});

test("uniform updates write world bounds for v7 uniforms and v8 resources", () => {
  const v7 = {
    uniforms: {
      uTime: 0,
      uOpacity: 1,
      uWorldMin: new Float32Array([0, 0]),
      uWorldSize: new Float32Array([1, 1]),
      uCellSize: 1,
      uNoiseScale: 1,
      uCoverage: 0,
      uSeed: 0,
    },
  };
  const state = {
    time: 3.5,
    opacity: 0.6,
    worldMinX: 40,
    worldMinY: 80,
    worldWidth: 200,
    worldHeight: 150,
    cellSize: 100,
    noiseScale: 1.25,
    coverage: 0.4,
    seed: 0.2,
  };
  updateFireSurfaceUniforms(v7, state);
  assert.equal(v7.uniforms.uTime, 3.5);
  assert.deepEqual(Array.from(v7.uniforms.uWorldMin), [40, 80]);

  const v8Uniforms = {
    uTime: 0,
    uOpacity: 1,
    uWorldMin: new Float32Array([0, 0]),
    uWorldSize: new Float32Array([1, 1]),
    uCellSize: 1,
    uNoiseScale: 1,
    uCoverage: 0,
    uSeed: 0,
  };
  updateFireSurfaceUniforms({ resources: { fireUniforms: { uniforms: v8Uniforms } } }, state);
  assert.equal(v8Uniforms.uOpacity, 0.6);
  assert.deepEqual(Array.from(v8Uniforms.uWorldSize), [200, 150]);
  assert.equal(v8Uniforms.uCoverage, 0.4);
});
