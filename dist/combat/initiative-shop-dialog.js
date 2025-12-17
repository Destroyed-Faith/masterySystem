/**
 * Initiative Shop Dialog
 * Allows players to spend initiative points on bonuses
 */
import { INITIATIVE_SHOP } from '../utils/constants.js';
export class InitiativeShopDialog extends Application {
    combatant;
    combat;
    context;
    resolve;
    purchases;
    static get defaultOptions() {
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
    static async showForCombatant(combatant, context, combat) {
        return new Promise(resolve => {
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
            extraAttack: false
        };
    }
    async getData() {
        const actor = this.combatant.actor;
        if (!actor)
            return {};
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
    async _renderHTML(_data) {
        const template = this.constructor.defaultOptions?.template || this.options.template;
        if (!template) {
            throw new Error('Template path is required');
        }
        const templateData = await this.getData();
        const html = await foundry.applications.handlebars.renderTemplate(template, templateData);
        return $(html);
    }
    async _replaceHTML(element, html) {
        element.replaceWith(html);
    }
    activateListeners(html) {
        super.activateListeners(html);
        // Buy extra movement (stepper +)
        html.find('.js-buy-movement').on('click', (ev) => {
            ev.preventDefault();
            const totalCost = this.calculateTotalCost();
            const cost = INITIATIVE_SHOP.MOVEMENT.COST;
            if (totalCost + cost <= this.context.totalInitiative) {
                this.purchases.extraMovement++;
                this.render(false);
            }
            else {
                ui.notifications.warn('Not enough initiative points!');
            }
        });
        // Remove movement purchase (stepper -)
        html.find('.js-remove-movement').on('click', (ev) => {
            ev.preventDefault();
            if (this.purchases.extraMovement > 0) {
                this.purchases.extraMovement--;
                this.render(false);
            }
        });
        // Buy initiative swap (toggle, max 1)
        html.find('.js-buy-swap').on('click', (ev) => {
            ev.preventDefault();
            if (this.purchases.initiativeSwap) {
                this.purchases.initiativeSwap = false;
            }
            else {
                const totalCost = this.calculateTotalCost();
                const cost = INITIATIVE_SHOP.SWAP.COST;
                if (totalCost + cost <= this.context.totalInitiative) {
                    this.purchases.initiativeSwap = true;
                }
                else {
                    ui.notifications.warn('Not enough initiative points!');
                }
            }
            this.render(false);
        });
        // Buy extra attack (toggle, max 1)
        html.find('.js-buy-attack').on('click', (ev) => {
            ev.preventDefault();
            if (this.purchases.extraAttack) {
                this.purchases.extraAttack = false;
            }
            else {
                const totalCost = this.calculateTotalCost();
                const cost = INITIATIVE_SHOP.EXTRA_ATTACK.COST;
                if (totalCost + cost <= this.context.totalInitiative) {
                    this.purchases.extraAttack = true;
                }
                else {
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
    calculateTotalCost() {
        let cost = 0;
        cost += this.purchases.extraMovement * INITIATIVE_SHOP.MOVEMENT.COST;
        if (this.purchases.initiativeSwap)
            cost += INITIATIVE_SHOP.SWAP.COST;
        if (this.purchases.extraAttack)
            cost += INITIATIVE_SHOP.EXTRA_ATTACK.COST;
        return cost;
    }
    async confirmPurchases() {
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
            const parts = [];
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
                speaker: ChatMessage.getSpeaker({ actor: actor })
            });
        }
        if (this.resolve) {
            this.resolve(this.purchases);
            this.resolve = undefined;
        }
        this.close();
    }
    async close(options) {
        if (this.resolve) {
            // If closed via X or Skip, resolve with null (no purchases applied)
            if (options?.closeSource === 'user' || options?.closeSource === 'button') {
                this.resolve(null);
            }
            else {
                // Otherwise resolve with current purchases
                this.resolve(this.purchases);
            }
            this.resolve = undefined;
        }
        return super.close(options);
    }
}
//# sourceMappingURL=initiative-shop-dialog.js.map