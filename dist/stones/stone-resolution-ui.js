/**
 * Foundry presentation for the post-commit Stone resolution queue.
 * Healing and Stress Healing open a target dialog. Other interactive powers
 * keep the apply they already had.
 */
import { distanceBetweenActorsMeters } from '../combat/reaction-eligibility.js';
import { STONE_POWERS, resolveStonePowerId } from './stone-powers.js';
import { listSelectablePlayerActors } from './ally-stone-target.js';
import { healingRankProfile, readHealthSnapshot, resolveHealthActor, resolveHealingSelection, resolveStressHealingSelection, stressHealingRankProfile, } from './stone-resolution.js';
function escapeAttr(value) {
    return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
function worldActors() {
    const g = globalThis;
    const out = [];
    const combatants = g.game?.combat?.combatants;
    if (combatants && typeof combatants[Symbol.iterator] === 'function') {
        for (const combatant of combatants)
            out.push(combatant);
    }
    const actors = g.game?.actors;
    if (actors && typeof actors[Symbol.iterator] === 'function') {
        for (const actor of actors)
            out.push(actor);
    }
    return out;
}
function combatantList() {
    const g = globalThis;
    const combatants = g.game?.combat?.combatants;
    if (!combatants)
        return [];
    if (typeof combatants[Symbol.iterator] === 'function')
        return [...combatants];
    if (Array.isArray(combatants.contents))
        return combatants.contents;
    return [];
}
/** Combat token actor when one is placed. Unlinked tokens share the world id. */
function actorById(id, source, preferred) {
    const g = globalThis;
    return resolveHealthActor(id, source, combatantList(), g.game?.actors?.get?.(id) ?? null, preferred);
}
export function stoneTargetCandidates(source, preferred) {
    const sourceId = String(source?.id || '').trim();
    const placed = actorById(sourceId, source, preferred) ?? source;
    const choices = listSelectablePlayerActors(worldActors(), sourceId);
    const out = [];
    const seen = new Set();
    const push = (candidate) => {
        if (!candidate.id || seen.has(candidate.id))
            return;
        seen.add(candidate.id);
        out.push(candidate);
    };
    if (sourceId) {
        push({
            id: sourceId,
            name: String(source?.name || 'You'),
            self: true,
            distanceM: 0,
        });
    }
    for (const choice of choices) {
        if (choice.id === sourceId)
            continue;
        const actor = actorById(choice.id, source);
        const distanceM = actor ? distanceBetweenActorsMeters(placed, actor) : null;
        push({
            id: choice.id,
            name: choice.name,
            self: false,
            distanceM,
        });
    }
    return out;
}
async function promptStoneTarget(args) {
    if (!args.legal.length)
        return null;
    const DialogV2 = globalThis.foundry?.applications?.api?.DialogV2;
    if (typeof DialogV2?.prompt !== 'function')
        return null;
    const optionsHtml = args.legal
        .map((candidate) => {
        const distance = candidate.self || candidate.distanceM == null ? '' : ` — ${candidate.distanceM} m`;
        const label = `${candidate.self ? `${candidate.name} (self)` : candidate.name}${distance}`;
        return `<option value="${escapeAttr(candidate.id)}">${escapeAttr(label)}</option>`;
    })
        .join('');
    try {
        const id = await DialogV2.prompt({
            window: { title: args.title },
            content: `<form class="mastery-dialog-form"><p class="md-hint">${escapeAttr(args.hint)}</p><label class="md-label">Target</label><select name="target" class="md-select">${optionsHtml}</select></form>`,
            ok: {
                label: 'Resolve',
                callback: (_event, button) => String(button?.form?.elements?.target?.value || ''),
            },
        });
        const picked = String(id || '').trim();
        return picked || null;
    }
    catch {
        return null;
    }
}
async function rollPool(formula) {
    const RollCls = globalThis.Roll;
    if (typeof RollCls !== 'function')
        return 0;
    const roll = await new RollCls(formula).evaluate({ async: true });
    return Math.max(0, Math.floor(Number(roll?.total) || 0));
}
export async function postStonePowerChat(content) {
    const ChatMessage = globalThis.ChatMessage;
    if (typeof ChatMessage?.create !== 'function')
        return;
    await ChatMessage.create({ content });
}
function healthSnapshot(actor) {
    return readHealthSnapshot(actor?.system?.health);
}
function stressSnapshot(actor) {
    return readHealthSnapshot(actor?.system?.stress);
}
async function writeTrack(target, key, track) {
    if (!target || typeof target.update !== 'function')
        return;
    const { updateActorViaGm } = await import('../combat/gm-relay.js');
    await updateActorViaGm(target, {
        [`system.${key}.bars`]: track.bars,
        [`system.${key}.currentBar`]: track.currentBar,
    });
}
async function presentHealing(source, combatant, tier) {
    const profile = healingRankProfile(tier);
    const candidates = stoneTargetCandidates(source, combatant);
    const result = await resolveHealingSelection({
        sourceName: String(source?.name || 'Someone'),
        tier,
        candidates,
        choose: (legal) => promptStoneTarget({
            title: 'Healing',
            hint: `Choose yourself or one ally within ${profile.rangeM} m. Healing rolls ${profile.dice}d8 into the current Health Bar.`,
            legal,
        }),
        roll: rollPool,
        healthOf: (targetId) => healthSnapshot(actorById(targetId, source, combatant)),
        writeHealth: async (targetId, health) => {
            await writeTrack(actorById(targetId, source, combatant), 'health', health);
        },
        chat: postStonePowerChat,
    });
    return result.ok;
}
async function presentStressHealing(source, combatant, tier) {
    const profile = stressHealingRankProfile(tier);
    const candidates = stoneTargetCandidates(source, combatant);
    const result = await resolveStressHealingSelection({
        sourceName: String(source?.name || 'Someone'),
        tier,
        candidates,
        choose: (legal) => promptStoneTarget({
            title: 'Stress Healing',
            hint: `Choose yourself or one ally within ${profile.rangeM} m. Stress Healing rolls ${profile.dice}d8.`,
            legal,
        }),
        roll: rollPool,
        stressOf: (targetId) => stressSnapshot(actorById(targetId, source, combatant)),
        writeStress: async (targetId, stress) => {
            await writeTrack(actorById(targetId, source, combatant), 'stress', stress);
        },
        chat: postStonePowerChat,
    });
    return result.ok;
}
/** Resolve one committed ticket. False means the player still has to choose. */
export async function presentStoneResolution(actor, combatant, ticket) {
    if (ticket.status === 'resolved')
        return true;
    const powerId = resolveStonePowerId(ticket.powerId);
    if (powerId === 'resolve.healing')
        return presentHealing(actor, combatant, ticket.tier);
    if (powerId === 'resolve.stressHealing')
        return presentStressHealing(actor, combatant, ticket.tier);
    if (powerId === 'agility.safeMovement') {
        const { presentSafeMovement } = await import('./agility-movement-ui.js');
        return presentSafeMovement(actor, ticket.tier);
    }
    const power = STONE_POWERS[powerId];
    if (!power)
        return true;
    const canPrompt = typeof globalThis.foundry?.applications?.api?.DialogV2?.prompt === 'function';
    await power.apply({ actor, combatant, tier: ticket.tier, cost: 0 });
    if (powerId === 'influence.regeneration' && canPrompt) {
        const waiting = actor?.getFlag?.('mastery-system', 'pendingAllyRegeneration');
        if (waiting)
            return false;
    }
    try {
        await postStonePowerChat(`<div class="mastery-stone-resolution"><p><strong>${String(actor?.name || 'Someone')}</strong> — ${power.name}</p><p>Rank ${ticket.tier}.</p></div>`);
    }
    catch {
        /* the apply already landed */
    }
    return true;
}
//# sourceMappingURL=stone-resolution-ui.js.map