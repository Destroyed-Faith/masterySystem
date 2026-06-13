/**
 * Resolve spell save type from catalog entry / template metadata.
 */

import type { SpellSaveType } from '../types/item.js';
import { SPECIAL_EFFECTS_BY_ID } from './special-effects.js';
import { type CatalogEntry, findTemplateById } from './power-catalog.js';
import type { PowerTemplate } from './powers/templates/index.js';

function spellSaveTypeFromSpecialSave(save: string | undefined): SpellSaveType | undefined {
    if (!save) return undefined;
    const t = String(save).trim();
    if (t === '—' || t === '-' || t.toLowerCase() === 'none') return undefined;
    const low = t.toLowerCase();
    if (low.includes('body')) return 'body';
    if (low.includes('mind')) return 'mind';
    if (low.includes('spirit')) return 'spirit';
    return undefined;
}

export function resolveSpellSaveTypeForEntry(
    entry: CatalogEntry,
    template: PowerTemplate | undefined,
): SpellSaveType {
    const key = entry.chosenSpecial?.key;
    if (key) {
        const eff = SPECIAL_EFFECTS_BY_ID.get(key);
        const fromSpec = spellSaveTypeFromSpecialSave(eff?.save);
        if (fromSpec) return fromSpec;
    }
    const d = template?.spellHints?.defaultSaveType;
    if (d === 'body' || d === 'mind' || d === 'spirit') return d;
    return 'body';
}

export { spellSaveTypeFromSpecialSave };
