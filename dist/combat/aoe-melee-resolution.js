/**
 * Melee weapon AoE — secondary target resolution.
 *
 * Since the Area-TN rework the AoE roll hits every target in the area with a
 * single roll. Secondaries may spend their Reaction on **Dive for Cover**
 * (move up to 2 × own Mastery Rank meters; fully outside the area = not
 * affected). Targets that stay take the power splash dice, plus Hex/Sundered
 * vulnerability dice depending on whether the power was a spell.
 */
import { getActionEconomyActor, getRoundState, spendReactionAction, } from './action-economy.js';
import { countNaturalEights } from './damage-mitigation.js';
/** Resolve a burst token id to a canvas actor (handles scene / placeable quirks). */
function resolveBurstTarget(tid) {
    const placeables = canvas?.tokens?.placeables ?? [];
    const p = placeables.find((t) => t?.id === tid || t?.document?.id === tid);
    if (p?.actor)
        return { defender: p.actor, tok: p };
    const scene = canvas?.scene ?? game.scenes?.active;
    const doc = scene?.tokens?.get?.(tid);
    if (doc?.actor) {
        const tok = placeables.find((t) => t.id === tid) ?? null;
        return { defender: doc.actor, tok };
    }
    return null;
}
async function confirmSpendReaction(title, html) {
    const Dialog = globalThis.Dialog;
    try {
        if (Dialog?.confirm) {
            const ok = await Dialog.confirm({
                title,
                content: html,
                yes: () => true,
                no: () => false,
                defaultYes: false,
            });
            return !!ok;
        }
    }
    catch {
        /* fall through */
    }
    const plain = String(html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return typeof globalThis !== 'undefined' && globalThis.confirm?.(`${title}\n\n${plain}`);
}
/**
 * @deprecated Legacy Body-save DC (pre Area-TN rules). Kept for old callers.
 */
export function aoeSecondaryBodySaveDc(masteryRank) {
    const r = Math.max(1, Math.min(6, Math.floor(Number(masteryRank) || 1)));
    return r * 8;
}
/** Dive-for-Cover movement allowance of the diving creature (2 × own MR). */
export function diveForCoverDistanceM(actor) {
    const mr = Math.max(1, Math.min(8, Math.floor(Number(actor?.system?.mastery?.rank) || 1)));
    return mr * 2;
}
/**
 * After the AoE roll reached the Area TN and primary damage is resolved:
 * every secondary is hit. Before the payload lands, each may spend a Reaction
 * on Dive for Cover (move up to 2 × own MR meters; fully outside = not
 * affected). Targets that stay take the splash dice + Hex/Sundered dice.
 */
export async function resolveAoeMeleeSecondaries(params) {
    const { attacker, secondaryTokenIds, powerBonusDice } = params;
    const isSpell = params.isSpell === true;
    if (!secondaryTokenIds.length || powerBonusDice <= 0)
        return;
    const combat = game.combat;
    const { getActiveSpecialValue } = await import('../system/active-specials.js');
    for (const tid of secondaryTokenIds) {
        const resolved = resolveBurstTarget(tid);
        if (!resolved?.defender) {
            console.warn('Mastery System | AoE secondary: could not resolve token to actor', {
                tokenId: tid,
                sceneId: canvas?.scene?.id,
            });
            continue;
        }
        const { defender, tok } = resolved;
        const economyDef = getActionEconomyActor(defender) ?? defender;
        // ── Dive for Cover (Reaction) ────────────────────────────────────────
        let escaped = false;
        const rsReact = getRoundState(economyDef, combat);
        const reactions = Math.max(0, (rsReact.reactionActions?.total ?? 0) - (rsReact.reactionActions?.used ?? 0));
        if (reactions > 0) {
            const moveM = diveForCoverDistanceM(defender);
            const spend = await confirmSpendReaction(`Dive for Cover — ${defender.name}`, `<p><strong>Dive for Cover:</strong> Spend <strong>1 Reaction</strong> to immediately move up to <strong>${moveM} m</strong> (2 × Mastery Rank)?</p>` +
                `<p>If the movement takes you completely outside the AoE, you are not affected. This does not provoke Reactions.</p>`);
            if (spend) {
                const consumed = await spendReactionAction(economyDef, combat);
                if (consumed) {
                    const outside = await confirmSpendReaction(`Dive for Cover — ${defender.name}`, `<p>Move the token up to <strong>${moveM} m</strong> now.</p>` +
                        `<p>Is <strong>${defender.name}</strong> completely <strong>outside</strong> the AoE after the move?</p>`);
                    escaped = outside;
                    await ChatMessage.create({
                        user: game.user?.id,
                        speaker: ChatMessage.getSpeaker({ actor: defender, token: tok?.document }),
                        content: `<p><strong>${defender.name}</strong> — Dive for Cover (${moveM} m): ${escaped
                            ? '<strong>outside the area</strong> — not affected.'
                            : '<strong>still inside</strong> — affected normally.'}</p>`,
                    });
                }
            }
        }
        if (escaped)
            continue;
        if (typeof defender.prepareDerivedData === 'function') {
            try {
                defender.prepareDerivedData();
            }
            catch {
                /* ignore */
            }
        }
        // ── Hex / Sundered vulnerability (+1d8 per 2 points, rounded up) ─────
        const vulnId = isSpell ? 'hex' : 'sundered';
        const vulnValue = Math.max(0, getActiveSpecialValue(defender, vulnId));
        const vulnDice = vulnValue > 0 ? Math.ceil(vulnValue / 2) : 0;
        const totalDice = powerBonusDice + vulnDice;
        const spec = `${totalDice}d8x`;
        let total = 0;
        let r = null;
        try {
            const RollCls = globalThis.Roll;
            if (RollCls?.create) {
                r = await RollCls.create(spec).evaluate({ async: true });
                total = Math.max(0, Math.floor(Number(r?.total) || 0));
            }
        }
        catch (err) {
            console.warn('Mastery System | AoE secondary damage roll failed', spec, err);
        }
        const rollsArr = r ? [r] : [];
        const c8 = countNaturalEights(rollsArr);
        const { applyDamageToTargetFromAoe } = await import('../dice/damage-dialog.js');
        const mit = await applyDamageToTargetFromAoe(defender, total, attacker, c8);
        const mitLine = mit?.breakdownLine ? `<p>${mit.breakdownLine}</p>` : '';
        const vulnNote = vulnDice > 0
            ? ` + ${vulnDice}d8 ${isSpell ? 'Hex' : 'Sundered'}(${vulnValue})`
            : '';
        await ChatMessage.create({
            user: game.user?.id,
            speaker: ChatMessage.getSpeaker({ actor: attacker }),
            content: `<p><strong>AoE secondary</strong> → <strong>${defender.name}</strong>: ${total} (${powerBonusDice}d8 power${vulnNote}) ${mitLine}</p>`,
        });
    }
}
//# sourceMappingURL=aoe-melee-resolution.js.map