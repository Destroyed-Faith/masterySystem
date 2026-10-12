/**
 * Picks -> Level Progression compiler.
 *
 * The three Level 1/2/3 progression picks are the single source of truth for an
 * artifact's 1-10 Level Progression table. Each pick (a catalog Power or a Stone
 * Function) is expanded into three staged rows:
 *
 *   Pick L1 -> artifact levels 1 / 4 / 7   (stage I / II / III, PL 4 / 10 / 16)
 *   Pick L2 -> artifact levels 2 / 5 / 8
 *   Pick L3 -> artifact levels 3 / 6 / 9
 *
 * Power picks pull the real per-stage text (range / aoe / duration / effect /
 * special) from the catalog template's PL 4 / 10 / 16 rows, so the change at each
 * stage (radius, damage, special) is visible. There is no Level 10 row.
 */
import type { ArtifactProgressionPick, ArtifactLevelProgressionRow, PowerSpecial } from '../types/item.js';
/**
 * Staged ranks for optional Specials on weapon AoE artifact picks (Dragon Claws
 * Tail Sweep / similar). Catalog `active-*-weapon-aoe` rows ship `specials: []`;
 * the pick's chosen Special is printed here and injected at runtime via
 * `injectOptionalWeaponAoeChosenSpecial`.
 *
 * Push / Pull follow the same authored metre profile: 2 m / 6 m / 10 m (I / II / III).
 */
export declare const WEAPON_AOE_PICK_SPECIAL_RANKS: Record<string, readonly [number, number, number]>;
/** Map catalog Power Level (default stages 4 / 10 / 16) → stage index 0..2. */
export declare function weaponAoeStageIndexFromPowerLevel(powerLevel: number): 0 | 1 | 2;
export declare function optionalWeaponAoeSpecialRank(specialKey: string, stageIndex: number): number | null;
/**
 * Weapon AoE templates do not carry a SPECIAL placeholder. When an artifact pick
 * chooses Push / Pull / Lacerate / …, inject that Special into the level row so
 * attack cards and forced movement see `Push(2)` / `Pull(2)` etc.
 */
export declare function injectOptionalWeaponAoeChosenSpecial<T extends {
    specials?: PowerSpecial[] | Array<{
        key?: string;
        rank?: number;
    }>;
}>(levelData: T | null | undefined, chosenSpecialKey: string | null | undefined, templateId: string | null | undefined, powerLevel: number): T | null | undefined;
/**
 * Expand the up-to-three progression picks into a Level Progression table.
 * Returns rows for levels 1-9 (no Level 10 Ultimate), sorted by level.
 */
export declare function deriveLevelProgressionFromPicks(picks: ArtifactProgressionPick[] | null | undefined): ArtifactLevelProgressionRow[];
//# sourceMappingURL=progression-compiler.d.ts.map