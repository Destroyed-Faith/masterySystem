/**
 * Aid (Basic Reaction — Players Guide "Basic Reactions"):
 *
 *   Trigger:     an ally makes a Skill Check you can meaningfully assist.
 *   Requirement: the assistant has the SAME Skill at Rating ≥ 2 × their
 *                Mastery Rank (Full Pool Requirement).
 *   Effect:      the ally gains +4 to the Final Result of that Skill Check.
 *                Only ONE Aid may affect the same Skill Check. Aid does not
 *                spend the assistant's Skill Points. During combat, using
 *                Aid spends 1 Reaction.
 *
 * Rendered as an "Aid (+4)" button on Skill Check chat cards.
 */
import { SKILLS } from '../utils/skills.js';
import { skillFullPoolThreshold } from '../dice/roll-context-build.js';
export const AID_BONUS = 4;
/** Characters eligible to Aid this check: same skill ≥ 2×MR, not the roller. */
export function listEligibleAidCharacters(skillKey, rollerActorId) {
    const g = globalThis;
    const actors = g.game?.actors?.contents ?? [];
    return actors.filter((a) => {
        if (a?.type !== 'character')
            return false;
        if (String(a.id) === String(rollerActorId))
            return false;
        const rating = Math.max(0, Math.floor(Number(a.system?.skills?.[skillKey]) || 0));
        const mr = Math.max(1, Math.floor(Number(a.system?.mastery?.rank) || 1));
        return rating >= skillFullPoolThreshold(mr);
    });
}
async function applyAidToMessage(message, assistant) {
    const g = globalThis;
    const flags = message.flags?.['mastery-system'] || {};
    const rollResult = flags.rollResult;
    if (!rollResult)
        return;
    // In combat the assistant spends 1 Reaction.
    const combat = g.game?.combat ?? null;
    if (combat?.started) {
        const inCombat = (combat.combatants ?? []).some?.((c) => String(c?.actor?.id ?? '') === String(assistant.id));
        if (inCombat) {
            const { spendReactionAction } = await import('../combat/action-economy.js');
            const ok = await spendReactionAction(assistant, combat);
            if (!ok)
                return;
        }
    }
    const newTotal = Math.floor(Number(rollResult.total) || 0) + AID_BONUS;
    rollResult.total = newTotal;
    if (rollResult.tn > 0) {
        rollResult.success = newTotal >= rollResult.tn;
        rollResult.raises = rollResult.success ? Math.floor((newTotal - rollResult.tn) / 4) : 0;
    }
    const updatedFlags = {
        ...flags,
        rollResult,
        aidApplied: true,
        aidByName: String(assistant.name ?? 'Ally'),
    };
    // Patch the card in place: add an Aid line and refresh totals / result.
    let content = String(message.content ?? '');
    const aidLine = `<div class="breakdown-line"><span>Aid (${escape(String(assistant.name ?? 'Ally'))}):</span>` +
        `<span class="value">+${AID_BONUS}</span></div>`;
    content = content.replace(/<div class="breakdown-line total">/, `${aidLine}<div class="breakdown-line total">`);
    content = content.replace(/(<div class="breakdown-line total">\s*<span><strong>Final Total:<\/strong><\/span>\s*<span class="value"><strong>)\d+(<\/strong><\/span>)/, `$1${newTotal}$2`);
    if (rollResult.tn > 0) {
        content = content.replace(/(<span><strong>Result:<\/strong><\/span>\s*<span class="value"><strong>)[^<]+(<\/strong><\/span>)/, `$1${rollResult.success ? 'SUCCESS' : 'FAILURE'}$2`);
    }
    // Remove the Aid button (one Aid per check).
    content = content.replace(/<button[^>]*data-action="aid-skill-check"[\s\S]*?<\/button>/, '');
    await message.update({ content, flags: { 'mastery-system': updatedFlags } });
    g.ui?.notifications?.info?.(`${assistant.name} aids the check (+${AID_BONUS}). New total: ${newTotal}.`);
}
function escape(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
export function registerAidReactionClickHandler() {
    Hooks.on('renderChatMessageHTML', (message, htmlRaw) => {
        try {
            const htmlEl = htmlRaw instanceof HTMLElement ? $(htmlRaw) : htmlRaw;
            const aidButton = htmlEl.find('[data-action="aid-skill-check"]');
            if (aidButton.length === 0)
                return;
            if (aidButton.data('handler-attached'))
                return;
            aidButton.data('handler-attached', true);
            const flags = message.flags?.['mastery-system'] || {};
            if (flags.aidApplied === true) {
                aidButton.prop('disabled', true).addClass('disabled');
                return;
            }
            aidButton.off('click.aid-skill').on('click.aid-skill', async (event) => {
                event.preventDefault();
                event.stopPropagation();
                const skillKey = String($(event.currentTarget).data('skill-key') || '');
                const rollerActorId = String($(event.currentTarget).data('actor-id') || '');
                const freshFlags = message.flags?.['mastery-system'] || {};
                if (freshFlags.aidApplied === true) {
                    ui.notifications?.warn('Only one Aid may affect the same Skill Check.');
                    return;
                }
                const candidates = listEligibleAidCharacters(skillKey, rollerActorId).filter((a) => a.isOwner || game.user?.isGM);
                if (candidates.length === 0) {
                    const need = 'same Skill at Rating ≥ 2 × Mastery Rank';
                    ui.notifications?.warn(`No eligible assistant (${need}).`);
                    return;
                }
                const skillName = SKILLS[skillKey]?.name ?? skillKey;
                const options = candidates
                    .map((a) => `<option value="${a.id}">${escape(String(a.name))}</option>`)
                    .join('');
                const picked = await new Promise((resolve) => {
                    new Dialog({
                        title: `Aid — ${skillName} Check`,
                        content: `<p>Choose the assisting character (requires ${skillName} ≥ 2 × their Mastery Rank; ` +
                            `costs 1 Reaction in combat):</p>` +
                            `<select name="aid-assistant" style="width:100%">${options}</select>`,
                        buttons: {
                            ok: {
                                label: 'Aid (+4)',
                                callback: (dlgHtml) => resolve(String(dlgHtml.find('[name="aid-assistant"]').val() || '') || null),
                            },
                            cancel: { label: 'Cancel', callback: () => resolve(null) },
                        },
                        default: 'ok',
                        close: () => resolve(null),
                    }).render(true);
                });
                if (!picked)
                    return;
                const assistant = game.actors?.get(picked);
                if (!assistant)
                    return;
                await applyAidToMessage(message, assistant);
            });
        }
        catch (e) {
            console.error('Mastery System | aid reaction handler failed', e);
        }
    });
}
//# sourceMappingURL=aid-reaction-handler.js.map