/**
 * XP Management Settings Application
 * Allows GM to view character XP spending and grant XP allowances
 */
declare let BaseApplication: any;
export declare class XpManagementSettings extends BaseApplication {
    static get defaultOptions(): any;
    getData(options?: any): any;
    _renderHTML(_data?: any): Promise<JQuery<HTMLElement>>;
    _replaceHTML(element: JQuery, html: JQuery): Promise<void>;
    activateListeners(html: JQuery): void;
}
export {};
//# sourceMappingURL=xp-management.d.ts.map