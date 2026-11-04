/**
 * Special Aura Active Buffs (Z05 / Batch 8 + 8.1): fourteen catalogue Powers.
 *
 * Moving Self-centered Active Buffs — not Persistent Zones, not Melee Attacks.
 * Automatic Special application via applySpecialStringsToTarget.
 * Once per (owner × templateId × creature × combat Round); tracking survives
 * A→B→A Prep swaps because it is keyed by stable source identity, not effect id.
 */
/** Official Batch 8.1 catalogue — 14 named Special Aura Active Buffs. */
export declare const SPECIAL_AURA_TEMPLATE_IDS: readonly ["ab-blight-aura", "ab-challenge-aura", "ab-corrode-aura", "ab-disoriented-aura", "ab-expose-aura", "ab-hex-aura", "ab-lacerate-aura", "ab-mark-aura", "ab-root-aura", "ab-ruin-aura", "ab-slow-aura", "ab-soulburn-aura", "ab-sundered-aura", "ab-weaken-aura"];
export type SpecialAuraTemplateId = (typeof SPECIAL_AURA_TEMPLATE_IDS)[number];
export type SpecialAuraSpecialKey = 'blight' | 'challenge' | 'corrode' | 'disoriented' | 'expose' | 'hex' | 'lacerate' | 'mark' | 'root' | 'ruin' | 'slow' | 'soulburn' | 'sundered' | 'weaken';
export declare const RETIRED_LEGACY_AURA_TEMPLATE_IDS: readonly ["ab-armor-aura", "ab-damage-aura", "ab-summon-damage-aura", "ab-summon-armor-aura", "ab-armor-reduction-aura", "ab-allied-damage-aura"];
export interface ActiveSpecialAuraState {
    templateId: SpecialAuraTemplateId;
    special: SpecialAuraSpecialKey;
    rank: number;
    radiusM: number;
    effectId: string | null;
    name: string;
    measuredTemplateId?: string | null;
    sceneId?: string | null;
}
export declare function isSpecialAuraTemplateId(id: string | null | undefined): id is SpecialAuraTemplateId;
export declare function isRetiredLegacyAuraTemplateId(id: string | null | undefined): boolean;
/** Stable once-per-round source: owner + technical Aura Power (not effect UUID). */
export declare function specialAuraSourceKey(ownerId: string, templateId: string): string;
export declare function auraRoundKey(combatId: string, round: number): string;
export declare function specialAuraLabel(special: string, rank: number): string;
export declare function auraAlreadyApplied(combat: any, sourceKey: string, roundKey: string, creatureId: string): boolean;
export declare function markAuraApplied(combat: any, sourceKey: string, roundKey: string, creatureId: string): Promise<void>;
export declare function readActiveSpecialAura(owner: any): ActiveSpecialAuraState | null;
export declare function creatureInsideSpecialAura(owner: any, creature: any, radiusM: number): boolean;
/**
 * Apply aura Special to every non-owner creature currently inside (activation / owner-move).
 */
export declare function applySpecialAuraToCreaturesInRadius(owner: any, combat: any, reason: 'activation' | 'owner-move' | 'entry' | 'turn-start'): Promise<string[]>;
/** Movement: mover may enter others' auras; if mover owns an aura, refresh coverage. */
export declare function applySpecialAurasOnTokenMove(mover: any, _tokenDoc: any, combat: any): Promise<void>;
/** Target Turn Start — after ticks / recovery / decay / zones. */
export declare function applySpecialAurasAtTargetTurnStart(creature: any, combat: any): Promise<void>;
/** Create or move the visual circle with the owner token (not a second runtime aura). */
export declare function syncSpecialAuraVisual(owner: any): Promise<void>;
/** Buff end / replace — drop visual only; applied Specials and round marks remain. */
export declare function cleanupSpecialAuraVisual(owner: any, effect?: any): Promise<void>;
/** After successful Active Buff activation of a Special Aura. */
export declare function onSpecialAuraActivated(owner: any, combat: any): Promise<void>;
//# sourceMappingURL=special-aura-runtime.d.ts.map