/**
 * Theme Preview Application
 * Shows a preview of the current theme with sample content
 */
declare const ApplicationV2: typeof import("@league-of-foundry-developers/foundry-vtt-types/src/foundry/client/applications/api/application.mjs").default;
declare const BaseApp: typeof ApplicationV2;
export declare class ThemePreviewApp extends BaseApp {
    static DEFAULT_OPTIONS: {
        id: string;
        classes: string[];
        position: {
            width: number;
            height: number;
        };
        window: {
            title: string;
            resizable: boolean;
        };
    };
    static PARTS: {
        content: {
            template: string;
        };
    };
    static show(): Promise<void>;
    _prepareContext(_options: any): Promise<any>;
    _onRender(_context: any, _options: any): Promise<void>;
}
export {};
//# sourceMappingURL=theme-preview.d.ts.map