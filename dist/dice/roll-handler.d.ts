/**
 * Dice rolling handler for Mastery System
 * Implements Roll & Keep with exploding 8s
 */
import { MasteryRollResult } from '../types';
import { type CheckContext } from '../system/auto-fail.js';
/** Roll-kind hint used by the Power Mechanics Engine to look up dice-pool deltas. */
export type MasteryRollKind = 'attack' | 'skill' | 'damage' | 'saveBody' | 'saveMind' | 'saveSpirit' | 'generic';
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
    /**
     * Roll kind used by the Power Mechanics Engine to consult the actor's
     * aggregated dice-pool deltas (attack / skill / damage / saveBody / ...).
     * When omitted no engine-driven adjustment is applied.
     */
    rollKind?: MasteryRollKind;
    /**
     * Optional target actor id. When supplied together with `rollKind`, the
     * Power Mechanics Engine also evaluates passives / buffs whose `condition`
     * gate is target-facing (e.g. "+1 attack die vs Hexed").
     */
    targetActorId?: string;
    /**
     * Semantic check tags used by the Auto-Fail engine. When `tags`
     * includes `'sight'` and the rolling actor is Blinded(X), the roll
     * is either auto-failed (skill check) or penalised −X dice (attack).
     */
    checkContext?: CheckContext;
    /**
     * Intent classifier for the auto-fail engine. Defaults to `'skill'`.
     * Attacks use `'attack'` so that Blinded only subtracts dice instead
     * of forcing a full failure.
     */
    autoFailIntent?: 'skill' | 'attack';
    /**
     * Auto-Raises — the roller voluntarily removes dice from their pool to
     * convert them into guaranteed Raises. Each Auto-Raise shrinks the pool
     * by `AUTO_RAISE_DICE_COST` dice and adds +1 Raise on success. Ignored
     * when `isSaveRoll` is true; Saves cannot buy Auto-Raises.
     */
    autoRaises?: number;
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
    /** Voluntary Auto-Raises bought on this roll (0 when not used / for saves). */
    autoRaises: number;
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