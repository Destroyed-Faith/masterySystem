import assert from "node:assert/strict";
import test from "node:test";
import {
  FIRE_SURFACE_FRAGMENT,
  createFireSurfaceFilter,
  createFireSurfacePlate,
  destroyFireSurfaceFilter,
  updateFireSurfaceUniforms,
} from "../scripts/fire-surface-shader.mjs";

test("fire surface shader is a self-contained top-down fragment program", () => {
  assert.match(FIRE_SURFACE_FRAGMENT, /uWorldMin/);
  assert.match(FIRE_SURFACE_FRAGMENT, /uCoverage/);
  assert.match(FIRE_SURFACE_FRAGMENT, /fbm/);
  assert.match(FIRE_SURFACE_FRAGMENT, /finalColor/);
  assert.doesNotMatch(FIRE_SURFACE_FRAGMENT, /texture2D/);
  assert.doesNotMatch(FIRE_SURFACE_FRAGMENT, /gl_FragColor/);
});

test("filter factory returns null without PIXI and cleans up destroy safely", () => {
  const previous = globalThis.PIXI;
  globalThis.PIXI = undefined;
  assert.equal(createFireSurfaceFilter(), null);
  destroyFireSurfaceFilter(null);
  destroyFireSurfaceFilter({ destroyed: true });
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

test("uniform updates write world bounds into the filter resources", () => {
  const uniforms = {
    uTime: 0,
    uOpacity: 1,
    uWorldMin: new Float32Array([0, 0]),
    uWorldSize: new Float32Array([1, 1]),
    uCellSize: 1,
    uNoiseScale: 1,
    uCoverage: 0,
    uSeed: 0,
  };
  updateFireSurfaceUniforms({
    resources: { fireUniforms: { uniforms } },
  }, {
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
  });
  assert.equal(uniforms.uTime, 3.5);
  assert.equal(uniforms.uOpacity, 0.6);
  assert.deepEqual(Array.from(uniforms.uWorldMin), [40, 80]);
  assert.deepEqual(Array.from(uniforms.uWorldSize), [200, 150]);
  assert.equal(uniforms.uCoverage, 0.4);
});
