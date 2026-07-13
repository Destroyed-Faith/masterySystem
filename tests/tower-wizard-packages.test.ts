import { describe, expect, it } from 'vitest';
import {
    buildPackageGrantSpecs,
    buildPackageReview,
    catalogEntryMatchesGrantKey,
    getDefaultActiveBuffPreview,
    getOffensiveActiveBuffGroups,
    getOffensiveActiveBuffOptions,
    catalogMechanicsText,
    getCatalogSubfamily,
    getCategoryPickerGroups,
    getOffenseActiveGroups,
    getOffenseActiveSpecialGroups,
    getPassive1VariantOptions,
    getSecondPassiveGroups,
    getSecondPassiveIntentGroups,
    getVisibleWizardSteps,
    playerFacingPowerName,
    resolveGrant,
    resolveGuidedCoreAttackPick,
    getGuidedSpecialFocusGroups,
    GUIDED_DELIVERY_OPTIONS,
    TOWER_WIZARD_DEFENSE_PACKAGES,
    TOWER_WIZARD_OFFENSE_PACKAGES,
    WIZARD_HIDDEN_OFFENSE_IDS,
    WIZARD_STEP_ORDER,
} from '../src/creation/tower-wizard/tower-wizard-packages.js';
import { TOWER_WIZARD_DEFENSIVE_RANK, TOWER_WIZARD_OFFENSIVE_RANK, TOWER_WIZARD_POWER_TOTAL, findCatalogEntry } from '../src/utils/power-catalog.js';
import type { TowerWizardSelection } from '../src/creation/tower-wizard/tower-wizard-types.js';

const baseSelection: TowerWizardSelection = {
    defenseId: 'armor',
    secondPassiveTemplateId: 'passive-temp-hp',
    activeBuffMode: 'defensive',
    offenseId: 'direct-damage',
    delivery: 'melee',
    weakenSave: null,
};

