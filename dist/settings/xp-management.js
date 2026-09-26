/**
 * XP Management Settings Application
 * Allows GM to view character XP spending and grant XP allowances
 */
import { appraiseBuild } from '../progression/build-value.js';
import { nextLifetimeXp } from '../progression/v099-rules.js';
import { actorHasPostCreationSnapshot, resetActorProgressToPostCreation } from '../utils/xp-post-creation.js';
import { openXpHistoryDialog } from '../utils/xp-history.js';
import { confirmAndApplySafeHavenRestToAllCharacters } from '../utils/safe-haven-rest.js';
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
            const available = points.xp ?? 0;
            const freeAvailable = points.xpFree ?? 0;
            const freeEarned = xp.freeEarned ?? 0;
            const earnedAll = totalEarned + freeEarned;
            const spentAll = Math.max(0, earnedAll - (available + freeAvailable));
            return {
                id: actor.id,
                name: actor.name,
                img: actor.img,
                hasPostCreationSnapshot: actorHasPostCreationSnapshot(actor),
                xp: {
                    spent: spentAll,
                    available: available,
                    freeAvailable: freeAvailable,
                    freeEarned: freeEarned,
                    totalEarned: earnedAll,
                    regularEarned: totalEarned,
                }
            };
        });
        data.buildValues = game.user?.isGM === false ? [] : characters.map((actor) => {
            const value = appraiseBuild(actor);
            return {
                id: actor.id,
                name: actor.name,
                hasPostCreationSnapshot: actorHasPostCreationSnapshot(actor),
                afterSpend: value.net + value.unspentFreeXp,
                ...value,
                skillBasisLabel: value.skillBasis === 'snapshot' ? 'Snapshot' : 'Startregel',
                skillNote: value.notes.filter((note) => note.startsWith('Skill-Start')).join(' '),
                artifactNote: value.notes.filter((note) => note.includes('L')).join(' ') || 'Stufe 1 und Aktivieren: 0',
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
        const applyXpTarget = () => {
            const raw = String(html.find('.xp-target-input').val() ?? '').trim();
            const goal = raw === '' ? 0 : Math.floor(Number(raw));
            const hasTarget = Number.isFinite(goal) && goal > 0;
            html.find('tr[data-after-spend]').each((_, rowEl) => {
                const row = $(rowEl);
                const after = Math.floor(Number(row.attr('data-after-spend')) || 0);
                const need = hasTarget ? Math.max(0, goal - after) : 0;
                row.find('.xp-to-target').text(hasTarget ? String(need) : '—');
                row.find('.free-xp-amount-input').val(hasTarget ? need : 0);
            });
        };
        html.find('.xp-target-input').on('input', applyXpTarget);
        html.find('.xp-target-input').on('keydown', (event) => {
            if (event.key === 'Enter')
                event.preventDefault();
        });
        // Helper function to get XP state
        const getXpState = (actor) => {
            const system = actor.system || {};
            const points = system.points || {};
            const xp = system.xp || {};
            return {
                available: points.xp ?? 0,
                freeAvailable: points.xpFree ?? 0,
                freeEarned: xp.freeEarned ?? 0,
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
            const life = nextLifetimeXp(actor.system, amount);
            if (life != null)
                updates['system.progression.lifetimeXp'] = life;
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
        // Handle grant FREE XP buttons (spent first, no once-per-step limit)
        html.find('.grant-free-xp-btn').on('click', async (event) => {
            const button = $(event.currentTarget);
            const characterId = button.data('character-id');
            const amount = parseInt(button.siblings('.free-xp-amount-input').val()) || 0;
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
                'system.points.xpFree': xpState.freeAvailable + amount,
                'system.xp.freeEarned': xpState.freeEarned + amount,
            };
            const life = nextLifetimeXp(actor.system, amount);
            if (life != null)
                updates['system.progression.lifetimeXp'] = life;
            if (!actor.system.xp) {
                updates['system.xp.totalSpent'] = 0;
                updates['system.xp.history'] = [];
            }
            await actor.update(updates);
            const user = game.user;
            const historyEntry = {
                ts: Date.now(),
                userId: user?.id || '',
                userName: user?.name || 'System',
                kind: 'grant',
                category: 'xp',
                amount: amount,
                note: 'free',
                before: beforeState,
                after: {
                    available: xpState.available,
                    totalEarned: xpState.totalEarned,
                    totalSpent: xpState.totalSpent,
                }
            };
            pushXpHistory(actor, historyEntry);
            await actor.update({ 'system.xp.history': actor.system.xp.history });
            ui.notifications?.info(`Granted ${amount} Free XP to ${actor.name}.`);
            this.render();
        });
        html.find('.deduct-free-xp-btn').on('click', async (event) => {
            const button = $(event.currentTarget);
            if (!game.user?.isGM)
                return;
            const characterId = button.data('character-id');
            const requested = parseInt(button.siblings('.free-xp-amount-input').val()) || 0;
            if (requested <= 0) {
                ui.notifications?.warn('Bitte einen Betrag größer als 0 eingeben.');
                return;
            }
            const actor = game.actors?.get(characterId);
            if (!actor)
                return;
            const xpState = getXpState(actor);
            const amount = Math.min(requested, Math.max(0, xpState.freeAvailable));
            if (amount <= 0) {
                ui.notifications?.warn(`${actor.name} hat keine freien Bonus-XP zum Zurücknehmen.`);
                return;
            }
            await actor.update({
                'system.points.xpFree': xpState.freeAvailable - amount,
                'system.xp.freeEarned': Math.max(0, xpState.freeEarned - amount),
            });
            pushXpHistory(actor, {
                ts: Date.now(),
                userId: game.user?.id || '',
                userName: game.user?.name || 'GM',
                kind: 'adjust',
                category: 'xp',
                amount: -amount,
                note: 'GM: Free XP zurückgenommen (nicht ausgegeben).',
                before: { freeAvailable: xpState.freeAvailable },
                after: { freeAvailable: xpState.freeAvailable - amount },
            });
            await actor.update({ 'system.xp.history': actor.system.xp.history });
            ui.notifications?.info(`${actor.name}: ${amount} Bonus-XP zurückgenommen.`);
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
                const life = nextLifetimeXp(actor.system, amount);
                if (life != null)
                    updates['system.progression.lifetimeXp'] = life;
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
        // Handle bulk FREE grant (spent first, no once-per-step limit)
        html.find('.bulk-grant-free-btn').on('click', async () => {
            const amount = parseInt(html.find('.bulk-free-xp-amount').val()) || 0;
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
                    'system.points.xpFree': xpState.freeAvailable + amount,
                    'system.xp.freeEarned': xpState.freeEarned + amount,
                };
                const life = nextLifetimeXp(actor.system, amount);
                if (life != null)
                    updates['system.progression.lifetimeXp'] = life;
                if (!actor.system.xp) {
                    updates['system.xp.totalSpent'] = 0;
                    updates['system.xp.history'] = [];
                }
                await actor.update(updates);
                const historyEntry = {
                    ts: Date.now(),
                    userId: user?.id || '',
                    userName: user?.name || 'System',
                    kind: 'grant',
                    category: 'xp',
                    amount: amount,
                    note: 'free',
                    before: beforeState,
                    after: {
                        available: xpState.available,
                        totalEarned: xpState.totalEarned,
                        totalSpent: xpState.totalSpent,
                    }
                };
                pushXpHistory(actor, historyEntry);
                await actor.update({ 'system.xp.history': actor.system.xp.history });
                updated++;
            }
            ui.notifications?.info(`Granted ${amount} Free XP to ${updated} characters.`);
            this.render();
        });
        html.find('.party-safe-haven-btn').on('click', async () => {
            await confirmAndApplySafeHavenRestToAllCharacters();
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
            openXpHistoryDialog(actor, { onCleared: () => this.render() });
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