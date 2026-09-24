/**
 * Attribute Contest chat card.
 *
 * The initiator rolls when the contest starts; the card then asks the
 * opponent (its owner or the GM) to pick an Attribute and roll. Both
 * workflows — the sheet's Check / Contest dialog and the combat Grapple
 * maneuver — post this card and share `opposed-attribute-contest.ts` for the
 * dice. Only the consequences differ by `context`.
 */
import { type ContestAttributeKey, type ContestContext, type ContestOutcome, type ContestSideResult, type ContestSideSetup } from './opposed-attribute-contest.js';
export interface AttributeContestState {
    context: ContestContext;
    initiator: ContestSideResult;
    opponent: ContestSideSetup & {
        choices: ContestAttributeKey[];
    };
    opponentResult?: ContestSideResult;
    outcome?: ContestOutcome;
    resolved: boolean;
    /** Surprise Grapple flag as chosen when the contest started. */
    targetUnaware?: boolean;
    combatId?: string;
    /** Attack Action already spent by the initiator (Grapple / Escape). */
    attackActionSpent?: boolean;
    consequenceNote?: string;
}
export declare const ATTRIBUTE_CONTEST_FLAG = "attributeContest";
export declare function contestTitle(context: ContestContext): string;
export declare function buildContestCardHtml(state: AttributeContestState): string;
/**
 * What a resolved contest means for the participants. Pure: returns the
 * note shown on the card and which grapple transition (if any) to apply.
 */
export declare function contestConsequence(context: ContestContext, outcome: ContestOutcome, initiatorName: string, opponentName: string): {
    note: string;
    grapple: 'apply' | 'end' | 'none';
};
export interface StartAttributeContestParams {
    context: ContestContext;
    initiatorActor: any;
    initiatorToken?: any;
    opponentActor: any;
    opponentToken?: any;
    attributeKey: ContestAttributeKey;
    /** Surprise Grapple (initial contest only). */
    targetUnaware?: boolean;
    /** Grapple / Escape spend 1 Attack Action before rolling. */
    costsAttackAction?: boolean;
    combat?: any;
}
/**
 * Start a contest: spend the Attack Action if required, roll the initiator
 * side and post the card that waits for the opponent's Attribute.
 */
export declare function startAttributeContest(params: StartAttributeContestParams): Promise<any | null>;
/**
 * Opponent picked an Attribute: roll their side, compare, apply the
 * consequence for the context and rewrite the card.
 */
export declare function answerAttributeContest(messageId: string, attributeKey: string): Promise<boolean>;
export declare function registerContestCardClickHandler(): void;
export interface ContestAttributePromptResult {
    attributeKey: ContestAttributeKey;
    targetUnaware: boolean;
}
/**
 * Default for "Target is Unaware": the GM-set Surprise status or a target
 * that cannot perceive the initiator (hidden / invisible). The player can
 * still flip the checkbox per action.
 */
export declare function detectTargetUnaware(initiatorActor: any, targetActor: any): Promise<boolean>;
/**
 * Dialog: pick the initiator's Attribute (and, for a Grapple, whether the
 * target is unaware). Returns null when cancelled.
 */
export declare function promptContestAttribute(actor: any, choices: readonly ContestAttributeKey[], opts: {
    title: string;
    intro?: string;
    unawareOption?: boolean;
    unawareDefault?: boolean;
}): Promise<ContestAttributePromptResult | null>;
//# sourceMappingURL=contest-card.d.ts.map