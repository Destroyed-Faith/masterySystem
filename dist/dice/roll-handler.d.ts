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
export declare function quickRoll(actor: Actor, attributeName: string, skillName?: string, tn?: number, label?: string, modifier?: number): Promise<MasteryRollResult>;
declare const _default: {
    masteryRoll: typeof masteryRoll;
    quickRoll: typeof quickRoll;
};
export default _default;
//# sourceMappingURL=roll-handler.d.ts.map