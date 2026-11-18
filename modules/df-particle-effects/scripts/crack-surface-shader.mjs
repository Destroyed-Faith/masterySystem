import { LOG_PREFIX } from "./constants.mjs";
import { textureFrameUv } from "./ice-surface-shader.mjs";
import { createRegionMesh } from "./region-mesh.mjs";
import { PLANE_NOISE, PLATE_BORDER } from "./shader-noise.mjs";

/**
 * Ground breaking open into plates (PixiJS 7 world-space Mesh, like the ice surface).
 *
 * The plates are cells of a warped Voronoi pattern; the cracks are their borders,
 * measured as a true distance so the width stays even. A finer second pattern adds
 * hairline cracks in patches. With the Epicenter origin a pit opens in the region
 * middle and a few meandering fissures run outward, and the cracks travel from
 * the middle to the edge; Scattered opens them in noisy patches.
 *
 * Each pixel has an arrival value: when the break front passes it, the crack opens
 * thin and widens. Fresh cracks glow hotter and throw dust. With a scene background
 * the plates shift slightly against each other; without one the cracks, rims and
 * glow are drawn over the map. uShake moves everything while the ground breaks.
 */
export const CRACK_FRAGMENT = /* glsl */ `
precision highp float;
varying vec2 vTextureCoord;
uniform float uTime;
uniform float uOpacity;
uniform float uProgress;
uniform float uFade;
uniform float uOrigin;
uniform float uScale;
uniform float uWidth;
uniform float uGlow;
uniform vec3 uGlowColor;
uniform float uDust;
uniform vec2 uShake;
uniform float uSeed;
uniform float uCellSize;
uniform vec2 uWorldMin;
uniform vec2 uWorldSize;
uniform sampler2D uDepth;
uniform sampler2D uBackground;
uniform float uHasBackground;
uniform vec4 uBgRect;
uniform vec4 uBgFrame;

${PLANE_NOISE}
${PLATE_BORDER}

vec3 floorColor(vec2 world) {
  vec2 local = clamp((world - uBgRect.xy) / max(uBgRect.zw, vec2(1.0)), 0.0, 1.0);
  return texture2D(uBackground, uBgFrame.xy + local * uBgFrame.zw).rgb;
}

vec4 layer(vec4 below, vec3 color, float alpha) {
  return below * (1.0 - alpha) + vec4(color * alpha, alpha);
}

const float FRONT_WIDTH = 0.04;
const float OPEN_SPAN = 0.3;
const float FISSURES = 7.0;
const float MINOR_SCALE = 2.6;
const float TAU = 6.2831853;

void main() {
  float cell = max(uCellSize, 1.0);
  float unit = cell * 1.4 * max(uScale, 0.25);
  float t = mod(uTime, 1000.0);
  float depth = texture2D(uDepth, vTextureCoord).r;
  float inner = smoothstep(0.0, 0.12, depth);
  vec2 world = uWorldMin + vTextureCoord * max(uWorldSize, vec2(1.0)) + uShake * inner;

  vec2 g = world / unit + vec2(uSeed * 41.0, uSeed * 29.0);
  vec2 warp = vec2(fbm(g * 1.7), fbm(g * 1.7 + 9.3)) - 0.5;
  vec2 q = g + warp * 0.5;
  vec2 major = plateBorder(q);
  vec2 minor = plateBorder(q * MINOR_SCALE + vec2(21.0, 7.0) + warp);

  vec2 fromCenter = world - (uWorldMin + uWorldSize * 0.5);
  float r = length(fromCenter);
  float radial = clamp(r / max(0.5 * max(uWorldSize.x, uWorldSize.y), 1.0), 0.0, 1.0);
  float origin = clamp(uOrigin, 0.0, 1.0);
  float scattered = clamp((fbm(g * 0.5 + 2.0) - 0.25) / 0.5, 0.0, 1.0);
  float arrival = mix(scattered, radial * 0.85 + fbm(g * 1.3 + 4.0) * 0.15, origin);

  float front = uProgress * (1.0 + FRONT_WIDTH + OPEN_SPAN) - FRONT_WIDTH;
  float opened = smoothstep(arrival - FRONT_WIDTH, arrival + FRONT_WIDTH, front);
  float age = clamp((front - arrival) / OPEN_SPAN, 0.0, 1.0);
  age = age * (2.0 - age);
  float fresh = opened * (1.0 - age);

  float widthScale = clamp(uWidth, 0.25, 3.0);
  float vary = 0.6 + 0.8 * fbm(q * 0.7 + 5.0);
  float wMajor = max(0.04 * widthScale * vary * (0.3 + 0.7 * age), 0.0005);
  float minorMask = smoothstep(0.5, 0.62, fbm(g * 0.8 + 13.0));
  float wMinor = max(0.01 * widthScale * vary * age, 0.0005);
  float dMajor = major.x;
  float dMinor = minor.x / MINOR_SCALE;

  vec2 dir = fromCenter / max(r, 0.001);
  float meander = (fbm(dir * 1.5 + vec2(r / cell * 0.6, 3.1)) - 0.5) * 0.5;
  float turn = atan(fromCenter.y, fromCenter.x) / TAU * FISSURES + uSeed * 5.0;
  float dRay = abs((fract(turn + 0.5) - 0.5) / FISSURES * TAU * r / unit + meander);
  float wRay = max(0.045 * widthScale * vary * (0.35 + 0.65 * age) * (1.3 - 0.9 * radial), 0.0005);
  float pit = (1.0 - smoothstep(0.18, 0.42, r / unit)) * origin;

  float cMajor = 1.0 - smoothstep(wMajor * 0.45, wMajor, dMajor);
  float cMinor = (1.0 - smoothstep(wMinor * 0.45, wMinor, dMinor)) * minorMask;
  float cRay = (1.0 - smoothstep(wRay * 0.45, wRay, dRay)) * origin;
  float crack = max(max(cMajor, cMinor), max(cRay, pit * 0.9)) * opened;

  float core = max(
    max(1.0 - dMajor / wMajor, (1.0 - dMinor / wMinor) * minorMask),
    max((1.0 - dRay / wRay) * origin, pit)
  );
  core = clamp(core, 0.0, 1.0) * opened;

  float gap = min(dMajor - wMajor, mix(1.0, dRay - wRay, origin));
  gap = max(min(gap, mix(1.0, dMinor - wMinor, minorMask * 0.6)), 0.0);
  float lip = (1.0 - smoothstep(0.0, 0.05 * widthScale, gap)) * opened * (1.0 - crack);
  float shadow = (1.0 - smoothstep(0.0, 0.14 * widthScale, gap)) * opened * (1.0 - crack);

  float plateAngle = major.y * TAU;
  vec2 tilt = vec2(cos(plateAngle), sin(plateAngle));
  float facing = 0.5 + 0.5 * dot(tilt, vec2(-0.6, -0.8));
  vec2 plateShift = tilt * cell * 0.03 * widthScale * age * opened * inner;

  float pulse = 0.75 + 0.25 * sin(t * 2.3 + arrival * 14.0);
  float flow = 0.7 + 0.3 * sin(arrival * 30.0 - t * 5.0);
  float heat = clamp(uGlow, 0.0, 1.0) * pulse * flow * (1.0 + 1.2 * fresh);
  float halo = exp(-gap / (0.06 * widthScale + 0.02)) * opened * (1.0 - crack) * 0.45;
  vec3 glow = uGlowColor * heat * (core * 1.4 + halo) + vec3(1.0, 0.95, 0.85) * heat * core * core * core * 0.6;

  float puffs = smoothstep(0.45, 0.8, fbm(world / cell * 0.9 + vec2(0.0, t * 0.5) + warp * 2.0));
  float dust = clamp(uDust, 0.0, 1.0) * fresh * (1.0 - smoothstep(0.0, 0.35, gap)) * puffs * 0.85;
  vec3 dustColor = vec3(0.63, 0.57, 0.49);
  vec3 pitColor = vec3(0.05, 0.04, 0.035) * (1.0 - core * 0.6);

  float veil = clamp(uOpacity, 0.0, 1.0) * clamp(uFade, 0.0, 1.0);

  // Opaque path: redraw the floor as shifted plates.
  vec3 ground = floorColor(world + plateShift);
  ground *= 1.0 + (major.y - 0.5) * 0.16 * age * opened;
  ground *= 1.0 - shadow * 0.45;
  ground = mix(ground, ground * 1.35 + 0.05, lip * facing * 0.7);
  ground = mix(ground, pitColor, crack);
  ground = mix(ground, dustColor, dust) + glow;
  vec4 opaque = vec4(ground * veil, veil);

  // Overlay path: shadows, lit rims, cracks and dust over the map, glow added on top.
  vec4 overlay = layer(vec4(0.0), vec3(0.0), shadow * 0.4);
  overlay = layer(overlay, vec3(0.92, 0.86, 0.78), lip * facing * 0.35);
  overlay = layer(overlay, pitColor, crack);
  overlay = layer(overlay, dustColor, dust);
  overlay = vec4(overlay.rgb + glow, overlay.a) * veil;

  gl_FragColor = mix(overlay, opaque, step(0.5, uHasBackground));
}
`;

