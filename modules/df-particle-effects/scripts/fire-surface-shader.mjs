import { LOG_PREFIX } from "./constants.mjs";

/**
 * Top-down area fire for Arrangement: Field.
 *
 * Foundry 13/14 ship PixiJS 7 (PIXI.VERSION 7.x). `PIXI.LegacyGraphics` is a Foundry
 * alias, not a Pixi 8 marker. The fire is one world-space Mesh quad with a generative
 * fragment shader, so it needs no render texture, filterArea, or input sampler.
 */

const FIRE_BODY = /* glsl */ `
float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 345.45));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(0.80, -0.60, 0.60, 0.80);
  for (int i = 0; i < 5; i++) {
    v += a * valueNoise(p);
    p = m * p * 2.02;
    a *= 0.5;
  }
  return v;
}

vec4 sampleFire(vec2 uvCoord) {
  float cell = max(uCellSize, 1.0);
  float scale = max(uNoiseScale, 0.25);
  vec2 world = uWorldMin + uvCoord * max(uWorldSize, vec2(1.0));
  vec2 uv = (world / cell) * (0.62 / scale) + vec2(uSeed * 19.7, uSeed * 11.3);

  float t = uTime;

  vec2 warp = vec2(
    fbm(uv * 0.85 + vec2(t * 0.13, -t * 0.07)),
    fbm(uv * 0.85 + vec2(4.2, 1.9) + vec2(-t * 0.09, t * 0.11))
  );
  vec2 p = uv + warp * 0.48;

  float patches = fbm(p * 1.05 + vec2(t * 0.04, t * 0.02));
  float lobes = fbm(p * 2.35 - vec2(t * 0.16, -t * 0.12));
  float detail = fbm(p * 5.8 + vec2(t * 0.38, -t * 0.31));
  float ridge = 1.0 - abs(lobes * 2.0 - 1.0);
  float field = patches * 0.52 + ridge * 0.33 + detail * 0.15;

  float coverage = clamp(uCoverage, 0.0, 1.0);
  float thresh = mix(0.58, 0.26, coverage);
  float soft = mix(0.11, 0.06, coverage);
  float burn = smoothstep(thresh - soft, thresh + soft * 0.35, field);

  float heat = clamp((field - (thresh - soft)) / max(0.001, 1.0 - (thresh - soft)), 0.0, 1.0);
  heat = pow(heat, 0.70);
  float flicker = 0.86 + 0.14 * sin(t * 8.5 + field * 17.0 + detail * 13.0);
  heat *= flicker;

  vec3 cEdge = vec3(0.32, 0.04, 0.01);
  vec3 cBody = vec3(0.95, 0.30, 0.03);
  vec3 cHot = vec3(1.0, 0.72, 0.22);
  vec3 cCore = vec3(1.0, 0.93, 0.68);
  vec3 col = mix(cEdge, cBody, smoothstep(0.0, 0.32, heat));
  col = mix(col, cHot, smoothstep(0.32, 0.68, heat));
  col = mix(col, cCore, smoothstep(0.68, 0.94, heat));

  float alpha = burn * mix(0.22, 0.68, heat) * clamp(uOpacity, 0.0, 1.0);
  if (alpha < 0.02) return vec4(0.0);
  return vec4(col * alpha, alpha);
}
`;

export const MESH_VERTEX = /* glsl */ `
precision highp float;
attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;
uniform mat3 translationMatrix;
uniform mat3 projectionMatrix;
varying vec2 vTextureCoord;
void main(void) {
  vTextureCoord = aTextureCoord;
  gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
}
`;

export const MESH_FRAGMENT = /* glsl */ `
precision mediump float;
varying vec2 vTextureCoord;
uniform float uTime;
uniform float uOpacity;
uniform vec2 uWorldMin;
uniform vec2 uWorldSize;
uniform float uCellSize;
uniform float uNoiseScale;
uniform float uCoverage;
uniform float uSeed;
${FIRE_BODY}
void main() {
  gl_FragColor = sampleFire(vTextureCoord);
}
`;

