/**
 * Canonical dice-pool finalization — single source of truth for the
 * Player's Guide "Order of Pool Reduction". Used by `masteryRoll` for the
 * actual roll AND by UI previews so both always agree.
 *
 * Input pool = base attribute pool + skill full-/half-pool rule + situational
 * caller modifiers (range band, split attack) + mechanics/manual flat dice.
 *
 * This stage then applies, in this exact order:
 *   (a) flat Special reductions — Disoriented (Auto-Fail engine),
 *       Weaken / Soulburn (by pool attribute), Challenge (attack targeting)
 *   (b) percentage-based Health / Encumbrance penalty (dice loss floored)
 *   (c) Minimum Pool = Mastery Rank (applied LAST)
 */
import { evaluateAutoFail } from '../system/auto-fail.js';
import { attributePoolReduction, challengePoolReduction, normalizeTargetRefs, } from '../system/pool-reduction.js';
import { applyHealthAndEncumbrancePenalties, LOAD_ZONE_LABEL } from '../utils/encumbrance.js';
/**
 * Apply canonical stages (a)–(c) to `basePool`. Pure & synchronous so UI
 * previews can call it directly.
 */
export function finalizeRolledPool(actor, basePool, keepDice, options = {}) {
    const notes = [];
    let numDice = Math.max(0, Math.floor(basePool));
    let autoFailReason;
    if (!actor)
        return { numDice, notes };
    const kind = options.rollKind;
    let flatReduction = 0;
    let anyStageApplied = false;
    // (a1) Auto-Fail engine — Disoriented pool penalty + forced failures.
    if (options.checkContext) {
        const intent = options.autoFailIntent ?? (kind === 'attack' ? 'attack' : 'skill');
        const decision = evaluateAutoFail(actor, options.checkContext, intent);
        if (decision.dicePenalty && decision.dicePenalty > 0) {
            flatReduction += decision.dicePenalty;
            notes.push(decision.note ?? `−${decision.dicePenalty} dice`);
        }
        if (decision.failed) {
            autoFailReason = decision.reason ?? 'auto-fail';
            notes.push(decision.note ?? `Auto-Fail (${autoFailReason})`);
        }
    }
    // (a2) Weaken / Soulburn by pool attribute.
    const attrReduction = attributePoolReduction(actor, options.poolAttribute);
    if (attrReduction.reduction > 0) {
        flatReduction += attrReduction.reduction;
        notes.push(...attrReduction.notes);
    }
    // (a3) Challenge — Attack Pools only.
    if (kind === 'attack') {
        const refs = normalizeTargetRefs(options.targetRefs ?? []);
        const challenge = challengePoolReduction(actor, refs);
        flatReduction += challenge.reduction;
        notes.push(...challenge.notes);
    }
    if (flatReduction > 0) {
        numDice = Math.max(0, numDice - flatReduction);
        anyStageApplied = true;
    }
    // (b) Percentage Health / Encumbrance penalty.
    if (options.applyPoolPenalties !== false) {
        const penalties = applyHealthAndEncumbrancePenalties(numDice, actor);
        if (penalties.healthPenaltyDice > 0) {
            notes.push(`Health penalty: −${penalties.healthPenaltyDice} dice`);
        }
        if (penalties.encumbrancePenaltyDice > 0) {
            notes.push(`Encumbrance (${LOAD_ZONE_LABEL[penalties.loadZone]}): −${penalties.encumbrancePenaltyDice} dice`);
        }
        if (penalties.numDice !== numDice)
            anyStageApplied = true;
        numDice = penalties.numDice;
        anyStageApplied = anyStageApplied || options.applyPoolPenalties === true;
    }
    // (c) Minimum Pool = Mastery Rank — applied last.
    if (anyStageApplied || options.applyPoolPenalties !== false) {
        const mrFloor = Math.max(1, Math.floor(keepDice));
        if (numDice < mrFloor) {
            notes.push(`Minimum Pool: raised to ${mrFloor}d8 (Mastery Rank)`);
            numDice = mrFloor;
        }
    }
    return { numDice, notes, ...(autoFailReason ? { autoFailReason } : {}) };
}
//# sourceMappingURL=pool-finalize.js.map