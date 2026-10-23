/**
 * Core Ritual TN / Stone costs — DF Players Guide 2026-10-23.
 */
import { getSkillRaiseAllowance } from './skill-raises.js';
/** Base Ritual TN = 4 × max(3, taskLevel). Minimum 12. */
export function ritualBaseTn(taskLevel) {
    const level = Math.max(3, Math.floor(Number(taskLevel) || 3));
    return level * 4;
}
export function finalRitualTn(baseTn, paidRaises) {
    return Math.max(0, Math.floor(Number(baseTn) || 0))
        + Math.max(0, Math.floor(Number(paidRaises) || 0)) * 4;
}
/** Sealed Stones from total declared Raises (Paid + Free). Cap 3. */
export function ritualSealedStoneCost(totalRaises) {
    const total = Math.max(0, Math.min(8, Math.floor(Number(totalRaises) || 0)));
    if (total <= 1)
        return 1;
    if (total <= 3)
        return 2;
    return 3;
}
export const RITUAL_MAX_TOTAL_RAISES = 8;
export const RITUAL_MAX_NAMED_TIER = 4;
/** Free Raises a relevant Specialization contributes to a Ritual (Ranks 4/6/8). */
export function ritualFreeRaisesFromSpecialization(rank) {
    return getSkillRaiseAllowance(rank).maxFree;
}
export function planRitualRaises(opts) {
    const named = Math.max(0, Math.min(RITUAL_MAX_NAMED_TIER, Math.floor(Number(opts.namedTier) || 0)));
    const generic = Math.max(0, Math.floor(Number(opts.genericRaises) || 0));
    const total = named + generic;
    const freeCap = ritualFreeRaisesFromSpecialization(opts.specializationRank ?? 0);
    const free = Math.min(freeCap, total);
    const paid = total - free;
    const baseTn = ritualBaseTn(opts.taskLevel);
    if (total > RITUAL_MAX_TOTAL_RAISES) {
        return {
            namedTier: named,
            genericRaises: generic,
            freeRaises: free,
            paidRaises: paid,
            totalRaises: total,
            baseTn,
            finalTn: finalRitualTn(baseTn, paid),
            sealedStones: ritualSealedStoneCost(total),
            ok: false,
            error: `Ritual Raises cannot exceed ${RITUAL_MAX_TOTAL_RAISES}.`,
        };
    }
    return {
        namedTier: named,
        genericRaises: generic,
        freeRaises: free,
        paidRaises: paid,
        totalRaises: total,
        baseTn,
        finalTn: finalRitualTn(baseTn, paid),
        sealedStones: ritualSealedStoneCost(total),
        ok: true,
    };
}
//# sourceMappingURL=ritual-tn.js.map