/**
 * Tower Wizard — declarative defense/offense package definitions.
 */

import type { CastingAttribute, SpellResolution } from '../../types/item.js';
import {
    TOWER_WIZARD_DEFENSIVE_RANK,
    TOWER_WIZARD_OFFENSIVE_RANK,
    findCatalogEntry,
} from '../../utils/power-catalog.js';
import type { PowerGrantSpec } from '../../utils/power-item-builder.js';
import type {
    DefensePackageId,
    OffenseActiveOverride,
    OffenseActiveVariant,
    OffensePackageId,
    OffenseResolveContext,
    PackageReviewRow,
    ResolvedGrant,
    TowerWizardDefensePackage,
    TowerWizardOffensePackage,
    TowerWizardSelection,
} from './tower-wizard-types.js';

const DEF_RANK = TOWER_WIZARD_DEFENSIVE_RANK;
const OFF_RANK = TOWER_WIZARD_OFFENSIVE_RANK;

function def(templateId: string, rank: number, extra: Partial<PowerGrantSpec> = {}): PowerGrantSpec {
    return { templateId, rank, ...extra };
}

function dmg(flavour: 'melee' | 'ranged', tier: 3 | 4 | 5 | 6, special?: string): PowerGrantSpec {
    return def(`active-${flavour}-damage-t${tier}`, OFF_RANK, special ? { special } : {});
}

function weapon(flavour: 'melee' | 'ranged'): PowerGrantSpec {
    return def(`active-${flavour}-weapon-single`, OFF_RANK);
}

function weaponAoe(flavour: 'melee' | 'ranged'): PowerGrantSpec {
    return def(`active-${flavour}-weapon-aoe`, OFF_RANK);
}

function weaponSplit(flavour: 'melee' | 'ranged'): PowerGrantSpec {
    return def(`active-${flavour}-weapon-split`, OFF_RANK);
}

function controlPushPull(flavour: 'melee' | 'ranged'): PowerGrantSpec {
    return def(`active-${flavour}-control-push-pull`, OFF_RANK);
}

function spellDamage(flavour: 'melee' | 'ranged', tier: 3 | 4 | 5 | 6, special?: string): PowerGrantSpec {
    return {
        ...dmg(flavour, tier, special),
        isSpell: true,
        castingAttribute: 'intellect',
        spellResolution: special ? 'saveSpell' : 'spellAttack',
    };
}

const VARIANT_LABELS: Record<OffenseActiveVariant, string> = {
    'weapon-single': 'Single-target weapon',
    'weapon-aoe': 'Area weapon',
    'weapon-split': 'Split weapon attack',
    'damage-t3': 'Damage (Tier 3)',
    'damage-t4': 'Damage (Tier 4)',
    'damage-t4-spell': 'Spell damage (Tier 4)',
};

const SECOND_PASSIVE_LABELS: Record<string, string> = {
    'passive-temp-hp': 'Temporary HP',
    'passive-regeneration': 'Regeneration',
    'passive-deep-vitality': 'Health',
    'passive-killing-intent': 'Damage',
    'passive-evade': 'Evade',
};

