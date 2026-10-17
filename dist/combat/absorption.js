/**
 * Absorption — closed premium Passive subsystem (Rules v0.9.9.5).
 *
 * No extra HP. Each Health Bar Scarred by eligible hostile damage is one
 * trigger (max 4 per combat) and grants Temporary Colorless Stones equal to
 * the Passive's stone rate. Stones arrive Ready and expire at combat end.
 */
import { getActionEconomyActor } from './action-economy.js';
const FLAG_SCOPE = 'mastery-system';
const FLAG_ACCUM = 'absorbedDamage';
const FLAG_TEMP_STONE_EXPIRY = 'absorptionStoneExpiry';
const FLAG_TRIGGERS = 'absorptionTriggers';
function actorItems(actor) {
    const items = actor?.items;
    if (!items)
        return [];
    if (Array.isArray(items))
        return items;
    if (items instanceof Map)
        return Array.from(items.values());
    if (typeof items.values === 'function')
        return Array.from(items.values());
    return [];
}
/** Find the Absorption Passive power item on an actor. */
export function findAbsorptionItem(actor) {
    if (!actor)
        return null;
    for (const item of actorItems(actor)) {
        if (item?.type !== 'power')
            continue;
        if (String(item.system?.templateId ?? '').toLowerCase() === 'passive-absorption') {
            return item;
        }
    }
    return null;
}
/** v0.9.9.5: Absorption grants no extra HP. */
export function absorptionHpPerBar(_actor) {
    return 0;
}
function absorptionLevel(actor) {
    const item = findAbsorptionItem(actor);
    if (!item)
        return 0;
    return Math.max(1, Math.min(16, Math.floor(Number(item.system?.level) || 1)));
}
export function getAbsorbedDamage(actor, combat) {
    if (!combat?.id)
        return 0;
    const flag = actor?.getFlag?.(FLAG_SCOPE, FLAG_ACCUM);
    if (!flag || flag.combatId !== String(combat.id))
        return 0;
    return Math.max(0, Math.floor(Number(flag.value) || 0));
}
/**
 * PG attack sequence step 18: after the damage instance has fully resolved,
 * accumulate eligible actual HP loss and harvest Temporary Colorless Stones.
 * Call with the HP actually removed from Health Bars (not Temp HP).
 */
/**
 * Grant Absorption stones for Health Bars that just became Scarred.
 * Returns stones granted (0 when the Passive is absent or the 4-trigger cap is full).
 */
export async function grantAbsorptionForScarredBars(actor, newlyScarred) {
    const scars = Math.max(0, Math.floor(Number(newlyScarred) || 0));
    if (scars <= 0)
        return 0;
    const owner = getActionEconomyActor(actor) ?? actor;
    const lvl = absorptionLevel(owner);
    if (lvl <= 0)
        return 0;
    const combat = globalThis.game?.combat ?? null;
    if (!combat?.id || !combat.started)
        return 0;
    const prev = owner?.getFlag?.(FLAG_SCOPE, FLAG_TRIGGERS);
    const used = prev && String(prev.combatId) === String(combat.id)
        ? Math.max(0, Math.floor(Number(prev.count) || 0))
        : 0;
    const room = Math.max(0, 4 - used);
    const triggers = Math.min(scars, room);
    if (triggers <= 0)
        return 0;
    const { absorptionStonesPerTrigger } = await import('../utils/powers/templates/passives.js');
    const stones = triggers * absorptionStonesPerTrigger(lvl);
    await owner.setFlag?.(FLAG_SCOPE, FLAG_TRIGGERS, {
        combatId: String(combat.id),
        count: used + triggers,
    });
    if (stones <= 0)
        return 0;
    try {
        const { queueAbsorptionStones } = await import('../stones/colorless-stones.js');
        await queueAbsorptionStones(owner, stones, combat);
        const g = globalThis;
        await g.ChatMessage?.create?.({
            user: g.game?.user?.id,
            speaker: g.ChatMessage?.getSpeaker?.({ actor: owner }),
            content: `<p class="mastery-reaction-msg"><strong>${String(owner.name ?? 'Character')}</strong> absorbs the wound — ` +
                `<strong>${stones} Temporary Colorless Stone${stones === 1 ? '' : 's'}</strong> ` +
                `become Ready in the next Preparation Phase ` +
                `(${triggers} Scarred bar${triggers === 1 ? '' : 's'}; ${used + triggers}/4 triggers this combat).</p>`,
        });
    }
    catch (e) {
        console.warn('Mastery System | Absorption stone grant failed', e);
        return 0;
    }
    return stones;
}
export async function accumulateAbsorbedDamage(target, hpLost, attacker) {
    const lost = Math.max(0, Math.floor(Number(hpLost) || 0));
    if (lost <= 0)
        return 0;
    const owner = getActionEconomyActor(target) ?? target;
    if (!findAbsorptionItem(owner))
        return 0;
    const combat = globalThis.game?.combat ?? null;
    if (!combat?.id || !combat.started)
        return 0; // outside combat no stones are generated
    // Self-inflicted / willing-ally damage is not eligible.
    if (attacker && String(attacker.id ?? '') === String(owner.id ?? ''))
        return 0;
    const vitality = Math.max(1, Math.floor(Number(owner.system?.attributes?.vitality?.value) || 1));
    let accum = getAbsorbedDamage(owner, combat) + lost;
    const stones = Math.floor(accum / vitality);
    accum -= stones * vitality;
    await owner.setFlag?.(FLAG_SCOPE, FLAG_ACCUM, {
        combatId: String(combat.id),
        value: accum,
    });
    if (stones > 0) {
        try {
            const { addTempColorlessStones } = await import('../stones/colorless-stones.js');
            await addTempColorlessStones(owner, stones);
            // Absorption stones vanish at the end of the character's next turn.
            await owner.setFlag?.(FLAG_SCOPE, FLAG_TEMP_STONE_EXPIRY, {
                combatId: String(combat.id),
                round: combat.round ?? 1,
                count: stones,
            });
            const g = globalThis;
            await g.ChatMessage?.create?.({
                user: g.game?.user?.id,
                speaker: g.ChatMessage?.getSpeaker?.({ actor: owner }),
                content: `<p class="mastery-reaction-msg"><strong>${String(owner.name ?? 'Character')}</strong> absorbs the pain — ` +
                    `gains <strong>${stones} Temporary Colorless Stone${stones === 1 ? '' : 's'}</strong> ` +
                    `(1 per ${vitality} actual HP lost; ${accum} Absorbed Damage carries over). ` +
                    `Unspent Absorption stones disappear at the end of their next turn.</p>`,
            });
        }
        catch (e) {
            console.warn('Mastery System | Absorption stone grant failed', e);
        }
    }
    return stones;
}
/**
 * Turn end for the actor: Absorption-granted Temporary Colorless Stones that
 * were gained before this turn expire ("until the end of your next Turn").
 */
