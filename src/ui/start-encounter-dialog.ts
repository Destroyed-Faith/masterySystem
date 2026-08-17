import { listSceneEncounterTokens, requestStartEncounter } from '../combat/start-encounter.js';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const BaseDialog = HandlebarsApplicationMixin(ApplicationV2) as typeof ApplicationV2;

export class StartEncounterDialog extends BaseDialog {
  static DEFAULT_OPTIONS = {
    id: 'mastery-start-encounter',
    classes: ['mastery-system', 'start-encounter-dialog'],
    position: { width: 520, height: 'auto' },
    window: { title: 'Kampf vorbereiten', icon: 'fa-solid fa-swords', resizable: true },
    actions: {
      start: function (this: StartEncounterDialog, event: Event) {
        event.preventDefault();
        void this.#start();
      },
      cancel: function (this: StartEncounterDialog, event: Event) {
        event.preventDefault();
        void (this as any).close();
      },
      'toggle-all': function (this: StartEncounterDialog, event: Event) {
        event.preventDefault();
        const root = (this as any).element as HTMLElement | undefined;
        if (!root) return;
        const boxes = root.querySelectorAll<HTMLInputElement>('input[name="tokenId"]');
        const allOn = Array.from(boxes).every((b) => b.checked);
        boxes.forEach((b) => {
          b.checked = !allOn;
        });
      },
    },
  };

  static PARTS = {
    content: { template: 'systems/mastery-system/templates/ui/start-encounter-dialog.hbs' },
  };

  static async open(): Promise<void> {
    try {
      const existing = foundry.applications.instances.get('mastery-start-encounter') as
        | StartEncounterDialog
        | undefined;
      if (existing) {
        if ((existing as any).rendered) {
          (existing as any).bringToFront();
          await (existing as any).render({ force: true });
          return;
        }
        await (existing as any).close();
      }
      await (new StartEncounterDialog() as any).render({ force: true });
    } catch (err) {
      console.error('Mastery System | Start Encounter dialog failed to open', err);
      ui.notifications?.error('Start Encounter Dialog konnte nicht geöffnet werden');
    }
  }

  async _prepareContext(_options: any): Promise<any> {
    const tokens = listSceneEncounterTokens();
    return {
      tokens,
      hasTokens: tokens.length > 0,
      openLocally: false,
    };
  }

  async #start(): Promise<void> {
    const root = (this as any).element as HTMLElement | undefined;
    if (!root) return;
    const tokenIds = Array.from(root.querySelectorAll<HTMLInputElement>('input[name="tokenId"]:checked')).map(
      (el) => el.value,
    );
    const openLocally = !!(root.querySelector<HTMLInputElement>('input[name="openLocally"]')?.checked);
    try {
      await requestStartEncounter({ tokenIds, openLocally });
      await (this as any).close();
    } catch (err) {
      console.error('Mastery System | Start Encounter failed', err);
      ui.notifications?.error('Start Encounter fehlgeschlagen');
    }
  }
}
