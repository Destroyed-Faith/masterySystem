/**
 * Map a character's power level (1–12 progression) to the rank row used in power definitions.
 * Definition tables only expose ranks 1–4 (or fewer); higher levels use the highest defined rank.
 */
export function getPowerDefinitionRank(level, levels) {
    const lv = Math.max(1, Math.floor(Number(level) || 1));
    if (!levels) {
        return Math.min(lv, 4);
    }
    if (Array.isArray(levels)) {
        const rankNums = levels
            .map((row) => Number(row?.level))
            .filter((n) => Number.isFinite(n) && n > 0);
        const maxR = rankNums.length ? Math.max(...rankNums) : 4;
        return Math.min(lv, maxR);
    }
    if (typeof levels === 'object' && levels !== null) {
        const keys = Object.keys(levels)
            .filter(k => /^\d+$/.test(k))
            .map(Number);
        const maxR = keys.length ? Math.max(...keys) : 4;
        return Math.min(lv, maxR);
    }
    return Math.min(lv, 4);
}
//# sourceMappingURL=power-definition-rank.js.map