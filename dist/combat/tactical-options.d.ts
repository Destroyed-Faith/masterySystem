/**
 * Playtest tactical options (Core 2026-11-19):
 * - All-Out Attack (Prep declaration)
 * - Regular Attack Action Transfer (Prep grant → recipient spends on their Turn)
 * - Shared Intellect Free Raises helpers (range / perception)
 * Two-actor writes live in `teamwork-transactions.ts`.
 *
 * Provisional playtest: 20 m coordination range; All-Out Armor floor 0.
 */
import { type RoundState } from './action-economy.js';
/** Provisional playtest coordination range (meters). */
export declare const TACTICAL_COORDINATION_RANGE_M = 20;
/** Core: the Armor drawback may only be chosen with at least this much effective Armor. */
export declare const ALL_OUT_ARMOR_MIN = 4;
export type AllOutDefensePenalty = 'armor' | 'evade';
export type AllOutAttackState = {
    active: true;
    penalty: AllOutDefensePenalty;
};
export type AttackActionTransferState = {
    /** Donor actor id (owner of the surrendered base Action). */
    fromActorId: string;
    /** Recipient actor id. */
    toActorId: string;
    /** Prep grant recorded; recipient spends on their own Turn. */
    status: 'granted' | 'spent' | 'expired';
};
export declare function readAllOutAttack(rs: RoundState | null | undefined): AllOutAttackState | null;
export declare function allOutDamageBonusDice(rs: RoundState | null | undefined): number;
/**
 * All-Out dice for one Damage Roll. An explicit count from the damage card or a
 * reroll (including 0 for Special-only or Negation-stripped dice) wins; only a
 * missing count falls back to the live Round declaration.
 */
export declare function resolveAllOutDamageDice(explicit: unknown, specialOnly: boolean, liveRs: RoundState | null | undefined): number;
/** Effective Armor after All-Out −4 (floor 0). */
export declare function applyAllOutArmorPenalty(armor: number, rs: RoundState | null | undefined): number;
/** Effective Evade after All-Out −2 (floor 0). */
export declare function applyAllOutEvadePenalty(evade: number, rs: RoundState | null | undefined): number;
/**
 * Round state of the actor's economy owner, only when it belongs to the live
 * combat Round. A stale flag from an earlier Round or encounter returns null so
 * an expired All-Out drawback never lowers defenses.
 */
export declare function currentCombatRoundState(actor: any): RoundState | null;
export type AllOutDeclareResult = {
    ok: true;
    state: RoundState;
} | {
    ok: false;
    reason: 'armor-below-minimum';
    effectiveArmor: number;
};
export declare function declareAllOutAttack(actor: any, combat: Combat | null, penalty: AllOutDefensePenalty): Promise<AllOutDeclareResult>;
export declare function clearAllOutAttack(actor: any, combat: Combat | null): Promise<void>;
/** Distance in meters between two placed tokens (grid-aware when possible). */
export declare function tokenDistanceMeters(a: any, b: any): number | null;
export declare function actorsWithinCoordinationRange(donorToken: any, recipientToken: any, rangeM?: number): boolean;
/** Best-effort perceptibility: recipient not Hidden from donor's perspective. */
export declare function canPerceiveAlly(donorActor: any, recipientActor: any): boolean;
/**
 * Teamwork options only target allies. With placed tokens the token
 * dispositions must match; without tokens two player characters count as allies.
 */
export declare function areTeamworkAllies(a: any, b: any, tokens?: {
    aToken?: any;
    bToken?: any;
}): boolean;
/**
 * Prep: donor gives base Attack Action to recipient.
 * Recipient gains +1 donatedAttackActions (additive); donor locks base.
 * Without write access to the recipient the active GM records it.
 */
export declare function grantRegularAttackActionTransfer(donor: any, recipient: any, combat: Combat | null, opts?: {
    donorToken?: any;
    recipientToken?: any;
    skipRangeCheck?: boolean;
}): Promise<{
    ok: true;
} | {
    ok: false;
    reason: string;
}>;
/** Whether the actor's base Attack Action is locked because it was transferred. */
export declare function hasTransferredBaseAttack(rs: RoundState | null | undefined): boolean;
export declare function donorStillHasUsableAttacks(actor: any, combat: Combat | null): number;
//# sourceMappingURL=tactical-options.d.ts.map