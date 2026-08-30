/**
 * Deterministic dice probability engine for the Encounter Forge.
 *
 * The Mastery System rolls pools of exploding d8 ("roll & keep"): roll `pool`
 * dice, each die explodes on a natural 8 (roll again, add), keep the `keep`
 * highest per-die totals and sum them.
 *
 * This module computes exact probability mass functions (PMFs) for those
 * rolls instead of sampling with Math.random. Same inputs always produce the
 * same outputs, so the wizard never "rerolls" an encounter on rerender.
 *
 * APPROXIMATION BOUND (documented, deliberate):
 * A die explosion chain is theoretically unbounded. We truncate at
 * `EXPLOSION_DEPTH` consecutive explosions; a die that reaches the cap rolls
 * one final non-exploding d8. The probability that a single die is affected
 * is (1/8)^EXPLOSION_DEPTH = 1/4096, and the per-die mean error is
 * (1/8)^4 × (36/7 − 4.5) ≈ 1.6e-4. All results in this module are exact for
 * the truncated die. This error is far below anything visible in encounter
 * balance (hit chances shift by < 0.1 percentage points).
 */
/** Consecutive explosions modeled exactly; see module docs for error bound. */
export const EXPLOSION_DEPTH = 4;
/** Highest value a single (truncated) exploding d8 can reach: 8*4 + 8. */
export const MAX_DIE_VALUE = 8 * EXPLOSION_DEPTH + 8;
/** Exact mean of an untruncated exploding d8 (rules constant: 36/7). */
export const EXPLODING_D8_MEAN = 36 / 7;
let singleDieCache = null;
/** PMF of one exploding d8, truncated at EXPLOSION_DEPTH explosions. */
export function singleDiePmf() {
    if (singleDieCache)
        return singleDieCache;
    const pmf = new Float64Array(MAX_DIE_VALUE + 1);
    let reachProb = 1;
    for (let depth = 0; depth < EXPLOSION_DEPTH; depth += 1) {
        // At this depth the die shows 1..7 and stops, or an 8 and explodes.
        for (let face = 1; face <= 7; face += 1) {
            pmf[depth * 8 + face] += reachProb / 8;
        }
        reachProb /= 8;
    }
    // Depth cap reached: one final non-exploding d8.
    for (let face = 1; face <= 8; face += 1) {
        pmf[EXPLOSION_DEPTH * 8 + face] += reachProb / 8;
    }
    singleDieCache = pmf;
    return pmf;
}
const sumCache = new Map();
/**
 * PMF of the sum of `count` exploding d8 (keep all).
 * NOTE: Mastery damage dice do NOT explode (see damage-dialog.ts:
 * "damage dice do not explode unless a rule explicitly says so").
 * Use `plainDamagePmf` / `damageJointPmf` for damage rolls; this helper is
 * for rolls that keep all exploding dice (e.g. initiative).
 */
export function explodingSumPmf(count) {
    const n = Math.max(0, Math.floor(count));
    if (n === 0)
        return Float64Array.of(1);
    const cached = sumCache.get(n);
    if (cached)
        return cached;
    const prev = explodingSumPmf(n - 1);
    const die = singleDiePmf();
    const out = new Float64Array(prev.length + MAX_DIE_VALUE);
    for (let s = 0; s < prev.length; s += 1) {
        const p = prev[s];
        if (p === 0)
            continue;
        for (let v = 1; v <= MAX_DIE_VALUE; v += 1) {
            if (die[v] > 0)
                out[s + v] += p * die[v];
        }
    }
    sumCache.set(n, out);
    return out;
}
/** Mean of a single plain (non-exploding) d8 — rules constant for damage dice. */
export const PLAIN_D8_MEAN = 4.5;
const plainCache = new Map();
/** PMF of the sum of `count` plain d8 (damage dice never explode by default). */
export function plainDamagePmf(count) {
    const n = Math.max(0, Math.floor(count));
    if (n === 0)
        return Float64Array.of(1);
    const cached = plainCache.get(n);
    if (cached)
        return cached;
    const prev = plainDamagePmf(n - 1);
    const out = new Float64Array(prev.length + 8);
    for (let s = 0; s < prev.length; s += 1) {
        const p = prev[s];
        if (p === 0)
            continue;
        for (let v = 1; v <= 8; v += 1)
            out[s + v] += p / 8;
    }
    plainCache.set(n, out);
    return out;
}
const jointCache = new Map();
/**
 * Joint distribution of (damage sum, count of natural 8s) for `count` plain
 * d8. Needed for the minimum-damage rule: when Armor + DR reduce a hit to 0,
 * the target still takes 1 damage per natural 8 rolled.
 * Returned as an array indexed by eights-count; each entry is a PMF over sums.
 */
