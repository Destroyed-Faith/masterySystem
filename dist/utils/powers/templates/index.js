/**
 * Power Templates — aggregate registry.
 *
 * Replaces the old per-tree map (`MASTERY_TREE_POWER_MAP`) with a single
 * flat list of PowerTemplates across the five categories. The catalog
 * builder in `power-catalog.ts` expands damage Actives by their Special
 * slot so the Picker can filter by category → subfamily → tier → special.
 */
export { buildLevels, movementRow, reactionRow, activeBuffRow, passiveRow, activeRow, } from './_shared.js';
export { TIER_3_SPECIALS, TIER_4_SPECIALS, TIER_5_SPECIALS, TIER_6_SPECIALS, ALL_TIER_ELIGIBLE_SPECIALS, getEligibleSpecialsForTier, } from './_specials.js';
import { MOVEMENT_TEMPLATES } from './movement.js';
import { REACTION_TEMPLATES } from './reaction.js';
import { ACTIVE_BUFF_TEMPLATES } from './activeBuffs.js';
import { PASSIVE_TEMPLATES } from './passives.js';
import { ACTIVE_TEMPLATES } from './actives.js';
export { MOVEMENT_TEMPLATES, REACTION_TEMPLATES, ACTIVE_BUFF_TEMPLATES, PASSIVE_TEMPLATES, ACTIVE_TEMPLATES, };
/** Every template in every category, flat. Source of truth for the catalog. */
export const ALL_POWER_TEMPLATES = [
    ...MOVEMENT_TEMPLATES,
    ...REACTION_TEMPLATES,
    ...ACTIVE_BUFF_TEMPLATES,
    ...PASSIVE_TEMPLATES,
    ...ACTIVE_TEMPLATES,
];
/** Look up a template by its kebab-case `templateId`. */
export function getTemplate(templateId) {
    return ALL_POWER_TEMPLATES.find((t) => t.templateId === templateId);
}
/** All distinct subfamilies in a given category. */
export function getSubfamiliesByCategory(category) {
    const subs = new Set();
    for (const t of ALL_POWER_TEMPLATES)
        if (t.category === category)
            subs.add(t.subfamily ?? '');
    return [...subs].filter(Boolean).sort();
}
/** All templates belonging to a given (category, subfamily). */
export function getTemplatesBySubfamily(category, subfamily) {
    return ALL_POWER_TEMPLATES.filter((t) => t.category === category && t.subfamily === subfamily);
}
/** Return every Special key an Active in `category === 'active'` can slot. */
export function getEligibleSpecialsForCategory(category) {
    if (category !== 'active')
        return [];
    const out = new Set();
    for (const t of ALL_POWER_TEMPLATES) {
        if (t.category !== 'active' || !t.specialSlot)
            continue;
        for (const key of t.specialSlot.eligibleSpecialKeys)
            out.add(key);
    }
    return [...out].sort();
}
//# sourceMappingURL=index.js.map