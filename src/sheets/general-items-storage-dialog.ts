/**
 * General Items Storage Dialog
 * A modular window where players can drag items from storage to their inventory
 */

// Types are available globally in Foundry VTT

import { seedGeneralItemsStorage } from '../utils/seed-general-items';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const BaseDialog = HandlebarsApplicationMixin(ApplicationV2) as typeof ApplicationV2;

export class GeneralItemsStorageDialog extends BaseDialog {
  private _actor: Actor;
  private static _instance: GeneralItemsStorageDialog | null = null;

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

  constructor(actor: any, options: any = {}) {
    const mergedOptions = foundry.utils.mergeObject(GeneralItemsStorageDialog.DEFAULT_OPTIONS, options);
    super(mergedOptions);
    this._actor = actor;
  }

  get actor(): any {
    return this._actor;
  }

  async _prepareContext(_options: any): Promise<any> {
    console.log('Mastery System | [Storage Debug] _prepareContext start', {
      actorId: (this._actor as any)?.id,
      actorName: (this._actor as any)?.name,
      isGM: game.user?.isGM === true
    });
    // Automatically seed items if folder is empty or doesn't exist
    const createdItems = await seedGeneralItemsStorage();
    console.log('Mastery System | General Items Storage seed result:', createdItems.length);

    // Get all items from General Items Storage (world-level folder or compendium)
    const storageFolder = (game as any).folders?.find((f: any) => 
      f.name === 'General Items Storage' && f.type === 'Item'
    );

    let storageItems: any[] = [];
    if (createdItems.length > 0) {
      storageItems = createdItems;
    } else if (storageFolder) {
      const allItems = (game as any).items || [];
      storageItems = Array.from(allItems).filter((item: any) => 
        item.folder?.id === storageFolder.id
      );
    }
    console.log('Mastery System | Storage items in dialog:', storageItems.length);

    // Prepare equipment UI using the same logic as character sheet
    const items = this.#prepareItems();
    const equipmentUi = this.#prepareEquipmentUi(items);

    return {
      actor: this._actor,
      storageItems: storageItems.map((item: any) => ({
        id: item.id,
        name: item.name,
        img: item.img,
        type: item.type,
        system: item.system
      })),
      equipmentUi,
      hasStorage: storageItems.length > 0,
      isGM: game.user?.isGM === true
    };
  }

  /**
   * Prepare items organized by type (same as character sheet)
   */
  #prepareItems() {
    const powers: any[] = [];
    const echoes: any[] = [];
    const schticks: any[] = [];
    const artifacts: any[] = [];
    const conditions: any[] = [];
    const shields: any[] = [];
    const weapons: any[] = [];
    const armor: any[] = [];
    const gear: any[] = [];
    
    const items = (this._actor as any).items;
    const itemsArray = Array.isArray(items) ? items : Array.from(items.values());
    
    for (const item of itemsArray) {
      switch (item.type) {
        case 'power': powers.push(item); break;
        case 'gear': gear.push(item); break;
        case 'echo': echoes.push(item); break;
        case 'schtick': schticks.push(item); break;
        case 'artifact': artifacts.push(item); break;
        case 'condition': conditions.push(item); break;
        case 'weapon': weapons.push(item); break;
        case 'armor': armor.push(item); break;
        case 'shield': shields.push(item); break;
      }
    }
    
