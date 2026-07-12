/**
 * Initiative Rolling System
 * Each round: Mastery Rank d8 (keep all, 8s explode) + optional Combat Reflexes spend (≤ MR×4, pool-limited).
 * Final score before the Initiative Shop = dice total + CR spent.
 */
import { masteryRoll } from '../dice/roll-handler.js';
import { calculateMaxSkillRank } from '../utils/calculations.js';
import { getEquippedEquipmentInitiativeModifier } from '../utils/equipment-modifiers.js';
import { readManualAdjustments } from '../utils/manual-adjustments.js';
import { buildCombatTurnSnapshot, buildCombatantsIteratorOrder, logCombatTrace, logInitiativeOrderDebug, } from '../utils/combat-trace-debug.js';
const CR_SKILL_KEY = 'combatReflexes';
function getMasteryRank(actor) {
    if (!actor || !actor.system)
        return 2;
    const system = actor.system;
    return system.mastery?.rank || 2;
}
/**
 * Limits for spending Combat Reflexes on initiative (used by Initiative Shop dropdown).
 */
export function getCombatReflexesInitiativeLimits(actor, masteryRank) {
    const rating = Number(actor?.system?.skills?.[CR_SKILL_KEY] ?? 0);
    const spent = Number(actor?.system?.skillsSpent?.[CR_SKILL_KEY] ?? 0);
    const remainingPool = Math.max(0, rating - spent);
    const capPerRoll = calculateMaxSkillRank(masteryRank);
    const maxThisRoll = Math.min(capPerRoll, remainingPool);
    return { maxThisRoll, remainingPool, capPerRoll };
}
/**
 * Roll initiative for one combatant (dice + optional CR). Sets combatant.initiative to the pre-shop total.
 * NPCs: dice only. PCs: may prompt to spend CR (owner/GM).
 */
export async function rollInitiativeForCombatant(combatant, options = {}) {
    /** CR wird im Initiative-Shop per Dropdown gesetzt (kein separates Popup). */
    const { promptCombatReflexes = false } = options;
    const actor = combatant.actor;
    if (!actor) {
        console.error('Mastery System | Cannot roll initiative: combatant has no actor');
        return {
            diceTotal: 0,
            combatReflexesSpent: 0,
            totalInitiative: 0,
            equipmentInitiativeModifier: 0,
            masteryRank: 2,
            rollResult: null
        };
    }
    const masteryRank = getMasteryRank(actor);
    const equipmentInitiativeModifier = getEquippedEquipmentInitiativeModifier(actor);
    const equipFlavor = equipmentInitiativeModifier !== 0
        ? ` · Equipment ${equipmentInitiativeModifier >= 0 ? '+' : ''}${equipmentInitiativeModifier} (armor/shield/weapon)`
        : '';
    // Players Guide attribute scaling (~5969–5973): +floor(Wits/8) initiative.
    // Read from the actor's pre-derived `system.scaling.witsInitiativeBonus` so
    // any rank-up / mid-encounter Wits change is reflected immediately.
    const witsInitBonus = Math.max(0, Math.floor(Number(actor?.system?.scaling?.witsInitiativeBonus ?? 0) || 0));
    const witsFlavor = witsInitBonus > 0 ? ` · Wits scaling +${witsInitBonus}` : '';
    // Manual Adjustments — character-sheet-authored flat + bonus d8 applied on
    // top of Mastery-Rank d8. Initiative is not a "typed roll kind" in the
    // `masteryRoll` pipeline, so we apply the bonus directly here.
    const manualAdj = actor.type === 'character' ? readManualAdjustments(actor) : null;
    const manualInitiativeFlat = manualAdj?.combat.initiative ?? 0;
    const passiveInitiativeBonus = Math.max(0, Math.floor(Number(actor.system?.combat?.initiativeFromMechanics ?? 0) || 0));
    const passiveInitFlavor = passiveInitiativeBonus > 0 ? ` · Passive Initiative +${passiveInitiativeBonus}` : '';
    const manualInitiativeDice = Math.max(0, manualAdj?.rolls?.any?.dice ?? 0);
    const initiativeNumDice = Math.max(1, masteryRank + manualInitiativeDice);
    const manualFlavorParts = [];
    if (manualInitiativeDice > 0)
        manualFlavorParts.push(`+${manualInitiativeDice}d8 Manual Bonus`);
    if (manualInitiativeFlat !== 0) {
        manualFlavorParts.push(`${manualInitiativeFlat > 0 ? '+' : ''}${manualInitiativeFlat} Manual Bonus (init)`);
    }
    const manualFlavor = manualFlavorParts.length ? ` · ${manualFlavorParts.join(' · ')}` : '';
    const rollResult = await masteryRoll({
        numDice: initiativeNumDice,
        keepDice: initiativeNumDice,
        skill: 0,
        label: 'Initiative Roll',
        flavor: `${actor.name}${equipFlavor}${witsFlavor}${passiveInitFlavor}${manualFlavor}`,
        actorId: actor.id
    });
    const diceTotal = rollResult.total;
    let combatReflexesSpent = 0;
    const isPc = actor.type === 'character';
    const user = game.user;
    const mayPromptCr = isPc &&
        promptCombatReflexes &&
        user &&
        (user.isGM || actor.isOwner);
    if (mayPromptCr) {
        const { maxThisRoll } = getCombatReflexesInitiativeLimits(actor, masteryRank);
        if (maxThisRoll > 0) {
            combatReflexesSpent = await new Promise((resolve) => {
                new Dialog({
                    title: 'Combat Reflexes (Initiative)',
                    content: `<form><div class="form-group">
<label>Combat Reflexes to add to initiative (0–${maxThisRoll})</label>
<input type="number" name="cr" min="0" max="${maxThisRoll}" value="0" step="1"/>
</div></form>`,
                    buttons: {
                        apply: {
                            label: 'Apply',
                            callback: (html) => {
                                const raw = Number(html.find('[name="cr"]').val());
                                const v = Number.isFinite(raw) ? Math.max(0, Math.min(maxThisRoll, Math.floor(raw))) : 0;
                                resolve(v);
                            }
                        },
                        none: { label: 'None', callback: () => resolve(0) }
                    },
                    default: 'apply'
                }).render(true);
            });
        }
        if (combatReflexesSpent > 0) {
            const prevSpent = Number(actor.system?.skillsSpent?.[CR_SKILL_KEY] ?? 0);
            await actor.update({
                [`system.skillsSpent.${CR_SKILL_KEY}`]: prevSpent + combatReflexesSpent
            });
        }
    }
    const totalInitiative = diceTotal +
        combatReflexesSpent +
        equipmentInitiativeModifier +
        manualInitiativeFlat +
        passiveInitiativeBonus +
        witsInitBonus;
    await combatant.update({ initiative: totalInitiative });
    await combatant.setFlag('mastery-system', 'msInitiativeValue', totalInitiative);
    if (isPc) {
        await combatant.setFlag('mastery-system', 'pendingInitiativeShop', {
            diceTotal,
            combatReflexesSpent,
            totalInitiative,
            equipmentInitiativeModifier,
            masteryRank
        });
    }
    console.log('Mastery System | Initiative rolled', {
        actor: actor.name,
        diceTotal,
        combatReflexesSpent,
        equipmentInitiativeModifier,
        totalInitiative,
        masteryRank
    });
    return {
        diceTotal,
        combatReflexesSpent,
        totalInitiative,
        equipmentInitiativeModifier,
        masteryRank,
        rollResult
    };
}
/**
 * Full initiative phase: NPCs auto; PCs with owner/GM get shop; others auto roll without CR prompt.
 */
