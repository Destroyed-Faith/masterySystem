/**
 * Chat-driven Skill Check requests (Destroyed Faith).
 *
 * GM publishes one interactive ChatMessage from Rolls.
 * Players join voluntarily, propose Skill + Attribute.
 * GM approves / modifies / rejects inline.
 * Approved players roll via the existing Skill Check engine.
 * GM finalizes → one consolidated results card.
 */

import {
  SPEC_ATTRIBUTE_KEYS,
  isSpecAttributeKey,
  readSpecializations,
  resolveComparativeSkillCheck,
  skillAdvantageRerollMax,
  type SkillCheckSkillRef,
  type SkillRollSource,
} from '../rules/index.js';
import { promptSkillCheckRollDialog } from '../sheets/skill-check-roll-dialog.js';
import { executeSkillCheck } from '../sheets/skill-check-execute.js';
import { masteryLocalize } from '../utils/mastery-localize.js';
import { canonicalChatControls, syncChatRollChrome } from '../ui/quick-d8-bar.js';
import { listActorSkillOptions, skillRefFromKey, skillKeyFromRef } from '../epic-roll/rolls-skill-panel.js';
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
  return s ? `${s.name} (R${s.rank})` : ref.id;
}

/**
 * Authoritative assignment for an approved (or rolled) participant.
 * Used by the roll dialog / sheet entry points.
 */
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
    return {
      ...assigned,
      allowedSkills: [assigned.skill],
    };
  }
  // Fallback for legacy callers — unapproved must not roll
  return {
    skill: { kind: 'untrained' },
    attributeKey: 'wits',
    baseTn: payload.mode === 'comparative' ? 0 : payload.baseTn,
    taskDescription: payload.taskDescription,
    mode: payload.mode,
  };
}

/** Competing standalone dialog retired → open Rolls. */
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
  /** Optional audience restriction; empty = open join. */
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
      return 'DONE';
    case 'cancelled':
      return 'CANCELLED';
    case 'rolling':
      return 'ROLLING';
    default:
      return 'OPEN';
  }
}

