/**
 * Attack Workflow for Mastery System
 * Handles attacks with weapons/powers, damage rolls, and condition application
 */
import { type RollKeepResult } from '../rolls/rollKeep';
/**
 * Data for performing an attack
 */
export interface AttackData {
    item: any;
    target: any;
    targetEvade: number;
    attribute: string;
    attributeValue: number;
    skill?: string;
    skillValue?: number;
    declaredRaises: number;
    advantage?: boolean;
    disadvantage?: boolean;
    situationalBonus?: number;
    baseDamage: string;
    damageType?: string;
    label: string;
    flavor?: string;
}
/**
 * Result of an attack (before damage)
 */
export interface AttackResult {
    roll: RollKeepResult;
    hit: boolean;
    totalRaises: number;
}
/**
 * Show dialog to configure and perform an attack
 * Player declares Raises before rolling
 *
 * @param attacker - The attacking actor
 * @param target - The target actor
 * @param item - The weapon/power/spell item
 * @returns Promise resolving when attack sequence is complete
 */
export declare function performAttackWithDialog(attacker: any, target: any, item: any): Promise<void>;
/**
 * Perform a complete attack sequence
 *
 * @param attacker - The attacking actor
 * @param attackData - Attack configuration
 */
export declare function performAttack(attacker: any, attackData: AttackData): Promise<void>;
//# sourceMappingURL=attacks.d.ts.map