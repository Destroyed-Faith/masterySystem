/**
 * One-time v0.9.9 Attribute respec, then a separate Stone dialog.
 * Postponing closes the dialog and leaves `needsV099Respec` set.
 *
 * Starting stays a free package (two 4s, two 3s, three 2s). The Apply button
 * stays disabled until that package is legal. Final is then raised with +
 * and − against the preserved Attribute XP. Stones are not on this form:
 * each unlocked box (Start, Start, 20, 40, …) is chosen afterwards.
 */
import { type AttributeKeyName } from './v099-rules.js';
export interface StoneChoice {
    kind: 'attribute' | 'colorless' | 'clear' | 'cancel';
    key?: AttributeKeyName;
    otherIndex?: number;
}
/** One click, one dialog: pick an Attribute, combine two boxes, or clear. */
export declare function openStoneSlotChoice(args: {
    label: string;
    attributeChoices: AttributeKeyName[];
    counts: Record<string, number>;
    colorless: boolean;
    colorlessHint: string;
    allowClear: boolean;
    partners: Array<{
        index: number;
        label: string;
    }>;
}): Promise<StoneChoice>;
export declare function openV099RespecDialog(actor: any): Promise<void>;
/** One-time Lifetime XP entry when earned XP cannot be reconstructed. Does not respec Attributes. */
export declare function openV099LifetimeDialog(actor: any): Promise<void>;
//# sourceMappingURL=v099-respec-dialog.d.ts.map