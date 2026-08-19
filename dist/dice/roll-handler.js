/**
 * Dice rolling handler for Mastery System
 * Implements Roll & Keep with exploding 8s
 */
import { EXPLODE_VALUE, RAISE_INCREMENT } from '../utils/constants';
import { resolveRaiseOutcome } from '../combat/raise-resolution.js';
import { finalizeRolledPool } from './pool-finalize.js';
import { manualKindFromRollKind, manualRollBonusForKind, readManualAdjustments, } from '../utils/manual-adjustments.js';
/**
 * Roll one pool die: each face of **8** explodes (Players Guide ~5850–5854 —
 * "On an 8, reroll that die and add the new result"). Returns the per-face
 * trail, total, and an `exploded` flag for Foundry display.
 */
function rollExplodingDieChain() {
    const faces = [];
    let exploded = false;
    while (true) {
        const face = Math.floor(Math.random() * 8) + 1;
        faces.push(face);
        if (face !== EXPLODE_VALUE)
            break;
        exploded = true;
    }
    const total = faces.reduce((a, b) => a + b, 0);
    return { faces, total, exploded };
}
/** Crit stone / similar: each face of 7–8 triggers another d8 in the same pool die chain. */
function rollExplodingDieChain78() {
    const faces = [];
    let exploded = false;
    while (true) {
        const face = Math.floor(Math.random() * 8) + 1;
        faces.push(face);
        if (face < 7)
            break;
        exploded = true;
    }
    const total = faces.reduce((a, b) => a + b, 0);
    return { faces, total, exploded };
}
/** Single non-exploding d8 face. */
function rollFlatD8() {
    return Math.floor(Math.random() * 8) + 1;
}
/**
 * Roll the initial pool. Standard rule: every face of 8 explodes. With
 * Disadvantage, only one chosen 8 explodes; with Advantage, every initial
 * face of 1 is rerolled exactly once before resolving explosions.
 */
function rollDice(numDice, options) {
    const explodeOn78 = !!options?.explodeOn78;
    const rollAdvantage = !!options?.rollAdvantage;
    const rollDisadvantage = !!options?.rollDisadvantage;
    const dice = [];
    const exploded = [];
    const dieChains = [];
    if (rollDisadvantage) {
        // Phase 1: roll every die flat (no explosions yet). Phase 2: of the dice
        // that came up 8, explode exactly one (we pick the first index, but any
        // choice is mathematically equivalent for the explosion expectation).
        const initial = [];
        for (let i = 0; i < numDice; i++) {
            let face = rollFlatD8();
            if (rollAdvantage && face === 1)
                face = rollFlatD8();
            initial.push(face);
        }
        const eightIndex = initial.findIndex((f) => f === 8);
        for (let i = 0; i < numDice; i++) {
            const face = initial[i];
            if (i === eightIndex) {
                // Explode this 8 only (recursive face=8 chain) and prepend the
                // initial 8 to the chain so display shows 8 + ... = total.
                const tail = rollExplodingDieChain();
                const faces = [face, ...tail.faces];
                const total = faces.reduce((a, b) => a + b, 0);
                dieChains.push(faces);
                dice.push(total);
                if (faces.length > 1)
                    exploded.push(i);
            }
            else {
                dieChains.push([face]);
                dice.push(face);
            }
        }
        return { dice, exploded, dieChains };
    }
    for (let i = 0; i < numDice; i++) {
        if (rollAdvantage) {
            // Initial face — reroll only if it lands on 1, then run the normal
            // explosion chain (both for face=8 and for the optional 7–8 mode).
            let initialFace = rollFlatD8();
            if (initialFace === 1)
                initialFace = rollFlatD8();
            const explodes = explodeOn78 ? initialFace >= 7 : initialFace === 8;
            if (!explodes) {
                dieChains.push([initialFace]);
                dice.push(initialFace);
                continue;
            }
            const tail = explodeOn78 ? rollExplodingDieChain78() : rollExplodingDieChain();
            const faces = [initialFace, ...tail.faces];
            const total = faces.reduce((a, b) => a + b, 0);
            dieChains.push(faces);
            dice.push(total);
            exploded.push(i);
            continue;
        }
        const chain = explodeOn78 ? rollExplodingDieChain78() : rollExplodingDieChain();
        dieChains.push(chain.faces);
        dice.push(chain.total);
        if (chain.exploded)
            exploded.push(i);
    }
    return { dice, exploded, dieChains };
}
/**
 * Select the highest K dice from an array
 * Returns indices of kept dice
 */
