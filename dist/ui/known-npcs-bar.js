/**
 * Player-facing portrait bar for GM-released important NPCs.
 */
import { resolveActorPortraitSrc } from '../epic-roll/epic-mastery-roll-portraits.js';
import { clampKnownNpcsBarPosition, collectReleasedKnownNpcs, isKnownNpcReleased, readKnownNpcIds, readKnownNpcsBarCollapsed, readKnownNpcsBarPosition, removeKnownNpc, setKnownNpcsBarCollapsed, setKnownNpcsBarPosition, } from '../system/known-npcs.js';
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const BaseBar = HandlebarsApplicationMixin(ApplicationV2);
function loc(key, fallback) {
    const raw = globalThis.game?.i18n?.localize?.(key);
    return raw && raw !== key ? raw : fallback;
}
export async function openKnownNpcPortrait(actorId) {
    const actor = game.actors?.get?.(actorId);
    if (!actor || String(actor.type || '') !== 'npc')
        return;
    const imgSrc = resolveActorPortraitSrc(actor);
    const title = String(actor.name || loc('MASTERY.knownNpcs.title', 'Important NPCs'));
    try {
        const ImagePopoutClass = foundry?.applications?.apps?.ImagePopout?.implementation || window.ImagePopout;
        if (ImagePopoutClass) {
            const popout = new ImagePopoutClass(imgSrc, {
                title,
                shareable: false,
                uuid: actor.uuid,
            });
            await popout.render(true);
            return;
        }
    }
    catch (err) {
        console.warn('Mastery System | Known NPC portrait popout failed', err);
    }
    ui.notifications?.info(title);
}
export class KnownNpcsBar extends BaseBar {
    static _instance = null;
    static DEFAULT_OPTIONS = {
        id: 'mastery-known-npcs-bar',
        classes: ['mastery-system', 'known-npcs-bar'],
        position: { width: 'auto' },
        window: {
            title: 'Important NPCs',
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
            portrait: function (event) {
                event.preventDefault();
                const btn = event.target?.closest?.('[data-actor-id]');
                void openKnownNpcPortrait(btn?.dataset.actorId || '');
            },
        },
    };
    static PARTS = {
        content: { template: 'systems/mastery-system/templates/ui/known-npcs-bar.hbs' },
    };
    static get instance() {
        return KnownNpcsBar._instance;
    }
    static async refresh() {
        const npcs = collectReleasedKnownNpcs(game.actors ?? [], readKnownNpcIds());
        const existing = foundry.applications.instances.get('mastery-known-npcs-bar');
        if (!npcs.length) {
            if (existing)
                await existing.close();
            KnownNpcsBar._instance = null;
            return;
        }
        if (existing) {
            KnownNpcsBar._instance = existing;
            if (existing.rendered) {
                await existing.render({ force: true, focus: false });
                return;
            }
        }
        KnownNpcsBar._instance = existing ?? new KnownNpcsBar();
        await KnownNpcsBar._instance.render({ force: true, focus: false });
    }
    async _prepareContext(_options) {
        const npcs = collectReleasedKnownNpcs(game.actors ?? [], readKnownNpcIds()).map((npc) => {
            const actor = game.actors?.get?.(npc.actorId);
            return { ...npc, img: resolveActorPortraitSrc(actor, npc.img) };
        });
        return {
            npcs,
            hasNpcs: npcs.length > 0,
            collapsed: readKnownNpcsBarCollapsed(),
            title: loc('MASTERY.knownNpcs.title', 'Important NPCs'),
            expandLabel: loc('MASTERY.knownNpcs.expand', 'Show important NPCs'),
            collapseLabel: loc('MASTERY.knownNpcs.collapse', 'Hide important NPCs'),
            dragLabel: loc('MASTERY.knownNpcs.drag', 'Drag to move'),
        };
    }
    async _onRender(context, options) {
        await super._onRender?.(context, options);
        this.applyStoredPosition();
        this.#bindDragHandle();
    }
    applyStoredPosition() {
        this.#applyPosition();
    }
    #rootElement() {
        return this.element ?? null;
    }
    #applyPosition() {
        const el = this.#rootElement();
        if (!el)
            return;
        const apply = () => {
            const next = clampKnownNpcsBarPosition(readKnownNpcsBarPosition(), { width: window.innerWidth, height: window.innerHeight }, { width: el.offsetWidth, height: el.offsetHeight });
            el.style.left = `${next.x}px`;
            el.style.top = `${next.y}px`;
        };
        apply();
        if (!el.offsetWidth || !el.offsetHeight)
            requestAnimationFrame(apply);
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
            const next = clampKnownNpcsBarPosition({ x: origin.left + ev.clientX - startX, y: origin.top + ev.clientY - startY }, { width: window.innerWidth, height: window.innerHeight }, { width: el.offsetWidth, height: el.offsetHeight });
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
            void setKnownNpcsBarPosition(clampKnownNpcsBarPosition({ x: box.left, y: box.top }, { width: window.innerWidth, height: window.innerHeight }, { width: el.offsetWidth, height: el.offsetHeight }));
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', stop);
        window.addEventListener('pointercancel', stop);
    }
    async #toggleCollapsed() {
        await setKnownNpcsBarCollapsed(!readKnownNpcsBarCollapsed());
        await this.render({ force: true, focus: false });
    }
}
export function initializeKnownNpcsBar() {
    const refresh = () => {
        void KnownNpcsBar.refresh();
    };
    Hooks.once('ready', refresh);
    Hooks.on('canvasReady', refresh);
    window.addEventListener('resize', () => {
        KnownNpcsBar.instance?.applyStoredPosition();
    });
    Hooks.on('updateSetting', (setting) => {
        const key = String(setting?.key ?? '');
        if (key === 'mastery-system.knownNpcs' || key.endsWith('.knownNpcs'))
            refresh();
    });
    Hooks.on('updateActor', (actor) => {
        if (String(actor?.type || '') !== 'npc')
            return;
        refresh();
    });
    Hooks.on('createActor', (actor) => {
        if (String(actor?.type || '') !== 'npc')
            return;
        refresh();
    });
    Hooks.on('deleteActor', (actor) => {
        if (String(actor?.type || '') !== 'npc')
            return;
        const id = String(actor?.id || '');
        if (id && game.user?.isGM && isKnownNpcReleased(id)) {
            void removeKnownNpc(id).then(refresh);
            return;
        }
        refresh();
    });
}
//# sourceMappingURL=known-npcs-bar.js.map