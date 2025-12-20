/**
 * Theme Preview Application
 * Shows a preview of the current theme with sample content
 */

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

// Type workaround for Mixin
const BaseApp = HandlebarsApplicationMixin(ApplicationV2) as typeof ApplicationV2;

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

  static async show(): Promise<void> {
    const existing = foundry.applications.instances.get("mastery-theme-preview") as ThemePreviewApp | undefined;
    if (existing) {
      (existing as any).bringToFront();
      return;
    }

    const app = new ThemePreviewApp();
    (app as any).render({ force: true });
  }

  async _prepareContext(_options: any): Promise<any> {
    const currentTheme = (game as any).settings?.get('mastery-system', 'uiTheme') || 'rulebook';
    
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

  async _onRender(_context: any, _options: any): Promise<void> {
    super._onRender?.(_context, _options);

    const root = (this as any).element;
    if (!root) return;

    // Close button
    const closeBtn = root.querySelector('.close-button');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.close();
      });
    }
  }
}
