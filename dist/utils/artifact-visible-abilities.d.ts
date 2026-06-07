/**
 * Resolve which Level Progression rows are *active* on an artifact at a given
 * level. Echo artifacts unlock up to three ability slots (L1 / L2 / L3); each
 * slot upgrades at L4 and L7 (stages I → II → III). Level-10 Ultimate rows are
 * separate and only appear at L10.
 */
import type { ArtifactLevelProgressionRow, ArtifactProgressionPick } from '../types/item.js';
/** Full 1–10 table: picks-derived rows when present, else the authored definition. */
export declare function resolveFullLevelProgression(authored: ArtifactLevelProgressionRow[] | null | undefined, picks: ArtifactProgressionPick[] | null | undefined): ArtifactLevelProgressionRow[];
/** Level-10 capstone rows (e.g. True Dragon Head) — not a fourth staged slot. */
export declare function isUltimateProgressionRow(row: ArtifactLevelProgressionRow): boolean;
/** Which of the three standard pick slots a staged row belongs to (0..2). */
export declare function progressionSlotIndex(row: ArtifactLevelProgressionRow): number;
/**
 * Return the ability rows visible at `currentLevel`: 1 slot at L1, 2 at L2,
 * 3 from L3 onward (stages upgrade in place; count never exceeds three).
 */
export declare function visibleAbilityRows(allRows: ArtifactLevelProgressionRow[] | null | undefined, currentLevel: number): ArtifactLevelProgressionRow[];
//# sourceMappingURL=artifact-visible-abilities.d.ts.map