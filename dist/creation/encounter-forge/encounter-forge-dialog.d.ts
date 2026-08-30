/**
 * Encounter Forge — table-facing 5-step wizard.
 *
 * STEP 1  Party & Encounter Structure (party, name, phases, enemy count)
 * STEP 2  Main Enemies & Defenses (concept, defensive identity, movement, copies)
 * STEP 3  Action Economy & Powers (concrete attacks, actions, recommendation)
 * STEP 4  Phase Mechanics / Adds (per-phase changes, adds/reinforcements/summons)
 * STEP 5  Review & Generate (solved values, warnings, GM overrides)
 *
 * There is NO difficulty select, NO rank select, NO targeting/tempo/pressure
 * style anywhere. The review is numerically stable: the solver is fully
 * deterministic and memoized per (design, party) — reopening or re-rendering
 * never changes a number.
 */
declare const BaseDialog: any;
export declare class EncounterForgeDialog extends BaseDialog {
    #private;
    private step;
    private design;
    private solveKey;
    private solution;
    private warnings;
    private party;
    static DEFAULT_OPTIONS: {
        id: string;
        classes: string[];
        position: {
            width: number;
            height: number;
        };
        window: {
            title: string;
            resizable: boolean;
        };
    };
    static PARTS: {
        content: {
            template: string;
        };
    };
    _prepareContext(): Promise<Record<string, unknown>>;
    _onRender(): void;
}
export declare function showEncounterForgeDialog(): void;
export {};
//# sourceMappingURL=encounter-forge-dialog.d.ts.map