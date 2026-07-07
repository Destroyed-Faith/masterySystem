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
    /** @deprecated Auto-Raises removed — ignored if passed. */
    autoRaises?: number;
    /** Hard cap on the final attack dice pool after mechanics / manual / auto-fail
     * adjustments. Used for Split-Attack strikes so bonus dice from passives
     * cannot balloon the pool back above the halved strike pool.
     */
    attackDiceCap?: number;
    /**
     * Agility stone Crit / similar: pool d8s explode on **7–8** (each exploding face
     * adds another d8) instead of the default face-equals-8 chain.
     */
    attackExplodeDiceOn78?: boolean;
    /**
     * Combat Advantage (Players Guide ~6457–6467): once, after the initial pool
     * is rolled, every die showing **1** is rerolled (replacement value is kept).
     * Only applies to the initial pool, never to explosion dice.
     */
    rollAdvantage?: boolean;
    /**
     * Combat Disadvantage (Players Guide ~6471–6477): of all initial-pool dice
     * that show **8**, only **one** chosen die explodes; the others stay flat 8.
     * Pool size and Keep are unchanged.
     */
    rollDisadvantage?: boolean;
    /** Normal TN — roll succeeds when total meets this (Raise rules). Defaults to `tn`. */
    normalTn?: number;
    /** Raise TN — declared raise effects only when total meets this. */
    raiseTn?: number;
    /** Number of declared raise slots (each +4 to Raise TN). */
    declaredRaiseSlots?: number;
    /** Stone-granted bonus raises applied on full raise success. */
    stoneBonusRaises?: number;
    /**
     * Raise resolution model:
     * - `power`: dual-TN for declared raises (combat powers)
     * - `skill`: margin raises after roll + optional dual-TN pre-declare (no cost)
     * - `margin`: margin raises only (echo cards, rituals)
     */
    raiseModel?: 'power' | 'skill' | 'margin';
    /** Blood Raises: each adds +4 to the roll total (HP cost handled by caller). */
    bloodRaises?: number;
    /** Bonus added only when checking Raise TN (Intellect Spell Raises stone). */
    raiseTnRollBonus?: number;
    /** When true, evaluate the roll but do not post a chat message. */
    skipChat?: boolean;
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
    normalTn?: number;
    raiseTn?: number;
    declaredRaiseSlots?: number;
    stoneBonusRaises?: number;
    raiseModel?: 'power' | 'skill' | 'margin';
    bloodRaises?: number;
    raiseTnRollBonus?: number;
    /** @deprecated */
    autoRaises?: number;
    /** Optional Split-Attack strike pool cap (mirrors `RollOptions.attackDiceCap`). */
    attackDiceCap?: number;
    /** Mirrors `RollOptions.attackExplodeDiceOn78` for Faith Fracture rerolls. */
    attackExplodeDiceOn78?: boolean;
    /** Mirrors `RollOptions.rollAdvantage` for Faith Fracture rerolls. */
    rollAdvantage?: boolean;
    /** Mirrors `RollOptions.rollDisadvantage` for Faith Fracture rerolls. */
    rollDisadvantage?: boolean;
}
/** Margin raises: each full +4 over TN = 1 Raise (echo, ritual, skill checks). */
export declare function countMarginRaises(total: number, tn: number): number;
/**
 * Perform a Mastery System roll
 * Roll N d8, keep K highest, add skill bonus
 * Dice explode on 8
 */
export declare function masteryRoll(options: RollOptions): Promise<MasteryRollResult>;
/**
 * Build a Foundry Roll matching the already-evaluated mastery result (no second RNG).
 * One `1d8`-equivalent Die per pool die so explosion faces appear as separate results (core + Dice So Nice).
 */
export declare function buildMasteryDisplayRoll(result: MasteryRollResult & {
    keptIndices?: number[];
}, skillBonus: number): Roll;
/** Optional Dice So Nice animation for an already-resolved mastery roll. */
export declare function showMasteryRollDice3d(result: MasteryRollResult & {
    keptIndices?: number[];
}, skillBonus?: number): Promise<void>;
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