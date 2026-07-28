/**
 * Item Sheet for Mastery System
 * Generic sheet for all item types
 */

import { normalizeShieldTypeKey } from '../utils/equipment.js';
import { bindManualSheetTabs, bindEditImage } from './sheet-v2-compat.js';

const BaseItemSheet: any = foundry.applications.api.HandlebarsApplicationMixin(
  foundry.applications.sheets.ItemSheetV2,
);

export class MasteryItemSheet extends BaseItemSheet {
  /** Active tab, preserved across re-renders. */
  activeTab?: string;

  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ['mastery-system', 'sheet', 'item'],
    position: { width: 520, height: 480 },
    window: { resizable: true },
    form: { submitOnChange: true, closeOnSubmit: false },
  };

  /** @override */
  static PARTS = {
    // Template is resolved per item type in _configureRenderParts.
    body: { template: 'systems/mastery-system/templates/item/gear-sheet.hbs' },
  };

  /** Resolve the per-type template (V1 `get template()` equivalent). @override */
  _configureRenderParts(options: any) {
    const parts = super._configureRenderParts(options);
    parts.body.template = `systems/mastery-system/templates/item/${this.item.type}-sheet.hbs`;
    return parts;
  }

  /** @override */
  async _prepareContext(options?: any) {
    const item: any = this.item;
    const context: any = {
      item,
      document: item,
      editable: this.isEditable,
      owner: item.isOwner,
      limited: item.limited,
      cssClass: item.isOwner ? 'editable' : 'locked',
      options: this.options,
      title: this.title,
    };
    const itemData = context.item;
    
    // Add system data
    context.system = itemData.system;
    context.flags = itemData.flags;
    
    // Add configuration data
    context.config = (CONFIG as any).MASTERY;
    
    // Enrich description for display
    context.enrichedDescription = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
      context.system.description || '',
      { secrets: item.isOwner, relativeTo: item } as any,
    );
    
    // Add type-specific data
    switch (this.item.type) {
      case 'power':
        context.powerTypes = ['active', 'buff', 'utility', 'passive', 'reaction', 'movement'];
        context.attributes = ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence', 'wits'];
        context.radialMenuVisible = (itemData.system as any)?.showInRadialMenu !== false;
        break;
      case 'echo':
        context.echoTypes = ['human', 'elf', 'dwarf', 'titanborn', 'centaur', 'other'];
        break;
      case 'condition':
        context.saveTypes = ['body', 'mind', 'spirit'];
        break;
      case 'weapon': {
        const ws = itemData.system as any;
        context.innateAbilitiesText = (ws.innateAbilities || []).join('\n');
        context.specialsText = (ws.specials || []).join('\n');
        break;
      }
      case 'armor':
        break;
      case 'shield': {
        const st = (itemData.system as any).type;
        const k = normalizeShieldTypeKey(st);
        (context as any).shieldTypeUi = k || 'parry';
        break;
      }
      case 'gear':
        break;
    }
    
    return context;
  }

  /** ApplicationV2 render bridge: tabs, portrait editing, jQuery listeners. @override */
  async _onRender(context: any, options: any) {
    await super._onRender?.(context, options);
    const root = this.element as HTMLElement;
    if (!root) return;
    bindManualSheetTabs(root, this, 'description');
    bindEditImage(root, this.item);
    this.activateListeners($(root));
  }

  activateListeners(html: JQuery) {
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;
    
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

  async #onWeaponInnatesChange(event: JQuery.ChangeEvent) {
    const v = (event.currentTarget as HTMLTextAreaElement).value;
    const arr = v.split(/\n/).map((s) => s.trim()).filter((s) => s.length > 0);
    await this.item.update({ 'system.innateAbilities': arr });
  }

  async #onWeaponSpecialsChange(event: JQuery.ChangeEvent) {
    const v = (event.currentTarget as HTMLTextAreaElement).value;
    const arr = v.split(/\n/).map((s) => s.trim()).filter((s) => s.length > 0);
    await this.item.update({ 'system.specials': arr });
  }

  /**
   * Add a tag
   */
  async #onTagAdd(event: JQuery.ClickEvent) {
    event.preventDefault();
    
    const tagName = await this.#promptForTag();
    if (!tagName) return;
    
    const tags = [...(this.item.system.tags || []), tagName];
    await this.item.update({ 'system.tags': tags });
  }

  /**
   * Prompt for tag name
   */
  async #promptForTag(): Promise<string | null> {
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
            callback: (html: JQuery) => {
              const name = html.find('[name="tagName"]').val() as string;
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
  async #onTagRemove(event: JQuery.ClickEvent) {
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
  async #onSpecialAdd(event: JQuery.ClickEvent) {
    event.preventDefault();
    
    const specialName = await this.#promptForSpecial();
    if (!specialName) return;
    
    const specials = [...(this.item.system.specials || []), specialName];
    await this.item.update({ 'system.specials': specials });
  }

  /**
   * Prompt for special effect name
   */
  async #promptForSpecial(): Promise<string | null> {
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
            callback: (html: JQuery) => {
              const name = html.find('[name="specialName"]').val() as string;
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
  async #onSpecialRemove(event: JQuery.ClickEvent) {
    event.preventDefault();
    const element = event.currentTarget;
    const index = parseInt(element.dataset.index || '0');
    
    const specials = [...(this.item.system.specials || [])];
    specials.splice(index, 1);
    
    await this.item.update({ 'system.specials': specials });
  }
}

