/**
 * Per-combat Passive charge pools for Critical and Maximization.
 *
 * Separate from Active Buff Critical (per Round) and Vitality Stone Maximization.
 * Granted at combat start from the slotted Passive Power Level; expire at combat end.
 */
export declare const PASSIVE_CRIT_FLAG = "passiveCriticalCharges";
export declare const PASSIVE_MAX_FLAG = "passiveMaximizationCharges";
export declare const PASSIVE_CRITICAL_TEMPLATE_ID = "passive-critical";
export declare const PASSIVE_MAXIMIZATION_TEMPLATE_ID = "passive-maximization";
export declare const PASSIVE_ARMOR_REDUCTION_TEMPLATE_ID = "passive-armor-reduction";
interface CombatChargeFlag {
    combatId: string;
    granted: number;
    remaining: number;
}
/** Highest Power Level of a slotted Passive matching templateId (0 if none). */
export declare function slottedPassiveLevel(actor: any, templateId: string): number;
/** Owned (not necessarily slotted) Passive level — used for catalogue tests. */
export declare function ownedPassiveLevel(actor: any, templateId: string): number;
export declare function passiveCriticalChargesForLevel(level: number): number;
export declare function passiveMaximizationChargesForLevel(level: number): number;
export declare function getPassiveCriticalRemaining(actor: any, combat?: any): number;
export declare function getPassiveMaximizationRemaining(actor: any, combat?: any): number;
export declare function grantPassiveCombatCharges(actor: any, combat: any): Promise<void>;
export declare function spendPassiveCriticalCharge(actor: any, combat?: any): Promise<boolean>;
export declare function spendPassiveMaximizationCharge(actor: any, combat?: any): Promise<boolean>;
/** Pure helper for tests / sync spend on in-memory state. */
export declare function applyPassiveCriticalSpend(flag: CombatChargeFlag | null | undefined): CombatChargeFlag | null;
export declare function clearPassiveCombatChargesForCombat(combat: any): Promise<void>;
export {};
//# sourceMappingURL=passive-combat-charges.d.ts.map