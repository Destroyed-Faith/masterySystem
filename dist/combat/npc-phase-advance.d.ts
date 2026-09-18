/**
 * Boss NPC phase advance — when the active phase Health pool hits 0, load the
 * next phase's Health and set npcActivePhaseIndex (Players Guide: a phase has
 * one Health pool; at 0 the creature dies or enters the next phase).
 */
/** True when every health bar is at 0 (or there are no bars). */
export declare function isNpcHealthPoolDepleted(health: unknown): boolean;
export interface NpcPhaseAdvanceResult {
    fromIndex: number;
    toIndex: number;
    fromName: string;
    toName: string;
    /** True when there was no further phase (boss stays at 0 HP). */
    defeated: boolean;
}
/**
 * Build an actor update that activates `toIndex`: persist current live HP into
 * the old phase, copy the next phase's HP into root health, set active index.
 */
export declare function buildNpcPhaseActivatePatch(actor: any, toIndex: number, opts?: {
    persistCurrentHealth?: boolean;
}): Record<string, unknown> | null;
/**
 * After damage: if this is a multi-phase boss and the live Health pool is empty,
 * advance to the next phase with a fresh Health pool. No-op on last phase.
 */
export declare function maybeAdvanceNpcBossPhase(actor: any): Promise<NpcPhaseAdvanceResult | null>;
/**
 * Manual phase-tab activation. Always sets the active index. When live HP is
 * already depleted and the clicked phase still has HP, also load that pool
 * (GM safety net if auto-advance was missed).
 */
export declare function activateNpcBossPhaseFromSheet(actor: any, toIndex: number): Promise<NpcPhaseAdvanceResult | null>;
//# sourceMappingURL=npc-phase-advance.d.ts.map