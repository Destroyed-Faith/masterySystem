declare const ApplicationV2: typeof import("@league-of-foundry-developers/foundry-vtt-types/src/foundry/client/applications/api/application.mjs").default;
declare const BaseCarousel: typeof ApplicationV2;
export declare class CombatCarouselApp extends BaseCarousel {
    #private;
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
        actions: {
            msEndTurn: (this: CombatCarouselApp, event: Event) => void;
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
    private resizeDrag;
    /** Host element that owns delegated resize listeners (survives inner re-renders). */
    private resizeRoot;
    /** Defer live refreshes while resizing / pressing carousel controls. */
    private interactionBusy;
    private pendingRefreshAfterInteraction;
    /** Stay under actor sheets so the close button remains clickable. */
    bringToFront(): this;
    private pinBehindSheets;
    private applyCompactLayout;
    private onResizePointerMove;
    private onResizePointerUp;
    private finishResizeDrag;
    private onResizePointerDown;
    private onResizeDblClick;
    private onCarouselInteractivePointerDown;
    private onCarouselInteractivePointerUp;
    /**
     * Resize + interaction guards: delegated from the Application root so a
     * mid-drag / mid-hover `render()` does not drop the listeners.
     */
    private bindResizeHandle;
    private unbindResizeHandle;
    private bindCompactViewportWatch;
    private unbindCompactViewportWatch;
    /**
     * Register hooks for live HP/Stress updates
     */
    private registerUpdateHooks;
    private openVitalsEditDialog;
    /** GM: edit all combatant initiatives, then reorder the Foundry turn list + carousel. */
    private openInitiativeEditDialog;
    /** Client-side carousel display preferences. */
    private openCarouselSettingsDialog;
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
     * Debounced refresh to avoid excessive re-renders.
     * Skips while resizing / pressing Next Turn so DOM swap cannot eat the click.
     */
    private refreshTimeout;
    private debouncedRefresh;
}
export {};
//# sourceMappingURL=combat-carousel.d.ts.map