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
    const sp = specials
        .map((s) => {
            const key = String(s.key ?? '').trim();
            if (!key || key === 'special') return '';
            if (s.value != null) return `${key}(${s.value})`;
            if (s.rank != null) return `${key}(${s.rank})`;
            return key;
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
    'empower-buff-damage',
    'empower-buff-armor',
    'empower-buff-evade',
    'empower-buff-wind',
    'extend-buff-armor',
    'extend-buff-evade',
    'extend-buff-mobility',
]);

const GUIDED_PASSIVE2_WRAPPERS: Record<string, GuidedPassiveWrapper> = {
    'passive-regeneration': {
        playerTitle: 'Regenerate each round',
        powerName: 'Regeneration',
        explanation: 'You regain HP automatically during the fight.',
        whenToUse: 'Choose this when you want steady healing without attacking.',
    },
    'passive-battle-trance': {
        playerTitle: 'Recover while fighting',
        powerName: 'Battle Trance',
        explanation: 'You gain recovery through staying active in battle.',
        whenToUse: 'Choose this when you plan to attack every round.',
    },
    'passive-blood-feast': {
        playerTitle: 'Heal through violence',
        powerName: 'Blood Feast',
        explanation: 'You regain HP by hurting enemies or feeding off combat momentum.',
        whenToUse: 'Choose this when your plan is to stay on the attack.',
    },
    'passive-stillness-recovery': {
        playerTitle: 'Recover stamina',
        powerName: 'Stamina Recovery',
        explanation: 'You regain or preserve stamina during combat.',
        whenToUse: 'Choose this when you need to keep acting without running out of steam.',
    },
    'passive-momentum': {
        playerTitle: 'Build offensive pressure',
        powerName: 'Momentum',
        explanation: 'You become more dangerous as the fight develops.',
        whenToUse: 'Choose this when you want damage to ramp up over several rounds.',
    },
    'passive-killing-intent': {
        playerTitle: 'Punish priority targets',
        powerName: 'Killing Intent',
        explanation: 'You deal better damage when focusing the right enemy.',
        whenToUse: 'Choose this when you plan to focus one target at a time.',
    },
    'passive-evade': {
        playerTitle: 'Dodge attacks more often',
        powerName: 'Evade',
        explanation: 'Enemies miss you more often on their attacks.',
        whenToUse: 'Choose this to add avoidance on top of your main defense.',
    },
    'passive-flowing-step': {
        playerTitle: 'Move and dodge fluidly',
        powerName: 'Flowing Step',
        explanation: 'You combine movement with improved avoidance.',
        whenToUse: 'Choose this for a mobile, hard-to-pin-down fighter.',
    },
    'passive-duelist-footwork': {
        playerTitle: 'Duelist footwork',
        powerName: 'Duelist Footwork',
        explanation: 'You excel at avoiding attacks in one-on-one fights.',
        whenToUse: 'Choose this when you expect to trade blows with single enemies.',
    },
    'passive-evade-temp-hp': {
        playerTitle: 'Dodge and absorb hits',
        powerName: 'Evade / Temporary HP',
        explanation: 'You combine avoidance with a protective HP buffer.',
        whenToUse: 'Choose this when you want both dodging and extra staying power.',
    },
    'passive-evade-healing': {
        playerTitle: 'Dodge and recover',
        powerName: 'Evade / Healing',
        explanation: 'You avoid attacks and regain HP during the fight.',
        whenToUse: 'Choose this for a slippery fighter who also sustains.',
    },
    'passive-damage-reduction': {
        playerTitle: 'Reduce incoming damage',
        powerName: 'Damage Reduction',
        explanation: 'You flatly reduce damage that gets through your defenses.',
        whenToUse: 'Choose this for a premium defensive layer against heavy hitters.',
    },
    'passive-ghostform': {
        playerTitle: 'Phase through limited hits',
        powerName: 'Ghostform',
        explanation: 'You can ignore a limited number of hits each fight.',
        whenToUse: 'Choose this when you want a powerful phasing defense.',
    },
    'passive-temp-hp': {
        playerTitle: 'Gain a protective HP buffer',
        powerName: 'Temporary Hit Points',
        explanation: 'You start fights or rounds with extra HP that absorbs damage first.',
        whenToUse: 'Choose this when you want a cushion before real HP is touched.',
    },
    'passive-deep-vitality': {
        playerTitle: 'Increase maximum health',
        powerName: 'Deep Vitality',
        explanation: 'You have more maximum HP and can take more punishment.',
        whenToUse: 'Choose this when you want raw staying power.',
    },
    'passive-armor-temp-hp': {
        playerTitle: 'Armor and a HP buffer',
        powerName: 'Armor / Temporary HP',
        explanation: 'You combine extra Armor with temporary HP protection.',
        whenToUse: 'Choose this when you want layered physical defense.',
    },
    'passive-armor-health': {
        playerTitle: 'Armor and more health',
        powerName: 'Armor / Health',
        explanation: 'You combine extra Armor with increased maximum HP.',
        whenToUse: 'Choose this for a durable front-line build.',
    },
    'passive-health-healing': {
        playerTitle: 'More health and healing',
        powerName: 'Health / Healing',
        explanation: 'You have more HP and recover during combat.',
        whenToUse: 'Choose this when you want to outlast enemies through sustain.',
    },
    'passive-health-temp-hp': {
        playerTitle: 'More health and a buffer',
        powerName: 'Health / Temporary HP',
        explanation: 'You combine increased HP with temporary HP protection.',
        whenToUse: 'Choose this for maximum raw durability.',
    },
    'extend-buff-damage-reduction': {
        playerTitle: 'Extend damage reduction buff',
        powerName: 'DR Buff Extension',
        explanation: 'Your damage-reduction buff lasts longer when maintained.',
        whenToUse: 'Choose this only if you already use a damage-reduction Active Buff.',
    },
};

