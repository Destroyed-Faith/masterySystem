/**
 * NPC Print / Export
 *
 * Builds a print-friendly context from an `npc` actor and renders one A4 page
 * per boss phase (or a single page for phase-less NPCs). Opens a standalone
 * window that triggers `window.print()` (save as PDF).
 */
import type { AttackValue } from '../types/actor.js';
export type NpcPrintOptions = {
    /** Dense combat strip with precalculated attack lines (no skills/attributes). */
    layout?: 'full' | 'compact';
};
/**
 * One ready-to-play attack line: pool+keep, damage, range, flags, specials, ×/R.
 * Example: `Speer — 6k3 · 4d8 · Melee 3 m · ×2`
 */
export declare function formatNpcCompactAttackPlayLine(atk: AttackValue, opts: {
    masteryRank: number;
    castingTn: number;
    index?: number;
}): string;
/**
 * Build the flat data object consumed by `npc-print.hbs`.
 * One entry in `pages` per phase (or a single page without phases).
 */
export declare function buildNpcPrintContext(actor: any): Record<string, unknown>;
/**
 * Compact combat strip — precalculated attack lines, no skills/attributes.
 * One strip per boss phase (or a single strip for phase-less NPCs).
 */
export declare function buildNpcCompactPrintContext(actor: any): Record<string, unknown>;
/**
 * Render the printable NPC sheet and open it in a new window that triggers
 * the browser print dialog (save as PDF).
 */
export declare function openNpcPrintSheet(actor: any, options?: NpcPrintOptions): Promise<void>;
//# sourceMappingURL=npc-print.d.ts.map