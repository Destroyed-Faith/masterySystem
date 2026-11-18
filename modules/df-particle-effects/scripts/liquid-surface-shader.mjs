import { LOG_PREFIX } from "./constants.mjs";
import { textureFrameUv } from "./ice-surface-shader.mjs";
import { createRegionMesh } from "./region-mesh.mjs";
import { PLANE_NOISE, PLATE_BORDER } from "./shader-noise.mjs";

/**
 * Thick liquid seen from above (PixiJS 7 world-space Mesh, like the ice surface).
 *
 * A slowly flowing, domain-warped height field gives the surface its swells; the
 * normal from it drives diffuse light, highlights, a rim sheen and the refraction
 * of the scene background. Viscosity makes the forms bigger, smoother and slower.
 * On top: optional floating crust plates with glowing seams (lava), a crust or foam
 * band along the region edge, bubbles that swell, pop as a ring and come back, a
 * soft multi-hue flow (arcane) and an oily rainbow film (tar). All look values come
 * from a preset scaled by the sliders (liquid-presets.mjs).
 */
export const LIQUID_FRAGMENT = /* glsl */ `
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
uniform sampler2D uBackground;
uniform float uHasBackground;
uniform vec4 uBgRect;
uniform vec4 uBgFrame;
uniform vec3 uDeep;
uniform vec3 uBody;
uniform vec3 uSheen;
uniform vec3 uGlowColor;
uniform vec3 uAccent;
uniform float uViscosity;
uniform float uBubbles;
uniform float uBubbleSize;
uniform float uClarity;
uniform float uDistortion;
uniform float uGloss;
uniform float uGlow;
uniform float uPlates;
uniform float uCrust;
uniform float uFoam;
uniform float uIridescence;
uniform float uGradient;

${PLANE_NOISE}
${PLATE_BORDER}

const float TAU = 6.2831853;

// Height of the surface. Thick liquids lose the fine detail and keep broad swells.
float swell(vec2 q, float thick) {
  float broad = 0.62 * valueNoise(q * 0.9) + 0.3 * valueNoise(q * 1.9 + 3.0);
  return mix(fbm(q), broad, thick * 0.75);
}

vec3 floorColor(vec2 world) {
  vec2 local = clamp((world - uBgRect.xy) / max(uBgRect.zw, vec2(1.0)), 0.0, 1.0);
  return texture2D(uBackground, uBgFrame.xy + local * uBgFrame.zw).rgb;
}

// One bubble per cell. xy: dome slope, z: dome cover, w: pop ring.
// spot: highlight on the dome, outline: dark film at its foot.
vec4 bubble(vec2 world, float cell, float t, float thick, out float spot, out float outline) {
  spot = 0.0;
  outline = 0.0;
  vec2 b = world / (cell * max(uBubbleSize, 0.05) * 2.4) + vec2(uSeed * 13.0, uSeed * 7.0);
  vec2 id = floor(b);
  if (planeHash(id + 71.0) >= uBubbles) return vec4(0.0);
  vec2 jitter = planeHash2(id + 19.0);
  float period = (2.2 + 3.0 * jitter.x) * (0.6 + thick);
  float phase = fract(t / period + jitter.y);
  vec2 d = fract(b) - (0.5 + (jitter - 0.5) * 0.2);
  float dist = length(d);
  float radius = 0.34 * (0.65 + 0.35 * planeHash(id + 5.0));

  vec4 result = vec4(0.0);
  float r = radius * (0.25 + 0.75 * smoothstep(0.0, 0.5, phase)) * step(phase, 0.8);
  if (r > 0.01 && dist < r) {
    float k = dist / r;
    result.xy = -d / r * 1.6;
    result.z = 1.0 - smoothstep(0.85, 1.0, k);
    spot = (1.0 - smoothstep(0.05, 0.3, length(d / r - vec2(-0.35, -0.4)))) * result.z;
    outline = smoothstep(0.6, 0.95, k) * result.z;
  }
  if (phase > 0.8 && phase < 0.9) {
    float u = (phase - 0.8) / 0.1;
    float ring = radius * (1.0 + 0.15 * u);
    result.w = (1.0 - smoothstep(0.0, 0.03, abs(dist - ring))) * (1.0 - u);
  }
  return result;
}

void main() {
  vec2 world = uWorldMin + vTextureCoord * max(uWorldSize, vec2(1.0));
  float cell = max(uCellSize, 1.0);
  float visc = clamp(uViscosity, 0.05, 1.5);
  float thick = clamp(visc, 0.0, 1.0);
  float t = mod(uTime, 2000.0) * mix(1.3, 0.55, thick);
  float depthPx = texture2D(uDepth, vTextureCoord).r * uDepthRange;

  vec2 p = world / (cell * (1.1 + 1.5 * visc)) + vec2(uSeed * 37.0, uSeed * 19.0);
  vec2 warp = vec2(
    fbm(p * 0.6 + vec2(t * 0.05, -t * 0.04)),
    fbm(p * 0.6 + vec2(4.1, 2.7) - vec2(t * 0.045, t * 0.035))
  ) - 0.5;
  vec2 q = p + warp * mix(2.4, 1.4, thick) + vec2(t * 0.02, t * 0.012);
  float e = 0.05;
  float h = swell(q, thick);
  vec2 slope = vec2(swell(q + vec2(e, 0.0), thick) - h, swell(q + vec2(0.0, e), thick) - h) / e * mix(0.9, 0.5, thick);
  float tone = smoothstep(0.25, 0.75, h);

  vec2 plates = plateBorder(p * 0.9 + vec2(t * 0.025, t * 0.015) + warp * 0.4);
  float plateAmount = clamp(uPlates, 0.0, 1.0);
  float island = smoothstep(0.42, 0.58, h * 0.7 + plates.y * 0.45 + (plateAmount - 0.5) * 0.35) * step(0.01, plateAmount);
  float plateCover = smoothstep(0.02, 0.09, plates.x) * island;
  float seam = (1.0 - smoothstep(0.0, 0.07, plates.x)) * island;

  float crustWidth = max(uCrust, 0.0) * cell;
  float rough = (fbm(p * 3.0 + 9.0) - 0.5) * crustWidth * 0.8;
  float rim = crustWidth > 0.5 ? 1.0 - smoothstep(crustWidth * 0.55, crustWidth, depthPx + rough) : 0.0;
  float crust = max(plateCover, rim);
  float crustEdge = max(4.0 * island * (1.0 - island), 4.0 * rim * (1.0 - rim));

  float bubSpot;
  float bubOutline;
  vec4 bub = bubble(world, cell, t, thick, bubSpot, bubOutline);
  float bubAllowed = smoothstep(crustWidth * 0.8, crustWidth + cell * 0.3, depthPx) * (1.0 - plateCover);
  bub *= bubAllowed;
  bubSpot *= bubAllowed;
  bubOutline *= bubAllowed;
  slope = mix(slope, bub.xy, bub.z);
  vec3 n = normalize(vec3(-slope, 1.0));

  vec3 liquid = mix(uDeep, uBody, tone);
  liquid = mix(liquid, uAccent, smoothstep(0.6, 0.9, h) * 0.5 * (1.0 - uGradient));
  float hueTurn = h * 1.6 + t * 0.05 + dot(p, vec2(0.12, 0.08));
  vec3 weights = 0.5 + 0.5 * cos(TAU * (hueTurn + vec3(0.0, 0.333, 0.667)));
  weights = weights * weights;
  weights /= weights.x + weights.y + weights.z + 0.0001;
  vec3 flowHue = weights.x * uBody + weights.y * uAccent + weights.z * mix(uDeep, uSheen, 0.35);
  liquid = mix(liquid, flowHue * (0.75 + 0.35 * tone), clamp(uGradient, 0.0, 1.0));

  vec3 light = normalize(vec3(-0.45, -0.6, 0.66));
  vec3 halfway = normalize(light + vec3(0.0, 0.0, 1.0));
  float diffuse = 0.7 + 0.3 * max(dot(n, light), 0.0);
  float gloss = clamp(uGloss, 0.0, 1.0);
  float spec = pow(max(dot(n, halfway), 0.0), mix(8.0, 40.0, gloss)) * gloss;
  float rimLight = pow(1.0 - n.z, 2.0) * gloss * 0.8;
  vec3 film = 0.5 + 0.5 * cos(TAU * (h * 1.5 + t * 0.02 + vec3(0.0, 0.33, 0.67)));
  float iridescence = clamp(uIridescence, 0.0, 1.0);
  vec3 sheenColor = mix(uSheen, uSheen * (0.6 + 0.6 * film), iridescence * 0.5);
  vec3 shine = sheenColor * (spec * 1.2 + rimLight) * (1.0 - crust);
  shine += film * iridescence * smoothstep(0.55, 0.85, h) * 0.035 * (1.0 - crust);
  shine += uSheen * (bub.w * 0.6 + bubSpot * (0.35 + 0.5 * gloss));

  float pulse = 0.85 + 0.15 * sin(t * 1.9 + h * 8.0);
  float glow = max(uGlow, 0.0) * pulse;
  vec3 emission = uGlowColor * glow * (
    (0.25 + 0.5 * tone) * (1.0 - crust)
    + seam * 1.4
    + crustEdge * 0.8
    + bub.z * 0.3
    + bub.w
  );

  float grit = fbm(p * 5.0 + 3.0);
  vec3 skin = mix(uDeep * (0.5 + grit), mix(uDeep, liquid, 0.35), 0.4);
  vec3 foam = mix(uSheen, vec3(1.0), 0.3) * (0.7 + 0.3 * grit);
  vec3 crustColor = mix(skin, foam, clamp(uFoam, 0.0, 1.0));

  vec3 shaded = liquid * diffuse * (1.0 - bubOutline * 0.4);
  float clarity = clamp(uClarity, 0.0, 1.0) * (1.0 - crust);
  float veil = clamp(uOpacity, 0.0, 1.0) * smoothstep(0.0, cell * 0.06, depthPx);

  // Opaque path: the floor shows through the liquid, bent by its surface.
  float bendAmount = clamp(uDistortion, 0.0, 1.5);
  vec2 bend = n.xy * bendAmount * cell * 0.35;
  float blur = cell * 0.02 * (1.0 + bendAmount);
  vec3 seen = floorColor(world + bend) * 0.5
    + floorColor(world + bend + vec2(blur, 0.0)) * 0.25
    + floorColor(world + bend - vec2(0.0, blur)) * 0.25;
  vec3 tinted = seen * mix(vec3(1.0), uBody * 1.4 + 0.1, 0.65);
  vec3 surface = mix(mix(shaded, tinted, clarity), crustColor, crust);
  vec4 opaque = vec4((surface + shine + emission) * veil, veil);

  // Overlay path: translucent liquid over the map, light added on top.
  float cover = (1.0 - clarity * 0.75) * veil;
  vec3 body = mix(shaded, crustColor, crust);
  vec4 overlay = vec4(body * cover + (shine + emission) * veil, cover);

  gl_FragColor = mix(overlay, opaque, step(0.5, uHasBackground));
}
`;

