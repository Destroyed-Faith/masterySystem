/**
 * Item Sheet for Mastery System
 * Generic sheet for all item types
 */
import { normalizeShieldTypeKey } from '../utils/equipment.js';
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
        context.enrichedDescription = foundry.applications.ux.TextEditor.implementation.enrichHTML(context.system.description || '');
        // Add type-specific data
        switch (this.item.type) {
            case 'power':
                context.powerTypes = ['active', 'buff', 'utility', 'passive', 'reaction', 'movement'];
                context.attributes = ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence', 'wits'];
                context.radialMenuVisible = itemData.system?.showInRadialMenu !== false;
                break;
            case 'echo':
                context.echoTypes = ['human', 'elf', 'dwarf', 'titanborn', 'centaur', 'other'];
                break;
            case 'condition':
                context.saveTypes = ['body', 'mind', 'spirit'];
                break;
            case 'weapon': {
                const ws = itemData.system;
                context.innateAbilitiesText = (ws.innateAbilities || []).join('\n');
                context.specialsText = (ws.specials || []).join('\n');
                break;
            }
            case 'armor':
                break;
            case 'shield': {
                const st = itemData.system.type;
                const k = normalizeShieldTypeKey(st);
                context.shieldTypeUi = k || 'parry';
                break;
            }
            case 'gear':
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
        if (this.item.type === 'weapon') {
            html.find('.js-weapon-innates').on('change', this.#onWeaponInnatesChange.bind(this));
            html.find('.js-weapon-specials').on('change', this.#onWeaponSpecialsChange.bind(this));
        }
    }
    async #onWeaponInnatesChange(event) {
        const v = event.currentTarget.value;
        const arr = v.split(/\n/).map((s) => s.trim()).filter((s) => s.length > 0);
        await this.item.update({ 'system.innateAbilities': arr });
    }
    async #onWeaponSpecialsChange(event) {
        const v = event.currentTarget.value;
        const arr = v.split(/\n/).map((s) => s.trim()).filter((s) => s.length > 0);
        await this.item.update({ 'system.specials': arr });
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
              <input type="text" name="specialName" placeholder="e.g., Lacerate(2), Ruin(3)"/>
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