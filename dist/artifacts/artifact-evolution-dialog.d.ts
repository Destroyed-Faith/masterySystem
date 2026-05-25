/**
 * Actor-facing artifact evolution: link, upgrade along tree; path preview.
 *
 * New XP spec — Artifacts:
 *   • Link: free (still gated by MR ≥ 2).
 *   • Upgrade: 8 XP per +1 artifact level. No Stone cost.
 *   • Maximum reachable level = `(MR - 1) × 2`, capped at 16.
 *   • Each Artifact may only be upgraded once per Upgrade Step (new
 *     once-per-step rule shared with Attributes / Skills / Powers).
 *   • Legacy "Ultimate" path and all per-link / per-upgrade Stone costs
 *     have been removed.
 */
declare const BaseApp: any;
export declare class ArtifactEvolutionDialog extends BaseApp {
    private actor;
    constructor(actor: Actor);
    static get defaultOptions(): any;
    private buildCards;
    getData(_options?: any): any;
    activateListeners(html: JQuery): void;
    private onLink;
    private onUpgrade;
}
export declare function openArtifactEvolutionDialog(actor: Actor): Promise<void>;
export {};
//# sourceMappingURL=artifact-evolution-dialog.d.ts.map