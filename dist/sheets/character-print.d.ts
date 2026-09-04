/**
 * Character Print / Export
 *
 * Builds a flat, print-friendly context from a `character` actor and renders the
 * standard **Table Character Sheet** (`templates/actor/character-print.hbs`):
 *   1. Portrait Character Sheet (attributes, core combat, HP/Stress, skills)
 *   2. Landscape Stone Dashboard (physical cube zones + initiative)
 *   3. Landscape Powers & Combat (precomputed attack/damage, specials tray)
 * Optional Equipment / Summons modules print only when `includeModules` is set.
 * Quick Play remains a separate one-page layout (`layout: 'compact'`).
 *
 * Power blocks show each power as a "tile" (Plättchen): a phase label
 * (Movement / Active / Reaction) plus an empty check-box meaning
 * "may be used once per round".
 */
/**
 * Short table-sheet blurb for a Stone Power (Quick Play style).
 * Linear tiers → "+N per Tier"; irregular → values listed at the end.
 */
export declare function summarizeStonePowerPrint(power: {
    id?: string;
    name?: string;
    description?: string;
    tiers?: {
        label?: string;
        description?: string;
        value?: number;
    }[];
}): string;
/** Options for the printable character sheet. */
export interface CharacterPrintOptions {
    /**
     * When true, seed Guard / Evade / Counterattack onto the battle page
     * (same universal options as radial / Reaction Window).
     * Defaults to true for the table sheet (layout `full`).
     */
    includeStandardManeuvers?: boolean;
    /**
     * When true, also seed Basic Attack into Active / Attack Actions.
     * Defaults to false on the table sheet — frees a card slot for powers.
     */
    showBasicAttack?: boolean;
    /**
     * Append optional Equipment (+ Summons when bound) module pages after the
     * three core table pages. Default false — those are personal/table refs.
     */
    includeModules?: boolean;
    /** One-page Quick Play view of the same character data. */
    layout?: 'full' | 'compact';
    /**
     * Ink theme for the full table sheet. Quick Play stays dark by design.
     * Default: `light` (white paper). `dark` matches the Quick Play charcoal look.
     */
    theme?: 'light' | 'dark';
}
/**
 * Build the flat data object consumed by `character-print.hbs`.
 */
export declare function buildCharacterPrintContext(actor: any, options?: CharacterPrintOptions): Record<string, unknown>;
type CompactDefenseRow = {
    label?: string;
    detail?: string;
    value?: number | null;
    display?: string;
};
/**
 * Compact source line for Evade / Armor from live breakdown rows.
 * Skips empty / zero / "—" rows; renames MR base rows to "Base N".
 */
export declare function formatCompactDefenseSources(rows: CompactDefenseRow[] | null | undefined): string;
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
export declare function characterPrintBodyClass(options?: CharacterPrintOptions): string;
export declare function openCharacterPrintSheet(actor: any, options?: CharacterPrintOptions): Promise<void>;
export {};
//# sourceMappingURL=character-print.d.ts.map