/**
 * Tower Wizard — declarative defense/offense package definitions.
 */

import type { CastingAttribute, PowerCategory, SpellResolution } from '../../types/item.js';
import {
    TOWER_WIZARD_DEFENSIVE_RANK,
    TOWER_WIZARD_OFFENSIVE_RANK,
    findCatalogEntry,
    getAllCatalogEntries,
    powerIdentityKey,
    powerIdentityKeyFromEntry,
    activeTemplateCanBeSpell,
} from '../../utils/power-catalog.js';
import type { PowerGrantSpec } from '../../utils/power-item-builder.js';
import type { CatalogEntry } from '../../utils/power-catalog.js';
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
    PackageGrantKey,
    PackagePowerOverride,
    ReviewPowerRow,
    SecondPassiveGroup,
    OffenseActiveGroup,
    OffenseActiveOption,
    OffenseActivePattern,
    OffenseActivePick,
    OffenseActiveSpecialGroup,
    OffenseActiveVariantOption,
    DeliveryMode,
    WizardOffensiveActiveBuff,
    WizardOffensiveActiveBuffGroup,
    WizardActiveBuffPreview,
} from './tower-wizard-types.js';

const DEF_RANK = TOWER_WIZARD_DEFENSIVE_RANK;
const OFF_RANK = TOWER_WIZARD_OFFENSIVE_RANK;

export function grantKeyCategory(grantKey: PackageGrantKey): PowerCategory {
    switch (grantKey) {
        case 'passive-1':
        case 'passive-2':
            return 'passive';
        case 'active-buff':
            return 'activeBuff';
        case 'reaction':
            return 'reaction';
        default:
            return 'active';
    }
}

export function grantKeyRank(grantKey: PackageGrantKey): number {
    return grantKey.startsWith('offense-') ? OFF_RANK : DEF_RANK;
}

/** True when a catalog entry is valid for the wizard slot (category + rank). */
export function catalogEntryMatchesGrantKey(entry: CatalogEntry, grantKey: PackageGrantKey): boolean {
    if (entry.category !== grantKeyCategory(grantKey)) return false;
    const rank = grantKeyRank(grantKey);
    const levels = (entry.raw as { levels?: Record<string, unknown> })?.levels;
    return !!levels?.[String(rank)];
}

function findPowerOverride(
    selection: TowerWizardSelection,
    grantKey: PackageGrantKey,
): PackagePowerOverride | undefined {
    return selection.powerOverrides?.find((o) => o.grantKey === grantKey);
}

function applyPackagePowerOverride(defaultSpec: PowerGrantSpec, override?: PackagePowerOverride): PowerGrantSpec {
    if (!override) return sanitizeActiveSpellSpec(defaultSpec);
    return sanitizeActiveSpellSpec({
        templateId: override.templateId,
        rank: defaultSpec.rank,
        special: override.special ?? null,
        isSpell: override.isSpell,
        castingAttribute: override.castingAttribute,
        spellResolution: override.spellResolution,
    });
}

function sanitizeActiveSpellSpec(spec: PowerGrantSpec): PowerGrantSpec {
    if (activeTemplateCanBeSpell(spec.templateId)) return spec;
    return {
        ...spec,
        isSpell: false,
        castingAttribute: undefined,
        spellResolution: undefined,
    };
}

export function packageSpecIdentity(spec: PowerGrantSpec): string {
    return powerIdentityKey({
        templateId: spec.templateId,
        chosenSpecial: spec.special ? { key: spec.special } : null,
    });
}

export function collectPackageIdentityKeys(
    specs: PowerGrantSpec[],
    exceptGrantKey?: PackageGrantKey,
): Set<string> {
    const keys = new Set<string>();
    const grantKeys: PackageGrantKey[] = [
        'passive-1', 'passive-2', 'active-buff', 'reaction', 'offense-0', 'offense-1',
    ];
    specs.forEach((spec, i) => {
        const grantKey = grantKeys[i];
        if (exceptGrantKey && grantKey === exceptGrantKey) return;
        const key = packageSpecIdentity(spec);
        if (key) keys.add(key);
    });
    return keys;
}

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
    const base = dmg(flavour, tier, special);
    if (flavour !== 'ranged') return base;
    return {
        ...base,
        isSpell: true,
        castingAttribute: 'intellect',
        spellResolution: special ? 'saveSpell' : 'spellAttack',
    };
}

