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
    previewTheme;
    originalTheme;
    static async show(theme) {
        const existing = foundry.applications.instances.get("mastery-theme-preview");
        if (existing) {
            // Update theme if provided
            if (theme) {
                existing.previewTheme = theme;
                // Temporarily apply theme class for preview
                const currentTheme = game.settings?.get('mastery-system', 'uiTheme') || 'rulebook';
                if (!existing.originalTheme) {
                    existing.originalTheme = currentTheme;
                }
                // Remove all theme classes
                document.body.classList.remove('ms-theme-rulebook', 'ms-theme-ember', 'ms-theme-ashen', 'ms-theme-bloodmoon');
                document.body.classList.add(`ms-theme-${theme}`);
            }
            existing.bringToFront();
            await existing.render({ force: true });
            return;
        }
        const app = new ThemePreviewApp();
        if (theme) {
            app.previewTheme = theme;
            // Store original theme and temporarily apply preview theme
            const currentTheme = game.settings?.get('mastery-system', 'uiTheme') || 'rulebook';
            app.originalTheme = currentTheme;
            // Remove all theme classes
            document.body.classList.remove('ms-theme-rulebook', 'ms-theme-ember', 'ms-theme-ashen', 'ms-theme-bloodmoon');
            document.body.classList.add(`ms-theme-${theme}`);
        }
        await app.render({ force: true });
    }
    async close(options) {
        // Restore original theme if we changed it
        if (this.previewTheme && this.originalTheme) {
            document.body.classList.remove('ms-theme-rulebook', 'ms-theme-ember', 'ms-theme-ashen', 'ms-theme-bloodmoon');
            document.body.classList.add(`ms-theme-${this.originalTheme}`);
        }
        return await super.close(options);
    }
    async _prepareContext(_options) {
        const previewTheme = this.previewTheme || game.settings?.get('mastery-system', 'uiTheme') || 'rulebook';
        return {
            currentTheme: previewTheme,
            previewTheme,
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