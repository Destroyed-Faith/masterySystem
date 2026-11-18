import { LOG_PREFIX } from "./constants.mjs";
import { createRegionMesh } from "./region-mesh.mjs";
import { PLANE_NOISE } from "./shader-noise.mjs";

/**
 * Drifting smoke or fog over the region floor (PixiJS 7 world-space Mesh).
 *
 * Two domain-warped noise layers drift at different speeds for depth. Density moves
 * the threshold between loose patches and a closed blanket. A second sample offset
 * toward a fixed light shades the billows. The edge-distance map fades the smoke out
 * over Edge Softness grid cells, with a noisy border.
 */
export const SMOKE_FRAGMENT = /* glsl */ `
precision highp float;
varying vec2 vTextureCoord;
uniform float uTime;
uniform float uOpacity;
uniform vec3 uColor;
uniform float uDensity;
uniform float uScale;
uniform vec2 uDrift;
uniform float uEdgeSoft;
uniform float uDepthRange;
uniform float uSeed;
uniform float uCellSize;
uniform vec2 uWorldMin;
uniform vec2 uWorldSize;
uniform sampler2D uDepth;

${PLANE_NOISE}

float billows(vec2 p, vec2 flow, float t) {
  vec2 warp = vec2(
    fbm(p * 0.6 + flow * 0.5 + vec2(0.0, t * 0.07)),
    fbm(p * 0.6 - flow * 0.5 + vec2(5.2, 1.3) + vec2(t * 0.06, 0.0))
  );
  return fbm(p + warp * 1.8 + flow);
}

void main() {
  vec2 world = uWorldMin + vTextureCoord * max(uWorldSize, vec2(1.0));
  float cell = max(uCellSize, 1.0);
  vec2 p = world / (cell * 2.4 * max(uScale, 0.25)) + vec2(uSeed * 31.0, uSeed * 17.0);
  float t = mod(uTime, 2000.0);
  vec2 flow = uDrift * t;

  float near = billows(p, flow, t);
  float far = billows(p * 1.9 + 11.0, flow * 0.6, t * 0.8);
  float body = near * 0.65 + far * 0.35;

  float threshold = mix(0.66, 0.02, clamp(uDensity, 0.0, 1.0));
  float puff = smoothstep(threshold, threshold + 0.28, body);
  if (puff < 0.002) {
    gl_FragColor = vec4(0.0);
    return;
  }

  float lit = billows(p + vec2(-0.07, -0.1), flow, t);
  float shade = clamp(0.8 + (near - lit) * 3.0, 0.5, 1.15);

  float soft = min(clamp(uEdgeSoft, 0.0, 10.0) * cell, uDepthRange * 0.5);
  float inset = texture2D(uDepth, vTextureCoord).r * uDepthRange + (far - 0.5) * soft;
  float edge = soft > 0.5 ? smoothstep(0.0, soft, inset) : 1.0;

  float alpha = puff * edge * clamp(uOpacity, 0.0, 1.0);
  gl_FragColor = vec4(uColor * shade * alpha, alpha);
}
`;

/**
 * @param {object} PIXI
 * @param {{ x: number, y: number, width: number, height: number }} bounds
 * @param {{ width: number, height: number, values: Float32Array, maxDistance: number }} depth
 */
export function createSmokeSurface(PIXI, bounds, depth) {
  const uniforms = {
    uTime: 0,
    uOpacity: 0.7,
    uColor: new Float32Array([0.72, 0.74, 0.76]),
    uDensity: 0.6,
    uScale: 1,
    uDrift: new Float32Array([0, 0]),
    uEdgeSoft: 1,
    uDepthRange: Math.max(1, Number(depth.maxDistance) || 1),
    uSeed: 0.5,
    uCellSize: 100,
    uWorldMin: new Float32Array([0, 0]),
    uWorldSize: new Float32Array([1, 1]),
  };
  const built = createRegionMesh(PIXI, bounds, depth, SMOKE_FRAGMENT, uniforms, "smoke");
  if (!built) return null;
  const mesh = built.display;
  console.info(`${LOG_PREFIX} smoke shader ready (PixiJS ${PIXI.VERSION} Mesh).`);
  return {
    api: "mesh",
    display: mesh,
    update(state) {
      updateSmokeUniforms(mesh.shader.uniforms, state);
    },
    destroy: built.destroy,
  };
}

/**
 * Noise-space drift per second for a compass direction (0° = up, 90° = right).
 * The pattern samples at p + flow, so it moves against the flow vector.
 */
export function driftVector(directionDegrees) {
  const radians = (Number(directionDegrees) || 0) * (Math.PI / 180);
  const step = 0.08;
  return [-Math.sin(radians) * step, Math.cos(radians) * step];
}

/** "#rrggbb" or a numeric color (Foundry Color) as linear 0–1 RGB. */
export function colorToRgb(value, fallback = [0.72, 0.74, 0.76]) {
  let number = null;
  if (typeof value === "number" || value instanceof Number) number = Number(value);
  else if (typeof value === "string" && /^#?[0-9a-f]{6}$/i.test(value.trim())) {
    number = Number.parseInt(value.trim().replace("#", ""), 16);
  }
  if (!Number.isInteger(number) || number < 0 || number > 0xffffff) return [...fallback];
  return [((number >> 16) & 255) / 255, ((number >> 8) & 255) / 255, (number & 255) / 255];
}

export function updateSmokeUniforms(uniforms, state) {
  if (!uniforms) return;
  uniforms.uTime = state.time;
  uniforms.uOpacity = state.opacity;
  uniforms.uColor[0] = state.color[0];
  uniforms.uColor[1] = state.color[1];
  uniforms.uColor[2] = state.color[2];
  uniforms.uDensity = state.density;
  uniforms.uScale = state.scale;
  uniforms.uDrift[0] = state.drift[0];
  uniforms.uDrift[1] = state.drift[1];
  uniforms.uEdgeSoft = state.edgeSoftness;
  uniforms.uSeed = state.seed;
  uniforms.uCellSize = state.cellSize;
  uniforms.uWorldMin[0] = state.worldMinX;
  uniforms.uWorldMin[1] = state.worldMinY;
  uniforms.uWorldSize[0] = state.worldWidth;
  uniforms.uWorldSize[1] = state.worldHeight;
}
