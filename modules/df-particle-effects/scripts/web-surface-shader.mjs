import { LOG_PREFIX } from "./constants.mjs";
import { createRegionMesh } from "./region-mesh.mjs";
import { PLANE_NOISE } from "./shader-noise.mjs";

/**
 * Spider web over the region, seen from above (PixiJS 7 world-space Mesh).
 *
 * Spokes run out from a hub at the deepest point of the region. A capture spiral
 * winds outward over them: each turn is a chain of straight chords from spoke to
 * spoke that sag a little toward the hub. A dense small hub sits in the middle and
 * a frame thread follows the region edge (and holes); spokes and spiral end there.
 * Coverage tears out chords and spoke pieces. Animation flexes the outer web and
 * runs a soft glint along the silk. Each thread has a faint dark fringe so it
 * stays readable on light floors.
 */
export const WEB_FRAGMENT = /* glsl */ `
precision highp float;
varying vec2 vTextureCoord;
uniform float uTime;
uniform float uOpacity;
uniform float uSeed;
uniform float uCellSize;
uniform vec2 uWorldMin;
uniform vec2 uWorldSize;
uniform sampler2D uDepth;
uniform float uDepthRange;
uniform vec2 uHub;
uniform float uHubRadius;
uniform float uSpacing;
uniform float uRadials;
uniform float uThickness;
uniform float uCoverage;
uniform float uMotion;
uniform vec3 uColor;

${PLANE_NOISE}

const float TAU = 6.2831853;

float spokeAngle(float k, float n) {
  float slot = mod(k, n);
  return (k + (planeHash(vec2(slot * 1.7, uSeed * 31.0)) - 0.5) * 0.4) * TAU / n;
}

// Turns widen a little outward: turn x sits at base + spacing * x * (1 + SPREAD * x).
const float SPREAD = 0.035;

float turnRadius(float x, float base, float spacing) {
  return base + spacing * x * (1.0 + SPREAD * x);
}

float turnAt(float r, float base, float spacing) {
  float d = max(r - base, 0.0) / spacing;
  return (sqrt(1.0 + 4.0 * SPREAD * d) - 1.0) / (2.0 * SPREAD);
}

// Radius where turn index L of a spiral crosses its spoke.
float spiralRadius(float L, float n, float base, float spacing, float wobble) {
  float x = L / n;
  float local = spacing * (1.0 + 2.0 * SPREAD * x);
  return turnRadius(x, base, spacing) + local * wobble * (planeHash(vec2(L * 0.61, uSeed * 7.0 + 2.0)) - 0.5);
}

// Distance to the chord a-b, bowed toward the hub by sag at its middle.
float chordDistance(vec2 p, vec2 a, vec2 b, float sag) {
  vec2 ab = b - a;
  float t = clamp(dot(p - a, ab) / max(dot(ab, ab), 0.0001), 0.0, 1.0);
  vec2 mid = a + b;
  vec2 inward = mid / max(length(mid), 0.0001);
  vec2 c = a + ab * t - inward * sag * 4.0 * t * (1.0 - t);
  return length(p - c);
}

// Nearest chord of a spiral (base, spacing) in the sector right of spoke k.
float spiralDistance(vec2 rel, float r, float k, float n, float base, float spacing, float sag, float wobble,
                     float keepChance, float maxTurn) {
  float slot = mod(k, n);
  vec2 dirA = vec2(cos(spokeAngle(k, n)), sin(spokeAngle(k, n)));
  vec2 dirB = vec2(cos(spokeAngle(k + 1.0, n)), sin(spokeAngle(k + 1.0, n)));
  float guess = floor(turnAt(r, base, spacing) - slot / n);
  float best = 100000.0;
  for (int q = -1; q <= 1; q++) {
    float turn = guess + float(q);
    if (turn < 0.0 || turn >= maxTurn) continue;
    float L = turn * n + slot;
    if (planeHash(vec2(L * 1.31 + 0.5, uSeed * 5.0 + base)) > keepChance) continue;
    vec2 a = dirA * spiralRadius(L, n, base, spacing, wobble);
    vec2 b = dirB * spiralRadius(L + 1.0, n, base, spacing, wobble);
    best = min(best, chordDistance(rel, a, b, sag));
  }
  return best;
}

float thread(float d, float halfWidth) {
  return 1.0 - smoothstep(halfWidth * 0.55, halfWidth * 1.45, d);
}

void main() {
  vec2 world = uWorldMin + vTextureCoord * max(uWorldSize, vec2(1.0));
  float cell = max(uCellSize, 1.0);
  float depthPx = texture2D(uDepth, vTextureCoord).r * uDepthRange;
  float n = max(floor(uRadials + 0.5), 3.0);
  float w = max(uThickness, 0.3);
  float spacing = max(uSpacing, w * 6.0);

  vec2 rel = world - uHub;
  float r0 = length(rel);
  float flex = uMotion * cell * 0.05 * smoothstep(uHubRadius, uHubRadius + spacing * 6.0, r0);
  rel += flex * vec2(
    sin(uTime * 0.9 + r0 / cell * 0.8 + uSeed * 6.0),
    sin(uTime * 0.75 - r0 / cell * 0.6 + 1.3)
  );
  float r = length(rel);
  float angle = atan(rel.y, rel.x);
  if (angle < 0.0) angle += TAU;
  float k0 = floor(angle / (TAU / n));

  float frameInset = max(spacing * 0.35, w * 5.0);
  float inFrame = smoothstep(frameInset * 0.6, frameInset * 0.9, depthPx);
  float spiralBase = uHubRadius + spacing * 0.9;
  float keepChord = 0.3 + 0.7 * clamp(uCoverage, 0.0, 1.0);
  float keepSpoke = 0.75 + 0.25 * clamp(uCoverage, 0.0, 1.0);

  float dSpoke = 100000.0;
  float dSpiral = 100000.0;
  float dHub = 100000.0;
  for (int s = -1; s <= 1; s++) {
    float k = k0 + float(s);
    vec2 dir = vec2(cos(spokeAngle(k, n)), sin(spokeAngle(k, n)));
    float along = dot(rel, dir);
    float piece = floor(turnAt(along, spiralBase, spacing) / 3.0);
    float keep = along < spiralBase
      || planeHash(vec2(mod(k, n) * 3.1 + piece * 17.0, uSeed * 13.0 + 5.0)) <= keepSpoke ? 1.0 : 0.0;
    if (along > 0.0 && keep > 0.5) dSpoke = min(dSpoke, abs(rel.x * dir.y - rel.y * dir.x));
    dSpiral = min(dSpiral, spiralDistance(rel, r, k, n, spiralBase, spacing, spacing * 0.09, 0.22, keepChord, 400.0));
    dHub = min(dHub, spiralDistance(rel, r, k, n, uHubRadius * 0.18, uHubRadius * 0.24, 0.0, 0.5, 1.0, 4.0));
  }

  float spokes = thread(dSpoke, w * 1.15);
  float spiral = thread(dSpiral, w * 0.85) * step(spiralBase - spacing * 0.5, r);
  float hub = thread(dHub, w * 0.8) + (1.0 - smoothstep(uHubRadius * 0.1, uHubRadius * 0.22, r)) * 0.55;
  float frame = thread(abs(depthPx - frameInset * 0.75), w * 1.35);
  float silk = clamp(max(max(spokes, spiral), hub) * inFrame + frame, 0.0, 1.0);

  float fringeD = min(min(dSpoke, dSpiral), dHub);
  float fringe = (1.0 - smoothstep(w * 1.2, w * 3.2, fringeD)) * inFrame
    + (1.0 - smoothstep(w * 1.3, w * 3.4, abs(depthPx - frameInset * 0.75)));
  fringe = clamp(fringe, 0.0, 1.0);

  float glint = pow(0.5 + 0.5 * sin(r / cell * 2.4 - uTime * (0.4 + 1.2 * uMotion) + angle * 3.0), 10.0);
  float veil = clamp(uOpacity, 0.0, 1.0) * smoothstep(0.0, cell * 0.03, depthPx);
  float core = silk * 0.92 * veil;
  vec3 light = uColor * core + vec3(1.0) * glint * silk * 0.3 * veil;
  float shadow = fringe * 0.3 * veil * (1.0 - core);
  gl_FragColor = vec4(light, core + shadow);
}
`;

