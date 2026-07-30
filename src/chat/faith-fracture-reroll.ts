/**
 * Faith Fracture reroll: spend 1 current Faith Fracture to reroll a Mastery chat roll once (globally per message).
 */

import type { MasteryRollRecipe } from '../dice/roll-handler.js';

const SOCKET_NAME = 'system.mastery-system';

const faithRerollLocks = new Set<string>();

/** Avoid duplicate socket listeners if init runs more than once */
let faithFractureSocketRegistered = false;

/** Strict OWNER check for spending Faith Fracture — no GM bypass on other players' characters. */
function userIsOwnerOfActorForFaith(user: User | null | undefined, actor: any): boolean {
  if (!user) return false;
  return typeof actor?.testUserPermission === 'function' && actor.testUserPermission(user, 'OWNER');
}

function getActorsWithFaithForUser(user: User | null | undefined): any[] {
  if (!user) return [];
  const list: any[] = [];
  for (const a of (game as any).actors ?? []) {
    const sys = a?.system as any;
    const cur = sys?.faithFractures?.current ?? 0;
    if (cur < 1) continue;
    if (userIsOwnerOfActorForFaith(user, a)) list.push(a);
  }
  return list;
}

function notifyFaithRerollClient(userId: string, ok: boolean, error?: string): void {
  (game as any).socket?.emit(SOCKET_NAME, {
    type: 'faithFractureRerollResult',
    userId,
    ok,
    error,
    message: ok ? 'Reroll posted to chat. 1 Faith Fracture spent.' : undefined
  });
}

