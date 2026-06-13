/**
 * Tower Wizard — declarative defense/offense package definitions.
 */
import { TOWER_WIZARD_DEFENSIVE_RANK, TOWER_WIZARD_OFFENSIVE_RANK, findCatalogEntry, getAllCatalogEntries, } from '../../utils/power-catalog.js';
const DEF_RANK = TOWER_WIZARD_DEFENSIVE_RANK;
const OFF_RANK = TOWER_WIZARD_OFFENSIVE_RANK;
function def(templateId, rank, extra = {}) {
    return { templateId, rank, ...extra };
}
function dmg(flavour, tier, special) {
    return def(`active-${flavour}-damage-t${tier}`, OFF_RANK, special ? { special } : {});
}
function weapon(flavour) {
    return def(`active-${flavour}-weapon-single`, OFF_RANK);
}
function weaponAoe(flavour) {
    return def(`active-${flavour}-weapon-aoe`, OFF_RANK);
}
function weaponSplit(flavour) {
    return def(`active-${flavour}-weapon-split`, OFF_RANK);
}
function controlPushPull(flavour) {
    return def(`active-${flavour}-control-push-pull`, OFF_RANK);
}
function spellDamage(flavour, tier, special) {
    return {
        ...dmg(flavour, tier, special),
        isSpell: true,
        castingAttribute: 'intellect',
        spellResolution: special ? 'saveSpell' : 'spellAttack',
    };
}
const VARIANT_LABELS = {
    'weapon-single': 'Single-target attack',
    'weapon-aoe': 'Area attack',
    'weapon-split': 'Split attack',
    'damage-t3': 'Special attack',
    'damage-t4': 'Special attack',
    'damage-t4-spell': 'Spell attack',
};
/** Offense packages hidden from the wizard UI (still in type union for saved data). */
export const WIZARD_HIDDEN_OFFENSE_IDS = ['ignite', 'weaken-save'];
const SECOND_PASSIVE_LABELS = {
    'passive-killing-intent': 'Attack Support',
};
const PASSIVE_SUBFAMILY_LABELS = {
    armor: 'Armor',
    'damage-reduction': 'Damage Reduction',
    evade: 'Evade',
    'temp-hp': 'Temporary HP',
    regen: 'Regeneration',
    phasing: 'Phasing',
    health: 'Health',
    recovery: 'Recovery',
    damage: 'Damage & Offense',
    awareness: 'Awareness',
    combined: 'Combined Passives',
    'conditional-combined': 'Conditional Combined Passives',
    'special-aura': 'Special Aura',
};
const PASSIVE_GROUP_ORDER = [
    'armor',
    'damage-reduction',
    'evade',
    'temp-hp',
    'regen',
    'phasing',
    'health',
    'recovery',
    'damage',
    'awareness',
    'combined',
    'conditional-combined',
    'special-aura',
];
export const WIZARD_OFFENSIVE_ACTIVE_BUFFS = [
    {
        id: 'ab-damage',
        label: 'More damage on every attack',
        explanation: 'Your Active Buff adds flat damage to your attacks while it is active.',
    },
    {
        id: 'ab-penetration',
        label: 'Ignore enemy Armor',
        explanation: 'Your attacks ignore part of the target’s Armor while the buff lasts.',
    },
    {
        id: 'ab-damage-penetration',
        label: 'Damage and Armor penetration',
        explanation: 'Hit harder and punch through Armor at the same time.',
    },
    {
        id: 'ab-critical',
        label: 'More critical hits',
        explanation: 'Your attacks crit more often and crits hit harder.',
    },
];
export const TOWER_WIZARD_DEFENSE_PACKAGES = [
    {
        id: 'armor',
        label: 'I want to reduce incoming hits with armor, guard, or toughness.',
        explanation: 'You are not impossible to hit, but attacks that connect hurt less. This is the simplest and most reliable defensive style.',
        grants: {
            passive1: def('passive-fortified-frame', DEF_RANK),
            activeBuff: def('ab-armor', DEF_RANK),
            reaction: def('reaction-armor', DEF_RANK),
        },
    },
    {
        id: 'evade',
        label: 'I want to survive by being hard to hit.',
        explanation: 'You survive through dodging, speed, and reflexes. Works well with offensive Powers that make enemies easier to hit.',
        grants: {
            passive1: def('passive-evade', DEF_RANK),
            activeBuff: def('ab-evade', DEF_RANK),
            reaction: def('reaction-evade', DEF_RANK),
        },
    },
    {
        id: 'damage-reduction',
        label: 'I want to reduce incoming damage by percentage.',
        explanation: 'Damage Reduction is powerful, but it is a committed defensive path. Your Passive, Active Buff, and Reaction all support it together.',
        warning: 'Damage Reduction is not a single bonus. It is a defensive package. The wizard locks this package together so the character works correctly.',
        grants: {
            passive1: def('passive-damage-reduction', DEF_RANK),
            activeBuff: def('ab-damage-reduction', DEF_RANK),
            reaction: def('reaction-damage-reduction', DEF_RANK),
        },
    },
    {
        id: 'phasing',
        label: 'I want to ignore a few hits completely.',
        explanation: 'Phasing lets you ignore a limited number of hits per combat. It is very strong, but limited.',
        warning: 'Phasing is not normal damage reduction. It prevents a limited number of hits. Once those uses are gone, you need your other defenses.',
        grants: {
            passive1: def('passive-ghostform', DEF_RANK),
            activeBuff: def('ab-phasing', DEF_RANK),
            reaction: def('reaction-phasing', DEF_RANK),
        },
    },
];
function offensePackages() {
    return [
        {
            id: 'bleeding-push',
            label: 'I want to move enemies around and punish movement.',
            explanation: 'Bleeding punishes enemies for moving. Push forces enemies into bad positions. Together they create a simple control plan.',
            warning: 'This package works best when you understand positioning.',
            catalogAvailable: true,
            resolveGrants: ({ delivery }) => [dmg(delivery, 4, 'bleeding'), controlPushPull(delivery)],
        },
        {
            id: 'ignite',
            label: 'I want enemies to burn over time.',
            explanation: 'Ignite is simple and self-contained. You hit the enemy, the enemy burns, and the effect keeps applying pressure.',
            catalogAvailable: false,
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
            catalogAvailable: true,
            resolveGrants: ({ delivery }) => [dmg(delivery, 4, 'expose'), weapon(delivery)],
        },
        {
            id: 'corrode-damage',
            label: 'I want to break armor and then hit hard.',
            explanation: 'Corrode reduces Armor. It is a setup tool. It becomes useful when you follow up with meaningful damage.',
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
            explanation: 'Weaken lowers one Save type. It is strongest when your next Power targets that same Save.',
            warning: 'Weaken needs a follow-up. It is weaker if nobody attacks the Save you weakened.',
            catalogAvailable: false,
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
            explanation: 'This is the simplest offensive option. You hit the enemy and deal damage without extra condition tracking.',
            catalogAvailable: true,
            resolveGrants: ({ delivery }) => [weapon(delivery), weaponAoe(delivery)],
        },
    ];
}
export const TOWER_WIZARD_OFFENSE_PACKAGES = offensePackages();
export function getDefensePackage(id) {
    return TOWER_WIZARD_DEFENSE_PACKAGES.find((p) => p.id === id);
}
export function getOffensePackage(id) {
    return TOWER_WIZARD_OFFENSE_PACKAGES.find((p) => p.id === id);
}
export function getAvailableOffensePackages() {
    return TOWER_WIZARD_OFFENSE_PACKAGES.filter((p) => p.catalogAvailable && !WIZARD_HIDDEN_OFFENSE_IDS.includes(p.id));
}
export function getSecondPassiveGroups(defenseId) {
    const defense = getDefensePackage(defenseId);
    if (!defense)
        return [];
    const excluded = defense.grants.passive1.templateId;
    const bySubfamily = new Map();
    for (const entry of getAllCatalogEntries()) {
        if (entry.category !== 'passive')
            continue;
        if (entry.templateId === excluded)
            continue;
        if (!findCatalogEntry(entry.templateId))
            continue;
        const subfamily = entry.subfamily ?? 'other';
        const list = bySubfamily.get(subfamily) ?? [];
        if (list.some((p) => p.id === entry.templateId))
            continue;
        list.push({
            id: entry.templateId,
            label: secondPassiveLabel(entry.templateId),
            hint: secondPassiveHint(entry.templateId, entry.description),
        });
        bySubfamily.set(subfamily, list);
    }
    const groups = [];
    for (const subfamily of PASSIVE_GROUP_ORDER) {
        const passives = bySubfamily.get(subfamily);
        if (!passives?.length)
            continue;
        groups.push({
            groupLabel: PASSIVE_SUBFAMILY_LABELS[subfamily] ?? subfamily,
            passives: passives.sort((a, b) => a.label.localeCompare(b.label)),
        });
    }
    for (const [subfamily, passives] of bySubfamily.entries()) {
        if (PASSIVE_GROUP_ORDER.includes(subfamily))
            continue;
        groups.push({
            groupLabel: PASSIVE_SUBFAMILY_LABELS[subfamily] ?? subfamily,
            passives: passives.sort((a, b) => a.label.localeCompare(b.label)),
        });
    }
    return groups;
}
export function resolveActiveBuffSpec(selection) {
    const defense = getDefensePackage(selection.defenseId);
    if (!defense)
        return def('ab-armor', DEF_RANK);
    if (selection.activeBuffMode === 'offensive' && selection.offensiveActiveBuffId) {
        return def(selection.offensiveActiveBuffId, DEF_RANK);
    }
    return defense.grants.activeBuff;
}
function capitalizeSpecial(key) {
    if (!key)
        return key;
    return key.charAt(0).toUpperCase() + key.slice(1);
}
export function playerFacingPowerName(spec, resolved) {
    if (spec.special)
        return capitalizeSpecial(spec.special);
    const tid = spec.templateId;
    if (tid.includes('weapon-single'))
        return 'Weapon Attack';
    if (tid.includes('weapon-aoe'))
        return 'Area Attack';
    if (tid.includes('weapon-split'))
        return 'Split Attack';
    if (tid.includes('control-push-pull'))
        return 'Push / Pull';
    if (spec.isSpell)
        return 'Spell Attack';
    if (resolved?.displayName && !resolved.displayName.match(/tier\s*\d/i)) {
        return resolved.displayName;
    }
    return resolved?.mechanicalName ?? secondPassiveLabel(spec.templateId);
}
export function playerFacingVariantLabel(variant, baseSpec) {
    if (baseSpec?.special && (variant === 'damage-t4' || variant === 'damage-t3')) {
        return capitalizeSpecial(baseSpec.special);
    }
    return VARIANT_LABELS[variant];
}
export function packageNeedsOffensiveBuffStep(selection) {
    return selection.activeBuffMode === 'offensive';
}
export function sortOffensePackagesForDefense(_defenseId) {
    return [...getAvailableOffensePackages()].sort((a, b) => a.label.localeCompare(b.label));
}
export function secondPassiveLabel(templateId) {
    if (SECOND_PASSIVE_LABELS[templateId])
        return SECOND_PASSIVE_LABELS[templateId];
    const entry = findCatalogEntry(templateId);
    return entry?.templateName ?? entry?.name ?? templateId;
}
export function secondPassiveHint(templateId, description) {
    if (description?.trim())
        return description.trim();
    const entry = findCatalogEntry(templateId);
    return entry?.description?.trim() ?? '';
}
export function resolveGrant(spec) {
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
export function specFromVariant(delivery, variant) {
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
export function getVariantOptionsForOffenseSlot(offenseId, slotIndex) {
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
export function isOffenseSlotConfigurable(offenseId, slotIndex) {
    return getVariantOptionsForOffenseSlot(offenseId, slotIndex).length > 0;
}
export function defaultVariantForOffenseSlot(offenseId, slotIndex) {
    if (offenseId === 'hex-spell' && slotIndex === 1)
        return 'damage-t4-spell';
    if (offenseId === 'direct-damage') {
        return slotIndex === 0 ? 'weapon-single' : 'weapon-aoe';
    }
    return undefined;
}
function applyOverrideToSpec(base, override, delivery) {
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
    if (override?.castingAttribute)
        spec.castingAttribute = override.castingAttribute;
    if (override?.spellResolution)
        spec.spellResolution = override.spellResolution;
    if (spec.isSpell && !spec.castingAttribute)
        spec.castingAttribute = 'intellect';
    if (spec.isSpell && !spec.spellResolution) {
        spec.spellResolution = base.special ? 'saveSpell' : 'spellAttack';
    }
    return spec;
}
export function initializeOffenseOverrides(selection) {
    const offense = getOffensePackage(selection.offenseId);
    if (!offense)
        return [];
    const baseSpecs = offense.resolveGrants({
        delivery: selection.delivery,
        weakenSave: selection.weakenSave,
    });
    return baseSpecs.map((spec, i) => {
        const grantKey = `offense-${i}`;
        const existing = selection.offenseActiveOverrides?.find((o) => o.grantKey === grantKey);
        if (existing)
            return existing;
        const defaultVariant = defaultVariantForOffenseSlot(selection.offenseId, i);
        return {
            grantKey,
            variant: defaultVariant,
            isSpell: !!spec.isSpell,
            castingAttribute: (spec.castingAttribute ?? 'intellect'),
            spellResolution: (spec.spellResolution ?? 'spellAttack'),
        };
    });
}
export function buildPackageGrantSpecs(selection) {
    const defense = getDefensePackage(selection.defenseId);
    const offense = getOffensePackage(selection.offenseId);
    if (!defense || !offense)
        return [];
    const offenseCtx = {
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
        resolveActiveBuffSpec(selection),
        defense.grants.reaction,
        ...offenseSpecs,
    ];
}
export function buildPackageReview(selection) {
    const defense = getDefensePackage(selection.defenseId);
    const offense = getOffensePackage(selection.offenseId);
    if (!defense || !offense) {
        return { defenseRows: [], offenseRows: [], packageId: '', allOk: false };
    }
    const specs = buildPackageGrantSpecs(selection);
    const defenseRows = [
        { ...resolveGrant(defense.grants.passive1), role: 'Passive 1', playerName: playerFacingPowerName(defense.grants.passive1, resolveGrant(defense.grants.passive1)) },
        {
            ...resolveGrant(def(selection.secondPassiveTemplateId, DEF_RANK)),
            role: 'Passive 2',
            playerName: secondPassiveLabel(selection.secondPassiveTemplateId),
        },
        {
            ...resolveGrant(resolveActiveBuffSpec(selection)),
            role: 'Active Buff',
            playerName: playerFacingPowerName(resolveActiveBuffSpec(selection), resolveGrant(resolveActiveBuffSpec(selection))),
        },
        { ...resolveGrant(defense.grants.reaction), role: 'Reaction', playerName: playerFacingPowerName(defense.grants.reaction, resolveGrant(defense.grants.reaction)) },
    ];
    const offenseSpecs = specs.slice(4);
    const overrides = initializeOffenseOverrides(selection);
    const offenseRows = offenseSpecs.map((spec, i) => {
        const resolved = resolveGrant(spec);
        const variantOpts = getVariantOptionsForOffenseSlot(selection.offenseId, i);
        return {
            role: `Active ${i + 1}`,
            grantKey: `offense-${i}`,
            displayName: resolved.displayName,
            playerName: playerFacingPowerName(spec, resolved),
            mechanicalName: resolved.mechanicalName,
            rank: spec.rank,
            spec,
            configurable: variantOpts.length > 0 || resolved.category === 'active',
            variantOptions: variantOpts.map((id) => ({
                id,
                label: playerFacingVariantLabel(id, spec),
            })),
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
export function packageNeedsDeliveryStep(_offenseId) {
    return true;
}
export function packageNeedsWeakenSaveStep(offenseId) {
    return offenseId === 'weaken-save';
}
//# sourceMappingURL=tower-wizard-packages.js.map