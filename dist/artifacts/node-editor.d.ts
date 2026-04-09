/**
 * Node Editor Dialog
 * Edit a single artifact node's data (kind + type-specific profile).
 */
declare const BaseDialog: any;
export declare class NodeEditor extends BaseDialog {
    private item;
    constructor(item: Item);
    static get defaultOptions(): any;
    getData(options?: any): any;
    activateListeners(html: JQuery): void;
    collectSelectValues(html: JQuery, selectClass: string): string[];
    saveNode(html: JQuery): Promise<void>;
}
export {};
//# sourceMappingURL=node-editor.d.ts.map