function selectHighestDice(dice, keepDice) {
    // Create array of [value, originalIndex] pairs
    const indexed = dice.map((value, index) => ({ value, index }));
    // Sort by value descending
    indexed.sort((a, b) => b.value - a.value);
    // Take the top K dice
    const kept = indexed.slice(0, keepDice);
    // Return the original indices, sorted
    return kept.map(d => d.index).sort((a, b) => a - b);
}
/**
 * Calculate total from kept dice
 */
function calculateTotal(dice, keptIndices) {
    return keptIndices.reduce((sum, index) => sum + dice[index], 0);
}
/** Margin raises: each full +4 over TN = 1 Raise (echo, ritual, skill checks). */
export function countMarginRaises(total, tn) {
    if (total < tn)
        return 0;
    return Math.floor((total - tn) / RAISE_INCREMENT);
}
/**
 * Perform a Mastery System roll
 * Roll N d8, keep K highest, add skill bonus
 * Dice explode on 8
 */
export async function masteryRoll(options) {
    let keepDice = Math.max(1, Math.floor(Number(options.keepDice) || 1));
    const { skill = 0, tn = 0, label = 'Roll' } = options;
    let { numDice, flavor = '' } = options;
    // Stress Breakdown Virtue: next action gains +1 Keep (Players Guide ~9223).
    if (options.actorId || options.actorRef) {
        try {
            const virtueActor = options.actorRef ?? game?.actors?.get?.(options.actorId);
            if (virtueActor) {
                const { consumeStressBreakdownVirtueKeep } = await import('../combat/stress-breakdown.js');
                const bonus = await consumeStressBreakdownVirtueKeep(virtueActor);
                if (bonus > 0) {
                    keepDice += bonus;
                    const note = 'Stress Breakdown Virtue: +1 Keep';
                    flavor = flavor ? `${flavor} | ${note}` : note;
                }
            }
        }
        catch (err) {
            console.warn('Mastery System | stress virtue keep failed', err);
        }
    }
    // Pre-Auto-Raise pool size, preserved so the reroll recipe can re-apply the
    // same Auto-Raise deduction on reroll without double-counting the cost.
    const originalNumDice = numDice;
    // Auto-Raises removed under new Raise rules.
    void originalNumDice;
    const normalTnVal = Math.max(0, Math.floor(options.normalTn ?? tn ?? 0));
    const declaredRaiseSlots = Math.max(0, Math.floor(options.declaredRaiseSlots ?? 0));
    const raiseTnVal = options.raiseTn != null
        ? Math.max(0, Math.floor(options.raiseTn))
        : declaredRaiseSlots > 0
            ? normalTnVal + declaredRaiseSlots * RAISE_INCREMENT
            : normalTnVal;
    const stoneBonusRaises = Math.max(0, Math.floor(options.stoneBonusRaises ?? 0));
    const raiseModel = options.raiseModel ?? 'power';
    const bloodRaises = Math.max(0, Math.floor(options.bloodRaises ?? 0));
    const raiseTnRollBonus = Math.max(0, Math.floor(options.raiseTnRollBonus ?? 0));
    // Power Mechanics Engine — consult the actor's aggregated dice-pool deltas
    // for this roll kind and adjust the pool before rolling. The delta is
    // additive on top of any caller-supplied numDice (which typically already
    // reflects attribute + health penalty).
    const kind = options.rollKind;
    // Manual roll bonus (flat, applied after dice resolution). Captured here
    // so it is in scope when we post-process `total` further down.
    let manualFlatBonus = 0;
    if (options.actorId) {
        try {
            const actor = game?.actors?.get?.(options.actorId);
            if (actor) {
                // Mechanics-engine dice delta — only meaningful for typed roll kinds.
                if (kind && kind !== 'generic') {
                    const { getRollDiceDelta } = await import('../utils/power-mechanics.js');
                    const targetActor = options.targetActorId
                        ? (game?.actors?.get?.(options.targetActorId) ?? null)
                        : null;
                    const delta = getRollDiceDelta(actor, kind, targetActor);
                    if (delta !== 0) {
                        const adjusted = Math.max(1, numDice + delta);
                        const sign = delta > 0 ? '+' : '';
                        const ctx = targetActor ? ' vs target' : '';
                        const note = `Power Mechanics: ${sign}${delta} dice (${kind}${ctx})`;
                        flavor = flavor ? `${flavor} | ${note}` : note;
                        numDice = adjusted;
                    }
                }
                // Manual Adjustments — character-sheet-authored flat + bonus d8
                // layered on top of the mechanics delta. Applies to every roll with
                // an actor context. `manualKindFromRollKind` returns `null` for
                // generic rolls, which still surfaces `rolls.any` (global bonus).
                const adj = readManualAdjustments(actor);
                const manualKind = manualKindFromRollKind(kind);
                const manualBonus = manualRollBonusForKind(adj, manualKind);
                if (manualBonus.dice !== 0) {
                    const sign = manualBonus.dice > 0 ? '+' : '';
                    const kindLabel = manualKind ?? 'any';
                    const note = `Manual Bonus: ${sign}${manualBonus.dice}d8 (${kindLabel})`;
                    flavor = flavor ? `${flavor} | ${note}` : note;
                    numDice = Math.max(1, numDice + manualBonus.dice);
                }
                if (manualBonus.flat !== 0) {
                    manualFlatBonus = manualBonus.flat;
                    const sign = manualBonus.flat > 0 ? '+' : '';
                    const kindLabel = manualKind ?? 'any';
                    const note = `Manual Bonus: ${sign}${manualBonus.flat} flat (${kindLabel})`;
                    flavor = flavor ? `${flavor} | ${note}` : note;
                }
            }
        }
        catch (err) {
            // Best-effort only — never fail a roll because of aggregator issues.
            console.warn('Mastery System | power-mechanics delta lookup failed', err);
        }
    }
    // ── Canonical Order of Pool Reduction ─────────────────────────────────
    // At this point `numDice` = base pool (+ skill rule + situational caller
    // modifiers) + mechanics/manual flat modifiers. `finalizeRolledPool` then
    // applies, in canonical order: flat Special reductions (Disoriented /
    // Weaken / Soulburn / Challenge) → percentage Health & Encumbrance penalty
    // (only when `applyPoolPenalties` is set) → Minimum Pool = Mastery Rank.
    let autoFailReason;
    if (options.actorId || options.actorRef) {
        try {
            const actor = options.actorRef ?? game?.actors?.get?.(options.actorId);
            if (actor) {
                const finalized = finalizeRolledPool(actor, numDice, keepDice, {
                    rollKind: kind,
                    poolAttribute: options.poolAttribute,
                    targetRefs: [
                        ...(options.targetRefs ?? []),
                        ...(options.targetActorId ? [options.targetActorId] : []),
                    ],
                    checkContext: options.checkContext,
                    autoFailIntent: options.autoFailIntent,
                    applyPoolPenalties: !!options.applyPoolPenalties,
                });
                numDice = finalized.numDice;
                autoFailReason = finalized.autoFailReason;
                for (const note of finalized.notes) {
                    flavor = flavor ? `${flavor} | ${note}` : note;
                }
            }
        }
        catch (err) {
            console.warn('Mastery System | pool reduction stage failed', err);
        }
    }
    // Split-Attack (and similar): enforce a hard ceiling on the pool *after* all
    // additive adjustments so `rollDice.attack` bonuses cannot undo the executor's
    // halved `flags.attributeValue`.
    const attackCap = typeof options.attackDiceCap === 'number' &&
        Number.isFinite(options.attackDiceCap) &&
        options.attackDiceCap > 0
        ? Math.floor(options.attackDiceCap)
        : 0;
    if (attackCap > 0 && numDice > attackCap) {
        const before = numDice;
        numDice = attackCap;
        const note = `Pool cap: ${before} → ${numDice}d8 (Split-Attack / strike limit)`;
        flavor = flavor ? `${flavor} | ${note}` : note;
    }
    const explodeAttack78 = !!options.attackExplodeDiceOn78;
    if (explodeAttack78) {
        flavor = flavor ? `${flavor} | Crit: d8 pool explodes on 7–8` : 'Crit: d8 pool explodes on 7–8';
    }
    const rollAdvantage = !!options.rollAdvantage;
    const rollDisadvantage = !!options.rollDisadvantage;
    if (rollAdvantage && rollDisadvantage) {
        // Per the player guide adv/disadv chapter the two cancel out (the
        // disadvantage rule is "only one die may explode" — Advantage cannot
        // grant additional 1-rerolls when it has been negated). We keep both
        // flags off so the standard rule applies.
        const note = 'Advantage + Disadvantage cancel — rolling normally';
        flavor = flavor ? `${flavor} | ${note}` : note;
    }
    else if (rollAdvantage) {
        const note = 'Advantage: reroll any face of 1 once';
        flavor = flavor ? `${flavor} | ${note}` : note;
    }
    else if (rollDisadvantage) {
        const note = 'Disadvantage: only one 8 may explode';
        flavor = flavor ? `${flavor} | ${note}` : note;
    }
    // Roll the dice
    const useAdv = rollAdvantage && !rollDisadvantage;
    const useDis = rollDisadvantage && !rollAdvantage;
    const { dice, exploded, dieChains } = rollDice(numDice, {
        explodeOn78: explodeAttack78,
        rollAdvantage: useAdv,
        rollDisadvantage: useDis,
    });
    // Select highest dice to keep
    const keptIndices = selectHighestDice(dice, keepDice);
    const keptValues = keptIndices.map(i => dice[i]);
    // Calculate total from kept dice
    const diceTotal = calculateTotal(dice, keptIndices);
    // Add skill bonus (deprecated: now handled via skill spending, but kept for compatibility)
    // `manualFlatBonus` is layered on top — it was already announced in `flavor`.
    const totalBeforeBlood = diceTotal + skill + manualFlatBonus;
    const total = totalBeforeBlood + bloodRaises * RAISE_INCREMENT;
    let raiseOutcome;
    let success;
    let raises;
    if (autoFailReason) {
        raiseOutcome = 'fail';
        success = false;
        raises = 0;
    }
    else if (raiseModel === 'margin') {
        success = total >= normalTnVal;
        raises = success ? countMarginRaises(total, normalTnVal) : 0;
        raiseOutcome = success ? 'full' : 'fail';
    }
    else if (raiseModel === 'skill') {
        success = total >= normalTnVal;
        const marginRaises = success ? countMarginRaises(total, normalTnVal) : 0;
        if (declaredRaiseSlots > 0) {
            raiseOutcome = resolveRaiseOutcome(total, normalTnVal, declaredRaiseSlots, raiseTnRollBonus);
            const declaredCredit = raiseOutcome === 'full' ? declaredRaiseSlots + stoneBonusRaises : 0;
            raises = marginRaises + declaredCredit;
            success = raiseOutcome !== 'fail';
        }
        else {
            raiseOutcome = success ? 'full' : 'fail';
            raises = marginRaises + (success ? stoneBonusRaises : 0);
        }
    }
    else {
        raiseOutcome = resolveRaiseOutcome(total, normalTnVal, declaredRaiseSlots, raiseTnRollBonus);
        success = raiseOutcome !== 'fail';
        raises =
            raiseOutcome === 'full' ? declaredRaiseSlots + stoneBonusRaises : 0;
    }
    // Create result object
    const result = {
        total,
        dice,
        kept: keptValues,
        keptIndices: keptIndices,
        skill,
        tn: normalTnVal,
        raises,
        success,
        exploded,
        dieChains,
        label,
        flavor,
        raiseOutcome,
        normalTn: normalTnVal,
        raiseTn: raiseTnVal,
        stoneBonusRaises,
        ...(autoFailReason ? { autoFailReason } : {}),
    };
    const rollRecipe = {
        numDice: options.numDice,
        keepDice,
        skill,
        tn: normalTnVal,
        label,
        flavor,
        actorId: options.actorId ?? null,
        skillKey: options.skillKey ?? null,
        isSkillRoll: !!options.isSkillRoll,
        baseModifier: options.baseModifier ?? 0,
        ...(options.poolAttribute ? { poolAttribute: options.poolAttribute } : {}),
        ...(options.targetRefs?.length ? { targetRefs: options.targetRefs } : {}),
        ...(options.applyPoolPenalties ? { applyPoolPenalties: true } : {}),
        normalTn: normalTnVal,
        raiseTn: raiseTnVal,
        declaredRaiseSlots,
        stoneBonusRaises,
        raiseModel,
        ...(bloodRaises > 0 ? { bloodRaises } : {}),
        ...(raiseTnRollBonus > 0 ? { raiseTnRollBonus } : {}),
        ...(typeof options.attackDiceCap === 'number' &&
            Number.isFinite(options.attackDiceCap) &&
            options.attackDiceCap > 0
            ? { attackDiceCap: Math.floor(options.attackDiceCap) }
            : {}),
        ...(options.attackExplodeDiceOn78 ? { attackExplodeDiceOn78: true } : {}),
        ...(rollAdvantage ? { rollAdvantage: true } : {}),
        ...(rollDisadvantage ? { rollDisadvantage: true } : {}),
        ...(options.attackCardMessageId ? { attackCardMessageId: options.attackCardMessageId } : {}),
    };
    if (!options.skipChat) {
        await sendRollToChat(result, label, flavor, options.actorId, options.skillKey, options.isSkillRoll, options.baseModifier, rollRecipe, !!options.isRerollResult);
    }
    if (options.skillKey === 'stealth' && options.actorId && result.success !== undefined) {
        try {
            const actor = globalThis.game?.actors?.get?.(options.actorId);
            if (actor) {
                const { applyStealthRollResult } = await import('../combat/perception-combat-hooks.js');
                await applyStealthRollResult(actor, {
                    success: !!result.success,
                    raises: result.raises ?? 0,
                });
            }
        }
        catch (stealthErr) {
            console.warn('Mastery System | stealth perception state update failed', stealthErr);
        }
    }
    return result;
}
/**
 * Build a Foundry Roll matching the already-evaluated mastery result (no second RNG).
 * One `1d8`-equivalent Die per pool die so explosion faces appear as separate results (core + Dice So Nice).
 */
