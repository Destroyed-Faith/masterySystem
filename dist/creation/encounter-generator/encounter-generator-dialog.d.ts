/**
 * Encounter Generator — guided 5-step dialog.
 *
 * Steps: party -> difficulty -> composition -> review (editable) -> name.
 * On generation it writes a new Actor folder + NPC actors (see apply module).
 */
declare const BaseDialog: any;
export declare class EncounterGeneratorDialog extends BaseDialog {
    #private;
    private step;
    private selectedActorIds;
    private difficulty;
    private composition;
    private folderName;
    private plan;
    static DEFAULT_OPTIONS: {
        id: string;
        classes: string[];
        position: {
            width: number;
            height: number;
        };
        window: {
            title: "Encounter-Generator";
            resizable: boolean;
        };
    };
    static PARTS: {
        content: {
            template: string;
        };
    };
    protected _prepareContext(): Promise<Record<string, unknown>>;
    protected _onRender(context: Record<string, unknown>, options: Record<string, unknown>): Promise<void>;
}
export declare function showEncounterGeneratorDialog(): Promise<void>;
export {};
//# sourceMappingURL=encounter-generator-dialog.d.ts.map