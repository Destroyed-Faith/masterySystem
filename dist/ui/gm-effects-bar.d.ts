/**
 * Floating GM Manage Effects panel — opened from the carousel hand button.
 * Same chrome as Healing / Important NPCs (grip handle, collapsible).
 */
declare const ApplicationV2: typeof import("@league-of-foundry-developers/foundry-vtt-types/src/foundry/client/applications/api/application.mjs").default;
declare const BaseBar: typeof ApplicationV2;
export declare class GmEffectsBar extends BaseBar {
    #private;
    private static _instance;
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
        actions: {
            toggle: (this: GmEffectsBar, event: Event) => void;
            selectAll: (this: GmEffectsBar, event: Event) => void;
            clearSelection: (this: GmEffectsBar, event: Event) => void;
            selectSide: (this: GmEffectsBar, event: Event) => void;
            applySpecial: (this: GmEffectsBar, event: Event) => void;
            removeSpecial: (this: GmEffectsBar, event: Event) => void;
            adjustSpecial: (this: GmEffectsBar, event: Event) => void;
            undoLast: (this: GmEffectsBar, event: Event) => void;
        };
    };
    static PARTS: {
        content: {
            template: string;
        };
    };
    static get instance(): GmEffectsBar | null;
    static refresh(): Promise<void>;
    static closeInstance(): Promise<void>;
    _prepareContext(_options: any): Promise<any>;
    _onRender(context: any, options: any): Promise<void>;
    applyStoredPosition(): void;
}
export declare function initializeGmEffectsBar(): void;
export {};
//# sourceMappingURL=gm-effects-bar.d.ts.map