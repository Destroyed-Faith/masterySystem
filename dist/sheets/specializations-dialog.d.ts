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
    /**
     * Character creation / migration starter: Rank is fixed at 2, no Rank picker.
     * Adding is capped at five Specs.
     */
    fixedStartingRank?: boolean;
}): Promise<boolean>;
export declare function deleteSpecializationWithConfirm(actor: any, specId: string): Promise<boolean>;
export interface SpecializationRollChoice {
    attributeKey: string;
    taskLevel: number;
    paidRaises: number;
    /** Always 0 pre-roll — Free Raises unlock on success. Kept for API compat. */
    freeRaises: number;
}
/**
 * Sheet Skill Check entry — shared dialog; GM-announced context; Paid Raises only.
 */
export declare function promptSpecializationRollOptions(actor: any, spec: SpecializationRecord | null): Promise<SpecializationRollChoice | null>;
//# sourceMappingURL=specializations-dialog.d.ts.map