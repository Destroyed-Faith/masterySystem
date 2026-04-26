/**
 * Threatened Ranged (Mastery System tactical rule)
 *
 * If you declare a ranged weapon attack while at least one hostile can reach you with their melee,
 * the attack is Threatened: disadvantage on the attack roll; after declaring, hostiles in YOUR
 * melee reach may spend a Reaction for an Opportunity Attack against you.
 *
 * Powers/spells only use this rule if flagged (tag `threatened-ranged` or system.threatenedRanged).
 */
import type { RadialCombatOption } from "../token-radial-menu";
/** Distance between token centers in meters (grid-aware when possible). */
export declare function distanceBetweenTokensMeters(a: any, b: any): number;
/** Melee reach in meters for this actor (2m base + weapon reach bonus). */
export declare function getActorMeleeReachMeters(actor: any): number;
/** True when `other` is treated as hostile to `attackerToken` (disposition-based). */
export declare function tokenIsHostileTo(attackerToken: any, other: any): boolean;
/**
 * True if this attack uses the Threatened Ranged rule set (bow/crossbow/thrown declaration).
 * Ranged *powers* only count if explicitly flagged (`threatened-ranged` tag or system.threatenedRanged),
 * so spell-like attacks do not automatically provoke the weapon rule.
 */
export declare function usesThreatenedRangedWeaponRules(actor: any, option: RadialCombatOption): boolean;
/** Hostile is standing close enough that their melee could reach the shooter. */
export declare function enemyThreatensRangedShooter(shooterToken: any, enemyToken: any): boolean;
export declare function findThreateningEnemyTokenIds(shooterToken: any): string[];
/** Hostiles within the shooter's melee reach (may spend Reaction for OA vs shooter). */
export declare function findOpportunityEnemyTokenIds(shooterToken: any): string[];
export interface ThreatenedRangedResult {
    appliesRule: boolean;
    threatened: boolean;
    threateningEnemyTokenIds: string[];
    opportunityEnemyTokenIds: string[];
    rollDisadvantage: boolean;
}
export declare function evaluateThreatenedRanged(shooterToken: any, option: RadialCombatOption): ThreatenedRangedResult;
//# sourceMappingURL=threatened-ranged.d.ts.map