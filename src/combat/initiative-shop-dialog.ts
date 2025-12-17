/**
 * Initiative Shop Dialog
 * Allows players to spend initiative points on bonuses
 */

import { INITIATIVE_SHOP } from '../utils/constants.js';

export interface InitiativeShopPurchase {
  extraMovement: number;      // Number of movement purchases (each = +2m)
  initiativeSwap: boolean;     // Unlock initiative swap
  extraAttack: boolean;        // Gain extra attack
}

export class InitiativeShopDialog extends Application {
  private combatant: Combatant;
  private baseInitiative: number;
  private resolve?: (purchases: InitiativeShopPurchase) => void;
  private purchases: InitiativeShopPurchase;

  static override get defaultOptions(): any {
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
  static async showForCombatant(combatant: Combatant, baseInitiative: number): Promise<InitiativeShopPurchase> {
    return new Promise<InitiativeShopPurchase>(resolve => {
      const app = new InitiativeShopDialog(combatant, baseInitiative, resolve);
      app.render(true);
    });
  }

  constructor(combatant: Combatant, rolledInitiative: number, resolve: (purchases: InitiativeShopPurchase) => void) {
    super({});
    this.combatant = combatant;
    // rolledInitiative is the total initiative after dice roll (base + dice)
    this.baseInitiative = rolledInitiative;
    this.resolve = resolve;
    this.purchases = {
      extraMovement: 0,
      initiativeSwap: false,
      extraAttack: false
    };
  }

  override async getData(): Promise<any> {
    const actor = this.combatant.actor;
    if (!actor) return {};

    const currentInitiative = this.combatant.initiative || this.baseInitiative;
    const totalCost = this.calculateTotalCost();

    return {
      actor,
      combatant: this.combatant,
      baseInitiative: this.baseInitiative,
      currentInitiative,
      availableInitiative: currentInitiative - totalCost,
      purchases: this.purchases,
      costs: {
        movement: INITIATIVE_SHOP.MOVEMENT.COST,
        movementIncrement: INITIATIVE_SHOP.MOVEMENT.INCREMENT,
        swap: INITIATIVE_SHOP.SWAP.COST,
        extraAttack: INITIATIVE_SHOP.EXTRA_ATTACK.COST
      }
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

  override activateListeners(html: JQuery): void {
    super.activateListeners(html);

    // Buy extra movement
    html.find('.js-buy-movement').on('click', (ev) => {
      ev.preventDefault();
      const currentInitiative = this.combatant.initiative || this.baseInitiative;
      const totalCost = this.calculateTotalCost();
      const cost = INITIATIVE_SHOP.MOVEMENT.COST;
      
      if (totalCost + cost <= currentInitiative) {
        this.purchases.extraMovement++;
        this.render(false);
      } else {
        ui.notifications.warn('Not enough initiative points!');
      }
    });

    // Remove movement purchase
    html.find('.js-remove-movement').on('click', (ev) => {
      ev.preventDefault();
      if (this.purchases.extraMovement > 0) {
        this.purchases.extraMovement--;
        this.render(false);
      }
    });

    // Buy initiative swap
    html.find('.js-buy-swap').on('click', (ev) => {
      ev.preventDefault();
      if (this.purchases.initiativeSwap) {
        this.purchases.initiativeSwap = false;
      } else {
        const currentInitiative = this.combatant.initiative || this.baseInitiative;
        const totalCost = this.calculateTotalCost();
        const cost = INITIATIVE_SHOP.SWAP.COST;
        
        if (totalCost + cost <= currentInitiative) {
          this.purchases.initiativeSwap = true;
        } else {
          ui.notifications.warn('Not enough initiative points!');
        }
      }
      this.render(false);
    });

    // Buy extra attack
    html.find('.js-buy-attack').on('click', (ev) => {
      ev.preventDefault();
      if (this.purchases.extraAttack) {
        this.purchases.extraAttack = false;
      } else {
        const currentInitiative = this.combatant.initiative || this.baseInitiative;
        const totalCost = this.calculateTotalCost();
        const cost = INITIATIVE_SHOP.EXTRA_ATTACK.COST;
        
        if (totalCost + cost <= currentInitiative) {
          this.purchases.extraAttack = true;
        } else {
          ui.notifications.warn('Not enough initiative points!');
        }
      }
      this.render(false);
    });

    // Confirm purchases
    html.find('.js-confirm').on('click', async (ev) => {
      ev.preventDefault();
      await this.confirmPurchases();
    });

    // Skip shop
    html.find('.js-skip').on('click', (ev) => {
      ev.preventDefault();
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
    const currentInitiative = this.combatant.initiative || this.baseInitiative;
    const finalInitiative = currentInitiative - totalCost;

    // Update combatant initiative
    await this.combatant.update({ initiative: finalInitiative });

    // Store purchases in combatant flags for later use
    await this.combatant.setFlag('mastery-system', 'initiativeShop', this.purchases);

    // Send chat message
    const actor = this.combatant.actor;
    if (actor) {
      const parts: string[] = [];
      if (this.purchases.extraMovement > 0) {
        parts.push(`+${this.purchases.extraMovement * INITIATIVE_SHOP.MOVEMENT.INCREMENT}m Movement`);
      }
      if (this.purchases.initiativeSwap) {
        parts.push('Initiative Swap');
      }
      if (this.purchases.extraAttack) {
        parts.push('Extra Attack');
      }

      const message = parts.length > 0
        ? `${actor.name} spent ${totalCost} initiative on: ${parts.join(', ')}. Final Initiative: ${finalInitiative}`
        : `${actor.name} did not purchase anything. Initiative: ${finalInitiative}`;

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

  override async close(options?: any): Promise<void> {
    if (this.resolve) {
      // Resolve with current purchases (even if skipped)
      this.resolve(this.purchases);
      this.resolve = undefined;
    }
    return super.close(options);
  }
}

