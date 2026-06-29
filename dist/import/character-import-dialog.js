/**
 * GM dialog — import a homepage character JSON file.
 */
import { importMasteryCharacterFromJson, validateCharacterImportJson, } from './character-import.js';
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const BaseDialog = HandlebarsApplicationMixin(ApplicationV2);
export class CharacterImportDialog extends BaseDialog {
    jsonText = '';
    validationMessage = 'Paste or upload a JSON file to validate.';
    validationOk = false;
    static DEFAULT_OPTIONS = {
        id: 'mastery-character-import-dialog',
        classes: ['mastery-system', 'character-import-app'],
        position: { width: 720, height: 560 },
        window: {
            title: 'Import Character (Homepage JSON)',
            resizable: true,
        },
    };
    static PARTS = {
        body: {
            template: 'systems/mastery-system/templates/import/character-import-dialog.hbs',
        },
    };
    async _prepareContext(_options) {
        return {
            jsonText: this.jsonText,
            validationMessage: this.validationMessage,
            validationOk: this.validationOk,
            schemaVersion: 1,
            exportKind: 'mastery-character-import',
        };
    }
    _onRender(context, options) {
        super._onRender(context, options);
        const root = this.element;
        const textarea = root.querySelector('.js-ci-json');
        const fileInput = root.querySelector('.js-ci-file');
        const validateBtn = root.querySelector('.js-ci-validate');
        const importBtn = root.querySelector('.js-ci-import');
        if (textarea) {
            textarea.value = this.jsonText;
            textarea.addEventListener('input', () => {
                this.jsonText = textarea.value;
                this.validationOk = false;
                this.validationMessage = 'Changed — click Validate before importing.';
                this.render(false);
            });
        }
        fileInput?.addEventListener('change', async () => {
            const file = fileInput.files?.[0];
            if (!file)
                return;
            this.jsonText = await file.text();
            this.validationOk = false;
            this.validationMessage = `Loaded "${file.name}". Click Validate.`;
            this.render(false);
        });
        validateBtn?.addEventListener('click', (ev) => {
            ev.preventDefault();
            const result = validateCharacterImportJson(this.jsonText);
            this.validationOk = result.ok;
            const lines = [...result.errors, ...result.warnings.map((w) => `⚠ ${w}`)];
            this.validationMessage = lines.length
                ? lines.join('\n')
                : `Valid ${result.kind ?? 'document'} — ready to import.`;
            this.render(false);
        });
        importBtn?.addEventListener('click', async (ev) => {
            ev.preventDefault();
            if (!this.validationOk) {
                ui.notifications?.warn('Validate the JSON first.');
                return;
            }
            importBtn.disabled = true;
            try {
                const result = await importMasteryCharacterFromJson(this.jsonText);
                if (!result.ok) {
                    ui.notifications?.error(result.errors?.join(' ') ?? 'Import failed.');
                    return;
                }
                for (const w of result.warnings ?? []) {
                    ui.notifications?.warn(w);
                }
                if (result.actor) {
                    result.actor.sheet?.render(true);
                }
                this.close();
            }
            finally {
                importBtn.disabled = false;
            }
        });
    }
}
export function showCharacterImportDialog() {
    if (!game.user?.isGM) {
        ui.notifications?.warn('Only the GM can import characters.');
        return;
    }
    new CharacterImportDialog().render(true);
}
//# sourceMappingURL=character-import-dialog.js.map