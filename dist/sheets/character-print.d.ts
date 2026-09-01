/**
 * Character Print / Export
 *
 * Builds a flat, print-friendly context from a `character` actor and renders it
 * into the 4-page printable sheet (`templates/actor/character-print.hbs`); page
 * 4 is a purely technical, fluff-free summary of powers + weapon attacks +
 * artifacts and the Stone Powers that active artifacts support / discount. The
 * rendered HTML is opened in a new window that links the print stylesheet and
 * triggers `window.print()` so the user can save it as a PDF.
 *
 * Power blocks show each power as a "tile" (Plättchen): a phase label
 * (Movement / Active / Reaction) plus an empty check-box meaning
 * "may be used once per round".
 */
/** Options for the printable character sheet. */
export interface CharacterPrintOptions {
    /**
     * When true, seed Basic Attack + Guard / Evade / Counterattack onto the
     * battle page (same universal options as radial / Reaction Window).
     */
    includeStandardManeuvers?: boolean;
    /** One-page Quick Play view of the same character data. */
    layout?: 'full' | 'compact';
}
/**
 * Build the flat data object consumed by `character-print.hbs`.
 */
export declare function buildCharacterPrintContext(actor: any, options?: CharacterPrintOptions): Record<string, unknown>;
type CompactPowerGroup<T = unknown> = {
    phase: string;
    items: T[];
};
/**
 * Pack Quick Play power phases into balanced columns.
 * Tall Active lists split across columns so Passive / Buff / Reaction are not
 * left with empty vertical space beside them. Phase headers repeat when a
 * group continues in the next column.
 */
export declare function packCompactPowerColumns<T extends CompactPowerGroup>(groups: T[], maxCols?: number): {
    groups: T[];
}[];
/**
 * One-page Quick Play context — same actor data as the full sheet.
 */
export declare function buildCharacterCompactPrintContext(actor: any): Record<string, unknown>;
/**
 * Render the printable sheet for `actor` and open it in a new window that
 * triggers the browser print dialog (save as PDF).
 */
export declare function openCharacterPrintSheet(actor: any, options?: CharacterPrintOptions): Promise<void>;
export {};
//# sourceMappingURL=character-print.d.ts.map