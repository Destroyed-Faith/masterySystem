/**
 * Personal diminishing-special token tray, left of the Foundry hotbar.
 * Visualizes `system.statusEffects` — it never stores a second stack value.
 */

import { canCurrentUserUpdateDocument } from '../combat/combat-permissions.js';
import {
  actorMasteryRank,
  applyNaturalSpecialRecovery,
  formatNaturalRecoveryChat,
  isNaturalRecoveryAvailable,
  listHudDiminishingSpecials,
  specialDisplayName,
} from '../combat/special-application.js';
import {
  SPECIAL_TOKEN_STACK_MAX,
  TOKEN_DRAG_THRESHOLD_PX,
  autoArrangeTokens,
  clampTokenToArea,
  moveTokenInLayout,
  syncSpecialTokenViews,
  type SpecialTokenLayoutMap,
  type SpecialTokenView,
} from './special-token-layout.js';

const FLAG_SCOPE = 'mastery-system';
const LAYOUT_SETTING = 'specialTokenLayout';
const ROOT_ID = 'mastery-special-token-area';

type HookEntry = { name: string; fn: (...args: any[]) => void };

const boundHooks: HookEntry[] = [];
let resizeHandler: (() => void) | null = null;
let refreshTimer = 0;
let pointerSession: PointerSession | null = null;

interface PointerSession {
  pointerId: number;
  tokenId: string;
  specialId: string;
  startX: number;
  startY: number;
  originLeft: number;
  originTop: number;
  dragging: boolean;
}

function loc(key: string, fallback: string): string {
  const raw = (globalThis as any).game?.i18n?.localize?.(`MASTERY.specials.${key}`);
  return raw && raw !== `MASTERY.specials.${key}` ? raw : fallback;
}

function locFormat(key: string, data: Record<string, unknown>, fallback: string): string {
  const formatted = (globalThis as any).game?.i18n?.format?.(`MASTERY.specials.${key}`, data);
  if (formatted && formatted !== `MASTERY.specials.${key}`) return formatted;
  return fallback;
}

export function registerSpecialTokenAreaSettings(): void {
  const g = globalThis as any;
  if (!g.game?.settings?.register) return;
  try {
    g.game.settings.register(FLAG_SCOPE, LAYOUT_SETTING, {
      name: 'Special token layout',
      hint: 'Personal diminishing-special token positions (client).',
      scope: 'client',
      config: false,
      type: Object,
      default: {},
    });
  } catch (err) {
    console.warn('Mastery System | specialTokenLayout setting register failed', err);
  }
}

function readAllLayouts(): Record<string, SpecialTokenLayoutMap> {
  const g = globalThis as any;
  try {
    const raw = g.game?.settings?.get?.(FLAG_SCOPE, LAYOUT_SETTING);
    if (raw && typeof raw === 'object') return { ...(raw as Record<string, SpecialTokenLayoutMap>) };
  } catch {
    /* ignore */
  }
  return {};
}

function readActorLayout(actorUuid: string): SpecialTokenLayoutMap {
  const all = readAllLayouts();
  const row = all[actorUuid];
  return row && typeof row === 'object' ? { ...row } : {};
}

async function writeActorLayout(actorUuid: string, layout: SpecialTokenLayoutMap): Promise<void> {
  const g = globalThis as any;
  if (!g.game?.settings?.set) return;
  const all = readAllLayouts();
  all[actorUuid] = layout;
  try {
    await g.game.settings.set(FLAG_SCOPE, LAYOUT_SETTING, all);
  } catch (err) {
    console.debug?.('Mastery System | special token layout save skipped', err);
  }
}

function liveCombat(): any {
  return (globalThis as any).game?.combat ?? null;
}

function combatIsActive(combat: any): boolean {
  if (!combat) return false;
  if (combat.started === false) return false;
  if (combat.started === true) return true;
  return Number(combat.round) > 0 || combat.combatant != null;
}

function actorInCombat(actor: any, combat: any): boolean {
  if (!actor || !combat) return false;
  const combatants = combat.combatants;
  const list = Array.isArray(combatants)
    ? combatants
    : combatants?.contents ?? (typeof combatants?.values === 'function' ? Array.from(combatants.values()) : []);
  return list.some((c: any) => {
    const a = c?.actor;
    if (!a) return false;
    return a === actor || a.id === actor.id || a.uuid === actor.uuid;
  });
}

