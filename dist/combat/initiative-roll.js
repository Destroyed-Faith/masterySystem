/**
 * Initiative Rolling System
 * Rolled ONCE at combat start: Mastery Rank d8 (keep all, 8s explode) + optional Combat
 * Reflexes. The score persists until spent (Initiative Exchange → Colorless Stones)
 * or another rule changes it.
 */
import { masteryRoll } from '../dice/roll-handler.js';
import { getRoundState } from './action-economy.js';
import { getEquippedEquipmentInitiativeModifier } from '../utils/equipment-modifiers.js';
import { readManualAdjustments } from '../utils/manual-adjustments.js';
import { formatNpcInitiativeSigned, getNpcInitiativeModifier, } from '../utils/npc-initiative.js';
import { resetCombatReflexesRoundUsage } from './combat-reflexes.js';
export { getCombatReflexesInitiativeLimits } from './combat-reflexes.js';
function getMasteryRank(actor) {
    if (!actor || !actor.system)
        return 2;
    const system = actor.system;
    return system.mastery?.rank || 2;
}
/**
 * Roll initiative for one combatant: Mastery Rank d8 plus the flat modifiers.
 * Combat Reflexes are added afterwards in the Initiative Exchange row, so the
 * roll no longer interrupts with a popup.
 */
export async function rollInitiativeForCombatant(combatant, _options = {}) {
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
    // NPC / Summon sheet Ini (−10…+10) — flat on the Mastery Rank d8 total.
    const isNpcLike = actor.type === 'npc' || actor.type === 'summon';
    const npcInitiativeModifier = isNpcLike ? getNpcInitiativeModifier(actor) : 0;
    const npcIniFlavor = npcInitiativeModifier !== 0
        ? ` · Sheet Ini ${formatNpcInitiativeSigned(npcInitiativeModifier)}`
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
        flavor: `${actor.name}${equipFlavor}${witsFlavor}${passiveInitFlavor}${manualFlavor}${npcIniFlavor}`,
        actorId: actor.id
    });
    const diceTotal = rollResult.total;
    const isPc = actor.type === 'character';
    // A fresh roll replaces the score, so points added for the previous score are
    // gone with it — the per-round budget starts over.
    const combatReflexesSpent = 0;
    await resetCombatReflexesRoundUsage(combatant);
    // Wits "Initiative Boost" stone power chosen BEFORE this roll (stone phase
    // precedes the initiative phase): fold it into the score here. The boost is
    // temporary ("this round") — record it so the round-advance pipeline can
    // revert it. A reroll replaces the score, so the flag is replaced (not added).
    let stoneInitiativeBonus = 0;
    try {
        const roundState = getRoundState(actor, game.combat);
        stoneInitiativeBonus = Math.max(0, Math.floor(Number(roundState?.stoneBonuses?.initiativeBonus ?? 0) || 0));
    }
    catch {
        /* no round state outside combat */
    }
    const totalInitiative = diceTotal +
        combatReflexesSpent +
        equipmentInitiativeModifier +
        manualInitiativeFlat +
        passiveInitiativeBonus +
        witsInitBonus +
        stoneInitiativeBonus +
        npcInitiativeModifier;
    await combatant.update({ initiative: totalInitiative });
    await combatant.setFlag('mastery-system', 'msInitiativeValue', totalInitiative);
    await combatant.setFlag('mastery-system', 'msInitiativeBoostThisRound', stoneInitiativeBonus);
    if (isPc) {
        await combatant.setFlag('mastery-system', 'pendingInitiativeShop', {
            diceTotal,
            combatReflexesSpent,
            totalInitiative,
            equipmentInitiativeModifier,
            masteryRank
        });
    }
    return {
        diceTotal,
        combatReflexesSpent,
        totalInitiative,
        equipmentInitiativeModifier,
        masteryRank,
        rollResult
    };
}
/** True when an NPC still needs a real initiative roll (Foundry often seeds 0). */
export function needsNpcInitiativeRoll(combatant, force = false) {
    const t = combatant.actor?.type;
    if (t !== 'npc' && t !== 'summon' && t !== 'divine')
        return false;
    if (force)
        return true;
    if (combatant.getFlag?.('mastery-system', 'npcInitiativeRolled'))
        return false;
    const ini = combatant.initiative;
    return ini == null || Number(ini) === 0;
}
/** Roll initiative for NPCs / summons / divine only. PCs roll on their own client. */
export async function rollNpcInitiativeOnly(combat, opts = {}) {
    if (!game.user?.isGM)
        return 0;
    let rolled = 0;
    for (const combatant of combat.combatants) {
        if (!combatant.actor)
            continue;
        if (!needsNpcInitiativeRoll(combatant, opts.force === true))
            continue;
        await rollInitiativeForCombatant(combatant, { promptCombatReflexes: false });
        try {
            await combatant.setFlag('mastery-system', 'npcInitiativeRolled', true);
        }
        catch {
            /* best-effort */
        }
        rolled += 1;
        await new Promise((r) => setTimeout(r, 200));
    }
    return rolled;
}
/**
 * After Stone Powers / Initiative Exchange: leftover NPCs roll, then sort.
 * PCs roll inside the Stone Powers dialog.
 */