/**
 * @param {object} PIXI
 * @param {{ x: number, y: number, width: number, height: number }} bounds
 * @param {{ width: number, height: number, values: Float32Array, maxDistance: number }} depth
 * @param {{ x: number, y: number }} hub world point the spokes start from
 */
export function createWebSurface(PIXI, bounds, depth, hub) {
  const uniforms = {
    uTime: 0,
    uOpacity: 0.9,
    uSeed: 0.5,
    uCellSize: 100,
    uWorldMin: new Float32Array([0, 0]),
    uWorldSize: new Float32Array([1, 1]),
    uDepthRange: Math.max(1, Number(depth.maxDistance) || 1),
    uHub: new Float32Array([hub.x, hub.y]),
    uHubRadius: 30,
    uSpacing: 20,
    uRadials: 16,
    uThickness: 1.4,
    uCoverage: 1,
    uMotion: 0,
    uColor: new Float32Array([1, 1, 1]),
  };
  const built = createRegionMesh(PIXI, bounds, depth, WEB_FRAGMENT, uniforms, "web");
  if (!built) return null;
  const mesh = built.display;
  console.info(`${LOG_PREFIX} web shader ready (PixiJS ${PIXI.VERSION} Mesh).`);
  return {
    api: "mesh",
    display: mesh,
    update(state) {
      updateWebUniforms(mesh.shader.uniforms, state, depth.maxDistance);
    },
    destroy: built.destroy,
  };
}

