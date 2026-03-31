/**
 * Initiative Shop Dialog
 * Allows players to spend initiative points on bonuses
 *
 * Migrated to Foundry VTT v13 ApplicationV2 + HandlebarsApplicationMixin
 */
import { INITIATIVE_SHOP } from '../utils/constants.js';
import { resetRoundState } from './action-economy.js';
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
// Type workaround for Mixin
const BaseDialog = HandlebarsApplicationMixin(ApplicationV2);
export class InitiativeShopDialog extends BaseDialog {
    combatant;
    combat;
    context;
    resolve;
    purchases;
    static DEFAULT_OPTIONS = {
        id: 'mastery-initiative-shop',
        classes: ['mastery-system', 'initiative-shop'],
        position: { width: 520 },
        window: { title: 'Initiative Shop', resizable: false }
    };
    static PARTS = {
        content: { template: 'systems/mastery-system/templates/dialogs/initiative-shop.hbs' }
    };
    /**
     * Show initiative shop dialog for a combatant
     */
    static async showForCombatant(combatant, context, combat) {
        const existing = foundry.applications.instances.get('mastery-initiative-shop');
        if (existing) {
            existing.bringToFront();
            return null;
        }
        return new Promise((resolve) => {
            const app = new InitiativeShopDialog(combatant, context, combat, resolve);
            app.render(true);
        });
    }
    constructor(combatant, context, combat, resolve) {
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
    }
    async _prepareContext(_options) {
        const actor = this.combatant.actor;
        if (!actor)
            return {};
        const totalCost = this.calculateTotalCost();
        const remainingInitiative = Math.max(0, this.context.totalInitiative - totalCost);
        return {
            actor,
            combatant: this.combatant,
            round: this.combat.round || 1,
            diceTotal: this.context.diceTotal,
            combatReflexesSpent: this.context.combatReflexesSpent,
            masteryRank: this.context.masteryRank,
            totalInitiative: this.context.totalInitiative,
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
            movementBonus: this.purchases.extraMovement * INITIATIVE_SHOP.MOVEMENT.INCREMENT
        };
    }
    async _onRender(_context, _options) {
        const root = this.element;
        root.querySelectorAll('.js-buy-movement').forEach((btn) => {
            btn.onclick = async (ev) => {
                ev.preventDefault();
                const totalCost = this.calculateTotalCost();
                const cost = INITIATIVE_SHOP.MOVEMENT.COST;
                if (totalCost + cost <= this.context.totalInitiative) {
                    this.purchases.extraMovement++;
                    await this.render({ force: true });
                }
                else {
                    ui.notifications.warn('Not enough initiative points!');
                }
            };
        });
        root.querySelectorAll('.js-remove-movement').forEach((btn) => {
            btn.onclick = async (ev) => {
                ev.preventDefault();
                if (this.purchases.extraMovement > 0) {
                    this.purchases.extraMovement--;
                    await this.render({ force: true });
                }
            };
        });
        const bindToggle = (sel, key, cost) => {
            root.querySelectorAll(sel).forEach((btn) => {
                btn.onclick = async (ev) => {
                    ev.preventDefault();
                    if (this.purchases[key]) {
                        this.purchases[key] = false;
                    }
                    else {
                        const totalCost = this.calculateTotalCost();
                        if (totalCost + cost <= this.context.totalInitiative) {
                            this.purchases[key] = true;
                        }
                        else {
                            ui.notifications.warn('Not enough initiative points!');
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
        const confirmBtn = root.querySelector('.js-confirm');
        if (confirmBtn) {
            confirmBtn.setAttribute('type', 'button');
            confirmBtn.onclick = async (ev) => {
                ev.preventDefault();
                await this.confirmPurchases();
            };
        }
        const skipBtn = root.querySelector('.js-skip');
        if (skipBtn) {
            skipBtn.onclick = async (ev) => {
                ev.preventDefault();
                if (this.resolve) {
                    this.resolve(null);
                    this.resolve = undefined;
                }
                await this.close({ closeSource: 'button' });
            };
        }
    }
    calculateTotalCost() {
        let cost = 0;
        cost += this.purchases.extraMovement * INITIATIVE_SHOP.MOVEMENT.COST;
        if (this.purchases.initiativeSwap)
            cost += INITIATIVE_SHOP.SWAP.COST;
        if (this.purchases.extraReaction)
            cost += INITIATIVE_SHOP.EXTRA_REACTION.COST;
        if (this.purchases.removeStress)
            cost += INITIATIVE_SHOP.REMOVE_STRESS.COST;
        if (this.purchases.extraAttack)
            cost += INITIATIVE_SHOP.EXTRA_ATTACK.COST;
        return cost;
    }
    async confirmPurchases() {
        const totalCost = this.calculateTotalCost();
        const remainingInitiative = Math.max(0, this.context.totalInitiative - totalCost);
        await this.combatant.update({ initiative: remainingInitiative });
        await this.combatant.setFlag('mastery-system', 'msInitiativeValue', remainingInitiative);
        const shopData = {
            round: this.combat.round || 1,
            ...this.purchases
        };
        await this.combatant.setFlag('mastery-system', 'initiativeShop', shopData);
        const actor = this.combatant.actor;
        if (actor) {
            await resetRoundState(actor, this.combatant, this.combat);
            console.log('Mastery System | [INITIATIVE SHOP] RoundState updated after purchases', {
                actorName: actor.name,
                purchases: this.purchases,
                round: this.combat.round
            });
        }
        if (actor) {
            const parts = [];
            if (this.purchases.extraMovement > 0) {
                parts.push(`+${this.purchases.extraMovement * INITIATIVE_SHOP.MOVEMENT.INCREMENT}m movement this round`);
            }
            if (this.purchases.initiativeSwap) {
                parts.push('Initiative swap (consenting player; both scores update)');
            }
            if (this.purchases.extraReaction) {
                parts.push('Extra reaction (1×/round)');
            }
            if (this.purchases.removeStress) {
                parts.push('Remove 1d8 stress (rolled on apply)');
            }
            if (this.purchases.extraAttack) {
                parts.push('Extra attack (1×/round)');
            }
            const messageContent = parts.length > 0
                ? `<div class="mastery-system-info">
            <h3><i class="fas fa-shop"></i> Initiative Shop Purchase</h3>
            <div class="info-details">
              <div class="info-row">
                <span class="info-label">Actor:</span>
                <span class="info-value">${actor.name}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Initiative Spent:</span>
                <span class="info-value">${totalCost}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Purchases:</span>
                <span class="info-value">${parts.join(', ')}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Remaining Initiative:</span>
                <span class="info-value">${remainingInitiative}</span>
              </div>
            </div>
          </div>`
                : `<div class="mastery-system-info">
            <h3><i class="fas fa-shop"></i> Initiative Shop</h3>
            <div class="info-details">
              <div class="info-row">
                <span class="info-label">Actor:</span>
                <span class="info-value">${actor.name}</span>
              </div>
              <div class="info-row">
                <span class="info-label">No Purchases</span>
                <span class="info-value"></span>
              </div>
              <div class="info-row">
                <span class="info-label">Initiative:</span>
                <span class="info-value">${remainingInitiative}</span>
              </div>
            </div>
          </div>`;
            await ChatMessage.create({
                content: messageContent,
                speaker: ChatMessage.getSpeaker({ actor: actor }),
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
    async close(options) {
        if (this.resolve) {
            if (options?.closeSource === 'user' || options?.closeSource === 'button') {
                this.resolve(null);
            }
            else {
                this.resolve(this.purchases);
            }
            this.resolve = undefined;
        }
        return super.close(options);
    }
}
//# sourceMappingURL=initiative-shop-dialog.js.map