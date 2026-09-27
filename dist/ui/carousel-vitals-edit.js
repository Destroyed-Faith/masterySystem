import { isHealthBarScarred } from '../utils/calculations.js';
/** Sync scarred count fields after bar edits. */
export function scarredCountFromBars(bars) {
    return bars.filter((b) => isHealthBarScarred(b)).length;
}
export function clampBarCurrent(current, max) {
    const mx = Math.max(0, Math.floor(Number(max) || 0));
    return Math.max(0, Math.min(mx, Math.floor(Number(current) || 0)));
}
/**
 * Apply a GM vitals edit on the live combat actor (token actor when unlinked).
 * Scarred bars clear when current is raised above 0.
 */
export async function applyCarouselVitalsEdit(actor, opts) {
    if (!actor || typeof actor.update !== 'function') {
        return { ok: false, error: 'Actor not writable.' };
    }
    const system = actor.system;
    if (opts.tempHP != null && opts.pool === 'health') {
        const nextTemp = Math.max(0, Math.floor(Number(opts.tempHP) || 0));
        await actor.update({ 'system.health.tempHP': nextTemp });
        return { ok: true };
    }
    const path = opts.pool === 'health' ? 'health' : 'stress';
    const barsRaw = system?.[path]?.bars;
    if (!Array.isArray(barsRaw) || !barsRaw.length) {
        return { ok: false, error: 'No bars on this actor.' };
    }
    const idx = Math.max(0, Math.min(barsRaw.length - 1, Math.floor(Number(opts.barIndex) || 0)));
    const bars = barsRaw.map((b) => ({
        ...b,
        current: Math.max(0, Math.floor(Number(b?.current) || 0)),
        max: Math.max(0, Math.floor(Number(b?.max) || 0)),
    }));
    if (opts.fillBar) {
        bars[idx].current = bars[idx].max;
    }
    else if (opts.current != null) {
        bars[idx].current = clampBarCurrent(opts.current, bars[idx].max);
    }
    else {
        return { ok: false, error: 'Nothing to change.' };
    }
    const updates = {
        [`system.${path}.bars`]: bars,
    };
    if (opts.pool === 'health' && Object.prototype.hasOwnProperty.call(system?.health ?? {}, 'scarred')) {
        updates['system.health.scarred'] = scarredCountFromBars(bars);
    }
    await actor.update(updates);
    return { ok: true };
}
//# sourceMappingURL=carousel-vitals-edit.js.map