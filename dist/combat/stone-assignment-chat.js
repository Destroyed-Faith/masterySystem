/**
 * Chat summaries for Stone Powers assignments — per combatant on confirm,
 * plus a round rollup when everyone is done.
 */
import { STONE_POWERS } from '../stones/stone-powers.js';
import { getActionEconomyActor } from './action-economy.js';
export const STONE_POWERS_ROUND_PLAN_FLAG = 'stonePowersRoundPlan';
function parseAccKey(accKey) {
    const j = accKey.lastIndexOf(':');
    if (j <= 0)
        return null;
    const uses = Number(accKey.slice(j + 1));
    if (!Number.isFinite(uses))
        return null;
    const rest = accKey.slice(0, j);
    const i = rest.lastIndexOf(':');
    if (i <= 0)
        return null;
    return { powerId: rest.slice(0, i), middle: rest.slice(i + 1), uses };
}
function stonesInLane(accKey, value) {
    if (!Array.isArray(value) || value.length === 0)
        return 0;
    return value.length;
}
function powerLabel(powerId) {
    const def = STONE_POWERS[powerId];
    return def?.name || powerId;
}
/** Human lines from a paid stone receipt (accKey → stones). */
export function formatStoneReceiptLines(receipt) {
    if (!Array.isArray(receipt) || receipt.length === 0)
        return [];
    const byPower = new Map();
    for (const row of receipt) {
        const parsed = parseAccKey(String(row?.accKey || ''));
        if (!parsed)
            continue;
        const count = stonesInLane(String(row.accKey || ''), row.value);
        if (count <= 0)
            continue;
        byPower.set(parsed.powerId, (byPower.get(parsed.powerId) || 0) + count);
    }
    return [...byPower.entries()]
        .sort((a, b) => powerLabel(a[0]).localeCompare(powerLabel(b[0])))
        .map(([id, n]) => `${powerLabel(id)} (${n} stone${n === 1 ? '' : 's'})`);
}
export async function announceActorStoneAssignment(actor, receipt, round) {
    const lines = formatStoneReceiptLines(receipt);
    const name = String(actor?.name || 'Combatant');
    const body = lines.length > 0
        ? `<ul>${lines.map((l) => `<li>${l}</li>`).join('')}</ul>`
        : `<p><em>No stone powers activated this round.</em></p>`;
    try {
        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `<div class="mastery-stone-assignment-summary"><strong>${name}</strong> — Stones (Round ${round}):${body}</div>`,
        });
    }
    catch (err) {
        console.warn('Mastery System | stone assignment chat failed', err);
    }
}
const ROUND_STONE_SUMMARY_FLAG = 'stoneRoundSummaryPosted';
/**
 * After every PC/NPC with stone flow is done: one chat card listing who spent what.
 * Idempotent per combat round (safe if multiple complete paths fire).
 */
export async function announceRoundStoneAssignments(combat, round) {
    if (!combat)
        return;
    const posted = combat.getFlag?.('mastery-system', ROUND_STONE_SUMMARY_FLAG) ||
        {};
    if (posted[String(round)])
        return;
    const blocks = [];
    const combatants = combat.combatants?.contents ?? combat.combatants ?? [];
    const list = Array.isArray(combatants)
        ? combatants
        : typeof combatants[Symbol.iterator] === 'function'
            ? Array.from(combatants)
            : [];
    for (const c of list) {
        const actor = c?.actor;
        if (!actor)
            continue;
        const owner = getActionEconomyActor(actor) ?? actor;
        const plan = owner.getFlag?.('mastery-system', STONE_POWERS_ROUND_PLAN_FLAG);
        if (!plan || String(plan.combatId || '') !== String(combat.id || ''))
            continue;
        if (Math.max(1, Math.floor(Number(plan.round) || 0)) !== round)
            continue;
        const lines = formatStoneReceiptLines(plan.receipt);
        const name = String(actor.name || c.name || 'Combatant');
        if (lines.length === 0) {
            blocks.push(`<li><strong>${name}</strong>: none</li>`);
        }
        else {
            blocks.push(`<li><strong>${name}</strong>: ${lines.join('; ')}</li>`);
        }
    }
    if (blocks.length === 0)
        return;
    try {
        if (typeof combat.setFlag === 'function') {
            await combat.setFlag('mastery-system', ROUND_STONE_SUMMARY_FLAG, {
                ...posted,
                [String(round)]: true,
            });
        }
        await ChatMessage.create({
            content: `<div class="mastery-stone-round-summary"><strong>Round ${round} — Stone Assignments</strong><ul>${blocks.join('')}</ul></div>`,
        });
    }
    catch (err) {
        console.warn('Mastery System | round stone summary chat failed', err);
    }
}
//# sourceMappingURL=stone-assignment-chat.js.map