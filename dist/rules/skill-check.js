/**
 * Ordinary Skill Check helpers (DF 2026-10-24 — GM-defined checks).
 *
 * GM defines: task, Attribute, Specialization/Untrained, Base TN.
 * Player declares only Paid Raises before rolling.
 * Free Raises unlock on success; effects allocate on the result chat card.
 */
import { clampPaidRaises, finalSkillTn, getSkillRaiseAllowance, paidRaiseSelectOptions, skillCheckSuccessRaiseBudget, validatePaidRaisesDeclaration, validateSkillRaiseEffectAllocation, emptySkillRaiseEffectAllocation, } from './skill-raises.js';
import { SPEC_ATTRIBUTE_KEYS, findSpecializationById, findSpecializationByName, readSpecializations, } from './specialization-roll.js';
import { PERCEPTION_FOCUS_ATTRIBUTES, isCharacterPerceptionSpec, isPerceptionFocusAttribute, normalizeSpecializationName, } from './specializations.js';
import { findSituationalSkillById, readSituationalSkills, } from './npc-situational-skills.js';
/** Universal free starting Perception acts as Rank 2 when no Spec is present. */
export const UNIVERSAL_PERCEPTION_RANK = 2;
/** Re-export Focus options for dialogs / tests. */
export { PERCEPTION_FOCUS_ATTRIBUTES, isPerceptionFocusAttribute };
export function isSpecAttributeKey(value) {
    return SPEC_ATTRIBUTE_KEYS.includes(value);
}
export function taskLevelFromBaseTn(baseTn) {
    const tn = Math.max(0, Math.floor(Number(baseTn) || 0));
    return Math.max(1, Math.round(tn / 4) || 1);
}
export function baseTnPresets() {
    return [4, 8, 12, 16, 20, 24, 28, 32];
}
export function skillRefKey(ref) {
    if (ref.kind === 'specialization')
        return `specialization:${ref.id}`;
    if (ref.kind === 'npc-situational')
        return `npc-situational:${ref.id}`;
    return ref.kind;
}
export function skillRefsEqual(a, b) {
    return skillRefKey(a) === skillRefKey(b);
}
/** Resolve Perception Rank: Spec named Perception if present, else universal Rank 2. */
export function resolvePerceptionRank(system) {
    const specs = readSpecializations(system);
    const found = findSpecializationByName(specs, 'Perception');
    if (found)
        return Math.max(0, Math.floor(Number(found.rank) || 0));
    return UNIVERSAL_PERCEPTION_RANK;
}
export function resolveSkillForDraft(system, skill, npcSituational) {
    if (skill.kind === 'untrained') {
        return { name: 'Untrained', rank: 0, spec: null, trained: false };
    }
    if (skill.kind === 'npc-situational' || npcSituational) {
        const snap = npcSituational ??
            (() => {
                const s = findSituationalSkillById(readSituationalSkills(system), skill.kind === 'npc-situational' ? skill.id : '');
                return s
                    ? {
                        skillId: s.id,
                        skillName: s.name,
                        poolDice: s.poolDice,
                        skillRank: s.skillRank,
                    }
                    : null;
            })();
        if (!snap) {
            return { name: 'Unknown', rank: 0, spec: null, trained: false };
        }
        return {
            name: snap.skillName,
            rank: snap.skillRank,
            spec: null,
            trained: snap.skillRank > 0,
        };
    }
    if (skill.kind === 'perception') {
        const specs = readSpecializations(system);
        const found = findSpecializationByName(specs, 'Perception');
        const rank = found ? found.rank : UNIVERSAL_PERCEPTION_RANK;
        return {
            name: 'Perception',
            rank,
            spec: found,
            trained: rank > 0,
        };
    }
    const specs = readSpecializations(system);
    const spec = findSpecializationById(specs, skill.id);
    if (!spec) {
        return { name: 'Unknown', rank: 0, spec: null, trained: false };
    }
    return { name: spec.name, rank: spec.rank, spec, trained: spec.rank > 0 };
}
function normalizeBaseTn(raw) {
    const n = Number(raw);
    if (!Number.isFinite(n))
        return Number.NaN;
    return Math.max(0, Math.floor(n));
}
/** Pull immutable GM-defined fields from the source — never trust mutable draft mirrors. */
export function authoritativeCheckContext(draft) {
    const src = draft.source;
    if (src.kind === 'gm-request') {
        return {
            taskDescription: String(src.taskDescription || ''),
            attributeKey: String(src.attributeKey || ''),
            baseTn: normalizeBaseTn(src.baseTn),
            skill: src.skill,
            gmVerified: true,
            sourceKind: 'gm-request',
            requestId: src.requestId,
            ...(src.allowedSkills?.length ? { allowedSkills: src.allowedSkills } : {}),
        };
    }
    return {
        taskDescription: String(src.taskDescription || ''),
        attributeKey: String(src.attributeKey || ''),
        baseTn: normalizeBaseTn(src.baseTn),
        skill: src.skill,
        gmVerified: false,
        sourceKind: 'sheet-verbal',
    };
}
/** Apply a GM request assignment onto a draft (Paid Raises preserved). */
export function bindDraftToGmRequest(draft, assignment) {
    return {
        ...draft,
        skill: assignment.skill,
        attributeKey: assignment.attributeKey,
        baseTn: Math.max(0, Math.floor(Number(assignment.baseTn) || 0)),
        taskDescription: assignment.taskDescription,
        source: {
            kind: 'gm-request',
            requestId: assignment.requestId,
            requestMessageId: assignment.requestMessageId,
            gmVerified: true,
            taskDescription: assignment.taskDescription,
            attributeKey: assignment.attributeKey,
            baseTn: Math.max(0, Math.floor(Number(assignment.baseTn) || 0)),
            skill: assignment.skill,
            ...(assignment.allowedSkills?.length
                ? { allowedSkills: assignment.allowedSkills }
                : {}),
        },
    };
}
/**
 * Reject client-side overrides of GM-locked fields.
 * Only `paidRaises` may differ from the authoritative assignment.
 */
