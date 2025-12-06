/**
 * Chat Card Templates for Mastery System
 * Creates beautiful, detailed chat cards for checks, attacks, and damage
 */
import type { RollKeepResult } from '../rolls/rollKeep';
import type { CheckData } from './checks';
import type { AttackData, AttackResult } from './attacks';
/**
 * Create chat card for a check (skill, attribute, save)
 */
export declare function createCheckChatCard(actor: any, checkData: CheckData, result: RollKeepResult): Promise<void>;
/**
 * Create chat card for an attack roll
 */
export declare function createAttackChatCard(attacker: any, attackData: AttackData, attackResult: AttackResult): Promise<void>;
/**
 * Create chat card for damage roll and application
 */
export declare function createDamageChatCard(attacker: any, target: any, item: any, damageResult: {
    rolls: number[];
    total: number;
    formula: string;
}, armor: number, penetration: number, effectiveArmor: number, dr: number, damageType: string, finalDamage: number): Promise<void>;
/**
 * Register chat card CSS and settings
 */
export declare function registerChatCardSettings(): void;
//# sourceMappingURL=chatCards.d.ts.map