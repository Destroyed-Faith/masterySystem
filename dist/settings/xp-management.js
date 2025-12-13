/**
 * XP Management Settings Application
 * Allows GM to view character XP spending and grant XP allowances
 */
// Use ApplicationV2 with HandlebarsApplicationMixin if available, otherwise fall back to Application
let BaseApplication;
if (foundry?.applications?.api?.ApplicationV2 && foundry?.applications?.api?.HandlebarsApplicationMixin) {
    BaseApplication = foundry.applications.api.ApplicationV2;
    // Apply HandlebarsApplicationMixin
    const HandlebarsMixin = foundry.applications.api.HandlebarsApplicationMixin;
    BaseApplication = HandlebarsMixin(BaseApplication);
}
else {
    BaseApplication = Application;
}
export class XpManagementSettings extends BaseApplication {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: 'mastery-xp-management',
            title: 'Character XP Management',
            template: 'systems/mastery-system/templates/settings/xp-management.hbs',
            width: 800,
            height: 600,
            resizable: true,
            tabs: [
                {
                    navSelector: '.tabs',
                    contentSelector: '.content',
                    initial: 'characters'
                }
            ]
        });
    }
    getData(options) {
        const data = super.getData ? super.getData(options) : {};
        // Get all player characters
        const characters = game.actors?.filter((actor) => actor.type === 'character') || [];
        // Prepare character data with XP information
        data.characters = characters.map((actor) => {
            const system = actor.system || {};
            const points = system.points || {};
            // Calculate spent XP
            // Attribute Points spent = sum of all attribute increases above base (2)
            let attributeXPSpent = 0;
            if (system.attributes) {
                Object.values(system.attributes).forEach((attr) => {
                    if (attr && typeof attr.value === 'number') {
                        const baseValue = 2;
                        const currentValue = attr.value || baseValue;
                        if (currentValue > baseValue) {
                            // Calculate cost for each point above base
                            for (let val = baseValue + 1; val <= currentValue; val++) {
                                let cost = 1;
                                if (val >= 9 && val <= 16)
                                    cost = 2;
                                else if (val >= 17 && val <= 24)
                                    cost = 3;
                                else if (val >= 25 && val <= 32)
                                    cost = 4;
                                else if (val >= 33)
                                    cost = 5;
                                attributeXPSpent += cost;
                            }
                        }
                    }
                });
            }
            // Mastery Points spent = sum of all skill increases
            let masteryXPSpent = 0;
            if (system.skills) {
                Object.values(system.skills).forEach((skillValue) => {
                    if (typeof skillValue === 'number' && skillValue > 0) {
                        // Cost: Level N → N+1 costs N points
                        for (let level = 1; level < skillValue; level++) {
                            masteryXPSpent += level;
                        }
                    }
                });
            }
            return {
                id: actor.id,
                name: actor.name,
                img: actor.img,
                player: game.users?.find((u) => u.character?.id === actor.id)?.name || 'Unassigned',
                attributeXP: {
                    spent: attributeXPSpent,
                    available: points.attribute || 0,
                    total: attributeXPSpent + (points.attribute || 0)
                },
                masteryXP: {
                    spent: masteryXPSpent,
                    available: points.mastery || 0,
                    total: masteryXPSpent + (points.mastery || 0)
                }
            };
        });
        return data;
    }
    // Implement required methods for ApplicationV2 with Handlebars
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
        // Handle grant XP buttons
        html.find('.grant-xp-btn').on('click', async (event) => {
            const button = $(event.currentTarget);
            const characterId = button.data('character-id');
            const xpType = button.data('xp-type'); // 'attribute' or 'mastery'
            const amount = parseInt(button.siblings(`.xp-amount-input[data-xp-type="${xpType}"]`).val()) || 0;
            if (amount <= 0) {
                ui.notifications?.warn('Please enter a valid amount greater than 0.');
                return;
            }
            const actor = game.actors?.get(characterId);
            if (!actor) {
                ui.notifications?.error('Character not found.');
                return;
            }
            const currentPoints = (actor.system?.points?.[xpType] || 0);
            await actor.update({
                [`system.points.${xpType}`]: currentPoints + amount
            });
            ui.notifications?.info(`Granted ${amount} ${xpType === 'attribute' ? 'Attribute' : 'Mastery'} XP to ${actor.name}.`);
            // Re-render to update display
            this.render();
        });
        // Handle bulk grant
        html.find('.bulk-grant-btn').on('click', async (event) => {
            const button = $(event.currentTarget);
            const xpType = button.data('xp-type');
            const amount = parseInt(html.find(`.bulk-xp-amount[data-xp-type="${xpType}"]`).val()) || 0;
            if (amount <= 0) {
                ui.notifications?.warn('Please enter a valid amount greater than 0.');
                return;
            }
            const characters = game.actors?.filter((actor) => actor.type === 'character') || [];
            let updated = 0;
            for (const actor of characters) {
                const currentPoints = (actor.system?.points?.[xpType] || 0);
                await actor.update({
                    [`system.points.${xpType}`]: currentPoints + amount
                });
                updated++;
            }
            ui.notifications?.info(`Granted ${amount} ${xpType === 'attribute' ? 'Attribute' : 'Mastery'} XP to ${updated} characters.`);
            // Re-render to update display
            this.render();
        });
    }
}
//# sourceMappingURL=xp-management.js.map