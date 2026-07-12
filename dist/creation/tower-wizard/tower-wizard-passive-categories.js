/**
 * Mechanical Passive categories for Combat Package Wizard — Passive 2 legality.
 *
 * Combined passives occupy every listed category. Passive 2 must not share
 * any category with Passive 1.
 */
import { findCatalogEntry } from '../../utils/power-catalog.js';
/** Categories hidden from the guided Second Passive step. */
const GUIDED_SECOND_PASSIVE_HIDDEN_CATEGORIES = new Set([
    'awareness',
    'ward',
    'sense',
    'utility-awareness',
]);
const CATEGORY_DISPLAY_LABEL = {
    armor: 'Armor',
    evade: 'Evade',
    initiative: 'Initiative',
    'damage-reduction': 'Damage Reduction',
    phasing: 'Phasing',
    'temporary-hp': 'Temporary HP',
    regeneration: 'Regeneration',
    healing: 'Healing',
    recovery: 'Recovery',
    health: 'Health',
    damage: 'Damage',
    'special-aura': 'Special Aura',
    awareness: 'Awareness',
    ward: 'Ward',
};
/** Explicit mechanical categories per passive template (combined = all listed). */
const PASSIVE_TEMPLATE_CATEGORIES = {
    'passive-fortified-frame': ['armor'],
    'passive-stone-stance': ['armor'],
    'passive-surrounded-bulwark': ['armor'],
    'passive-damage-reduction': ['damage-reduction'],
    'passive-evade': ['evade'],
    'passive-initiative': ['initiative'],
    'passive-flowing-step': ['evade'],
    'passive-duelist-footwork': ['evade'],
    'passive-temp-hp': ['temporary-hp'],
    'passive-regeneration': ['regeneration'],
    'passive-ghostform': ['phasing'],
    'passive-killing-intent': ['damage'],
    'passive-deep-vitality': ['health'],
    'passive-heightened-senses': ['awareness'],
    'passive-spell-resistance': ['ward'],
    'passive-mini-cleanse': ['ward'],
    'passive-momentum': ['damage'],
    'passive-ambusher': ['damage'],
    'passive-bloodlust': ['damage'],
    'passive-executioner': ['damage'],
    'passive-blood-feast': ['recovery'],
    'passive-battle-trance': ['recovery'],
    'passive-stillness-recovery': ['recovery'],
    'passive-special-aura': ['special-aura'],
    'passive-armor-temp-hp': ['armor', 'temporary-hp'],
    'passive-armor-healing': ['armor', 'healing'],
    'passive-armor-health': ['armor', 'health'],
    'passive-evade-temp-hp': ['evade', 'temporary-hp'],
    'passive-evade-healing': ['evade', 'healing'],
    'passive-evade-damage': ['evade', 'damage'],
    'passive-damage-healing': ['damage', 'healing'],
    'passive-damage-temp-hp': ['damage', 'temporary-hp'],
    'passive-awareness-evade': ['awareness', 'evade'],
    'passive-awareness-damage': ['awareness', 'damage'],
    'passive-health-healing': ['health', 'healing'],
    'passive-health-temp-hp': ['health', 'temporary-hp'],
    'conditional-passive-armor-temp-hp': ['armor', 'temporary-hp'],
    'conditional-passive-armor-healing': ['armor', 'healing'],
    'conditional-passive-armor-health': ['armor', 'health'],
    'conditional-passive-evade-temp-hp': ['evade', 'temporary-hp'],
    'conditional-passive-evade-healing': ['evade', 'healing'],
    'conditional-passive-evade-damage': ['evade', 'damage'],
    'conditional-passive-damage-healing': ['damage', 'healing'],
    'conditional-passive-damage-temp-hp': ['damage', 'temporary-hp'],
    'conditional-passive-awareness-evade': ['awareness', 'evade'],
    'conditional-passive-awareness-damage': ['awareness', 'damage'],
    'conditional-passive-health-healing': ['health', 'healing'],
    'conditional-passive-health-temp-hp': ['health', 'temporary-hp'],
};
const SUBFAMILY_DEFAULT_CATEGORY = {
    armor: 'armor',
    evade: 'evade',
    'damage-reduction': 'damage-reduction',
    phasing: 'phasing',
    'temp-hp': 'temporary-hp',
    regen: 'regeneration',
    health: 'health',
    damage: 'damage',
    awareness: 'awareness',
    ward: 'ward',
    recovery: 'recovery',
    'special-aura': 'special-aura',
};
export function normalizePassiveCategory(category) {
    return String(category || '')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/^temp-hp$/, 'temporary-hp');
}
export function inferPassiveCategoriesFromTemplateId(templateId) {
    const id = templateId.toLowerCase();
    const cats = new Set();
    if (id.includes('damage-reduction'))
        cats.add('damage-reduction');
    if (id.includes('ghostform') || id.includes('phasing'))
        cats.add('phasing');
    if (id.includes('fortified') || id.includes('stone-stance') || id.includes('surrounded-bulwark') || id.includes('-armor-') || id.startsWith('passive-armor') || id.includes('conditional-passive-armor')) {
        cats.add('armor');
    }
    if (id.includes('passive-evade') || id.includes('-evade-') || id.includes('flowing-step') || id.includes('duelist-footwork') || id.includes('conditional-passive-evade')) {
        cats.add('evade');
    }
    if (id.includes('passive-initiative'))
        cats.add('initiative');
    if (id.includes('temp-hp'))
        cats.add('temporary-hp');
    if (id.includes('deep-vitality') || id.includes('-health-') || id.includes('passive-health') || id.includes('conditional-passive-health')) {
        cats.add('health');
    }
    if (id.includes('healing'))
        cats.add('healing');
    if (id.includes('regeneration') || id === 'passive-regeneration')
        cats.add('regeneration');
    if (id.includes('blood-feast') || id.includes('battle-trance') || id.includes('stillness-recovery') || id.includes('recovery')) {
        cats.add('recovery');
    }
    if (id.includes('heightened-senses') || id.includes('awareness'))
        cats.add('awareness');
    if (id.includes('spell-resistance') || id.includes('mini-cleanse') || id.includes('ward'))
        cats.add('ward');
    if (id.includes('special-aura'))
        cats.add('special-aura');
    if (id.includes('killing-intent')
        || id.includes('momentum')
        || id.includes('ambusher')
        || id.includes('bloodlust')
        || id.includes('executioner')
        || (id.includes('damage') && !id.includes('damage-reduction'))) {
        cats.add('damage');
    }
    return [...cats].map(normalizePassiveCategory);
}
export function getPassiveMechanicalCategories(templateId) {
    const explicit = PASSIVE_TEMPLATE_CATEGORIES[templateId];
    if (explicit?.length)
        return [...explicit].map(normalizePassiveCategory);
    const entry = findCatalogEntry(templateId);
    if (entry?.subfamily && SUBFAMILY_DEFAULT_CATEGORY[entry.subfamily]) {
        const inferred = inferPassiveCategoriesFromTemplateId(templateId);
        if (inferred.length)
            return inferred;
        return [normalizePassiveCategory(SUBFAMILY_DEFAULT_CATEGORY[entry.subfamily])];
    }
    const inferred = inferPassiveCategoriesFromTemplateId(templateId);
    if (inferred.length)
        return inferred;
    if (entry?.subfamily)
        return [normalizePassiveCategory(entry.subfamily)];
    return [];
}
export function getNormalizedPassiveCategories(templateId) {
    return getPassiveMechanicalCategories(templateId);
}
export function formatPassiveCategoryLabel(category) {
    const key = normalizePassiveCategory(category);
    return CATEGORY_DISPLAY_LABEL[key] ?? key.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
export function formatPassiveCategoryList(templateId) {
    const cats = getNormalizedPassiveCategories(templateId);
    if (!cats.length)
        return 'Unknown';
    return cats.map(formatPassiveCategoryLabel).join(', ');
}
export function passivesAreCategoryCompatible(passive1TemplateId, passive2TemplateId) {
    const a = new Set(getNormalizedPassiveCategories(passive1TemplateId));
    const b = getNormalizedPassiveCategories(passive2TemplateId);
    for (const category of b) {
        if (a.has(category))
            return false;
    }
    return true;
}
function isHiddenFromGuidedSecondPassive(categories) {
    return categories.some((c) => GUIDED_SECOND_PASSIVE_HIDDEN_CATEGORIES.has(normalizePassiveCategory(c)));
}
function isLegalForEchoAndPrerequisites(templateId, actorEchoKey) {
    const entry = findCatalogEntry(templateId);
    if (!entry)
        return false;
    if (entry.requiresEcho?.length) {
        const echoKey = (actorEchoKey || '').trim().toLowerCase();
        if (!echoKey || !entry.requiresEcho.includes(echoKey))
            return false;
    }
    return true;
}
export function isAllowedSecondPassive(passive2TemplateId, passive1TemplateId, actorEchoKey) {
    if (!passive1TemplateId || !passive2TemplateId)
        return false;
    if (passive2TemplateId === passive1TemplateId)
        return false;
    const categories2 = getNormalizedPassiveCategories(passive2TemplateId);
    if (!categories2.length)
        return false;
    if (isHiddenFromGuidedSecondPassive(categories2))
        return false;
    if (!passivesAreCategoryCompatible(passive1TemplateId, passive2TemplateId))
        return false;
    if (!isLegalForEchoAndPrerequisites(passive2TemplateId, actorEchoKey))
        return false;
    return true;
}
export function getPassiveCategoryConflictMessage(passive1TemplateId, passive2TemplateId) {
    if (passive1TemplateId === passive2TemplateId) {
        return 'Passive 2 cannot be the same as Passive 1.';
    }
    const a = new Set(getNormalizedPassiveCategories(passive1TemplateId));
    const overlap = getNormalizedPassiveCategories(passive2TemplateId).filter((c) => a.has(c));
    if (!overlap.length)
        return null;
    const label = overlap.map(formatPassiveCategoryLabel).join(', ');
    return `Passive category conflict: both Passives use ${label}. Choose a second Passive from a different category.`;
}
export function secondPassiveBucketFor(templateId) {
    const c = new Set(getNormalizedPassiveCategories(templateId));
    if (c.has('damage-reduction') && c.size === 1)
        return 'premium';
    if (c.has('phasing') && c.size === 1)
        return 'premium';
    if (c.has('special-aura'))
        return 'offense';
    if (c.has('damage')) {
        if (c.has('healing') && !c.has('evade') && !c.has('armor'))
            return 'sustain';
        return 'offense';
    }
    if (c.has('evade'))
        return 'evade';
    if (c.has('health') || c.has('temporary-hp'))
        return 'health-temp-hp';
    if (c.has('regeneration') || c.has('recovery') || c.has('healing'))
        return 'sustain';
    return 'advanced';
}
export function secondPassiveCardWarning(templateId) {
    const cats = getNormalizedPassiveCategories(templateId);
    if (cats.includes('damage-reduction')) {
        return 'Premium subsystem. Usually chosen as a main defense, but legal as Passive 2 if it does not duplicate your Passive 1 category.';
    }
    if (cats.includes('phasing')) {
        return 'Premium subsystem. Ignores limited hits. Usually chosen as a main defense, but legal as Passive 2 if it does not duplicate your Passive 1 category.';
    }
    return undefined;
}
//# sourceMappingURL=tower-wizard-passive-categories.js.map