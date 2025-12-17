/**
 * Combat Action Overlay
 * 
 * Shows an overlay during a character's turn displaying:
 * - Available actions (Attack/Movement/Reaction)
 * - Combat powers
 * - Resource status (Stones, Vitality, Stress)
 * - Quick action buttons
 */

const ApplicationV2 = (foundry.applications.api as any)?.ApplicationV2 || Application;

export class CombatActionOverlay extends ApplicationV2 {
  private actor: Actor;

  static get defaultOptions(): any {
    const baseOptions = super.defaultOptions || {};
    return foundry.utils.mergeObject(baseOptions, {
      id: 'mastery-combat-overlay',
      template: 'systems/mastery-system/templates/dialogs/combat-overlay.hbs',
      classes: ['mastery-system', 'combat-overlay'],
      width: 750,
      height: 'auto',
      popOut: true,
      title: 'Combat Actions',
      resizable: false
    });
  }

  /**
   * Show combat overlay for the current turn
   * @param combat - Active combat
   */
  static async showForCurrentTurn(combat: Combat): Promise<void> {
    const current = combat.combatant;
    const actor = current?.actor;
    
    if (!actor) {
      console.log('Mastery System | No actor for current combatant');
      return;
    }

    const user = game.user;
    if (!user) return;

    // Only show to owner or GM
    if (!user.isGM && !actor.isOwner) {
      console.log('Mastery System | User does not own current combatant');
      return;
    }

    const app = new CombatActionOverlay(actor);
    app.render(true);
  }

  constructor(actor: Actor, options: any = {}) {
    super(options);
    this.actor = actor;
  }

  /**
   * Prepare active powers for the actor (combat-usable powers)
   */
  private prepareActivePowers(): any[] {
    const powers: any[] = [];
    const actorItems = (this.actor as any).items;
    
    if (!actorItems) return powers;

    for (const item of actorItems) {
      if (item.type !== 'power') continue;
      
      const powerType = (item.system as any).powerType;
      
      // Filter combat-usable power types
      if (['movement', 'active', 'utility', 'reaction'].includes(powerType)) {
        powers.push({
          id: item.id,
          name: item.name,
          powerType,
          level: (item.system as any).level || 1,
          range: (item.system as any).range || '0m',
          stoneCost: (item.system as any).stoneCost || 0,
          description: (item.system as any).description || '',
          equipped: (item.system as any).equipped !== false
        });
      }
    }

    // Sort by power type then level
    powers.sort((a, b) => {
      const typeOrder: Record<string, number> = { 
        movement: 0, 
        active: 1, 
        utility: 2, 
        reaction: 3 
      };
      const typeCompare = (typeOrder[a.powerType] ?? 99) - (typeOrder[b.powerType] ?? 99);
      if (typeCompare !== 0) return typeCompare;
      return a.level - b.level;
    });

    return powers;
  }

  async getData(): Promise<any> {
    const system = this.actor.system as any;

    const actions = system.actions ?? {
      attack: { max: 1, used: 0 },
      movement: { max: 1, used: 0 },
      reaction: { max: 1, used: 0 }
    };

    const resources = system.resources ?? {
      stones: { current: 0, maximum: 0 },
      vitality: { current: 0, maximum: 0 },
      stress: { current: 0, maximum: 0 }
    };

    const masteryRank = system.mastery?.rank ?? 2;
    const charges = system.mastery?.charges ?? {
      current: masteryRank,
      maximum: masteryRank,
      temporary: 0
    };

    const powers = this.prepareActivePowers();

    // Group powers by type
    const powersByType = {
      movement: powers.filter(p => p.powerType === 'movement'),
      active: powers.filter(p => p.powerType === 'active'),
      utility: powers.filter(p => p.powerType === 'utility'),
      reaction: powers.filter(p => p.powerType === 'reaction')
    };

    return {
      actor: this.actor,
      actions,
      stones: resources.stones,
      vitality: resources.vitality,
      stress: resources.stress,
      charges,
      powers,
      powersByType,
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
    element.replaceWith(html);
  }

  activateListeners(html: JQuery): void {
    super.activateListeners(html);

    // Use a power
    html.find('.js-use-power').on('click', async (ev) => {
      ev.preventDefault();
      const powerId = String($(ev.currentTarget).data('power-id') ?? '');
      const powerType = String($(ev.currentTarget).data('power-type') ?? '');
      
      if (!powerId) return;

      const actorItems = (this.actor as any).items;
      const item = actorItems?.get(powerId);
      
      if (!item) {
        ui.notifications?.error('Power not found!');
        return;
      }

      // Use different handlers based on power type
      try {
        switch (powerType) {
          case 'movement':
            const movementModule = await import('systems/mastery-system/dist/powers/movement.js' as any);
            await movementModule.useMovementPower(this.actor, item);
            break;
          
          case 'utility':
            const utilityModule = await import('systems/mastery-system/dist/powers/utilities.js' as any);
            await utilityModule.activateUtility(this.actor, item, null);
            break;
          
          default:
            ui.notifications?.info(`Using power: ${item.name} (${powerType})`);
            // For active/reaction powers, you can add specific logic later
            break;
        }
        
        this.render(false);
      } catch (error) {
        console.error('Mastery System | Error using power:', error);
        ui.notifications?.error(`Failed to use power: ${item.name}`);
      }
    });

    // Mark action as used
    html.find('.js-use-action').on('click', async (ev) => {
      ev.preventDefault();
      const actionType = String($(ev.currentTarget).data('action-type') ?? '');
      
      if (!actionType) return;

      const actionsModule = await import('systems/mastery-system/dist/combat/actions.js' as any);
      const success = await actionsModule.useAction(this.actor, actionType, 1);
      
      if (success) {
        this.render(false);
      }
    });

    // Undo action
    html.find('.js-undo-action').on('click', async (ev) => {
      ev.preventDefault();
      const actionType = String($(ev.currentTarget).data('action-type') ?? '');
      
      if (!actionType) return;

      const system = this.actor.system as any;
      const action = system.actions?.[actionType];
      
      if (!action || action.used <= 0) {
        ui.notifications?.warn(`No ${actionType} actions to undo!`);
        return;
      }

      await this.actor.update({
        [`system.actions.${actionType}.used`]: action.used - 1
      });
      
      this.render(false);
    });

    // Roll attack
    html.find('.js-roll-attack').on('click', async (ev) => {
      ev.preventDefault();
      // TODO: Open attack dialog or roll handler
      ui.notifications?.info('Attack roll - implement attack dialog');
    });

    // End turn (close overlay)
    html.find('.js-end-turn').on('click', (ev) => {
      ev.preventDefault();
      this.close();
    });

    // Refresh overlay
    html.find('.js-refresh').on('click', (ev) => {
      ev.preventDefault();
      this.render(false);
    });
  }
}