export async function executeInitiativePhase(combat) {
    if (!game.user?.isGM)
        return;
    await rollNpcInitiativeOnly(combat);
    // Combatants with null initiative are omitted from `combat.turns`. Pin leftovers.
    for (const c of combat.combatants) {
        if (c.actor?.type === 'character')
            continue;
        if (c.initiative === null || c.initiative === undefined) {
            await c.update({ initiative: 0 });
        }
    }
    if (typeof combat.setupTurns === 'function') {
        await combat.setupTurns();
    }
    await syncCombatTurnToHighestInitiativeFirst(combat);
}
function isPlayerCombatant(combatant) {
    return combatant?.actor?.type === 'character';
}
function initiativeAttrValue(combatant, key) {
    return Math.floor(Number(combatant?.actor?.system?.attributes?.[key]?.value) || 0);
}
/**
 * Sort compare: lower result acts first.
 * Higher initiative first. Ties: player (character) before NPC/summon.
 * Player vs player (or any remaining tie): Agility, then Wits, then Intellect, then Resolve.
 */
export function compareInitiativeCombatants(a, b) {
    const aDefeated = !!a?.defeated;
    const bDefeated = !!b?.defeated;
    if (aDefeated !== bDefeated)
        return aDefeated ? 1 : -1;
    const ia = Number.isFinite(Number(a?.initiative)) ? Number(a.initiative) : Number.NEGATIVE_INFINITY;
    const ib = Number.isFinite(Number(b?.initiative)) ? Number(b.initiative) : Number.NEGATIVE_INFINITY;
    if (ia !== ib)
        return ib - ia;
    const aPlayer = isPlayerCombatant(a);
    const bPlayer = isPlayerCombatant(b);
    if (aPlayer !== bPlayer)
        return aPlayer ? -1 : 1;
    for (const key of ['agility', 'wits', 'intellect', 'resolve']) {
        const av = initiativeAttrValue(a, key);
        const bv = initiativeAttrValue(b, key);
        if (av !== bv)
            return bv - av;
    }
    const aid = String(a?.id ?? '');
    const bid = String(b?.id ?? '');
    if (aid === bid)
        return 0;
    return aid < bid ? -1 : 1;
}
/** Remaining shop score after purchases. May be negative — do not clamp to 0. */
export function remainingInitiativeAfterShop(pool, cost) {
    const raw = Number(pool);
    const p = Number.isFinite(raw) ? Math.floor(raw) : 0;
    const c = Math.max(0, Math.floor(Number(cost) || 0));
    return p - c;
}
function listInitiativeCombatants(combat) {
    if (Array.isArray(combat.turns) && combat.turns.length)
        return [...combat.turns];
    const bag = combat.combatants;
    if (!bag)
        return [];
    if (typeof bag.values === 'function') {
        return Array.from(bag.values());
    }
    return Array.from(bag);
}
/**
 * Index of the combatant who should act first (same rules as combat sort).
 */
export function findTurnIndexHighestInitiativeFirst(combat) {
    const turns = listInitiativeCombatants(combat);
    if (!turns.length)
        return Math.max(0, Number(combat.turn) || 0);
    let bestIdx = 0;
    for (let i = 1; i < turns.length; i++) {
        if (compareInitiativeCombatants(turns[bestIdx], turns[i]) > 0)
            bestIdx = i;
    }
    return bestIdx;
}
/** Foundry turn order uses the same Mastery tie-break as the first-actor sync. */
export function initializeInitiativeOrder() {
    const CombatClass = globalThis.CONFIG?.Combat?.documentClass;
    if (CombatClass?.prototype) {
        CombatClass.prototype._sortCombatants = function sortMasteryCombatants(a, b) {
            return compareInitiativeCombatants(a, b);
        };
    }
    // Foundry startCombat always seeds turn: 0. Put the highest Ini there before the update lands.
    Hooks.on('combatStart', (combat, updateData) => {
        if (!updateData || typeof updateData !== 'object')
            return;
        updateData.turn = findTurnIndexHighestInitiativeFirst(combat);
    });
}
/** After `setupTurns()`, ensure `combat.turn` points at highest-initiative combatant (Mastery first-actor rule). */
export async function syncCombatTurnToHighestInitiativeFirst(combat) {
    try {
        const turns = listInitiativeCombatants(combat);
        const desired = findTurnIndexHighestInitiativeFirst(combat);
        const currentId = combat.combatant?.id ?? turns[Number(combat.turn) || 0]?.id;
        const desiredId = turns[desired]?.id;
        if (desired === combat.turn && currentId === desiredId)
            return;
        await combat.update({ turn: desired });
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
 * Tracker / sheet rescue: open Stone Powers (Initiative Exchange lives there now).
 */
export async function openInitiativeShopForTrackerRescue(combatant, combat) {
    const actor = combatant.actor;
    if (!actor)
        return false;
    const { StonePowersDialog } = await import('../stones/stone-powers-dialog.js');
    return StonePowersDialog.showForActor(actor, combatant);
}
//# sourceMappingURL=initiative-roll.js.map