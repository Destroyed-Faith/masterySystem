/**
 * A rope of point masses joined by stiff distance links (Verlet integration).
 * Each point is pulled softly toward a target; the links keep the length, so a
 * strand lags, swings and straightens like rope or chain instead of stretching.
 */
export class VerletStrand {
  /** @param {Array<[number, number]>} points rest pose; link lengths come from it */
  constructor(points) {
    this.count = points.length;
    this.pos = new Float64Array(this.count * 2);
    this.prev = new Float64Array(this.count * 2);
    this.rest = new Float64Array(Math.max(0, this.count - 1));
    for (let i = 0; i < this.count; i += 1) {
      this.pos[i * 2] = this.prev[i * 2] = points[i][0];
      this.pos[i * 2 + 1] = this.prev[i * 2 + 1] = points[i][1];
      if (i > 0) this.rest[i - 1] = Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
    }
  }

  /** Jump to a pose with no velocity. @param {Float64Array|number[]} targets x, y pairs */
  reset(targets) {
    for (let i = 0; i < this.count * 2; i += 1) this.pos[i] = this.prev[i] = targets[i];
  }

  /**
   * One fixed time step.
   *
   * @param {object} options
   * @param {Float64Array|number[]} options.targets x, y pairs
   * @param {number} options.follow 0..1 pull toward the target per step
   * @param {number} options.damping 0..1 velocity kept per step
   * @param {number} options.iterations link passes per step
   * @param {number} [options.restScale] link length factor (below 1 pulls taut)
   * @param {number} [options.visible] links shown, may be fractional; the rest wait at the tip
   * @param {boolean} [options.pinEnd] hold the last shown point on its target
   */
  step({ targets, follow, damping, iterations, restScale = 1, visible = this.count - 1, pinEnd = false }) {
    const links = Math.max(0, Math.min(this.count - 1, visible));
    const whole = Math.floor(links);
    const part = links - whole;
    const last = part > 1e-4 ? whole + 1 : whole;
    const pinned = (i) => i === 0 || (pinEnd && i === last);
    const { pos, prev } = this;

    for (let i = 0; i <= last; i += 1) {
      const x = i * 2;
      const y = x + 1;
      if (pinned(i)) {
        pos[x] = prev[x] = targets[x];
        pos[y] = prev[y] = targets[y];
        continue;
      }
      const vx = (pos[x] - prev[x]) * damping;
      const vy = (pos[y] - prev[y]) * damping;
      prev[x] = pos[x];
      prev[y] = pos[y];
      pos[x] += vx + (targets[x] - pos[x]) * follow;
      pos[y] += vy + (targets[y] - pos[y]) * follow;
    }

    for (let pass = 0; pass < iterations; pass += 1) {
      for (let i = 0; i < last; i += 1) {
        const a = i * 2;
        const b = a + 2;
        const wa = pinned(i) ? 0 : 1;
        const wb = pinned(i + 1) ? 0 : 1;
        if (wa + wb === 0) continue;
        const dx = pos[b] - pos[a];
        const dy = pos[b + 1] - pos[a + 1];
        const length = Math.hypot(dx, dy);
        if (length < 1e-9) continue;
        const rest = this.rest[i] * restScale * (i === whole && part > 1e-4 ? part : 1);
        const push = (length - rest) / length / (wa + wb);
        pos[a] += dx * push * wa;
        pos[a + 1] += dy * push * wa;
        pos[b] -= dx * push * wb;
        pos[b + 1] -= dy * push * wb;
      }
    }

    for (let i = last + 1; i < this.count; i += 1) {
      pos[i * 2] = prev[i * 2] = pos[last * 2];
      pos[i * 2 + 1] = prev[i * 2 + 1] = pos[last * 2 + 1];
    }
    return last;
  }
}
