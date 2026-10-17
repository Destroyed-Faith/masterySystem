/**
 * Floating Healing panel: prepared Resolve Healing for this Round, and the
 * Passive: Restoration daily Scarred-Bar pool. Replaces the "Use Healing now"
 * chat card.
 */

import { isIncapacitated } from '../combat/death-check.js';
import {
  activatePassiveRegeneration,
  getRegenerationState,
  syncRegenerationDayBoundary,
} from '../combat/passive-regeneration.js';
import {
  buildHealingBarModel,
  clampHealingBarPosition,
  readHealingBarCollapsed,
  readHealingBarHidden,
  readHealingBarPosition,
  resolveHealingBarActor,
  setHealingBarCollapsed,
  setHealingBarHidden,
  setHealingBarPosition,
  type HealingBarModel,
} from '../system/healing-bar.js';
import { countScarredHealthBars } from '../stones/remove-scar.js';
import {
  describePendingHealing,
  isResolveHealingPendingLive,
  pendingHealingRound,
  type ResolveHealingPending,
} from '../stones/resolve-healing-pending.js';
import { healingRankProfile } from '../stones/stone-resolution.js';
import {
  readActorResolveHealingPending,
  usePendingResolveHealing,
} from '../stones/stone-resolution-ui.js';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const BaseBar = HandlebarsApplicationMixin(ApplicationV2) as typeof ApplicationV2;

const APP_ID = 'mastery-healing-bar';

function loc(key: string, fallback: string): string {
  const raw = (globalThis as any).game?.i18n?.localize?.(key);
  return raw && raw !== key ? raw : fallback;
}

function selectedCharacterActor(): any | null {
  const g = globalThis as any;
  const controlled = g.canvas?.tokens?.controlled ?? [];
  for (const token of controlled) {
    const actor = token?.actor;
    if (actor && String(actor.type || '') === 'character') return actor;
  }
  const layerToken = g.canvas?.tokens?.get?.(g.canvas?.tokens?.controlled?.[0]?.id);
  return layerToken?.actor && String(layerToken.actor.type || '') === 'character' ? layerToken.actor : null;
}

function combatRef(): { id: string; round: number } | null {
  const combat = (globalThis as any).game?.combat;
  if (!combat?.id) return null;
  return { id: String(combat.id), round: Number(combat.round) || 0 };
}

function combatantForActor(actor: any): any {
  const combat = (globalThis as any).game?.combat;
  const bag = combat?.combatants;
  const rows: any[] = [];
  if (bag) {
    if (typeof bag[Symbol.iterator] === 'function') rows.push(...bag);
    else if (Array.isArray(bag.contents)) rows.push(...bag.contents);
  }
  const id = String(actor?.id || '');
  return (
    rows.find((row) => String(row?.actor?.id || row?.actorId || '') === id) ?? { id: '', actor }
  );
}

function resolveRow(pending: ResolveHealingPending | null, inCombat: boolean): {
  status: 'ready' | 'spent' | 'idle';
  detail: string;
  dice: number;
} {
  const ref = combatRef();
  if (pending && isResolveHealingPendingLive(pending, ref)) {
    const profile = healingRankProfile(pending.rank);
    return {
      status: 'ready',
      dice: profile.dice,
      detail: `Rank ${pending.rank} · ${describePendingHealing(pending.rank)}. Use it this Round.`,
    };
  }
  if (
    pending?.spent &&
    ref &&
    pending.combatId === ref.id &&
    pending.round === pendingHealingRound(ref)
  ) {
    return { status: 'spent', dice: 0, detail: 'Used this Round. The Stones stay spent.' };
  }
  return {
    status: 'idle',
    dice: 0,
    detail: inCombat
      ? 'Not prepared. Assign it with Stone Powers for this Round.'
      : 'Prepare it during an encounter with Stone Powers.',
  };
}

async function modelFor(actor: any): Promise<HealingBarModel> {
  await syncRegenerationDayBoundary(actor);
  const regen = getRegenerationState(actor);
  const pending = readActorResolveHealingPending(actor);
  const inCombat = !!combatRef();
  const row = resolveRow(pending, inCombat);
  return buildHealingBarModel({
    resolveStatus: row.status,
    resolveDetail: row.detail,
    dice: row.dice,
    inCombat,
    restoration: {
      poolMax: regen.poolMax,
      remaining: regen.remaining,
      scarred: countScarredHealthBars(actor),
      blocked: isIncapacitated(actor),
    },
  });
}

export class HealingBar extends BaseBar {
  private static _instance: HealingBar | null = null;
  private _busy = false;

