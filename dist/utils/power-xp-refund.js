/**
 * XP refund helpers when removing or replacing power items.
 */
import { powerLevelCost } from './constants.js';
import { CREATION_DEFENSIVE_RANK, CREATION_OFFENSIVE_RANK, } from './power-catalog.js';
function readMsFlag(item, key) {
    try {
        if (typeof item.getFlag === 'function' && item.getFlag('mastery-system', key) === true) {
            return true;
        }
    }
    catch {
        /* optional */
    }
    return item.flags?.['mastery-system']?.[key] === true;
}
/** Sum of `powerLevelCost(1) … powerLevelCost(level)`. */
export function powerLadderCost(toLevel) {
    const top = Math.max(0, Math.floor(Number(toLevel) || 0));
    let sum = 0;
    for (let level = 1; level <= top; level++) {
        sum += powerLevelCost(level);
    }
    return sum;
}
/**
 * Creation baseline rank for a power category.
 *
 * Per the character-creation rules every starting Power is granted at a fixed
 * rank — Actives at R2, defensive Powers (Passive / Active Buff / Reaction) at
 * R4. A Power can never have been "paid for" below this rank, so it is the
 * floor for any XP-refund baseline regardless of what `minLevel` is stored.
 */
export function creationBaselineRank(item) {
    const cat = item.system?.category
        ?? (item.system?.powerType === 'buff' ? 'activeBuff' : item.system?.powerType);
    if (cat === 'active')
        return CREATION_OFFENSIVE_RANK;
    if (cat === 'passive' || cat === 'activeBuff' || cat === 'reaction')
        return CREATION_DEFENSIVE_RANK;
    return 1;
}
/**
 * The level a Power is considered to have started at for XP purposes.
 *
 * Uses the stored `minLevel` when it is a valid integer, but never drops below
 * the category creation rank. This makes refunds correct even when `minLevel`
 * is missing, zero, or corrupted to a value below the creation baseline (the
 * cause of the over-refund bug), while preserving legitimate refunds for Powers
 * genuinely upgraded above their baseline.
 */
export function getPowerMinLevel(item) {
    const lvl = item.system?.level ?? 1;
    const floor = Math.min(creationBaselineRank(item), lvl);
    const raw = item.system?.minLevel;
    const hasValid = typeof raw === 'number' && Number.isFinite(raw) && raw >= 1;
    const candidate = hasValid ? Math.min(Math.floor(raw), lvl) : floor;
    return Math.max(candidate, floor);
}
/** Refund XP spent raising this power above its creation baseline. */
export function calculatePowerUpgradeRefund(item) {
    const current = item.system?.level ?? 1;
    const baseline = getPowerMinLevel(item);
    let refund = 0;
    for (let level = baseline + 1; level <= current; level++) {
        refund += powerLevelCost(level);
    }
    return refund;
}
export function calculatePowersUpgradeRefund(powers) {
    return powers.reduce((sum, p) => sum + calculatePowerUpgradeRefund(p), 0);
}
/**
 * True when this power was bought with XP after character creation
 * (or legacy L1 floor without a GM-grant flag).
 */
export function wasPowerXpPurchased(item) {
    if (readMsFlag(item, 'gmGranted'))
        return false;
    if (readMsFlag(item, 'xpPurchased'))
        return true;
    const raw = item.system?.minLevel;
    return typeof raw === 'number' && Number.isFinite(raw) && Math.floor(raw) === 1;
}
/**
 * XP to return when deleting a power item after character creation.
 *
 * - GM-granted: only paid upgrades above minLevel
 * - XP-purchased (or legacy minLevel === 1): full ladder 1…level
 * - Creation package: upgrades above creation baseline only
 */
export function calculatePowerDeletionRefund(item) {
    if (readMsFlag(item, 'gmGranted')) {
        return calculatePowerUpgradeRefund(item);
    }
    if (wasPowerXpPurchased(item)) {
        return powerLadderCost(item.system?.level ?? 1);
    }
    return calculatePowerUpgradeRefund(item);
}
//# sourceMappingURL=power-xp-refund.js.map