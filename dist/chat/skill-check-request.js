/**
 * GM ordinary Skill Check request (DF 2026-10-24 GM-defined correction).
 * GM configures Task, Attribute, per-actor Skill, Base TN and targets.
 * Players only choose Paid Raises in the shared overlay.
 */
import { SPEC_ATTRIBUTE_KEYS, baseTnPresets, isSpecAttributeKey, readSpecializations, taskLevelFromBaseTn, } from '../rules/index.js';
import { promptSkillCheckRollDialog } from '../sheets/skill-check-roll-dialog.js';
import { executeSkillCheck } from '../sheets/skill-check-execute.js';
import { masteryLocalize } from '../utils/mastery-localize.js';
import { canonicalChatControls, syncChatRollChrome } from '../ui/quick-d8-bar.js';
const FLAG_SCOPE = 'mastery-system';
const SOCKET_NAME = 'system.mastery-system';
/** Bumped schema: Attribute + per-actor Skill assignment. */
const REQUEST_SCHEMA = 'df-skill-check-request-gm-defined-2026-10-24';
function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
function cap(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}
function newRequestId() {
    try {
        return globalThis.foundry?.utils?.randomID?.() ?? `scr-${Date.now()}`;
    }
    catch {
        return `scr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    }
}
function listPcActors() {
    const actors = [];
    for (const a of globalThis.game?.actors ?? []) {
        if (a?.type === 'character')
            actors.push(a);
    }
    return actors;
}
function userOwnsActor(user, actor) {
    if (!user || !actor)
        return false;
    if (user.isGM)
        return true;
    return typeof actor.testUserPermission === 'function'
        ? actor.testUserPermission(user, 'OWNER')
        : false;
}
export function readSkillCheckRequest(message) {
    const flags = message?.flags?.[FLAG_SCOPE] ?? {};
    const raw = flags.skillCheckRequest;
    if (!raw || raw.schema !== REQUEST_SCHEMA)
        return null;
    return raw;
}
function taskHint(baseTn) {
    const level = taskLevelFromBaseTn(baseTn);
    return `Task Level ${level}`;
}
function skillRefFromSelect(value) {
    const v = String(value || '').trim();
    if (v === 'perception')
        return { kind: 'perception' };
    if (v === 'untrained' || !v)
        return { kind: 'untrained' };
    return { kind: 'specialization', id: v };
}
function skillRefLabel(actor, ref) {
    if (ref.kind === 'untrained')
        return 'Untrained';
    if (ref.kind === 'perception')
        return 'Perception';
    const specs = readSpecializations(actor?.system);
    const s = specs.find((x) => x.id === ref.id);
    return s ? `${s.name} (R${s.rank})` : ref.id;
}
export function assignmentForActor(payload, actorId) {
    const skill = payload.perActorSkill[actorId] ?? payload.defaultSkill;
    return {
        skill,
        attributeKey: payload.attributeKey,
        baseTn: payload.baseTn,
        taskDescription: payload.taskDescription,
        ...(payload.allowedSkills?.length ? { allowedSkills: payload.allowedSkills } : {}),
    };
}
/** GM dialog to create a Skill Check request. */
export async function showSkillCheckRequestDialog() {
    const Dialog = globalThis.Dialog;
    if (!Dialog)
        return;
    if (!globalThis.game?.user?.isGM) {
        globalThis.ui?.notifications?.warn?.('Only the GM can request Skill Checks.');
        return;
    }
    const pcs = listPcActors();
    if (pcs.length === 0) {
        globalThis.ui?.notifications?.warn?.('No player characters found.');
        return;
    }
    const presets = baseTnPresets()
        .map((tn) => `<option value="${tn}" ${tn === 12 ? 'selected' : ''}>${tn} — ${taskHint(tn)}</option>`)
        .join('');
    const attrOptions = SPEC_ATTRIBUTE_KEYS.map((k) => `<option value="${k}" ${k === 'wits' ? 'selected' : ''}>${cap(k)}</option>`).join('');
    const actorRows = pcs
        .map((a) => {
        const specs = readSpecializations(a.system);
        const opts = [
            `<option value="perception">Perception</option>`,
            `<option value="untrained">Untrained</option>`,
            ...specs.map((s) => `<option value="${escapeHtml(s.id)}">${escapeHtml(s.name)} · Rank ${s.rank}</option>`),
        ].join('');
        return `<div class="ms-scr-actor-row" data-actor-id="${escapeHtml(a.id)}">
        <label class="ms-scr-actor">
          <input type="checkbox" name="target" value="${escapeHtml(a.id)}" checked />
          ${escapeHtml(a.name)}
        </label>
        <select name="skill-${escapeHtml(a.id)}" class="md-select ms-scr-actor-skill">${opts}</select>
      </div>`;
    })
        .join('');
    const content = `
    <form class="mastery-dialog-form ms-scr-gm-form">
      <div class="md-group">
        <label class="md-label">${masteryLocalize('MASTERY.df2026.skillRequest.task', 'Task')}</label>
        <input type="text" name="task" class="md-input" value="" placeholder="e.g. Examine tracks at the north gate" maxlength="200" />
      </div>
      <div class="md-group">
        <label class="md-label">${masteryLocalize('MASTERY.df2026.skillRequest.attribute', 'Attribute (GM-defined)')}</label>
        <select name="attribute" class="md-select">${attrOptions}</select>
      </div>
      <div class="md-group">
        <label class="md-label">${masteryLocalize('MASTERY.df2026.skillRequest.baseTn', 'Base Target Number (TN)')}</label>
        <select name="baseTn" class="md-select">${presets}<option value="custom">Custom…</option></select>
        <input type="number" name="baseTnCustom" class="md-input" min="0" step="1" value="12" style="display:none;margin-top:6px" />
      </div>
      <div class="md-group">
        <label class="md-label">${masteryLocalize('MASTERY.df2026.skillRequest.targets', 'Players / characters + assigned Skill')}</label>
        <div class="ms-scr-actors-map">${actorRows}</div>
        <small class="md-sublabel">${masteryLocalize('MASTERY.df2026.skillRequest.mapHint', 'Map each recipient to a matching Specialization, Perception, or Untrained. Do not silently accept unrelated Skills.')}</small>
      </div>
      <div class="md-group">
        <label class="md-label">${masteryLocalize('MASTERY.df2026.skillRequest.note', 'Note (optional)')}</label>
        <textarea name="note" class="md-input" rows="2" placeholder="What should they watch for?"></textarea>
      </div>
      <p class="md-sublabel">${masteryLocalize('MASTERY.df2026.skillRequest.hint', 'You define Task, Attribute, Skill and Base TN. Each player only chooses Paid Raises.')}</p>
    </form>`;
    await new Promise((resolve) => {
        new Dialog({
            title: masteryLocalize('MASTERY.df2026.skillRequest.title', 'GM · Request Skill Check'),
            content,
            buttons: {
                send: {
                    label: masteryLocalize('MASTERY.df2026.skillRequest.send', 'Send request'),
                    callback: async (html) => {
                        const root = html instanceof HTMLElement
                            ? html
                            : html?.[0] ?? null;
                        const taskDescription = String(root?.querySelector('[name="task"]')?.value || '').trim() || 'Skill Check';
                        const attributeKey = String(root?.querySelector('[name="attribute"]')?.value ||
                            '');
                        if (!isSpecAttributeKey(attributeKey)) {
                            globalThis.ui?.notifications?.warn?.('Choose a valid Attribute.');
                            return;
                        }
                        const baseSel = String(root?.querySelector('[name="baseTn"]')?.value || '12');
                        let baseTn = 12;
                        if (baseSel === 'custom') {
                            baseTn = Math.max(0, Math.floor(Number(root?.querySelector('[name="baseTnCustom"]')
                                ?.value) || 0));
                        }
                        else {
                            baseTn = Math.max(0, Math.floor(Number(baseSel) || 12));
                        }
                        const note = String(root?.querySelector('[name="note"]')?.value || '').trim();
                        const targetActorIds = Array.from(root?.querySelectorAll('input[name="target"]:checked') ?? []).map((el) => el.value);
                        if (!targetActorIds.length) {
                            globalThis.ui?.notifications?.warn?.('Select at least one character.');
                            return;
                        }
                        const perActorSkill = {};
                        for (const id of targetActorIds) {
                            const sel = root?.querySelector(`[name="skill-${id}"]`);
                            perActorSkill[id] = skillRefFromSelect(sel?.value || 'untrained');
                        }
                        const firstSkill = perActorSkill[targetActorIds[0]] ?? { kind: 'untrained' };
                        await createSkillCheckRequest({
                            taskDescription,
                            note,
                            baseTn,
                            attributeKey,
                            defaultSkill: firstSkill,
                            perActorSkill,
                            targetActorIds,
                        });
                        resolve();
                    },
                },
                cancel: {
                    label: masteryLocalize('MASTERY.df2026.skillCheck.cancel', 'Cancel'),
                    callback: () => resolve(),
                },
            },
            default: 'send',
            render: (html) => {
                const root = html instanceof HTMLElement ? html : html?.[0];
                if (!root)
                    return;
                root.closest?.('.window-app')?.classList?.add?.('mastery-system', 'mastery-roll-dialog', 'ms-skill-check-dialog');
                const sel = root.querySelector('[name="baseTn"]');
                const custom = root.querySelector('[name="baseTnCustom"]');
                sel?.addEventListener('change', () => {
                    if (custom)
                        custom.style.display = sel.value === 'custom' ? '' : 'none';
                });
            },
            close: () => resolve(),
        }, { width: 520, classes: ['mastery-system', 'mastery-roll-dialog', 'ms-skill-check-dialog'] }).render(true);
    });
}
export async function createSkillCheckRequest(input) {
    const requestId = newRequestId();
    const responses = {};
    for (const id of input.targetActorIds) {
        responses[id] = { status: 'pending' };
    }
    const payload = {
        schema: REQUEST_SCHEMA,
        requestId,
        taskDescription: input.taskDescription,
        note: input.note,
        baseTn: Math.max(0, Math.floor(Number(input.baseTn) || 0)),
        attributeKey: input.attributeKey,
        defaultSkill: input.defaultSkill,
        perActorSkill: { ...input.perActorSkill },
        ...(input.allowedSkills?.length ? { allowedSkills: input.allowedSkills } : {}),
        targetActorIds: [...input.targetActorIds],
        responses,
        createdBy: String(globalThis.game?.user?.id || ''),
    };
    const content = renderRequestCardHtml(payload);
    const msg = await ChatMessage.create({
        user: globalThis.game?.user?.id,
        speaker: ChatMessage.getSpeaker({ alias: 'Skill Check' }),
        content,
        flags: {
            [FLAG_SCOPE]: {
                skillCheckRequest: payload,
            },
        },
    });
    emitOpenOverlays(payload, String(msg?.id || ''));
    return msg;
}
function renderRequestCardHtml(payload) {
    const participants = payload.targetActorIds
        .map((id) => {
        const actor = globalThis.game?.actors?.get?.(id);
        const name = actor?.name ?? id;
        const assigned = assignmentForActor(payload, id);
        const skillTxt = actor ? skillRefLabel(actor, assigned.skill) : assigned.skill.kind;
        const r = payload.responses[id];
        let status = 'pending';
        let detail = `${skillTxt} · awaiting`;
        if (r?.status === 'rolled') {
            status = r.success ? 'ok' : 'fail';
            detail = `${skillTxt} · Paid ${r.paidRaises ?? 0} · Final TN ${r.finalTn ?? '—'} · roll ${r.rollTotal ?? '—'}`;
        }
        return `<div class="ms-scr-participant" data-actor-id="${escapeHtml(id)}">
        <span>${escapeHtml(name)}</span>
        <span class="ms-scr-status ms-scr-status-${status}">${escapeHtml(detail)}</span>
        <button type="button" class="ms-scr-open" data-actor-id="${escapeHtml(id)}" data-request-id="${escapeHtml(payload.requestId)}">Open roll</button>
      </div>`;
    })
        .join('');
    return `
    <div class="ms-skill-check-request" data-request-id="${escapeHtml(payload.requestId)}">
      <div class="ms-scr-head">
        <strong>${masteryLocalize('MASTERY.df2026.skillRequest.cardTitle', 'GM requests Skill Check')}</strong>
        <span class="ms-scr-badge">OPEN</span>
      </div>
      <div class="ms-scr-meta">${escapeHtml(payload.taskDescription)} · ${escapeHtml(cap(payload.attributeKey))} · Base TN <strong>${payload.baseTn}</strong> (${escapeHtml(taskHint(payload.baseTn))})</div>
      ${payload.note ? `<div class="ms-scr-note">${escapeHtml(payload.note)}</div>` : ''}
      <div class="ms-scr-list">${participants}</div>
      <p class="ms-scr-hint">Players choose only Paid Raises. Closing the overlay does not cancel — reopen here.</p>
    </div>`;
}
function emitOpenOverlays(payload, messageId) {
    globalThis.game?.socket?.emit?.(SOCKET_NAME, {
        type: 'skillCheckRequestOpen',
        requestId: payload.requestId,
        messageId,
        payload,
    });
    void maybeOpenLocalOverlay(payload, messageId);
}
async function maybeOpenLocalOverlay(payload, messageId) {
    const user = globalThis.game?.user;
    if (!user)
        return;
    for (const actorId of payload.targetActorIds) {
        const actor = globalThis.game?.actors?.get?.(actorId);
        if (!actor || !userOwnsActor(user, actor))
            continue;
        if (user.isGM && String(user.character?.id || '') !== String(actorId))
            continue;
        await openSkillCheckForRequest(actor, payload, messageId);
        break;
    }
}
export async function openSkillCheckForRequest(actor, payload, messageId) {
    const assigned = assignmentForActor(payload, String(actor.id));
    const source = {
        kind: 'gm-request',
        requestId: payload.requestId,
        requestMessageId: messageId,
        gmVerified: true,
        taskDescription: assigned.taskDescription,
        attributeKey: assigned.attributeKey,
        baseTn: assigned.baseTn,
        skill: assigned.skill,
        ...(assigned.allowedSkills?.length ? { allowedSkills: assigned.allowedSkills } : {}),
    };
    const choice = await promptSkillCheckRollDialog({
        actor,
        source,
        lockGmFields: true,
        allowedSkills: assigned.allowedSkills,
        title: `${assigned.taskDescription || 'Skill Check'} · ${actor.name}`,
    });
    if (!choice)
        return;
    // Force authoritative assignment — ignore any forged draft fields.
    choice.draft.source = source;
    choice.draft.skill = assigned.skill;
    choice.draft.attributeKey = assigned.attributeKey;
    choice.draft.baseTn = assigned.baseTn;
    choice.draft.taskDescription = assigned.taskDescription;
    const result = await executeSkillCheck({
        actor,
        draft: choice.draft,
        gmAssignment: assigned,
        flavorExtra: payload.note ? `Note: ${payload.note}` : undefined,
    });
    if (!result.ok) {
        globalThis.ui?.notifications?.warn?.(result.error ?? 'Roll failed.');
        return;
    }
    await updateRequestParticipant(messageId, String(actor.id), {
        status: 'rolled',
        paidRaises: result.snapshot?.paidRaisesDeclared,
        finalTn: result.snapshot?.finalTn,
        rollTotal: result.snapshot?.rollTotal,
        success: result.snapshot?.success,
    });
}
async function updateRequestParticipant(messageId, actorId, patch) {
    const msg = globalThis.game?.messages?.get?.(messageId);
    if (!msg) {
        globalThis.game?.socket?.emit?.(SOCKET_NAME, {
            type: 'skillCheckRequestUpdate',
            messageId,
            actorId,
            patch,
        });
        return;
    }
    if (!globalThis.game?.user?.isGM &&
        !msg.canUserModify?.(globalThis.game.user, 'update')) {
        globalThis.game?.socket?.emit?.(SOCKET_NAME, {
            type: 'skillCheckRequestUpdate',
            messageId,
            actorId,
            patch,
        });
        return;
    }
    const payload = readSkillCheckRequest(msg);
    if (!payload)
        return;
    payload.responses[actorId] = { ...payload.responses[actorId], ...patch };
    const content = renderRequestCardHtml(payload);
    await msg.update({
        content,
        flags: { [FLAG_SCOPE]: { skillCheckRequest: payload } },
    });
}
/** Find an open GM request targeting this actor (optionally matching a Spec id). */
export function findOpenSkillCheckRequestForActor(actorId, preferredSkillId) {
    const messages = Array.from(globalThis.game?.messages ?? []);
    for (let i = messages.length - 1; i >= 0; i--) {
        const m = messages[i];
        const payload = readSkillCheckRequest(m);
        if (!payload)
            continue;
        if (!payload.targetActorIds.includes(actorId))
            continue;
        if (payload.responses[actorId]?.status === 'rolled')
            continue;
        if (preferredSkillId) {
            const assigned = assignmentForActor(payload, actorId);
            if (assigned.skill.kind === 'specialization' &&
                assigned.skill.id === preferredSkillId) {
                return { message: m, payload };
            }
        }
        else {
            return { message: m, payload };
        }
    }
    // Second pass: any open request for actor (even if Spec mismatch — GM mapping wins)
    for (let i = messages.length - 1; i >= 0; i--) {
        const m = messages[i];
        const payload = readSkillCheckRequest(m);
        if (!payload)
            continue;
        if (!payload.targetActorIds.includes(actorId))
            continue;
        if (payload.responses[actorId]?.status === 'rolled')
            continue;
        return { message: m, payload };
    }
    return null;
}
function onChatClick(event) {
    const target = event.target;
    const btn = target?.closest?.('.ms-scr-open');
    if (!btn)
        return;
    event.preventDefault();
    const actorId = String(btn.dataset.actorId || '');
    const requestId = String(btn.dataset.requestId || '');
    const messageEl = btn.closest('.chat-message');
    const messageId = String(messageEl?.dataset?.messageId || messageEl?.getAttribute?.('data-message-id') || '');
    const msg = globalThis.game?.messages?.get?.(messageId) ||
        Array.from(globalThis.game?.messages ?? []).find((m) => {
            const r = readSkillCheckRequest(m);
            return r?.requestId === requestId;
        });
    const payload = msg ? readSkillCheckRequest(msg) : null;
    if (!payload) {
        globalThis.ui?.notifications?.warn?.('Skill Check request not found.');
        return;
    }
    const actor = globalThis.game?.actors?.get?.(actorId);
    const user = globalThis.game?.user;
    if (!actor || !userOwnsActor(user, actor)) {
        globalThis.ui?.notifications?.warn?.('You cannot roll for this character.');
        return;
    }
    if (payload.responses[actorId]?.status === 'rolled') {
        globalThis.ui?.notifications?.info?.('This character already answered the request.');
        return;
    }
    void openSkillCheckForRequest(actor, payload, String(msg.id));
}
function injectSkillCheckButton(controlsEl) {
    if (!globalThis.game?.user?.isGM || !controlsEl)
        return;
    const parent = controlsEl.parentElement;
    if (!parent)
        return;
    let row = parent.querySelector(':scope > .ms-chat-rolls-row');
    if (!row) {
        row = document.createElement('div');
        row.className = 'ms-chat-rolls-row';
        const d8 = parent.querySelector(':scope > .ms-chat-roll-row');
        if (d8)
            d8.before(row);
        else
            controlsEl.before(row);
    }
    let button = document.querySelector('.ms-skill-check-launch');
    if (!button) {
        button = document.createElement('button');
        button.type = 'button';
        button.className = 'ms-skill-check-launch';
        button.title = 'Skill Check — GM-defined ordinary Skill / Perception checks';
        button.innerHTML = '<i class="fas fa-search"></i><span>Skill Check</span>';
        button.addEventListener('click', (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            void showSkillCheckRequestDialog();
        });
    }
    if (button.parentElement !== row)
        row.append(button);
    syncChatRollChrome();
}
let socketRegistered = false;
let handlersRegistered = false;
export function registerSkillCheckRequestHandlers() {
    if (handlersRegistered)
        return;
    handlersRegistered = true;
    document.addEventListener('click', onChatClick);
    Hooks.on('renderChatInput', (_app, elements) => {
        injectSkillCheckButton(canonicalChatControls() ?? elements?.['#chat-controls'] ?? elements?.['chat-controls']);
    });
    Hooks.on('renderChatLog', (_app, html) => {
        const root = html instanceof HTMLElement ? html : html?.[0];
        injectSkillCheckButton(canonicalChatControls() ??
            root?.querySelector?.('#chat-controls') ??
            null);
    });
    Hooks.once('ready', () => {
        window.setTimeout(() => injectSkillCheckButton(canonicalChatControls()), 300);
    });
    if (!socketRegistered) {
        socketRegistered = true;
        const bindSocket = () => {
            globalThis.game?.socket?.on?.(SOCKET_NAME, async (data) => {
                if (!data || typeof data !== 'object')
                    return;
                if (data.type === 'skillCheckRequestOpen' && data.payload) {
                    await maybeOpenLocalOverlay(data.payload, String(data.messageId || ''));
                    return;
                }
                if (data.type === 'skillCheckRequestUpdate' && globalThis.game?.user?.isGM) {
                    await updateRequestParticipant(String(data.messageId || ''), String(data.actorId || ''), data.patch || { status: 'rolled' });
                }
            });
        };
        if (globalThis.game?.ready)
            bindSocket();
        else
            Hooks.once('ready', bindSocket);
    }
}
//# sourceMappingURL=skill-check-request.js.map