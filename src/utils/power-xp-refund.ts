/**
 * XP refund helpers when removing or replacing power items.
 */

import { powerLevelCost } from './constants.js';

export function getPowerMinLevel(item: { system?: { level?: number; minLevel?: number } }): number {
    const lvl = item.system?.level ?? 1;
    const min = item.system?.minLevel;
    if (typeof min === 'number' && !Number.isNaN(min)) return min;
    return lvl;
}

/** Refund XP spent raising this power above its minLevel. */
export function calculatePowerUpgradeRefund(item: { system?: { level?: number; minLevel?: number } }): number {
    const current = item.system?.level ?? 1;
    const min = getPowerMinLevel(item);
    let refund = 0;
    for (let level = min + 1; level <= current; level++) {
        refund += powerLevelCost(level);
    }
    return refund;
}

export function calculatePowersUpgradeRefund(
    powers: Array<{ system?: { level?: number; minLevel?: number } }>,
): number {
    return powers.reduce((sum, p) => sum + calculatePowerUpgradeRefund(p), 0);
}
