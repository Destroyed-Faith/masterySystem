/**
 * Node Editor Dialog
 * Edit a single artifact node's data
 */

// Use ApplicationV2 with HandlebarsApplicationMixin if available
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const BaseDialog = HandlebarsApplicationMixin ? HandlebarsApplicationMixin(ApplicationV2) : ApplicationV2;

export class NodeEditor extends BaseDialog {
  private item: Item;

  constructor(item: Item) {
    super();
    this.item = item;
  }

  static get defaultOptions(): any {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: 'node-editor',
      title: 'Edit Artifact Node',
      template: 'systems/mastery-system/templates/artifacts/node-editor.hbs',
      classes: ['mastery-system', 'node-editor'],
      width: 600,
      height: 700,
      resizable: true
    });
  }

  getData(options?: any): any {
    const data: any = super.getData ? super.getData(options) : {};
    const system = this.item.system as any;
    
    data.item = this.item;
    data.level = system.level || 1;
    data.bonuses = system.bonuses || {
      attack: 0,
      damage: '',
      defense: 0,
      specials: []
    };
    data.lore = system.lore || '';
    data.requirements = system.requirements || {
      stones: 0,
      masteryRank: 1
    };
    data.description = system.description || '';
    
    return data;
  }

  activateListeners(html: JQuery): void {
    super.activateListeners(html);

    // Override close button to save
    html.find('button[data-button="save"]').on('click', async (e: JQuery.ClickEvent) => {
      e.preventDefault();
      await this.saveNode(html);
      (this as any).close();
    });

    html.find('button[data-button="cancel"]').on('click', () => {
      (this as any).close();
    });
  }

  async saveNode(html: JQuery): Promise<void> {
    const bonuses = {
      attack: parseInt(html.find('#node-attack').val() as string, 10) || 0,
      damage: (html.find('#node-damage').val() as string) || '',
      defense: parseInt(html.find('#node-defense').val() as string, 10) || 0,
      specials: (html.find('#node-specials').val() as string || '').split('\n').filter((s: string) => s.trim() !== '')
    };

    const requirements = {
      stones: parseInt(html.find('#node-stones').val() as string, 10) || 0,
      masteryRank: parseInt(html.find('#node-mastery-rank').val() as string, 10) || 1
    };

    const updates: any = {
      'system.bonuses': bonuses,
      'system.requirements': requirements,
      'system.lore': html.find('#node-lore').val() || '',
      'system.description': html.find('#node-description').val() || ''
    };

    await this.item.update(updates);
    ui.notifications?.info('Artifact node updated.');
  }
}

