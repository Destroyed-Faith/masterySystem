/**
 * Dragon Head Breath Weapon (Players Guide / Core).
 *
 * Damage Breath = Melee AoE Attack (catalogue radii / power dice) **plus** this
 * Artifact's Bite Weapon Damage (Dragon Head-only exception to no-Weapon-Damage-on-AoE).
 * Ruin Breath = Melee AoE Special: Ruin (catalogue Ruin ranks / radii; no damage, no Bite).
 * Both modes share the Breath Weapon use counter (ceil(MR/2) per Safe Haven Rest
 * and once per Combat). Attack Attribute: Might or Agility (choose before the roll).
 * No Cone/Line geometry. Do not add Dragon Claws or other weapons to Damage Breath.
 */
import { weaponDamageForLevel } from './artifact-base-derive.js';
export function isBreathWeaponName(name) {
    const n = String(name || '');
    return /breath\s*weapon/i.test(n) || /damage\s*breath/i.test(n) || /ruin\s*breath/i.test(n);
}
export function isDragonBreathDamageMode(name) {
    return /damage\s*breath/i.test(String(name || ''));
}
export function isDragonBreathRuinMode(name) {
    return /ruin\s*breath/i.test(String(name || ''));
}
/** Damage Breath Melee AoE Attack radii at artifact stages → PL 4 / 10 / 16. */
export function breathDamageRadiusMeters(artifactLevel) {
    const level = Math.max(1, Math.floor(Number(artifactLevel) || 1));
    if (level <= 3)
        return 3;
    if (level <= 6)
        return 6;
    return 8;
}
/** Ruin Breath Melee AoE Special: Ruin radii at artifact stages → PL 4 / 10 / 16. */
export function breathRuinRadiusMeters(artifactLevel) {
    const level = Math.max(1, Math.floor(Number(artifactLevel) || 1));
    if (level <= 3)
        return 3;
    if (level <= 6)
        return 5;
    return 7;
}
/** Printed Melee AoE Attack Power Dice at Breath stages (PL 4 / 10 / 16). */
export function breathPowerDamageDice(artifactLevel) {
    const level = Math.max(1, Math.floor(Number(artifactLevel) || 1));
    if (level <= 3)
        return 4;
    if (level <= 6)
        return 7;
    return 13;
}
/** Printed Melee AoE Special: Ruin(X) at Breath stages (PL 4 / 10 / 16). */
export function breathRuinValue(artifactLevel) {
    const level = Math.max(1, Math.floor(Number(artifactLevel) || 1));
    if (level <= 3)
        return 5;
    if (level <= 6)
        return 9;
    return 10;
}
/** Dragon Head Bite Weapon Damage at Artifact Level (1d8…10d8). */
export function dragonHeadBiteDamage(artifactLevel) {
    return weaponDamageForLevel(Math.max(1, Math.min(10, Math.floor(Number(artifactLevel) || 1))));
}
/**
 * Shared Damage Breath pool preview: Bite + printed Power Dice.
 * Actual combat applies eligible bonuses once to this shared pool.
 */
export function damageBreathSharedPoolFormula(artifactLevel) {
    const bite = dragonHeadBiteDamage(artifactLevel);
    const power = breathPowerDamageDice(artifactLevel);
    return `${bite}+${power}d8`;
}
/**
 * @deprecated Legacy cone lengths (pre–Melee AoE Breath). Prefer
 * `breathDamageRadiusMeters` / `breathRuinRadiusMeters`.
 */
export function breathConeMeters(artifactLevel) {
    const level = Math.max(1, Math.floor(Number(artifactLevel) || 1));
    if (level <= 3)
        return 6;
    if (level <= 6)
        return 10;
    return 14;
}
/**
 * Sheet / dialog AoE text for a Breath Weapon row: dual Damage / Ruin catalogue
 * radii (Self-centered Melee AoE). `artifactLevel` is the row's level or the
 * artifact's current level.
 */
export function breathWeaponRowDisplay(artifactLevel) {
    const d = breathDamageRadiusMeters(artifactLevel);
    const r = breathRuinRadiusMeters(artifactLevel);
    return {
        range: 'Self',
        aoe: `Damage: radius ${d} m / Ruin: radius ${r} m`,
    };
}
/** Range / AoE text for any progression row, with Breath Weapon dual radii applied. */
export function progressionRowRangeAoe(row, fallbackLevel) {
    if (!row)
        return { range: '', aoe: '' };
    if (isBreathWeaponName(row.name)) {
        return breathWeaponRowDisplay(Number(row.level) || Number(fallbackLevel) || 1);
    }
    return { range: String(row.range || ''), aoe: String(row.aoe || '') };
}
//# sourceMappingURL=breath-weapon.js.map