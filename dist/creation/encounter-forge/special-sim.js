/**
 * Deterministic expected-value engine for diminishing Special stacks.
 *
 * Models the canonical turn-start order from status-tick.ts:
 *   Tick (Ruin damage / Regeneration heal / ...) ->
 *   Natural Special Recovery (reduce negative stacks by victim MR total) ->
 *   Decay 1 on every remaining diminishing stack.
 *
 * The simulator tracks EXPECTED stack values (fractional), which is a
 * documented approximation of the stochastic process: applying "hit chance ×
 * special value" per round instead of rolling. Errors stay small because
 * specials cap at the application limit (4 × MR new points per round) and
 * decay linearly.
 *
 * Mechanical effects implemented per canonical special-effects.ts:
 *   ruin/exorcism/requiem — tick damage (ignores Armor), corrode — Armor −X,
 *   expose — Evade −X, disoriented — attack dice −X, challenge — attack dice
 *   −X when ignoring the challenger, sundered — +1d8 per 2 on non-Spell hits,
 *   hex — +1d8 per 2 on Spell hits, lacerate — movement-triggered damage,
 *   slow — Speed −X + damage when standing still, weaken/soulburn — attribute
 *   pool dice −X, blight — Stress tick (NPCs have no stress track; noted).
 */
import { getEffectById } from '../../utils/special-effects.js';
import { SPECIAL_APPLICATION_LIMIT_PER_MR, SPECIAL_DECAY_PER_TURN } from './combat-math.js';
/** Specials whose value directly reduces the victim's flat Armor. */
const ARMOR_REDUCERS = new Set(['corrode']);
/** Specials whose value directly reduces the victim's Evade. */
const EVADE_REDUCERS = new Set(['expose']);
/** Specials that reduce the victim's attack dice pools. */
const ATTACK_DICE_REDUCERS = new Set(['disoriented']);
/** Specials that tick HP damage at turn start (ignore Armor). */
const TICK_DAMAGE = new Set(['ruin', 'exorcism', 'requiem']);
/** Specials that reduce might/agility-style pools (melee/martial attackers). */
const PHYSICAL_POOL_REDUCERS = new Set(['weaken']);
/** Specials that reduce casting-attribute pools. */
const CASTING_POOL_REDUCERS = new Set(['soulburn']);
export function isKnownSpecial(id) {
    return Boolean(getEffectById(id));
}
/** Add expected special points, honoring the 4×MR-per-round application cap. */
export function applyExpectedSpecial(stacks, appliedThisRound, id, expectedValue, victimMr, wardValue = 0) {
    if (expectedValue <= 0)
        return;
    const effective = Math.max(0, expectedValue - Math.max(0, wardValue));
    if (effective <= 0)
        return;
    const cap = SPECIAL_APPLICATION_LIMIT_PER_MR * Math.max(1, victimMr);
    const already = appliedThisRound.get(id) ?? 0;
    const allowed = Math.max(0, Math.min(effective, cap - already));
    if (allowed <= 0)
        return;
    appliedThisRound.set(id, already + allowed);
    stacks.set(id, (stacks.get(id) ?? 0) + allowed);
}
/**
 * Process the victim's turn start: Tick -> Natural Recovery (MR total,
 * greedy on the highest stacks — mirrors the default HUD/greedy plan) ->
 * Decay 1 per stack.
 */
export function processTurnStart(stacks, victimMr) {
    let tickDamage = 0;
    let tickStress = 0;
    for (const [id, value] of stacks) {
        if (value <= 0)
            continue;
        if (TICK_DAMAGE.has(id))
            tickDamage += value;
        if (id === 'blight')
            tickStress += value;
    }
    // Root: decays by MR instead of participating in recovery/decay-1.
    const root = stacks.get('root') ?? 0;
    if (root > 0) {
        const next = root - Math.max(1, victimMr);
        if (next > 0)
            stacks.set('root', next);
        else
            stacks.delete('root');
    }
    // Natural Recovery: reduce negative diminishing stacks by MR total (greedy
    // highest-first, matching the default one-click recovery behavior).
    let budget = Math.max(1, victimMr);
    while (budget > 0) {
        let bestId = null;
        let bestValue = 0;
        for (const [id, value] of stacks) {
            if (id === 'root' || id === 'regeneration')
                continue;
            if (value > bestValue) {
                bestValue = value;
                bestId = id;
            }
        }
        if (!bestId || bestValue <= 0)
            break;
        const take = Math.min(budget, bestValue);
        budget -= take;
        const next = bestValue - take;
        if (next > 0)
            stacks.set(bestId, next);
        else
            stacks.delete(bestId);
    }
    // Decay 1 on everything remaining (diminishing rule).
    for (const [id, value] of [...stacks]) {
        if (id === 'root')
            continue;
        const next = value - SPECIAL_DECAY_PER_TURN;
        if (next > 0)
            stacks.set(id, next);
        else
            stacks.delete(id);
    }
    return { tickDamage, tickStress };
}
/* ------------------------------------------------------------------ */
/* Modifier getters (live values while stacks persist)                 */
/* ------------------------------------------------------------------ */
export function armorDelta(stacks) {
    let d = 0;
    for (const id of ARMOR_REDUCERS)
        d += stacks.get(id) ?? 0;
    return -d;
}
export function evadeDelta(stacks) {
    let d = 0;
    for (const id of EVADE_REDUCERS)
        d += stacks.get(id) ?? 0;
    return -d;
}
export function attackDiceDelta(stacks) {
    let d = 0;
    for (const id of ATTACK_DICE_REDUCERS)
        d += stacks.get(id) ?? 0;
    return -d;
}
/** Pool reduction for physical (might/agility) attackers. */
export function physicalPoolDelta(stacks) {
    let d = 0;
    for (const id of PHYSICAL_POOL_REDUCERS)
        d += stacks.get(id) ?? 0;
    return -d;
}
/** Pool reduction for casting attackers. */
export function castingPoolDelta(stacks) {
    let d = 0;
    for (const id of CASTING_POOL_REDUCERS)
        d += stacks.get(id) ?? 0;
    return -d;
}
/** Bonus damage dice against this victim: Sundered (non-spell) / Hex (spell). */
export function bonusDiceVsVictim(stacks, isSpellHit) {
    const id = isSpellHit ? 'hex' : 'sundered';
    const v = stacks.get(id) ?? 0;
    return v > 0 ? Math.ceil(v / 2) : 0;
}
/**
 * Expected movement-triggered damage this round (Lacerate: first voluntary
 * move; Slow: damage when NOT moving). `expectedMovesPerRound` ~1 for mobile
 * combatants, 0 for stationary ones.
 */
export function expectedMovementDamage(stacks, expectedMovesPerRound) {
    const moves = Math.max(0, Math.min(1, expectedMovesPerRound));
    const lacerate = stacks.get('lacerate') ?? 0;
    const slow = stacks.get('slow') ?? 0;
    return lacerate * moves + slow * (1 - moves);
}
/** Sum of all negative stack values (diagnostics / accumulation warnings). */
export function totalNegativeStacks(stacks) {
    let total = 0;
    for (const [id, value] of stacks) {
        if (id === 'regeneration')
            continue;
        total += Math.max(0, value);
    }
    return total;
}
//# sourceMappingURL=special-sim.js.map