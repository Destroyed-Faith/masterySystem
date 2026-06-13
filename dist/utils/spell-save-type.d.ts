/**
 * Resolve spell save type from catalog entry / template metadata.
 */
import type { SpellSaveType } from '../types/item.js';
import { type CatalogEntry } from './power-catalog.js';
import type { PowerTemplate } from './powers/templates/index.js';
declare function spellSaveTypeFromSpecialSave(save: string | undefined): SpellSaveType | undefined;
export declare function resolveSpellSaveTypeForEntry(entry: CatalogEntry, template: PowerTemplate | undefined): SpellSaveType;
export { spellSaveTypeFromSpecialSave };
//# sourceMappingURL=spell-save-type.d.ts.map