const VARIANT_LABELS: Record<OffenseActiveVariant, string> = {
    'weapon-single': 'Single-target attack',
    'weapon-aoe': 'Area attack',
    'weapon-split': 'Split attack',
    'damage-t3': 'Special attack',
    'damage-t4': 'Special attack',
    'damage-t4-spell': 'Spell attack',
};

/** Offense packages hidden from the wizard UI (still in type union for saved data). */
export const WIZARD_HIDDEN_OFFENSE_IDS: OffensePackageId[] = ['ignite', 'weaken-save'];

const SECOND_PASSIVE_LABELS: Record<string, string> = {
    'passive-killing-intent': 'Attack Support',
};

const PASSIVE_SUBFAMILY_LABELS: Record<string, string> = {
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
] as const;

const ACTIVE_SUBFAMILY_LABELS: Record<string, string> = {
    'damage-single': 'Single-Target Special Attacks',
    'damage-aoe': 'Area Special Attacks',
    'weapon-attack': 'Weapon Attacks',
    control: 'Control & Movement',
    'hard-control': 'Hard Control',
    'persistent-zone': 'Zones & Persistent Effects',
    mixed: 'Mixed Effects',
    barrier: 'Barriers',
    illusion: 'Illusion',
};

const ACTIVE_GROUP_ORDER = [
    'damage-single',
    'damage-aoe',
    'weapon-attack',
    'control',
    'hard-control',
    'persistent-zone',
    'mixed',
    'barrier',
    'illusion',
] as const;

function catalogEntryHasRank(entry: CatalogEntry, rank: number): boolean {
    const levels = (entry.raw as { levels?: Record<string, unknown> })?.levels;
    return !!levels?.[String(rank)];
}

function normalizeActiveSubfamily(subfamily: string): string {
    if (subfamily.startsWith('support-')) return 'mixed';
    return subfamily || 'other';
}

function activeCatalogLabel(entry: CatalogEntry): string {
    if (entry.chosenSpecial?.key) return capitalizeSpecial(entry.chosenSpecial.key);
    if (entry.templateName.match(/tier\s*\d/i)) {
        return playerFacingPowerName({ templateId: entry.templateId, rank: OFF_RANK });
    }
    return entry.templateName;
}

function activeCatalogHint(entry: CatalogEntry): string {
    const text = (entry.description || '').trim();
    if (text) return text.length > 120 ? `${text.slice(0, 117)}…` : text;
    return ACTIVE_SUBFAMILY_LABELS[normalizeActiveSubfamily(entry.subfamily)] ?? entry.subfamily;
}

export function offensePickFromEntry(entry: CatalogEntry): OffenseActivePick {
    return {
        pickId: powerIdentityKeyFromEntry(entry),
        templateId: entry.templateId,
        special: entry.chosenSpecial?.key ?? null,
    };
}

const OFFENSE_UTILITY_GROUP_KEY = '__utility__';

function offensePatternKey(templateId: string): string {
    return templateId.replace(/^active-(?:melee|ranged)-/, '');
}

function offenseDeliveryFromTemplateId(templateId: string): DeliveryMode {
    return templateId.includes('active-ranged') ? 'ranged' : 'melee';
}

function offensePatternLabel(entry: CatalogEntry): string {
    return entry.templateName
        .replace(/^Melee\s+/i, '')
        .replace(/^Ranged\s+/i, '')
        .trim();
}

function offensePatternHint(entry: CatalogEntry): string {
    const text = (entry.raw as { fluff?: string })?.fluff?.trim()
        || entry.description?.trim()
        || '';
    if (text) return text.length > 100 ? `${text.slice(0, 97)}…` : text;
    return ACTIVE_SUBFAMILY_LABELS[normalizeActiveSubfamily(entry.subfamily)] ?? entry.subfamily;
}

