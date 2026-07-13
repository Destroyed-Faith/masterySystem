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
export interface ResolvedColorMark {
    markType: PMMarkType;
    colorAttr: string;
}
/** Find the schema mark used for inline text color (Foundry uses `textStyle.color`). */
export declare function resolveColorMark(schema: PMSchema): ResolvedColorMark | null;
/** Insert the palette button at the start of the ProseMirror toolbar. */
export declare function prependFontColorMenuItem(menu: unknown, items: Array<Record<string, unknown>>): void;
export declare function initializeProseMirrorFontColor(): void;
export {};
//# sourceMappingURL=prosemirror-font-color.d.ts.map