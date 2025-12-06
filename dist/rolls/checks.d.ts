/**
 * Check Workflow for Mastery System
 * Handles skill checks, attribute checks, and saves with TN and Raises
 */
import { type RollKeepResult } from '../rolls/rollKeep';
/**
 * Data for performing a check
 */
export interface CheckData {
    attribute: string;
    attributeValue: number;
    skill?: string;
    skillValue?: number;
    tn: number;
    declaredRaises?: number;
    advantage?: boolean;
    disadvantage?: boolean;
    situationalBonus?: number;
    label: string;
    flavor?: string;
}
/**
 * Perform a generic check (skill, attribute, save)
 * Shows a dialog for the player to declare Raises before rolling
 *
 * @param actor - The actor making the check
 * @param checkData - Check configuration
 * @returns Promise resolving when check is complete
 */
export declare function performCheck(actor: any, checkData: CheckData): Promise<RollKeepResult>;
/**
 * Show dialog to configure and perform a check
 * Allows player to set TN and declare Raises
 *
 * @param actor - The actor making the check
 * @param baseData - Base check configuration
 * @returns Promise resolving when check is complete
 */
export declare function performCheckWithDialog(actor: any, baseData: Partial<CheckData> & {
    attribute: string;
    label: string;
}): Promise<RollKeepResult | null>;
/**
 * Perform a quick check without dialog (for NPCs or automated checks)
 *
 * @param actor - The actor making the check
 * @param attribute - Attribute to use
 * @param tn - Target Number
 * @param label - Label for the check
 * @param skill - Optional skill to add
 * @param declaredRaises - Optional raises
 * @returns Roll result
 */
export declare function performQuickCheck(actor: any, attribute: string, tn: number, label: string, skill?: string, declaredRaises?: number): Promise<RollKeepResult>;
/**
 * Perform a saving throw
 *
 * @param actor - The actor making the save
 * @param saveType - 'body', 'mind', or 'spirit'
 * @param tn - Save TN (usually 12 * attacker's Mastery Rank)
 * @param label - Description of what they're saving against
 * @returns Roll result
 */
export declare function performSave(actor: any, saveType: 'body' | 'mind' | 'spirit', tn: number, label: string): Promise<RollKeepResult>;
//# sourceMappingURL=checks.d.ts.map