function renderParticipantRow(
  payload: SkillCheckRequestPayload,
  p: SkillCheckParticipant,
): string {
  const actor = (globalThis as any).game?.actors?.get?.(p.actorId);
  const name = actor?.name ?? p.actorId;
  const gm = isGm();
  const skill =
    p.skill || p.proposedSkill
      ? skillRefLabel(actor, (p.skill || p.proposedSkill)!)
      : '—';
  const attr = cap(p.attributeKey || p.proposedAttributeKey || '—');
  const tn =
    payload.mode === 'standard' && payload.showTn
      ? ` · TN ${p.baseTn ?? payload.baseTn}`
      : payload.mode === 'standard' && gm
        ? ` · TN ${p.baseTn ?? payload.baseTn}`
        : '';
  const expl = p.explanation ? ` — ${escapeHtml(p.explanation)}` : '';

  let detail = '';
  let actions = '';
  switch (p.status) {
    case 'declined':
      detail = 'Not participating';
      break;
    case 'proposed':
      detail = `Proposed: ${skill} / ${attr}${expl}`;
      if (gm && payload.lifecycle !== 'completed' && payload.lifecycle !== 'cancelled') {
        actions = `
          <button type="button" class="ms-scr-btn ms-scr-approve" data-actor-id="${escapeHtml(p.actorId)}">Approve</button>
          <button type="button" class="ms-scr-btn ms-scr-modify" data-actor-id="${escapeHtml(p.actorId)}">Modify</button>
          <button type="button" class="ms-scr-btn ms-scr-reject" data-actor-id="${escapeHtml(p.actorId)}">Reject</button>`;
      }
      break;
    case 'rejected':
      detail = `Rejected — revise proposal (${skill} / ${attr})`;
      if (!gm && userOwnsActor((globalThis as any).game?.user, actor)) {
        actions = `<button type="button" class="ms-scr-btn ms-scr-revise" data-actor-id="${escapeHtml(p.actorId)}">Revise</button>`;
      }
      break;
    case 'approved':
      detail = `Approved: ${skill} / ${attr}${tn}`;
      if (
        !gm &&
        userOwnsActor((globalThis as any).game?.user, actor) &&
        payload.lifecycle !== 'completed'
      ) {
        actions = `<button type="button" class="ms-scr-btn ms-scr-roll" data-actor-id="${escapeHtml(p.actorId)}">Roll</button>`;
      } else if (gm) {
        actions = `
          <button type="button" class="ms-scr-btn ms-scr-modify" data-actor-id="${escapeHtml(p.actorId)}">Modify</button>
          <button type="button" class="ms-scr-btn ms-scr-roll" data-actor-id="${escapeHtml(p.actorId)}">Roll (GM)</button>`;
      }
      break;
    case 'rolled': {
      const outcome =
        payload.mode === 'comparative'
          ? p.comparativeOutcome || '—'
          : p.success
            ? 'Success'
            : 'Failure';
      detail = `Rolled ${p.rollTotal ?? '—'} → ${outcome}${
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
  </div>`;
}

function renderRequestCardHtml(payload: SkillCheckRequestPayload): string {
  const isComparative = payload.mode === 'comparative';
  const isAmbush = !!payload.comparative?.groupAmbush;
  const closed =
    payload.lifecycle === 'completed' || payload.lifecycle === 'cancelled';

  const tnLine =
    !isComparative && payload.showTn
      ? ` · Default TN <strong>${payload.baseTn}</strong>`
      : !isComparative && isGm()
        ? ` · Default TN <strong>${payload.baseTn}</strong> (GM)`
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

  const joinControls =
    !closed
      ? `<div class="ms-scr-join-row">
          <button type="button" class="ms-scr-btn ms-scr-join">Participate</button>
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
          <button type="button" class="ms-scr-btn ms-scr-finalize">Publish results</button>
          <button type="button" class="ms-scr-btn ms-scr-cancel">Cancel request</button>
        </div>`
      : '';

  const inviteHint =
    payload.invitedActorIds.length > 0
      ? `<p class="ms-scr-hint">Invitation limited to ${payload.invitedActorIds.length} character(s).</p>`
      : `<p class="ms-scr-hint">Open invitation — eligible players may join voluntarily.</p>`;

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
      ${inviteHint}
      ${joinControls}
      <div class="ms-scr-list">${participants || '<p class="ms-scr-hint">No participants yet.</p>'}</div>
      ${ambushGm}
      ${gmFooter}
    </div>`;
}

async function persistPayload(messageId: string, payload: SkillCheckRequestPayload): Promise<void> {
  const msg = (globalThis as any).game?.messages?.get?.(messageId);
  if (!msg) return;
  const content = renderRequestCardHtml(payload);
  await msg.update({
    content,
    flags: { [FLAG_SCOPE]: { skillCheckRequest: payload } },
  });
}

async function updatePayloadOnGm(
  messageId: string,
  mutator: (payload: SkillCheckRequestPayload) => SkillCheckRequestPayload | null,
): Promise<SkillCheckRequestPayload | null> {
  const msg = (globalThis as any).game?.messages?.get?.(messageId);
  if (!msg) {
    return null;
  }
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

/** Emit a player action for the GM to apply authoritatively. */
function emitPlayerAction(data: Record<string, unknown>): void {
  (globalThis as any).game?.socket?.emit?.(SOCKET_NAME, {
    type: 'skillCheckRequestAction',
    ...data,
  });
}

async function applyPlayerActionAsGm(data: any): Promise<void> {
  if (!isGm()) return;
  const messageId = String(data.messageId || '');
  const actorId = String(data.actorId || '');
  const action = String(data.action || '');
  const msg = (globalThis as any).game?.messages?.get?.(messageId);
  const payload = msg ? readSkillCheckRequest(msg) : null;
  if (!payload || payload.lifecycle === 'completed' || payload.lifecycle === 'cancelled') return;

  const actor = (globalThis as any).game?.actors?.get?.(actorId);
  // Ownership was validated client-side; GM re-checks actor exists
  if (!actor) return;

  let next: SkillCheckRequestPayload | null = null;
  if (action === 'decline') {
    if (!canActorJoinRequest(payload, actorId) && payload.participants[actorId]?.status !== 'rejected') {
      // already engaged — still allow decline from proposed? Spec: decline before propose
    }
    next = applyDecline(payload, actorId);
  } else if (action === 'propose') {
    if (!canActorJoinRequest(payload, actorId) && payload.participants[actorId]?.status !== 'rejected') {
      return;
    }
    const skill = data.skill as SkillCheckSkillRef;
    const attributeKey = String(data.attributeKey || '');
    if (!skill || !isSpecAttributeKey(attributeKey)) return;
    next = applyProposal(payload, actorId, {
      skill,
      attributeKey,
      explanation: String(data.explanation || ''),
    });
  }
  if (next) await persistPayload(messageId, next);
}

function eligibleOwnedActors(payload: SkillCheckRequestPayload): any[] {
  const user = (globalThis as any).game?.user;
  const out: any[] = [];
  for (const a of (globalThis as any).game?.actors ?? []) {
    if (a?.type !== 'character') continue;
    if (!userOwnsActor(user, a)) continue;
    if (user?.isGM && String(user.character?.id || '') !== String(a.id)) {
      // GM may still join with selected character only for participate; allow all owned for GM testing
      if (!user.character) {
        /* allow */
      }
    }
    if (payload.invitedActorIds.length && !payload.invitedActorIds.includes(a.id)) continue;
    out.push(a);
  }
  return out;
}

async function promptProposalDialog(
  payload: SkillCheckRequestPayload,
  preferredActorId?: string,
): Promise<{
  actorId: string;
  skill: SkillCheckSkillRef;
  attributeKey: string;
  explanation: string;
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

  const buildSkillOpts = (actor: any) =>
    listActorSkillOptions(actor)
      .map((o) => `<option value="${escapeHtml(o.key)}">${escapeHtml(o.label)}</option>`)
      .join('');
  const attrOpts = SPEC_ATTRIBUTE_KEYS.map(
    (k) => `<option value="${k}" ${k === 'wits' ? 'selected' : ''}>${cap(k)}</option>`,
  ).join('');
  const actorOpts = actors
    .map(
      (a) =>
        `<option value="${escapeHtml(a.id)}" ${a.id === initial.id ? 'selected' : ''}>${escapeHtml(a.name)}</option>`,
    )
    .join('');

  const content = `
    <form class="mastery-dialog-form ms-scr-propose-form">
      <p class="md-sublabel"><strong>Task:</strong> ${escapeHtml(payload.taskDescription)}</p>
      <div class="md-group">
        <label class="md-label">Character</label>
        <select name="actor" class="md-select">${actorOpts}</select>
      </div>
      <div class="md-group">
        <label class="md-label">Skill / Specialization</label>
        <select name="skill" class="md-select ms-scr-propose-skill">${buildSkillOpts(initial)}</select>
      </div>
      <div class="md-group">
        <label class="md-label">Attribute</label>
        <select name="attribute" class="md-select">${attrOpts}</select>
      </div>
      <div class="md-group">
        <label class="md-label">How does your character approach this? (optional)</label>
        <input type="text" name="explanation" class="md-input" maxlength="200" />
      </div>
      <p class="md-sublabel">Submitting does not roll. The GM must approve your approach.</p>
    </form>`;

  return new Promise((resolve) => {
    new DialogCls(
      {
        title: 'Propose approach',
        content,
        buttons: {
          submit: {
            label: 'Submit proposal',
            callback: (html: any) => {
              const root = html?.[0] ?? html;
              const actorId = String(
                (root.querySelector('[name="actor"]') as HTMLSelectElement)?.value || '',
              );
              const skillKey = String(
                (root.querySelector('[name="skill"]') as HTMLSelectElement)?.value || 'untrained',
              );
              const attributeKey = String(
                (root.querySelector('[name="attribute"]') as HTMLSelectElement)?.value || '',
              );
              const explanation = String(
                (root.querySelector('[name="explanation"]') as HTMLInputElement)?.value || '',
              ).trim();
              if (!isSpecAttributeKey(attributeKey)) {
                resolve(null);
                return;
              }
              resolve({
                actorId,
                skill: skillRefFromKey(skillKey),
                attributeKey,
                explanation,
              });
            },
          },
          cancel: { label: 'Cancel', callback: () => resolve(null) },
        },
        default: 'submit',
        render: (html: any) => {
          const root = html?.[0] ?? html;
          const actorSel = root?.querySelector?.('[name="actor"]') as HTMLSelectElement | null;
          const skillSel = root?.querySelector?.('[name="skill"]') as HTMLSelectElement | null;
          actorSel?.addEventListener('change', () => {
            const actor = (globalThis as any).game?.actors?.get?.(actorSel.value);
            if (skillSel && actor) skillSel.innerHTML = buildSkillOpts(actor);
          });
        },
        close: () => resolve(null),
      },
      { width: 440, classes: ['mastery-system', 'mastery-roll-dialog', 'ms-skill-check-dialog'] },
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
  const currentSkill = p?.skill || p?.proposedSkill || { kind: 'untrained' as const };
  const currentAttr = p?.attributeKey || p?.proposedAttributeKey || 'wits';
  const currentTn = p?.baseTn ?? payload.baseTn;
  const skillOpts = listActorSkillOptions(actor)
    .map((o) => {
      const sel = skillKeyFromRef(currentSkill) === o.key ? 'selected' : '';
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
    <form class="mastery-dialog-form">
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
                resolve(null);
                return;
              }
              resolve({ skill: skillRefFromKey(skillKey), attributeKey, baseTn });
            },
          },
          cancel: { label: 'Cancel', callback: () => resolve(null) },
        },
        default: 'save',
        close: () => resolve(null),
      },
      { width: 400, classes: ['mastery-system', 'mastery-roll-dialog'] },
    ).render(true);
  });
}

export async function openSkillCheckForRequest(
  actor: any,
  payload: SkillCheckRequestPayload,
  messageId: string,
): Promise<void> {
  const assigned = approvedAssignment(payload, String(actor.id));
  if (!assigned) {
    (globalThis as any).ui?.notifications?.warn?.(
      'This approach is not approved yet. Wait for the GM or submit a proposal.',
    );
    return;
  }
  if (payload.participants[String(actor.id)]?.status === 'rolled') {
    (globalThis as any).ui?.notifications?.info?.('Already rolled for this request.');
    return;
  }

  const source: SkillRollSource = {
    kind: 'gm-request',
    requestId: payload.requestId,
    requestMessageId: messageId,
    gmVerified: true,
    taskDescription: assigned.taskDescription,
    attributeKey: assigned.attributeKey,
    baseTn: assigned.baseTn,
    skill: assigned.skill,
    mode: assigned.mode,
    allowedSkills: [assigned.skill],
  };

  const choice = await promptSkillCheckRollDialog({
    actor,
    source,
    lockGmFields: true,
    allowedSkills: [assigned.skill],
    comparative: assigned.mode === 'comparative',
    title: `${assigned.taskDescription || 'Skill Check'} · ${actor.name}`,
  });
  if (!choice) return;

  choice.draft.source = source;
  choice.draft.skill = assigned.skill;
  choice.draft.attributeKey = assigned.attributeKey;
  choice.draft.baseTn = assigned.baseTn;
  choice.draft.taskDescription = assigned.taskDescription;
  if (assigned.mode === 'comparative') choice.draft.paidRaises = 0;

  const result = await executeSkillCheck({
    actor,
    draft: choice.draft,
    gmAssignment: {
      skill: assigned.skill,
      attributeKey: assigned.attributeKey,
      baseTn: assigned.baseTn,
      allowedSkills: [assigned.skill],
    },
    comparative: assigned.mode === 'comparative',
    flavorExtra: payload.note ? `Note: ${payload.note}` : undefined,
  });
  if (!result.ok) {
    (globalThis as any).ui?.notifications?.warn?.(result.error ?? 'Roll failed.');
    return;
  }

  if (isGm()) {
    await updatePayloadOnGm(messageId, (p) =>
      applyRollResult(p, String(actor.id), {
        paidRaises: result.snapshot?.paidRaisesDeclared,
        finalTn: result.snapshot?.finalTn,
        rollTotal: result.snapshot?.rollTotal,
        success: result.snapshot?.success,
      }),
    );
  } else {
    emitPlayerAction({
      messageId,
      actorId: String(actor.id),
      action: 'rolled',
      patch: {
        paidRaises: result.snapshot?.paidRaisesDeclared,
        finalTn: result.snapshot?.finalTn,
        rollTotal: result.snapshot?.rollTotal,
        success: result.snapshot?.success,
      },
    });
  }
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
    const mr = Math.max(1, Math.floor(Number(npc?.system?.mastery?.rank) || 1));
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

  const opp =
    payload.mode === 'comparative' && payload.opposition?.rolled
      ? `<p>Opposition: <strong>${escapeHtml(payload.opposition.label)}</strong> = ${payload.opposition.total}</p>`
      : '';

  return `<div class="ms-scr-results">
    <strong>${escapeHtml(payload.title || payload.taskDescription)}</strong>
    <div class="ms-scr-meta">${escapeHtml(payload.taskDescription)}</div>
    ${opp}
    <table class="ms-scr-results-table">
      <thead>${head}</thead>
      <tbody>${body || '<tr><td colspan="6">No rolls recorded.</td></tr>'}</tbody>
    </table>
  </div>`;
}

async function publishConsolidatedResults(
  messageId: string,
  payload: SkillCheckRequestPayload,
): Promise<void> {
  if (payload.resultsPublished) return;
  let next = payload;
  if (next.mode === 'comparative' && !next.comparative?.groupAmbush) {
    next = await ensureOppositionRolled(next);
    next = annotateComparativeOutcomes(next);
  }
  next = {
    ...next,
    lifecycle: 'completed',
    resultsPublished: true,
  };
  await persistPayload(messageId, next);
  await ChatMessage.create({
    user: (globalThis as any).game?.user?.id,
    speaker: ChatMessage.getSpeaker({ alias: 'Skill Check Results' }),
    content: buildConsolidatedResultsHtml(next),
  } as any);
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

  // Roll opposition once
  let withOpp = await ensureOppositionRolled({
    ...payload,
    comparative: { ...cfg, groupAmbush: false }, // temporary so ensureOpposition rolls
    opposition: undefined,
  });
  // restore ambush flag
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

  const obs = ambush.observerResults?.[0];
  const unaware = !!obs?.stealthWins;
  const html = `<div class="ms-scr-results ms-group-ambush-result">
    <strong>Group Ambush</strong>
    <div>${escapeHtml(payload.taskDescription)}</div>
    <ul>
      <li>Specialist: <strong>${escapeHtml(specialist.name)}</strong></li>
      <li>Participants: ${ambushIds
        .map((id) => escapeHtml((globalThis as any).game?.actors?.get?.(id)?.name ?? id))
        .join(', ')}</li>
      <li>Combined equipment penalty: −${ambush.plan?.combinedPenalty ?? 0}d8</li>
      <li>Final pool: ${ambush.plan?.finalPool}k${ambush.plan?.keepDice}</li>
      <li>Stealth total: <strong>${ambush.stealthTotal}</strong></li>
      <li>Opposition: ${escapeHtml(withOpp.opposition?.label || '—')} = ${withOpp.opposition?.total ?? '—'}</li>
      <li>Outcome: <strong>${unaware ? 'Observers unaware (ambush succeeds)' : 'Detected'}</strong></li>
    </ul>
  </div>`;

  const next: SkillCheckRequestPayload = {
    ...withOpp,
    lifecycle: 'completed',
    resultsPublished: true,
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
  if (messageId) {
    const m = (globalThis as any).game?.messages?.get?.(messageId);
    if (m) return m;
  }
  return Array.from((globalThis as any).game?.messages ?? []).find((m: any) => {
    const r = readSkillCheckRequest(m);
    return r?.requestId === requestId;
  });
}

async function handleChatAction(btn: HTMLElement, messageEl: HTMLElement): Promise<void> {
  const requestId = String(
    btn.closest('.ms-skill-check-request')?.getAttribute('data-request-id') || '',
  );
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

  if (btn.classList.contains('ms-scr-join') || btn.classList.contains('ms-scr-revise')) {
    const proposal = await promptProposalDialog(payload, btn.dataset.actorId);
    if (!proposal) return;
    const actor = (globalThis as any).game?.actors?.get?.(proposal.actorId);
    if (!userOwnsActor((globalThis as any).game?.user, actor)) {
      (globalThis as any).ui?.notifications?.warn?.('You cannot propose for this character.');
      return;
    }
    if (isGm()) {
      await updatePayloadOnGm(mid, (p) =>
        applyProposal(p, proposal.actorId, proposal),
      );
    } else {
      emitPlayerAction({
        messageId: mid,
        actorId: proposal.actorId,
        action: 'propose',
        skill: proposal.skill,
        attributeKey: proposal.attributeKey,
        explanation: proposal.explanation,
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
      emitPlayerAction({ messageId: mid, actorId: actor.id, action: 'decline' });
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
    await openSkillCheckForRequest(actor, fresh, mid);
    return;
  }

  if (btn.classList.contains('ms-scr-finalize')) {
    if (!isGm()) return;
    let current = readSkillCheckRequest(msg) || payload;
    if (current.mode === 'comparative' && !current.comparative?.groupAmbush) {
      current = await ensureOppositionRolled(current);
      current = annotateComparativeOutcomes(current);
      await persistPayload(mid, current);
    }
    await publishConsolidatedResults(mid, current);
    return;
  }

  if (btn.classList.contains('ms-scr-cancel')) {
    if (!isGm()) return;
    await updatePayloadOnGm(mid, (p) => ({ ...p, lifecycle: 'cancelled' }));
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
    '.ms-scr-join, .ms-scr-decline, .ms-scr-revise, .ms-scr-approve, .ms-scr-modify, .ms-scr-reject, .ms-scr-roll, .ms-scr-finalize, .ms-scr-cancel, .ms-scr-ambush-roll',
  ) as HTMLElement | null;
  if (!btn) {
    // Specialist select change is handled separately
    return;
  }
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

/** Find an open approved request for this actor (sheet entry). */
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
  // Any approved for actor
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    const payload = readSkillCheckRequest(m);
    if (!payload) continue;
    if (payload.lifecycle === 'completed' || payload.lifecycle === 'cancelled') continue;
    const p = payload.participants[actorId];
    if (p?.status === 'approved') return { message: m, payload };
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
      (globalThis as any).game?.socket?.on?.(SOCKET_NAME, async (data: any) => {
        if (!data || typeof data !== 'object') return;
        if (data.type === 'skillCheckRequestAction' && isGm()) {
          if (data.action === 'rolled') {
            const messageId = String(data.messageId || '');
            const actorId = String(data.actorId || '');
            await updatePayloadOnGm(messageId, (p) =>
              applyRollResult(p, actorId, data.patch || {}),
            );
            return;
          }
          await applyPlayerActionAsGm(data);
          return;
        }
      });
    };
    if ((globalThis as any).game?.ready) bindSocket();
    else Hooks.once('ready', bindSocket);
  }
}
