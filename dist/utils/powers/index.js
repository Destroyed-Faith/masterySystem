/**
 * Powers Index — Template-based (post-Trees).
 *
 * Single entry-point that re-exports `ALL_POWER_TEMPLATES` and the template
 * helpers. Legacy exports (`MASTERY_TREE_POWER_MAP`, `ALL_MASTERY_POWERS`,
 * `getPowersForTree`, `getPower`) are provided as empty/stub shims so
 * remaining consumers continue to build until the final cleanup pass
 * removes every last tree reference from the codebase.
 */
export { ALL_POWER_TEMPLATES, MOVEMENT_TEMPLATES, REACTION_TEMPLATES, ACTIVE_BUFF_TEMPLATES, PASSIVE_TEMPLATES, ACTIVE_TEMPLATES, getTemplate, getSubfamiliesByCategory, getTemplatesBySubfamily, getEligibleSpecialsForCategory, } from './templates/index.js';
// ─── Legacy stubs (retired — trees are gone) ─────────────────────────────
// These exports exist only to keep legacy imports compiling until every
// consumer is migrated. They all evaluate to empty / no-op.
/** @deprecated — trees removed. Always empty. */
export const MASTERY_TREE_POWER_MAP = {};
/** @deprecated — trees removed. Returns empty array. */
export const ALL_MASTERY_POWERS = [];
/** @deprecated — trees removed. Always returns `undefined`. */
export function getPowersForTree(_treeName) {
    return [];
}
/** @deprecated — trees removed. Always returns `undefined`. */
export function getPower(_treeName, _powerName) {
    return undefined;
}
//# sourceMappingURL=index.js.map