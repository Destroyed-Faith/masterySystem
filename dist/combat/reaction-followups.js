/**
 * Post-damage / status-surface reaction follow-ups (Overload, Cleanse).
 * These are deliberately outside the attack Reaction Window timing.
 */
import { getActionEconomyActor, getReactionActionsSummary, hasPowerBeenUsedThisRound, markPowerUsedThisRound, spendReactionAction, } from './action-economy.js';
import { resolvePowerMechanics } from '../utils/power-mechanics.js';
import { ABSORPTION_SURGE_STONES } from '../utils/powers/templates/reaction.js';
import { isAbsorptionSurgeReaction, isCleanseReaction, isOverloadReaction } from './reaction-eligibility.js';
function escHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
function listReactionPowers(actor) {
    const items = actor?.items;
    if (!items)
        return [];
    const out = [];
    for (const item of items) {
        if (item?.type !== 'power')
            continue;
        const sys = item.system;
        if (sys?.powerType !== 'reaction')
            continue;
        if (sys?.equipped === false)
            continue;
        out.push(item);
    }
    return out;
}
/**
 * After actual HP bar damage, if the target has Reactive Overload ready,
 * post a chat card so they can spend a Reaction to multiply Absorbed Damage.
 */
export async function maybeOfferReactiveOverloadChat(target, hpLost, combat) {
    if (!target || hpLost <= 0 || !combat)
        return;
    const economy = (getActionEconomyActor(target) ?? target);
    const summary = getReactionActionsSummary(economy, combat);
    if (summary.remaining <= 0)
        return;
    const overload = listReactionPowers(economy).find((p) => isOverloadReaction(p));
    if (!overload)
        return;
    if (hasPowerBeenUsedThisRound(economy, combat, overload.id))
        return;
    // Requires Absorption Passive (template fluff).
    let hasAbsorption = false;
    try {
        for (const it of economy.items ?? []) {
            const tid = String(it?.system?.templateId ?? '').toLowerCase();
            const name = String(it?.name ?? '').toLowerCase();
            const ptype = String(it?.system?.powerType ?? '').toLowerCase();
            if (ptype === 'passive' && (tid.includes('absorption') || name.includes('absorption'))) {
                hasAbsorption = true;
                break;
            }
        }
    }
    catch {
        hasAbsorption = false;
    }
    if (!hasAbsorption)
        return;
    const name = String(target.name ?? 'Target');
    const powerName = String(overload.name ?? 'Reactive Overload');
    const g = globalThis;
    const content = `<div class="mastery-reaction-msg mastery-reactive-overload">
    <h3><i class="fas fa-bolt"></i> Reactive Overload</h3>
    <p><strong>${escHtml(name)}</strong> lost <strong>${hpLost}</strong> HP.
    Spend 1 Reaction for <strong>${escHtml(powerName)}</strong> so this HP loss counts as multiplied Absorbed Damage?</p>
    <div class="ms-reaction-window-buttons">
      <button type="button" class="ms-overload-use-btn" data-actor-id="${escHtml(String(economy.id))}" data-power-id="${escHtml(String(overload.id))}" data-hp-lost="${hpLost}">
        <i class="fas fa-check"></i> Spend Reaction
      </button>
      <button type="button" class="ms-overload-decline-btn">Decline</button>
    </div>
  </div>`;
    await g.ChatMessage?.create?.({
        user: g.game?.user?.id,
        speaker: g.ChatMessage?.getSpeaker?.({ actor: target }),
        content,
        flags: {
            'mastery-system': {
                type: 'reactiveOverloadPrompt',
                actorId: String(economy.id),
                powerId: String(overload.id),
                hpLost,
            },
        },
    });
}
/** Bonus Stones of a Reaction: Absorption Surge item (printed table by Power Level). */
export function absorptionSurgeStonesFor(item) {
    const fromMech = Math.floor(Number(resolvePowerMechanics(item)?.absorptionSurgeStones) || 0);
    if (fromMech > 0)
        return fromMech;
    const lvl = Math.max(1, Math.min(16, Math.floor(Number(item?.system?.level) || 1)));
    return ABSORPTION_SURGE_STONES[lvl - 1];
}
/**
 * After a damage instance used at least one Passive: Absorption trigger, offer
 * Reaction: Absorption Surge (1 Reaction, once per damage instance, once per Round).
 */
