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
    _preventAutoClose = false;
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
        console.log('Mastery System | [PASSIVE DIALOG DEBUG] showForCombat called', {
            combatId: combat.id,
            combatants: combat.combatants.size,
            userId: game.user?.id,
            isGM: game.user?.isGM
        });
        const user = game.user;
        if (!user) {
            console.log('Mastery System | [PASSIVE DIALOG DEBUG] No user found');
            return;
        }
        // Check if dialog is already open - use the app's ID to find it
        const existingApp = ui.windows[`mastery-passive-selection`];
        console.log('Mastery System | [PASSIVE DIALOG DEBUG] Checking for existing dialog', {
            existingApp: !!existingApp,
            rendered: existingApp?.rendered,
            appId: existingApp?.id
        });
        if (existingApp && existingApp.rendered) {
            console.log('Mastery System | [PASSIVE DIALOG DEBUG] Dialog already open, bringing to front');
            // Bring to front instead of creating new
            existingApp.bringToTop();
            return;
        }
        // Get all player character combatants owned by current user
        const pcs = combat.combatants.filter((c) => c.actor?.type === 'character' &&
            (user.isGM || c.actor?.isOwner));
        console.log('Mastery System | [PASSIVE DIALOG DEBUG] Filtered PCs', {
            totalCombatants: combat.combatants.size,
            pcsCount: pcs.length,
            pcs: pcs.map((c) => ({ id: c.id, actorName: c.actor?.name, isOwner: c.actor?.isOwner }))
        });
        if (pcs.length === 0) {
            console.log('Mastery System | [PASSIVE DIALOG DEBUG] No player characters for passive selection');
            return;
        }
        console.log('Mastery System | [PASSIVE DIALOG DEBUG] Creating new dialog instance');
        return new Promise(resolve => {
            const app = new PassiveSelectionDialog(pcs, resolve);
            // Set a flag to prevent auto-closing on actor updates
            app._preventAutoClose = true;
            console.log('Mastery System | [PASSIVE DIALOG DEBUG] Rendering dialog', {
                appId: app.id,
                preventAutoClose: app._preventAutoClose
            });
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
        console.log('Mastery System | [PASSIVE DIALOG DEBUG] _renderHTML called', {
            appId: this.id,
            rendered: this.rendered,
            currentIndex: this.currentIndex,
            pcsCount: this.pcs.length
        });
        // Cleanup any stray overlay elements before rendering
        const removedOverlays = $('body > .passive-selection-overlay').length;
        $('body > .passive-selection-overlay').remove();
        if (removedOverlays > 0) {
            console.log('Mastery System | [PASSIVE DIALOG DEBUG] Removed', removedOverlays, 'stray overlay elements');
        }
        const template = this.constructor.defaultOptions?.template || this.options.template;
        if (!template) {
            throw new Error('Template path is required');
        }
        const templateData = await this.getData();
        console.log('Mastery System | [PASSIVE DIALOG DEBUG] Template data prepared', {
            slotsCount: templateData.slots?.length || 0,
            availablePassivesCount: templateData.availablePassives?.length || 0,
            currentActor: templateData.actor?.name
        });
        const html = await foundry.applications.handlebars.renderTemplate(template, templateData);
        console.log('Mastery System | [PASSIVE DIALOG DEBUG] Template rendered', {
            htmlLength: html.length
        });
        return $(html);
    }
    async _replaceHTML(element, html) {
        console.log('Mastery System | [PASSIVE DIALOG DEBUG] _replaceHTML called', {
            appId: this.id,
            elementLength: element.length,
            htmlLength: html.length,
            elementParent: element.parent().length > 0 ? element.parent()[0].tagName : 'none'
        });
        // Only replace if element exists and is part of this app
        if (element.length > 0) {
            // Check if element is within this app's window
            const appElement = $(`#${this.id}`);
            const isInApp = element.closest(`#${this.id}`).length > 0 || element.parent().closest(`#${this.id}`).length > 0;
            console.log('Mastery System | [PASSIVE DIALOG DEBUG] Element check', {
                appElementExists: appElement.length > 0,
                isInApp: isInApp
            });
            if (appElement.length > 0 && isInApp) {
                console.log('Mastery System | [PASSIVE DIALOG DEBUG] Replacing element directly');
                element.replaceWith(html);
            }
            else {
                // If element is not part of this app, update the window content directly
                console.log('Mastery System | [PASSIVE DIALOG DEBUG] Updating window content directly');
                appElement.find('.window-content').html(html.html() || '');
            }
        }
        else {
            // If element is not found, update the app's window content
            console.log('Mastery System | [PASSIVE DIALOG DEBUG] Element not found, updating window content');
            const appElement = $(`#${this.id}`);
            if (appElement.length > 0) {
                appElement.find('.window-content').html(html.html() || '');
            }
            else {
                console.warn('Mastery System | [PASSIVE DIALOG DEBUG] App element not found!', {
                    appId: this.id,
                    allWindows: Object.keys(ui.windows || {})
                });
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
            console.log('Mastery System | [PASSIVE DIALOG DEBUG] Drop event triggered');
            ev.preventDefault();
            const actor = this.currentActor;
            if (!actor) {
                console.log('Mastery System | [PASSIVE DIALOG DEBUG] No current actor');
                return;
            }
            const slotIndex = Number($(ev.currentTarget).data('slot-index') ?? 0);
            const passiveId = ev.originalEvent?.dataTransfer?.getData('text/plain') || '';
            console.log('Mastery System | [PASSIVE DIALOG DEBUG] Drop details', {
                slotIndex,
                passiveId,
                actorName: actor.name,
                actorId: actor.id
            });
            if (!passiveId) {
                console.log('Mastery System | [PASSIVE DIALOG DEBUG] No passive ID in drop data');
                return;
            }
            // Only allow dropping into empty slots
            const slotElement = $(ev.currentTarget);
            if (!slotElement.hasClass('empty')) {
                console.log('Mastery System | [PASSIVE DIALOG DEBUG] Slot is not empty, ignoring drop');
                return;
            }
            console.log('Mastery System | [PASSIVE DIALOG DEBUG] Calling slotPassive');
            await slotPassive(actor, slotIndex, passiveId);
            console.log('Mastery System | [PASSIVE DIALOG DEBUG] slotPassive completed, rendering...');
            // Re-render to update the display - use minimal update to prevent closing
            try {
                console.log('Mastery System | [PASSIVE DIALOG DEBUG] Calling render(false)', {
                    appId: this.id,
                    rendered: this.rendered,
                    preventAutoClose: this._preventAutoClose
                });
                await this.render(false);
                console.log('Mastery System | [PASSIVE DIALOG DEBUG] Render completed successfully');
            }
            catch (error) {
                console.error('Mastery System | [PASSIVE DIALOG DEBUG] Error re-rendering passive dialog after slot', error);
                // If render fails, try to manually update the display
                const templateData = await this.getData();
                const template = this.constructor.defaultOptions?.template || this.options.template;
                if (template) {
                    console.log('Mastery System | [PASSIVE DIALOG DEBUG] Using fallback manual update');
                    const html = await foundry.applications.handlebars.renderTemplate(template, templateData);
                    const appElement = $(`#${this.id}`);
                    if (appElement.length > 0) {
                        appElement.find('.window-content').html(html);
                        this.activateListeners(appElement);
                        console.log('Mastery System | [PASSIVE DIALOG DEBUG] Fallback update completed');
                    }
                }
            }
        });
        // Toggle passive active/inactive
        html.find('.js-toggle-passive').on('click', async (ev) => {
            ev.preventDefault();
            const actor = this.currentActor;
            if (!actor)
                return;
            const slotIndex = Number($(ev.currentTarget).data('slot-index') ?? 0);
            await activatePassive(actor, slotIndex);
            try {
                await this.render(false);
            }
            catch (error) {
                console.error('Mastery System | Error re-rendering passive dialog after activate', error);
                // Manual update fallback
                const templateData = await this.getData();
                const template = this.constructor.defaultOptions?.template || this.options.template;
                if (template) {
                    const html = await foundry.applications.handlebars.renderTemplate(template, templateData);
                    const appElement = $(`#${this.id}`);
                    if (appElement.length > 0) {
                        appElement.find('.window-content').html(html);
                        this.activateListeners(appElement);
                    }
                }
            }
        });
        // Unslot a passive
        html.find('.js-unslot-passive').on('click', async (ev) => {
            console.log('Mastery System | [PASSIVE DIALOG DEBUG] Unslot button clicked');
            ev.preventDefault();
            const actor = this.currentActor;
            if (!actor) {
                console.log('Mastery System | [PASSIVE DIALOG DEBUG] No current actor for unslot');
                return;
            }
            const slotIndex = Number($(ev.currentTarget).data('slot-index') ?? 0);
            console.log('Mastery System | [PASSIVE DIALOG DEBUG] Unslotting passive', {
                slotIndex,
                actorName: actor.name,
                appId: this.id,
                rendered: this.rendered
            });
            await unslotPassive(actor, slotIndex);
            console.log('Mastery System | [PASSIVE DIALOG DEBUG] unslotPassive completed, rendering...');
            try {
                console.log('Mastery System | [PASSIVE DIALOG DEBUG] Calling render(false) after unslot', {
                    appId: this.id,
                    rendered: this.rendered,
                    preventAutoClose: this._preventAutoClose
                });
                await this.render(false);
                console.log('Mastery System | [PASSIVE DIALOG DEBUG] Render after unslot completed successfully');
            }
            catch (error) {
                console.error('Mastery System | [PASSIVE DIALOG DEBUG] Error re-rendering passive dialog after unslot', error);
                // Manual update fallback
                const templateData = await this.getData();
                const template = this.constructor.defaultOptions?.template || this.options.template;
                if (template) {
                    console.log('Mastery System | [PASSIVE DIALOG DEBUG] Using fallback manual update after unslot');
                    const html = await foundry.applications.handlebars.renderTemplate(template, templateData);
                    const appElement = $(`#${this.id}`);
                    if (appElement.length > 0) {
                        appElement.find('.window-content').html(html);
                        this.activateListeners(appElement);
                        console.log('Mastery System | [PASSIVE DIALOG DEBUG] Fallback update after unslot completed');
                    }
                }
            }
        });
        // Next character
        html.find('.js-next-character').on('click', async (ev) => {
            ev.preventDefault();
            if (this.currentIndex < this.pcs.length - 1) {
                this.currentIndex++;
                await this.render(false);
            }
            else {
                this.close({ intentional: true });
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
                this.close({ intentional: true });
            }
        });
    }
    async close(options) {
        console.log('Mastery System | [PASSIVE DIALOG DEBUG] close() called', {
            appId: this.id,
            rendered: this.rendered,
            preventAutoClose: this._preventAutoClose,
            options: options,
            stackTrace: new Error().stack
        });
        // Only close if not prevented
        if (this._preventAutoClose && options?.force !== true) {
            // Check if this is an intentional close (from button click)
            const isIntentionalClose = options?.intentional === true ||
                (options?.closeSource === 'user' || options?.closeSource === 'button');
            console.log('Mastery System | [PASSIVE DIALOG DEBUG] Close prevention check', {
                preventAutoClose: this._preventAutoClose,
                force: options?.force,
                intentional: options?.intentional,
                closeSource: options?.closeSource,
                isIntentionalClose
            });
            if (!isIntentionalClose) {
                // This might be an auto-close from actor update - prevent it
                console.log('Mastery System | [PASSIVE DIALOG DEBUG] Preventing auto-close of passive selection dialog');
                return;
            }
        }
        console.log('Mastery System | [PASSIVE DIALOG DEBUG] Proceeding with close');
        // Remove any leftover overlay elements from DOM (both inside and outside the app window)
        const removedOverlays1 = $('.passive-selection-overlay').length;
        $('.passive-selection-overlay').remove();
        const removedOverlays2 = $('body > .passive-selection-overlay').length;
        $('body > .passive-selection-overlay').remove();
        console.log('Mastery System | [PASSIVE DIALOG DEBUG] Removed overlay elements', {
            removedOverlays1,
            removedOverlays2
        });
        // Also remove from the app's element if it exists
        const appElement = $(`#${this.id}`);
        if (appElement.length > 0) {
            const removedFromApp = appElement.find('.passive-selection-overlay').length;
            appElement.find('.passive-selection-overlay').remove();
            console.log('Mastery System | [PASSIVE DIALOG DEBUG] Removed', removedFromApp, 'overlays from app element');
        }
        this._preventAutoClose = false;
        if (this.resolve) {
            console.log('Mastery System | [PASSIVE DIALOG DEBUG] Calling resolve callback');
            this.resolve();
            this.resolve = undefined;
        }
        console.log('Mastery System | [PASSIVE DIALOG DEBUG] Calling super.close()');
        return super.close(options);
    }
}
//# sourceMappingURL=passive-selection-dialog.js.map