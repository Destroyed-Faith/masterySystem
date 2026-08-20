/**
 * Tower Wizard — Guided Mode player-facing copy, wrappers, and offense flow helpers.
 */

import {
    secondPassiveBucketFor,
    isAllowedSecondPassive,
    secondPassiveCardWarning,
    type SecondPassiveBucket,
} from './tower-wizard-passive-categories.js';
import type {
    DefensePackageId,
    DeliveryMode,
    GuidedAttackDelivery,
    GuidedBuildSummary,
    GuidedBuildSummarySlot,
    GuidedDeliveryOption,
    GuidedSpecialFocusCard,
    GuidedSpecialFocusGroup,
    OffenseActivePick,
    SecondPassiveIntentGroup,
    SecondPassiveOption,
    TowerWizardSelection,
} from './tower-wizard-types.js';
import type { PackageReview } from './tower-wizard-packages.js';
import {
    findCatalogEntry,
    getAllCatalogEntries,
    powerIdentityKeyFromEntry,
    type CatalogEntry,
} from '../../utils/power-catalog.js';
import { getEffectById } from '../../utils/special-effects.js';

function capitalizeSpecial(key: string): string {
    if (!key) return key;
    return key.charAt(0).toUpperCase() + key.slice(1);
}

const OFF_RANK = 2;

function offensePickFromEntry(entry: CatalogEntry): OffenseActivePick {
    return {
        pickId: powerIdentityKeyFromEntry(entry),
        templateId: entry.templateId,
        special: entry.chosenSpecial?.key ?? null,
    };
}

function secondPassiveCatalogName(templateId: string): string {
    const entry = findCatalogEntry(templateId);
    return entry?.templateName ?? entry?.name ?? templateId;
}

function catalogMechanicsText(entry: CatalogEntry, rank: number): string {
    const levels = (entry.raw as { levels?: Record<string, {
        effect?: { text?: string; dice?: string };
        specials?: Array<{ key?: string; value?: number; rank?: number; note?: string }>;
    }> })?.levels;
    const row = levels?.[String(rank)];
    if (!row) return '';
    let text = String(row.effect?.text ?? '').replace(/\*\*/g, '').trim();
    const dice = row.effect?.dice ? String(row.effect.dice).trim() : '';
    if (dice && !text.includes(dice)) text = text ? `${text} (${dice})` : dice;
    const specials = Array.isArray(row.specials) ? row.specials : [];
    const chosen = entry.chosenSpecial?.key;
    const sp = specials
        .map((s) => {
            const raw = String(s.key ?? '').trim();
            if (!raw) return '';
            const resolved = raw.toLowerCase() === 'special' ? String(chosen || '').trim() : raw;
            if (!resolved) return '';
            const name = resolved.charAt(0).toUpperCase() + resolved.slice(1);
            if (s.value != null) return `${name} (${s.value})`;
            if (s.rank != null) return `${name} (${s.rank})`;
            return name;
        })
        .filter(Boolean)
        .join(', ');
    if (sp && !text.toLowerCase().includes(sp.toLowerCase())) {
        text = text ? `${text} — ${sp}` : sp;
    }
    return text;
}

interface GuidedPassiveWrapper {
    playerTitle: string;
    explanation: string;
    whenToUse?: string;
    powerName?: string;
}

interface GuidedSpecialWrapper {
    playerTitle: string;
    explanation: string;
    whenToUse: string;
    powerName: string;
    /** Catalog special key (e.g. challenge, weaken). */
    specialKey: string;
}

/** Passives never shown in Guided Passive 2. */
const GUIDED_HIDDEN_PASSIVE2 = new Set([
    'passive-special-aura',
    'passive-heightened-senses',
    'passive-spell-resistance',
    'passive-ward',
    'passive-awareness-evade',
    'passive-awareness-damage',
    'passive-ambusher',
    'passive-bloodlust',
    'passive-executioner',
    'passive-evade-damage',
    'passive-damage-temp-hp',
    'passive-damage-healing',
    'conditional-passive-evade-damage',
    'conditional-passive-damage-temp-hp',
    'conditional-passive-damage-healing',
    'conditional-passive-evade-temp-hp',
    'conditional-passive-evade-healing',
    'conditional-passive-awareness-evade',
    'conditional-passive-awareness-damage',
    'conditional-passive-armor-temp-hp',
    'conditional-passive-armor-health',
    'conditional-passive-health-healing',
    'conditional-passive-health-temp-hp',
    'passive-initiative',
    'passive-echo-armor-value',
    'empower-buff-damage',
    'empower-buff-armor',
    'empower-buff-evade',
    'empower-buff-wind',
    'extend-buff-armor',
    'extend-buff-evade',
    'extend-buff-mobility',
]);