export const TOWER_WIZARD_DEFENSE_PACKAGES: TowerWizardDefensePackage[] = [
    {
        id: 'armor',
        label: 'I want to reduce incoming hits with armor, guard, or toughness.',
        explanation:
            'You are not impossible to hit, but attacks that connect hurt less. This is the simplest and most reliable defensive style.',
        grants: {
            passive1: def('passive-fortified-frame', DEF_RANK),
            activeBuff: def('ab-armor', DEF_RANK),
            reaction: def('reaction-armor', DEF_RANK),
        },
        secondPassiveTemplateIds: ['passive-temp-hp', 'passive-regeneration', 'passive-deep-vitality'],
        recommendedSecondPassiveTemplateIds: ['passive-temp-hp', 'passive-regeneration', 'passive-deep-vitality'],
        offenseRecommendations: ['bleeding-push', 'corrode-damage', 'direct-damage'],
    },
    {
        id: 'evade',
        label: 'I want to survive by being hard to hit.',
        explanation:
            'You survive through dodging, speed, and reflexes. Works well with offensive Powers that make enemies easier to hit.',
        grants: {
            passive1: def('passive-evade', DEF_RANK),
            activeBuff: def('ab-evade', DEF_RANK),
            reaction: def('reaction-evade', DEF_RANK),
        },
        secondPassiveTemplateIds: ['passive-temp-hp', 'passive-regeneration', 'passive-killing-intent'],
        recommendedSecondPassiveTemplateIds: ['passive-temp-hp', 'passive-regeneration', 'passive-killing-intent'],
        offenseRecommendations: ['expose', 'mark', 'freeze'],
    },
    {
        id: 'damage-reduction',
        label: 'I want to reduce incoming damage by percentage.',
        explanation:
            'Damage Reduction is powerful, but it is a committed defensive path. Your Passive, Active Buff, and Reaction all support it together.',
        warning:
            'Damage Reduction is not a single bonus. It is a defensive package. The wizard locks this package together so the character works correctly.',
        grants: {
            passive1: def('passive-damage-reduction', DEF_RANK),
            activeBuff: def('ab-damage-reduction', DEF_RANK),
            reaction: def('reaction-damage-reduction', DEF_RANK),
        },
        secondPassiveTemplateIds: ['passive-deep-vitality', 'passive-temp-hp'],
        recommendedSecondPassiveTemplateIds: ['passive-deep-vitality', 'passive-temp-hp'],
        offenseRecommendations: ['direct-damage', 'corrode-damage', 'bleeding-push'],
    },
    {
        id: 'phasing',
        label: 'I want to ignore a few hits completely.',
        explanation:
            'Phasing lets you ignore a limited number of hits per combat. It is very strong, but limited.',
        warning:
            'Phasing is not normal damage reduction. It prevents a limited number of hits. Once those uses are gone, you need your other defenses.',
        grants: {
            passive1: def('passive-ghostform', DEF_RANK),
            activeBuff: def('ab-phasing', DEF_RANK),
            reaction: def('reaction-phasing', DEF_RANK),
        },
        secondPassiveTemplateIds: ['passive-temp-hp', 'passive-evade'],
        recommendedSecondPassiveTemplateIds: ['passive-temp-hp', 'passive-evade'],
        offenseRecommendations: ['mark', 'hex-spell', 'freeze'],
    },
];