export function buildMasteryDisplayRoll(result, skillBonus) {
    const Die = foundry.dice.terms.Die;
    const OperatorTerm = foundry.dice.terms.OperatorTerm;
    const NumericTerm = foundry.dice.terms.NumericTerm;
    const keptIdx = new Set(result.keptIndices ?? []);
    const chains = result.dieChains;
    const n = result.dice.length;
    const terms = [];
    for (let i = 0; i < n; i++) {
        if (i > 0)
            terms.push(new OperatorTerm({ operator: '+' }));
        const faces = chains?.[i]?.length ? chains[i] : [result.dice[i]];
        const dieResults = faces.map((face, j) => {
            const isLast = j === faces.length - 1;
            const r = {
                result: face,
                active: true,
                discarded: false,
                exploded: !isLast,
                rerolled: false
            };
            if (keptIdx.has(i))
                r.kept = true;
            return r;
        });
        const die = new Die({ faces: 8, number: 1, results: dieResults });
        die._evaluated = true;
        terms.push(die);
    }
    if (skillBonus !== 0) {
        terms.push(new OperatorTerm({ operator: '+' }));
        const num = new NumericTerm({ number: skillBonus });
        num._evaluated = true;
        terms.push(num);
    }
    const RollCls = globalThis.Roll;
    const roll = RollCls.fromTerms(terms);
    roll._evaluated = true;
    roll._total = result.total;
    return roll;
}
/** Optional Dice So Nice animation for an already-resolved mastery roll. */
export async function showMasteryRollDice3d(result, skillBonus = 0) {
    try {
        const dice3d = game?.dice3d;
        if (!dice3d?.showForRoll)
            return;
        const roll = buildMasteryDisplayRoll(result, skillBonus);
        await dice3d.showForRoll(roll, game.user, true);
    }
    catch {
        /* optional module */
    }
}
/**
 * Send roll result to chat
 */
