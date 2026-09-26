/**
 * Read-only XP account. Explains Lifetime XP against spendable XP and
 * recorded spending. Does not write actor data.
 */
import { LEGACY_MARTIAL_SKILL_KEYS } from '../migrations/martial-skills-refund-migration.js';
import { expandHistoryRows } from '../utils/xp-history.js';
function num(value) {
    const n = Math.floor(Number(value) || 0);
    return n > 0 ? n : 0;
}
export function explainXpAccount(actor) {
    const system = actor?.system ?? {};
    const xp = system.xp ?? {};
    const points = system.points ?? {};
    const storedLife = system.progression?.lifetimeXp;
    const lifetimeXp = typeof storedLife === 'number' && Number.isFinite(storedLife)
        ? Math.max(0, Math.floor(storedLife))
        : null;
    const lifetimeSource = String(system.progression?.lifetimeXpSource || (lifetimeXp == null ? 'unknown' : 'stored'));
    const totalEarned = num(xp.totalEarned);
    const freeEarned = num(xp.freeEarned);
    const totalGranted = totalEarned + freeEarned;
    const spendableRegular = num(points.xp);
    const spendableFree = num(points.xpFree);
    const spendable = spendableRegular + spendableFree;
    const spentRegular = num(xp.totalSpent);
    const spentFree = num(xp.freeSpent);
    const spent = spentRegular + spentFree;
    const historySpend = {
        attribute: 0,
        skill: 0,
        power: 0,
        artifact: 0,
        other: 0,
    };
    let martialXpRefund = num(system.progression?.martialSkillsRefund?.xpRefund);
    const legacy = new Set(LEGACY_MARTIAL_SKILL_KEYS);
    for (const row of expandHistoryRows(xp.history)) {
        const bucket = historySpend[row.category] != null ? row.category : 'other';
        if (row.signedAmount < 0)
            historySpend[bucket] += -row.signedAmount;
        if (row.category === 'skill' && legacy.has(String(row.key || '')) && row.signedAmount > 0) {
            martialXpRefund += row.signedAmount;
        }
    }
    const earnedGap = totalGranted - (spendable + spent);
    const lifetimeGap = lifetimeXp == null ? null : lifetimeXp - totalGranted;
    const lines = [
        `Total XP Granted / Lifetime XP: ${lifetimeXp == null ? 'unknown' : lifetimeXp} (source: ${lifetimeSource})`,
        `Earned counters: regular ${totalEarned} + free ${freeEarned} = ${totalGranted}`,
        `Currently spendable XP: ${spendable} (regular ${spendableRegular} + free ${spendableFree})`,
        `Spent counters: regular ${spentRegular} + free ${spentFree} = ${spent}`,
        'Known history spending:',
        `Attributes: ${historySpend.attribute}`,
        `Skills: ${historySpend.skill}`,
        `Powers: ${historySpend.power}`,
        `Artifacts: ${historySpend.artifact}`,
        `Other: ${historySpend.other}`,
        `Refunds:`,
        `Removed Martial Skills: +${martialXpRefund}`,
        `Earned minus spendable minus spent: ${earnedGap}`,
        `Lifetime minus earned counters: ${lifetimeGap == null ? 'n/a' : lifetimeGap}`,
    ];
    return {
        lifetimeXp,
        lifetimeSource,
        totalEarned,
        freeEarned,
        totalGranted,
        spendableRegular,
        spendableFree,
        spendable,
        spentRegular,
        spentFree,
        spent,
        historySpend,
        martialXpRefund,
        earnedGap,
        lifetimeGap,
        text: lines.join('\n'),
    };
}
//# sourceMappingURL=xp-consistency.js.map