function offensePackages(): TowerWizardOffensePackage[] {
    return [
        {
            id: 'bleeding-push',
            label: 'I want to move enemies around and punish movement.',
            explanation:
                'Bleeding punishes enemies for moving. Push forces enemies into bad positions. Together they create a simple control plan.',
            warning: 'This package works best when you understand positioning.',
            catalogAvailable: true,
            resolveGrants: ({ delivery }) => [dmg(delivery, 4, 'bleeding'), controlPushPull(delivery)],
        },
        {
            id: 'ignite',
            label: 'I want enemies to burn over time.',
            explanation: 'Ignite is simple and self-contained. You hit the enemy, the enemy burns, and the effect keeps applying pressure.',
            catalogAvailable: true,
            resolveGrants: ({ delivery }) => [dmg(delivery, 4, 'ignite'), weapon(delivery)],
        },
        {
            id: 'freeze',
            label: 'I want to slow enemies down.',
            explanation: 'Freeze makes enemies slower and keeps pressure on them.',
            catalogAvailable: true,
            resolveGrants: ({ delivery }) => [dmg(delivery, 4, 'freeze'), weapon(delivery)],
        },
        {
            id: 'expose',
            label: 'I want enemies to be easier to hit.',
            explanation: 'Expose reduces enemy Evade. This helps you and your allies hit fast, slippery, or hard-to-hit enemies.',
            catalogAvailable: false,
            catalogTodo: 'TODO: add Expose Active catalog entries before enabling this package',
            resolveGrants: () => [],
        },
        {
            id: 'corrode-damage',
            label: 'I want to break armor and then hit hard.',
            explanation:
                'Corrode reduces Armor. It is a setup tool. It becomes useful when you follow up with meaningful damage.',
            warning: 'Do not choose Corrode alone. Corrode wants a damage follow-up.',
            catalogAvailable: true,
            resolveGrants: ({ delivery }) => [dmg(delivery, 6, 'corrode'), weapon(delivery)],
        },
        {
            id: 'mark',
            label: 'I want my group to focus one important enemy.',
            explanation: 'Mark helps identify and pressure a priority target.',
            catalogAvailable: true,
            resolveGrants: ({ delivery }) => [dmg(delivery, 4, 'mark'), weapon(delivery)],
        },
        {
            id: 'hex-spell',
            label: 'I want to curse enemies so Spells hit harder.',
            explanation: 'Hex supports Spell damage. Follow up with a Spell or weapon attack of your choice on the review step.',
            warning: 'Hex is weak without a damage follow-up.',
            catalogAvailable: true,
            resolveGrants: ({ delivery }) => [
                spellDamage(delivery, 6, 'hex'),
                spellDamage(delivery, 4),
            ],
        },
        {
            id: 'weaken-save',
            label: 'I want enemies to fail important Saves.',
            explanation:
                'Weaken lowers one Save type. It is strongest when your next Power targets that same Save.',
            warning: 'Weaken needs a follow-up. It is weaker if nobody attacks the Save you weakened.',
            catalogAvailable: true,
            resolveGrants: ({ delivery, weakenSave }) => {
                const save = weakenSave ?? 'body';
                void save;
                return [
                    dmg(delivery, 5, 'weaken'),
                    {
                        ...spellDamage(delivery, 4),
                        spellResolution: 'saveSpell',
                        castingAttribute: 'intellect',
                    },
                ];
            },
        },
        {
            id: 'direct-damage',
            label: 'I just want a reliable attack.',
            explanation:
                'This is the simplest offensive option. You hit the enemy and deal damage without extra condition tracking.',
            catalogAvailable: true,
            resolveGrants: ({ delivery }) => [weapon(delivery), weaponAoe(delivery)],
        },
    ];
}

export const TOWER_WIZARD_OFFENSE_PACKAGES: TowerWizardOffensePackage[] = offensePackages();

export function getDefensePackage(id: DefensePackageId): TowerWizardDefensePackage | undefined {
    return TOWER_WIZARD_DEFENSE_PACKAGES.find((p) => p.id === id);
}

export function getOffensePackage(id: OffensePackageId): TowerWizardOffensePackage | undefined {
    return TOWER_WIZARD_OFFENSE_PACKAGES.find((p) => p.id === id);
}

export function getAvailableOffensePackages(): TowerWizardOffensePackage[] {
    return TOWER_WIZARD_OFFENSE_PACKAGES.filter((p) => p.catalogAvailable);
}

export function sortOffensePackagesForDefense(defenseId: DefensePackageId): TowerWizardOffensePackage[] {
    const defense = getDefensePackage(defenseId);
    const rec = new Set(defense?.offenseRecommendations ?? []);
    const available = getAvailableOffensePackages();
    return [...available].sort((a, b) => {
        const aRec = rec.has(a.id) ? 0 : 1;
        const bRec = rec.has(b.id) ? 0 : 1;
        if (aRec !== bRec) return aRec - bRec;
        return a.label.localeCompare(b.label);
    });
}

export function secondPassiveLabel(templateId: string): string {
    return SECOND_PASSIVE_LABELS[templateId] ?? templateId;
}

