/**
 * Skill spend helpers for Epic Mastery Roll overlay.
 * DF 2026: Skill Spend is retired — option builders return empty / no-op.
 */
import type { MasteryRollResult } from '../types/index.js';
export interface SkillSpendOption {
    amount: number;
    newTotal: number;
    success: boolean;
    raises: number;
    label: string;
}
export interface SkillSpendPacket {
    index: number;
    amount: number;
    clickable: boolean;
}
/** Distribute remaining skill pool across four MR-sized packets (skill sheet style). */
export declare function buildSkillSpendPackets(remainingPool: number, masteryRank: number): SkillSpendPacket[];
export declare function sumSelectedPacketSpend(packets: SkillSpendPacket[], selected: boolean[]): number;
/**
 * @deprecated DF 2026-10-23: post-roll Skill Spend is retired.
 * Always returns no options so Epic Roll never offers spend UI.
 */
export declare function getSkillSpendOptions(_actor: Actor, _skillKey: string, _rollResult: MasteryRollResult & {
    raiseOutcome?: string;
    stoneBonusRaises?: number;
}, _baseModifier?: number): {
    remainingPool: number;
    skillRating: number;
    options: SkillSpendOption[];
};
/** @deprecated DF 2026 — Skill Spend retired; does nothing. */
export declare function applySkillSpendToActor(_actor: Actor, _skillKey: string, _amount: number): Promise<void>;
export declare function totalsAfterSkillSpend(rollResult: MasteryRollResult, spendAmount: number, baseModifier?: number): {
    total: number;
    success: boolean;
    raises: number;
    skill: number;
};
//# sourceMappingURL=epic-mastery-roll-skill-spend.d.ts.map