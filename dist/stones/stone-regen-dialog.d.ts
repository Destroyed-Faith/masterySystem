/**
 * Stone Regeneration Dialog
 *
 * Shown at the start of each round for PCs to allocate their
 * Mastery Rank worth of stone regeneration across attributes
 */
declare const ApplicationV2: typeof import("@league-of-foundry-developers/foundry-vtt-types/src/foundry/client/applications/api/application.mjs").default;
declare const BaseDialog: typeof ApplicationV2;
type AttributeKey = 'might' | 'agility' | 'vitality' | 'intellect' | 'resolve' | 'influence';
export declare class StoneRegenDialog extends BaseDialog {
    private actor;
    private regenPoints;
    private allocation;
    private resolve?;
    static DEFAULT_OPTIONS: {
        id: string;
        classes: string[];
        position: {
            width: number;
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
    /**
     * Show stone regen dialog for an actor
     */
    static showForActor(actor: Actor, regenPoints: number): Promise<Record<AttributeKey, number> | null>;
    constructor(actor: Actor, regenPoints: number, resolve: (allocation: Record<AttributeKey, number> | null) => void);
    _prepareContext(_options: any): Promise<any>;
    _onRender(_context: any, _options: any): Promise<void>;
    _onClose(_options: any): Promise<void>;
}
export {};
//# sourceMappingURL=stone-regen-dialog.d.ts.map