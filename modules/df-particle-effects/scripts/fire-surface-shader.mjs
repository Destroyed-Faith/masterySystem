import { LOG_PREFIX } from "./constants.mjs";

/**
 * Top-down area fire for Arrangement: Field.
 * World-anchored multi-scale noise with domain warp — one surface per region.
 *
 * Foundry 14 still exposes the Pixi v7 Filter(vertex, fragment, uniforms) path
 * (Program.vertexSrc.trim). Pixi v8 GlProgram is tried as a secondary path.
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

vec4 sampleFire(vec2 uvCoord, float srcAlpha) {
  if (srcAlpha < 0.01) return vec4(0.0);

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
  float thresh = mix(0.64, 0.30, coverage);
  float soft = mix(0.10, 0.055, coverage);
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

  float alpha = burn * mix(0.18, 0.58, heat) * clamp(uOpacity, 0.0, 1.0);
  alpha *= srcAlpha;
  if (alpha < 0.02) return vec4(0.0);
  return vec4(col * alpha, alpha);
}
`;

/** Pixi v7 / Foundry classic filter fragment (uSampler + gl_FragColor). */
export const FIRE_SURFACE_FRAGMENT_V7 = /* glsl */ `
varying vec2 vTextureCoord;
uniform sampler2D uSampler;
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
  vec4 src = texture2D(uSampler, vTextureCoord);
  gl_FragColor = sampleFire(vTextureCoord, src.a);
}
`;

/** Pixi v8 filter fragment (uTexture + out finalColor). */
export const FIRE_SURFACE_FRAGMENT = /* glsl */ `
in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
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
  vec4 src = texture(uTexture, vTextureCoord);
  finalColor = sampleFire(vTextureCoord, src.a);
}
`;

export const DEFAULT_VERTEX_V7 = /* glsl */ `
attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;
uniform mat3 projectionMatrix;
varying vec2 vTextureCoord;
void main(void) {
  gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
  vTextureCoord = aTextureCoord;
}
`;

