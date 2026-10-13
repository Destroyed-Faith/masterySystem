/**
 * Dragon Head Breath Weapon (Players Guide).
 * Cone Breath: 6 m at Power Level 4, 10 m at 10, 14 m at 16.
 * Artifact levels 1–3 / 4–6 / 7+ are those power levels.
 * The shape choice is not stored on the item; the table uses the cone.
 */
export declare function isBreathWeaponName(name: string | null | undefined): boolean;
export declare function breathConeMeters(artifactLevel: number): number;
/**
 * Sheet / dialog text for a Breath Weapon row: the Breath is a cone from the
 * figure (range Self), not the catalog's "20m + Radius 3m". `artifactLevel`
 * is the level the row belongs to (row.level) or the artifact's current level.
 */
export declare function breathWeaponRowDisplay(artifactLevel: number): {
    range: string;
    aoe: string;
};
/** Range / AoE text for any progression row, with the Breath Weapon cone applied. */
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