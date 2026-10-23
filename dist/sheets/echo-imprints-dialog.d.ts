/**
 * Echo Imprints picker + use-to-chat (DF Players Guide 2026-10-23).
 *
 * Replaces the Minor Expressions dialog on live paths. Selection is free
 * (no Stones / XP / charges / Reroll Points). Choices are stored on
 * `system.echoImprints` as a string[] of imprint ids, capped at Mastery Rank.
 */
import { type EchoImprintAttribute } from '../rules/echo-imprints.js';
/** Saved ids from the actor, de-duplicated and restricted to known catalogue ids. */
export declare function readActorEchoImprintIds(actor: any): string[];
/** Post one Echo Imprint use (effect at the current tier + echo memory) to chat. */
export declare function postEchoImprintToChat(actor: any, imprintId: string): Promise<boolean>;
export interface EchoImprintsDialogOptions {
    /** Highlight / scroll to this attribute's section (e.g. from a per-attribute sheet button). */
    focusAttribute?: EchoImprintAttribute;
    /** Re-open with these ids checked (used after a failed validation). */
    initialSelected?: string[];
}
export declare function showEchoImprintsDialog(actor: any, options?: EchoImprintsDialogOptions): Promise<void>;
//# sourceMappingURL=echo-imprints-dialog.d.ts.map