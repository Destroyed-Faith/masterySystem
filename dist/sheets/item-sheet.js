/**
 * Item Sheet for Mastery System
 * Generic sheet for all item types
 */
export class MasteryItemSheet extends foundry.appv1.sheets.ItemSheet {
    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ['mastery-system', 'sheet', 'item'],
            width: 520,
            height: 480,
            tabs: [
                {
                    navSelector: '.sheet-tabs',
                    contentSelector: '.sheet-body',
                    initial: 'description'
                }
            ]
        });
    }
    /** @override */
    get template() {
        return `systems/mastery-system/templates/item/${this.item.type}-sheet.hbs`;
    }
    /** @override */
    getData(options) {
        const context = super.getData(options);
        const itemData = context.item;
        // Add system data
        context.system = itemData.system;
        context.flags = itemData.flags;
        // Add configuration data
        context.config = CONFIG.MASTERY;
        // Enrich description for display
        context.enrichedDescription = TextEditor.enrichHTML(context.system.description || '');
        // Add type-specific data
        switch (this.item.type) {
            case 'special':
                context.powerTypes = ['active', 'buff', 'utility', 'passive', 'reaction', 'movement'];
                context.attributes = ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence', 'wits'];
                break;
            case 'echo':
                context.echoTypes = ['human', 'elf', 'dwarf', 'titanborn', 'centaur', 'other'];
                break;
            case 'condition':
                context.saveTypes = ['body', 'mind', 'spirit'];
                break;
        }
        return context;
    }
    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
        // Everything below here is only needed if the sheet is editable
        if (!this.isEditable)
            return;
        // Add tag
        html.find('.tag-add').on('click', this.#onTagAdd.bind(this));
        // Remove tag
        html.find('.tag-remove').on('click', this.#onTagRemove.bind(this));
        // Add special
        html.find('.special-add').on('click', this.#onSpecialAdd.bind(this));
        // Remove special
        html.find('.special-remove').on('click', this.#onSpecialRemove.bind(this));
    }
    /**
     * Add a tag
     */
    async #onTagAdd(event) {
        event.preventDefault();
        const tagName = await this.#promptForTag();
        if (!tagName)
            return;
        const tags = [...(this.item.system.tags || []), tagName];
        await this.item.update({ 'system.tags': tags });
    }
    /**
     * Prompt for tag name
     */
    async #promptForTag() {
        return new Promise((resolve) => {
            new Dialog({
                title: 'Add Tag',
                content: `
          <form>
            <div class="form-group">
              <label>Tag Name:</label>
              <input type="text" name="tagName" placeholder="e.g., spell, fire, charged"/>
            </div>
          </form>
        `,
                buttons: {
                    add: {
                        label: 'Add',
                        callback: (html) => {
                            const name = html.find('[name="tagName"]').val();
                            resolve(name.trim() || null);
                        }
                    },
                    cancel: {
                        label: 'Cancel',
                        callback: () => resolve(null)
                    }
                },
                default: 'add'
            }).render(true);
        });
    }
    /**
     * Remove a tag
     */
    async #onTagRemove(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const index = parseInt(element.dataset.index || '0');
        const tags = [...(this.item.system.tags || [])];
        tags.splice(index, 1);
        await this.item.update({ 'system.tags': tags });
    }
    /**
     * Add a special effect
     */
    async #onSpecialAdd(event) {
        event.preventDefault();
        const specialName = await this.#promptForSpecial();
        if (!specialName)
            return;
        const specials = [...(this.item.system.specials || []), specialName];
        await this.item.update({ 'system.specials': specials });
    }
    /**
     * Prompt for special effect name
     */
    async #promptForSpecial() {
        return new Promise((resolve) => {
            new Dialog({
                title: 'Add Special Effect',
                content: `
          <form>
            <div class="form-group">
              <label>Special Effect:</label>
              <input type="text" name="specialName" placeholder="e.g., Bleeding(2), Ignite(3)"/>
            </div>
          </form>
        `,
                buttons: {
                    add: {
                        label: 'Add',
                        callback: (html) => {
                            const name = html.find('[name="specialName"]').val();
                            resolve(name.trim() || null);
                        }
                    },
                    cancel: {
                        label: 'Cancel',
                        callback: () => resolve(null)
                    }
                },
                default: 'add'
            }).render(true);
        });
    }
    /**
     * Remove a special effect
     */
    async #onSpecialRemove(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const index = parseInt(element.dataset.index || '0');
        const specials = [...(this.item.system.specials || [])];
        specials.splice(index, 1);
        await this.item.update({ 'system.specials': specials });
    }
}
//# sourceMappingURL=item-sheet.js.map