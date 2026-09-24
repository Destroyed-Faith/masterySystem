/**
 * Opposed Attribute Contest — the one resolver behind non-combat contests
 * (arm wrestling, an argument, a test of will) and combat Grapple.
 *
 * Both sides roll an Attribute Pool (attribute dice, keep Mastery Rank) with
 * the normal `masteryRoll` engine. No Skill, no Skill Points, no TN, no
 * Raises: the two Final Results are compared directly. Higher wins; a tie
 * leaves the situation unchanged. Workflows differ only in how the contest
 * is started and what happens with the outcome — never in the dice math.
 */
import type { RollOptions } from '../dice/roll-handler.js';
export declare const CONTEST_ATTRIBUTES: readonly ["might", "agility", "vitality", "intellect", "resolve", "influence", "wits"];
export type ContestAttributeKey = (typeof CONTEST_ATTRIBUTES)[number];
/** Grapple and other physical struggles: Might or Agility. */
export declare const PHYSICAL_CONTEST_ATTRIBUTES: readonly ContestAttributeKey[];
export type ContestOutcome = 'initiator' | 'opponent' | 'tie';
/**
 * Where a contest came from. Decides the consequences applied on resolution,
 * not how the dice are rolled.
 */
export type ContestContext = 'general' | 'grapple' | 'grapple-escape';
export interface ContestSideSetup {
    actorId: string;
    actorUuid?: string;
    tokenId?: string;
    name: string;
    attributeKey: ContestAttributeKey;
    /** Surprise Grapple: the initiator rolls with Advantage. */
    advantage?: boolean;
    /** Surprise Grapple: the unaware target rolls with Disadvantage. */
    disadvantage?: boolean;
}
export interface ContestSideResult extends ContestSideSetup {
    numDice: number;
    keepDice: number;
    dice: number[];
    kept: number[];
    keptIndices: number[];
    dieChains?: number[][];
    total: number;
    flavor?: string;
    autoFailReason?: string;
}
export declare function isContestAttributeKey(value: unknown): value is ContestAttributeKey;
export declare function contestAttributeLabel(key: string): string;
/** Attribute dice on the sheet (`value`, falling back to `stones`). */
export declare function contestAttributeDice(actor: any, attributeKey: string): number;
export declare function contestKeepDice(actor: any): number;
export interface ContestRollOptionInput {
    label: string;
    flavor?: string;
    advantage?: boolean;
    disadvantage?: boolean;
    /** Resolved actor instance (needed for unlinked-token actors). */
    actorRef?: any;
}
/**
 * Roll options for one contest side. Attribute dice, keep Mastery Rank,
 * Pool & Keep with the normal pool-reduction stages. Deliberately no
 * `skillKey`, no `isSkillRoll`, no TN and no Raises, and `rollKind`
 * `'contest'` — identifiable in hooks and logs, and outside the attack /
 * skill dice-delta paths of the mechanics engine.
 */
export declare function buildContestRollOptions(actor: any, attributeKey: ContestAttributeKey, input: ContestRollOptionInput): RollOptions;
/** Higher Final Result wins. Equal results are a tie — nothing changes. */
export declare function compareContestResults(initiatorTotal: number, opponentTotal: number): ContestOutcome;
/**
 * Surprise Grapple: only the initial contest is affected. The initiator gains
 * Advantage, the unaware target rolls with Disadvantage. Escape contests and
 * any later contest are never modified by this flag.
 */
export declare function surpriseContestModifiers(context: ContestContext, targetUnaware: boolean): {
    initiatorAdvantage: boolean;
    opponentDisadvantage: boolean;
};
/** Attributes the opponent may answer with for a given contest context. */
export declare function opponentAttributeChoices(context: ContestContext): readonly ContestAttributeKey[];
/** Attributes the initiator may pick for a given contest context. */
export declare function initiatorAttributeChoices(context: ContestContext): readonly ContestAttributeKey[];
export declare function contestOutcomeText(outcome: ContestOutcome, initiatorName: string, opponentName: string): string;
/** Copy the parts of a `masteryRoll` result the contest card stores and displays. */
export declare function contestSideFromRoll(setup: ContestSideSetup, numDice: number, keepDice: number, roll: {
    total: number;
    dice: number[];
    kept: number[];
    keptIndices?: number[];
    dieChains?: number[][];
    flavor?: string;
    autoFailReason?: string;
}): ContestSideResult;
//# sourceMappingURL=opposed-attribute-contest.d.ts.map