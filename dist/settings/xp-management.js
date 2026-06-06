/**
 * XP Management Settings Application
 * Allows GM to view character XP spending and grant XP allowances
 */
import { actorHasPostCreationSnapshot, resetActorProgressToPostCreation } from '../utils/xp-post-creation.js';
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
        const baseOptions = super.defaultOptions || {};
        return foundry.utils.mergeObject(baseOptions, {
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
            const xp = system.xp || {};
            const totalEarned = xp.totalEarned ?? 0;
            const totalSpent = xp.totalSpent ?? 0;
            const available = points.xp ?? 0;
            /**
             * New spec — once-per-step rule. Surface the current step's bumped
             * lists for the GM table.
             */
            const stepRaw = xp.currentStep ?? {};
            const sanitize = (input) => Array.isArray(input) ? input.map((v) => String(v ?? '')).filter((s) => s.length > 0) : [];
            const currentStep = {
                attributes: sanitize(stepRaw.attributes),
                skills: sanitize(stepRaw.skills),
                powers: sanitize(stepRaw.powers),
                artifacts: sanitize(stepRaw.artifacts),
            };
            const stepSummary = (() => {
                const parts = [];
                if (currentStep.attributes.length)
                    parts.push(`Attrs: ${currentStep.attributes.join(', ')}`);
                if (currentStep.skills.length)
                    parts.push(`Skills: ${currentStep.skills.join(', ')}`);
                if (currentStep.powers.length)
                    parts.push(`Powers: ${currentStep.powers.length}`);
                if (currentStep.artifacts.length)
                    parts.push(`Artifacts: ${currentStep.artifacts.length}`);
                return parts.length ? parts.join(' | ') : 'No bumps';
            })();
            const stepTotal = currentStep.attributes.length +
                currentStep.skills.length +
                currentStep.powers.length +
                currentStep.artifacts.length;
            return {
                id: actor.id,
                name: actor.name,
                img: actor.img,
                player: game.users?.find((u) => u.character?.id === actor.id)?.name || 'Unassigned',
                hasPostCreationSnapshot: actorHasPostCreationSnapshot(actor),
                xp: {
                    spent: totalSpent,
                    available: available,
                    totalEarned: totalEarned,
                    currentStep,
                    stepSummary,
                    stepTotal,
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
        // Helper function to get XP state
        const getXpState = (actor) => {
            const system = actor.system || {};
            const points = system.points || {};
            const xp = system.xp || {};
            return {
                available: points.xp ?? 0,
                totalEarned: xp.totalEarned ?? 0,
                totalSpent: xp.totalSpent ?? 0,
                history: xp.history ?? []
            };
        };
        // Helper function to push XP history
        const pushXpHistory = (actor, entry) => {
            const system = actor.system || {};
            if (!system.xp) {
                system.xp = { totalEarned: 0, totalSpent: 0, history: [] };
            }
            if (!system.xp.history) {
                system.xp.history = [];
            }
            system.xp.history.push(entry);
            if (system.xp.history.length > 200) {
                system.xp.history = system.xp.history.slice(-200);
            }
        };
        // Handle grant XP buttons
        html.find('.grant-xp-btn').on('click', async (event) => {
            const button = $(event.currentTarget);
            const characterId = button.data('character-id');
            const amount = parseInt(button.siblings('.xp-amount-input').val()) || 0;
            if (amount <= 0) {
                ui.notifications?.warn('Please enter a valid amount greater than 0.');
                return;
            }
            const actor = game.actors?.get(characterId);
            if (!actor) {
                ui.notifications?.error('Character not found.');
                return;
            }
            const xpState = getXpState(actor);
            const beforeState = {
                available: xpState.available,
                totalEarned: xpState.totalEarned,
                totalSpent: xpState.totalSpent,
            };
            const updates = {
                'system.points.xp': xpState.available + amount,
                'system.xp.totalEarned': xpState.totalEarned + amount
            };
            // Initial post-creation award (the "D&D → this system" conversion batch)
            // may be spent freely; every later award re-imposes the once-per-step
            // "+1" rule on Attributes / Skills. First award == totalEarned was 0.
            updates['system.xp.initialAwardUnrestricted'] = (xpState.totalEarned ?? 0) <= 0;
            if (!actor.system.xp) {
                updates['system.xp.totalSpent'] = 0;
                updates['system.xp.history'] = [];
            }
            await actor.update(updates);
            // Add history entry
            const user = game.user;
            const historyEntry = {
                ts: Date.now(),
                userId: user?.id || '',
                userName: user?.name || 'System',
                kind: 'grant',
                category: 'xp',
                amount: amount,
                before: beforeState,
                after: {
                    available: xpState.available + amount,
                    totalEarned: xpState.totalEarned + amount,
                    totalSpent: xpState.totalSpent,
                }
            };
            pushXpHistory(actor, historyEntry);
            await actor.update({ 'system.xp.history': actor.system.xp.history });
            ui.notifications?.info(`Granted ${amount} XP to ${actor.name}.`);
            // Re-render to update display
            this.render();
        });
        // Handle bulk grant
        html.find('.bulk-grant-btn').on('click', async (event) => {
            const amount = parseInt(html.find('.bulk-xp-amount').val()) || 0;
            if (amount <= 0) {
                ui.notifications?.warn('Please enter a valid amount greater than 0.');
                return;
            }
            const characters = game.actors?.filter((actor) => actor.type === 'character') || [];
            let updated = 0;
            const user = game.user;
            for (const actor of characters) {
                const xpState = getXpState(actor);
                const beforeState = {
                    available: xpState.available,
                    totalEarned: xpState.totalEarned,
                    totalSpent: xpState.totalSpent,
                };
                const updates = {
                    'system.points.xp': xpState.available + amount,
                    'system.xp.totalEarned': xpState.totalEarned + amount
                };
                // First award (totalEarned was 0) is the free-spend conversion batch;
                // later awards re-impose the once-per-step rule.
                updates['system.xp.initialAwardUnrestricted'] = (xpState.totalEarned ?? 0) <= 0;
                if (!actor.system.xp) {
                    updates['system.xp.totalSpent'] = 0;
                    updates['system.xp.history'] = [];
                }
                await actor.update(updates);
                // Add history entry
                const historyEntry = {
                    ts: Date.now(),
                    userId: user?.id || '',
                    userName: user?.name || 'System',
                    kind: 'grant',
                    category: 'xp',
                    amount: amount,
                    before: beforeState,
                    after: {
                        available: xpState.available + amount,
                        totalEarned: xpState.totalEarned + amount,
                        totalSpent: xpState.totalSpent,
                    }
                };
                pushXpHistory(actor, historyEntry);
                await actor.update({ 'system.xp.history': actor.system.xp.history });
                updated++;
            }
            ui.notifications?.info(`Granted ${amount} XP to ${updated} characters.`);
            // Re-render to update display
            this.render();
        });
        // History button
        html.find('.history-xp-btn').on('click', async (event) => {
            const button = $(event.currentTarget);
            const characterId = button.data('character-id');
            const actor = game.actors?.get(characterId);
            if (!actor) {
                ui.notifications?.error('Character not found.');
                return;
            }
            const xpState = getXpState(actor);
            const history = xpState.history.slice(-50).reverse(); // Last 50, newest first
            let historyContent = '<div class="xp-history-dialog">';
            historyContent += `<h3>XP History: ${actor.name}</h3>`;
            historyContent += '<table class="xp-history-table"><thead><tr>';
            historyContent += '<th>Time</th><th>Kind</th><th>Category</th><th>Amount</th><th>Note/Details</th>';
            historyContent += '</tr></thead><tbody>';
            if (history.length === 0) {
                historyContent += '<tr><td colspan="5" class="empty-message">No history entries.</td></tr>';
            }
            else {
                history.forEach((entry) => {
                    const date = new Date(entry.ts);
                    const timeStr = date.toLocaleString();
                    const detailsStr = entry.details ? JSON.stringify(entry.details, null, 0).substring(0, 100) : (entry.note || '—');
                    historyContent += `<tr>`;
                    historyContent += `<td>${timeStr}</td>`;
                    historyContent += `<td>${entry.kind}</td>`;
                    historyContent += `<td>${entry.category}</td>`;
                    historyContent += `<td>${entry.amount}</td>`;
                    historyContent += `<td title="${detailsStr.length > 100 ? detailsStr : ''}">${detailsStr.length > 50 ? detailsStr.substring(0, 50) + '...' : detailsStr}</td>`;
                    historyContent += `</tr>`;
                });
            }
            historyContent += '</tbody></table>';
            if (game.user?.isGM && history.length > 0) {
                historyContent += '<div class="history-actions">';
                historyContent += `<button type="button" class="clear-history-btn" data-character-id="${characterId}">Clear History</button>`;
                historyContent += '</div>';
            }
            historyContent += '</div>';
            new Dialog({
                title: `XP History: ${actor.name}`,
                content: historyContent,
                buttons: {
                    close: {
                        label: 'Close',
                        callback: () => { }
                    }
                },
                default: 'close',
                render: (html) => {
                    html.find('.clear-history-btn').on('click', async () => {
                        await actor.update({ 'system.xp.history': [] });
                        ui.notifications?.info(`Cleared XP history for ${actor.name}.`);
                        this.render();
                        html.closest('.dialog').find('.close').click();
                    });
                }
            }).render(true);
        });
        /**
         * New spec — End the current Upgrade Step. Clears the once-per-step
         * bump lists so the next click of "+" on each Attribute / Skill /
         * Power / Artifact is allowed again.
         */
        html.find('.end-xp-step-btn').on('click', async (event) => {
            const button = $(event.currentTarget);
            const characterId = button.data('character-id');
            const actor = game.actors?.get(characterId);
            if (!actor) {
                ui.notifications?.error('Character not found.');
                return;
            }
            const isOwner = actor.isOwner || game.user?.isGM;
            if (!isOwner) {
                ui.notifications?.warn('Only the owner (or GM) can end this character\'s XP step.');
                return;
            }
            const stepRule = await import('../utils/xp-step-rule.js');
            const before = stepRule.readStep(actor);
            await stepRule.endStep(actor);
            const summary = [
                `${before.attributes.length} attr`,
                `${before.skills.length} skill`,
                `${before.powers.length} power`,
                `${before.artifacts.length} artifact`,
            ].join(', ');
            ui.notifications?.info(`XP step ended for ${actor.name} (${summary}).`);
            this.render();
        });
        html.find('.reset-progress-xp-btn').on('click', async (event) => {
            const button = $(event.currentTarget);
            if (button.prop('disabled'))
                return;
            if (!game.user?.isGM)
                return;
            const characterId = button.data('character-id');
            const actor = game.actors?.get(characterId);
            if (!actor) {
                ui.notifications?.error('Character not found.');
                return;
            }
            if (!actorHasPostCreationSnapshot(actor)) {
                ui.notifications?.warn('No post-creation snapshot for this actor. Complete character creation on the current system version.');
                return;
            }
            const totalEarned = actor.system?.xp?.totalEarned ?? 0;
            const user = game.user;
            new Dialog({
                title: `Reset progression: ${actor.name}`,
                content: `<p class="xp-reset-confirm">Restore <strong>attributes</strong>, <strong>skills</strong>, <strong>power levels</strong>, and <strong>skill session spend</strong> to the stored post-creation state. All <strong>${totalEarned}</strong> earned XP will be available again. A <strong>GM reset</strong> entry is appended to XP history.</p>`,
                buttons: {
                    reset: {
                        icon: '<i class="fas fa-undo"></i>',
                        label: 'Reset progression',
                        callback: async () => {
                            const res = await resetActorProgressToPostCreation(actor, {
                                gmUserId: user?.id || '',
                                gmUserName: user?.name || 'GM'
                            });
                            if (!res.ok) {
                                ui.notifications?.error(res.error || 'Reset failed.');
                                return;
                            }
                            ui.notifications?.info(`Progression reset to post-creation for ${actor.name}.`);
                            this.render();
                        }
                    },
                    cancel: {
                        label: 'Cancel',
                        callback: () => { }
                    }
                },
                default: 'cancel'
            }).render(true);
        });
    }
}
//# sourceMappingURL=xp-management.js.map