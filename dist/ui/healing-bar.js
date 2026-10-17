/**
 * Floating Healing panel: prepared Resolve Healing for this Round, and the
 * Passive: Restoration daily Scarred-Bar pool. Replaces the "Use Healing now"
 * chat card.
 */
var _a;
import { isIncapacitated } from '../combat/death-check.js';
import { activatePassiveRegeneration, getRegenerationState, syncRegenerationDayBoundary, } from '../combat/passive-regeneration.js';
import { buildHealingBarModel, clampHealingBarPosition, readHealingBarCollapsed, readHealingBarHidden, readHealingBarPosition, resolveHealingBarActor, setHealingBarCollapsed, setHealingBarHidden, setHealingBarPosition, } from '../system/healing-bar.js';
import { countScarredHealthBars } from '../stones/remove-scar.js';
import { describePendingHealing, isResolveHealingPendingLive, pendingHealingRound, } from '../stones/resolve-healing-pending.js';
import { healingRankProfile } from '../stones/stone-resolution.js';
import { readActorResolveHealingPending, usePendingResolveHealing, } from '../stones/stone-resolution-ui.js';
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const BaseBar = HandlebarsApplicationMixin(ApplicationV2);
const APP_ID = 'mastery-healing-bar';
function loc(key, fallback) {
    const raw = globalThis.game?.i18n?.localize?.(key);
    return raw && raw !== key ? raw : fallback;
}
function selectedCharacterActor() {
    const g = globalThis;
    const controlled = g.canvas?.tokens?.controlled ?? [];
    for (const token of controlled) {
        const actor = token?.actor;
        if (actor && String(actor.type || '') === 'character')
            return actor;
    }
    const layerToken = g.canvas?.tokens?.get?.(g.canvas?.tokens?.controlled?.[0]?.id);
    return layerToken?.actor && String(layerToken.actor.type || '') === 'character' ? layerToken.actor : null;
}
function combatRef() {
    const combat = globalThis.game?.combat;
    if (!combat?.id)
        return null;
    return { id: String(combat.id), round: Number(combat.round) || 0 };
}
function combatantForActor(actor) {
    const combat = globalThis.game?.combat;
    const bag = combat?.combatants;
    const rows = [];
    if (bag) {
        if (typeof bag[Symbol.iterator] === 'function')
            rows.push(...bag);
        else if (Array.isArray(bag.contents))
            rows.push(...bag.contents);
    }
    const id = String(actor?.id || '');
    return (rows.find((row) => String(row?.actor?.id || row?.actorId || '') === id) ?? { id: '', actor });
}
function resolveRow(pending, inCombat) {
    const ref = combatRef();
    if (pending && isResolveHealingPendingLive(pending, ref)) {
        const profile = healingRankProfile(pending.rank);
        return {
            status: 'ready',
            dice: profile.dice,
            detail: `Rank ${pending.rank} · ${describePendingHealing(pending.rank)}. Use it this Round.`,
        };
    }
    if (pending?.spent &&
        ref &&
        pending.combatId === ref.id &&
        pending.round === pendingHealingRound(ref)) {
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
async function modelFor(actor) {
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
            owned: regen.level > 0,
            poolMax: regen.poolMax,
            remaining: regen.remaining,
            scarred: countScarredHealthBars(actor),
            blocked: isIncapacitated(actor),
        },
    });
}
export class HealingBar extends BaseBar {
    static _instance = null;
    _busy = false;
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
            toggle: function (event) {
                event.preventDefault();
                void this.#toggleCollapsed();
            },
            useHeal: function (event) {
                event.preventDefault();
                void this.#useHeal();
            },
            useRestoration: function (event) {
                event.preventDefault();
                void this.#useRestoration();
            },
        },
    };
    static PARTS = {
        content: { template: 'systems/mastery-system/templates/ui/healing-bar.hbs' },
    };
    static get instance() {
        return _a._instance;
    }
    static resolveActor() {
        const g = globalThis;
        return resolveHealingBarActor(g.game?.user, g.game?.actors ?? [], selectedCharacterActor());
    }
    static async refresh() {
        const actor = _a.resolveActor();
        const model = actor ? await modelFor(actor) : null;
        const existing = foundry.applications.instances.get(APP_ID);
        const show = !!model?.show && !readHealingBarHidden();
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
            ? await modelFor(actor)
            : buildHealingBarModel({
                resolveStatus: 'idle',
                resolveDetail: '',
                dice: 0,
                inCombat: false,
                restoration: { owned: false, poolMax: 0, remaining: 0, scarred: 0, blocked: false },
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
    async _onRender(context, options) {
        await super._onRender?.(context, options);
        this.applyStoredPosition();
        this.#bindDragHandle();
    }
    applyStoredPosition() {
        const el = this.#rootElement();
        if (!el)
            return;
        const apply = () => {
            const next = clampHealingBarPosition(readHealingBarPosition(), { width: window.innerWidth, height: window.innerHeight }, { width: el.offsetWidth, height: el.offsetHeight });
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
            const next = clampHealingBarPosition({ x: origin.left + ev.clientX - startX, y: origin.top + ev.clientY - startY }, { width: window.innerWidth, height: window.innerHeight }, { width: el.offsetWidth, height: el.offsetHeight });
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
            void setHealingBarPosition(clampHealingBarPosition({ x: box.left, y: box.top }, { width: window.innerWidth, height: window.innerHeight }, { width: el.offsetWidth, height: el.offsetHeight }));
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', stop);
        window.addEventListener('pointercancel', stop);
    }
    async #toggleCollapsed() {
        await setHealingBarCollapsed(!readHealingBarCollapsed());
        await this.render({ force: true, focus: false });
    }
    async #useHeal() {
        if (this._busy)
            return;
        const actor = _a.resolveActor();
        const user = globalThis.game?.user;
        if (!actor || (!user?.isGM && actor.isOwner !== true))
            return;
        this._busy = true;
        try {
            const result = await usePendingResolveHealing(actor, combatantForActor(actor));
            if (!result.ok && result.reason === 'expired') {
                globalThis.ui?.notifications?.warn?.('Prepared Healing expired with the Round.');
            }
        }
        catch (err) {
            console.error('Mastery System | Healing bar use failed', err);
            globalThis.ui?.notifications?.error?.('Healing could not be used — see the console.');
        }
        finally {
            this._busy = false;
        }
        await this.render({ force: true, focus: false });
    }
    async #useRestoration() {
        if (this._busy)
            return;
        const actor = _a.resolveActor();
        const user = globalThis.game?.user;
        if (!actor || (!user?.isGM && actor.isOwner !== true))
            return;
        this._busy = true;
        try {
            const result = await activatePassiveRegeneration(actor, 1);
            const ui = globalThis.ui;
            if (!result.ok) {
                const msg = result.reason === 'incapacitated'
                    ? 'Incapacitated — cannot activate Passive: Restoration.'
                    : result.reason === 'exhausted'
                        ? 'Daily Restoration pool exhausted.'
                        : result.reason === 'no-scarred'
                            ? 'No Scarred Health Bars to restore.'
                            : 'Could not restore a Scarred Bar.';
                ui?.notifications?.warn?.(msg);
            }
            else {
                ui?.notifications?.info?.(`Restoration: restored ${result.restored} Scarred Bar at full HP. Remaining today: ${result.remaining}.`);
            }
        }
        catch (err) {
            console.error('Mastery System | Restoration bar use failed', err);
            globalThis.ui?.notifications?.error?.('Restoration could not be used — see the console.');
        }
        finally {
            this._busy = false;
        }
        await this.render({ force: true, focus: false });
    }
}
_a = HealingBar;
export async function showHealingBarFromMenu() {
    const actor = HealingBar.resolveActor();
    const ui = globalThis.ui;
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
export function initializeHealingBar() {
    const refresh = () => {
        void HealingBar.refresh();
    };
    const Hooks = globalThis.Hooks;
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
    Hooks.on('updateActor', (actor) => {
        if (String(actor?.type || '') !== 'character')
            return;
        const mine = HealingBar.resolveActor();
        if (!mine || String(mine.id) !== String(actor.id))
            return;
        refresh();
    });
    Hooks.on('updateUser', (user, changes) => {
        if (String(user?.id) !== String(globalThis.game?.user?.id))
            return;
        if (changes?.character !== undefined)
            refresh();
    });
}
//# sourceMappingURL=healing-bar.js.map