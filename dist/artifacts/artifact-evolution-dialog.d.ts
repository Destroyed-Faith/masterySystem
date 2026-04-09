/**
 * Actor-facing artifact evolution: link, upgrade along tree, ultimate unlock; path preview.
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
    private onUltimate;
}
export declare function openArtifactEvolutionDialog(actor: Actor): Promise<void>;
export {};
//# sourceMappingURL=artifact-evolution-dialog.d.ts.map