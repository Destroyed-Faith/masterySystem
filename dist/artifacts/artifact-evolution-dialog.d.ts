/**
 * Actor-facing artifact evolution: activate (1 Stone), upgrade along tree.
 *
 *   • Activate / link: 1 Stone once (MR ≥ 2).
 *   • Upgrade: 8 XP per +1 artifact level.
 *   • Maximum reachable level = `(MR - 1) × 2`, capped at 16.
 *   • Each Artifact may only be upgraded once per Upgrade Step.
 */
declare const BaseApp: any;
export declare class ArtifactEvolutionDialog extends BaseApp {
    private actor;
    constructor(actor: Actor);
    static get defaultOptions(): any;
    getData(_options?: any): any;
    activateListeners(html: JQuery): void;
}
export declare function openArtifactEvolutionDialog(actor: Actor): Promise<void>;
export {};
//# sourceMappingURL=artifact-evolution-dialog.d.ts.map