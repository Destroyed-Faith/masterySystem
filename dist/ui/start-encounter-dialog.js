import { listSceneEncounterTokens, requestStartEncounter } from '../combat/start-encounter.js';
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const BaseDialog = HandlebarsApplicationMixin(ApplicationV2);
export class StartEncounterDialog extends BaseDialog {
    static DEFAULT_OPTIONS = {
        id: 'mastery-start-encounter',
        classes: ['mastery-system', 'start-encounter-dialog'],
        position: { width: 520, height: 'auto' },
        window: { title: 'Kampf vorbereiten', icon: 'fa-solid fa-swords', resizable: true },
        actions: {
            start: function (event) {
                event.preventDefault();
                void this.#start();
            },
            cancel: function (event) {
                event.preventDefault();
                void this.close();
            },
            'toggle-all': function (event) {
                event.preventDefault();
                const root = this.element;
                if (!root)
                    return;
                const boxes = root.querySelectorAll('input[name="tokenId"]');
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
    static async open() {
        try {
            const existing = foundry.applications.instances.get('mastery-start-encounter');
            if (existing) {
                if (existing.rendered) {
                    existing.bringToFront();
                    await existing.render({ force: true });
                    return;
                }
                await existing.close();
            }
            await new StartEncounterDialog().render({ force: true });
        }
        catch (err) {
            console.error('Mastery System | Start Encounter dialog failed to open', err);
            ui.notifications?.error('Start Encounter Dialog konnte nicht geöffnet werden');
        }
    }
    async _prepareContext(_options) {
        const tokens = listSceneEncounterTokens();
        return {
            tokens,
            hasTokens: tokens.length > 0,
            openLocally: false,
        };
    }
    async #start() {
        const root = this.element;
        if (!root)
            return;
        const tokenIds = Array.from(root.querySelectorAll('input[name="tokenId"]:checked')).map((el) => el.value);
        const openLocally = !!(root.querySelector('input[name="openLocally"]')?.checked);
        try {
            await requestStartEncounter({ tokenIds, openLocally });
            await this.close();
        }
        catch (err) {
            console.error('Mastery System | Start Encounter failed', err);
            ui.notifications?.error('Start Encounter fehlgeschlagen');
        }
    }
}
//# sourceMappingURL=start-encounter-dialog.js.map