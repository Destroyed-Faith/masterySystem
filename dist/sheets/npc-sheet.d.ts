/**
 * NPC Sheet for Mastery System
 * Simplified sheet for non-player characters
 */
import { MasteryCharacterSheet } from './character-sheet';
export declare class MasteryNpcSheet extends MasteryCharacterSheet {
    #private;
    /** @override */
    static DEFAULT_OPTIONS: {
        classes: string[];
        position: {
            width: number;
            height: number;
        };
        window: {
            controls: {
                icon: string;
                label: string;
                action: string;
            }[];
        };
        actions: {
            msNpcPrintSheet: (this: any) => void;
        };
    };
    /**
     * Parent strips the PC print control for non-characters; keep the NPC print
     * control and drop the inherited PC one if it ever leaks through.
     * @override
     */
    _getHeaderControls(): any[];
    /** Prefer short type label "NPC: Name" via i18n; fall back to actor name. */
    get title(): string;
    /** @override */
    static PARTS: {
        body: {
            template: string;
        };
    };
    /** @override */
    protected get _initialTab(): string;
    /**
     * ApplicationV2 unions `classes` across the inheritance chain; strip the
     * parent's `character` class so character-sheet CSS never applies here.
     * @override
     */
    _initializeApplicationOptions(options: any): any;
    /** @override */
    _prepareContext(options?: any): Promise<any>;
    /** @override */
    activateListeners(html: JQuery): void;
}
//# sourceMappingURL=npc-sheet.d.ts.map