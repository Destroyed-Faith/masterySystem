/**
 * Resolve spell save type from catalog entry / template metadata.
 */
import { SPECIAL_EFFECTS_BY_ID } from './special-effects.js';
function spellSaveTypeFromSpecialSave(save) {
    if (!save)
        return undefined;
    const t = String(save).trim();
    if (t === '—' || t === '-' || t.toLowerCase() === 'none')
        return undefined;
    const low = t.toLowerCase();
    if (low.includes('body'))
        return 'body';
    if (low.includes('mind'))
        return 'mind';
    if (low.includes('spirit'))
        return 'spirit';
    return undefined;
}
export function resolveSpellSaveTypeForEntry(entry, template) {
    const key = entry.chosenSpecial?.key;
    if (key) {
        const eff = SPECIAL_EFFECTS_BY_ID.get(key);
        const fromSpec = spellSaveTypeFromSpecialSave(eff?.save);
        if (fromSpec)
            return fromSpec;
    }
    const d = template?.spellHints?.defaultSaveType;
    if (d === 'body' || d === 'mind' || d === 'spirit')
        return d;
    return 'body';
}
export { spellSaveTypeFromSpecialSave };
//# sourceMappingURL=spell-save-type.js.map