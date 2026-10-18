import { isHealthBarScarred } from '../utils/calculations.js';
import { HEALTH_PENALTY_FRACTIONS } from '../utils/constants.js';
/**
 * Hide NPC Health Bars from non-GM clients in the combat carousel.
 * Disposition no longer matters — only the GM sees NPC damage bars.
 * (`disposition` kept for call-site compatibility.)
 */
export function hideCarouselHpNumbers(actorType, _disposition) {
    return actorType === 'npc';
}
/** True when this client must not see NPC Health Bars at all (not just numbers). */
export function hideCarouselNpcHpBars(actorType, isGM) {
    return !isGM && hideCarouselHpNumbers(actorType);
}
/**
 * Vertical Health rail beside a carousel portrait.
 * GM only, and only on player characters — NPCs stay without a bar.
 */
export function showCarouselSideHp(actorType, isGM) {
    return isGM && actorType === 'character';
}
const SHORT_BAR_NAMES = {
    healthy: 'H',
    bruised: 'B',
    injured: 'I',
    wounded: 'W',
    broken: 'Bk',
    incapacitated: 'Out',
};
export function carouselHpBarShortName(name, index = 0) {
    const key = String(name || '').trim().toLowerCase();
    if (SHORT_BAR_NAMES[key])
        return SHORT_BAR_NAMES[key];
    const compact = String(name || '').trim();
    return compact.slice(0, 2) || String(index + 1);
}
/** Pool percent this wound bar deducts. Index follows HEALTH_PENALTY_FRACTIONS. */
export function carouselHpPenaltyLabel(index) {
    const clamped = Math.max(0, Math.floor(Number(index) || 0));
    const fraction = HEALTH_PENALTY_FRACTIONS[Math.min(clamped, HEALTH_PENALTY_FRACTIONS.length - 1)] ?? 0;
    const pct = Math.round(fraction * 100);
    if (pct <= 0)
        return '0%';
    return `−${pct}%`;
}
export function carouselHpHoverTitle(name, index, scarred) {
    const label = String(name || '').trim() || `Bar ${index + 1}`;
    const penalty = carouselHpPenaltyLabel(index);
    const base = `${label} · ${penalty}`;
    return scarred ? `${base} · Scarred` : base;
}
/** One carousel HP segment per Health Bar, including Scarred so players can see the lock. */
export function buildCarouselHpSegments(bars) {
    if (!Array.isArray(bars) || bars.length === 0)
        return [];
    let totalMax = 0;
    const normalized = bars.map((bar, idx) => {
        const current = Math.max(0, Math.floor(Number(bar?.current ?? 0) || 0));
        const max = Math.max(0, Math.floor(Number(bar?.max ?? 0) || 0));
        totalMax += max;
        const name = String(bar?.name ?? `Bar ${idx + 1}`);
        const scarred = isHealthBarScarred(bar);
        return {
            name,
            shortName: carouselHpBarShortName(name, idx),
            penaltyLabel: carouselHpPenaltyLabel(idx),
            hoverTitle: carouselHpHoverTitle(name, idx, scarred),
            current,
            max,
            severity: Math.min(4, idx),
            scarred,
        };
    });
    if (totalMax <= 0)
        return [];
    return normalized.map((bar) => ({
        ...bar,
        widthPct: bar.max > 0 ? (bar.max / totalMax) * 100 : 0,
    }));
}
//# sourceMappingURL=combat-carousel-hp.js.map