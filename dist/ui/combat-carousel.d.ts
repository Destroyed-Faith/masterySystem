/**
 * Mastery Combat Carousel UI
 * Displays combatants as portrait cards with initiative, resources, and controls
 *
 * Migrated to Foundry VTT v13 ApplicationV2 + HandlebarsApplicationMixin
 */
declare const ApplicationV2: typeof import("@league-of-foundry-developers/foundry-vtt-types/src/foundry/client/applications/api/application.mjs").default;
declare const BaseCarousel: typeof ApplicationV2;
export declare class CombatCarouselApp extends BaseCarousel {
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
    _prepareContext(_options: any): Promise<any>;
    _onRender(_context: any, _options: any): Promise<void>;
    _onClose(_options: any): Promise<void>;
    /**
     * Safely get resource value from actor system using path
     */
    private getResourceValue;
}
export {};
//# sourceMappingURL=combat-carousel.d.ts.map