import {
  STRAND_LAYOUT_COILED,
  STRAND_MOTION_EXTEND,
  STRAND_MOTION_RETRACT,
  STRAND_MOTION_STATIC,
  STRAND_MOTION_TIGHTEN,
} from "./constants.mjs";
import { clamp } from "./geometry.mjs";
import { VerletStrand } from "./strand-physics.mjs";
import { pathLength, pathNormals, resamplePath } from "./strand-layout.mjs";

const TAU = Math.PI * 2;
const STEP = 1 / 60;

function smoothstep(a, b, x) {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}

function cumulative(points) {
  const arc = new Float64Array(points.length);
  for (let i = 1; i < points.length; i += 1) {
    arc[i] = arc[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
  }
  return arc;
}

/**
 * How much a rope or chain writhes, how much of it is out and how taut it is.
 * Extend plays once from `elapsed` 0; retract and tighten loop.
 *
 * @returns {{ wave: number, reveal: number, tight: number }} wave 0..1, reveal 0..1, tight 0..1
 */
export function strandDrive(motion, time, elapsed, { heavy = false, length = 1, cell = 100, phase = 0 } = {}) {
  if (motion === STRAND_MOTION_EXTEND) {
    const duration = (0.6 + length / (cell * 4)) * (heavy ? 1.4 : 1);
    const t = Number.isFinite(elapsed) ? clamp(elapsed / duration, 0, 1) : 1;
    return { wave: 0.35, reveal: 1 - (1 - t) ** 3, tight: 0 };
  }
  if (motion === STRAND_MOTION_RETRACT) {
    const p = ((time / (heavy ? 7 : 5.5) + phase) % 1 + 1) % 1;
    let reveal = 1;
    if (p >= 0.3 && p < 0.5) reveal = 1 - 0.8 * ((p - 0.3) / 0.2) ** 2;
    else if (p >= 0.5 && p < 0.62) reveal = 0.2;
    else if (p >= 0.62) reveal = 0.2 + 0.8 * (1 - (1 - (p - 0.62) / 0.38) ** 3);
    return { wave: 0.3, reveal, tight: 0 };
  }
  if (motion === STRAND_MOTION_TIGHTEN) {
    const p = ((time / (heavy ? 6 : 4.5) + phase) % 1 + 1) % 1;
    let tight = 0;
    if (p >= 0.35 && p < 0.45) tight = 1 - (1 - (p - 0.35) / 0.1) ** 3;
    else if (p >= 0.45 && p < 0.8) tight = 1;
    else if (p >= 0.8) tight = 1 - smoothstep(0.8, 1, p);
    return { wave: 0.5 * (1 - tight), reveal: 1, tight };
  }
  return { wave: 1, reveal: 1, tight: 0 };
}

/**
 * A rope or chain: a Verlet strand that follows a moving target pose. The first
 * point is its anchor. Static strands skip the simulation.
 */
export class LineStrandMotion {
  /**
   * @param {{ path: Array<[number, number]>, coilCenter: [number, number]|null }} strand
   * @param {{ motion: string, layout: string, heavy: boolean, weight: number, cell: number, phase: number }} options
   */
  constructor(strand, { motion, layout, heavy, weight = 0.6, cell, phase }) {
    this.motion = motion;
    this.heavy = heavy;
    this.cell = cell;
    this.phase = phase;
    const tighten = motion === STRAND_MOTION_TIGHTEN;
    this.base = tighten && layout !== STRAND_LAYOUT_COILED ? withSlack(strand.path, cell) : strand.path.map((p) => [p[0], p[1]]);
    this.count = this.base.length;
    this.normals = pathNormals(this.base);
    this.arc = cumulative(this.base);
    this.length = this.arc[this.count - 1];
    this.taut = tighten ? tautPath(this.base, strand.coilCenter, layout) : null;
    this.tautRatio = this.taut ? clamp(pathLength(this.taut) / Math.max(this.length, 1e-6), 0.3, 1) : 1;
    const w = clamp(weight, 0, 1);
    this.physics = heavy
      ? { follow: 0.07 - 0.045 * w, damping: 0.9 + 0.04 * w, iterations: 16, speed: 0.8 - 0.3 * w }
      : { follow: 0.11, damping: 0.9, iterations: 10, speed: 1 };
    this.sim = new VerletStrand(this.base);
    this.targets = new Float64Array(this.count * 2);
    this.flat = new Float64Array(this.count * 2);
    this.base.forEach((p, i) => {
      this.flat[i * 2] = p[0];
      this.flat[i * 2 + 1] = p[1];
    });
    this.started = false;
    this.lastTime = null;
    this.carry = 0;
  }

  /**
   * @param {number} time seconds
   * @param {number} elapsed seconds since the strand appeared (-Infinity: long ago)
   * @param {number} amount 0..1 animation amount
   * @returns {{ points: Float64Array, last: number }} x, y pairs and the last shown point
   */
  pose(time, elapsed, amount) {
    const still = this.motion === STRAND_MOTION_STATIC || (amount <= 0 && this.motion !== STRAND_MOTION_EXTEND);
    if (still) return { points: this.flat, last: this.count - 1 };

    const drive = strandDrive(this.motion, time * this.physics.speed, elapsed, {
      heavy: this.heavy,
      length: this.length,
      cell: this.cell,
      phase: this.phase,
    });
    const t = time * this.physics.speed * (0.35 + 0.65 * amount);
    const amplitude = this.cell * (this.heavy ? 0.16 : 0.26) * amount * drive.wave;
    const k1 = TAU / (this.cell * 2.4);
    const k2 = TAU / (this.cell * 1.15);
    const pinEnd = this.motion === STRAND_MOTION_TIGHTEN;
    for (let i = 0; i < this.count; i += 1) {
      const s = this.arc[i];
      let envelope = smoothstep(0, this.cell * 0.8, s);
      if (pinEnd) envelope *= smoothstep(0, this.cell * 0.8, this.length - s);
      const offset = amplitude * envelope
        * (0.65 * Math.sin(s * k1 - t * 1.2 + this.phase * TAU) + 0.35 * Math.sin(s * k2 + t * 0.8 + this.phase * 9));
      let x = this.base[i][0];
      let y = this.base[i][1];
      if (this.taut && drive.tight > 0) {
        x += (this.taut[i][0] - x) * drive.tight;
        y += (this.taut[i][1] - y) * drive.tight;
      }
      this.targets[i * 2] = x + this.normals[i][0] * offset;
      this.targets[i * 2 + 1] = y + this.normals[i][1] * offset;
    }
    const visible = drive.reveal * (this.count - 1);
    const whole = Math.floor(visible);
    const part = visible - whole;
    if (part > 1e-4 && whole + 1 < this.count) {
      const a = whole * 2;
      const b = a + 2;
      this.targets[b] = this.targets[a] + (this.targets[b] - this.targets[a]) * part;
      this.targets[b + 1] = this.targets[a + 1] + (this.targets[b + 1] - this.targets[a + 1]) * part;
    }

    const dt = this.lastTime == null ? 0 : time - this.lastTime;
    this.lastTime = time;
    if (!this.started || dt < 0 || dt > 0.5) {
      this.sim.reset(this.targets);
      this.started = true;
      this.carry = 0;
    }
    this.carry += Math.max(0, dt);
    let steps = 0;
    let last = Math.min(this.count - 1, part > 1e-4 ? whole + 1 : whole);
    const options = {
      targets: this.targets,
      follow: this.physics.follow,
      damping: this.physics.damping,
      iterations: this.physics.iterations,
      restScale: 1 + (this.tautRatio - 1) * drive.tight,
      visible,
      pinEnd,
    };
    while (this.carry >= STEP && steps < 4) {
      last = this.sim.step(options);
      this.carry -= STEP;
      steps += 1;
    }
    if (steps === 4) this.carry = 0;
    return { points: this.sim.pos, last };
  }
}

/** The same ends with a sideways belly, so a straight strand has slack to take up. */
function withSlack(path, cell) {
  const length = pathLength(path);
  const normals = pathNormals(path);
  const arc = cumulative(path);
  const belly = Math.min(cell * 0.6, length * 0.1);
  return resamplePath(
    path.map((p, i) => {
      const lift = Math.sin((arc[i] / Math.max(length, 1e-6)) * Math.PI) * belly;
      return [p[0] + normals[i][0] * lift, p[1] + normals[i][1] * lift];
    }),
    length / Math.max(1, path.length - 1),
    path.length,
  );
}

/** Pulled taut: a coil squeezes toward its center; other strands straighten between their ends. */
function tautPath(path, coilCenter, layout) {
  const n = path.length;
  if (layout === STRAND_LAYOUT_COILED && coilCenter) {
    const arc = cumulative(path);
    const tailEnd = arc[n - 1] * 0.25;
    return path.map((p, i) => {
      const squeeze = 1 - 0.28 * smoothstep(0, tailEnd, arc[i]);
      return [coilCenter[0] + (p[0] - coilCenter[0]) * squeeze, coilCenter[1] + (p[1] - coilCenter[1]) * squeeze];
    });
  }
  const a = path[0];
  const b = path[n - 1];
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2;
  const ax = a[0];
  const ay = a[1];
  const bx = mx + (b[0] - mx) * 0.94;
  const by = my + (b[1] - my) * 0.94;
  return path.map((_, i) => {
    const t = i / Math.max(1, n - 1);
    return [ax + (bx - ax) * t, ay + (by - ay) * t];
  });
}

/**
 * Serpent body points, head first, as a function of time (no hidden state, so a
 * rebuilt effect continues where the old one was).
 */
export class SerpentMotion {
  /**
   * @param {object} serpent from planStrands
   * @param {{ cell: number, halfWidth: number }} options
   */
  constructor(serpent, { cell, halfWidth }) {
    this.serpent = serpent;
    this.cell = cell;
    this.halfWidth = halfWidth;
    this.count = clamp(Math.round(serpent.length / (halfWidth * 0.55)), 24, 160);
    this.segment = serpent.length / (this.count - 1);
    this.out = new Float64Array(this.count * 2);
    if (serpent.kind === "track") {
      this.arc = cumulative(serpent.track);
      this.total = this.arc[this.arc.length - 1];
    }
  }

  pose(time, amount) {
    return this.serpent.kind === "coil" ? this.#coil(time, amount) : this.#slither(time, amount);
  }

  #slither(time, amount) {
    const head = this.serpent.offset + time * this.cell * 1.1 * amount;
    for (let k = 0; k < this.count; k += 1) {
      const [x, y] = this.#trackAt(head - k * this.segment);
      this.out[k * 2] = x;
      this.out[k * 2 + 1] = y;
    }
    return this.out;
  }

  #trackAt(s) {
    const track = this.serpent.track;
    const arc = this.arc;
    const wrapped = ((s % this.total) + this.total) % this.total;
    let lo = 0;
    let hi = arc.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (arc[mid] <= wrapped) lo = mid;
      else hi = mid;
    }
    const span = arc[hi] - arc[lo];
    const t = span > 0 ? (wrapped - arc[lo]) / span : 0;
    return [track[lo][0] + (track[hi][0] - track[lo][0]) * t, track[lo][1] + (track[hi][1] - track[lo][1]) * t];
  }

  /** Coiled with the head in the middle; the coil breathes, turns slowly and slides a little. */
  #coil(time, amount) {
    const { center, gap, length, phase, spin } = this.serpent;
    const breathe = gap * (1 + 0.05 * amount * Math.sin(time * 0.8 + phase));
    const turn = phase + spin * time * 0.12 * amount;
    const slide = this.halfWidth * 1.2 * amount * (1 + Math.sin(time * 0.5 + phase));
    const want = length + slide;
    const dense = [];
    let theta = TAU * 0.55;
    let walked = 0;
    let prev = null;
    while (walked < want + this.segment && dense.length < 4000) {
      const r = (breathe * theta) / TAU;
      const a = turn + spin * theta;
      const p = [center[0] + Math.cos(a) * r, center[1] + Math.sin(a) * r];
      if (prev) walked += Math.hypot(p[0] - prev[0], p[1] - prev[1]);
      dense.push(p);
      prev = p;
      theta += Math.min(0.08, (this.halfWidth * 0.3) / Math.max(r, 1e-3));
    }
    const arc = cumulative(dense);
    let j = 0;
    for (let k = 0; k < this.count; k += 1) {
      const s = slide + k * this.segment;
      while (j < arc.length - 2 && arc[j + 1] < s) j += 1;
      const span = arc[j + 1] - arc[j];
      const t = span > 0 ? clamp((s - arc[j]) / span, 0, 1) : 0;
      let x = dense[j][0] + (dense[j + 1][0] - dense[j][0]) * t;
      let y = dense[j][1] + (dense[j + 1][1] - dense[j][1]) * t;
      const along = k / (this.count - 1);
      const sway = (1 - smoothstep(0, 0.12, along)) * Math.sin(time * 2.1 + phase) * 0.7
        + smoothstep(0.88, 1, along) * Math.sin(time * 1.4 + phase * 3) * 0.9;
      if (sway !== 0) {
        const dx = dense[j + 1][0] - dense[j][0];
        const dy = dense[j + 1][1] - dense[j][1];
        const norm = Math.hypot(dx, dy) || 1;
        x += (-dy / norm) * sway * this.halfWidth * amount;
        y += (dx / norm) * sway * this.halfWidth * amount;
      }
      this.out[k * 2] = x;
      this.out[k * 2 + 1] = y;
    }
    return this.out;
  }
}

/** Vines barely sway; tendrils a little more, growing toward their tips. */
export class VineMotion {
  constructor(strand, { cell, phase }) {
    this.base = strand.path;
    this.count = strand.path.length;
    this.normals = pathNormals(strand.path);
    this.arc = cumulative(strand.path);
    this.cell = cell;
    this.phase = phase;
    this.reach = strand.kind === "tendril" ? 2 : 1;
    this.out = new Float64Array(this.count * 2);
    strand.path.forEach((p, i) => {
      this.out[i * 2] = p[0];
      this.out[i * 2 + 1] = p[1];
    });
  }

  pose(time, amount) {
    if (amount <= 0) return this.out;
    const amplitude = this.cell * 0.12 * amount * this.reach;
    for (let i = 0; i < this.count; i += 1) {
      const s = this.arc[i];
      const offset = amplitude * smoothstep(0, this.cell, s) * Math.sin(time * 0.7 + (s / this.cell) * 1.4 + this.phase * TAU);
      this.out[i * 2] = this.base[i][0] + this.normals[i][0] * offset;
      this.out[i * 2 + 1] = this.base[i][1] + this.normals[i][1] * offset;
    }
    return this.out;
  }
}