export async function maybeOfferAbsorptionSurgeChat(target, combat, attacker) {
    if (!target || !combat)
        return;
    const economy = (getActionEconomyActor(target) ?? target);
    if (attacker && String(attacker.id ?? '') === String(economy.id ?? ''))
        return;
    const summary = getReactionActionsSummary(economy, combat);
    if (summary.remaining <= 0)
        return;
    const surge = listReactionPowers(economy).find((p) => isAbsorptionSurgeReaction(p));
    if (!surge)
        return;
    if (hasPowerBeenUsedThisRound(economy, combat, surge.id))
        return;
    const stones = absorptionSurgeStonesFor(surge);
    if (stones <= 0)
        return;
    const name = String(target.name ?? 'Target');
    const g = globalThis;
    const label = `${stones} Temporary Colorless Stone${stones === 1 ? '' : 's'}`;
    const content = `<div class="mastery-reaction-msg mastery-absorption-surge">
    <h3><i class="fas fa-bolt"></i> Reaction: Absorption Surge</h3>
    <p>A fresh scar triggered <strong>${escHtml(name)}</strong>'s Absorption.
    Spend 1 Reaction to gain <strong>+${label}</strong> (Ready in the next Preparation Phase)?</p>
    <div class="ms-reaction-window-buttons">
      <button type="button" class="ms-absorption-surge-use-btn"
        data-actor-id="${escHtml(String(economy.id))}"
        data-power-id="${escHtml(String(surge.id))}"
        data-combat-id="${escHtml(String(combat.id ?? ''))}"
        data-stones="${stones}">
        <i class="fas fa-check"></i> Spend Reaction (+${stones})
      </button>
      <button type="button" class="ms-absorption-surge-decline-btn">Decline</button>
    </div>
  </div>`;
    await g.ChatMessage?.create?.({
        user: g.game?.user?.id,
        speaker: g.ChatMessage?.getSpeaker?.({ actor: target }),
        content,
        flags: {
            'mastery-system': {
                type: 'absorptionSurgePrompt',
                actorId: String(economy.id),
                powerId: String(surge.id),
                stones,
            },
        },
    });
}
/**
 * When Specials apply, offer Reaction: Cleanse if equipped. Cleanse(X) may only
 * reduce one of the triggering Specials.
 */
