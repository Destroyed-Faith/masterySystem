/**
 * Threatened Ranged (Mastery System tactical rule)
 *
 * If you declare a Ranged Attack / Ranged Power with a bow, crossbow, thrown weapon,
 * or similar while at least one enemy has you within THEIR melee reach, the attack is
 * Threatened: Disadvantage on the attack roll; after declaring, those enemies may
 * immediately spend a legal Reaction if they have one available.
 *
 * Powers/spells only use this rule if flagged (tag `threatened-ranged` or system.threatenedRanged).
 *
 * Console filter: `[MS Threatened Ranged]`
 */
import type { RadialCombatOption } from "../token-radial-menu";
/** Distance between token centers in meters (grid-aware when possible). */
export declare function distanceBetweenTokensMeters(a: any, b: any): number;
/**
 * Approximate edge-to-edge distance in meters (centers minus half-widths).
 * Melee reach should care about touching/engaging, not only center-to-center.
 */
export declare function distanceBetweenTokenEdgesMeters(a: any, b: any): number;
/**
 * Grid-neighbor fallback: true when tokens occupy adjacent squares (incl. diagonal),
 * accounting for multi-square tokens. Used when meter math is noisy.
 */
export declare function tokensAreGridAdjacent(a: any, b: any): boolean;
/** Melee reach in meters for this actor (2m base + weapon reach bonus). */
export declare function getActorMeleeReachMeters(actor: any): number;
/**
 * True for player combatants (characters / player-owned tokens).
 * Important: GM-controlled "Dummy" NPCs are often disposition FRIENDLY — we must
 * still treat them as opposing PCs for Threatened Ranged.
 */
export declare function isPlayerCombatantToken(token: any): boolean;
/**
 * True when `other` opposes `attackerToken` for Threatened Ranged.
 * PC ↔ NPC always counts, even when both tokens are marked Friendly.
 */
export declare function tokenIsHostileTo(attackerToken: any, other: any): boolean;
/**
 * True if this attack uses the Threatened Ranged rule set (bow/crossbow/thrown declaration).
 * Ranged *powers* only count if explicitly flagged (`threatened-ranged` tag or system.threatenedRanged),
 * so spell-like attacks do not automatically provoke the weapon rule.
 */
export declare function usesThreatenedRangedWeaponRules(actor: any, option: RadialCombatOption): boolean;
export interface ThreatScanRow {
    tokenId: string;
    name: string;
    disposition: number;
    isPlayerCombatant: boolean;
    hostile: boolean;
    centerDistM: number;
    edgeDistM: number;
    enemyReachM: number;
    gridAdjacent: boolean;
    threatens: boolean;
    skipReason?: string;
}
/** Hostile is standing close enough that their melee could reach the shooter. */
export declare function enemyThreatensRangedShooter(shooterToken: any, enemyToken: any): boolean;
export declare function scanThreateningEnemies(shooterToken: any): {
    threateningIds: string[];
    rows: ThreatScanRow[];
};
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
    /** Why the rule did / did not apply (for UI/debug). */
    debugReason?: string;
}
export declare function evaluateThreatenedRanged(shooterToken: any, option: RadialCombatOption): ThreatenedRangedResult;
//# sourceMappingURL=threatened-ranged.d.ts.map