export function resolveSpecialTokenHudActor(): any | null {
  const g = globalThis as any;
  const combat = liveCombat();
  if (!combatIsActive(combat)) return null;
  const user = g.game?.user;
  if (!user) return null;

  if (user.isGM) {
    const controlled = g.canvas?.tokens?.controlled?.[0]?.actor;
    if (controlled && actorInCombat(controlled, combat)) return controlled;
    return combat.combatant?.actor ?? null;
  }

  const assigned = user.character;
  if (assigned && actorInCombat(assigned, combat)) return assigned;

  const combatants = combat.combatants;
  const list = Array.isArray(combatants)
    ? combatants
    : combatants?.contents ?? (typeof combatants?.values === 'function' ? Array.from(combatants.values()) : []);
  for (const c of list) {
    const a = c?.actor;
    if (a && a.isOwner && actorInCombat(a, combat)) return a;
  }
  return null;
}

function unbindHooks(): void {
  const HooksRef = (globalThis as any).Hooks;
  for (const { name, fn } of boundHooks) {
    try {
      HooksRef?.off?.(name, fn);
    } catch {
      /* ignore */
    }
  }
  boundHooks.length = 0;
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler);
    resizeHandler = null;
  }
}

function bindHook(name: string, fn: (...args: any[]) => void): void {
  const HooksRef = (globalThis as any).Hooks;
  HooksRef?.on?.(name, fn);
  boundHooks.push({ name, fn });
}

function scheduleRefresh(): void {
  if (refreshTimer) window.clearTimeout(refreshTimer);
  refreshTimer = window.setTimeout(() => {
    refreshTimer = 0;
    void refreshSpecialTokenArea();
  }, 30);
}

function rootEl(): HTMLElement | null {
  return document.getElementById(ROOT_ID);
}

function removeRoot(): void {
  rootEl()?.remove();
  pointerSession = null;
}