export function resolveGrant(spec: PowerGrantSpec): ResolvedGrant {
    const entry = findCatalogEntry(spec.templateId, spec.special ?? null);
    const status = entry ? 'ok' : 'missing';
    return {
        spec,
        displayName: entry?.templateName ?? secondPassiveLabel(spec.templateId),
        mechanicalName: entry?.name ?? spec.templateId,
        category: entry?.category ?? 'unknown',
        status,
    };
}

export function specFromVariant(delivery: 'melee' | 'ranged', variant: OffenseActiveVariant): PowerGrantSpec {
    switch (variant) {
        case 'weapon-single':
            return weapon(delivery);
        case 'weapon-aoe':
            return weaponAoe(delivery);
        case 'weapon-split':
            return weaponSplit(delivery);
        case 'damage-t3':
            return dmg(delivery, 3);
        case 'damage-t4':
            return dmg(delivery, 4);
        case 'damage-t4-spell':
            return spellDamage(delivery, 4);
        default:
            return weapon(delivery);
    }
}

export function getVariantOptionsForOffenseSlot(
    offenseId: OffensePackageId,
    slotIndex: number,
): OffenseActiveVariant[] {
    if (offenseId === 'hex-spell' && slotIndex === 1) {
        return ['weapon-single', 'weapon-aoe', 'weapon-split', 'damage-t4', 'damage-t4-spell'];
    }
    if (offenseId === 'direct-damage') {
        return slotIndex === 0
            ? ['weapon-single', 'weapon-split', 'damage-t4', 'damage-t4-spell']
            : ['weapon-aoe', 'weapon-split', 'damage-t4', 'damage-t4-spell'];
    }
    return [];
}

export function isOffenseSlotConfigurable(offenseId: OffensePackageId, slotIndex: number): boolean {
    return getVariantOptionsForOffenseSlot(offenseId, slotIndex).length > 0;
}

export function defaultVariantForOffenseSlot(
    offenseId: OffensePackageId,
    slotIndex: number,
): OffenseActiveVariant | undefined {
    if (offenseId === 'hex-spell' && slotIndex === 1) return 'damage-t4-spell';
    if (offenseId === 'direct-damage') {
        return slotIndex === 0 ? 'weapon-single' : 'weapon-aoe';
    }
    return undefined;
}

function applyOverrideToSpec(base: PowerGrantSpec, override?: OffenseActiveOverride, delivery?: 'melee' | 'ranged'): PowerGrantSpec {
    let spec = { ...base };
    if (override?.variant && delivery) {
        const fromVariant = specFromVariant(delivery, override.variant);
        spec = {
            ...fromVariant,
            rank: base.rank,
            special: base.special ?? fromVariant.special,
            isSpell: fromVariant.isSpell ?? base.isSpell,
            castingAttribute: fromVariant.castingAttribute ?? base.castingAttribute,
            spellResolution: fromVariant.spellResolution ?? base.spellResolution,
        };
    }
    if (override?.isSpell !== undefined) {
        spec.isSpell = override.isSpell;
        if (override.isSpell && !spec.castingAttribute) {
            spec.castingAttribute = override.castingAttribute ?? 'intellect';
        }
        if (override.isSpell && !spec.spellResolution) {
            spec.spellResolution = override.spellResolution ?? 'spellAttack';
        }
    }
    if (override?.castingAttribute) spec.castingAttribute = override.castingAttribute;
    if (override?.spellResolution) spec.spellResolution = override.spellResolution;
    if (spec.isSpell && !spec.castingAttribute) spec.castingAttribute = 'intellect';
    if (spec.isSpell && !spec.spellResolution) {
        spec.spellResolution = base.special ? 'saveSpell' : 'spellAttack';
    }
    return spec;
}