const GUIDED_PASSIVE2_WRAPPERS: Record<string, GuidedPassiveWrapper> = {
    'passive-fortified-frame': {
        playerTitle: 'Armor',
        powerName: 'Armor',
        explanation: 'Permanent Armor.',
    },
    'passive-armor-healing': {
        playerTitle: 'Armor + Healing',
        powerName: 'Armor + Healing',
        explanation: 'Permanent Armor plus start-of-turn Healing.',
    },
    'passive-armor-health': {
        playerTitle: 'Armor + Health',
        powerName: 'Armor + Health',
        explanation: 'Permanent Armor plus extra Health Bars.',
    },
    'passive-armor-temp-hp': {
        playerTitle: 'Armor + Temporary HP',
        powerName: 'Armor + Temporary HP',
        explanation: 'Permanent Armor plus Temporary HP at combat start.',
    },
    'passive-stone-stance': {
        playerTitle: 'Armor (Moved 0 m Last Turn)',
        powerName: 'Armor (Moved 0 m Last Turn)',
        explanation: 'Armor only if you moved 0 m on your last turn.',
    },
    'passive-surrounded-bulwark': {
        playerTitle: 'Armor (Adjacent to 2+ Enemies)',
        powerName: 'Armor (Adjacent to 2+ Enemies)',
        explanation: 'Armor while at least two enemies are adjacent.',
    },
    'passive-regeneration': {
        playerTitle: 'Healing',
        powerName: 'Healing',
        explanation: 'At the start of your turn, heal HP.',
    },
    'passive-battle-trance': {
        playerTitle: 'Healing (Adjacent to Enemy)',
        powerName: 'Healing (Adjacent to Enemy)',
        explanation: 'Start-of-turn Healing while at least one enemy is adjacent.',
    },
    'passive-blood-feast': {
        playerTitle: 'Healing (Wounded or Worse)',
        powerName: 'Healing (Wounded or Worse)',
        explanation: 'Start-of-turn Healing while you are Wounded or worse.',
    },
    'passive-stillness-recovery': {
        playerTitle: 'Healing (Moved 0 m Last Turn)',
        powerName: 'Healing (Moved 0 m Last Turn)',
        explanation: 'Start-of-turn Healing if you moved 0 m on your last turn.',
    },
    'passive-killing-intent': {
        playerTitle: 'Damage',
        powerName: 'Damage',
        explanation: 'Extra Damage on all damage rolls you make.',
    },
    'passive-momentum': {
        playerTitle: 'Damage (Moved 8+ m This Turn)',
        powerName: 'Damage (Moved 8+ m This Turn)',
        explanation: 'Extra Damage after you move at least 8 m this turn.',
    },
    'passive-evade': {
        playerTitle: 'Evade',
        powerName: 'Evade',
        explanation: 'Permanent Evade.',
    },
    'passive-flowing-step': {
        playerTitle: 'Evade (Moved 8+ m This Turn)',
        powerName: 'Evade (Moved 8+ m This Turn)',
        explanation: 'Evade after you move at least 8 m on your turn.',
    },
    'passive-duelist-footwork': {
        playerTitle: 'Evade (Exactly 1 Adjacent Enemy)',
        powerName: 'Evade (Exactly 1 Adjacent Enemy)',
        explanation: 'Evade while exactly one enemy is adjacent.',
    },
    'passive-evade-temp-hp': {
        playerTitle: 'Evade + Temporary HP',
        powerName: 'Evade + Temporary HP',
        explanation: 'Permanent Evade plus Temporary HP at combat start.',
    },
    'passive-evade-healing': {
        playerTitle: 'Evade + Healing',
        powerName: 'Evade + Healing',
        explanation: 'Permanent Evade plus start-of-turn Healing.',
    },
    'passive-damage-reduction': {
        playerTitle: 'Damage Reduction',
        powerName: 'Damage Reduction',
        explanation: 'Percentage reduction on incoming damage.',
    },
    'passive-ghostform': {
        playerTitle: 'Phasing',
        powerName: 'Phasing',
        explanation: 'Ignore a limited number of hits each combat.',
    },
    'passive-parry': {
        playerTitle: 'Parry',
        powerName: 'Parry',
        explanation: 'Spend a Parry pool to strip Attack Dice before they roll.',
    },
    'passive-damage-negation': {
        playerTitle: 'Damage Negation',
        powerName: 'Damage Negation',
        explanation: 'Spend a combat reserve of Damage Dice before damage is rolled.',
    },
    'passive-invisibility': {
        playerTitle: 'Invisibility',
        powerName: 'Invisibility',
        explanation: 'Blocks Normal Combat Awareness and, at higher ranks, chosen Special Senses.',
    },
    'passive-temp-hp': {
        playerTitle: 'Temporary HP',
        powerName: 'Temporary HP',
        explanation: 'Temporary HP at the start of combat, before real Health.',
    },
    'passive-deep-vitality': {
        playerTitle: 'Health',
        powerName: 'Health',
        explanation: 'Extra Health Bars.',
    },
    'passive-health-healing': {
        playerTitle: 'Health + Healing',
        powerName: 'Health + Healing',
        explanation: 'Extra Health Bars plus start-of-turn Healing.',
    },
    'passive-health-temp-hp': {
        playerTitle: 'Health + Temporary HP',
        powerName: 'Health + Temporary HP',
        explanation: 'Extra Health Bars plus Temporary HP at combat start.',
    },
};

