/**
 * Small helpers for d8-only damage formulas used by Raise Cost / Power snapshots.
 */
/** Parse the d8 count from strings like "8d8", "0", "2d8+1d8". Returns 0 when unparseable. */
export function parseD8Count(formula) {
    if (typeof formula === 'number') {
        return Math.max(0, Math.floor(formula));
    }
    const raw = String(formula ?? '').trim().toLowerCase();
    if (!raw || raw === '0')
        return 0;
    let total = 0;
    const parts = raw.split('+').map((p) => p.trim());
    for (const part of parts) {
        const m = part.match(/^(\d+)\s*d\s*8$/);
        if (m)
            total += Math.max(0, parseInt(m[1], 10));
    }
    return total;
}
/** Format a non-negative d8 count as `"Nd8"` (0 → `"0"`). */
export function formatD8Count(count) {
    const n = Math.max(0, Math.floor(count));
    return n <= 0 ? '0' : `${n}d8`;
}
export function clampAtZero(n) {
    return Math.max(0, Math.floor(n));
}
/** Add d8 counts and return a formula string. */
export function addD8Formulas(a, extraDice) {
    return formatD8Count(parseD8Count(a) + Math.max(0, Math.floor(extraDice)));
}
//# sourceMappingURL=dice-formula.js.map