export function damageJointPmf(count) {
    const n = Math.max(0, Math.floor(count));
    const key = n;
    const cached = jointCache.get(key);
    if (cached)
        return cached;
    if (n === 0) {
        const out = [Float64Array.of(1)];
        jointCache.set(key, out);
        return out;
    }
    const prev = damageJointPmf(n - 1);
    const out = [];
    for (let e = 0; e <= n; e += 1)
        out.push(new Float64Array(8 * n + 1));
    for (let e = 0; e < prev.length; e += 1) {
        const pmf = prev[e];
        for (let s = 0; s < pmf.length; s += 1) {
            const p = pmf[s];
            if (p === 0)
                continue;
            for (let v = 1; v <= 7; v += 1)
                out[e][s + v] += p / 8;
            out[e + 1][s + 8] += p / 8;
        }
    }
    jointCache.set(key, out);
    return out;
}
const poolKeepCache = new Map();
/** Binomial(n, p) PMF as a plain array (exact iterative computation). */
function binomialPmf(n, p) {
    if (p >= 1) {
        const out = new Array(n + 1).fill(0);
        out[n] = 1;
        return out;
    }
    if (p <= 0) {
        const out = new Array(n + 1).fill(0);
        out[0] = 1;
        return out;
    }
    const out = new Array(n + 1).fill(0);
    let prob = Math.pow(1 - p, n);
    const ratio = p / (1 - p);
    for (let t = 0; t <= n; t += 1) {
        out[t] = prob;
        if (t < n)
            prob = prob * ((n - t) / (t + 1)) * ratio;
    }
    return out;
}
/**
 * Exact PMF of "roll `pool` exploding d8, keep the `keep` highest, sum them".
 *
 * Algorithm: process die values from highest to lowest. State = (dice that
 * still have a value at or below the current level, keep slots left) with a
 * partial-sum PMF. At each level the number of dice showing exactly that
 * value is binomial with the conditional probability p(v) / P(die <= v).
 * Once all keep slots are used, lower dice cannot change the sum and the
 * state is absorbed into the result. Exact (for the truncated die), no
 * sampling.
 */
