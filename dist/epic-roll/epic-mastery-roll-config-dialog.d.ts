/**
 * Epic Mastery Roll — unified GM Rolls configuration dialog.
 * Skill Checks (Standard / Comparative / Group Ambush) share this UI with
 * Attribute and Fear rolls. The competing standalone Skill Check dialog is retired.
 */
import type { EpicMasteryRollPreset } from './epic-mastery-roll-types.js';
export interface RollsSkillSuggestion {
    actorId: string;
    skillKey: string;
    attributeKey: string;
    note: string;
    skillLabel: string;
}
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
    /** DF Skill System panel state */
    private taskDescription;
    private skillMode;
    private approaches;
    private participantRows;
    private comparative;
    private allowPlayerSuggestions;
    private pendingSuggestions;
    private socketBound;
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
    /** Open Rolls already configured for Comparative Group Ambush. */
    applyGroupAmbushPreset(): void;
    private syncParticipantRows;
    private catalogSkillOptions;
    private listNpcActors;
    protected _prepareContext(_options: unknown): Promise<Record<string, unknown>>;
    protected _onRender(context: unknown, options: unknown): Promise<void>;
    private bindSuggestionSocket;
    private requestPlayerSuggestions;
    private buildRollConfig;
    private readCustomTnFromDom;
    private startSession;
}
export declare function registerRollsSkillSuggestionHandlers(): void;
export declare function showEpicMasteryRollConfigDialog(preset?: EpicMasteryRollPreset): void;
export declare function showEpicMasteryRollConfigDialogForGroupAmbush(): void;
export declare function requestEpicMasteryRoll(preset?: EpicMasteryRollPreset): Promise<void>;
export {};
//# sourceMappingURL=epic-mastery-roll-config-dialog.d.ts.map