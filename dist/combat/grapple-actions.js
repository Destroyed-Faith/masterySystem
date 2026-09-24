/**
 * Combat entry points for Grapple (radial menu → these → contest card).
 *
 * Grapple / Escape post an Opposed Attribute Contest card via
 * `startAttributeContest`; Release ends the pair link. None of this rolls
 * damage — hurting a held creature is the normal Unarmed Basic Attack.
 */
import { PHYSICAL_CONTEST_ATTRIBUTES } from '../contests/opposed-attribute-contest.js';
import { detectTargetUnaware, promptContestAttribute, startAttributeContest, } from '../contests/contest-card.js';
import { endGrapple, readGrappleState, resolveGrapplePartner } from './grapple-state.js';
function notify(kind, text) {
    globalThis.ui?.notifications?.[kind]?.(text);
}
async function postNote(actor, token, html) {
    const CM = globalThis.ChatMessage;
    if (typeof CM?.create !== 'function')
        return;
    try {
        await CM.create({
            user: globalThis.game?.user?.id,
            speaker: typeof CM.getSpeaker === 'function' ? CM.getSpeaker({ actor, token: token?.document ?? token }) : undefined,
            content: `<div class="mastery-system-action ms-grapple-note">${html}</div>`,
        });
    }
    catch (err) {
        console.warn('Mastery System | grapple note failed', err);
    }
}
/** Radial "Grapple" after a melee target was picked: attribute prompt → contest card. */
export async function beginGrappleContest(attackerToken, targetToken) {
    const attacker = attackerToken?.actor;
    const target = targetToken?.actor;
    if (!attacker || !target)
        return;
    if (readGrappleState(attacker)) {
        notify('warn', 'Already in a Grapple — release or escape first.');
        return;
    }
    const unawareDefault = await detectTargetUnaware(attacker, target);
    const pick = await promptContestAttribute(attacker, PHYSICAL_CONTEST_ATTRIBUTES, {
        title: `Grapple — ${String(attacker.name)} vs ${String(target.name)}`,
        intro: 'Costs 1 Attack Action. Melee Reach. If you win, both of you are Grappled (Speed 0 m). Grapple deals no damage.',
        unawareOption: true,
        unawareDefault,
    });
    if (!pick)
        return;
    await startAttributeContest({
        context: 'grapple',
        initiatorActor: attacker,
        initiatorToken: attackerToken,
        opponentActor: target,
        opponentToken: targetToken,
        attributeKey: pick.attributeKey,
        targetUnaware: pick.targetUnaware,
        costsAttackAction: true,
        combat: globalThis.game?.combat ?? null,
    });
}
/** Radial "Escape Grapple" for the held creature: contest vs the grappler. */
export async function beginGrappleEscape(token) {
    const actor = token?.actor;
    if (!actor)
        return;
    const state = readGrappleState(actor);
    if (!state || state.role !== 'held') {
        notify('warn', 'You are not being held.');
        return;
    }
    const partner = await resolveGrapplePartner(state);
    if (!partner) {
        // The grappler is gone (token removed / actor deleted): nothing holds you.
        await endGrapple(actor);
        notify('info', 'The grappler is gone — the Grapple ends.');
        return;
    }
    const pick = await promptContestAttribute(actor, PHYSICAL_CONTEST_ATTRIBUTES, {
        title: `Escape Grapple — ${String(actor.name)} vs ${String(partner.name)}`,
        intro: 'Costs 1 Attack Action. Win the Opposed Attribute Contest to break free; a tie keeps the Grapple.',
    });
    if (!pick)
        return;
    const g = globalThis;
    await startAttributeContest({
        context: 'grapple-escape',
        initiatorActor: actor,
        initiatorToken: token,
        opponentActor: partner,
        opponentToken: state.partnerTokenId ? g.canvas?.tokens?.get?.(state.partnerTokenId) : undefined,
        attributeKey: pick.attributeKey,
        costsAttackAction: true,
        combat: g.game?.combat ?? null,
    });
}
/** Radial "Release Grapple" (grappler only, free). */
export async function releaseGrappleAction(token, opts = {}) {
    const actor = token?.actor ?? token;
    if (!actor)
        return false;
    const state = readGrappleState(actor);
    if (!state || state.role !== 'grappler') {
        notify('warn', 'You are not holding anyone.');
        return false;
    }
    const { partner } = await endGrapple(actor);
    const partnerName = String(partner?.name || state.partnerName);
    const why = opts.reason ? ` ${opts.reason}` : '';
    await postNote(actor, token?.actor ? token : undefined, `<h3><i class="fas fa-hand-paper"></i> Release Grapple</h3><p><strong>${String(actor.name)}</strong> lets go of <strong>${partnerName}</strong>.${why}</p>`);
    return true;
}
/**
 * Weapon attacks are not part of the Grapple. Ask the grappler to release
 * the hold before the weapon attack proceeds. Returns true when the attack
 * may continue (hold released), false when the player cancelled.
 */
export async function confirmReleaseGrappleForWeaponAttack(token, attackName) {
    const actor = token?.actor ?? token;
    const state = readGrappleState(actor);
    if (!state || state.role !== 'grappler')
        return true;
    const DialogCtor = globalThis.Dialog;
    let release = true;
    if (typeof DialogCtor === 'function') {
        release = await new Promise((resolve) => {
            let settled = false;
            const finish = (v) => {
                if (settled)
                    return;
                settled = true;
                resolve(v);
            };
            try {
                new DialogCtor({
                    title: 'Release Grapple?',
                    content: `<p>You are holding <strong>${String(state.partnerName)}</strong>. A weapon attack is not part of the Grapple — you have to let go first.</p><p>Release the Grapple and attack with <strong>${String(attackName)}</strong>? (To keep the hold, cancel and use an Unarmed Basic Attack instead.)</p>`,
                    buttons: {
                        release: { icon: '<i class="fas fa-hand-paper"></i>', label: 'Release & Attack', callback: () => finish(true) },
                        cancel: { label: 'Cancel', callback: () => finish(false) },
                    },
                    default: 'release',
                    close: () => finish(false),
                }).render(true);
            }
            catch {
                finish(false);
            }
        });
    }
    if (!release)
        return false;
    await releaseGrappleAction(token, { reason: `(weapon attack: ${String(attackName)})` });
    return true;
}
//# sourceMappingURL=grapple-actions.js.map