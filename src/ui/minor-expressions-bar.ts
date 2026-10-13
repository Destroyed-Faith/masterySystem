/**
 * Floating player panel listing the character's chosen Minor Expressions
 * (same chrome as the Important NPCs bar): draggable, collapsible, hover
 * shows the current-tier text, "Use" posts the expression to chat and ticks
 * the per-Safe-Haven-Rest budget (Mastery Rank × 2).
 */

import {
  buildMinorExpressionsBarModel,
  clampMinorExpressionsBarPosition,
  FLAG_SCOPE,
  MINOR_EXPRESSION_USES_FLAG,
  readMinorExpressionsBarCollapsed,
  readMinorExpressionsBarHidden,
  readMinorExpressionsBarPosition,
  readMinorExpressionUses,
  resolveMinorExpressionsBarActor,
  setMinorExpressionsBarCollapsed,
  setMinorExpressionsBarPosition,
  type MinorExpressionBarRow,
} from '../system/minor-expressions-bar.js';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const BaseBar = HandlebarsApplicationMixin(ApplicationV2) as typeof ApplicationV2;

const APP_ID = 'mastery-minor-expressions-bar';

function loc(key: string, fallback: string): string {
  const raw = (globalThis as any).game?.i18n?.localize?.(key);
  return raw && raw !== key ? raw : fallback;
}

