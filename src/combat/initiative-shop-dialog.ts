/**
 * Initiative Shop Dialog
 * Allows players to spend initiative points on bonuses
 * 
 * Migrated to Foundry VTT v13 ApplicationV2 + HandlebarsApplicationMixin
 */

import { INITIATIVE_SHOP } from '../utils/constants.js';
import { InitiativeRollBreakdown } from './initiative-roll.js';
import { resetRoundState } from './action-economy.js';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

// Type workaround for Mixin
const BaseDialog = HandlebarsApplicationMixin(ApplicationV2) as typeof ApplicationV2;

export interface InitiativeShopPurchase {
  extraMovement: number;      // Number of movement purchases (each = +2m)
  initiativeSwap: boolean;     // Unlock initiative swap
  extraAttack: boolean;        // Gain extra attack
}

export interface InitiativeShopContext extends InitiativeRollBreakdown {
  // Context includes: baseInitiative, diceTotal, totalInitiative, masteryRank, rollResult
}

export class InitiativeShopDialog extends BaseDialog {
  private combatant: Combatant;
  private combat: Combat;
  private context: InitiativeShopContext;
  private resolve?: (purchases: InitiativeShopPurchase | null) => void;
  private purchases: InitiativeShopPurchase;

  static DEFAULT_OPTIONS = {
    id: "mastery-initiative-shop",
    classes: ["mastery-system", "initiative-shop"],
    position: { width: 500 },
    window: { title: "Initiative Shop", resizable: false }
  };

  static PARTS = {
    content: { template: "systems/mastery-system/templates/dialogs/initiative-shop.hbs" }
  };

  /**
   * Show initiative shop dialog for a combatant
   */
  static async showForCombatant(
    combatant: Combatant,
    context: InitiativeShopContext,
    combat: Combat
  ): Promise<InitiativeShopPurchase | null> {
    // Check singleton
    const existing = foundry.applications.instances.get("mastery-initiative-shop");
    if (existing) {
      (existing as any).bringToFront();
      return null;
    }

    return new Promise<InitiativeShopPurchase | null>(resolve => {
      const app = new InitiativeShopDialog(combatant, context, combat, resolve);
      app.render(true);
    });
  }

  constructor(
    combatant: Combatant,
    context: InitiativeShopContext,
    combat: Combat,
    resolve: (purchases: InitiativeShopPurchase | null) => void
  ) {
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

  protected async _prepareContext(_options: any): Promise<any> {
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

  protected async _onRender(_context: any, _options: any): Promise<void> {
    const root = (this as any).element as HTMLElement;

    // Buy extra movement (stepper +)
    root.querySelectorAll<HTMLElement>('.js-buy-movement').forEach(btn => {
      btn.onclick = async (ev) => {
        ev.preventDefault();
        const totalCost = this.calculateTotalCost();
        const cost = INITIATIVE_SHOP.MOVEMENT.COST;

        if (totalCost + cost <= this.context.totalInitiative) {
          this.purchases.extraMovement++;
          await (this as any).render({ force: true });
        } else {
          ui.notifications.warn('Not enough initiative points!');
        }
      };
    });

    // Remove movement purchase (stepper -)
    root.querySelectorAll<HTMLElement>('.js-remove-movement').forEach(btn => {
      btn.onclick = async (ev) => {
        ev.preventDefault();
        if (this.purchases.extraMovement > 0) {
          this.purchases.extraMovement--;
          await (this as any).render({ force: true });
        }
      };
    });

    // Buy initiative swap (toggle, max 1)
    root.querySelectorAll<HTMLElement>('.js-buy-swap').forEach(btn => {
      btn.onclick = async (ev) => {
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
        await this.render({ force: true });
      };
    });

    // Buy extra attack (toggle, max 1)
    root.querySelectorAll<HTMLElement>('.js-buy-attack').forEach(btn => {
      btn.onclick = async (ev) => {
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
        await this.render({ force: true });
      };
    });

    // Confirm purchases
    const confirmBtn = root.querySelector<HTMLElement>('.js-confirm');
    if (confirmBtn) {
      confirmBtn.setAttribute('type', 'button'); // Prevent form submission if inside form
      confirmBtn.onclick = async (ev) => {
        ev.preventDefault();
        await this.confirmPurchases();
      };
    }

    // Skip shop (no purchases applied)
    const skipBtn = root.querySelector<HTMLElement>('.js-skip');
    if (skipBtn) {
      skipBtn.onclick = async (ev) => {
        ev.preventDefault();
        if (this.resolve) {
          this.resolve(null);
          this.resolve = undefined;
        }
        await this.close({ closeSource: "button" });
      };
    }
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

    // Store final initiative value in msInitiativeValue flag (for round tracking / UI)
    await this.combatant.setFlag('mastery-system', 'msInitiativeValue', remainingInitiative);

    // Store purchases in combatant flags with round marker
    const shopData = {
      round: this.combat.round || 1,
      ...this.purchases
    };
    await this.combatant.setFlag('mastery-system', 'initiativeShop', shopData);

    // Immediately update RoundState to apply initiative shop bonuses for this round
    const actor = this.combatant.actor;
    if (actor) {
      await resetRoundState(actor, this.combatant, this.combat);
      console.log('Mastery System | [INITIATIVE SHOP] RoundState updated after purchases', {
        actorName: actor.name,
        purchases: this.purchases,
        round: this.combat.round
      });
    }

    // Send chat message
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

    // Notify GM that initiative is confirmed (via socket if not GM)
    if (!game.user?.isGM) {
      game.socket?.emit('system.mastery-system', {
        type: 'initiativeConfirmed',
        combatId: this.combat.id,
        combatantId: this.combatant.id,
        finalInitiative: remainingInitiative
      });
    }

    if (this.resolve) {
      this.resolve(this.purchases);
      this.resolve = undefined;
    }

    await this.close({ closeSource: "button" });
  }

  async close(options?: any): Promise<this> {
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
