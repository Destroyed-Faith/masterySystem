/**
 * Group Ambush — one Stealth roll for the party vs observer Perception.
 *
 * Specialist rolls Attribute k MR with Skill Advantage / optional Skill Crit.
 * Pool is reduced by the *combined* Physical Skill penalties of every
 * participating character (armor + shields), including the specialist.
 */
import { stealthBeatsObserver } from '../rules/comparative-skill-check.js';
import { consumeSkillCritUse, findSpecializationByName, getSkillCritUsesRemaining, readSpecializations, skillAdvantageRerollMax, } from '../rules/index.js';
import { getEquippedPhysicalSkillPenaltyDice } from '../utils/equipment-modifiers.js';
import { getRulesMasteryRank } from '../utils/mastery-rank-sync.js';
export function sumGroupPhysicalSkillPenalties(participants) {
    const rows = [];
    let total = 0;
    for (const actor of participants) {
        if (!actor)
            continue;
        const penalty = Math.max(0, Math.floor(Number(getEquippedPhysicalSkillPenaltyDice(actor)) || 0));
        rows.push({
            actorId: String(actor.id ?? ''),
            name: String(actor.name ?? 'Unknown'),
            penalty,
        });
        total += penalty;
    }
    return { total, rows };
}
function resolveStealthSpec(actor) {
    const specs = readSpecializations(actor?.system);
    return (findSpecializationByName(specs, 'Stealth') ||
        findSpecializationByName(specs, 'Stealth & Infiltration') ||
        specs.find((s) => /stealth/i.test(s.name)) ||
        null);
}
/**
 * Plan the group's single Stealth pool.
 * `attributeKey` defaults to Agility (typical Stealth); callers may override.
 */
export function planGroupAmbushStealthPool(opts) {
    const specialist = opts.specialist;
    if (!specialist) {
        return {
            ok: false,
            error: 'No Stealth specialist selected.',
            attributeKey: 'agility',
            attributeValue: 0,
            masteryRank: 1,
            basePool: 0,
            combinedPenalty: 0,
            participantPenalties: [],
            finalPool: 0,
            keepDice: 1,
            skillRank: 0,
            skillAdvantageRerollMax: 0,
            skillCritTrackId: '',
            skillName: 'Stealth',
        };
    }
    const participants = Array.isArray(opts.participants) ? opts.participants.filter(Boolean) : [];
    if (!participants.some((a) => String(a.id) === String(specialist.id))) {
        participants.push(specialist);
    }
    const attrKey = String(opts.attributeKey || 'agility').toLowerCase();
    const attributeValue = Math.max(0, Math.floor(Number(specialist.system?.attributes?.[attrKey]?.value) || 0));
    const masteryRank = Math.max(1, Math.floor(Number(getRulesMasteryRank(specialist)) || 1));
    const spec = resolveStealthSpec(specialist);
    const skillRank = Math.max(0, Math.floor(Number(spec?.rank) || 0));
    const { total, rows } = sumGroupPhysicalSkillPenalties(participants);
    const finalPool = Math.max(0, attributeValue - total);
    const keepDice = Math.max(1, Math.min(finalPool || 1, masteryRank));
    return {
        ok: true,
        attributeKey: attrKey,
        attributeValue,
        masteryRank,
        basePool: attributeValue,
        combinedPenalty: total,
        participantPenalties: rows,
        finalPool,
        keepDice,
        skillRank,
        skillAdvantageRerollMax: skillAdvantageRerollMax(skillRank),
        skillCritTrackId: spec?.id || '',
        skillName: spec?.name || 'Stealth',
    };
}
/**
 * Execute Group Ambush: one Stealth roll, then compare vs each observer Perception total.
 * Observer Perception totals are provided by the caller (already rolled or GM-entered)
 * to avoid forcing UI in unit tests — live UI can roll Perception per observer.
 */
export async function executeGroupAmbushStealthRoll(opts) {
    const plan = planGroupAmbushStealthPool({
        specialist: opts.specialist,
        participants: opts.participants,
        attributeKey: opts.attributeKey,
    });
    if (!plan.ok)
        return { ok: false, error: plan.error, plan };
    let skillCritActive = false;
    if (opts.declareSkillCrit && plan.skillCritTrackId) {
        const remaining = getSkillCritUsesRemaining(opts.specialist, plan.skillCritTrackId, plan.skillRank);
        if (remaining <= 0) {
            return { ok: false, error: 'No Skill Crit uses remaining for Stealth today.', plan };
        }
        const spent = await consumeSkillCritUse(opts.specialist, plan.skillCritTrackId, plan.skillRank);
        if (!spent)
            return { ok: false, error: 'Failed to spend Skill Crit use.', plan };
        skillCritActive = true;
    }
    const rollDisadvantage = plan.skillRank <= 0;
    const flavor = `Group Ambush · ${plan.skillName} (Rank ${plan.skillRank}) · ` +
        `${plan.attributeKey} ${plan.basePool} − ${plan.combinedPenalty} combined armor/shield = ` +
        `${plan.finalPool}k${plan.keepDice}` +
        (skillCritActive ? ' · Skill Crit' : '');
    const { masteryRoll } = await import('../dice/roll-handler.js');
    const result = await masteryRoll({
        numDice: plan.finalPool,
        keepDice: plan.keepDice,
        skill: 0,
        tn: 0,
        normalTn: 0,
        raiseTn: 0,
        declaredRaiseSlots: 0,
        stoneBonusRaises: 0,
        freeRaisesAvailableAtSuccess: 0,
        raiseModel: 'skill',
        rollDisadvantage,
        skillAdvantageRerollMax: rollDisadvantage ? 0 : plan.skillAdvantageRerollMax,
        attackExplodeDiceOn78: skillCritActive,
        label: 'Group Ambush Stealth',
        flavor,
        actorId: String(opts.specialist.id),
        skillKey: 'stealth',
        isSkillRoll: true,
        rollKind: 'skill',
        poolAttribute: plan.attributeKey,
        applyPoolPenalties: false,
        skipChat: !!opts.skipChat,
    });
    const stealthTotal = Math.floor(Number(result?.total) || 0);
    const observerResults = (opts.observerPerceptionTotals || []).map((row) => {
        const perceptionTotal = Math.floor(Number(row.perceptionTotal) || 0);
        return {
            observerId: String(row.observer?.id ?? ''),
            observerName: String(row.observer?.name ?? 'Observer'),
            perceptionTotal,
            stealthWins: stealthBeatsObserver(stealthTotal, perceptionTotal),
        };
    });
    return { ok: true, plan, stealthTotal, observerResults };
}
//# sourceMappingURL=group-ambush.js.map