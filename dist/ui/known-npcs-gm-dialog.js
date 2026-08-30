/**
 * GM menu: release / hide important NPCs on the player portrait bar.
 */
import { resolveActorPortraitSrc } from '../epic-roll/epic-mastery-roll-portraits.js';
import { listNpcsForGmDialog, moveKnownNpc, readKnownNpcIds, setKnownNpcReleased, } from '../system/known-npcs.js';
import { KnownNpcsBar } from './known-npcs-bar.js';
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const BaseDialog = HandlebarsApplicationMixin(ApplicationV2);
function loc(key, fallback) {
    const raw = globalThis.game?.i18n?.localize?.(key);
    return raw && raw !== key ? raw : fallback;
}
export class KnownNpcsGmDialog extends BaseDialog {
    #filter = '';
    static DEFAULT_OPTIONS = {
        id: 'mastery-known-npcs-gm',
        classes: ['mastery-system', 'known-npcs-gm-dialog'],
        position: { width: 560, height: 'auto' },
        window: {
            title: 'Important NPCs',
            icon: 'fa-solid fa-id-badge',
            resizable: true,
        },
        actions: {
            release: function (event) {
                event.preventDefault();
                const id = event.target?.closest?.('[data-actor-id]')
                    ?.dataset.actorId;
                void this.#setReleased(id || '', true);
            },
            hide: function (event) {
                event.preventDefault();
                const id = event.target?.closest?.('[data-actor-id]')
                    ?.dataset.actorId;
                void this.#setReleased(id || '', false);
            },
            up: function (event) {
                event.preventDefault();
                const id = event.target?.closest?.('[data-actor-id]')
                    ?.dataset.actorId;
                void this.#move(id || '', -1);
            },
            down: function (event) {
                event.preventDefault();
                const id = event.target?.closest?.('[data-actor-id]')
                    ?.dataset.actorId;
                void this.#move(id || '', 1);
            },
        },
    };
    static PARTS = {
        content: { template: 'systems/mastery-system/templates/ui/known-npcs-gm-dialog.hbs' },
    };
    static async open() {
        if (!game.user?.isGM) {
            ui.notifications?.warn(loc('MASTERY.knownNpcs.gmOnly', 'Only the GM can choose which NPCs players see.'));
            return;
        }
        try {
            const existing = foundry.applications.instances.get('mastery-known-npcs-gm');
            if (existing) {
                if (existing.rendered) {
                    existing.bringToFront();
                    await existing.render({ force: true });
                    return;
                }
                await existing.close();
            }
            await new KnownNpcsGmDialog().render({ force: true });
        }
        catch (err) {
            console.error('Mastery System | Known NPCs GM dialog failed to open', err);
            ui.notifications?.error(loc('MASTERY.knownNpcs.openFailed', 'Important NPCs menu could not be opened.'));
        }
    }
    static refreshIfOpen() {
        const existing = foundry.applications.instances.get('mastery-known-npcs-gm');
        if (existing && existing.rendered) {
            void existing.render({ force: true });
        }
    }
    async _prepareContext(_options) {
        const ids = readKnownNpcIds();
        const npcs = listNpcsForGmDialog(game.actors ?? [], ids).map((npc, index, all) => {
            const actor = game.actors?.get?.(npc.actorId);
            const releasedIndex = ids.indexOf(npc.actorId);
            return {
                ...npc,
                img: resolveActorPortraitSrc(actor, npc.img),
                canUp: npc.released && releasedIndex > 0,
                canDown: npc.released && releasedIndex >= 0 && releasedIndex < ids.length - 1,
                firstHidden: !npc.released && !!all[index - 1]?.released,
            };
        });
        return {
            npcs,
            hasNpcs: npcs.length > 0,
            releasedCount: ids.length,
            filter: this.#filter,
            hint: loc('MASTERY.knownNpcs.gmHint', 'Released NPCs appear on the player portrait bar with name. Players can click a portrait to enlarge it.'),
            searchLabel: loc('MASTERY.knownNpcs.search', 'Search NPCs'),
            empty: loc('MASTERY.knownNpcs.emptyWorld', 'No NPC actors in this world.'),
            hiddenHeading: loc('MASTERY.knownNpcs.hiddenHeading', 'Not shown to players'),
            releaseLabel: loc('MASTERY.knownNpcs.release', 'Show to players'),
            hideLabel: loc('MASTERY.knownNpcs.hide', 'Hide from players'),
        };
    }
    async _onRender(_context, _options) {
        const root = this.element;
        if (!root)
            return;
        const input = root.querySelector('input[name="known-npc-filter"]');
        if (!input)
            return;
        input.value = this.#filter;
        const apply = () => {
            this.#filter = input.value;
            const q = this.#filter.trim().toLowerCase();
            root.querySelectorAll('.known-npcs-gm-row').forEach((row) => {
                const name = row.querySelector('strong')?.textContent?.toLowerCase() || '';
                const faction = row.querySelector('.known-npcs-gm-copy span')?.textContent?.toLowerCase() || '';
                row.hidden = !!(q && !name.includes(q) && !faction.includes(q));
            });
        };
        input.addEventListener('input', apply);
        apply();
    }
    async #setReleased(actorId, released) {
        if (!game.user?.isGM || !actorId)
            return;
        await setKnownNpcReleased(actorId, released);
        await KnownNpcsBar.refresh();
        await this.render({ force: true });
    }
    async #move(actorId, delta) {
        if (!game.user?.isGM || !actorId)
            return;
        await moveKnownNpc(actorId, delta);
        await KnownNpcsBar.refresh();
        await this.render({ force: true });
    }
}
//# sourceMappingURL=known-npcs-gm-dialog.js.map