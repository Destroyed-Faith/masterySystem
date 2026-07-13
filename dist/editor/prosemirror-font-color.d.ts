/**

 * Adds a text-color control to Foundry's ProseMirror editor (journals, sheets, etc.).

 * Foundry v13 ships without a font-color toolbar button; v14 adds it in core.

 *

 * Journal text pages only render core dropdowns + a fixed set of icon buttons.

 * Custom getProseMirrorMenuItems entries are not placed in the DOM there, so we

 * inject the palette button when ProseMirrorMenu activates listeners.

 */
type PMSchema = {
    marks: Record<string, {
        spec?: {
            attrs?: Record<string, unknown>;
        };
    }>;
};
type PMMarkType = {
    create: (attrs: Record<string, unknown>) => unknown;
    isInSet: (marks: unknown) => unknown;
    spec?: {
        attrs?: Record<string, unknown>;
    };
};
type DropdownConfig = {
    cssClass?: string;
    title?: string;
    icon?: string;
    entries?: DropdownEntry[];
    children?: DropdownEntry[];
};
type DropdownEntry = {
    action?: string;
    title?: string;
    style?: string;
    icon?: string;
    entries?: DropdownEntry[];
    children?: DropdownEntry[];
};
export interface ResolvedColorMark {
    markType: PMMarkType;
    colorAttr: string;
}
/** Find the schema mark used for inline text color (Foundry uses `textStyle.color`). */
export declare function resolveColorMark(schema: PMSchema): ResolvedColorMark | null;
/** Register the palette action so Foundry's menu click handler can dispatch it. */
export declare function prependFontColorMenuItem(menu: unknown, items: Array<Record<string, unknown>>): void;
/** Prepend a palette dropdown for editors that only render dropdown toolbars. */
export declare function prependFontColorDropDown(config: Record<string, DropdownConfig>): void;
/** Inject a palette icon button at the start of the ProseMirror toolbar DOM. */
export declare function injectFontColorToolbarButton(menuEl: HTMLElement, menu: unknown): void;
export declare function initializeProseMirrorFontColor(): void;
export {};
//# sourceMappingURL=prosemirror-font-color.d.ts.map