/**
 * Adds a text-color control to Foundry's ProseMirror editor (journals, sheets, etc.).
 * Foundry v13 ships without a font-color toolbar button; v14 adds it in core.
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
/** Journal editors in v13 use dropdown menus — add Text Color under Format → Inline. */
export declare function appendFontColorDropdownEntries(config: {
    format?: DropdownEntry;
    fonts?: DropdownEntry;
    [key: string]: DropdownEntry | undefined;
}): void;
export declare function initializeProseMirrorFontColor(): void;
export {};
//# sourceMappingURL=prosemirror-font-color.d.ts.map