/**
 * Faith Fracture reroll: spend 1 current Faith Fracture to reroll a Mastery chat roll once (globally per message).
 */
const SOCKET_NAME = 'system.mastery-system';
const faithRerollLocks = new Set();
/** Avoid duplicate socket listeners if init runs more than once */
let faithFractureSocketRegistered = false;
/** Strict OWNER check for spending Faith Fracture — no GM bypass on other players' characters. */
function userIsOwnerOfActorForFaith(user, actor) {
    if (!user)
        return false;
    return typeof actor?.testUserPermission === 'function' && actor.testUserPermission(user, 'OWNER');
}
/** A player spends only characters they own. A GM is owner of every actor, so that does not count. */
function userPlaysActor(user, actor) {
    if (!user || !actor)
        return false;
    if (user.isGM)
        return String(user.character?.id || '') === String(actor.id || '');
    return userIsOwnerOfActorForFaith(user, actor);
}
function getActorsWithFaithForUser(user) {
    if (!user)
        return [];
    const list = [];
    for (const a of game.actors ?? []) {
        const sys = a?.system;
        const cur = sys?.faithFractures?.current ?? 0;
        if (cur < 1)
            continue;
        if (userPlaysActor(user, a))
            list.push(a);
    }
    return list;
}
function notifyFaithRerollClient(userId, ok, error) {
    game.socket?.emit(SOCKET_NAME, {
        type: 'faithFractureRerollResult',
        userId,
        ok,
        error,
        message: ok ? 'Reroll posted to chat. 1 Reroll Point spent.' : undefined
    });
}
async function resolveRerollSpender(user, message) {
    const flags = message.flags?.['mastery-system'] || message.getFlag?.('mastery-system') || {};
    const recipeActorId = String(flags.rollRecipe?.actorId || '');
    const recipeActor = recipeActorId ? game.actors?.get(recipeActorId) : null;
    if (recipeActor && userPlaysActor(user, recipeActor)) {
        const cur = Number(recipeActor.system?.faithFractures?.current ?? 0) || 0;
        if (cur < 1) {
            ui.notifications?.warn(`${recipeActor.name} has no Reroll Points left.`);
            return null;
        }
        return String(recipeActor.id);
    }
    const actors = getActorsWithFaithForUser(user);
    if (actors.length === 0) {
        ui.notifications?.warn('No Reroll Points on a character you play.');
        return null;
    }
    if (actors.length === 1)
        return String(actors[0].id);
    return new Promise(resolve => {
        const optionsHtml = actors
            .map(a => {
            const sys = a.system;
            const c = sys?.faithFractures?.current ?? 0;
            const m = sys?.faithFractures?.maximum ?? 0;
            return `<option value="${a.id}">${a.name} (${c}/${m} Reroll Points)</option>`;
        })
            .join('');
        new Dialog({
            title: 'Spend Reroll Point',
            content: `<p style="margin-bottom:0.5em">Which of your characters pays <strong>1 Reroll Point</strong>?</p>
        <select id="ms-faith-spender" style="width:100%">${optionsHtml}</select>`,
            buttons: {
                ok: {
                    label: 'Reroll',
                    callback: (html) => {
                        const id = String(html.find('#ms-faith-spender').val() || '');
                        resolve(id || null);
                    }
                },
                cancel: {
                    label: 'Cancel',
                    callback: () => resolve(null)
                }
            },
            default: 'ok'
        }).render(true);
    });
}
/** Chat line under a rerolled result. A GM emergency reroll does not name a spender. */
export function faithRerollNote(note) {
    const line = note.free
        ? 'Reroll — the GM rerolled this roll.'
        : `Reroll — ${note.spenderName} spent 1 Reroll Point.`;
    return `\n\n<i class="fas fa-sync-alt"></i> ${line}`;
}
/** Players spend a point. The GM button is an emergency reroll and does not. */
export function faithRerollButtonCopy(isGm, isOwnRoll) {
    if (isGm) {
        return {
            label: 'Reroll',
            title: 'GM reroll. Does not spend a character\'s Reroll Points. Once per roll, shared by the whole table.',
        };
    }
    if (isOwnRoll) {
        return {
            label: 'Reroll (1 Reroll Point)',
            title: 'Spend 1 of this character\'s Reroll Points. Once per roll.',
        };
    }
    return {
        label: 'Force GM Reroll (1 Reroll Point)',
        title: 'Spend 1 Reroll Point from a character you play to force this roll to be rerolled. Once per roll.',
    };
}
/**
 * GM-only: spend faith, mark message consumed, post new roll. Serialized per message id.
 * `gmFree` is only for the GM clicking the button on their own client. It does not
 * spend anyone's Reroll Points. Player requests never set it.
 */