async function sendRollToChat(result, label, flavor, actorId, skillKey, isSkillRoll, baseModifier, rollRecipe, isRerollResult) {
    try {
        // Get actor if available
        let actor = null;
        if (actorId && game.actors) {
            actor = game.actors.get(actorId);
        }
        // For skill rolls, calculate spending options (MR increments)
        let remainingPool = 0;
        let skillSpendOptions = [];
        if (isSkillRoll && skillKey && actor) {
            const actorData = actor.system;
            const skillRating = actorData.skills?.[skillKey] || 0;
            const skillsSpent = actorData.skillsSpent?.[skillKey] || 0;
            remainingPool = Math.max(0, skillRating - skillsSpent);
            const MR = actorData.mastery?.rank || 2;
            const diceTotal = result.kept.reduce((sum, d) => sum + d, 0) + (baseModifier || 0);
            // Stone bonus raises count only on full raise success; include in spend previews when applicable.
            const stoneBonusRaises = Math.max(0, result.stoneBonusRaises ?? 0);
            const fullRaiseSuccess = result.raiseOutcome === 'full';
            // Players Guide ~1836–1838: spend either 0, an MR-step (MR / 2MR / 3MR …)
            // *or* the entire remaining pool (the all-in option, only valid when the
            // pool is at least one MR-step). When the remaining pool is < MR the
            // only legal spend is 0, so we expose no buttons.
            if (remainingPool >= MR) {
                const added = new Set();
                for (let amount = MR; amount <= remainingPool; amount += MR) {
                    const newTotal = diceTotal + amount;
                    const success = result.tn > 0 ? newTotal >= result.tn : true;
                    const raises = result.tn > 0 && success ? countMarginRaises(newTotal, result.tn) : 0;
                    const stoneExtra = fullRaiseSuccess && stoneBonusRaises > 0 ? stoneBonusRaises : 0;
                    skillSpendOptions.push({
                        amount,
                        newTotal,
                        success,
                        raises: raises + stoneExtra,
                        label: `${amount}`,
                    });
                    added.add(amount);
                }
                if (!added.has(remainingPool)) {
                    const newTotal = diceTotal + remainingPool;
                    const success = result.tn > 0 ? newTotal >= result.tn : true;
                    const raises = result.tn > 0 && success ? countMarginRaises(newTotal, result.tn) : 0;
                    const stoneExtra = fullRaiseSuccess && stoneBonusRaises > 0 ? stoneBonusRaises : 0;
                    skillSpendOptions.push({
                        amount: remainingPool,
                        newTotal,
                        success,
                        raises: raises + stoneExtra,
                        label: `All-in (${remainingPool})`,
                    });
                }
            }
        }
        const diceSum = result.total - result.skill;
        const keptIndices = result.keptIndices || [];
        const roll = buildMasteryDisplayRoll(result, result.skill);
        // Build result display HTML
        const successClass = result.success ? 'success' : 'failure';
        let content = `
      <div class="mastery-roll">
        <div class="roll-header">
          <h3>${label}</h3>
          ${flavor ? `<div class="flavor">${flavor}</div>` : ''}
        </div>
        
        <div class="roll-details">
          <div class="roll-breakdown">
            <div class="breakdown-line">
              <span>Rolled ${result.dice.length}d8, kept ${result.kept.length}</span>
            </div>
            <div class="breakdown-line">
              <span>Dice Rolled:</span>
              <span class="value">${result.dice.map((d, i) => {
            const isKept = keptIndices.includes(i);
            const ch = result.dieChains?.[i];
            const label = ch && ch.length > 1 ? `${ch.join(' + ')} = ${d}` : String(d);
            return isKept ? `<strong>${label}</strong>` : label;
        }).join(', ')}</span>
            </div>
            <div class="breakdown-line">
              <span>Dice Total (kept):</span>
              <span class="value">${diceSum}</span>
            </div>
            ${result.skill > 0 ? `
              <div class="breakdown-line">
                <span>Skill Points Spent:</span>
                <span class="value">+${result.skill}</span>
              </div>
            ` : ''}
            ${baseModifier && baseModifier !== 0 ? `
              <div class="breakdown-line">
                <span>Modifier:</span>
                <span class="value">${baseModifier >= 0 ? '+' : ''}${baseModifier}</span>
              </div>
            ` : ''}
            <div class="breakdown-line total">
              <span><strong>Final Total:</strong></span>
              <span class="value"><strong>${result.total}</strong></span>
            </div>
          </div>
          
          ${result.tn > 0 || result.raiseTn > result.tn ? `
            <div class="roll-result ${successClass}">
              <div class="result-line">
                <span>Normal TN:</span>
                <span class="value">${result.tn}</span>
              </div>
              ${result.raiseTn > result.tn ? `
              <div class="result-line">
                <span>Raise TN:</span>
                <span class="value">${result.raiseTn}</span>
              </div>` : ''}
              <div class="result-line">
                <span><strong>Result:</strong></span>
                <span class="value"><strong>${result.raiseOutcome === 'partial'
            ? 'SUCCESS (Raise failed)'
            : result.success
                ? 'SUCCESS'
                : 'FAILURE'}</strong></span>
              </div>
              ${result.raises > 0 ? `
                <div class="result-line">
                  <span><strong>Raises:</strong></span>
                  <span class="value"><strong>${result.raises}</strong></span>
                </div>
              ` : ''}
            </div>
          ` : ''}
        </div>
        
        ${isSkillRoll && skillKey && actorId && skillSpendOptions.length > 0 ? `
          <div class="skill-spend-panel">
            <div class="skill-spend-header">
              <h4>Spend Skill Points</h4>
              <span class="skill-pool-info">Pool: ${remainingPool}/${actor.system?.skills?.[skillKey] || 0}</span>
            </div>
            <div class="skill-spend-buttons">
              ${skillSpendOptions.map(opt => `
                <button type="button" class="skill-spend-btn ${opt.success && !result.success ? 'skill-spend-success' : ''}" data-action="spend-skill-success" data-spend="${opt.amount}" data-skill-key="${skillKey}" data-actor-id="${actorId}">
                  +${opt.label} → ${opt.newTotal}${result.tn > 0 ? (opt.success ? ` ✓${opt.raises > 0 ? ` (${opt.raises} raise${opt.raises > 1 ? 's' : ''})` : ''}` : ' ✗') : ''}
                </button>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
        // Flags: omit dieChains — they duplicate explosion data already in rolls[] and can bloat
        // message flags (Forge / large pools), which may break chat create or sync after a few rolls.
        const { dieChains: _omitDieChainsFromFlags, ...rollResultForFlags } = result;
        // Create chat message with serialized Roll object (Foundry v13 expects serialized rolls)
        // Use roll.toJSON() to serialize the roll properly
        const chatData = {
            user: game.user?.id,
            speaker: actor ? ChatMessage.getSpeaker({ actor }) : ChatMessage.getSpeaker(),
            content,
            // Do not force style to OTHER - let Foundry infer roll display from presence of rolls
            rolls: [roll.toJSON()],
            sound: CONFIG.sounds.dice,
            flags: {
                'mastery-system': {
                    rollResult: rollResultForFlags,
                    // Any roll may be rerolled at most once — a message that already IS
                    // a reroll result can never be rerolled again (no chaining).
                    canReroll: !isRerollResult,
                    isRerollResult: !!isRerollResult,
                    rollRecipe: rollRecipe || null,
                    isSkillRoll: isSkillRoll || false,
                    skillKey: skillKey || null,
                    actorId: actorId || null,
                    baseModifier: baseModifier || 0,
                    skillSpentApplied: false,
                    faithRerollConsumed: false
                }
            }
        };
        await ChatMessage.create(chatData);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Mastery System | Error sending roll to chat:', error);
        ui.notifications.error(`Failed to send mastery roll to chat: ${errorMessage}`);
        throw error;
    }
}
/**
 * Quick roll from actor
 * Helper function to make rolling easier
 */
export async function quickRoll(actor, attributeName, skillName, tn, label, modifier, flavor) {
    const actorData = actor.system;
    // Base pool = attribute value. Specials, Health/Encumbrance penalties and
    // the final Minimum Pool (= Mastery Rank) are applied centrally inside
    // `masteryRoll` in canonical order (`applyPoolPenalties: true`).
    const numDice = actorData.attributes?.[attributeName]?.value || 0;
    // Get mastery rank (number to keep)
    const keepDice = actorData.mastery?.rank || 1;
    // For skill rolls, do NOT auto-add skill bonus - it's now a consumable resource spent after the roll
    // Only use provided modifier if explicitly given (for non-skill rolls or situational modifiers)
    const skillBonus = modifier !== undefined ? modifier : 0;
    // Build label
    const rollLabel = label || `${attributeName.charAt(0).toUpperCase() + attributeName.slice(1)} Roll`;
    let flavorText = flavor || '';
    // If no flavor provided, build default
    if (!flavorText) {
        if (skillName) {
            // For skill rolls, show pool info
            const skillRating = actorData.skills?.[skillName] || 0;
            const skillsSpent = actorData.skillsSpent?.[skillName] || 0;
            const remainingPool = Math.max(0, skillRating - skillsSpent);
            flavorText = `Skill: ${skillName} (Pool ${remainingPool}/${skillRating})`;
        }
        else if (modifier !== undefined) {
            flavorText = `modifier: ${modifier >= 0 ? '+' : ''}${modifier}`;
        }
    }
    return await masteryRoll({
        numDice,
        keepDice,
        skill: skillBonus, // Use modifier if provided, otherwise 0 (for skill rolls, skill points are spent after roll)
        tn,
        label: rollLabel,
        flavor: flavorText,
        actorId: actor.id,
        skillKey: skillName,
        isSkillRoll: !!skillName,
        baseModifier: modifier,
        rollKind: skillName ? 'skill' : 'generic',
        poolAttribute: attributeName,
        applyPoolPenalties: true
    });
}
// Export functions
export default {
    masteryRoll,
    quickRoll
};
//# sourceMappingURL=roll-handler.js.map