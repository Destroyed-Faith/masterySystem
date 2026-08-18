declare const ApplicationV2: typeof import("@league-of-foundry-developers/foundry-vtt-types/src/foundry/client/applications/api/application.mjs").default;
declare const BaseCarousel: typeof ApplicationV2;
export declare class CombatCarouselApp extends BaseCarousel {
    private static _instance;
    /** Prevents double `nextTurn` / `previousTurn` from rapid clicks on carousel controls. */
    private static _turnNavigationBusy;
    private hookEntries;
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
    /**
     * Open the carousel (singleton pattern)
     */
    static open(): void;
    /**
     * Close the carousel
     */
    static close(): void;
    /**
     * Get the singleton instance
     */
    static get instance(): CombatCarouselApp | null;
    /**
     * Refresh the carousel (re-render with current combat state)
     */
    static refresh(): void;
    _prepareContext(_options: any): Promise<any>;
    _onRender(_context: any, _options: any): Promise<void>;
    _onClose(_options: any): Promise<void>;
    private compactViewportHandler;
    private applyCompactLayout;
    private bindCompactViewportWatch;
    private unbindCompactViewportWatch;
    /**
     * Register hooks for live HP/Stress updates
     */
    private registerUpdateHooks;
    /**
     * Unregister update hooks
     */
    private unregisterUpdateHooks;
    /**
     * Check if an actor is relevant to any combatant in the carousel
     */
    private isRelevantActor;
    /**
     * Check if a token is relevant to any combatant in the carousel
     */
    private isRelevantToken;
    /**
     * Check if update data contains relevant HP/Stress changes
     */
    private hasRelevantChange;
    /**
     * Debounced refresh to avoid excessive re-renders
     */
    private refreshTimeout;
    private debouncedRefresh;
}
export {};
//# sourceMappingURL=combat-carousel.d.ts.map