/**
 * Shared roll-context builders for skill and attribute checks.
 * Used by Epic Mastery Roll and available for future sheet refactors.
 *
 * Builders return the BASE pool (attribute + skill full-/half-pool rule +
 * equipment flat penalties). Specials (Weaken / Soulburn / Disoriented),
 * the percentage Health / Encumbrance penalty, and the final Minimum Pool
 * (= Mastery Rank) are applied centrally by `masteryRoll` via
 * `finalizeRolledPool` (`applyPoolPenalties: true`), so previews and final
 * rolls share one calculation.
 */
import { SKILLS, SKILL_CATEGORIES } from '../utils/skills.js';
import { getEquippedPhysicalSkillPenaltyDice } from '../utils/equipment-modifiers.js';
import { finalizeRolledPool } from './pool-finalize.js';
/** Players Guide: full attribute pool when skill rating ≥ 2 × Mastery Rank. */
export function skillFullPoolThreshold(masteryRank) {
    const mr = Math.max(1, Math.floor(Number(masteryRank) || 1));
    return mr * 2;
}
export function isSkillFullPoolReady(skillRating, masteryRank) {
    return Number(skillRating) >= skillFullPoolThreshold(masteryRank);
}
/**
 * Opposed Skill Rolls (PG "Opposed Skill Rolls"): after a successful setup
 * roll, the opposing creature rolls against
 *   Opposing TN = standard Skill Check TN by the setup creature's MR (8 × MR)
 *                 + 2 per Raise on the setup roll.
 */
export function buildOpposedSkillTn(setupMasteryRank, setupRaises) {
    const mr = Math.max(1, Math.floor(Number(setupMasteryRank) || 1));
    const raises = Math.max(0, Math.floor(Number(setupRaises) || 0));
    return mr * 8 + raises * 2;
}
export function buildDifficultyPresets(challengeMR) {
    const std = Math.max(1, Math.floor(challengeMR)) * 8;
    return {
        trivial: std - 8,
        easy: std - 4,
        standard: std,
        challenging: std + 4,
        hard: std + 8,
        veryHard: std + 12,
        heroic: std + 16,
    };
}
function capAttr(key) {
    return key.charAt(0).toUpperCase() + key.slice(1);
}
/** Skill rating below 2×MR: attribute dice = floor(attr/2), minimum 1 (Players Guide: "half the Attribute Pool, rounded down"). */
export function reducedSkillAttributePool(attributeValue) {
    return Math.max(1, Math.floor(Number(attributeValue) / 2));
}
function skillRollIconClass(skillKey, attributeKey) {
    if (skillKey === 'perception') {
        if (attributeKey === 'wits')
            return 'fa-brain';
        if (attributeKey === 'intellect')
            return 'fa-lightbulb';
        if (attributeKey === 'resolve')
            return 'fa-shield-alt';
    }
    if (attributeKey === 'might')
        return 'fa-dumbbell';
    if (attributeKey === 'agility')
        return 'fa-running';
    return null;
}
/** Sheet + dialog helper: dice pool label and tooltip for a skill attribute roll. */
export function buildSkillRollPoolPreview(actor, skillKey, attributeKey, skillRatingOverride) {
    const system = actor.system;
    const masteryRank = Number(system.mastery?.rank ?? 2);
    const skillRating = skillRatingOverride ?? Number(system.skills?.[skillKey] ?? 0);
    const attributeValue = Number(system.attributes?.[attributeKey]?.value ?? 0);
    const poolThreshold = skillFullPoolThreshold(masteryRank);
    const fullPoolReady = isSkillFullPoolReady(skillRating, masteryRank);
    const pool = getSkillRollDicePool(actor, skillKey, attributeKey, skillRatingOverride);
    const attrLabel = capAttr(attributeKey);
    const rollLabel = `${pool.numDice}k${pool.keepDice}`;
    const diceLabel = `${pool.numDice}d8 k${pool.keepDice}`;
    let tooltip;
    if (fullPoolReady) {
        tooltip = `${attrLabel} ${attributeValue} → full pool ${pool.numDice}d8, keep ${pool.keepDice} (skill ${skillRating} ≥ ${poolThreshold}, 2×MR)`;
    }
    else {
        const reduced = reducedSkillAttributePool(attributeValue);
        tooltip = `${attrLabel} ${attributeValue} → ${pool.numDice}d8, keep ${pool.keepDice} (skill ${skillRating} < ${poolThreshold}; floor(${attributeValue}/2) = ${reduced}, MR floor ${masteryRank})`;
    }
    const penaltyParts = [];
    if (pool.equipPenalty > 0)
        penaltyParts.push(`−${pool.equipPenalty} equip`);
    penaltyParts.push(...pool.finalizeNotes);
    if (penaltyParts.length > 0) {
        tooltip += ` [${penaltyParts.join(', ')}]`;
    }
    return {
        attributeKey,
        rollLabel,
        diceLabel,
        tooltip,
        halfPool: pool.halfPool,
        fullPoolReady,
        numDice: pool.numDice,
        keepDice: pool.keepDice,
        skillRating,
        poolThreshold,
        attributeValue,
        iconClass: skillRollIconClass(skillKey, attributeKey),
    };
}
/**
 * Skill rolls: BASE attribute dice pool (attr + full-/half-pool rule +
 * equipment flat penalty). Pass `baseDice` to `masteryRoll` with
 * `applyPoolPenalties: true`; `numDice` / `finalizeNotes` are the fully
 * finalized preview values (same calculation the roll will use).
 */