export async function expireAbsorptionStonesAtTurnEnd(actor, combat) {
    const owner = getActionEconomyActor(actor) ?? actor;
    const flag = owner?.getFlag?.(FLAG_SCOPE, FLAG_TEMP_STONE_EXPIRY);
    if (!flag || !combat?.id || flag.combatId !== String(combat.id))
        return;
    // Stones gained this same turn survive until the end of the NEXT turn.
    const currentRound = Number(combat.round ?? 1);
    if (currentRound <= Number(flag.round ?? 0))
        return;
    try {
        const { dropItemColorlessStones } = await import('../stones/colorless-stones.js');
        const dropWanted = Math.max(0, Math.floor(Number(flag.count) || 0));
        const drop = dropWanted > 0 ? await dropItemColorlessStones(owner, dropWanted) : 0;
        if (drop > 0) {
            globalThis.ui?.notifications?.info?.(`${String(owner.name ?? 'Character')}: ${drop} unspent Absorption Stone${drop === 1 ? '' : 's'} fade${drop === 1 ? 's' : ''} away.`);
        }
        await owner.unsetFlag?.(FLAG_SCOPE, FLAG_TEMP_STONE_EXPIRY);
    }
    catch (e) {
        console.warn('Mastery System | Absorption stone expiry failed', e);
    }
}
/** Combat end: remaining Absorbed Damage disappears. Pending Absorption stones expire with the fight. */
export async function clearAbsorptionForCombat(combat, actors) {
    const list = [];
    if (Array.isArray(actors) && actors.length) {
        list.push(...actors);
    }
    else if (combat?.combatants) {
        for (const c of combat.combatants) {
            if (c?.actor)
                list.push(c.actor);
        }
    }
    if (!list.length)
        return;
    const { dropItemColorlessStones } = await import('../stones/colorless-stones.js');
    const seen = new Set();
    for (const actor of list) {
        const owner = getActionEconomyActor(actor) ?? actor;
        const key = String(owner?.id ?? owner?._id ?? actor?.id ?? '');
        if (key && seen.has(key))
            continue;
        if (key)
            seen.add(key);
        try {
            const flag = owner?.getFlag?.(FLAG_SCOPE, FLAG_TEMP_STONE_EXPIRY);
            const drop = Math.max(0, Math.floor(Number(flag?.count) || 0));
            if (drop > 0)
                await dropItemColorlessStones(owner, drop);
            await owner?.unsetFlag?.(FLAG_SCOPE, FLAG_ACCUM);
            await owner?.unsetFlag?.(FLAG_SCOPE, FLAG_TEMP_STONE_EXPIRY);
            await owner?.unsetFlag?.(FLAG_SCOPE, FLAG_TRIGGERS);
            if (actor && actor !== owner) {
                await actor.unsetFlag?.(FLAG_SCOPE, FLAG_ACCUM);
                await actor.unsetFlag?.(FLAG_SCOPE, FLAG_TEMP_STONE_EXPIRY);
                await actor.unsetFlag?.(FLAG_SCOPE, FLAG_TRIGGERS);
            }
        }
        catch {
            /* best-effort */
        }
    }
}
//# sourceMappingURL=absorption.js.map