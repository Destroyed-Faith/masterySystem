/**
 * GM Review Dialog for identity migration (K7 / plan §10.3).
 * Patterned after df-2026-migration-review-dialog — selection + before/after only.
 * Never deletes documents. Apply runs only after explicit confirmation.
 */
import { type IdentityMigrationProposal } from './power-identity-migration.js';
declare const IdentityMigrationReviewDialog_base: any;
export declare class IdentityMigrationReviewDialog extends IdentityMigrationReviewDialog_base {
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
    constructor(actor: any, proposals?: IdentityMigrationProposal[]);
    _prepareContext(): Record<string, unknown>;
    _onRender(_context: unknown, _options: unknown): void;
    _renderHTML(context: any): string;
}
/** Open the review dialog for one actor (GM). */
export declare function openIdentityMigrationReview(actor: any): IdentityMigrationReviewDialog | null;
export {};
//# sourceMappingURL=power-identity-migration-review-dialog.d.ts.map