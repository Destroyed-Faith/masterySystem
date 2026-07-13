/**
 * Adds a text-color control to Foundry's ProseMirror editor (journals, sheets, etc.).
 * Foundry v13 ships without a font-color toolbar button; v14 adds it in core.
 *
 * Journal text pages only render core dropdowns + a fixed set of icon buttons.
 * Dropdown submenu clicks are handled by Foundry globals and ignore unknown actions
 * unless we intercept them, so we register handlers on ProseMirrorMenu and document.
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
type PMEditorView = {
    state: PMEditorState;
    dispatch: (tr: unknown) => void;
    focus?: () => void;
};
type PMEditorState = {
    schema: PMSchema;
    selection: {
        empty: boolean;
        from: number;
        to: number;
        $from: {
            marks: () => unknown[];
        };
    };
    storedMarks?: unknown[] | null;
    doc: {
        nodesBetween: (from: number, to: number, f: (node: {
            isText?: boolean;
            marks?: Array<{
                type: unknown;
                attrs?: Record<string, unknown>;
            }>;
        }) => void) => void;
    };
    tr: unknown;
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
export declare function getMenuView(menu: unknown, view?: PMEditorView | null): PMEditorView | null;
/** Resolve the live ProseMirror view from the surrounding editor DOM. */
export declare function findEditorViewFromElement(root: Element | ParentNode | null): PMEditorView | null;
export declare function promptFontColor(menu: unknown, view?: PMEditorView | null): Promise<void>;
/** Register the palette action so Foundry's menu click handler can dispatch it. */
export declare function prependFontColorMenuItem(menu: unknown, items: Array<Record<string, unknown>>): void;
/** Prepend a palette dropdown for editors that only render dropdown toolbars. */
export declare function prependFontColorDropDown(config: Record<string, DropdownConfig>): void;
/** Inject a palette icon button at the start of the ProseMirror toolbar DOM. */
export declare function injectFontColorToolbarButton(menuEl: HTMLElement, menu: unknown): void;
export declare function initializeProseMirrorFontColor(): void;
export {};
//# sourceMappingURL=prosemirror-font-color.d.ts.map