export const GUIDED_PASSIVE2_BUCKET_LABELS: Record<
    SecondPassiveBucket,
    { label: string; intentHint?: string; warning?: string }
> = {
    armor: { label: 'Armor' },
    evade: { label: 'Evade' },
    parry: { label: 'Parry' },
    'damage-reduction': { label: 'Damage Reduction' },
    'damage-negation': { label: 'Damage Negation' },
    phasing: { label: 'Phasing' },
    invisibility: { label: 'Invisibility' },
    health: { label: 'Increase Maximum Health' },
    'temporary-hp': { label: 'Temporary HP' },
    sustain: { label: 'Healing' },
    offense: { label: 'Damage' },
    advanced: { label: 'Advanced / Other' },
};

const PASSIVE2_CARD_ORDER: Partial<Record<SecondPassiveBucket, readonly string[]>> = {
    armor: [
        'passive-fortified-frame',
        'passive-armor-healing',
        'passive-armor-health',
        'passive-armor-temp-hp',
        'passive-stone-stance',
        'passive-surrounded-bulwark',
    ],
    sustain: [
        'passive-regeneration',
        'passive-health-healing',
        'passive-evade-healing',
        'passive-battle-trance',
        'passive-blood-feast',
        'passive-stillness-recovery',
    ],
    offense: [
        'passive-killing-intent',
        'passive-momentum',
    ],
};

function sortPassive2Cards(bucket: SecondPassiveBucket, passives: SecondPassiveOption[]): SecondPassiveOption[] {
    const order = PASSIVE2_CARD_ORDER[bucket];
    if (!order) return [...passives].sort((a, b) => a.label.localeCompare(b.label));
    const indexOf = (id: string) => {
        const i = order.indexOf(id);
        return i === -1 ? order.length : i;
    };
    return [...passives].sort((a, b) => indexOf(a.id) - indexOf(b.id) || a.label.localeCompare(b.label));
}

const PASSIVE2_BUCKET_ORDER: readonly SecondPassiveBucket[] = [
    'armor',
    'evade',
    'parry',
    'damage-reduction',
    'damage-negation',
    'phasing',
    'invisibility',
    'health',
    'temporary-hp',
    'sustain',
    'offense',
    'advanced',
];

