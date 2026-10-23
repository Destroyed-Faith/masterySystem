/**
 * @deprecated Minor Expressions are replaced by Echo Imprints (DF Guide 2026-10-23).
 * The floating bar is retired from live paths: it never renders (see
 * LEGACY_MINOR_EXPRESSIONS_BAR_ENABLED) and the scene-control entry opens the
 * Echo Imprints dialog instead. Kept only for rollback / archive review.
 *
 * Original description:
 * Floating player panel listing the character's chosen Minor Expressions
 * (same chrome as the Important NPCs bar): draggable, collapsible, hover
 * shows the current-tier text, "Use" posts the expression to chat and ticks
 * the per-Safe-Haven-Rest budget (Mastery Rank × 2).
 */
var _a;
import { buildMinorExpressionsBarModel, clampMinorExpressionsBarPosition, FLAG_SCOPE, MINOR_EXPRESSION_USES_FLAG, readMinorExpressionsBarCollapsed, readMinorExpressionsBarHidden, readMinorExpressionsBarPosition, readMinorExpressionUses, resolveMinorExpressionsBarActor, setMinorExpressionsBarCollapsed, setMinorExpressionsBarHidden, setMinorExpressionsBarPosition, } from '../system/minor-expressions-bar.js';
import { MINOR_EXPRESSION_MIN_ATTRIBUTE } from '../utils/minor-expressions.js';
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const BaseBar = HandlebarsApplicationMixin(ApplicationV2);
const APP_ID = 'mastery-minor-expressions-bar';
/** Retired: Echo Imprints replace Minor Expressions. Flip only for rollback. */
const LEGACY_MINOR_EXPRESSIONS_BAR_ENABLED = false;
function loc(key, fallback) {
    const raw = globalThis.game?.i18n?.localize?.(key);
    return raw && raw !== key ? raw : fallback;
}
function esc(value) {
    const s = String(value ?? '');
    const fn = foundry?.utils?.escapeHTML;
    return typeof fn === 'function' ? fn(s) : s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
async function postMinorExpressionToChat(actor, row, usesLeft, usesMax) {
    const tierLabel = row.tier ? `${row.attributeLabel} ${row.tier}` : `${row.attributeLabel} (locked)`;
    const content = `<div class="mastery-system minor-expression-card">` +
        `<header class="minor-expression-card-head"><i class="fas fa-wand-sparkles"></i> ` +
        `<strong>${esc(row.name)}</strong> <span class="minor-expression-card-tier">${esc(tierLabel)}</span></header>` +
        `<p class="minor-expression-card-tagline"><em>${esc(row.tagline)}</em></p>` +
        `<p class="minor-expression-card-body">${esc(row.body)}</p>` +
        (row.constraints ? `<p class="minor-expression-card-constraints">${esc(row.constraints)}</p>` : '') +
        `<footer class="minor-expression-card-uses">Uses left until Safe Haven Rest: ${usesLeft}/${usesMax}</footer>` +
        `</div>`;
    const speaker = ChatMessage.getSpeaker?.({ actor }) ?? {};
    await ChatMessage.create({
        speaker,
        content,
        flags: { [FLAG_SCOPE]: { minorExpressionId: row.id } },
    });
}
export class MinorExpressionsBar extends BaseBar {
    static _instance = null;
    _busy = false;
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
            toggle: function (event) {
                event.preventDefault();
                void this.#toggleCollapsed();
            },
            use: function (event) {
                event.preventDefault();
                const btn = event.target?.closest?.('[data-expression-id]');
                void this.#useExpression(btn?.dataset.expressionId || '');
            },
            undo: function (event) {
                event.preventDefault();
                void this.#changeUses(-1);
            },
            sheet: function (event) {
                event.preventDefault();
                const actor = _a.resolveActor();
                void actor?.sheet?.render?.(true);
            },
        },
    };
    static PARTS = {
        content: { template: 'systems/mastery-system/templates/ui/minor-expressions-bar.hbs' },
    };
    static get instance() {
        return _a._instance;
    }
    static resolveActor() {
        const g = globalThis;
        return resolveMinorExpressionsBarActor(g.game?.user, g.game?.actors ?? []);
    }
    static async refresh() {
        const actor = _a.resolveActor();
        const model = actor ? buildMinorExpressionsBarModel(actor) : null;
        const existing = foundry.applications.instances.get(APP_ID);
        const show = LEGACY_MINOR_EXPRESSIONS_BAR_ENABLED &&
            !!model &&
            model.rows.length > 0 &&
            !readMinorExpressionsBarHidden();
        if (!show) {
            if (existing)
                await existing.close();
            _a._instance = null;
            return;
        }
        if (existing) {
            _a._instance = existing;
            if (existing.rendered) {
                await existing.render({ force: true, focus: false });
                return;
            }
        }
        _a._instance = existing ?? new _a();
        await _a._instance.render({ force: true, focus: false });
    }
    async _prepareContext(_options) {
        const actor = _a.resolveActor();
        const model = actor
            ? buildMinorExpressionsBarModel(actor)
            : { rows: [], masteryRank: 0, usesMax: 0, usesSpent: 0, usesLeft: 0 };
        const canUse = model.usesLeft > 0;
        return {
            actorName: String(actor?.name ?? ''),
            rows: model.rows.map((row) => ({
                ...row,
                tierLabel: row.tier
                    ? `${row.attributeLabel} ${row.tier}`
                    : `${row.attributeLabel} — needs ${MINOR_EXPRESSION_MIN_ATTRIBUTE}`,
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
            useHintLabel: loc('MASTERY.minorExpressionsBar.useHint', 'Click Use to post this to chat (same card as below).'),
            useBlockedLabel: loc('MASTERY.minorExpressionsBar.useBlocked', 'No uses left, or this Expression is locked until the Attribute rises.'),
            undoLabel: loc('MASTERY.minorExpressionsBar.undo', 'Undo last use'),
            sheetLabel: loc('MASTERY.minorExpressionsBar.sheet', 'Open character sheet'),
            usesLabel: loc('MASTERY.minorExpressionsBar.uses', 'Uses until Safe Haven Rest'),
        };
    }
    async _onRender(context, options) {
        await super._onRender?.(context, options);
        this.applyStoredPosition();
        this.#bindDragHandle();
        this.#bindHoverTips();
    }
    applyStoredPosition() {
        const el = this.#rootElement();
        if (!el)
            return;
        const apply = () => {
            const next = clampMinorExpressionsBarPosition(readMinorExpressionsBarPosition(), { width: window.innerWidth, height: window.innerHeight }, { width: el.offsetWidth, height: el.offsetHeight });
            el.style.left = `${next.x}px`;
            el.style.top = `${next.y}px`;
        };
        apply();
        if (!el.offsetWidth || !el.offsetHeight)
            requestAnimationFrame(apply);
    }
    #rootElement() {
        return this.element ?? null;
    }
    #bindHoverTips() {
        const root = this.#rootElement();
        if (!root)
            return;
        root.querySelectorAll('.minor-expressions-row').forEach((el) => {
            const row = el;
            const tip = row.querySelector('.minor-expressions-tip');
            if (!tip)
                return;
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
    #bindDragHandle() {
        const handle = this.#rootElement()?.querySelector?.('.known-npcs-handle');
        if (!handle)
            return;
        handle.onpointerdown = (event) => this.#onDragPointerDown(event);
    }
    #onDragPointerDown(event) {
        if (event.button !== 0)
            return;
        const el = this.#rootElement();
        if (!el)
            return;
        event.preventDefault();
        event.stopPropagation();
        const startX = event.clientX;
        const startY = event.clientY;
        const origin = el.getBoundingClientRect();
        const handle = event.currentTarget;
        try {
            handle?.setPointerCapture?.(event.pointerId);
        }
        catch {
            /* ignore */
        }
        el.classList.add('is-dragging');
        const move = (ev) => {
            const next = clampMinorExpressionsBarPosition({ x: origin.left + ev.clientX - startX, y: origin.top + ev.clientY - startY }, { width: window.innerWidth, height: window.innerHeight }, { width: el.offsetWidth, height: el.offsetHeight });
            el.style.left = `${next.x}px`;
            el.style.top = `${next.y}px`;
        };
        const stop = (ev) => {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', stop);
            window.removeEventListener('pointercancel', stop);
            el.classList.remove('is-dragging');
            try {
                handle?.releasePointerCapture?.(ev.pointerId);
            }
            catch {
                /* ignore */
            }
            const box = el.getBoundingClientRect();
            void setMinorExpressionsBarPosition(clampMinorExpressionsBarPosition({ x: box.left, y: box.top }, { width: window.innerWidth, height: window.innerHeight }, { width: el.offsetWidth, height: el.offsetHeight }));
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', stop);
        window.addEventListener('pointercancel', stop);
    }
    async #toggleCollapsed() {
        await setMinorExpressionsBarCollapsed(!readMinorExpressionsBarCollapsed());
        await this.render({ force: true, focus: false });
    }
    async #changeUses(delta) {
        const actor = _a.resolveActor();
        if (!actor?.isOwner)
            return null;
        const model = buildMinorExpressionsBarModel(actor);
        const current = readMinorExpressionUses(actor);
        const next = Math.max(0, Math.min(model.usesMax, current + delta));
        if (next === current)
            return current;
        try {
            await actor.setFlag(FLAG_SCOPE, MINOR_EXPRESSION_USES_FLAG, next);
        }
        catch (err) {
            console.warn('Mastery System | Minor Expression uses update failed', err);
            return null;
        }
        return next;
    }
    async #useExpression(id) {
        if (this._busy || !id)
            return;
        const actor = _a.resolveActor();
        if (!actor?.isOwner)
            return;
        const model = buildMinorExpressionsBarModel(actor);
        const row = model.rows.find((r) => r.id === id);
        if (!row)
            return;
        if (!row.tier) {
            ui.notifications?.warn(`${row.name}: ${row.attributeLabel} must be at least ${MINOR_EXPRESSION_MIN_ATTRIBUTE}.`);
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
        }
        catch (err) {
            console.error('Mastery System | Minor Expression use failed', err);
            ui.notifications?.error('Minor Expression could not be posted — see the console.');
        }
        finally {
            this._busy = false;
        }
        await this.render({ force: true, focus: false });
    }
}
_a = MinorExpressionsBar;
/**
 * @deprecated Delegates to the Echo Imprints dialog; the floating bar is retired.
 */
