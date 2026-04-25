/**
 * Powers Index — Template-based (post-Trees).
 *
 * Single entry-point that re-exports `ALL_POWER_TEMPLATES` and the template
 * helpers. Legacy exports (`MASTERY_TREE_POWER_MAP`, `ALL_MASTERY_POWERS`,
 * `getPowersForTree`, `getPower`) are provided as empty/stub shims so
 * remaining consumers continue to build until the final cleanup pass
 * removes every last tree reference from the codebase.
 */
import type { EmbeddedPowerData } from '../../types/item.js';
import type { PowerTemplate } from './templates/index.js';
export { ALL_POWER_TEMPLATES, MOVEMENT_TEMPLATES, REACTION_TEMPLATES, ACTIVE_BUFF_TEMPLATES, PASSIVE_TEMPLATES, ACTIVE_TEMPLATES, getTemplate, getSubfamiliesByCategory, getTemplatesBySubfamily, getEligibleSpecialsForCategory, } from './templates/index.js';
export type { PowerTemplate };
/** @deprecated — trees removed. Always empty. */
export declare const MASTERY_TREE_POWER_MAP: Record<string, EmbeddedPowerData[]>;
/** @deprecated — trees removed. Returns empty array. */
export declare const ALL_MASTERY_POWERS: EmbeddedPowerData[];
/** @deprecated — trees removed. Always returns `undefined`. */
export declare function getPowersForTree(_treeName: string): EmbeddedPowerData[];
/** @deprecated — trees removed. Always returns `undefined`. */
export declare function getPower(_treeName: string, _powerName: string): EmbeddedPowerData | undefined;
export type { PowerDefinition, PowerLevelDefinition } from './types.js';
//# sourceMappingURL=index.d.ts.map