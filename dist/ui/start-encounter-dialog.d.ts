declare const ApplicationV2: typeof import("@league-of-foundry-developers/foundry-vtt-types/src/foundry/client/applications/api/application.mjs").default;
declare const BaseDialog: typeof ApplicationV2;
export declare class StartEncounterDialog extends BaseDialog {
    #private;
    static DEFAULT_OPTIONS: {
        id: string;
        classes: string[];
        position: {
            width: number;
            height: string;
        };
        window: {
            title: string;
            icon: string;
            resizable: boolean;
        };
        actions: {
            start: (this: StartEncounterDialog, event: Event) => void;
            cancel: (this: StartEncounterDialog, event: Event) => void;
            'toggle-all': (this: StartEncounterDialog, event: Event) => void;
        };
    };
    static PARTS: {
        content: {
            template: string;
        };
    };
    static open(): Promise<void>;
    _prepareContext(_options: any): Promise<any>;
}
export {};
//# sourceMappingURL=start-encounter-dialog.d.ts.map