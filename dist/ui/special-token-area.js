/**
 * Personal diminishing-special token tray, left of the Foundry hotbar.
 * Visualizes `system.statusEffects` — it never stores a second stack value.
 */
import { canCurrentUserUpdateDocument } from '../combat/combat-permissions.js';
import { actorMasteryRank, applyNaturalSpecialRecovery, formatNaturalRecoveryChat, isNaturalRecoveryAvailable, listHudDiminishingSpecials, specialDisplayName, } from '../combat/special-application.js';
import { SPECIAL_TOKEN_STACK_MAX, TOKEN_DRAG_THRESHOLD_PX, autoArrangeTokens, clampTokenToArea, moveTokenInLayout, syncSpecialTokenViews, } from './special-token-layout.js';
const FLAG_SCOPE = 'mastery-system';
const LAYOUT_SETTING = 'specialTokenLayout';
const ROOT_ID = 'mastery-special-token-area';
const boundHooks = [];
let resizeHandler = null;
let refreshTimer = 0;
let pointerSession = null;
function loc(key, fallback) {
    const raw = globalThis.game?.i18n?.localize?.(`MASTERY.specials.${key}`);
    return raw && raw !== `MASTERY.specials.${key}` ? raw : fallback;
}
function locFormat(key, data, fallback) {
    const formatted = globalThis.game?.i18n?.format?.(`MASTERY.specials.${key}`, data);
    if (formatted && formatted !== `MASTERY.specials.${key}`)
        return formatted;
    return fallback;
}
export function registerSpecialTokenAreaSettings() {
    const g = globalThis;
    if (!g.game?.settings?.register)
        return;
    try {
        g.game.settings.register(FLAG_SCOPE, LAYOUT_SETTING, {
            name: 'Special token layout',
            hint: 'Personal diminishing-special token positions (client).',
            scope: 'client',
            config: false,
            type: Object,
            default: {},
        });
    }
    catch (err) {
        console.warn('Mastery System | specialTokenLayout setting register failed', err);
    }
}
function readAllLayouts() {
    const g = globalThis;
    try {
        const raw = g.game?.settings?.get?.(FLAG_SCOPE, LAYOUT_SETTING);
        if (raw && typeof raw === 'object')
            return { ...raw };
    }
    catch {
        /* ignore */
    }
    return {};
}
function readActorLayout(actorUuid) {
    const all = readAllLayouts();
    const row = all[actorUuid];
    return row && typeof row === 'object' ? { ...row } : {};
}
async function writeActorLayout(actorUuid, layout) {
    const g = globalThis;
    if (!g.game?.settings?.set)
        return;
    const all = readAllLayouts();
    all[actorUuid] = layout;
    try {
        await g.game.settings.set(FLAG_SCOPE, LAYOUT_SETTING, all);
    }
    catch (err) {
        console.debug?.('Mastery System | special token layout save skipped', err);
    }
}
function liveCombat() {
    const g = globalThis.game;
    return g?.combat ?? g?.combats?.active ?? null;
}
function collectionList(raw) {
    if (!raw)
        return [];
    if (Array.isArray(raw))
        return raw;
    if (Array.isArray(raw.contents))
        return raw.contents;
    if (typeof raw.values === 'function')
        return Array.from(raw.values());
    return [];
}
export function combatIsActive(combat) {
    if (!combat)
        return false;
    if (combat.started === false)
        return false;
    if (combat.started === true)
        return true;
    return Number(combat.round) > 0 || combat.combatant != null || collectionList(combat.combatants).length > 0;
}
export function sameHudActor(a, b) {
    if (!a || !b)
        return false;
    if (a === b)
        return true;
    const aId = String(a.id ?? a._id ?? '');
    const bId = String(b.id ?? b._id ?? '');
    if (aId && bId && aId === bId)
        return true;
    const aUuid = String(a.uuid ?? '');
    const bUuid = String(b.uuid ?? '');
    return !!aUuid && !!bUuid && aUuid === bUuid;
}
export function resolveCombatantActor(combatant, actors) {
    if (!combatant)
        return null;
    if (combatant.actor)
        return combatant.actor;
    if (combatant.token?.actor)
        return combatant.token.actor;
    const id = String(combatant.actorId ?? '');
    if (id && actors?.get)
        return actors.get(id) ?? null;
    return null;
}
export function actorInCombat(actor, combat, actors) {
    if (!actor || !combat)
        return false;
    const actorId = String(actor.id ?? actor._id ?? '');
    return collectionList(combat.combatants).some((c) => {
        if (actorId && String(c?.actorId ?? '') === actorId)
            return true;
        return sameHudActor(resolveCombatantActor(c, actors), actor);
    });
}
function ownedByUser(actor, user) {
    if (!actor || !user)
        return false;
    if (user.isGM)
        return true;
    if (actor.isOwner === true)
        return true;
    if (typeof actor.testUserPermission === 'function') {
        try {
            return !!actor.testUserPermission(user, 'OWNER');
        }
        catch {
            return false;
        }
    }
    return false;
}
function pickPreferredActor(candidates) {
    const live = candidates.filter(Boolean);
    if (!live.length)
        return null;
    return live.find((a) => listHudDiminishingSpecials(a).length > 0) ?? live[0] ?? null;
}
export function resolveSpecialTokenHudActor() {
    const g = globalThis;
    const combat = liveCombat();
    if (!combatIsActive(combat))
        return null;
    const user = g.game?.user;
    if (!user)
        return null;
    const actors = g.game?.actors;
    const controlled = collectionList(g.canvas?.tokens?.controlled)
        .map((t) => t?.actor)
        .filter((a) => a && ownedByUser(a, user) && actorInCombat(a, combat, actors));
    const assigned = user.character;
    const assignedOk = assigned && actorInCombat(assigned, combat, actors) ? assigned : null;
    const ownedCombatants = collectionList(combat.combatants)
        .map((c) => resolveCombatantActor(c, actors))
        .filter((a) => a && ownedByUser(a, user));
    const current = resolveCombatantActor(combat.combatant, actors);
    const currentOk = current && (user.isGM || ownedByUser(current, user)) ? current : null;
    return pickPreferredActor([...controlled, assignedOk, currentOk, ...ownedCombatants]);
}
function unbindHooks() {
    const HooksRef = globalThis.Hooks;
    for (const { name, fn } of boundHooks) {
        try {
            HooksRef?.off?.(name, fn);
        }
        catch {
            /* ignore */
        }
    }
    boundHooks.length = 0;
    if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler);
        resizeHandler = null;
    }
}
function bindHook(name, fn) {
    const HooksRef = globalThis.Hooks;
    HooksRef?.on?.(name, fn);
    boundHooks.push({ name, fn });
}
function scheduleRefresh() {
    if (refreshTimer)
        window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(() => {
        refreshTimer = 0;
        void refreshSpecialTokenArea();
    }, 30);
}
function rootEl() {
    return document.getElementById(ROOT_ID);
}
function removeRoot() {
    rootEl()?.remove();
    pointerSession = null;
}
function placeRoot(el) {
    const hotbar = document.getElementById('hotbar');
    const hb = hotbar?.getBoundingClientRect();
    const w = el.offsetWidth || 200;
    if (!hb) {
        el.style.left = '12px';
        el.style.bottom = '12px';
        return;
    }
    let left = hb.left - w - 10;
    let bottom = Math.max(8, window.innerHeight - hb.bottom);
    if (left < 8) {
        left = Math.max(8, hb.left);
        bottom = Math.max(8, window.innerHeight - hb.top + 8);
    }
    el.style.left = `${Math.round(left)}px`;
    el.style.bottom = `${Math.round(bottom)}px`;
}
function tokenStyle(view) {
    return `left:${(view.x * 100).toFixed(2)}%;top:${(view.y * 100).toFixed(2)}%;z-index:${view.z};`;
}
function renderArea(actor) {
    const combat = liveCombat();
    const specials = listHudDiminishingSpecials(actor);
    if (!specials.length) {
        removeRoot();
        return;
    }
    const uuid = String(actor.uuid || actor.id || '');
    const synced = syncSpecialTokenViews(specials, readActorLayout(uuid), SPECIAL_TOKEN_STACK_MAX);
    const recoveryOn = isNaturalRecoveryAvailable(actor, combat);
    const rank = actorMasteryRank(actor);
    const canRecover = recoveryOn && canCurrentUserUpdateDocument(actor);
    let el = rootEl();
    if (!el) {
        el = document.createElement('div');
        el.id = ROOT_ID;
        el.className = 'mastery-special-token-area';
        document.body.appendChild(el);
    }
    const hint = canRecover
        ? locFormat('naturalRecoveryHud', { rank }, `Natural Special Recovery: Choose one Special — MR ${rank}`)
        : '';
    el.dataset.actorUuid = uuid;
    el.classList.toggle('is-recovery', canRecover);
    el.innerHTML = `
    <div class="sta-toolbar">
      ${hint ? `<p class="sta-hint">${hint}</p>` : '<span class="sta-hint-spacer"></span>'}
      <button type="button" class="sta-auto" data-action="auto-arrange" title="${loc('autoArrange', 'Auto Arrange')}" aria-label="${loc('autoArrange', 'Auto Arrange')}">
        <i class="fas fa-layer-group"></i>
      </button>
    </div>
    <div class="sta-board" data-board="1">
      ${synced.tokens
        .map((t) => `
        <button type="button" class="sta-token${canRecover ? ' is-eligible' : ''}" style="${tokenStyle(t)}"
          data-token-id="${t.id}" data-special-id="${t.specialId}" data-index="${t.index}"
          title="${t.label}" aria-label="${t.label}" draggable="false">
          <img src="${t.asset}" alt="${t.label}" draggable="false">
        </button>`)
        .join('')}
    </div>
    <div class="sta-confirm" hidden></div>
  `;
    bindAreaEvents(el, actor, synced.layout);
    placeRoot(el);
}
function bindAreaEvents(el, actor, layout) {
    el.querySelector('[data-action="auto-arrange"]')?.addEventListener('click', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        void onAutoArrange(actor);
    });
    const board = el.querySelector('[data-board]');
    if (!board)
        return;
    Array.from(el.querySelectorAll('.sta-token')).forEach((token) => {
        token.addEventListener('pointerdown', (ev) => onTokenPointerDown(ev, actor, layout, board));
    });
}
async function onAutoArrange(actor) {
    const uuid = String(actor.uuid || actor.id || '');
    const specials = listHudDiminishingSpecials(actor);
    const layout = autoArrangeTokens(specials, SPECIAL_TOKEN_STACK_MAX);
    await writeActorLayout(uuid, layout);
    renderArea(actor);
}
function onTokenPointerDown(ev, actor, layout, board) {
    if (ev.button !== 0)
        return;
    const token = ev.currentTarget;
    const tokenId = token.dataset.tokenId || '';
    const specialId = token.dataset.specialId || '';
    if (!tokenId || !specialId)
        return;
    ev.preventDefault();
    token.setPointerCapture(ev.pointerId);
    const rect = token.getBoundingClientRect();
    pointerSession = {
        pointerId: ev.pointerId,
        tokenId,
        specialId,
        startX: ev.clientX,
        startY: ev.clientY,
        originLeft: rect.left - board.getBoundingClientRect().left,
        originTop: rect.top - board.getBoundingClientRect().top,
        dragging: false,
    };
    const move = (e) => onTokenPointerMove(e, token, board);
    const up = (e) => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        window.removeEventListener('pointercancel', up);
        void onTokenPointerUp(e, actor, layout, token, board);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
}
function onTokenPointerMove(ev, token, board) {
    const session = pointerSession;
    if (!session || ev.pointerId !== session.pointerId)
        return;
    const dx = ev.clientX - session.startX;
    const dy = ev.clientY - session.startY;
    if (!session.dragging && Math.hypot(dx, dy) < TOKEN_DRAG_THRESHOLD_PX)
        return;
    session.dragging = true;
    token.classList.add('is-dragging');
    const boardRect = board.getBoundingClientRect();
    const rel = clampTokenToArea(session.originLeft + dx, session.originTop + dy, boardRect.width, boardRect.height);
    token.style.left = `${(rel.x * 100).toFixed(2)}%`;
    token.style.top = `${(rel.y * 100).toFixed(2)}%`;
}
async function onTokenPointerUp(ev, actor, layout, token, board) {
    const session = pointerSession;
    pointerSession = null;
    if (!session || ev.pointerId !== session.pointerId)
        return;
    try {
        token.releasePointerCapture(session.pointerId);
    }
    catch {
        /* ignore */
    }
    token.classList.remove('is-dragging');
    if (session.dragging) {
        const boardRect = board.getBoundingClientRect();
        const dx = ev.clientX - session.startX;
        const dy = ev.clientY - session.startY;
        const rel = clampTokenToArea(session.originLeft + dx, session.originTop + dy, boardRect.width, boardRect.height);
        const next = moveTokenInLayout(layout, session.tokenId, rel.x, rel.y);
        token.style.zIndex = String(next[session.tokenId]?.z ?? 1);
        const uuid = String(actor.uuid || actor.id || '');
        await writeActorLayout(uuid, next);
        return;
    }
    const combat = liveCombat();
    if (!isNaturalRecoveryAvailable(actor, combat) || !canCurrentUserUpdateDocument(actor))
        return;
    showRecoveryConfirm(actor, session.specialId);
}
function showRecoveryConfirm(actor, specialId) {
    const el = rootEl();
    const host = el?.querySelector('.sta-confirm');
    if (!el || !host)
        return;
    const rank = actorMasteryRank(actor);
    const name = specialDisplayName(specialId);
    const prompt = locFormat('naturalRecoveryConfirm', { name, rank }, `Reduce ${name} by ${rank}?`);
    host.hidden = false;
    host.innerHTML = `
    <span>${prompt}</span>
    <button type="button" data-confirm="yes">${loc('naturalRecoveryYes', 'Yes')}</button>
    <button type="button" data-confirm="no">${loc('naturalRecoveryNo', 'No')}</button>
  `;
    host.querySelector('[data-confirm="yes"]')?.addEventListener('click', (ev) => {
        ev.preventDefault();
        host.hidden = true;
        void confirmRecovery(actor, specialId);
    });
    host.querySelector('[data-confirm="no"]')?.addEventListener('click', (ev) => {
        ev.preventDefault();
        host.hidden = true;
    });
}
async function confirmRecovery(actor, specialId) {
    const combat = liveCombat();
    const result = await applyNaturalSpecialRecovery(actor, specialId, combat);
    if (!result.ok)
        return;
    const msg = formatNaturalRecoveryChat(result);
    if (msg) {
        try {
            await globalThis.ChatMessage?.create?.({
                speaker: globalThis.ChatMessage?.getSpeaker?.({ actor }) ?? {},
                content: `<div class="mastery-status-tick">${msg}</div>`,
            });
        }
        catch (err) {
            console.debug?.('Mastery System | natural recovery chat skipped', err);
        }
        globalThis.ui?.notifications?.info?.(msg);
    }
    renderArea(actor);
}
export async function refreshSpecialTokenArea() {
    const actor = resolveSpecialTokenHudActor();
    if (!actor || !listHudDiminishingSpecials(actor).length) {
        removeRoot();
        return;
    }
    renderArea(actor);
}
export function initializeSpecialTokenArea() {
    unbindHooks();
    removeRoot();
    const refresh = () => scheduleRefresh();
    bindHook('ready', () => {
        refresh();
        window.setTimeout(refresh, 250);
        window.setTimeout(refresh, 1000);
    });
    bindHook('combatStart', refresh);
    bindHook('createCombat', refresh);
    bindHook('updateCombat', refresh);
    bindHook('updateCombatant', refresh);
    bindHook('combatEnd', () => {
        removeRoot();
    });
    bindHook('deleteCombat', () => {
        removeRoot();
    });
    bindHook('updateActor', (doc, changes) => {
        if (changes?.system?.statusEffects !== undefined ||
            changes?.['system.statusEffects'] !== undefined ||
            changes?.system !== undefined) {
            refresh();
            return;
        }
        const actor = resolveSpecialTokenHudActor();
        if (actor && sameHudActor(doc, actor))
            refresh();
    });
    bindHook('updateUser', refresh);
    bindHook('controlToken', refresh);
    bindHook('canvasReady', refresh);
    bindHook('renderHotbar', () => {
        const el = rootEl();
        if (el)
            placeRoot(el);
        else
            refresh();
    });
    resizeHandler = () => {
        const el = rootEl();
        if (el)
            placeRoot(el);
    };
    window.addEventListener('resize', resizeHandler);
    if (globalThis.game?.ready)
        refresh();
}
//# sourceMappingURL=special-token-area.js.map