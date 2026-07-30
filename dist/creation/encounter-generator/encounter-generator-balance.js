/**
 * Encounter Generator — balance model.
 *
 * Derives boss/minion stat blocks from analysed party metrics + a difficulty
 * setting. Pure and Foundry-free (unit-testable). Randomness (the Roll & Keep
 * simulator) is injectable via `rng`.
 *
 * The model is built on the engine reality documented in
 * encounter-generator-types.ts: NPC evade = MR*4 + floor(agility/8), NPC armor
 * = MR, NPC HP = explicit bars, per-phase attack/damage dice are honored.
 */
import { EXPLODING_D8_MEAN, hitRate, meanRaisesOnHit, quantile, simulateAttackTotals, } from './encounter-generator-analysis.js';
import { ENCOUNTER_LIMITS } from './encounter-generator-types.js';
export const DIFFICULTY_PARAMS = {
    moderate: {
        bossTTKRounds: 4,
        partyHitRateVsBoss: 0.7,
        bossHitRateVsParty: 0.5,
        bossHitDamageFrac: 0.2,
        minionHpPercentile: 0.4,
        minionDamageFrac: 0.1,
        bossMrOffset: 0,
        bossSlotFactor: 0.5,
        respawnCadence: 3,
        respawnPressure: 0.6,
    },
    hard: {
        bossTTKRounds: 6,
        partyHitRateVsBoss: 0.65,
        bossHitRateVsParty: 0.6,
        bossHitDamageFrac: 0.32,
        minionHpPercentile: 0.55,
        minionDamageFrac: 0.12,
        bossMrOffset: 0,
        bossSlotFactor: 0.66,
        respawnCadence: 2,
        respawnPressure: 0.9,
    },
    brutal: {
        bossTTKRounds: 8,
        partyHitRateVsBoss: 0.58,
        bossHitRateVsParty: 0.7,
        bossHitDamageFrac: 0.45,
        minionHpPercentile: 0.7,
        minionDamageFrac: 0.15,
        bossMrOffset: 1,
        bossSlotFactor: 0.85,
        respawnCadence: 1,
        respawnPressure: 1.2,
    },
};
const PHASE_ESCALATION = [1.0, 1.15, 1.3, 1.45, 1.6];
function clamp(value, lo, hi) {
    return Math.max(lo, Math.min(hi, value));
}
/** Escalation multiplier for phase `i` (0-based) on attack/damage dice. */
export function escalationFactor(phaseIndex) {
    return PHASE_ESCALATION[phaseIndex] ?? PHASE_ESCALATION[PHASE_ESCALATION.length - 1];
}
/** Split a HP total across N phases (equal-ish; remainder on the last phase). */
export function splitHpAcrossPhases(totalHp, phases) {
    const p = Math.max(1, Math.floor(phases));
    const total = Math.max(p, Math.round(totalHp));
    const base = Math.floor(total / p);
    const out = new Array(p).fill(base);
    out[p - 1] += total - base * p;
    return out;
}
/**
 * Choose MR so that MR×4 meets or exceeds targetEvade, keeping MR at least `minMr`.
 */
export function evadeToMrAgility(targetEvade, minMr) {
    const target = Math.max(0, Math.round(targetEvade));
    const mr = clamp(Math.max(Math.floor(minMr), Math.ceil(target / 4)), 1, 8);
    const realizedEvade = mr * 4;
    return { mr, agility: 2, realizedEvade };
}
/** Number of d8 whose exploding mean is closest to `targetRawDamage`. */
export function damageDiceForTarget(targetRawDamage, lo = 1, hi = 16) {
    const dice = Math.round(Math.max(0, targetRawDamage) / EXPLODING_D8_MEAN);
    return clamp(dice, lo, hi);
}
/**
 * Search dice pool size (lo..hi) whose hit rate vs `targetEvade` (keeping
 * `keepMr` dice) is closest to `targetRate`.
 */