export function validateAgainstGmAssignment(draft, assignment) {
    const ctx = authoritativeCheckContext(draft);
    if (ctx.sourceKind !== 'gm-request') {
        return { ok: false, error: 'Expected a GM request source.' };
    }
    if (String(ctx.attributeKey) !== String(assignment.attributeKey)) {
        return { ok: false, error: 'Attribute override rejected — GM assignment is authoritative.' };
    }
    if (Math.floor(Number(ctx.baseTn)) !== Math.floor(Number(assignment.baseTn))) {
        return { ok: false, error: 'Base TN override rejected — GM assignment is authoritative.' };
    }
    const allowed = assignment.allowedSkills?.length
        ? assignment.allowedSkills
        : [assignment.skill];
    const skillOk = allowed.some((s) => skillRefsEqual(s, ctx.skill));
    if (!skillOk) {
        return {
            ok: false,
            error: 'Skill override rejected — not in the GM-approved set for this request.',
        };
    }
    // Also reject forged mirrors on the draft object itself
    if (String(draft.attributeKey) !== String(assignment.attributeKey)) {
        return { ok: false, error: 'Draft Attribute does not match GM assignment.' };
    }
    if (Math.floor(Number(draft.baseTn)) !== Math.floor(Number(assignment.baseTn))) {
        return { ok: false, error: 'Draft Base TN does not match GM assignment.' };
    }
    if (!allowed.some((s) => skillRefsEqual(s, draft.skill))) {
        return { ok: false, error: 'Draft Skill does not match GM assignment.' };
    }
    return { ok: true };
}
export function missingGmContextFields(input) {
    const missing = [];
    if (!String(input.taskDescription || '').trim())
        missing.push('task');
    if (!input.npcSituational && !isSpecAttributeKey(String(input.attributeKey || ''))) {
        missing.push('attribute');
    }
    // Unset / NaN — never invent a default favourable TN
    if (input.baseTn == null || !Number.isFinite(Number(input.baseTn)))
        missing.push('baseTn');
    return missing;
}
/** Plan a Skill Check from a draft (pure; does not roll). */
export function planSkillCheckDraft(input) {
    const { system, draft } = input;
    const ctx = authoritativeCheckContext(draft);
    const emptyFail = (error, missing) => ({
        ok: false,
        error,
        ...(missing?.length ? { missing } : {}),
        trained: false,
        skillName: 'Unknown',
        rank: 0,
        allowance: getSkillRaiseAllowance(0),
        attributeKey: String(ctx.attributeKey || ''),
        attributeValue: 0,
        masteryRank: 1,
        baseTn: ctx.baseTn,
        taskDescription: ctx.taskDescription,
        paidRaises: 0,
        freeRaisesOnSuccess: 0,
        finalTn: ctx.baseTn,
        numDice: 0,
        keepDice: 1,
        rollDisadvantage: true,
        paidOptions: paidRaiseSelectOptions(0, ctx.baseTn || 0),
        showFreeBanner: false,
        gmVerified: ctx.gmVerified,
        sourceKind: ctx.sourceKind,
    });
    const isNpcSituational = !!draft.npcSituational || ctx.skill.kind === 'npc-situational';
    const missing = missingGmContextFields({
        taskDescription: ctx.taskDescription,
        attributeKey: ctx.attributeKey,
        baseTn: ctx.baseTn,
        npcSituational: isNpcSituational,
    });
    // sheet-verbal: require complete GM-announced context before rolling
    if (ctx.sourceKind === 'sheet-verbal' && missing.length) {
        return emptyFail(isNpcSituational
            ? `GM context incomplete: missing ${missing.join(', ')}. Record the GM-announced task and Base TN.`
            : `GM context incomplete: missing ${missing.join(', ')}. Record the GM-announced task, Attribute and Base TN.`, missing);
    }
    if (ctx.sourceKind === 'gm-request' &&
        !isNpcSituational &&
        (!ctx.attributeKey || !isSpecAttributeKey(ctx.attributeKey))) {
        return emptyFail('GM request is missing a valid Attribute.');
    }
    // If GM approved a limited set, skill must be in that set
    if (ctx.allowedSkills?.length && !ctx.allowedSkills.some((s) => skillRefsEqual(s, ctx.skill))) {
        return emptyFail('Selected Skill is not GM-approved for this check.');
    }
    let npcSnap = draft.npcSituational;
    if (ctx.skill.kind === 'npc-situational' && !npcSnap) {
        const s = findSituationalSkillById(readSituationalSkills(system), ctx.skill.id);
        if (s) {
            npcSnap = {
                skillId: s.id,
                skillName: s.name,
                poolDice: s.poolDice,
                skillRank: s.skillRank,
            };
        }
    }
    const resolved = resolveSkillForDraft(system, ctx.skill, npcSnap);
    if (input.requireKnownSkill &&
        ctx.skill.kind === 'specialization' &&
        !resolved.spec) {
        return emptyFail('Specialization not found on this character.');
    }
    if (input.requireKnownSkill &&
        ctx.skill.kind === 'npc-situational' &&
        !npcSnap) {
        return emptyFail('Situational skill not found on this NPC.');
    }
    const attrKey = isSpecAttributeKey(String(ctx.attributeKey))
        ? String(ctx.attributeKey)
        : isNpcSituational
            ? String(ctx.attributeKey || 'wits')
            : '';
    if (!isNpcSituational && !attrKey)
        return emptyFail('Invalid Attribute.');
    const isPerceptionCheck = ctx.skill.kind === 'perception' ||
        (resolved.spec != null && isCharacterPerceptionSpec(resolved.spec)) ||
        normalizeSpecializationName(resolved.name) === 'perception';
    if (isPerceptionCheck &&
        !isNpcSituational &&
        attrKey &&
        !isPerceptionFocusAttribute(attrKey)) {
        return emptyFail('Perception Checks use Attribute Focus Wits, Intellect, or Resolve only.');
    }
    const attributeValue = Math.max(0, Math.floor(Number(system?.attributes?.[attrKey]?.value) || 0));
    const masteryRank = Math.max(1, Math.floor(Number(system?.mastery?.rank) || 1));
    const baseTn = ctx.baseTn;
    const rank = resolved.rank;
    const allowance = getSkillRaiseAllowance(rank);
    const paidCheck = validatePaidRaisesDeclaration(rank, draft.paidRaises);
    const { paid: clampedPaid } = clampPaidRaises(rank, draft.paidRaises);
    let error = paidCheck.ok ? undefined : paidCheck.error;
    if (!resolved.trained && Math.floor(Number(draft.paidRaises) || 0) > 0) {
        error = 'Untrained rolls get 0 Raises.';
    }
    const paid = paidCheck.ok && !error ? paidCheck.paid : 0;
    const numDice = npcSnap
        ? Math.max(0, Math.floor(Number(npcSnap.poolDice) || 0))
        : attributeValue;
    const keepDice = masteryRank;
    // Untrained PC Spec path uses Disadvantage; NPC situational Rank 0 is "no Raises", not Disadvantage.
    const rollDisadvantage = !isNpcSituational && !resolved.trained;
    return {
        ok: !error && paidCheck.ok,
        ...(error ? { error } : {}),
        trained: resolved.trained || isNpcSituational,
        skillName: resolved.name,
        rank,
        allowance,
        attributeKey: attrKey || 'wits',
        attributeValue,
        masteryRank,
        baseTn,
        taskDescription: ctx.taskDescription,
        paidRaises: paidCheck.ok && !error ? paid : clampedPaid,
        freeRaisesOnSuccess: allowance.maxFree,
        finalTn: paidCheck.ok && !error ? finalSkillTn(baseTn, paid) : finalSkillTn(baseTn, clampedPaid),
        numDice,
        keepDice,
        rollDisadvantage,
        paidOptions: paidRaiseSelectOptions(rank, baseTn),
        showFreeBanner: allowance.maxFree > 0,
        gmVerified: ctx.gmVerified,
        sourceKind: ctx.sourceKind,
    };
}
/** Build the post-roll snapshot payload stored on chat flags. */
export function buildSkillCheckResolvedSnapshot(input) {
    const { plan, actorId, source, rollTotal, success } = input;
    const budget = success
        ? skillCheckSuccessRaiseBudget(plan.rank, plan.paidRaises)
        : { available: 0, paid: plan.paidRaises, free: 0 };
    return {
        actorId,
        ...(source.kind === 'gm-request' ? { requestId: source.requestId } : {}),
        taskDescription: plan.taskDescription,
        skillName: plan.skillName,
        skillRankAtRoll: plan.rank,
        attributeKey: plan.attributeKey,
        attributeValue: plan.attributeValue,
        masteryRank: plan.masteryRank,
        numDice: plan.numDice,
        keepDice: plan.keepDice,
        baseTn: plan.baseTn,
        paidRaisesDeclared: plan.paidRaises,
        freeRaisesAvailableAtSuccess: budget.free,
        finalTn: plan.finalTn,
        rollTotal,
        success,
        allocationStatus: success && budget.available > 0 ? 'pending' : success ? 'finalized' : 'not-applicable',
        effectAllocation: emptySkillRaiseEffectAllocation(),
        proposedBenefit: '',
        sourceKind: source.kind,
        gmVerified: source.kind === 'gm-request' ? true : false,
    };
}
export function finalizeSkillCheckAllocation(snapshot, allocation, proposedBenefit, opts) {
    if (snapshot.allocationStatus === 'finalized') {
        return { ok: false, error: 'Raise allocation already finalized.', snapshot };
    }
    if (!snapshot.success || snapshot.allocationStatus === 'not-applicable') {
        return { ok: false, error: 'No Raise effects available for this result.', snapshot };
    }
    const budget = skillCheckSuccessRaiseBudget(snapshot.skillRankAtRoll, snapshot.paidRaisesDeclared);
    const check = validateSkillRaiseEffectAllocation(budget.available, allocation);
    if (!check.ok)
        return { ok: false, error: check.error, snapshot };
    void opts;
    return {
        ok: true,
        snapshot: {
            ...snapshot,
            effectAllocation: check.allocation,
            proposedBenefit: String(proposedBenefit ?? '').trim(),
            allocationStatus: 'finalized',
            freeRaisesAvailableAtSuccess: budget.free,
        },
    };
}
/** @deprecated Use authoritativeCheckContext — kept for older call sites. */
export function authoritativeBaseTn(draft) {
    return authoritativeCheckContext(draft).baseTn;
}
//# sourceMappingURL=skill-check.js.map