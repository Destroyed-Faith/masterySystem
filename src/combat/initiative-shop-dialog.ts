/**
 * Initiative Shop Dialog
 * Allows players to spend initiative points on bonuses
 */

import { INITIATIVE_SHOP } from '../utils/constants.js';
import { InitiativeRollBreakdown } from './initiative-roll.js';

const ApplicationV2 = (foundry.applications.api as any)?.ApplicationV2 || Application;

export interface InitiativeShopPurchase {
  extraMovement: number;      // Number of movement purchases (each = +2m)
  initiativeSwap: boolean;     // Unlock initiative swap
  extraAttack: boolean;        // Gain extra attack
}

export interface InitiativeShopContext extends InitiativeRollBreakdown {
  // Context includes: baseInitiative, diceTotal, totalInitiative, masteryRank, rollResult
}

export class InitiativeShopDialog extends ApplicationV2 {
  private combatant: Combatant;
  private combat: Combat;
  private context: InitiativeShopContext;
  private resolve?: (purchases: InitiativeShopPurchase | null) => void;
  private purchases: InitiativeShopPurchase;

  static get defaultOptions(): any {
    const baseOptions = super.defaultOptions || {};
    return foundry.utils.mergeObject(baseOptions, {
      id: 'mastery-initiative-shop',
      template: 'systems/mastery-system/templates/dialogs/initiative-shop.hbs',
      classes: ['mastery-system', 'initiative-shop'],
      width: 500,
      height: 'auto',
      title: 'Initiative Shop',
      popOut: true,
      resizable: false
    });
  }

  /**
   * Show initiative shop dialog for a combatant
   */
  static async showForCombatant(combatant: Combatant, context: InitiativeShopContext, combat: Combat): Promise<InitiativeShopPurchase | null> {
    return new Promise<InitiativeShopPurchase | null>(resolve => {
      const app = new InitiativeShopDialog(combatant, context, combat, resolve);
      app.render(true);
    });
  }

  constructor(combatant: Combatant, context: InitiativeShopContext, combat: Combat, resolve: (purchases: InitiativeShopPurchase | null) => void) {
    super({});
    this.combatant = combatant;
    this.combat = combat;
    this.context = context;
    this.resolve = resolve;
    this.purchases = {
      extraMovement: 0,
      initiativeSwap: false,
      extraAttack: false
    };
  }

  async getData(): Promise<any> {
    const actor = this.combatant.actor;
    if (!actor) return {};

    const totalCost = this.calculateTotalCost();
    const remainingInitiative = Math.max(0, this.context.totalInitiative - totalCost);

    return {
      actor,
      combatant: this.combatant,
      round: this.combat.round || 1,
      // Breakdown display
      baseInitiative: this.context.baseInitiative,
      diceTotal: this.context.diceTotal,
      masteryRank: this.context.masteryRank,
      totalInitiative: this.context.totalInitiative,
      // Remaining initiative (for order)
      remainingInitiative,
      // Purchases
      purchases: this.purchases,
      // Costs
      costs: {
        movement: INITIATIVE_SHOP.MOVEMENT.COST,
        movementIncrement: INITIATIVE_SHOP.MOVEMENT.INCREMENT,
        swap: INITIATIVE_SHOP.SWAP.COST,
        extraAttack: INITIATIVE_SHOP.EXTRA_ATTACK.COST
      },
      // Calculated values
      movementSpent: this.purchases.extraMovement * INITIATIVE_SHOP.MOVEMENT.COST,
      movementBonus: this.purchases.extraMovement * INITIATIVE_SHOP.MOVEMENT.INCREMENT
    };
  }

  // Implement required methods for Foundry VTT v13 Application
  async _renderHTML(_data?: any): Promise<JQuery> {
    // Remove ALL stray initiative shop dialog elements before rendering
    $('body > .initiative-shop-dialog').remove();
    $('.initiative-shop-dialog').not(`#${this.id} .initiative-shop-dialog`).remove();
    
    const template = (this.constructor as any).defaultOptions?.template || this.options.template;
    if (!template) {
      throw new Error('Template path is required');
    }
    const templateData = await this.getData();
    const html = await foundry.applications.handlebars.renderTemplate(template, templateData);
    return $(html);
  }

  async _replaceHTML(element: JQuery, html: JQuery): Promise<void> {
    // Remove ALL stray initiative shop dialog elements first
    $('body > .initiative-shop-dialog').remove();
    $('.initiative-shop-dialog').not(`#${this.id} .initiative-shop-dialog`).remove();
    
    // Always update the window content directly, never replace the element
    const appElement = $(`#${this.id}`);
    
    if (appElement.length > 0) {
      const windowContent = appElement.find('.window-content');
      if (windowContent.length > 0) {
        windowContent.html(html.html() || '');
        // Reactivate listeners on the new content
        this.activateListeners(windowContent);
        return;
      }
    }
    
    // Fallback: replace the element if window-content not found
    if (element.length > 0) {
      element.replaceWith(html);
      this.activateListeners(html);
    }
  }

  /**
   * Update window content directly without triggering full render cycle
   * This prevents the dialog from closing automatically
   */
  private async _updateWindowContent(): Promise<void> {
    try {
      const template = (this.constructor as any).defaultOptions?.template || this.options.template;
      if (!template) {
        throw new Error('Template path is required');
      }
      
      const templateData = await this.getData();
      const html = await foundry.applications.handlebars.renderTemplate(template, templateData);
      
      const appElement = $(`#${this.id}`);
      if (appElement.length > 0) {
        const windowContent = appElement.find('.window-content');
        if (windowContent.length > 0) {
          windowContent.html(html);
          this.activateListeners(windowContent);
          return;
        }
      }
      
      // Fallback: try render if direct update fails
      await this.render(false);
    } catch (error) {
      console.error('Mastery System | Error updating initiative shop window content', error);
      // Fallback to render on error
      try {
        await this.render(false);
      } catch (renderError) {
        console.error('Mastery System | Error rendering initiative shop', renderError);
      }
    }
  }

