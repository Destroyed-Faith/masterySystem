/**
 * Store Dialog (GM Only)
 * A modular window where the GM can manage items in the store
 * Players can drag items from the store to their inventory
 */
// Types are available globally in Foundry VTT
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const BaseDialog = HandlebarsApplicationMixin(ApplicationV2);
export class StoreDialog extends BaseDialog {
    _actor;
    static _instance = null;
    static DEFAULT_OPTIONS = {
        id: 'mastery-store',
        classes: ['mastery-system', 'store-dialog'],
        width: 800,
        height: 600,
        resizable: true,
        title: 'Store (GM Only)'
    };
    static PARTS = {
        content: { template: 'systems/mastery-system/templates/dialogs/store.hbs' }
    };
    constructor(actor, options = {}) {
        const mergedOptions = foundry.utils.mergeObject(StoreDialog.DEFAULT_OPTIONS, options);
        super(mergedOptions);
        this._actor = actor;
    }
    get actor() {
        return this._actor;
    }
    async _prepareContext(_options) {
        if (!game.user?.isGM) {
            return {
                actor: this._actor,
                storeItems: [],
                hasStore: false,
                isGM: false
            };
        }
        // Get all items from Store (world-level folder named "Store")
        const storeFolder = game.folders?.find((f) => f.name === 'Store' && f.type === 'Item');
        let storeItems = [];
        if (storeFolder) {
            storeItems = Array.from(game.items || []).filter((item) => item.folder?.id === storeFolder.id);
        }
        return {
            actor: this._actor,
            storeItems: storeItems.map((item) => ({
                id: item.id,
                name: item.name,
                img: item.img,
                type: item.type,
                system: item.system
            })),
            hasStore: storeItems.length > 0,
            isGM: true
        };
    }
    async _onRender(element, _options) {
        await super._onRender?.(element, _options);
        if (!game.user?.isGM) {
            return;
        }
        const html = $(element);
        // Enable drag and drop for store items
        html.find('.store-item').each((_index, itemEl) => {
            const $item = $(itemEl);
            $item.attr('draggable', 'true');
            $item.on('dragstart', (e) => {
                const itemId = $item.data('item-id');
                if (e.originalEvent?.dataTransfer) {
                    e.originalEvent.dataTransfer.setData('text/plain', JSON.stringify({
                        type: 'Item',
                        id: itemId,
                        source: 'store'
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
                    if (data.source === 'store' && data.id) {
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
     * Show the dialog for an actor (GM only)
     */
    static async showForActor(actor) {
        if (!game.user?.isGM) {
            ui.notifications?.warn('Only the GM can access the Store');
            return;
        }
        // Close existing instance if open
        if (StoreDialog._instance) {
            await StoreDialog._instance.close();
        }
        const dialog = new StoreDialog(actor);
        StoreDialog._instance = dialog;
        await dialog.render(true);
    }
}
//# sourceMappingURL=store-dialog.js.map