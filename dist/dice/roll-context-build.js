/**
 * Shared roll-context builders for attribute checks (Epic Mastery Roll).
 * Training Checks use `executeSkillCheck` (sheets/skill-check-execute.ts).
 *
 * Builders return the BASE attribute pool. Specials (Weaken / Soulburn / Disoriented),
 * the percentage Health / Encumbrance penalty are applied centrally by `masteryRoll` via
 * `finalizeRolledPool` (`applyPoolPenalties: true`), so previews and final
 * rolls share one calculation.
 */
import { standardTnForMasteryRank } from '../utils/constants.js';
import { getRulesMasteryRank } from '../utils/mastery-rank-sync.js';
/**
 * Opposed Skill Rolls: the setup roll's Final Result is the opposing TN.
 * Raises are not added on top of a fixed Mastery Rank TN.
 */
export function buildOpposedSkillTn(setupFinalResult, _unusedRaises = 0) {
    return Math.max(0, Math.floor(Number(setupFinalResult) || 0));
}
export function buildDifficultyPresets(challengeMR) {
    const std = standardTnForMasteryRank(challengeMR);
    return {
        trivial: Math.max(0, std - 8),
        easy: Math.max(0, std - 4),
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
/** Attribute pool size from `system.attributes.<key>.value` (or a bare number). */
export function readAttributePoolValue(system, attributeKey) {
    const raw = system?.attributes?.[attributeKey];
    if (raw == null)
        return 0;
    if (typeof raw === 'object') {
        return Math.max(0, Math.floor(Number(raw.value) || 0));
    }
    return Math.max(0, Math.floor(Number(raw) || 0));
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
export function buildAttributeRollContext(actor, attributeKey, tnSpec, stoneBonusRaises = 0) {
    const system = actor.system;
    const masteryRank = getRulesMasteryRank(actor);
    const numDice = readAttributePoolValue(system, attributeKey);
    const attrLabel = capAttr(attributeKey);
    const keepDice = numDice <= 0 ? 0 : Math.min(masteryRank, numDice);
    const flavor = `Attribute pool: ${numDice}d8 base, keep highest ${keepDice}. Base TN: ${tnSpec.baseTN}, Raises: ${tnSpec.raises}.`;
    return {
        label: `${attrLabel} Check`,
        attributeKey,
        rollOptions: {
            numDice,
            keepDice,
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