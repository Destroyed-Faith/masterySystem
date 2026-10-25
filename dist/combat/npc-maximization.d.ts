/**
 * NPC shared Maximization pool + per-attack eligibility/cadence.
 * Spends feed the same Damage-card „Roll Maximum“ path as player Maximization.
 */
import type { AttackValue } from '../types/actor.js';
import type { RoundState } from './action-economy.js';
export type NpcMaximizationRefresh = 'perRound' | 'perPhase';
export type NpcMaximizationCadence = 'perRound' | 'perPhase';
export interface NpcMaximizationConfig {
    charges: number;
    refresh: NpcMaximizationRefresh;
    phaseIndex: number | null;
}
export interface NpcMaximizationAttackRef {
    phaseIndex?: number | null;
    attackIndex?: number | null;
}
/** Active phase index for phased bosses; null for root / non-phased. */
export declare function resolveNpcMaximizationPhaseIndex(system: any): number | null;
/** Shared pool config for the active (or given) phase / root. */
export declare function resolveNpcMaximizationConfig(system: any, phaseIndex?: number | null): NpcMaximizationConfig | null;
export declare function isNpcAttackMaximizationEligible(attack: AttackValue | null | undefined): boolean;
export declare function npcAttackMaximizationCadence(attack: AttackValue | null | undefined): NpcMaximizationCadence;
/**
 * Seed / refresh NPC Maximization fields on a RoundState.
 * - perRound pool: refill to charges; drop perRound attack uses; keep perPhase attack uses when same phase+combat.
 * - perPhase pool: refill only when combat/phase changes; otherwise carry remaining + perPhase attack uses.
 */
export declare function seedNpcMaximizationRoundState(actor: any, combat: any | null, roundState: RoundState, previous?: RoundState | null): void;
/** After a boss phase change: refill if the new phase pool refreshes perPhase (or always set from new config). */
export declare function onNpcMaximizationPhaseChanged(actor: any): Promise<void>;
/** Ensure RoundState has live remaining for the current config (lazy sync). */
export declare function syncNpcMaximizationRemaining(actor: any, combat?: any | null): number;
export declare function getNpcMaximizationAttackUses(actor: any, combat?: any | null): Record<string, number>;
export declare function canSpendNpcMaximization(actor: any, ref: NpcMaximizationAttackRef, combat?: any | null): boolean;
export declare function getNpcMaximizationUiState(actor: any, ref: NpcMaximizationAttackRef, combat?: any | null): {
    remaining: number;
    canSpend: boolean;
    label: string;
} | null;
/** Spend 1 shared charge + mark this attack's cadence use. */
export declare function spendNpcMaximization(actor: any, ref: NpcMaximizationAttackRef): Promise<boolean>;
//# sourceMappingURL=npc-maximization.d.ts.map