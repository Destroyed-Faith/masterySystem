/**
 * Divine Clash math — pure helpers for Vitality / Overhang / Overdrive
 * resolution.
 *
 * Source: Players Guide 10106–10260.
 *
 *   • Stone Types & Zones (10117–10135)
 *       – Vitality Stones (red): the combatant's HP. Reaching 0 ends the
 *         Clash for that combatant.
 *       – Power Stones: split between Ready / Exhausted / Sealed zones.
 *
 *   • Core Loop (10139–10148)
 *       1. Build Pool from Ready Power Stones.
 *       2. Allocate secretly into Attack (A) and Defense (D).
 *       3. Reveal simultaneously.
 *       4. Resolve A vs D → Vitality damage.
 *       5. Exhaust spent A/D Stones.
 *       6. Regenerate `Mastery Rank` Stones (Sealed Stones do NOT count).
 *
 *   • Attack & Defense (10152–10170)
 *       If `A > D`, the difference is **Overhang** → defender loses that
 *       many Vitality Stones. Otherwise no damage.
 *
 *   • Team Play (10190–10210)
 *       – Group Strike: pool A Stones from multiple attackers; only the
 *         lead attacker's Special applies.
 *       – Shared Defense: pool D Stones from up to 3 defenders. Vitality
 *         damage from remaining Overhang is split as evenly as possible.
 *
 *   • Overdrive (10214–10223)
 *       Permanently Seal Power Stones during allocation: each Sealed
 *       Stone grants +4 Attack OR +4 Defense this round.  Sealed Stones
 *       lower your regeneration rate (Mastery Rank − Sealed, never below
 *       1).
 */
export interface ClashAllocation {
    /** Combatant identifier (any string — actor id, name, …). */
    id: string;
    /** Power Stones allocated to Attack (A). */
    attack: number;
    /** Power Stones allocated to Defense (D). */
    defense: number;
    /** Power Stones permanently Sealed via Overdrive this round. */
    sealed?: number;
    /**
     * If `sealed > 0`, where the resulting +4 buckets go. The runtime
     * applies `+4 × sealedAttack` to A and `+4 × sealedDefense` to D
     * (sum must equal `sealed`).
     */
    sealedAttack?: number;
    sealedDefense?: number;
}
export interface ResolvedAttackResult {
    attackerId: string;
    defenderId: string;
    /** Effective Attack including Overdrive bonuses. */
    effectiveAttack: number;
    /** Effective Defense including Overdrive bonuses. */
    effectiveDefense: number;
    /** Difference A − D (≥ 0); Vitality damage applied to defender. */
    overhang: number;
}
/** Apply Overdrive bucketing → effective Attack / Defense for a clash slot. */
export declare function applyOverdrive(alloc: ClashAllocation): {
    attack: number;
    defense: number;
};
/**
 * Resolve a single attack: returns the Overhang (≥ 0) the defender
 * suffers as Vitality loss.
 */
export declare function resolveAttack(attacker: ClashAllocation, defender: ClashAllocation): ResolvedAttackResult;
/**
 * Group Strike (Players Guide 10192–10200): sum up Attack Stones from
 * multiple attackers and resolve against a single target. Only the lead
 * attacker's Special would apply (carried in metadata, not enforced
 * here).
 */
export declare function resolveGroupStrike(attackers: ClashAllocation[], defender: ClashAllocation): ResolvedAttackResult;
/**
 * Players Guide 10202–10210: maximum number of defenders that may
 * combine their Defense Stones into a Shared Defense.
 */
export declare const SHARED_DEFENSE_MAX_DEFENDERS = 3;
export interface SharedDefenseResult {
    /** Total Defense Stones contributed by the group. */
    totalDefense: number;
    /** Vitality damage that broke through after pooled Defense. */
    overhang: number;
    /** Per-defender Vitality loss after splitting the Overhang as evenly as possible. */
    losses: {
        defenderId: string;
        vitalityLoss: number;
    }[];
    /** Defenders ignored because they exceeded the 3-defender cap. */
    ignoredDefenders: string[];
}
/**
 * Shared Defense (Players Guide 10202–10210): pool D Stones from up to 3
 * defenders against a single attack. Remaining Overhang is divided as
 * evenly as possible.
 */
export declare function resolveSharedDefense(incomingAttack: number, defenders: ClashAllocation[]): SharedDefenseResult;
/**
 * Regeneration rate for a combatant after considering Overdrive.
 * Players Guide 10221: each Sealed Stone reduces regen by 1; floor at 1.
 */
export declare function regenAfterOverdrive(masteryRank: number, sealedThisRound: number): number;
//# sourceMappingURL=divine-clash-math.d.ts.map