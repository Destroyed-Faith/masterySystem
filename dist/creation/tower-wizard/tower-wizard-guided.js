/**
 * Tower Wizard — Guided Mode player-facing copy, wrappers, and offense flow helpers.
 */
import { isAllowedFirstPassive, isAllowedSecondPassive, secondPassiveCardWarning, } from './tower-wizard-passive-categories.js';
import { passiveWizardChoiceLabel } from './tower-wizard-passive-labels.js';
import { echoRequirementMet, findCatalogEntry, isCanonicalPassiveTemplateId, powerIdentityKeyFromEntry, } from '../../utils/power-catalog.js';
import { PASSIVE_SELECTION_GROUP_LABELS, PASSIVE_SELECTION_GROUP_ORDER, PASSIVE_SELECTION_GROUPS, } from '../../utils/passive-selection-groups.js';
import { getEffectById } from '../../utils/special-effects.js';
function capitalizeSpecial(key) {
    if (!key)
        return key;
    return key.charAt(0).toUpperCase() + key.slice(1);
}
const OFF_RANK = 2;
function offensePickFromEntry(entry) {
    return {
        pickId: powerIdentityKeyFromEntry(entry),
        templateId: entry.templateId,
        special: entry.chosenSpecial?.key ?? null,
    };
}
function secondPassiveCatalogName(templateId) {
    const entry = findCatalogEntry(templateId);
    return entry?.templateName ?? entry?.name ?? templateId;
}
/** Player-facing wizard copy: no em/en Gedankenstriche as separators. */
export function wizardPlayerText(raw) {
    return String(raw || '')
        .replace(/\s*[\u2014]\s*/g, ': ')
        .replace(/\u2013/g, '-')
        .replace(/:\s*:/g, ':')
        .replace(/\s{2,}/g, ' ')
        .trim();
}
function catalogMechanicsText(entry, rank) {
    const levels = entry.raw?.levels;
    const row = levels?.[String(rank)];
    if (!row)
        return '';
    let text = String(row.effect?.text ?? '').replace(/\*\*/g, '').trim();
    const dice = row.effect?.dice ? String(row.effect.dice).trim() : '';
    if (dice && !text.includes(dice))
        text = text ? `${text} (${dice})` : dice;
    const specials = Array.isArray(row.specials) ? row.specials : [];
    const chosen = entry.chosenSpecial?.key;
    const sp = specials
        .map((s) => {
        const raw = String(s.key ?? '').trim();
        if (!raw)
            return '';
        const resolved = raw.toLowerCase() === 'special' ? String(chosen || '').trim() : raw;
        if (!resolved)
            return '';
        const name = resolved.charAt(0).toUpperCase() + resolved.slice(1);
        if (s.value != null)
            return `${name} (${s.value})`;
        if (s.rank != null)
            return `${name} (${s.rank})`;
        return name;
    })
        .filter(Boolean)
        .join(', ');
    if (sp && !text.toLowerCase().includes(sp.toLowerCase())) {
        text = text ? `${text}; ${sp}` : sp;
    }
    return wizardPlayerText(text);
}
/**
 * Passives never shown in Guided Passive 2.
 * Canonical catalogue Passives are NOT listed here — eligibility is category /
 * Echo / slot rules only. Keep retired / artifact-only / conditional IDs.
 */
const GUIDED_HIDDEN_PASSIVE2 = new Set([
    'passive-heightened-senses',
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
    'passive-echo-armor-value',
    'empower-buff-damage',
    'empower-buff-armor',
    'empower-buff-evade',
    'empower-buff-wind',
    'extend-buff-armor',
    'extend-buff-evade',
    'extend-buff-mobility',
]);
/**
 * Short hover explanations for every canonical Combat Package Passive.
 * Titles stay short on the tile; `explanation` is what players need on hover.
 */
