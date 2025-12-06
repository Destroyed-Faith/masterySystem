/**
 * Buff Duration & Limits System for Mastery System
 *
 * Rules:
 * - Active Buffs last 2-6 rounds
 * - Max 1 Buff of same type active at once
 * - Cannot reactivate until expired
 * - Tracked per actor
 */
/**
 * Buff types (categories that cannot stack)
 */
export declare enum BuffType {
    ATTACK = "attack",// Attack bonuses
    DEFENSE = "defense",// Defense/Evade bonuses
    DAMAGE = "damage",// Damage bonuses
    MOVEMENT = "movement",// Speed/movement bonuses
    ATTRIBUTE = "attribute",// Attribute bonuses
    RESISTANCE = "resistance",// Damage resistance
    REGENERATION = "regeneration",// Healing over time
    CUSTOM = "custom"
}
/**
 * Active buff data
 */
export interface ActiveBuff {
    id: string;
    name: string;
    type: BuffType;
    duration: number;
    maxDuration: number;
    effect: string;
    sourceItem?: string;
    appliedRound: number;
    effects: BuffEffect[];
}
/**
 * Buff effect (similar to passive effects)
 */
export interface BuffEffect {
    type: 'flat' | 'dice' | 'flag';
    target: string;
    value: number | string;
    condition?: string;
}
/**
 * Get all active buffs for an actor
 */
export declare function getActiveBuffs(actor: any): ActiveBuff[];
/**
 * Check if actor has a buff of a specific type
 */
export declare function hasBuffType(actor: any, buffType: BuffType): boolean;
/**
 * Get buff of a specific type
 */
export declare function getBuffByType(actor: any, buffType: BuffType): ActiveBuff | null;
/**
 * Apply a buff to an actor
 * Validates that no buff of same type is active
 */
export declare function applyBuff(actor: any, buffData: Omit<ActiveBuff, 'id' | 'appliedRound' | 'duration'>): Promise<boolean>;
/**
 * Remove a buff from an actor
 */
export declare function removeBuff(actor: any, buffId: string): Promise<void>;
/**
 * Update buff durations at start of round
 * Called by combat hooks
 */
export declare function updateBuffDurations(actor: any): Promise<void>;
/**
 * Get all buff effects for stat calculations
 * Similar to passive effects but from active buffs
 */
export declare function getActiveBuffEffects(actor: any): BuffEffect[];
/**
 * Apply buff effects to a stat calculation
 */
export declare function applyBuffEffects(actor: any, target: string, baseValue: number): number;
/**
 * Get buff dice bonuses for rolls
 */
export declare function getBuffDiceBonus(actor: any, rollType: string): number;
/**
 * Check if actor has a specific buff flag
 */
export declare function hasBuffFlag(actor: any, flagName: string): boolean;
/**
 * Clear all buffs from an actor (e.g., at end of combat)
 */
export declare function clearAllBuffs(actor: any): Promise<void>;
//# sourceMappingURL=buffs.d.ts.map