/**
 * Pure rules behind the Stone Powers dialog: which stone a click-fill takes,
 * when a wave may be charged, and why a visible pool is unusable. Kept free of
 * Foundry globals so the behaviour can be unit tested.
 */
import { COLORLESS_STONE_ATTR } from './colorless-stones.js';
const COLORLESS_BLOCKED_STONE_POWERS = new Set(['vitality.removeScar', 'wits.initiativeBoost']);
/** Remove Scar Seals attribute stones. Initiative Boost must not farm Colorless. */
export function stonePowerAllowsColorless(powerId) {
    return !COLORLESS_BLOCKED_STONE_POWERS.has(String(powerId || ''));
}
export function stonePowerColorlessRejectMessage(powerId) {
    const id = String(powerId || '');
    if (id === 'vitality.removeScar') {
        return 'Colorless Stones cannot pay Remove Scar — only Vitality Stones can be Sealed.';
    }
    if (id === 'wits.initiativeBoost') {
        return 'Colorless Stones cannot pay Initiative Boost.';
    }
    return 'Colorless Stones cannot pay this Stone Power.';
}
/**
 * Attribute a click-fill should draw the next stone from. Colorless Stones are
 * the last resort: they only get picked when no attribute pool has a free stone
 * left, so a player never burns them while coloured stones are still available.
 */
export function pickStoneFillAttribute(attributes, isUsable, spendable) {
    for (const attr of attributes) {
        if (attr === COLORLESS_STONE_ATTR)
            continue;
        if (!isUsable(attr))
            continue;
        if (spendable(attr) > 0)
            return attr;
    }
    if (isUsable(COLORLESS_STONE_ATTR) && spendable(COLORLESS_STONE_ATTR) > 0) {
        return COLORLESS_STONE_ATTR;
    }
    return null;
}
/**
 * Guard against paying a wave twice. `currentUses === usesInKey` alone is not
 * enough: `stoneUsage` is wiped on turn change and combat start, so a restored
 * snapshot of an already paid wave would line up again and charge empty pools.
 * The receipt (`paidAccKeys`) is that guard. Review mode used to block every
 * wave, which also left a pile the first Apply had rejected (six Extra Attack
 * stones against a two-stone check) sitting on the card forever.
 */
export function shouldSettleStoneWave(args) {
    void args.reviewMode;
    for (const paid of args.paidAccKeys) {
        if (paid === args.accKey)
            return false;
    }
    return Number(args.currentUses) === Number(args.usesInKey);
}
/**
 * Card order inside a power row. Every row holds exactly one Premium power
 * (2 / 4 / 6 / 8 Rank costs). It leads the row; the remaining cards keep
 * their order.
 */
export function orderPowersRampFirst(powers, isPremium) {
    const lead = [];
    const rest = [];
    for (const power of powers) {
        (isPremium(power) ? lead : rest).push(power);
    }
    return [...lead, ...rest];
}
/**
 * Whether an attribute (or General) section starts expanded in the Stone
 * Powers dialog. Sections with freely spendable stones of that attribute
 * open; empty ones stay collapsed. The player can still toggle them.
 * A stored override (this dialog session) always wins.
 */
export function stoneDialogSectionStartsOpen(args) {
    if (typeof args.userOverride === 'boolean')
        return args.userOverride;
    return !!args.sectionHasSpendable || !!args.sectionHasAssigned;
}
/**
 * Stones sitting in a power that has not reached the next full wave.
 * Placing them does not turn the power on — Premium Rank 1 costs 2 stones,
 * so one stone in Extra Attack or Crit looks assigned and does nothing.
 */
export function pendingStoneActivation(args) {
    const placed = Math.max(0, Math.floor(Number(args.placed) || 0));
    const needed = Math.max(0, Math.floor(Number(args.needed) || 0));
    if (placed <= 0 || needed <= 0 || placed >= needed)
        return null;
    return {
        name: String(args.name || 'Stone Power').trim() || 'Stone Power',
        placed,
        needed,
        missing: needed - placed,
    };
}
export function pendingStoneActivationLabel(row) {
    const still = row.missing === 1 ? '1 stone still needed' : `${row.missing} stones still needed`;
    return `Not activated — ${row.placed} of ${row.needed}, ${still}.`;
}
export function formatPendingStoneActivationWarning(rows) {
    if (!rows.length)
        return '';
    const bits = rows.map((row) => `${row.name} (${row.placed} of ${row.needed})`);
    return `Not activated: ${bits.join(', ')}. Placing them does not turn the power on — the wave must be full.`;
}
/** Why a visible pool has nothing to drag right now (empty string = usable). */
export function stonePoolBlockedReason(pool) {
    if (pool.max <= 0)
        return 'Attribute below 8 — no stone pool';
    if (pool.available > 0)
        return '';
    if (pool.sustained > 0)
        return 'bound by Sustain';
    return 'spent this round';
}
/**
 * Green card fill after a Stone Power has been charged. Unused cards stay
 * gray. First activation is a thin green edge; each further wave adds 1px,
 * capped at 5px so the compact card still fits.
 */
export function stonePowerActivationRing(activationCount) {
    const n = Math.max(0, Math.min(8, Math.floor(Number(activationCount) || 0)));
    return {
        activationCount: n,
        activated: n > 0,
        ringPx: n <= 0 ? 1 : Math.min(5, n),
    };
}
//# sourceMappingURL=stone-payment-rules.js.map