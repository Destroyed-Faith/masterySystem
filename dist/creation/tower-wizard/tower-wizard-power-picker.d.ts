/**
 * Tower Wizard — catalog power picker (filter by category, subfamily, special, search).
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