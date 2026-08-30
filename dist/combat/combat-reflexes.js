/**
 * Combat Reflexes on initiative. The skill used to be asked for in a popup right
 * after the roll, which meant a decision before the player could see anything.
 * It now lives in the Initiative Exchange row of the Stone Powers dialog, where
 * the Initiative score and the stone conversion are visible at the same time.
 *
 * Skills are not spent point by point: a skill has four uses per Safe Haven Rest
 * and each use applies the Mastery Rank at once — the four boxes on the sheet and
 * on the printout. The rating (capped at MR × 4) fills those boxes left to right,
 * so a rating below the cap leaves the last boxes short or empty.
 *
 * For Combat Reflexes one use raises the Initiative score by the points it costs.
 * Uses taken this round are recorded on the combatant so a box can be un-ticked
 * — and so the record dies with the score when initiative is rolled again.
 */
import { calculateMaxSkillRank } from '../utils/calculations.js';
import { buildSkillUseBoxes, SKILL_USE_BOX_COUNT } from '../utils/skill-use-boxes.js';
export const CR_SKILL_KEY = 'combatReflexes';
/** Uses per Safe Haven Rest — the four boxes next to every skill. */
export const SKILL_USE_BOXES = SKILL_USE_BOX_COUNT;
/** Amounts put into initiative this round, newest last; used for un-ticking. */
const CR_ROUND_FLAG = 'msCrInitiativeSpends';
/** Limits for spending Combat Reflexes on initiative. */
export function getCombatReflexesInitiativeLimits(actor, masteryRank) {
    const rating = readSkillNumber(actor?.system?.skills?.[CR_SKILL_KEY]);
    const spent = readSkillNumber(actor?.system?.skillsSpent?.[CR_SKILL_KEY]);
    const remainingPool = Math.max(0, rating - spent);
    const capPerRoll = calculateMaxSkillRank(masteryRank);
    return { maxThisRoll: Math.min(capPerRoll, remainingPool), remainingPool, capPerRoll };
}
function readSkillNumber(value) {
    return Math.max(0, Math.floor(Number(value) || 0));
}
function masteryRankPoints(masteryRank) {
    return Math.max(1, Math.floor(Number(masteryRank) || 1));
}
/** Amounts taken this round, oldest first. */
export function combatReflexesRoundSpends(combatant) {
    const raw = combatant?.getFlag?.('mastery-system', CR_ROUND_FLAG);
    if (!Array.isArray(raw))
        return [];
    return raw.map((value) => readSkillNumber(value)).filter((value) => value > 0);
}
export function combatReflexesUsedThisRound(combatant) {
    return combatReflexesRoundSpends(combatant).reduce((sum, value) => sum + value, 0);
}
/**
 * The four boxes as the Initiative Exchange row shows them. Only the leftmost
 * box with points left can be ticked; only a use taken this round can be given
 * back, and only while the initiative it produced is still there — the score may
 * already have been converted into stones.
 */
export function combatReflexesInitiativeState(actor, combatant, masteryRank) {
    const pointsPerUse = masteryRankPoints(masteryRank);
    const rating = Math.min(readSkillNumber(actor?.system?.skills?.[CR_SKILL_KEY]), calculateMaxSkillRank(masteryRank));
    const spent = Math.min(readSkillNumber(actor?.system?.skillsSpent?.[CR_SKILL_KEY]), rating);
    const roundSpends = combatReflexesRoundSpends(combatant);
    const lastRoundSpend = roundSpends.length ? roundSpends[roundSpends.length - 1] : 0;
    const initiative = Math.max(0, Math.floor(Number(combatant?.initiative) || 0));
    const canUndoRound = lastRoundSpend > 0 && initiative >= lastRoundSpend;
    const raw = buildSkillUseBoxes(rating, spent, masteryRank);
    const spendIndex = raw.findIndex((box) => box.remaining > 0);
    // The box a click gives back is the rightmost one with points spent in it.
    let undoIndex = -1;
    for (let i = raw.length - 1; i >= 0; i -= 1) {
        if (raw[i].used > 0) {
            undoIndex = i;
            break;
        }
    }
    const boxes = raw.map((box, index) => ({
        index,
        size: box.size,
        used: box.used,
        remaining: box.remaining,
        unavailable: box.size === 0,
        spent: box.size > 0 && box.remaining === 0,
        canSpend: index === spendIndex,
        canUndo: index === undoIndex && canUndoRound,
    }));
    return {
        rating,
        spent,
        remainingPool: Math.max(0, rating - spent),
        pointsPerUse,
        boxes,
        nextUse: spendIndex >= 0 ? raw[spendIndex].remaining : 0,
        usedThisRound: roundSpends.reduce((sum, value) => sum + value, 0),
        canSpend: spendIndex >= 0,
        canUndo: canUndoRound && undoIndex >= 0,
    };
}
/**
 * Tick the next box: spend one use and raise the initiative score by its points.
 * @returns the new initiative score, or null when no use is left.
 */
export async function spendCombatReflexesUse(actor, combatant, masteryRank) {
    if (!actor || !combatant)
        return null;
    const state = combatReflexesInitiativeState(actor, combatant, masteryRank);
    if (!state.canSpend || state.nextUse <= 0)
        return null;
    const amount = state.nextUse;
    const initiative = Math.max(0, Math.floor(Number(combatant.initiative) || 0));
    const nextInitiative = initiative + amount;
    await actor.update?.({ [`system.skillsSpent.${CR_SKILL_KEY}`]: state.spent + amount });
    await combatant.update?.({ initiative: nextInitiative });
    await combatant.setFlag?.('mastery-system', 'msInitiativeValue', nextInitiative);
    await combatant.setFlag?.('mastery-system', CR_ROUND_FLAG, [
        ...combatReflexesRoundSpends(combatant),
        amount,
    ]);
    return nextInitiative;
}
/**
 * Un-tick the last box taken this round: the points go back into the pool and
 * back out of the initiative score.
 * @returns the new initiative score, or null when there is nothing to give back.
 */
export async function undoCombatReflexesUse(actor, combatant, masteryRank) {
    if (!actor || !combatant)
        return null;
    const state = combatReflexesInitiativeState(actor, combatant, masteryRank);
    if (!state.canUndo)
        return null;
    const spends = combatReflexesRoundSpends(combatant);
    const amount = spends[spends.length - 1];
    const initiative = Math.max(0, Math.floor(Number(combatant.initiative) || 0));
    if (amount <= 0 || initiative < amount)
        return null;
    const nextInitiative = initiative - amount;
    await actor.update?.({
        [`system.skillsSpent.${CR_SKILL_KEY}`]: Math.max(0, state.spent - amount),
    });
    await combatant.update?.({ initiative: nextInitiative });
    await combatant.setFlag?.('mastery-system', 'msInitiativeValue', nextInitiative);
    await combatant.setFlag?.('mastery-system', CR_ROUND_FLAG, spends.slice(0, -1));
    return nextInitiative;
}
/** A fresh initiative roll replaces the score, so this round's record is void. */
export async function resetCombatReflexesRoundUsage(combatant) {
    if (!combatReflexesRoundSpends(combatant).length)
        return;
    await combatant?.setFlag?.('mastery-system', CR_ROUND_FLAG, []);
}
//# sourceMappingURL=combat-reflexes.js.map