/**
 * @param {object} PIXI
 * @param {{ x: number, y: number, width: number, height: number }} bounds
 * @param {{ width: number, height: number, values: Float32Array }} depth
 * @param {{ texture: object, rect: { x: number, y: number, width: number, height: number } }|null} background
 */
export function createCrackSurface(PIXI, bounds, depth, background = null) {
  const uniforms = {
    uTime: 0,
    uOpacity: 0.9,
    uProgress: 1,
    uFade: 1,
    uOrigin: 1,
    uScale: 1,
    uWidth: 1,
    uGlow: 0.6,
    uGlowColor: new Float32Array([1, 0.48, 0.12]),
    uDust: 0.4,
    uShake: new Float32Array([0, 0]),
    uSeed: 0.5,
    uCellSize: 100,
    uWorldMin: new Float32Array([0, 0]),
    uWorldSize: new Float32Array([1, 1]),
    uBackground: background?.texture ?? PIXI.Texture.WHITE,
    uHasBackground: background ? 1 : 0,
    uBgRect: new Float32Array(background ? [background.rect.x, background.rect.y, background.rect.width, background.rect.height] : [0, 0, 1, 1]),
    uBgFrame: new Float32Array(background ? textureFrameUv(background.texture) : [0, 0, 1, 1]),
  };
  const built = createRegionMesh(PIXI, bounds, depth, CRACK_FRAGMENT, uniforms, "ground cracks");
  if (!built) return null;
  const mesh = built.display;
  console.info(
    `${LOG_PREFIX} ground crack shader ready (PixiJS ${PIXI.VERSION} Mesh, ${background ? "shifting plates" : "overlay only"}).`,
  );
  return {
    api: "mesh",
    display: mesh,
    shiftsPlates: Boolean(background),
    update(state) {
      updateCrackUniforms(mesh.shader.uniforms, state);
    },
    destroy: built.destroy,
  };
}

