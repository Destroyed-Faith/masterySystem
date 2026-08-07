/**
 * Threatened Ranged (Mastery System tactical rule)
 *
 * If you declare a Ranged Attack / Ranged Power with a bow, crossbow, thrown weapon,
 * or similar while at least one enemy has you within THEIR melee reach, the attack is
 * Threatened: Disadvantage on the attack roll; after declaring, those enemies may
 * immediately spend a legal Reaction if they have one available.
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
/**
 * Hostiles who have the shooter in THEIR melee reach — after a Threatened
 * Ranged declaration they may spend a Reaction (same set as threatening enemies).
 */
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