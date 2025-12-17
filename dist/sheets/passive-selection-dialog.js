/**
 * Passive Selection Dialog for Combat Start
 *
 * Shows an overlay at combat start where players select and activate their passive abilities.
 * Supports multiple characters per player with step-by-step navigation.
 */
export class PassiveSelectionDialog extends Application {
    currentIndex;
    pcs;
    resolve;
    static get defaultOptions() {
        const opts = super.defaultOptions;
        opts.id = 'mastery-passive-selection';
        opts.template = 'systems/mastery-system/templates/dialogs/passive-selection.hbs';
        opts.classes = ['mastery-system', 'passive-selection'];
        opts.width = 800;
        opts.height = 'auto';
        opts.title = 'Combat: Select Passives';
        opts.popOut = true;
        opts.resizable = false;
        return opts;
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
        // Import passive functions dynamically (they are compiled JS modules)
        const passivesModule = await import(new URL('../powers/passives.js', import.meta.url).toString());
        const { getPassiveSlots, getAvailablePassives } = passivesModule;
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
        element.replaceWith(html);
    }
    activateListeners(html) {
        super.activateListeners(html);
        // Slot a passive
        html.find('.js-slot-passive').on('click', async (ev) => {
            ev.preventDefault();
            const actor = this.currentActor;
            if (!actor)
                return;
            const slotIndex = Number($(ev.currentTarget).data('slot-index') ?? 0);
            const passiveId = String($(ev.currentTarget).data('passive-id') ?? '');
            if (!passiveId)
                return;
            const passivesModule = await import(new URL('../powers/passives.js', import.meta.url).toString());
            await passivesModule.slotPassive(actor, slotIndex, passiveId);
            this.render(false);
        });
        // Toggle passive active/inactive
        html.find('.js-toggle-passive').on('click', async (ev) => {
            ev.preventDefault();
            const actor = this.currentActor;
            if (!actor)
                return;
            const slotIndex = Number($(ev.currentTarget).data('slot-index') ?? 0);
            const passivesModule = await import(new URL('../powers/passives.js', import.meta.url).toString());
            await passivesModule.activatePassive(actor, slotIndex);
            this.render(false);
        });
        // Unslot a passive
        html.find('.js-unslot-passive').on('click', async (ev) => {
            ev.preventDefault();
            const actor = this.currentActor;
            if (!actor)
                return;
            const slotIndex = Number($(ev.currentTarget).data('slot-index') ?? 0);
            const passivesModule = await import(new URL('../powers/passives.js', import.meta.url).toString());
            await passivesModule.unslotPassive(actor, slotIndex);
            this.render(false);
        });
        // Next character
        html.find('.js-next-character').on('click', (ev) => {
            ev.preventDefault();
            if (this.currentIndex < this.pcs.length - 1) {
                this.currentIndex++;
                this.render(false);
            }
            else {
                this.close();
            }
        });
        // Previous character
        html.find('.js-prev-character').on('click', (ev) => {
            ev.preventDefault();
            if (this.currentIndex > 0) {
                this.currentIndex--;
                this.render(false);
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
        if (this.resolve) {
            this.resolve();
            this.resolve = undefined;
        }
        return super.close(options);
    }
}
//# sourceMappingURL=passive-selection-dialog.js.map