export async function executeFaithFractureReroll(messageId, spenderActorId, requesterUserId, options) {
    if (!game.user?.isGM) {
        return { ok: false, error: 'Only the GM can resolve this reroll.' };
    }
    if (faithRerollLocks.has(messageId)) {
        return { ok: false, error: 'A reroll is already being processed for this message.' };
    }
    faithRerollLocks.add(messageId);
    try {
        const message = game.messages?.get(messageId);
        if (!message) {
            return { ok: false, error: 'Chat message not found.' };
        }
        const ms = message.flags?.['mastery-system'] || {};
        if (ms.faithRerollConsumed === true) {
            return { ok: false, error: 'This roll was already rerolled once.' };
        }
        if (ms.isRerollResult === true) {
            return { ok: false, error: 'This roll is itself a reroll result — a roll can be rerolled at most once.' };
        }
        if (ms.canReroll !== true) {
            return { ok: false, error: 'This message cannot be rerolled.' };
        }
        const recipe = ms.rollRecipe;
        if (!recipe || typeof recipe.numDice !== 'number' || typeof recipe.keepDice !== 'number') {
            return { ok: false, error: 'This roll has no reroll data (try a new roll from the sheet).' };
        }
        const requester = game.users?.get(requesterUserId);
        if (!requester) {
            return { ok: false, error: 'Requesting user not found.' };
        }
        const gmFree = options?.gmFree === true;
        if (gmFree && !requester.isGM) {
            return { ok: false, error: 'Only the GM can reroll without spending Reroll Points.' };
        }
        let spender = null;
        let cur = 0;
        if (!gmFree) {
            spender = game.actors?.get(spenderActorId);
            if (!spender) {
                return { ok: false, error: 'Spending actor not found.' };
            }
            if (!userPlaysActor(requester, spender)) {
                return { ok: false, error: 'You can only spend your own Reroll Points.' };
            }
            const ownedRoll = recipe.actorId ? game.actors?.get(recipe.actorId) : null;
            if (ownedRoll && userPlaysActor(requester, ownedRoll) && String(spender.id) !== String(ownedRoll.id)) {
                return { ok: false, error: 'This roll spends the rolling character\'s Reroll Points, not another character\'s.' };
            }
            const sys = spender.system;
            cur = sys?.faithFractures?.current ?? 0;
            if (cur < 1) {
                return { ok: false, error: `${String(spender.name)} has no Reroll Points left.` };
            }
            await spender.update({ 'system.faithFractures.current': cur - 1 });
        }
        const rerollNote = faithRerollNote(gmFree ? { spenderName: 'GM', free: true } : { spenderName: String(spender.name) });
        // Attack rolls: re-run the full attack pipeline from the attack card so a
        // rerolled hit can continue into the damage dialog. A bare roll replay
        // (below) would post a disconnected roll message with no damage flow.
        const attackCardMessageId = String(recipe.attackCardMessageId || '').trim();
        if (attackCardMessageId) {
            const recipeActor = recipe.actorId ? game.actors?.get(recipe.actorId) : null;
            const requesterOwnsAttacker = recipeActor
                ? userIsOwnerOfActorForFaith(requester, recipeActor)
                : false;
            try {
                await message.setFlag('mastery-system', 'faithRerollConsumed', true);
                if (!requesterOwnsAttacker || requesterUserId === game.user?.id) {
                    // GM-forced reroll of an NPC attack, or the GM rerolled their own
                    // roll — the attack flow (incl. damage dialog) runs on this client.
                    await triggerAttackFaithReroll(attackCardMessageId, {
                        spenderName: gmFree ? 'GM' : String(spender.name),
                        free: gmFree,
                    });
                }
                else {
                    // Player reroll: run the attack flow on the player's client, where
                    // the raise plan on the card's Roll button is still in the DOM.
                    game.socket?.emit(SOCKET_NAME, {
                        type: 'faithFractureAttackReroll',
                        userId: requesterUserId,
                        attackCardMessageId,
                        spenderName: String(spender.name)
                    });
                }
            }
            catch (rollErr) {
                if (spender)
                    await spender.update({ 'system.faithFractures.current': cur });
                await message.unsetFlag('mastery-system', 'faithRerollConsumed');
                throw rollErr;
            }
            return { ok: true };
        }
        const { masteryRoll } = await import('../dice/roll-handler.js');
        try {
            await message.setFlag('mastery-system', 'faithRerollConsumed', true);
            await masteryRoll({
                numDice: recipe.numDice,
                keepDice: recipe.keepDice,
                skill: recipe.skill,
                tn: recipe.tn,
                label: recipe.label,
                flavor: `${recipe.flavor}${rerollNote}`,
                actorId: recipe.actorId || undefined,
                skillKey: recipe.skillKey || undefined,
                isSkillRoll: recipe.isSkillRoll,
                baseModifier: recipe.baseModifier,
                ...(recipe.poolAttribute ? { poolAttribute: recipe.poolAttribute } : {}),
                ...(recipe.targetRefs?.length ? { targetRefs: recipe.targetRefs } : {}),
                ...(recipe.applyPoolPenalties ? { applyPoolPenalties: true } : {}),
                normalTn: recipe.normalTn ?? recipe.tn,
                raiseTn: recipe.raiseTn ?? recipe.tn,
                declaredRaiseSlots: recipe.declaredRaiseSlots ?? 0,
                stoneBonusRaises: recipe.stoneBonusRaises ?? 0,
                ...(typeof recipe.attackDiceCap === 'number' &&
                    Number.isFinite(recipe.attackDiceCap) &&
                    recipe.attackDiceCap > 0
                    ? { attackDiceCap: Math.floor(recipe.attackDiceCap) }
                    : {}),
                ...(recipe.attackExplodeDiceOn78 ? { attackExplodeDiceOn78: true } : {}),
                // Max one reroll per roll: the reroll result itself must not offer
                // another Faith Fracture reroll.
                isRerollResult: true,
            });
        }
        catch (rollErr) {
            if (spender)
                await spender.update({ 'system.faithFractures.current': cur });
            await message.unsetFlag('mastery-system', 'faithRerollConsumed');
            throw rollErr;
        }
        return { ok: true };
    }
    catch (e) {
        const err = e instanceof Error ? e.message : String(e);
        console.error('Mastery System | Faith Fracture reroll failed', e);
        return { ok: false, error: err };
    }
    finally {
        faithRerollLocks.delete(messageId);
    }
}
/**
 * Re-run the attack pipeline from the original attack card: fresh roll, and on
 * success the damage dialog + follow-ups. Action costs and one-time side
 * effects are skipped inside `executeAttackRollFromCard` (faithReroll mode).
 */
