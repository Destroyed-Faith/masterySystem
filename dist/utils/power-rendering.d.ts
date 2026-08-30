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
/** One special for power tables: Ruin(3), Root(2) — never a bare lowercase key. */
export declare function formatPowerSpecialLabel(spec: string | PowerSpecial | null | undefined, chosenKey?: string): string;
/**
 * Render PowerSpecial array to a human-readable string (Ruin(3), Root(2), …).
 */
export declare function renderSpecials(specials: Array<string | PowerSpecial> | null | undefined, chosenKey?: string): string;
/**
 * Render a PowerLevelRow to a table row HTML
 */
export declare function renderPowerLevelRow(levelRow: PowerLevelRow, level: number, chosenKey?: string): string;
/**
 * Render a power level table for every defined level 1..16 (rows only when data exists).
 */
export declare function renderPowerLevelTable(levels: Record<string, PowerLevelRow> | null | undefined, showTrigger?: boolean, chosenKey?: string): string;
//# sourceMappingURL=power-rendering.d.ts.map