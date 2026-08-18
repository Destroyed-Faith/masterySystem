/**
 * Compact GM toolbar for the scene editor. Frameless ApplicationV2, like the
 * combat carousel — CSS places it, Foundry does not own a window chrome.
 */
import type { SceneEditorController } from './controller.js';
declare const ApplicationV2: typeof import("@league-of-foundry-developers/foundry-vtt-types/src/foundry/client/applications/api/application.mjs").default;
declare const BaseToolbar: typeof ApplicationV2;
export declare class SceneEditorToolbarApp extends BaseToolbar {
    #private;
    private readonly editor;
    constructor(editor: SceneEditorController);
    static DEFAULT_OPTIONS: {
        id: string;
        classes: string[];
        position: {
            width: string;
        };
        window: {
            title: string;
            frame: boolean;
            positioned: boolean;
            resizable: boolean;
            minimizable: boolean;
        };
    };
    static PARTS: {
        content: {
            template: string;
        };
    };
    refresh(): void;
    protected _prepareContext(): Promise<any>;
    protected _onRender(_context: any, _options: any): Promise<void>;
    private bind;
}
export {};
//# sourceMappingURL=toolbar-app.d.ts.map