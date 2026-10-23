/**
 * Spell Roll Handler — Active-as-Spell pipeline (Templates refactor §6).
 *
 * Any Active power on a character can be upgraded into a Spell at creation
 * time. Spells reuse the Raise engine, but their resolution differs from a
 * standard attack:
 *
 *   Casting Roll → pool = casting attribute, keep = mastery rank.
 *   Spell Base TN = used Power Level × 4.
 *   Final Spell TN = Spell Base TN + effective SR + 4×Paid Combat Raises
 *   (+4 only for printed Mind Probe / Mental Control Final TN surcharge).
 *   Spell Penetration reduces only the Spell Resistance part, never the base.
 *
 *   Below the Spell Base TN (or Mental Power Base TN): the Spell fizzles and
 *   the caster takes 1d8 Stress. Reaching the base but missing the Final TN
 *   means the target resisted: no effect and no Stress.
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
import { getRulesMasteryRank } from '../utils/mastery-rank-sync.js';
import { spellResistanceAfterPenetration } from './target-defenses.js';
import { applyDamage, calculateMaxPowerLevel, } from '../utils/calculations.js';
import { spellBaseTnFromPowerLevel } from '../rules/spell-tn.js';
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
 * Spell Base TN = used Power Level × 4 (DF Guide 2026-10-23).
 * Mastery Rank sets Keep / legal PL cap, not this TN.
 * There is NO generic +4 for “Mental” Spells.
 */
export function castingBaseTnForPowerLevel(powerLevel) {
    return spellBaseTnFromPowerLevel(powerLevel);
}
/**
 * Printed Final Mental Power TN surcharge (+4) for Mind Probe / Mental Control only
 * (Power catalogue technical text). Not applied to Mental Attack or other Spells.
 */
export const MENTAL_FINAL_TN_SURCHARGE_TEMPLATE_IDS = new Set([
    'active-mind-probe',
    'active-mental-control',
]);
export function mentalFinalTnSurchargeForTemplate(templateId) {
    const id = String(templateId || '').trim();
    return MENTAL_FINAL_TN_SURCHARGE_TEMPLATE_IDS.has(id) ? 4 : 0;
}
/**
 * @deprecated Prefer {@link castingBaseTnForPowerLevel}. Legacy MR-based Spell TN
 * is retired; this wrapper maps an unknown PL by treating MR as a temporary stand-in.
 */
export function castingBaseTnForMasteryRank(masteryRank) {
    const mr = Math.max(1, Math.min(8, Math.floor(Number(masteryRank) || 1)));
    return castingBaseTnForPowerLevel(mr);
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
/** Legacy mechanical Stress — retired (Fear replaces mental pressure). No-op. */
export async function applyStressToActor(_actor, _amount, _options) {
    return 0;
}
/** Legacy fizzle Stress — retired. No-op; returns 0 stress inflicted. */
export async function applyFizzleStress(_actor) {
    return 0;
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
    const { actor, target = null, spellLevel, castingAttribute, resolution, declaredRaises = 0, declaredRaiseSlots, bloodRaises = 0, gmModifier = 0, masteryRankOverride, spellName = 'Spell', flavor, supportMode = false, mentalPower: _mentalPowerIgnored = false, templateId = null, } = params;
    void _mentalPowerIgnored;
    const system = actor?.system ?? {};
    const attrValue = Number(system.attributes?.[castingAttribute]?.value ?? 0);
    const masteryRank = Number(masteryRankOverride ?? getRulesMasteryRank(actor));
    // Base pool = casting attribute. Specials and the Health penalty are
    // applied in `masteryRoll`. The pool may be smaller than Mastery Rank.
    const numDice = Math.max(0, attrValue);
    const keepDice = numDice <= 0 ? 0 : Math.max(1, masteryRank);
    const bloodApplied = Math.max(0, Math.floor(bloodRaises));
    const raiseSlots = Math.max(0, Math.floor(declaredRaiseSlots ?? declaredRaises ?? 0));
    const spellBase = castingBaseTnForPowerLevel(spellLevel) +
        mentalFinalTnSurchargeForTemplate(templateId) +
        (Number(gmModifier) || 0);
    const effectiveSr = target && !supportMode ? spellResistanceAfterPenetration(target, actor) : 0;
    const baseTn = spellBase + effectiveSr;
    const { raiseTn, finalTn } = computeRaiseTns(baseTn, raiseSlots);
    // HP cost for Blood Raises fires *before* the roll per the SRD wording.
    let bloodHpLost = 0;
    if (bloodApplied > 0) {
        bloodHpLost = await applyBloodRaiseHpLoss(actor, bloodApplied * 4);
    }
    const label = `Cast ${spellName} (Lvl ${spellLevel})`;
    const autoFlavor = [
        flavor,
        `Spell — Base TN ${spellBase}${supportMode ? ' (support)' : ''}; Final TN ${finalTn}${raiseSlots > 0 ? ` (+${raiseSlots} Paid Raise${raiseSlots === 1 ? '' : 's'})` : ''}`,
        bloodApplied > 0 ? `Blood Raises: ${bloodApplied} (−${bloodHpLost} HP)` : undefined,
        gmModifier ? `GM ${gmModifier > 0 ? '+' : ''}${gmModifier}` : undefined,
    ]
        .filter(Boolean)
        .join(' | ');
    const castingRoll = await masteryRoll({
        numDice,
        keepDice,
        skill: 0,
        tn: finalTn,
        normalTn: baseTn,
        raiseTn: finalTn,
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
    // Spell Base TN only decides fizzle. Payload requires the raised Final TN.
    const raiseOutcome = resolveRaiseOutcome(adjustedTotal, baseTn, raiseSlots, raiseTnRollBonus);
    const fizzled = adjustedTotal < spellBase;
    const success = !fizzled && raiseOutcome === 'full';
    const raises = raiseOutcome === 'full' ? raiseSlots : 0;
    const stressTaken = 0;
    return {
        castingRoll,
        baseTn,
        raiseTn: finalTn,
        finalTn,
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