async function pickSpendingActor(user: User): Promise<string | null> {
  const actors = getActorsWithFaithForUser(user);
  if (actors.length === 0) {
    (ui as any).notifications?.warn('No Faith Fractures available on characters you control.');
    return null;
  }
  if (actors.length === 1) return actors[0].id;

  return new Promise(resolve => {
    const optionsHtml = actors
      .map(a => {
        const sys = a.system as any;
        const c = sys?.faithFractures?.current ?? 0;
        const m = sys?.faithFractures?.maximum ?? 0;
        return `<option value="${a.id}">${a.name} (${c}/${m})</option>`;
      })
      .join('');

    new Dialog({
      title: 'Spend Faith Fracture',
      content: `<p style="margin-bottom:0.5em">Which character pays <strong>1 Faith Fracture</strong> for this reroll?</p>
        <select id="ms-faith-spender" style="width:100%">${optionsHtml}</select>`,
      buttons: {
        ok: {
          label: 'Reroll',
          callback: (html: JQuery) => {
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
    } as any).render(true);
  });
}

/**
 * GM-only: spend faith, mark message consumed, post new roll. Serialized per message id.
 */
export async function executeFaithFractureReroll(
  messageId: string,
  spenderActorId: string,
  requesterUserId: string
): Promise<{ ok: boolean; error?: string }> {
  if (!game.user?.isGM) {
    return { ok: false, error: 'Only the GM can resolve this reroll.' };
  }

  if (faithRerollLocks.has(messageId)) {
    return { ok: false, error: 'A reroll is already being processed for this message.' };
  }
  faithRerollLocks.add(messageId);

  try {
    const message = (game as any).messages?.get(messageId) as ChatMessage | undefined;
    if (!message) {
      return { ok: false, error: 'Chat message not found.' };
    }

    const ms = (message.flags as any)?.['mastery-system'] || {};
    if (ms.faithRerollConsumed === true) {
      return { ok: false, error: 'This roll was already rerolled once.' };
    }
    if (ms.isRerollResult === true) {
      return { ok: false, error: 'This roll is itself a reroll result — a roll can be rerolled at most once.' };
    }
    if (ms.canReroll !== true) {
      return { ok: false, error: 'This message cannot be rerolled.' };
    }

    const recipe = ms.rollRecipe as MasteryRollRecipe | null | undefined;
    if (!recipe || typeof recipe.numDice !== 'number' || typeof recipe.keepDice !== 'number') {
      return { ok: false, error: 'This roll has no reroll data (try a new roll from the sheet).' };
    }

    const requester = (game as any).users?.get(requesterUserId) as User | undefined;
    if (!requester) {
      return { ok: false, error: 'Requesting user not found.' };
    }

    const spender = (game as any).actors?.get(spenderActorId);
    if (!spender) {
      return { ok: false, error: 'Spending actor not found.' };
    }

    if (!userIsOwnerOfActorForFaith(requester, spender)) {
      return { ok: false, error: 'You cannot spend Faith from that character.' };
    }

    const sys = spender.system as any;
    const cur = sys?.faithFractures?.current ?? 0;
    if (cur < 1) {
      return { ok: false, error: `${String(spender.name)} has no Faith Fractures left.` };
    }

    const newCur = cur - 1;
    await spender.update({ 'system.faithFractures.current': newCur });

    // Attack rolls: re-run the full attack pipeline from the attack card so a
    // rerolled hit can continue into the damage dialog. A bare roll replay
    // (below) would post a disconnected roll message with no damage flow.
    const attackCardMessageId = String((recipe as any).attackCardMessageId || '').trim();
    if (attackCardMessageId) {
      const recipeActor = recipe.actorId ? (game as any).actors?.get(recipe.actorId) : null;
      const requesterOwnsAttacker = recipeActor
        ? userIsOwnerOfActorForFaith(requester, recipeActor)
        : false;
      try {
        await message.setFlag('mastery-system', 'faithRerollConsumed', true);
        if (!requesterOwnsAttacker || requesterUserId === (game as any).user?.id) {
          // GM-forced reroll of an NPC attack, or the GM rerolled their own
          // roll — the attack flow (incl. damage dialog) runs on this client.
          await triggerAttackFaithReroll(attackCardMessageId, String(spender.name));
        } else {
          // Player reroll: run the attack flow on the player's client, where
          // the raise plan on the card's Roll button is still in the DOM.
          (game as any).socket?.emit(SOCKET_NAME, {
            type: 'faithFractureAttackReroll',
            userId: requesterUserId,
            attackCardMessageId,
            spenderName: String(spender.name)
          });
        }
      } catch (rollErr) {
        await spender.update({ 'system.faithFractures.current': cur });
        await message.unsetFlag('mastery-system', 'faithRerollConsumed');
        throw rollErr;
      }
      return { ok: true };
    }

    const { masteryRoll } = await import('../dice/roll-handler.js');
    const extra = `\n\n<i class="fas fa-sync-alt"></i> Reroll — ${String(spender.name)} spent 1 Faith Fracture.`;

    try {
      await message.setFlag('mastery-system', 'faithRerollConsumed', true);
      await masteryRoll({
        numDice: recipe.numDice,
        keepDice: recipe.keepDice,
        skill: recipe.skill,
        tn: recipe.tn,
        label: recipe.label,
        flavor: `${recipe.flavor}${extra}`,
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
        ...(typeof (recipe as any).attackDiceCap === 'number' &&
        Number.isFinite((recipe as any).attackDiceCap) &&
        (recipe as any).attackDiceCap > 0
          ? { attackDiceCap: Math.floor((recipe as any).attackDiceCap) }
          : {}),
        ...((recipe as any).attackExplodeDiceOn78 ? { attackExplodeDiceOn78: true } : {}),
        // Max one reroll per roll: the reroll result itself must not offer
        // another Faith Fracture reroll.
        isRerollResult: true,
      });
    } catch (rollErr) {
      await spender.update({ 'system.faithFractures.current': cur });
      await message.unsetFlag('mastery-system', 'faithRerollConsumed');
      throw rollErr;
    }

    return { ok: true };
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    console.error('Mastery System | Faith Fracture reroll failed', e);
    return { ok: false, error: err };
  } finally {
    faithRerollLocks.delete(messageId);
  }
}

/**
 * Re-run the attack pipeline from the original attack card: fresh roll, and on
 * success the damage dialog + follow-ups. Action costs and one-time side
 * effects are skipped inside `executeAttackRollFromCard` (faithReroll mode).
 */
async function triggerAttackFaithReroll(attackCardMessageId: string, spenderName: string): Promise<void> {
  const button = $(`.message[data-message-id="${attackCardMessageId}"] .roll-attack-btn`).first();
  if (!button.length) {
    (ui as any).notifications?.warn('Attack card not found in the chat log — cannot rerun the attack roll.');
    return;
  }
  const { executeAttackRollFromCard } = await import('./attack-roll-handler.js');
  await executeAttackRollFromCard(button, attackCardMessageId, { faithReroll: { spenderName } });
}

async function onFaithFractureRerollClick(message: ChatMessage): Promise<void> {
  const spenderId = await pickSpendingActor(game.user as User);
  if (!spenderId) return;

  const payload = {
    type: 'faithFractureRerollRequest',
    messageId: message.id,
    spenderActorId: spenderId,
    requesterUserId: (game as any).user?.id
  };

  if ((game as any).user?.isGM) {
    const res = await executeFaithFractureReroll(message.id, spenderId, payload.requesterUserId);
    if (res.ok) {
      (ui as any).notifications?.info('Reroll posted to chat. 1 Faith Fracture spent.');
    } else {
      (ui as any).notifications?.warn(res.error || 'Reroll failed.');
    }
    return;
  }

  (game as any).socket?.emit(SOCKET_NAME, payload);
  (ui as any).notifications?.info('Requesting reroll from GM…');
}

function onRenderChatMessageFaithReroll(message: ChatMessage, htmlRaw: HTMLElement | JQuery): void {
  try {
    const $el = htmlRaw instanceof HTMLElement ? $(htmlRaw) : htmlRaw;
    // v13: the hook node may be .mastery-roll itself — .find() would miss it
    const root = $el.filter('.mastery-roll').add($el.find('.mastery-roll')).first();
    if (!root.length) return;

    const flags = (message.flags as any)?.['mastery-system'] || {};
    if (flags.canReroll !== true || flags.faithRerollConsumed === true) return;
    // A reroll result can never be rerolled again (max one reroll per roll).
    if (flags.isRerollResult === true) return;
    if (!flags.rollRecipe) return;

    if (root.find('.faith-fracture-reroll-btn').length) return;

    // Players Guide ~5522: 1 Reroll Point can either reroll your own roll or
    // **force the GM to reroll** their roll (e.g., a hit against you). We
    // detect whether the rolling actor is one the current user controls so
    // the label flips between "Reroll" and "Force GM Reroll".
    const recipeActorId = (flags.rollRecipe as MasteryRollRecipe | null)?.actorId || null;
    const recipeActor = recipeActorId ? (game as any).actors?.get(recipeActorId) : null;
    const isOwnRoll = recipeActor
      ? userIsOwnerOfActorForFaith(game.user as User, recipeActor)
      : false;
    const btnLabel = isOwnRoll ? 'Reroll (1 Faith Fracture)' : 'Force GM Reroll (1 Faith Fracture)';
    const btnTitle = isOwnRoll
      ? 'Spend 1 Faith Fracture from a character you control to reroll this Mastery roll. Once per roll, table-wide.'
      : 'Force the GM to reroll this Mastery roll. Spend 1 Faith Fracture from a character you control. Once per roll, table-wide.';

    const bar = $(`<div class="mastery-faith-reroll-bar">
    <button type="button" class="faith-fracture-reroll-btn" title="${btnTitle}">
      <i class="fas fa-sync-alt"></i> ${btnLabel}
    </button>
    <span class="faith-fracture-reroll-hint">One reroll per roll, shared by the whole table. Single-die abilities may still reroll individual dice afterwards (each die once).</span>
  </div>`);

    root.append(bar);

    bar.find('.faith-fracture-reroll-btn').on('click.faith-reroll', async (ev: JQuery.ClickEvent) => {
      ev.preventDefault();
      ev.stopPropagation();
      const btn = bar.find('.faith-fracture-reroll-btn');
      if (btn.prop('disabled')) return;
      btn.prop('disabled', true);
      try {
        await onFaithFractureRerollClick(message);
      } finally {
        const fresh = (game as any).messages?.get(message.id);
        const f = fresh?.getFlag?.('mastery-system', 'faithRerollConsumed');
        if (f !== true) btn.prop('disabled', false);
      }
    });
  } catch (e) {
    console.error('Mastery System | faith-fracture-reroll: renderChatMessageHTML failed (chat would break without this catch)', e);
  }
}

async function onFaithFractureSocket(payload: any): Promise<void> {
  if (payload?.type === 'faithFractureAttackReroll') {
    if (payload.userId === (game as any).user?.id) {
      await triggerAttackFaithReroll(String(payload.attackCardMessageId || ''), String(payload.spenderName || ''));
    }
    return;
  }

  if (payload?.type === 'faithFractureRerollResult') {
    if (payload.userId === (game as any).user?.id) {
      if (payload.ok) {
        (ui as any).notifications?.info(payload.message || 'Faith reroll completed.');
      } else {
        (ui as any).notifications?.warn(payload.error || 'Could not reroll.');
      }
    }
    return;
  }

  if (payload?.type !== 'faithFractureRerollRequest') return;
  if (!(game as any).user?.isGM) return;

  const { messageId, spenderActorId, requesterUserId } = payload;
  const res = await executeFaithFractureReroll(messageId, spenderActorId, requesterUserId);
  notifyFaithRerollClient(requesterUserId, res.ok, res.error);
}

export function registerFaithFractureRerollHandlers(): void {
  Hooks.on('renderChatMessageHTML', onRenderChatMessageFaithReroll);
  if (!faithFractureSocketRegistered) {
    faithFractureSocketRegistered = true;
    (game as any).socket?.on(SOCKET_NAME, onFaithFractureSocket);
  }
}
