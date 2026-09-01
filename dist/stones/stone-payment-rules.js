/**
 * Pure rules behind the Stone Powers dialog: which stone a click-fill takes,
 * when a wave may be charged, and why a visible pool is unusable. Kept free of
 * Foundry globals so the behaviour can be unit tested.
 */
import { COLORLESS_STONE_ATTR } from './colorless-stones.js';
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
 */
export function shouldSettleStoneWave(args) {
    if (args.reviewMode)
        return false;
    for (const paid of args.paidAccKeys) {
        if (paid === args.accKey)
            return false;
    }
    return Number(args.currentUses) === Number(args.usesInKey);
}
/**
 * Card order inside a power row. Every row holds exactly one T2-start power
 * (Tier 1 does not exist). Its first activation costs 2 stones and the
 * unused Anchor lane is omitted. It leads the row so the shorter cluster
 * sits first. The remaining cards keep their order.
 */
export function orderPowersRampFirst(powers, skipsFirstTier) {
    const lead = [];
    const rest = [];
    for (const power of powers) {
        (skipsFirstTier(power) ? lead : rest).push(power);
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
//# sourceMappingURL=stone-payment-rules.js.map