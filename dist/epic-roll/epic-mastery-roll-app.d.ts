/**
 * Epic Mastery Roll — live session overlay.
 */
import type { EpicMasteryRollSession } from './epic-mastery-roll-types.js';
declare const ApplicationV2: typeof import("@league-of-foundry-developers/foundry-vtt-types/src/foundry/client/applications/api/application.mjs").default;
declare const BaseApp: typeof ApplicationV2;
export declare class EpicMasteryRollApp extends BaseApp {
    private session;
    private rolling;
    static DEFAULT_OPTIONS: {
        id: string;
        classes: string[];
        position: {
            width: number;
            height: "auto";
        };
        window: {
            title: string;
            resizable: boolean;
            minimizable: boolean;
        };
    };
    static PARTS: {
        content: {
            template: string;
        };
    };
    constructor(session: EpicMasteryRollSession);
    protected _prepareContext(_options: unknown): Promise<Record<string, unknown>>;
    protected _onRender(context: unknown, options: unknown): Promise<void>;
    updateSession(session: EpicMasteryRollSession): void;
}
export declare function openEpicMasteryRollApp(session: EpicMasteryRollSession): Promise<void>;
export declare function closeEpicMasteryRollApp(): void;
export declare function getEpicMasteryRollApp(): EpicMasteryRollApp | null;
export {};
//# sourceMappingURL=epic-mastery-roll-app.d.ts.map