/**
 * Floating Healing panel: prepared Resolve Healing for this Round, and the
 * Passive: Restoration daily Scarred-Bar pool. Replaces the "Use Healing now"
 * chat card.
 */
declare const ApplicationV2: typeof import("@league-of-foundry-developers/foundry-vtt-types/src/foundry/client/applications/api/application.mjs").default;
declare const BaseBar: typeof ApplicationV2;
export declare class HealingBar extends BaseBar {
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
            toggle: (this: HealingBar, event: Event) => void;
            useHeal: (this: HealingBar, event: Event) => void;
            useRestoration: (this: HealingBar, event: Event) => void;
        };
    };
    static PARTS: {
        content: {
            template: string;
        };
    };
    static get instance(): HealingBar | null;
    static resolveActor(): any | null;
    static refresh(): Promise<void>;
    _prepareContext(_options: any): Promise<any>;
    _onRender(context: any, options: any): Promise<void>;
    applyStoredPosition(): void;
}
export declare function showHealingBarFromMenu(): Promise<void>;
export declare function initializeHealingBar(): void;
export {};
//# sourceMappingURL=healing-bar.d.ts.map