/**
 * Initiative Shop Dialog — schlank: Mastery Roll + CR-Dropdown + Shop-Zeilen, kein CR-Popup.
 */

import { INITIATIVE_SHOP } from '../utils/constants.js';
import { InitiativeRollBreakdown, getCombatReflexesInitiativeLimits } from './initiative-roll.js';
import { resetRoundState } from './action-economy.js';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

const BaseDialog = HandlebarsApplicationMixin(ApplicationV2) as typeof ApplicationV2;

const CR_SKILL_KEY = 'combatReflexes';

export interface InitiativeShopPurchase {
  extraMovement: number;
  initiativeSwap: boolean;
  extraReaction: boolean;
  removeStress: boolean;
  extraAttack: boolean;
}

export interface InitiativeShopContext extends InitiativeRollBreakdown {}

export class InitiativeShopDialog extends BaseDialog {
  private combatant: Combatant;
  private combat: Combat;
  private context: InitiativeShopContext;
  private resolve?: (purchases: InitiativeShopPurchase | null) => void;
  private purchases: InitiativeShopPurchase;
  /** CR-Punkte, die der Spieler im Dropdown wählt (Shop-Pool = Wurf + das). */
  private crSpent: number;
  /** Bereits vor diesem Dialog auf skillsSpent gebucht (Legacy / seltener Pfad). */
  private crCommittedAtOpen: number;

  static DEFAULT_OPTIONS = {
    id: 'mastery-initiative-shop',
    classes: ['mastery-system', 'initiative-shop'],
    position: { width: 580 },
    window: { title: 'Initiative Shop', resizable: true }
  };

  static PARTS = {
    content: { template: 'systems/mastery-system/templates/dialogs/initiative-shop.hbs' }
  };

