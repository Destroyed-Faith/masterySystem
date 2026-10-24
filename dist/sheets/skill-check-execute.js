/**
 * Shared execution path for ordinary Skill Checks (sheet + GM request).
 * Authoritative Attribute / Skill / Base TN come from the draft source.
 */
import { authoritativeCheckContext, buildSkillCheckResolvedSnapshot, findSpecializationById, planSkillCheckDraft, readSpecializations, validateAgainstGmAssignment, } from '../rules/index.js';
import { getEquippedPhysicalSkillPenaltyDice } from '../utils/equipment-modifiers.js';
import { getRulesMasteryRank } from '../utils/mastery-rank-sync.js';
export async function executeSkillCheck(opts) {
    const actor = opts.actor;
    if (!actor)
        return { ok: false, error: 'No actor.' };
    const system = actor.system ?? {};
    let draft = {
        ...opts.draft,
        actorId: String(actor.id ?? opts.draft.actorId),
    };
    // Re-apply authoritative source fields (ignore forged draft mirrors).
    const ctx = authoritativeCheckContext(draft);
    draft = {
        ...draft,
        skill: ctx.skill,
        attributeKey: ctx.attributeKey,
        baseTn: ctx.baseTn,
        taskDescription: ctx.taskDescription,
    };
    if (opts.gmAssignment) {
        const gate = validateAgainstGmAssignment(draft, opts.gmAssignment);
        if (!gate.ok)
            return { ok: false, error: gate.error };
        // Force assignment onto source + draft
        if (draft.source.kind === 'gm-request') {
            draft.source = {
                ...draft.source,
                attributeKey: opts.gmAssignment.attributeKey,
                baseTn: opts.gmAssignment.baseTn,
                skill: opts.gmAssignment.skill,
                ...(opts.gmAssignment.allowedSkills?.length
                    ? { allowedSkills: opts.gmAssignment.allowedSkills }
                    : {}),
            };
            draft.skill = opts.gmAssignment.skill;
            draft.attributeKey = opts.gmAssignment.attributeKey;
            draft.baseTn = opts.gmAssignment.baseTn;
        }
    }
    const plan = planSkillCheckDraft({ system, draft, requireKnownSkill: true });
    if (!plan.ok)
        return { ok: false, error: plan.error || 'Invalid Skill Check.' };
    let equipPenalty = 0;
    if (draft.skill.kind === 'specialization') {
        const spec = findSpecializationById(readSpecializations(system), draft.skill.id);
        if (spec?.field === 'physical') {
            equipPenalty = Math.max(0, Number(getEquippedPhysicalSkillPenaltyDice(actor)) || 0);
        }
    }
    const mr = getRulesMasteryRank(actor) || plan.masteryRank;
    const keepDice = Math.max(1, Math.floor(Number(mr) || plan.keepDice));
    const numDice = Math.max(0, plan.numDice - equipPenalty);
    const attrLabel = plan.attributeKey.charAt(0).toUpperCase() + plan.attributeKey.slice(1);
    const label = `${plan.skillName} Check`;
    const verified = plan.gmVerified ? ' · GM-verified request' : ' · GM-announced (local)';
    const freeInfo = plan.freeRaisesOnSuccess > 0
        ? ` · Free on success ${plan.freeRaisesOnSuccess}`
        : '';
    let flavor = `${plan.taskDescription ? `${plan.taskDescription} · ` : ''}${plan.skillName} (Rank ${plan.rank}) · ${attrLabel} ${plan.attributeValue}d8 keep ${keepDice} · Base TN ${plan.baseTn} · Paid ${plan.paidRaises} (+${plan.paidRaises * 4}) · Final TN ${plan.finalTn}${freeInfo}${verified}.`;
    if (plan.rollDisadvantage) {
        flavor = `${plan.taskDescription ? `${plan.taskDescription} · ` : ''}Untrained · ${attrLabel} ${plan.attributeValue}d8 keep ${keepDice} with Disadvantage · Base TN ${plan.baseTn} · Final TN ${plan.finalTn} · 0 Raises${verified}.`;
    }
    if (equipPenalty > 0) {
        flavor += ` Equipped armor/shield physical penalty: −${equipPenalty}d8.`;
    }
    if (opts.flavorExtra)
        flavor += ` ${opts.flavorExtra}`;
    const normalizedName = plan.skillName.trim().toLowerCase();
    const { masteryRoll } = await import('../dice/roll-handler.js');
    const result = await masteryRoll({
        numDice,
        keepDice,
        skill: 0,
        tn: plan.baseTn,
        normalTn: plan.baseTn,
        raiseTn: plan.finalTn,
        declaredRaiseSlots: plan.paidRaises,
        stoneBonusRaises: 0,
        freeRaisesAvailableAtSuccess: plan.freeRaisesOnSuccess,
        raiseModel: 'skill',
        rollDisadvantage: plan.rollDisadvantage,
        label,
        flavor,
        actorId: String(actor.id),
        ...(normalizedName === 'stealth' ? { skillKey: 'stealth' } : {}),
        ...(normalizedName === 'perception' ? { skillKey: 'perception' } : {}),
        isSkillRoll: true,
        baseModifier: 0,
        rollKind: 'skill',
        poolAttribute: plan.attributeKey,
        applyPoolPenalties: true,
        autoFailIntent: 'skill',
        checkContext: {
            skillKey: normalizedName || undefined,
            ...(normalizedName === 'perception' ? { tags: ['sight'] } : {}),
        },
        skillCheckMeta: {
            source: draft.source,
            skillRankAtRoll: plan.rank,
            paidRaisesDeclared: plan.paidRaises,
            freeRaisesAvailableAtSuccess: plan.freeRaisesOnSuccess,
            skillName: plan.skillName,
            attributeKey: plan.attributeKey,
            taskDescription: plan.taskDescription,
            gmVerified: plan.gmVerified,
        },
    });
    const success = !!result?.success;
    const rollTotal = Number(result?.total) || 0;
    const snapshot = buildSkillCheckResolvedSnapshot({
        plan: { ...plan, keepDice, numDice },
        actorId: String(actor.id),
        source: draft.source,
        rollTotal,
        success,
    });
    return { ok: true, snapshot };
}
//# sourceMappingURL=skill-check-execute.js.map