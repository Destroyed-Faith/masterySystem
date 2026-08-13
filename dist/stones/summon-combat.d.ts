/**
 * Summon Bond combat enforcement (Players Guide Summons V2).
 *
 * - Multiple Bodies share one Summon Attack budget per Bond per Round.
 * - Bond Special applies at most once per Round.
 * - Summons cannot use Stones / Artifacts / unbought Powers.
 */
import { type SummonBondRecord, type SummonBodyRecord } from './summon-bond-bind.js';
export type SummonBondRoundUsage = {
    bondId: string;
    attacksUsed: number;
    specialApplied: boolean;
    reactionsUsed: number;
};
export declare function getSummonBondUsage(ownerActor: Actor, combat: Combat | null, bondId: string): SummonBondRoundUsage;
export declare function remainingSummonAttacks(ownerActor: Actor, combat: Combat | null, bond: SummonBondRecord): number;
export declare function spendSummonAttack(ownerActor: Actor, combat: Combat | null, bond: SummonBondRecord): Promise<{
    ok: boolean;
    reason?: string;
}>;
export declare function tryApplySummonBondSpecial(ownerActor: Actor, combat: Combat | null, bond: SummonBondRecord): Promise<{
    ok: boolean;
    reason?: string;
    specialKey?: string | null;
    specialValue?: number;
}>;
export declare function spendSummonBondReaction(ownerActor: Actor, combat: Combat | null, bond: SummonBondRecord): Promise<{
    ok: boolean;
    reason?: string;
}>;
/** Summon actors have no stone pools, artifacts, or power shopping outside Bond purchases. */
export declare function summonActorMayUseStonesOrArtifacts(actor: any): boolean;
export declare function bodyHasPurchasedPower(bond: SummonBondRecord, bodyId: string, templateId: string): boolean;
/** Extra bodies never increase the Bond attack budget by themselves. */
export declare function bondAttackBudgetFromBodies(bond: SummonBondRecord): number;
export type SummonBondContext = {
    owner: Actor;
    bond: SummonBondRecord;
    body: SummonBodyRecord;
};
/** Resolve Bond + owner from a summon body actor. */
export declare function resolveSummonBondContext(summonActor: any): SummonBondContext | null;
//# sourceMappingURL=summon-combat.d.ts.map