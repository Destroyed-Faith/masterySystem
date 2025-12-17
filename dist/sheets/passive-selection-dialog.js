/**
 * Passive Selection Dialog for Combat Start
 *
 * Shows an overlay at combat start where players select and activate their passive abilities.
 * Supports multiple characters per player with step-by-step navigation.
 */
import { getPassiveSlots, getAvailablePassives, slotPassive, activatePassive, unslotPassive } from '../powers/passives.js';
export class PassiveSelectionDialog extends Application {
    currentIndex;
    pcs;
    resolve;
    static get defaultOptions() {
        const baseOptions = super.defaultOptions || {};
        return foundry.utils.mergeObject(baseOptions, {
            id: 'mastery-passive-selection',
            template: 'systems/mastery-system/templates/dialogs/passive-selection.hbs',
            classes: ['mastery-system', 'passive-selection'],
            width: 800,
            height: 'auto',
            title: 'Combat: Select Passives',
            popOut: true,
            resizable: false
        });
    }
    /**
     * Show passive selection dialog for all player-controlled combatants
     * @param combat - The active combat
     * @returns Promise that resolves when all players finish selection
     */
    static async showForCombat(combat) {
        const user = game.user;
        if (!user)
            return;
        // Check if dialog is already open - use the app's ID to find it
        const existingApp = ui.windows[`mastery-passive-selection`];
        if (existingApp && existingApp.rendered) {
            console.log('Mastery System | Passive selection dialog already open');
            // Bring to front instead of creating new
            existingApp.bringToTop();
            return;
        }
        // Get all player character combatants owned by current user
        const pcs = combat.combatants.filter((c) => c.actor?.type === 'character' &&
            (user.isGM || c.actor?.isOwner));
        if (pcs.length === 0) {
            console.log('Mastery System | No player characters for passive selection');
            return;
        }
        return new Promise(resolve => {
            const app = new PassiveSelectionDialog(pcs, resolve);
            app.render(true);
        });
    }
    constructor(pcs, resolve) {
        super({});
        this.pcs = pcs;
        this.currentIndex = 0;
        this.resolve = resolve;
    }
    get currentCombatant() {
        return this.pcs[this.currentIndex] ?? null;
    }
    get currentActor() {
        return this.currentCombatant?.actor ?? null;
    }
    async getData() {
        const actor = this.currentActor;
        if (!actor)
            return {};
        const slots = getPassiveSlots(actor);
        const available = getAvailablePassives(actor);
        const masteryRank = actor.system.mastery?.rank ?? 2;
        // Get used categories to filter available passives
        const usedCategories = slots
            .filter((s) => s.passive)
            .map((s) => s.passive.category);
        const selectablePassives = available.filter((p) => !usedCategories.includes(p.category));
        return {
            actor,
            slots,
            availablePassives: selectablePassives,
            masteryRank,
            currentIndex: this.currentIndex + 1,
            total: this.pcs.length,
            isFirst: this.currentIndex === 0,
            isLast: this.currentIndex === this.pcs.length - 1,
            isGM: game.user?.isGM ?? false
        };
    }
    // Implement required methods for Foundry VTT v13 Application
    async _renderHTML(_data) {
        const template = this.constructor.defaultOptions?.template || this.options.template;
        if (!template) {
            throw new Error('Template path is required');
        }
        const templateData = await this.getData();
        const html = await foundry.applications.handlebars.renderTemplate(template, templateData);
        return $(html);
    }
    async _replaceHTML(element, html) {
        // Only replace if element exists and is part of this app
        if (element.length > 0) {
            // Check if element is within this app's window
            const appElement = $(`#${this.id}`);
            if (appElement.length > 0 && (element.closest(`#${this.id}`).length > 0 || element.parent().closest(`#${this.id}`).length > 0)) {
                element.replaceWith(html);
            }
            else {
                // If element is not part of this app, update the window content directly
                appElement.find('.window-content').html(html.html() || '');
            }
        }
        else {
            // If element is not found, update the app's window content
            const appElement = $(`#${this.id}`);
            if (appElement.length > 0) {
                appElement.find('.window-content').html(html.html() || '');
            }
        }
    }
    activateListeners(html) {
        super.activateListeners(html);
        // Drag & Drop handlers
        html.find('.draggable-passive').on('dragstart', (ev) => {
            const passiveId = String($(ev.currentTarget).data('passive-id') ?? '');
            if (ev.originalEvent?.dataTransfer) {
                ev.originalEvent.dataTransfer.effectAllowed = 'move';
                ev.originalEvent.dataTransfer.setData('text/plain', passiveId);
            }
            $(ev.currentTarget).addClass('dragging');
        });
        html.find('.draggable-passive').on('dragend', (ev) => {
            $(ev.currentTarget).removeClass('dragging');
            html.find('.droppable-slot').removeClass('drag-over');
        });
        html.find('.droppable-slot').on('dragover', (ev) => {
            ev.preventDefault();
            if (ev.originalEvent?.dataTransfer) {
                ev.originalEvent.dataTransfer.dropEffect = 'move';
            }
            $(ev.currentTarget).addClass('drag-over');
        });
        html.find('.droppable-slot').on('dragleave', (ev) => {
            $(ev.currentTarget).removeClass('drag-over');
        });
        html.find('.droppable-slot').on('drop', async (ev) => {
            ev.preventDefault();
            const actor = this.currentActor;
            if (!actor)
                return;
            const slotIndex = Number($(ev.currentTarget).data('slot-index') ?? 0);
            const passiveId = ev.originalEvent?.dataTransfer?.getData('text/plain') || '';
            if (!passiveId)
                return;
            // Only allow dropping into empty slots
            const slotElement = $(ev.currentTarget);
            if (!slotElement.hasClass('empty')) {
                return;
            }
            await slotPassive(actor, slotIndex, passiveId);
            // Re-render to update the display
            await this.render(false);
        });
        // Toggle passive active/inactive
        html.find('.js-toggle-passive').on('click', async (ev) => {
            ev.preventDefault();
            const actor = this.currentActor;
            if (!actor)
                return;
            const slotIndex = Number($(ev.currentTarget).data('slot-index') ?? 0);
            await activatePassive(actor, slotIndex);
            await this.render(false);
        });
        // Unslot a passive
        html.find('.js-unslot-passive').on('click', async (ev) => {
            ev.preventDefault();
            const actor = this.currentActor;
            if (!actor)
                return;
            const slotIndex = Number($(ev.currentTarget).data('slot-index') ?? 0);
            await unslotPassive(actor, slotIndex);
            await this.render(false);
        });
        // Next character
        html.find('.js-next-character').on('click', async (ev) => {
            ev.preventDefault();
            if (this.currentIndex < this.pcs.length - 1) {
                this.currentIndex++;
                await this.render(false);
            }
            else {
                this.close();
            }
        });
        // Previous character
        html.find('.js-prev-character').on('click', async (ev) => {
            ev.preventDefault();
            if (this.currentIndex > 0) {
                this.currentIndex--;
                await this.render(false);
            }
        });
        // GM skip all
        html.find('.js-gm-skip').on('click', (ev) => {
            ev.preventDefault();
            if (game.user?.isGM) {
                this.close();
            }
        });
    }
    async close(options) {
        // Remove any leftover overlay elements from DOM (both inside and outside the app window)
        $('.passive-selection-overlay').remove();
        $('body > .passive-selection-overlay').remove();
        // Also remove from the app's element if it exists
        const appElement = $(`#${this.id}`);
        if (appElement.length > 0) {
            appElement.find('.passive-selection-overlay').remove();
        }
        if (this.resolve) {
            this.resolve();
            this.resolve = undefined;
        }
        return super.close(options);
    }
}
//# sourceMappingURL=passive-selection-dialog.js.map