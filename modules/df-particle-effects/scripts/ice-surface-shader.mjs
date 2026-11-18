import { LOG_PREFIX } from "./constants.mjs";
import { MESH_VERTEX, pixiMajorVersion } from "./fire-surface-shader.mjs";
import { edgeDepthToRgba } from "./ice-depth.mjs";
import { PLANE_NOISE } from "./shader-noise.mjs";

/**
 * Ice covering the region floor (PixiJS 7 world-space Mesh, like the fire surface).
 *
 * Every texel has an arrival value: when the freeze front passes it, fine frost veins
 * appear first, then the surface thickens into a tinted, cracked ice plate with
 * faceted crystals, a slow sheen and glitter. Edge Bias blends the arrival value
 * between the distance from the region edge and plain noise.
 *
 * With a scene background texture the shader redraws the floor seen through the ice,
 * offset by the surface normal and softened where the frost is fresh. Without one it
 * falls back to a translucent tint over the map.
 */
export const ICE_FRAGMENT = /* glsl */ `
precision highp float;
varying vec2 vTextureCoord;
uniform float uTime;
uniform float uOpacity;
uniform float uProgress;
uniform float uFade;
uniform float uEdgeBias;
uniform float uCrystal;
uniform float uRefraction;
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

// Nearest and second-nearest crystal centre, plus a stable id for the nearest cell.
vec3 crystalCells(vec2 p) {
  vec2 cell = floor(p);
  vec2 f = fract(p);
  float nearest = 8.0;
  float second = 8.0;
  float id = 0.0;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 o = vec2(float(i), float(j));
      vec2 site = o + 0.15 + 0.7 * planeHash2(cell + o);
      float d = length(site - f);
      if (d < nearest) {
        second = nearest;
        nearest = d;
        id = planeHash(cell + o + 41.0);
      } else if (d < second) {
        second = d;
      }
    }
  }
  return vec3(nearest, second, id);
}

vec3 floorColor(vec2 world) {
  vec2 local = clamp((world - uBgRect.xy) / max(uBgRect.zw, vec2(1.0)), 0.0, 1.0);
  return texture2D(uBackground, uBgFrame.xy + local * uBgFrame.zw).rgb;
}

const float FRONT_WIDTH = 0.06;
const float THICKEN_SPAN = 0.35;

void main() {
  vec2 world = uWorldMin + vTextureCoord * max(uWorldSize, vec2(1.0));
  float cell = max(uCellSize, 1.0);
  vec2 g = world / (cell * max(uCrystal, 0.25)) + vec2(uSeed * 37.0, uSeed * 23.0);
  float t = mod(uTime, 1000.0);

  float depth = texture2D(uDepth, vTextureCoord).r;
  float spread = clamp((fbm(g * 0.45) - 0.22) / 0.56, 0.0, 1.0);
  float ragged = clamp((fbm(g * 1.6 + 7.0) - 0.22) / 0.56, 0.0, 1.0);
  float arrival = mix(spread, depth * 0.82 + ragged * 0.18, clamp(uEdgeBias, 0.0, 1.0));

  float front = uProgress * (1.0 + FRONT_WIDTH + THICKEN_SPAN) - FRONT_WIDTH;
  float frozen = smoothstep(arrival - FRONT_WIDTH, arrival + FRONT_WIDTH, front);
  float veil = frozen * clamp(uFade, 0.0, 1.0) * clamp(uOpacity, 0.0, 1.0);
  if (veil < 0.003) {
    gl_FragColor = vec4(0.0);
    return;
  }
  float age = clamp((front - arrival) / THICKEN_SPAN, 0.0, 1.0);
  float thick = age * age * (3.0 - 2.0 * age);
  float fresh = 1.0 - thick;

  vec3 plates = crystalCells(g * 1.1);
  vec3 veins = crystalCells(g * 3.3 + 17.0);
  float crack = (1.0 - smoothstep(0.0, 0.05, plates.y - plates.x)) * thick;
  float vein = 1.0 - smoothstep(0.0, 0.035, veins.y - veins.x);

  float e = 0.08;
  float h0 = fbm(g * 1.3 + 3.0);
  float hx = fbm(g * 1.3 + 3.0 + vec2(e, 0.0));
  float hy = fbm(g * 1.3 + 3.0 + vec2(0.0, e));
  float angle = plates.z * 6.2831853;
  vec2 tilt = vec2(cos(angle), sin(angle)) * 0.18;
  vec2 slope = vec2(hx - h0, hy - h0) / e * 0.3 + tilt * thick;

  float refraction = clamp(uRefraction, 0.0, 1.0);
  vec2 offset = slope * refraction * cell * 0.12;
  float blur = cell * (0.015 + 0.05 * fresh) * refraction;
  vec3 seen = floorColor(world + offset) * 0.4
    + floorColor(world + offset + vec2(blur, 0.0)) * 0.15
    + floorColor(world + offset - vec2(blur, 0.0)) * 0.15
    + floorColor(world + offset + vec2(0.0, blur)) * 0.15
    + floorColor(world + offset - vec2(0.0, blur)) * 0.15;

  vec3 deep = vec3(0.10, 0.28, 0.48);
  vec3 pale = vec3(0.80, 0.92, 1.00);
  vec3 tint = mix(deep, pale, 0.35 + 0.4 * h0);
  vec3 rimeColor = vec3(0.93, 0.97, 1.00);
  vec3 crackColor = vec3(0.60, 0.88, 0.97);

  vec3 normal = normalize(vec3(-slope * 0.8, 1.0));
  vec3 light = normalize(vec3(-0.45, -0.55, 0.70));
  float diffuse = max(dot(normal, light), 0.0);
  float spec = pow(max(dot(normal, normalize(light + vec3(0.0, 0.0, 1.0))), 0.0), 60.0) * thick * 0.35;

  float band = dot(world / cell, vec2(0.6, 0.8)) * 0.25 - t * 0.12;
  float sheen = pow(0.5 + 0.5 * sin(band * 6.2831853), 12.0) * thick * 0.3;

  vec2 sparkGrid = g * 5.0;
  vec2 sparkCell = floor(sparkGrid);
  float sparkSeed = latticeHash(vec3(sparkCell, 11.1));
  float sparkle = 0.0;
  if (sparkSeed > 0.93) {
    vec2 sparkPos = fract(sparkGrid) - (0.2 + 0.6 * planeHash2(sparkCell + 5.0));
    float twinkle = pow(max(0.0, sin(t * (1.5 + sparkSeed * 3.0) + sparkSeed * 90.0)), 6.0);
    sparkle = twinkle * smoothstep(0.12, 0.0, length(sparkPos));
  }

  float atFront = frozen * fresh;
  float rimEdge = 1.0 - smoothstep(0.0, 0.12, depth);
  float rime = clamp(vein * (0.12 + 0.68 * fresh) + atFront * 0.5 + rimEdge * 0.45, 0.0, 1.0);
  float light3 = spec + sheen + sparkle;

  // Opaque path: redraw the floor through the ice.
  vec3 through = seen * mix(vec3(1.0), vec3(0.72, 0.87, 1.04), 0.6 + 0.3 * thick);
  vec3 solid = mix(through, tint, 0.22 + 0.18 * thick);
  solid = mix(solid, rimeColor, rime * 0.75);
  solid = mix(solid, crackColor, crack * 0.55);
  solid = solid * (0.92 + 0.16 * diffuse) + light3;
  vec4 opaque = vec4(solid * veil, veil);

  // Translucent path: tint over the map, light added on top.
  float cover = clamp(0.28 + 0.3 * thick + 0.45 * rime + 0.3 * crack, 0.0, 1.0) * veil;
  vec3 surface = mix(tint, rimeColor, rime * 0.8);
  surface = mix(surface, crackColor, crack * 0.6) * (0.85 + 0.3 * diffuse);
  vec4 glaze = vec4(surface * cover + light3 * veil, cover);

  gl_FragColor = mix(glaze, opaque, step(0.5, uHasBackground));
}
`;

