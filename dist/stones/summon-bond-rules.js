/**
 * Summons V2 — universal Summon Bond rules (Players Guide / agent.md v0.9.8).
 *
 * Tokens = Bound Stones × 8 (first stone included).
 * One Movement Mode (Flying 4–16 m; Walking/Swimming 8–16 m). Bond- vs Body-scoped upgrades.
 * No Familiar / Companion / Host chassis.
 */
export const SUMMON_MOVEMENT_MODES = [
    { value: 'walking', label: 'Walking', baseM: 8, maxM: 16 },
    { value: 'flying', label: 'Flying', baseM: 4, maxM: 16 },
    { value: 'swimming', label: 'Swimming', baseM: 8, maxM: 16 },
];
/** Base movement meters for a mode (Flying starts lower). */
export function baseMovementM(mode) {
    const m = normalizeMovementMode(mode);
    return m === 'flying' ? 4 : 8;
}
/** Max +2 m purchases until the 16 m cap. */
export function maxMovementPurchases(mode) {
    const base = baseMovementM(mode);
    return Math.max(0, Math.floor((SUMMON_CAPS.maxMovementM - base) / SUMMON_CAPS.movementGainM));
}
/** Collapse retired modes (e.g. Climbing) onto Walking. */
export function normalizeMovementMode(mode) {
    const t = String(mode || '').toLowerCase();
    if (t === 'flying' || t === 'fly')
        return 'flying';
    if (t === 'swimming' || t === 'swim')
        return 'swimming';
    return 'walking';
}
export const SHARED_SENSE_GROUPS = [
    { value: 'sight', label: 'Sight' },
    { value: 'hearing', label: 'Hearing' },
    { value: 'tasteSmell', label: 'Taste / Smell' },
    { value: 'touchPressure', label: 'Touch / Pressure' },
];
/** Approved Summon Skills only (PG). */
export const SUMMON_SKILL_IDS = [
    'perception',
    'investigation',
    'tracking',
    'survival',
    'navigation',
    'weatherSense',
    'stealth',
    'concealment',
    'athletics',
    'acrobatics',
];
export const BASE_SUMMON = {
    hp: 10,
    armor: 0,
    evade: 4,
    attackDice: 2,
    damageDice: 1,
    movementM: 8,
    summonAttacks: 1,
};
export const SUMMON_CAPS = {
    maxMovementM: 16,
    /** Total Summon Attacks per Bond per Round (1 base + Extra Attack purchases). */
    maxSummonAttacks: 3,
    /** Extra Attack purchases (each +1 Attack). 1 + 2 = 3 total. */
    maxExtraAttackPurchases: 2,
    maxSpecialValue: 4,
    /** Normal Bound Stone → Summon Tokens (Players Guide). */
    tokensPerStone: 8,
    /**
     * Artifact Summon Token Generator (`Rules/artefacts.md`):
     * each Artifact Summon Stone → 4 bonus Tokens for an existing Bond.
     * These are not Bound Stones and cannot create a Bond.
     */
    artifactSummonTokensPerStone: 4,
    extraBodyTokenCost: 2,
    sharedSenseTokenCost: 2,
    skillDiceTokenCost: 1,
    skillDicePerPurchase: 2,
    extraAttackTokenCost: 8,
    specialAccessTokenCost: 4,
    specialValueTokenCost: 2,
    hpTokenCost: 1,
    hpGain: 20,
    armorTokenCost: 2,
    armorGain: 4,
    evadeTokenCost: 2,
    evadeGain: 4,
    attackTokenCost: 2,
    attackDiceGain: 2,
    damageTokenCost: 2,
    damageDiceGain: 1,
    movementTokenCost: 1,
    movementGainM: 2,
};
/** Bonus Tokens from N Artifact Summon Stones (not Bound Stones). */
export function artifactSummonBonusTokens(artifactSummonStoneCount) {
    const n = Math.max(0, Math.floor(Number(artifactSummonStoneCount) || 0));
    return n * SUMMON_CAPS.artifactSummonTokensPerStone;
}
/** Eligible numeric Specials for Summon Bond Special Access (attack Specials). */
export const SUMMON_ELIGIBLE_SPECIALS = [
    { id: 'challenge', label: 'Challenge' },
    { id: 'blight', label: 'Blight' },
    { id: 'corrode', label: 'Corrode' },
    { id: 'disoriented', label: 'Disoriented' },
    { id: 'expose', label: 'Expose' },
    { id: 'hex', label: 'Hex' },
    { id: 'lacerate', label: 'Lacerate' },
    { id: 'mark', label: 'Mark' },
    { id: 'ruin', label: 'Ruin' },
    { id: 'slow', label: 'Slow' },
    { id: 'soulburn', label: 'Soulburn' },
    { id: 'sundered', label: 'Sundered' },
    { id: 'weaken', label: 'Weaken' },
    { id: 'root', label: 'Root' },
];
export function summonTokensFromStones(boundStoneCount, bonusTokens = 0) {
    const stones = Math.max(0, Math.floor(Number(boundStoneCount) || 0));
    const bonus = Math.max(0, Math.floor(Number(bonusTokens) || 0));
    return stones * SUMMON_CAPS.tokensPerStone + bonus;
}
/** Minimum owner Rating for a Summon Skill: MR × 2. */
export function summonSkillMinRating(ownerMasteryRank) {
    const mr = Math.max(1, Math.floor(Number(ownerMasteryRank) || 1));
    return mr * 2;
}
/** Owner skill cap: MR × 4. */
export function summonSkillMaxRating(ownerMasteryRank) {
    const mr = Math.max(1, Math.floor(Number(ownerMasteryRank) || 1));
    return mr * 4;
}
/** A skill is eligible only if the owner Rating is at least MR × 2. */
export function isSummonSkillEligible(ownerRating, ownerMasteryRank) {
    const rating = Math.max(0, Math.floor(Number(ownerRating) || 0));
    return rating >= summonSkillMinRating(ownerMasteryRank);
}
/** Selected skill slots by Bound Stones (bonus tokens do not increase this). */
export function summonSkillSlots(boundStoneCount) {
    const stones = Math.max(0, Math.floor(Number(boundStoneCount) || 0));
    if (stones <= 0)
        return 0;
    if (stones === 1)
        return 2;
    if (stones === 2)
        return 3;
    return 4;
}
/** Max Power Level by owner Mastery Rank. */
export function maxSummonPowerLevel(ownerMasteryRank) {
    const mr = Math.max(1, Math.floor(Number(ownerMasteryRank) || 1));
    if (mr <= 2)
        return 4;
    if (mr === 3)
        return 8;
    if (mr === 4)
        return 12;
    return 16;
}
/** Power Token Cost = ceil(PP / 10). Purchased powers have a minimum of 1 Token. */
export function powerTokenCostFromPp(pp) {
    const n = Math.max(0, Math.floor(Number(pp) || 0));
    if (n <= 0)
        return 0;
    return Math.max(1, Math.ceil(n / 10));
}
/** Standard reference costs when PP is not available. */
export function standardPowerTokenCost(powerType, powerLevel, movementPp) {
    const lvl = Math.max(1, Math.min(16, Math.floor(Number(powerLevel) || 1)));
    switch (powerType) {
        case 'active':
            return 3 * lvl;
        case 'passive':
        case 'reaction':
            return 2 * lvl;
        case 'activeBuff':
            return 3 * lvl + 1;
        case 'movement':
            return powerTokenCostFromPp(movementPp ?? 0);
        default:
            return 0;
    }
}
export function legacyMovementTypeToMode(raw) {
    return normalizeMovementMode(raw);
}
export function classifyBondStatus(opts) {
    if (opts.hardErrors.length)
        return 'invalidUntilFixed';
    if (opts.overBudget)
        return 'overBudget';
    if (opts.needsRedistribution)
        return 'needsRitual';
    return 'valid';
}
export const BOND_STATUS_LABEL = {
    valid: 'Valid',
    needsRitual: 'Needs Ritual',
    overBudget: 'Over Budget',
    invalidUntilFixed: 'Invalid Until Fixed',
};
export function emptyBodySpend() {
    return {
        hpPurchases: 0,
        armorPurchases: 0,
        evadePurchases: 0,
        sharedSenses: [],
        powerTokenCosts: [],
    };
}
/** Hard sanity cap — no purchase field may exceed this even with huge token pools. */
export const MAX_PURCHASE_HARD_CAP = 99;
/** Artifact bonus Tokens hard cap (16 Artifact Summon Stones × 4). */
export const MAX_ARTIFACT_BONUS_TOKENS = 64;
function floorPurchase(raw) {
    const n = typeof raw === 'number' ? raw : parseInt(String(raw ?? ''), 10);
    if (!Number.isFinite(n) || n < 0)
        return 0;
    return Math.min(MAX_PURCHASE_HARD_CAP, Math.floor(n));
}
function sanitizeBonusForCompute(raw) {
    if (raw == null || raw === '')
        return { bonus: 0, illegal: false };
    const n = typeof raw === 'number' ? raw : parseInt(String(raw), 10);
    if (!Number.isFinite(n) || n < 0 || n > MAX_ARTIFACT_BONUS_TOKENS) {
        return { bonus: 0, illegal: true };
    }
    const stepped = Math.floor(Math.floor(n) / SUMMON_CAPS.artifactSummonTokensPerStone) * SUMMON_CAPS.artifactSummonTokensPerStone;
    return { bonus: stepped, illegal: n % SUMMON_CAPS.artifactSummonTokensPerStone !== 0 };
}
export function computeSummonBond(opts) {
    const errors = [];
    const warnings = [];
    const stones = Math.max(0, Math.floor(Number(opts.boundStoneCount) || 0));
    const bonusInfo = sanitizeBonusForCompute(opts.bonusTokens);
    if (bonusInfo.illegal) {
        errors.push('Artifact bonus Tokens must be a non-negative multiple of 4 and cannot be an arbitrary value.');
    }
    if (bonusInfo.bonus > 0 && stones < 1) {
        errors.push('Artifact bonus Tokens cannot create a Bond. Bind at least one Bound Stone.');
    }
    const available = summonTokensFromStones(stones, stones < 1 ? 0 : bonusInfo.bonus);
    const spend = opts.spend;
    let tokensSpent = 0;
    const add = (n) => {
        tokensSpent += n;
    };
    const attackPurchases = floorPurchase(spend.attackPurchases);
    const damagePurchases = floorPurchase(spend.damagePurchases);
    const movementPurchases = floorPurchase(spend.movementPurchases);
    const extraAttackPurchases = floorPurchase(spend.extraAttackPurchases);
    const specialValuePurchases = floorPurchase(spend.specialValuePurchases);
    const skillDicePurchases = floorPurchase(spend.skillDicePurchases);
    const additionalBodies = floorPurchase(spend.additionalBodies);
    const bondCore = attackPurchases * SUMMON_CAPS.attackTokenCost +
        damagePurchases * SUMMON_CAPS.damageTokenCost +
        movementPurchases * SUMMON_CAPS.movementTokenCost +
        extraAttackPurchases * SUMMON_CAPS.extraAttackTokenCost;
    const specialTokens = (spend.specialAccess ? SUMMON_CAPS.specialAccessTokenCost : 0) +
        specialValuePurchases * SUMMON_CAPS.specialValueTokenCost;
    const skillTokens = skillDicePurchases * SUMMON_CAPS.skillDiceTokenCost;
    const extraBodyTokens = additionalBodies * SUMMON_CAPS.extraBodyTokenCost;
    add(bondCore);
    add(specialTokens);
    add(skillTokens);
    add(extraBodyTokens);
    const bodyCount = 1 + additionalBodies;
    const bodySpends = [];
    for (let i = 0; i < bodyCount; i++) {
        bodySpends.push(spend.bodies[i] ? { ...spend.bodies[i] } : emptyBodySpend());
    }
    const bodyTokens = [];
    const bodies = bodySpends.map((b) => {
        const hpP = floorPurchase(b.hpPurchases);
        const arP = floorPurchase(b.armorPurchases);
        const evP = floorPurchase(b.evadePurchases);
        const senses = Array.from(new Set(b.sharedSenses || []));
        const powerCosts = (b.powerTokenCosts || []).map((c) => floorPurchase(c));
        const powerTokens = powerCosts.reduce((s, c) => s + c, 0);
        const bodySpent = hpP * SUMMON_CAPS.hpTokenCost +
            arP * SUMMON_CAPS.armorTokenCost +
            evP * SUMMON_CAPS.evadeTokenCost +
            senses.length * SUMMON_CAPS.sharedSenseTokenCost +
            powerTokens;
        bodyTokens.push(bodySpent);
        add(bodySpent);
        return {
            hp: BASE_SUMMON.hp + hpP * SUMMON_CAPS.hpGain,
            armor: BASE_SUMMON.armor + arP * SUMMON_CAPS.armorGain,
            evade: BASE_SUMMON.evade + evP * SUMMON_CAPS.evadeGain,
            sharedSenses: senses,
            powerTokensSpent: powerTokens,
        };
    });
    const movementMode = normalizeMovementMode(opts.movementMode);
    const baseMove = baseMovementM(movementMode);
    const maxPurchases = maxMovementPurchases(movementMode);
    if (movementPurchases > maxPurchases) {
        errors.push(`Movement purchases ${movementPurchases} exceed max ${maxPurchases} for ${movementMode} (base ${baseMove} m → cap ${SUMMON_CAPS.maxMovementM} m).`);
    }
    const movementM = baseMove + movementPurchases * SUMMON_CAPS.movementGainM;
    if (movementM > SUMMON_CAPS.maxMovementM) {
        errors.push(`Movement ${movementM} m exceeds cap ${SUMMON_CAPS.maxMovementM} m.`);
    }
    if (extraAttackPurchases > SUMMON_CAPS.maxExtraAttackPurchases) {
        errors.push(`Extra Attack purchases ${extraAttackPurchases} exceed max ${SUMMON_CAPS.maxExtraAttackPurchases} (${SUMMON_CAPS.maxSummonAttacks} Summon Attacks total).`);
    }
    const summonAttacks = BASE_SUMMON.summonAttacks + extraAttackPurchases;
    if (summonAttacks > SUMMON_CAPS.maxSummonAttacks) {
        errors.push(`Summon Attacks ${summonAttacks} exceed cap ${SUMMON_CAPS.maxSummonAttacks}.`);
    }
    if (specialValuePurchases > 0 && !spend.specialAccess) {
        errors.push('Special Value requires Special Access.');
    }
    const specialValue = spend.specialAccess ? 1 + specialValuePurchases : 0;
    if (specialValue > SUMMON_CAPS.maxSpecialValue) {
        errors.push(`Special value ${specialValue} exceeds Special(${SUMMON_CAPS.maxSpecialValue}).`);
    }
    if (tokensSpent > available) {
        errors.push(`Spent ${tokensSpent} Tokens but only ${available} available.`);
    }
    const byTok = (cost) => Math.floor(Math.max(0, available) / Math.max(1, cost));
    const displayAttack = Math.min(attackPurchases, byTok(SUMMON_CAPS.attackTokenCost));
    const displayDamage = Math.min(damagePurchases, byTok(SUMMON_CAPS.damageTokenCost));
    const displaySkill = Math.min(skillDicePurchases, byTok(SUMMON_CAPS.skillDiceTokenCost));
    const maxHp = BASE_SUMMON.hp + byTok(SUMMON_CAPS.hpTokenCost) * SUMMON_CAPS.hpGain;
    const maxArmor = BASE_SUMMON.armor + byTok(SUMMON_CAPS.armorTokenCost) * SUMMON_CAPS.armorGain;
    const maxEvade = BASE_SUMMON.evade + byTok(SUMMON_CAPS.evadeTokenCost) * SUMMON_CAPS.evadeGain;
    return {
        attackDice: BASE_SUMMON.attackDice + displayAttack * SUMMON_CAPS.attackDiceGain,
        damageDice: BASE_SUMMON.damageDice + displayDamage * SUMMON_CAPS.damageDiceGain,
        movementM: Math.min(SUMMON_CAPS.maxMovementM, movementM),
        summonAttacks: Math.min(SUMMON_CAPS.maxSummonAttacks, summonAttacks),
        specialValue: Math.min(SUMMON_CAPS.maxSpecialValue, specialValue),
        hasSpecialAccess: !!spend.specialAccess,
        skillDiceTotal: displaySkill * SUMMON_CAPS.skillDicePerPurchase,
        bodyCount,
        bodies: bodies.map((b) => ({
            ...b,
            hp: Math.min(b.hp, maxHp),
            armor: Math.min(b.armor, maxArmor),
            evade: Math.min(b.evade, maxEvade),
        })),
        tokensSpent,
        tokensAvailable: available,
        tokensRemaining: available - tokensSpent,
        bondUpgradeTokens: bondCore + extraBodyTokens,
        skillTokens,
        specialTokens,
        extraBodyTokens,
        bodyTokens,
        errors,
        warnings,
    };
}
/** Default empty spend for a freshly created bond (tokens unspent). */
export function emptyBondSpend(bodyCount = 1) {
    const n = Math.max(1, bodyCount);
    return {
        attackPurchases: 0,
        damagePurchases: 0,
        movementPurchases: 0,
        extraAttackPurchases: 0,
        specialAccess: false,
        specialValuePurchases: 0,
        skillDicePurchases: 0,
        additionalBodies: n - 1,
        bodies: Array.from({ length: n }, () => emptyBodySpend()),
    };
}
//# sourceMappingURL=summon-bond-rules.js.map