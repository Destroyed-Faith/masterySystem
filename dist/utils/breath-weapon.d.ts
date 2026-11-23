/**
 * Dragon Head Breath Weapon (Players Guide / Core).
 *
 * Damage Breath = Melee AoE Attack (catalogue length / power dice) **plus** this
 * Artifact's Bite Weapon Damage (Dragon Head-only exception to no-Weapon-Damage-on-AoE).
 * Ruin Breath = Melee AoE Special: Ruin (catalogue Ruin ranks / lengths; no damage, no Bite).
 *
 * Both modes are self-centered Martial Melee Instant AoEs using the catalogue radii
 * (one shared Attack Roll vs each Evade, equal payload; no Primary Target, no Cone).
 * Both modes share the Breath Weapon use counter (ceil(MR/2) per Safe Haven Rest).
 * Do not add Dragon Claws or other weapons to Damage Breath.
 */
export type DragonBreathMode = 'damage' | 'ruin';
/** Breath Weapon stage I / II / III (Artifact Level 1–3 / 4–6 / 7–10) → Power Level 4 / 10 / 16. */
export declare function breathPowerLevel(artifactLevel: number): 4 | 10 | 16;
/** Damage Breath radius (m): Melee AoE Attack radius at the stage Power Level. */
export declare function breathDamageRadiusMeters(artifactLevel: number): number;
/** Ruin Breath radius (m): Melee AoE Special: Ruin radius at the stage Power Level. */
export declare function breathRuinRadiusMeters(artifactLevel: number): number;
/** Melee AoE Attack Power Dice (d8 count) at the stage Power Level. */
export declare function breathPowerDamageDice(artifactLevel: number): number;
/** Melee AoE Special: Ruin(X) at the stage Power Level. */
export declare function breathRuinValue(artifactLevel: number): number;
/** Dragon Head Bite Weapon Damage at Artifact Level (1d8…10d8). */
export declare function dragonHeadBiteDamage(artifactLevel: number): string;
/**
 * Shared Damage Breath pool preview: Bite + printed Power Dice.
 * Actual combat applies eligible bonuses once to this shared pool.
 */
export declare function damageBreathSharedPoolFormula(artifactLevel: number): string;
/**
 * Radius for a Breath mode. Same catalogue numbers as the printed AoE column.
 */
export declare function breathRadiusMeters(artifactLevel: number, mode?: DragonBreathMode): number;
/**
 * Sheet / dialog AoE text for a Breath Weapon row: dual Damage / Ruin radii.
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
    artifactFunctionId?: string | null;
} | null | undefined, fallbackLevel?: number): {
    range: string;
    aoe: string;
};
//# sourceMappingURL=breath-weapon.d.ts.map