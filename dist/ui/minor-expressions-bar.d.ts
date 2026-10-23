/**
 * @deprecated Minor Expressions are replaced by Echo Imprints (DF Guide 2026-10-23).
 * The floating bar is retired from live paths: it never renders (see
 * LEGACY_MINOR_EXPRESSIONS_BAR_ENABLED) and the scene-control entry opens the
 * Echo Imprints dialog instead. Kept only for rollback / archive review.
 *
 * Original description:
 * Floating player panel listing the character's chosen Minor Expressions
 * (same chrome as the Important NPCs bar): draggable, collapsible, hover
 * shows the current-tier text, "Use" posts the expression to chat and ticks
 * the per-Safe-Haven-Rest budget (Mastery Rank × 2).
 */
declare const ApplicationV2: typeof import("@league-of-foundry-developers/foundry-vtt-types/src/foundry/client/applications/api/application.mjs").default;
declare const BaseBar: typeof ApplicationV2;
export declare class MinorExpressionsBar extends BaseBar {
    #private;
    private static _instance;
    private _busy;
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
            toggle: (this: MinorExpressionsBar, event: Event) => void;
            use: (this: MinorExpressionsBar, event: Event) => void;
            undo: (this: MinorExpressionsBar, event: Event) => void;
            sheet: (this: MinorExpressionsBar, event: Event) => void;
        };
    };
    static PARTS: {
        content: {
            template: string;
        };
    };
    static get instance(): MinorExpressionsBar | null;
    static resolveActor(): any | null;
    static refresh(): Promise<void>;
    _prepareContext(_options: any): Promise<any>;
    _onRender(context: any, options: any): Promise<void>;
    applyStoredPosition(): void;
}
/**
 * @deprecated Delegates to the Echo Imprints dialog; the floating bar is retired.
 */
export declare function showMinorExpressionsBarFromMenu(): Promise<void>;
/**
 * @deprecated Legacy floating-panel opener (only works when
 * LEGACY_MINOR_EXPRESSIONS_BAR_ENABLED is true). Not called from live paths.
 */
export declare function showLegacyMinorExpressionsBarFromMenu(): Promise<void>;
export declare function initializeMinorExpressionsBar(): void;
export {};
//# sourceMappingURL=minor-expressions-bar.d.ts.map