/**
 * DF 2026-10-23 Migration Review (GM only).
 *
 * Shown after `runDf2026RulesMigration` when characters carry warnings, and
 * reachable later from the Actors directory header / `module.api`.
 *
 * Per character it lists:
 *  - Specialization suggestions derived from legacy Skill names (suggestions
 *    only — nothing is converted to a Rank; the GM sets name / Field / scope / Rank)
 *  - Unmapped Minor Expressions (need a manual Echo Imprint pick)
 *  - Echo Imprint trim warnings when the proposal exceeds Mastery Rank
 *
 * Saving writes only `system.specializations` + `system.echoImprints` (+ a
 * review-stamp flag). XP / Stones / Powers / Artifacts are left untouched.
 */
import type { Df2026MigrationSummary } from './df-2026-rules-migration.js';
import { type Df2026ReviewPlan } from './df-2026-migration-review-plan.js';
declare const ApplicationV2: any;
export declare class Df2026MigrationReviewDialog extends ApplicationV2 {
    #private;
    static DEFAULT_OPTIONS: {
        id: string;
        classes: string[];
        position: {
            width: number;
            height: number;
        };
        window: {
            title: string;
            icon: string;
            resizable: boolean;
        };
    };
    constructor(plans: Df2026ReviewPlan[], options?: Record<string, unknown>);
    /**
     * Open for GMs. Pass the migration summaries to limit the list to characters
     * that just migrated with warnings; omit them to list every unreviewed character.
     */
    static open(opts?: {
        summaries?: Df2026MigrationSummary[];
        includeReviewed?: boolean;
    }): Promise<boolean>;
    _renderHTML(_context: unknown, _options: unknown): Promise<string>;
    _replaceHTML(result: string, content: HTMLElement, _options: unknown): void;
    _onRender(context: unknown, options: unknown): void;
}
/** Convenience wrappers used by module wiring. */
export declare function showDf2026MigrationReview(opts?: {
    summaries?: Df2026MigrationSummary[];
    includeReviewed?: boolean;
}): Promise<boolean>;
export {};
//# sourceMappingURL=df-2026-migration-review-dialog.d.ts.map