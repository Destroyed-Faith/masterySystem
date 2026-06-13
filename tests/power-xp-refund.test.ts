import { describe, expect, it } from 'vitest';
import {
    calculatePowerUpgradeRefund,
    calculatePowersUpgradeRefund,
    getPowerMinLevel,
} from '../src/utils/power-xp-refund.js';

describe('power-xp-refund', () => {
    it('returns 0 when power is at minLevel', () => {
        expect(
            calculatePowerUpgradeRefund({ system: { level: 4, minLevel: 4 } }),
        ).toBe(0);
    });

    it('refunds cost for each level above minLevel', () => {
        // min 2, current 4 → cost(3) + cost(4) = 6 + 8 = 14
        expect(
            calculatePowerUpgradeRefund({ system: { level: 4, minLevel: 2 } }),
        ).toBe(14);
    });

    it('uses current level as min when minLevel missing', () => {
        expect(calculatePowerUpgradeRefund({ system: { level: 3 } })).toBe(0);
    });

    it('getPowerMinLevel falls back to current level', () => {
        expect(getPowerMinLevel({ system: { level: 5 } })).toBe(5);
    });

    it('sums refunds across multiple powers', () => {
        const total = calculatePowersUpgradeRefund([
            { system: { level: 3, minLevel: 2 } }, // cost(3)=6
            { system: { level: 5, minLevel: 4 } }, // cost(5)=10
        ]);
        expect(total).toBe(16);
    });
});