export async function executeInitiativePhase(combat) {
    const { InitiativeShopDialog } = await import('./initiative-shop-dialog.js');
    console.log('Mastery System | Initiative phase for combat', combat.id, 'round', combat.round);
    logInitiativeOrderDebug('executeInitiativePhase.start', {
        note: '`turns` before rolls/shops; `combatants` is encounter iteration order (may differ).',
        snapshot: buildCombatTurnSnapshot(combat),
        combatantsIteratorOrder: buildCombatantsIteratorOrder(combat),
    });
    const npcs = [];
    const pcs = [];
    for (const combatant of combat.combatants) {
        if (!combatant.actor)
            continue;
        const t = combatant.actor.type;
        if (t === 'npc' || t === 'summon' || t === 'divine')
            npcs.push(combatant);
        else if (t === 'character')
            pcs.push(combatant);
    }
    for (const npc of npcs) {
        await rollInitiativeForCombatant(npc, { promptCombatReflexes: false });
        await new Promise((r) => setTimeout(r, 200));
    }
    for (const pc of pcs) {
        const actor = pc.actor;
        if (!actor)
            continue;
        const user = game.user;
        if (!user)
            continue;
        if (user.isGM || actor.isOwner) {
            const breakdown = await rollInitiativeForCombatant(pc, { promptCombatReflexes: false });
            try {
                await InitiativeShopDialog.showForCombatant(pc, breakdown, combat);
            }
            catch (error) {
                console.error('Mastery System | Failed to show Initiative Shop', error);
            }
        }
        else {
            await rollInitiativeForCombatant(pc, { promptCombatReflexes: false });
        }
        await new Promise((r) => setTimeout(r, 500));
    }
    // Combatants with null initiative are omitted from `combat.turns`, so the round
    // appears to advance early (fewer turns per round than combatants). Pin unset values.
    for (const c of combat.combatants) {
        if (c.initiative === null || c.initiative === undefined) {
            await c.update({ initiative: 0 });
        }
    }
    logInitiativeOrderDebug('executeInitiativePhase.beforeSetupTurns', {
        note: 'After all rolls/shops and null→0 initiative pin; Foundry has not re-sorted yet.',
        snapshot: buildCombatTurnSnapshot(combat),
        combatantsIteratorOrder: buildCombatantsIteratorOrder(combat),
    });
    if (typeof combat.setupTurns === 'function') {
        await combat.setupTurns();
    }
    logInitiativeOrderDebug('executeInitiativePhase.afterSetupTurns.beforeSync', {
        note: '`combat.turn` is Foundry default after setupTurns; next step applies Mastery first-actor rule.',
        snapshot: buildCombatTurnSnapshot(combat),
        combatantsIteratorOrder: buildCombatantsIteratorOrder(combat),
    });
    await syncCombatTurnToHighestInitiativeFirst(combat);
    logCombatTrace('initiative-phase-after-setupTurns', {
        snapshot: buildCombatTurnSnapshot(combat),
    });
    logInitiativeOrderDebug('executeInitiativePhase.end', {
        note: 'After syncCombatTurnToHighestInitiativeFirst.',
        snapshot: buildCombatTurnSnapshot(combat),
        combatantsIteratorOrder: buildCombatantsIteratorOrder(combat),
    });
}
/**
 * Index of the combatant who should act first: highest initiative (desc).
 * Tie-break: lexicographically smaller combatant id (deterministic; avoids implicit player-first ordering).
 * Non-defeated beats defeated at equal initiative.
 */
