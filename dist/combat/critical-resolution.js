/**
 * Critical(X) resolution — Active Buff Critical and stone/special Crit charges.
 *
 * Critical(X) = up to X attacks per Round may receive Critical.
 * X is never an explode-threshold strength; the threshold is always 7–8 on
 * Attack Dice only. Damage Dice never explode from Critical.
 *
 * Critical attacks: Attack Dice explode on 7–8; Damage Dice never explode.
 */
/** Fixed explode faces for every Critical application. */
export const CRITICAL_ATTACK_EXPLODE_FACES = [7, 8];
/** Damage Dice are never exploded by Critical(X). */
export const CRITICAL_DAMAGE_DICE_EXPLODE = false;
/**
 * Sync Active Buff Critical quota for the current combat round.
 * New round → remaining = Critical(X). Same round → keep spent charges.
 */
export function syncCriticalRoundQuota(existing, roundKey, buffCriticalX) {
    const x = Math.max(0, Math.floor(Number(buffCriticalX) || 0));
    const key = String(roundKey || '');
    if (!existing || existing.roundKey !== key) {
        return { roundKey: key, granted: x, remaining: x };
    }
    if (x > existing.granted) {
        const delta = x - existing.granted;
        return {
            roundKey: key,
            granted: x,
            remaining: existing.remaining + delta,
        };
    }
    if (x < existing.granted) {
        return {
            roundKey: key,
            granted: x,
            remaining: Math.min(existing.remaining, x),
        };
    }
    return {
        roundKey: key,
        granted: existing.granted,
        remaining: Math.max(0, Math.floor(Number(existing.remaining) || 0)),
    };
}
export function consumeCriticalQuota(quota) {
    return {
        ...quota,
        remaining: Math.max(0, quota.remaining - 1),
    };
}
export function combatRoundKey(combat) {
    const id = String(combat?.id ?? '');
    const round = Math.max(1, Math.floor(Number(combat?.round) || 1));
    return `${id}:${round}`;
}
/**
 * Resolve whether this attack receives Critical.
 * Multiple sources never improve the explode threshold — always 7–8 on Attack Dice.
 * Prefer consuming Active Buff quota, then stone Crit charges, then special Crit.
 */
export function resolveCriticalAttackModifier(opts) {
    const criticalX = Math.max(0, Math.floor(Number(opts.activeBuffCriticalX) || 0));
    const buffRemaining = Math.max(0, Math.floor(Number(opts.buffQuotaRemaining) || 0));
    const stone = Math.max(0, Math.floor(Number(opts.stoneCritCharges) || 0));
    const special = Math.max(0, Math.floor(Number(opts.specialCritCharges) || 0));
    const sources = [];
    if (buffRemaining > 0 || criticalX > 0)
        sources.push('active-buff');
    if (stone > 0)
        sources.push('stone-crit');
    if (special > 0)
        sources.push('special-crit');
    let consumeFrom = null;
    if (buffRemaining > 0)
        consumeFrom = 'active-buff';
    else if (stone > 0)
        consumeFrom = 'stone-crit';
    else if (special > 0)
        consumeFrom = 'special-crit';
    const applyCritical = consumeFrom != null;
    return {
        criticalX,
        buffQuotaRemaining: buffRemaining,
        stoneCritCharges: stone,
        specialCritCharges: special,
        applyCritical,
        explodeOn78: applyCritical,
        explodeFaces: CRITICAL_ATTACK_EXPLODE_FACES,
        damageDiceExplode: CRITICAL_DAMAGE_DICE_EXPLODE,
        consumeFrom,
        sources,
    };
}
/** Format for UI / chat — always Critical(X). */
export function formatCriticalLabel(criticalX) {
    const x = Math.max(0, Math.floor(Number(criticalX) || 0));
    return `Critical(${x})`;
}
//# sourceMappingURL=critical-resolution.js.map