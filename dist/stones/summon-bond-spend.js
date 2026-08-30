/**
 * Controlled spend helpers for the Summon Bond Ritual UI.
 * Purchase counts are never taken from free-text number fields.
 */
import { MAX_ARTIFACT_BONUS_TOKENS, MAX_PURCHASE_HARD_CAP, SUMMON_CAPS, computeSummonBond, emptyBodySpend, emptyBondSpend, isSummonSkillEligible, maxMovementPurchases, normalizeMovementMode, } from './summon-bond-rules.js';
const BOND_FIELD_COST = {
    attackPurchases: SUMMON_CAPS.attackTokenCost,
    damagePurchases: SUMMON_CAPS.damageTokenCost,
    movementPurchases: SUMMON_CAPS.movementTokenCost,
    extraAttackPurchases: SUMMON_CAPS.extraAttackTokenCost,
    skillDicePurchases: SUMMON_CAPS.skillDiceTokenCost,
    additionalBodies: SUMMON_CAPS.extraBodyTokenCost,
    specialValuePurchases: SUMMON_CAPS.specialValueTokenCost,
};
const BODY_FIELD_COST = {
    hpPurchases: SUMMON_CAPS.hpTokenCost,
    armorPurchases: SUMMON_CAPS.armorTokenCost,
    evadePurchases: SUMMON_CAPS.evadeTokenCost,
};
/** parseInt-safe: NaN, negative, Infinity, and non-numeric values become 0. */
export function safePurchaseInt(raw, max = MAX_PURCHASE_HARD_CAP) {
    let n;
    if (typeof raw === 'number') {
        n = raw;
    }
    else if (typeof raw === 'string') {
        const t = raw.trim();
        if (t === '')
            return 0;
        n = parseInt(t, 10);
    }
    else if (raw == null || raw === false) {
        return 0;
    }
    else {
        n = parseInt(String(raw), 10);
    }
    if (!Number.isFinite(n) || n < 0)
        return 0;
    return Math.min(max, Math.floor(n));
}
export function isAbsurdPurchaseRaw(raw, max = MAX_PURCHASE_HARD_CAP) {
    if (raw == null || raw === '')
        return false;
    if (typeof raw === 'number') {
        return !Number.isFinite(raw) || raw < 0 || raw > max;
    }
    if (typeof raw === 'string') {
        const t = raw.trim();
        if (t === '')
            return false;
        const n = parseInt(t, 10);
        return !Number.isFinite(n) || n < 0 || n > max;
    }
    const n = Number(raw);
    return !Number.isFinite(n) || n < 0 || n > max;
}
/** Artifact bonus is always a non-negative multiple of 4, capped. */
export function sanitizeBonusTokens(raw, maxBonus = MAX_ARTIFACT_BONUS_TOKENS) {
    const cap = Math.max(0, Math.floor(Number(maxBonus) || 0));
    const n = safePurchaseInt(raw, cap);
    const step = SUMMON_CAPS.artifactSummonTokensPerStone;
    return Math.floor(n / step) * step;
}
export function isIllegalBonusTokens(raw, maxBonus, boundStoneCount) {
    if (isAbsurdPurchaseRaw(raw, MAX_ARTIFACT_BONUS_TOKENS))
        return true;
    const n = typeof raw === 'number' ? raw : parseInt(String(raw ?? '0'), 10);
    if (!Number.isFinite(n) || n < 0)
        return true;
    if (n % SUMMON_CAPS.artifactSummonTokensPerStone !== 0)
        return true;
    if (n > maxBonus)
        return true;
    if (n > 0 && boundStoneCount < 1)
        return true;
    return false;
}
export function cloneSpend(spend) {
    return {
        attackPurchases: spend.attackPurchases,
        damagePurchases: spend.damagePurchases,
        movementPurchases: spend.movementPurchases,
        extraAttackPurchases: spend.extraAttackPurchases,
        specialAccess: !!spend.specialAccess,
        specialValuePurchases: spend.specialValuePurchases,
        skillDicePurchases: spend.skillDicePurchases,
        additionalBodies: spend.additionalBodies,
        bodies: (spend.bodies || []).map((b) => ({
            hpPurchases: b.hpPurchases,
            armorPurchases: b.armorPurchases,
            evadePurchases: b.evadePurchases,
            sharedSenses: [...(b.sharedSenses || [])],
            powerTokenCosts: [...(b.powerTokenCosts || [])],
        })),
    };
}
export function sanitizeSpendNumbers(spend) {
    const next = cloneSpend(spend);
    next.attackPurchases = safePurchaseInt(spend.attackPurchases);
    next.damagePurchases = safePurchaseInt(spend.damagePurchases);
    next.movementPurchases = safePurchaseInt(spend.movementPurchases);
    next.extraAttackPurchases = safePurchaseInt(spend.extraAttackPurchases);
    next.specialValuePurchases = safePurchaseInt(spend.specialValuePurchases);
    next.skillDicePurchases = safePurchaseInt(spend.skillDicePurchases);
    next.additionalBodies = safePurchaseInt(spend.additionalBodies);
    next.specialAccess = !!spend.specialAccess;
    const bodyCount = 1 + next.additionalBodies;
    const bodies = [];
    for (let i = 0; i < bodyCount; i++) {
        const b = spend.bodies?.[i] ?? emptyBodySpend();
        bodies.push({
            hpPurchases: safePurchaseInt(b.hpPurchases),
            armorPurchases: safePurchaseInt(b.armorPurchases),
            evadePurchases: safePurchaseInt(b.evadePurchases),
            sharedSenses: [...(b.sharedSenses || [])],
            powerTokenCosts: (b.powerTokenCosts || []).map((c) => safePurchaseInt(c)),
        });
    }
    next.bodies = bodies;
    return next;
}
export function maxAffordablePurchases(remainingTokens, costPer, hardCap) {
    if (costPer <= 0)
        return 0;
    return Math.min(hardCap, Math.floor(Math.max(0, remainingTokens) / costPer));
}
/** Max Skill Dice purchases from remaining tokens and selected-skill owner ratings. */
export function skillDicePurchaseCap(selectedSkills, ratings, remainingIfSkillPurchasesZero, ownerMasteryRank = 1) {
    const byTokens = Math.max(0, Math.floor(remainingIfSkillPurchasesZero));
    const eligible = (selectedSkills || []).filter((id) => isSummonSkillEligible(ratings?.[id] ?? 0, ownerMasteryRank));
    if (!eligible.length)
        return 0;
    const capacity = eligible.reduce((sum, id) => {
        return sum + safePurchaseInt(ratings?.[id] ?? 0, 99);
    }, 0);
    return Math.min(byTokens, Math.floor(capacity / SUMMON_CAPS.skillDicePerPurchase));
}
export function ruleMaxForBondField(field, ctx) {
    const mode = normalizeMovementMode(ctx.movementMode);
    switch (field) {
        case 'movementPurchases':
            return maxMovementPurchases(mode);
        case 'extraAttackPurchases':
            return SUMMON_CAPS.maxExtraAttackPurchases;
        case 'specialValuePurchases':
            return SUMMON_CAPS.maxSpecialValue - 1;
        case 'attackPurchases':
        case 'damagePurchases':
        case 'skillDicePurchases':
        case 'additionalBodies':
            return MAX_PURCHASE_HARD_CAP;
        default:
            return MAX_PURCHASE_HARD_CAP;
    }
}
function tokensRemainingFor(spend, ctx) {
    return computeSummonBond({
        boundStoneCount: ctx.boundStoneCount,
        bonusTokens: sanitizeBonusTokens(ctx.bonusTokens, ctx.maxBonusTokens ?? MAX_ARTIFACT_BONUS_TOKENS),
        movementMode: normalizeMovementMode(ctx.movementMode),
        spend: sanitizeSpendNumbers(spend),
    }).tokensRemaining;
}
export function applyBondFieldDelta(spend, field, delta, ctx) {
    if (delta !== 1 && delta !== -1)
        return null;
    const next = sanitizeSpendNumbers(spend);
    const cur = safePurchaseInt(next[field]);
    const nextVal = cur + delta;
    if (nextVal < 0)
        return null;
    if (field === 'specialValuePurchases' && !next.specialAccess)
        return null;
    const ruleMax = ruleMaxForBondField(field, ctx);
    if (nextVal > ruleMax)
        return null;
    if (field === 'skillDicePurchases' && delta > 0) {
        const without = { ...next, skillDicePurchases: 0 };
        const remainingIfZero = tokensRemainingFor(without, ctx);
        const cap = skillDicePurchaseCap(ctx.selectedSkills ?? [], ctx.ownerSkillRatings, remainingIfZero, ctx.ownerMasteryRank ?? 1);
        if (nextVal > cap)
            return null;
    }
    next[field] = nextVal;
    if (field === 'additionalBodies') {
        const bodyCount = 1 + nextVal;
        while (next.bodies.length < bodyCount)
            next.bodies.push(emptyBodySpend());
        next.bodies = next.bodies.slice(0, bodyCount);
    }
    if (tokensRemainingFor(next, ctx) < 0)
        return null;
    return next;
}
export function applyBodyFieldDelta(spend, bodyIndex, field, delta, ctx) {
    if (delta !== 1 && delta !== -1)
        return null;
    const next = sanitizeSpendNumbers(spend);
    const body = next.bodies[bodyIndex];
    if (!body)
        return null;
    const cur = safePurchaseInt(body[field]);
    const nextVal = cur + delta;
    if (nextVal < 0)
        return null;
    body[field] = nextVal;
    if (tokensRemainingFor(next, ctx) < 0)
        return null;
    return next;
}
export function applySkillDiceAllocDelta(alloc, skill, delta, ownerRating, purchasedTotal) {
    if (delta !== 1 && delta !== -1)
        return null;
    const next = { ...alloc };
    const cur = safePurchaseInt(next[skill]);
    const nextVal = cur + delta;
    if (nextVal < 0)
        return null;
    if (nextVal > safePurchaseInt(ownerRating))
        return null;
    let others = 0;
    for (const [id, dice] of Object.entries(next)) {
        if (id === skill)
            continue;
        others += safePurchaseInt(dice);
    }
    if (others + nextVal > safePurchaseInt(purchasedTotal))
        return null;
    next[skill] = nextVal;
    return next;
}
export function applyBonusTokenDelta(currentBonus, deltaStones, maxBonus, boundStoneCount) {
    if (deltaStones !== 1 && deltaStones !== -1)
        return null;
    if (boundStoneCount < 1 && deltaStones > 0)
        return null;
    const step = SUMMON_CAPS.artifactSummonTokensPerStone;
    const cur = sanitizeBonusTokens(currentBonus, MAX_ARTIFACT_BONUS_TOKENS);
    const next = cur + deltaStones * step;
    if (next < 0)
        return null;
    if (next > sanitizeBonusTokens(maxBonus, MAX_ARTIFACT_BONUS_TOKENS))
        return null;
    return next;
}
function collectPurchaseRaws(spend) {
    const raws = [
        spend.attackPurchases,
        spend.damagePurchases,
        spend.movementPurchases,
        spend.extraAttackPurchases,
        spend.specialValuePurchases,
        spend.skillDicePurchases,
        spend.additionalBodies,
    ];
    for (const b of spend.bodies || []) {
        raws.push(b.hpPurchases, b.armorPurchases, b.evadePurchases);
        for (const c of b.powerTokenCosts || [])
            raws.push(c);
    }
    return raws;
}
export function inspectBondSpend(spend, ctx) {
    const reasons = [];
    let absurd = false;
    for (const raw of collectPurchaseRaws(spend)) {
        if (isAbsurdPurchaseRaw(raw)) {
            absurd = true;
            break;
        }
    }
    if (absurd) {
        reasons.push('Illegal purchase values detected. Reset illegal purchases before applying the Bond Ritual.');
    }
    const sanitized = sanitizeSpendNumbers(spend);
    const mode = normalizeMovementMode(ctx.movementMode);
    if (sanitized.movementPurchases > maxMovementPurchases(mode)) {
        reasons.push(`Movement purchases ${sanitized.movementPurchases} exceed max ${maxMovementPurchases(mode)} for ${mode}.`);
    }
    if (sanitized.extraAttackPurchases > SUMMON_CAPS.maxExtraAttackPurchases) {
        reasons.push(`Extra Attack purchases ${sanitized.extraAttackPurchases} exceed max ${SUMMON_CAPS.maxExtraAttackPurchases}.`);
    }
    if (sanitized.specialValuePurchases > 0 && !sanitized.specialAccess) {
        reasons.push('Special Value requires Special Access.');
    }
    if (sanitized.specialValuePurchases > SUMMON_CAPS.maxSpecialValue - 1) {
        reasons.push(`Special Value purchases exceed max ${SUMMON_CAPS.maxSpecialValue - 1}.`);
    }
    const bonusMax = ctx.maxBonusTokens ?? MAX_ARTIFACT_BONUS_TOKENS;
    if (isIllegalBonusTokens(ctx.bonusTokens, bonusMax, ctx.boundStoneCount)) {
        reasons.push('Artifact bonus Tokens are illegal (must be a multiple of 4 from Artifact Summon Stones, and cannot create a Bond).');
    }
    if ((ctx.selectedSkills ?? []).length) {
        const withoutSkill = { ...sanitized, skillDicePurchases: 0 };
        const remainingIfZero = tokensRemainingFor(withoutSkill, ctx);
        const cap = skillDicePurchaseCap(ctx.selectedSkills ?? [], ctx.ownerSkillRatings, remainingIfZero, ctx.ownerMasteryRank ?? 1);
        if (sanitized.skillDicePurchases > cap) {
            reasons.push(`Skill Dice purchases ${sanitized.skillDicePurchases} exceed capacity ${cap}.`);
        }
    }
    const mr = ctx.ownerMasteryRank ?? 1;
    for (const skill of ctx.selectedSkills ?? []) {
        if (!isSummonSkillEligible(ctx.ownerSkillRatings?.[skill] ?? 0, mr)) {
            reasons.push(`${skill}: Owner has Rating 0 — the Bond cannot select this Skill.`);
        }
    }
    if (ctx.skillDiceAlloc) {
        for (const [skill, dice] of Object.entries(ctx.skillDiceAlloc)) {
            if (isAbsurdPurchaseRaw(dice)) {
                absurd = true;
                reasons.push(`Illegal skill dice allocation on ${skill}.`);
                continue;
            }
            const d = safePurchaseInt(dice);
            const rating = safePurchaseInt(ctx.ownerSkillRatings?.[skill] ?? 0);
            if (d > rating) {
                reasons.push(`${skill}: ${d} dice exceed owner Rating ${rating}.`);
            }
        }
    }
    const computed = computeSummonBond({
        boundStoneCount: ctx.boundStoneCount,
        bonusTokens: sanitizeBonusTokens(ctx.bonusTokens, bonusMax),
        movementMode: mode,
        spend: sanitized,
    });
    const overBudget = computed.tokensRemaining < 0;
    if (overBudget) {
        reasons.push(`Spent ${computed.tokensSpent} Tokens but only ${computed.tokensAvailable} available.`);
    }
    return {
        illegal: reasons.length > 0,
        reasons: [...new Set(reasons)],
        absurd,
        overBudget,
    };
}
/** Reset numeric purchases to 0. Keeps Special Access flag and first-body identity data. */
export function resetIllegalPurchases(spend) {
    const first = spend.bodies?.[0];
    const reset = emptyBondSpend(1);
    reset.specialAccess = !!spend.specialAccess;
    reset.bodies = [
        {
            hpPurchases: 0,
            armorPurchases: 0,
            evadePurchases: 0,
            sharedSenses: first ? [...(first.sharedSenses || [])] : [],
            powerTokenCosts: first ? [...(first.powerTokenCosts || [])] : [],
        },
    ];
    return reset;
}
export function bondStepperView(spend, field, ctx, effect) {
    const sanitized = sanitizeSpendNumbers(spend);
    const value = safePurchaseInt(sanitized[field]);
    return {
        field,
        value,
        cost: BOND_FIELD_COST[field],
        effect,
        canMinus: applyBondFieldDelta(sanitized, field, -1, ctx) != null,
        canPlus: applyBondFieldDelta(sanitized, field, 1, ctx) != null,
    };
}
export function bodyStepperView(spend, bodyIndex, field, ctx, effect) {
    const sanitized = sanitizeSpendNumbers(spend);
    const value = safePurchaseInt(sanitized.bodies[bodyIndex]?.[field] ?? 0);
    return {
        field,
        value,
        cost: BODY_FIELD_COST[field],
        effect,
        canMinus: applyBodyFieldDelta(sanitized, bodyIndex, field, -1, ctx) != null,
        canPlus: applyBodyFieldDelta(sanitized, bodyIndex, field, 1, ctx) != null,
        bodyIndex,
    };
}
/**
 * Count Artifact Summon Stones on the owner (equipped/owned artifact items).
 * Looks at explicit numeric fields and names matching "Summon Stone".
 */
