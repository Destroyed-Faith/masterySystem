/**
 * Verbose NPC attack targeting diagnostics.
 * Filter browser console with:  MS NPC Targeting
 */
import { type NpcAttackTargeting } from './npc-attack-model.js';
export declare function npcTargetingSnap(row: any): {
    name: string;
    kind: string;
    meters: string | number;
    short: string | number;
    long: string | number;
    aoe: string | number;
    shape: string;
    burst: boolean;
    ranged: boolean;
};
export declare function npcTargetingLine(label: string, row: any): string;
export declare function logNpcTargeting(label: string, detail?: Record<string, unknown>): void;
export declare function logNpcTargetingRow(label: string, row: any, extra?: Record<string, unknown>): void;
/** Dump every attack combat will see from this system blob. */
export declare function logNpcAttackListDump(label: string, system: any, actorMeta?: Record<string, unknown>): void;
/** Compare sheet/world/token actor attack lists side by side. */
export declare function logNpcActorTargetingCompare(label: string, tokenActor: any, worldActor: any | null | undefined): void;
export declare function logNpcOptionBranch(label: string, option: any, targeting: NpcAttackTargeting | null): void;
//# sourceMappingURL=npc-targeting-debug.d.ts.map