  static DEFAULT_OPTIONS = {
    id: APP_ID,
    classes: ['mastery-system', 'known-npcs-bar', 'healing-bar'],
    position: { width: 'auto' },
    window: {
      title: 'Healing',
      frame: false,
      positioned: false,
      resizable: false,
      minimizable: false,
    },
    actions: {
      toggle: function (this: HealingBar, event: Event) {
        event.preventDefault();
        void this.#toggleCollapsed();
      },
      useHeal: function (this: HealingBar, event: Event) {
        event.preventDefault();
        void this.#useHeal();
      },
      useRestoration: function (this: HealingBar, event: Event) {
        event.preventDefault();
        void this.#useRestoration();
      },
    },
  };

  static PARTS = {
    content: { template: 'systems/mastery-system/templates/ui/healing-bar.hbs' },
  };

  static get instance(): HealingBar | null {
    return HealingBar._instance;
  }

  static resolveActor(): any | null {
    const g = globalThis as any;
    return resolveHealingBarActor(g.game?.user, g.game?.actors ?? [], selectedCharacterActor());
  }

  static async refresh(): Promise<void> {
    const actor = HealingBar.resolveActor();
    const model = actor ? await modelFor(actor) : null;
    const existing = foundry.applications.instances.get(APP_ID) as HealingBar | undefined;
    const show = !!model?.show && !readHealingBarHidden();
    if (!show) {
      if (existing) await (existing as any).close();
      HealingBar._instance = null;
      return;
    }
    if (existing) {
      HealingBar._instance = existing;
      if ((existing as any).rendered) {
        await (existing as any).render({ force: true, focus: false });
        return;
      }
    }
    HealingBar._instance = existing ?? new HealingBar();
    await (HealingBar._instance as any).render({ force: true, focus: false });
  }

  async _prepareContext(_options: any): Promise<any> {
    const actor = HealingBar.resolveActor();
    const model = actor
      ? await modelFor(actor)
      : buildHealingBarModel({
          resolveStatus: 'idle',
          resolveDetail: '',
          dice: 0,
          inCombat: false,
          restoration: { poolMax: 0, remaining: 0, scarred: 0, blocked: false },
        });
    return {
      actorName: String(actor?.name ?? ''),
      ...model,
      collapsed: readHealingBarCollapsed(),
      title: loc('MASTERY.healingBar.title', 'Healing'),
      expandLabel: loc('MASTERY.healingBar.expand', 'Show Healing'),
      collapseLabel: loc('MASTERY.healingBar.collapse', 'Hide Healing'),
      dragLabel: loc('MASTERY.healingBar.drag', 'Drag to move'),
      useHealLabel: loc('MASTERY.healingBar.useHeal', 'Use prepared Healing'),
      useRestorationLabel: loc('MASTERY.healingBar.useRestoration', 'Restore one Scarred Bar'),
    };
  }

  async _onRender(context: any, options: any): Promise<void> {
    await super._onRender?.(context, options);
    this.applyStoredPosition();
    this.#bindDragHandle();
  }

  applyStoredPosition(): void {
    const el = this.#rootElement();
    if (!el) return;
    const apply = () => {
      const next = clampHealingBarPosition(
        readHealingBarPosition(),
        { width: window.innerWidth, height: window.innerHeight },
        { width: el.offsetWidth, height: el.offsetHeight },
      );
      el.style.left = `${next.x}px`;
      el.style.top = `${next.y}px`;
    };
    apply();
    if (!el.offsetWidth || !el.offsetHeight) requestAnimationFrame(apply);
  }

