/**
 * GM Stone audit dialog — Lifetime track vs pools vs Summon holds.
 */
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const BaseDialog = HandlebarsApplicationMixin(ApplicationV2);
import { buildStoneAuditReport } from './stone-audit.js';
async function refreshOpenStonePowersDialog() {
    try {
        const existing = foundry?.applications?.instances?.get?.('mastery-stone-powers');
        if (existing?.render && existing.rendered !== false) {
            await existing.render({ force: true });
        }
    }
    catch {
        /* dialog optional */
    }
}
export class StoneAuditDialog extends BaseDialog {
    actor;
    static DEFAULT_OPTIONS = {
        id: 'mastery-stone-audit',
        classes: ['mastery-system', 'stone-audit-dialog'],
        position: { width: 820, height: 'auto' },
        window: { title: 'Stone-Übersicht (GM)', resizable: true },
    };
    static PARTS = {
        content: { template: 'systems/mastery-system/templates/dialogs/stone-audit.hbs' },
    };
    static async show(actor) {
        if (!actor)
            return;
        const app = new StoneAuditDialog(actor);
        await app.render({ force: true });
    }
    constructor(actor) {
        super({});
        this.actor = actor;
    }
    async _prepareContext(_options) {
        return { ...buildStoneAuditReport(this.actor) };
    }
    async _onRender(context, options) {
        await super._onRender?.(context, options);
        const root = this.element?.[0] ??
            this.element ??
            document.getElementById('mastery-stone-audit');
        if (!root)
            return;
        const syncBtn = root.querySelector('.js-audit-sync');
        if (syncBtn) {
            syncBtn.onclick = async (ev) => {
                ev.preventDefault();
                try {
                    const { syncStonePoolCapsFromAssignments, listStonePoolSyncActors } = await import('./stone-pool-sync.js');
                    for (const target of listStonePoolSyncActors(this.actor)) {
                        await syncStonePoolCapsFromAssignments(target);
                    }
                    ui.notifications?.info('Stone-Pools an Lifetime-Leiste angepasst.');
                    await refreshOpenStonePowersDialog();
                }
                catch (err) {
                    console.warn('Mastery System | stone audit sync failed', err);
                    ui.notifications?.warn('Sync fehlgeschlagen.');
                }
                await this.render({ force: true });
            };
        }
        const readyBtn = root.querySelector('.js-audit-ready');
        if (readyBtn) {
            readyBtn.onclick = async (ev) => {
                ev.preventDefault();
                try {
                    const { forceReadyStonePoolsOnCharacter, listStonePoolSyncActors, syncStonePoolCapsFromAssignments, } = await import('./stone-pool-sync.js');
                    for (const target of listStonePoolSyncActors(this.actor)) {
                        try {
                            await target.unsetFlag?.('mastery-system', 'stoneUsage');
                        }
                        catch {
                            /* ignore */
                        }
                        try {
                            await syncStonePoolCapsFromAssignments(target);
                        }
                        catch {
                            /* ignore */
                        }
                    }
                    const forced = await forceReadyStonePoolsOnCharacter(this.actor, null, {
                        clearSummonSustained: false,
                    });
                    ui.notifications?.info(`Ready (Summon behalten) — Vitality ${forced.vitalityReady}, sealed ${forced.vitalitySealed}.`);
                    await refreshOpenStonePowersDialog();
                }
                catch (err) {
                    console.warn('Mastery System | stone audit ready failed', err);
                    ui.notifications?.warn('Ready fehlgeschlagen.');
                }
                await this.render({ force: true });
            };
        }
        const readyAllBtn = root.querySelector('.js-audit-ready-all');
        if (readyAllBtn) {
            readyAllBtn.onclick = async (ev) => {
                ev.preventDefault();
                const ok = await Dialog.confirm({
                    title: 'Alles Ready?',
                    content: '<p>Auch Summon-/Familiar-Sustained wird auf Ready gesetzt. Die Bonds bleiben in der Liste, die Steine sind aber nicht mehr als Sustained markiert — ggf. Bonds neu prüfen.</p>',
                });
                if (!ok)
                    return;
                try {
                    const { forceReadyStonePoolsOnCharacter, listStonePoolSyncActors, syncStonePoolCapsFromAssignments, } = await import('./stone-pool-sync.js');
                    for (const target of listStonePoolSyncActors(this.actor)) {
                        try {
                            await target.unsetFlag?.('mastery-system', 'stoneUsage');
                        }
                        catch {
                            /* ignore */
                        }
                        try {
                            await syncStonePoolCapsFromAssignments(target);
                        }
                        catch {
                            /* ignore */
                        }
                    }
                    const forced = await forceReadyStonePoolsOnCharacter(this.actor, null, {
                        clearSummonSustained: true,
                    });
                    ui.notifications?.info(`Alles Ready — Vitality ${forced.vitalityReady}, sealed ${forced.vitalitySealed}.`);
                    await refreshOpenStonePowersDialog();
                }
                catch (err) {
                    console.warn('Mastery System | stone audit ready-all failed', err);
                    ui.notifications?.warn('Ready (alles) fehlgeschlagen.');
                }
                await this.render({ force: true });
            };
        }
        const closeBtn = root.querySelector('.js-audit-close');
        if (closeBtn) {
            closeBtn.onclick = async (ev) => {
                ev.preventDefault();
                await this.close();
            };
        }
    }
}
export async function openStoneAuditDialog(actor) {
    if (!game.user?.isGM) {
        ui.notifications?.warn('Nur der GM kann die Stone-Übersicht öffnen.');
        return;
    }
    await StoneAuditDialog.show(actor);
}
//# sourceMappingURL=stone-audit-dialog.js.map