export async function maybeOfferReactiveCleanseChat(target, appliedSpecials, combat) {
    if (!target || !appliedSpecials?.length || !combat)
        return;
    const economy = (getActionEconomyActor(target) ?? target);
    const summary = getReactionActionsSummary(economy, combat);
    if (summary.remaining <= 0)
        return;
    const cleanse = listReactionPowers(economy).find((p) => isCleanseReaction(p));
    if (!cleanse)
        return;
    if (hasPowerBeenUsedThisRound(economy, combat, cleanse.id))
        return;
    const mech = resolvePowerMechanics(cleanse);
    const amount = Math.max(0, Math.floor(Number(mech?.modifySpecial?.amount) || 0));
    if (amount <= 0)
        return;
    const { statusEntryId } = await import('../system/active-specials.js');
    const triggeringIds = [
        ...new Set(appliedSpecials.map((s) => statusEntryId({ name: s })).filter((id) => !!id)),
    ];
    if (!triggeringIds.length)
        return;
    const name = String(target.name ?? 'Target');
    const list = appliedSpecials.map((s) => escHtml(s)).join(', ');
    const g = globalThis;
    const content = `<div class="mastery-reaction-msg mastery-reactive-cleanse">
    <h3><i class="fas fa-wind"></i> Reaction: Cleanse</h3>
    <p><strong>${escHtml(name)}</strong> was hit by: ${list}.
    Spend 1 Reaction to reduce one triggering Special by <strong>${amount}</strong>?</p>
    <div class="ms-reaction-window-buttons">
      <button type="button" class="ms-cleanse-use-btn"
        data-actor-id="${escHtml(String(economy.id))}"
        data-power-id="${escHtml(String(cleanse.id))}"
        data-specials="${escHtml(triggeringIds.join(','))}"
        data-amount="${amount}">
        <i class="fas fa-check"></i> Cleanse (−${amount})
      </button>
      <button type="button" class="ms-cleanse-decline-btn">Decline</button>
    </div>
  </div>`;
    await g.ChatMessage?.create?.({
        user: g.game?.user?.id,
        speaker: g.ChatMessage?.getSpeaker?.({ actor: target }),
        content,
        flags: {
            'mastery-system': {
                type: 'reactiveCleansePrompt',
                actorId: String(economy.id),
                powerId: String(cleanse.id),
                amount,
                specials: appliedSpecials,
            },
        },
    });
}
let followupHooksRegistered = false;
/** Bind chat buttons for Overload / Cleanse prompts. */
export function registerReactionFollowupChatHandlers() {
    if (followupHooksRegistered)
        return;
    followupHooksRegistered = true;
    const g = globalThis;
    $(document)
        .off('click.msOverloadUse', '.ms-overload-use-btn')
        .on('click.msOverloadUse', '.ms-overload-use-btn', async (ev) => {
        ev.preventDefault();
        const btn = $(ev.currentTarget);
        const actorId = String(btn.attr('data-actor-id') || '');
        const powerId = String(btn.attr('data-power-id') || '');
        const hpLost = Math.max(0, Math.floor(Number(btn.attr('data-hp-lost') || 0)));
        const actor = g.game?.actors?.get?.(actorId);
        const combat = g.game?.combat ?? null;
        if (!actor || !combat)
            return;
        const economy = (getActionEconomyActor(actor) ?? actor);
        if (!(g.game?.user?.isGM || economy.isOwner)) {
            g.ui?.notifications?.warn?.('Only the owner or GM can spend this Reaction.');
            return;
        }
        const spent = await spendReactionAction(economy, combat);
        if (!spent)
            return;
        await markPowerUsedThisRound(economy, combat, powerId);
        const msgRoot = btn.closest('.message');
        const messageId = String(msgRoot.attr('data-message-id') || '');
        const message = messageId ? g.game?.messages?.get?.(messageId) : null;
        const note = `<p class="mastery-reaction-msg"><strong>${escHtml(String(actor.name))}</strong> spends Reactive Overload — <strong>${hpLost}</strong> HP lost counts as multiplied Absorbed Damage (track on Absorption).</p>`;
        if (message)
            await message.update({ content: note });
        else
            await g.ChatMessage?.create?.({ content: note });
    });
    $(document)
        .off('click.msOverloadDecline', '.ms-overload-decline-btn')
        .on('click.msOverloadDecline', '.ms-overload-decline-btn', async (ev) => {
        ev.preventDefault();
        const msgRoot = $(ev.currentTarget).closest('.message');
        const messageId = String(msgRoot.attr('data-message-id') || '');
        const message = messageId ? g.game?.messages?.get?.(messageId) : null;
        if (message) {
            await message.update({
                content: `<p class="mastery-reaction-msg opacity-75">Reactive Overload declined.</p>`,
            });
        }
    });
    $(document)
        .off('click.msAbsorptionSurgeUse', '.ms-absorption-surge-use-btn')
        .on('click.msAbsorptionSurgeUse', '.ms-absorption-surge-use-btn', async (ev) => {
        ev.preventDefault();
        const btn = $(ev.currentTarget);
        const actorId = String(btn.attr('data-actor-id') || '');
        const powerId = String(btn.attr('data-power-id') || '');
        const combatId = String(btn.attr('data-combat-id') || '');
        const stones = Math.max(0, Math.floor(Number(btn.attr('data-stones') || 0)));
        const actor = g.game?.actors?.get?.(actorId);
        const combat = g.game?.combat ?? null;
        if (!actor || !combat || stones <= 0)
            return;
        if (combatId && String(combat.id) !== combatId) {
            g.ui?.notifications?.warn?.('Absorption Surge: that combat has ended.');
            return;
        }
        const economy = (getActionEconomyActor(actor) ?? actor);
        if (!(g.game?.user?.isGM || economy.isOwner)) {
            g.ui?.notifications?.warn?.('Only the owner or GM can spend this Reaction.');
            return;
        }
        if (hasPowerBeenUsedThisRound(economy, combat, powerId)) {
            g.ui?.notifications?.warn?.('Absorption Surge was already used this Round.');
            return;
        }
        const spent = await spendReactionAction(economy, combat);
        if (!spent)
            return;
        await markPowerUsedThisRound(economy, combat, powerId);
        const { queueAbsorptionStones } = await import('../stones/colorless-stones.js');
        await queueAbsorptionStones(economy, stones, combat);
        const msgRoot = btn.closest('.message');
        const messageId = String(msgRoot.attr('data-message-id') || '');
        const message = messageId ? g.game?.messages?.get?.(messageId) : null;
        const note = `<p class="mastery-reaction-msg"><strong>${escHtml(String(economy.name))}</strong> uses Absorption Surge — <strong>+${stones} Temporary Colorless Stone${stones === 1 ? '' : 's'}</strong> become Ready in the next Preparation Phase and expire at combat end.</p>`;
        if (message)
            await message.update({ content: note });
        else
            await g.ChatMessage?.create?.({ content: note });
    });
    $(document)
        .off('click.msAbsorptionSurgeDecline', '.ms-absorption-surge-decline-btn')
        .on('click.msAbsorptionSurgeDecline', '.ms-absorption-surge-decline-btn', async (ev) => {
        ev.preventDefault();
        const msgRoot = $(ev.currentTarget).closest('.message');
        const messageId = String(msgRoot.attr('data-message-id') || '');
        const message = messageId ? g.game?.messages?.get?.(messageId) : null;
        if (message) {
            await message.update({
                content: `<p class="mastery-reaction-msg opacity-75">Absorption Surge declined.</p>`,
            });
        }
    });
    $(document)
        .off('click.msCleanseUse', '.ms-cleanse-use-btn')
        .on('click.msCleanseUse', '.ms-cleanse-use-btn', async (ev) => {
        ev.preventDefault();
        const btn = $(ev.currentTarget);
        const actorId = String(btn.attr('data-actor-id') || '');
        const powerId = String(btn.attr('data-power-id') || '');
        const amount = Math.max(0, Math.floor(Number(btn.attr('data-amount') || 0)));
        const triggering = new Set(String(btn.attr('data-specials') || '').split(',').filter(Boolean));
        const actor = g.game?.actors?.get?.(actorId);
        const combat = g.game?.combat ?? null;
        if (!actor || !combat || amount <= 0)
            return;
        const economy = (getActionEconomyActor(actor) ?? actor);
        if (!(g.game?.user?.isGM || economy.isOwner)) {
            g.ui?.notifications?.warn?.('Only the owner or GM can spend this Reaction.');
            return;
        }
        const spent = await spendReactionAction(economy, combat);
        if (!spent)
            return;
        await markPowerUsedThisRound(economy, combat, powerId);
        const { readActorStatusEffects, statusEntryId } = await import('../system/active-specials.js');
        const list = readActorStatusEffects(actor).map((entry) => ({ ...entry }));
        // Reduce the highest-value triggering Special.
        let bestIdx = -1;
        let bestVal = -1;
        for (let i = 0; i < list.length; i++) {
            const id = statusEntryId(list[i]);
            if (triggering.size && (!id || !triggering.has(id)))
                continue;
            const v = Math.floor(Number(list[i]?.value) || 0);
            if (v > bestVal) {
                bestVal = v;
                bestIdx = i;
            }
        }
        if (bestIdx >= 0) {
            const entry = list[bestIdx];
            const nextVal = Math.max(0, bestVal - amount);
            const label = String(entry?.name || entry?.id || 'effect');
            if (nextVal <= 0)
                list.splice(bestIdx, 1);
            else
                list[bestIdx] = { ...entry, value: nextVal };
            const { writeActorStatusList } = await import('../system/assign-status.js');
            await writeActorStatusList(actor, list);
            const msgRoot = btn.closest('.message');
            const messageId = String(msgRoot.attr('data-message-id') || '');
            const message = messageId ? g.game?.messages?.get?.(messageId) : null;
            const note = `<p class="mastery-reaction-msg"><strong>${escHtml(String(actor.name))}</strong> Reaction: Cleanse — ${escHtml(label)} reduced by ${amount}${nextVal > 0 ? ` (now ${nextVal})` : ' (cleared)'}.</p>`;
            if (message)
                await message.update({ content: note });
        }
    });
    $(document)
        .off('click.msCleanseDecline', '.ms-cleanse-decline-btn')
        .on('click.msCleanseDecline', '.ms-cleanse-decline-btn', async (ev) => {
        ev.preventDefault();
        const msgRoot = $(ev.currentTarget).closest('.message');
        const messageId = String(msgRoot.attr('data-message-id') || '');
        const message = messageId ? g.game?.messages?.get?.(messageId) : null;
        if (message) {
            await message.update({
                content: `<p class="mastery-reaction-msg opacity-75">Reaction: Cleanse declined.</p>`,
            });
        }
    });
}
//# sourceMappingURL=reaction-followups.js.map