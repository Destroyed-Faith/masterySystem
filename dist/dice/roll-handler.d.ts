/**
 * Dice rolling handler for Mastery System
 * Implements Roll & Keep with exploding 8s
 */
import { MasteryRollResult } from '../types';
export interface RollOptions {
    numDice: number;
    keepDice: number;
    skill: number;
    tn?: number;
    label?: string;
    flavor?: string;
    actorId?: string;
    skillKey?: string;
    isSkillRoll?: boolean;
    isSaveRoll?: boolean;
    baseModifier?: number;
}
/** Stored on chat messages so a Faith Fracture reroll can repeat the same roll setup. */
export interface MasteryRollRecipe {
    numDice: number;
    keepDice: number;
    skill: number;
    tn: number;
    label: string;
    flavor: string;
    actorId: string | null;
    skillKey: string | null;
    isSkillRoll: boolean;
    isSaveRoll: boolean;
    baseModifier: number;
}
/**
 * Perform a Mastery System roll
 * Roll N d8, keep K highest, add skill bonus
 * Dice explode on 8
 */
export declare function masteryRoll(options: RollOptions): Promise<MasteryRollResult>;
/**
 * Quick roll from actor
 * Helper function to make rolling easier
 */
export declare function quickRoll(actor: Actor, attributeName: string, skillName?: string, tn?: number, label?: string, modifier?: number, flavor?: string): Promise<MasteryRollResult>;
declare const _default: {
    masteryRoll: typeof masteryRoll;
    quickRoll: typeof quickRoll;
};
export default _default;
//# sourceMappingURL=roll-handler.d.ts.map