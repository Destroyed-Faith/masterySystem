import { listSceneEncounterTokens, requestStartEncounter } from '../combat/start-encounter.js';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const BaseDialog = HandlebarsApplicationMixin(ApplicationV2) as typeof ApplicationV2;

export class StartEncounterDialog extends BaseDialog {
  static DEFAULT_OPTIONS = {
    id: 'mastery-start-encounter',
    classes: ['mastery-system', 'start-encounter-dialog'],
    position: { width: 480 },
    window: { title: 'Start Encounter', resizable: false },
  };

  static PARTS = {
    content: { template: 'systems/mastery-system/templates/ui/start-encounter-dialog.hbs' },
  };

  static open(): void {
    const existing = foundry.applications.instances.get('mastery-start-encounter') as
      | StartEncounterDialog
      | undefined;
    if (existing) {
      (existing as any).bringToFront();
      return;
    }
    void new StartEncounterDialog().render(true);
  }

  async _prepareContext(_options: any): Promise<any> {
    const tokens = listSceneEncounterTokens();
    return {
      tokens,
      hasTokens: tokens.length > 0,
      openLocally: true,
    };
  }

  async _onRender(_context: any, _options: any): Promise<void> {
    super._onRender?.(_context, _options);
    const root = (this as any).element as HTMLElement | undefined;
    if (!root) return;
    root.querySelector('[data-action="cancel"]')?.addEventListener('click', (ev) => {
      ev.preventDefault();
      void (this as any).close();
    });
    root.querySelector('[data-action="start"]')?.addEventListener('click', (ev) => {
      ev.preventDefault();
      void this.#start();
    });
    root.querySelector('[data-action="toggle-all"]')?.addEventListener('click', (ev) => {
      ev.preventDefault();
      const boxes = root.querySelectorAll<HTMLInputElement>('input[name="tokenId"]');
      const allOn = Array.from(boxes).every((b) => b.checked);
      boxes.forEach((b) => {
        b.checked = !allOn;
      });
    });
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
