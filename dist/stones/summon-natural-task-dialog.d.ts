/**
 * Minimal Summon Natural Task dialog — owner Profession / Perception Training Roll.
 */
declare const ApplicationV2: typeof import("@league-of-foundry-developers/foundry-vtt-types/src/foundry/client/applications/api/application.mjs").default;
declare const BaseDialog: typeof ApplicationV2;
import { type SummonNaturalAttribute } from './summon-natural-task.js';
export declare class SummonNaturalTaskDialog extends BaseDialog {
    #private;
    static DEFAULT_OPTIONS: any;
    static PARTS: {
        body: {
            template: string;
        };
    };
    actor: any;
    bondId: string;
    attributeKey: SummonNaturalAttribute;
    professionId: string;
    taskDescription: string;
    transferExplanation: string;
    gmApproved: boolean;
    declareTrainingCrit: boolean;
    sharedSenseActive: boolean;
    bodyId: string;
    constructor(actor: any, bondId: string, options?: Record<string, unknown>);
    static show(actor: any, bondId: string): Promise<SummonNaturalTaskDialog>;
    _prepareContext(_options?: unknown): Promise<Record<string, unknown>>;
    _onRender(context: unknown, options: unknown): Promise<void>;
}
export {};
//# sourceMappingURL=summon-natural-task-dialog.d.ts.map