function createUniformState() {
  return {
    uTime: 0,
    uOpacity: 0.9,
    uWorldMin: new Float32Array([0, 0]),
    uWorldSize: new Float32Array([1, 1]),
    uCellSize: 100,
    uNoiseScale: 1,
    uCoverage: 0.4,
    uSeed: 0.5,
  };
}

export function pixiMajorVersion(PIXI = globalThis.PIXI) {
  const major = Number.parseInt(String(PIXI?.VERSION ?? ""), 10);
  return Number.isFinite(major) ? major : null;
}

/**
 * One world-space quad with the generative fire shader (PixiJS 7 API).
 *
 * @param {object} PIXI
 * @param {{ x: number, y: number, width: number, height: number }} bounds
 * @returns {{ api: string, display: object, update(state: object): void, destroy(): void }|null}
 */
export function createFireSurface(PIXI, bounds) {
  const major = pixiMajorVersion(PIXI);
  if (major !== 7) {
    console.warn(`${LOG_PREFIX} Field fire shader supports PixiJS 7 only (found ${PIXI?.VERSION ?? "none"}).`);
    return null;
  }
  if (!PIXI.Mesh || !PIXI.MeshGeometry || !PIXI.Shader?.from) {
    console.warn(`${LOG_PREFIX} PIXI.Mesh/MeshGeometry/Shader.from unavailable for Field fire.`);
    return null;
  }

  const width = Math.max(1, Number(bounds.width) || 1);
  const height = Math.max(1, Number(bounds.height) || 1);
  const x = Number(bounds.x) || 0;
  const y = Number(bounds.y) || 0;

  let mesh;
  try {
    const uniforms = createUniformState();
    const shader = PIXI.Shader.from(MESH_VERTEX, MESH_FRAGMENT, uniforms);
    const geometry = new PIXI.MeshGeometry(
      new Float32Array([0, 0, width, 0, width, height, 0, height]),
      new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
      new Uint16Array([0, 1, 2, 0, 2, 3]),
    );
    mesh = new PIXI.Mesh(geometry, shader);
  } catch (error) {
    console.warn(`${LOG_PREFIX} Field fire mesh could not be created.`, error);
    return null;
  }

  mesh.position.set(x, y);
  if ("eventMode" in mesh) {
    mesh.eventMode = "none";
    mesh.interactiveChildren = false;
  }

  console.info(`${LOG_PREFIX} Field fire shader ready (PixiJS ${PIXI.VERSION} Mesh).`);
  return {
    api: "mesh",
    display: mesh,
    update(state) {
      updateFireSurfaceUniforms(mesh.shader.uniforms, state);
    },
    destroy() {
      if (mesh.destroyed) return;
      mesh.destroy({ children: true });
    },
  };
}

/**
 * @param {object|null|undefined} uniforms
 * @param {{
 *   time: number,
 *   opacity: number,
 *   worldMinX: number,
 *   worldMinY: number,
 *   worldWidth: number,
 *   worldHeight: number,
 *   cellSize: number,
 *   noiseScale: number,
 *   coverage: number,
 *   seed: number,
 * }} state
 */
export function updateFireSurfaceUniforms(uniforms, state) {
  if (!uniforms) return;
  uniforms.uTime = state.time;
  uniforms.uOpacity = state.opacity;
  uniforms.uCellSize = state.cellSize;
  uniforms.uNoiseScale = state.noiseScale;
  uniforms.uCoverage = state.coverage;
  uniforms.uSeed = state.seed;
  uniforms.uWorldMin[0] = state.worldMinX;
  uniforms.uWorldMin[1] = state.worldMinY;
  uniforms.uWorldSize[0] = state.worldWidth;
  uniforms.uWorldSize[1] = state.worldHeight;
}