export function getOffenseActiveSpecialGroups(
    actorEchoKey?: string | null,
    selectedPickIds?: Set<string>,
): OffenseActiveSpecialGroup[] {
    const echoKey = (actorEchoKey || '').trim().toLowerCase();
    const selected = selectedPickIds ?? new Set<string>();

    type PatternBucket = {
        label: string;
        hint: string;
        variants: Map<DeliveryMode, OffenseActiveVariantOption>;
    };

    const bySpecial = new Map<string, { groupLabel: string; patterns: Map<string, PatternBucket> }>();

    for (const entry of getAllCatalogEntries()) {
        if (entry.category !== 'active') continue;
        if (!catalogEntryHasRank(entry, OFF_RANK)) continue;
        if (entry.requiresEcho?.length) {
            if (!echoKey || !entry.requiresEcho.includes(echoKey)) continue;
        }

        const specialKey = entry.chosenSpecial?.key ?? OFFENSE_UTILITY_GROUP_KEY;
        const groupLabel = specialKey === OFFENSE_UTILITY_GROUP_KEY
            ? 'Weapons & Other Actives'
            : capitalizeSpecial(specialKey);

        if (!bySpecial.has(specialKey)) {
            bySpecial.set(specialKey, { groupLabel, patterns: new Map() });
        }
        const group = bySpecial.get(specialKey)!;
        const patternKey = offensePatternKey(entry.templateId);
        if (!group.patterns.has(patternKey)) {
            group.patterns.set(patternKey, {
                label: offensePatternLabel(entry),
                hint: offensePatternHint(entry),
                variants: new Map(),
            });
        }
        const pattern = group.patterns.get(patternKey)!;
        const delivery = offenseDeliveryFromTemplateId(entry.templateId);
        const pick = offensePickFromEntry(entry);
        pattern.variants.set(delivery, {
            pickId: pick.pickId,
            templateId: pick.templateId,
            special: pick.special ?? null,
            delivery,
            deliveryLabel: delivery === 'ranged' ? 'Ranged' : 'Melee',
            isSelected: selected.has(pick.pickId),
        });
    }

    const groups: OffenseActiveSpecialGroup[] = [];
    const keys = [...bySpecial.keys()].sort((a, b) => {
        if (a === OFFENSE_UTILITY_GROUP_KEY) return 1;
        if (b === OFFENSE_UTILITY_GROUP_KEY) return -1;
        return bySpecial.get(a)!.groupLabel.localeCompare(bySpecial.get(b)!.groupLabel);
    });

    for (const specialKey of keys) {
        const bucket = bySpecial.get(specialKey)!;
        const patterns: OffenseActivePattern[] = [];
        for (const [patternId, pattern] of bucket.patterns) {
            const variants = [...pattern.variants.values()].sort((a, b) => {
                if (a.delivery === b.delivery) return 0;
                return a.delivery === 'melee' ? -1 : 1;
            });
            if (!variants.length) continue;
            patterns.push({
                patternId,
                label: pattern.label,
                hint: pattern.hint,
                variants,
            });
        }
        patterns.sort((a, b) => a.label.localeCompare(b.label));
        if (!patterns.length) continue;
        groups.push({
            groupLabel: bucket.groupLabel,
            specialKey: specialKey === OFFENSE_UTILITY_GROUP_KEY ? null : specialKey,
            patterns,
        });
    }

    return groups;
}

/** Flat list grouped by subfamily — kept for tooling; wizard uses special groups. */
export function getOffenseActiveGroups(actorEchoKey?: string | null): OffenseActiveGroup[] {
    const groups = getOffenseActiveSpecialGroups(actorEchoKey);
    return groups.map((g) => ({
        groupLabel: g.groupLabel,
        actives: g.patterns.flatMap((p) =>
            p.variants.map((v) => ({
                pickId: v.pickId,
                templateId: v.templateId,
                special: v.special,
                label: `${p.label} (${v.deliveryLabel})`,
                hint: p.hint,
                isSelected: v.isSelected,
            })),
        ),
    }));
}

export function resolveOffenseActiveSpecs(selection: TowerWizardSelection): PowerGrantSpec[] | null {
    const picks = selection.offenseActivePicks;
    if (!picks || picks.length !== 2) return null;
    return picks.map((pick) => ({
        templateId: pick.templateId,
        rank: OFF_RANK,
        special: pick.special ?? null,
    }));
}

export function selectionUsesCatalogOffense(selection: Partial<TowerWizardSelection>): boolean {
    return (selection.offenseActivePicks?.length ?? 0) === 2;
}

function buildPackageId(selection: TowerWizardSelection): string {
    if (selection.offenseActivePicks?.length === 2) {
        return `${selection.defenseId}__${selection.offenseActivePicks[0].pickId}__${selection.offenseActivePicks[1].pickId}`;
    }
    return `${selection.defenseId}__${selection.offenseId ?? 'unknown'}`;
}

const ACTIVE_BUFF_DURATION_NOTE = 'Lasts for your Mastery Rank in rounds. Costs your Attack action to activate.';

const OFFENSIVE_ACTIVE_BUFF_META: Record<
    string,
    { groupLabel: string; label: string; explanation: string }
