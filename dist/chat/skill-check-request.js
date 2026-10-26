/**
 * GM ordinary Skill Check request (DF 2026-10-24 GM-defined correction).
 * GM configures Task, Attribute, per-actor Skill, Base TN and targets.
 * Players only choose Paid Raises in the shared overlay.
 */
import { readSpecializations, } from '../rules/index.js';
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
    const attributeKey = payload.perActorAttribute?.[actorId] || payload.attributeKey || 'wits';
    const mode = payload.mode === 'comparative' ? 'comparative' : 'standard';
    const baseTn = mode === 'comparative'
        ? 0
        : payload.perActorBaseTn?.[actorId] != null
            ? Math.max(0, Math.floor(Number(payload.perActorBaseTn[actorId]) || 0))
            : payload.baseTn;
    return {
        skill,
        attributeKey,
        baseTn,
        taskDescription: payload.taskDescription,
        mode,
        ...(payload.allowedSkills?.length ? { allowedSkills: payload.allowedSkills } : {}),
    };
}
/**
 * Competing standalone "GM · Request Skill Check" dialog is retired.
 * All Skill Check configuration goes through the unified Rolls application.
 */
export async function showSkillCheckRequestDialog() {
    const { showEpicMasteryRollConfigDialog } = await import('../epic-roll/epic-mastery-roll-config-dialog.js');
    showEpicMasteryRollConfigDialog();
}
export async function createSkillCheckRequest(input) {
    const requestId = newRequestId();
    const responses = {};
    for (const id of input.targetActorIds) {
        responses[id] = { status: 'pending' };
    }
    const mode = input.mode === 'comparative' ? 'comparative' : 'standard';
    const payload = {
        schema: REQUEST_SCHEMA,
        requestId,
        taskDescription: input.taskDescription,
        note: input.note,
        baseTn: Math.max(0, Math.floor(Number(input.baseTn) || 0)),
        attributeKey: input.attributeKey,
        defaultSkill: input.defaultSkill,
        perActorSkill: { ...input.perActorSkill },
        ...(input.perActorAttribute ? { perActorAttribute: { ...input.perActorAttribute } } : {}),
        ...(input.perActorBaseTn ? { perActorBaseTn: { ...input.perActorBaseTn } } : {}),
        ...(input.allowedSkills?.length ? { allowedSkills: input.allowedSkills } : {}),
        mode,
        showTn: mode === 'comparative' ? false : input.showTn !== false,
        ...(input.allowPlayerSuggestions ? { allowPlayerSuggestions: true } : {}),
        ...(input.comparative ? { comparative: input.comparative } : {}),
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
    const isComparative = payload.mode === 'comparative';
    const participants = payload.targetActorIds
        .map((id) => {
        const actor = globalThis.game?.actors?.get?.(id);
        const name = actor?.name ?? id;
        const assigned = assignmentForActor(payload, id);
        const skillTxt = actor ? skillRefLabel(actor, assigned.skill) : assigned.skill.kind;
        const r = payload.responses[id];
        let status = 'pending';
        let detail = `${skillTxt} · ${cap(assigned.attributeKey)} · awaiting`;
        if (!isComparative) {
            detail = `${skillTxt} · ${cap(assigned.attributeKey)} · TN ${assigned.baseTn} · awaiting`;
        }
        if (r?.status === 'rolled') {
            status = isComparative ? 'ok' : r.success ? 'ok' : 'fail';
            detail = isComparative
                ? `${skillTxt} · roll ${r.rollTotal ?? '—'}`
                : `${skillTxt} · Paid ${r.paidRaises ?? 0} · Final TN ${r.finalTn ?? '—'} · roll ${r.rollTotal ?? '—'}`;
        }
        return `<div class="ms-scr-participant" data-actor-id="${escapeHtml(id)}">
        <span>${escapeHtml(name)}</span>
        <span class="ms-scr-status ms-scr-status-${status}">${escapeHtml(detail)}</span>
        <button type="button" class="ms-scr-open" data-actor-id="${escapeHtml(id)}" data-request-id="${escapeHtml(payload.requestId)}">Open roll</button>
      </div>`;
    })
        .join('');
    const meta = isComparative
        ? `${escapeHtml(payload.taskDescription)} · <strong>Comparative</strong> (no Task TN)`
        : `${escapeHtml(payload.taskDescription)} · per-character Skills / Attributes / TNs`;
    return `
    <div class="ms-skill-check-request" data-request-id="${escapeHtml(payload.requestId)}" data-mode="${escapeHtml(payload.mode || 'standard')}">
      <div class="ms-scr-head">
        <strong>${masteryLocalize('MASTERY.df2026.skillRequest.cardTitle', isComparative ? 'GM requests Comparative Skill Check' : 'GM requests Skill Check')}</strong>
        <span class="ms-scr-badge">OPEN</span>
      </div>
      <div class="ms-scr-meta">${meta}</div>
      ${payload.note ? `<div class="ms-scr-note">${escapeHtml(payload.note)}</div>` : ''}
      <div class="ms-scr-list">${participants}</div>
      <p class="ms-scr-hint">${isComparative
        ? 'Compare totals directly. No Paid Raises. Closing the overlay does not cancel — reopen here.'
        : 'Players choose only Paid Raises. Closing the overlay does not cancel — reopen here.'}</p>
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
        mode: assigned.mode,
        ...(assigned.allowedSkills?.length ? { allowedSkills: assigned.allowedSkills } : {}),
    };
    const choice = await promptSkillCheckRollDialog({
        actor,
        source,
        lockGmFields: true,
        allowedSkills: assigned.allowedSkills,
        comparative: assigned.mode === 'comparative',
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
    if (assigned.mode === 'comparative') {
        choice.draft.paidRaises = 0;
    }
    const result = await executeSkillCheck({
        actor,
        draft: choice.draft,
        gmAssignment: assigned,
        comparative: assigned.mode === 'comparative',
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
    if (payload.mode === 'comparative' &&
        globalThis.game?.user?.isGM &&
        payload.targetActorIds.every((id) => payload.responses[id]?.status === 'rolled')) {
        await resolveComparativeOppositionCard(payload);
    }
}
async function resolveComparativeOppositionCard(payload) {
    const meta = payload.comparative;
    if (!meta)
        return;
    try {
        const { resolveComparativeSkillCheck, skillAdvantageRerollMax } = await import('../rules/index.js');
        const { masteryRoll } = await import('../dice/roll-handler.js');
        let oppTotal = 0;
        let oppLabel = 'Opposition';
        if (meta.source === 'npc' && meta.npcActorId) {
            const npc = globalThis.game?.actors?.get?.(meta.npcActorId);
            const { readSituationalSkills, findSituationalSkillByName, findSituationalSkillById } = await import('../rules/index.js');
            const skills = readSituationalSkills(npc?.system);
            const byId = findSituationalSkillById(skills, meta.npcSkillKey || '');
            const byName = byId ||
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
            });
            oppTotal = Math.floor(Number(result?.total) || 0);
            oppLabel = `${npc?.name ?? 'NPC'} (${byName?.name ?? 'Skill'} ${pool}k${keep})`;
        }
        else if (meta.virtual) {
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
            });
            oppTotal = Math.floor(Number(result?.total) || 0);
            oppLabel = `${v.name} (${v.skillName} ${pool}k${keep})`;
        }
        const lines = payload.targetActorIds
            .map((id) => {
            const actor = globalThis.game?.actors?.get?.(id);
            const total = Math.floor(Number(payload.responses[id]?.rollTotal) || 0);
            const outcome = resolveComparativeSkillCheck({
                challengerTotal: total,
                defenderTotal: oppTotal,
            });
            return `<li><strong>${escapeHtml(actor?.name ?? id)}</strong>: ${total} vs ${oppTotal} → ${outcome.challengerWins ? 'wins' : outcome.tieFavorsDefender ? 'tie (defender)' : 'loses'}</li>`;
        })
            .join('');
        await ChatMessage.create({
            user: globalThis.game?.user?.id,
            speaker: ChatMessage.getSpeaker({ alias: 'Comparative Skill Check' }),
            content: `<div class="ms-comparative-result">
        <strong>Comparative resolution</strong>
        <div>${escapeHtml(payload.taskDescription)}</div>
        <div>Opposition: <strong>${escapeHtml(oppLabel)}</strong> = ${oppTotal}</div>
        <ul>${lines}</ul>
      </div>`,
        });
    }
    catch (err) {
        console.error('Mastery System | Comparative opposition resolve failed', err);
    }
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
    // Retire the competing Skill Check chat button — Rolls is the sole GM entry.
    parent.querySelectorAll('.ms-skill-check-launch').forEach((el) => el.remove());
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