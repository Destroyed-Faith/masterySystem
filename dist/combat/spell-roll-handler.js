/**
 * Spell Roll Handler — Active-as-Spell pipeline (Templates refactor §6).
 *
 * Any Active power on a character can be upgraded into a Spell at creation
 * time. Spells reuse the Raise engine, but their resolution differs from a
 * standard attack:
 *
 *   Spell Attack → pool = casting attribute, keep = mastery rank,
 *                  TN = 8 × caster Mastery Rank (+4 for Mental Powers)
 *                       + Target Spell Resistance + 4 × declared raises.
 *
 *   Saving Throws were removed from the rules: a successful cast resolves the
 *   spell's full listed payload. Resistance only happens through explicitly
 *   named Attribute Checks created by individual rules.
 *
 * Raises (`+4` per Raise) are declared before the roll. **Blood Raises** cost
 * `4 HP` each (ignoring armor) and add `+4` to the final total *and* stamp the
 * actor with a flag so those HP cannot be healed until the current combat ends.
 *
 * This module owns the maths & side-effects; the UI layer just calls
 * `rollSpell` and `canCastSpellAtLevel`.
 */
import { masteryRoll } from '../dice/roll-handler.js';
import { computeRaiseTns, resolveRaiseOutcome } from './raise-resolution.js';
import { RAISE_INCREMENT } from '../utils/constants.js';
import { applyStress, applyDamage, isStressTrackCollapsed, calculateMaxPowerLevel, } from '../utils/calculations.js';
/** Flag scope used for persistent spell-related state on actors. */
const FLAG_SCOPE = 'mastery-system';
/** Boolean flag: any HP lost to Blood Raises that is still outstanding. */
const FLAG_BLOOD_RAISE_HP = 'bloodRaiseHpLostThisCombat';
// ──────────────────────────────────────────────────────────────────────────
// Pure-math helpers
// ──────────────────────────────────────────────────────────────────────────
/**
 * Maximum Power Level a character can learn/cast (spells use the normal
 * Power Level cap by Mastery Rank: MR1–2 → 4, MR3 → 8, MR4 → 12, MR5+ → 16).
 */
export function canCastSpellAtLevel(masteryRank, spellLevel) {
    if (!Number.isFinite(masteryRank) || !Number.isFinite(spellLevel))
        return false;
    if (spellLevel < 1 || spellLevel > 16)
        return false;
    return spellLevel <= calculateMaxPowerLevel(Math.max(1, Math.floor(masteryRank)));
}
/**
 * Spell Base TN (Players Guide "Casting Roll"): **8 × caster Mastery Rank**,
 * independent of the Power Level of the spell being cast.
 *
 *   MR 1 → 8, MR 2 → 16, … MR 8 → 64.
 *
 * Mental Powers (Mental Attack, Mind Illusion, Mind Probe, Mental Control)
 * use `Mental Power Base TN = Spell Base TN + 4`.
 *
 * `Final Spell TN = Spell Base TN + Target Spell Resistance` — SR is added by
 * the caller (it is per-target).
 */
export function castingBaseTnForMasteryRank(masteryRank, opts) {
    const mr = Math.max(1, Math.min(8, Math.floor(Number(masteryRank) || 1)));
    return 8 * mr + (opts?.mental ? 4 : 0);
}
// ──────────────────────────────────────────────────────────────────────────
// Casting-cost mutators (HP for Blood Raises, Stress for fizzle)
// ──────────────────────────────────────────────────────────────────────────
/**
 * Deduct `amount` HP from the actor, bypassing armor (blood magic). Records
 * the amount lost so it cannot be healed until combat ends.
 * Returns the actual HP actually removed (clamped to what was available).
 */
export async function applyBloodRaiseHpLoss(actor, amount) {
    if (!actor || amount <= 0)
        return 0;
    const system = actor.system ?? {};
    const health = system.health ?? {};
    const bars = Array.isArray(health.bars) ? health.bars : undefined;
    if (!bars || bars.length === 0)
        return 0;
    const barsClone = bars.map((b) => ({ ...b }));
    const before = barsClone.reduce((sum, b) => sum + b.current, 0);
    // Same as strike damage: pools drain from the first (Healthy) bar onward.
    const newCurrent = applyDamage(barsClone, 0, amount);
    const after = barsClone.reduce((sum, b) => sum + b.current, 0);
    const lost = Math.max(0, before - after);
    const prior = Number(actor.getFlag?.(FLAG_SCOPE, FLAG_BLOOD_RAISE_HP) ?? 0) || 0;
    try {
        await actor.update({
            'system.health.bars': barsClone,
            'system.health.currentBar': newCurrent,
        });
        await actor.setFlag?.(FLAG_SCOPE, FLAG_BLOOD_RAISE_HP, prior + lost);
    }
    catch (err) {
        console.warn('Mastery System | applyBloodRaiseHpLoss failed', err);
    }
    return lost;
}
/**
 * Apply `amount` stress to the actor.
 *
 * Players Guide stress chapter (~6493–6502): `floor(Resolve/8)` Stress
 * Armor reduces every *involuntary* stress hit; voluntary stress (push
 * casts, Focus power-ups, etc.) ignores Stress Armor. Pass
 * `{ voluntary: true }` to bypass the armor.
 */
