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
            msCopyPictureLink: (this: any) => void;
            'toggle-known-npc': (this: any, event: Event) => void;
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
    /**
     * Sanitize targeting on every form submit so FormData cannot re-introduce
     * stale AoE shape / wrong meters after a Melee↔Range switch.
     * @override
     */
    _prepareSubmitData(event: any, form: any, formData: any, updateData?: any): any;
    /** @override */
    activateListeners(html: JQuery): void;
}
//# sourceMappingURL=npc-sheet.d.ts.map