/**
 * Round-based deterministic encounter simulator — party offense direction.
 *
 * Computes the expected round-by-round damage the selected party deals to a
 * concrete enemy body configuration, respecting the canonical resolution
 * pipeline (parry strip -> to-hit vs Evade / Casting TN -> phasing -> ward ->
 * damage roll -> penetration -> armor -> DR% -> natural-8 floor) and the
 * canonical Special rules (application cap, tick, natural recovery, decay).
 *
 * Player Specials escalate later rounds: Corrode lowers the body's Armor,
 * Expose lowers Evade, Sundered/Hex add damage dice, Ruin ticks. This is why
 * phase Health cannot be "party DPR × rounds" — the cumulative curve is
 * genuinely non-linear.
 *
 * All quantities are expected values; no Math.random anywhere.
 */
import { ENCOUNTER_TUNING } from './encounter-tuning.js';
import { attackConnectChance, expectedHitDamage, pcSpellCastingTn, } from './combat-math.js';
import { applyExpectedSpecial, armorDelta, bonusDiceVsVictim, evadeDelta, processTurnStart, } from './special-sim.js';
export function emptySolvedDefenses() {
    return {
        evade: 0,
        armor: 0,
        parryStrip: 0,
        ward: 0,
        damageNegationDice: 0,
        drPct: 0,
        spellResistance: 0,
        phasingCharges: 0,
    };
}
/** Expected damage + special application of one member attack vs the body. */
function evaluateAttack(member, attack, body, stacks, ctx) {
    const penalty = Math.max(0, Math.min(1, ctx.poolPenaltyFraction));
    const pool = Math.max(member.mr, Math.floor(attack.pool - Math.floor(attack.pool * penalty)));
    const tn = attack.kind === 'spell'
        ? pcSpellCastingTn(attack.casterMr ?? member.mr, body.defenses.spellResistance, {
            mental: attack.isMental,
        })
        : Math.max(1, body.defenses.evade + evadeDelta(stacks));
    let connect = attackConnectChance({
        pool,
        keep: attack.keep,
        tn,
        parryStrip: attack.kind === 'martial' ? ctx.parryStrip : 0,
    });
    if (body.meleeEscape && attack.delivery === 'melee') {
        connect *= ENCOUNTER_TUNING.meleeUptimeVsEscaping;
    }
    const damage = connect *
        expectedHitDamage({
            dice: attack.damageDice + ctx.bonusDamageDice + bonusDiceVsVictim(stacks, attack.kind === 'spell'),
            flat: attack.flatDamage,
            penetration: attack.penetration,
            armor: Math.max(0, body.defenses.armor + armorDelta(stacks)),
            drPct: body.defenses.drPct,
            damageNegationDice: ctx.damageNegationDice,
        });
    return { damage, connect };
}
/** Pick the member's best attack against the body's current state. */
function bestMemberAttack(member, body, stacks, ctx) {
    let best = { attack: member.attacks[0], damage: -1, connect: 0 };
    for (const attack of member.attacks) {
        const r = evaluateAttack(member, attack, body, stacks, ctx);
        if (r.damage > best.damage)
            best = { attack, ...r };
    }
    return best;
}
/* ------------------------------------------------------------------ */
/* Core curve simulation                                               */
/* ------------------------------------------------------------------ */
/**
 * Simulate the party focusing ONE body for up to `maxRounds`, returning the
 * expected damage curve including Special escalation. Fresh special stacks —
 * callers model pre-stacking via focus windows (see solveFocusTimeline).
 */
