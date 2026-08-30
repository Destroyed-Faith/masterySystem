/**
 * Actor-facing artifact evolution: Attunement ritual, then upgrade along tree.
 *
 *   • Attunement / Binding Ritual: one-time, no Stone reservation.
 *   • Level 1 is free after Attunement. Further levels cost 8 XP each.
 *   • Maximum reachable level = min(10, max(1, (MR − 1) × 2)).
 *   • Each Artifact may only be upgraded once per Upgrade Step.
 */
declare const ApplicationV2: typeof import("@league-of-foundry-developers/foundry-vtt-types/src/foundry/client/applications/api/application.mjs").default;
declare const BaseDialog: typeof ApplicationV2;
export declare class ArtifactEvolutionDialog extends BaseDialog {
    #private;
    private actor;
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
    constructor(actor: Actor, options?: Record<string, unknown>);
    protected _prepareContext(_options: unknown): Promise<Record<string, unknown>>;
    protected _onRender(_context: unknown, _options: unknown): Promise<void>;
}
export declare function openArtifactEvolutionDialog(actor: Actor): Promise<void>;
export {};
//# sourceMappingURL=artifact-evolution-dialog.d.ts.map