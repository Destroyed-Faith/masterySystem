/**
 * Specializations dialogs for the character sheet (DF Players Guide 2026-10-23).
 * Add / Edit / Delete a free-named Specialization and the pre-roll option picker.
 */
import { type SpecializationRecord } from '../rules/index.js';
/** Add (no `specId`) or edit a Specialization. Resolves true when saved. */
export declare function showSpecializationEditDialog(actor: any, opts?: {
    specId?: string;
    allowRankEdit?: boolean;
    /** Post-creation: a new Specialization is learned at Rank 1 for 4 XP instead of a free edit. */
    learnWithXp?: boolean;
}): Promise<boolean>;
export declare function deleteSpecializationWithConfirm(actor: any, specId: string): Promise<boolean>;
export interface SpecializationRollChoice {
    attributeKey: string;
    taskLevel: number;
    paidRaises: number;
    freeRaises: number;
}
/**
 * Pre-roll picker: Attribute (any of seven), Task Level, Paid / Free Raises.
 * `spec === null` means an untrained roll (0 Raises, Disadvantage).
 */
export declare function promptSpecializationRollOptions(actor: any, spec: SpecializationRecord | null): Promise<SpecializationRollChoice | null>;
//# sourceMappingURL=specializations-dialog.d.ts.map