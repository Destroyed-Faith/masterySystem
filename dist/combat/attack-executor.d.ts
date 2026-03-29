/**
 * Attack Executor
 * Creates melee/ranged attack chat cards with proper flags for the roll handler
 */
import type { RadialCombatOption } from "../token-radial-menu";
/**
 * Create a melee or ranged attack chat card with roll button (Threatened Ranged for qualifying ranged attacks).
 */
export declare function createAttackCard(attackerToken: any, targetToken: any, option: RadialCombatOption, attackType: "melee" | "ranged"): Promise<void>;
export declare function createMeleeAttackCard(attackerToken: any, targetToken: any, option: RadialCombatOption): Promise<void>;
export declare function createRangedAttackCard(attackerToken: any, targetToken: any, option: RadialCombatOption): Promise<void>;
//# sourceMappingURL=attack-executor.d.ts.map