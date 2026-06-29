/**
 * Skill spend helpers for Epic Mastery Roll overlay (mirrors chat skill-spend flow).
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
export function getSkillSpendOptions(actor, skillKey, rollResult, baseModifier = 0) {
    const system = actor.system;
    const skillRating = Number(system.skills?.[skillKey] ?? 0);
    const skillsSpent = Number(system.skillsSpent?.[skillKey] ?? 0);
    const remainingPool = Math.max(0, skillRating - skillsSpent);
    const MR = Number(system.mastery?.rank ?? 2);
    const diceTotal = rollResult.kept.reduce((sum, die) => sum + die, 0) + baseModifier;
    const stoneBonusRaises = Math.max(0, rollResult.stoneBonusRaises ?? 0);
    const fullRaiseSuccess = rollResult.raiseOutcome === 'full';
    const options = [];
    if (remainingPool >= MR) {
        const added = new Set();
        for (let amount = MR; amount <= remainingPool; amount += MR) {
            const newTotal = diceTotal + amount;
            const success = rollResult.tn > 0 ? newTotal >= rollResult.tn : true;
            const raises = rollResult.tn > 0 && success ? countMarginRaises(newTotal, rollResult.tn) : 0;
            const stoneExtra = fullRaiseSuccess && stoneBonusRaises > 0 ? stoneBonusRaises : 0;
            options.push({
                amount,
                newTotal,
                success,
                raises: raises + stoneExtra,
                label: String(amount),
            });
            added.add(amount);
        }
        if (!added.has(remainingPool)) {
            const newTotal = diceTotal + remainingPool;
            const success = rollResult.tn > 0 ? newTotal >= rollResult.tn : true;
            const raises = rollResult.tn > 0 && success ? countMarginRaises(newTotal, rollResult.tn) : 0;
            const stoneExtra = fullRaiseSuccess && stoneBonusRaises > 0 ? stoneBonusRaises : 0;
            options.push({
                amount: remainingPool,
                newTotal,
                success,
                raises: raises + stoneExtra,
                label: `All-in (${remainingPool})`,
            });
        }
    }
    return { remainingPool, skillRating, options };
}
export async function applySkillSpendToActor(actor, skillKey, amount) {
    const system = actor.system;
    const skillRating = Number(system.skills?.[skillKey] ?? 0);
    const currentSpent = Number(system.skillsSpent?.[skillKey] ?? 0);
    const newSpent = Math.min(skillRating, currentSpent + amount);
    await actor.update({ [`system.skillsSpent.${skillKey}`]: newSpent });
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