/**
 * GM review dialog for the legacy-cleanup 2026 migration. Shows the dry-run
 * report; Apply runs only after explicit confirmation (and only once Actives
 * v0.9.9.6 is applied) and downloads a JSON backup first. Never deletes documents.
 */
import { type LegacyCleanupReport } from './legacy-cleanup-2026-migration.js';
declare const LegacyCleanupReviewDialog_base: any;
export declare class LegacyCleanupReviewDialog extends LegacyCleanupReviewDialog_base {
    #private;
    static DEFAULT_OPTIONS: {
        id: string;
        tag: string;
        window: {
            title: string;
            resizable: boolean;
        };
        position: {
            width: number;
            height: number;
        };
    };
    constructor(report?: LegacyCleanupReport);
    _prepareContext(): Promise<Record<string, unknown>>;
    _onRender(context: unknown, options: unknown): void;
    _replaceHTML(result: string, content: HTMLElement, _options: unknown): void;
    _renderHTML(_context: unknown, _options: unknown): Promise<string>;
}
export declare function openLegacyCleanupReview(report?: LegacyCleanupReport): LegacyCleanupReviewDialog | null;
export {};
//# sourceMappingURL=legacy-cleanup-2026-review-dialog.d.ts.map