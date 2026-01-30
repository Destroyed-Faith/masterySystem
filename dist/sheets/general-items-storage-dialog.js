/**
 * General Items Storage Dialog
 * A modular window where players can drag items from storage to their inventory
 */
// Types are available globally in Foundry VTT
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const BaseDialog = HandlebarsApplicationMixin(ApplicationV2);
export class GeneralItemsStorageDialog extends BaseDialog {
    _actor;
    static _instance = null;
    static DEFAULT_OPTIONS = {
        id: 'mastery-general-items-storage',
        classes: ['mastery-system', 'general-items-storage'],
        width: 800,
        height: 600,
        resizable: true,
        title: 'General Items Storage'
    };
    static PARTS = {
        content: { template: 'systems/mastery-system/templates/dialogs/general-items-storage.hbs' }
    };
    constructor(actor, options = {}) {
        const mergedOptions = foundry.utils.mergeObject(GeneralItemsStorageDialog.DEFAULT_OPTIONS, options);
        super(mergedOptions);
        this._actor = actor;
    }
    get actor() {
        return this._actor;
    }
    async _prepareContext(_options) {
        // Get all items from General Items Storage (world-level folder or compendium)
        // For now, we'll use a world-level folder named "General Items Storage"
        const storageFolder = game.folders?.find((f) => f.name === 'General Items Storage' && f.type === 'Item');
        let storageItems = [];
        if (storageFolder) {
            storageItems = Array.from(game.items || []).filter((item) => item.folder?.id === storageFolder.id);
        }
        return {
            actor: this._actor,
            storageItems: storageItems.map((item) => ({
                id: item.id,
                name: item.name,
                img: item.img,
                type: item.type,
                system: item.system
            })),
            hasStorage: storageItems.length > 0
        };
    }
    async _onRender(element, _options) {
        await super._onRender?.(element, _options);
        const html = $(element);
        // Enable drag and drop
        html.find('.storage-item').each((_index, itemEl) => {
            const $item = $(itemEl);
            $item.attr('draggable', 'true');
            $item.on('dragstart', (e) => {
                const itemId = $item.data('item-id');
                if (e.originalEvent?.dataTransfer) {
                    e.originalEvent.dataTransfer.setData('text/plain', JSON.stringify({
                        type: 'Item',
                        id: itemId,
                        source: 'general-items-storage'
                    }));
                }
            });
        });
        // Make inventory area a drop zone
        const inventoryArea = html.find('.inventory-drop-zone');
        if (inventoryArea.length > 0) {
            inventoryArea.on('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                inventoryArea.addClass('drag-over');
            });
            inventoryArea.on('dragleave', () => {
                inventoryArea.removeClass('drag-over');
            });
            inventoryArea.on('drop', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                inventoryArea.removeClass('drag-over');
                try {
                    const data = JSON.parse(e.originalEvent?.dataTransfer?.getData('text/plain') || '{}');
                    if (data.source === 'general-items-storage' && data.id) {
                        const sourceItem = game.items?.get(data.id);
                        if (sourceItem) {
                            // Create a copy in the actor's inventory
                            const itemData = sourceItem.toObject();
                            await this._actor.createEmbeddedDocuments('Item', [itemData]);
                            ui.notifications?.info(`Added ${sourceItem.name} to inventory`);
                            await this.render();
                        }
                    }
                }
                catch (error) {
                    console.error('Mastery System | Error dropping item', error);
                }
            });
        }
    }
    /**
     * Show the dialog for an actor
     */
    static async showForActor(actor) {
        // Close existing instance if open
        if (GeneralItemsStorageDialog._instance) {
            await GeneralItemsStorageDialog._instance.close();
        }
        const dialog = new GeneralItemsStorageDialog(actor);
        GeneralItemsStorageDialog._instance = dialog;
        await dialog.render(true);
    }
}
//# sourceMappingURL=general-items-storage-dialog.js.map