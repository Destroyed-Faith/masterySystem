/**
 * General Items Storage Dialog
 * A modular window where players can drag items from storage to their inventory
 */

// Types are available globally in Foundry VTT

import {
  findFirstFit,
  fitsInGrid,
  parseInventorySize,
  rectsOverlap
} from '../utils/inventory-grid';
import { seedGeneralItemsStorage } from '../utils/seed-general-items';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const BaseDialog = HandlebarsApplicationMixin(ApplicationV2) as typeof ApplicationV2;

const BACKPACK_COLS = 10;
const BACKPACK_ROWS = 6;

export class GeneralItemsStorageDialog extends BaseDialog {
  private _actor: Actor;
  private static _instance: GeneralItemsStorageDialog | null = null;

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

  constructor(actor: any, options: any = {}) {
    const mergedOptions = foundry.utils.mergeObject(GeneralItemsStorageDialog.DEFAULT_OPTIONS, options);
    super(mergedOptions);
    this._actor = actor;
  }

  get actor(): any {
    return this._actor;
  }

  async _prepareContext(_options: any): Promise<any> {
    // Get all items from General Items Storage (world-level folder or compendium)
    // For now, we'll use a world-level folder named "General Items Storage"
    const storageFolder = (game as any).folders?.find((f: any) => 
      f.name === 'General Items Storage' && f.type === 'Item'
    );

    let storageItems: any[] = [];
    if (storageFolder) {
      storageItems = Array.from((game as any).items || []).filter((item: any) => 
        item.folder?.id === storageFolder.id
      );
    }

    const backpackItems = Array.from((this._actor as any).items || []).reduce((items: any[], item: any) => {
      const flags = item.getFlag?.('mastery-system', 'equipment') || {};
      if (flags.container !== 'backpack') {
        return items;
      }

      const { w, h } = parseInventorySize(item.system?.inventorySize);
      const x = Number(flags.x) || 1;
      const y = Number(flags.y) || 1;
      const img = item.img || 'icons/svg/item-bag.svg';
      items.push({
        id: item.id,
        name: item.name,
        img,
        isPlaceholder: !item.img || item.img.startsWith('icons/svg/'),
        x,
        y,
        w,
        h
      });
      return items;
    }, []);

    return {
      actor: this._actor,
      storageItems: storageItems.map((item: any) => ({
        id: item.id,
        name: item.name,
        img: item.img,
        type: item.type,
        system: item.system
      })),
      backpackItems,
      backpackCols: BACKPACK_COLS,
      backpackRows: BACKPACK_ROWS,
      hasStorage: storageItems.length > 0,
      isGM: game.user?.isGM === true
    };
  }