export const GUIDED_PASSIVE2_BUCKET_LABELS: Record<
    SecondPassiveBucket,
    { label: string; intentHint?: string; warning?: string }
> = {
    evade: {
        label: 'Add Avoidance',
        intentHint: 'Become harder to hit in addition to your main defense.',
    },
    premium: {
        label: 'Add a Premium Defense',
        intentHint: 'Add a powerful defensive subsystem such as Damage Reduction or Ghostform. These are strong identity choices.',
        warning: 'These are specialized defensive subsystems. Use them deliberately as your second Passive.',
    },
    'health-temp-hp': {
        label: 'Add More HP or a Buffer',
        intentHint: 'Increase your staying power with more Health or a protective HP buffer.',
    },
    sustain: {
        label: 'Add Healing or Combat Recovery',
        intentHint: 'Recover during combat. This can mean healing every round or healing through aggressive play.',
    },
    offense: {
        label: 'Add More Damage',
        intentHint: 'Increase your offensive pressure.',
    },
    advanced: {
        label: 'Advanced / Other',
        intentHint: 'Only choose these if you know exactly why your character needs them.',
    },
};

const PASSIVE2_BUCKET_ORDER: readonly SecondPassiveBucket[] = [
    'evade',
    'premium',
    'health-temp-hp',
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
                playerTitle: 'Mark a priority target',
                powerName: 'Mark',
                explanation: 'Use Mark when you want to focus pressure on one enemy.',
                whenToUse: 'Best when your party can pile onto one target.',
            },
            {
                specialKey: 'expose',
                playerTitle: 'Open an enemy to more damage',
                powerName: 'Expose',
                explanation: 'Use Expose when you want your attacks or your party\'s attacks to punish that target harder.',
                whenToUse: 'Best when you want coordinated burst damage.',
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
                playerTitle: 'Break enemy Armor',
                powerName: 'Corrode',
                explanation: 'Use Corrode against armored enemies or defensive monsters.',
                whenToUse: 'Best against heavily armored foes.',
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
                playerTitle: 'Stop enemies from moving freely',
                powerName: 'Slow',
                explanation: 'Use Slow to stop enemies from reaching allies, escaping, or controlling the battlefield.',
                whenToUse: 'Best when positioning matters.',
            },
            {
                specialKey: 'root',
                playerTitle: 'Hold an enemy in place',
                powerName: 'Root',
                explanation: 'Use Root to stop an enemy from moving at all for a time.',
                whenToUse: 'Best when you need to pin down a key target.',
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
                playerTitle: 'Make enemies bleed out over time',
                powerName: 'Lacerate',
                explanation: 'Use Lacerate when you want steady damage pressure after the hit.',
                whenToUse: 'Best for long fights where damage adds up.',
            },
            {
                specialKey: 'blight',
                playerTitle: 'Poison or corrupt the enemy',
                powerName: 'Blight',
                explanation: 'Use Blight when you want a poisonous or corrupting pressure effect.',
                whenToUse: 'Best when you want damage that keeps ticking.',
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
                playerTitle: 'Curse the enemy',
                powerName: 'Hex',
                explanation: 'Use Hex when you want to weaken an enemy through a curse-like effect.',
                whenToUse: 'Best against tough single targets.',
            },
            {
                specialKey: 'weaken',
                playerTitle: 'Reduce enemy strength',
                powerName: 'Weaken',
                explanation: 'Use Weaken when you want the enemy to hit or act less effectively.',
                whenToUse: 'Best when you need to blunt an enemy\'s offense.',
            },
            {
                specialKey: 'challenge',
                playerTitle: 'Force them to face you',
                powerName: 'Challenge',
                explanation: 'Use Challenge when you want enemies to lose Attack Dice unless they include you as a target.',
                whenToUse: 'Best when you want to punish attacks aimed at your allies.',
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
                playerTitle: 'Push enemies around',
                powerName: 'Push',
                explanation: 'Force enemies into bad positions or away from allies.',
                whenToUse: 'Situational — for battlefield control experts.',
            },
            {
                specialKey: 'pull',
                playerTitle: 'Pull enemies closer',
                powerName: 'Pull',
                explanation: 'Drag enemies where you want them on the battlefield.',
                whenToUse: 'Situational — for battlefield control experts.',
            },
            {
                specialKey: 'disarm',
                playerTitle: 'Disarm enemies',
                powerName: 'Disarm',
                explanation: 'Strip or hinder an enemy\'s weapon.',
                whenToUse: 'Situational — when disarming matters to your concept.',
            },
            {
                specialKey: 'stun',
                playerTitle: 'Stun enemies',
                powerName: 'Stun',
                explanation: 'Briefly stop an enemy from acting effectively.',
                whenToUse: 'Situational — for precise control builds.',
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
    if (GUIDED_PASSIVE2_WRAPPERS[templateId]) return false;
    const bucket = secondPassiveBucketFor(templateId);
    return bucket === 'advanced' || bucket === 'offense';
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
            whenToUse: wrapper.whenToUse,
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
            passives: passives.sort((a, b) => a.label.localeCompare(b.label)),
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
