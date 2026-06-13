/**
 * General Items Storage Dialog — homebrew "Stash" extension.
 *
 * The Players Guide (~7544–7805) only describes the **24 × 9** Inventory
 * Grid the character carries on their person. There is **no** canonical
 * stash / extra storage. The 10 × 6 stash exposed by this dialog is a
 * Foundry-side convenience that lets players park items they don't want
 * cluttering their carry inventory (downtime gear, party loot, etc.).
 *
 * It deliberately doesn't apply Encumbrance penalties (see
 * `src/utils/encumbrance.ts`) — only items in the carry grid contribute
 * to load zones. If a campaign wants Players-Guide-strict rules, simply
 * keep this dialog empty.
 */
// Types are available globally in Foundry VTT
import { seedGeneralItemsStorage } from '../utils/seed-general-items.js';
import { getItemIcon } from '../utils/item-icons.js';
import { matchesMasteryWeaponCatalog } from '../utils/weapons.js';
import { normalizeSlotKey } from '../utils/equip-slots.js';
import { isEchoArtifactInventoryHidden } from '../utils/echo-artifact-equip.js';
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
        title: 'General Items Storage',
        window: {
            title: 'General Items Storage'
        }
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
        console.log('Mastery System | [Storage Debug] _prepareContext start', {
            actorId: this._actor?.id,
            actorName: this._actor?.name,
            isGM: game.user?.isGM === true
        });
        // Automatically seed items if folder is empty or doesn't exist
        const createdItems = await seedGeneralItemsStorage();
        console.log('Mastery System | General Items Storage seed result:', createdItems.length);
        // Get all items from General Items Storage (world-level folder or compendium)
        const storageFolder = game.folders?.find((f) => f.name === 'General Items Storage' && f.type === 'Item');
        let storageItems = [];
        if (createdItems.length > 0) {
            storageItems = createdItems;
        }
        else if (storageFolder) {
            const allItems = game.items || [];
            storageItems = Array.from(allItems).filter((item) => item.folder?.id === storageFolder.id);
        }
        console.log('Mastery System | Storage items in dialog:', storageItems.length);
        const mapStorageRow = (item) => {
            const rawImg = item.img != null ? String(item.img).trim() : '';
            const img = rawImg ||
                getItemIcon(item.name, item.type, item.system) ||
                'icons/svg/item-bag.svg';
            return {
                id: item.id,
                name: item.name,
                img,
                type: item.type,
                system: item.system
            };
        };
        const byName = (a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' });
        const weapons = storageItems
            .filter((i) => i.type === 'weapon' || (i.type === 'gear' && matchesMasteryWeaponCatalog(i.name || '')))
            .sort(byName);
        const armorItems = storageItems.filter((i) => i.type === 'armor').sort(byName);
        const shields = storageItems.filter((i) => i.type === 'shield').sort(byName);
        const gearItems = storageItems
            .filter((i) => i.type === 'gear' && !matchesMasteryWeaponCatalog(i.name || ''))
            .sort(byName);
        const storageCategories = [
            { key: 'weapons', label: 'Weapons', items: weapons.map(mapStorageRow) },
            { key: 'armor', label: 'Armor', items: armorItems.map(mapStorageRow) },
            { key: 'shields', label: 'Shields', items: shields.map(mapStorageRow) },
            { key: 'gear', label: 'Gear', items: gearItems.map(mapStorageRow) }
        ];
        // Prepare equipment UI using the same logic as character sheet
        const items = this.#prepareItems();
        const equipmentUi = this.#prepareEquipmentUi(items);
        return {
            actor: this._actor,
            storageCategories,
            equipmentUi,
            hasStorage: storageItems.length > 0,
            isGM: game.user?.isGM === true
        };
    }
    /**
     * Prepare items organized by type (same as character sheet)
     */
    #prepareItems() {
        const powers = [];
        const echoes = [];
        const schticks = [];
        const artifacts = [];
        const conditions = [];
        const shields = [];
        const weapons = [];
        const armor = [];
        const gear = [];
        const items = this._actor.items;
        const itemsArray = Array.isArray(items) ? items : Array.from(items.values());
        for (const item of itemsArray) {
            switch (item.type) {
                case 'power':
                    powers.push(item);
                    break;
                case 'gear':
                    if (matchesMasteryWeaponCatalog(item.name || '')) {
                        weapons.push(item);
                    }
                    else {
                        gear.push(item);
                    }
                    break;
                case 'echo':
                    echoes.push(item);
                    break;
                case 'schtick':
                    schticks.push(item);
                    break;
                case 'artifact':
                    artifacts.push(item);
                    break;
                case 'condition':
                    conditions.push(item);
                    break;
                case 'weapon':
                    weapons.push(item);
                    break;
                case 'armor':
                    armor.push(item);
                    break;
                case 'shield':
                    shields.push(item);
                    break;
                default:
                    if (matchesMasteryWeaponCatalog(item.name || '')) {
                        weapons.push(item);
                    }
                    break;
            }
        }
        return { powers, echoes, schticks, artifacts, conditions, shields, weapons, armor, gear };
    }
    /**
     * Prepare Equipment UI Context (same as character sheet)
     */
    #prepareEquipmentUi(items) {
        const BAND_COLS = 8;
        const BAND_ROWS = 9;
        const BAND_SIZE = BAND_COLS * BAND_ROWS;
        const STASH_COLS = 10;
        const STASH_ROWS = 6;
        const STASH_SIZE = STASH_COLS * STASH_ROWS;
        const equipmentItems = [
            ...(items.weapons || []),
            ...(items.armor || []),
            ...(items.shields || []),
            ...(items.gear || []),
            ...(items.artifacts || [])
        ];
        const toCells = (itemList, size) => {
            const cells = Array(size).fill(null);
            let overflow = 0;
            for (let i = 0; i < itemList.length; i++) {
                if (i < size) {
                    cells[i] = itemList[i];
                }
                else {
                    overflow++;
                }
            }
            return { cells, overflow };
        };
        const inventoryItems = [];
        const stashItems = [];
        const notItems = [];
        const encItems = [];
        const heavyItems = [];
        const slotMap = {};
        for (const item of equipmentItems) {
            const flags = item.getFlag?.('mastery-system', 'equipment') || {};
            const container = flags.container ?? 'inventory';
            const band = flags.band ?? 'not';
            const slot = normalizeSlotKey(flags.slot) ?? null;
            if (!slot && item.system?.equipped === true) {
                if (item.type === 'weapon') {
                    slotMap['mainhand'] = item;
                    continue;
                }
                else if (item.type === 'shield') {
                    slotMap['offhand'] = item;
                    continue;
                }
                else if (item.type === 'armor') {
                    slotMap['body'] = item;
                    continue;
                }
            }
            // Treat backpack items as inventory items (they go into encumbrance bands)
            if (slot) {
                if (!slotMap[slot]) {
                    slotMap[slot] = item;
                }
            }
            else if (isEchoArtifactInventoryHidden(item)) {
                continue;
            }
            else if (container === 'stash') {
                stashItems.push(item);
            }
            else {
                inventoryItems.push(item);
                if (band === 'not') {
                    notItems.push(item);
                }
                else if (band === 'enc') {
                    encItems.push(item);
                }
                else if (band === 'heavy') {
                    heavyItems.push(item);
                }
            }
        }
        const notCellsData = toCells(notItems, BAND_SIZE);
        const encCellsData = toCells(encItems, BAND_SIZE);
        const heavyCellsData = toCells(heavyItems, BAND_SIZE);
        const stashCellsData = toCells(stashItems, STASH_SIZE);
        const slotDefs = [
            { key: 'mainhand', label: 'Main Hand' },
            { key: 'offhand', label: 'Off Hand' },
            { key: 'body', label: 'Body' },
            { key: 'head', label: 'Head' },
            { key: 'feet', label: 'Feet' },
            { key: 'amulet', label: 'Amulet' },
            { key: 'ring', label: 'Ring' },
        ];
        return {
            showStash: false,
            bandCols: BAND_COLS,
            bandRows: BAND_ROWS,
            stashCols: STASH_COLS,
            stashRows: STASH_ROWS,
            inventory: {
                notCells: notCellsData.cells,
                encCells: encCellsData.cells,
                heavyCells: heavyCellsData.cells,
                notOverflow: notCellsData.overflow,
                encOverflow: encCellsData.overflow,
                heavyOverflow: heavyCellsData.overflow
            },
            stash: {
                cells: stashCellsData.cells,
                overflow: stashCellsData.overflow
            },
            equipSlots: slotDefs.map(def => ({
                ...def,
                item: slotMap[def.key] || null
            }))
        };
    }
    /**
     * Copy or move a world Item from General Items Storage onto the actor's inventory band (same as drag-drop onto sheet).
     */
    async #transferStorageItemToActorBand(worldItemId, targetBand) {
        const droppedItem = game.items?.get(worldItemId);
        if (!droppedItem) {
            ui.notifications?.error('Item not found.');
            return false;
        }
        const actor = this._actor;
        let item = droppedItem;
        if (!item.parent || item.parent.id !== actor.id) {
            const itemData = foundry.utils.deepClone(droppedItem.toObject());
            delete itemData._id;
            delete itemData.folder;
            itemData.flags = {
                ...(itemData.flags || {}),
                'mastery-system': {
                    ...(itemData.flags?.['mastery-system'] || {}),
                    equipment: {
                        container: 'inventory',
                        band: targetBand,
                        slot: null
                    }
                }
            };
            itemData.system = {
                ...(itemData.system || {}),
                equipped: false
            };
            const [created] = await actor.createEmbeddedDocuments('Item', [itemData], { render: false });
            if (!created) {
                ui.notifications?.error(`Could not add ${droppedItem.name} to the character.`);
                return false;
            }
            item = created;
        }
        else {
            const currentFlags = item.getFlag?.('mastery-system', 'equipment') || {};
            await item.update({
                'flags.mastery-system.equipment': {
                    ...currentFlags,
                    container: 'inventory',
                    band: targetBand,
                    slot: null
                },
                'system.equipped': false
            });
        }
        ui.notifications?.info(`Added ${item.name} to inventory.`);
        if (actor.sheet?.rendered) {
            actor.sheet.render(false);
        }
        return true;
    }
    #canModifyActorInventory() {
        const u = game.user;
        const a = this._actor;
        if (!u)
            return false;
        if (u.isGM)
            return true;
        return a.isOwner === true;
    }
    /**
     * ApplicationV2 may pass a render root that does not contain our template; resolve the dialog content.
     */
    #getStorageScope(element) {
        const fromDialog = (root) => {
            const dlg = root?.querySelector?.('.general-items-storage-dialog');
            return dlg ? $(dlg) : $();
        };
        if (typeof document !== 'undefined') {
            const win = document.getElementById('mastery-general-items-storage');
            const $fromWin = fromDialog(win);
            if ($fromWin.length)
                return $fromWin;
        }
        if (element) {
            if (element.classList?.contains('general-items-storage-dialog')) {
                const $el = $(element);
                if ($el.length)
                    return $el;
            }
            const $fromEl = fromDialog(element);
            if ($fromEl.length)
                return $fromEl;
        }
        const rawApp = this.element;
        const appEl = rawApp && rawApp.jquery ? rawApp[0] : rawApp;
        const $fromApp = fromDialog(appEl ?? null);
        if ($fromApp.length)
            return $fromApp;
        return element ? $(element) : $();
    }
    async _onRender(element, _options) {
        await super._onRender?.(element, _options);
        const $scope = this.#getStorageScope(element);
        console.log('Mastery System | [Storage Debug] _onRender', {
            elementExists: !!element,
            scopeResolved: $scope.length > 0,
            storageItems: $scope.find('.storage-item').length,
            actorId: this._actor?.id
        });
        // Enable drag and drop for storage items
        const storageItemEls = $scope.find('.storage-item');
        storageItemEls.each((_index, itemEl) => {
            const $item = $(itemEl);
            $item.find('*').addBack().attr('draggable', 'true');
        });
        console.log('Mastery System | [Storage Debug] Drag handlers bound', {
            storageItemCount: storageItemEls.length
        });
        const rootEl = this.element?.[0];
        const appElement = rootEl?.closest?.('#mastery-general-items-storage')
            || document.getElementById('mastery-general-items-storage');
        const appJq = appElement ? $(appElement) : null;
        if (appElement && appJq) {
            appJq.find('> .window-resizable-handle').remove();
            appJq.append('<div class="window-resizable-handle" title="Resize storage window"><i inert class="fa-solid fa-left-right fa-rotate-by"></i></div>');
        }
        const resizeHandle = appJq?.find('> .window-resizable-handle').first();
        resizeHandle?.off('mousedown.storage-resize').on('mousedown.storage-resize', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!appElement)
                return;
            const startX = e.clientX;
            const startY = e.clientY;
            const rect = appElement.getBoundingClientRect();
            const startWidth = rect.width;
            const startHeight = rect.height;
            const minWidth = 260;
            const minHeight = 240;
            const maxWidth = Math.max(minWidth, Math.min(1200, window.innerWidth - 40));
            const maxHeight = Math.max(minHeight, Math.min(window.innerHeight - 40, 1200));
            const onMove = (moveEvent) => {
                const deltaX = moveEvent.clientX - startX;
                const deltaY = moveEvent.clientY - startY;
                const nextWidth = Math.min(maxWidth, Math.max(minWidth, startWidth + deltaX));
                const nextHeight = Math.min(maxHeight, Math.max(minHeight, startHeight + deltaY));
                appElement.style.width = `${nextWidth}px`;
                appElement.style.height = `${nextHeight}px`;
            };
            const onUp = () => {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
            };
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        });
        $scope.off('mousedown.storage').on('mousedown.storage', '.storage-item, .storage-item *', (e) => {
            const $item = $(e.target).closest('.storage-item');
            console.log('Mastery System | [Storage MouseDown]', {
                targetClass: e.target?.className,
                itemId: $item.attr('data-item-id')
            });
        });
        $scope.off('dragstart.storage').on('dragstart.storage', '.storage-item, .storage-item *', (e) => {
            const $item = $(e.target).closest('.storage-item');
            const itemId = $item.attr('data-item-id');
            const sourceItem = game.items?.get(itemId);
            const dataTransfer = e.originalEvent?.dataTransfer;
            if (!sourceItem || !dataTransfer) {
                console.log('Mastery System | [Storage DragStart] Missing source or dataTransfer', {
                    itemId,
                    hasSource: !!sourceItem,
                    hasDataTransfer: !!dataTransfer
                });
                return;
            }
            console.log('Mastery System | [Storage DragStart]', {
                itemId,
                itemName: sourceItem?.name,
                itemUuid: sourceItem?.uuid,
                itemType: sourceItem?.type
            });
            const dragData = sourceItem.toDragData ? sourceItem.toDragData() : { type: 'Item', uuid: sourceItem.uuid };
            const payload = JSON.stringify(dragData);
            dataTransfer.effectAllowed = 'copy';
            dataTransfer.setData('text/plain', payload);
            dataTransfer.setData('application/json', payload);
            console.log('Mastery System | [Storage DragStart] DataTransfer types', {
                types: Array.from(dataTransfer.types || [])
            });
        });
        $scope.off('dragend.storage').on('dragend.storage', '.storage-item, .storage-item *', (e) => {
            const $item = $(e.target).closest('.storage-item');
            console.log('Mastery System | [Storage DragEnd]', {
                itemId: $item.attr('data-item-id')
            });
        });
        const ContextMenuCls = foundry.applications?.ux?.ContextMenu;
        if (ContextMenuCls && this.#canModifyActorInventory() && $scope.length) {
            new ContextMenuCls($scope, '.storage-item', [
                {
                    name: 'Ins Inventar legen',
                    icon: '<i class="fas fa-box-open"></i>',
                    condition: () => this.#canModifyActorInventory(),
                    callback: async (target) => {
                        let el = null;
                        if (target && typeof target.jquery === 'string') {
                            el = target[0] || null;
                        }
                        else if (target instanceof HTMLElement) {
                            el = target;
                        }
                        const tile = el?.closest?.('.storage-item');
                        const itemId = tile?.dataset?.itemId;
                        if (!itemId)
                            return;
                        if (await this.#transferStorageItemToActorBand(itemId, 'not')) {
                            await this.render(true);
                        }
                    }
                }
            ], { eventName: 'contextmenu' });
        }
        // Enable drop on encumbrance bands (if this dialog embeds equipment UI in the future)
        $scope.find('.df-enc-band').each((_index, bandEl) => {
            const $band = $(bandEl);
            const band = $band.data('band');
            $band.on('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                $band.addClass('drag-over');
            });
            $band.on('dragleave', () => {
                $band.removeClass('drag-over');
            });
            $band.on('drop', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                $band.removeClass('drag-over');
                console.log('Mastery System | [Storage Drop] Drop event', {
                    band,
                    actorId: this._actor?.id,
                    hasDataTransfer: !!e.originalEvent?.dataTransfer,
                    dataTransferTypes: Array.from(e.originalEvent?.dataTransfer?.types || [])
                });
                try {
                    const TextEditorImpl = foundry.applications?.ux?.TextEditor?.implementation || TextEditor;
                    const data = TextEditorImpl.getDragEventData(e.originalEvent ?? e);
                    console.log('Mastery System | [Storage Drop] Drag data', data);
                    let droppedItem = null;
                    if (data?.uuid) {
                        droppedItem = await fromUuid(data.uuid);
                    }
                    else if (data?.type === 'Item' && data?.id) {
                        droppedItem = game.items?.get(data.id);
                    }
                    else if (data?.data?._id) {
                        droppedItem = this._actor.items?.get(data.data._id);
                    }
                    console.log('Mastery System | [Storage Drop] Resolved item', {
                        itemId: droppedItem?.id,
                        itemName: droppedItem?.name,
                        itemUuid: droppedItem?.uuid,
                        itemParent: droppedItem?.parent?.id
                    });
                    if (!droppedItem)
                        return;
                    const targetBand = band || 'not';
                    const ok = await this.#transferStorageItemToActorBand(droppedItem.id, targetBand);
                    if (ok)
                        await this.render(true);
                }
                catch (error) {
                    console.error('Mastery System | Error dropping item into equipment band', error);
                }
            });
        });
    }
    /**
     * Show the dialog for an actor
     */
    static async showForActor(actor) {
        // Close existing instance if open
        if (GeneralItemsStorageDialog._instance) {
            await GeneralItemsStorageDialog._instance.close();
        }
        console.log('Mastery System | [Storage Debug] Opening General Items Storage', {
            actorId: actor?.id,
            actorName: actor?.name,
            isGM: game.user?.isGM === true
        });
        const dialog = new GeneralItemsStorageDialog(actor);
        GeneralItemsStorageDialog._instance = dialog;
        await dialog.render(true);
    }
}
//# sourceMappingURL=general-items-storage-dialog.js.map