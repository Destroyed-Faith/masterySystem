/**
 * Epic Mastery Roll — full-screen cinematic overlay.
 */
import type { EpicMasteryRollSession } from './epic-mastery-roll-types.js';
declare class EpicMasteryRollOverlay {
    private session;
    private root;
    private rolling;
    constructor(session: EpicMasteryRollSession);
    private buildContext;
    render(): Promise<void>;
    private bind;
    updateSession(session: EpicMasteryRollSession): void;
    close(): void;
}
export declare function openEpicMasteryRollApp(session: EpicMasteryRollSession): Promise<void>;
export declare function closeEpicMasteryRollApp(): void;
export declare function getEpicMasteryRollApp(): EpicMasteryRollOverlay | null;
export {};
//# sourceMappingURL=epic-mastery-roll-app.d.ts.map