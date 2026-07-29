/**
 * Encounter Generator — guided 5-step dialog (concept-driven).
 *
 * Steps: party -> concept (Kampfidee) -> adds -> review (Threat Report,
 * editierbar) -> name. On generation it writes an Encounter-Projekt:
 * folder tree + NPC actors + summary journal (see apply module).
 */
declare const BaseDialog: any;
export declare class EncounterGeneratorDialog extends BaseDialog {
    #private;
    private step;
    private selectedActorIds;
    private concept;
    private presetId;
    private folderName;
    private party;
    private plan;
    private report;
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