/**
 * Shared XP progression helpers for the character sheet and Progression Hub.
 */
import { buildArtifactEvolutionCards } from '../artifacts/artifact-evolution-actions.js';
import { type XpHistoryBalances, type XpHistoryEntry } from '../utils/xp-history.js';
import { type SkillPendingAllocation } from './skill-point-pool.js';
export declare const ATTRIBUTE_KEYS: readonly ["might", "agility", "vitality", "intellect", "resolve", "influence", "wits"];
export interface XpState {
    available: number;
    regularAvailable: number;
    freeAvailable: number;
    freeEarned: number;
    freeSpent: number;
    totalEarned: number;
    totalSpent: number;
    history: any[];
}
export declare function getXpState(actor: any): XpState;
export declare function hasFreeXp(actor: any): boolean;
export declare function applyXpCost(xpState: Pick<XpState, 'regularAvailable' | 'freeAvailable' | 'freeEarned' | 'freeSpent' | 'totalSpent'>, netCost: number): {
    pointsXp: number;
    pointsXpFree: number;
    totalSpent: number;
    freeSpent: number;
};
export declare function getAttributeXpBaseline(actor: any, attributeKey: string): number;
export declare function calculateAttributePendingNetCost(actor: any, pendingMap: Record<string, number>): number;
/**
 * Split pending Skill rank changes between unspent Skill Points and XP.
 * Skill Points pay first (one per rank, in click order); the rest costs XP.
 */
export declare function allocateActorSkillPending(actor: any, pendingMap: Record<string, number>): SkillPendingAllocation;
/** Net XP (positive = spend) for pending Skill changes after unspent Skill Points paid their share. */
export declare function calculateSkillPendingNetCost(actor: any, pendingMap: Record<string, number>): number;
/**
 * XP history rows for a confirmed Skill batch. Ranks paid with unspent Skill
 * Points are logged with 0 XP so the audit trail shows where they went.
 */
export declare function buildSkillStepHistoryEntries(opts: {
    actor: any;
    allocation: SkillPendingAllocation;
    before: XpHistoryBalances;
    after: XpHistoryBalances;
}): XpHistoryEntry[];
export declare function getPowerMinLevel(item: any): number;
export declare function getMaxPurchasablePowerLevel(actor: any): number;
export declare function calculatePowerPendingNetCost(actor: any, pendingMap: Record<string, number>): number;
export interface ProgressionHubContext {
    xp: XpState;
    masteryRank: number;
    hasFreeXpPhase: boolean;
    artifactCapacity: {
        bound: number;
        max: number;
        full: boolean;
    };
    attributes: Array<{
        key: string;
        label: string;
        value: number;
        baseline: number;
    }>;
    skillGroups: Array<{
        category: string;
        skills: Array<{
            key: string;
            name: string;
            value: number;
        }>;
    }>;
    powers: Array<{
        id: string;
        name: string;
        level: number;
        minLevel: number;
        maxLevel: number;
    }>;
    artifactCards: ReturnType<typeof buildArtifactEvolutionCards>;
    unwiredArtifacts: Array<{
        id: string;
        name: string;
    }>;
    hasArtifacts: boolean;
}
export declare function buildProgressionHubContext(actor: Actor): ProgressionHubContext;
export declare function applyAttributePendingChanges(actor: Actor, pendingMap: Record<string, number>): Promise<{
    ok: boolean;
    error?: string;
}>;
export declare function applySkillPendingChanges(actor: Actor, pendingMap: Record<string, number>): Promise<{
    ok: boolean;
    error?: string;
}>;
export declare function applyPowerPendingChanges(actor: Actor, pendingMap: Record<string, number>): Promise<{
    ok: boolean;
    error?: string;
}>;
//# sourceMappingURL=progression-hub-actions.d.ts.map