/**
 * Attribute Contest chat card.
 *
 * The initiator rolls when the contest starts; the card then asks the
 * opponent (its owner or the GM) to pick an Attribute and roll. Both
 * workflows — the sheet's Check / Contest dialog and the combat Grapple
 * maneuver — post this card and share `opposed-attribute-contest.ts` for the
 * dice. Only the consequences differ by `context`.
 */

import {
  buildContestRollOptions,
  compareContestResults,
  contestAttributeDice,
  contestAttributeLabel,
  contestKeepDice,
  contestOutcomeText,
  contestSideFromRoll,
  isContestAttributeKey,
  opponentAttributeChoices,
  surpriseContestModifiers,
  type ContestAttributeKey,
  type ContestContext,
  type ContestOutcome,
  type ContestSideResult,
  type ContestSideSetup,
} from './opposed-attribute-contest.js';

export interface AttributeContestState {
  context: ContestContext;
  initiator: ContestSideResult;
  opponent: ContestSideSetup & { choices: ContestAttributeKey[] };
  opponentResult?: ContestSideResult;
  outcome?: ContestOutcome;
  resolved: boolean;
  /** Surprise Grapple flag as chosen when the contest started. */
  targetUnaware?: boolean;
  combatId?: string;
  /** Attack Action already spent by the initiator (Grapple / Escape). */
  attackActionSpent?: boolean;
  consequenceNote?: string;
}

export const ATTRIBUTE_CONTEST_FLAG = 'attributeContest';

