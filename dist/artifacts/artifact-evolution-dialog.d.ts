/**
 * Actor-facing artifact evolution: activate (1 Stone), upgrade along tree.
 *
 *   • Activate / link: 1 Stone once (MR ≥ 2).
 *   • Upgrade: 8 XP per +1 artifact level.
 *   • Maximum reachable level = `(MR - 1) × 2`, capped at 16.
 *   • Each Artifact may only be upgraded once per Upgrade Step.
 */
declare const ApplicationV2: typeof import("@league-of-foundry-developers/foundry-vtt-types/src/foundry/client/applications/api/application.mjs").default;
declare const BaseDialog: typeof ApplicationV2;
export declare class ArtifactEvolutionDialog extends BaseDialog {
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