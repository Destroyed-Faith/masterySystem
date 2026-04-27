/**
 * Defender reactions — prompted when incoming damage is applied (after Phasing).
 * Spends `RoundState.reactionActions`, marks `usedPowerIdsThisRound`, and applies
 * one-hit armor / reaction DR from power `mechanics` where present.
 *
 * Ghost Slip–style powers (`phasing.reactionSingleHit`) are omitted here: they
 * interact with the phasing step, not post-phasing mitigation.
 */
import { getActionEconomyActor, getReactionActionsSummary, hasPowerBeenUsedThisRound, markPowerUsedThisRound, spendReactionAction, } from './action-economy.js';
import { buildActorMechanicsBreakdown, resolvePowerMechanics } from '../utils/power-mechanics.js';
function defenderActorForEconomy(defender) {
    return (getActionEconomyActor(defender) ?? defender);
}
function userMayPromptForActor(actor) {
    const u = globalThis.game?.user;
    if (!u)
        return false;
    if (u.isGM)
        return true;
    return !!actor?.isOwner;
}
async function postReactionChat(content, defender) {
    try {
        await globalThis.ChatMessage?.create?.({
            user: globalThis.game?.user?.id,
            speaker: globalThis.ChatMessage?.getSpeaker?.({ actor: defender }),
            content: `<p class="mastery-reaction-msg">${content}</p>`,
        });
    }
    catch (e) {
        console.warn('Mastery System | defender-reactions chat failed', e);
    }
}
/**
 * Reaction-type power items the defender can still use this round (equipped, not used).
 */
export function getEligibleReactionPowers(defender, combat) {
    if (!defender || !combat)
        return [];
    const owner = defenderActorForEconomy(defender);
    const items = owner.items;
    if (!items)
        return [];
    const out = [];
    for (const item of items) {
        if (item.type !== 'power')
            continue;
        const sys = item.system;
        if (sys?.powerType !== 'reaction')
            continue;
        if (sys?.equipped === false)
            continue;
        if (sys?.showInRadialMenu === false)
            continue;
        if (hasPowerBeenUsedThisRound(owner, combat, item.id))
            continue;
        const mech = resolvePowerMechanics(item);
        if (mech?.phasing?.reactionSingleHit)
            continue;
        out.push(item);
    }
    return out;
}
function extractMitigationFromMechanics(mech) {
    if (!mech)
        return { reactionArmorFlat: 0, reactionDrPct: 0 };
    const reactionArmorFlat = Math.max(0, Math.floor(Number(mech.armor) || 0));
    const reactionDrPct = Math.max(0, Math.min(100, Math.floor(Number(mech.damageReductionPct) || 0)));
    return { reactionArmorFlat, reactionDrPct };
}
/**
 * After phasing: offer reaction spend + power selection for this hit.
 * No-op when user cannot prompt for defender, no reactions left, or no eligible powers.
 */
export async function promptDefenderReactionsBeforeMitigation(params) {
    const empty = { reactionArmorFlat: 0, reactionDrPct: 0 };
    const { defender, attacker, combat, rawDamage } = params;
    if (!defender || !combat)
        return empty;
    const economyDef = defenderActorForEconomy(defender);
    if (!userMayPromptForActor(economyDef))
        return empty;
    const summary = getReactionActionsSummary(economyDef, combat);
    const defName = String(defender.name ?? 'Defender');
    if (summary.remaining <= 0) {
        await postReactionChat(`<strong>${defName}</strong> has <strong>no Reactions</strong> left this round (${summary.used}/${summary.total} used).`, defender);
        return empty;
    }
    const powers = getEligibleReactionPowers(economyDef, combat);
    if (!powers.length) {
        await postReactionChat(`<strong>${defName}</strong> has <strong>${summary.remaining}</strong> Reaction(s) left but <strong>no eligible reaction powers</strong> (equipped, not yet used this round).`, defender);
        return empty;
    }
    const Dialog = globalThis.Dialog;
    if (!Dialog)
        return empty;
    const chosen = await new Promise((resolve) => {
        const buttons = {
            decline: {
                label: globalThis.game?.i18n?.localize?.('MASTERY.reactionDecline') ?? 'No reaction',
                callback: () => resolve({ item: null }),
            },
        };
        for (const item of powers) {
            const id = `react_${item.id}`;
            buttons[id] = {
                label: String(item.name ?? 'Reaction').slice(0, 48),
                callback: () => resolve({ item }),
            };
        }
        const attackerName = attacker?.name ?? 'Attacker';
        try {
            new Dialog({
                title: globalThis.game?.i18n?.localize?.('MASTERY.reactionDialogTitle') ??
                    `Reaction — ${defName}`,
                content: `<p><strong>${attackerName}</strong> deals <strong>${rawDamage}</strong> raw damage (after phasing checks).</p>
            <p>Spend <strong>1 Reaction</strong> (${summary.remaining}/${summary.total} left) and pick a power, or decline.</p>`,
                buttons,
                default: 'decline',
                close: () => resolve({ item: null }),
            }).render(true);
        }
        catch {
            resolve({ item: null });
        }
    });
    if (!chosen.item)
        return empty;
    const spent = await spendReactionAction(economyDef, combat);
    if (!spent)
        return empty;
    await markPowerUsedThisRound(economyDef, combat, chosen.item.id);
    const mech = resolvePowerMechanics(chosen.item);
    let mit = extractMitigationFromMechanics(mech);
    const ev = Math.max(0, Math.floor(Number(mech?.evade) || 0));
    // Reaction DR% only applies when a sanctioned slotted passive already
    // contributes DR% (same stacking rule as Active Buff: Damage Reduction).
    let reactionDrBlocked = false;
    if (mit.reactionDrPct > 0) {
        const bd = buildActorMechanicsBreakdown(economyDef);
        const passiveBase = bd.damageReductionPct.passive.reduce((s, r) => s + (r.value || 0), 0);
        if (passiveBase <= 0) {
            mit = { ...mit, reactionDrPct: 0 };
            reactionDrBlocked = true;
        }
    }
    let note = '';
    if (mit.reactionArmorFlat > 0)
        note += ` +${mit.reactionArmorFlat} Armor (this hit)`;
    if (mit.reactionDrPct > 0)
        note += ` +${mit.reactionDrPct}% DR (this hit)`;
    if (reactionDrBlocked) {
        note +=
            ' <em>(Reaction DR% requires a slotted <strong>Damage Reduction</strong> passive contributing DR%.)</em>';
    }
    if (ev > 0) {
        note += ` <em>(+${ev} Evade is not applied retroactively after the hit — track manually if needed.)</em>`;
    }
    if (mech?.tempHP) {
        note += ` <em>(Temp HP from this reaction: apply manually or extend pipeline — declared: ${mech.tempHP})</em>`;
    }
    await postReactionChat(`<strong>${defName}</strong> uses <strong>${chosen.item.name}</strong> (1 Reaction spent).${note || ' (No numeric mitigation on this power.)'}`, defender);
    return {
        reactionArmorFlat: mit.reactionArmorFlat,
        reactionDrPct: mit.reactionDrPct,
        powerName: chosen.item.name,
    };
}
//# sourceMappingURL=defender-reactions.js.map