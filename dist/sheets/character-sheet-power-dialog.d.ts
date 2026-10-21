/**
 * Power Creation Dialog — Template-based (post-Trees).
 *
 * Filter model:
 *   - Category (Movement / Passive / Reaction / Active / Active Buff)
 *   - Actives: Effect + Delivery (UI discovery) + Special + search
 *   - Active Buffs: no Kind filter — browse/search the final 18
 *   - Other categories: Kind (subfamily) + search (unchanged)
 *
 * For Actives, a Spell panel exposes "Cast this Active as a Spell?" and the
 * casting attribute (Intellect/Resolve). Spell Delivery uses a Casting Roll
 * against Final Spell TN (Spell Base TN + Spell Resistance).
 */
import type { PowerCategory } from '../types/item.js';
/**
 * Show the template-based Power picker.
 */
export declare function showPowerCreationDialog(actor: Actor, options?: {
    presetCategory?: PowerCategory;
}): Promise<void>;
//# sourceMappingURL=character-sheet-power-dialog.d.ts.map