function placeRoot(el: HTMLElement): void {
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

function tokenStyle(view: SpecialTokenView): string {
  return `left:${(view.x * 100).toFixed(2)}%;top:${(view.y * 100).toFixed(2)}%;z-index:${view.z};`;
}

function renderArea(actor: any): void {
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
    ? locFormat(
        'naturalRecoveryHud',
        { rank },
        `Natural Special Recovery: Choose one Special — MR ${rank}`,
      )
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
        .map(
          (t) => `
        <button type="button" class="sta-token${canRecover ? ' is-eligible' : ''}" style="${tokenStyle(t)}"
          data-token-id="${t.id}" data-special-id="${t.specialId}" data-index="${t.index}"
          title="${t.label}" aria-label="${t.label}" draggable="false">
          <img src="${t.asset}" alt="${t.label}" draggable="false">
        </button>`,
        )
        .join('')}
    </div>
    <div class="sta-confirm" hidden></div>
  `;

  bindAreaEvents(el, actor, synced.layout);
  placeRoot(el);
}

function bindAreaEvents(el: HTMLElement, actor: any, layout: SpecialTokenLayoutMap): void {
  el.querySelector('[data-action="auto-arrange"]')?.addEventListener('click', (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    void onAutoArrange(actor);
  });

  const board = el.querySelector<HTMLElement>('[data-board]');
  if (!board) return;

  Array.from(el.querySelectorAll<HTMLElement>('.sta-token')).forEach((token) => {
    token.addEventListener('pointerdown', (ev: PointerEvent) => onTokenPointerDown(ev, actor, layout, board));
  });
}

async function onAutoArrange(actor: any): Promise<void> {
  const uuid = String(actor.uuid || actor.id || '');
  const specials = listHudDiminishingSpecials(actor);
  const layout = autoArrangeTokens(specials, SPECIAL_TOKEN_STACK_MAX);
  await writeActorLayout(uuid, layout);
  renderArea(actor);
}

function onTokenPointerDown(
  ev: PointerEvent,
  actor: any,
  layout: SpecialTokenLayoutMap,
  board: HTMLElement,
): void {
  if (ev.button !== 0) return;
  const token = ev.currentTarget as HTMLElement;
  const tokenId = token.dataset.tokenId || '';
  const specialId = token.dataset.specialId || '';
  if (!tokenId || !specialId) return;
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

  const move = (e: PointerEvent) => onTokenPointerMove(e, token, board);
  const up = (e: PointerEvent) => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', up);
    void onTokenPointerUp(e, actor, layout, token, board);
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);
}

function onTokenPointerMove(ev: PointerEvent, token: HTMLElement, board: HTMLElement): void {
  const session = pointerSession;
  if (!session || ev.pointerId !== session.pointerId) return;
  const dx = ev.clientX - session.startX;
  const dy = ev.clientY - session.startY;
  if (!session.dragging && Math.hypot(dx, dy) < TOKEN_DRAG_THRESHOLD_PX) return;
  session.dragging = true;
  token.classList.add('is-dragging');
  const boardRect = board.getBoundingClientRect();
  const rel = clampTokenToArea(session.originLeft + dx, session.originTop + dy, boardRect.width, boardRect.height);
  token.style.left = `${(rel.x * 100).toFixed(2)}%`;
  token.style.top = `${(rel.y * 100).toFixed(2)}%`;
}

async function onTokenPointerUp(
  ev: PointerEvent,
  actor: any,
  layout: SpecialTokenLayoutMap,
  token: HTMLElement,
  board: HTMLElement,
): Promise<void> {
  const session = pointerSession;
  pointerSession = null;
  if (!session || ev.pointerId !== session.pointerId) return;
  try {
    token.releasePointerCapture(session.pointerId);
  } catch {
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
  if (!isNaturalRecoveryAvailable(actor, combat) || !canCurrentUserUpdateDocument(actor)) return;
  showRecoveryConfirm(actor, session.specialId);
}

function showRecoveryConfirm(actor: any, specialId: string): void {
  const el = rootEl();
  const host = el?.querySelector<HTMLElement>('.sta-confirm');
  if (!el || !host) return;
  const rank = actorMasteryRank(actor);
  const name = specialDisplayName(specialId);
  const prompt = locFormat(
    'naturalRecoveryConfirm',
    { name, rank },
    `Reduce ${name} by ${rank}?`,
  );
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

async function confirmRecovery(actor: any, specialId: string): Promise<void> {
  const combat = liveCombat();
  const result = await applyNaturalSpecialRecovery(actor, specialId, combat);
  if (!result.ok) return;
  const msg = formatNaturalRecoveryChat(result);
  if (msg) {
    try {
      await (globalThis as any).ChatMessage?.create?.({
        speaker: (globalThis as any).ChatMessage?.getSpeaker?.({ actor }) ?? {},
        content: `<div class="mastery-status-tick">${msg}</div>`,
      });
    } catch (err) {
      console.debug?.('Mastery System | natural recovery chat skipped', err);
    }
    (globalThis as any).ui?.notifications?.info?.(msg);
  }
  renderArea(actor);
}

export async function refreshSpecialTokenArea(): Promise<void> {
  const actor = resolveSpecialTokenHudActor();
  if (!actor || !listHudDiminishingSpecials(actor).length) {
    removeRoot();
    return;
  }
  renderArea(actor);
}

export function initializeSpecialTokenArea(): void {
  unbindHooks();
  removeRoot();

  const refresh = () => scheduleRefresh();
  bindHook('ready', refresh);
  bindHook('combatStart', refresh);
  bindHook('updateCombat', refresh);
  bindHook('combatEnd', () => {
    removeRoot();
  });
  bindHook('deleteCombat', () => {
    removeRoot();
  });
  bindHook('updateActor', (doc: any, changes: any) => {
    if (changes?.system?.statusEffects !== undefined || changes?.['system.statusEffects'] !== undefined) {
      refresh();
      return;
    }
    const actor = resolveSpecialTokenHudActor();
    if (actor && (doc === actor || doc?.id === actor.id || doc?.uuid === actor.uuid)) refresh();
  });
  bindHook('controlToken', refresh);
  bindHook('canvasReady', refresh);

  resizeHandler = () => {
    const el = rootEl();
    if (el) placeRoot(el);
  };
  window.addEventListener('resize', resizeHandler);
}
