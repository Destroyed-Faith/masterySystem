/**
 * Dice rolling handler for Mastery System
 * Implements Roll & Keep with exploding 8s
 */
import { EXPLODE_VALUE, RAISE_INCREMENT } from '../utils/constants.js';
import { applyGuaranteedEightExchange, maxGuaranteedEights, rollGuaranteedEightChain, } from '../progression/v099-rules.js';
import { resolveRaiseOutcome } from '../combat/raise-resolution.js';
import { finalizeRolledPool } from './pool-finalize.js';
import { buildOpposedSkillTn } from './roll-context-build.js';
import { manualKindFromRollKind, manualRollBonusForKind, readManualAdjustments, } from '../utils/manual-adjustments.js';
import { getRulesMasteryRank } from '../utils/mastery-rank-sync.js';
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
/** @internal Exported for Crit / Disadvantage pool unit tests. */
export function rollMasteryPoolDice(numDice, options) {
    return rollDice(numDice, options);
}
function rollDice(numDice, options) {
    const explodeOn78 = !!options?.explodeOn78;
    const rollAdvantage = !!options?.rollAdvantage;
    const rollDisadvantage = !!options?.rollDisadvantage;
    const dice = [];
    const exploded = [];
    const dieChains = [];
    if (rollDisadvantage) {
        // Phase 1: roll every die flat (no explosions yet). Phase 2: explode
        // exactly one eligible die (8 normally; 7–8 with Crit). Any choice among
        // eligible faces is equivalent for the explosion expectation.
        const initial = [];
        for (let i = 0; i < numDice; i++) {
            let face = rollFlatD8();
            if (rollAdvantage && face === 1)
                face = rollFlatD8();
            initial.push(face);
        }
        const explodeFaceMin = explodeOn78 ? 7 : 8;
        const explodeIndex = initial.findIndex((f) => f >= explodeFaceMin);
        for (let i = 0; i < numDice; i++) {
            const face = initial[i];
            if (i === explodeIndex) {
                const tail = explodeOn78 ? rollExplodingDieChain78() : rollExplodingDieChain();
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
/** Prompt only when Dialog exists and at least one Guaranteed Eight is legal. */
async function promptGuaranteedEights(max, pool, masteryRank) {
    const DialogCtor = globalThis.Dialog;
    if (!DialogCtor || max <= 0)
        return 0;
    const options = Array.from({ length: max + 1 }, (_, n) => {
        const rolled = pool - n * 8;
        const label = n === 0
            ? `0 — roll ${pool} dice`
            : `${n} — ${rolled} dice + ${n} Guaranteed Eight${n === 1 ? '' : 's'}`;
        return `<option value="${n}">${label}</option>`;
    }).join('');
    return await new Promise((resolve) => {
        let settled = false;
        const finish = (n) => {
            if (settled)
                return;
            settled = true;
            resolve(Math.max(0, Math.min(max, Math.floor(n) || 0)));
        };
        try {
            const dialog = new DialogCtor({
                title: 'Guaranteed Eight',
                content: `<form class="mastery-guaranteed-eight">
          <p>Exchange 8 dice from the final pool for 1 Guaranteed Eight. At least ${masteryRank} dice must still be rolled. A Guaranteed Eight does not count toward that minimum.</p>
          <div class="form-group"><label>Guaranteed Eights</label>
            <select name="guaranteedEights">${options}</select>
          </div>
        </form>`,
                buttons: {
                    roll: {
                        icon: '<i class="fas fa-dice-d8"></i>',
                        label: 'Roll',
                        callback: (html) => {
                            const jq = html?.find?.('[name="guaranteedEights"]');
                            const raw = jq?.val?.() ?? html?.querySelector?.('[name="guaranteedEights"]')?.value;
                            finish(Number(raw) || 0);
                        },
                    },
                },
                default: 'roll',
                close: () => finish(0),
            });
            dialog.render(true);
        }
        catch {
            finish(0);
        }
    });
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
    let stoneBonusRaises = Math.max(0, Math.floor(options.stoneBonusRaises ?? 0));
    if (stoneBonusRaises > 0 && options.actorId && !options.isRerollResult) {
        try {
            const actor = globalThis.game?.actors?.get?.(options.actorId);
            if (actor) {
                const { consumeFreeRaises } = await import('../combat/action-economy.js');
                stoneBonusRaises = await consumeFreeRaises(actor, stoneBonusRaises);
            }
        }
        catch (err) {
            console.warn('Mastery System | Free Raise spend failed', err);
        }
    }
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
                // Mechanics-engine dice delta — only for the kinds the engine tracks
                // (attack / skill / damage). Generic and contest pools get none.
                if (kind === 'attack' || kind === 'skill' || kind === 'damage') {
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
    // (only when `applyPoolPenalties` is set). There is no Mastery Rank floor.
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
                    ...(options.applyFear !== undefined ? { applyFear: options.applyFear } : {}),
                });
                numDice = finalized.numDice;
                if (numDice <= 0) {
                    keepDice = 0;
                    autoFailReason = finalized.autoFailReason || 'Pool of 0 dice';
                }
                else if (keepDice > numDice) {
                    keepDice = numDice;
                }
                autoFailReason = autoFailReason || finalized.autoFailReason;
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
    const poolBeforeGuaranteed = numDice;
    let guaranteedEights = 0;
    const poolAndKeep = options.poolAndKeep !== false && kind !== 'damage';
    if (poolAndKeep && !autoFailReason) {
        let masteryRank = Math.max(1, keepDice);
        try {
            const geActor = options.actorRef ??
                (options.actorId ? globalThis.game?.actors?.get?.(options.actorId) : null);
            if (geActor)
                masteryRank = getRulesMasteryRank(geActor);
        }
        catch {
            /* keep the Keep count as the floor */
        }
        const maxGe = maxGuaranteedEights(numDice, masteryRank);
        let requested = 0;
        if (maxGe > 0 && typeof options.guaranteedEights === 'number') {
            requested = Math.floor(options.guaranteedEights);
        }
        else if (maxGe > 0 && typeof options.guaranteedEights !== 'number') {
            requested = await promptGuaranteedEights(maxGe, numDice, masteryRank);
        }
        if (requested > 0) {
            const exchanged = applyGuaranteedEightExchange(numDice, masteryRank, requested);
            if (exchanged.ok && exchanged.guaranteedEights > 0) {
                guaranteedEights = exchanged.guaranteedEights;
                numDice = exchanged.rolledDice;
                const label = guaranteedEights === 1 ? '1 Guaranteed Eight' : `${guaranteedEights} Guaranteed Eights`;
                const note = `Pool: ${poolBeforeGuaranteed} → ${numDice} dice + ${label}`;
                flavor = flavor ? `${flavor} | ${note}` : note;
            }
        }
    }
    const explodeAttack78 = !!options.attackExplodeDiceOn78;
    if (explodeAttack78) {
        flavor = flavor ? `${flavor} | Crit: d8 pool explodes on 7–8` : 'Crit: d8 pool explodes on 7–8';
    }
    const rollAdvantage = !!options.rollAdvantage;
    const rollDisadvantage = !!options.rollDisadvantage;
    if (rollAdvantage) {
        const note = 'Advantage: reroll any face of 1 once';
        flavor = flavor ? `${flavor} | ${note}` : note;
    }
    if (rollDisadvantage) {
        const note = explodeAttack78
            ? 'Disadvantage: only one 7–8 may explode'
            : 'Disadvantage: only one 8 may explode';
        flavor = flavor ? `${flavor} | ${note}` : note;
    }
    // Both may apply at once — the book does not cancel them into a normal roll.
    const useAdv = rollAdvantage;
    const useDis = rollDisadvantage;
    const rolled = rollDice(numDice, {
        explodeOn78: explodeAttack78,
        rollAdvantage: useAdv,
        rollDisadvantage: useDis,
    });
    const geChains = [];
    const geDice = [];
    const geExploded = [];
    for (let g = 0; g < guaranteedEights; g += 1) {
        const chain = rollGuaranteedEightChain(() => Math.floor(Math.random() * 8) + 1);
        geChains.push(chain.faces);
        geDice.push(chain.total);
        if (chain.faces.length > 1)
            geExploded.push(g);
    }
    const dice = [...geDice, ...rolled.dice];
    const dieChains = [...geChains, ...rolled.dieChains];
    const exploded = [...geExploded, ...rolled.exploded.map((index) => index + guaranteedEights)];
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
        // Ordinary Skill Checks: must meet Final TN (Base + Paid×4). No margin-minted Raises.
        // Free Raises are awarded on success via freeRaisesAvailableAtSuccess (not stone bonuses).
        const freeOnSuccess = Math.max(0, Math.floor(Number(options.freeRaisesAvailableAtSuccess ?? 0) || 0));
        if (declaredRaiseSlots > 0 || raiseTnVal > normalTnVal) {
            raiseOutcome = resolveRaiseOutcome(total, normalTnVal, declaredRaiseSlots, raiseTnRollBonus);
            success = raiseOutcome === 'full';
            raises = success ? declaredRaiseSlots + freeOnSuccess + stoneBonusRaises : 0;
        }
        else {
            success = total >= normalTnVal;
            raiseOutcome = success ? 'full' : 'fail';
            raises = success ? freeOnSuccess + stoneBonusRaises : 0;
        }
    }
    else {
        raiseOutcome = resolveRaiseOutcome(total, normalTnVal, declaredRaiseSlots, raiseTnRollBonus);
        success = raiseOutcome === 'full';
        raises =
            raiseOutcome === 'full' ? declaredRaiseSlots + stoneBonusRaises : 0;
    }
    // Power combat: the decisive TN is Final TN (Base + Paid Raises × 4).
    const reportedTn = raiseModel === 'power' ? raiseTnVal : normalTnVal;
    // Create result object
    const result = {
        total,
        dice,
        kept: keptValues,
        keptIndices: keptIndices,
        skill,
        tn: reportedTn,
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
        ...(guaranteedEights > 0
            ? {
                guaranteedEights,
                poolBeforeGuaranteed,
                rolledDice: numDice,
            }
            : {}),
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
        ...(guaranteedEights > 0 ? { guaranteedEights } : {}),
        ...(options.attackCardMessageId ? { attackCardMessageId: options.attackCardMessageId } : {}),
    };
    if (!options.skipChat) {
        await sendRollToChat(result, label, flavor, options.actorId, options.skillKey, options.isSkillRoll, options.baseModifier, rollRecipe, !!options.isRerollResult, options.skillCheckMeta, options.freeRaisesAvailableAtSuccess);
    }
    if (options.skillKey === 'stealth' && options.actorId && result.success !== undefined) {
        try {
            const actor = globalThis.game?.actors?.get?.(options.actorId);
            if (actor) {
                const { applyStealthRollResult } = await import('../combat/perception-combat-hooks.js');
                await applyStealthRollResult(actor, {
                    success: !!result.success,
                    raises: result.raises ?? 0,
                    finalResult: result.total,
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
async function sendRollToChat(result, label, flavor, actorId, skillKey, isSkillRoll, baseModifier, rollRecipe, isRerollResult, skillCheckMeta, freeRaisesAvailableAtSuccess) {
    try {
        // Get actor if available
        let actor = null;
        if (actorId && game.actors) {
            actor = game.actors.get(actorId);
        }
        // DF 2026: post-roll Skill Point spend is retired. Skill rolls use Specialization Raises before the roll.
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
              <span>${result.guaranteedEights > 0
            ? `Pool: ${result.poolBeforeGuaranteed} → ${result.rolledDice} dice + ${result.guaranteedEights} Guaranteed Eight${result.guaranteedEights === 1 ? '' : 's'}`
            : `Rolled ${result.dice.length}d8, kept ${result.kept.length}`}</span>
            </div>
            <div class="breakdown-line">
              <span>Dice Rolled:</span>
              <span class="value">${result.dice.map((d, i) => {
            const isKept = keptIndices.includes(i);
            const ch = result.dieChains?.[i];
            const ge = i < (result.guaranteedEights || 0);
            let label = ch && ch.length > 1 ? `${ch.join(' + ')} = ${d}` : String(d);
            if (ge)
                label = `GE ${label}`;
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
          
          ${result.tn > 0 || result.raiseTn > 0 ? `
            <div class="roll-result ${successClass}">
              <div class="result-line">
                <span>Final TN:</span>
                <span class="value">${result.raiseTn || result.tn}</span>
              </div>
              ${result.normalTn != null && result.raiseTn > result.normalTn ? `
              <div class="result-line md-sublabel">
                <span>Base TN:</span>
                <span class="value">${result.normalTn} (+${Math.round(((result.raiseTn - result.normalTn) / 4))} Paid Raise)</span>
              </div>` : ''}
              <div class="result-line">
                <span><strong>Result:</strong></span>
                <span class="value"><strong>${result.success
            ? isSkillRoll
                ? 'SUCCESS'
                : 'HIT'
            : isSkillRoll
                ? 'FAILURE'
                : 'MISS'}</strong></span>
              </div>
              ${result.raises > 0 ? `
                <div class="result-line">
                  <span><strong>Raises available:</strong></span>
                  <span class="value"><strong>${result.raises}</strong></span>
                </div>
              ` : ''}
              ${skillCheckMeta && result.success
            ? `
              <div class="result-line md-sublabel">
                <span>Raise budget:</span>
                <span class="value">${skillCheckMeta.paidRaisesDeclared} Paid + ${skillCheckMeta.freeRaisesAvailableAtSuccess} Free</span>
              </div>`
            : ''}
              ${isSkillRoll && result.success && actor ? `
                <div class="result-line" title="Opposed Skill Rolls: if this was a Setup Roll, the Final Result is the TN the opposing creature must meet.">
                  <span>Opposing TN (Setup Roll):</span>
                  <span class="value">${buildOpposedSkillTn(result.total)}</span>
                </div>
              ` : ''}
            </div>
          ` : ''}
        </div>

        <div class="ms-skill-raise-alloc-host" data-ms-skill-raise-host="1"></div>
        
        ${isRerollResult ? '' : `
        <div class="mastery-faith-reroll-bar">
          <button type="button" class="faith-fracture-reroll-btn" title="Spend 1 Reroll Point. Once per roll.">
            <i class="fas fa-sync-alt"></i> Reroll (1 Reroll Point)
          </button>
          <span class="faith-fracture-reroll-hint">One reroll per roll, shared by the whole table. Single-die abilities may still reroll individual dice afterwards (each die once).</span>
        </div>`}
      </div>
    `;
        // Flags: omit dieChains — they duplicate explosion data already in rolls[] and can bloat
        // message flags (Forge / large pools), which may break chat create or sync after a few rolls.
        const { dieChains: _omitDieChainsFromFlags, ...rollResultForFlags } = result;
        const freeAvail = Math.max(0, Math.floor(Number(skillCheckMeta?.freeRaisesAvailableAtSuccess ?? freeRaisesAvailableAtSuccess ?? 0) || 0));
        const paidDeclared = Math.max(0, Math.floor(Number(skillCheckMeta?.paidRaisesDeclared ?? rollRecipe?.declaredRaiseSlots ?? 0) || 0));
        const skillCheckSnapshot = skillCheckMeta
            ? {
                actorId: actorId || null,
                requestId: skillCheckMeta.source?.kind === 'gm-request'
                    ? skillCheckMeta.source.requestId
                    : undefined,
                taskDescription: skillCheckMeta.taskDescription || '',
                skillName: skillCheckMeta.skillName,
                skillRankAtRoll: skillCheckMeta.skillRankAtRoll,
                attributeKey: skillCheckMeta.attributeKey,
                baseTn: result.normalTn ?? result.tn,
                paidRaisesDeclared: paidDeclared,
                freeRaisesAvailableAtSuccess: freeAvail,
                finalTn: result.raiseTn ?? result.tn,
                rollTotal: result.total,
                success: !!result.success,
                allocationStatus: result.success
                    ? paidDeclared + freeAvail > 0
                        ? 'pending'
                        : 'finalized'
                    : 'not-applicable',
                effectAllocation: {
                    scope: 0,
                    speed: 0,
                    quality: 0,
                    efficiency: 0,
                    insight: 0,
                    safety: 0,
                },
                proposedBenefit: '',
                sourceKind: skillCheckMeta.source?.kind || 'sheet-verbal',
                gmVerified: !!skillCheckMeta.gmVerified,
                schema: 'df-skill-check-2026-10-24',
            }
            : null;
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
                    faithRerollConsumed: false,
                    ...(skillCheckSnapshot ? { skillCheckSnapshot } : {}),
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
    // A pool below Mastery Rank is legal. Zero dice fails inside
    // `masteryRoll` in canonical order (`applyPoolPenalties: true`).
    const numDice = actorData.attributes?.[attributeName]?.value || 0;
    // Get mastery rank (number to keep)
    const keepDice = getRulesMasteryRank(actor);
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