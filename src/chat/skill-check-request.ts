/**
 * Chat-driven Skill Check requests (Destroyed Faith).
 *
 * GM publishes one interactive ChatMessage from Rolls.
 * Players join / propose via socket → GM applies ChatMessage updates.
 * Approved players roll with compact controls (no second full Skill dialog).
 * Results update the same card automatically; GM may Close Check.
 */

import {
  SPEC_ATTRIBUTE_KEYS,
  findSpecializationById,
  isSpecAttributeKey,
  readSpecializations,
  resolveComparativeSkillCheck,
  skillAdvantageRerollMax,
  type SkillCheckDraft,
  type SkillCheckSkillRef,
} from '../rules/index.js';
import { executeSkillCheck } from '../sheets/skill-check-execute.js';
import { canonicalChatControls, syncChatRollChrome } from '../ui/quick-d8-bar.js';
import { getRulesMasteryRank } from '../utils/mastery-rank-sync.js';
import {
  listActorSpecializationOptions,
  listActorSkillOptions,
  participantSkillPreview,
  skillKeyFromRef,
  skillRefFromKey,
} from '../epic-roll/rolls-skill-panel.js';
import {
  SKILL_CHECK_REQUEST_SCHEMA,
  applyApprove,
  applyDecline,
  applyProposal,
  applyReject,
  applyRollResult,
  approvedAssignment,
  canActorJoinRequest,
  readyToFinalize,
  type SkillCheckComparativeMeta,
  type SkillCheckParticipant,
  type SkillCheckRequestMode,
  type SkillCheckRequestPayload,
} from './skill-check-request-state.js';

export {
  SKILL_CHECK_REQUEST_SCHEMA,
  approvedAssignment,
  canActorJoinRequest,
  readyToFinalize,
  type SkillCheckComparativeMeta,
  type SkillCheckParticipant,
  type SkillCheckRequestMode,
  type SkillCheckRequestPayload,
} from './skill-check-request-state.js';

const FLAG_SCOPE = 'mastery-system';
const SOCKET_NAME = 'system.mastery-system';

