/**
 * Epic Mastery Roll — GM configuration dialog.
 */
import type { EpicMasteryRollPreset } from './epic-mastery-roll-types.js';
declare const ApplicationV2: typeof import("@league-of-foundry-developers/foundry-vtt-types/src/foundry/client/applications/api/application.mjs").default;
declare const BaseDialog: typeof ApplicationV2;
export declare class EpicMasteryRollConfigDialog extends BaseDialog {
    private sceneTitle;
    private flavor;
    private showTn;
    private tn;
    private rollKind;
    private skillKey;
    private attributeKey;
    private selectedIds;
    private preset;
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
    constructor(preset?: EpicMasteryRollPreset);
    private applyPreset;
    protected _prepareContext(_options: unknown): Promise<Record<string, unknown>>;
    protected _onRender(context: unknown, options: unknown): Promise<void>;
    private buildRollConfig;
    private readCustomTnFromDom;
    private startSession;
}
export declare function showEpicMasteryRollConfigDialog(preset?: EpicMasteryRollPreset): void;
export declare function requestEpicMasteryRoll(preset?: EpicMasteryRollPreset): Promise<void>;
export {};
//# sourceMappingURL=epic-mastery-roll-config-dialog.d.ts.map