export async function applyStressToActor(actor, amount, options) {
    if (!actor || amount <= 0)
        return 0;
    const system = actor.system ?? {};
    const stress = system.stress ?? {};
    const bars = Array.isArray(stress.bars) ? stress.bars : undefined;
    const currentBar = Number.isFinite(stress.currentBar) ? stress.currentBar : 0;
    if (!bars || bars.length === 0)
        return currentBar;
    let appliedAmount = amount;
    if (!options?.voluntary) {
        const armor = Math.max(0, Math.floor(Number(system?.scaling?.resolveStressArmor ?? 0) || 0));
        if (armor > 0) {
            appliedAmount = Math.max(0, amount - armor);
            if (appliedAmount === 0) {
                // Fully absorbed by armor — nothing to commit, but signal to the
                // caller that the armor "ate" the entire hit.
                return currentBar;
            }
        }
    }
    const wasCollapsed = isStressTrackCollapsed(bars, currentBar);
    const barsClone = bars.map((b) => ({ ...b }));
    const newCurrent = applyStress(barsClone, currentBar, appliedAmount);
    // Store a clamped bar index for sheet UI; collapse is detected separately.
    const storedBar = Math.min(Math.max(0, newCurrent), Math.max(0, barsClone.length - 1));
    try {
        await actor.update({
            'system.stress.bars': barsClone,
            'system.stress.currentBar': storedBar,
        });
    }
    catch (err) {
        console.warn('Mastery System | applyStressToActor failed', err);
    }
    // Players Guide: when the track fills, run the Stress Breakdown Check.
    try {
        const nowCollapsed = isStressTrackCollapsed(barsClone, newCurrent);
        if (!wasCollapsed && nowCollapsed) {
            const { maybeTriggerStressBreakdown } = await import('./stress-breakdown.js');
            await maybeTriggerStressBreakdown(actor, { wasCollapsed: false });
        }
    }
    catch (err) {
        console.warn('Mastery System | stress breakdown trigger failed', err);
    }
    return storedBar;
}
/** Roll `1d8` and apply the result as stress. Returns the stress inflicted. */
export async function applyFizzleStress(actor) {
    try {
        const roll = await new globalThis.Roll('1d8').evaluate({ async: true });
        const amount = Math.max(1, Number(roll?.total) || 1);
        await applyStressToActor(actor, amount);
        return amount;
    }
    catch (err) {
        console.warn('Mastery System | applyFizzleStress fallback to flat 4', err);
        await applyStressToActor(actor, 4);
        return 4;
    }
}
/**
 * `combatEnd`/`deleteCombat` hook target: clears the per-combat Blood Raise
 * flag so HP becomes healable again once the fight is over. Intentionally
 * cheap — runs once per actor, no-op if the flag is absent.
 */
export async function clearBloodRaiseHpFlagForCombat(combat) {
    try {
        const combatants = combat?.combatants?.contents ?? combat?.combatants ?? [];
        const seen = new Set();
        for (const c of combatants) {
            const a = c?.actor;
            if (!a || seen.has(a.id))
                continue;
            seen.add(a.id);
            try {
                if (a.getFlag?.(FLAG_SCOPE, FLAG_BLOOD_RAISE_HP) != null) {
                    await a.unsetFlag?.(FLAG_SCOPE, FLAG_BLOOD_RAISE_HP);
                }
            }
            catch (err) {
                console.warn('Mastery System | clearBloodRaiseHpFlagForCombat actor failed', err);
            }
        }
    }
    catch (err) {
        console.warn('Mastery System | clearBloodRaiseHpFlagForCombat failed', err);
    }
}
/**
 * Execute the full Active-as-Spell roll pipeline:
 *   1. Blood Raises (HP loss) → added to the pool's total as +4 each.
 *   2. Casting Roll via `masteryRoll` (Pool = attribute, Keep = MR).
 *   3. Resolve against the Casting TN.
 *   4. On failure: `1d8` stress; on success: return result for the caller to
 *      apply damage/effects.
 */