  static async showForCombatant(
    combatant: Combatant,
    context: InitiativeShopContext,
    combat: Combat
  ): Promise<InitiativeShopPurchase | null> {
    const existing = foundry.applications.instances.get('mastery-initiative-shop');
    if (existing) {
      (existing as any).bringToFront();
      return null;
    }

    return new Promise<InitiativeShopPurchase | null>((resolve) => {
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
      extraReaction: false,
      removeStress: false,
      extraAttack: false
    };
    this.crCommittedAtOpen = Number(context.combatReflexesSpent) || 0;
    this.crSpent = this.crCommittedAtOpen;
  }

  private getShopPool(): number {
    return (
      this.context.diceTotal +
      this.crSpent +
      (this.context.equipmentInitiativeModifier ?? 0)
    );
  }

  protected async _prepareContext(_options: any): Promise<any> {
    const actor = this.combatant.actor;
    if (!actor) return {};

    const { maxThisRoll, remainingPool, capPerRoll } = getCombatReflexesInitiativeLimits(
      actor,
      this.context.masteryRank
    );
    if (this.crSpent > maxThisRoll) this.crSpent = maxThisRoll;
    if (this.crSpent < 0) this.crSpent = 0;

    const crOptions = Array.from({ length: Math.max(0, maxThisRoll) + 1 }, (_, i) => ({
      value: i,
      selected: i === this.crSpent
    }));

    const totalCost = this.calculateTotalCost();
    const totalInitiative = this.getShopPool();
    const remainingInitiative = Math.max(0, totalInitiative - totalCost);

    return {
      actor,
      combatant: this.combatant,
      round: this.combat.round || 1,
      diceTotal: this.context.diceTotal,
      crSpent: this.crSpent,
      equipmentInitiativeModifier: this.context.equipmentInitiativeModifier ?? 0,
      masteryRank: this.context.masteryRank,
      totalInitiative,
      remainingInitiative,
      purchases: this.purchases,
      costs: {
        movement: INITIATIVE_SHOP.MOVEMENT.COST,
        movementIncrement: INITIATIVE_SHOP.MOVEMENT.INCREMENT,
        swap: INITIATIVE_SHOP.SWAP.COST,
        extraReaction: INITIATIVE_SHOP.EXTRA_REACTION.COST,
        removeStress: INITIATIVE_SHOP.REMOVE_STRESS.COST,
        extraAttack: INITIATIVE_SHOP.EXTRA_ATTACK.COST
      },
      movementSpent: this.purchases.extraMovement * INITIATIVE_SHOP.MOVEMENT.COST,
      movementBonus: this.purchases.extraMovement * INITIATIVE_SHOP.MOVEMENT.INCREMENT,
      crOptions,
      crSelectDisabled: maxThisRoll <= 0,
      crMax: maxThisRoll,
      crPoolRemaining: remainingPool,
      crCapPerRoll: capPerRoll
    };
  }

  protected async _onRender(_context: any, _options: any): Promise<void> {
    const root = (this as any).element as HTMLElement;

    const crSel = root.querySelector<HTMLSelectElement>('.js-cr-select');
    if (crSel) {
      crSel.onchange = async () => {
        const v = Math.max(0, Math.floor(Number(crSel.value) || 0));
        const actor = this.combatant.actor;
        const max =
          actor != null
            ? getCombatReflexesInitiativeLimits(actor, this.context.masteryRank).maxThisRoll
            : 0;
        this.crSpent = Math.min(v, max);
        await (this as any).render({ force: true });
      };
    }

    root.querySelectorAll<HTMLElement>('.js-buy-movement').forEach((btn) => {
      btn.onclick = async (ev) => {
        ev.preventDefault();
        const totalCost = this.calculateTotalCost();
        const cost = INITIATIVE_SHOP.MOVEMENT.COST;
        if (totalCost + cost <= this.getShopPool()) {
          this.purchases.extraMovement++;
          await (this as any).render({ force: true });
        } else {
          ui.notifications.warn('Nicht genug Initiative-Punkte!');
        }
      };
    });

    root.querySelectorAll<HTMLElement>('.js-remove-movement').forEach((btn) => {
      btn.onclick = async (ev) => {
        ev.preventDefault();
        if (this.purchases.extraMovement > 0) {
          this.purchases.extraMovement--;
          await (this as any).render({ force: true });
        }
      };
    });

    const bindToggle = (
      sel: string,
      key: 'initiativeSwap' | 'extraReaction' | 'removeStress' | 'extraAttack',
      cost: number
    ) => {
      root.querySelectorAll<HTMLElement>(sel).forEach((btn) => {
        btn.onclick = async (ev) => {
          ev.preventDefault();
          if (this.purchases[key]) {
            (this.purchases as any)[key] = false;
          } else {
            const totalCost = this.calculateTotalCost();
            if (totalCost + cost <= this.getShopPool()) {
              (this.purchases as any)[key] = true;
            } else {
              ui.notifications.warn('Nicht genug Initiative-Punkte!');
            }
          }
          await this.render({ force: true });
        };
      });
    };

    bindToggle('.js-buy-swap', 'initiativeSwap', INITIATIVE_SHOP.SWAP.COST);
    bindToggle('.js-buy-reaction', 'extraReaction', INITIATIVE_SHOP.EXTRA_REACTION.COST);
    bindToggle('.js-buy-stress', 'removeStress', INITIATIVE_SHOP.REMOVE_STRESS.COST);
    bindToggle('.js-buy-attack', 'extraAttack', INITIATIVE_SHOP.EXTRA_ATTACK.COST);

    root.querySelectorAll<HTMLElement>('.js-confirm').forEach((confirmBtn) => {
      confirmBtn.setAttribute('type', 'button');
      confirmBtn.onclick = async (ev) => {
        ev.preventDefault();
        await this.confirmPurchases();
      };
    });
  }

  private calculateTotalCost(): number {
    let cost = 0;
    cost += this.purchases.extraMovement * INITIATIVE_SHOP.MOVEMENT.COST;
    if (this.purchases.initiativeSwap) cost += INITIATIVE_SHOP.SWAP.COST;
    if (this.purchases.extraReaction) cost += INITIATIVE_SHOP.EXTRA_REACTION.COST;
    if (this.purchases.removeStress) cost += INITIATIVE_SHOP.REMOVE_STRESS.COST;
    if (this.purchases.extraAttack) cost += INITIATIVE_SHOP.EXTRA_ATTACK.COST;
    return cost;
  }

  private async confirmPurchases(): Promise<void> {
    const totalPool = this.getShopPool();
    const totalCost = this.calculateTotalCost();
    const remainingInitiative = Math.max(0, totalPool - totalCost);

    await this.combatant.update({ initiative: remainingInitiative });
    await this.combatant.setFlag('mastery-system', 'msInitiativeValue', remainingInitiative);

    const shopData = {
      round: this.combat.round || 1,
      ...this.purchases
    };
    await this.combatant.setFlag('mastery-system', 'initiativeShop', shopData);

    const actor = this.combatant.actor;
    if (actor) {
      const delta = this.crSpent - this.crCommittedAtOpen;
      if (delta !== 0) {
        const prevSpent = Number((actor.system as any)?.skillsSpent?.[CR_SKILL_KEY] ?? 0);
        await actor.update({
          [`system.skillsSpent.${CR_SKILL_KEY}`]: prevSpent + delta
        });
      }

      await resetRoundState(actor, this.combatant, this.combat);
      console.log('Mastery System | [INITIATIVE SHOP] RoundState updated after purchases', {
        actorName: actor.name,
        purchases: this.purchases,
        crSpent: this.crSpent,
        round: this.combat.round
      });
    }

    if (actor) {
      const parts: string[] = [];
      if (this.crSpent > 0) {
        parts.push(`Combat Reflexes +${this.crSpent}`);
      }
      if (this.purchases.extraMovement > 0) {
        parts.push(`+${this.purchases.extraMovement * INITIATIVE_SHOP.MOVEMENT.INCREMENT}m Bewegung`);
      }
      if (this.purchases.initiativeSwap) {
        parts.push('Initiative-Tausch (mit Zustimmung)');
      }
      if (this.purchases.extraReaction) {
        parts.push('Extra Reaktion');
      }
      if (this.purchases.removeStress) {
        parts.push('Stress −1W8');
      }
      if (this.purchases.extraAttack) {
        parts.push('Extra Angriff');
      }

      const messageContent =
        parts.length > 0
          ? `<div class="mastery-system-info">
            <h3><i class="fas fa-shop"></i> Initiative Shop</h3>
            <div class="info-details">
              <div class="info-row"><span class="info-label">Figur:</span><span class="info-value">${actor.name}</span></div>
              <div class="info-row"><span class="info-label">Ausgegeben:</span><span class="info-value">${totalCost}</span></div>
              <div class="info-row"><span class="info-label">Einkäufe:</span><span class="info-value">${parts.join(', ')}</span></div>
              <div class="info-row"><span class="info-label">Initiative (Rest):</span><span class="info-value">${remainingInitiative}</span></div>
            </div>
          </div>`
          : `<div class="mastery-system-info">
            <h3><i class="fas fa-shop"></i> Initiative Shop</h3>
            <div class="info-details">
              <div class="info-row"><span class="info-label">Figur:</span><span class="info-value">${actor.name}</span></div>
              <div class="info-row"><span class="info-label">Keine Einkäufe</span><span class="info-value"></span></div>
              <div class="info-row"><span class="info-label">Initiative (Rest):</span><span class="info-value">${remainingInitiative}</span></div>
            </div>
          </div>`;

      await ChatMessage.create({
        content: messageContent,
        speaker: ChatMessage.getSpeaker({ actor: actor as any }),
        style: CONST.CHAT_MESSAGE_STYLES.OTHER
      });
    }

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

    await this.close({ closeSource: 'button' });
  }

  async close(options?: any): Promise<this> {
    /** Schließen ohne vorheriges confirmPurchases → Abbruch (null). Nach Bestätigen ist resolve schon geleert. */
    if (this.resolve) {
      this.resolve(null);
      this.resolve = undefined;
    }
    return super.close(options);
  }
}
