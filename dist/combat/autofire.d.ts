/**
 * Autofire attack mode — ordered chain of targets, one shared Attack Roll.
 *
 * Before rolling, declare up to `1 + extraTargets` creatures. Every target after
 * the first must be within 4 m of the previous target and within the Power's
 * Range. Compare the same final result against each target's Evade in order;
 * the first miss ends the chain. No Raises are required for target count.
 * Every hit receives the full printed payload. Dive for Cover cannot be used.
 */
import type { RadialCombatOption } from '../radial-menu/types.js';
export declare const AUTOFIRE_CHAIN_LINK_M = 4;
/** Detect Autofire mode from a radial option / power item. */
export declare function detectAutofire(option: RadialCombatOption): boolean;
/** Maximum additional targets after the first (Autofire(X) → X). */
export declare function getAutofireExtraTargets(option: RadialCombatOption): number;
export declare function getAutofireMaxTargets(option: RadialCombatOption): number;
/**
 * Resolve an ordered Autofire chain after the shared Attack Roll.
 * Stops at the first miss. Full payload per hit; no Dive for Cover.
 */
export declare function resolveAutofireChain(params: {
    attacker: any;
    chainTokenIds: string[];
    attackTotal: number;
    declaredRaiseSlots?: number;
    flags: Record<string, any>;
    weaponId?: string | null;
}): Promise<void>;
//# sourceMappingURL=autofire.d.ts.map