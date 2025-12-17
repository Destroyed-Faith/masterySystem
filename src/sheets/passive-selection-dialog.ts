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
  private _preventAutoClose: boolean = false;

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
   * Show passive selection dialog for a single combatant
   * @param combatant - The combatant to show dialog for
   * @returns Promise that resolves when selection is complete
   */
  static async showForCombatant(combatant: Combatant): Promise<void> {
    console.log('Mastery System | [PASSIVE DIALOG DEBUG] showForCombatant called', {
      combatantId: combatant.id,
      actorId: combatant.actor?.id,
      actorName: (combatant.actor as any)?.name,
      userId: game.user?.id,
      isGM: game.user?.isGM
    });

    const user = game.user;
    if (!user) {
      console.log('Mastery System | [PASSIVE DIALOG DEBUG] No user found');
      return;
    }

    // Check if user owns this combatant
    if (!user.isGM && !combatant.actor?.isOwner) {
      console.log('Mastery System | [PASSIVE DIALOG DEBUG] User does not own this combatant');
      return;
    }

    // Check if dialog is already open
    const existingApp = (ui.windows as any)[`mastery-passive-selection`];
    if (existingApp && existingApp.rendered) {
      console.log('Mastery System | [PASSIVE DIALOG DEBUG] Dialog already open, bringing to front');
      existingApp.bringToTop();
      return;
    }

    return new Promise<void>(resolve => {
      const app = new PassiveSelectionDialog([combatant], resolve);
      (app as any)._preventAutoClose = true;
      console.log('Mastery System | [PASSIVE DIALOG DEBUG] Rendering dialog for single combatant', {
        appId: app.id,
        preventAutoClose: app._preventAutoClose
      });
      app.render(true);
    });
  }

  /**
   * Show passive selection dialog for all player-controlled combatants
   * @param combat - The active combat
   * @returns Promise that resolves when all players finish selection
   */
  static async showForCombat(combat: Combat): Promise<void> {
    console.log('Mastery System | [PASSIVE DIALOG DEBUG] showForCombat called', {
      combatId: combat.id,
      combatants: combat.combatants.size,
      userId: game.user?.id,
      isGM: game.user?.isGM
    });

    const user = game.user;
    if (!user) {
      console.log('Mastery System | [PASSIVE DIALOG DEBUG] No user found');
      return;
    }

    // Check if dialog is already open - use the app's ID to find it
    const existingApp = (ui.windows as any)[`mastery-passive-selection`];
    console.log('Mastery System | [PASSIVE DIALOG DEBUG] Checking for existing dialog', {
      existingApp: !!existingApp,
      rendered: existingApp?.rendered,
      appId: existingApp?.id
    });

    if (existingApp && existingApp.rendered) {
      console.log('Mastery System | [PASSIVE DIALOG DEBUG] Dialog already open, bringing to front');
      // Bring to front instead of creating new
      existingApp.bringToTop();
      return;
    }

    // Get all player character combatants owned by current user
    const pcs = combat.combatants.filter((c: Combatant) =>
      c.actor?.type === 'character' &&
      (user.isGM || c.actor?.isOwner)
    );

    console.log('Mastery System | [PASSIVE DIALOG DEBUG] Filtered PCs', {
      totalCombatants: combat.combatants.size,
      pcsCount: pcs.length,
      pcs: pcs.map((c: Combatant) => ({ id: c.id, actorName: (c.actor as any)?.name, isOwner: c.actor?.isOwner }))
    });

    if (pcs.length === 0) {
      console.log('Mastery System | [PASSIVE DIALOG DEBUG] No player characters for passive selection');
      return;
    }

    console.log('Mastery System | [PASSIVE DIALOG DEBUG] Creating new dialog instance');
    return new Promise<void>(resolve => {
      const app = new PassiveSelectionDialog(pcs, resolve);
      // Set a flag to prevent auto-closing on actor updates
      (app as any)._preventAutoClose = true;
      console.log('Mastery System | [PASSIVE DIALOG DEBUG] Rendering dialog', {
        appId: app.id,
        preventAutoClose: app._preventAutoClose
      });
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
    console.log('Mastery System | [PASSIVE DIALOG DEBUG] _renderHTML called', {
      appId: this.id,
      rendered: this.rendered,
      currentIndex: this.currentIndex,
      pcsCount: this.pcs.length,
      stackTrace: new Error().stack?.split('\n').slice(0, 5).join('\n')
    });

    // Cleanup ALL stray overlay elements before rendering (not just body >)
    const removedOverlays = $('.passive-selection-overlay').length;
    $('.passive-selection-overlay').remove();
    if (removedOverlays > 0) {
      console.log('Mastery System | [PASSIVE DIALOG DEBUG] Removed', removedOverlays, 'stray overlay elements');
    }
    
    const template = (this.constructor as any).defaultOptions?.template || this.options.template;
    if (!template) {
      console.error('Mastery System | [PASSIVE DIALOG DEBUG] Template path is missing!');
      throw new Error('Template path is required');
    }
    
    console.log('Mastery System | [PASSIVE DIALOG DEBUG] Getting template data...');
    const templateData = await this.getData();
    console.log('Mastery System | [PASSIVE DIALOG DEBUG] Template data prepared', {
      slotsCount: templateData.slots?.length || 0,
      availablePassivesCount: templateData.availablePassives?.length || 0,
      currentActor: (templateData.actor as any)?.name,
      hasActor: !!templateData.actor
    });
    
    console.log('Mastery System | [PASSIVE DIALOG DEBUG] Rendering template...');
    const html = await foundry.applications.handlebars.renderTemplate(template, templateData);
    console.log('Mastery System | [PASSIVE DIALOG DEBUG] Template rendered successfully', {
      htmlLength: html.length,
      htmlPreview: html.substring(0, 200)
    });
    return $(html);
  }

  async _replaceHTML(element: JQuery, html: JQuery): Promise<void> {
    console.log('Mastery System | [PASSIVE DIALOG DEBUG] _replaceHTML called', {
      appId: this.id,
      rendered: this.rendered,
      elementLength: element.length,
      htmlLength: html.length,
      elementParent: element.parent().length > 0 ? element.parent()[0].tagName : 'none',
      elementClasses: element.attr('class') || 'none',
      preventAutoClose: this._preventAutoClose,
      stackTrace: new Error().stack?.split('\n').slice(0, 8).join('\n')
    });

    // ALWAYS update the window content directly, never replace the element
    // This prevents multiple overlay elements from being created
    const appElement = $(`#${this.id}`);
    
    // Remove ALL stray overlay elements first
    const allOverlays = $('.passive-selection-overlay');
    const overlayCount = allOverlays.length;
    allOverlays.remove();
    if (overlayCount > 0) {
      console.log('Mastery System | [PASSIVE DIALOG DEBUG] Removed', overlayCount, 'stray overlay elements before replace');
    }
    
    if (appElement.length > 0) {
      const windowContent = appElement.find('.window-content');
      if (windowContent.length > 0) {
        console.log('Mastery System | [PASSIVE DIALOG DEBUG] Updating window content directly');
        windowContent.html(html.html() || '');
        
        // Reactivate listeners on the new content
        this.activateListeners(windowContent);
        console.log('Mastery System | [PASSIVE DIALOG DEBUG] Window content updated and listeners reactivated');
      } else {
        console.warn('Mastery System | [PASSIVE DIALOG DEBUG] Window content not found!');
        // Fallback: try to replace the element if window-content not found
        if (element.length > 0) {
          element.replaceWith(html);
          this.activateListeners(html);
        }
      }
    } else {
      console.warn('Mastery System | [PASSIVE DIALOG DEBUG] App element not found!', {
        appId: this.id,
        allWindows: Object.keys(ui.windows || {}),
        bodyChildren: $('body').children().length
      });
      // Last resort: replace the element directly
      if (element.length > 0) {
        element.replaceWith(html);
        this.activateListeners(html);
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
      console.log('Mastery System | [PASSIVE DIALOG DEBUG] Drop event triggered');
      ev.preventDefault();
      const actor = this.currentActor;
      if (!actor) {
        console.log('Mastery System | [PASSIVE DIALOG DEBUG] No current actor');
        return;
      }

      const slotIndex = Number($(ev.currentTarget).data('slot-index') ?? 0);
      const passiveId = ev.originalEvent?.dataTransfer?.getData('text/plain') || '';
      
      console.log('Mastery System | [PASSIVE DIALOG DEBUG] Drop details', {
        slotIndex,
        passiveId,
        actorName: (actor as any).name,
        actorId: (actor as any).id
      });
      
      if (!passiveId) {
        console.log('Mastery System | [PASSIVE DIALOG DEBUG] No passive ID in drop data');
        return;
      }

      // Only allow dropping into empty slots
      const slotElement = $(ev.currentTarget);
      if (!slotElement.hasClass('empty')) {
        console.log('Mastery System | [PASSIVE DIALOG DEBUG] Slot is not empty, ignoring drop');
        return;
      }

      console.log('Mastery System | [PASSIVE DIALOG DEBUG] Calling slotPassive');
      await slotPassive(actor, slotIndex, passiveId);
      console.log('Mastery System | [PASSIVE DIALOG DEBUG] slotPassive completed, updating display...');
      
      // Update display directly without using render() to prevent auto-close
      try {
        const templateData = await this.getData();
        const template = (this.constructor as any).defaultOptions?.template || this.options.template;
        if (template) {
          console.log('Mastery System | [PASSIVE DIALOG DEBUG] Manually updating display after slot');
          const html = await foundry.applications.handlebars.renderTemplate(template, templateData);
          const appElement = $(`#${this.id}`);
          if (appElement.length > 0) {
            // Remove any stray overlays first
            $('.passive-selection-overlay').not(appElement.find('.passive-selection-overlay')).remove();
            appElement.find('.window-content').html(html);
            this.activateListeners(appElement.find('.window-content'));
            console.log('Mastery System | [PASSIVE DIALOG DEBUG] Manual update completed');
          }
        }
      } catch (error) {
        console.error('Mastery System | [PASSIVE DIALOG DEBUG] Error updating display after slot', error);
      }
    });

    // Toggle passive active/inactive
    html.find('.js-toggle-passive').on('click', async (ev) => {
      ev.preventDefault();
      const actor = this.currentActor;
      if (!actor) return;

      const slotIndex = Number($(ev.currentTarget).data('slot-index') ?? 0);
      
      await activatePassive(actor, slotIndex);
      console.log('Mastery System | [PASSIVE DIALOG DEBUG] activatePassive completed, updating display...');
      try {
        const templateData = await this.getData();
        const template = (this.constructor as any).defaultOptions?.template || this.options.template;
        if (template) {
          const html = await foundry.applications.handlebars.renderTemplate(template, templateData);
          const appElement = $(`#${this.id}`);
          if (appElement.length > 0) {
            // Remove any stray overlays first
            $('.passive-selection-overlay').not(appElement.find('.passive-selection-overlay')).remove();
            appElement.find('.window-content').html(html);
            this.activateListeners(appElement.find('.window-content'));
            console.log('Mastery System | [PASSIVE DIALOG DEBUG] Display updated after toggle');
          }
        }
      } catch (error) {
        console.error('Mastery System | [PASSIVE DIALOG DEBUG] Error updating display after activate', error);
      }
    });

    // Unslot a passive
    html.find('.js-unslot-passive').on('click', async (ev) => {
      console.log('Mastery System | [PASSIVE DIALOG DEBUG] Unslot button clicked');
      ev.preventDefault();
      const actor = this.currentActor;
      if (!actor) {
        console.log('Mastery System | [PASSIVE DIALOG DEBUG] No current actor for unslot');
        return;
      }

      const slotIndex = Number($(ev.currentTarget).data('slot-index') ?? 0);
      console.log('Mastery System | [PASSIVE DIALOG DEBUG] Unslotting passive', {
        slotIndex,
        actorName: (actor as any).name,
        appId: this.id,
        rendered: this.rendered
      });
      
      await unslotPassive(actor, slotIndex);
      console.log('Mastery System | [PASSIVE DIALOG DEBUG] unslotPassive completed, updating display...');
      try {
        const templateData = await this.getData();
        const template = (this.constructor as any).defaultOptions?.template || this.options.template;
        if (template) {
          console.log('Mastery System | [PASSIVE DIALOG DEBUG] Manually updating display after unslot');
          const html = await foundry.applications.handlebars.renderTemplate(template, templateData);
          const appElement = $(`#${this.id}`);
          if (appElement.length > 0) {
            // Remove any stray overlays first
            $('.passive-selection-overlay').not(appElement.find('.passive-selection-overlay')).remove();
            appElement.find('.window-content').html(html);
            this.activateListeners(appElement.find('.window-content'));
            console.log('Mastery System | [PASSIVE DIALOG DEBUG] Display updated after unslot');
          }
        }
      } catch (error) {
        console.error('Mastery System | [PASSIVE DIALOG DEBUG] Error updating display after unslot', error);
      }
    });

    // Next character
    html.find('.js-next-character').on('click', async (ev) => {
      ev.preventDefault();
      if (this.currentIndex < this.pcs.length - 1) {
        this.currentIndex++;
        // Update display directly
        const templateData = await this.getData();
        const template = (this.constructor as any).defaultOptions?.template || this.options.template;
        if (template) {
          const html = await foundry.applications.handlebars.renderTemplate(template, templateData);
          const appElement = $(`#${this.id}`);
          if (appElement.length > 0) {
            $('.passive-selection-overlay').not(appElement.find('.passive-selection-overlay')).remove();
            appElement.find('.window-content').html(html);
            this.activateListeners(appElement.find('.window-content'));
          }
        }
      } else {
        this.close({ _explicitClose: true, intentional: true });
      }
    });

    // Previous character
    html.find('.js-prev-character').on('click', async (ev) => {
      ev.preventDefault();
      if (this.currentIndex > 0) {
        this.currentIndex--;
        // Update display directly
        const templateData = await this.getData();
        const template = (this.constructor as any).defaultOptions?.template || this.options.template;
        if (template) {
          const html = await foundry.applications.handlebars.renderTemplate(template, templateData);
          const appElement = $(`#${this.id}`);
          if (appElement.length > 0) {
            $('.passive-selection-overlay').not(appElement.find('.passive-selection-overlay')).remove();
            appElement.find('.window-content').html(html);
            this.activateListeners(appElement.find('.window-content'));
          }
        }
      }
    });

    // GM skip all
    html.find('.js-gm-skip').on('click', (ev) => {
      ev.preventDefault();
      if (game.user?.isGM) {
        this.close({ _explicitClose: true, intentional: true });
      }
    });

    // Close button
    html.find('.js-close-dialog').on('click', (ev) => {
      ev.preventDefault();
      console.log('Mastery System | [PASSIVE DIALOG DEBUG] Close button clicked');
      this.close({ _explicitClose: true, intentional: true, force: true });
    });
  }

  override async close(options?: any): Promise<void> {
    console.log('Mastery System | [PASSIVE DIALOG DEBUG] close() called', {
      appId: this.id,
      rendered: this.rendered,
      preventAutoClose: this._preventAutoClose,
      options: options,
      stackTrace: new Error().stack
    });

    // Only close if not prevented AND it's explicitly from our own buttons
    if (this._preventAutoClose && options?.force !== true) {
      // Only allow close if it's explicitly marked as intentional from our own code
      // Don't trust Foundry's automatic intentional flag, as it can be set by actor updates
      const isExplicitClose = options?._explicitClose === true;
      
      console.log('Mastery System | [PASSIVE DIALOG DEBUG] Close prevention check', {
        preventAutoClose: this._preventAutoClose,
        force: options?.force,
        intentional: options?.intentional,
        closeSource: options?.closeSource,
        explicitClose: options?._explicitClose,
        isExplicitClose
      });
      
      if (!isExplicitClose) {
        // This might be an auto-close from actor update or Foundry - prevent it
        console.log('Mastery System | [PASSIVE DIALOG DEBUG] Preventing auto-close of passive selection dialog');
        return;
      }
    }

    console.log('Mastery System | [PASSIVE DIALOG DEBUG] Proceeding with close');
    
    // Remove any leftover overlay elements from DOM (both inside and outside the app window)
    const removedOverlays1 = $('.passive-selection-overlay').length;
    $('.passive-selection-overlay').remove();
    const removedOverlays2 = $('body > .passive-selection-overlay').length;
    $('body > .passive-selection-overlay').remove();
    
    console.log('Mastery System | [PASSIVE DIALOG DEBUG] Removed overlay elements', {
      removedOverlays1,
      removedOverlays2
    });
    
    // Also remove from the app's element if it exists
    const appElement = $(`#${this.id}`);
    if (appElement.length > 0) {
      const removedFromApp = appElement.find('.passive-selection-overlay').length;
      appElement.find('.passive-selection-overlay').remove();
      console.log('Mastery System | [PASSIVE DIALOG DEBUG] Removed', removedFromApp, 'overlays from app element');
    }
    
    this._preventAutoClose = false;
    
    if (this.resolve) {
      console.log('Mastery System | [PASSIVE DIALOG DEBUG] Calling resolve callback');
      this.resolve();
      this.resolve = undefined;
    }
    
    console.log('Mastery System | [PASSIVE DIALOG DEBUG] Calling super.close()');
    return super.close(options);
  }
}

