/**
 * Player-facing portrait bar for GM-released important NPCs.
 */
declare const ApplicationV2: typeof import("@league-of-foundry-developers/foundry-vtt-types/src/foundry/client/applications/api/application.mjs").default;
declare const BaseBar: typeof ApplicationV2;
export declare function openKnownNpcPortrait(actorId: string): Promise<void>;
export declare class KnownNpcsBar extends BaseBar {
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
            toggle: (this: KnownNpcsBar, event: Event) => void;
            portrait: (this: KnownNpcsBar, event: Event) => void;
        };
    };
    static PARTS: {
        content: {
            template: string;
        };
    };
    static get instance(): KnownNpcsBar | null;
    static refresh(): Promise<void>;
    _prepareContext(_options: any): Promise<any>;
    _onRender(context: any, options: any): Promise<void>;
    applyStoredPosition(): void;
}
export declare function initializeKnownNpcsBar(): void;
export {};
//# sourceMappingURL=known-npcs-bar.d.ts.map