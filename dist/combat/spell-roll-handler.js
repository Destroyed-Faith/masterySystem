/**
 * Spell Roll Handler — Active-as-Spell pipeline (Templates refactor §6).
 *
 * Any Active power on a character can be upgraded into a Spell at creation
 * time. Spells reuse the Raise engine, but their resolution differs from a
 * standard attack:
 *
 *   1. Spell Attack  → pool = casting attribute, keep = mastery rank,
 *                      TN = calculateBaseTN(spellLevel) + 4 × raises (same as casting-table rules).
 *   2. Save Spell    → caster rolls Casting Roll vs Base TN (+ 4 × raises).
 *                      On success, each target rolls Save vs Save DC
 *                      (= 8 × caster mastery rank).
 *   3. Support Spell → Save Spell without a target save — only the Casting
 *                      Roll needs to succeed for the effect to land.
 *
 * Raises (`+4` per Raise) are declared before the roll. **Blood Raises** cost
 * `4 HP` each (ignoring armor) and add `+4` to the final total *and* stamp the
 * actor with a flag so those HP cannot be healed until the current combat ends.
 *
 * This module owns the maths & side-effects; the UI layer just calls
 * `rollSpell` and `canCastSpellAtLevel`.
 */
import { masteryRoll } from '../dice/roll-handler.js';
import { applyStress, applyDamage } from '../utils/calculations.js';
/** Flag scope used for persistent spell-related state on actors. */
const FLAG_SCOPE = 'mastery-system';
/** Boolean flag: any HP lost to Blood Raises that is still outstanding. */
const FLAG_BLOOD_RAISE_HP = 'bloodRaiseHpLostThisCombat';
// ──────────────────────────────────────────────────────────────────────────
// Pure-math helpers
// ──────────────────────────────────────────────────────────────────────────
/** Maximum Spell Level a character can learn/cast: `Mastery Rank × 2`. */
export function getMaxSpellLevel(masteryRank) {
    return Math.max(0, Math.floor(masteryRank)) * 2;
}
/** Whether an actor of `masteryRank` can cast/learn a spell at `spellLevel`. */
export function canCastSpellAtLevel(masteryRank, spellLevel) {
    if (!Number.isFinite(masteryRank) || !Number.isFinite(spellLevel))
        return false;
    if (spellLevel < 1 || spellLevel > 16)
        return false;
    return spellLevel <= getMaxSpellLevel(masteryRank);
}
export const SPELL_TIER_TABLE = {
    1: 8,
    2: 16,
    3: 24,
    4: 32,
    5: 40,
    6: 48,
    7: 56,
    8: 64,
};
/** Spell Tier (I–VIII) that contains the given Power Level (1–16). */
export function spellTierForPowerLevel(spellLevel) {
    const lvl = Math.max(1, Math.min(16, Math.floor(spellLevel)));
    return Math.ceil(lvl / 2);
}
/** Casting TN for a Spell of Tier I..VIII (Players Guide 7912–7923). */
export function castingTNForTier(tier) {
    return SPELL_TIER_TABLE[tier];
}
/**
 * Base Casting TN for a Spell built from a Power of `spellLevel` (1..16).
 *
 * Equivalent to `castingTNForTier(spellTierForPowerLevel(spellLevel))`, kept
 * as a stand-alone export because every existing caller already uses
 * `calculateBaseTN(...)`.
 */
export function calculateBaseTN(spellLevel) {
    return castingTNForTier(spellTierForPowerLevel(spellLevel));
}
/**
 * Save DC a target must beat for a Save Spell.
 *
 * Players Guide saving-throw chapter (~6840–6864) defines the DC as
 * `8 × caster Mastery Rank` *plus* the caster's Intellect scaling
 * (`floor(Intellect/8)`). The optional `intellect` argument keeps the
 * legacy single-arg signature working for callers that have not been
 * updated to the attribute-aware version yet.
 */
