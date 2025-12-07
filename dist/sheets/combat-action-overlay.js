/**
 * Combat Action Overlay
 * 
 * Shows an overlay during a character's turn displaying:
 * - Available actions (Attack/Movement/Reaction)
 * - Combat powers
 * - Resource status (Stones, Vitality, Stress)
 * - Quick action buttons
 */
export class CombatActionOverlay extends Application {
    actor;
    static get defaultOptions() {
        const opts = super.defaultOptions;
        opts.id = 'mastery-combat-overlay';
        opts.template = 'systems/mastery-system/templates/dialogs/combat-overlay.hbs';
        opts.classes = ['mastery-system', 'combat-overlay'];
        opts.width = 750;
        opts.height = 'auto';
        opts.popOut = true;
        opts.title = 'Combat Actions';
        opts.resizable = false;
        return opts;
    }
    /**
     * Show combat overlay for the current turn
     * @param combat - Active combat
     */
    static async showForCurrentTurn(combat) {
        const current = combat.combatant;
        const actor = current?.actor;
        if (!actor) {
            console.log('Mastery System | No actor for current combatant');
            return;
        }
        const user = game.user;
        if (!user)
            return;
        // Only show to owner or GM
        if (!user.isGM && !actor.isOwner) {
            console.log('Mastery System | User does not own current combatant');
            return;
        }
        const app = new CombatActionOverlay(actor);
        app.render(true);
    }
    constructor(actor, options = {}) {
        super(options);
        this.actor = actor;
    }
    /**
     * Prepare active powers for the actor (combat-usable powers)
     */
    prepareActivePowers() {
        const powers = [];
        const actorItems = this.actor.items;
        if (!actorItems)
            return powers;
        for (const item of actorItems) {
            if (item.type !== 'special')
                continue;
            const powerType = item.system.powerType;
            // Filter combat-usable power types
            if (['movement', 'active', 'utility', 'reaction'].includes(powerType)) {
                powers.push({
                    id: item.id,
                    name: item.name,
                    powerType,
                    level: item.system.level || 1,
                    range: item.system.range || '0m',
                    stoneCost: item.system.stoneCost || 0,
                    description: item.system.description || '',
                    equipped: item.system.equipped !== false
                });
            }
        }
        // Sort by power type then level
        powers.sort((a, b) => {
            const typeOrder = {
                movement: 0,
                active: 1,
                utility: 2,
                reaction: 3
            };
            const typeCompare = (typeOrder[a.powerType] ?? 99) - (typeOrder[b.powerType] ?? 99);
            if (typeCompare !== 0)
                return typeCompare;
            return a.level - b.level;
        });
        return powers;
    }
    async getData() {
        const system = this.actor.system;
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
    activateListeners(html) {
        super.activateListeners(html);
        // Use a power
        html.find('.js-use-power').on('click', async (ev) => {
            ev.preventDefault();
            const powerId = String($(ev.currentTarget).data('power-id') ?? '');
            const powerType = String($(ev.currentTarget).data('power-type') ?? '');
            if (!powerId)
                return;
            const actorItems = this.actor.items;
            const item = actorItems?.get(powerId);
            if (!item) {
                ui.notifications?.error('Power not found!');
                return;
            }
            // Use different handlers based on power type
            try {
                switch (powerType) {
                    case 'movement':
                        const { useMovementPower } = await import('../powers/movement.js');
                        await useMovementPower(this.actor, item);
                        break;
                    case 'utility':
                        const { activateUtility } = await import('../powers/utilities.js');
                        await activateUtility(this.actor, item, null);
                        break;
                    default:
                        ui.notifications?.info(`Using power: ${item.name} (${powerType})`);
                        // For active/reaction powers, you can add specific logic later
                        break;
                }
                this.render(false);
            }
            catch (error) {
                console.error('Mastery System | Error using power:', error);
                ui.notifications?.error(`Failed to use power: ${item.name}`);
            }
        });
        // Mark action as used
        html.find('.js-use-action').on('click', async (ev) => {
            ev.preventDefault();
            const actionType = String($(ev.currentTarget).data('action-type') ?? '');
            if (!actionType)
                return;
            const { useAction } = await import('../combat/actions.js');
            const success = await useAction(this.actor, actionType, 1);
            if (success) {
                this.render(false);
            }
        });
        // Undo action
        html.find('.js-undo-action').on('click', async (ev) => {
            ev.preventDefault();
            const actionType = String($(ev.currentTarget).data('action-type') ?? '');
            if (!actionType)
                return;
            const system = this.actor.system;
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
//# sourceMappingURL=combat-action-overlay.js.map
