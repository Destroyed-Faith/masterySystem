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

// Ridged turbulence: thin bright creases instead of soft blobs.
float turbulence(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(0.80, -0.60, 0.60, 0.80);
  for (int i = 0; i < 4; i++) {
    v += a * abs(valueNoise(p) * 2.0 - 1.0);
    p = m * p * 2.03;
    a *= 0.5;
  }
  return v;
}

vec3 fireRamp(float h) {
  vec3 c = mix(vec3(0.20, 0.02, 0.00), vec3(0.85, 0.12, 0.02), smoothstep(0.00, 0.30, h));
  c = mix(c, vec3(1.00, 0.45, 0.05), smoothstep(0.25, 0.55, h));
  c = mix(c, vec3(1.00, 0.78, 0.25), smoothstep(0.50, 0.80, h));
  return mix(c, vec3(1.00, 0.97, 0.80), smoothstep(0.80, 1.00, h));
}

/*
 * Premultiplied output with rgb > alpha: alpha darkens the floor (scorch/smoke),
 * the excess rgb adds light. That reads as glowing fire, not tinted liquid.
 * Octaves move in opposing directions and cancel, so the field boils in place
 * instead of flowing.
 */
vec4 sampleFire(vec2 uvCoord) {
  float cell = max(uCellSize, 1.0);
  float scale = max(uNoiseScale, 0.25);
  vec2 world = uWorldMin + uvCoord * max(uWorldSize, vec2(1.0));
  vec2 uv = (world / cell) * (0.75 / scale) + vec2(uSeed * 19.7, uSeed * 11.3);

  float t = uTime;

  vec2 q = vec2(
    fbm(uv * 0.7 + vec2(0.0, t * 0.30)),
    fbm(uv * 0.7 + vec2(5.2, 1.3) - vec2(0.0, t * 0.27))
  );
  vec2 r = vec2(
    fbm(uv * 1.3 + q * 1.7 + vec2(t * 0.55, 1.7)),
    fbm(uv * 1.3 + q * 1.7 + vec2(8.3, 2.8) - vec2(t * 0.51, 0.0))
  );

  float base = fbm(uv * 0.55 + r * 0.9);
  float tA = turbulence(uv * 2.2 + r * 2.4 + vec2(t * 0.95, 0.0));
  float tB = turbulence(uv * 2.5 + r * 2.0 + vec2(3.1, 7.4) - vec2(0.0, t * 0.90));
  float tongues = 1.0 - 0.5 * (tA + tB);
  float flick = valueNoise(uv * 7.0 + vec2(t * 3.3, -t * 2.9));

  float coverage = clamp(uCoverage, 0.0, 1.0);
  float thresh = mix(0.62, 0.34, coverage);
  float zone = smoothstep(thresh - 0.10, thresh + 0.10, base);

  float heat = zone * (0.60 * tongues + 0.25 * base + 0.15 * flick);
  heat = clamp((heat - 0.22) / 0.60, 0.0, 1.0);
  heat = heat * heat * (3.0 - 2.0 * heat);

  float opacity = clamp(uOpacity, 0.0, 1.0);
  float glow = heat * 1.35 * opacity;
  float scorch = zone * mix(0.18, 0.70, heat) * opacity;
  if (glow < 0.01 && scorch < 0.01) return vec4(0.0);
  return vec4(fireRamp(heat) * glow, scorch);
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