async function triggerAttackFaithReroll(attackCardMessageId, note) {
    const button = $(`.message[data-message-id="${attackCardMessageId}"] .roll-attack-btn`).first();
    if (!button.length) {
        ui.notifications?.warn('Attack card not found in the chat log — cannot rerun the attack roll.');
        return;
    }
    const { executeAttackRollFromCard } = await import('./attack-roll-handler.js');
    await executeAttackRollFromCard(button, attackCardMessageId, { faithReroll: note });
}
async function onFaithFractureRerollClick(message) {
    if (game.user?.isGM) {
        const res = await executeFaithFractureReroll(message.id, '', game.user?.id, { gmFree: true });
        if (res.ok) {
            ui.notifications?.info('Reroll posted to chat.');
        }
        else {
            ui.notifications?.warn(res.error || 'Reroll failed.');
        }
        return;
    }
    const spenderId = await resolveRerollSpender(game.user, message);
    if (!spenderId)
        return;
    const payload = {
        type: 'faithFractureRerollRequest',
        messageId: message.id,
        spenderActorId: spenderId,
        requesterUserId: game.user?.id
    };
    game.socket?.emit(SOCKET_NAME, payload);
    ui.notifications?.info('Requesting reroll from GM…');
}
function onRenderChatMessageFaithReroll(message, htmlRaw) {
    try {
        const $el = htmlRaw instanceof HTMLElement ? $(htmlRaw) : htmlRaw;
        // v13: the hook node may be .mastery-roll itself — .find() would miss it
        const root = $el.filter('.mastery-roll').add($el.find('.mastery-roll')).first();
        if (!root.length)
            return;
        const flags = message.flags?.['mastery-system'] || {};
        if (flags.canReroll !== true ||
            flags.faithRerollConsumed === true ||
            flags.isRerollResult === true ||
            !flags.rollRecipe) {
            root.find('.mastery-faith-reroll-bar').remove();
            return;
        }
        // Players Guide ~5522: 1 Reroll Point can either reroll your own roll or
        // **force the GM to reroll** their roll (e.g., a hit against you). We
        // detect whether the rolling actor is one the current user controls so
        // the label flips between "Reroll" and "Force GM Reroll".
        const recipeActorId = flags.rollRecipe?.actorId || null;
        const recipeActor = recipeActorId ? game.actors?.get(recipeActorId) : null;
        const isOwnRoll = recipeActor ? userPlaysActor(game.user, recipeActor) : false;
        const copy = faithRerollButtonCopy(!!game.user?.isGM, isOwnRoll);
        const btnLabel = copy.label;
        const btnTitle = copy.title;
        let bar = root.find('.mastery-faith-reroll-bar');
        if (!bar.length) {
            bar = $(`<div class="mastery-faith-reroll-bar">
    <button type="button" class="faith-fracture-reroll-btn" title="${btnTitle}">
      <i class="fas fa-sync-alt"></i> ${btnLabel}
    </button>
    <span class="faith-fracture-reroll-hint">One reroll per roll, shared by the whole table. Single-die abilities may still reroll individual dice afterwards (each die once).</span>
  </div>`);
            root.append(bar);
        }
        const btn = bar.find('.faith-fracture-reroll-btn');
        btn.prop('disabled', false).attr('title', btnTitle).html(`<i class="fas fa-sync-alt"></i> ${btnLabel}`);
        btn.off('click.faith-reroll').on('click.faith-reroll', async (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            if (btn.prop('disabled'))
                return;
            btn.prop('disabled', true);
            try {
                await onFaithFractureRerollClick(message);
            }
            finally {
                const fresh = game.messages?.get(message.id);
                const f = fresh?.getFlag?.('mastery-system', 'faithRerollConsumed');
                if (f !== true)
                    btn.prop('disabled', false);
            }
        });
    }
    catch (e) {
        console.error('Mastery System | faith-fracture-reroll: renderChatMessageHTML failed (chat would break without this catch)', e);
    }
}
async function onFaithFractureSocket(payload) {
    if (payload?.type === 'faithFractureAttackReroll') {
        if (payload.userId === game.user?.id) {
            await triggerAttackFaithReroll(String(payload.attackCardMessageId || ''), {
                spenderName: String(payload.spenderName || ''),
            });
        }
        return;
    }
    if (payload?.type === 'faithFractureRerollResult') {
        if (payload.userId === game.user?.id) {
            if (payload.ok) {
                ui.notifications?.info(payload.message || 'Faith reroll completed.');
            }
            else {
                ui.notifications?.warn(payload.error || 'Could not reroll.');
            }
        }
        return;
    }
    if (payload?.type !== 'faithFractureRerollRequest')
        return;
    if (!game.user?.isGM)
        return;
    const { messageId, spenderActorId, requesterUserId } = payload;
    const res = await executeFaithFractureReroll(messageId, spenderActorId, requesterUserId);
    notifyFaithRerollClient(requesterUserId, res.ok, res.error);
}
export function registerFaithFractureRerollHandlers() {
    Hooks.on('renderChatMessageHTML', onRenderChatMessageFaithReroll);
    if (!faithFractureSocketRegistered) {
        faithFractureSocketRegistered = true;
        game.socket?.on(SOCKET_NAME, onFaithFractureSocket);
    }
}
//# sourceMappingURL=faith-fracture-reroll.js.map