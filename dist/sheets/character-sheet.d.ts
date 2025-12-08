/**
 * Character Sheet for Mastery System
 * Main player character sheet with tabs for attributes, skills, powers, etc.
 */
declare const BaseActorSheet: any;
export declare class MasteryCharacterSheet extends BaseActorSheet {
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
export {};
//# sourceMappingURL=character-sheet.d.ts.map