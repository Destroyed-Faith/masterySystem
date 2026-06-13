/**
 * Tower Wizard — categorized Change-Power picker.
 *
 * Modal dialog that mirrors the wizard steps: collapsible groups of cards
 * (and, for Active slots, the Offense-step pattern/Melee-Ranged layout).
 * Clicking a card/variant selects it immediately and closes the dialog.
 * Spell options stay in the review row beneath each Active.
 */
import type { CastingAttribute, SpellResolution } from '../../types/item.js';
import type { PowerGrantSpec } from '../../utils/power-item-builder.js';
import type { PackageGrantKey } from './tower-wizard-types.js';
export interface TowerWizardPowerPickerResult {
    templateId: string;
    special?: string | null;
    rank: number;
    isSpell?: boolean;
    castingAttribute?: CastingAttribute;
    spellResolution?: SpellResolution;
}
export declare function catalogPickerResultToGrantSpec(result: TowerWizardPowerPickerResult): PowerGrantSpec;
export declare function showTowerWizardPowerPicker(options: {
    grantKey: PackageGrantKey;
    roleLabel: string;
    excludeIdentityKeys: Set<string>;
    actorEchoKey?: string | null;
    currentTemplateId?: string;
    currentSpecial?: string | null;
}): Promise<TowerWizardPowerPickerResult | null>;
//# sourceMappingURL=tower-wizard-power-picker.d.ts.map