/**
 * NPC attack helpers — d8 pool sizes, phase index, damage formula.
 */
import type { AttackValue } from '../types/actor.js';
/** Human-readable name for chat / attack card (catalog id or legacy key). */
export declare function displayNpcSpecialName(raw: string): string;
/** Effective attack row for display / damage (includes merged specials). */
export declare function normalizeNpcAttackRow(attack: AttackValue): AttackValue;
/**
 * Canonical Melee/Range + AoE resolution for NPC attack rows.
 * AoE is ON only when npcAoeRadiusM ≥ 2 (ignore leftover npcAoeShape).
 */
export type NpcAttackTargeting = {
    isRanged: boolean;
    reachM: number;
    rangedMinM: number;
    rangedMaxM: number;
    rangeM: number;
    hasAoe: boolean;
    aoeRad: number;
    aoeShape: 'none' | 'radius';
    burstMeleeAoE: boolean;
    rangedZone: boolean;
    tags: string[];
};
export declare function resolveNpcAttackTargeting(atk: AttackValue | null | undefined): NpcAttackTargeting;
/** Apply live sheet targeting onto a radial option (call at click time). */
export declare function applyNpcAttackTargetingToOption<T extends Record<string, any>>(option: T, atk: AttackValue | null | undefined): T;
/**
 * Normalize one attack row's targeting fields for persistence.
 * Radius &lt; 2 ⇒ no AoE (`npcAoeShape: 'none'`). Shape is always derived.
 */
export declare function sanitizeNpcAttackTargetingFields<T extends Record<string, any>>(row: T): T;
/**
 * Form submit must not change extra-power list length. Add/delete are
 * button-driven; a stale submitOnChange (old form without the new row, or
 * still containing a deleted row) would otherwise look like extras "collapsed".
 *
 * Length always comes from `existing` (including `[]`). Overlay submitted
 * fields onto those rows by index. Callers that *are* the add/delete write
 * should skip this merge (see `msNpcExtraPowers` update option).
 */
export declare function mergeNpcAttackValueLists(existing: unknown, submitted: unknown): any[];
/** Foundry `actor.update` option: this write *is* the extras add/delete. */
export declare const NPC_EXTRA_POWERS_UPDATE = "msNpcExtraPowers";
/**
 * Keep extra-power rows when a form submit replaces `system.phases` /
 * `system.attackValues` without the latest button-driven rows.
 */
export declare function preserveNpcExtraPowersInSystemUpdate(currentSystem: any, updateSystem: any): void;
/**
 * Sanitize all NPC attack targeting on a `system` blob (sheet submit / updates).
 * Coerces object-shaped `phases` to a real array so combat and sheet share one shape.
 */
export declare function sanitizeNpcSystemAttackTargeting(system: any): any;
/**
 * How many radial copies this power has (sheet dropdown 1–5; default 1).
 * Each copy is one Attack action in the radial menu.
 */
export declare function npcAttacksPerRoundCap(attack: AttackValue | null | undefined): number;
/** Stable usage key for an NPC attack row (shared by all radial copies). */
export declare function npcAttackUsageKey(phaseIndex: number | null | undefined, attackIndex: number): string;
/**
 * Sum of Angriffe/Runde across the active attack list (= ATK / attackSlots).
 */
export declare function sumNpcAttackSlotsFromPowers(system: any): number;
/**
 * Foundry often stores `system.phases` as a plain object `{ "0": {...} }` after
 * dotted-path updates. Combat must treat that the same as an array, otherwise
 * it falls back to root `npcBaseAttack` (stale Melee AoE) while the sheet edits
 * phase rows.
 */
export declare function coerceNpcPhasesArray(raw: unknown): any[];
/** Default single-bar NPC / phase HP block (editable current/max). */
export declare function defaultNpcHealth(): {
    bars: Array<{
        name: string;
        max: number;
        current: number;
        penalty: number;
    }>;
    currentBar: number;
    tempHP: number;
};
/**
 * Ensure an NPC (or boss-phase) health blob has at least one usable bar.
 * Repairs empty / object-shaped `bars` left behind after bad sheet submits.
 */
export declare function ensureNpcHealthState(raw: unknown): {
    bars: Array<{
        name: string;
        max: number;
        current: number;
        penalty: number;
    }>;
    currentBar: number;
    tempHP: number;
};
/** True when health already has at least one bar (array or numeric-key object). */
export declare function npcHealthHasBars(raw: unknown): boolean;
export declare function resolveNpcAttackList(system: any): {
    attacks: AttackValue[];
    phaseIndex: number | null;
};
export declare function getNpcAttackByIndex(system: any, attackIndex: number, phaseIndex: number | null | undefined): AttackValue | null;
/** Overlay authoritative targeting flags (if present) onto an attack row. */
export declare function mergeNpcAttackTargetingFlag(atk: AttackValue | null | undefined, actor: any, usageKey: string): AttackValue | null;
/** Attack roll pool: explicit count (2–16 typical), else parse legacy attackDice */
export declare function npcAttackDiceCount(attack: AttackValue | null | undefined): number;
/** Damage formula: Nd8 from count (4–16 typical), else legacy damage string */
export declare function npcDamageDiceFormula(attack: AttackValue | null | undefined): string;
export declare function formatNpcSpecialLabel(name: string, value: string | number | undefined | null): string;
/** All specials on one attack (array or legacy single). */
export declare function formatNpcAttackSpecialsLine(attack: AttackValue | null | undefined): string;
/** Compact "Name(12)" for status / effect application (no spaces). */
export declare function npcSpecialEffectString(name: string, value: string | number | undefined | null): string;
//# sourceMappingURL=npc-attack-model.d.ts.map