  async _onRender(element: HTMLElement, _options: any): Promise<void> {
    await super._onRender?.(element, _options);
    
    const html = $(element);
    
    // Enable drag and drop for storage items
    html.find('.storage-item').each((_index, itemEl) => {
      const $item = $(itemEl);
      $item.attr('draggable', 'true');
      
      $item.on('dragstart', (e: any) => {
        const itemId = $item.data('item-id');
        const sourceItem = (game as any).items?.get(itemId);
        if (!sourceItem || !e.originalEvent?.dataTransfer) return;
        const dragData = sourceItem.toDragData ? sourceItem.toDragData() : { type: 'Item', uuid: sourceItem.uuid };
        e.originalEvent.dataTransfer.setData('text/plain', JSON.stringify(dragData));
      });
    });

    // Enable drag for backpack items
    html.find('.backpack-grid .df-grid-item').each((_index, itemEl) => {
      const $item = $(itemEl);
      $item.attr('draggable', 'true');
      $item.on('dragstart', (e: any) => {
        const itemId = $item.data('item-id');
        const actorItem = (this._actor as any).items?.get(itemId);
        if (!actorItem || !e.originalEvent?.dataTransfer) return;
        const dragData = actorItem.toDragData ? actorItem.toDragData() : { type: 'Item', uuid: actorItem.uuid };
        e.originalEvent.dataTransfer.setData('text/plain', JSON.stringify(dragData));
      });
    });

    // Seed button (GM only)
    html.find('.seed-general-items').on('click', async (e: any) => {
      e.preventDefault();
      await seedGeneralItemsStorage();
      await this.render();
    });

    // Make backpack grid a drop zone
    const backpackGrid = html.find('.backpack-grid');
    if (backpackGrid.length > 0) {
      backpackGrid.on('dragover', (e: any) => {
        e.preventDefault();
        e.stopPropagation();
        backpackGrid.addClass('drag-over');
      });

      backpackGrid.on('dragleave', () => {
        backpackGrid.removeClass('drag-over');
      });

      backpackGrid.on('drop', async (e: any) => {
        e.preventDefault();
        e.stopPropagation();
        backpackGrid.removeClass('drag-over');

        try {
          const TextEditorImpl = foundry.applications?.ux?.TextEditor?.implementation || TextEditor;
          const data = TextEditorImpl.getDragEventData(e.originalEvent ?? e);

          let droppedItem: any = null;
          if (data?.uuid) {
            droppedItem = await fromUuid(data.uuid);
          } else if (data?.type === 'Item' && data?.id) {
            droppedItem = (game as any).items?.get(data.id);
          } else if (data?.data?._id) {
            droppedItem = (this._actor as any).items?.get(data.data._id);
          }

          if (!droppedItem) return;

          let item = droppedItem;
          if (!item.parent || item.parent.id !== (this._actor as any).id) {
            const [created] = await (this._actor as any).createEmbeddedDocuments('Item', [droppedItem.toObject()]);
            if (!created) return;
            item = created;
          }

          const gridEl = backpackGrid[0] as HTMLElement;
          const rect = gridEl.getBoundingClientRect();
          const cols = Number(gridEl.dataset.cols) || BACKPACK_COLS;
          const rows = Number(gridEl.dataset.rows) || BACKPACK_ROWS;
          const clientX = e.originalEvent?.clientX ?? e.clientX;
          const clientY = e.originalEvent?.clientY ?? e.clientY;
          const cellW = rect.width / cols;
          const cellH = rect.height / rows;
          let x = Math.floor((clientX - rect.left) / cellW) + 1;
          let y = Math.floor((clientY - rect.top) / cellH) + 1;

          const { w, h } = parseInventorySize(item.system?.inventorySize);
          const existingRects = Array.from((this._actor as any).items || [])
            .filter((actorItem: any) => {
              const flags = actorItem.getFlag?.('mastery-system', 'equipment') || {};
              return flags.container === 'backpack' && actorItem.id !== item.id;
            })
            .map((actorItem: any) => {
              const flags = actorItem.getFlag?.('mastery-system', 'equipment') || {};
              const size = parseInventorySize(actorItem.system?.inventorySize);
              return {
                x: Number(flags.x) || 1,
                y: Number(flags.y) || 1,
                w: size.w,
                h: size.h
              };
            });

          const currentFlags = item.getFlag?.('mastery-system', 'equipment') || {};
          const isExistingBackpackItem =
            item.parent?.id === (this._actor as any).id && currentFlags.container === 'backpack';

          const candidate = { x, y, w, h };
          const overlaps = existingRects.some(rect => rectsOverlap(rect, candidate));
          if (!fitsInGrid(x, y, w, h, cols, rows) || overlaps) {
            if (isExistingBackpackItem) {
              ui.notifications?.warn('Invalid backpack placement.');
              return;
            }
            const fit = findFirstFit(existingRects, w, h, cols, rows);
            if (!fit) {
              ui.notifications?.warn('No space available in the backpack.');
              return;
            }
            x = fit.x;
            y = fit.y;
          }

          await item.update({
            'flags.mastery-system.equipment': {
              ...currentFlags,
              container: 'backpack',
              x,
              y,
              band: null,
              slot: null
            },
            'system.equipped': false
          });

          await this.render();
        } catch (error) {
          console.error('Mastery System | Error dropping item into backpack', error);
        }
      });
    }
  }

  /**
   * Show the dialog for an actor
   */
  static async showForActor(actor: any): Promise<void> {
    // Close existing instance if open
    if (GeneralItemsStorageDialog._instance) {
      await GeneralItemsStorageDialog._instance.close();
    }

    const dialog = new GeneralItemsStorageDialog(actor);
    GeneralItemsStorageDialog._instance = dialog;
    await dialog.render(true);
  }
}
