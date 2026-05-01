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
export function applyOverdrive(alloc: ClashAllocation): { attack: number; defense: number } {
    const sealed = Math.max(0, Math.floor(alloc.sealed ?? 0));
    const sa = Math.max(0, Math.floor(alloc.sealedAttack ?? 0));
    const sd = Math.max(0, Math.floor(alloc.sealedDefense ?? 0));
    // The runtime is forgiving: if the user doesn't split the sealed
    // count, default the bonus to Attack (the more common allocation).
    let attackBonus = 0;
    let defenseBonus = 0;
    if (sa + sd === sealed && sealed > 0) {
        attackBonus = sa * 4;
        defenseBonus = sd * 4;
    } else {
        attackBonus = sealed * 4;
    }
    return {
        attack: alloc.attack + attackBonus,
        defense: alloc.defense + defenseBonus,
    };
}

/**
 * Resolve a single attack: returns the Overhang (≥ 0) the defender
 * suffers as Vitality loss.
 */
export function resolveAttack(attacker: ClashAllocation, defender: ClashAllocation): ResolvedAttackResult {
    const a = applyOverdrive(attacker);
    const d = applyOverdrive(defender);
    const overhang = Math.max(0, a.attack - d.defense);
    return {
        attackerId: attacker.id,
        defenderId: defender.id,
        effectiveAttack: a.attack,
        effectiveDefense: d.defense,
        overhang,
    };
}

/**
 * Group Strike (Players Guide 10192–10200): sum up Attack Stones from
 * multiple attackers and resolve against a single target. Only the lead
 * attacker's Special would apply (carried in metadata, not enforced
 * here).
 */
export function resolveGroupStrike(
    attackers: ClashAllocation[],
    defender: ClashAllocation,
): ResolvedAttackResult {
    if (attackers.length === 0) {
        return {
            attackerId: '(none)',
            defenderId: defender.id,
            effectiveAttack: 0,
            effectiveDefense: applyOverdrive(defender).defense,
            overhang: 0,
        };
    }
    const totalAttack = attackers
        .map(applyOverdrive)
        .reduce((sum, a) => sum + a.attack, 0);
    const d = applyOverdrive(defender);
    const lead = attackers[0];
    return {
        attackerId: lead.id,
        defenderId: defender.id,
        effectiveAttack: totalAttack,
        effectiveDefense: d.defense,
        overhang: Math.max(0, totalAttack - d.defense),
    };
}

/**
 * Players Guide 10202–10210: maximum number of defenders that may
 * combine their Defense Stones into a Shared Defense.
 */
export const SHARED_DEFENSE_MAX_DEFENDERS = 3;

export interface SharedDefenseResult {
    /** Total Defense Stones contributed by the group. */
    totalDefense: number;
    /** Vitality damage that broke through after pooled Defense. */
    overhang: number;
    /** Per-defender Vitality loss after splitting the Overhang as evenly as possible. */
    losses: { defenderId: string; vitalityLoss: number }[];
    /** Defenders ignored because they exceeded the 3-defender cap. */
    ignoredDefenders: string[];
}

/**
 * Shared Defense (Players Guide 10202–10210): pool D Stones from up to 3
 * defenders against a single attack. Remaining Overhang is divided as
 * evenly as possible.
 */
export function resolveSharedDefense(
    incomingAttack: number,
    defenders: ClashAllocation[],
): SharedDefenseResult {
    const cap = SHARED_DEFENSE_MAX_DEFENDERS;
    const active = defenders.slice(0, cap);
    const ignored = defenders.slice(cap).map((d) => d.id);

    const totalDefense = active
        .map(applyOverdrive)
        .reduce((sum, d) => sum + d.defense, 0);
    const overhang = Math.max(0, Math.floor(incomingAttack) - totalDefense);

    // Even-split with the remainder going to the first defenders in order.
    const losses: { defenderId: string; vitalityLoss: number }[] = [];
    if (overhang > 0 && active.length > 0) {
        const base = Math.floor(overhang / active.length);
        let remainder = overhang - base * active.length;
        for (const d of active) {
            const extra = remainder > 0 ? 1 : 0;
            if (extra) remainder -= 1;
            losses.push({ defenderId: d.id, vitalityLoss: base + extra });
        }
    } else {
        for (const d of active) losses.push({ defenderId: d.id, vitalityLoss: 0 });
    }

    return { totalDefense, overhang, losses, ignoredDefenders: ignored };
}

/**
 * Regeneration rate for a combatant after considering Overdrive.
 * Players Guide 10221: each Sealed Stone reduces regen by 1; floor at 1.
 */
export function regenAfterOverdrive(masteryRank: number, sealedThisRound: number): number {
    const mr = Math.max(1, Math.floor(Number(masteryRank) || 1));
    const sealed = Math.max(0, Math.floor(Number(sealedThisRound) || 0));
    return Math.max(1, mr - sealed);
}