const SPECIAL_FOCUS_PURPOSE_GROUPS: Array<{
    id: string;
    label: string;
    explanation: string;
    isAdvanced?: boolean;
    specials: GuidedSpecialWrapper[];
}> = [
    {
        id: 'focus-one',
        label: 'Focus one enemy',
        explanation: 'Use this when you want one enemy to become the main target or easier to punish.',
        specials: [
            {
                specialKey: 'mark',
                playerTitle: 'Mark a Priority Target — Mark',
                powerName: 'Mark',
                explanation: 'Focus pressure on one enemy when the party can pile onto that target.',
                whenToUse: '',
            },
            {
                specialKey: 'expose',
                playerTitle: 'Open an Enemy to More Damage — Expose',
                powerName: 'Expose',
                explanation: 'Make the target take more damage so the party can burst it down.',
                whenToUse: '',
            },
        ],
    },
    {
        id: 'break-defenses',
        label: 'Break defenses',
        explanation: 'Use this when enemies are hard to damage because of Armor or defenses.',
        specials: [
            {
                specialKey: 'corrode',
                playerTitle: 'Break Enemy Armor — Corrode',
                powerName: 'Corrode',
                explanation: 'Strip Armor from heavily defended enemies.',
                whenToUse: '',
            },
        ],
    },
    {
        id: 'control-movement',
        label: 'Control movement',
        explanation: 'Use this when you want to control where enemies can go.',
        specials: [
            {
                specialKey: 'slow',
                playerTitle: 'Stop Free Movement — Slow',
                powerName: 'Slow',
                explanation: 'Keep enemies from reaching allies, escaping, or controlling space.',
                whenToUse: '',
            },
            {
                specialKey: 'root',
                playerTitle: 'Hold an Enemy in Place — Root',
                powerName: 'Root',
                explanation: 'Pin a key target so it cannot move.',
                whenToUse: '',
            },
        ],
    },
    {
        id: 'pressure-over-time',
        label: 'Apply pressure over time',
        explanation: 'Use this when you want continuing pressure instead of only one hit.',
        specials: [
            {
                specialKey: 'lacerate',
                playerTitle: 'Bleed Them Out — Lacerate',
                powerName: 'Lacerate',
                explanation: 'Ongoing damage after the hit in longer fights.',
                whenToUse: '',
            },
            {
                specialKey: 'blight',
                playerTitle: 'Poison or Corrupt — Blight',
                powerName: 'Blight',
                explanation: 'Damage that keeps ticking after you hit.',
                whenToUse: '',
            },
        ],
    },
    {
        id: 'weaken-enemies',
        label: 'Weaken enemies',
        explanation: 'Use this when you want enemies to become less effective.',
        specials: [
            {
                specialKey: 'hex',
                playerTitle: 'Curse the Enemy — Hex',
                powerName: 'Hex',
                explanation: 'Weaken a tough single target with a curse.',
                whenToUse: '',
            },
            {
                specialKey: 'weaken',
                playerTitle: 'Reduce Enemy Strength — Weaken',
                powerName: 'Weaken',
                explanation: 'Make the enemy hit or act less effectively.',
                whenToUse: '',
            },
            {
                specialKey: 'challenge',
                playerTitle: 'Force Them to Face You — Challenge',
                powerName: 'Challenge',
                explanation: 'Enemies lose Attack Dice unless they include you as a target.',
                whenToUse: '',
            },
        ],
    },
    {
        id: 'advanced-control',
        label: 'Advanced control',
        explanation: 'These are situational tools. Choose them only if you know exactly why your character needs them.',
        isAdvanced: true,
        specials: [
            {
                specialKey: 'push',
                playerTitle: 'Push Enemies Around — Push',
                powerName: 'Push',
                explanation: 'Force enemies into bad positions or away from allies.',
                whenToUse: '',
            },
            {
                specialKey: 'pull',
                playerTitle: 'Pull Enemies Closer — Pull',
                powerName: 'Pull',
                explanation: 'Drag enemies where you want them.',
                whenToUse: '',
            },
            {
                specialKey: 'disarm',
                playerTitle: 'Disarm Enemies — Disarm',
                powerName: 'Disarm',
                explanation: 'Strip or hinder an enemy\'s weapon.',
                whenToUse: '',
            },
            {
                specialKey: 'stun',
                playerTitle: 'Stun Enemies — Stun',
                powerName: 'Stun',
                explanation: 'Briefly stop an enemy from acting.',
                whenToUse: '',
            },
        ],
    },
];

const ADVANCED_SPECIAL_TEMPLATE_IDS: Record<string, (delivery: DeliveryMode) => string | null> = {
    push: (d) => findCatalogEntry(`active-${d}-control-push-pull`) ? `active-${d}-control-push-pull` : null,
    pull: (d) => findCatalogEntry(`active-${d}-control-push-pull`) ? `active-${d}-control-push-pull` : null,
    disarm: (d) => findCatalogEntry(`active-${d}-control-pull-disarm`) ? `active-${d}-control-pull-disarm` : null,
    stun: (d) => findCatalogEntry(`active-${d}-damage-stunned`) ? `active-${d}-damage-stunned` : null,
};

