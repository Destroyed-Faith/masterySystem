import assert from "node:assert/strict";
import test from "node:test";
import {
  MESH_FRAGMENT,
  MESH_VERTEX,
  createFireSurface,
  pixiMajorVersion,
  updateFireSurfaceUniforms,
} from "../scripts/fire-surface-shader.mjs";

const BOUNDS = { x: 10, y: 20, width: 200, height: 100 };

function fakePixi7() {
  const calls = {};
  class MeshGeometry {
    constructor(vertices, uvs, indices) {
      calls.geometry = { vertices, uvs, indices };
      this.buffers = [{ data: vertices }, { data: uvs }];
    }
  }
  class Mesh {
    constructor(geometry, shader) {
      calls.mesh = { geometry, shader };
      this.geometry = geometry;
      this.shader = shader;
      this.destroyed = false;
      this.position = {
        set: (x, y) => {
          this.x = x;
          this.y = y;
        },
      };
    }
    destroy() {
      this.destroyed = true;
    }
  }
  const Shader = {
    from(vertex, fragment, uniforms) {
      calls.shader = { vertex, fragment };
      return { uniforms };
    },
  };
  return { PIXI: { VERSION: "7.4.3", Mesh, MeshGeometry, Shader }, calls };
}

test("mesh shader is generative and uses the Pixi 7 mesh matrices", () => {
  assert.match(MESH_VERTEX, /translationMatrix/);
  assert.match(MESH_VERTEX, /projectionMatrix/);
  assert.match(MESH_VERTEX, /aVertexPosition/);
  assert.match(MESH_FRAGMENT, /gl_FragColor/);
  assert.match(MESH_FRAGMENT, /uWorldMin/);
  assert.doesNotMatch(MESH_FRAGMENT, /sampler2D/);
});

test("pixi major version is read from PIXI.VERSION", () => {
  assert.equal(pixiMajorVersion({ VERSION: "7.4.3" }), 7);
  assert.equal(pixiMajorVersion({ VERSION: "8.1.0" }), 8);
  assert.equal(pixiMajorVersion({}), null);
});

test("Pixi 7 builds MeshGeometry and Mesh with positional arguments", () => {
  const { PIXI, calls } = fakePixi7();
  const surface = createFireSurface(PIXI, BOUNDS);
  assert.ok(surface);
  assert.equal(surface.api, "mesh");
  assert.ok(calls.geometry.vertices instanceof Float32Array);
  assert.deepEqual(Array.from(calls.geometry.vertices), [0, 0, 200, 0, 200, 100, 0, 100]);
  assert.deepEqual(Array.from(calls.geometry.indices), [0, 1, 2, 0, 2, 3]);
  assert.ok(calls.mesh.geometry instanceof PIXI.MeshGeometry);
  assert.ok(Array.isArray(surface.display.geometry.buffers));
  assert.equal(surface.display.x, 10);
  assert.equal(surface.display.y, 20);
  surface.destroy();
  assert.equal(surface.display.destroyed, true);
});

test("surface update writes uniforms into the mesh shader", () => {
  const { PIXI } = fakePixi7();
  const surface = createFireSurface(PIXI, BOUNDS);
  surface.update({
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
  const uniforms = surface.display.shader.uniforms;
  assert.equal(uniforms.uTime, 3.5);
  assert.equal(uniforms.uOpacity, 0.6);
  assert.deepEqual(Array.from(uniforms.uWorldMin), [40, 80]);
  assert.deepEqual(Array.from(uniforms.uWorldSize), [200, 150]);
});

test("non-Pixi-7 runtimes return null so the renderer falls back to legacy", () => {
  const { PIXI } = fakePixi7();
  assert.equal(createFireSurface({ ...PIXI, VERSION: "8.1.0" }, BOUNDS), null);
  assert.equal(createFireSurface(undefined, BOUNDS), null);
  updateFireSurfaceUniforms(null, {});
});
