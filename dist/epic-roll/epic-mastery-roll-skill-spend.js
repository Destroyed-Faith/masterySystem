/**
 * Skill spend helpers for Epic Mastery Roll overlay.
 * DF 2026: Skill Spend is retired — option builders return empty / no-op.
 */
import { countMarginRaises } from '../dice/roll-handler.js';
/** Distribute remaining skill pool across four MR-sized packets (skill sheet style). */
export function buildSkillSpendPackets(remainingPool, masteryRank) {
    const MR = Math.max(1, Math.floor(masteryRank) || 1);
    let left = Math.max(0, remainingPool);
    const packets = [];
    for (let index = 0; index < 4; index++) {
        const amount = Math.min(MR, left);
        left -= amount;
        packets.push({
            index,
            amount,
            clickable: amount > 0,
        });
    }
    return packets;
}
export function sumSelectedPacketSpend(packets, selected) {
    return packets.reduce((sum, pkt, i) => sum + (selected[i] && pkt.clickable ? pkt.amount : 0), 0);
}
/**
 * @deprecated DF 2026-10-23: post-roll Skill Spend is retired.
 * Always returns no options so Epic Roll never offers spend UI.
 */
export function getSkillSpendOptions(_actor, _skillKey, _rollResult, _baseModifier = 0) {
    return { remainingPool: 0, skillRating: 0, options: [] };
}
/** @deprecated DF 2026 — Skill Spend retired; does nothing. */
export async function applySkillSpendToActor(_actor, _skillKey, _amount) {
    console.info('Mastery System | applySkillSpendToActor is deprecated (DF 2026: Skill Spend retired).');
}
export function totalsAfterSkillSpend(rollResult, spendAmount, baseModifier = 0) {
    const diceSum = rollResult.kept.reduce((sum, die) => sum + die, 0);
    const skill = spendAmount;
    const total = diceSum + skill + baseModifier;
    let success = rollResult.success;
    let raises = rollResult.raises ?? 0;
    if (rollResult.tn > 0) {
        success = total >= rollResult.tn;
        raises = success ? countMarginRaises(total, rollResult.tn) : 0;
        const stoneBonusRaises = Math.max(0, rollResult.stoneBonusRaises ?? 0);
        if (success && rollResult.raiseOutcome === 'full' && stoneBonusRaises > 0) {
            raises += stoneBonusRaises;
        }
    }
    return { total, success, raises, skill };
}
//# sourceMappingURL=epic-mastery-roll-skill-spend.js.map