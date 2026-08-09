/**
 * Post-damage / status-surface reaction follow-ups (Overload, Cleanse).
 * These are deliberately outside the attack Reaction Window timing.
 */
import { getActionEconomyActor, getReactionActionsSummary, hasPowerBeenUsedThisRound, markPowerUsedThisRound, spendReactionAction, } from './action-economy.js';
import { resolvePowerMechanics } from '../utils/power-mechanics.js';
import { isCleanseReaction, isOverloadReaction } from './reaction-eligibility.js';
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
/**
 * When ongoing effects apply, offer Reactive Cleanse if equipped.
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
    const name = String(target.name ?? 'Target');
    const list = appliedSpecials.map((s) => escHtml(s)).join(', ');
    const g = globalThis;
    const content = `<div class="mastery-reaction-msg mastery-reactive-cleanse">
    <h3><i class="fas fa-wind"></i> Reactive Cleanse</h3>
    <p><strong>${escHtml(name)}</strong> was hit by: ${list}.
    Spend 1 Reaction to reduce one ongoing effect by <strong>${amount}</strong>?</p>
    <div class="ms-reaction-window-buttons">
      <button type="button" class="ms-cleanse-use-btn"
        data-actor-id="${escHtml(String(economy.id))}"
        data-power-id="${escHtml(String(cleanse.id))}"
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
        .off('click.msCleanseUse', '.ms-cleanse-use-btn')
        .on('click.msCleanseUse', '.ms-cleanse-use-btn', async (ev) => {
        ev.preventDefault();
        const btn = $(ev.currentTarget);
        const actorId = String(btn.attr('data-actor-id') || '');
        const powerId = String(btn.attr('data-power-id') || '');
        const amount = Math.max(0, Math.floor(Number(btn.attr('data-amount') || 0)));
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
        const list = Array.isArray(actor.system?.statusEffects)
            ? [...actor.system.statusEffects]
            : [];
        if (list.length) {
            // Reduce the highest-value eligible effect first.
            let bestIdx = 0;
            let bestVal = -1;
            for (let i = 0; i < list.length; i++) {
                const v = Math.floor(Number(list[i]?.value) || 0);
                if (v > bestVal) {
                    bestVal = v;
                    bestIdx = i;
                }
            }
            const entry = list[bestIdx];
            const nextVal = Math.max(0, bestVal - amount);
            const label = String(entry?.name || entry?.id || 'effect');
            if (nextVal <= 0)
                list.splice(bestIdx, 1);
            else
                list[bestIdx] = { ...entry, value: nextVal };
            await actor.update?.({ 'system.statusEffects': list });
            const msgRoot = btn.closest('.message');
            const messageId = String(msgRoot.attr('data-message-id') || '');
            const message = messageId ? g.game?.messages?.get?.(messageId) : null;
            const note = `<p class="mastery-reaction-msg"><strong>${escHtml(String(actor.name))}</strong> Reactive Cleanse — ${escHtml(label)} reduced by ${amount}${nextVal > 0 ? ` (now ${nextVal})` : ' (cleared)'}.</p>`;
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
                content: `<p class="mastery-reaction-msg opacity-75">Reactive Cleanse declined.</p>`,
            });
        }
    });
}
//# sourceMappingURL=reaction-followups.js.map