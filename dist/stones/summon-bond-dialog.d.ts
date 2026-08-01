/**
 * Summon Bond Ritual Dialog — canonical Summons V2 create / redistribute / dissolve UI.
 */
declare const ApplicationV2: typeof import("@league-of-foundry-developers/foundry-vtt-types/src/foundry/client/applications/api/application.mjs").default;
declare const BaseDialog: typeof ApplicationV2;
import { type SummonBondRecord } from './summon-bond-bind.js';
type DialogMode = 'create' | 'ritual';
export declare class SummonBondDialog extends BaseDialog {
    #private;
    private actor;
    private mode;
    private draft;
    private createAttrs;
    private createName;
    private createImg;
    private createExpression;
    private createMode;
    private createTiming;
    private createErrors;
    private ritualErrors;
    private ritualWarnings;
    private resolveClose?;
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
    static showCreate(actor: Actor): Promise<SummonBondRecord | null>;
    static showRitual(actor: Actor, bondId: string): Promise<SummonBondRecord | null>;
    constructor(actor: Actor, mode: DialogMode, bond: SummonBondRecord | null, resolveClose?: (bond: SummonBondRecord | null) => void);
    private ensureSpendBodies;
    _prepareContext(_options: any): Promise<any>;
    _onRender(context: any, options: any): Promise<void>;
    close(options?: any): Promise<any>;
}
export {};
//# sourceMappingURL=summon-bond-dialog.d.ts.map