> = {
    'ab-damage': {
        groupLabel: 'Raw damage',
        label: 'Flat damage on every attack',
        explanation: 'The simplest offensive buff — your weapon and power hits deal extra damage every time they land.',
    },
    'ab-penetration': {
        groupLabel: 'Armor break',
        label: 'Ignore enemy Armor',
        explanation: 'Best against heavily armored targets. Your attacks treat part of their Armor as gone.',
    },
    'ab-damage-penetration': {
        groupLabel: 'Armor break',
        label: 'Damage and Armor penetration',
        explanation: 'A hybrid buff for sustained pressure — hit harder and punch through Armor at the same time.',
    },
    'ab-critical': {
        groupLabel: 'Critical hits',
        label: 'Critical subsystem',
        explanation: 'Your maintained offensive buff grants Critical(1–4) at milestone ranks. No bonus damage, penetration, or other filler — Critical only.',
    },
    'ab-special-overdrive': {
        groupLabel: 'Special effects',
        label: 'Boost a Special on your attacks',
        explanation: 'Pick a Special you already use (Mark, Bleeding, Freeze, …) and make it hit harder while the buff lasts.',
    },
};

const OFFENSIVE_ACTIVE_BUFF_ORDER = [
    'ab-damage',
    'ab-penetration',
    'ab-damage-penetration',
    'ab-critical',
    'ab-special-overdrive',
] as const;

const OFFENSIVE_BUFF_GROUP_ORDER = ['Raw damage', 'Armor break', 'Critical hits', 'Special effects'] as const;

function stripMarkdown(text: string): string {
    return text.replace(/\*\*/g, '').trim();
}

function activeBuffEffectAtRank(templateId: string, rank: number = DEF_RANK): string {
    const entry = findCatalogEntry(templateId);
    const levels = (entry?.raw as { levels?: Record<string, { effect?: { text?: string } }> })?.levels;
    const row = levels?.[String(rank)];
    const text = row?.effect?.text ?? entry?.description ?? '';
    return stripMarkdown(String(text));
}

export function getDefaultActiveBuffPreview(defenseId: DefensePackageId): WizardActiveBuffPreview | null {
    const defense = getDefensePackage(defenseId);
    if (!defense) return null;
    const spec = defense.grants.activeBuff;
    const resolved = resolveGrant(spec);
    return {
        id: spec.templateId,
        name: playerFacingPowerName(spec, resolved),
        rankPreview: activeBuffEffectAtRank(spec.templateId, DEF_RANK),
        fluff: entryFluff(spec.templateId),
    };
}

function entryFluff(templateId: string): string {
    const entry = findCatalogEntry(templateId);
    return String((entry?.raw as { fluff?: string })?.fluff ?? '');
}

export function getOffensiveActiveBuffOptions(): WizardOffensiveActiveBuff[] {
    return OFFENSIVE_ACTIVE_BUFF_ORDER.filter((id) => {
        const meta = OFFENSIVE_ACTIVE_BUFF_META[id];
        return meta && resolveGrant(def(id, DEF_RANK)).status === 'ok';
    }).map((id) => {
        const meta = OFFENSIVE_ACTIVE_BUFF_META[id]!;
        return {
            id,
            label: meta.label,
            explanation: meta.explanation,
            groupLabel: meta.groupLabel,
            rankPreview: activeBuffEffectAtRank(id, DEF_RANK),
            durationNote: ACTIVE_BUFF_DURATION_NOTE,
        };
    });
}

export function getOffensiveActiveBuffGroups(): WizardOffensiveActiveBuffGroup[] {
    const byGroup = new Map<string, WizardOffensiveActiveBuff[]>();
    for (const buff of getOffensiveActiveBuffOptions()) {
        const list = byGroup.get(buff.groupLabel) ?? [];
        list.push(buff);
        byGroup.set(buff.groupLabel, list);
    }
    const groups: WizardOffensiveActiveBuffGroup[] = [];
    for (const label of OFFENSIVE_BUFF_GROUP_ORDER) {
        const buffs = byGroup.get(label);
        if (buffs?.length) groups.push({ groupLabel: label, buffs });
    }
    for (const [groupLabel, buffs] of byGroup.entries()) {
        if (OFFENSIVE_BUFF_GROUP_ORDER.includes(groupLabel as typeof OFFENSIVE_BUFF_GROUP_ORDER[number])) continue;
        groups.push({ groupLabel, buffs });
    }
    return groups;
}

export function isValidOffensiveActiveBuffId(templateId: string): boolean {
    return getOffensiveActiveBuffOptions().some((b) => b.id === templateId);
}

