/**
 * NPC Print / Export
 *
 * Builds a print-friendly context from an `npc` actor and renders one A4 page
 * per boss phase (or a single page for phase-less NPCs). Opens a standalone
 * window that triggers `window.print()` (save as PDF).
 */
/**
 * Build the flat data object consumed by `npc-print.hbs`.
 * One entry in `pages` per phase (or a single page without phases).
 */
export declare function buildNpcPrintContext(actor: any): Record<string, unknown>;
/**
 * Render the printable NPC sheet and open it in a new window that triggers
 * the browser print dialog (save as PDF).
 */
export declare function openNpcPrintSheet(actor: any): Promise<void>;
//# sourceMappingURL=npc-print.d.ts.map