export const GUIDED_DELIVERY_OPTIONS: GuidedDeliveryOption[] = [
    {
        id: 'melee',
        label: 'Melee',
        explanation: 'You fight in close combat with a weapon, claws, fists, or another close-range attack.',
    },
    {
        id: 'ranged',
        label: 'Ranged',
        explanation: 'You fight at distance. If your axe, blade, bow, spell-shot, or artifact attack is meant to hit enemies far away, choose Ranged.',
    },
    {
        id: 'spell',
        label: 'Spell',
        explanation: 'You attack primarily through spells.',
    },
    {
        id: 'natural',
        label: 'Natural Weapon',
        explanation: 'You attack with claws, bite, horns, tail, or another Echo/natural weapon.',
    },
];

export function isPassiveHiddenFromGuidedPassive2(templateId: string): boolean {
    if (GUIDED_HIDDEN_PASSIVE2.has(templateId)) return true;
    if (templateId.startsWith('conditional-passive-')) return true;
    if (templateId.startsWith('extend-buff-') || templateId.startsWith('empower-buff-')) return true;
    const entry = findCatalogEntry(templateId);
    if (entry?.tags.includes('artifact-only')) return true;
    if (GUIDED_PASSIVE2_WRAPPERS[templateId]) return false;
    const bucket = secondPassiveBucketFor(templateId);
    return bucket === 'advanced';
}

function catalogEntryHasRank(entry: CatalogEntry, rank: number): boolean {
    const levels = (entry.raw as { levels?: Record<string, unknown> })?.levels;
    return !!levels?.[String(rank)];
}

function echoAllowsEntry(entry: CatalogEntry, actorEchoKey?: string | null): boolean {
    if (!entry.requiresEcho?.length) return true;
    const echoKey = (actorEchoKey || '').trim().toLowerCase();
    return !!echoKey && entry.requiresEcho.includes(echoKey);
}

export function wrapGuidedPassive2Card(templateId: string): SecondPassiveOption | null {
    if (isPassiveHiddenFromGuidedPassive2(templateId)) return null;

    const entry = findCatalogEntry(templateId);
    if (!entry) return null;

    const wrapper = GUIDED_PASSIVE2_WRAPPERS[templateId];
    const powerName = wrapper?.powerName ?? secondPassiveCatalogName(templateId);
    const mechanicsPreview = catalogMechanicsText(entry, 4);

    if (wrapper) {
        return {
            id: templateId,
            label: wrapper.playerTitle,
            hint: wrapper.explanation,
            powerName,
            mechanicsPreview,
            warning: secondPassiveCardWarning(templateId),
        };
    }

    const bucket = secondPassiveBucketFor(templateId);
    if (bucket === 'offense' || bucket === 'advanced') return null;

    return {
        id: templateId,
        label: powerName,
        hint: entry.description?.trim() || '',
        powerName,
        mechanicsPreview,
        warning: secondPassiveCardWarning(templateId),
    };
}

export function getGuidedSecondPassiveIntentGroups(
    passive1TemplateId: string,
    actorEchoKey?: string | null,
): SecondPassiveIntentGroup[] {
    const byBucket = new Map<SecondPassiveBucket, SecondPassiveOption[]>();

    for (const entry of getAllCatalogEntries()) {
        if (entry.category !== 'passive') continue;
        if (!findCatalogEntry(entry.templateId)) continue;
        if (!isAllowedSecondPassive(entry.templateId, passive1TemplateId, actorEchoKey)) continue;

        const card = wrapGuidedPassive2Card(entry.templateId);
        if (!card) continue;

        const bucket = secondPassiveBucketFor(entry.templateId);
        const list = byBucket.get(bucket) ?? [];
        if (list.some((p) => p.id === card.id)) continue;
        list.push(card);
        byBucket.set(bucket, list);
    }

    const groups: SecondPassiveIntentGroup[] = [];
    for (const bucket of PASSIVE2_BUCKET_ORDER) {
        const passives = byBucket.get(bucket);
        if (!passives?.length) continue;
        const meta = GUIDED_PASSIVE2_BUCKET_LABELS[bucket];
        groups.push({
            intentLabel: meta.label,
            intentHint: meta.intentHint,
            warning: meta.warning,
            passives: sortPassive2Cards(bucket, passives),
        });
    }
    return groups;
}