export function calculateSaveDC(masteryRank, intellect = 0) {
    const baseTN = 8 * Math.max(1, Math.floor(masteryRank));
    const intBonus = Math.max(0, Math.floor((Number.isFinite(intellect) ? intellect : 0) / 8));
    return baseTN + intBonus;
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
    const barsClone = bars.map((b) => ({ ...b }));
    const newCurrent = applyStress(barsClone, currentBar, appliedAmount);
    try {
        await actor.update({
            'system.stress.bars': barsClone,
            'system.stress.currentBar': newCurrent,
        });
    }
    catch (err) {
        console.warn('Mastery System | applyStressToActor failed', err);
    }
    return newCurrent;
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
 *   3. Resolve against the correct TN (Evade vs spell, Base TN vs save).
 *   4. On failure: `1d8` stress; on success: return result for the caller to
 *      apply damage/effects (targets' saves are rolled in the UI layer).
 */
export async function rollSpell(params) {
    const { actor, target = null, spellLevel, castingAttribute, resolution, saveType, declaredRaises = 0, bloodRaises = 0, gmModifier = 0, masteryRankOverride, spellName = 'Spell', flavor, supportMode = false, } = params;
    const system = actor?.system ?? {};
    const attrValue = Number(system.attributes?.[castingAttribute]?.value ?? 0);
    const masteryRank = Number(masteryRankOverride ?? system.mastery?.rank ?? 1);
    // Players Guide minimum-pool rule (~5888–5899): the pool can never be
    // smaller than the caster's Mastery Rank.
    const numDice = Math.max(1, Math.max(attrValue, masteryRank));
    const keepDice = Math.max(1, masteryRank);
    const bloodApplied = Math.max(0, Math.floor(bloodRaises));
    const rawRaises = Math.max(0, Math.floor(declaredRaises));
    const totalRaises = bloodApplied + rawRaises;
    const baseTn = calculateBaseTN(spellLevel);
    const finalTn = baseTn + totalRaises * 4 + (Number(gmModifier) || 0);
    // HP cost for Blood Raises fires *before* the roll per the SRD wording.
    let bloodHpLost = 0;
    if (bloodApplied > 0) {
        bloodHpLost = await applyBloodRaiseHpLoss(actor, bloodApplied * 4);
    }
    const label = `Cast ${spellName} (Lvl ${spellLevel})`;
    const autoFlavor = [
        flavor,
        resolution === 'spellAttack'
            ? `Spell Attack — Casting TN ${baseTn}`
            : `Save Spell — Base TN ${baseTn}${supportMode ? ' (support)' : ''}`,
        totalRaises > 0 ? `+${totalRaises} Raise${totalRaises === 1 ? '' : 's'} (+${totalRaises * 4} TN)` : undefined,
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
        label,
        flavor: autoFlavor,
        actorId: actor?.id,
        targetActorId: target?.id,
        rollKind: resolution === 'spellAttack' ? 'attack' : 'generic',
    });
    // `masteryRoll` already records success/raises against the final TN.
    // Blood Raises are added on top of the rolled total for the success check.
    const adjustedTotal = castingRoll.total + bloodApplied * 4;
    const success = adjustedTotal >= finalTn;
    const raises = success
        ? Math.floor((adjustedTotal - finalTn) / 4) + totalRaises
        : 0;
    let stressTaken = 0;
    if (!success) {
        stressTaken = await applyFizzleStress(actor);
    }
    return {
        castingRoll,
        baseTn,
        finalTn,
        declaredRaises: rawRaises,
        bloodRaises: bloodApplied,
        bloodHpLost,
        success,
        raises,
        saveDc: resolution === 'saveSpell' && !supportMode
            ? calculateSaveDC(masteryRank, Number(system.attributes?.intellect?.value ?? 0))
            : null,
        stressTaken,
        resolution,
        ...(saveType ? { saveType } : {}),
    };
}
/**
 * Quick helper the UI uses to surface "this would need a Save Spell"/"Spell
 * Attack" to the player. Pulls the declared resolution from the power item,
 * falling back to `saveSpell` when the item is missing the hint.
 */
export function inferResolutionFromItem(powerItem) {
    const sys = powerItem?.system ?? {};
    if (sys.spellResolution === 'spellAttack' || sys.spellResolution === 'saveSpell') {
        return sys.spellResolution;
    }
    return 'saveSpell';
}
//# sourceMappingURL=spell-roll-handler.js.map