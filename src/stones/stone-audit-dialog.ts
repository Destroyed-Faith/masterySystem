/**
 * GM Stone audit dialog — Lifetime track vs pools vs Summon holds.
 */

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

const BaseDialog = HandlebarsApplicationMixin(ApplicationV2) as typeof ApplicationV2;

import { buildStoneAuditReport } from './stone-audit.js';

export class StoneAuditDialog extends BaseDialog {
  private actor: any;

  static DEFAULT_OPTIONS = {
    id: 'mastery-stone-audit',
    classes: ['mastery-system', 'stone-audit-dialog'],
    position: { width: 820, height: 'auto' as any },
    window: { title: 'Stone-Übersicht (GM)', resizable: true },
  };

  static PARTS = {
    content: { template: 'systems/mastery-system/templates/dialogs/stone-audit.hbs' },
  };

  static async show(actor: any): Promise<void> {
    if (!actor) return;
    const app = new StoneAuditDialog(actor);
    await (app as any).render({ force: true });
  }

  constructor(actor: any) {
    super({});
    this.actor = actor;
  }

  async _prepareContext(_options: any): Promise<any> {
    return { ...buildStoneAuditReport(this.actor) };
  }

  async _onRender(context: any, options: any): Promise<void> {
    await super._onRender?.(context, options);
    const root =
      (this as any).element?.[0] ??
      (this as any).element ??
      document.getElementById('mastery-stone-audit');
    if (!root) return;

    const syncBtn = root.querySelector('.js-audit-sync') as HTMLButtonElement | null;
    if (syncBtn) {
      syncBtn.onclick = async (ev) => {
        ev.preventDefault();
        try {
          const { syncStonePoolCapsFromAssignments, listStonePoolSyncActors } = await import(
            './stone-pool-sync.js'
          );
          for (const target of listStonePoolSyncActors(this.actor)) {
            await syncStonePoolCapsFromAssignments(target);
          }
          ui.notifications?.info('Stone-Pools an Lifetime-Leiste angepasst.');
        } catch (err) {
          console.warn('Mastery System | stone audit sync failed', err);
          ui.notifications?.warn('Sync fehlgeschlagen.');
        }
        await (this as any).render({ force: true });
      };
    }

    const readyBtn = root.querySelector('.js-audit-ready') as HTMLButtonElement | null;
    if (readyBtn) {
      readyBtn.onclick = async (ev) => {
        ev.preventDefault();
        try {
          const { forceReadyStonePoolsOnCharacter, listStonePoolSyncActors } = await import(
            './stone-pool-sync.js'
          );
          for (const target of listStonePoolSyncActors(this.actor)) {
            try {
              await target.unsetFlag?.('mastery-system', 'stoneUsage');
            } catch {
              /* ignore */
            }
          }
          const forced = await forceReadyStonePoolsOnCharacter(this.actor, null, {
            clearSummonSustained: false,
          });
          ui.notifications?.info(
            `Ready (Summon behalten) — Vitality ${forced.vitalityReady}, sealed ${forced.vitalitySealed}.`,
          );
        } catch (err) {
          console.warn('Mastery System | stone audit ready failed', err);
          ui.notifications?.warn('Ready fehlgeschlagen.');
        }
        await (this as any).render({ force: true });
      };
    }

    const readyAllBtn = root.querySelector('.js-audit-ready-all') as HTMLButtonElement | null;
    if (readyAllBtn) {
      readyAllBtn.onclick = async (ev) => {
        ev.preventDefault();
        const ok = await Dialog.confirm({
          title: 'Alles Ready?',
          content:
            '<p>Auch Summon-/Familiar-Sustained wird auf Ready gesetzt. Die Bonds bleiben in der Liste, die Steine sind aber nicht mehr als Sustained markiert — ggf. Bonds neu prüfen.</p>',
        });
        if (!ok) return;
        try {
          const { forceReadyStonePoolsOnCharacter, listStonePoolSyncActors } = await import(
            './stone-pool-sync.js'
          );
          for (const target of listStonePoolSyncActors(this.actor)) {
            try {
              await target.unsetFlag?.('mastery-system', 'stoneUsage');
            } catch {
              /* ignore */
            }
          }
          const forced = await forceReadyStonePoolsOnCharacter(this.actor, null, {
            clearSummonSustained: true,
          });
          ui.notifications?.info(
            `Alles Ready — Vitality ${forced.vitalityReady}, sealed ${forced.vitalitySealed}.`,
          );
        } catch (err) {
          console.warn('Mastery System | stone audit ready-all failed', err);
          ui.notifications?.warn('Ready (alles) fehlgeschlagen.');
        }
        await (this as any).render({ force: true });
      };
    }

    const closeBtn = root.querySelector('.js-audit-close') as HTMLButtonElement | null;
    if (closeBtn) {
      closeBtn.onclick = async (ev) => {
        ev.preventDefault();
        await (this as any).close();
      };
    }
  }
}

export async function openStoneAuditDialog(actor: any): Promise<void> {
  if (!(game as any).user?.isGM) {
    ui.notifications?.warn('Nur der GM kann die Stone-Übersicht öffnen.');
    return;
  }
  await StoneAuditDialog.show(actor);
}
