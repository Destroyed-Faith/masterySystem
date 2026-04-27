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
        isSaveRoll: recipe.isSaveRoll,
        baseModifier: recipe.baseModifier,
        autoRaises: recipe.autoRaises ?? 0,
        ...(typeof (recipe as any).attackDiceCap === 'number' &&
        Number.isFinite((recipe as any).attackDiceCap) &&
        (recipe as any).attackDiceCap > 0
          ? { attackDiceCap: Math.floor((recipe as any).attackDiceCap) }
          : {}),
        ...((recipe as any).attackExplodeDiceOn78 ? { attackExplodeDiceOn78: true } : {}),
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
    if (!flags.rollRecipe) return;

    if (root.find('.faith-fracture-reroll-btn').length) return;

    const bar = $(`<div class="mastery-faith-reroll-bar">
    <button type="button" class="faith-fracture-reroll-btn" title="Costs 1 Faith Fracture from a character you control. Each roll only once.">
      <i class="fas fa-sync-alt"></i> Reroll (1 Faith Fracture)
    </button>
    <span class="faith-fracture-reroll-hint">One reroll per roll, shared by the whole table.</span>
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
