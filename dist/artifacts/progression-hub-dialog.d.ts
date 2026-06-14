/**
 * Unified Progression Hub — Attributes, Skills, Powers, and Artifacts in one dialog.
 */
declare const ApplicationV2: typeof import("@league-of-foundry-developers/foundry-vtt-types/src/foundry/client/applications/api/application.mjs").default;
declare const BaseDialog: typeof ApplicationV2;
export type ProgressionHubSection = 'overview' | 'attributes' | 'skills' | 'powers' | 'artifacts';
export declare class ProgressionHubDialog extends BaseDialog {
    #private;
    private actor;
    private expandSection;
    private openSections;
    private scrollTop;
    private pendingAttributes;
    private pendingSkills;
    private pendingPowers;
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
export declare function openProgressionHubDialog(actor: Actor, options?: {
    expandSection?: ProgressionHubSection;
}): Promise<void>;
export {};
//# sourceMappingURL=progression-hub-dialog.d.ts.map