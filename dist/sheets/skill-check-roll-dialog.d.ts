/**
 * Shared ordinary Skill Check player dialog (DF 2026-10-24 GM-defined correction).
 *
 * GM defines task, Attribute, Skill and Base TN.
 * The only player gameplay control before the roll is Paid Raises.
 */
import { type SkillCheckDraft, type SkillCheckSkillRef, type SkillRollSource, type SpecAttributeKey } from '../rules/index.js';
export interface SkillCheckDialogResult {
    draft: SkillCheckDraft;
    attributeKey: SpecAttributeKey;
    baseTn: number;
    paidRaises: number;
    skill: SkillCheckSkillRef;
}
export interface SkillCheckDialogOptions {
    actor: any;
    source: SkillRollSource;
    /**
     * When true (default for gm-request), Attribute/Skill/Base TN/task are read-only.
     * Sheet-verbal may record GM-announced values in labeled fields.
     */
    lockGmFields?: boolean;
    /**
     * Limited GM-approved skill alternatives. When set, a compact picker is shown
     * among those options only (never a free catalog).
     */
    allowedSkills?: SkillCheckSkillRef[];
    initialPaidRaises?: number;
    title?: string;
}
/**
 * Open the shared Skill Check dialog. Resolves null on cancel.
 */
export declare function promptSkillCheckRollDialog(opts: SkillCheckDialogOptions): Promise<SkillCheckDialogResult | null>;
//# sourceMappingURL=skill-check-roll-dialog.d.ts.map