export function countArtifactSummonStones(actor) {
    let n = 0;
    const actorExplicit = Number(actor?.system?.artifactSummonStones ?? actor?.flags?.['mastery-system']?.artifactSummonStones ?? 0);
    if (Number.isFinite(actorExplicit) && actorExplicit > 0) {
        n += Math.floor(actorExplicit);
    }
    const items = actor?.items ?? [];
    const list = typeof items.filter === 'function' ? items.filter(() => true) : Object.values(items);
    for (const item of list) {
        if (!item || item.type !== 'artifact')
            continue;
        const sys = item.system ?? {};
        const explicit = Number(sys.artifactSummonStones ?? sys.summonStones ?? sys.summonTokenGeneratorStones ?? 0);
        const flag = Number(item.flags?.['mastery-system']?.artifactSummonStones ?? 0);
        let added = 0;
        if (Number.isFinite(explicit) && explicit > 0)
            added += Math.floor(explicit);
        if (Number.isFinite(flag) && flag > 0)
            added += Math.floor(flag);
        const name = String(item.name ?? '');
        if (added <= 0 && /summon\s*stone/i.test(name)) {
            added += Math.max(1, safePurchaseInt(sys.quantity ?? 1, 16));
        }
        n += added;
    }
    return Math.min(n, Math.floor(MAX_ARTIFACT_BONUS_TOKENS / SUMMON_CAPS.artifactSummonTokensPerStone));
}
export function maxAssignableArtifactBonusTokens(actor, bondId, otherBonds) {
    const detected = countArtifactSummonStones(actor);
    const total = detected * SUMMON_CAPS.artifactSummonTokensPerStone;
    let usedElsewhere = 0;
    for (const b of otherBonds || []) {
        if (!b || b.id === bondId)
            continue;
        usedElsewhere += sanitizeBonusTokens(b.bonusTokens, total);
    }
    return Math.max(0, total - usedElsewhere);
}
//# sourceMappingURL=summon-bond-spend.js.map