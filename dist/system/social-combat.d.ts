/**
 * Social Combat — Phased Challenge subsystem.
 *
 * Source: Players Guide 4952–5135 ("Social Combat — Phased Challenge").
 *
 *   • Encounter Setup (4990–5018): players define the goal; GM sets
 *     phases, allowed Skills, base TN (default 16), and one or more
 *     Boss Defenses (Influence / Resolve / Wits / Intellect TN).
 *
 *   • Phase Loop (5022–5037): roleplay → choose Lead → Support actions
 *     resolve first → Lead rolls once. Raises declared before the roll
 *     each add `+4` TN.
 *
 *   • Lead & Support (5041–5054): each non-Lead PC may Support **once
 *     per phase**. On Support success → add the supporter's Mastery
 *     Rank as a flat bonus to the Lead roll.
 *
 *   • Setup Pool (5058–5082): all phases except the last create
 *     `Setup Gain = Raises − 1` (Raises−1: 0=−1, 1=0, 2=+1, …).
 *
 *   • Final Phase (5086–5100): `Final Total Raises = Final Phase Raises
 *     + Setup Pool` and compare to the threshold:
 *         < 4 → Fail        4–7 → Success        8+ → Overdeliver
 *
 *   • Stress (5104–5114): a failed phase roll inflicts `4d8 Stress`
 *     split among the participating PCs.
 *
 * This module owns the **rules math and orchestration state**. Foundry
 * UI integration (chat cards / dialogs) can build on top of these
 * primitives without re-deriving any thresholds.
 */
import { type RaiseOutcome } from '../combat/raise-resolution.js';
export declare const SOCIAL_COMBAT_DEFAULT_BASE_TN = 16;
export declare const SOCIAL_COMBAT_RAISE_TN_INCREMENT = 4;
/** Players Guide 5096–5100. */
export declare const SOCIAL_COMBAT_OUTCOME_THRESHOLDS: {
    readonly success: 4;
    readonly overdeliver: 8;
};
/**
 * Players Guide 5108–5114: each failed phase deals `4d8` Stress, split
 * among the PCs participating in that phase.
 */
export declare const SOCIAL_COMBAT_FAIL_STRESS_DICE = "4d8";
/** Type of Boss Defense exposed by the antagonist. */
export type BossDefenseKind = 'influence' | 'resolve' | 'wits' | 'intellect';
export declare const BOSS_DEFENSE_LABELS: Record<BossDefenseKind, string>;
export interface BossDefense {
    kind: BossDefenseKind;
    /** Numeric TN value (the GM may compute it from the boss's stats). */
    tn: number;
    /** Optional flavour name (e.g. "The Duke's Pride"). */
    label?: string;
}
/** Players Guide 4970–4982: canon list of social Skills. */
export declare const SOCIAL_COMBAT_SKILLS: readonly ["Persuasion", "Deception", "Etiquette", "Empathy", "Intimidation", "Leadership", "Negotiation", "Performance", "Seduction", "Streetwise"];
export type SocialCombatSkill = typeof SOCIAL_COMBAT_SKILLS[number];
/** A single phase definition created during Encounter Setup. */
export interface SocialPhaseDefinition {
    /** Sequential phase index (1-based). */
    index: number;
    /** Display title for the phase. */
    title: string;
    /** Skills the GM accepts for Lead/Support rolls in this phase. */
    allowedSkills: SocialCombatSkill[];
    /** Base TN for this phase (defaults to encounter base TN). */
    baseTn: number;
    /** `true` for the final phase (no Setup gained, decides outcome). */
    isFinalPhase: boolean;
}
/** Result of a single Support roll. */
export interface SupportRollResult {
    actorId: string;
    /** Skill used for the support roll. */
    skill: SocialCombatSkill;
    success: boolean;
    /** Mastery Rank flat bonus contributed if the support succeeded. */
    bonus: number;
}
/** Result of the Lead roll for one phase. */
export interface PhaseLeadRollResult {
    leadActorId: string;
    skill: SocialCombatSkill;
    declaredRaises: number;
    /** Normal TN (unchanged by declared raises). */
    normalTn: number;
    /** Raise TN = normalTn + declaredRaises × 4. */
    raiseTn: number;
    /** @deprecated Use normalTn — kept for callers comparing against normal TN. */
    tn: number;
    total: number;
    success: boolean;
    raiseOutcome: RaiseOutcome;
    /** Raises credited only on full Raise success. */
    raises: number;
}
/** Aggregate result of one resolved phase. */
export interface PhaseOutcome {
    phaseIndex: number;
    isFinalPhase: boolean;
    leadResult: PhaseLeadRollResult;
    supportResults: SupportRollResult[];
    /**
     * Setup Gain = Raises − 1 (only counted for non-final phases). If
     * negative, the Setup Pool *decreases* by that amount.
     */
    setupGain: number;
    /** PCs participating in the phase (used for Stress on failure). */
    participantActorIds: string[];
    /** True if the phase failed → triggers `4d8` Stress. */
    failed: boolean;
}
/** Setup Gain table (Players Guide 5070–5080). */
export declare function setupGainForRaises(raises: number): number;
/** Raise TN after declaring `raises` Raises (Normal TN unchanged). */
export declare function phaseRaiseTn(baseTn: number, raises: number): number;
/** @deprecated Alias for {@link phaseRaiseTn}. */
export declare function phaseTnWithRaises(baseTn: number, raises: number): number;
/** Resolve a Lead roll under the dual-TN Raise rules. */
export declare function resolveLeadRollOutcome(total: number, normalTn: number, declaredRaises: number): Pick<PhaseLeadRollResult, 'success' | 'raises' | 'raiseOutcome'>;
/** Total Mastery-Rank bonus contributed by all successful Supports. */
export declare function supportBonusTotal(results: SupportRollResult[]): number;
/** Resolve a single phase end-to-end: build the outcome record. */
export declare function resolvePhase(input: {
    phase: SocialPhaseDefinition;
    leadResult: PhaseLeadRollResult;
    supportResults: SupportRollResult[];
    participantActorIds: string[];
}): PhaseOutcome;
/** Setup Pool accumulated across all non-final phases so far. */
export declare function setupPoolFromOutcomes(outcomes: PhaseOutcome[]): number;
export type SocialCombatOutcomeLabel = 'fail' | 'success' | 'overdeliver';
export interface FinalOutcomeReport {
    finalRaises: number;
    setupPool: number;
    totalRaises: number;
    label: SocialCombatOutcomeLabel;
    /** Human-friendly description that mirrors the Players Guide table. */
    description: string;
}
/** Compute the encounter outcome from the final phase + Setup Pool. */
export declare function computeFinalOutcome(finalPhase: PhaseOutcome, allOutcomes: PhaseOutcome[]): FinalOutcomeReport;
/**
 * Players Guide 5108–5114: split `4d8` Stress among the participants of
 * a failed phase as evenly as possible. Returns an array of
 * `{ actorId, stress }` rows the runtime can apply with
 * `applyStress(...)` directly.
 *
 * The roll itself is the caller's responsibility (different bots prefer
 * different ways to roll dice in chat).
 */
export declare function distributeFailedPhaseStress(stressTotal: number, participantActorIds: string[]): {
    actorId: string;
    stress: number;
}[];
/** Build a default 3-phase encounter as recommended by Players Guide 4990–5018. */
export declare function defaultThreePhaseEncounter(allowedSkills?: SocialCombatSkill[]): SocialPhaseDefinition[];
//# sourceMappingURL=social-combat.d.ts.map