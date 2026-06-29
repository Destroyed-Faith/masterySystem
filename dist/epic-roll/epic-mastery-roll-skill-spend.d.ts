/**
 * Skill spend helpers for Epic Mastery Roll overlay (mirrors chat skill-spend flow).
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
export declare function getSkillSpendOptions(actor: Actor, skillKey: string, rollResult: MasteryRollResult & {
    raiseOutcome?: string;
    stoneBonusRaises?: number;
}, baseModifier?: number): {
    remainingPool: number;
    skillRating: number;
    options: SkillSpendOption[];
};
export declare function applySkillSpendToActor(actor: Actor, skillKey: string, amount: number): Promise<void>;
export declare function totalsAfterSkillSpend(rollResult: MasteryRollResult, spendAmount: number, baseModifier?: number): {
    total: number;
    success: boolean;
    raises: number;
    skill: number;
};
//# sourceMappingURL=epic-mastery-roll-skill-spend.d.ts.map