export function simulateFocusDamageCurve(party, body, options = {}) {
    const maxRounds = Math.max(1, options.maxRounds ?? 12);
    const outputFactor = options.outputFactor ?? 1;
    const stacks = new Map();
    const roundDamage = [];
    const cumulative = [];
    let phasingLeft = Math.max(0, body.defenses.phasingCharges);
    let peakStacks = 0;
    let total = 0;
    // Outstanding add-clearing hits: waves add to the pool when they arrive;
    // diverted party attacks drain it round by round.
    let outstandingAddHits = 0;
    for (let round = 1; round <= maxRounds; round += 1) {
        const appliedThisRound = new Map();
        // Body turn start: ticks damage the body, recovery + decay shrink stacks.
        const turn = processTurnStart(stacks, body.mr);
        let damage = turn.tickDamage;
        if (options.addWaves) {
            for (const wave of options.addWaves) {
                if (wave.round === round)
                    outstandingAddHits += Math.max(0, wave.hits);
            }
        }
        const contributions = [];
        // Parry / DN target the strongest attacker — find them in a first pass.
        let strongestIdx = 0;
        let strongestDamage = -1;
        party.members.forEach((member, idx) => {
            const probe = bestMemberAttack(member, body, stacks, {
                poolPenaltyFraction: options.poolPenaltyByRound?.[idx]?.[round - 1] ?? 0,
                parryStrip: 0,
                damageNegationDice: 0,
                bonusDamageDice: 0,
                extraAttacks: 0,
            });
            if (probe.damage > strongestDamage) {
                strongestDamage = probe.damage;
                strongestIdx = idx;
            }
        });
        party.members.forEach((member, idx) => {
            const burstRound = options.burst === true && round === 1;
            const extraAttacks = burstRound ? (member.burstExtraActions ?? 0) : 0;
            const ctx = {
                poolPenaltyFraction: options.poolPenaltyByRound?.[idx]?.[round - 1] ?? 0,
                parryStrip: idx === strongestIdx ? body.defenses.parryStrip : 0,
                damageNegationDice: idx === strongestIdx ? body.defenses.damageNegationDice : 0,
                bonusDamageDice: burstRound ? member.burstBonusDamageDice : 0,
                extraAttacks,
            };
            let attacksCount = member.attackActionsPerRound + extraAttacks;
            // Divert whole attacks to add-clearing while waves are outstanding.
            while (outstandingAddHits > 0 && attacksCount > 0) {
                outstandingAddHits -= 1;
                attacksCount -= 1;
            }
            if (attacksCount <= 0)
                return;
            const best = bestMemberAttack(member, body, stacks, ctx);
            contributions.push({
                member,
                damage: best.damage * attacksCount,
                connect: best.connect,
                attack: best.attack,
                attacksCount,
            });
        });
        let roundTotal = contributions.reduce((a, c) => a + c.damage, 0);
        const expectedHits = contributions.reduce((a, c) => a + c.connect * c.attacksCount, 0);
        // Phasing: negate whole hits, strongest first (EV approximation: remove
        // average damage per hit weighted toward the strongest contribution).
        if (phasingLeft > 0 && expectedHits > 0) {
            const negated = Math.min(phasingLeft, expectedHits);
            const avgPerHit = roundTotal / expectedHits;
            roundTotal = Math.max(0, roundTotal - negated * avgPerHit);
            phasingLeft -= negated;
        }
        // Specials applied by the party this round (after ward), capped 4×MR.
        for (const c of contributions) {
            for (const s of c.attack.specials) {
                applyExpectedSpecial(stacks, appliedThisRound, s.id, c.connect * s.value * c.attacksCount, body.mr, body.defenses.ward);
            }
        }
        damage += roundTotal * outputFactor;
        total += damage;
        roundDamage.push(damage);
        cumulative.push(total);
        let stackTotal = 0;
        for (const [, v] of stacks)
            stackTotal += v;
        peakStacks = Math.max(peakStacks, stackTotal);
    }
    return { bodyId: body.id, roundDamage, cumulative, peakSpecialStacks: peakStacks };
}
/**
 * Walk the focus-fire timeline: the party focuses bodies in order, each body
 * takes `focusFireEfficiency` of the party output while focused; the
 * remainder pre-damages the next body. Returns fractional kill times.
 */
export function solveFocusTimeline(party, bodies, healths, options = {}) {
    const eff = bodies.length > 1 ? ENCOUNTER_TUNING.focusFireEfficiency : 1;
    const killTimes = [];
    let elapsed = 0;
    let spill = 0; // off-focus damage carried to the next body
    for (let i = 0; i < bodies.length; i += 1) {
        // Add-clearing is modeled inside the FIRST focus window only — adds are
        // cleared early in practice; re-applying the waves to every later body
        // would double-count the diverted attacks.
        const curve = simulateFocusDamageCurve(party, bodies[i], {
            ...options,
            addWaves: i === 0 ? options.addWaves : undefined,
            maxRounds: Math.max(6, Math.ceil((options.maxRounds ?? 12) - elapsed)),
        });
        const target = Math.max(1, healths[i] - spill);
        let killAt = Number.POSITIVE_INFINITY;
        let prevCum = 0;
        for (let r = 0; r < curve.cumulative.length; r += 1) {
            const cum = curve.cumulative[r] * eff;
            if (cum >= target) {
                const inRound = curve.roundDamage[r] * eff;
                const frac = inRound > 0 ? (target - prevCum) / inRound : 1;
                killAt = r + Math.min(1, Math.max(0, frac));
                break;
            }
            prevCum = cum;
        }
        if (!Number.isFinite(killAt)) {
            // Body survives the whole window — extrapolate with the last round rate.
            const lastRate = curve.roundDamage[curve.roundDamage.length - 1] * eff || 1;
            killAt = curve.cumulative.length + (target - prevCum) / lastRate;
        }
        // Off-focus damage accumulated on the NEXT body during this window.
        if (i + 1 < bodies.length && eff < 1) {
            const cumAtKill = target / eff;
            spill = cumAtKill * (1 - eff);
        }
        else {
            spill = 0;
        }
        elapsed += killAt;
        killTimes.push(elapsed);
    }
    return {
        killTimes,
        phaseRounds: elapsed,
        timeToFirstDrop: killTimes[0] ?? 0,
    };
}
//# sourceMappingURL=encounter-simulator.js.map