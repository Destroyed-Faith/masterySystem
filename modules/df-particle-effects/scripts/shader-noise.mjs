/**
 * Shared GLSL noise for the effect shaders. Inputs are lattice coordinates, so
 * fract() keeps precision on large world positions.
 */
export const LATTICE_HASH = /* glsl */ `
float latticeHash(vec3 c) {
  vec3 q = fract(c * vec3(0.0873, 0.1271, 0.1559) + 0.37);
  q = fract(q * (q.yzx * 47.0 + 11.3));
  return fract((q.x + q.z) * (q.y + 0.61) * 7.13);
}
`;

/** 2D hash, value noise and fBm on top of latticeHash. */
export const PLANE_NOISE = /* glsl */ `
${LATTICE_HASH}
float planeHash(vec2 c) {
  return latticeHash(vec3(c, 3.7));
}

vec2 planeHash2(vec2 c) {
  return vec2(latticeHash(vec3(c, 3.7)), latticeHash(vec3(c.yx, 11.1)));
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = planeHash(i);
  float b = planeHash(i + vec2(1.0, 0.0));
  float c = planeHash(i + vec2(0.0, 1.0));
  float d = planeHash(i + vec2(1.0, 1.0));
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
`;

/**
 * Voronoi plates with a true distance to the nearest border, so lines drawn on it
 * keep an even width. Needs PLANE_NOISE before it.
 */
export const PLATE_BORDER = /* glsl */ `
vec2 plateSite(vec2 cell) {
  return 0.1 + 0.8 * planeHash2(cell);
}

// x: distance to the nearest plate border, y: stable id of the plate.
vec2 plateBorder(vec2 p) {
  vec2 cell = floor(p);
  vec2 f = fract(p);
  vec2 ownSite = vec2(0.0);
  vec2 ownCell = cell;
  float best = 8.0;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 o = vec2(float(i), float(j));
      vec2 site = o + plateSite(cell + o);
      vec2 d = site - f;
      float dd = dot(d, d);
      if (dd < best) {
        best = dd;
        ownSite = site;
        ownCell = cell + o;
      }
    }
  }
  float border = 8.0;
  for (int j = -2; j <= 2; j++) {
    for (int i = -2; i <= 2; i++) {
      vec2 o = vec2(float(i), float(j));
      vec2 site = o + plateSite(cell + o);
      vec2 between = site - ownSite;
      float len2 = dot(between, between);
      if (len2 > 0.00001) {
        border = min(border, dot(0.5 * (ownSite + site) - f, between / sqrt(len2)));
      }
    }
  }
  return vec2(border, planeHash(ownCell + 13.0));
}
`;
