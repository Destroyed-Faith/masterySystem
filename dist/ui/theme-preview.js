/**
 * Theme Preview Application
 * Shows a preview of the current theme with sample content
 */
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
// Type workaround for Mixin
const BaseApp = HandlebarsApplicationMixin(ApplicationV2);
export class ThemePreviewApp extends BaseApp {
    static DEFAULT_OPTIONS = {
        id: "mastery-theme-preview",
        classes: ["mastery-system", "theme-preview"],
        position: { width: 700, height: 600 },
        window: { title: "Theme Preview", resizable: true }
    };
    static PARTS = {
        content: { template: "systems/mastery-system/templates/ui/theme-preview.hbs" }
    };
    static async show() {
        const existing = foundry.applications.instances.get("mastery-theme-preview");
        if (existing) {
            existing.bringToFront();
            return;
        }
        const app = new ThemePreviewApp();
        app.render({ force: true });
    }
    async _prepareContext(_options) {
        const currentTheme = game.settings?.get('mastery-system', 'uiTheme') || 'rulebook';
        return {
            currentTheme,
            themes: [
                { id: 'rulebook', name: 'Rulebook' },
                { id: 'ember', name: 'Ember' },
                { id: 'ashen', name: 'Ashen' },
                { id: 'bloodmoon', name: 'Bloodmoon' }
            ]
        };
    }
    async _onRender(_context, _options) {
        super._onRender?.(_context, _options);
        const root = this.element;
        if (!root)
            return;
        // Close button
        const closeBtn = root.querySelector('.close-button');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.close();
            });
        }
    }
}
//# sourceMappingURL=theme-preview.js.map