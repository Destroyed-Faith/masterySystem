/**
 * Character Print / Export
 *
 * Builds a flat, print-friendly context from a `character` actor and renders it
 * into the 3-page printable sheet (`templates/actor/character-print.hbs`). The
 * rendered HTML is opened in a new window that links the print stylesheet and
 * triggers `window.print()` so the user can save it as a PDF.
 *
 * Power blocks show each power as a "tile" (Plättchen): a phase label
 * (Movement / Active / Reaction) plus an empty check-box meaning
 * "may be used once per round".
 */
/**
 * Build the flat data object consumed by `character-print.hbs`.
 */
export declare function buildCharacterPrintContext(actor: any): Record<string, unknown>;
/**
 * Render the printable sheet for `actor` and open it in a new window that
 * triggers the browser print dialog (save as PDF).
 */
export declare function openCharacterPrintSheet(actor: any): Promise<void>;
//# sourceMappingURL=character-print.d.ts.map