/**
 * @param {object} PIXI
 * @param {{ x: number, y: number, width: number, height: number }} bounds
 * @param {{ width: number, height: number, values: Float32Array }} depth
 * @param {{ texture: object, rect: { x: number, y: number, width: number, height: number } }|null} background
 */
export function createIceSurface(PIXI, bounds, depth, background = null) {
  const major = pixiMajorVersion(PIXI);
  if (major !== 7) {
    console.warn(`${LOG_PREFIX} ice shader supports PixiJS 7 only (found ${PIXI?.VERSION ?? "none"}).`);
    return null;
  }
  if (!PIXI.Mesh || !PIXI.MeshGeometry || !PIXI.Shader?.from || !PIXI.Texture?.fromBuffer) {
    console.warn(`${LOG_PREFIX} PIXI.Mesh/MeshGeometry/Shader.from/Texture.fromBuffer unavailable for ice.`);
    return null;
  }

  const width = Math.max(1, Number(bounds.width) || 1);
  const height = Math.max(1, Number(bounds.height) || 1);
  let depthTexture = null;
  let mesh;
  try {
    depthTexture = PIXI.Texture.fromBuffer(edgeDepthToRgba(depth), depth.width, depth.height, {
      scaleMode: PIXI.SCALE_MODES?.LINEAR,
      mipmap: PIXI.MIPMAP_MODES?.OFF,
    });
    const shader = PIXI.Shader.from(MESH_VERTEX, ICE_FRAGMENT, iceUniforms(PIXI, depthTexture, background));
    const geometry = new PIXI.MeshGeometry(
      new Float32Array([0, 0, width, 0, width, height, 0, height]),
      new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
      new Uint16Array([0, 1, 2, 0, 2, 3]),
    );
    mesh = new PIXI.Mesh(geometry, shader);
  } catch (error) {
    console.warn(`${LOG_PREFIX} ice mesh could not be created.`, error);
    depthTexture?.destroy?.(true);
    return null;
  }

  mesh.position.set(Number(bounds.x) || 0, Number(bounds.y) || 0);
  if ("eventMode" in mesh) {
    mesh.eventMode = "none";
    mesh.interactiveChildren = false;
  }
  console.info(
    `${LOG_PREFIX} ice shader ready (PixiJS ${PIXI.VERSION} Mesh, ${background ? "floor refraction" : "tint only"}).`,
  );
  return {
    api: "mesh",
    display: mesh,
    refracts: Boolean(background),
    update(state) {
      updateIceUniforms(mesh.shader.uniforms, state);
    },
    destroy() {
      if (!mesh.destroyed) mesh.destroy({ children: true });
      depthTexture?.destroy?.(true);
      depthTexture = null;
    },
  };
}

