/**
 * "Check / Contest" mode for the sheet roll dialogs.
 *
 * The Skill Check and Attribute Check dialogs keep their existing fields.
 * This module adds the second mode — Attribute Contest — as a section that
 * replaces TN / Raises / Skill Pool with an opponent picker. The roll itself
 * goes through `startAttributeContest` (context `general`).
 */
import { type ContestAttributeKey } from './opposed-attribute-contest.js';
export type CheckContestMode = 'check' | 'contest';
export interface ContestOpponentChoice {
    /** Stable key: `token:<id>` or `actor:<id>`. */
    key: string;
    label: string;
    actorId: string;
    actorUuid?: string;
    tokenId?: string;
    /** Currently targeted by the user (listed first, preselected). */
    targeted: boolean;
}
/**
 * Opponent candidates for a non-combat contest: targeted tokens first, then
 * the other tokens on the scene, then world actors. The rolling actor's own
 * tokens are excluded.
 */
export declare function listContestOpponents(actor: any): ContestOpponentChoice[];
export declare function resolveContestOpponent(key: string, choices?: ContestOpponentChoice[]): Promise<{
    actor: any;
    token?: any;
} | null>;
export interface ContestModeHtmlOptions {
    /** Attribute fixed by the clicked sheet control (attribute dialog). */
    fixedAttribute?: ContestAttributeKey;
    /** Preselected attribute when a select is shown. */
    defaultAttribute?: ContestAttributeKey;
    opponents: ContestOpponentChoice[];
}
/** Mode switch shown at the top of both roll dialogs. */
export declare function buildCheckContestSwitchHtml(checkLabel: string): string;
/** Contest-only fields (hidden while the dialog is in Check mode). */
export declare function buildContestSectionHtml(actor: any, opts: ContestModeHtmlOptions): string;
/** Toggle check-only / contest-only sections when the mode radio changes. */
export declare function bindCheckContestMode($html: any): void;
export declare function readCheckContestMode($html: any): CheckContestMode;
export interface ContestDialogChoice {
    attributeKey: ContestAttributeKey;
    opponentKey: string;
}
export declare function readContestDialogChoice($html: any): ContestDialogChoice | null;
/** Sheet contest: no action cost, no combat requirement. */
export declare function runSheetAttributeContest(actor: any, choice: ContestDialogChoice, opponents?: ContestOpponentChoice[]): Promise<boolean>;
//# sourceMappingURL=contest-dialog-section.d.ts.map