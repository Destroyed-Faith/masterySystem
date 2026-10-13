/**
 * Dragon Head Breath Weapon (Players Guide).
 * Cone Breath: 6 m at Power Level 4, 10 m at 10, 14 m at 16.
 * Artifact levels 1–3 / 4–6 / 7+ are those power levels.
 * The shape choice is not stored on the item; the table uses the cone.
 */
export function isBreathWeaponName(name) {
    return /breath weapon/i.test(String(name || ''));
}
export function breathConeMeters(artifactLevel) {
    const level = Math.max(1, Math.floor(Number(artifactLevel) || 1));
    if (level <= 3)
        return 6;
    if (level <= 6)
        return 10;
    return 14;
}
/**
 * Sheet / dialog text for a Breath Weapon row: the Breath is a cone from the
 * figure (range Self), not the catalog's "20m + Radius 3m". `artifactLevel`
 * is the level the row belongs to (row.level) or the artifact's current level.
 */
export function breathWeaponRowDisplay(artifactLevel) {
    const m = breathConeMeters(artifactLevel);
    return { range: 'Self', aoe: `Cone ${m}m` };
}
/** Range / AoE text for any progression row, with the Breath Weapon cone applied. */
export function progressionRowRangeAoe(row, fallbackLevel) {
    if (!row)
        return { range: '', aoe: '' };
    if (isBreathWeaponName(row.name)) {
        return breathWeaponRowDisplay(Number(row.level) || Number(fallbackLevel) || 1);
    }
    return { range: String(row.range || ''), aoe: String(row.aoe || '') };
}
//# sourceMappingURL=breath-weapon.js.map