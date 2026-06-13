/**
 * Tower Wizard — declarative defense/offense package definitions.
 */
import { TOWER_WIZARD_DEFENSIVE_RANK, TOWER_WIZARD_OFFENSIVE_RANK, findCatalogEntry, } from '../../utils/power-catalog.js';
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
const SECOND_PASSIVE_LABELS = {
    'passive-temp-hp': 'Temporary HP',
    'passive-regeneration': 'Regeneration',
    'passive-deep-vitality': 'Health',
    'passive-heightened-senses': 'Awareness',
    'passive-killing-intent': 'Damage',
};
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
        secondPassiveTemplateIds: ['passive-temp-hp', 'passive-regeneration', 'passive-deep-vitality'],
        recommendedSecondPassiveTemplateIds: ['passive-temp-hp', 'passive-regeneration', 'passive-deep-vitality'],
        offenseRecommendations: ['bleeding-push', 'corrode-damage', 'direct-damage'],
    },
    {
        id: 'evade',
        label: 'I want to survive by being hard to hit.',
        explanation: 'You survive through dodging, speed, dueling footwork, misdirection, illusions, or supernatural reflexes. This works especially well with offensive Powers that make enemies easier to hit.',
        grants: {
            passive1: def('passive-evade', DEF_RANK),
            activeBuff: def('ab-evade', DEF_RANK),
            reaction: def('reaction-evade', DEF_RANK),
        },
        secondPassiveTemplateIds: ['passive-heightened-senses', 'passive-temp-hp', 'passive-killing-intent'],
        recommendedSecondPassiveTemplateIds: ['passive-heightened-senses', 'passive-temp-hp', 'passive-killing-intent'],
        offenseRecommendations: ['expose', 'mark', 'freeze'],
    },
    {
        id: 'damage-reduction',
        label: 'I want to reduce incoming damage by percentage.',
        explanation: 'Damage Reduction is powerful, but it is a committed defensive path. If you choose it, your Passive, Active Buff, and Reaction all work together to support Damage Reduction.',
        warning: 'Damage Reduction is not a single bonus. It is a defensive package. The wizard locks this package together so the character works correctly.',
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
        explanation: 'Phasing lets you ignore a limited number of hits per combat. It is very strong, but limited. It only works correctly if the Passive, Active Buff, and Reaction belong together.',
        warning: 'Phasing is not normal damage reduction. It prevents a limited number of hits. Once those uses are gone, you need your other defenses.',
        grants: {
            passive1: def('passive-ghostform', DEF_RANK),
            activeBuff: def('ab-phasing', DEF_RANK),
            reaction: def('reaction-phasing', DEF_RANK),
        },
        secondPassiveTemplateIds: ['passive-evade', 'passive-heightened-senses'],
        recommendedSecondPassiveTemplateIds: ['passive-evade', 'passive-heightened-senses'],
        offenseRecommendations: ['mark', 'hex-spell', 'freeze'],
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
            catalogAvailable: true,
            recommendedForSpellcaster: true,
            resolveGrants: ({ delivery }) => [dmg(delivery, 4, 'ignite'), weapon(delivery)],
        },
        {
            id: 'freeze',
            label: 'I want to slow enemies down.',
            explanation: 'Freeze makes enemies slower and keeps pressure on them. It can stand on its own and is easy to understand.',
            catalogAvailable: true,
            recommendedForSpellcaster: true,
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
            explanation: 'Corrode reduces Armor. It is a setup tool. It becomes useful when you or an ally follow up with meaningful damage.',
            warning: 'Do not choose Corrode alone. Corrode wants a damage follow-up.',
            catalogAvailable: true,
            resolveGrants: ({ delivery }) => [dmg(delivery, 6, 'corrode'), weapon(delivery)],
        },
        {
            id: 'mark',
            label: 'I want my group to focus one important enemy.',
            explanation: 'Mark helps identify and pressure a priority target. It is a simple focus-fire tool.',
            helperText: 'Critical can work well with Mark later, but it requires an offensive Active Buff. That is an advanced build path.',
            catalogAvailable: true,
            resolveGrants: ({ delivery }) => [dmg(delivery, 4, 'mark'), weapon(delivery)],
        },
        {
            id: 'hex-spell',
            label: 'I want to curse enemies so Spells hit harder.',
            explanation: 'Hex supports Spell damage. It is strongest when you or your allies follow up with Spell attacks.',
            warning: 'Hex is weak without Spell follow-up.',
            catalogAvailable: true,
            recommendedForSpellcaster: true,
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
            catalogAvailable: true,
            recommendedForSpellcaster: true,
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
    return TOWER_WIZARD_OFFENSE_PACKAGES.filter((p) => p.catalogAvailable);
}
export function sortOffensePackagesForDefense(defenseId, spellcaster) {
    const defense = getDefensePackage(defenseId);
    const rec = new Set(defense?.offenseRecommendations ?? []);
    const available = getAvailableOffensePackages();
    return [...available].sort((a, b) => {
        const aRec = rec.has(a.id) ? 0 : 1;
        const bRec = rec.has(b.id) ? 0 : 1;
        if (aRec !== bRec)
            return aRec - bRec;
        if (spellcaster) {
            const aSpell = a.recommendedForSpellcaster ? 0 : 1;
            const bSpell = b.recommendedForSpellcaster ? 0 : 1;
            if (aSpell !== bSpell)
                return aSpell - bSpell;
        }
        return a.label.localeCompare(b.label);
    });
}
export function secondPassiveLabel(templateId) {
    return SECOND_PASSIVE_LABELS[templateId] ?? templateId;
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
export function buildPackageGrantSpecs(selection) {
    const defense = getDefensePackage(selection.defenseId);
    const offense = getOffensePackage(selection.offenseId);
    if (!defense || !offense)
        return [];
    const offenseCtx = {
        delivery: selection.delivery,
        weakenSave: selection.weakenSave,
    };
    return [
        defense.grants.passive1,
        def(selection.secondPassiveTemplateId, DEF_RANK),
        defense.grants.activeBuff,
        defense.grants.reaction,
        ...offense.resolveGrants(offenseCtx),
    ];
}
export function buildPackageReview(selection) {
    const defense = getDefensePackage(selection.defenseId);
    const offense = getOffensePackage(selection.offenseId);
    if (!defense || !offense) {
        return { defenseRows: [], offenseRows: [], packageId: '', allOk: false };
    }
    const offenseCtx = {
        delivery: selection.delivery,
        weakenSave: selection.weakenSave,
    };
    const defenseRows = [
        { ...resolveGrant(defense.grants.passive1), role: 'Passive 1' },
        { ...resolveGrant(def(selection.secondPassiveTemplateId, DEF_RANK)), role: 'Passive 2' },
        { ...resolveGrant(defense.grants.activeBuff), role: 'Active Buff' },
        { ...resolveGrant(defense.grants.reaction), role: 'Reaction' },
    ];
    const offenseSpecs = offense.resolveGrants(offenseCtx);
    const offenseRows = offenseSpecs.map((spec, i) => ({
        ...resolveGrant(spec),
        role: `Active ${i + 1}`,
    }));
    const allRows = [...defenseRows, ...offenseRows];
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