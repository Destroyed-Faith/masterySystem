import { describe, expect, it } from 'vitest';
import {
    ARTIFACT_FREE_TRAIT_OPTIONS,
    getArtifactWeaponInnateOptions,
} from '../src/utils/artifact-node-options';
import {
    ARTIFACT_SLOT_KEYS,
    ATTRIBUTE_ACCESS_BY_SLOT,
    BASE_PROFILES_BY_SLOT,
    BASE_VALUE_LIMIT_BY_SLOT,
    SLOT_POWER_ACCESS,
    STONE_POWER_COST_CHAIN,
    getActiveBuffEmpowermentUsesPerRest,
    getArtifactStageForLevel,
    getBodyArmorBaselineBonus,
    getDefaultPowerLevelForArtifactLevel,
    getFeetEvadeBaseline,
    getFeetMovementBaseline,
    getMinorArmorBaseline,
    getMinorMovementBaselineB,
    getMinorFlightBaselineB,
    getNoArmorBodyEvadeBaseline,
    getPassiveReinforcementBaseline,
    getStoneBatteryCapacity,
    getStonePoolStoredStones,
    getStonePowerSupportPrefillTier,
    getStoneRefreshAmount,
    getThrownRangeBaseline,
    getWeaponDamageBaseline,
    getWeaponSpecialBaseline,
    isAttributeAllowedForStoneFunctionInSlot,
    isBaseProfileAllowedForSlot,
    isBaseValueTypeAllowedForSlot,
    BASE_VALUE_TYPE_LABELS,
    formatArtifactWeaponRangeDisplay,
    resolveArtifactWeaponKind,
    type ArtifactSlot,
} from '../src/utils/artifact-rules.js';

describe('Artifact rules — slot vocabulary', () => {
    it('exposes the canonical slots (incl. the both-hands two-handed slot)', () => {
        expect([...ARTIFACT_SLOT_KEYS].sort()).toEqual(
            ['amulet', 'body', 'bothHands', 'feet', 'head', 'mainHand', 'offHand', 'ring'].sort(),
        );
    });

    it('defines a base-value limit for every slot', () => {
        for (const k of ARTIFACT_SLOT_KEYS) {
            expect(BASE_VALUE_LIMIT_BY_SLOT[k]).toBeGreaterThanOrEqual(1);
            expect(BASE_VALUE_LIMIT_BY_SLOT[k]).toBeLessThanOrEqual(3);
        }
    });

    it('limits the body slot to one base value (spec)', () => {
        expect(BASE_VALUE_LIMIT_BY_SLOT.body).toBe(1);
    });

    it('mainHand and offHand allow two base values', () => {
        expect(BASE_VALUE_LIMIT_BY_SLOT.mainHand).toBe(2);
        expect(BASE_VALUE_LIMIT_BY_SLOT.offHand).toBe(2);
    });
});

describe('Artifact rules — attribute & profile access by slot', () => {
    it('every slot accepts all 7 attributes (per-slot restriction dropped)', () => {
        const allAttributes = ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence', 'wits'];
        for (const k of ARTIFACT_SLOT_KEYS) {
            expect(Array.isArray(ATTRIBUTE_ACCESS_BY_SLOT[k])).toBe(true);
            expect([...ATTRIBUTE_ACCESS_BY_SLOT[k]].sort()).toEqual([...allAttributes].sort());
        }
    });

    it('isAttributeAllowedForStoneFunctionInSlot mirrors ATTRIBUTE_ACCESS_BY_SLOT', () => {
        for (const slot of ARTIFACT_SLOT_KEYS) {
            for (const a of ATTRIBUTE_ACCESS_BY_SLOT[slot]) {
                expect(isAttributeAllowedForStoneFunctionInSlot(slot as ArtifactSlot, a as any)).toBe(true);
            }
            expect(isAttributeAllowedForStoneFunctionInSlot(slot as ArtifactSlot, 'definitely-not-an-attribute' as any)).toBe(false);
        }
    });

    it('isBaseProfileAllowedForSlot mirrors BASE_PROFILES_BY_SLOT', () => {
        const slot: ArtifactSlot = 'body';
        for (const p of BASE_PROFILES_BY_SLOT[slot]) {
            expect(isBaseProfileAllowedForSlot(slot, p)).toBe(true);
        }
        expect(isBaseProfileAllowedForSlot(slot, 'oneHandedWeapon' as any)).toBe(false);
    });

    it('isBaseValueTypeAllowedForSlot rejects irrelevant types', () => {
        // Bodies cannot mount thrown range
        expect(isBaseValueTypeAllowedForSlot('body', 'thrownRange')).toBe(false);
        // Main hand allows weapon damage
        expect(isBaseValueTypeAllowedForSlot('mainHand', 'weaponDamage')).toBe(true);
    });

    it('head slot allows evade, armor, and sense — not minorFeature', () => {
        expect(isBaseValueTypeAllowedForSlot('head', 'evade')).toBe(true);
        expect(isBaseValueTypeAllowedForSlot('head', 'headArmor')).toBe(true);
        expect(isBaseValueTypeAllowedForSlot('head', 'sense')).toBe(true);
        expect(isBaseValueTypeAllowedForSlot('head', 'minorFeature')).toBe(false);
    });

    it('headArmor base value label is Armor', () => {
        expect(BASE_VALUE_TYPE_LABELS.headArmor).toBe('Armor');
    });
});