export function getSkillRollDicePool(actor, skillKey, attributeKey, skillRatingOverride) {
    const skillDef = SKILLS[skillKey];
    const system = actor.system;
    const masteryRank = Number(system.mastery?.rank ?? 2);
    if (!skillDef) {
        return {
            numDice: masteryRank,
            baseDice: masteryRank,
            keepDice: masteryRank,
            halfPool: false,
            equipPenalty: 0,
            finalizeNotes: [],
        };
    }
    const attributeValue = Number(system.attributes?.[attributeKey]?.value ?? 0);
    const skillRating = skillRatingOverride ?? Number(system.skills?.[skillKey] ?? 0);
    const fullPoolReady = isSkillFullPoolReady(skillRating, masteryRank);
    let baseAttrPool = attributeValue;
    let halfPool = false;
    if (!fullPoolReady) {
        baseAttrPool = reducedSkillAttributePool(attributeValue);
        halfPool = true;
    }
    let baseDice = baseAttrPool;
    let equipPenalty = 0;
    if (skillDef.category === SKILL_CATEGORIES.PHYSICAL) {
        const penDice = getEquippedPhysicalSkillPenaltyDice(actor);
        if (penDice > 0) {
            equipPenalty = penDice;
            baseDice = Math.max(0, baseDice - penDice);
        }
    }
    // Preview using the exact same finalize stage as the roll itself.
    const finalized = finalizeRolledPool(actor, baseDice, masteryRank, {
        rollKind: 'skill',
        poolAttribute: attributeKey,
        checkContext: { skillKey },
        applyPoolPenalties: true,
    });
    return {
        numDice: finalized.numDice,
        baseDice,
        keepDice: masteryRank,
        halfPool,
        equipPenalty,
        finalizeNotes: finalized.notes,
    };
}
function buildTnRollFields(tnSpec, stoneBonusRaises) {
    const baseTN = tnSpec.baseTN;
    const raises = Math.max(0, Math.floor(tnSpec.raises));
    return {
        tn: baseTN,
        normalTn: baseTN,
        raiseTn: baseTN + raises * 4,
        declaredRaiseSlots: raises,
        stoneBonusRaises,
        raiseModel: 'skill',
    };
}
export function buildSkillRollContext(actor, skillKey, attributeKey, tnSpec, stoneBonusRaises = 0) {
    const skillDef = SKILLS[skillKey];
    if (!skillDef)
        return null;
    const system = actor.system;
    const masteryRank = system.mastery?.rank || 2;
    const attributeValue = Number(system.attributes?.[attributeKey]?.value) || 0;
    const skillRating = Number(system?.skills?.[skillKey] ?? 0);
    const poolThreshold = skillFullPoolThreshold(masteryRank);
    const pool = getSkillRollDicePool(actor, skillKey, attributeKey);
    let halfPoolFlavor = '';
    if (pool.halfPool) {
        const reduced = reducedSkillAttributePool(attributeValue);
        halfPoolFlavor = ` Reduced pool: skill rating ${skillRating} < ${poolThreshold} (2×MR) → floor(${attributeValue}/2) = ${reduced} attribute dice.`;
    }
    const equipPenaltyFlavor = pool.equipPenalty > 0
        ? ` Equipped armor/shield physical penalty: −${pool.equipPenalty}d8.`
        : '';
    const flavor = `Attribute pool: ${pool.baseDice}d8 base, keep highest ${masteryRank} (MR). Base TN: ${tnSpec.baseTN}, Raises: ${tnSpec.raises}.${equipPenaltyFlavor}${halfPoolFlavor}`;
    return {
        label: `${skillDef.name} Check`,
        attributeKey,
        skillKey,
        rollOptions: {
            numDice: pool.baseDice,
            keepDice: masteryRank,
            skill: 0,
            ...buildTnRollFields(tnSpec, stoneBonusRaises),
            label: `${skillDef.name} Check`,
            flavor,
            actorId: actor.id,
            skillKey,
            isSkillRoll: true,
            baseModifier: 0,
            rollKind: 'skill',
            autoFailIntent: 'skill',
            checkContext: { skillKey },
            poolAttribute: attributeKey,
            applyPoolPenalties: true,
        },
    };
}
export function buildAttributeRollContext(actor, attributeKey, tnSpec, stoneBonusRaises = 0) {
    const system = actor.system;
    const masteryRank = system.mastery?.rank || 2;
    const numDice = Number(system.attributes?.[attributeKey]?.value) || 0;
    const attrLabel = capAttr(attributeKey);
    const flavor = `Attribute pool: ${numDice}d8 base, keep highest ${masteryRank} (MR). Base TN: ${tnSpec.baseTN}, Raises: ${tnSpec.raises}.`;
    return {
        label: `${attrLabel} Check`,
        attributeKey,
        rollOptions: {
            numDice,
            keepDice: masteryRank,
            skill: 0,
            ...buildTnRollFields(tnSpec, stoneBonusRaises),
            label: `${attrLabel} Check`,
            flavor,
            actorId: actor.id,
            isSkillRoll: false,
            baseModifier: 0,
            poolAttribute: attributeKey,
            applyPoolPenalties: true,
        },
    };
}
//# sourceMappingURL=roll-context-build.js.map