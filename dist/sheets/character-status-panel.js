/**
 * Player-sheet status list: combat specials plus leftover Temp HP.
 */
import { getEffectById } from '../utils/special-effects.js';
import { coerceStatusEffectsArray, reduceStatusEffectAt, statusEntryId, } from '../system/active-specials.js';
export function buildCharacterStatusRows(actor) {
    const rows = [];
    const list = coerceStatusEffectsArray(actor?.system?.statusEffects);
    for (let index = 0; index < list.length; index++) {
        const entry = list[index];
        const id = statusEntryId(entry) || String(entry?.id || '').trim();
        const rawName = String(entry?.name || '').trim();
        const catalog = id ? getEffectById(id) : undefined;
        const name = catalog?.name || rawName || id || `Status ${index + 1}`;
        const valueNum = Math.floor(Number(entry?.value));
        const hasValue = entry?.value !== undefined &&
            entry?.value !== null &&
            entry?.value !== '' &&
            Number.isFinite(valueNum);
        rows.push({
            kind: 'special',
            index,
            id,
            name,
            value: hasValue ? valueNum : null,
            hasValue,
            canReduce: hasValue && valueNum > 0,
        });
    }
    const tempHP = Math.max(0, Math.floor(Number(actor?.system?.health?.tempHP ?? 0) || 0));
    if (tempHP > 0) {
        rows.push({
            kind: 'tempHP',
            index: -1,
            id: 'tempHP',
            name: 'Temp HP',
            value: tempHP,
            hasValue: true,
            canReduce: false,
        });
    }
    return rows;
}
export async function removeCharacterStatusRow(actor, row) {
    if (row.kind === 'tempHP') {
        await actor.update({ 'system.health.tempHP': 0 });
        return;
    }
    const list = coerceStatusEffectsArray(actor.system?.statusEffects);
    if (row.index < 0 || row.index >= list.length)
        return;
    await actor.update({ 'system.statusEffects': list.filter((_, i) => i !== row.index) });
}
export async function reduceCharacterStatusRow(actor, row, steps) {
    if (row.kind !== 'special')
        return;
    const list = coerceStatusEffectsArray(actor.system?.statusEffects);
    if (row.index < 0 || row.index >= list.length)
        return;
    await actor.update({ 'system.statusEffects': reduceStatusEffectAt(list, row.index, steps) });
}
//# sourceMappingURL=character-status-panel.js.map