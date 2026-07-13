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
        textBetween?: (from: number, to: number, blockSeparator?: string) => string;
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
type SchemaWithSpec = PMSchema & {
    constructor?: new (spec: {
        nodes: unknown;
        marks: unknown;
    }) => PMSchema;
    spec?: {
        nodes?: unknown;
        marks?: {
            addToEnd?: (name: string, spec: unknown) => unknown;
            get?: (name: string) => unknown;
        };
    };
    nodeFromJSON?: (json: unknown) => unknown;
};
type EditorStateWithCtor = PMEditorState & {
    constructor?: {
        create?: (config: {
            schema: PMSchema;
            doc: unknown;
            plugins?: unknown;
            selection?: unknown;
            storedMarks?: unknown[] | null;
        }) => PMEditorState;
    };
    doc: {
        toJSON: () => unknown;
    };
    plugins?: unknown;
    selection: PMEditorState['selection'] & {
        map?: (doc: unknown, mapping: unknown) => unknown;
    };
};
/** Find the schema mark used for inline text color (Foundry v14 uses `textStyle.color`). */
export declare function resolveColorMark(schema: PMSchema): ResolvedColorMark | null;
/** Mark spec for inline text color. Foundry v13 omits this; v14 adds it in core. */
export declare function buildTextStyleColorMarkSpec(): Record<string, unknown>;
/** Extend a ProseMirror schema with a textStyle color mark when core does not provide one. */
export declare function extendSchemaWithTextStyle(schema: SchemaWithSpec): PMSchema;
/** Rebuild editor state with an extended schema while preserving Foundry's plugin wiring. */
export declare function reconfigureEditorStateWithSchema(state: EditorStateWithCtor, schema: PMSchema): PMEditorState;
/** Find a live ProseMirror view from rendered editor DOM (works when dropdowns render outside prose-mirror). */
export declare function findViewOnProseMirrorDom(scope?: ParentNode): PMEditorView | null;
/** Resolve the active editor view from menu context, cached state, or live DOM. */
export declare function resolveActiveEditorView(menu?: unknown, view?: PMEditorView | null, source?: Element | null): PMEditorView | null;
export declare function getMenuView(menu: unknown, view?: PMEditorView | null): PMEditorView | null;
/** Resolve the live ProseMirror view from the surrounding editor DOM. */
export declare function findEditorViewFromElement(root: Element | ParentNode | null): PMEditorView | null;
/** Fallback for schemas where no color mark can be toggled: wrap the selection in a colored span via HTML. */
export declare function applyColorViaHtmlSlice(view: PMEditorView, color: string | null): boolean;
export declare function promptFontColor(menu: unknown, view?: PMEditorView | null, source?: Element | null): Promise<void>;
/** Register the palette action so Foundry's menu click handler can dispatch it. */
export declare function prependFontColorMenuItem(menu: unknown, items: Array<Record<string, unknown>>): void;
/** Prepend a palette dropdown for editors that only render dropdown toolbars. */
export declare function prependFontColorDropDown(config: Record<string, DropdownConfig>): void;
/** Inject a palette icon button at the start of the ProseMirror toolbar DOM. */
export declare function injectFontColorToolbarButton(menuEl: HTMLElement, menu: unknown): void;
export declare function initializeProseMirrorFontColor(): void;
export {};
//# sourceMappingURL=prosemirror-font-color.d.ts.map