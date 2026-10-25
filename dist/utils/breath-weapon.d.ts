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
export type DragonBreathMode = 'damage' | 'ruin';
export declare function isBreathWeaponName(name: string | null | undefined): boolean;
export declare function isDragonBreathDamageMode(name: string | null | undefined): boolean;
export declare function isDragonBreathRuinMode(name: string | null | undefined): boolean;
/** Damage Breath Melee AoE Attack radii at artifact stages → PL 4 / 10 / 16. */
export declare function breathDamageRadiusMeters(artifactLevel: number): number;
/** Ruin Breath Melee AoE Special: Ruin radii at artifact stages → PL 4 / 10 / 16. */
export declare function breathRuinRadiusMeters(artifactLevel: number): number;
/** Printed Melee AoE Attack Power Dice at Breath stages (PL 4 / 10 / 16). */
export declare function breathPowerDamageDice(artifactLevel: number): number;
/** Printed Melee AoE Special: Ruin(X) at Breath stages (PL 4 / 10 / 16). */
export declare function breathRuinValue(artifactLevel: number): number;
/** Dragon Head Bite Weapon Damage at Artifact Level (1d8…10d8). */
export declare function dragonHeadBiteDamage(artifactLevel: number): string;
/**
 * Shared Damage Breath pool preview: Bite + printed Power Dice.
 * Actual combat applies eligible bonuses once to this shared pool.
 */
export declare function damageBreathSharedPoolFormula(artifactLevel: number): string;
/**
 * @deprecated Legacy cone lengths (pre–Melee AoE Breath). Prefer
 * `breathDamageRadiusMeters` / `breathRuinRadiusMeters`.
 */
export declare function breathConeMeters(artifactLevel: number): number;
/**
 * Sheet / dialog AoE text for a Breath Weapon row: dual Damage / Ruin catalogue
 * radii (Self-centered Melee AoE). `artifactLevel` is the row's level or the
 * artifact's current level.
 */
export declare function breathWeaponRowDisplay(artifactLevel: number): {
    range: string;
    aoe: string;
};
/** Range / AoE text for any progression row, with Breath Weapon dual radii applied. */
export declare function progressionRowRangeAoe(row: {
    name?: string;
    level?: number;
    range?: string;
    aoe?: string;
} | null | undefined, fallbackLevel?: number): {
    range: string;
    aoe: string;
};
//# sourceMappingURL=breath-weapon.d.ts.map