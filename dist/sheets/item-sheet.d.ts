/**
 * Item Sheet for Mastery System
 * Generic sheet for all item types
 */
declare const BaseItemSheet: any;
export declare class MasteryItemSheet extends BaseItemSheet {
    #private;
    /** Active tab, preserved across re-renders. */
    activeTab?: string;
    /** @override */
    static DEFAULT_OPTIONS: {
        classes: string[];
        position: {
            width: number;
            height: number;
        };
        window: {
            resizable: boolean;
        };
        form: {
            submitOnChange: boolean;
            closeOnSubmit: boolean;
        };
    };
    /** @override */
    static PARTS: {
        body: {
            template: string;
        };
    };
    /** Resolve the per-type template (V1 `get template()` equivalent). @override */
    _configureRenderParts(options: any): any;
    /** @override */
    _prepareContext(options?: any): Promise<any>;
    /** ApplicationV2 render bridge: tabs, portrait editing, jQuery listeners. @override */
    _onRender(context: any, options: any): Promise<void>;
    activateListeners(html: JQuery): void;
}
export {};
//# sourceMappingURL=item-sheet.d.ts.map