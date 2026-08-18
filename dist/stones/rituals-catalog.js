/**
 * Stone-Powers Rituals tab — same catalog as Perform Ritual.
 * Any Stone color may pay; slots accept every pool attribute.
 */
import { RITUALS, ritualCategoryLabels, ritualMaxRaise, } from '../utils/rituals.js';
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
export const STONE_RITUALS_CATALOG = RITUALS.map((ritual) => ({
    id: ritual.id,
    name: ritual.name,
    slots: repeatSlots(3, ANY_STONE),
    roll: `Normal Skill Check · ${ritualCategoryLabels(ritual)}`,
    duration: ritual.duration,
    requirement: ritual.requirement ?? '',
    intro: ritual.description,
    raises: ritual.raises.slice(0, ritualMaxRaise(ritual) + 1).map((text, i) => ({
        label: `Raise ${i}`,
        text,
    })),
    danger: ritual.danger,
    lore: ritual.specialCostNote,
}));
//# sourceMappingURL=rituals-catalog.js.map