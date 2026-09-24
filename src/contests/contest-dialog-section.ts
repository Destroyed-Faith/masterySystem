/**
 * "Check / Contest" mode for the sheet roll dialogs.
 *
 * The Skill Check and Attribute Check dialogs keep their existing fields.
 * This module adds the second mode — Attribute Contest — as a section that
 * replaces TN / Raises / Skill Pool with an opponent picker. The roll itself
 * goes through `startAttributeContest` (context `general`).
 */

import {
  CONTEST_ATTRIBUTES,
  contestAttributeDice,
  contestAttributeLabel,
  contestKeepDice,
  isContestAttributeKey,
  type ContestAttributeKey,
} from './opposed-attribute-contest.js';

export type CheckContestMode = 'check' | 'contest';

export interface ContestOpponentChoice {
  /** Stable key: `token:<id>` or `actor:<id>`. */
  key: string;
  label: string;
  actorId: string;
  actorUuid?: string;
  tokenId?: string;
  /** Currently targeted by the user (listed first, preselected). */
  targeted: boolean;
}

function esc(text: unknown): string {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function tokenList(source: any): any[] {
  if (!source) return [];
  if (Array.isArray(source)) return source;
  if (typeof source[Symbol.iterator] === 'function') return Array.from(source);
  if (Array.isArray(source.contents)) return source.contents;
  return [];
}

/**
 * Opponent candidates for a non-combat contest: targeted tokens first, then
 * the other tokens on the scene, then world actors. The rolling actor's own
 * tokens are excluded.
 */
export function listContestOpponents(actor: any): ContestOpponentChoice[] {
  const g = (globalThis as any);
  const selfId = String(actor?.id ?? '');
  const out: ContestOpponentChoice[] = [];
  const seen = new Set<string>();
  const push = (choice: ContestOpponentChoice) => {
    if (seen.has(choice.key)) return;
    seen.add(choice.key);
    out.push(choice);
  };
  const fromToken = (tok: any, targeted: boolean): void => {
    const tActor = tok?.actor;
    if (!tActor || String(tActor.id ?? '') === selfId) return;
    if (tok?.document?.hidden === true || tok?.hidden === true) return;
    const tokenId = String(tok.id ?? tok.document?.id ?? '');
    if (!tokenId) return;
    push({
      key: `token:${tokenId}`,
      label: String(tok.name || tActor.name || 'Token'),
      actorId: String(tActor.id ?? ''),
      ...(tActor.uuid ? { actorUuid: String(tActor.uuid) } : {}),
      tokenId,
      targeted,
    });
  };
  for (const tok of tokenList(g.game?.user?.targets)) fromToken(tok, true);
  for (const tok of tokenList(g.canvas?.tokens?.placeables)) fromToken(tok, false);
  for (const a of tokenList(g.game?.actors)) {
    if (!a || String(a.id ?? '') === selfId) continue;
    if (a.type !== 'character' && a.type !== 'npc') continue;
    const key = `actor:${String(a.id)}`;
    if (out.some((c) => c.actorId === String(a.id) && !c.tokenId)) continue;
    push({
      key,
      label: `${String(a.name || 'Actor')} (actor)`,
      actorId: String(a.id),
      ...(a.uuid ? { actorUuid: String(a.uuid) } : {}),
      targeted: false,
    });
  }
  return out;
}

export async function resolveContestOpponent(
  key: string,
  choices?: ContestOpponentChoice[],
): Promise<{ actor: any; token?: any } | null> {
  const g = (globalThis as any);
  const k = String(key || '');
  if (k.startsWith('token:')) {
    const tok = g.canvas?.tokens?.get?.(k.slice('token:'.length));
    if (tok?.actor) return { actor: tok.actor, token: tok };
  }
  if (k.startsWith('actor:')) {
    const a = g.game?.actors?.get?.(k.slice('actor:'.length));
    if (a) return { actor: a };
  }
  const choice = choices?.find((c) => c.key === k);
  if (choice?.actorUuid && typeof g.fromUuid === 'function') {
    try {
      const doc = await g.fromUuid(choice.actorUuid);
      if (doc?.documentName === 'Actor') return { actor: doc };
      if (doc?.actor) return { actor: doc.actor, token: doc.object ?? undefined };
    } catch {
      /* fall through */
    }
  }
  if (choice?.actorId) {
    const a = g.game?.actors?.get?.(choice.actorId);
    if (a) return { actor: a };
  }
  return null;
}

export interface ContestModeHtmlOptions {
  /** Attribute fixed by the clicked sheet control (attribute dialog). */
  fixedAttribute?: ContestAttributeKey;
  /** Preselected attribute when a select is shown. */
  defaultAttribute?: ContestAttributeKey;
  opponents: ContestOpponentChoice[];
}

/** Mode switch shown at the top of both roll dialogs. */
export function buildCheckContestSwitchHtml(checkLabel: string): string {
  return `<div class="md-group ms-check-contest-switch">
    <label class="md-label">Mode</label>
    <div class="ms-mode-options">
      <label class="ms-mode-option"><input type="radio" name="ccMode" value="check" checked/> ${esc(checkLabel)}</label>
      <label class="ms-mode-option"><input type="radio" name="ccMode" value="contest"/> Attribute Contest</label>
    </div>
  </div>`;
}

/** Contest-only fields (hidden while the dialog is in Check mode). */
export function buildContestSectionHtml(actor: any, opts: ContestModeHtmlOptions): string {
  const keep = contestKeepDice(actor);
  let attributeField: string;
  if (opts.fixedAttribute) {
    const dice = contestAttributeDice(actor, opts.fixedAttribute);
    attributeField = `<input type="hidden" name="contestAttribute" value="${esc(opts.fixedAttribute)}"/>
      <div class="md-group"><label class="md-label">Your Attribute</label>
        <div class="md-attr-display">${esc(contestAttributeLabel(opts.fixedAttribute))} (${dice}d8, keep ${keep})</div></div>`;
  } else {
    const def = opts.defaultAttribute && isContestAttributeKey(opts.defaultAttribute) ? opts.defaultAttribute : 'might';
    const options = CONTEST_ATTRIBUTES.map((key) => {
      const dice = contestAttributeDice(actor, key);
      return `<option value="${esc(key)}" ${key === def ? 'selected' : ''}>${esc(contestAttributeLabel(key))} (${dice}d8, keep ${keep})</option>`;
    }).join('');
    attributeField = `<div class="md-group"><label class="md-label">Your Attribute</label>
      <select name="contestAttribute" class="md-select">${options}</select></div>`;
  }
  const opponentOptions = opts.opponents.length
    ? opts.opponents
        .map(
          (c, i) =>
            `<option value="${esc(c.key)}" ${c.targeted || (i === 0 && !opts.opponents.some((o) => o.targeted)) ? 'selected' : ''}>${esc(c.label)}${c.targeted ? ' — targeted' : ''}</option>`,
        )
        .join('')
    : '<option value="">No other creature available</option>';
  return `<div class="ms-contest-only" style="display:none;">
    ${attributeField}
    <div class="md-group"><label class="md-label">Opponent <span class="md-sublabel">(targeted token, scene token or actor)</span></label>
      <select name="contestOpponent" class="md-select" ${opts.opponents.length ? '' : 'disabled'}>${opponentOptions}</select></div>
    <div class="md-group"><p class="md-sublabel">Opposed Attribute Contest: the opponent picks their Attribute on the chat card. No Skill, no Skill Points, no TN, no Raises — Final Results are compared directly. Higher wins; a tie changes nothing.</p></div>
  </div>`;
}

/** Toggle check-only / contest-only sections when the mode radio changes. */
export function bindCheckContestMode($html: any): void {
  const apply = () => {
    const mode = readCheckContestMode($html);
    $html.find('.ms-check-only').toggle(mode === 'check');
    $html.find('.ms-contest-only').toggle(mode === 'contest');
  };
  $html.find('[name="ccMode"]').on('change', apply);
  apply();
}

export function readCheckContestMode($html: any): CheckContestMode {
  const raw = $html.find('[name="ccMode"]:checked').val();
  return raw === 'contest' ? 'contest' : 'check';
}

export interface ContestDialogChoice {
  attributeKey: ContestAttributeKey;
  opponentKey: string;
}

export function readContestDialogChoice($html: any): ContestDialogChoice | null {
  const attr = String($html.find('[name="contestAttribute"]').val() ?? '');
  const opponentKey = String($html.find('[name="contestOpponent"]').val() ?? '');
  if (!isContestAttributeKey(attr) || !opponentKey) return null;
  return { attributeKey: attr, opponentKey };
}

/** Sheet contest: no action cost, no combat requirement. */
export async function runSheetAttributeContest(
  actor: any,
  choice: ContestDialogChoice,
  opponents?: ContestOpponentChoice[],
): Promise<boolean> {
  const g = (globalThis as any);
  const opponent = await resolveContestOpponent(choice.opponentKey, opponents);
  if (!opponent?.actor) {
    g.ui?.notifications?.warn?.('Pick an opponent for the contest.');
    return false;
  }
  const { startAttributeContest } = await import('./contest-card.js');
  const { getPrimaryTokenForActor } = await import('../utils/mechanics-adjacency.js');
  let initiatorToken: any = undefined;
  try {
    initiatorToken = getPrimaryTokenForActor(actor) ?? undefined;
  } catch {
    initiatorToken = undefined;
  }
  const msg = await startAttributeContest({
    context: 'general',
    initiatorActor: actor,
    initiatorToken,
    opponentActor: opponent.actor,
    opponentToken: opponent.token,
    attributeKey: choice.attributeKey,
    costsAttackAction: false,
  });
  return !!msg;
}