describe('Artifact rules — head evade derive', () => {
    it('headArmor profile evade uses +1…+5 scale (Falcon Wide Brim)', async () => {
        const { deriveBaseValueDisplay } = await import('../src/utils/artifact-base-derive.js');
        expect(deriveBaseValueDisplay('evade', 1, 'headArmor').display).toBe('+1 Evade');
        expect(deriveBaseValueDisplay('evade', 10, 'headArmor').display).toBe('+5 Evade');
    });
});

describe('Artifact rules — power access', () => {
    it('exposes primary/secondary/notAllowed for every slot', () => {
        for (const k of ARTIFACT_SLOT_KEYS) {
            const access = SLOT_POWER_ACCESS[k];
            expect(Array.isArray(access.primary)).toBe(true);
            expect(Array.isArray(access.secondary)).toBe(true);
            expect(Array.isArray(access.notAllowed)).toBe(true);
        }
    });
});

describe('Artifact rules — stage progression & default power levels', () => {
    it('maps level to stage', () => {
        expect(getArtifactStageForLevel(1)).toBe('basic');
        expect(getArtifactStageForLevel(3)).toBe('basic');
        expect(getArtifactStageForLevel(4)).toBe('improved');
        expect(getArtifactStageForLevel(6)).toBe('improved');
        expect(getArtifactStageForLevel(7)).toBe('greater');
        expect(getArtifactStageForLevel(9)).toBe('greater');
        expect(getArtifactStageForLevel(10)).toBe('ultimate');
    });

    it('default power level grows with stage', () => {
        const pl1 = getDefaultPowerLevelForArtifactLevel(1);
        const pl4 = getDefaultPowerLevelForArtifactLevel(4);
        const pl7 = getDefaultPowerLevelForArtifactLevel(7);
        const pl10 = getDefaultPowerLevelForArtifactLevel(10);
        expect(pl4).toBeGreaterThanOrEqual(pl1);
        expect(pl7).toBeGreaterThanOrEqual(pl4);
        expect(pl10).toBeGreaterThanOrEqual(pl7);
    });
});

describe('Artifact rules — baseline tables', () => {
    it('weapon damage baseline grows with level', () => {
        const d1 = getWeaponDamageBaseline(1);
        const d10 = getWeaponDamageBaseline(10);
        expect(d1).toBeTruthy();
        expect(d10).toBeTruthy();
        expect(d1).not.toBe(d10);
    });

    it('body armor baseline grows with level', () => {
        const a1 = getBodyArmorBaselineBonus(1);
        const a10 = getBodyArmorBaselineBonus(10);
        expect(a10).toBeGreaterThan(a1);
    });

    it('no-armor body evade baseline grows with level', () => {
        const e1 = getNoArmorBodyEvadeBaseline(1);
        const e10 = getNoArmorBodyEvadeBaseline(10);
        expect(e10).toBeGreaterThan(e1);
    });

    it('feet movement / evade / minor armor / thrown range / minor movement / minor flight tables are monotonic non-decreasing', () => {
        const helpers = [
            getFeetMovementBaseline,
            getFeetEvadeBaseline,
            getMinorArmorBaseline,
            getThrownRangeBaseline,
            getMinorMovementBaselineB,
            getMinorFlightBaselineB,
        ];
        for (const helper of helpers) {
            const v1 = helper(1);
            const v10 = helper(10);
            expect(v10).toBeGreaterThanOrEqual(v1);
        }
    });

    it('passive reinforcement baseline grows with level', () => {
        expect(getPassiveReinforcementBaseline(10)).toBeGreaterThanOrEqual(
            getPassiveReinforcementBaseline(1),
        );
    });

    it('active buff empowerment uses follow ceil(MR/2)', () => {
        expect(getActiveBuffEmpowermentUsesPerRest(1)).toBe(1);
        expect(getActiveBuffEmpowermentUsesPerRest(2)).toBe(1);
        expect(getActiveBuffEmpowermentUsesPerRest(3)).toBe(2);
        expect(getActiveBuffEmpowermentUsesPerRest(8)).toBe(4);
    });

    it('weapon special baseline returns a usable record', () => {
        const w = getWeaponSpecialBaseline(5);
        expect(w).toBeTruthy();
    });
});