/** Dedupe rapid double-clicks (propose / roll). */
const recentActionKeys = new Map<string, number>();

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function newRequestId(): string {
  try {
    return (globalThis as any).foundry?.utils?.randomID?.() ?? `scr-${Date.now()}`;
  } catch {
    return `scr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

function userOwnsActor(user: any, actor: any): boolean {
  if (!user || !actor) return false;
  if (user.isGM) return true;
  return typeof actor.testUserPermission === 'function'
    ? actor.testUserPermission(user, 'OWNER')
    : false;
}

function isGm(): boolean {
  return !!(globalThis as any).game?.user?.isGM;
}

function actionKeyOnce(key: string, windowMs = 1500): boolean {
  const now = Date.now();
  const prev = recentActionKeys.get(key) || 0;
  if (now - prev < windowMs) return false;
  recentActionKeys.set(key, now);
  return true;
}

export function readSkillCheckRequest(message: any): SkillCheckRequestPayload | null {
  const flags = message?.flags?.[FLAG_SCOPE] ?? {};
  const raw = flags.skillCheckRequest;
  if (!raw || raw.schema !== SKILL_CHECK_REQUEST_SCHEMA) return null;
  return raw as SkillCheckRequestPayload;
}

function skillRefLabel(actor: any, ref: SkillCheckSkillRef): string {
  if (ref.kind === 'untrained') return 'Untrained';
  if (ref.kind === 'perception') return 'Perception';
  const specs = readSpecializations(actor?.system);
  const s = specs.find((x) => x.id === ref.id);
  return s ? `${s.name} · Rank ${s.rank}` : ref.id;
}

export function assignmentForActor(
  payload: SkillCheckRequestPayload,
  actorId: string,
): {
  skill: SkillCheckSkillRef;
  attributeKey: string;
  baseTn: number;
  taskDescription: string;
  mode: SkillCheckRequestMode;
  allowedSkills?: SkillCheckSkillRef[];
} {
  const assigned = approvedAssignment(payload, actorId);
  if (assigned) {
    return { ...assigned, allowedSkills: [assigned.skill] };
  }
  return {
    skill: { kind: 'untrained' },
    attributeKey: 'wits',
    baseTn: payload.mode === 'comparative' ? 0 : payload.baseTn,
    taskDescription: payload.taskDescription,
    mode: payload.mode,
  };
}

export async function showSkillCheckRequestDialog(): Promise<void> {
  const { showEpicMasteryRollConfigDialog } = await import(
    '../epic-roll/epic-mastery-roll-config-dialog.js'
  );
  showEpicMasteryRollConfigDialog();
}

export async function createSkillCheckRequest(input: {
  title?: string;
  taskDescription: string;
  note: string;
  baseTn: number;
  mode?: SkillCheckRequestMode;
  showTn?: boolean;
  invitedActorIds?: string[];
  comparative?: SkillCheckComparativeMeta;
}): Promise<ChatMessage | null> {
  const mode: SkillCheckRequestMode =
    input.mode === 'comparative' ? 'comparative' : 'standard';
  const requestId = newRequestId();
  const payload: SkillCheckRequestPayload = {
    schema: SKILL_CHECK_REQUEST_SCHEMA,
    requestId,
    lifecycle: 'open',
    title: (input.title || '').trim() || 'Skill Check',
    taskDescription: input.taskDescription.trim() || 'Skill Check',
    note: (input.note || '').trim(),
    mode,
    baseTn: Math.max(0, Math.floor(Number(input.baseTn) || 0)),
    showTn: mode === 'comparative' ? false : input.showTn !== false,
    invitedActorIds: [...(input.invitedActorIds || [])],
    participants: {},
    ...(input.comparative ? { comparative: input.comparative } : {}),
    createdBy: String((globalThis as any).game?.user?.id || ''),
  };

  const content = renderRequestCardHtml(payload);
  const msg = await ChatMessage.create({
    user: (globalThis as any).game?.user?.id,
    speaker: ChatMessage.getSpeaker({ alias: 'Skill Check' }),
    content,
    flags: {
      [FLAG_SCOPE]: {
        skillCheckRequest: payload,
      },
    },
  } as any);

  return msg as ChatMessage;
}

function lifecycleBadge(payload: SkillCheckRequestPayload): string {
  switch (payload.lifecycle) {
    case 'completed':
      return 'CLOSED';
    case 'cancelled':
      return 'CANCELLED';
    case 'rolling':
      return 'ROLLING';
    default:
      return 'OPEN';
  }
}

function renderInlineRollControls(
  payload: SkillCheckRequestPayload,
  p: SkillCheckParticipant,
  actor: any,
): string {
  if (p.status !== 'approved' || !p.skill || !p.attributeKey) return '';
  const preview = participantSkillPreview(actor, {
    actorId: p.actorId,
    skillRef: p.skill,
    attributeKey: p.attributeKey,
    baseTn: p.baseTn ?? payload.baseTn,
  });
  const baseTn = p.baseTn ?? payload.baseTn;
  const isComparative = payload.mode === 'comparative';
  const showCrit = preview.critAllowance > 0;

  const paidBlock = isComparative
    ? ''
    : `<div class="ms-scr-paid-inline" data-actor-id="${escapeHtml(p.actorId)}" data-base-tn="${baseTn}">
        <span>Paid Raises</span>
        <button type="button" class="ms-scr-btn ms-scr-paid-minus" data-actor-id="${escapeHtml(p.actorId)}">−</button>
        <strong class="ms-scr-paid-val" data-actor-id="${escapeHtml(p.actorId)}">0</strong>
        <button type="button" class="ms-scr-btn ms-scr-paid-plus" data-actor-id="${escapeHtml(p.actorId)}">+</button>
        <span class="ms-scr-final-tn" data-actor-id="${escapeHtml(p.actorId)}">Final TN ${baseTn}</span>
      </div>`;

  const critBlock = showCrit
    ? `<label class="ms-scr-crit-inline">
        <input type="checkbox" class="ms-scr-crit-check" data-actor-id="${escapeHtml(p.actorId)}" />
        Skill Crit (${preview.critRemaining}/${preview.critAllowance} left)
      </label>`
    : '';

  return `<div class="ms-scr-roll-panel" data-actor-id="${escapeHtml(p.actorId)}">
    <div class="ms-scr-roll-summary">
      <strong>${escapeHtml(actor?.name ?? p.actorId)}</strong>
      · ${escapeHtml(preview.skillLabel)} ${preview.rank}
      · ${escapeHtml(cap(p.attributeKey))} ${escapeHtml(preview.poolLabel)}
      · ${escapeHtml(preview.advantageLabel)}
    </div>
    ${paidBlock}
    ${critBlock}
    <button type="button" class="ms-scr-btn ms-scr-btn-primary ms-scr-roll"
      data-actor-id="${escapeHtml(p.actorId)}"
      data-pool="${escapeHtml(preview.poolLabel)}"
      data-comparative="${isComparative ? '1' : '0'}">
      Roll · ${escapeHtml(preview.poolLabel)}${isComparative ? '' : ` vs TN ${baseTn}`}
    </button>
  </div>`;
}

function renderParticipantRow(
  payload: SkillCheckRequestPayload,
  p: SkillCheckParticipant,
): string {
  const actor = (globalThis as any).game?.actors?.get?.(p.actorId);
  const name = actor?.name ?? p.actorId;
  const gm = isGm();
  const user = (globalThis as any).game?.user;
  const owns = userOwnsActor(user, actor);
  const skill =
    p.skill || p.proposedSkill
      ? skillRefLabel(actor, (p.skill || p.proposedSkill)!)
      : '—';
  const attr = cap(p.attributeKey || p.proposedAttributeKey || '—');
  const tnShown =
    payload.mode === 'standard' && (payload.showTn || gm)
      ? ` · TN ${p.baseTn ?? payload.baseTn}`
      : '';

  let detail = '';
  let actions = '';
  let rollPanel = '';

  switch (p.status) {
    case 'declined':
      detail = 'Not participating';
      break;
    case 'proposed':
      detail = `Pending approval: ${skill} / ${attr}`;
      if (gm && payload.lifecycle !== 'completed' && payload.lifecycle !== 'cancelled') {
        actions = `
          <button type="button" class="ms-scr-btn ms-scr-approve" data-actor-id="${escapeHtml(p.actorId)}">Approve</button>
          <button type="button" class="ms-scr-btn ms-scr-modify" data-actor-id="${escapeHtml(p.actorId)}">Modify</button>
          <button type="button" class="ms-scr-btn ms-scr-reject" data-actor-id="${escapeHtml(p.actorId)}">Reject</button>`;
      }
      break;
    case 'rejected':
      detail = `Rejected — revise (${skill} / ${attr})`;
      if (!gm && owns) {
        actions = `<button type="button" class="ms-scr-btn ms-scr-revise" data-actor-id="${escapeHtml(p.actorId)}">Revise</button>`;
      }
      break;
    case 'approved':
      detail = `Approved: ${skill} / ${attr}${tnShown}`;
      if (payload.lifecycle !== 'completed' && payload.lifecycle !== 'cancelled') {
        if (owns || gm) {
          rollPanel = renderInlineRollControls(payload, p, actor);
        }
        if (gm) {
          actions = `<button type="button" class="ms-scr-btn ms-scr-modify" data-actor-id="${escapeHtml(p.actorId)}">Modify</button>`;
        }
      }
      break;
    case 'rolled': {
      const outcome =
        payload.mode === 'comparative'
          ? p.comparativeOutcome || '—'
          : p.success
            ? 'Success'
            : 'Failure';
      detail = `Result ${p.rollTotal ?? '—'} → ${outcome}${
        payload.mode === 'standard' ? ` (Final TN ${p.finalTn ?? '—'})` : ''
      }`;
      break;
    }
  }

  return `<div class="ms-scr-participant" data-actor-id="${escapeHtml(p.actorId)}" data-status="${escapeHtml(p.status)}">
    <div class="ms-scr-participant-main">
      <strong>${escapeHtml(name)}</strong>
      <span class="ms-scr-status ms-scr-status-${escapeHtml(p.status)}">${detail}</span>
    </div>
    <div class="ms-scr-participant-actions">${actions}</div>
    ${rollPanel}
  </div>`;
}

function renderRequestCardHtml(payload: SkillCheckRequestPayload): string {
  const isComparative = payload.mode === 'comparative';
  const isAmbush = !!payload.comparative?.groupAmbush;
  const closed =
    payload.lifecycle === 'completed' || payload.lifecycle === 'cancelled';

  const tnLine =
    !isComparative && (payload.showTn || isGm())
      ? ` · Default TN <strong>${payload.baseTn}</strong>`
      : '';

  const modeLine = isAmbush
    ? 'Group Ambush (Comparative)'
    : isComparative
      ? 'Comparative'
      : 'Standard';

  const participants = Object.values(payload.participants)
    .sort((a, b) => String(a.actorId).localeCompare(String(b.actorId)))
    .map((p) => renderParticipantRow(payload, p))
    .join('');

  const joinControls = !closed
    ? `<div class="ms-scr-join-row">
        <button type="button" class="ms-scr-btn ms-scr-btn-primary ms-scr-join">Participate</button>
        <button type="button" class="ms-scr-btn ms-scr-decline">Not Participating</button>
      </div>`
    : '';

  let ambushGm = '';
  if (isAmbush && isGm() && !closed) {
    const parts = Object.values(payload.participants).filter(
      (p) => p.status === 'proposed' || p.status === 'approved' || p.status === 'rolled',
    );
    const opts = parts
      .map((p) => {
        const a = (globalThis as any).game?.actors?.get?.(p.actorId);
        const sel =
          payload.comparative?.stealthSpecialistId === p.actorId ? 'selected' : '';
        return `<option value="${escapeHtml(p.actorId)}" ${sel}>${escapeHtml(a?.name ?? p.actorId)}</option>`;
      })
      .join('');
    ambushGm = `<div class="ms-scr-ambush-gm">
      <label>Stealth specialist
        <select class="ms-scr-ambush-specialist">${opts || '<option value="">— join first —</option>'}</select>
      </label>
      <button type="button" class="ms-scr-btn ms-scr-ambush-roll">Resolve Group Ambush</button>
    </div>`;
  }

  const gmFooter =
    isGm() && !closed
      ? `<div class="ms-scr-gm-footer">
          <button type="button" class="ms-scr-btn ms-scr-gm-assign">Assign character…</button>
          <button type="button" class="ms-scr-btn ms-scr-close">Close Check</button>
        </div>`
      : '';

  const oppLine =
    payload.opposition?.rolled && isGm()
      ? `<div class="ms-scr-note">Opposition (GM): ${escapeHtml(payload.opposition.label)} = ${payload.opposition.total}</div>`
      : '';

  const inviteHint =
    payload.invitedActorIds.length > 0
      ? `<p class="ms-scr-hint">Invitation limited to ${payload.invitedActorIds.length} character(s).</p>`
      : `<p class="ms-scr-hint">Open invitation — eligible players may join.</p>`;

  return `
    <div class="ms-skill-check-request" data-request-id="${escapeHtml(payload.requestId)}" data-mode="${escapeHtml(
      payload.mode,
    )}" data-lifecycle="${escapeHtml(payload.lifecycle)}">
      <div class="ms-scr-head">
        <strong>${escapeHtml(payload.title)}</strong>
        <span class="ms-scr-badge">${lifecycleBadge(payload)}</span>
      </div>
      <div class="ms-scr-meta">${escapeHtml(payload.taskDescription)} · <strong>${modeLine}</strong>${tnLine}</div>
      ${payload.note ? `<div class="ms-scr-note">${escapeHtml(payload.note)}</div>` : ''}
      ${oppLine}
      ${inviteHint}
      ${joinControls}
      <div class="ms-scr-list">${participants || '<p class="ms-scr-hint">No participants yet.</p>'}</div>
      ${ambushGm}
      ${gmFooter}
    </div>`;
}

async function persistPayload(messageId: string, payload: SkillCheckRequestPayload): Promise<void> {
  const msg = (globalThis as any).game?.messages?.get?.(messageId);
  if (!msg) {
    console.warn('[mastery-system] skill-check persist: message not found', messageId);
    return;
  }
  const content = renderRequestCardHtml(payload);
  try {
    await msg.update({
      content,
      [`flags.${FLAG_SCOPE}.skillCheckRequest`]: payload,
    });
  } catch (err) {
    console.error('[mastery-system] skill-check persist failed', err);
    // Fallback: full flags namespace (may clobber sibling flags on this message)
    try {
      await msg.update({
        content,
        flags: { [FLAG_SCOPE]: { skillCheckRequest: payload } },
      });
    } catch (err2) {
      console.error('[mastery-system] skill-check persist fallback failed', err2);
      (globalThis as any).ui?.notifications?.error?.('Failed to update Skill Check card.');
    }
  }
}

async function updatePayloadOnGm(
  messageId: string,
  mutator: (payload: SkillCheckRequestPayload) => SkillCheckRequestPayload | null,
): Promise<SkillCheckRequestPayload | null> {
  const msg = (globalThis as any).game?.messages?.get?.(messageId);
  if (!msg) return null;
  if (!isGm() && !msg.canUserModify?.((globalThis as any).game.user, 'update')) {
    return null;
  }
  const payload = readSkillCheckRequest(msg);
  if (!payload) return null;
  const next = mutator(payload);
  if (!next) return null;
  await persistPayload(messageId, next);
  return next;
}

function findMessageByIdOrRequestId(messageId: string, requestId?: string): any {
  const byId = messageId
    ? (globalThis as any).game?.messages?.get?.(messageId)
    : null;
  if (byId && readSkillCheckRequest(byId)) return byId;
  if (!requestId) return byId;
  return Array.from((globalThis as any).game?.messages ?? []).find((m: any) => {
    const r = readSkillCheckRequest(m);
    return r?.requestId === requestId;
  });
}

function emitPlayerAction(data: Record<string, unknown>): void {
  const socket = (globalThis as any).game?.socket;
  if (!socket) {
    (globalThis as any).ui?.notifications?.error?.(
      'No game socket — cannot reach the GM. Is the GM connected?',
    );
    return;
  }
  const payload = {
    type: 'skillCheckRequestAction',
    requesterUserId: String((globalThis as any).game?.user?.id || ''),
    ...data,
  };
  socket.emit(SOCKET_NAME, payload);
}

function emitAckToUser(
  userId: string,
  ack: { ok: boolean; error?: string; requestId?: string; action?: string },
): void {
  if (!userId) return;
  (globalThis as any).game?.socket?.emit?.(SOCKET_NAME, {
    type: 'skillCheckRequestAck',
    targetUserId: userId,
    ...ack,
  });
}

function skillOwnedByActor(actor: any, skill: SkillCheckSkillRef): boolean {
  if (!skill) return false;
  if (skill.kind === 'specialization') {
    return !!findSpecializationById(readSpecializations(actor?.system), skill.id);
  }
  // Player proposals must be real Specs only
  return false;
}

async function applyPlayerActionAsGm(data: any): Promise<void> {
  if (!isGm()) return;
  const messageId = String(data.messageId || '');
  const requestId = String(data.requestId || '');
  const actorId = String(data.actorId || '');
  const action = String(data.action || '');
  const requesterUserId = String(data.requesterUserId || '');

  const msg = findMessageByIdOrRequestId(messageId, requestId);
  const payload = msg ? readSkillCheckRequest(msg) : null;
  if (!payload || !msg) {
    emitAckToUser(requesterUserId, { ok: false, error: 'Skill Check request not found.' });
    return;
  }
  if (payload.lifecycle === 'completed' || payload.lifecycle === 'cancelled') {
    emitAckToUser(requesterUserId, { ok: false, error: 'This Skill Check is closed.' });
    return;
  }

  const actor = (globalThis as any).game?.actors?.get?.(actorId);
  if (!actor) {
    emitAckToUser(requesterUserId, { ok: false, error: 'Character not found.' });
    return;
  }

  const requester = (globalThis as any).game?.users?.get?.(requesterUserId);
  if (requesterUserId && requester && !userOwnsActor(requester, actor) && !requester.isGM) {
    emitAckToUser(requesterUserId, { ok: false, error: 'You do not own that character.' });
    console.warn('[mastery-system] skill-check reject: ownership', requesterUserId, actorId);
    return;
  }

  const mid = String(msg.id);
  let next: SkillCheckRequestPayload | null = null;

  if (action === 'decline') {
    next = applyDecline(payload, actorId);
  } else if (action === 'propose') {
    if (!canActorJoinRequest(payload, actorId) && payload.participants[actorId]?.status !== 'rejected') {
      emitAckToUser(requesterUserId, {
        ok: false,
        error: 'Cannot propose for this character right now.',
      });
      return;
    }
    const skill = data.skill as SkillCheckSkillRef;
    const attributeKey = String(data.attributeKey || '');
    if (!skill || !isSpecAttributeKey(attributeKey)) {
      emitAckToUser(requesterUserId, { ok: false, error: 'Invalid Skill or Attribute.' });
      return;
    }
    if (!skillOwnedByActor(actor, skill)) {
      emitAckToUser(requesterUserId, {
        ok: false,
        error: 'Skill must be an existing Specialization on this character.',
      });
      return;
    }
    next = applyProposal(payload, actorId, { skill, attributeKey });
  } else if (action === 'rolled') {
    if (payload.participants[actorId]?.status === 'rolled') {
      emitAckToUser(requesterUserId, {
        ok: true,
        requestId: payload.requestId,
        action: 'rolled',
      });
      return;
    }
    if (payload.participants[actorId]?.status !== 'approved') {
      emitAckToUser(requesterUserId, {
        ok: false,
        error: 'Approach is not approved for rolling.',
      });
      return;
    }
    next = applyRollResult(payload, actorId, data.patch || {});
    if (next && next.mode === 'comparative' && next.opposition?.rolled) {
      next = annotateComparativeOutcomes(next);
    }
  }

  if (!next) {
    emitAckToUser(requesterUserId, { ok: false, error: 'Update rejected.' });
    return;
  }

  await persistPayload(mid, next);
  emitAckToUser(requesterUserId, {
    ok: true,
    requestId: payload.requestId,
    action,
  } as any);
}

function eligibleOwnedActors(payload: SkillCheckRequestPayload): any[] {
  const user = (globalThis as any).game?.user;
  const out: any[] = [];
  for (const a of (globalThis as any).game?.actors ?? []) {
    if (a?.type !== 'character') continue;
    if (!userOwnsActor(user, a)) continue;
    if (payload.invitedActorIds.length && !payload.invitedActorIds.includes(a.id)) continue;
    out.push(a);
  }
  // Prefer user.character first
  out.sort((a, b) => {
    const pref = String(user?.character?.id || '');
    if (a.id === pref) return -1;
    if (b.id === pref) return 1;
    return String(a.name).localeCompare(String(b.name));
  });
  return out;
}

async function promptProposalDialog(
  payload: SkillCheckRequestPayload,
  preferredActorId?: string,
): Promise<{
  actorId: string;
  skill: SkillCheckSkillRef;
  attributeKey: string;
} | null> {
  const DialogCls = (globalThis as any).Dialog;
  if (!DialogCls) return null;
  const actors = eligibleOwnedActors(payload);
  if (!actors.length) {
    (globalThis as any).ui?.notifications?.warn?.('No eligible character to join.');
    return null;
  }
  const initial =
    actors.find((a) => a.id === preferredActorId) ||
    actors.find((a) => a.id === (globalThis as any).game?.user?.character?.id) ||
    actors[0];

  const buildSkillOpts = (actor: any) => {
    const opts = listActorSpecializationOptions(actor);
    if (!opts.length) {
      return `<option value="">— no Specializations —</option>`;
    }
    return opts
      .map((o) => `<option value="${escapeHtml(o.key)}">${escapeHtml(o.label)}</option>`)
      .join('');
  };
  const attrOpts = SPEC_ATTRIBUTE_KEYS.map(
    (k) => `<option value="${k}" ${k === 'wits' ? 'selected' : ''}>${cap(k)}</option>`,
  ).join('');

  const needsActorPicker = actors.length > 1;
  const actorBlock = needsActorPicker
    ? `<div class="md-group">
        <label class="md-label">Character</label>
        <select name="actor" class="md-select">${actors
          .map(
            (a) =>
              `<option value="${escapeHtml(a.id)}" ${a.id === initial.id ? 'selected' : ''}>${escapeHtml(a.name)}</option>`,
          )
          .join('')}</select>
      </div>`
    : `<input type="hidden" name="actor" value="${escapeHtml(initial.id)}" />
       <p class="md-sublabel"><strong>${escapeHtml(initial.name)}</strong></p>`;

  const content = `
    <form class="mastery-dialog-form ms-scr-propose-form">
      <p class="md-sublabel">${escapeHtml(payload.taskDescription)}</p>
      ${actorBlock}
      <div class="md-group">
        <label class="md-label">Skill / Specialization</label>
        <select name="skill" class="md-select ms-scr-propose-skill">${buildSkillOpts(initial)}</select>
      </div>
      <div class="md-group">
        <label class="md-label">Attribute</label>
        <select name="attribute" class="md-select">${attrOpts}</select>
      </div>
      <p class="md-sublabel">Submitting does not roll. The GM must approve.</p>
    </form>`;

  return new Promise((resolve) => {
    let settled = false;
    const done = (v: {
      actorId: string;
      skill: SkillCheckSkillRef;
      attributeKey: string;
    } | null) => {
      if (settled) return;
      settled = true;
      resolve(v);
    };
    new DialogCls(
      {
        title: 'Propose approach',
        content,
        buttons: {
          submit: {
            label: 'Submit Proposal',
            callback: (html: any) => {
              const root = html?.[0] ?? html;
              const actorId = String(
                (root.querySelector('[name="actor"]') as HTMLInputElement | HTMLSelectElement)
                  ?.value || '',
              );
              const skillKey = String(
                (root.querySelector('[name="skill"]') as HTMLSelectElement)?.value || '',
              );
              const attributeKey = String(
                (root.querySelector('[name="attribute"]') as HTMLSelectElement)?.value || '',
              );
              if (!skillKey || !isSpecAttributeKey(attributeKey)) {
                (globalThis as any).ui?.notifications?.warn?.('Choose a Skill and Attribute.');
                done(null);
                return;
              }
              done({
                actorId,
                skill: { kind: 'specialization', id: skillKey },
                attributeKey,
              });
            },
          },
          cancel: { label: 'Cancel', callback: () => done(null) },
        },
        default: 'submit',
        render: (html: any) => {
          const root = html?.[0] ?? html;
          const actorSel = root?.querySelector?.('[name="actor"]') as HTMLSelectElement | null;
          const skillSel = root?.querySelector?.('[name="skill"]') as HTMLSelectElement | null;
          if (actorSel?.tagName === 'SELECT') {
            actorSel.addEventListener('change', () => {
              const actor = (globalThis as any).game?.actors?.get?.(actorSel.value);
              if (skillSel && actor) skillSel.innerHTML = buildSkillOpts(actor);
            });
          }
        },
        close: () => done(null),
      },
      {
        width: 420,
        classes: ['mastery-system', 'mastery-roll-dialog', 'ms-skill-check-dialog', 'ms-scr-propose-dialog'],
      },
    ).render(true);
  });
}

async function promptGmModifyDialog(
  payload: SkillCheckRequestPayload,
  actorId: string,
): Promise<{ skill: SkillCheckSkillRef; attributeKey: string; baseTn: number } | null> {
  const DialogCls = (globalThis as any).Dialog;
  const actor = (globalThis as any).game?.actors?.get?.(actorId);
  if (!DialogCls || !actor) return null;
  const p = payload.participants[actorId];
  const currentSkill = p?.skill || p?.proposedSkill;
  const currentAttr = p?.attributeKey || p?.proposedAttributeKey || 'wits';
  const currentTn = p?.baseTn ?? payload.baseTn;
  // GM may use full list including Untrained when overriding
  const skillOpts = listActorSkillOptions(actor)
    .map((o) => {
      const sel =
        currentSkill && skillKeyFromRef(currentSkill) === o.key ? 'selected' : '';
      return `<option value="${escapeHtml(o.key)}" ${sel}>${escapeHtml(o.label)}</option>`;
    })
    .join('');
  const attrOpts = SPEC_ATTRIBUTE_KEYS.map(
    (k) => `<option value="${k}" ${k === currentAttr ? 'selected' : ''}>${cap(k)}</option>`,
  ).join('');
  const tnBlock =
    payload.mode === 'standard'
      ? `<div class="md-group">
          <label class="md-label">Base TN</label>
          <input type="number" name="baseTn" class="md-input" min="0" step="1" value="${currentTn}" />
        </div>`
      : `<input type="hidden" name="baseTn" value="0" />`;

  const content = `
    <form class="mastery-dialog-form ms-scr-propose-form">
      <p><strong>${escapeHtml(actor.name)}</strong></p>
      <div class="md-group">
        <label class="md-label">Skill</label>
        <select name="skill" class="md-select">${skillOpts}</select>
      </div>
      <div class="md-group">
        <label class="md-label">Attribute</label>
        <select name="attribute" class="md-select">${attrOpts}</select>
      </div>
      ${tnBlock}
    </form>`;

  return new Promise((resolve) => {
    let settled = false;
    const done = (
      v: { skill: SkillCheckSkillRef; attributeKey: string; baseTn: number } | null,
    ) => {
      if (settled) return;
      settled = true;
      resolve(v);
    };
    new DialogCls(
      {
        title: 'Modify approach',
        content,
        buttons: {
          save: {
            label: 'Approve with changes',
            callback: (html: any) => {
              const root = html?.[0] ?? html;
              const skillKey = String(
                (root.querySelector('[name="skill"]') as HTMLSelectElement)?.value || 'untrained',
              );
              const attributeKey = String(
                (root.querySelector('[name="attribute"]') as HTMLSelectElement)?.value || 'wits',
              );
              const baseTn = Math.max(
                0,
                Math.floor(
                  Number((root.querySelector('[name="baseTn"]') as HTMLInputElement)?.value) || 0,
                ),
              );
              if (!isSpecAttributeKey(attributeKey)) {
                done(null);
                return;
              }
              done({ skill: skillRefFromKey(skillKey), attributeKey, baseTn });
            },
          },
          cancel: { label: 'Cancel', callback: () => done(null) },
        },
        default: 'save',
        close: () => done(null),
      },
      {
        width: 400,
        classes: ['mastery-system', 'mastery-roll-dialog', 'ms-skill-check-dialog', 'ms-scr-propose-dialog'],
      },
    ).render(true);
  });
}

async function promptGmAssignCharacter(
  payload: SkillCheckRequestPayload,
): Promise<string | null> {
  const DialogCls = (globalThis as any).Dialog;
  if (!DialogCls) return null;
  const pcs: any[] = [];
  for (const a of (globalThis as any).game?.actors ?? []) {
    if (a?.type === 'character') pcs.push(a);
  }
  if (!pcs.length) return null;
  const opts = pcs
    .map((a) => `<option value="${escapeHtml(a.id)}">${escapeHtml(a.name)}</option>`)
    .join('');
  return new Promise((resolve) => {
    new DialogCls(
      {
        title: 'Assign character',
        content: `<form class="mastery-dialog-form ms-scr-propose-form">
          <div class="md-group">
            <label class="md-label">Character</label>
            <select name="actor" class="md-select">${opts}</select>
          </div>
        </form>`,
        buttons: {
          ok: {
            label: 'Continue',
            callback: (html: any) => {
              const root = html?.[0] ?? html;
              resolve(
                String((root.querySelector('[name="actor"]') as HTMLSelectElement)?.value || ''),
              );
            },
          },
          cancel: { label: 'Cancel', callback: () => resolve(null) },
        },
        default: 'ok',
        close: () => resolve(null),
      },
      { width: 360, classes: ['mastery-system', 'mastery-roll-dialog', 'ms-scr-propose-dialog'] },
    ).render(true);
  });
}

/**
 * Execute an already-approved Skill Check without the large configuration dialog.
 */
export async function executeApprovedSkillRoll(opts: {
  actor: any;
  payload: SkillCheckRequestPayload;
  messageId: string;
  paidRaises?: number;
  declareSkillCrit?: boolean;
}): Promise<void> {
  const actor = opts.actor;
  const actorId = String(actor.id);
  const assigned = approvedAssignment(opts.payload, actorId);
  if (!assigned) {
    (globalThis as any).ui?.notifications?.warn?.('Approach is not approved.');
    return;
  }
  if (opts.payload.participants[actorId]?.status === 'rolled') {
    (globalThis as any).ui?.notifications?.info?.('Already rolled for this request.');
    return;
  }
  if (!actionKeyOnce(`roll:${opts.payload.requestId}:${actorId}`)) {
    return;
  }

  const isComparative = assigned.mode === 'comparative';
  const paidRaises = isComparative
    ? 0
    : Math.max(0, Math.floor(Number(opts.paidRaises) || 0));

  const draft: SkillCheckDraft = {
    actorId,
    paidRaises,
    declareSkillCrit: !!opts.declareSkillCrit,
    skill: assigned.skill,
    attributeKey: assigned.attributeKey,
    baseTn: assigned.baseTn,
    taskDescription: assigned.taskDescription,
    source: {
      kind: 'gm-request',
      requestId: opts.payload.requestId,
      requestMessageId: opts.messageId,
      gmVerified: true,
      taskDescription: assigned.taskDescription,
      attributeKey: assigned.attributeKey,
      baseTn: assigned.baseTn,
      skill: assigned.skill,
      mode: assigned.mode,
      allowedSkills: [assigned.skill],
    },
  };

  const result = await executeSkillCheck({
    actor,
    draft,
    gmAssignment: {
      skill: assigned.skill,
      attributeKey: assigned.attributeKey,
      baseTn: assigned.baseTn,
      allowedSkills: [assigned.skill],
    },
    comparative: isComparative,
    flavorExtra: opts.payload.note ? `Note: ${opts.payload.note}` : undefined,
  });
  if (!result.ok) {
    (globalThis as any).ui?.notifications?.warn?.(result.error ?? 'Roll failed.');
    return;
  }

  const patch = {
    paidRaises: result.snapshot?.paidRaisesDeclared,
    finalTn: result.snapshot?.finalTn,
    rollTotal: result.snapshot?.rollTotal,
    success: result.snapshot?.success,
  };

  if (isGm()) {
    let next = await updatePayloadOnGm(opts.messageId, (p) => {
      let n = applyRollResult(p, actorId, patch);
      if (n.mode === 'comparative') {
        // Ensure opposition exists once, then annotate
        return n;
      }
      return n;
    });
    if (next?.mode === 'comparative' && !next.comparative?.groupAmbush) {
      next = await ensureOppositionRolled(next);
      next = annotateComparativeOutcomes(next);
      await persistPayload(opts.messageId, next);
    }
  } else {
    emitPlayerAction({
      messageId: opts.messageId,
      requestId: opts.payload.requestId,
      actorId,
      action: 'rolled',
      patch,
    });
  }
}

/**
 * Sheet entry for an approved chat request: compact Paid Raises / Crit confirm only
 * (never the full Skill Check configuration dialog).
 */
export async function openSkillCheckForRequest(
  actor: any,
  payload: SkillCheckRequestPayload,
  messageId: string,
): Promise<void> {
  const actorId = String(actor?.id || '');
  const assigned = approvedAssignment(payload, actorId);
  if (!assigned) {
    (globalThis as any).ui?.notifications?.warn?.('Approach is not approved.');
    return;
  }
  if (payload.participants[actorId]?.status === 'rolled') {
    (globalThis as any).ui?.notifications?.info?.('Already rolled for this request.');
    return;
  }

  const isComparative = assigned.mode === 'comparative';
  const preview = participantSkillPreview(actor, {
    actorId,
    skillRef: assigned.skill,
    attributeKey: assigned.attributeKey,
    baseTn: assigned.baseTn,
  });
  const showCrit = preview.critAllowance > 0;
  const DialogCls = (globalThis as any).Dialog;
  if (!DialogCls) {
    await executeApprovedSkillRoll({ actor, payload, messageId, paidRaises: 0 });
    return;
  }

  const paidBlock = isComparative
    ? ''
    : `<div class="md-group ms-scr-paid-inline" data-base-tn="${assigned.baseTn}">
        <label class="md-label">Paid Raises</label>
        <div style="display:flex;align-items:center;gap:8px;">
          <button type="button" class="ms-scr-btn ms-scr-compact-minus">−</button>
          <strong class="ms-scr-compact-paid">0</strong>
          <button type="button" class="ms-scr-btn ms-scr-compact-plus">+</button>
          <span class="ms-scr-compact-final">Final TN ${assigned.baseTn}</span>
        </div>
      </div>`;
  const critBlock = showCrit
    ? `<label class="ms-scr-crit-inline"><input type="checkbox" name="crit" /> Skill Crit (${preview.critRemaining}/${preview.critAllowance} left)</label>`
    : '';

  const choice = await new Promise<{ paidRaises: number; declareSkillCrit: boolean } | null>(
    (resolve) => {
      let settled = false;
      const done = (v: { paidRaises: number; declareSkillCrit: boolean } | null) => {
        if (settled) return;
        settled = true;
        resolve(v);
      };
      new DialogCls(
        {
          title: 'Roll Skill Check',
          content: `<form class="mastery-dialog-form ms-scr-propose-form">
            <p class="md-sublabel">${escapeHtml(payload.taskDescription)}</p>
            <p><strong>${escapeHtml(actor.name)}</strong> · ${escapeHtml(preview.skillLabel)} ${preview.rank}
              · ${escapeHtml(cap(assigned.attributeKey))} ${escapeHtml(preview.poolLabel)}</p>
            ${paidBlock}
            ${critBlock}
          </form>`,
          buttons: {
            roll: {
              label: `Roll · ${preview.poolLabel}`,
              callback: (html: any) => {
                const root = html?.[0] ?? html;
                const paid = Math.max(
                  0,
                  Math.floor(Number(root.querySelector('.ms-scr-compact-paid')?.textContent) || 0),
                );
                const crit = !!(root.querySelector('[name="crit"]') as HTMLInputElement | null)
                  ?.checked;
                done({ paidRaises: isComparative ? 0 : paid, declareSkillCrit: crit });
              },
            },
            cancel: { label: 'Cancel', callback: () => done(null) },
          },
          default: 'roll',
          render: (html: any) => {
            const root = html?.[0] ?? html;
            const sync = () => {
              const paidEl = root.querySelector('.ms-scr-compact-paid');
              const finalEl = root.querySelector('.ms-scr-compact-final');
              const paid = Math.max(0, Math.floor(Number(paidEl?.textContent) || 0));
              if (finalEl) finalEl.textContent = `Final TN ${assigned.baseTn + paid * 4}`;
            };
            root.querySelector('.ms-scr-compact-minus')?.addEventListener('click', (ev: Event) => {
              ev.preventDefault();
              const paidEl = root.querySelector('.ms-scr-compact-paid');
              if (!paidEl) return;
              paidEl.textContent = String(Math.max(0, Math.floor(Number(paidEl.textContent) || 0) - 1));
              sync();
            });
            root.querySelector('.ms-scr-compact-plus')?.addEventListener('click', (ev: Event) => {
              ev.preventDefault();
              const paidEl = root.querySelector('.ms-scr-compact-paid');
              if (!paidEl) return;
              paidEl.textContent = String(Math.max(0, Math.floor(Number(paidEl.textContent) || 0) + 1));
              sync();
            });
          },
          close: () => done(null),
        },
        {
          width: 380,
          classes: ['mastery-system', 'mastery-roll-dialog', 'ms-scr-propose-dialog'],
        },
      ).render(true);
    },
  );
  if (!choice) return;
  await executeApprovedSkillRoll({
    actor,
    payload,
    messageId,
    paidRaises: choice.paidRaises,
    declareSkillCrit: choice.declareSkillCrit,
  });
}

async function ensureOppositionRolled(
  payload: SkillCheckRequestPayload,
): Promise<SkillCheckRequestPayload> {
  if (payload.mode !== 'comparative') return payload;
  if (payload.opposition?.rolled) return payload;
  if (payload.comparative?.groupAmbush) return payload;

  const meta = payload.comparative;
  if (!meta) return payload;

  const { masteryRoll } = await import('../dice/roll-handler.js');
  let oppTotal = 0;
  let oppLabel = 'Opposition';

  if (meta.source === 'npc' && meta.npcActorId) {
    const npc = (globalThis as any).game?.actors?.get?.(meta.npcActorId);
    const { readSituationalSkills, findSituationalSkillByName, findSituationalSkillById } =
      await import('../rules/index.js');
    const skills = readSituationalSkills(npc?.system);
    const byId = findSituationalSkillById(skills, meta.npcSkillKey || '');
    const byName =
      byId ||
      findSituationalSkillByName(skills, meta.npcSkillKey || '') ||
      findSituationalSkillByName(skills, 'Perception') ||
      skills[0];
    const pool = Math.max(0, Math.floor(Number(byName?.poolDice) || 0));
    const mr = Math.max(1, Math.floor(Number(getRulesMasteryRank(npc)) || 1));
    const keep = Math.max(1, Math.min(pool || 1, mr));
    const rank = Math.max(0, Math.floor(Number(byName?.skillRank) || 0));
    const result = await masteryRoll({
      numDice: pool,
      keepDice: keep,
      skill: 0,
      tn: 0,
      normalTn: 0,
      raiseTn: 0,
      declaredRaiseSlots: 0,
      stoneBonusRaises: 0,
      freeRaisesAvailableAtSuccess: 0,
      raiseModel: 'skill',
      rollDisadvantage: rank <= 0,
      skillAdvantageRerollMax: rank <= 0 ? 0 : skillAdvantageRerollMax(rank),
      label: `${npc?.name ?? 'NPC'} · ${byName?.name ?? 'Skill'}`,
      flavor: `Comparative opposition · ${payload.taskDescription}`,
      actorId: String(npc?.id || ''),
      isSkillRoll: true,
      rollKind: 'skill',
      applyPoolPenalties: false,
    } as any);
    oppTotal = Math.floor(Number(result?.total) || 0);
    oppLabel = `${npc?.name ?? 'NPC'} (${byName?.name ?? 'Skill'} ${pool}k${keep})`;
  } else if (meta.virtual) {
    const v = meta.virtual;
    const pool = Math.max(0, Math.floor(Number(v.poolDice) || 0));
    const mr = Math.max(1, Math.floor(Number(v.masteryRank) || 1));
    const keep = Math.max(1, Math.min(pool || 1, mr));
    const rank = Math.max(0, Math.floor(Number(v.skillRank) || 0));
    const result = await masteryRoll({
      numDice: pool,
      keepDice: keep,
      skill: 0,
      tn: 0,
      normalTn: 0,
      raiseTn: 0,
      declaredRaiseSlots: 0,
      stoneBonusRaises: 0,
      freeRaisesAvailableAtSuccess: 0,
      raiseModel: 'skill',
      rollDisadvantage: rank <= 0,
      skillAdvantageRerollMax: rank <= 0 ? 0 : skillAdvantageRerollMax(rank),
      attackExplodeDiceOn78: !!v.allowSkillCrit && rank >= 5,
      label: `${v.name} · ${v.skillName}`,
      flavor: `Comparative opposition · ${payload.taskDescription}`,
      isSkillRoll: true,
      rollKind: 'skill',
      applyPoolPenalties: false,
    } as any);
    oppTotal = Math.floor(Number(result?.total) || 0);
    oppLabel = `${v.name} (${v.skillName} ${pool}k${keep})`;
  }

  return {
    ...payload,
    opposition: { rolled: true, total: oppTotal, label: oppLabel },
  };
}

function annotateComparativeOutcomes(
  payload: SkillCheckRequestPayload,
): SkillCheckRequestPayload {
  if (payload.mode !== 'comparative' || !payload.opposition?.rolled) return payload;
  const opp = payload.opposition.total;
  const participants = { ...payload.participants };
  for (const [id, p] of Object.entries(participants)) {
    if (p.status !== 'rolled' || p.rollTotal == null) continue;
    const outcome = resolveComparativeSkillCheck({
      challengerTotal: p.rollTotal,
      defenderTotal: opp,
    });
    participants[id] = {
      ...p,
      comparativeOutcome: outcome.challengerWins
        ? 'wins'
        : outcome.tieFavorsDefender
          ? 'tie-defender'
          : 'loses',
      success: outcome.challengerWins,
    };
  }
  return { ...payload, participants };
}

/** Kept for tests — consolidated HTML helper (no longer auto-published). */
export function buildConsolidatedResultsHtml(payload: SkillCheckRequestPayload): string {
  const rows = Object.values(payload.participants).filter((p) => p.status === 'rolled');
  const body = rows
    .map((p) => {
      const actor = (globalThis as any).game?.actors?.get?.(p.actorId);
      const skill = p.skill ? skillRefLabel(actor, p.skill) : '—';
      const attr = cap(p.attributeKey || '—');
      if (payload.mode === 'comparative') {
        return `<tr>
          <td>${escapeHtml(actor?.name ?? p.actorId)}</td>
          <td>${escapeHtml(skill)}</td>
          <td>${escapeHtml(attr)}</td>
          <td>${p.rollTotal ?? '—'}</td>
          <td>${escapeHtml(p.comparativeOutcome || '—')}</td>
        </tr>`;
      }
      return `<tr>
        <td>${escapeHtml(actor?.name ?? p.actorId)}</td>
        <td>${escapeHtml(skill)}</td>
        <td>${escapeHtml(attr)}</td>
        <td>${p.baseTn ?? payload.baseTn}</td>
        <td>${p.rollTotal ?? '—'}</td>
        <td>${p.success ? 'Success' : 'Failure'}</td>
      </tr>`;
    })
    .join('');
  const head =
    payload.mode === 'comparative'
      ? `<tr><th>Character</th><th>Skill</th><th>Attribute</th><th>Result</th><th>Outcome</th></tr>`
      : `<tr><th>Character</th><th>Skill</th><th>Attribute</th><th>TN</th><th>Result</th><th>Outcome</th></tr>`;
  return `<div class="ms-scr-results">
    <strong>${escapeHtml(payload.title || payload.taskDescription)}</strong>
    <table class="ms-scr-results-table"><thead>${head}</thead>
    <tbody>${body || '<tr><td colspan="6">No rolls recorded.</td></tr>'}</tbody></table>
  </div>`;
}

async function resolveGroupAmbushFromChat(
  messageId: string,
  payload: SkillCheckRequestPayload,
): Promise<void> {
  const cfg = payload.comparative;
  if (!cfg?.groupAmbush) return;
  const specialistId = cfg.stealthSpecialistId || '';
  const specialist = (globalThis as any).game?.actors?.get?.(specialistId);
  if (!specialist) {
    (globalThis as any).ui?.notifications?.warn?.('Select a Stealth specialist first.');
    return;
  }
  const ambushIds =
    cfg.ambushParticipantIds?.length
      ? cfg.ambushParticipantIds
      : Object.values(payload.participants)
          .filter((p) => p.status === 'proposed' || p.status === 'approved' || p.status === 'rolled')
          .map((p) => p.actorId);
  const participants = ambushIds
    .map((id) => (globalThis as any).game?.actors?.get?.(id))
    .filter(Boolean);

  const approved = payload.participants[specialistId];
  const attributeKey = approved?.attributeKey || approved?.proposedAttributeKey || 'agility';

  let withOpp = await ensureOppositionRolled({
    ...payload,
    comparative: { ...cfg, groupAmbush: false },
    opposition: undefined,
  });
  withOpp = {
    ...withOpp,
    comparative: { ...cfg, ambushParticipantIds: ambushIds, stealthSpecialistId: specialistId },
  };

  const { executeGroupAmbushStealthRoll } = await import('../combat/group-ambush.js');
  const ambush = await executeGroupAmbushStealthRoll({
    specialist,
    participants,
    attributeKey,
    declareSkillCrit: false,
    observerPerceptionTotals: [
      {
        observer: { id: 'opp', name: withOpp.opposition?.label || 'Opposition' },
        perceptionTotal: withOpp.opposition?.total ?? 0,
      },
    ],
  });
  if (!ambush.ok) {
    (globalThis as any).ui?.notifications?.warn?.(ambush.error || 'Group Ambush failed.');
    return;
  }

  const unaware = !!ambush.observerResults?.[0]?.stealthWins;
  const html = `<div class="ms-scr-results ms-group-ambush-result">
    <strong>Group Ambush</strong>
    <div>${escapeHtml(payload.taskDescription)}</div>
    <ul>
      <li>Specialist: <strong>${escapeHtml(specialist.name)}</strong></li>
      <li>Combined equipment penalty: −${ambush.plan?.combinedPenalty ?? 0}d8</li>
      <li>Stealth total: <strong>${ambush.stealthTotal}</strong></li>
      <li>Opposition: ${escapeHtml(withOpp.opposition?.label || '—')} = ${withOpp.opposition?.total ?? '—'}</li>
      <li>Outcome: <strong>${unaware ? 'Observers unaware' : 'Detected'}</strong></li>
    </ul>
  </div>`;

  const next: SkillCheckRequestPayload = {
    ...withOpp,
    lifecycle: 'completed',
    participants: {
      ...withOpp.participants,
      [specialistId]: {
        ...(withOpp.participants[specialistId] || { actorId: specialistId, status: 'approved' }),
        status: 'rolled',
        rollTotal: ambush.stealthTotal,
        success: unaware,
        comparativeOutcome: unaware ? 'wins' : 'loses',
        skill: approved?.skill || approved?.proposedSkill,
        attributeKey,
      },
    },
  };
  await persistPayload(messageId, next);
  await ChatMessage.create({
    user: (globalThis as any).game?.user?.id,
    speaker: ChatMessage.getSpeaker({ alias: 'Group Ambush' }),
    content: html,
  } as any);
}

function findMessageForRequest(requestId: string, messageId?: string): any {
  return findMessageByIdOrRequestId(messageId || '', requestId);
}

function readPaidRaisesFromCard(root: HTMLElement, actorId: string): number {
  const el = root.querySelector(`.ms-scr-paid-val[data-actor-id="${actorId}"]`);
  return Math.max(0, Math.floor(Number(el?.textContent) || 0));
}

function readCritFromCard(root: HTMLElement, actorId: string): boolean {
  const el = root.querySelector(
    `.ms-scr-crit-check[data-actor-id="${actorId}"]`,
  ) as HTMLInputElement | null;
  return !!el?.checked;
}

async function handleChatAction(btn: HTMLElement, messageEl: HTMLElement): Promise<void> {
  const requestRoot = btn.closest('.ms-skill-check-request') as HTMLElement | null;
  const requestId = String(requestRoot?.getAttribute('data-request-id') || '');
  const messageId = String(
    messageEl.dataset?.messageId || messageEl.getAttribute?.('data-message-id') || '',
  );
  const msg = findMessageForRequest(requestId, messageId);
  const payload = msg ? readSkillCheckRequest(msg) : null;
  if (!payload || !msg) {
    (globalThis as any).ui?.notifications?.warn?.('Skill Check request not found.');
    return;
  }
  const mid = String(msg.id);
  const cardRoot = requestRoot || messageEl;

  if (btn.classList.contains('ms-scr-paid-minus') || btn.classList.contains('ms-scr-paid-plus')) {
    const actorId = String(btn.dataset.actorId || '');
    const valEl = cardRoot.querySelector(`.ms-scr-paid-val[data-actor-id="${actorId}"]`);
    const tnEl = cardRoot.querySelector(`.ms-scr-final-tn[data-actor-id="${actorId}"]`);
    const wrap = cardRoot.querySelector(
      `.ms-scr-paid-inline[data-actor-id="${actorId}"]`,
    ) as HTMLElement | null;
    const rollBtn = cardRoot.querySelector(
      `.ms-scr-roll[data-actor-id="${actorId}"]`,
    ) as HTMLElement | null;
    const baseTn = Math.max(0, Math.floor(Number(wrap?.dataset.baseTn) || payload.baseTn));
    let paid = Math.max(0, Math.floor(Number(valEl?.textContent) || 0));
    if (btn.classList.contains('ms-scr-paid-plus')) paid += 1;
    else paid = Math.max(0, paid - 1);
    const finalTn = baseTn + paid * 4;
    if (valEl) valEl.textContent = String(paid);
    if (tnEl) tnEl.textContent = `Final TN ${finalTn}`;
    if (rollBtn && rollBtn.dataset.comparative !== '1') {
      const pool = rollBtn.dataset.pool || '';
      rollBtn.textContent = `Roll · ${pool} vs TN ${finalTn}`;
    }
    return;
  }

  if (btn.classList.contains('ms-scr-join') || btn.classList.contains('ms-scr-revise')) {
    if (!actionKeyOnce(`join:${requestId}:${(globalThis as any).game?.user?.id}`)) return;
    const proposal = await promptProposalDialog(payload, btn.dataset.actorId);
    if (!proposal) return;
    const actor = (globalThis as any).game?.actors?.get?.(proposal.actorId);
    if (!userOwnsActor((globalThis as any).game?.user, actor)) {
      (globalThis as any).ui?.notifications?.warn?.('You cannot propose for this character.');
      return;
    }
    if (!skillOwnedByActor(actor, proposal.skill)) {
      (globalThis as any).ui?.notifications?.warn?.('Choose one of your Specializations.');
      return;
    }
    if (isGm()) {
      await updatePayloadOnGm(mid, (p) => applyProposal(p, proposal.actorId, proposal));
    } else {
      emitPlayerAction({
        messageId: mid,
        requestId: payload.requestId,
        actorId: proposal.actorId,
        action: 'propose',
        skill: proposal.skill,
        attributeKey: proposal.attributeKey,
      });
    }
    return;
  }

  if (btn.classList.contains('ms-scr-decline')) {
    const actors = eligibleOwnedActors(payload);
    const actor =
      actors.find((a) => a.id === (globalThis as any).game?.user?.character?.id) || actors[0];
    if (!actor) {
      (globalThis as any).ui?.notifications?.warn?.('No eligible character.');
      return;
    }
    if (isGm()) {
      await updatePayloadOnGm(mid, (p) => applyDecline(p, actor.id));
    } else {
      emitPlayerAction({
        messageId: mid,
        requestId: payload.requestId,
        actorId: actor.id,
        action: 'decline',
      });
    }
    return;
  }

  const actorId = String(btn.dataset.actorId || '');

  if (btn.classList.contains('ms-scr-approve')) {
    if (!isGm()) return;
    await updatePayloadOnGm(mid, (p) => applyApprove(p, actorId));
    return;
  }

  if (btn.classList.contains('ms-scr-reject')) {
    if (!isGm()) return;
    await updatePayloadOnGm(mid, (p) => applyReject(p, actorId));
    return;
  }

  if (btn.classList.contains('ms-scr-modify')) {
    if (!isGm()) return;
    const mod = await promptGmModifyDialog(payload, actorId);
    if (!mod) return;
    await updatePayloadOnGm(mid, (p) =>
      applyApprove(p, actorId, {
        skill: mod.skill,
        attributeKey: mod.attributeKey,
        baseTn: mod.baseTn,
      }),
    );
    return;
  }

  if (btn.classList.contains('ms-scr-roll')) {
    const actor = (globalThis as any).game?.actors?.get?.(actorId);
    if (!actor || !userOwnsActor((globalThis as any).game?.user, actor)) {
      (globalThis as any).ui?.notifications?.warn?.('You cannot roll for this character.');
      return;
    }
    const fresh = readSkillCheckRequest(msg) || payload;
    const paidRaises = readPaidRaisesFromCard(cardRoot, actorId);
    const declareSkillCrit = readCritFromCard(cardRoot, actorId);
    await executeApprovedSkillRoll({
      actor,
      payload: fresh,
      messageId: mid,
      paidRaises,
      declareSkillCrit,
    });
    return;
  }

  if (btn.classList.contains('ms-scr-gm-assign')) {
    if (!isGm()) return;
    const id = await promptGmAssignCharacter(payload);
    if (!id) return;
    const mod = await promptGmModifyDialog(payload, id);
    if (!mod) return;
    await updatePayloadOnGm(mid, (p) => {
      const seeded = p.participants[id]
        ? p
        : applyProposal(p, id, {
            skill: mod.skill.kind === 'specialization' ? mod.skill : { kind: 'untrained' },
            attributeKey: mod.attributeKey,
          });
      return applyApprove(seeded, id, {
        skill: mod.skill,
        attributeKey: mod.attributeKey,
        baseTn: mod.baseTn,
      });
    });
    return;
  }

  if (btn.classList.contains('ms-scr-close')) {
    if (!isGm()) return;
    await updatePayloadOnGm(mid, (p) => ({
      ...p,
      lifecycle: 'completed',
    }));
    return;
  }

  if (btn.classList.contains('ms-scr-ambush-roll')) {
    if (!isGm()) return;
    const fresh = readSkillCheckRequest(msg) || payload;
    await resolveGroupAmbushFromChat(mid, fresh);
    return;
  }
}

function onChatClick(event: MouseEvent): void {
  const target = event.target as HTMLElement | null;
  const btn = target?.closest?.(
    '.ms-scr-join, .ms-scr-decline, .ms-scr-revise, .ms-scr-approve, .ms-scr-modify, .ms-scr-reject, .ms-scr-roll, .ms-scr-close, .ms-scr-gm-assign, .ms-scr-ambush-roll, .ms-scr-paid-minus, .ms-scr-paid-plus',
  ) as HTMLElement | null;
  if (!btn) return;
  event.preventDefault();
  const messageEl = btn.closest('.chat-message') as HTMLElement | null;
  if (!messageEl) return;
  void handleChatAction(btn, messageEl);
}

function onChatChange(event: Event): void {
  const target = event.target as HTMLElement | null;
  const sel = target?.closest?.('.ms-scr-ambush-specialist') as HTMLSelectElement | null;
  if (!sel || !isGm()) return;
  const messageEl = sel.closest('.chat-message') as HTMLElement | null;
  if (!messageEl) return;
  const requestRoot = sel.closest('.ms-skill-check-request') as HTMLElement | null;
  const requestId = String(requestRoot?.dataset.requestId || '');
  const messageId = String(
    messageEl.dataset?.messageId || messageEl.getAttribute?.('data-message-id') || '',
  );
  const msg = findMessageForRequest(requestId, messageId);
  if (!msg) return;
  void updatePayloadOnGm(String(msg.id), (p) => ({
    ...p,
    comparative: {
      ...(p.comparative || { source: 'virtual' }),
      stealthSpecialistId: sel.value,
      groupAmbush: true,
    },
  }));
}

export function findOpenSkillCheckRequestForActor(
  actorId: string,
  preferredSkillId?: string,
): { message: any; payload: SkillCheckRequestPayload } | null {
  const messages = Array.from((globalThis as any).game?.messages ?? []);
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    const payload = readSkillCheckRequest(m);
    if (!payload) continue;
    if (payload.lifecycle === 'completed' || payload.lifecycle === 'cancelled') continue;
    const p = payload.participants[actorId];
    if (!p || p.status !== 'approved') continue;
    if (preferredSkillId && p.skill?.kind === 'specialization' && p.skill.id !== preferredSkillId) {
      continue;
    }
    return { message: m, payload };
  }
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    const payload = readSkillCheckRequest(m);
    if (!payload) continue;
    if (payload.lifecycle === 'completed' || payload.lifecycle === 'cancelled') continue;
    if (payload.participants[actorId]?.status === 'approved') {
      return { message: m, payload };
    }
  }
  return null;
}

function injectSkillCheckButton(controlsEl: HTMLElement | null | undefined): void {
  if (!(globalThis as any).game?.user?.isGM || !controlsEl) return;
  const parent = controlsEl.parentElement;
  if (!parent) return;
  parent.querySelectorAll('.ms-skill-check-launch').forEach((el) => el.remove());
  syncChatRollChrome();
}

let socketRegistered = false;
let handlersRegistered = false;

export function registerSkillCheckRequestHandlers(): void {
  if (handlersRegistered) return;
  handlersRegistered = true;

  document.addEventListener('click', onChatClick);
  document.addEventListener('change', onChatChange);

  Hooks.on('renderChatInput', (_app: unknown, elements: Record<string, HTMLElement>) => {
    injectSkillCheckButton(
      canonicalChatControls() ?? elements?.['#chat-controls'] ?? elements?.['chat-controls'],
    );
  });
  Hooks.on('renderChatLog', (_app: unknown, html: HTMLElement | JQuery) => {
    const root = html instanceof HTMLElement ? html : (html as JQuery)?.[0];
    injectSkillCheckButton(
      canonicalChatControls() ??
        (root?.querySelector?.('#chat-controls') as HTMLElement | null) ??
        null,
    );
  });
  Hooks.once('ready', () => {
    window.setTimeout(() => injectSkillCheckButton(canonicalChatControls()), 300);
  });

  if (!socketRegistered) {
    socketRegistered = true;
    const bindSocket = () => {
      const socket = (globalThis as any).game?.socket;
      if (!socket) {
        console.warn('[mastery-system] skill-check: game.socket missing at bind time');
        return;
      }
      socket.on(SOCKET_NAME, async (data: any) => {
        if (!data || typeof data !== 'object') return;

        // Player receives ack from GM
        if (data.type === 'skillCheckRequestAck') {
          const me = String((globalThis as any).game?.user?.id || '');
          if (data.targetUserId && data.targetUserId !== me) return;
          if (data.ok) {
            const kind = String(data.action || '');
            const msg =
              kind === 'rolled'
                ? 'Roll recorded on the Skill Check card.'
                : kind === 'decline'
                  ? 'Marked as not participating.'
                  : 'Proposal received — awaiting GM approval.';
            (globalThis as any).ui?.notifications?.info?.(msg);
          } else if (data.error) {
            (globalThis as any).ui?.notifications?.warn?.(String(data.error));
          }
          return;
        }

        if (data.type === 'skillCheckRequestAction' && isGm()) {
          try {
            await applyPlayerActionAsGm(data);
          } catch (err) {
            console.error('[mastery-system] skill-check GM action failed', err);
            emitAckToUser(String(data.requesterUserId || ''), {
              ok: false,
              error: 'GM failed to apply your action.',
            });
          }
        }
      });
      console.log('[mastery-system] skill-check socket listener registered');
    };
    if ((globalThis as any).game?.ready) bindSocket();
    else Hooks.once('ready', bindSocket);
  }
}
