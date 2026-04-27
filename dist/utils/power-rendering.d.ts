/**
 * Power Rendering Utilities
 * Helper functions to render power data in the UI
 */
import type { RangeSpec, AoeSpec, DurationSpec, PowerSpecial, PowerLevelRow } from '../types/item.js';
/**
 * Render a RangeSpec to a human-readable string
 */
export declare function renderRange(range: RangeSpec | null): string;
/**
 * Render an AoeSpec to a human-readable string
 */
export declare function renderAoe(aoe: AoeSpec | null): string;
/**
 * Render a DurationSpec to a human-readable string
 */
export declare function renderDuration(duration: DurationSpec): string;
/**
 * Render PowerSpecial array to a human-readable string
 */
export declare function renderSpecials(specials: PowerSpecial[]): string;
/**
 * Render a PowerLevelRow to a table row HTML
 */
export declare function renderPowerLevelRow(levelRow: PowerLevelRow, level: number): string;
/**
 * Render a power level table for every defined level 1..16 (rows only when data exists).
 */
export declare function renderPowerLevelTable(levels: Record<string, PowerLevelRow> | null | undefined, showTrigger?: boolean): string;
//# sourceMappingURL=power-rendering.d.ts.map