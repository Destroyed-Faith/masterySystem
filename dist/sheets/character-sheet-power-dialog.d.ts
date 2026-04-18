/**
 * Power Creation Dialog for Character Sheet
 *
 * Unified picker for Mastery Tree Powers and Spell School Powers.
 * The list is filterable by:
 *   - Category (Active, Active Buff, Movement, Reaction, Passive, Utility)
 *   - Tag (e.g. "spell") – only when Category = Active
 *   - Special (e.g. Ignite, Freeze, Shock, Penetration, …) – only when Category = Active
 *   - Free text search (name / tree / school)
 *
 * During character creation, every newly added power is stored at rank 1.
 */
import type { PowerCategory } from '../types/item.js';
/**
 * Show the unified power creation dialog.
 *
 * @param actor - The actor to add a power to.
 * @param options - Optional preset for the category filter (e.g. when called from "Add Reaction").
 */
export declare function showPowerCreationDialog(actor: Actor, options?: {
    presetCategory?: PowerCategory;
}): Promise<void>;
//# sourceMappingURL=character-sheet-power-dialog.d.ts.map