function esc(text: unknown): string {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function contestTitle(context: ContestContext): string {
  if (context === 'grapple') return 'Grapple — Opposed Attribute Contest';
  if (context === 'grapple-escape') return 'Grapple Escape — Opposed Attribute Contest';
  return 'Attribute Contest';
}

function diceHtml(side: ContestSideResult): string {
  const kept = new Set(side.keptIndices ?? []);
  const parts = side.dice.map((d, i) => {
    const chain = side.dieChains?.[i];
    const label = chain && chain.length > 1 ? `${chain.join(' + ')} = ${d}` : String(d);
    return kept.has(i) ? `<strong>${esc(label)}</strong>` : esc(label);
  });
  return parts.join(', ');
}

function sideHtml(side: ContestSideResult, roleLabel: string): string {
  const mods: string[] = [];
  if (side.advantage) mods.push('Advantage');
  if (side.disadvantage) mods.push('Disadvantage');
  const modNote = mods.length ? ` <span class="ms-contest-mod">(${esc(mods.join(', '))})</span>` : '';
  const fail = side.autoFailReason ? `<div class="ms-contest-autofail">Auto-Fail: ${esc(side.autoFailReason)}</div>` : '';
  return `<div class="ms-contest-side">
    <div class="ms-contest-side-head"><span class="ms-contest-role">${esc(roleLabel)}</span> <strong>${esc(side.name)}</strong> — ${esc(contestAttributeLabel(side.attributeKey))} ${side.numDice}d8 keep ${side.keepDice}${modNote}</div>
    <div class="ms-contest-dice">Dice: ${diceHtml(side)}</div>
    <div class="ms-contest-total">Final Result: <strong>${side.total}</strong></div>
    ${fail}
  </div>`;
}

function opponentPromptHtml(state: AttributeContestState): string {
  const buttons = state.opponent.choices
    .map((key) => {
      const label = contestAttributeLabel(key);
      return `<button type="button" class="ms-contest-answer-btn" data-action="ms-contest-answer" data-attribute="${esc(key)}"><i class="fas fa-dice-d20"></i> ${esc(label)}</button>`;
    })
    .join('');
  const dis = state.opponent.disadvantage
    ? '<div class="ms-contest-mod">Unaware — rolls with Disadvantage (initial contest only).</div>'
    : '';
  return `<div class="ms-contest-side ms-contest-pending">
    <div class="ms-contest-side-head"><span class="ms-contest-role">Opponent</span> <strong>${esc(state.opponent.name)}</strong> — choose your Attribute:</div>
    ${dis}
    <div class="ms-contest-answer-row">${buttons}</div>
    <div class="ms-contest-hint">No TN, no Raises, no Skill Points. Higher Final Result wins; a tie changes nothing.</div>
  </div>`;
}

export function buildContestCardHtml(state: AttributeContestState): string {
  const initiatorLabel = state.context === 'grapple-escape' ? 'Escaping' : 'Initiator';
  const opponentLabel = state.context === 'grapple-escape' ? 'Grappler' : 'Opponent';
  const parts: string[] = [];
  parts.push(`<div class="ms-contest-title"><i class="fas fa-balance-scale"></i> ${esc(contestTitle(state.context))}</div>`);
  if (state.context === 'grapple' && state.attackActionSpent) {
    parts.push('<div class="ms-contest-hint">1 Attack Action spent. Melee Reach. Grapple deals no damage.</div>');
  }
  if (state.context === 'grapple-escape' && state.attackActionSpent) {
    parts.push('<div class="ms-contest-hint">1 Attack Action spent to attempt the escape.</div>');
  }
  parts.push(sideHtml(state.initiator, initiatorLabel));
  if (state.resolved && state.opponentResult && state.outcome) {
    parts.push(sideHtml(state.opponentResult, opponentLabel));
    const text = contestOutcomeText(state.outcome, state.initiator.name, state.opponentResult.name);
    parts.push(`<div class="ms-contest-outcome ms-contest-outcome-${esc(state.outcome)}"><strong>${esc(text)}</strong></div>`);
    if (state.consequenceNote) {
      parts.push(`<div class="ms-contest-consequence">${esc(state.consequenceNote)}</div>`);
    }
  } else {
    parts.push(opponentPromptHtml(state));
  }
  return `<div class="mastery-roll ms-contest-card" data-contest-context="${esc(state.context)}">${parts.join('')}</div>`;
}

/* -------------------------------------------- */
/*  Consequences                                  */
/* -------------------------------------------- */

/**
 * What a resolved contest means for the participants. Pure: returns the
 * note shown on the card and which grapple transition (if any) to apply.
 */
export function contestConsequence(
  context: ContestContext,
  outcome: ContestOutcome,
  initiatorName: string,
  opponentName: string,
): { note: string; grapple: 'apply' | 'end' | 'none' } {
  if (context === 'grapple') {
    if (outcome === 'initiator') {
      return {
        grapple: 'apply',
        note: `${initiatorName} and ${opponentName} are now Grappled with each other: Speed 0 m, neither may move away voluntarily. Grapple deals no damage — hurting the held creature is a separate Unarmed Basic Attack. Weapon attacks require releasing the Grapple first.`,
      };
    }
    return { grapple: 'none', note: `${opponentName} remains free.` };
  }
  if (context === 'grapple-escape') {
    if (outcome === 'initiator') {
      return { grapple: 'end', note: `${initiatorName} breaks free — the Grapple ends.` };
    }
    return { grapple: 'none', note: 'The Grapple remains.' };
  }
  return { grapple: 'none', note: '' };
}

/* -------------------------------------------- */
/*  Start                                        */
/* -------------------------------------------- */

export interface StartAttributeContestParams {
  context: ContestContext;
  initiatorActor: any;
  initiatorToken?: any;
  opponentActor: any;
  opponentToken?: any;
  attributeKey: ContestAttributeKey;
  /** Surprise Grapple (initial contest only). */
  targetUnaware?: boolean;
  /** Grapple / Escape spend 1 Attack Action before rolling. */
  costsAttackAction?: boolean;
  combat?: any;
}

function speakerFor(actor: any, token?: any): any {
  const CM = (globalThis as any).ChatMessage;
  if (typeof CM?.getSpeaker !== 'function') return undefined;
  return CM.getSpeaker({ actor, token: token?.document ?? token });
}

async function rollContestSide(
  actor: any,
  setup: ContestSideSetup,
  label: string,
): Promise<ContestSideResult> {
  const { masteryRoll, showMasteryRollDice3d } = await import('../dice/roll-handler.js');
  const options = buildContestRollOptions(actor, setup.attributeKey, {
    label,
    advantage: setup.advantage,
    disadvantage: setup.disadvantage,
    actorRef: actor,
  });
  const roll: any = await masteryRoll(options);
  try {
    await showMasteryRollDice3d(roll, 0);
  } catch {
    /* optional module */
  }
  return contestSideFromRoll(
    setup,
    Number(roll?.dice?.length ?? options.numDice),
    Number(options.keepDice),
    roll,
  );
}

/**
 * Start a contest: spend the Attack Action if required, roll the initiator
 * side and post the card that waits for the opponent's Attribute.
 */
export async function startAttributeContest(params: StartAttributeContestParams): Promise<any | null> {
  const { context, initiatorActor, opponentActor } = params;
  if (!initiatorActor || !opponentActor) return null;
  if (!isContestAttributeKey(params.attributeKey)) {
    (globalThis as any).ui?.notifications?.warn?.('Pick a valid Attribute for the contest.');
    return null;
  }
  if (String(initiatorActor.id) === String(opponentActor.id) && !params.opponentToken) {
    (globalThis as any).ui?.notifications?.warn?.('A creature cannot contest itself.');
    return null;
  }

  const g = globalThis as any;
  let attackActionSpent = false;
  let economyActor: any = null;
  const combat = params.combat ?? g.game?.combat ?? null;
  if (params.costsAttackAction) {
    if (!combat) {
      g.ui?.notifications?.warn?.('Not in combat.');
      return null;
    }
    const { getAvailableAttackActions, consumeAttackAction, getActionEconomyActor } = await import(
      '../combat/action-economy.js'
    );
    economyActor = getActionEconomyActor(initiatorActor) ?? initiatorActor;
    if (getAvailableAttackActions(economyActor, combat) <= 0) {
      g.ui?.notifications?.warn?.('No Actions left this round.');
      return null;
    }
    const consumed = await consumeAttackAction(economyActor, combat);
    if (!consumed) {
      g.ui?.notifications?.warn?.('Failed to consume attack action.');
      return null;
    }
    attackActionSpent = true;
  }

  const mods = surpriseContestModifiers(context, params.targetUnaware === true);
  const initiatorSetup: ContestSideSetup = {
    actorId: String(initiatorActor.id ?? ''),
    ...(initiatorActor.uuid ? { actorUuid: String(initiatorActor.uuid) } : {}),
    ...(params.initiatorToken?.id ? { tokenId: String(params.initiatorToken.id) } : {}),
    name: String(initiatorActor.name || 'Initiator'),
    attributeKey: params.attributeKey,
    ...(mods.initiatorAdvantage ? { advantage: true } : {}),
  };

  let initiatorResult: ContestSideResult;
  try {
    initiatorResult = await rollContestSide(initiatorActor, initiatorSetup, `${contestTitle(context)} — ${initiatorSetup.name}`);
  } catch (err) {
    console.warn('Mastery System | contest initiator roll failed', err);
    if (attackActionSpent && economyActor) {
      const { refundAttackAction } = await import('../combat/action-economy.js');
      await refundAttackAction(economyActor, combat);
    }
    return null;
  }

  const state: AttributeContestState = {
    context,
    initiator: initiatorResult,
    opponent: {
      actorId: String(opponentActor.id ?? ''),
      ...(opponentActor.uuid ? { actorUuid: String(opponentActor.uuid) } : {}),
      ...(params.opponentToken?.id ? { tokenId: String(params.opponentToken.id) } : {}),
      name: String(opponentActor.name || 'Opponent'),
      // Placeholder until the opponent picks; never used for the roll.
      attributeKey: opponentAttributeChoices(context)[0],
      choices: [...opponentAttributeChoices(context)],
      ...(mods.opponentDisadvantage ? { disadvantage: true } : {}),
    },
    resolved: false,
    ...(params.targetUnaware ? { targetUnaware: true } : {}),
    ...(combat?.id ? { combatId: String(combat.id) } : {}),
    ...(attackActionSpent ? { attackActionSpent: true } : {}),
  };

  const CM = g.ChatMessage;
  if (typeof CM?.create !== 'function') return null;
  return CM.create({
    user: g.game?.user?.id,
    speaker: speakerFor(initiatorActor, params.initiatorToken),
    content: buildContestCardHtml(state),
    flags: { 'mastery-system': { [ATTRIBUTE_CONTEST_FLAG]: state } },
  });
}

/* -------------------------------------------- */
/*  Answer                                       */
/* -------------------------------------------- */

async function resolveContestActor(side: { actorUuid?: string; actorId: string; tokenId?: string }): Promise<any | null> {
  const g = globalThis as any;
  const tok = side.tokenId ? g.canvas?.tokens?.get?.(side.tokenId) : null;
  if (tok?.actor) return tok.actor;
  if (side.actorUuid && typeof g.fromUuid === 'function') {
    try {
      const doc = await g.fromUuid(side.actorUuid);
      if (doc?.documentName === 'Actor') return doc;
      if (doc?.actor) return doc.actor;
    } catch {
      /* fall through */
    }
  }
  return g.game?.actors?.get?.(side.actorId) ?? null;
}

const answersInFlight = new Set<string>();

/**
 * Opponent picked an Attribute: roll their side, compare, apply the
 * consequence for the context and rewrite the card.
 */
export async function answerAttributeContest(messageId: string, attributeKey: string): Promise<boolean> {
  const g = globalThis as any;
  const message = g.game?.messages?.get?.(messageId);
  if (!message) return false;
  const flags = message.flags?.['mastery-system'] ?? {};
  const state = flags[ATTRIBUTE_CONTEST_FLAG] as AttributeContestState | undefined;
  if (!state || state.resolved) return false;
  if (!isContestAttributeKey(attributeKey) || !state.opponent.choices.includes(attributeKey)) {
    g.ui?.notifications?.warn?.('That Attribute is not allowed for this contest.');
    return false;
  }
  if (answersInFlight.has(messageId)) return false;
  answersInFlight.add(messageId);
  try {
    const opponentActor = await resolveContestActor(state.opponent);
    if (!opponentActor) {
      g.ui?.notifications?.warn?.('Opponent not found.');
      return false;
    }
    const { canCurrentUserUpdateDocument } = await import('../combat/combat-permissions.js');
    if (!canCurrentUserUpdateDocument(opponentActor)) {
      g.ui?.notifications?.warn?.(`Only ${opponentActor.name}'s owner or the GM may answer this contest.`);
      return false;
    }

    const opponentSetup: ContestSideSetup = {
      actorId: state.opponent.actorId,
      ...(state.opponent.actorUuid ? { actorUuid: state.opponent.actorUuid } : {}),
      ...(state.opponent.tokenId ? { tokenId: state.opponent.tokenId } : {}),
      name: state.opponent.name,
      attributeKey,
      ...(state.opponent.disadvantage ? { disadvantage: true } : {}),
    };
    const opponentResult = await rollContestSide(
      opponentActor,
      opponentSetup,
      `${contestTitle(state.context)} — ${opponentSetup.name}`,
    );
    const outcome = compareContestResults(state.initiator.total, opponentResult.total);
    const consequence = contestConsequence(state.context, outcome, state.initiator.name, opponentResult.name);

    if (consequence.grapple !== 'none') {
      const initiatorActor = await resolveContestActor(state.initiator);
      const { applyGrapple, endGrapple } = await import('../combat/grapple-state.js');
      if (consequence.grapple === 'apply' && initiatorActor) {
        await applyGrapple(initiatorActor, opponentActor, {
          grapplerToken: state.initiator.tokenId ? g.canvas?.tokens?.get?.(state.initiator.tokenId) : undefined,
          heldToken: state.opponent.tokenId ? g.canvas?.tokens?.get?.(state.opponent.tokenId) : undefined,
          combat: g.game?.combat ?? null,
        });
      } else if (consequence.grapple === 'end' && initiatorActor) {
        await endGrapple(initiatorActor);
      }
    }

    const next: AttributeContestState = {
      ...state,
      opponentResult,
      outcome,
      resolved: true,
      ...(consequence.note ? { consequenceNote: consequence.note } : {}),
    };
    const { updateChatMessageViaGm } = await import('../combat/gm-relay.js');
    await updateChatMessageViaGm(message, {
      content: buildContestCardHtml(next),
      flags: { 'mastery-system': { ...flags, [ATTRIBUTE_CONTEST_FLAG]: next } },
    });
    return true;
  } catch (err) {
    console.warn('Mastery System | contest answer failed', err);
    g.ui?.notifications?.warn?.('Could not resolve the contest.');
    return false;
  } finally {
    answersInFlight.delete(messageId);
  }
}

let registered = false;

export function registerContestCardClickHandler(): void {
  if (registered) return;
  registered = true;
  const $ = (globalThis as any).$;
  if (typeof $ !== 'function') return;
  $(document)
    .off('click.msContest', '[data-action="ms-contest-answer"]')
    .on('click.msContest', '[data-action="ms-contest-answer"]', async (ev: any) => {
      ev.preventDefault();
      ev.stopPropagation();
      const btn = $(ev.currentTarget);
      const messageId = String(btn.closest('.message, .chat-message').attr('data-message-id') || '');
      const attributeKey = String(btn.attr('data-attribute') || '');
      if (!messageId) return;
      const card = btn.closest('.ms-contest-card');
      card.find('[data-action="ms-contest-answer"]').prop('disabled', true);
      const ok = await answerAttributeContest(messageId, attributeKey);
      if (!ok) card.find('[data-action="ms-contest-answer"]').prop('disabled', false);
    });
}

/* -------------------------------------------- */
/*  Small prompt used by both workflows          */
/* -------------------------------------------- */

export interface ContestAttributePromptResult {
  attributeKey: ContestAttributeKey;
  targetUnaware: boolean;
}

/**
 * Default for "Target is Unaware": the GM-set Surprise status or a target
 * that cannot perceive the initiator (hidden / invisible). The player can
 * still flip the checkbox per action.
 */
export async function detectTargetUnaware(initiatorActor: any, targetActor: any): Promise<boolean> {
  try {
    const { actorHasSurprise } = await import('../combat/surprise.js');
    if (actorHasSurprise(targetActor)) return true;
  } catch {
    /* ignore */
  }
  try {
    const { targetUnseenByObserver } = await import('../combat/perception-gate.js');
    if (targetUnseenByObserver(targetActor, initiatorActor)) return true;
  } catch {
    /* ignore */
  }
  return false;
}

/**
 * Dialog: pick the initiator's Attribute (and, for a Grapple, whether the
 * target is unaware). Returns null when cancelled.
 */
export async function promptContestAttribute(
  actor: any,
  choices: readonly ContestAttributeKey[],
  opts: { title: string; intro?: string; unawareOption?: boolean; unawareDefault?: boolean },
): Promise<ContestAttributePromptResult | null> {
  const DialogCtor = (globalThis as any).Dialog;
  const keep = contestKeepDice(actor);
  let best: ContestAttributeKey = choices[0]!;
  for (const key of choices) {
    if (contestAttributeDice(actor, key) > contestAttributeDice(actor, best)) best = key;
  }
  if (typeof DialogCtor !== 'function') {
    return { attributeKey: best, targetUnaware: opts.unawareDefault === true };
  }
  const options = choices
    .map((key) => {
      const dice = contestAttributeDice(actor, key);
      return `<option value="${esc(key)}" ${key === best ? 'selected' : ''}>${esc(contestAttributeLabel(key))} (${dice}d8, keep ${keep})</option>`;
    })
    .join('');
  const unaware = opts.unawareOption
    ? `<div class="md-group">
        <label class="md-label"><input type="checkbox" name="targetUnaware" ${opts.unawareDefault ? 'checked' : ''}/> Target is Unaware <span class="md-sublabel">(Surprise Grapple: you roll with Advantage, the target with Disadvantage — initial contest only)</span></label>
        <p class="md-sublabel">${opts.unawareDefault ? 'Preselected from the Surprise status / perception state — a suggestion only.' : 'Not suggested by the Surprise status / perception state.'} The fiction decides: change it as needed.</p>
      </div>`
    : '';
  const content = `<form class="mastery-dialog-form ms-contest-prompt">
      ${opts.intro ? `<p class="md-sublabel">${esc(opts.intro)}</p>` : ''}
      <div class="md-group">
        <label class="md-label">Your Attribute</label>
        <select name="attribute" class="md-select">${options}</select>
      </div>
      ${unaware}
      <p class="md-sublabel">Opposed Attribute Contest: no TN, no Raises, no Skill Points. The opponent picks their Attribute on the chat card.</p>
    </form>`;
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: ContestAttributePromptResult | null) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    try {
      const dialog = new DialogCtor(
        {
          title: opts.title,
          content,
          buttons: {
            roll: {
              icon: '<i class="fas fa-dice-d20"></i>',
              label: 'Roll',
              callback: (html: any) => {
                const attr = String(html?.find?.('[name="attribute"]')?.val?.() ?? html?.querySelector?.('[name="attribute"]')?.value ?? best);
                const unawareEl = html?.find?.('[name="targetUnaware"]');
                const checked = unawareEl?.length
                  ? !!unawareEl.prop?.('checked')
                  : !!html?.querySelector?.('[name="targetUnaware"]')?.checked;
                finish({
                  attributeKey: isContestAttributeKey(attr) && choices.includes(attr) ? attr : best,
                  targetUnaware: opts.unawareOption ? checked : false,
                });
              },
            },
            cancel: { label: 'Cancel', callback: () => finish(null) },
          },
          default: 'roll',
          close: () => finish(null),
          render: (html: any) => {
            try {
              const $html = (globalThis as any).$?.(html) ?? html;
              setTimeout(() => {
                $html?.closest?.('.window-app.dialog')?.addClass?.('mastery-system mastery-roll-dialog mastery-skill-roll-dialog');
              }, 0);
            } catch {
              /* styling only */
            }
          },
        },
        { width: 520 },
      );
      dialog.render(true);
    } catch (err) {
      console.warn('Mastery System | contest prompt failed', err);
      finish(null);
    }
  });
}
