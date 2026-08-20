/**
 * Tower Wizard — declarative defense/offense package definitions.
 */
import { getEffectById } from '../../utils/special-effects.js';
import { TOWER_WIZARD_DEFENSIVE_RANK, TOWER_WIZARD_OFFENSIVE_RANK, findCatalogEntry, getAllCatalogEntries, powerIdentityKey, powerIdentityKeyFromEntry, activeTemplateCanBeSpell, } from '../../utils/power-catalog.js';
import { formatPassiveCategoryList, } from './tower-wizard-passive-categories.js';
import { buildGuidedBuildSummary, getGuidedSecondPassiveIntentGroups, } from './tower-wizard-guided.js';
const DEF_RANK = TOWER_WIZARD_DEFENSIVE_RANK;
const OFF_RANK = TOWER_WIZARD_OFFENSIVE_RANK;
export function grantKeyCategory(grantKey) {
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
export function grantKeyRank(grantKey) {
    return grantKey.startsWith('offense-') ? OFF_RANK : DEF_RANK;
}
/** True when a catalog entry is valid for the wizard slot (category + rank). */
export function catalogEntryMatchesGrantKey(entry, grantKey) {
    if (entry.category !== grantKeyCategory(grantKey))
        return false;
    const rank = grantKeyRank(grantKey);
    const levels = entry.raw?.levels;
    return !!levels?.[String(rank)];
}
function findPowerOverride(selection, grantKey) {
    return selection.powerOverrides?.find((o) => o.grantKey === grantKey);
}
function applyPackagePowerOverride(defaultSpec, override) {
    if (!override)
        return sanitizeActiveSpellSpec(defaultSpec);
    return sanitizeActiveSpellSpec({
        templateId: override.templateId,
        rank: defaultSpec.rank,
        special: override.special ?? null,
        isSpell: override.isSpell,
        castingAttribute: override.castingAttribute,
        spellResolution: override.spellResolution,
    });
}
function sanitizeActiveSpellSpec(spec) {
    if (activeTemplateCanBeSpell(spec.templateId))
        return spec;
    return {
        ...spec,
        isSpell: false,
        castingAttribute: undefined,
        spellResolution: undefined,
    };
}
export function packageSpecIdentity(spec) {
    return powerIdentityKey({
        templateId: spec.templateId,
        chosenSpecial: spec.special ? { key: spec.special } : null,
    });
}
export function collectPackageIdentityKeys(specs, exceptGrantKey) {
    const keys = new Set();
    const grantKeys = [
        'passive-1', 'passive-2', 'active-buff', 'reaction', 'offense-0', 'offense-1',
    ];
    specs.forEach((spec, i) => {
        const grantKey = grantKeys[i];
        if (exceptGrantKey && grantKey === exceptGrantKey)
            return;
        const key = packageSpecIdentity(spec);
        if (key)
            keys.add(key);
    });
    return keys;
}
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
    const base = dmg(flavour, tier, special);
    if (flavour !== 'ranged')
        return base;
    return {
        ...base,
        isSpell: true,
        castingAttribute: 'intellect',
        spellResolution: 'spellAttack',
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
export const WIZARD_HIDDEN_OFFENSE_IDS = ['ruin', 'weaken-save'];
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
    ward: 'Ward',
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
    'ward',
    'combined',
    'conditional-combined',
    'special-aura',
];
const ACTIVE_BUFF_SUBFAMILY_LABELS = {
    'defensive-single': 'Defensive Buffs',
    ward: 'Ward',
    aura: 'Auras',
    recovery: 'Recovery',
    'damage-reduction': 'Damage Reduction',
    phasing: 'Phasing',
    combined: 'Combined Buffs',
    offensive: 'Offensive Buffs',
    'defensive-control': 'Defensive Control',
    'special-overdrive': 'Special Overdrive',
};
const ACTIVE_BUFF_GROUP_ORDER = [
    'defensive-single',
    'ward',
    'aura',
    'damage-reduction',
    'phasing',
    'recovery',
    'combined',
    'defensive-control',
    'offensive',
    'special-overdrive',
];
const REACTION_SUBFAMILY_LABELS = {
    armor: 'Armor',
    evade: 'Evade',
    'temp-hp': 'Temporary HP',
    'damage-reduction': 'Damage Reduction',
    phasing: 'Phasing',
    combined: 'Combined Reactions',
    ally: 'Ally Protection',
    counter: 'Counterattacks',
    'special-increase': 'Special Boost',
};
const REACTION_GROUP_ORDER = [
    'armor',
    'evade',
    'temp-hp',
    'damage-reduction',
    'phasing',
    'combined',
    'ally',
    'counter',
    'special-increase',
];
const CATEGORY_PICKER_LABELS = {
    passive: PASSIVE_SUBFAMILY_LABELS,
    activeBuff: ACTIVE_BUFF_SUBFAMILY_LABELS,
    reaction: REACTION_SUBFAMILY_LABELS,
};
const CATEGORY_PICKER_ORDER = {
    passive: PASSIVE_GROUP_ORDER,
    activeBuff: ACTIVE_BUFF_GROUP_ORDER,
    reaction: REACTION_GROUP_ORDER,
};
const ACTIVE_SUBFAMILY_LABELS = {
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
];
function catalogEntryHasRank(entry, rank) {
    const levels = entry.raw?.levels;
    return !!levels?.[String(rank)];
}
function normalizeActiveSubfamily(subfamily) {
    if (subfamily.startsWith('support-'))
        return 'mixed';
    return subfamily || 'other';
}
function activeCatalogLabel(entry) {
    if (entry.chosenSpecial?.key)
        return capitalizeSpecial(entry.chosenSpecial.key);
    if (entry.templateName.match(/tier\s*\d/i)) {
        return playerFacingPowerName({ templateId: entry.templateId, rank: OFF_RANK });
    }
    return entry.templateName;
}
function activeCatalogHint(entry) {
    const text = (entry.description || '').trim();
    if (text)
        return text.length > 120 ? `${text.slice(0, 117)}…` : text;
    return ACTIVE_SUBFAMILY_LABELS[normalizeActiveSubfamily(entry.subfamily)] ?? entry.subfamily;
}
export function offensePickFromEntry(entry) {
    return {
        pickId: powerIdentityKeyFromEntry(entry),
        templateId: entry.templateId,
        special: entry.chosenSpecial?.key ?? null,
    };
}
const OFFENSE_UTILITY_GROUP_KEY = '__utility__';
const OFFENSE_GROUP_NORMAL = '__normal-attacks__';
const OFFENSE_GROUP_CONTROL = '__control__';
const OFFENSE_GROUP_HEAL = '__heal__';
const OFFENSE_SYNTHETIC_GROUP_LABELS = {
    [OFFENSE_GROUP_NORMAL]: 'Normal Attacks',
    [OFFENSE_GROUP_CONTROL]: 'Control',
    [OFFENSE_GROUP_HEAL]: 'Healing',
    [OFFENSE_UTILITY_GROUP_KEY]: 'Other Actives',
};
const OFFENSE_GROUP_ORDER = [
    OFFENSE_GROUP_NORMAL,
    OFFENSE_GROUP_CONTROL,
    OFFENSE_GROUP_HEAL,
];
const NORMAL_ATTACK_PATTERN_ORDER = ['weapon-single', 'weapon-split', 'weapon-aoe', 'weapon-autofire'];
const HEAL_PATTERN_ORDER = ['single-heal', 'aoe-heal', 'single-cleanse', 'aoe-cleanse', 'heal-cleanse-mixed'];
const CONTROL_PATTERN_ORDER = ['damage-stunned'];
function isNormalWeaponAttack(entry) {
    return /active-(?:melee|ranged)-weapon-(single|aoe|split)$/.test(entry.templateId)
        || entry.templateId === 'active-ranged-weapon-autofire';
}
function isControlActive(entry) {
    return entry.subfamily === 'control' || entry.subfamily === 'hard-control';
}
function isHealSupportActive(entry) {
    if (entry.subfamily === 'support-heal' || entry.subfamily === 'support-cleanse')
        return true;
    return entry.templateId.includes('heal-cleanse-mixed');
}
function offenseCatalogGroupKey(entry) {
    if (isNormalWeaponAttack(entry))
        return OFFENSE_GROUP_NORMAL;
    if (isControlActive(entry))
        return OFFENSE_GROUP_CONTROL;
    if (isHealSupportActive(entry))
        return OFFENSE_GROUP_HEAL;
    if (entry.chosenSpecial?.key)
        return entry.chosenSpecial.key;
    return OFFENSE_UTILITY_GROUP_KEY;
}
function offenseGroupSortIndex(groupKey) {
    const fixed = OFFENSE_GROUP_ORDER.indexOf(groupKey);
    if (fixed >= 0)
        return fixed;
    if (groupKey === OFFENSE_UTILITY_GROUP_KEY)
        return 1000;
    return 100;
}
function offensePatternSortIndex(groupKey, patternId) {
    if (groupKey === OFFENSE_GROUP_NORMAL) {
        const idx = NORMAL_ATTACK_PATTERN_ORDER.indexOf(patternId);
        return idx >= 0 ? idx : 999;
    }
    if (groupKey === OFFENSE_GROUP_HEAL) {
        const idx = HEAL_PATTERN_ORDER.findIndex((key) => patternId.includes(key));
        return idx >= 0 ? idx : 999;
    }
    if (groupKey === OFFENSE_GROUP_CONTROL) {
        const idx = CONTROL_PATTERN_ORDER.findIndex((key) => patternId.includes(key));
        if (idx >= 0)
            return idx;
    }
    return 999;
}
function offensePatternKey(templateId) {
    return templateId.replace(/^active-(?:melee|ranged)-/, '');
}
function offenseDeliveryFromTemplateId(templateId) {
    return templateId.includes('active-ranged') ? 'ranged' : 'melee';
}
function stripTierFromOffenseLabel(label) {
    return label
        .replace(/\s*[—–-]\s*Tier\s*\d+(?:\s*[—–-]\s*Tier\s*\d+)*/gi, '')
        .replace(/\s*Tier\s*\d+/gi, '')
        .trim();
}
function offensePatternLabel(entry) {
    return stripTierFromOffenseLabel(entry.templateName
        .replace(/^Melee\s+/i, '')
        .replace(/^Ranged\s+/i, '')
        .trim());
}
function offenseSpecialGroupTooltip(groupKey, specialKey) {
    if (groupKey === OFFENSE_GROUP_NORMAL) {
        return 'Pure weapon attacks with no Special on hit — Single, Split, and AoE modes.';
    }
    if (groupKey === OFFENSE_GROUP_CONTROL) {
        return 'Positioning, disables, and hard control — push, pull, prone, disarm, stun, and similar effects.';
    }
    if (groupKey === OFFENSE_GROUP_HEAL) {
        return 'Restore hit points and remove afflictions using Heal and Cleanse.';
    }
    if (groupKey === OFFENSE_UTILITY_GROUP_KEY) {
        return 'Barriers, illusion, zones, and other Actives that do not fit the categories above.';
    }
    if (!specialKey) {
        return 'Weapon attacks, barriers, illusion, and other Actives that do not apply a Special condition on hit.';
    }
    const effect = getEffectById(specialKey);
    if (!effect)
        return '';
    const durationNote = effect.duration ? ` Duration: ${effect.duration}.` : '';
    return `${effect.description}${durationNote}`;
}
function offensePatternHint(entry) {
    const text = entry.raw?.fluff?.trim()
        || entry.description?.trim()
        || '';
    if (text)
        return text.length > 100 ? `${text.slice(0, 97)}…` : text;
    return ACTIVE_SUBFAMILY_LABELS[normalizeActiveSubfamily(entry.subfamily)] ?? entry.subfamily;
}
export function getOffenseActiveSpecialGroups(actorEchoKey, selectedPickIds, excludeIdentityKeys) {
    const echoKey = (actorEchoKey || '').trim().toLowerCase();
    const selected = selectedPickIds ?? new Set();
    const excluded = excludeIdentityKeys ?? new Set();
    const bySpecial = new Map();
    for (const entry of getAllCatalogEntries()) {
        if (entry.category !== 'active')
            continue;
        if (!catalogEntryHasRank(entry, OFF_RANK))
            continue;
        if (entry.requiresEcho?.length) {
            if (!echoKey || !entry.requiresEcho.includes(echoKey))
                continue;
        }
        if (excluded.has(powerIdentityKeyFromEntry(entry)))
            continue;
        const groupKey = offenseCatalogGroupKey(entry);
        const groupLabel = OFFENSE_SYNTHETIC_GROUP_LABELS[groupKey]
            ?? capitalizeSpecial(groupKey);
        if (!bySpecial.has(groupKey)) {
            bySpecial.set(groupKey, { groupLabel, patterns: new Map() });
        }
        const group = bySpecial.get(groupKey);
        const patternKey = offensePatternKey(entry.templateId);
        if (!group.patterns.has(patternKey)) {
            group.patterns.set(patternKey, {
                label: offensePatternLabel(entry),
                hint: offensePatternHint(entry),
                variants: new Map(),
            });
        }
        const pattern = group.patterns.get(patternKey);
        const delivery = offenseDeliveryFromTemplateId(entry.templateId);
        const pick = offensePickFromEntry(entry);
        pattern.variants.set(delivery, {
            pickId: pick.pickId,
            templateId: pick.templateId,
            special: pick.special ?? null,
            delivery,
            deliveryLabel: delivery === 'ranged' ? 'Ranged' : 'Melee',
            mechanics: catalogMechanicsText(entry, OFF_RANK),
            isSelected: selected.has(pick.pickId),
        });
    }
    const groups = [];
    const keys = [...bySpecial.keys()].sort((a, b) => {
        const orderDiff = offenseGroupSortIndex(a) - offenseGroupSortIndex(b);
        if (orderDiff !== 0)
            return orderDiff;
        return bySpecial.get(a).groupLabel.localeCompare(bySpecial.get(b).groupLabel);
    });
    for (const groupKey of keys) {
        const bucket = bySpecial.get(groupKey);
        const patterns = [];
        for (const [patternId, pattern] of bucket.patterns) {
            const variants = [...pattern.variants.values()].sort((a, b) => {
                if (a.delivery === b.delivery)
                    return 0;
                return a.delivery === 'melee' ? -1 : 1;
            });
            if (!variants.length)
                continue;
            patterns.push({
                patternId,
                label: pattern.label,
                hint: pattern.hint,
                variants,
            });
        }
        patterns.sort((a, b) => {
            const orderDiff = offensePatternSortIndex(groupKey, a.patternId) - offensePatternSortIndex(groupKey, b.patternId);
            if (orderDiff !== 0)
                return orderDiff;
            return a.label.localeCompare(b.label);
        });
        if (!patterns.length)
            continue;
        const isSyntheticGroup = groupKey.startsWith('__');
        const resolvedSpecialKey = isSyntheticGroup ? null : groupKey;
        const hasSelection = patterns.some((p) => p.variants.some((v) => v.isSelected));
        groups.push({
            groupLabel: bucket.groupLabel,
            specialKey: resolvedSpecialKey,
            groupTooltip: offenseSpecialGroupTooltip(groupKey, resolvedSpecialKey),
            hasSelection,
            patterns,
        });
    }
    return groups;
}
/** Flat list grouped by subfamily — kept for tooling; wizard uses special groups. */
export function getOffenseActiveGroups(actorEchoKey) {
    const groups = getOffenseActiveSpecialGroups(actorEchoKey);
    return groups.map((g) => ({
        groupLabel: g.groupLabel,
        actives: g.patterns.flatMap((p) => p.variants.map((v) => ({
            pickId: v.pickId,
            templateId: v.templateId,
            special: v.special,
            label: `${p.label} (${v.deliveryLabel})`,
            hint: p.hint,
            isSelected: v.isSelected,
        }))),
    }));
}
function prettifySubfamily(key) {
    if (!key)
        return 'Other';
    return key
        .split('-')
        .map((p) => (p.length ? p[0].toUpperCase() + p.slice(1) : p))
        .join(' ');
}
function categoryCardHint(entry) {
    const text = (entry.description?.trim() || entry.raw?.fluff?.trim() || '');
    if (!text)
        return '';
    return text.length > 120 ? `${text.slice(0, 117)}…` : text;
}
/** Rank-specific mechanical effect text for a catalog entry (hover tooltip). */
export function catalogMechanicsText(entry, rank) {
    const levels = entry.raw?.levels;
    const row = levels?.[String(rank)];
    if (!row)
        return '';
    let text = String(row.effect?.text ?? '').replace(/\*\*/g, '').trim();
    const dice = row.effect?.dice ? String(row.effect.dice).trim() : '';
    if (dice && !text.includes(dice))
        text = text ? `${text} (${dice})` : dice;
    const specials = Array.isArray(row.specials) ? row.specials : [];
    const sp = specials
        .map((s) => {
        const key = String(s.key ?? '').trim();
        const chosen = entry.chosenSpecial?.key;
        if (!key)
            return '';
        const resolved = key.toLowerCase() === 'special'
            ? String(chosen || '').trim()
            : key;
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
    if (sp)
        text = text ? `${text} — ${sp}` : sp;
    return text;
}
/**
 * Build collapsible, subfamily-grouped power cards for the Change-Power picker
 * (non-active slots: passive, activeBuff, reaction). Active slots use
 * getOffenseActiveSpecialGroups instead.
 */
export function getCatalogSubfamily(templateId, special) {
    const entry = findCatalogEntry(templateId, special ?? null);
    return entry?.subfamily ?? null;
}
export function getCategoryPickerGroups(category, rank, options) {
    const excluded = options?.excludeIdentityKeys ?? new Set();
    const excludedSubfamilies = options?.excludeSubfamilies ?? new Set();
    const selected = options?.selectedIdentityKeys ?? new Set();
    const echoKey = (options?.actorEchoKey || '').trim().toLowerCase();
    const labels = CATEGORY_PICKER_LABELS[category] ?? {};
    const order = CATEGORY_PICKER_ORDER[category] ?? [];
    const bySubfamily = new Map();
    const seen = new Set();
    for (const entry of getAllCatalogEntries()) {
        if (entry.category !== category)
            continue;
        if (!catalogEntryHasRank(entry, rank))
            continue;
        if (entry.requiresEcho?.length) {
            if (!echoKey || !entry.requiresEcho.includes(echoKey))
                continue;
        }
        if (entry.subfamily && excludedSubfamilies.has(entry.subfamily))
            continue;
        const identityKey = powerIdentityKeyFromEntry(entry);
        if (excluded.has(identityKey))
            continue;
        if (seen.has(identityKey))
            continue;
        seen.add(identityKey);
        const subfamily = entry.subfamily || 'other';
        const list = bySubfamily.get(subfamily) ?? [];
        list.push({
            templateId: entry.templateId,
            special: entry.chosenSpecial?.key ?? null,
            label: entry.templateName || entry.name,
            hint: categoryCardHint(entry),
            mechanics: catalogMechanicsText(entry, rank),
            identityKey,
            isSelected: selected.has(identityKey),
        });
        bySubfamily.set(subfamily, list);
    }
    const sortKeys = (keys) => {
        const ordered = order.filter((k) => bySubfamily.has(k));
        const rest = keys.filter((k) => !order.includes(k)).sort();
        return [...ordered, ...rest];
    };
    const groups = [];
    for (const subfamily of sortKeys([...bySubfamily.keys()])) {
        const cards = bySubfamily.get(subfamily).sort((a, b) => a.label.localeCompare(b.label));
        groups.push({
            groupLabel: labels[subfamily] ?? prettifySubfamily(subfamily),
            hasSelection: cards.some((c) => c.isSelected),
            cards,
        });
    }
    return groups;
}
export function resolveOffenseActiveSpecs(selection) {
    const picks = selection.offenseActivePicks;
    if (!picks || picks.length !== 2)
        return null;
    return picks.map((pick) => ({
        templateId: pick.templateId,
        rank: OFF_RANK,
        special: pick.special ?? null,
    }));
}
export function selectionUsesGuidedOffenseFlow(selection) {
    return !isManualBuildMode(selection);
}
export function selectionUsesCatalogOffense(selection) {
    return (selection.offenseActivePicks?.length ?? 0) === 2;
}
function buildPackageId(selection) {
    if (selection.offenseActivePicks?.length === 2) {
        return `${selection.defenseId}__${selection.offenseActivePicks[0].pickId}__${selection.offenseActivePicks[1].pickId}`;
    }
    return `${selection.defenseId}__${selection.offenseId ?? 'unknown'}`;
}
const ACTIVE_BUFF_DURATION_NOTE = 'Lasts for your Mastery Rank in rounds. Costs your Attack action to activate.';
const OFFENSIVE_ACTIVE_BUFF_META = {
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
        explanation: 'Pick a Special you already use (Mark, Lacerate, Slow, …) and make it hit harder while the buff lasts.',
    },
};
const OFFENSIVE_ACTIVE_BUFF_ORDER = [
    'ab-damage',
    'ab-penetration',
    'ab-damage-penetration',
    'ab-critical',
    'ab-special-overdrive',
];
const OFFENSIVE_BUFF_GROUP_ORDER = ['Raw damage', 'Armor break', 'Critical hits', 'Special effects'];
function stripMarkdown(text) {
    return text.replace(/\*\*/g, '').trim();
}
function activeBuffEffectAtRank(templateId, rank = DEF_RANK) {
    const entry = findCatalogEntry(templateId);
    const levels = entry?.raw?.levels;
    const row = levels?.[String(rank)];
    const text = row?.effect?.text ?? entry?.description ?? '';
    return stripMarkdown(String(text));
}
export function getDefaultActiveBuffPreview(defenseId) {
    const defense = getDefensePackage(defenseId);
    if (!defense)
        return null;
    const spec = defense.grants.activeBuff;
    const resolved = resolveGrant(spec);
    return {
        id: spec.templateId,
        name: playerFacingPowerName(spec, resolved),
        rankPreview: activeBuffEffectAtRank(spec.templateId, DEF_RANK),
        fluff: entryFluff(spec.templateId),
    };
}
function entryFluff(templateId) {
    const entry = findCatalogEntry(templateId);
    return String(entry?.raw?.fluff ?? '');
}
export function getOffensiveActiveBuffOptions() {
    return OFFENSIVE_ACTIVE_BUFF_ORDER.filter((id) => {
        const meta = OFFENSIVE_ACTIVE_BUFF_META[id];
        return meta && resolveGrant(def(id, DEF_RANK)).status === 'ok';
    }).map((id) => {
        const meta = OFFENSIVE_ACTIVE_BUFF_META[id];
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
export function getOffensiveActiveBuffGroups() {
    const byGroup = new Map();
    for (const buff of getOffensiveActiveBuffOptions()) {
        const list = byGroup.get(buff.groupLabel) ?? [];
        list.push(buff);
        byGroup.set(buff.groupLabel, list);
    }
    const groups = [];
    for (const label of OFFENSIVE_BUFF_GROUP_ORDER) {
        const buffs = byGroup.get(label);
        if (buffs?.length)
            groups.push({ groupLabel: label, buffs });
    }
    for (const [groupLabel, buffs] of byGroup.entries()) {
        if (OFFENSIVE_BUFF_GROUP_ORDER.includes(groupLabel))
            continue;
        groups.push({ groupLabel, buffs });
    }
    return groups;
}
export function isValidOffensiveActiveBuffId(templateId) {
    return getOffensiveActiveBuffOptions().some((b) => b.id === templateId);
}
const SUPPORT_ACTIVE_BUFF_ORDER = [
    'ab-healing',
    'ab-temp-hp',
    'ab-spell-resistance',
    'ab-cleanse-maintenance',
    'ab-armor-aura',
    'ab-healing-aura',
    'ab-immovable-temp-hp',
    'ab-armor-temp-hp',
    'ab-evade-temp-hp',
    'ab-temp-hp-healing',
    'ab-armor-evade',
    'ab-growth-form',
];
const SUPPORT_BUFF_GROUP_ORDER = ['Recovery', 'Ward', 'Auras', 'Combined utility', 'Form'];
const SUPPORT_BUFF_META = {
    'ab-healing': {
        groupLabel: 'Recovery',
        label: 'Turn-start healing',
        explanation: 'Sustain yourself or allies with steady healing while the buff lasts.',
    },
    'ab-temp-hp': {
        groupLabel: 'Recovery',
        label: 'Temporary HP buffer',
        explanation: 'Frontload protection for the opening of a fight.',
    },
    'ab-spell-resistance': {
        groupLabel: 'Ward',
        label: 'Spell Resistance',
        explanation: 'Reject hostile spell structure for the duration.',
    },
    'ab-cleanse-maintenance': {
        groupLabel: 'Ward',
        label: 'Cleanse Maintenance',
        explanation: 'Steadily reduce one negative ongoing effect on you each turn.',
    },
    'ab-armor-aura': {
        groupLabel: 'Auras',
        label: 'Armor Aura',
        explanation: 'Share Armor with nearby allies.',
    },
    'ab-healing-aura': {
        groupLabel: 'Auras',
        label: 'Healing Aura',
        explanation: 'Support allies with shared healing pressure.',
    },
    'ab-immovable-temp-hp': {
        groupLabel: 'Auras',
        label: 'Immovable + Temporary HP',
        explanation: 'Anchor yourself and allies with layered protection.',
    },
    'ab-armor-temp-hp': {
        groupLabel: 'Combined utility',
        label: 'Armor + Temporary HP',
        explanation: 'Layer Armor and a protective buffer.',
    },
    'ab-evade-temp-hp': {
        groupLabel: 'Combined utility',
        label: 'Evade + Temporary HP',
        explanation: 'Slip hits and buffer what gets through.',
    },
    'ab-temp-hp-healing': {
        groupLabel: 'Combined utility',
        label: 'Temporary HP + Healing',
        explanation: 'Buffer plus sustain for longer fights.',
    },
    'ab-armor-evade': {
        groupLabel: 'Combined utility',
        label: 'Armor + Evade',
        explanation: 'Hybrid defensive profile for unpredictable threats.',
    },
    'ab-growth-form': {
        groupLabel: 'Form',
        label: 'Growth Form',
        explanation: 'Utility form shift with defensive reach and presence.',
    },
};
export function getSupportActiveBuffOptions(defenseId) {
    const packageBuffId = defenseId ? getDefensePackage(defenseId)?.grants.activeBuff.templateId : undefined;
    return SUPPORT_ACTIVE_BUFF_ORDER.filter((id) => {
        if (id === packageBuffId)
            return false;
        const meta = SUPPORT_BUFF_META[id];
        return meta && resolveGrant(def(id, DEF_RANK)).status === 'ok';
    }).map((id) => {
        const meta = SUPPORT_BUFF_META[id];
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
export function getSupportActiveBuffGroups(defenseId) {
    const byGroup = new Map();
    for (const buff of getSupportActiveBuffOptions(defenseId)) {
        const list = byGroup.get(buff.groupLabel) ?? [];
        list.push(buff);
        byGroup.set(buff.groupLabel, list);
    }
    const groups = [];
    for (const label of SUPPORT_BUFF_GROUP_ORDER) {
        const buffs = byGroup.get(label);
        if (buffs?.length)
            groups.push({ groupLabel: label, buffs });
    }
    for (const [groupLabel, buffs] of byGroup.entries()) {
        if (SUPPORT_BUFF_GROUP_ORDER.includes(groupLabel))
            continue;
        groups.push({ groupLabel, buffs });
    }
    return groups;
}
export function isValidSupportActiveBuffId(templateId, defenseId) {
    return getSupportActiveBuffOptions(defenseId).some((b) => b.id === templateId);
}
export function isValidReplacementActiveBuffId(templateId, mode, defenseId) {
    if (mode === 'offensive')
        return isValidOffensiveActiveBuffId(templateId);
    if (mode === 'support')
        return isValidSupportActiveBuffId(templateId, defenseId);
    return false;
}
function buildCustomizationNotes(selection) {
    const notes = [];
    const defense = getDefensePackage(selection.defenseId);
    if (!defense)
        return notes;
    const defaultPassive1 = getDefaultPassive1TemplateId(selection.defenseId);
    const currentPassive1 = resolvePassive1TemplateId(selection);
    if (currentPassive1 && currentPassive1 !== defaultPassive1) {
        notes.push({
            kind: 'passive1-variant',
            recommended: secondPassiveLabel(defaultPassive1),
            current: secondPassiveLabel(currentPassive1),
        });
    }
    if (selection.activeBuffMode !== 'defensive') {
        const recommended = resolveGrant(defense.grants.activeBuff).displayName;
        const current = resolveGrant(resolveActiveBuffSpec(selection)).displayName;
        if (current !== recommended) {
            notes.push({
                kind: 'active-buff-replaced',
                recommended,
                current,
            });
        }
    }
    return notes;
}
/** @deprecated use getOffensiveActiveBuffOptions() */
export const WIZARD_OFFENSIVE_ACTIVE_BUFFS = getOffensiveActiveBuffOptions();
export const TOWER_WIZARD_DEFENSE_PACKAGES = [
    {
        id: 'armor',
        mechanicLabel: 'Armor',
        label: 'Hits still land, but they hurt less.',
        explanation: 'Flat Armor against incoming attacks. The simplest, most reliable defense.',
        grants: {
            passive1: def('passive-fortified-frame', DEF_RANK),
            activeBuff: def('ab-armor', DEF_RANK),
            reaction: def('reaction-armor', DEF_RANK),
        },
    },
    {
        id: 'evade',
        mechanicLabel: 'Evade',
        label: 'Survive by being hard to hit.',
        explanation: 'Enemies miss more often. You dodge instead of soaking hits.',
        grants: {
            passive1: def('passive-evade', DEF_RANK),
            activeBuff: def('ab-evade', DEF_RANK),
            reaction: def('reaction-evade', DEF_RANK),
        },
    },
    {
        id: 'damage-reduction',
        mechanicLabel: 'Damage Reduction',
        label: 'Cut a percentage off incoming damage.',
        explanation: 'Percentage Damage Reduction on hits that get through.',
        grants: {
            passive1: def('passive-damage-reduction', DEF_RANK),
            activeBuff: def('ab-damage-reduction', DEF_RANK),
            reaction: def('reaction-damage-reduction', DEF_RANK),
        },
    },
    {
        id: 'phasing',
        mechanicLabel: 'Phasing',
        label: 'Ignore a few hits completely.',
        explanation: 'A limited number of hits per combat simply miss you.',
        grants: {
            passive1: def('passive-ghostform', DEF_RANK),
            activeBuff: def('ab-phasing', DEF_RANK),
            reaction: def('reaction-phasing', DEF_RANK),
        },
    },
    {
        id: 'parry',
        mechanicLabel: 'Parry',
        label: 'Spend a pool to strip Attack Dice before they roll.',
        explanation: 'Enter Parry instead of attacking and spend pool 1:1 to remove Attack Dice.',
        grants: {
            passive1: def('passive-parry', DEF_RANK),
            activeBuff: def('ab-reinforced-parry', DEF_RANK),
            reaction: def('reaction-riposte', DEF_RANK),
        },
    },
    {
        id: 'damage-negation',
        mechanicLabel: 'Damage Negation',
        label: 'Spend a combat reserve of Damage Dice before damage is rolled.',
        explanation: 'A closed reserve of Damage Dice you spend to cancel incoming damage.',
        grants: {
            passive1: def('passive-damage-negation', DEF_RANK),
            activeBuff: def('ab-reinforced-damage-negation', DEF_RANK),
            reaction: def('reaction-damage-negation', DEF_RANK),
        },
    },
];
/** Passive 1 variants offered per main defense (catalog template ids). */
const PASSIVE1_VARIANT_IDS = {
    armor: [
        'passive-fortified-frame',
        'passive-armor-temp-hp',
        'passive-stone-stance',
        'passive-surrounded-bulwark',
        'conditional-passive-armor-temp-hp',
        'conditional-passive-armor-healing',
        'conditional-passive-armor-health',
    ],
    evade: [
        'passive-evade',
        'passive-flowing-step',
        'passive-duelist-footwork',
        'passive-evade-temp-hp',
        'passive-evade-healing',
        'passive-evade-damage',
        'conditional-passive-evade-temp-hp',
        'conditional-passive-evade-healing',
        'conditional-passive-evade-damage',
    ],
    'damage-reduction': ['passive-damage-reduction'],
    phasing: ['passive-ghostform'],
    parry: ['passive-parry'],
    'damage-negation': ['passive-damage-negation'],
};
const PASSIVE1_VARIANT_COPY = {
    'passive-fortified-frame': {
        description: 'Simple, reliable Armor. You always gain flat Armor. Best default choice for most Armor characters.',
        mechanicsPreview: 'Gain permanent Armor.',
    },
    'passive-armor-temp-hp': {
        description: 'Less pure Armor, but adds a frontloaded buffer. Good if you want to survive the opening of combat better.',
        mechanicsPreview: 'Gain Armor plus Temporary HP.',
    },
    'passive-stone-stance': {
        description: 'Stronger Armor when you hold your ground. Better for players who want tactical play instead of a pure always-on bonus.',
        mechanicsPreview: 'Gain Armor only while the listed condition is true.',
    },
    'passive-surrounded-bulwark': {
        description: 'Armor that spikes when enemies crowd you. Rewards staying in the thick of melee.',
        mechanicsPreview: 'Gain Armor only while the listed condition is true.',
    },
    'conditional-passive-armor-temp-hp': {
        description: 'Armor and Temporary HP when allies are nearby. Tactical, team-aware defense.',
        mechanicsPreview: 'Gain Armor plus Temporary HP only while the listed condition is true.',
    },
    'conditional-passive-armor-healing': {
        description: 'Armor and healing when you stand still. Rewards holding a position.',
        mechanicsPreview: 'Gain Armor and healing only while the listed condition is true.',
    },
    'conditional-passive-armor-health': {
        description: 'Armor and extra health when allies are nearby. A durable anchor for the party.',
        mechanicsPreview: 'Gain Armor and health only while the listed condition is true.',
    },
    'passive-evade': {
        description: 'Simple, reliable Evade. You are always harder to hit. Best default choice for most Evade characters.',
        mechanicsPreview: 'Gain permanent Evade.',
    },
    'passive-flowing-step': {
        description: 'More tactical Evade that depends on movement. Rewards staying mobile.',
        mechanicsPreview: 'Gain Evade only while the listed condition is true.',
    },
    'passive-duelist-footwork': {
        description: 'Evade that shines in one-on-one fights. Better when you duel a single foe.',
        mechanicsPreview: 'Gain Evade only while the listed condition is true.',
    },
    'passive-evade-temp-hp': {
        description: 'Adds another small defensive layer with Temporary HP, but is less focused than pure Evade.',
        mechanicsPreview: 'Gain Evade plus Temporary HP.',
    },
    'passive-evade-healing': {
        description: 'Evade plus sustain. Hard to hit and quick to mend.',
        mechanicsPreview: 'Gain Evade plus healing.',
    },
    'passive-evade-damage': {
        description: 'Evade plus damage. A hybrid skirmisher profile.',
        mechanicsPreview: 'Gain Evade plus bonus damage.',
    },
    'conditional-passive-evade-temp-hp': {
        description: 'Evade and Temporary HP when you move enough. Rewards aggressive repositioning.',
        mechanicsPreview: 'Gain Evade plus Temporary HP only while the listed condition is true.',
    },
    'conditional-passive-evade-healing': {
        description: 'Evade and healing after heavy movement. A mobile sustain build.',
        mechanicsPreview: 'Gain Evade plus healing only while the listed condition is true.',
    },
    'conditional-passive-evade-damage': {
        description: 'Evade and damage after movement. Hit-and-run tactics.',
        mechanicsPreview: 'Gain Evade plus damage only while the listed condition is true.',
    },
    'passive-damage-reduction': {
        description: 'Damage Reduction is a closed premium defensive subsystem. It is normally taken as a full package and should not be mixed casually with Armor, Evade, Temporary HP or Phasing.',
        mechanicsPreview: 'Gain Damage Reduction.',
    },
    'passive-ghostform': {
        description: 'Phasing is a closed premium defensive subsystem. It lets you ignore a limited number of hits and is normally taken as a full package.',
        mechanicsPreview: 'Gain Phasing charges at combat start.',
    },
    'passive-parry': {
        description: 'A Parry pool you spend to strip Attack Dice before the roll.',
        mechanicsPreview: 'Maximum Parry Pool while you Parry instead of attacking.',
    },
    'passive-damage-negation': {
        description: 'A combat reserve of Damage Dice spent before damage is rolled.',
        mechanicsPreview: 'Combat reserve of Negation Dice; spend at most half the pool.',
    },
};
const DEFENSE_MAIN_LABEL = {
    armor: 'Armor',
    evade: 'Evade',
    'damage-reduction': 'Damage Reduction',
    phasing: 'Phasing',
    parry: 'Parry',
    'damage-negation': 'Damage Negation',
};
const PASSIVE2_INTENT_LABELS = {
    armor: { label: 'Armor' },
    evade: { label: 'Evade' },
    parry: { label: 'Parry' },
    'damage-reduction': { label: 'Damage Reduction' },
    'damage-negation': { label: 'Damage Negation' },
    phasing: { label: 'Phasing' },
    invisibility: { label: 'Invisibility' },
    health: { label: 'Increase Maximum Health' },
    'temporary-hp': { label: 'Temporary HP' },
    sustain: { label: 'Healing and Combat Recovery' },
    offense: { label: 'More Damage' },
    advanced: { label: 'Advanced / Other' },
};
const PASSIVE2_BUCKET_ORDER = [
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
export function getDefaultPassive1TemplateId(defenseId) {
    return getDefensePackage(defenseId)?.grants.passive1.templateId ?? '';
}
export function resolvePassive1TemplateId(selection) {
    if (selection.passive1TemplateId)
        return selection.passive1TemplateId;
    if (selection.defenseId)
        return getDefaultPassive1TemplateId(selection.defenseId);
    return undefined;
}
export function isValidPassive1Variant(defenseId, templateId) {
    return PASSIVE1_VARIANT_IDS[defenseId]?.includes(templateId) ?? false;
}
export function getPassive1VariantOptions(defenseId) {
    const defaultId = getDefaultPassive1TemplateId(defenseId);
    const locked = defenseId === 'damage-reduction'
        || defenseId === 'phasing'
        || defenseId === 'parry'
        || defenseId === 'damage-negation';
    const ids = PASSIVE1_VARIANT_IDS[defenseId] ?? [];
    return ids
        .filter((id) => findCatalogEntry(id))
        .map((templateId) => {
        const entry = findCatalogEntry(templateId);
        const copy = PASSIVE1_VARIANT_COPY[templateId];
        const mechanicsPreview = copy?.mechanicsPreview
            ?? stripMarkdown(catalogMechanicsText(entry, DEF_RANK));
        return {
            templateId,
            label: entry.templateName ?? entry.name ?? templateId,
            description: copy?.description ?? (entry.description?.trim() || ''),
            mechanicsPreview,
            isDefault: templateId === defaultId,
            isLocked: locked,
            isRecommended: templateId === defaultId,
        };
    });
}
export function buildDefensePackagePreview(selection) {
    const defenseId = selection.defenseId;
    if (!defenseId)
        return null;
    const defense = getDefensePackage(defenseId);
    if (!defense)
        return null;
    const passive1Id = resolvePassive1TemplateId(selection);
    const passive1 = passive1Id ? resolveGrant(def(passive1Id, DEF_RANK)) : null;
    const buffSpec = selection.activeBuffMode === 'defensive'
        ? defense.grants.activeBuff
        : selection.offensiveActiveBuffId
            ? def(selection.offensiveActiveBuffId, DEF_RANK)
            : defense.grants.activeBuff;
    const buffResolved = resolveGrant(buffSpec);
    const reactionResolved = resolveGrant(defense.grants.reaction);
    return {
        mainDefenseLabel: DEFENSE_MAIN_LABEL[defenseId],
        rows: [
            { label: 'Main Defense', value: DEFENSE_MAIN_LABEL[defenseId] },
            { label: 'Passive 1', value: passive1?.displayName ?? passive1Id ?? '—' },
            { label: 'Passive Category', value: passive1Id ? formatPassiveCategoryList(passive1Id) : '—' },
            { label: 'Active Buff', value: buffResolved.displayName },
            { label: 'Reaction', value: reactionResolved.displayName },
        ],
    };
}
export function getSecondPassiveIntentGroups(defenseId, passive1TemplateId, actorEchoKey) {
    const passive1 = passive1TemplateId ?? getDefaultPassive1TemplateId(defenseId);
    if (!passive1)
        return [];
    return getGuidedSecondPassiveIntentGroups(passive1, actorEchoKey);
}
export const WIZARD_STEP_ORDER = [
    'defense',
    'defensePassiveVariant',
    'passive2',
    'activeBuffChoice',
    'offensiveBuff',
    'offenseDelivery',
    'offenseSpecial',
    'offense',
    'weakenSave',
    'delivery',
    'review',
];
export function packageNeedsReplacementBuffStep(selection) {
    return selection.activeBuffMode === 'offensive' || selection.activeBuffMode === 'support';
}
export function getVisibleWizardSteps(selection) {
    if (isManualBuildMode(selection))
        return ['review'];
    return WIZARD_STEP_ORDER.filter((step) => {
        if (step === 'offensiveBuff' && !packageNeedsReplacementBuffStep(selection))
            return false;
        if (step === 'offense' && !isManualBuildMode(selection))
            return false;
        if (step === 'weakenSave' && !packageNeedsWeakenSaveStep(selection))
            return false;
        if (step === 'delivery' && !packageNeedsDeliveryStep(selection))
            return false;
        return true;
    });
}
function offensePackages() {
    return [
        {
            id: 'lacerate-push',
            label: 'I want to move enemies around and punish movement.',
            explanation: 'Lacerate punishes enemies for moving. Push forces enemies into bad positions. Together they create a simple control plan.',
            warning: 'This package works best when you understand positioning.',
            catalogAvailable: true,
            resolveGrants: ({ delivery }) => [dmg(delivery, 4, 'lacerate'), controlPushPull(delivery)],
        },
        {
            id: 'ruin',
            label: 'I want enemies to take damage over time.',
            explanation: 'Ruin is simple and self-contained. You hit the enemy, the enemy takes ongoing damage, and the effect keeps applying pressure.',
            catalogAvailable: false,
            resolveGrants: ({ delivery }) => [dmg(delivery, 4, 'ruin'), weapon(delivery)],
        },
        {
            id: 'slow',
            label: 'I want to slow enemies down.',
            explanation: 'Slow makes enemies slower and punishes standing still.',
            catalogAvailable: true,
            resolveGrants: ({ delivery }) => [dmg(delivery, 4, 'slow'), weapon(delivery)],
        },
        {
            id: 'expose',
            label: 'I want enemies to be easier to hit.',
            explanation: 'Expose reduces enemy Evade. This helps you and your allies hit fast, slippery, or hard-to-hit enemies.',
            catalogAvailable: true,
            resolveGrants: ({ delivery }) => [dmg(delivery, 6, 'expose'), weapon(delivery)],
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
            label: 'I want to cut enemy dice pools (Weaken).',
            explanation: 'Weaken removes dice from Might / Agility / Intellect pools. Pair it with follow-up attacks that use those Attributes.',
            warning: 'Weaken does not reduce Attributes, Keep, or Damage Pools — only rolled pools.',
            catalogAvailable: false,
            resolveGrants: ({ delivery }) => [
                dmg(delivery, 6, 'weaken'),
                {
                    ...spellDamage(delivery, 4),
                    spellResolution: 'spellAttack',
                    castingAttribute: 'intellect',
                },
            ],
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
export function getSecondPassiveGroups(defenseId, passive1TemplateId, actorEchoKey) {
    return getSecondPassiveIntentGroups(defenseId, passive1TemplateId, actorEchoKey).map((g) => ({
        groupLabel: g.intentLabel,
        passives: g.passives,
    }));
}
export function resolveActiveBuffSpec(selection) {
    const defense = getDefensePackage(selection.defenseId);
    if (!defense)
        return def('ab-armor', DEF_RANK);
    if ((selection.activeBuffMode === 'offensive' || selection.activeBuffMode === 'support')
        && selection.offensiveActiveBuffId) {
        return def(selection.offensiveActiveBuffId, DEF_RANK);
    }
    return defense.grants.activeBuff;
}
export function packageNeedsOffensiveBuffStep(selection) {
    return packageNeedsReplacementBuffStep(selection);
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
        spec.spellResolution = 'spellAttack';
    }
    return sanitizeActiveSpellSpec(spec);
}
export function initializeOffenseOverrides(selection) {
    const catalogSpecs = resolveOffenseActiveSpecs(selection);
    if (catalogSpecs) {
        return catalogSpecs.map((spec, i) => {
            const grantKey = `offense-${i}`;
            const existing = selection.offenseActiveOverrides?.find((o) => o.grantKey === grantKey);
            if (existing)
                return existing;
            return {
                grantKey,
                isSpell: !!spec.isSpell,
                castingAttribute: (spec.castingAttribute ?? 'intellect'),
                spellResolution: (spec.spellResolution ?? 'spellAttack'),
            };
        });
    }
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
    if (!defense)
        return [];
    const catalogOffense = resolveOffenseActiveSpecs(selection);
    const offense = catalogOffense ? null : getOffensePackage(selection.offenseId);
    if (!catalogOffense && !offense)
        return [];
    const offenseOverrides = initializeOffenseOverrides(selection);
    let offenseSpecs;
    if (catalogOffense) {
        offenseSpecs = catalogOffense.map((spec, i) => {
            const grantKey = i === 0 ? 'offense-0' : 'offense-1';
            const catalogOverride = findPowerOverride(selection, grantKey);
            if (catalogOverride) {
                return applyPackagePowerOverride(spec, catalogOverride);
            }
            const override = offenseOverrides.find((o) => o.grantKey === grantKey);
            return applyOverrideToSpec(spec, override, selection.delivery);
        });
    }
    else {
        const offenseCtx = {
            delivery: selection.delivery,
            weakenSave: selection.weakenSave,
        };
        const baseOffense = offense.resolveGrants(offenseCtx);
        offenseSpecs = baseOffense.map((spec, i) => {
            const grantKey = i === 0 ? 'offense-0' : 'offense-1';
            const catalogOverride = findPowerOverride(selection, grantKey);
            if (catalogOverride) {
                return applyPackagePowerOverride(spec, catalogOverride);
            }
            const override = offenseOverrides.find((o) => o.grantKey === grantKey);
            return applyOverrideToSpec(spec, override, selection.delivery);
        });
    }
    const passive1Id = resolvePassive1TemplateId(selection) ?? defense.grants.passive1.templateId;
    const defaults = [
        { key: 'passive-1', spec: def(passive1Id, DEF_RANK) },
        { key: 'passive-2', spec: def(selection.secondPassiveTemplateId, DEF_RANK) },
        { key: 'active-buff', spec: resolveActiveBuffSpec(selection) },
        { key: 'reaction', spec: defense.grants.reaction },
        { key: 'offense-0', spec: offenseSpecs[0] },
        { key: 'offense-1', spec: offenseSpecs[1] },
    ];
    return defaults.map(({ key, spec }) => applyPackagePowerOverride(spec, findPowerOverride(selection, key)));
}
function canResetReviewRow(selection, key, catalogOverride) {
    if (catalogOverride)
        return true;
    if (key === 'passive-1')
        return !!selection.customizedSlots?.passive1;
    if (key === 'active-buff') {
        return !!selection.customizedSlots?.activeBuff || selection.activeBuffMode !== 'defensive';
    }
    return false;
}
export function buildReviewPowerRows(selection) {
    const specs = buildPackageGrantSpecs(selection);
    const offenseOverrides = initializeOffenseOverrides(selection);
    const roles = [
        { key: 'passive-1', role: 'Passive 1' },
        { key: 'passive-2', role: 'Passive 2' },
        { key: 'active-buff', role: 'Active Buff' },
        { key: 'reaction', role: 'Reaction' },
        { key: 'offense-0', role: selectionUsesGuidedOffenseFlow(selection) ? 'Core Attack' : 'Active 1' },
        { key: 'offense-1', role: selectionUsesGuidedOffenseFlow(selection) ? 'Special Attack' : 'Active 2' },
    ];
    return roles.map(({ key, role }, index) => {
        const spec = specs[index];
        const resolved = resolveGrant(spec);
        const catalogOverride = !!findPowerOverride(selection, key);
        const offenseIndex = key.startsWith('offense-') ? Number(key.replace('offense-', '')) : -1;
        const variantOpts = !catalogOverride && !selectionUsesCatalogOffense(selection) && offenseIndex >= 0
            ? getVariantOptionsForOffenseSlot(selection.offenseId, offenseIndex)
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
            showResetToDefault: canResetReviewRow(selection, key, catalogOverride),
            spec,
            variantOptions: variantOpts.map((id) => ({
                id,
                label: playerFacingVariantLabel(id, spec),
            })),
            override: spellOverride,
            showSpellConfig: key !== 'offense-0'
                && resolved.category === 'active'
                && activeTemplateCanBeSpell(spec.templateId),
            locked: selectionUsesGuidedOffenseFlow(selection) && key === 'offense-0',
        };
    });
}
export function buildPackageReview(selection) {
    const defense = getDefensePackage(selection.defenseId);
    const catalogOffense = resolveOffenseActiveSpecs(selection);
    const offense = catalogOffense ? null : getOffensePackage(selection.offenseId);
    const empty = {
        defenseRows: [],
        offenseRows: [],
        reviewPowerRows: [],
        mainDefensePackageRows: [],
        offenseReviewRows: [],
        customizationNotes: [],
        packageId: '',
        allOk: false,
    };
    if (!defense || (!catalogOffense && !offense)) {
        return empty;
    }
    const specs = buildPackageGrantSpecs(selection);
    const reviewPowerRows = buildReviewPowerRows(selection);
    const mainDefensePackageRows = reviewPowerRows.filter((row) => row.grantKey === 'passive-1' || row.grantKey === 'active-buff' || row.grantKey === 'reaction');
    const secondPassiveRow = reviewPowerRows.find((row) => row.grantKey === 'passive-2');
    const offenseReviewRows = reviewPowerRows.filter((row) => row.grantKey === 'offense-0' || row.grantKey === 'offense-1');
    const defenseRows = reviewPowerRows.slice(0, 4).map((row) => ({
        ...resolveGrant(row.spec),
        role: row.role,
        playerName: row.playerName,
    }));
    const offenseRows = reviewPowerRows.slice(4).map((row) => {
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
    const guidedBuildSummary = selectionUsesGuidedOffenseFlow(selection)
        ? buildGuidedBuildSummary(selection, {
            defenseRows,
            offenseRows,
            reviewPowerRows,
            mainDefensePackageRows,
            secondPassiveRow,
            offenseReviewRows,
            defensePackagePreview: buildDefensePackagePreview(selection) ?? undefined,
            customizationNotes: buildCustomizationNotes(selection),
            packageId: buildPackageId(selection),
            allOk: allRows.every((r) => r.status === 'ok'),
        })
        : undefined;
    return {
        defenseRows,
        offenseRows,
        reviewPowerRows,
        mainDefensePackageRows,
        secondPassiveRow,
        offenseReviewRows,
        defensePackagePreview: buildDefensePackagePreview(selection) ?? undefined,
        customizationNotes: buildCustomizationNotes(selection),
        packageId: buildPackageId(selection),
        allOk: allRows.every((r) => r.status === 'ok'),
        guidedBuildSummary,
    };
}
const PACKAGE_GRANT_KEYS = [
    'passive-1', 'passive-2', 'active-buff', 'reaction', 'offense-0', 'offense-1',
];
export function isManualBuildMode(selection) {
    return selection.manualBuildMode === true;
}
export function buildPackageGrantSpecsFromOverrides(selection) {
    if (!selection.powerOverrides?.length)
        return null;
    const specs = [];
    for (const key of PACKAGE_GRANT_KEYS) {
        const override = selection.powerOverrides.find((o) => o.grantKey === key);
        if (!override)
            return null;
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
export function collectOverrideIdentityKeys(overrides, exceptGrantKey) {
    const keys = new Set();
    for (const ov of overrides) {
        if (exceptGrantKey && ov.grantKey === exceptGrantKey)
            continue;
        const key = powerIdentityKey({
            templateId: ov.templateId,
            chosenSpecial: ov.special ? { key: ov.special } : null,
        });
        if (key)
            keys.add(key);
    }
    return keys;
}
function emptyGrantSpec(grantKey) {
    return { templateId: '', rank: grantKeyRank(grantKey), special: null };
}
export function buildManualReviewPowerRows(selection) {
    const roles = [
        { key: 'passive-1', role: 'Passive 1' },
        { key: 'passive-2', role: 'Passive 2' },
        { key: 'active-buff', role: 'Active Buff' },
        { key: 'reaction', role: 'Reaction' },
        { key: 'offense-0', role: 'Active 1' },
        { key: 'offense-1', role: 'Active 2' },
    ];
    return roles.map(({ key, role }) => {
        const override = selection.powerOverrides?.find((o) => o.grantKey === key);
        const spec = override
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
export function buildManualPackageReview(selection) {
    const reviewPowerRows = buildManualReviewPowerRows(selection);
    const specs = buildPackageGrantSpecsFromOverrides(selection);
    const defenseRows = reviewPowerRows.slice(0, 4).map((row) => ({
        ...resolveGrant(row.spec),
        role: row.role,
        playerName: row.playerName,
    }));
    const offenseRows = reviewPowerRows.slice(4).map((row) => {
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
        mainDefensePackageRows: reviewPowerRows.filter((row) => row.grantKey === 'passive-1' || row.grantKey === 'active-buff' || row.grantKey === 'reaction'),
        secondPassiveRow: reviewPowerRows.find((row) => row.grantKey === 'passive-2'),
        offenseReviewRows: reviewPowerRows.filter((row) => row.grantKey === 'offense-0' || row.grantKey === 'offense-1'),
        defensePackagePreview: selection.defenseId ? buildDefensePackagePreview(selection) ?? undefined : undefined,
        customizationNotes: [],
        packageId,
        allOk: !!specs && allRows.every((r) => r.status === 'ok'),
    };
}
export function packageNeedsDeliveryStep(selection) {
    if (isManualBuildMode(selection))
        return false;
    if (selectionUsesCatalogOffense(selection))
        return false;
    return !!selection.offenseId;
}
/** Saves removed in Rules v0.9.8 — never show Body/Mind/Spirit save step. */
export function packageNeedsWeakenSaveStep(_selection) {
    return false;
}
export { GUIDED_DELIVERY_OPTIONS, getGuidedSpecialFocusGroups, resolveGuidedCoreAttackPick, resolveGuidedSpecialPick, getDefensiveActiveBuffChoiceBody, buildGuidedBuildSummary, } from './tower-wizard-guided.js';
//# sourceMappingURL=tower-wizard-packages.js.map