    return { powers, echoes, schticks, artifacts, conditions, shields, weapons, armor, gear };
  }

  /**
   * Prepare Equipment UI Context (same as character sheet)
   */
  #prepareEquipmentUi(items: any) {
    const BAND_COLS = 8;
    const BAND_ROWS = 9;
    const BAND_SIZE = BAND_COLS * BAND_ROWS;
    const STASH_COLS = 10;
    const STASH_ROWS = 6;
    const STASH_SIZE = STASH_COLS * STASH_ROWS;

    const equipmentItems: any[] = [
      ...(items.weapons || []),
      ...(items.armor || []),
      ...(items.shields || []),
      ...(items.gear || []),
      ...(items.artifacts || [])
    ];

    const toCells = (itemList: any[], size: number) => {
      const cells = Array(size).fill(null);
      let overflow = 0;
      for (let i = 0; i < itemList.length; i++) {
        if (i < size) {
          cells[i] = itemList[i];
        } else {
          overflow++;
        }
      }
      return { cells, overflow };
    };

    const inventoryItems: any[] = [];
    const stashItems: any[] = [];
    const notItems: any[] = [];
    const encItems: any[] = [];
    const heavyItems: any[] = [];
    const slotMap: Record<string, any> = {};

    for (const item of equipmentItems) {
      const flags = item.getFlag?.('mastery-system', 'equipment') || {};
      const container = flags.container ?? 'inventory';
      const band = flags.band ?? 'not';
      const slot = flags.slot ?? null;

      if (!slot && (item.system as any)?.equipped === true) {
        if (item.type === 'weapon') {
          slotMap['mainhand'] = item;
          continue;
        } else if (item.type === 'shield') {
          slotMap['offhand'] = item;
          continue;
        } else if (item.type === 'armor') {
          slotMap['chest'] = item;
          continue;
        }
      }

      // Treat backpack items as inventory items (they go into encumbrance bands)
      if (slot) {
        if (!slotMap[slot] || (slot === 'ring1' || slot === 'ring2')) {
          if (slot === 'ring1' || slot === 'ring2') {
            if (!slotMap[slot]) {
              slotMap[slot] = item;
            }
          } else {
            slotMap[slot] = item;
          }
        }
      } else if (container === 'stash') {
        stashItems.push(item);
      } else {
        inventoryItems.push(item);
        if (band === 'not') {
          notItems.push(item);
        } else if (band === 'enc') {
          encItems.push(item);
        } else if (band === 'heavy') {
          heavyItems.push(item);
        }
      }
    }

    const notCellsData = toCells(notItems, BAND_SIZE);
    const encCellsData = toCells(encItems, BAND_SIZE);
    const heavyCellsData = toCells(heavyItems, BAND_SIZE);
    const stashCellsData = toCells(stashItems, STASH_SIZE);

    const slotDefs = [
      { key: 'helmet', label: 'Helmet' },
      { key: 'necklace', label: 'Necklace' },
      { key: 'chest', label: 'Chest' },
      { key: 'cloak', label: 'Cloak' },
      { key: 'glove', label: 'Gloves' },
      { key: 'ring1', label: 'Ring' },
      { key: 'belt', label: 'Belt' },
      { key: 'mainhand', label: 'Mainhand' },
      { key: 'leggings', label: 'Leggings' },
      { key: 'offhand', label: 'Offhand' },
      { key: 'boot', label: 'Boots' }
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
  async #transferStorageItemToActorBand(worldItemId: string, targetBand: string): Promise<boolean> {
    const droppedItem = (game as any).items?.get(worldItemId);
    if (!droppedItem) {
      ui.notifications?.error('Item not found.');
      return false;
    }

    const actor = this._actor as any;
    let item: any = droppedItem;

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
    } else {
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

  #canModifyActorInventory(): boolean {
    const u = (game as any).user;
    const a = this._actor as any;
    if (!u) return false;
    if (u.isGM) return true;
    return a.isOwner === true;
  }

  async _onRender(element: HTMLElement, _options: any): Promise<void> {
    await super._onRender?.(element, _options);
    
    const html = $(element);
    console.log('Mastery System | [Storage Debug] _onRender', {
      elementExists: !!element,
      storageItems: html.find('.storage-item').length,
      actorId: (this._actor as any)?.id
    });
    
    // Enable drag and drop for storage items
    const storageItems = html.find('.storage-item');
    storageItems.each((_index, itemEl) => {
      const $item = $(itemEl);
      $item.find('*').addBack().attr('draggable', 'true');
    });
    console.log('Mastery System | [Storage Debug] Drag handlers bound', {
      storageItemCount: storageItems.length
    });

    const rootEl = (this as any).element?.[0] as HTMLElement | undefined;
    const appElement = (rootEl?.closest?.('#mastery-general-items-storage') as HTMLElement | null)
      || (document.getElementById('mastery-general-items-storage') as HTMLElement | null);
    const appJq = appElement ? $(appElement) : null;
    if (appElement && appJq) {
      appJq.find('> .window-resizable-handle').remove();
      appJq.append(
        '<div class="window-resizable-handle" title="Resize storage window"><i inert class="fa-solid fa-left-right fa-rotate-by"></i></div>'
      );
    }
    const resizeHandle = appJq?.find('> .window-resizable-handle').first();
    resizeHandle?.off('mousedown.storage-resize').on('mousedown.storage-resize', (e: JQuery.MouseDownEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!appElement) return;
      const startX = e.clientX;
      const startY = e.clientY;
      const rect = appElement.getBoundingClientRect();
      const startWidth = rect.width;
      const startHeight = rect.height;
      const minWidth = 260;
      const minHeight = 240;
      const maxWidth = Math.max(minWidth, Math.min(1200, window.innerWidth - 40));
      const maxHeight = Math.max(minHeight, Math.min(window.innerHeight - 40, 1200));

      const onMove = (moveEvent: MouseEvent) => {
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

    html.off('mousedown.storage').on('mousedown.storage', '.storage-item, .storage-item *', (e: any) => {
      const $item = $(e.target).closest('.storage-item');
      console.log('Mastery System | [Storage MouseDown]', {
        targetClass: (e.target as HTMLElement)?.className,
        itemId: $item.data('item-id')
      });
    });

    html.off('dragstart.storage').on('dragstart.storage', '.storage-item, .storage-item *', (e: any) => {
      const $item = $(e.target).closest('.storage-item');
      const itemId = $item.data('item-id');
      const sourceItem = (game as any).items?.get(itemId);
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

    html.off('dragend.storage').on('dragend.storage', '.storage-item, .storage-item *', (e: any) => {
      const $item = $(e.target).closest('.storage-item');
      console.log('Mastery System | [Storage DragEnd]', {
        itemId: $item.data('item-id')
      });
    });

    const ContextMenuCls = (foundry as any).applications?.ux?.ContextMenu;
    if (ContextMenuCls && this.#canModifyActorInventory()) {
      new ContextMenuCls(html, '.storage-item', [
        {
          name: 'Ins Inventar legen',
          icon: '<i class="fas fa-box-open"></i>',
          condition: () => this.#canModifyActorInventory(),
          callback: async (target: unknown) => {
            let el: HTMLElement | null = null;
            if (target && typeof (target as any).jquery === 'string') {
              el = ((target as JQuery)[0] as HTMLElement) || null;
            } else if (target instanceof HTMLElement) {
              el = target;
            }
            const tile = el?.closest?.('.storage-item') as HTMLElement | null;
            const itemId = tile?.dataset?.itemId;
            if (!itemId) return;
            if (await this.#transferStorageItemToActorBand(itemId, 'not')) {
              await this.render(true);
            }
          }
        }
      ] as any, { eventName: 'contextmenu' } as any);
    }

    // Enable drop on encumbrance bands
    html.find('.df-enc-band').each((_index, bandEl) => {
      const $band = $(bandEl);
      const band = $band.data('band');
      
      $band.on('dragover', (e: any) => {
        e.preventDefault();
        e.stopPropagation();
        $band.addClass('drag-over');
      });

      $band.on('dragleave', () => {
        $band.removeClass('drag-over');
      });

      $band.on('drop', async (e: any) => {
        e.preventDefault();
        e.stopPropagation();
        $band.removeClass('drag-over');
        console.log('Mastery System | [Storage Drop] Drop event', {
          band,
          actorId: (this._actor as any)?.id,
          hasDataTransfer: !!e.originalEvent?.dataTransfer,
          dataTransferTypes: Array.from(e.originalEvent?.dataTransfer?.types || [])
        });

        try {
          const TextEditorImpl = foundry.applications?.ux?.TextEditor?.implementation || TextEditor;
          const data = TextEditorImpl.getDragEventData(e.originalEvent ?? e);
          console.log('Mastery System | [Storage Drop] Drag data', data);

          let droppedItem: any = null;
          if (data?.uuid) {
            droppedItem = await fromUuid(data.uuid);
          } else if (data?.type === 'Item' && data?.id) {
            droppedItem = (game as any).items?.get(data.id);
          } else if (data?.data?._id) {
            droppedItem = (this._actor as any).items?.get(data.data._id);
          }

          console.log('Mastery System | [Storage Drop] Resolved item', {
            itemId: droppedItem?.id,
            itemName: droppedItem?.name,
            itemUuid: droppedItem?.uuid,
            itemParent: droppedItem?.parent?.id
          });
          if (!droppedItem) return;

          const targetBand = band || 'not';
          const ok = await this.#transferStorageItemToActorBand(droppedItem.id, targetBand);
          if (ok) await this.render(true);
        } catch (error) {
          console.error('Mastery System | Error dropping item into equipment band', error);
        }
      });
    });
  }

  /**
   * Show the dialog for an actor
   */
  static async showForActor(actor: any): Promise<void> {
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
