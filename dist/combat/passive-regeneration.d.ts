/**
 * R-05 Passive: Restoration — daily Scarred-Bar self-restoration pool.
 * Resets once per Tyhran calendar day (`currentDayIndex`).
 */
import { regenerationPoolMaxForLevel, regenerationCatalogText } from './r05-pools.js';
export declare const REGEN_DAILY_FLAG = "passiveRegenerationDaily";
export declare const PASSIVE_REGENERATION_TEMPLATE_ID = "passive-regeneration";
/** Legacy id kept as alias for migration. */
export declare const PASSIVE_HEALING_LEGACY_ID = "passive-healing";
export interface RegenDailyState {
    /** Tyhran day index this spent counter belongs to. */
    dayIndex: number;
    /** Bars restored today. */
    spent: number;
    /** Power level that sized the pool when first spent/refreshed today. */
    poolMax: number;
}
export declare function getTyhranDayIndex(): number;
/** True for the Passive itself. Active Scarred Bar Restoration powers do not match. */
export declare function isPassiveRestorationIdentity(args: {
    templateId?: unknown;
    name?: unknown;
    type?: unknown;
}): boolean;
/** Slotted / owned Passive: Restoration power level (0 if none). */
export declare function getPassiveRegenerationLevel(actor: any): number;
export { regenerationPoolMaxForLevel, regenerationCatalogText };
export declare function getRegenerationState(actor: any): {
    level: number;
    poolMax: number;
    spent: number;
    remaining: number;
    dayIndex: number;
};
/** Ensure day boundary rolled — call on sheet/combat open. Idempotent. */
export declare function syncRegenerationDayBoundary(actor: any): Promise<boolean>;
export declare function activatePassiveRegeneration(actor: any, bars: number): Promise<{
    ok: boolean;
    restored: number;
    remaining: number;
    reason?: string;
}>;
/** Catalog row helper for pickers — implemented in `r05-pools.ts` (re-exported above). */
export declare function isPassiveRegenerationTemplate(templateId: string | null | undefined): boolean;
/** Ensure template still resolves after rename. */
export declare function resolveRegenerationTemplate(): import("../utils/powers/templates/_shared.js").PowerTemplate | undefined;
//# sourceMappingURL=passive-regeneration.d.ts.map