describe('tower-wizard-packages', () => {
    it('each defense package resolves core grants at rank 4', () => {
        for (const pkg of TOWER_WIZARD_DEFENSE_PACKAGES) {
            expect(resolveGrant(pkg.grants.passive1).status).toBe('ok');
            expect(resolveGrant(pkg.grants.activeBuff).status).toBe('ok');
            expect(resolveGrant(pkg.grants.reaction).status).toBe('ok');
            expect(pkg.grants.passive1.rank).toBe(TOWER_WIZARD_DEFENSIVE_RANK);
        }
    });

    it('second passive groups exclude Passive 1 and every same-category passive', () => {
        const groups = getSecondPassiveIntentGroups('armor', 'passive-stone-stance');
        const allIds = groups.flatMap((g) => g.passives.map((p) => p.id));
        const labels = groups.map((g) => g.intentLabel);

        expect(allIds).not.toContain('passive-stone-stance');
        expect(allIds).not.toContain('passive-fortified-frame');
        expect(allIds).not.toContain('passive-surrounded-bulwark');
        expect(allIds).not.toContain('passive-armor-temp-hp');
        expect(allIds).not.toContain('conditional-passive-armor-healing');
        expect(allIds).not.toContain('passive-heightened-senses');
        expect(labels).not.toContain('Reinforce your Main Defense');
        expect(labels).not.toContain('Add Awareness / Utility');
        expect(labels).toContain('Add Avoidance');
        expect(labels).toContain('Add a Premium Defense');
        expect(allIds).toContain('passive-evade');
        expect(allIds).toContain('passive-damage-reduction');
        expect(allIds).toContain('passive-temp-hp');
        expect(allIds).not.toContain('passive-special-aura');
        expect(allIds).not.toContain('passive-ambusher');
    });

    it('guided passive 2 uses player-facing titles for sustain and offense', () => {
        const groups = getSecondPassiveIntentGroups('armor', 'passive-fortified-frame');
        const sustain = groups.find((g) => g.intentLabel === 'Add Healing or Combat Recovery');
        const offense = groups.find((g) => g.intentLabel === 'Add More Damage');
        expect(sustain?.passives.find((p) => p.id === 'passive-blood-feast')?.label).toBe('Heal through violence');
        expect(sustain?.passives.find((p) => p.id === 'passive-battle-trance')?.powerName).toBe('Battle Trance');
        expect(offense?.passives.find((p) => p.id === 'passive-momentum')?.label).toBe('Build offensive pressure');
        expect(offense?.passives.find((p) => p.id === 'passive-killing-intent')?.label).toBe('Punish priority targets');
    });

    it('armor Passive 1 variants include fortified frame and conditional options', () => {
        const variants = getPassive1VariantOptions('armor');
        expect(variants.map((v) => v.templateId)).toContain('passive-fortified-frame');
        expect(variants.map((v) => v.templateId)).toContain('passive-armor-temp-hp');
        expect(variants.find((v) => v.templateId === 'passive-fortified-frame')?.isRecommended).toBe(true);
    });

    it('damage reduction Passive 1 variant is locked to the premium package', () => {
        const variants = getPassive1VariantOptions('damage-reduction');
        expect(variants).toHaveLength(1);
        expect(variants[0]?.isLocked).toBe(true);
    });

    it('second passive intent groups show premium defense with card warnings for armor builds', () => {
        const groups = getSecondPassiveIntentGroups('armor', 'passive-fortified-frame');
        const premium = groups.find((g) => g.intentLabel === 'Add a Premium Defense');
        expect(premium).toBeDefined();
        expect(premium?.intentHint).toMatch(/powerful defensive subsystem/i);
        const dr = premium?.passives.find((p) => p.id === 'passive-damage-reduction');
        const ghost = premium?.passives.find((p) => p.id === 'passive-ghostform');
        expect(dr?.warning).toMatch(/Premium subsystem/i);
        expect(ghost?.warning).toMatch(/Premium subsystem/i);
    });

    it('guided step order includes Passive 1 variant after defense', () => {
        expect(WIZARD_STEP_ORDER.indexOf('defensePassiveVariant')).toBe(1);
        expect(getVisibleWizardSteps({ defenseId: 'armor', activeBuffMode: 'defensive' })).toContain('defensePassiveVariant');
    });

    it('guided step order includes delivery and special focus before review', () => {
        expect(WIZARD_STEP_ORDER).toContain('offenseDelivery');
        expect(WIZARD_STEP_ORDER).toContain('offenseSpecial');
        const steps = getVisibleWizardSteps({ defenseId: 'armor', activeBuffMode: 'defensive' });
        expect(steps).toContain('offenseDelivery');
        expect(steps).toContain('offenseSpecial');
        expect(steps).not.toContain('offense');
    });

    it('guided core attack resolves from delivery mode', () => {
        expect(resolveGuidedCoreAttackPick('melee')?.pick.templateId).toBe('active-melee-weapon-single');
        expect(resolveGuidedCoreAttackPick('ranged')?.pick.templateId).toBe('active-ranged-weapon-single');
        expect(resolveGuidedCoreAttackPick('spell')?.coreIsSpell).toBe(true);
        expect(GUIDED_DELIVERY_OPTIONS).toHaveLength(4);
    });

    it('guided special focus groups use tactical purpose labels', () => {
        const groups = getGuidedSpecialFocusGroups('melee');
        expect(groups.some((g) => g.label === 'Focus one enemy')).toBe(true);
        expect(groups.some((g) => g.label === 'Apply pressure over time')).toBe(true);
        const lacerate = groups.flatMap((g) => g.cards).find((c) => c.powerName === 'Lacerate');
        expect(lacerate?.playerTitle).toMatch(/bleed/i);
        expect(groups.some((g) => g.label === 'Advanced control')).toBe(true);
    });

    it('guided package review includes build summary', () => {
        const core = resolveGuidedCoreAttackPick('melee')!.pick;
        const groups = getGuidedSpecialFocusGroups('melee');
        const special = groups.flatMap((g) => g.cards).find((c) => c.powerName === 'Mark');
        expect(special).toBeDefined();
        const review = buildPackageReview({
            ...baseSelection,
            offenseId: undefined,
            offenseActivePicks: [core, {
                pickId: special!.pickId,
                templateId: special!.templateId,
                special: special!.special,
            }],
            guidedAttackDelivery: 'melee',
        });
        expect(review.guidedBuildSummary?.slots.length).toBeGreaterThan(4);
        expect(review.guidedBuildSummary?.rotationSteps).toHaveLength(5);
        expect(review.offenseReviewRows[0]?.role).toBe('Core Attack');
        expect(review.offenseReviewRows[1]?.role).toBe('Special Attack');
    });

    it('buildPackageGrantSpecs uses the selected Passive 1 variant', () => {
        const specs = buildPackageGrantSpecs({
            ...baseSelection,
            passive1TemplateId: 'passive-stone-stance',
        });
        expect(specs[0]?.templateId).toBe('passive-stone-stance');
    });

    it('second passive groups exclude armor-category passives when Passive 1 is armor', () => {
        const armor = getSecondPassiveGroups('armor', 'passive-fortified-frame');
        const allIds = armor.flatMap((g) => g.passives.map((p) => p.id));
        expect(allIds).toContain('passive-temp-hp');
        expect(allIds).toContain('passive-deep-vitality');
        expect(allIds).not.toContain('passive-fortified-frame');
        expect(allIds).not.toContain('passive-armor-temp-hp');
        expect(allIds).not.toContain('conditional-passive-armor-temp-hp');
        expect(allIds.length).toBeGreaterThan(10);
    });

    it('second passive groups include evade hybrids when Passive 1 is not evade', () => {
        const groups = getSecondPassiveGroups('armor', 'passive-fortified-frame');
        const allIds = groups.flatMap((g) => g.passives.map((p) => p.id));
        expect(allIds).toContain('passive-evade-temp-hp');
        expect(allIds).not.toContain('passive-evade-damage');
    });

    it('second passive groups exclude evade hybrids when Passive 1 is evade', () => {
        const evade = getSecondPassiveGroups('evade', 'passive-evade');
        const allIds = evade.flatMap((g) => g.passives.map((p) => p.id));
        expect(allIds).not.toContain('passive-evade');
        expect(allIds).not.toContain('passive-flowing-step');
        expect(allIds).not.toContain('passive-evade-damage');
    });

    it('ruin and weaken-save are hidden from wizard offense list', () => {
        expect(WIZARD_HIDDEN_OFFENSE_IDS).toContain('ruin');
        expect(WIZARD_HIDDEN_OFFENSE_IDS).toContain('weaken-save');
        const expose = TOWER_WIZARD_OFFENSE_PACKAGES.find((p) => p.id === 'expose');
        expect(expose?.catalogAvailable).toBe(true);
        const weaken = TOWER_WIZARD_OFFENSE_PACKAGES.find((p) => p.id === 'weaken-save');
        expect(weaken?.catalogAvailable).toBe(false);
    });

    it('available offense packages resolve two actives at rank 2', () => {
        const specs = buildPackageGrantSpecs(baseSelection);
        expect(specs).toHaveLength(TOWER_WIZARD_POWER_TOTAL);
        const actives = specs.filter((s) => s.templateId.startsWith('active-'));
        expect(actives).toHaveLength(2);
        actives.forEach((a) => expect(a.rank).toBe(TOWER_WIZARD_OFFENSIVE_RANK));
        const review = buildPackageReview(baseSelection);
        expect(review.allOk).toBe(true);
    });

    it('mark package shows Mark as player-facing name', () => {
        const selection: TowerWizardSelection = {
            ...baseSelection,
            offenseId: 'mark',
            delivery: 'ranged',
        };
        const review = buildPackageReview(selection);
        expect(review.offenseRows[0]?.playerName).toBe('Mark');
        expect(review.offenseRows[0]?.playerName).not.toMatch(/tier/i);
    });

    it('offensive active buff options include five catalog buffs with rank previews', () => {
        const options = getOffensiveActiveBuffOptions();
        expect(options.length).toBeGreaterThanOrEqual(5);
        expect(options.map((o) => o.id)).toContain('ab-special-overdrive');
        for (const opt of options) {
            expect(opt.rankPreview.length).toBeGreaterThan(0);
            expect(opt.groupLabel.length).toBeGreaterThan(0);
        }
        const groups = getOffensiveActiveBuffGroups();
        expect(groups.length).toBeGreaterThanOrEqual(3);
    });

    it('default active buff preview reflects defense package', () => {
        const preview = getDefaultActiveBuffPreview('armor');
        expect(preview?.id).toBe('ab-armor');
        expect(preview?.rankPreview).toMatch(/13 Armor/i);
    });

    it('offensive active buff replaces defensive buff in package', () => {
        const selection: TowerWizardSelection = {
            ...baseSelection,
            activeBuffMode: 'offensive',
            offensiveActiveBuffId: 'ab-damage',
        };
        const specs = buildPackageGrantSpecs(selection);
        expect(specs[2].templateId).toBe('ab-damage');
    });

    it('offense special groups dedupe melee/ranged into pattern rows', () => {
        const groups = getOffenseActiveSpecialGroups(null);
        expect(groups.length).toBeGreaterThan(0);
        const lacerate = groups.find((g) => g.specialKey === 'lacerate');
        expect(lacerate).toBeDefined();
        const singleT4 = lacerate!.patterns.find((p) => p.patternId === 'damage-t4');
        expect(singleT4).toBeDefined();
        expect(singleT4!.label).toBe('Damage');
        expect(singleT4!.label).not.toMatch(/tier\s*\d/i);
        expect(singleT4!.variants.map((v) => v.delivery).sort()).toEqual(['melee', 'ranged']);
        expect(lacerate!.groupTooltip).toMatch(/move more than 0/i);
        expect(singleT4!.variants).toHaveLength(2);
        const totalVariants = groups.reduce(
            (n, g) => n + g.patterns.reduce((m, p) => m + p.variants.length, 0),
            0,
        );
        expect(totalVariants).toBeGreaterThan(2);
    });

    it('offense groups put Normal Attacks first with single/split/aoe weapon patterns', () => {
        const groups = getOffenseActiveSpecialGroups(null);
        expect(groups[0]?.groupLabel).toBe('Normal Attacks');
        const patternIds = groups[0]!.patterns.map((p) => p.patternId);
        expect(patternIds.indexOf('weapon-single')).toBeLessThan(patternIds.indexOf('weapon-split'));
        expect(patternIds.indexOf('weapon-split')).toBeLessThan(patternIds.indexOf('weapon-aoe'));
    });

    it('offense groups combine control actives including damage + stunned', () => {
        const groups = getOffenseActiveSpecialGroups(null);
        const control = groups.find((g) => g.groupLabel === 'Control');
        expect(control).toBeDefined();
        const patternIds = control!.patterns.map((p) => p.patternId);
        expect(patternIds.some((id) => id.includes('damage-stunned'))).toBe(true);
        expect(patternIds.some((id) => id.includes('control-'))).toBe(true);
        expect(groups.indexOf(control!)).toBeLessThan(
            groups.findIndex((g) => g.specialKey === 'lacerate'),
        );
    });

    it('offense groups combine heal and cleanse support actives', () => {
        const groups = getOffenseActiveSpecialGroups(null);
        const healing = groups.find((g) => g.groupLabel === 'Healing');
        expect(healing).toBeDefined();
        const labels = healing!.patterns.map((p) => p.label);
        expect(labels.some((l) => /heal/i.test(l))).toBe(true);
        expect(labels.some((l) => /cleanse/i.test(l))).toBe(true);
        expect(healing!.patterns.some((p) => p.patternId.includes('heal-cleanse-mixed'))).toBe(true);
    });

    it('offense groups omit dispel actives', () => {
        const groups = getOffenseActiveSpecialGroups(null);
        const allTemplateIds = groups.flatMap((g) =>
            g.patterns.flatMap((p) => p.variants.map((v) => v.templateId)),
        );
        expect(allTemplateIds.some((id) => id.includes('dispel'))).toBe(false);
    });

    it('getOffenseActiveSpecialGroups excludes identity keys passed in', () => {
        const groups = getOffenseActiveSpecialGroups(null);
        const variant = groups[0]!.patterns[0]!.variants[0]!;
        const filtered = getOffenseActiveSpecialGroups(
            null,
            undefined,
            new Set([variant.pickId]),
        );
        const stillThere = filtered
            .flatMap((g) => g.patterns.flatMap((p) => p.variants.map((v) => v.pickId)))
            .includes(variant.pickId);
        expect(stillThere).toBe(false);
    });

    it('getCategoryPickerGroups returns subfamily groups per category at slot rank', () => {
        for (const category of ['passive', 'activeBuff', 'reaction'] as const) {
            const groups = getCategoryPickerGroups(category, TOWER_WIZARD_DEFENSIVE_RANK);
            expect(groups.length).toBeGreaterThan(0);
            const cards = groups.flatMap((g) => g.cards);
            expect(cards.length).toBeGreaterThan(0);
            for (const card of cards) {
                const entry = findCatalogEntry(card.templateId, card.special);
                expect(entry?.category).toBe(category);
            }
        }
    });

    it('getCategoryPickerGroups excludes identity keys and omits dispel', () => {
        const groups = getCategoryPickerGroups('reaction', TOWER_WIZARD_DEFENSIVE_RANK);
        const first = groups[0]!.cards[0]!;
        const filtered = getCategoryPickerGroups('reaction', TOWER_WIZARD_DEFENSIVE_RANK, {
            excludeIdentityKeys: new Set([first.identityKey]),
        });
        const stillThere = filtered
            .flatMap((g) => g.cards.map((c) => c.identityKey))
            .includes(first.identityKey);
        expect(stillThere).toBe(false);

        const activeBuffs = getCategoryPickerGroups('activeBuff', TOWER_WIZARD_DEFENSIVE_RANK);
        const buffIds = activeBuffs.flatMap((g) => g.cards.map((c) => c.templateId));
        expect(buffIds.some((id) => id.includes('dispel'))).toBe(false);
    });

    it('getCategoryPickerGroups omits an excluded subfamily entirely', () => {
        const groups = getCategoryPickerGroups('passive', TOWER_WIZARD_DEFENSIVE_RANK);
        const sampleCard = groups[0]!.cards[0]!;
        const sub = getCatalogSubfamily(sampleCard.templateId, sampleCard.special);
        expect(sub).toBeTruthy();
        const filtered = getCategoryPickerGroups('passive', TOWER_WIZARD_DEFENSIVE_RANK, {
            excludeSubfamilies: new Set([sub!]),
        });
        const remainingSubs = filtered.flatMap((g) =>
            g.cards.map((c) => getCatalogSubfamily(c.templateId, c.special)),
        );
        expect(remainingSubs.includes(sub!)).toBe(false);
    });

    it('picker cards carry rank-specific mechanical tooltip text', () => {
        const groups = getCategoryPickerGroups('passive', TOWER_WIZARD_DEFENSIVE_RANK);
        const bloodlust = groups
            .flatMap((g) => g.cards)
            .find((c) => c.templateId === 'passive-bloodlust');
        expect(bloodlust).toBeDefined();
        expect(bloodlust!.mechanics).toMatch(/lacerate/i);
        expect(bloodlust!.mechanics).toMatch(/d6/i);
        expect(bloodlust!.mechanics).not.toContain('**');
    });

    it('catalogMechanicsText reads the effect text for the requested rank', () => {
        const entry = findCatalogEntry('passive-bloodlust', null)!;
        expect(entry).toBeDefined();
        const r4 = catalogMechanicsText(entry, 4);
        const r1 = catalogMechanicsText(entry, 1);
        expect(r4).toBeTruthy();
        expect(r4).not.toBe(r1);
    });

    it('getCategoryPickerGroups marks the current selection as selected', () => {
        const groups = getCategoryPickerGroups('passive', TOWER_WIZARD_DEFENSIVE_RANK);
        const target = groups[0]!.cards[0]!;
        const withSelection = getCategoryPickerGroups('passive', TOWER_WIZARD_DEFENSIVE_RANK, {
            selectedIdentityKeys: new Set([target.identityKey]),
        });
        const group = withSelection.find((g) => g.cards.some((c) => c.identityKey === target.identityKey))!;
        expect(group.hasSelection).toBe(true);
        expect(group.cards.find((c) => c.identityKey === target.identityKey)!.isSelected).toBe(true);
    });

    it('catalog offense picks build two active grant specs', () => {
        const groups = getOffenseActiveSpecialGroups(null);
        const first = groups[0]?.patterns[0]?.variants[0];
        const second = groups[0]?.patterns[0]?.variants[1]
            ?? groups[0]?.patterns[1]?.variants[0]
            ?? groups[1]?.patterns[0]?.variants[0];
        expect(first).toBeDefined();
        expect(second).toBeDefined();
        const selection: TowerWizardSelection = {
            ...baseSelection,
            offenseId: undefined,
            offenseActivePicks: [
                { pickId: first!.pickId, templateId: first!.templateId, special: first!.special ?? null },
                { pickId: second!.pickId, templateId: second!.templateId, special: second!.special ?? null },
            ],
        };
        const specs = buildPackageGrantSpecs(selection);
        const actives = specs.filter((s) => s.templateId.startsWith('active-'));
        expect(actives).toHaveLength(2);
    });

    it('hex package second active can be configured as split weapon', () => {
        const selection: TowerWizardSelection = {
            defenseId: 'phasing',
            secondPassiveTemplateId: 'passive-temp-hp',
            activeBuffMode: 'defensive',
            offenseId: 'hex-spell',
            delivery: 'ranged',
            weakenSave: null,
            offenseActiveOverrides: [
                {
                    grantKey: 'offense-0',
                    isSpell: true,
                    castingAttribute: 'intellect',
                    spellResolution: 'saveSpell',
                },
                {
                    grantKey: 'offense-1',
                    variant: 'weapon-split',
                    isSpell: false,
                },
            ],
        };
        const specs = buildPackageGrantSpecs(selection);
        const actives = specs.filter((s) => s.templateId.startsWith('active-'));
        expect(actives[0].special).toBe('hex');
        expect(actives[1].templateId).toBe('active-ranged-weapon-split');
    });

    it('power override replaces catalog grant on review row', () => {
        const selection: TowerWizardSelection = {
            ...baseSelection,
            powerOverrides: [
                { grantKey: 'passive-2', templateId: 'passive-deep-vitality' },
            ],
        };
        const specs = buildPackageGrantSpecs(selection);
        expect(specs[1].templateId).toBe('passive-deep-vitality');
        const review = buildPackageReview(selection);
        expect(review.reviewPowerRows).toHaveLength(6);
        expect(review.reviewPowerRows[1]?.hasCatalogOverride).toBe(true);
    });

    it('catalog override on offense slot skips variant resolution', () => {
        const selection: TowerWizardSelection = {
            ...baseSelection,
            powerOverrides: [
                {
                    grantKey: 'offense-1',
                    templateId: 'active-ranged-damage-t4',
                    special: 'mark',
                },
            ],
        };
        const specs = buildPackageGrantSpecs(selection);
        expect(specs[5].special).toBe('mark');
        expect(specs[5].templateId).toBe('active-ranged-damage-t4');
    });

    it('catalogEntryMatchesGrantKey rejects wrong category for slot', () => {
        const passive = findCatalogEntry('passive-temp-hp');
        const active = findCatalogEntry('active-ranged-damage-t4', 'mark');
        expect(passive).toBeTruthy();
        expect(active).toBeTruthy();
        expect(catalogEntryMatchesGrantKey(passive!, 'passive-2')).toBe(true);
        expect(catalogEntryMatchesGrantKey(passive!, 'offense-0')).toBe(false);
        expect(catalogEntryMatchesGrantKey(active!, 'offense-0')).toBe(true);
        expect(catalogEntryMatchesGrantKey(active!, 'passive-1')).toBe(false);
    });

    it('playerFacingPowerName prefers special names over tier labels', () => {
        expect(playerFacingPowerName({ templateId: 'active-ranged-damage-t4', rank: 2, special: 'mark' })).toBe('Mark');
    });
});
