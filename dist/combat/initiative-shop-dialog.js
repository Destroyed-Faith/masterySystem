/**
 * Initiative Shop Dialog
 * Allows players to spend initiative points on bonuses
 */
import { INITIATIVE_SHOP } from '../utils/constants.js';
export class InitiativeShopDialog extends Application {
    combatant;
    baseInitiative;
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
    static async showForCombatant(combatant, baseInitiative) {
        return new Promise(resolve => {
            const app = new InitiativeShopDialog(combatant, baseInitiative, resolve);
            app.render(true);
        });
    }
    constructor(combatant, rolledInitiative, resolve) {
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
    async getData() {
        const actor = this.combatant.actor;
        if (!actor)
            return {};
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
        // Buy extra movement
        html.find('.js-buy-movement').on('click', (ev) => {
            ev.preventDefault();
            const currentInitiative = this.combatant.initiative || this.baseInitiative;
            const totalCost = this.calculateTotalCost();
            const cost = INITIATIVE_SHOP.MOVEMENT.COST;
            if (totalCost + cost <= currentInitiative) {
                this.purchases.extraMovement++;
                this.render(false);
            }
            else {
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
            }
            else {
                const currentInitiative = this.combatant.initiative || this.baseInitiative;
                const totalCost = this.calculateTotalCost();
                const cost = INITIATIVE_SHOP.SWAP.COST;
                if (totalCost + cost <= currentInitiative) {
                    this.purchases.initiativeSwap = true;
                }
                else {
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
            }
            else {
                const currentInitiative = this.combatant.initiative || this.baseInitiative;
                const totalCost = this.calculateTotalCost();
                const cost = INITIATIVE_SHOP.EXTRA_ATTACK.COST;
                if (totalCost + cost <= currentInitiative) {
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
        // Skip shop
        html.find('.js-skip').on('click', (ev) => {
            ev.preventDefault();
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
        const currentInitiative = this.combatant.initiative || this.baseInitiative;
        const finalInitiative = currentInitiative - totalCost;
        // Update combatant initiative
        await this.combatant.update({ initiative: finalInitiative });
        // Store purchases in combatant flags for later use
        await this.combatant.setFlag('mastery-system', 'initiativeShop', this.purchases);
        // Send chat message
        const actor = this.combatant.actor;
        if (actor) {
            const parts = [];
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
            // Resolve with current purchases (even if skipped)
            this.resolve(this.purchases);
            this.resolve = undefined;
        }
        return super.close(options);
    }
}
//# sourceMappingURL=initiative-shop-dialog.js.map