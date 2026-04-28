/**
 * Power Creation Dialog — Template-based (post-Trees).
 *
 * Three-stage filter:
 *   Stage 1: Category (Movement / Passive / Reaction / Active / Active Buff)
 *   Stage 2: Subfamily (teleport / flight / damage-aoe / weapon-attack / …)
 *   Stage 3: Special + free-text search
 *     - Special dropdown lists every Special the current filter can resolve
 *       (poisoned, hex, prone, frightened, blinded, regeneration, shock, …)
 *       — Tier is NOT a player-facing search axis (Tier is an internal
 *       pricing bucket only).
 *     - Pure weapon/illusion Actives (no Special slot) surface via
 *       Category + Subfamily alone and ignore the Special filter.
 *
 * For Actives (category === 'active'), a Step 4 panel exposes the
 * "Make this a Spell?" toggle, the casting attribute (Intellect/Resolve),
 * and resolution (attack vs save). Save family for save spells is taken from
 * the chosen Special's data in `special-effects.ts`, then `spellHints.defaultSaveType`.
 */
import type { PowerCategory, SpellSaveType } from '../types/item.js';
import { type CatalogEntry } from '../utils/power-catalog.js';
import type { PowerTemplate } from '../utils/powers/templates/index.js';
/**
 * Save spell family: chosen Special first (Body/Mind/Spirit from effect ref),
 * else template `spellHints.defaultSaveType`, else Body.
 */
export declare function resolveSpellSaveTypeForEntry(entry: CatalogEntry, template: PowerTemplate | undefined): SpellSaveType;
/**
 * Show the template-based Power picker.
 */
export declare function showPowerCreationDialog(actor: Actor, options?: {
    presetCategory?: PowerCategory;
}): Promise<void>;
//# sourceMappingURL=character-sheet-power-dialog.d.ts.map