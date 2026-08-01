/**
 * Summon actor sheet — read-focused statblock for Summons V2 Bond bodies.
 */
import { MasteryCharacterSheet } from './character-sheet.js';
export declare class MasterySummonSheet extends MasteryCharacterSheet {
    /** @override */
    static DEFAULT_OPTIONS: {
        classes: string[];
        position: {
            width: number;
            height: number;
        };
    };
    /** @override */
    static PARTS: {
        body: {
            template: string;
        };
    };
    /**
     * ApplicationV2 unions `classes` across the inheritance chain; strip the
     * parent's `character` class so character-sheet CSS never applies here.
     * @override
     */
    _initializeApplicationOptions(options: any): any;
    _prepareContext(options?: any): Promise<any>;
    activateListeners(html: JQuery): void;
}
//# sourceMappingURL=summon-sheet.d.ts.map