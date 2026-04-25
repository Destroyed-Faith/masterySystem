/**
 * Power Templates — aggregate registry.
 *
 * Replaces the old per-tree map (`MASTERY_TREE_POWER_MAP`) with a single
 * flat list of PowerTemplates across the five categories. The catalog
 * builder in `power-catalog.ts` expands damage Actives by their Special
 * slot so the Picker can filter by category → subfamily → tier → special.
 */
export type { PowerTemplate } from './_shared.js';
export { buildLevels, movementRow, reactionRow, activeBuffRow, passiveRow, activeRow, } from './_shared.js';
export { TIER_3_SPECIALS, TIER_4_SPECIALS, TIER_5_SPECIALS, TIER_6_SPECIALS, ALL_TIER_ELIGIBLE_SPECIALS, getEligibleSpecialsForTier, } from './_specials.js';
import { MOVEMENT_TEMPLATES } from './movement.js';
import { REACTION_TEMPLATES } from './reaction.js';
import { ACTIVE_BUFF_TEMPLATES } from './activeBuffs.js';
import { PASSIVE_TEMPLATES } from './passives.js';
import { ACTIVE_TEMPLATES } from './actives.js';
import type { PowerTemplate } from './_shared.js';
import type { PowerCategory } from '../../../types/item.js';
export { MOVEMENT_TEMPLATES, REACTION_TEMPLATES, ACTIVE_BUFF_TEMPLATES, PASSIVE_TEMPLATES, ACTIVE_TEMPLATES, };
/** Every template in every category, flat. Source of truth for the catalog. */
export declare const ALL_POWER_TEMPLATES: PowerTemplate[];
/** Look up a template by its kebab-case `templateId`. */
export declare function getTemplate(templateId: string): PowerTemplate | undefined;
/** All distinct subfamilies in a given category. */
export declare function getSubfamiliesByCategory(category: PowerCategory): string[];
/** All templates belonging to a given (category, subfamily). */
export declare function getTemplatesBySubfamily(category: PowerCategory, subfamily: string): PowerTemplate[];
/** Return every Special key an Active in `category === 'active'` can slot. */
export declare function getEligibleSpecialsForCategory(category: PowerCategory): string[];
//# sourceMappingURL=index.d.ts.map