export function poolKeepPmf(pool, keep) {
    const n = Math.max(1, Math.floor(pool));
    const k = Math.max(1, Math.min(Math.floor(keep), n));
    const key = `${n}:${k}`;
    const cached = poolKeepCache.get(key);
    if (cached)
        return cached;
    const die = singleDiePmf();
    // Values with non-zero probability, descending, plus cumulative P(die <= v).
    const values = [];
    for (let v = MAX_DIE_VALUE; v >= 1; v -= 1)
        if (die[v] > 0)
            values.push(v);
    const cumBelowEq = new Float64Array(MAX_DIE_VALUE + 1);
    {
        let run = 0;
        for (let v = 1; v <= MAX_DIE_VALUE; v += 1) {
            run += die[v];
            cumBelowEq[v] = run;
        }
    }
    const maxSum = k * MAX_DIE_VALUE;
    const result = new Float64Array(maxSum + 1);
    let states = Array.from({ length: n + 1 }, () => new Array(k + 1).fill(null));
    states[n][k] = (() => {
        const s = new Float64Array(maxSum + 1);
        s[0] = 1;
        return s;
    })();
    const absorb = (pmf) => {
        for (let s = 0; s <= maxSum; s += 1)
            if (pmf[s] > 0)
                result[s] += pmf[s];
    };
    for (const v of values) {
        const next = Array.from({ length: n + 1 }, () => new Array(k + 1).fill(null));
        const q = die[v] / cumBelowEq[v]; // P(die == v | die <= v)
        for (let r = 0; r <= n; r += 1) {
            for (let j = 0; j <= k; j += 1) {
                const pmf = states[r][j];
                if (!pmf)
                    continue;
                if (r === 0) {
                    absorb(pmf);
                    continue;
                }
                if (j === 0) {
                    absorb(pmf);
                    continue;
                }
                // t dice show exactly v: Binomial(r, q).
                const binom = binomialPmf(r, q);
                for (let t = 0; t <= r; t += 1) {
                    const b = binom[t];
                    if (b <= 0)
                        continue;
                    const kept = Math.min(t, j);
                    const shift = v * kept;
                    const nr = r - t;
                    const nj = j - kept;
                    let target = next[nr][nj];
                    if (!target) {
                        target = new Float64Array(maxSum + 1);
                        next[nr][nj] = target;
                    }
                    if (shift === 0) {
                        for (let s = 0; s <= maxSum; s += 1) {
                            if (pmf[s] > 0)
                                target[s] += pmf[s] * b;
                        }
                    }
                    else {
                        for (let s = 0; s + shift <= maxSum; s += 1) {
                            if (pmf[s] > 0)
                                target[s + shift] += pmf[s] * b;
                        }
                    }
                }
            }
        }
        states = next;
    }
    // Any remaining states (all dice assigned) are final.
    for (let r = 0; r <= n; r += 1) {
        for (let j = 0; j <= k; j += 1) {
            const pmf = states[r][j];
            if (pmf)
                absorb(pmf);
        }
    }
    poolKeepCache.set(key, result);
    return result;
}
/** Mean of a PMF. */
export function pmfMean(pmf) {
    let m = 0;
    for (let s = 0; s < pmf.length; s += 1)
        m += s * pmf[s];
    return m;
}
/** P(X >= tn). */
export function pmfAtLeast(pmf, tn) {
    const t = Math.max(0, Math.ceil(tn));
    let p = 0;
    for (let s = t; s < pmf.length; s += 1)
        p += pmf[s];
    return p;
}
/** Smallest value x with P(X <= x) >= q (q in [0,1]). */
export function pmfQuantile(pmf, q) {
    const target = Math.min(1, Math.max(0, q));
    let acc = 0;
    for (let s = 0; s < pmf.length; s += 1) {
        acc += pmf[s];
        if (acc >= target - 1e-12)
            return s;
    }
    return pmf.length - 1;
}
/** Hit chance of a pool/keep roll against a target number. */
export function hitChance(pool, keep, tn) {
    return pmfAtLeast(poolKeepPmf(pool, keep), tn);
}
/**
 * Expected raises of a pool/keep roll against a TN, counting misses as 0.
 * Raise rule (rules constant): one raise per full +4 over the TN.
 */
export function expectedRaises(pool, keep, tn, raiseStep = 4) {
    const pmf = poolKeepPmf(pool, keep);
    const t = Math.max(0, Math.ceil(tn));
    let e = 0;
    for (let s = t; s < pmf.length; s += 1) {
        e += pmf[s] * Math.floor((s - t) / raiseStep);
    }
    return e;
}
/** E[max(0, X - reduction)] for a damage PMF (e.g. damage after flat armor). */
export function expectedOverThreshold(pmf, reduction) {
    const r = Math.max(0, reduction);
    let e = 0;
    for (let s = 0; s < pmf.length; s += 1) {
        if (pmf[s] > 0 && s > r)
            e += pmf[s] * (s - r);
    }
    return e;
}
/** Clear all caches (only used by tests measuring determinism/perf). */
export function clearProbabilityCaches() {
    singleDieCache = null;
    sumCache.clear();
    plainCache.clear();
    jointCache.clear();
    poolKeepCache.clear();
}
//# sourceMappingURL=probability.js.map