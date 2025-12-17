/**
 * Passive Selection Dialog for Combat Start
 *
 * Shows an overlay at combat start where players select and activate their passive abilities.
 * Supports multiple characters per player with step-by-step navigation.
 */

import { getPassiveSlots, getAvailablePassives, slotPassive, activatePassive, unslotPassive } from '../powers/passives.js';

export class PassiveSelectionDialog extends Application {
  private currentIndex: number;
  private pcs: Combatant[];
  private resolve?: () => void;

  static override get defaultOptions(): any {
    const baseOptions = super.defaultOptions || {};
    return foundry.utils.mergeObject(baseOptions, {
      id: 'mastery-passive-selection',
      template: 'systems/mastery-system/templates/dialogs/passive-selection.hbs',
      classes: ['mastery-system', 'passive-selection'],
      width: 800,
      height: 'auto',
      title: 'Combat: Select Passives',
      popOut: true,
      resizable: false
    });
  }

  /**
   * Show passive selection dialog for all player-controlled combatants
   * @param combat - The active combat
   * @returns Promise that resolves when all players finish selection
   */
  static async showForCombat(combat: Combat): Promise<void> {
    const user = game.user;
    if (!user) return;

    // Check if dialog is already open - use the app's ID to find it
    const existingApp = (ui.windows as any)[`mastery-passive-selection`];
    if (existingApp && existingApp.rendered) {
      console.log('Mastery System | Passive selection dialog already open');
      // Bring to front instead of creating new
      existingApp.bringToTop();
      return;
    }

    // Get all player character combatants owned by current user
    const pcs = combat.combatants.filter((c: Combatant) =>
      c.actor?.type === 'character' &&
      (user.isGM || c.actor?.isOwner)
    );

    if (pcs.length === 0) {
      console.log('Mastery System | No player characters for passive selection');
      return;
    }

    return new Promise<void>(resolve => {
      const app = new PassiveSelectionDialog(pcs, resolve);
      app.render(true);
    });
  }

  constructor(pcs: Combatant[], resolve: () => void) {
    super({});
    this.pcs = pcs;
    this.currentIndex = 0;
    this.resolve = resolve;
  }

  get currentCombatant(): Combatant | null {
    return this.pcs[this.currentIndex] ?? null;
  }

  get currentActor(): Actor | null {
    return this.currentCombatant?.actor ?? null;
  }

  override async getData(): Promise<any> {
    const actor = this.currentActor;
    if (!actor) return {};

    const slots = getPassiveSlots(actor);
    const available = getAvailablePassives(actor);
    const masteryRank = (actor.system as any).mastery?.rank ?? 2;

    // Get used categories to filter available passives
    const usedCategories = slots
      .filter((s: any) => s.passive)
      .map((s: any) => s.passive!.category);

    const selectablePassives = available.filter((p: any) => 
      !usedCategories.includes(p.category)
    );

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
  async _renderHTML(_data?: any): Promise<JQuery> {
    const template = (this.constructor as any).defaultOptions?.template || this.options.template;
    if (!template) {
      throw new Error('Template path is required');
    }
    const templateData = await this.getData();
    const html = await foundry.applications.handlebars.renderTemplate(template, templateData);
    return $(html);
  }

  async _replaceHTML(element: JQuery, html: JQuery): Promise<void> {
    // Only replace if element exists and is part of this app
    if (element.length > 0 && element.closest(`#${this.id}`).length > 0) {
      element.replaceWith(html);
    } else {
      // If element is not found, just append to the app's element
      const appElement = $(`#${this.id}`);
      if (appElement.length > 0) {
        appElement.find('.window-content').html(html);
      }
    }
  }

  override activateListeners(html: JQuery): void {
    super.activateListeners(html);

    // Drag & Drop handlers
    html.find('.draggable-passive').on('dragstart', (ev: JQuery.DragStartEvent) => {
      const passiveId = String($(ev.currentTarget).data('passive-id') ?? '');
      if (ev.originalEvent?.dataTransfer) {
        ev.originalEvent.dataTransfer.effectAllowed = 'move';
        ev.originalEvent.dataTransfer.setData('text/plain', passiveId);
      }
      $(ev.currentTarget).addClass('dragging');
    });

    html.find('.draggable-passive').on('dragend', (ev: JQuery.DragEndEvent) => {
      $(ev.currentTarget).removeClass('dragging');
      html.find('.droppable-slot').removeClass('drag-over');
    });

    html.find('.droppable-slot').on('dragover', (ev: JQuery.DragOverEvent) => {
      ev.preventDefault();
      if (ev.originalEvent?.dataTransfer) {
        ev.originalEvent.dataTransfer.dropEffect = 'move';
      }
      $(ev.currentTarget).addClass('drag-over');
    });

    html.find('.droppable-slot').on('dragleave', (ev: JQuery.DragLeaveEvent) => {
      $(ev.currentTarget).removeClass('drag-over');
    });

    html.find('.droppable-slot').on('drop', async (ev: JQuery.DropEvent) => {
      ev.preventDefault();
      const actor = this.currentActor;
      if (!actor) return;

      const slotIndex = Number($(ev.currentTarget).data('slot-index') ?? 0);
      const passiveId = ev.originalEvent?.dataTransfer?.getData('text/plain') || '';
      
      if (!passiveId) return;

      // Only allow dropping into empty slots
      const slotElement = $(ev.currentTarget);
      if (!slotElement.hasClass('empty')) {
        return;
      }

      await slotPassive(actor, slotIndex, passiveId);
      // Re-render to update the display
      await this.render(false);
    });

    // Toggle passive active/inactive
    html.find('.js-toggle-passive').on('click', async (ev) => {
      ev.preventDefault();
      const actor = this.currentActor;
      if (!actor) return;

      const slotIndex = Number($(ev.currentTarget).data('slot-index') ?? 0);
      
      await activatePassive(actor, slotIndex);
      await this.render(false);
    });

    // Unslot a passive
    html.find('.js-unslot-passive').on('click', async (ev) => {
      ev.preventDefault();
      const actor = this.currentActor;
      if (!actor) return;

      const slotIndex = Number($(ev.currentTarget).data('slot-index') ?? 0);
      
      await unslotPassive(actor, slotIndex);
      await this.render(false);
    });

    // Next character
    html.find('.js-next-character').on('click', async (ev) => {
      ev.preventDefault();
      if (this.currentIndex < this.pcs.length - 1) {
        this.currentIndex++;
        await this.render(false);
      } else {
        this.close();
      }
    });

    // Previous character
    html.find('.js-prev-character').on('click', async (ev) => {
      ev.preventDefault();
      if (this.currentIndex > 0) {
        this.currentIndex--;
        await this.render(false);
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

  override async close(options?: any): Promise<void> {
    if (this.resolve) {
      this.resolve();
      this.resolve = undefined;
    }
    return super.close(options);
  }
}

