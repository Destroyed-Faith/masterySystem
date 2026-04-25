/**
 * Power Creation Dialog — Template-based (post-Trees).
 *
 * Three-stage filter matching plan §4:
 *   Stage 1: Category (Movement / Passive / Reaction / Active / Active Buff)
 *   Stage 2: Subfamily (teleport / flight / damage-aoe / combined …)
 *   Stage 3: One of
 *     - Tier (3–6) + Special   [Actives only]
 *     - Template + free-text search     [everything else]
 *
 * For Actives (category === 'active'), a Step 4 panel exposes the
 * "Make this a Spell?" toggle, the casting attribute (Intellect/Resolve),
 * and — when the resolution is a saveSpell — the Save type (body/mind/spirit),
 * all pre-filled from the template's `spellHints`. See plan §6.3.
 */
import type { PowerCategory } from '../types/item.js';
/**
 * Show the template-based Power picker.
 */
export declare function showPowerCreationDialog(actor: Actor, options?: {
    presetCategory?: PowerCategory;
}): Promise<void>;
//# sourceMappingURL=character-sheet-power-dialog.d.ts.map