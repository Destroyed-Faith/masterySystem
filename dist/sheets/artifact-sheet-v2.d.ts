/**
 * Artifact Item Sheet (Foundry v13)
 *
 * Built on the proven classic `ItemSheet` base (same as `MasteryItemSheet`)
 * so that `item.sheet` resolves and double-click opens reliably — a plain
 * ApplicationV2 is NOT a document sheet and makes `item.sheet` null, which is
 * what previously threw `cannot read properties of null (reading 'render')`
 * when clicking an artifact in the Items directory.
 *
 * Single, read-only summary card: meta (slot / profile / level), the current
 * Base Values, and the up-to-3 active Level Progression abilities. No tabs, no
 * editable fields. GMs get an "Edit in Node Editor" link; all authoring still
 * happens in the Artifact Builder / Node Editor, never on this sheet.
 */
declare const BaseArtifactSheet: any;
export declare class ArtifactSheetV2 extends BaseArtifactSheet {
    /** @override */
    static DEFAULT_OPTIONS: {
        classes: string[];
        position: {
            width: number;
            height: string;
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
    /** @override */
    _prepareContext(_options?: any): Promise<any>;
    /** @override */
    _onRender(context: any, options: any): Promise<void>;
}
export {};
//# sourceMappingURL=artifact-sheet-v2.d.ts.map