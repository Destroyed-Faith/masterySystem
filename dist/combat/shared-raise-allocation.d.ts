/**
 * Shared Raise allocation for one Power use (Split / Instant AoE / Autofire).
 *
 * Pure in-memory store (no Foundry globals) so the key scheme can be unit tested.
 * `damage-dialog.ts` re-exports `rememberSharedRaiseAllocation`,
 * `peekSharedRaiseAllocation` and `forgetSharedRaiseAllocation`.
 */
import type { DeclaredRaise } from './raise-resolution.js';
/** Autofire key: one entry per Power use, shared by every slot of the chain. */
export declare function autofireRaiseShareKey(powerUseId: string): string;
/** Read the unique Autofire Power-use id from a flag bag (`powerUseId` / `autofireUseId`). */
export declare function readAutofirePowerUseId(flags: Record<string, any> | null | undefined): string;
/**
 * Key under which a Power use shares ONE post-roll Raise allocation.
 *
 * Autofire: `autofire:${powerUseId}`. When no id is present (legacy cards) it
 * falls back to the old attacker + attack total + paid-raise key; every real
 * Autofire chain stamps a unique id at the start of `resolveAutofireChain`.
 */
export declare function raiseAllocShareKey(flags: Record<string, any> | null | undefined): string;
export declare function rememberSharedRaiseAllocation(key: string, plan: DeclaredRaise[]): void;
export declare function peekSharedRaiseAllocation(key: string): DeclaredRaise[] | null;
/** Drop a shared Raise allocation (chain finished or damage cancelled). */
export declare function forgetSharedRaiseAllocation(key: string): boolean;
//# sourceMappingURL=shared-raise-allocation.d.ts.map