export const DEFAULT_VERTEX = /* glsl */ `
in vec2 aPosition;
out vec2 vTextureCoord;
uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;
vec4 filterVertexPosition(void) {
  vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
  position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
  position.y = position.y * (2.0 * uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
  return vec4(position, 0.0, 1.0);
}
vec2 filterTextureCoord(void) {
  return aPosition * (uOutputFrame.zw * uInputSize.zw);
}
void main(void) {
  gl_Position = filterVertexPosition();
  vTextureCoord = filterTextureCoord();
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

function markApi(filter, api) {
  if (filter) filter.dfFireApi = api;
  return filter;
}

/**
 * @param {object} options
 * @param {number} [options.resolution]
 * @returns {object|null}
 */
export function createFireSurfaceFilter(options = {}) {
  const PIXI = globalThis.PIXI;
  if (!PIXI?.Filter) {
    console.warn(`${LOG_PREFIX} PIXI.Filter is unavailable. Field shader fire cannot run.`);
    return null;
  }

  const resolution = Number(options.resolution);
  const errors = [];

  // 1) Foundry / Pixi v7: Filter(vertex, fragment, uniforms) — matches Program.vertexSrc.trim
  try {
    const uniforms = createUniformState();
    const filter = new PIXI.Filter(DEFAULT_VERTEX_V7, FIRE_SURFACE_FRAGMENT_V7, uniforms);
    if (Number.isFinite(resolution) && resolution > 0) filter.resolution = resolution;
    return markApi(filter, "v7");
  } catch (error) {
    errors.push(error);
  }

  // 2) Pixi v8: explicit GlProgram + Filter options object
  try {
    const GlProgram = PIXI.GlProgram;
    if (GlProgram) {
      const vertex = String(DEFAULT_VERTEX);
      const fragment = String(FIRE_SURFACE_FRAGMENT);
      const glProgram = typeof GlProgram.from === "function"
        ? GlProgram.from({ vertex, fragment })
        : new GlProgram({ vertex, fragment });
      const filterOptions = {
        glProgram,
        resources: {
          fireUniforms: {
            uTime: { value: 0, type: "f32" },
            uOpacity: { value: 0.9, type: "f32" },
            uWorldMin: { value: new Float32Array([0, 0]), type: "vec2<f32>" },
            uWorldSize: { value: new Float32Array([1, 1]), type: "vec2<f32>" },
            uCellSize: { value: 100, type: "f32" },
            uNoiseScale: { value: 1, type: "f32" },
            uCoverage: { value: 0.4, type: "f32" },
            uSeed: { value: 0.5, type: "f32" },
          },
        },
        padding: 0,
        antialias: "off",
      };
      if (Number.isFinite(resolution) && resolution > 0) filterOptions.resolution = resolution;
      return markApi(new PIXI.Filter(filterOptions), "v8");
    }
  } catch (error) {
    errors.push(error);
  }

  // 3) Pixi v8 Filter.from with fragment only (default vertex)
  try {
    if (typeof PIXI.Filter.from === "function") {
      const filter = PIXI.Filter.from({
        gl: { fragment: String(FIRE_SURFACE_FRAGMENT) },
        resources: {
          fireUniforms: {
            uTime: { value: 0, type: "f32" },
            uOpacity: { value: 0.9, type: "f32" },
            uWorldMin: { value: new Float32Array([0, 0]), type: "vec2<f32>" },
            uWorldSize: { value: new Float32Array([1, 1]), type: "vec2<f32>" },
            uCellSize: { value: 100, type: "f32" },
            uNoiseScale: { value: 1, type: "f32" },
            uCoverage: { value: 0.4, type: "f32" },
            uSeed: { value: 0.5, type: "f32" },
          },
        },
        padding: 0,
        antialias: "off",
        ...(Number.isFinite(resolution) && resolution > 0 ? { resolution } : {}),
      });
      return markApi(filter, "v8-from");
    }
  } catch (error) {
    errors.push(error);
  }

  console.warn(`${LOG_PREFIX} Field fire shader could not be created.`, errors[0] ?? errors);
  return null;
}

/**
 * @param {object|null|undefined} filter
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
export function updateFireSurfaceUniforms(filter, state) {
  if (!filter) return;
  const uniforms = filter.resources?.fireUniforms?.uniforms ?? filter.uniforms;
  if (!uniforms) return;

  uniforms.uTime = state.time;
  uniforms.uOpacity = state.opacity;
  uniforms.uCellSize = state.cellSize;
  uniforms.uNoiseScale = state.noiseScale;
  uniforms.uCoverage = state.coverage;
  uniforms.uSeed = state.seed;

  writeVec2(uniforms, "uWorldMin", state.worldMinX, state.worldMinY);
  writeVec2(uniforms, "uWorldSize", state.worldWidth, state.worldHeight);
}

function writeVec2(uniforms, key, x, y) {
  const current = uniforms[key];
  if (current && typeof current === "object" && "length" in current && current.length >= 2) {
    current[0] = x;
    current[1] = y;
    return;
  }
  uniforms[key] = current instanceof Float32Array
    ? new Float32Array([x, y])
    : [x, y];
}

/**
 * Opaque plate covering region bounds. The filter paints fire; the region mask clips holes.
 * @param {object} PIXI
 * @param {{ x: number, y: number, width: number, height: number }} bounds
 * @returns {object|null}
 */
export function createFireSurfacePlate(PIXI, bounds) {
  const width = Math.max(1, Number(bounds.width) || 1);
  const height = Math.max(1, Number(bounds.height) || 1);
  const x = Number(bounds.x) || 0;
  const y = Number(bounds.y) || 0;

  if (PIXI.Texture?.WHITE && PIXI.Sprite) {
    const sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
    sprite.tint = 0xffffff;
    sprite.alpha = 1;
    sprite.position.set(x, y);
    sprite.width = width;
    sprite.height = height;
    if ("eventMode" in sprite) {
      sprite.eventMode = "none";
      sprite.interactiveChildren = false;
    }
    if (PIXI.Rectangle) sprite.filterArea = new PIXI.Rectangle(x, y, width, height);
    return sprite;
  }

  if (typeof PIXI.Graphics !== "function") return null;
  const graphics = new PIXI.Graphics();
  if (typeof graphics.rect === "function" && typeof graphics.fill === "function") {
    graphics.rect(0, 0, width, height);
    graphics.fill({ color: 0xffffff, alpha: 1 });
  } else if (typeof graphics.beginFill === "function" && typeof graphics.drawRect === "function") {
    graphics.beginFill(0xffffff, 1);
    graphics.drawRect(0, 0, width, height);
    graphics.endFill();
  } else {
    graphics.destroy?.();
    return null;
  }
  graphics.position.set(x, y);
  if ("eventMode" in graphics) {
    graphics.eventMode = "none";
    graphics.interactiveChildren = false;
  }
  if (PIXI.Rectangle) graphics.filterArea = new PIXI.Rectangle(x, y, width, height);
  return graphics;
}

export function destroyFireSurfaceFilter(filter) {
  if (!filter || filter.destroyed) return;
  try {
    filter.destroy?.(true);
  } catch {
    try {
      filter.destroy?.();
    } catch {
      /* already gone */
    }
  }
}
