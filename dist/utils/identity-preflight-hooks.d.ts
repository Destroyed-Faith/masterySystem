/**
 * Read-only Foundry hooks for identity preflight (K4 / plan §9.2).
 * Never mutates actors, items, or effects.
 */
import { type IdentityPreflightReport } from './identity-preflight.js';
/**
 * World ready: GM summary whisper when unresolved entries exist.
 * Diagnostic only — no dialog block in C1.
 */
export declare function runIdentityPreflightOnReady(): Promise<IdentityPreflightReport | null>;
/**
 * Combat start: GM whisper for combatants with blocking/omitting identity gaps.
 */
export declare function runIdentityPreflightOnCombatStart(combat: any): Promise<void>;
export declare function registerIdentityPreflightHooks(): void;
//# sourceMappingURL=identity-preflight-hooks.d.ts.map