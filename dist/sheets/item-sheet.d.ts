/**
 * Item Sheet for Mastery System
 * Generic sheet for all item types
 */
export declare class MasteryItemSheet extends ItemSheet {
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
//# sourceMappingURL=item-sheet.d.ts.map