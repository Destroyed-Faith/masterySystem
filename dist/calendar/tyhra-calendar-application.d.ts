/**
 * Tyhra Calendar — ApplicationV2 window.
 */
declare const ApplicationV2: typeof import("@league-of-foundry-developers/foundry-vtt-types/src/foundry/client/applications/api/application.mjs").default;
declare const BaseDialog: typeof ApplicationV2;
export declare class TyhraCalendarApplication extends BaseDialog {
    #private;
    private viewYear;
    private viewMonthIndex;
    private static instance;
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
            icon: string;
        };
    };
    static PARTS: {
        content: {
            template: string;
        };
    };
    constructor(options?: {
        year?: number;
        monthIndex?: number;
    });
    static show(options?: {
        year?: number;
        monthIndex?: number;
    }): void;
    static requestRefresh(): void;
    protected _prepareContext(_options: unknown): Promise<Record<string, unknown>>;
    protected _onRender(_context: unknown, _options: unknown): Promise<void>;
    close(options?: Application.CloseOptions): Promise<this>;
}
export {};
//# sourceMappingURL=tyhra-calendar-application.d.ts.map