/** @deprecated use getOffensiveActiveBuffOptions() */
export const WIZARD_OFFENSIVE_ACTIVE_BUFFS = getOffensiveActiveBuffOptions();

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
    return TOWER_WIZARD_OFFENSE_PACKAGES.filter(
        (p) => p.catalogAvailable && !WIZARD_HIDDEN_OFFENSE_IDS.includes(p.id),
    );
}

export function getSecondPassiveGroups(defenseId: DefensePackageId): SecondPassiveGroup[] {
    const defense = getDefensePackage(defenseId);
    if (!defense) return [];

    const excluded = defense.grants.passive1.templateId;
    const bySubfamily = new Map<string, SecondPassiveGroup['passives']>();

    for (const entry of getAllCatalogEntries()) {
        if (entry.category !== 'passive') continue;
        if (entry.templateId === excluded) continue;
        if (!findCatalogEntry(entry.templateId)) continue;

        const subfamily = entry.subfamily ?? 'other';
        const list = bySubfamily.get(subfamily) ?? [];
        if (list.some((p) => p.id === entry.templateId)) continue;

        list.push({
            id: entry.templateId,
            label: secondPassiveLabel(entry.templateId),
            hint: secondPassiveHint(entry.templateId, entry.description),
        });
        bySubfamily.set(subfamily, list);
    }

    const groups: SecondPassiveGroup[] = [];
    for (const subfamily of PASSIVE_GROUP_ORDER) {
        const passives = bySubfamily.get(subfamily);
        if (!passives?.length) continue;
        groups.push({
            groupLabel: PASSIVE_SUBFAMILY_LABELS[subfamily] ?? subfamily,
            passives: passives.sort((a, b) => a.label.localeCompare(b.label)),
        });
    }

    for (const [subfamily, passives] of bySubfamily.entries()) {
        if (PASSIVE_GROUP_ORDER.includes(subfamily as typeof PASSIVE_GROUP_ORDER[number])) continue;
        groups.push({
            groupLabel: PASSIVE_SUBFAMILY_LABELS[subfamily] ?? subfamily,
            passives: passives.sort((a, b) => a.label.localeCompare(b.label)),
        });
    }

    return groups;
}

export function resolveActiveBuffSpec(selection: TowerWizardSelection): PowerGrantSpec {
    const defense = getDefensePackage(selection.defenseId);
    if (!defense) return def('ab-armor', DEF_RANK);
    if (selection.activeBuffMode === 'offensive' && selection.offensiveActiveBuffId) {
        return def(selection.offensiveActiveBuffId, DEF_RANK);
    }
    return defense.grants.activeBuff;
}

function capitalizeSpecial(key: string): string {
    if (!key) return key;
    return key.charAt(0).toUpperCase() + key.slice(1);
}

export function playerFacingPowerName(spec: PowerGrantSpec, resolved?: ResolvedGrant): string {
    if (spec.special) return capitalizeSpecial(spec.special);
    const tid = spec.templateId;
    if (tid.includes('weapon-single')) return 'Weapon Attack';
    if (tid.includes('weapon-aoe')) return 'Area Attack';
    if (tid.includes('weapon-split')) return 'Split Attack';
    if (tid.includes('control-push-pull')) return 'Push / Pull';
    if (spec.isSpell) return 'Spell Attack';
    if (resolved?.displayName && !resolved.displayName.match(/tier\s*\d/i)) {
        return resolved.displayName;
    }
    return resolved?.mechanicalName ?? secondPassiveLabel(spec.templateId);
}

export function playerFacingVariantLabel(
    variant: OffenseActiveVariant,
    baseSpec?: PowerGrantSpec,
): string {
    if (baseSpec?.special && (variant === 'damage-t4' || variant === 'damage-t3')) {
        return capitalizeSpecial(baseSpec.special);
    }
    return VARIANT_LABELS[variant];
}

export function packageNeedsOffensiveBuffStep(selection: Partial<TowerWizardSelection>): boolean {
    return selection.activeBuffMode === 'offensive';
}

export function sortOffensePackagesForDefense(_defenseId: DefensePackageId): TowerWizardOffensePackage[] {
    return [...getAvailableOffensePackages()].sort((a, b) => a.label.localeCompare(b.label));
}

export function secondPassiveLabel(templateId: string): string {
    if (SECOND_PASSIVE_LABELS[templateId]) return SECOND_PASSIVE_LABELS[templateId];
    const entry = findCatalogEntry(templateId);
    return entry?.templateName ?? entry?.name ?? templateId;
}