/**
 * @param {object} PIXI
 * @param {{ x: number, y: number, width: number, height: number }} bounds
 * @param {{ width: number, height: number, values: Float32Array, maxDistance: number }} depth
 * @param {{ texture: object, rect: { x: number, y: number, width: number, height: number } }|null} background
 */
export function createLiquidSurface(PIXI, bounds, depth, background = null) {
  const uniforms = {
    uTime: 0,
    uOpacity: 0.9,
    uSeed: 0.5,
    uCellSize: 100,
    uWorldMin: new Float32Array([0, 0]),
    uWorldSize: new Float32Array([1, 1]),
    uDepthRange: Math.max(1, Number(depth.maxDistance) || 1),
    uBackground: background?.texture ?? PIXI.Texture.WHITE,
    uHasBackground: background ? 1 : 0,
    uBgRect: new Float32Array(background ? [background.rect.x, background.rect.y, background.rect.width, background.rect.height] : [0, 0, 1, 1]),
    uBgFrame: new Float32Array(background ? textureFrameUv(background.texture) : [0, 0, 1, 1]),
    uDeep: new Float32Array(3),
    uBody: new Float32Array(3),
    uSheen: new Float32Array(3),
    uGlowColor: new Float32Array(3),
    uAccent: new Float32Array(3),
    uViscosity: 0.5,
    uBubbles: 0,
    uBubbleSize: 0.5,
    uClarity: 0,
    uDistortion: 0,
    uGloss: 0.5,
    uGlow: 0,
    uPlates: 0,
    uCrust: 0,
    uFoam: 0,
    uIridescence: 0,
    uGradient: 0,
  };
  const built = createRegionMesh(PIXI, bounds, depth, LIQUID_FRAGMENT, uniforms, "viscous surface");
  if (!built) return null;
  const mesh = built.display;
  console.info(
    `${LOG_PREFIX} viscous surface shader ready (PixiJS ${PIXI.VERSION} Mesh, ${background ? "floor refraction" : "overlay only"}).`,
  );
  return {
    api: "mesh",
    display: mesh,
    refracts: Boolean(background),
    update(state) {
      updateLiquidUniforms(mesh.shader.uniforms, state);
    },
    destroy: built.destroy,
  };
}