  #rootElement(): HTMLElement | null {
    return ((this as any).element as HTMLElement | null) ?? null;
  }

  #bindDragHandle(): void {
    const handle = this.#rootElement()?.querySelector?.('.known-npcs-handle') as HTMLElement | null;
    if (!handle) return;
    handle.onpointerdown = (event) => this.#onDragPointerDown(event);
  }

  #onDragPointerDown(event: PointerEvent): void {
    if (event.button !== 0) return;
    const el = this.#rootElement();
    if (!el) return;
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startY = event.clientY;
    const origin = el.getBoundingClientRect();
    const handle = event.currentTarget as HTMLElement | null;
    try {
      handle?.setPointerCapture?.(event.pointerId);
    } catch {
      /* ignore */
    }
    el.classList.add('is-dragging');
    const move = (ev: PointerEvent) => {
      const next = clampHealingBarPosition(
        { x: origin.left + ev.clientX - startX, y: origin.top + ev.clientY - startY },
        { width: window.innerWidth, height: window.innerHeight },
        { width: el.offsetWidth, height: el.offsetHeight },
      );
      el.style.left = `${next.x}px`;
      el.style.top = `${next.y}px`;
    };
    const stop = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('pointercancel', stop);
      el.classList.remove('is-dragging');
      try {
        handle?.releasePointerCapture?.(ev.pointerId);
      } catch {
        /* ignore */
      }
      const box = el.getBoundingClientRect();
      void setHealingBarPosition(
        clampHealingBarPosition(
          { x: box.left, y: box.top },
          { width: window.innerWidth, height: window.innerHeight },
          { width: el.offsetWidth, height: el.offsetHeight },
        ),
      );
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);
  }

  async #toggleCollapsed(): Promise<void> {
    await setHealingBarCollapsed(!readHealingBarCollapsed());
    await (this as any).render({ force: true, focus: false });
  }

  async #useHeal(): Promise<void> {
    if (this._busy) return;
    const actor = HealingBar.resolveActor();
    const user = (globalThis as any).game?.user;
    if (!actor || (!user?.isGM && actor.isOwner !== true)) return;
    this._busy = true;
    try {
      const result = await usePendingResolveHealing(actor, combatantForActor(actor));
      if (!result.ok && result.reason === 'expired') {
        (globalThis as any).ui?.notifications?.warn?.('Prepared Healing expired with the Round.');
      }
    } catch (err) {
      console.error('Mastery System | Healing bar use failed', err);
      (globalThis as any).ui?.notifications?.error?.('Healing could not be used — see the console.');
    } finally {
      this._busy = false;
    }
    await (this as any).render({ force: true, focus: false });
  }

  async #useRestoration(): Promise<void> {
    if (this._busy) return;
    const actor = HealingBar.resolveActor();
    const user = (globalThis as any).game?.user;
    if (!actor || (!user?.isGM && actor.isOwner !== true)) return;
    this._busy = true;
    try {
      const result = await activatePassiveRegeneration(actor, 1);
      const ui = (globalThis as any).ui;
      if (!result.ok) {
        const msg =
          result.reason === 'incapacitated'
            ? 'Incapacitated — cannot activate Passive: Restoration.'
            : result.reason === 'exhausted'
              ? 'Daily Restoration pool exhausted.'
              : result.reason === 'no-scarred'
                ? 'No Scarred Health Bars to restore.'
                : 'Could not restore a Scarred Bar.';
        ui?.notifications?.warn?.(msg);
      } else {
        ui?.notifications?.info?.(
          `Restoration: restored ${result.restored} Scarred Bar at full HP. Remaining today: ${result.remaining}.`,
        );
      }
    } catch (err) {
      console.error('Mastery System | Restoration bar use failed', err);
      (globalThis as any).ui?.notifications?.error?.('Restoration could not be used — see the console.');
    } finally {
      this._busy = false;
    }
    await (this as any).render({ force: true, focus: false });
  }
}

export async function showHealingBarFromMenu(): Promise<void> {
  const actor = HealingBar.resolveActor();
  const ui = (globalThis as any).ui;
  if (!actor) {
    ui?.notifications?.warn?.('Select your character token to open the Healing bar.');
    return;
  }
  const model = await modelFor(actor);
  if (!model.show) {
    ui?.notifications?.info?.(`${actor.name} has no Healing charge and no Restoration pool.`);
    return;
  }
  await setHealingBarHidden(false);
  await setHealingBarCollapsed(false);
  await HealingBar.refresh();
}

export function initializeHealingBar(): void {
  const refresh = () => {
    void HealingBar.refresh();
  };
  const Hooks = (globalThis as any).Hooks;
  Hooks.once('ready', refresh);
  Hooks.on('canvasReady', refresh);
  Hooks.on('masteryHealingBarRefresh', refresh);
  Hooks.on('controlToken', refresh);
  Hooks.on('updateCombat', refresh);
  Hooks.on('combatRound', refresh);
  Hooks.on('combatStart', refresh);
  Hooks.on('deleteCombat', refresh);
  window.addEventListener('resize', () => {
    HealingBar.instance?.applyStoredPosition();
  });
  Hooks.on('updateActor', (actor: any) => {
    if (String(actor?.type || '') !== 'character') return;
    const mine = HealingBar.resolveActor();
    if (!mine || String(mine.id) !== String(actor.id)) return;
    refresh();
  });
  Hooks.on('updateUser', (user: any, changes: any) => {
    if (String(user?.id) !== String((globalThis as any).game?.user?.id)) return;
    if (changes?.character !== undefined) refresh();
  });
}