export function guidedDeliveryToCombatDelivery(mode: GuidedAttackDelivery): DeliveryMode {
    if (mode === 'ranged' || mode === 'spell') return 'ranged';
    return 'melee';
}

export function resolveGuidedCoreAttackPick(mode: GuidedAttackDelivery): {
    pick: OffenseActivePick;
    delivery: DeliveryMode;
    coreIsSpell: boolean;
} | null {
    const delivery = guidedDeliveryToCombatDelivery(mode);
    let templateId: string;
    let coreIsSpell = false;

    switch (mode) {
        case 'melee':
        case 'natural':
            templateId = 'active-melee-weapon-single';
            break;
        case 'ranged':
            templateId = 'active-ranged-weapon-single';
            break;
        case 'spell':
            templateId = 'active-ranged-weapon-single';
            coreIsSpell = true;
            break;
        default:
            return null;
    }

    const entry = findCatalogEntry(templateId);
    if (!entry || !catalogEntryHasRank(entry, OFF_RANK)) return null;

    return {
        pick: offensePickFromEntry(entry),
        delivery,
        coreIsSpell,
    };
}

function findGuidedSpecialCatalogEntry(
    delivery: DeliveryMode,
    specialKey: string,
    actorEchoKey?: string | null,
): CatalogEntry | null {
    const controlTemplateId = ADVANCED_SPECIAL_TEMPLATE_IDS[specialKey]?.(delivery);
    if (controlTemplateId) {
        const controlEntry = findCatalogEntry(controlTemplateId);
        if (controlEntry && catalogEntryHasRank(controlEntry, OFF_RANK) && echoAllowsEntry(controlEntry, actorEchoKey)) {
            return controlEntry;
        }
    }

    const tiers = [4, 3, 5, 6];
    const templateBases = [
        (t: number) => `active-${delivery}-damage-t${t}`,
        (t: number) => `active-${delivery}-aoe-damage-t${t}`,
    ];

    for (const tier of tiers) {
        for (const makeId of templateBases) {
            const entry = findCatalogEntry(makeId(tier), specialKey);
            if (entry && catalogEntryHasRank(entry, OFF_RANK) && echoAllowsEntry(entry, actorEchoKey)) {
                return entry;
            }
        }
    }
    return null;
}

export function resolveGuidedSpecialPick(
    deliveryMode: GuidedAttackDelivery,
    specialKey: string,
    actorEchoKey?: string | null,
): OffenseActivePick | null {
    const delivery = guidedDeliveryToCombatDelivery(deliveryMode);
    const entry = findGuidedSpecialCatalogEntry(delivery, specialKey, actorEchoKey);
    if (!entry) return null;
    return offensePickFromEntry(entry);
}

export function getGuidedSpecialFocusGroups(
    deliveryMode: GuidedAttackDelivery | undefined,
    actorEchoKey?: string | null,
    selectedPickId?: string,
): GuidedSpecialFocusGroup[] {
    if (!deliveryMode) return [];

    const groups: GuidedSpecialFocusGroup[] = [];
    for (const purpose of SPECIAL_FOCUS_PURPOSE_GROUPS) {
        const cards: GuidedSpecialFocusCard[] = [];
        for (const spec of purpose.specials) {
            const pick = resolveGuidedSpecialPick(deliveryMode, spec.specialKey, actorEchoKey);
            if (!pick) continue;
            const entry = findCatalogEntry(pick.templateId, pick.special ?? undefined);
            cards.push({
                pickId: pick.pickId,
                templateId: pick.templateId,
                special: pick.special ?? null,
                playerTitle: spec.playerTitle,
                explanation: spec.explanation,
                whenToUse: spec.whenToUse,
                powerName: spec.powerName,
                mechanicsPreview: entry ? catalogMechanicsText(entry, OFF_RANK) : '',
                isSelected: selectedPickId === pick.pickId,
            });
        }
        if (!cards.length) continue;
        groups.push({
            purposeId: purpose.id,
            label: purpose.label,
            explanation: purpose.explanation,
            isAdvanced: purpose.isAdvanced,
            cards,
        });
    }
    return groups;
}