export function findTurnIndexHighestInitiativeFirst(combat) {
    const turns = Array.isArray(combat.turns) ? [...combat.turns] : [];
    if (!turns.length)
        return Math.max(0, Number(combat.turn) || 0);
    const candidateBeatsBest = (best, cand) => {
        const bd = !!best?.defeated;
        const cd = !!cand?.defeated;
        if (!bd && cd)
            return false;
        if (bd && !cd)
            return true;
        const bi = Number(best?.initiative ?? -Infinity);
        const ci = Number(cand?.initiative ?? -Infinity);
        if (ci > bi)
            return true;
        if (ci < bi)
            return false;
        return String(cand.id ?? '') < String(best.id ?? '');
    };
    let bestIdx = 0;
    for (let i = 1; i < turns.length; i++) {
        if (candidateBeatsBest(turns[bestIdx], turns[i]))
            bestIdx = i;
    }
    return bestIdx;
}
/** After `setupTurns()`, ensure `combat.turn` points at highest-initiative combatant (Mastery first-actor rule). */
export async function syncCombatTurnToHighestInitiativeFirst(combat) {
    try {
        const turns = Array.isArray(combat.turns) ? [...combat.turns] : [];
        const desired = findTurnIndexHighestInitiativeFirst(combat);
        const chosen = turns[desired];
        logInitiativeOrderDebug('syncCombatTurnToHighestInitiativeFirst', {
            tieBreakRule: 'Highest initiative in `combat.turns`; non-defeated over defeated; tie → lexicographically smaller combatant.id',
            foundryTurnIndexBefore: combat.turn,
            masteryHighestIniFirstIndex: desired,
            willUpdateTurnPointer: desired !== combat.turn,
            chosenFirstActor: chosen
                ? {
                    combatantId: chosen.id,
                    name: chosen.name,
                    initiative: chosen.initiative ?? null,
                    defeated: !!chosen.defeated,
                }
                : null,
            snapshot: buildCombatTurnSnapshot(combat),
            combatantsIteratorOrder: buildCombatantsIteratorOrder(combat),
        });
        if (desired !== combat.turn) {
            await combat.update({ turn: desired });
            logInitiativeOrderDebug('syncCombatTurnToHighestInitiativeFirst.afterUpdate', {
                requestedTurnIndex: desired,
                snapshot: buildCombatTurnSnapshot(combat),
            });
        }
    }
    catch (e) {
        console.warn('Mastery System | syncCombatTurnToHighestInitiativeFirst failed', e);
    }
}
/** @deprecated Prefer executeInitiativePhase; kept for compatibility. */
export async function rollInitiativeForAllCombatants(combat) {
    await executeInitiativePhase(combat);
}
/**
 * Open Initiative Shop from combat tracker: reuse pending roll context if shop not confirmed yet (encounter setup rescue).
 */
export async function openInitiativeShopForTrackerRescue(combatant, combat) {
    const { InitiativeShopDialog } = await import('./initiative-shop-dialog.js');
    const setup = combat.flags?.['mastery-system']?.encounterSetup;
    const confirmed = setup?.initiativeConfirmed?.[combatant.id] === true;
    const pending = (await combatant.getFlag('mastery-system', 'pendingInitiativeShop'));
    if (!confirmed && pending && typeof pending.diceTotal === 'number') {
        await InitiativeShopDialog.showForCombatant(combatant, pending, combat);
        return;
    }
    const breakdown = await rollInitiativeForCombatant(combatant, { promptCombatReflexes: false });
    await InitiativeShopDialog.showForCombatant(combatant, breakdown, combat);
}
//# sourceMappingURL=initiative-roll.js.map