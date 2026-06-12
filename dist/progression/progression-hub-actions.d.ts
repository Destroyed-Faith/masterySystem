/**
 * Shared XP progression helpers for the character sheet and Progression Hub.
 */
import { buildArtifactEvolutionCards } from '../artifacts/artifact-evolution-actions.js';
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
export declare function calculateSingleSkillPendingXpNet(actor: any, skillKey: string, pending: number): number;
export declare function calculateSkillPendingNetCost(actor: any, pendingMap: Record<string, number>): number;
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