function iceUniforms(PIXI, depthTexture, background) {
  return {
    uTime: 0,
    uOpacity: 0.9,
    uProgress: 1,
    uFade: 1,
    uEdgeBias: 0.7,
    uCrystal: 1,
    uRefraction: 0.4,
    uSeed: 0.5,
    uCellSize: 100,
    uWorldMin: new Float32Array([0, 0]),
    uWorldSize: new Float32Array([1, 1]),
    uDepth: depthTexture,
    uBackground: background?.texture ?? PIXI.Texture.WHITE,
    uHasBackground: background ? 1 : 0,
    uBgRect: new Float32Array(background ? [background.rect.x, background.rect.y, background.rect.width, background.rect.height] : [0, 0, 1, 1]),
    uBgFrame: new Float32Array(background ? textureFrameUv(background.texture) : [0, 0, 1, 1]),
  };
}

/** Sub-rectangle of a texture inside its base texture, in UV units. */
export function textureFrameUv(texture) {
  const base = texture?.baseTexture;
  const frame = texture?.frame;
  const baseWidth = Number(base?.width) || 0;
  const baseHeight = Number(base?.height) || 0;
  if (!frame || !(baseWidth > 0) || !(baseHeight > 0)) return [0, 0, 1, 1];
  return [frame.x / baseWidth, frame.y / baseHeight, frame.width / baseWidth, frame.height / baseHeight];
}

/**
 * @param {object|null|undefined} uniforms
 * @param {{ time: number, opacity: number, progress: number, fade: number, edgeBias: number,
 *   crystal: number, refraction: number, seed: number, cellSize: number,
 *   worldMinX: number, worldMinY: number, worldWidth: number, worldHeight: number }} state
 */
export function updateIceUniforms(uniforms, state) {
  if (!uniforms) return;
  uniforms.uTime = state.time;
  uniforms.uOpacity = state.opacity;
  uniforms.uProgress = state.progress;
  uniforms.uFade = state.fade;
  uniforms.uEdgeBias = state.edgeBias;
  uniforms.uCrystal = state.crystal;
  uniforms.uRefraction = state.refraction;
  uniforms.uSeed = state.seed;
  uniforms.uCellSize = state.cellSize;
  uniforms.uWorldMin[0] = state.worldMinX;
  uniforms.uWorldMin[1] = state.worldMinY;
  uniforms.uWorldSize[0] = state.worldWidth;
  uniforms.uWorldSize[1] = state.worldHeight;
}
