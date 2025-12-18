/**
 * Stone Powers Activation Dialog
 *
 * Allows players to activate stone powers during combat
 */
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
// Type workaround for Mixin
const BaseDialog = HandlebarsApplicationMixin(ApplicationV2);
import { STONE_POWERS, activateStonePower, getAvailableStonePowers } from './stone-activation.js';
export class StonePowersDialog extends BaseDialog {
    actor;
    combatant;
    resolve;
    static DEFAULT_OPTIONS = {
        id: "mastery-stone-powers",
        classes: ["mastery-system", "stone-powers-dialog"],
        position: { width: 600, height: 500 },
        window: { title: "Activate Stone Powers", resizable: true }
    };
    static PARTS = {
        content: { template: "systems/mastery-system/templates/dialogs/stone-powers.hbs" }
    };
    /**
     * Show stone powers dialog for an actor
     */
    static async showForActor(actor, combatant) {
        return new Promise(resolve => {
            const app = new StonePowersDialog(actor, combatant || null, resolve);
            app.render({ force: true });
        });
    }
    constructor(actor, combatant, resolve) {
        super({});
        this.actor = actor;
        this.combatant = combatant;
        this.resolve = resolve;
    }
    async _prepareContext(_options) {
        // Resolve combatant if not provided
        if (!this.combatant && game.combat) {
            this.combatant = game.combat.combatants.find((c) => c.actor?.id === this.actor.id) || null;
        }
        const system = this.actor.system;
        const stonePools = system.stonePools || {};
        const availablePowers = getAvailableStonePowers(this.actor);
        const attributes = ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence'];
        // Filter pools to only show those with max > 0
        const pools = attributes
            .map(attr => {
            const pool = stonePools[attr] || { current: 0, max: 0, sustained: 0 };
            return {
                key: attr,
                name: attr.charAt(0).toUpperCase() + attr.slice(1),
                current: pool.current,
                max: pool.max,
                sustained: pool.sustained || 0,
                available: pool.current - (pool.sustained || 0)
            };
        })
            .filter(pool => pool.max > 0); // Only show pools with stones
        // Organize powers by attribute section
        // Generic powers appear in EACH attribute section
        const powersByAttribute = {};
        // First, add attribute-specific powers
        for (const power of availablePowers) {
            if (power.attribute !== 'generic') {
                const attr = power.attribute;
                if (!powersByAttribute[attr]) {
                    powersByAttribute[attr] = [];
                }
                // Only add if this attribute has a pool
                if (pools.some(p => p.key === attr)) {
                    powersByAttribute[attr].push({
                        id: power.id,
                        name: power.name,
                        description: power.description,
                        effect: power.effect,
                        attribute: power.attribute,
                        cost: 1 // Stone cost is calculated dynamically based on usage
                    });
                }
            }
        }
        // Then, add generic powers to EACH attribute section that has a pool
        const genericPowers = availablePowers.filter(p => p.attribute === 'generic');
        for (const pool of pools) {
            const attr = pool.key;
            if (!powersByAttribute[attr]) {
                powersByAttribute[attr] = [];
            }
            // Add generic powers to this attribute section
            for (const power of genericPowers) {
                powersByAttribute[attr].push({
                    id: power.id,
                    name: power.name,
                    description: power.description,
                    effect: power.effect,
                    attribute: power.attribute, // Keep as 'generic'
                    cost: 1
                });
            }
        }
        // Check if actor is in combat
        const hasCombat = !!game.combat && !!this.combatant;
        return {
            actor: this.actor,
            pools,
            powersByAttribute,
            hasCombat
        };
    }
    async _onRender(_context, _options) {
        super._onRender?.(_context, _options);
        const root = this.element;
        // Activate power buttons
        root.querySelectorAll('.js-activate-power').forEach((btn) => {
            btn.onclick = async (ev) => {
                ev.preventDefault();
                const powerId = btn.dataset.powerId;
                const attributeKey = btn.dataset.attributeKey;
                if (!powerId)
                    return;
                if (!this.combatant || !game.combat) {
                    ui.notifications?.warn('Stone powers can only be activated during combat');
                    return;
                }
                try {
                    const success = await activateStonePower({
                        actor: this.actor,
                        combatant: this.combatant,
                        abilityId: powerId,
                        attributeKey: attributeKey || undefined
                    });
                    if (success) {
                        ui.notifications?.info(`Activated ${STONE_POWERS[powerId]?.name || powerId}`);
                        await this.render({ force: true });
                    }
                    else {
                        ui.notifications?.warn(`Failed to activate ${STONE_POWERS[powerId]?.name || powerId}`);
                    }
                }
                catch (error) {
                    console.error('Mastery System | Error activating stone power', error);
                    ui.notifications?.error('Failed to activate stone power');
                }
            };
        });
        // Close button
        const closeBtn = root.querySelector('.js-close');
        if (closeBtn) {
            closeBtn.onclick = async (ev) => {
                ev.preventDefault();
                if (this.resolve) {
                    this.resolve(false);
                    this.resolve = undefined;
                }
                await this.close({ closeSource: "button" });
            };
        }
    }
    async _onClose(_options) {
        if (this.resolve) {
            this.resolve(false);
            this.resolve = undefined;
        }
        return super._onClose(_options);
    }
}
//# sourceMappingURL=stone-powers-dialog.js.map