export function initializeOffenseOverrides(selection: TowerWizardSelection): OffenseActiveOverride[] {
    const offense = getOffensePackage(selection.offenseId);
    if (!offense) return [];
    const baseSpecs = offense.resolveGrants({
        delivery: selection.delivery,
        weakenSave: selection.weakenSave,
    });
    return baseSpecs.map((spec, i) => {
        const grantKey = `offense-${i}`;
        const existing = selection.offenseActiveOverrides?.find((o) => o.grantKey === grantKey);
        if (existing) return existing;
        const defaultVariant = defaultVariantForOffenseSlot(selection.offenseId, i);
        return {
            grantKey,
            variant: defaultVariant,
            isSpell: !!spec.isSpell,
            castingAttribute: (spec.castingAttribute ?? 'intellect') as CastingAttribute,
            spellResolution: (spec.spellResolution ?? 'spellAttack') as SpellResolution,
        };
    });
}

export function buildPackageGrantSpecs(selection: TowerWizardSelection): PowerGrantSpec[] {
    const defense = getDefensePackage(selection.defenseId);
    const offense = getOffensePackage(selection.offenseId);
    if (!defense || !offense) return [];

    const offenseCtx: OffenseResolveContext = {
        delivery: selection.delivery,
        weakenSave: selection.weakenSave,
    };

    const overrides = initializeOffenseOverrides(selection);
    const baseOffense = offense.resolveGrants(offenseCtx);
    const offenseSpecs = baseOffense.map((spec, i) => {
        const override = overrides.find((o) => o.grantKey === `offense-${i}`);
        return applyOverrideToSpec(spec, override, selection.delivery);
    });

    return [
        defense.grants.passive1,
        def(selection.secondPassiveTemplateId, DEF_RANK),
        defense.grants.activeBuff,
        defense.grants.reaction,
        ...offenseSpecs,
    ];
}

export interface PackageReview {
    defenseRows: Array<ResolvedGrant & { role: string }>;
    offenseRows: Array<PackageReviewRow>;
    packageId: string;
    allOk: boolean;
}

export function buildPackageReview(selection: TowerWizardSelection): PackageReview {
    const defense = getDefensePackage(selection.defenseId);
    const offense = getOffensePackage(selection.offenseId);
    if (!defense || !offense) {
        return { defenseRows: [], offenseRows: [], packageId: '', allOk: false };
    }

    const specs = buildPackageGrantSpecs(selection);

    const defenseRows: Array<ResolvedGrant & { role: string }> = [
        { ...resolveGrant(defense.grants.passive1), role: 'Passive 1' },
        { ...resolveGrant(def(selection.secondPassiveTemplateId, DEF_RANK)), role: 'Passive 2' },
        { ...resolveGrant(defense.grants.activeBuff), role: 'Active Buff' },
        { ...resolveGrant(defense.grants.reaction), role: 'Reaction' },
    ];

    const offenseSpecs = specs.slice(4);
    const overrides = initializeOffenseOverrides(selection);
    const offenseRows: PackageReviewRow[] = offenseSpecs.map((spec, i) => {
        const resolved = resolveGrant(spec);
        const variantOpts = getVariantOptionsForOffenseSlot(selection.offenseId, i);
        return {
            role: `Active ${i + 1}`,
            grantKey: `offense-${i}`,
            displayName: resolved.displayName,
            mechanicalName: resolved.mechanicalName,
            rank: spec.rank,
            spec,
            configurable: variantOpts.length > 0 || resolved.category === 'active',
            variantOptions: variantOpts.map((id) => ({ id, label: VARIANT_LABELS[id] })),
            override: overrides.find((o) => o.grantKey === `offense-${i}`),
        };
    });

    const allRows = [...defenseRows, ...offenseSpecs.map((s) => resolveGrant(s))];
    return {
        defenseRows,
        offenseRows,
        packageId: `${selection.defenseId}__${selection.offenseId}`,
        allOk: allRows.every((r) => r.status === 'ok'),
    };
}

export function packageNeedsDeliveryStep(_offenseId: OffensePackageId): boolean {
    return true;
}

export function packageNeedsWeakenSaveStep(offenseId: OffensePackageId): boolean {
    return offenseId === 'weaken-save';
}
