import { describe, it, expect } from 'vitest';
import {
    calculatePowerDeletionRefund,
    calculatePowerUpgradeRefund,
    calculatePowersUpgradeRefund,
    creationBaselineRank,
    getPowerMinLevel,
    powerLadderCost,
    wasPowerXpPurchased,
} from '../src/utils/power-xp-refund.js';

function power(
    category: string,
    level: number,
    minLevel?: number,
    flags?: { xpPurchased?: boolean; gmGranted?: boolean },
) {
    return {
        type: 'power',
        system: { category, level, minLevel },
        flags: flags ? { 'mastery-system': flags } : undefined,
    };
}

describe('power XP refund — creation-baseline flooring', () => {
    it('creation baseline is R2 for actives and R4 for defensive powers', () => {
        expect(creationBaselineRank(power('active', 2))).toBe(2);
        expect(creationBaselineRank(power('passive', 4))).toBe(4);
        expect(creationBaselineRank(power('activeBuff', 4))).toBe(4);
        expect(creationBaselineRank(power('reaction', 4))).toBe(4);
    });

    it('refunds only the XP spent above the baseline for a clean upgrade', () => {
        // Active raised from creation R2 to level 3 → cost(3) = 2 × 3 = 6.
        expect(calculatePowerUpgradeRefund(power('active', 3, 2))).toBe(6);
    });

    it('ignores a corrupt minLevel below the creation rank (no phantom refund)', () => {
        // Defensive power sitting at its creation rank R4 but with minLevel 1.
        // Must refund 0, not the 4→…→1 phantom levels.
        expect(calculatePowerUpgradeRefund(power('passive', 4, 1))).toBe(0);
        expect(calculatePowerUpgradeRefund(power('passive', 4, 0))).toBe(0);
        expect(calculatePowerUpgradeRefund(power('passive', 4, undefined))).toBe(0);
    });

    it('still recovers the baseline for actives when minLevel is missing/low', () => {
        expect(calculatePowerUpgradeRefund(power('active', 3, undefined))).toBe(6);
        expect(calculatePowerUpgradeRefund(power('active', 3, 1))).toBe(6);
    });

    it('preserves a legitimate large refund for a genuinely upgraded power', () => {
        // Passive raised from R4 to level 8 → cost(5..8) = 2 × (5+6+7+8) = 52.
        expect(calculatePowerUpgradeRefund(power('passive', 8, 4))).toBe(52);
    });

    it('getPowerMinLevel never exceeds current level', () => {
        expect(getPowerMinLevel(power('passive', 3, 9))).toBe(3);
    });

    it('sums refunds across a fresh combat package as zero', () => {
        const powers = [
            power('passive', 4, 4),
            power('passive', 4, 4),
            power('activeBuff', 4, 4),
            power('reaction', 4, 4),
            power('active', 2, 2),
            power('active', 2, 2),
        ];
        expect(calculatePowersUpgradeRefund(powers)).toBe(0);
    });

    it('reproduces the reported bug fix: one active 2→3 refunds only its level', () => {
        const powers = [
            power('passive', 4, 1), // corrupt minLevel — must not refund
            power('passive', 4, 1),
            power('activeBuff', 4, 0),
            power('reaction', 4, undefined),
            power('active', 2, 2),
            power('active', 3, 2), // the one actually upgraded → cost(3) = 6
        ];
        expect(calculatePowersUpgradeRefund(powers)).toBe(6);
    });
});

describe('power XP refund — deletion / GM grant', () => {
    it('powerLadderCost sums level costs 1…N', () => {
        // 2 + 4 + 6 = 12
        expect(powerLadderCost(3)).toBe(12);
        expect(powerLadderCost(1)).toBe(2);
    });

    it('refunds full ladder for XP-purchased L1 power', () => {
        expect(calculatePowerDeletionRefund(power('active', 1, 1, { xpPurchased: true }))).toBe(2);
    });

    it('refunds full ladder for purchased power raised to L3', () => {
        expect(calculatePowerDeletionRefund(power('active', 3, 1, { xpPurchased: true }))).toBe(12);
    });

    it('treats legacy minLevel === 1 as purchased (no gmGranted)', () => {
        expect(wasPowerXpPurchased(power('active', 1, 1))).toBe(true);
        expect(calculatePowerDeletionRefund(power('active', 1, 1))).toBe(2);
    });

    it('GM-granted L1 refunds 0; upgrades only above grant floor', () => {
        expect(calculatePowerDeletionRefund(power('active', 1, 1, { gmGranted: true }))).toBe(0);
        // getPowerMinLevel floors active minLevel 1 → 2 when level ≥ 2, so L3 refunds cost(3)=6
        expect(calculatePowerDeletionRefund(power('active', 3, 1, { gmGranted: true }))).toBe(6);
    });

    it('creation package power refunds only upgrades above baseline', () => {
        expect(calculatePowerDeletionRefund(power('active', 2, 2))).toBe(0);
        expect(calculatePowerDeletionRefund(power('active', 3, 2))).toBe(6);
        expect(calculatePowerDeletionRefund(power('passive', 4, 4))).toBe(0);
    });
});
