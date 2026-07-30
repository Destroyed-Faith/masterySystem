/**
 * Power Creation Dialog — Template-based (post-Trees).
 *
 * Three-stage filter:
 *   Stage 1: Category (Movement / Passive / Reaction / Active / Active Buff)
 *   Stage 2: Subfamily (teleport / flight / damage-aoe / weapon-attack / …)
 *   Stage 3: Special + free-text search
 *     - Special dropdown lists every Special the current filter can resolve
 *       (blight, hex, prone, dread, disoriented, regeneration, disrupt, …)
 *       — Tier is NOT a player-facing search axis (Tier is an internal
 *       pricing bucket only).
 *     - Pure weapon/illusion Actives (no Special slot) surface via
 *       Category + Subfamily alone and ignore the Special filter.
 *
 * For Actives (category === 'active'), a Step 4 panel exposes the
 * "Make this a Spell?" toggle and the casting attribute (Intellect/Resolve).
 * Every Spell resolves as a Spell Attack (caster roll vs Casting TN / Evade);
 * saving throws were removed from the rules.
 */
import type { PowerCategory } from '../types/item.js';
/**
 * Show the template-based Power picker.
 */
export declare function showPowerCreationDialog(actor: Actor, options?: {
    presetCategory?: PowerCategory;
}): Promise<void>;
//# sourceMappingURL=character-sheet-power-dialog.d.ts.map