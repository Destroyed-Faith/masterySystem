/**
 * Detect / repair Dragon Head embeds whose Breath Weapon row cannot reach the
 * combat UI (Breath row without `dragon-breath` identity, missing row, empty progression).
 *
 * Seed stamps alone could mark embeds "current" without pushing catalogue rows —
 * this helper is the content-health check.
 */
import type { ArtifactLevelProgressionRow } from '../types/item.js';
export declare function isDragonHeadArtifactKey(key: string | null | undefined): boolean;
/**
 * True when a Dragon Head embed at `level` will not expose usable Breath modes
 * from its stored `levelProgression` (no row carrying the `dragon-breath` identity).
 */
export declare function dragonHeadBreathProgressionBroken(levelProgression: ArtifactLevelProgressionRow[] | null | undefined, artifactLevel: number): boolean;
/** Rebuild visible level-progression rows for Dragon Head at a given level. */
export declare function rebuildDragonHeadVisibleProgression(artifactLevel: number): ArtifactLevelProgressionRow[];
/**
 * Patch an embedded Dragon Head item's levelProgression (and optional powers)
 * when Breath content is broken. Preserves currentLevel / identity.
 * @returns true when a patch was applied.
 */
export declare function patchDragonHeadBreathProgression(item: any): boolean;
//# sourceMappingURL=dragon-head-breath-repair.d.ts.map