export async function showMinorExpressionsBarFromMenu() {
    const { showEchoImprintsFromMenu } = await import('./echo-imprints-menu.js');
    await showEchoImprintsFromMenu();
}
/**
 * @deprecated Legacy floating-panel opener (only works when
 * LEGACY_MINOR_EXPRESSIONS_BAR_ENABLED is true). Not called from live paths.
 */
export async function showLegacyMinorExpressionsBarFromMenu() {
    if (!LEGACY_MINOR_EXPRESSIONS_BAR_ENABLED) {
        await showMinorExpressionsBarFromMenu();
        return;
    }
    const actor = MinorExpressionsBar.resolveActor();
    if (!actor) {
        if (game.user?.isGM) {
            ui.notifications?.info('Minor Expressions is a player panel. Assign a character to a player user to use it.');
        }
        else {
            ui.notifications?.warn('No owned character found for Minor Expressions.');
        }
        return;
    }
    const model = buildMinorExpressionsBarModel(actor);
    if (!model.rows.length) {
        ui.notifications?.warn(`${actor.name}: choose Minor Expressions on the character sheet first.`);
        return;
    }
    await setMinorExpressionsBarHidden(false);
    await setMinorExpressionsBarCollapsed(false);
    await MinorExpressionsBar.refresh();
    ui.notifications?.info(`Minor Expressions: ${model.usesLeft}/${model.usesMax} uses left until Safe Haven Rest. Hover a row, then Use to post to chat.`);
}
export function initializeMinorExpressionsBar() {
    const refresh = () => {
        void MinorExpressionsBar.refresh();
    };
    Hooks.once('ready', refresh);
    Hooks.on('canvasReady', refresh);
    Hooks.on('masteryMinorExpressionsBarRefresh', refresh);
    window.addEventListener('resize', () => {
        MinorExpressionsBar.instance?.applyStoredPosition();
    });
    Hooks.on('updateActor', (actor, changes) => {
        if (String(actor?.type || '') !== 'character')
            return;
        const mine = MinorExpressionsBar.resolveActor();
        if (!mine || String(mine.id) !== String(actor.id))
            return;
        const sys = changes?.system ?? {};
        const touched = sys.minorExpressions !== undefined ||
            sys.attributes !== undefined ||
            sys.mastery !== undefined ||
            changes?.flags?.[FLAG_SCOPE]?.[MINOR_EXPRESSION_USES_FLAG] !== undefined ||
            changes?.flags?.[FLAG_SCOPE]?.[`-=${MINOR_EXPRESSION_USES_FLAG}`] !== undefined ||
            changes?.name !== undefined;
        if (touched)
            refresh();
    });
    // Character assignment / ownership changes.
    Hooks.on('updateUser', (user, changes) => {
        if (String(user?.id) !== String(game.user?.id))
            return;
        if (changes?.character !== undefined)
            refresh();
    });
    Hooks.on('createActor', (actor) => {
        if (String(actor?.type || '') === 'character')
            refresh();
    });
    Hooks.on('deleteActor', (actor) => {
        if (String(actor?.type || '') === 'character')
            refresh();
    });
}
//# sourceMappingURL=minor-expressions-bar.js.map