export function solveAttackDiceForHitRate(targetEvade, keepMr, targetRate, lo = 2, hi = 16, samples = 1500, rng = Math.random) {
    let best = lo;
    let bestErr = Infinity;
    for (let n = lo; n <= hi; n++) {
        const totals = simulateAttackTotals(n, keepMr, samples, rng);
        const rate = hitRate(totals, targetEvade);
        const err = Math.abs(rate - targetRate);
        if (err < bestErr) {
            bestErr = err;
            best = n;
        }
    }
    return best;
}
/** Expected damage of one party member's hit vs a target with `armor`. */
function memberExpectedHit(member, targetEvade, targetArmor) {
    const hr = hitRate(member.attackTotals, targetEvade);
    const raises = meanRaisesOnHit(member.attackTotals, targetEvade);
    const expected = member.weaponDamageMean + member.mightMeleeBonus + raises * EXPLODING_D8_MEAN;
    const afterArmor = Math.max(0, expected - targetArmor);
    return { hitRate: hr, afterArmor };
}
function bossDamageDice(party, frac) {
    const targetAfterMit = frac * party.avgHP;
    const drFraction = clamp(party.avgDrPct / 100, 0, 0.95);
    const raw = targetAfterMit / (1 - drFraction) + party.avgArmor;
    return damageDiceForTarget(raw, 2, 16);
}
function buildBoss(index, bossCount, party, params, phases, rng) {
    const bossMr = clamp(party.medianMR + params.bossMrOffset, 1, 8);
    const desiredEvade = quantile(party.pooledAttackTotals, 1 - params.partyHitRateVsBoss);
    const { mr, agility, realizedEvade } = evadeToMrAgility(desiredEvade, bossMr);
    const armor = mr;
    // Party DPS vs this boss → total effective HP for the target time-to-kill.
    let dps = 0;
    for (const m of party.members) {
        const { hitRate: hr, afterArmor } = memberExpectedHit(m, realizedEvade, armor);
        dps += hr * afterArmor * m.attacksPerRound;
    }
    dps = Math.max(1, dps);
    const totalHp = Math.round(dps * params.bossTTKRounds);
    const perBossHp = Math.max(phases, Math.round(totalHp / bossCount));
    const baseAttackDice = solveAttackDiceForHitRate(party.avgEvade, mr, params.bossHitRateVsParty, 2, 16, 1500, rng);
    const baseDamageDice = bossDamageDice(party, params.bossHitDamageFrac);
    const attackSlots = clamp(Math.round((party.size * params.bossSlotFactor) / bossCount), 1, 6);
    const hpPerPhase = splitHpAcrossPhases(perBossHp, phases);
    const phaseStats = [];
    for (let i = 0; i < phases; i++) {
        const factor = escalationFactor(i);
        phaseStats.push({
            name: `Phase ${i + 1}`,
            hp: hpPerPhase[i],
            evade: realizedEvade,
            armor,
            attackDiceCount: clamp(Math.round(baseAttackDice * factor), 2, 16),
            damageDiceCount: clamp(Math.round(baseDamageDice * factor), 2, 16),
        });
    }
    return {
        id: `boss-${index}`,
        kind: 'boss',
        name: bossCount > 1 ? `Boss ${index + 1}` : 'Boss',
        mr,
        agility,
        speed: 6,
        attackSlots,
        movementSlots: 1,
        phases: phaseStats,
    };
}
function buildMinion(index, minionCount, party, params, rng) {
    const minionMr = clamp(party.medianMR - 1, 1, 8);
    const desiredEvade = quantile(party.pooledAttackTotals, 1 - 0.85);
    const { mr, agility, realizedEvade } = evadeToMrAgility(desiredEvade, minionMr);
    const armor = mr;
    // One-shot target: HP at the chosen percentile of party single-hit damage.
    const hits = party.members
        .map((m) => {
        const { afterArmor } = memberExpectedHit(m, realizedEvade, armor);
        return afterArmor;
    })
        .sort((a, b) => a - b);
    const hp = Math.max(1, Math.round(quantile(hits, params.minionHpPercentile)));
    const attackDice = clamp(solveAttackDiceForHitRate(party.avgEvade, mr, 0.4, 2, 12, 1200, rng), 2, 12);
    const damageDice = bossDamageDice(party, params.minionDamageFrac);
    return {
        id: `minion-${index}`,
        kind: 'minion',
        name: minionCount > 1 ? `Minion ${index + 1}` : 'Minion',
        mr,
        agility,
        speed: 6,
        attackSlots: 1,
        movementSlots: 1,
        phases: [
            {
                name: 'Phase 1',
                hp,
                evade: realizedEvade,
                armor,
                attackDiceCount: attackDice,
                damageDiceCount: clamp(damageDice, 1, 12),
            },
        ],
    };
}
/** Recommended respawn settings for the chosen difficulty + party size. */
export function recommendRespawn(party, params) {
    const clearPerRound = Math.max(1, party.size); // one-shot assumption: ~1 minion per PC/round
    const cadence = params.respawnCadence;
    const perWave = Math.max(1, Math.round(clearPerRound * params.respawnPressure));
    return { perWave, cadence };
}
/** Derive a full, editable encounter plan. */
export function deriveEncounterPlan(party, difficulty, composition, rng = Math.random) {
    const params = DIFFICULTY_PARAMS[difficulty];
    const bossCount = clamp(Math.floor(composition.bossCount), ENCOUNTER_LIMITS.minBosses, ENCOUNTER_LIMITS.maxBosses);
    const phases = clamp(Math.floor(composition.phasesPerBoss), ENCOUNTER_LIMITS.minPhases, ENCOUNTER_LIMITS.maxPhases);
    const minionCount = clamp(Math.floor(composition.minionCount), ENCOUNTER_LIMITS.minMinions, ENCOUNTER_LIMITS.maxMinions);
    const bosses = [];
    for (let i = 0; i < bossCount; i++) {
        bosses.push(buildBoss(i, bossCount, party, params, phases, rng));
    }
    const minions = [];
    for (let i = 0; i < minionCount; i++) {
        minions.push(buildMinion(i, minionCount, party, params, rng));
    }
    const rec = recommendRespawn(party, params);
    const respawn = {
        minionsPerWave: minionCount,
        cadenceRounds: clamp(Math.floor(composition.respawnCadence), ENCOUNTER_LIMITS.minCadence, ENCOUNTER_LIMITS.maxCadence),
        recommendedPerWave: rec.perWave,
        recommendedCadence: rec.cadence,
    };
    const notes = [
        'Ausweichen wird in-engine aus MR und Beweglichkeit erzeugt; Ruestung entspricht der MR.',
        'Phasen-Wechsel steuerst du im NSC-Bogen ueber die aktive Phase (npcActivePhaseIndex).',
    ];
    if (bossCount > 1) {
        notes.push('Bei mehreren Bossen verteilt sich der Gruppenschaden - der Kampf dauert real laenger als die einzelne Boss-TTK.');
    }
    return { difficulty, bosses, minions, respawn, notes };
}
//# sourceMappingURL=encounter-generator-balance.js.map