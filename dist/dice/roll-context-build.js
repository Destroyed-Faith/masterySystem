/**
 * Shared roll-context builders for skill, attribute, and save checks.
 * Used by Epic Mastery Roll and available for future sheet refactors.
 */
import { SKILLS, SKILL_CATEGORIES } from '../utils/skills.js';
import { getEquippedPhysicalSkillPenaltyDice } from '../utils/equipment-modifiers.js';
import { getCurrentPenalty } from '../utils/calculations.js';
/** Players Guide: full attribute pool when skill rating ≥ 2 × Mastery Rank. */
export function skillFullPoolThreshold(masteryRank) {
    const mr = Math.max(1, Math.floor(Number(masteryRank) || 1));
    return mr * 2;
}
export function isSkillFullPoolReady(skillRating, masteryRank) {
    return Number(skillRating) >= skillFullPoolThreshold(masteryRank);
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
/** Skill rolls: attribute dice pool, keep highest equal to the actor's Mastery Rank. */
export function getSkillRollDicePool(actor, skillKey, attributeKey) {
    const skillDef = SKILLS[skillKey];
    const system = actor.system;
    const masteryRank = Number(system.mastery?.rank ?? 2);
    if (!skillDef) {
        return { numDice: masteryRank, keepDice: masteryRank, halfPool: false, equipPenalty: 0, healthPenalty: 0 };
    }
    const attributeValue = Number(system.attributes?.[attributeKey]?.value ?? 0);
    const skillRating = Number(system.skills?.[skillKey] ?? 0);
    const fullPoolReady = isSkillFullPoolReady(skillRating, masteryRank);
    const poolThreshold = skillFullPoolThreshold(masteryRank);
    let baseAttrPool = attributeValue;
    let halfPool = false;
    if (!fullPoolReady) {
        baseAttrPool = Math.max(1, Math.floor(attributeValue / 2));
        halfPool = true;
    }
    let numDice = Math.max(baseAttrPool, masteryRank);
    let equipPenalty = 0;
    if (skillDef.category === SKILL_CATEGORIES.PHYSICAL) {
        const penDice = getEquippedPhysicalSkillPenaltyDice(actor);
        if (penDice > 0) {
            equipPenalty = penDice;
            numDice = Math.max(1, numDice - penDice);
        }
    }
    const beforeHealth = numDice;
    const health = applyHealthPenalty(system, numDice);
    numDice = health.numDice;
    const healthPenalty = beforeHealth - numDice;
    return { numDice, keepDice: masteryRank, halfPool, equipPenalty, healthPenalty };
}
function applyHealthPenalty(system, numDice) {
    const healthBars = system.health?.bars || [];
    const currentBar = system.health?.currentBar ?? 0;
    const healthPenalty = getCurrentPenalty(healthBars, currentBar, numDice);
    if (healthPenalty < 0) {
        return {
            numDice: Math.max(1, numDice + healthPenalty),
            flavorSuffix: ` Health penalty: ${healthPenalty}d8.`,
        };
    }
    return { numDice, flavorSuffix: '' };
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
    const numDice = pool.numDice;
    let halfPoolFlavor = '';
    if (pool.halfPool) {
        halfPoolFlavor = ` Half-pool: skill rating ${skillRating} < ${poolThreshold} (2×MR) → ⌊${attributeValue}/2⌋ attribute dice.`;
    }
    const equipPenaltyFlavor = pool.equipPenalty > 0
        ? ` Equipped armor/shield physical penalty: −${pool.equipPenalty}d8.`
        : '';
    const healthFlavor = pool.healthPenalty > 0 ? ` Health penalty: −${pool.healthPenalty}d8.` : '';
    const flavor = `Attribute pool: ${numDice}d8, keep highest ${masteryRank} (MR). Base TN: ${tnSpec.baseTN}, Raises: ${tnSpec.raises}.${equipPenaltyFlavor}${healthFlavor}${halfPoolFlavor}`;
    return {
        label: `${skillDef.name} Check`,
        attributeKey,
        skillKey,
        rollOptions: {
            numDice,
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
        },
    };
}
export function buildAttributeRollContext(actor, attributeKey, tnSpec, stoneBonusRaises = 0) {
    const system = actor.system;
    const masteryRank = system.mastery?.rank || 2;
    let numDice = Number(system.attributes?.[attributeKey]?.value) || 0;
    numDice = Math.max(numDice, masteryRank);
    const health = applyHealthPenalty(system, numDice);
    numDice = health.numDice;
    const attrLabel = capAttr(attributeKey);
    const flavor = `Attribute pool: ${numDice}d8, keep highest ${masteryRank} (MR). Base TN: ${tnSpec.baseTN}, Raises: ${tnSpec.raises}.${health.flavorSuffix}`;
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
        },
    };
}
export function buildSaveRollContext(actor, saveType, tnSpec, stoneBonusRaises = 0) {
    const system = actor.system;
    const masteryRank = system.mastery?.rank || 2;
    const actorData = system.attributes ?? {};
    let numDice = 0;
    let usedAttr1 = '';
    let usedAttr2 = '';
    let chosenAttr = '';
    if (saveType === 'body') {
        const might = actorData.might?.value || 2;
        const agility = actorData.agility?.value || 2;
        numDice = Math.max(might, agility);
        usedAttr1 = `Might ${might}`;
        usedAttr2 = `Agility ${agility}`;
        chosenAttr = might >= agility ? 'Might' : 'Agility';
    }
    else if (saveType === 'mind') {
        const intellect = actorData.intellect?.value || 2;
        const wits = actorData.wits?.value || 2;
        numDice = Math.max(intellect, wits);
        usedAttr1 = `Intellect ${intellect}`;
        usedAttr2 = `Wits ${wits}`;
        chosenAttr = intellect >= wits ? 'Intellect' : 'Wits';
    }
    else if (saveType === 'spirit') {
        const resolve = actorData.resolve?.value || 2;
        const influence = actorData.influence?.value || 2;
        numDice = Math.max(resolve, influence);
        usedAttr1 = `Resolve ${resolve}`;
        usedAttr2 = `Influence ${influence}`;
        chosenAttr = resolve >= influence ? 'Resolve' : 'Influence';
    }
    else {
        return null;
    }
    numDice = Math.max(numDice, masteryRank);
    const health = applyHealthPenalty(system, numDice);
    numDice = health.numDice;
    const saveName = saveType.charAt(0).toUpperCase() + saveType.slice(1);
    const saveRollKind = saveType === 'body' ? 'saveBody' : saveType === 'mind' ? 'saveMind' : 'saveSpirit';
    let flavorText = `Using ${chosenAttr} (${usedAttr1} / ${usedAttr2})`;
    if (health.flavorSuffix) {
        flavorText += ` |${health.flavorSuffix.trim()}`;
    }
    return {
        label: `${saveName} Save`,
        attributeKey: chosenAttr.toLowerCase(),
        rollOptions: {
            numDice,
            keepDice: masteryRank,
            skill: 0,
            ...buildTnRollFields(tnSpec, stoneBonusRaises),
            label: `${saveName} Save`,
            flavor: flavorText,
            actorId: actor.id,
            isSaveRoll: true,
            rollKind: saveRollKind,
        },
    };
}
//# sourceMappingURL=roll-context-build.js.map