function esc(value: unknown): string {
  const s = String(value ?? '');
  const fn = (foundry as any)?.utils?.escapeHTML;
  return typeof fn === 'function' ? fn(s) : s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

async function postMinorExpressionToChat(actor: any, row: MinorExpressionBarRow, usesLeft: number, usesMax: number): Promise<void> {
  const tierLabel = row.tier ? `${row.attributeLabel} ${row.tier}` : `${row.attributeLabel} (locked)`;
  const content =
    `<div class="mastery-system minor-expression-card">` +
    `<header class="minor-expression-card-head"><i class="fas fa-wand-sparkles"></i> ` +
    `<strong>${esc(row.name)}</strong> <span class="minor-expression-card-tier">${esc(tierLabel)}</span></header>` +
    `<p class="minor-expression-card-tagline"><em>${esc(row.tagline)}</em></p>` +
    `<p class="minor-expression-card-body">${esc(row.body)}</p>` +
    (row.constraints ? `<p class="minor-expression-card-constraints">${esc(row.constraints)}</p>` : '') +
    `<footer class="minor-expression-card-uses">Uses left until Safe Haven Rest: ${usesLeft}/${usesMax}</footer>` +
    `</div>`;
  const speaker = (ChatMessage as any).getSpeaker?.({ actor }) ?? {};
  await (ChatMessage as any).create({
    speaker,
    content,
    flags: { [FLAG_SCOPE]: { minorExpressionId: row.id } },
  });
}

export class MinorExpressionsBar extends BaseBar {
  private static _instance: MinorExpressionsBar | null = null;
  private _busy = false;

  static DEFAULT_OPTIONS = {
    id: APP_ID,
    classes: ['mastery-system', 'known-npcs-bar', 'minor-expressions-bar'],
    position: { width: 'auto' },
    window: {
      title: 'Minor Expressions',
      frame: false,
      positioned: false,
      resizable: false,
      minimizable: false,
    },
    actions: {
      toggle: function (this: MinorExpressionsBar, event: Event) {
        event.preventDefault();
        void this.#toggleCollapsed();
      },
      use: function (this: MinorExpressionsBar, event: Event) {
        event.preventDefault();
        const btn = (event.target as HTMLElement | null)?.closest?.('[data-expression-id]') as HTMLElement | null;
        void this.#useExpression(btn?.dataset.expressionId || '');
      },
      undo: function (this: MinorExpressionsBar, event: Event) {
        event.preventDefault();
        void this.#changeUses(-1);
      },
      sheet: function (this: MinorExpressionsBar, event: Event) {
        event.preventDefault();
        const actor = MinorExpressionsBar.resolveActor();
        void actor?.sheet?.render?.(true);
      },
    },
  };

  static PARTS = {
    content: { template: 'systems/mastery-system/templates/ui/minor-expressions-bar.hbs' },
  };

  static get instance(): MinorExpressionsBar | null {
    return MinorExpressionsBar._instance;
  }

  static resolveActor(): any | null {
    const g = globalThis as any;
    return resolveMinorExpressionsBarActor(g.game?.user, g.game?.actors ?? []);
  }

  static async refresh(): Promise<void> {
    const actor = MinorExpressionsBar.resolveActor();
    const model = actor ? buildMinorExpressionsBarModel(actor) : null;
    const existing = foundry.applications.instances.get(APP_ID) as MinorExpressionsBar | undefined;
    const show = !!model && model.rows.length > 0 && !readMinorExpressionsBarHidden();
    if (!show) {
      if (existing) await (existing as any).close();
      MinorExpressionsBar._instance = null;
      return;
    }
    if (existing) {
      MinorExpressionsBar._instance = existing;
      if ((existing as any).rendered) {
        await (existing as any).render({ force: true, focus: false });
        return;
      }
    }
    MinorExpressionsBar._instance = existing ?? new MinorExpressionsBar();
    await (MinorExpressionsBar._instance as any).render({ force: true, focus: false });
  }

  async _prepareContext(_options: any): Promise<any> {
    const actor = MinorExpressionsBar.resolveActor();
    const model = actor
      ? buildMinorExpressionsBarModel(actor)
      : { rows: [], masteryRank: 0, usesMax: 0, usesSpent: 0, usesLeft: 0 };
    const canUse = model.usesLeft > 0;
    return {
      actorName: String(actor?.name ?? ''),
      rows: model.rows.map((row) => ({
        ...row,
        tierLabel: row.tier ? `${row.attributeLabel} ${row.tier}` : `${row.attributeLabel} — needs 4`,
        locked: !row.tier,
        canUse: canUse && !!row.tier,
      })),
      hasRows: model.rows.length > 0,
      usesMax: model.usesMax,
      usesSpent: model.usesSpent,
      usesLeft: model.usesLeft,
      canUndo: model.usesSpent > 0,
      collapsed: readMinorExpressionsBarCollapsed(),
      title: loc('MASTERY.minorExpressionsBar.title', 'Minor Expressions'),
      expandLabel: loc('MASTERY.minorExpressionsBar.expand', 'Show Minor Expressions'),
      collapseLabel: loc('MASTERY.minorExpressionsBar.collapse', 'Hide Minor Expressions'),
      dragLabel: loc('MASTERY.minorExpressionsBar.drag', 'Drag to move'),
      useLabel: loc('MASTERY.minorExpressionsBar.use', 'Use (post to chat)'),
      undoLabel: loc('MASTERY.minorExpressionsBar.undo', 'Undo last use'),
      sheetLabel: loc('MASTERY.minorExpressionsBar.sheet', 'Open character sheet'),
      usesLabel: loc('MASTERY.minorExpressionsBar.uses', 'Uses until Safe Haven Rest'),
    };
  }

  async _onRender(context: any, options: any): Promise<void> {
    await super._onRender?.(context, options);
    this.applyStoredPosition();
    this.#bindDragHandle();
    this.#bindHoverTips();
  }

  applyStoredPosition(): void {
    const el = this.#rootElement();
    if (!el) return;
    const apply = () => {
      const next = clampMinorExpressionsBarPosition(
        readMinorExpressionsBarPosition(),
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

  #bindHoverTips(): void {
    const root = this.#rootElement();
    if (!root) return;
    root.querySelectorAll('.minor-expressions-row').forEach((el: Element) => {
      const row = el as HTMLElement;
      const tip = row.querySelector('.minor-expressions-tip') as HTMLElement | null;
      if (!tip) return;
      row.onmouseenter = () => {
        tip.hidden = false;
        // Keep the tip on screen: flip to the left when it would overflow.
        const box = tip.getBoundingClientRect();
        tip.classList.toggle('is-left', box.right > window.innerWidth - 8);
        tip.classList.toggle('is-up', box.bottom > window.innerHeight - 8);
      };
      row.onmouseleave = () => {
        tip.hidden = true;
      };
    });
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
      const next = clampMinorExpressionsBarPosition(
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
      void setMinorExpressionsBarPosition(
        clampMinorExpressionsBarPosition(
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
    await setMinorExpressionsBarCollapsed(!readMinorExpressionsBarCollapsed());
    await (this as any).render({ force: true, focus: false });
  }

  async #changeUses(delta: number): Promise<number | null> {
    const actor = MinorExpressionsBar.resolveActor();
    if (!actor?.isOwner) return null;
    const model = buildMinorExpressionsBarModel(actor);
    const current = readMinorExpressionUses(actor);
    const next = Math.max(0, Math.min(model.usesMax, current + delta));
    if (next === current) return current;
    try {
      await actor.setFlag(FLAG_SCOPE, MINOR_EXPRESSION_USES_FLAG, next);
    } catch (err) {
      console.warn('Mastery System | Minor Expression uses update failed', err);
      return null;
    }
    return next;
  }

  async #useExpression(id: string): Promise<void> {
    if (this._busy || !id) return;
    const actor = MinorExpressionsBar.resolveActor();
    if (!actor?.isOwner) return;
    const model = buildMinorExpressionsBarModel(actor);
    const row = model.rows.find((r) => r.id === id);
    if (!row) return;
    if (!row.tier) {
      ui.notifications?.warn(`${row.name}: ${row.attributeLabel} must be at least 4.`);
      return;
    }
    if (model.usesLeft <= 0) {
      ui.notifications?.warn('No Minor Expression uses left until the next Safe Haven Rest.');
      return;
    }
    this._busy = true;
    try {
      const spent = await this.#changeUses(1);
      const usesLeft = spent == null ? model.usesLeft : Math.max(0, model.usesMax - spent);
      await postMinorExpressionToChat(actor, row, usesLeft, model.usesMax);
    } catch (err) {
      console.error('Mastery System | Minor Expression use failed', err);
      ui.notifications?.error('Minor Expression could not be posted — see the console.');
    } finally {
      this._busy = false;
    }
    await (this as any).render({ force: true, focus: false });
  }
}

export function initializeMinorExpressionsBar(): void {
  const refresh = () => {
    void MinorExpressionsBar.refresh();
  };

  Hooks.once('ready', refresh);
  Hooks.on('canvasReady', refresh);
  Hooks.on('masteryMinorExpressionsBarRefresh', refresh);
  window.addEventListener('resize', () => {
    MinorExpressionsBar.instance?.applyStoredPosition();
  });

  Hooks.on('updateActor', (actor: any, changes: any) => {
    if (String(actor?.type || '') !== 'character') return;
    const mine = MinorExpressionsBar.resolveActor();
    if (!mine || String(mine.id) !== String(actor.id)) return;
    const sys = changes?.system ?? {};
    const touched =
      sys.minorExpressions !== undefined ||
      sys.attributes !== undefined ||
      sys.mastery !== undefined ||
      changes?.flags?.[FLAG_SCOPE]?.[MINOR_EXPRESSION_USES_FLAG] !== undefined ||
      changes?.flags?.[FLAG_SCOPE]?.[`-=${MINOR_EXPRESSION_USES_FLAG}`] !== undefined ||
      changes?.name !== undefined;
    if (touched) refresh();
  });

  // Character assignment / ownership changes.
  Hooks.on('updateUser', (user: any, changes: any) => {
    if (String(user?.id) !== String((game as any).user?.id)) return;
    if (changes?.character !== undefined) refresh();
  });
  Hooks.on('createActor', (actor: any) => {
    if (String(actor?.type || '') === 'character') refresh();
  });
  Hooks.on('deleteActor', (actor: any) => {
    if (String(actor?.type || '') === 'character') refresh();
  });
}