/**
 * Hub, spiral spacing and thread width from the region size and the sliders.
 * Rings is the number of spiral turns between the hub and the deepest edge distance.
 */
export function webLayout({ maxDistance, cellSize, rings, halfWidthCells }) {
  const cell = Math.max(1, cellSize);
  const reach = Math.max(cell * 0.5, Number(maxDistance) || 0);
  const hubRadius = Math.min(cell * 1.2, Math.max(cell * 0.25, reach * 0.12));
  const turns = Math.max(1, Math.round(rings));
  const halfWidth = Math.max(0.3, halfWidthCells * cell);
  const spacing = Math.max(halfWidth * 6, (reach - hubRadius * 1.9) / turns);
  return { hubRadius, spacing, halfWidth };
}

/**
 * @param {object|null|undefined} uniforms
 * @param {{ time: number, opacity: number, seed: number, cellSize: number, worldMinX: number,
 *   worldMinY: number, worldWidth: number, worldHeight: number, radials: number, rings: number,
 *   coverage: number, motion: number, halfWidthCells: number, color: number[] }} state
 * @param {number} maxDistance
 */
export function updateWebUniforms(uniforms, state, maxDistance) {
  if (!uniforms) return;
  const layout = webLayout({ maxDistance, cellSize: state.cellSize, rings: state.rings, halfWidthCells: state.halfWidthCells });
  uniforms.uTime = state.time;
  uniforms.uOpacity = state.opacity;
  uniforms.uSeed = state.seed;
  uniforms.uCellSize = state.cellSize;
  uniforms.uWorldMin[0] = state.worldMinX;
  uniforms.uWorldMin[1] = state.worldMinY;
  uniforms.uWorldSize[0] = state.worldWidth;
  uniforms.uWorldSize[1] = state.worldHeight;
  uniforms.uHubRadius = layout.hubRadius;
  uniforms.uSpacing = layout.spacing;
  uniforms.uThickness = layout.halfWidth;
  uniforms.uRadials = state.radials;
  uniforms.uCoverage = state.coverage;
  uniforms.uMotion = state.motion;
  uniforms.uColor[0] = state.color[0];
  uniforms.uColor[1] = state.color[1];
  uniforms.uColor[2] = state.color[2];
}