export function secondPassiveHint(templateId: string, description?: string): string {
    if (description?.trim()) return description.trim();
    const entry = findCatalogEntry(templateId);
    return entry?.description?.trim() ?? '';
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
    return sanitizeActiveSpellSpec(spec);
}

export function initializeOffenseOverrides(selection: TowerWizardSelection): OffenseActiveOverride[] {
    const catalogSpecs = resolveOffenseActiveSpecs(selection);
    if (catalogSpecs) {
        return catalogSpecs.map((spec, i) => {
            const grantKey = `offense-${i}`;
            const existing = selection.offenseActiveOverrides?.find((o) => o.grantKey === grantKey);
            if (existing) return existing;
            return {
                grantKey,
                isSpell: !!spec.isSpell,
                castingAttribute: (spec.castingAttribute ?? 'intellect') as CastingAttribute,
                spellResolution: (spec.spellResolution ?? 'spellAttack') as SpellResolution,
            };
        });
    }

    const offense = getOffensePackage(selection.offenseId!);
    if (!offense) return [];
    const baseSpecs = offense.resolveGrants({
        delivery: selection.delivery,
        weakenSave: selection.weakenSave,
    });
    return baseSpecs.map((spec, i) => {
        const grantKey = `offense-${i}`;
        const existing = selection.offenseActiveOverrides?.find((o) => o.grantKey === grantKey);
        if (existing) return existing;
        const defaultVariant = defaultVariantForOffenseSlot(selection.offenseId!, i);
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
    if (!defense) return [];

    const catalogOffense = resolveOffenseActiveSpecs(selection);
    const offense = catalogOffense ? null : getOffensePackage(selection.offenseId!);
    if (!catalogOffense && !offense) return [];

    const offenseOverrides = initializeOffenseOverrides(selection);
    let offenseSpecs: PowerGrantSpec[];

    if (catalogOffense) {
        offenseSpecs = catalogOffense.map((spec, i) => {
            const grantKey: PackageGrantKey = i === 0 ? 'offense-0' : 'offense-1';
            const catalogOverride = findPowerOverride(selection, grantKey);
            if (catalogOverride) {
                return applyPackagePowerOverride(spec, catalogOverride);
            }
            const override = offenseOverrides.find((o) => o.grantKey === grantKey);
            return applyOverrideToSpec(spec, override, selection.delivery);
        });
    } else {
        const offenseCtx: OffenseResolveContext = {
            delivery: selection.delivery,
            weakenSave: selection.weakenSave,
        };
        const baseOffense = offense!.resolveGrants(offenseCtx);
        offenseSpecs = baseOffense.map((spec, i) => {
            const grantKey: PackageGrantKey = i === 0 ? 'offense-0' : 'offense-1';
            const catalogOverride = findPowerOverride(selection, grantKey);
            if (catalogOverride) {
                return applyPackagePowerOverride(spec, catalogOverride);
            }
            const override = offenseOverrides.find((o) => o.grantKey === grantKey);
            return applyOverrideToSpec(spec, override, selection.delivery);
        });
    }

    const defaults: Array<{ key: PackageGrantKey; spec: PowerGrantSpec }> = [
        { key: 'passive-1', spec: defense.grants.passive1 },
        { key: 'passive-2', spec: def(selection.secondPassiveTemplateId, DEF_RANK) },
        { key: 'active-buff', spec: resolveActiveBuffSpec(selection) },
        { key: 'reaction', spec: defense.grants.reaction },
        { key: 'offense-0', spec: offenseSpecs[0] },
        { key: 'offense-1', spec: offenseSpecs[1] },
    ];

    return defaults.map(({ key, spec }) =>
        applyPackagePowerOverride(spec, findPowerOverride(selection, key)),
    );
}

export interface PackageReview {
    defenseRows: Array<ResolvedGrant & { role: string; playerName?: string }>;
    offenseRows: Array<PackageReviewRow>;
    reviewPowerRows: ReviewPowerRow[];
    packageId: string;
    allOk: boolean;
}

export function buildReviewPowerRows(selection: TowerWizardSelection): ReviewPowerRow[] {
    const specs = buildPackageGrantSpecs(selection);
    const offenseOverrides = initializeOffenseOverrides(selection);
    const roles: Array<{ key: PackageGrantKey; role: string }> = [
        { key: 'passive-1', role: 'Passive 1' },
        { key: 'passive-2', role: 'Passive 2' },
        { key: 'active-buff', role: 'Active Buff' },
        { key: 'reaction', role: 'Reaction' },
        { key: 'offense-0', role: 'Active 1' },
        { key: 'offense-1', role: 'Active 2' },
    ];

    return roles.map(({ key, role }, index) => {
        const spec = specs[index];
        const resolved = resolveGrant(spec);
        const catalogOverride = !!findPowerOverride(selection, key);
        const offenseIndex = key.startsWith('offense-') ? Number(key.replace('offense-', '')) : -1;
        const variantOpts = !catalogOverride && !selectionUsesCatalogOffense(selection) && offenseIndex >= 0
            ? getVariantOptionsForOffenseSlot(selection.offenseId!, offenseIndex)
            : [];
        const catalogOv = findPowerOverride(selection, key);
        const offenseOverride = offenseIndex >= 0
            ? offenseOverrides.find((o) => o.grantKey === key)
            : undefined;
        const canSpell = activeTemplateCanBeSpell(spec.templateId);
        const spellOverride = resolved.category === 'active' && canSpell
            ? (catalogOv
                ? {
                    grantKey: key,
                    isSpell: !!catalogOv.isSpell,
                    castingAttribute: catalogOv.castingAttribute ?? 'intellect',
                    spellResolution: catalogOv.spellResolution ?? 'spellAttack',
                }
                : offenseOverride)
            : undefined;
        return {
            grantKey: key,
            role,
            playerName: playerFacingPowerName(spec, resolved),
            rank: spec.rank,
            category: resolved.category,
            hasCatalogOverride: catalogOverride,
            spec,
            variantOptions: variantOpts.map((id) => ({
                id,
                label: playerFacingVariantLabel(id, spec),
            })),
            override: spellOverride,
            showSpellConfig: resolved.category === 'active' && activeTemplateCanBeSpell(spec.templateId),
        };
    });
}

export function buildPackageReview(selection: TowerWizardSelection): PackageReview {
    const defense = getDefensePackage(selection.defenseId);
    const catalogOffense = resolveOffenseActiveSpecs(selection);
    const offense = catalogOffense ? null : getOffensePackage(selection.offenseId!);
    if (!defense || (!catalogOffense && !offense)) {
        return { defenseRows: [], offenseRows: [], reviewPowerRows: [], packageId: '', allOk: false };
    }

    const specs = buildPackageGrantSpecs(selection);
    const reviewPowerRows = buildReviewPowerRows(selection);

    const defenseRows = reviewPowerRows.slice(0, 4).map((row) => ({
        ...resolveGrant(row.spec),
        role: row.role,
        playerName: row.playerName,
    }));

    const offenseRows: PackageReviewRow[] = reviewPowerRows.slice(4).map((row) => {
        const resolved = resolveGrant(row.spec);
        return {
            role: row.role,
            grantKey: row.grantKey,
            displayName: resolved.displayName,
            playerName: row.playerName,
            mechanicalName: resolved.mechanicalName,
            rank: row.rank,
            spec: row.spec,
            configurable: (row.variantOptions?.length ?? 0) > 0 || resolved.category === 'active',
            variantOptions: row.variantOptions,
            override: row.override,
        };
    });

    const allRows = specs.map((s) => resolveGrant(s));
    return {
        defenseRows,
        offenseRows,
        reviewPowerRows,
        packageId: buildPackageId(selection),
        allOk: allRows.every((r) => r.status === 'ok'),
    };
}

const PACKAGE_GRANT_KEYS: PackageGrantKey[] = [
    'passive-1', 'passive-2', 'active-buff', 'reaction', 'offense-0', 'offense-1',
];

export function isManualBuildMode(selection: Partial<TowerWizardSelection>): boolean {
    return selection.manualBuildMode === true;
}

export function buildPackageGrantSpecsFromOverrides(
    selection: Partial<TowerWizardSelection>,
): PowerGrantSpec[] | null {
    if (!selection.powerOverrides?.length) return null;
    const specs: PowerGrantSpec[] = [];
    for (const key of PACKAGE_GRANT_KEYS) {
        const override = selection.powerOverrides.find((o) => o.grantKey === key);
        if (!override) return null;
        specs.push({
            templateId: override.templateId,
            rank: grantKeyRank(key),
            special: override.special ?? null,
            isSpell: override.isSpell,
            castingAttribute: override.castingAttribute,
            spellResolution: override.spellResolution,
        });
    }
    return specs.map((spec) => sanitizeActiveSpellSpec(spec));
}

export function collectOverrideIdentityKeys(
    overrides: PackagePowerOverride[],
    exceptGrantKey?: PackageGrantKey,
): Set<string> {
    const keys = new Set<string>();
    for (const ov of overrides) {
        if (exceptGrantKey && ov.grantKey === exceptGrantKey) continue;
        const key = powerIdentityKey({
            templateId: ov.templateId,
            chosenSpecial: ov.special ? { key: ov.special } : null,
        });
        if (key) keys.add(key);
    }
    return keys;
}

function emptyGrantSpec(grantKey: PackageGrantKey): PowerGrantSpec {
    return { templateId: '', rank: grantKeyRank(grantKey), special: null };
}

export function buildManualReviewPowerRows(
    selection: Partial<TowerWizardSelection>,
): ReviewPowerRow[] {
    const roles: Array<{ key: PackageGrantKey; role: string }> = [
        { key: 'passive-1', role: 'Passive 1' },
        { key: 'passive-2', role: 'Passive 2' },
        { key: 'active-buff', role: 'Active Buff' },
        { key: 'reaction', role: 'Reaction' },
        { key: 'offense-0', role: 'Active 1' },
        { key: 'offense-1', role: 'Active 2' },
    ];

    return roles.map(({ key, role }) => {
        const override = selection.powerOverrides?.find((o) => o.grantKey === key);
        const spec: PowerGrantSpec = override
            ? {
                templateId: override.templateId,
                rank: grantKeyRank(key),
                special: override.special ?? null,
                isSpell: override.isSpell,
                castingAttribute: override.castingAttribute,
                spellResolution: override.spellResolution,
            }
            : emptyGrantSpec(key);
        const resolved = resolveGrant(spec);
        const canSpell = activeTemplateCanBeSpell(spec.templateId);
        const spellOverride = resolved.category === 'active' && override && canSpell
            ? {
                grantKey: key,
                isSpell: !!override.isSpell,
                castingAttribute: override.castingAttribute ?? 'intellect',
                spellResolution: override.spellResolution ?? 'spellAttack',
            }
            : undefined;
        return {
            grantKey: key,
            role,
            playerName: override && resolved.status === 'ok'
                ? playerFacingPowerName(spec, resolved)
                : 'Choose a power',
            rank: spec.rank,
            category: resolved.category,
            hasCatalogOverride: !!override,
            spec,
            variantOptions: [],
            override: spellOverride,
            showSpellConfig: resolved.category === 'active' && activeTemplateCanBeSpell(spec.templateId),
        };
    });
}

export function buildManualPackageReview(
    selection: Partial<TowerWizardSelection>,
): PackageReview {
    const reviewPowerRows = buildManualReviewPowerRows(selection);
    const specs = buildPackageGrantSpecsFromOverrides(selection);
    const defenseRows = reviewPowerRows.slice(0, 4).map((row) => ({
        ...resolveGrant(row.spec),
        role: row.role,
        playerName: row.playerName,
    }));
    const offenseRows: PackageReviewRow[] = reviewPowerRows.slice(4).map((row) => {
        const resolved = resolveGrant(row.spec);
        return {
            role: row.role,
            grantKey: row.grantKey,
            displayName: resolved.displayName,
            playerName: row.playerName,
            mechanicalName: resolved.mechanicalName,
            rank: row.rank,
            spec: row.spec,
            configurable: resolved.category === 'active',
            variantOptions: [],
            override: row.override,
        };
    });
    const allRows = specs ? specs.map((s) => resolveGrant(s)) : reviewPowerRows.map((r) => resolveGrant(r.spec));
    const packageId = specs
        ? `manual__${specs.map((s) => powerIdentityKey({ templateId: s.templateId, chosenSpecial: s.special ? { key: s.special } : null })).join('__')}`
        : 'manual__incomplete';
    return {
        defenseRows,
        offenseRows,
        reviewPowerRows,
        packageId,
        allOk: !!specs && allRows.every((r) => r.status === 'ok'),
    };
}

export function packageNeedsDeliveryStep(selection: Partial<TowerWizardSelection>): boolean {
    if (isManualBuildMode(selection)) return false;
    if (selectionUsesCatalogOffense(selection)) return false;
    return !!selection.offenseId;
}

export function packageNeedsWeakenSaveStep(selection: Partial<TowerWizardSelection>): boolean {
    if (isManualBuildMode(selection)) return false;
    if (selectionUsesCatalogOffense(selection)) return false;
    return selection.offenseId === 'weaken-save';
}