const COLOR_UNIFORMS = { uDeep: "deep", uBody: "body", uSheen: "sheen", uGlowColor: "glowColor", uAccent: "accent" };
const SCALAR_UNIFORMS = {
  uViscosity: "viscosity",
  uBubbles: "bubbles",
  uBubbleSize: "bubbleSize",
  uClarity: "clarity",
  uDistortion: "distortion",
  uGloss: "gloss",
  uGlow: "emission",
  uPlates: "plates",
  uCrust: "crust",
  uFoam: "foam",
  uIridescence: "iridescence",
  uGradient: "gradient",
};

/**
 * @param {object|null|undefined} uniforms
 * @param {{ time: number, opacity: number, look: object, seed: number, cellSize: number,
 *   worldMinX: number, worldMinY: number, worldWidth: number, worldHeight: number }} state
 */
export function updateLiquidUniforms(uniforms, state) {
  if (!uniforms) return;
  uniforms.uTime = state.time;
  uniforms.uOpacity = state.opacity;
  uniforms.uSeed = state.seed;
  uniforms.uCellSize = state.cellSize;
  uniforms.uWorldMin[0] = state.worldMinX;
  uniforms.uWorldMin[1] = state.worldMinY;
  uniforms.uWorldSize[0] = state.worldWidth;
  uniforms.uWorldSize[1] = state.worldHeight;
  for (const [name, key] of Object.entries(COLOR_UNIFORMS)) {
    const color = state.look[key];
    uniforms[name][0] = color[0];
    uniforms[name][1] = color[1];
    uniforms[name][2] = color[2];
  }
  for (const [name, key] of Object.entries(SCALAR_UNIFORMS)) uniforms[name] = state.look[key];
}