const GUIDED_PASSIVE2_WRAPPERS = {
    // Offensive
    'passive-killing-intent': {
        playerTitle: 'Damage',
        powerName: 'Damage',
        explanation: 'Adds bonus damage dice to your damaging Attack and Spell hits. Pure offense: it does not raise Armor, Evade, or HP.',
    },
    'passive-armor-reduction': {
        playerTitle: 'Armor Reduction',
        powerName: 'Armor Reduction',
        explanation: 'On each eligible damaging Attack or Spell you make, ignore part of the target\'s Armor for that hit only. Listed Armor is unchanged; allies do not benefit. Stacks with legal Corrode, Might Stone Armor Reduction, and Weapon Penetration (effective Armor never below 0).',
    },
    'passive-critical': {
        playerTitle: 'Critical',
        powerName: 'Critical',
        explanation: 'Each combat you get free Critical(1) charges. Spend one before an eligible Martial Attack or damaging Spell Casting Roll so 7s and 8s explode in that roll pool. Misses still spend the charge. Separate from Active Buff Critical and Agility Stone Crit.',
    },
    'passive-maximization': {
        playerTitle: 'Maximization',
        powerName: 'Maximization',
        explanation: 'Each combat you get free Maximization uses for Damage or Healing Rolls. Spend one to treat dice as maximum before rolling. Separate from Vitality Stone Maximization.',
    },
    'passive-special-aura': {
        playerTitle: 'Special Aura',
        powerName: 'Special Aura',
        explanation: 'While active, boosts one chosen eligible Special(X) by a fixed step for you (and scales aura radius with level). Offense through Specials, not raw damage dice.',
    },
    'passive-enemy-evade-reduction': {
        playerTitle: 'Enemy Evade Reduction',
        powerName: 'Enemy Evade Reduction',
        explanation: 'Your Martial Attack Rolls treat each target\'s Evade as lower for the roll. Does not change stored Evade or Spell TN.',
    },
    'passive-spell-resistance-piercing': {
        playerTitle: 'Spell Resistance Piercing',
        powerName: 'Spell Resistance Piercing',
        explanation: 'Your Spells ignore part of the target\'s Spell Resistance for that casting. Does not lower listed Spell Resistance permanently.',
    },
    'passive-special-amplification': {
        playerTitle: 'Special Amplification',
        powerName: 'Special Amplification',
        explanation: 'Increases the numeric value of Specials you apply (for example Mark, Expose, Corrode). Does not add Attack or Damage dice by itself.',
    },
    // Defensive
    'passive-fortified-frame': {
        playerTitle: 'Armor',
        powerName: 'Armor',
        explanation: 'Permanent Armor that reduces incoming damage after a hit. Core survivability.',
    },
    'passive-evade': {
        playerTitle: 'Evade',
        powerName: 'Evade',
        explanation: 'Permanent Evade. Attackers must beat a higher TN to hit you with Martial attacks.',
    },
    'passive-damage-reduction': {
        playerTitle: 'Damage Reduction',
        powerName: 'Damage Reduction',
        explanation: 'Percentage reduction on incoming damage after Armor and similar steps.',
    },
    'passive-deep-vitality': {
        playerTitle: 'Health',
        powerName: 'Health',
        explanation: 'Extra Health Bars (more total HP capacity). Does not enlarge each bar; see Fortitude for that.',
    },
    'passive-fortitude': {
        playerTitle: 'Fortitude',
        powerName: 'Fortitude',
        explanation: 'Enlarges each normal Health Bar. Default size is Vitality ×4; Fortitude raises that to ×5 / ×6 / ×7 / ×8 at Power Levels 4 / 8 / 12 / 16. Does not add bars, heal HP, or reopen Scarred bars. Cannot be slotted with Passive: Health.',
    },
    'passive-regeneration': {
        playerTitle: 'Regeneration',
        powerName: 'Regeneration',
        explanation: 'Restore Scarred Health Bars on yourself a few times per Tyhran Day (full HP each). It does not heal ordinary HP mid-fight.',
    },
    'passive-ghostform': {
        playerTitle: 'Phasing',
        powerName: 'Phasing',
        explanation: 'Ignore a limited number of hits each combat (charges refresh per combat, not each round).',
    },
    'passive-spell-resistance': {
        playerTitle: 'Spell Resistance',
        powerName: 'Spell Resistance',
        explanation: 'Raises your Spell Resistance so hostile Spells are harder to land on you.',
    },
    'passive-ward': {
        playerTitle: 'Special Negation',
        powerName: 'Special Negation',
        explanation: 'Reduces or negates numeric Specials applied to you (Ward-style). Distinct from Armor and Evade.',
    },
    'passive-invisibility': {
        playerTitle: 'Invisibility',
        powerName: 'Invisibility',
        explanation: 'Always on: harder to locate and target (Perception TN + bonus), not higher Evade. Blocks Normal Awareness; higher ranks also block chosen Special Senses. AoE still hits.',
    },
    'passive-parry': {
        playerTitle: 'Parry',
        powerName: 'Parry',
        explanation: 'Spend your base Attack Action to enter Parry, then spend a Parry pool to strip Attack or Casting Dice before they resolve.',
    },
    'passive-thornhide': {
        playerTitle: 'Thorns',
        powerName: 'Thorns',
        explanation: 'When you take final HP damage, deal Thorns damage back to the source (capped by the loss). Green Warden Echo only.',
    },
    'passive-damage-negation': {
        playerTitle: 'Damage Negation',
        powerName: 'Damage Negation',
        explanation: 'A combat reserve of Damage Dice you spend after a hit is locked but before damage is rolled, removing dice 1:1.',
    },
    'passive-temp-hp': {
        playerTitle: 'Temporary HP',
        powerName: 'Temporary HP',
        explanation: 'Temporary HP at the start of combat, absorbed before real Health.',
    },
    'passive-self-cleanse': {
        playerTitle: 'Self Cleanse',
        powerName: 'Self Cleanse',
        explanation: 'Lets you clear a negative effect from yourself (Cleanse on self).',
    },
    // Utility
    'passive-telepathy-mind-link': {
        playerTitle: 'Telepathy',
        powerName: 'Telepathy',
        explanation: 'Mind-link style communication and related utility; not a damage or Armor boost.',
    },
    'passive-initiative': {
        playerTitle: 'Initiative',
        powerName: 'Initiative',
        explanation: 'Bonus to Initiative so you act earlier in the round order.',
    },
    'passive-bound-host': {
        playerTitle: 'Summon Tokens',
        powerName: 'Summon Tokens',
        explanation: 'Grants Summon Tokens used to improve Bound Summons.',
    },
    'passive-absorption': {
        playerTitle: 'Absorption',
        powerName: 'Absorption',
        explanation: 'When hostile damage Scars a Health Bar, you gain Temporary Colorless Stones (limited triggers per combat). No extra HP.',
    },
    'passive-speed': {
        playerTitle: 'Speed',
        powerName: 'Speed',
        explanation: 'Increases your movement Speed in meters.',
    },
    // Legacy / conditional titles still referenced elsewhere
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
    'passive-momentum': {
        playerTitle: 'Damage (Moved 8+ m This Turn)',
        powerName: 'Damage (Moved 8+ m This Turn)',
        explanation: 'Extra Damage after you move at least 8 m this turn.',
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
    'passive-health-temp-hp': {
        playerTitle: 'Health + Temporary HP',
        powerName: 'Health + Temporary HP',
        explanation: 'Extra Health Bars plus Temporary HP at combat start.',
    },
};
export const GUIDED_PASSIVE2_BUCKET_LABELS = {
    armor: { label: 'Armor' },
    'armor-reduction': { label: 'Armor Reduction' },
    evade: { label: 'Evade' },
    parry: { label: 'Parry' },
    'damage-reduction': { label: 'Damage Reduction' },
    'damage-negation': { label: 'Damage Negation' },
    phasing: { label: 'Phasing' },
    critical: { label: 'Critical' },
    maximization: { label: 'Maximization' },
    invisibility: { label: 'Invisibility' },
    health: { label: 'Increase Maximum Health' },
    'temporary-hp': { label: 'Temporary HP' },
    'self-cleanse': { label: 'Self Cleanse' },
    speed: { label: 'Speed' },
    'enemy-evade-reduction': { label: 'Enemy Evade Reduction' },
    'spell-resistance-piercing': { label: 'Spell Resistance Piercing' },
    'special-amplification': { label: 'Special Amplification' },
    sustain: { label: 'Regeneration' },
    offense: { label: 'Damage' },
    advanced: { label: 'Advanced / Other' },
};
const PASSIVE2_CARD_ORDER = {
    armor: [
        'passive-fortified-frame',
        'passive-armor-health',
        'passive-armor-temp-hp',
        'passive-stone-stance',
        'passive-surrounded-bulwark',
    ],
    sustain: [
        'passive-regeneration',
    ],
    offense: [
        'passive-killing-intent',
        'passive-momentum',
    ],
};
function sortPassive2Cards(bucket, passives) {
    const order = PASSIVE2_CARD_ORDER[bucket];
    if (!order)
        return [...passives].sort((a, b) => a.label.localeCompare(b.label));
    const indexOf = (id) => {
        const i = order.indexOf(id);
        return i === -1 ? order.length : i;
    };
    return [...passives].sort((a, b) => indexOf(a.id) - indexOf(b.id) || a.label.localeCompare(b.label));
}
const PASSIVE2_BUCKET_ORDER = [
    'armor',
    'armor-reduction',
    'evade',
    'parry',
    'damage-reduction',
    'damage-negation',
    'phasing',
    'critical',
    'maximization',
    'invisibility',
    'health',
    'temporary-hp',
    'self-cleanse',
    'speed',
    'enemy-evade-reduction',
    'spell-resistance-piercing',
    'special-amplification',
    'sustain',
    'offense',
    'advanced',
];
const SPECIAL_FOCUS_PURPOSE_GROUPS = [
    {
        id: 'focus-one',
        label: 'Focus one enemy',
        explanation: 'Specials that make one enemy easier to punish or focus.',
        specials: [
            {
                specialKey: 'mark',
                playerTitle: 'Mark a Priority Target (Mark)',
                powerName: 'Mark',
                explanation: 'Hitters can spend Mark on this target to raise the Damage Floor on that hit.',
                whenToUse: '',
            },
            {
                specialKey: 'expose',
                playerTitle: 'Easier to Hit (Expose)',
                powerName: 'Expose',
                explanation: 'Lowers the target\'s Evade so Martial attacks land more easily. Does not lower Spell Resistance.',
                whenToUse: '',
            },
            {
                specialKey: 'sundered',
                playerTitle: 'More Martial Damage (Sundered)',
                powerName: 'Sundered',
                explanation: 'Non-Spell hits against this target deal bonus damage.',
                whenToUse: '',
                modes: ['martial'],
            },
            {
                specialKey: 'hex',
                playerTitle: 'More Spell Damage (Hex)',
                powerName: 'Hex',
                explanation: 'Spell hits against this target deal bonus damage.',
                whenToUse: '',
                modes: ['spell'],
            },
        ],
    },
    {
        id: 'break-defenses',
        label: 'Break defenses',
        explanation: 'Specials that strip Armor or other hard defenses.',
        specials: [
            {
                specialKey: 'corrode',
                playerTitle: 'Break Enemy Armor (Corrode)',
                powerName: 'Corrode',
                explanation: 'Reduces the target\'s Armor.',
                whenToUse: '',
            },
        ],
    },
    {
        id: 'control-movement',
        label: 'Control movement',
        explanation: 'Specials that slow, pin, or punish movement.',
        specials: [
            {
                specialKey: 'slow',
                playerTitle: 'Reduce Speed (Slow)',
                powerName: 'Slow',
                explanation: 'Reduces the target\'s Speed.',
                whenToUse: '',
            },
            {
                specialKey: 'root',
                playerTitle: 'Hold an Enemy in Place (Root)',
                powerName: 'Root',
                explanation: 'Speed becomes 0 m; the target cannot move voluntarily.',
                whenToUse: '',
            },
            {
                specialKey: 'lacerate',
                playerTitle: 'Punish Movement (Lacerate)',
                powerName: 'Lacerate',
                explanation: 'The target takes damage when it chooses to move.',
                whenToUse: '',
            },
        ],
    },
    {
        id: 'pressure-over-time',
        label: 'Apply pressure over time',
        explanation: 'Specials that keep dealing pressure after the hit.',
        specials: [
            {
                specialKey: 'ruin',
                playerTitle: 'Ongoing Damage (Ruin)',
                powerName: 'Ruin',
                explanation: 'The target takes damage at Tick. Ruin ignores Armor.',
                whenToUse: '',
            },
            {
                specialKey: 'blight',
                playerTitle: 'Poison or Corrupt (Blight)',
                powerName: 'Blight',
                explanation: 'Healing the target receives is reduced, and it takes Stress over time.',
                whenToUse: '',
            },
        ],
    },
    {
        id: 'weaken-enemies',
        label: 'Weaken enemies',
        explanation: 'Specials that make enemies less effective in the fight.',
        specials: [
            {
                specialKey: 'weaken',
                playerTitle: 'Reduce Enemy Strength (Weaken)',
                powerName: 'Weaken',
                explanation: 'The target loses dice from Might, Agility, and Intellect pools.',
                whenToUse: '',
            },
            {
                specialKey: 'challenge',
                playerTitle: 'Force Them to Face You (Challenge)',
                powerName: 'Challenge',
                explanation: 'Enemies lose Attack Dice unless they include you as a target.',
                whenToUse: '',
            },
        ],
    },
    {
        id: 'support-allies',
        label: 'Help allies',
        explanation: 'Support Actives instead of pressuring an enemy.',
        specials: [
            {
                specialKey: 'heal',
                playerTitle: 'Reopen Scarred Health Bars (Restoration)',
                powerName: 'Restoration',
                explanation: 'Restore Scarred Health Bars on one creature (full HP each) from a pool that refreshes at Safe Haven Rest. It does not heal HP.',
                whenToUse: '',
            },
            {
                specialKey: 'cleanse',
                playerTitle: 'Clear a Negative Effect (Cleanse)',
                powerName: 'Cleanse',
                explanation: 'Remove one negative effect from one creature.',
                whenToUse: '',
            },
        ],
    },
    {
        id: 'advanced-control',
        label: 'Advanced control',
        explanation: 'Situational positioning tools.',
        isAdvanced: true,
        specials: [
            {
                specialKey: 'push',
                playerTitle: 'Push Enemies Around (Push)',
                powerName: 'Push',
                explanation: 'Force the target away from you.',
                whenToUse: '',
            },
            {
                specialKey: 'pull',
                playerTitle: 'Pull Enemies Closer (Pull)',
                powerName: 'Pull',
                explanation: 'Pull the target toward you.',
                whenToUse: '',
            },
        ],
    },
];
const DEDICATED_SPECIAL_TEMPLATE_IDS = {
    push: (d) => findCatalogEntry(`active-${d}-control-push-pull`) ? `active-${d}-control-push-pull` : null,
    pull: (d) => findCatalogEntry(`active-${d}-control-push-pull`) ? `active-${d}-control-push-pull` : null,
    // R-05: ordinary single-target Heal is retired; the dedicated support Active is Restoration.
    heal: (d) => findCatalogEntry(`active-${d}-health-level-heal`) ? `active-${d}-health-level-heal` : null,
    cleanse: (d) => findCatalogEntry(`active-${d}-single-cleanse`) ? `active-${d}-single-cleanse` : null,
};
export const GUIDED_DELIVERY_OPTIONS = [
    {
        id: 'martial',
        label: 'Martial',
        explanation: 'You fight with weapons, fists, claws, or other physical attacks (melee or ranged).',
    },
    {
        id: 'spell',
        label: 'Spell',
        explanation: 'You attack primarily through spells.',
    },
];
export function isPassiveHiddenFromGuidedPassive2(templateId) {
    if (!isCanonicalPassiveTemplateId(templateId))
        return true;
    if (GUIDED_HIDDEN_PASSIVE2.has(templateId))
        return true;
    if (templateId.startsWith('conditional-passive-'))
        return true;
    if (templateId.startsWith('extend-buff-') || templateId.startsWith('empower-buff-'))
        return true;
    const entry = findCatalogEntry(templateId);
    if (entry?.tags.includes('artifact-only'))
        return true;
    return false;
}
function catalogEntryHasRank(entry, rank) {
    const levels = entry.raw?.levels;
    return !!levels?.[String(rank)];
}
function echoAllowsEntry(entry, actorEchoKey, actorSubChoiceKey) {
    return echoRequirementMet(entry.requiresEcho, actorEchoKey, actorSubChoiceKey);
}
/** Survivability picks with a Recommended chip on Passive 1 / Passive 2 tiles. */
const WIZARD_RECOMMENDED_SURVIVABILITY = new Set([
    'passive-fortified-frame',
    'passive-evade',
    'passive-damage-reduction',
    'passive-ghostform',
    'passive-temp-hp',
]);
export function wrapGuidedPassiveCard(templateId, opts) {
    if (isPassiveHiddenFromGuidedPassive2(templateId))
        return null;
    const entry = findCatalogEntry(templateId);
    if (!entry)
        return null;
    const wrapper = GUIDED_PASSIVE2_WRAPPERS[templateId];
    const canonicalName = String(entry.name || wrapper?.powerName || secondPassiveCatalogName(templateId)).trim();
    const shortLabel = wizardPlayerText(passiveWizardChoiceLabel(wrapper?.playerTitle || wrapper?.powerName || entry.templateName || canonicalName));
    const mechanicsPreview = catalogMechanicsText(entry, 4);
    const hint = wizardPlayerText(wrapper?.explanation || entry.description?.trim() || mechanicsPreview || canonicalName);
    return {
        id: templateId,
        label: shortLabel,
        hint,
        powerName: wizardPlayerText(canonicalName),
        mechanicsPreview: mechanicsPreview ? `PL 4: ${mechanicsPreview}` : '',
        warning: secondPassiveCardWarning(templateId),
        recommended: opts?.recommended === true,
    };
}
/** @deprecated Use {@link wrapGuidedPassiveCard}. */
export function wrapGuidedPassive2Card(templateId) {
    return wrapGuidedPassiveCard(templateId);
}
/**
 * Shared Passive catalogue provider for Wizard Steps 1 and 2.
 * Step 1: omit `excludeTemplateId`. Step 2: pass Passive 1 as `excludeTemplateId`.
 */
export function getGuidedPassiveSelectionGroups(opts = {}) {
    const { excludeTemplateId, actorEchoKey, actorSubChoiceKey, markRecommended = false, } = opts;
    const groups = [];
    for (const groupId of PASSIVE_SELECTION_GROUP_ORDER) {
        const passives = [];
        for (const templateId of PASSIVE_SELECTION_GROUPS[groupId]) {
            if (excludeTemplateId) {
                if (!isAllowedSecondPassive(templateId, excludeTemplateId, actorEchoKey, actorSubChoiceKey)) {
                    continue;
                }
            }
            else if (!isAllowedFirstPassive(templateId, actorEchoKey, actorSubChoiceKey)) {
                continue;
            }
            const card = wrapGuidedPassiveCard(templateId, {
                recommended: markRecommended && WIZARD_RECOMMENDED_SURVIVABILITY.has(templateId),
            });
            if (!card)
                continue;
            passives.push(card);
        }
        if (!passives.length)
            continue;
        groups.push({
            intentLabel: PASSIVE_SELECTION_GROUP_LABELS[groupId],
            intentHint: undefined,
            warning: undefined,
            passives,
        });
    }
    return groups;
}
export function getGuidedSecondPassiveIntentGroups(passive1TemplateId, actorEchoKey, actorSubChoiceKey) {
    if (!passive1TemplateId)
        return [];
    return getGuidedPassiveSelectionGroups({
        excludeTemplateId: passive1TemplateId,
        actorEchoKey,
        actorSubChoiceKey,
        markRecommended: true,
    });
}
export function getGuidedFirstPassiveIntentGroups(actorEchoKey, actorSubChoiceKey) {
    return getGuidedPassiveSelectionGroups({
        actorEchoKey,
        actorSubChoiceKey,
        markRecommended: true,
    });
}
export function guidedDeliveryToCombatDelivery(mode) {
    // Martial specials resolve against the melee catalog (same Specials as ranged).
    // Spell Core / Specials use the ranged catalog so they can be Cast as Spell.
    if (mode === 'spell' || mode === 'ranged')
        return 'ranged';
    return 'melee';
}
function effectiveSpecialMode(mode) {
    if (mode === 'spell')
        return 'spell';
    return 'martial';
}
function specialAllowedForMode(spec, mode) {
    if (!spec.modes?.length)
        return true;
    return spec.modes.includes(effectiveSpecialMode(mode));
}
export function resolveGuidedCoreAttackPick(mode) {
    const delivery = guidedDeliveryToCombatDelivery(mode);
    let templateId;
    let coreIsSpell = false;
    switch (mode) {
        case 'martial':
        case 'melee':
        case 'natural':
            templateId = 'active-melee-weapon-single';
            break;
        case 'ranged':
            // Legacy guided pick — still a Martial weapon attack.
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
    if (!entry || !catalogEntryHasRank(entry, OFF_RANK))
        return null;
    return {
        pick: offensePickFromEntry(entry),
        delivery,
        coreIsSpell,
    };
}
function findGuidedSpecialCatalogEntry(delivery, specialKey, actorEchoKey) {
    const dedicatedTemplateId = DEDICATED_SPECIAL_TEMPLATE_IDS[specialKey]?.(delivery);
    if (dedicatedTemplateId) {
        const dedicatedEntry = findCatalogEntry(dedicatedTemplateId);
        if (dedicatedEntry && catalogEntryHasRank(dedicatedEntry, OFF_RANK) && echoAllowsEntry(dedicatedEntry, actorEchoKey)) {
            return dedicatedEntry;
        }
    }
    const tiers = [4, 3, 5, 6];
    const templateBases = [
        (t) => `active-${delivery}-damage-t${t}`,
        (t) => `active-${delivery}-aoe-damage-t${t}`,
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
export function resolveGuidedSpecialPick(deliveryMode, specialKey, actorEchoKey) {
    const delivery = guidedDeliveryToCombatDelivery(deliveryMode);
    const entry = findGuidedSpecialCatalogEntry(delivery, specialKey, actorEchoKey);
    if (!entry)
        return null;
    return offensePickFromEntry(entry);
}
export function getGuidedSpecialFocusGroups(deliveryMode, actorEchoKey, selectedPickId) {
    if (!deliveryMode)
        return [];
    const groups = [];
    for (const purpose of SPECIAL_FOCUS_PURPOSE_GROUPS) {
        const cards = [];
        for (const spec of purpose.specials) {
            if (!specialAllowedForMode(spec, deliveryMode))
                continue;
            const pick = resolveGuidedSpecialPick(deliveryMode, spec.specialKey, actorEchoKey);
            if (!pick)
                continue;
            cards.push({
                pickId: pick.pickId,
                templateId: pick.templateId,
                special: pick.special ?? null,
                playerTitle: wizardPlayerText(spec.playerTitle),
                explanation: wizardPlayerText(spec.explanation),
                whenToUse: wizardPlayerText(spec.whenToUse),
                powerName: wizardPlayerText(spec.powerName),
                // Step 4 shows plain-language Special purpose only (no "+Xd8" / "Hex(4)" clutter).
                mechanicsPreview: '',
                isSelected: selectedPickId === pick.pickId,
            });
        }
        if (!cards.length)
            continue;
        groups.push({
            purposeId: purpose.id,
            label: wizardPlayerText(purpose.label),
            explanation: wizardPlayerText(purpose.explanation),
            isAdvanced: purpose.isAdvanced,
            cards,
        });
    }
    return groups;
}
export function getDefensiveActiveBuffChoiceBody(defenseId) {
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
function plainLanguagePassive2(templateId) {
    const wrapper = GUIDED_PASSIVE2_WRAPPERS[templateId];
    if (wrapper)
        return wrapper.explanation;
    const entry = findCatalogEntry(templateId);
    return entry?.description?.trim() || 'extra capability in combat';
}
function plainLanguageBuff(selection, buffName) {
    if (selection.activeBuffMode === 'defensive') {
        return getDefensiveActiveBuffChoiceBody(selection.defenseId).replace(/^Your Buff /, 'It ');
    }
    if (selection.activeBuffMode === 'offensive') {
        return 'It makes your attacks stronger while it lasts.';
    }
    return 'It helps allies or protects the group while it lasts.';
}
function specialDisplayName(specialKey) {
    if (!specialKey)
        return 'a tactical effect';
    const effect = getEffectById(specialKey);
    return effect?.name ?? capitalizeSpecial(specialKey);
}
export function buildGuidedBuildSummary(selection, review) {
    const passive1Row = review.mainDefensePackageRows.find((r) => r.grantKey === 'passive-1');
    const buffRow = review.mainDefensePackageRows.find((r) => r.grantKey === 'active-buff');
    const reactionRow = review.mainDefensePackageRows.find((r) => r.grantKey === 'reaction');
    const coreRow = review.offenseReviewRows.find((r) => r.grantKey === 'offense-0');
    const specialRow = review.offenseReviewRows.find((r) => r.grantKey === 'offense-1');
    const slots = [];
    if (passive1Row) {
        slots.push({
            role: 'First Passive',
            text: `${passive1Row.playerName} is your first Passive. It defines a core part of how your character fights or survives.`,
        });
    }
    if (review.secondPassiveRow) {
        const purpose = plainLanguagePassive2(selection.secondPassiveTemplateId).replace(/\.+$/, '');
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
export function assembleGuidedOffensePicks(selection) {
    const core = selection.offenseActivePicks?.[0];
    const special = selection.offenseActivePicks?.[1];
    if (core && special)
        return [core, special];
    return selection.offenseActivePicks;
}
function pickMatchesGuidedCore(pick, core) {
    return pick.templateId === core.templateId
        && (pick.special ?? null) === (core.special ?? null);
}
/**
 * Guided Core Attack is always slot 0 (Weapon / Spell Single).
 * Repair swaps from the legacy offense picker or a bad restart so Special
 * Focus never permanently occupies the locked Core slot.
 */
export function normalizeGuidedOffensePicks(selection) {
    const picks = selection.offenseActivePicks;
    const delivery = selection.guidedAttackDelivery;
    if (!picks?.length || !delivery || isManualBuildMode(selection))
        return picks;
    const resolved = resolveGuidedCoreAttackPick(delivery);
    if (!resolved)
        return picks;
    const corePick = resolved.pick;
    if (picks.length === 1) {
        return pickMatchesGuidedCore(picks[0], corePick) ? picks : [corePick];
    }
    if (pickMatchesGuidedCore(picks[0], corePick)) {
        return [picks[0], picks[1]];
    }
    if (pickMatchesGuidedCore(picks[1], corePick)) {
        return [picks[1], picks[0]];
    }
    const special = picks.find((p) => !pickMatchesGuidedCore(p, corePick)) ?? picks[1];
    return [corePick, special];
}
function isManualBuildMode(selection) {
    return selection.manualBuildMode === true;
}
//# sourceMappingURL=tower-wizard-guided.js.map