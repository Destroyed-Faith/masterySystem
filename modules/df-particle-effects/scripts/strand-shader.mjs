import { PLANE_NOISE } from "./shader-noise.mjs";

/** Strand style ids in the shader. */
export const STRAND_SHADER_STYLE = Object.freeze({ rope: 0, chains: 1, serpent: 2, vines: 3 });

/**
 * Strip vertices are world positions. aTextureCoord: x = arc length in strand
 * widths, y = 0..1 across. aInfo: x = depth shade (vines winding under each other),
 * y = 0..1 along the strand (serpent head to tail).
 */
export const STRAND_VERTEX = /* glsl */ `
precision highp float;
attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;
attribute vec2 aInfo;
uniform mat3 translationMatrix;
uniform mat3 projectionMatrix;
varying vec2 vUv;
varying vec2 vInfo;
void main(void) {
  vUv = aTextureCoord;
  vInfo = aInfo;
  gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
}
`;

/**
 * Seen from above, lit evenly from overhead, so shading does not depend on which
 * way a strand turns. Premultiplied output. In shadow mode the same shape is drawn
 * as a soft dark copy (the mesh is offset by the caller).
 */
export const STRAND_FRAGMENT = /* glsl */ `
precision highp float;
varying vec2 vUv;
varying vec2 vInfo;
uniform float uStyle;
uniform vec3 uColor;
uniform float uOpacity;
uniform float uShadow;
uniform float uDetail;
uniform float uSeed;

${PLANE_NOISE}

const float PI = 3.1415927;

// Three plies twisting along the rope: diagonal rounded bands with dark grooves.
vec4 rope(vec2 uv) {
  float x = uv.y * 2.0 - 1.0;
  float cover = 1.0 - smoothstep(0.84, 1.0, abs(x));
  float domed = sqrt(max(1.0 - x * x, 0.0));
  float twist = uv.x * 2.4 + x * 0.62;
  float f = fract(twist);
  float ply = sin(f * PI);
  float groove = smoothstep(0.0, 0.16, f) * (1.0 - smoothstep(0.84, 1.0, f));
  float fibre = valueNoise(vec2((uv.x * 1.3 - x * 0.8) * 11.0, floor(twist) * 7.3 + uSeed * 20.0));
  vec3 c = uColor * (0.42 + 0.58 * domed) * (0.7 + 0.3 * ply) * mix(0.5, 1.0, groove) * (0.84 + 0.3 * fibre);
  c += vec3(1.0, 0.95, 0.85) * 0.1 * pow(domed, 6.0) * ply;
  return vec4(c, cover);
}

// Alternating links: a flat oval ring, then an upright link seen as a bar through it.
vec4 chain(vec2 uv) {
  float pitch = 0.78;
  float across = uv.y - 0.5;

  float ringCenter = floor(uv.x / (2.0 * pitch) + 0.5) * 2.0 * pitch;
  vec2 pr = vec2(uv.x - ringCenter, across);
  vec2 axes = vec2(0.6, 0.38);
  float e = length(pr / axes);
  float tube = 0.085;
  float ringSigned = (e - 1.0) * 0.42;
  float ring = 1.0 - smoothstep(tube - 0.02, tube + 0.02, abs(ringSigned));
  float ringN = clamp(ringSigned / tube, -1.0, 1.0);
  float facing = 0.75 + 0.25 * cos(atan(pr.y, pr.x) + 2.3);

  float barCenter = (floor(uv.x / (2.0 * pitch)) * 2.0 + 1.0) * pitch;
  vec2 pb = vec2(uv.x - barCenter, across);
  float barD = length(vec2(max(abs(pb.x) - 0.52, 0.0), pb.y));
  float barR = 0.1;
  float bar = 1.0 - smoothstep(barR - 0.02, barR + 0.02, barD);
  float barN = clamp(pb.y / barR, -1.0, 1.0);
  float barEnds = mix(0.55, 1.0, 1.0 - smoothstep(0.3, 0.62, abs(pb.x)));

  float ringRound = sqrt(max(1.0 - ringN * ringN, 0.0));
  float barRound = sqrt(max(1.0 - barN * barN, 0.0));
  float near = 1.0 - smoothstep(barR, barR * 2.6, barD);
  vec3 ringC = uColor * (0.3 + 0.6 * ringRound) * facing * (1.0 - 0.45 * near) + vec3(1.0) * pow(ringRound, 8.0) * 0.45 * facing;
  vec3 barC = uColor * (0.3 + 0.65 * barRound) * barEnds + vec3(1.0) * pow(barRound, 10.0) * 0.55 * barEnds;
  vec3 c = mix(ringC * ring, barC, bar);
  return vec4(c, max(ring, bar));
}

// Staggered rows of scales, darker at their trailing edge, glossy along the back.
vec4 serpent(vec2 uv) {
  float x = uv.y * 2.0 - 1.0;
  float cover = 1.0 - smoothstep(0.8, 1.0, abs(x));
  float domed = sqrt(max(1.0 - x * x, 0.0));
  float rows = uv.x * 3.4;
  float row = floor(rows);
  float cols = asin(clamp(x, -1.0, 1.0)) * 1.6 + 0.5 * mod(row, 2.0);
  vec2 f = vec2(fract(rows), fract(cols)) - 0.5;
  // Each scale overlaps the next toward the tail: lit at its front, shaded along its trailing chevron.
  float chevron = f.x + abs(f.y) * 0.9;
  float edge = smoothstep(0.05, 0.5, chevron) * (1.0 - smoothstep(0.5, 0.62, chevron));
  float rim = 1.0 - smoothstep(0.0, 0.06, abs(chevron - 0.5));
  float tone = 0.95 + 0.05 * planeHash(vec2(row, floor(cols)) + uSeed * 10.0);
  float scales = 1.0 - clamp(uDetail, 0.0, 1.0) * (0.22 * edge + 0.25 * rim);
  float spine = 1.0 - 0.12 * exp(-x * x * 9.0);
  vec3 c = uColor * (0.38 + 0.62 * domed) * scales * tone * spine;
  c += vec3(1.0) * pow(domed, 12.0) * 0.16 * (1.0 - 0.5 * edge);
  return vec4(c, cover);
}

// Bark streaks along the vine; thorns stick out sideways and lean toward the tip.
vec4 vine(vec2 uv, float depthShade) {
  float x = uv.y * 2.0 - 1.0;
  float core = 0.58;
  float ax = abs(x) / core;
  float body = 1.0 - smoothstep(0.8, 1.0, ax);
  float domed = sqrt(max(1.0 - ax * ax, 0.0));
  float bark = valueNoise(vec2(uv.x * 1.4, x * 7.0 + uSeed * 9.0)) * 0.6 + valueNoise(vec2(uv.x * 5.0, x * 3.0)) * 0.4;
  vec3 c = uColor * (0.4 + 0.6 * domed) * (0.7 + 0.5 * bark) * depthShade;

  float period = 0.85;
  float id = floor(uv.x / period);
  float side = mod(id, 2.0) < 1.0 ? 1.0 : -1.0;
  float has = step(planeHash(vec2(id, uSeed * 17.0 + 3.0)), clamp(uDetail, 0.0, 1.0));
  float u0 = (id + 0.3 + 0.4 * planeHash(vec2(id, 3.0))) * period;
  float reach = side * x - core * 0.8;
  float len = 0.95 - core * 0.8;
  float du = uv.x - u0 + reach * 0.45;
  float width = 0.16 * (1.0 - clamp(reach / len, 0.0, 1.0));
  float thorn = has * step(-0.05, reach) * step(reach, len) * (1.0 - smoothstep(width - 0.02, width + 0.01, abs(du)));
  vec3 thornC = uColor * 0.45 + vec3(0.1, 0.04, 0.02);
  return vec4(mix(c * body, thornC, thorn * (1.0 - body)), max(body, thorn));
}

void main() {
  vec4 shape;
  if (uStyle < 0.5) shape = rope(vUv);
  else if (uStyle < 1.5) shape = chain(vUv);
  else if (uStyle < 2.5) shape = serpent(vUv);
  else shape = vine(vUv, vInfo.x);
  float alpha = shape.a * clamp(uOpacity, 0.0, 1.0);
  if (uShadow > 0.5) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, alpha * 0.38);
    return;
  }
  gl_FragColor = vec4(shape.rgb * alpha, alpha);
}
`;