describe('Artifact rules — Stone Function tables', () => {
    it('stone-power-support prefill tier sits in {0,2,3,4}', () => {
        const valid = new Set([0, 2, 3, 4]);
        for (let l = 1; l <= 10; l++) {
            expect(valid.has(getStonePowerSupportPrefillTier(l))).toBe(true);
        }
    });

    it('stone-pool stored stones is monotonic non-decreasing', () => {
        expect(getStonePoolStoredStones(10)).toBeGreaterThanOrEqual(getStonePoolStoredStones(1));
    });

    it('stone-refresh and stone-battery scale with level', () => {
        expect(getStoneRefreshAmount(10)).toBeGreaterThanOrEqual(getStoneRefreshAmount(1));
        expect(getStoneBatteryCapacity(10)).toBeGreaterThanOrEqual(getStoneBatteryCapacity(1));
    });
});

describe('Artifact rules — STONE_POWER_COST_CHAIN', () => {
    it('matches the spec doubling chain 1 → 2 → 4 → 8', () => {
        expect(STONE_POWER_COST_CHAIN[1]).toBe(1);
        expect(STONE_POWER_COST_CHAIN[2]).toBe(2);
        expect(STONE_POWER_COST_CHAIN[3]).toBe(4);
        expect(STONE_POWER_COST_CHAIN[4]).toBe(8);
    });
});

describe('Artifact rules — weapon range display', () => {
    it('twoHandedWeapon is melee 1 m even when artifactWeapon.weaponType is stale ranged', () => {
        const aw = { weaponType: 'ranged', range: '1,2,3,4,5,6,7,8', innateAbilities: [], specials: [] };
        expect(resolveArtifactWeaponKind(aw, 'twoHandedWeapon')).toBe('melee');
        expect(formatArtifactWeaponRangeDisplay(aw, 'twoHandedWeapon')).toEqual({
            kind: 'melee',
            label: '1 m',
            meters: 1,
        });
    });

    it('twoHandedWeaponRanged uses parsed range or 24 m fallback', () => {
        const aw = { weaponType: 'melee', range: '12m', innateAbilities: [], specials: [] };
        expect(formatArtifactWeaponRangeDisplay(aw, 'twoHandedWeaponRanged')).toEqual({
            kind: 'ranged',
            label: '12 m',
            meters: 12,
        });
        expect(formatArtifactWeaponRangeDisplay({ ...aw, range: '1,2,3' }, 'twoHandedWeaponRanged')).toEqual({
            kind: 'ranged',
            label: '24 m',
            meters: 24,
        });
    });

    it('melee with Reach innate shows 2 m', () => {
        const aw = { weaponType: 'melee', range: '0m', innateAbilities: ['Reach (+1 m)'], specials: [] };
        expect(formatArtifactWeaponRangeDisplay(aw, 'twoHandedWeapon')).toEqual({
            kind: 'melee',
            label: '2 m',
            meters: 2,
        });
    });
});

describe('Free Trait options', () => {
    it('offers exactly the six rules-vetted weapon properties', () => {
        expect([...ARTIFACT_FREE_TRAIT_OPTIONS]).toEqual([
            'Finesse',
            'Light',
            'Versatile',
            'Reach (+1 m)',
            'Balanced',
            'Defensive',
        ]);
    });

    it('every free trait matches a catalog innate spelling exactly (dedup + regex rely on it)', () => {
        const catalog = getArtifactWeaponInnateOptions();
        for (const trait of ARTIFACT_FREE_TRAIT_OPTIONS) {
            expect(catalog).toContain(trait);
        }
    });
});
