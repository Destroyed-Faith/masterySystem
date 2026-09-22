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
//# sourceMappingURL=breath-weapon.js.map