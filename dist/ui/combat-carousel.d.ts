/**
 * Mastery Combat Carousel UI
 * Displays combatants as portrait cards with initiative, resources, and controls
 */
export declare class CombatCarouselApp extends Application {
    private static _instance;
    static get defaultOptions(): any;
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
    getData(): Promise<any>;
    /**
     * Safely get resource value from actor system using path
     */
    private getResourceValue;
    _renderHTML(_data?: any): Promise<JQuery>;
    _replaceHTML(element: JQuery, html: JQuery): Promise<void>;
    activateListeners(html: JQuery): void;
}
//# sourceMappingURL=combat-carousel.d.ts.map