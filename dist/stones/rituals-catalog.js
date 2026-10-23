/**
 * Stone-Powers Rituals tab — Core Rituals catalogue (DF 2026).
 * Built from the 16 universal Core Rituals; any Stone color may pay and
 * slots accept every pool attribute.
 */
import { coreRitualTierText, stripRitualMarkdown } from '../rules/core-rituals.js';
import { listUniversalCoreRituals } from '../utils/rituals.js';
const ANY_STONE = [
    'might',
    'agility',
    'vitality',
    'intellect',
    'resolve',
    'influence',
    'wits',
];
function repeatSlots(n, allow) {
    return Array.from({ length: Math.max(1, n) }, () => ({ allow: [...allow] }));
}
export const STONE_RITUALS_CATALOG = listUniversalCoreRituals().map((ritual) => ({
    id: ritual.id,
    name: ritual.name,
    slots: repeatSlots(3, ANY_STONE),
    roll: `Skill Check · ${stripRitualMarkdown(ritual.baseTnNote)}`,
    duration: ritual.effectDuration,
    requirement: ritual.requirement ?? '',
    intro: ritual.tagline,
    raises: [0, 1, 2, 3, 4].map((tier) => ({
        label: `Tier ${tier}`,
        text: coreRitualTierText(ritual, tier),
    })),
    danger: ritual.danger || undefined,
    lore: stripRitualMarkdown(ritual.limits) || undefined,
}));
//# sourceMappingURL=rituals-catalog.js.map