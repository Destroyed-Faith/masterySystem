/**
 * NPC Sheet for Mastery System
 * Simplified sheet for non-player characters
 */
import { MasteryCharacterSheet } from './character-sheet';
export declare class MasteryNpcSheet extends MasteryCharacterSheet {
    #private;
    /** @override */
    static get defaultOptions(): any;
    /** @override */
    get template(): string;
    /** @override */
    getData(options?: any): any;
    /** @override */
    activateListeners(html: JQuery): void;
}
//# sourceMappingURL=npc-sheet.d.ts.map