export function getDefensiveActiveBuffChoiceBody(defenseId: DefensePackageId): string {
    switch (defenseId) {
        case 'armor':
            return 'Your Buff gives you more Armor.';
        case 'evade':
            return 'Your Buff gives you more Evade.';
        case 'damage-reduction':
            return 'Your Buff improves your damage reduction.';
        case 'phasing':
            return 'Your Buff helps you ignore limited hits.';
        case 'parry':
            return 'Your Buff restores spent Parry during the fight.';
        case 'damage-negation':
            return 'Your Buff adds extra Negation Dice each round.';
        default:
            return 'Your Buff improves your main defense.';
    }
}

function plainLanguagePassive2(templateId: string): string {
    const wrapper = GUIDED_PASSIVE2_WRAPPERS[templateId];
    if (wrapper) return wrapper.explanation;
    const entry = findCatalogEntry(templateId);
    return entry?.description?.trim() || 'extra capability in combat';
}

function plainLanguageBuff(selection: TowerWizardSelection, buffName: string): string {
    if (selection.activeBuffMode === 'defensive') {
        return getDefensiveActiveBuffChoiceBody(selection.defenseId).replace(/^Your Buff /, 'It ');
    }
    if (selection.activeBuffMode === 'offensive') {
        return 'It makes your attacks stronger while it lasts.';
    }
    return 'It helps allies or protects the group while it lasts.';
}

function specialDisplayName(specialKey: string | null | undefined): string {
    if (!specialKey) return 'a tactical effect';
    const effect = getEffectById(specialKey);
    return effect?.name ?? capitalizeSpecial(specialKey);
}

export function buildGuidedBuildSummary(
    selection: TowerWizardSelection,
    review: PackageReview,
): GuidedBuildSummary {
    const passive1Row = review.mainDefensePackageRows.find((r) => r.grantKey === 'passive-1');
    const buffRow = review.mainDefensePackageRows.find((r) => r.grantKey === 'active-buff');
    const reactionRow = review.mainDefensePackageRows.find((r) => r.grantKey === 'reaction');
    const coreRow = review.offenseReviewRows.find((r) => r.grantKey === 'offense-0');
    const specialRow = review.offenseReviewRows.find((r) => r.grantKey === 'offense-1');

    const slots: GuidedBuildSummarySlot[] = [];

    if (passive1Row) {
        slots.push({
            role: 'Main Passive',
            text: `${passive1Row.playerName} is your main defense. It keeps you alive through your chosen defensive package.`,
        });
    }

    if (review.secondPassiveRow) {
        const purpose = plainLanguagePassive2(selection.secondPassiveTemplateId);
        slots.push({
            role: 'Second Passive',
            text: `${review.secondPassiveRow.playerName} adds ${purpose}. This gives your build more staying power or pressure.`,
        });
    }

    if (buffRow) {
        slots.push({
            role: 'Active Buff',
            text: `${buffRow.playerName} is the power you activate when the fight starts or when you need its benefit. ${plainLanguageBuff(selection, buffRow.playerName)}`,
        });
    }

    if (reactionRow) {
        slots.push({
            role: 'Reaction',
            text: `${reactionRow.playerName} is your answer when enemies attack you. Use it when you are hit or need a defensive response.`,
        });
    }

    if (coreRow) {
        slots.push({
            role: 'Core Attack',
            text: `${coreRow.playerName} is your normal damage attack. Use it when you just want to hit something hard.`,
        });
    }

    if (specialRow) {
        const specialLabel = specialDisplayName(specialRow.spec.special);
        slots.push({
            role: 'Special Attack',
            text: `${specialRow.playerName} is your tactical attack. Use it when you want to apply ${specialLabel} and change the fight.`,
        });
    }

    return {
        slots,
        rotationSteps: [
            'Start the fight by activating your Buff.',
            'Use your Core Attack for reliable damage.',
            'Use your Special Attack when the Special matters.',
            'Use your Reaction when attacked.',
            'Your Passives are always active.',
        ],
    };
}

export function assembleGuidedOffensePicks(selection: Partial<TowerWizardSelection>): OffenseActivePick[] | undefined {
    const core = selection.offenseActivePicks?.[0];
    const special = selection.offenseActivePicks?.[1];
    if (core && special) return [core, special];
    return selection.offenseActivePicks;
}