/**
 * Ground shake offset in world pixels. Two detuned waves per axis so it does not
 * read as a clean oscillation.
 */
export function shakeOffset(time, amplitude) {
  if (!(amplitude > 0)) return [0, 0];
  const x = (Math.sin(time * 61) + 0.6 * Math.sin(time * 37 + 1.3)) / 1.6;
  const y = (Math.cos(time * 53) + 0.6 * Math.sin(time * 29 + 0.7)) / 1.6;
  return [x * amplitude, y * amplitude];
}

export function updateCrackUniforms(uniforms, state) {
  if (!uniforms) return;
  uniforms.uTime = state.time;
  uniforms.uOpacity = state.opacity;
  uniforms.uProgress = state.progress;
  uniforms.uFade = state.fade;
  uniforms.uOrigin = state.origin;
  uniforms.uScale = state.scale;
  uniforms.uWidth = state.width;
  uniforms.uGlow = state.glow;
  uniforms.uGlowColor[0] = state.glowColor[0];
  uniforms.uGlowColor[1] = state.glowColor[1];
  uniforms.uGlowColor[2] = state.glowColor[2];
  uniforms.uDust = state.dust;
  uniforms.uShake[0] = state.shake[0];
  uniforms.uShake[1] = state.shake[1];
  uniforms.uSeed = state.seed;
  uniforms.uCellSize = state.cellSize;
  uniforms.uWorldMin[0] = state.worldMinX;
  uniforms.uWorldMin[1] = state.worldMinY;
  uniforms.uWorldSize[0] = state.worldWidth;
  uniforms.uWorldSize[1] = state.worldHeight;
}
