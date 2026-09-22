/**
 * Weapon Swap picker.
 *
 * The Move radial keeps a single button. Clicking it posts this card, and
 * the player clicks the set they want. Movement is spent only on that click.
 */
import { canCurrentUserUpdateDocument } from '../combat/combat-permissions.js';
import { listWeaponSwapChoices, swapWeaponSet, } from '../utils/weapon-sets.js';
function loc(key, fallback) {
    const raw = globalThis.game?.i18n?.localize?.(`MASTERY.weaponSets.${key}`);
    return raw && raw !== `MASTERY.weaponSets.${key}` ? raw : fallback;
}
function escapeHtml(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
function parseTarget(raw) {
    if (raw === 'unarmed')
        return 'unarmed';
    if (raw === '1')
        return 1;
    if (raw === '2')
        return 2;
    return null;
}
/** Chat card: one button per set that is not already worn. */
export function buildWeaponSwapCardHtml(actor) {
    const uuid = escapeHtml(String(actor?.uuid || ''));
    const actorId = escapeHtml(String(actor?.id || ''));
    const buttons = listWeaponSwapChoices(actor)
        .map((choice) => {
        const label = escapeHtml(choice.name);
        if (choice.active) {
            return `<button type="button" class="ms-weapon-swap-btn is-wearing" disabled>${label}</button>`;
        }
        const target = escapeHtml(String(choice.target));
        return `<button type="button" class="ms-weapon-swap-btn" data-action="weapon-swap-pick" data-target="${target}" data-actor-uuid="${uuid}" data-actor-id="${actorId}">${label}</button>`;
    })
        .join('');
    return `<div class="ms-weapon-swap" data-actor-uuid="${uuid}" data-actor-id="${actorId}">
    <div class="ms-weapon-swap-title">${escapeHtml(loc('actionName', 'Weapon Swap'))}</div>
    <div class="ms-weapon-swap-choices">${buttons}</div>
  </div>`;
}
export function buildWeaponSwapDoneHtml(actor, spentMovement) {
    const wearing = listWeaponSwapChoices(actor).find((choice) => choice.active);
    const note = spentMovement
        ? loc('swappedCombat', 'Movement spent.')
        : loc('swappedFree', 'Free — not in combat.');
    const line = wearing ? `${wearing.name}. ${note}` : note;
    return `<div class="ms-weapon-swap is-done">
    <div class="ms-weapon-swap-title">${escapeHtml(loc('actionName', 'Weapon Swap'))}</div>
    <p>${escapeHtml(line)}</p>
  </div>`;
}
export async function postWeaponSwapCard(actor, token) {
    const ChatMessage = globalThis.ChatMessage;
    if (typeof ChatMessage?.create !== 'function')
        return;
    const speaker = typeof ChatMessage.getSpeaker === 'function'
        ? ChatMessage.getSpeaker({ actor, token: token?.document ?? token })
        : undefined;
    await ChatMessage.create({
        speaker,
        content: buildWeaponSwapCardHtml(actor),
        flags: {
            'mastery-system': {
                weaponSwapCard: true,
                actorUuid: String(actor?.uuid || ''),
                actorId: String(actor?.id || ''),
            },
        },
    });
}
async function resolveSwapActor(uuid, actorId) {
    const g = globalThis;
    if (uuid && typeof g.fromUuid === 'function') {
        try {
            const doc = await g.fromUuid(uuid);
            if (doc?.documentName === 'Actor')
                return doc;
            if (doc?.actor)
                return doc.actor;
        }
        catch {
            /* fall through */
        }
    }
    const world = g.game?.actors?.get?.(actorId);
    if (world)
        return world;
    const tokens = g.canvas?.tokens?.placeables ?? [];
    for (const token of tokens) {
        if (String(token?.actor?.id || '') === actorId)
            return token.actor;
    }
    return null;
}
const swapsInFlight = new Set();
let registered = false;
export function registerWeaponSwapChatHandler() {
    if (registered)
        return;
    registered = true;
    const $ = globalThis.$;
    if (typeof $ !== 'function')
        return;
    $(document)
        .off('click.msWeaponSwap', '[data-action="weapon-swap-pick"]')
        .on('click.msWeaponSwap', '[data-action="weapon-swap-pick"]', async (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        const btn = $(ev.currentTarget);
        const card = btn.closest('.ms-weapon-swap');
        const messageId = String(btn.closest('.message, .chat-message').attr('data-message-id') || '');
        const target = parseTarget(String(btn.attr('data-target') || ''));
        if (!target)
            return;
        const flightKey = messageId || `${btn.attr('data-actor-id')}:${String(target)}`;
        if (swapsInFlight.has(flightKey))
            return;
        swapsInFlight.add(flightKey);
        card.find('[data-action="weapon-swap-pick"]').prop('disabled', true);
        try {
            const message = messageId ? globalThis.game?.messages?.get?.(messageId) : null;
            const flags = message?.flags?.['mastery-system'] || {};
            if (flags.weaponSwapDone)
                return;
            const actor = await resolveSwapActor(String(btn.attr('data-actor-uuid') || flags.actorUuid || ''), String(btn.attr('data-actor-id') || flags.actorId || ''));
            if (!actor || !canCurrentUserUpdateDocument(actor)) {
                globalThis.ui?.notifications?.warn?.(loc('pickDenied', 'Only the owner can switch here.'));
                card.find('[data-action="weapon-swap-pick"]').prop('disabled', false);
                return;
            }
            const result = await swapWeaponSet(actor, target, { quiet: true });
            if (!result.ok || !result.swapped) {
                card.find('[data-action="weapon-swap-pick"]').prop('disabled', false);
                return;
            }
            const done = buildWeaponSwapDoneHtml(actor, result.spentMovement);
            if (typeof message?.update === 'function') {
                await message.update({
                    content: done,
                    flags: {
                        'mastery-system': {
                            ...flags,
                            weaponSwapCard: true,
                            weaponSwapDone: true,
                        },
                    },
                });
            }
        }
        catch (err) {
            console.warn('Mastery System | Weapon swap pick failed', err);
            card.find('[data-action="weapon-swap-pick"]').prop('disabled', false);
        }
        finally {
            swapsInFlight.delete(flightKey);
        }
    });
}
//# sourceMappingURL=weapon-swap-card.js.map