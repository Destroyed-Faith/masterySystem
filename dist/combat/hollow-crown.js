/**
 * Hollow Crown (Deathless Echo) runtime helpers.
 * Deathless Body, Life Absorption caps, Hollow Stillness.
 */
/** Shift steps and max penalty fraction by Hollow Crown level. */
export function deathlessBodyStageForArtifactLevel(artifactLevel) {
    const lvl = Math.max(0, Math.floor(Number(artifactLevel) || 0));
    if (lvl >= 7)
        return 3;
    if (lvl >= 4)
        return 2;
    if (lvl >= 1)
        return 1;
    return 0;
}
export function deathlessBodyShiftSteps(stage) {
    if (stage >= 3)
        return 4;
    if (stage >= 2)
        return 3;
    if (stage >= 1)
        return 2;
    return 0;
}
/** Maximum normal Health Penalty fraction after Deathless Body. */
export function deathlessBodyMaxPenaltyFraction(stage) {
    if (stage >= 3)
        return 0;
    if (stage >= 2)
        return 0.1;
    if (stage >= 1)
        return 0.2;
    return 1;
}
export function lifeAbsorptionMaxStones(artifactLevel) {
    const lvl = Math.max(0, Math.floor(Number(artifactLevel) || 0));
    if (lvl >= 8)
        return 8;
    if (lvl >= 5)
        return 4;
    if (lvl >= 2)
        return 2;
    return 0;
}
export function hollowStillnessPoolBonus(artifactLevel) {
    const lvl = Math.max(0, Math.floor(Number(artifactLevel) || 0));
    if (lvl >= 9)
        return 2;
    if (lvl >= 6)
        return 1;
    return 0;
}
export function hollowStillnessHasAdvantage(artifactLevel) {
    return Math.max(0, Math.floor(Number(artifactLevel) || 0)) >= 3;
}
/** Highest Hollow Crown currentLevel on the actor (0 if none). */
export function hollowCrownLevel(actor) {
    if (!actor?.items)
        return 0;
    const items = Array.isArray(actor.items)
        ? actor.items
        : typeof actor.items[Symbol.iterator] === 'function'
            ? Array.from(actor.items)
            : [];
    let best = 0;
    for (const it of items) {
        if (it?.type !== 'artifact')
            continue;
        const key = String(it.system?.echoKey || it.system?.artifactKey || it.system?.key || '');
        const name = String(it.name || '');
        const isHollow = /hollowCrown/i.test(key) ||
            /hollow\s*crown/i.test(name) ||
            String(it.system?.definitionKey || '') === 'hollowCrown';
        if (!isHollow)
            continue;
        const lvl = Math.max(0, Math.floor(Number(it.system?.currentLevel) || 1));
        if (lvl > best)
            best = lvl;
    }
    return best;
}
/**
 * Apply Deathless Body to a Health Penalty fraction for the active bar index.
 * Shifts the index toward Healthy (lower index) by `shift` steps, then caps.
 */
export function applyDeathlessBodyToFraction(activeIndex, fractionTable, stage) {
    if (stage <= 0)
        return fractionTable[activeIndex] ?? 0;
    const shift = deathlessBodyShiftSteps(stage);
    const shiftedIndex = Math.max(0, activeIndex - shift);
    let fraction = fractionTable[shiftedIndex] ?? 0;
    const cap = deathlessBodyMaxPenaltyFraction(stage);
    if (fraction > cap)
        fraction = cap;
    // Incapacitated (last bar empty) still zeroes the pool — Deathless Body does not prevent Incapacitated.
    if (activeIndex >= fractionTable.length - 1 && (fractionTable[activeIndex] ?? 0) >= 1) {
        return 1;
    }
    return fraction;
}
//# sourceMappingURL=hollow-crown.js.map