export async function rollSpell(params) {
    const { actor, target = null, spellLevel, castingAttribute, resolution, declaredRaises = 0, declaredRaiseSlots, bloodRaises = 0, gmModifier = 0, masteryRankOverride, spellName = 'Spell', flavor, supportMode = false, mentalPower = false, } = params;
    const system = actor?.system ?? {};
    const attrValue = Number(system.attributes?.[castingAttribute]?.value ?? 0);
    const masteryRank = Number(masteryRankOverride ?? system.mastery?.rank ?? 1);
    // Base pool = casting attribute. Specials (Weaken / Soulburn), the
    // Health/Encumbrance percentage penalty, and the Minimum Pool (= MR)
    // are applied centrally inside `masteryRoll` in canonical order.
    const numDice = Math.max(0, attrValue);
    const keepDice = Math.max(1, masteryRank);
    const bloodApplied = Math.max(0, Math.floor(bloodRaises));
    const raiseSlots = Math.max(0, Math.floor(declaredRaiseSlots ?? declaredRaises ?? 0));
    const baseTn = castingBaseTnForMasteryRank(masteryRank, { mental: mentalPower }) +
        (Number(gmModifier) || 0);
    const { raiseTn } = computeRaiseTns(baseTn, raiseSlots);
    // HP cost for Blood Raises fires *before* the roll per the SRD wording.
    let bloodHpLost = 0;
    if (bloodApplied > 0) {
        bloodHpLost = await applyBloodRaiseHpLoss(actor, bloodApplied * 4);
    }
    const label = `Cast ${spellName} (Lvl ${spellLevel})`;
    const autoFlavor = [
        flavor,
        `Spell — Casting TN ${baseTn}${supportMode ? ' (support)' : ''}`,
        raiseSlots > 0 ? `+${raiseSlots} Raise${raiseSlots === 1 ? '' : 's'} (Raise TN ${raiseTn})` : undefined,
        bloodApplied > 0 ? `Blood Raises: ${bloodApplied} (−${bloodHpLost} HP)` : undefined,
        gmModifier ? `GM ${gmModifier > 0 ? '+' : ''}${gmModifier}` : undefined,
    ]
        .filter(Boolean)
        .join(' | ');
    const castingRoll = await masteryRoll({
        numDice,
        keepDice,
        skill: 0,
        tn: baseTn,
        normalTn: baseTn,
        raiseTn,
        declaredRaiseSlots: raiseSlots,
        label,
        flavor: autoFlavor,
        actorId: actor?.id,
        targetActorId: target?.id,
        rollKind: resolution === 'spellAttack' ? 'attack' : 'generic',
        poolAttribute: castingAttribute,
        applyPoolPenalties: true,
        actorRef: actor,
    });
    const adjustedTotal = castingRoll.total + bloodApplied * RAISE_INCREMENT;
    let raiseTnRollBonus = 0;
    try {
        const { getRoundState } = await import('./action-economy.js');
        const combat = game.combat;
        if (actor && combat) {
            const rs = getRoundState(actor, combat);
            raiseTnRollBonus = Math.max(0, Number(rs?.stoneBonuses?.spellRaiseTnBonus) || 0);
        }
    }
    catch {
        /* ignore */
    }
    const raiseOutcome = resolveRaiseOutcome(adjustedTotal, baseTn, raiseSlots, raiseTnRollBonus);
    const success = raiseOutcome !== 'fail';
    const raises = raiseOutcome === 'full' ? raiseSlots : 0;
    let stressTaken = 0;
    if (!success) {
        stressTaken = await applyFizzleStress(actor);
    }
    return {
        castingRoll,
        baseTn,
        raiseTn,
        finalTn: raiseSlots > 0 ? raiseTn : baseTn,
        declaredRaises: raiseSlots,
        raiseOutcome,
        bloodRaises: bloodApplied,
        bloodHpLost,
        success,
        raises,
        stressTaken,
        resolution,
    };
}
/**
 * Resolution mode for a spell power item. Saving throws were removed —
 * every spell resolves as `spellAttack` (caster roll vs TN).
 */
export function inferResolutionFromItem(_powerItem) {
    return 'spellAttack';
}
//# sourceMappingURL=spell-roll-handler.js.map