/**
 * Character Sheet for Mastery System
 * Main player character sheet with tabs for attributes, skills, powers, etc.
 */
export declare class MasteryCharacterSheet extends ActorSheet {
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
//# sourceMappingURL=character-sheet.d.ts.map