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
export const SOCIAL_COMBAT_DEFAULT_BASE_TN = 16;
export const SOCIAL_COMBAT_RAISE_TN_INCREMENT = 4;
/** Players Guide 5096–5100. */
export const SOCIAL_COMBAT_OUTCOME_THRESHOLDS = {
    success: 4,
    overdeliver: 8,
};
/**
 * Players Guide 5108–5114: each failed phase deals `4d8` Stress, split
 * among the PCs participating in that phase.
 */
export const SOCIAL_COMBAT_FAIL_STRESS_DICE = '4d8';
export const BOSS_DEFENSE_LABELS = {
    influence: 'Influence TN',
    resolve: 'Resolve TN',
    wits: 'Wits TN',
    intellect: 'Intellect TN',
};
/** Players Guide 4970–4982: canon list of social Skills. */
export const SOCIAL_COMBAT_SKILLS = [
    'Persuasion',
    'Deception',
    'Etiquette',
    'Empathy',
    'Intimidation',
    'Leadership',
    'Negotiation',
    'Performance',
    'Seduction',
    'Streetwise',
];
/** Setup Gain table (Players Guide 5070–5080). */
export function setupGainForRaises(raises) {
    const r = Math.max(0, Math.floor(raises));
    return r - 1;
}
/** Phase TN after declaring `raises` Raises. */
export function phaseTnWithRaises(baseTn, raises) {
    return Math.max(0, baseTn) + Math.max(0, raises) * SOCIAL_COMBAT_RAISE_TN_INCREMENT;
}
/** Total Mastery-Rank bonus contributed by all successful Supports. */
export function supportBonusTotal(results) {
    return results.filter((r) => r.success).reduce((sum, r) => sum + r.bonus, 0);
}
/** Resolve a single phase end-to-end: build the outcome record. */
export function resolvePhase(input) {
    const { phase, leadResult, supportResults, participantActorIds } = input;
    const failed = !leadResult.success;
    const setupGain = phase.isFinalPhase ? 0 : setupGainForRaises(failed ? 0 : leadResult.raises);
    return {
        phaseIndex: phase.index,
        isFinalPhase: phase.isFinalPhase,
        leadResult,
        supportResults,
        setupGain,
        participantActorIds,
        failed,
    };
}
/** Setup Pool accumulated across all non-final phases so far. */
export function setupPoolFromOutcomes(outcomes) {
    return outcomes
        .filter((o) => !o.isFinalPhase)
        .reduce((sum, o) => sum + o.setupGain, 0);
}
/** Compute the encounter outcome from the final phase + Setup Pool. */
export function computeFinalOutcome(finalPhase, allOutcomes) {
    const finalRaises = finalPhase.failed ? 0 : finalPhase.leadResult.raises;
    const setupPool = setupPoolFromOutcomes(allOutcomes);
    const totalRaises = finalRaises + setupPool;
    let label;
    let description;
    if (totalRaises < SOCIAL_COMBAT_OUTCOME_THRESHOLDS.success) {
        label = 'fail';
        description = 'Fail. The plan collapses, turns against the party, or succeeds only at a severe cost.';
    }
    else if (totalRaises < SOCIAL_COMBAT_OUTCOME_THRESHOLDS.overdeliver) {
        label = 'success';
        description = 'Success. The party achieves the goal.';
    }
    else {
        label = 'overdeliver';
        description =
            'Overdeliver. The party achieves the goal and gains an additional advantage, secret, ally, leverage, or cleaner outcome.';
    }
    return { finalRaises, setupPool, totalRaises, label, description };
}
/**
 * Players Guide 5108–5114: split `4d8` Stress among the participants of
 * a failed phase as evenly as possible. Returns an array of
 * `{ actorId, stress }` rows the runtime can apply with
 * `applyStress(...)` directly.
 *
 * The roll itself is the caller's responsibility (different bots prefer
 * different ways to roll dice in chat).
 */
export function distributeFailedPhaseStress(stressTotal, participantActorIds) {
    if (participantActorIds.length === 0)
        return [];
    const total = Math.max(0, Math.floor(stressTotal));
    const base = Math.floor(total / participantActorIds.length);
    let remainder = total - base * participantActorIds.length;
    const out = [];
    for (const id of participantActorIds) {
        const extra = remainder > 0 ? 1 : 0;
        if (extra)
            remainder -= 1;
        out.push({ actorId: id, stress: base + extra });
    }
    return out;
}
/** Build a default 3-phase encounter as recommended by Players Guide 4990–5018. */
export function defaultThreePhaseEncounter(allowedSkills = [...SOCIAL_COMBAT_SKILLS]) {
    return [1, 2, 3].map((idx) => ({
        index: idx,
        title: idx === 3 ? 'Final Phase' : `Phase ${idx}`,
        allowedSkills,
        baseTn: SOCIAL_COMBAT_DEFAULT_BASE_TN,
        isFinalPhase: idx === 3,
    }));
}
//# sourceMappingURL=social-combat.js.map