  activateListeners(html: JQuery): void {
    super.activateListeners(html);

    // Buy extra movement (stepper +)
    html.find('.js-buy-movement').on('click', async (ev) => {
      ev.preventDefault();
      const totalCost = this.calculateTotalCost();
      const cost = INITIATIVE_SHOP.MOVEMENT.COST;
      
      if (totalCost + cost <= this.context.totalInitiative) {
        this.purchases.extraMovement++;
        await this._updateWindowContent();
      } else {
        ui.notifications.warn('Not enough initiative points!');
      }
    });

    // Remove movement purchase (stepper -)
    html.find('.js-remove-movement').on('click', async (ev) => {
      ev.preventDefault();
      if (this.purchases.extraMovement > 0) {
        this.purchases.extraMovement--;
        await this._updateWindowContent();
      }
    });

    // Buy initiative swap (toggle, max 1)
    html.find('.js-buy-swap').on('click', async (ev) => {
      ev.preventDefault();
      if (this.purchases.initiativeSwap) {
        this.purchases.initiativeSwap = false;
      } else {
        const totalCost = this.calculateTotalCost();
        const cost = INITIATIVE_SHOP.SWAP.COST;
        
        if (totalCost + cost <= this.context.totalInitiative) {
          this.purchases.initiativeSwap = true;
        } else {
          ui.notifications.warn('Not enough initiative points!');
        }
      }
      await this._updateWindowContent();
    });

    // Buy extra attack (toggle, max 1)
    html.find('.js-buy-attack').on('click', async (ev) => {
      ev.preventDefault();
      if (this.purchases.extraAttack) {
        this.purchases.extraAttack = false;
      } else {
        const totalCost = this.calculateTotalCost();
        const cost = INITIATIVE_SHOP.EXTRA_ATTACK.COST;
        
        if (totalCost + cost <= this.context.totalInitiative) {
          this.purchases.extraAttack = true;
        } else {
          ui.notifications.warn('Not enough initiative points!');
        }
      }
      await this._updateWindowContent();
    });

    // Confirm purchases
    html.find('.js-confirm').on('click', async (ev) => {
      ev.preventDefault();
      await this.confirmPurchases();
    });

    // Skip shop (behaves like X button - no purchases applied)
    html.find('.js-skip').on('click', (ev) => {
      ev.preventDefault();
      if (this.resolve) {
        this.resolve(null);
        this.resolve = undefined;
      }
      this.close();
    });
  }

  private calculateTotalCost(): number {
    let cost = 0;
    cost += this.purchases.extraMovement * INITIATIVE_SHOP.MOVEMENT.COST;
    if (this.purchases.initiativeSwap) cost += INITIATIVE_SHOP.SWAP.COST;
    if (this.purchases.extraAttack) cost += INITIATIVE_SHOP.EXTRA_ATTACK.COST;
    return cost;
  }

  private async confirmPurchases(): Promise<void> {
    const totalCost = this.calculateTotalCost();
    const remainingInitiative = Math.max(0, this.context.totalInitiative - totalCost);

    // Update combatant initiative to remaining (this becomes initiative order)
    await this.combatant.update({ initiative: remainingInitiative });

    // Store purchases in combatant flags with round marker
    const shopData = {
      round: this.combat.round || 1,
      ...this.purchases
    };
    await this.combatant.setFlag('mastery-system', 'initiativeShop', shopData);

    // Send chat message
    const actor = this.combatant.actor;
    if (actor) {
      const parts: string[] = [];
      if (this.purchases.extraMovement > 0) {
        parts.push(`+${this.purchases.extraMovement * INITIATIVE_SHOP.MOVEMENT.INCREMENT}m Movement this round`);
      }
      if (this.purchases.initiativeSwap) {
        parts.push('Initiative Swap (2 Raises, 1×/round)');
      }
      if (this.purchases.extraAttack) {
        parts.push('Extra Attack (1×/round)');
      }

      const message = parts.length > 0
        ? `${actor.name} spent ${totalCost} initiative on: ${parts.join(', ')}. Remaining Initiative: ${remainingInitiative}`
        : `${actor.name} did not purchase anything. Initiative: ${remainingInitiative}`;

      await ChatMessage.create({
        content: message,
        speaker: ChatMessage.getSpeaker({ actor: actor as any })
      });
    }

    if (this.resolve) {
      this.resolve(this.purchases);
      this.resolve = undefined;
    }

    this.close();
  }

  async close(options?: any): Promise<void> {
    // Clean up any stray initiative shop dialog elements
    $('body > .initiative-shop-dialog').remove();
    $('.initiative-shop-dialog').not(`#${this.id} .initiative-shop-dialog`).remove();
    
    if (this.resolve) {
      // If closed via X or Skip, resolve with null (no purchases applied)
      if (options?.closeSource === 'user' || options?.closeSource === 'button') {
        this.resolve(null);
      } else {
        // Otherwise resolve with current purchases
        this.resolve(this.purchases);
      }
      this.resolve = undefined;
    }
    return super.close(options);
  }
}

