/**
 * Power Mechanics Engine — Aggregator
 *
 * Reads structured `mechanics` blocks from slot-activated passives and
 * active-buff effects, sums them into per-actor totals, and builds a
 * breakdown list ("Armor +1 from Dragon Scales (slotted)") that the
 * character sheet renders as transparent tooltips.
 *
 * Powers that do not carry a `mechanics` block are ignored here (they are
 * purely descriptive and resolved as GM-ruling, unchanged from prior
 * behavior).
 *
 * This module deliberately does **not** touch Foundry's native
 * `ActiveEffect.changes` pipeline. All addition happens on top of the
 * existing `system.combat.*` values computed earlier in `prepareDerivedData`.
 */
/** Empty breakdown skeleton (all arrays/objects present, all totals zero). */
export function emptyBreakdown() {
    return {
        armor: [],
        evade: [],
        initiativeD8: [],
        movementBonus: [],
        regen: [],
        tempHP: [],
        healing: [],
        modifySpecialDeclared: [],
        grantNextHitDeclared: [],
        saveDice: { body: [], mind: [], spirit: [] },
        rollDice: { attack: [], skill: [], damage: [] },
        totals: {
            armor: 0,
            evade: 0,
            initiativeD8: 0,
            movementBonus: 0,
            regen: 0,
            saveDice: { body: 0, mind: 0, spirit: 0 },
            rollDice: { attack: 0, skill: 0, damage: 0 },
        },
    };
}
function mechanicsConditionGate(m) {
    return (m.condition ?? m.conditionExpr);
}
function formatModifySpecialSummary(m) {
    if (!m?.type || !m.mode)
        return '';
    const parts = [m.type, m.mode];
    if (typeof m.amount === 'number')
        parts.push(String(m.amount));
    if (typeof m.minExisting === 'number')
        parts.push(`min≥${m.minExisting}`);
    if (typeof m.maxValue === 'number')
        parts.push(`cap${m.maxValue}`);
    if (m.target)
        parts.push(`@${m.target}`);
    if (m.condition)
        parts.push(`if:${m.condition}`);
    return parts.join(' ');
}
function formatGrantNextHitSummary(m) {
    if (!m?.expires)
        return '';
    const parts = [];
    if (m.qualifier)
        parts.push(m.qualifier);
    parts.push(`→ expires:${m.expires}`);
    if (m.damageRiderFlat)
        parts.push(`dmg:${m.damageRiderFlat}`);
    const n = Array.isArray(m.specials) ? m.specials.length : 0;
    if (n > 0)
        parts.push(`specials×${n}`);
    if (m.condition)
        parts.push(`if:${m.condition}`);
    return parts.join(' ');
}
/**
 * Resolve the rank-specific mechanics block from a power item.
 * Falls back to the power-level `system.mechanics` when no rank override
 * exists. Returns null when the power has no mechanics at all.
 */
export function resolvePowerMechanics(powerItem) {
    if (!powerItem)
        return null;
    const sys = powerItem.system ?? {};
    const rank = Math.max(1, Math.min(4, Number(sys.rank ?? 1)));
    const levels = sys.levels ?? {};
    const rankBlock = levels[String(rank)] ?? null;
    const rankMech = rankBlock?.mechanics;
    if (rankMech && typeof rankMech === 'object')
        return rankMech;
    const topMech = sys.mechanics;
    if (topMech && typeof topMech === 'object')
        return topMech;
    return null;
}
/**
 * Enumerate every active mechanics contribution for an actor:
 * - slot-activated passives (system.passives.slotN where active=true) with a mechanics block
 * - live ActiveEffects flagged as activeBuff whose source power has a mechanics block
 */
export function collectMechanicsContributions(actor) {
    const out = [];
    const system = actor?.system ?? {};
    const items = actor?.items;
    // 1) Slot-activated passives
    const passives = system.passives ?? {};
    for (const slotKey of Object.keys(passives)) {
        if (!/^slot\d+$/.test(slotKey))
            continue;
        const slot = passives[slotKey];
        if (!slot || slot.active !== true || !slot.passive)
            continue;
        const pid = slot.passive.id;
        if (!pid)
            continue;
        let powerItem = null;
        try {
            powerItem = items?.get?.(pid) ?? null;
            if (!powerItem && Array.isArray(items)) {
                powerItem = items.find((it) => it?.id === pid || it?._id === pid);
            }
        }
        catch {
            // Foundry Collection get may throw on some mocks; ignore.
            powerItem = null;
        }
        const mech = resolvePowerMechanics(powerItem);
        if (!mech)
            continue;
        // Only honor the two passive-like applyWhen values here; defensive against bad data.
        if (mech.applyWhen !== 'passive-slotted-active')
            continue;
        out.push({
            source: `${slot.passive.name ?? 'Passive'} (slotted)`,
            mechanics: mech,
        });
    }
    // 2) Active Buff effects
    const effects = actor?.effects;
    if (effects) {
        const iter = typeof effects[Symbol.iterator] === 'function'
            ? Array.from(effects)
            : Array.isArray(effects) ? effects : [];
        for (const effect of iter) {
            const flags = effect?.flags?.['mastery-system'];
            if (!flags || flags.activeBuff !== true)
                continue;
            // Prefer mechanics stored directly on the effect flag (survives power deletion).
            let mech = null;
            if (flags.mechanics && typeof flags.mechanics === 'object') {
                mech = flags.mechanics;
            }
            else if (flags.powerId) {
                let powerItem = null;
                try {
                    powerItem = items?.get?.(flags.powerId) ?? null;
                    if (!powerItem && Array.isArray(items)) {
                        powerItem = items.find((it) => it?.id === flags.powerId || it?._id === flags.powerId);
                    }
                }
                catch {
                    powerItem = null;
                }
                mech = resolvePowerMechanics(powerItem);
            }
            if (!mech)
                continue;
            if (mech.applyWhen !== 'activeBuff-active')
                continue;
            out.push({
                source: `${flags.powerName ?? effect.name ?? 'Active Buff'} (buff)`,
                mechanics: mech,
            });
        }
    }
    return out;
}
/** Push a numeric contribution into a breakdown array. */
function pushNum(target, source, value) {
    if (typeof value !== 'number' || !isFinite(value) || value === 0)
        return;
    target.push({ source, value });
}
/**
 * Sum all collected mechanics contributions into a full breakdown with
 * precomputed totals. The result is ready to be stored on
 * `actor.system.derived.mechanicsBreakdown`.
 */
export function aggregateMechanics(contributions) {
    const bd = emptyBreakdown();
    for (const { source, mechanics } of contributions) {
        // Conditional blocks never contribute to the unconditional breakdown;
        // they are folded in per-roll by `getRollDiceDelta(actor, kind, target)`
        // and per-damage by `collectConditionalDamageRiders`.
        if (mechanicsConditionGate(mechanics))
            continue;
        pushNum(bd.armor, source, mechanics.armor);
        pushNum(bd.evade, source, mechanics.evade);
        pushNum(bd.initiativeD8, source, mechanics.initiativeD8);
        pushNum(bd.movementBonus, source, mechanics.movementBonus);
        pushNum(bd.regen, source, mechanics.regen);
        if (typeof mechanics.tempHP === 'string' && mechanics.tempHP.length > 0) {
            bd.tempHP.push({ source, value: mechanics.tempHP });
        }
        const healFlat = mechanics.healing?.flat;
        if (typeof healFlat === 'string' && healFlat.trim().length > 0) {
            const h = mechanics.healing;
            const detail = [h.target, h.trigger, h.condition].filter(Boolean).join(' · ');
            bd.healing.push({
                source: detail ? `${source} (${detail})` : source,
                value: healFlat.trim(),
            });
        }
        const modSummary = formatModifySpecialSummary(mechanics.modifySpecial);
        if (modSummary)
            bd.modifySpecialDeclared.push({ source, text: modSummary });
        const gnSummary = formatGrantNextHitSummary(mechanics.grantNextHitEffect);
        if (gnSummary)
            bd.grantNextHitDeclared.push({ source, text: gnSummary });
        const sd = mechanics.saveDice ?? {};
        pushNum(bd.saveDice.body, source, sd.body);
        pushNum(bd.saveDice.mind, source, sd.mind);
        pushNum(bd.saveDice.spirit, source, sd.spirit);
        const rd = mechanics.rollDice ?? {};
        pushNum(bd.rollDice.attack, source, rd.attack);
        pushNum(bd.rollDice.skill, source, rd.skill);
        pushNum(bd.rollDice.damage, source, rd.damage);
    }
    const sum = (arr) => arr.reduce((s, e) => s + (e.value || 0), 0);
    bd.totals.armor = sum(bd.armor);
    bd.totals.evade = sum(bd.evade);
    bd.totals.initiativeD8 = sum(bd.initiativeD8);
    bd.totals.movementBonus = sum(bd.movementBonus);
    bd.totals.regen = sum(bd.regen);
    bd.totals.saveDice.body = sum(bd.saveDice.body);
    bd.totals.saveDice.mind = sum(bd.saveDice.mind);
    bd.totals.saveDice.spirit = sum(bd.saveDice.spirit);
    bd.totals.rollDice.attack = sum(bd.rollDice.attack);
    bd.totals.rollDice.skill = sum(bd.rollDice.skill);
    bd.totals.rollDice.damage = sum(bd.rollDice.damage);
    return bd;
}
/** High-level convenience: contributions + aggregation in one call. */
export function buildActorMechanicsBreakdown(actor) {
    const contributions = collectMechanicsContributions(actor);
    return aggregateMechanics(contributions);
}
/**
 * Roll-dice delta for a given roll kind. Consumed by `roll-handler.ts`
 * right before the numDice pool is committed to `masteryRoll`.
 *
 * When a `target` is provided, passive/buff contributions whose `condition`
 * gate evaluates **against the target** are also folded in (and those
 * contributions are *not* part of the pre-aggregated breakdown totals, which
 * only contain unconditional bonuses).
 */
export function getRollDiceDelta(actor, kind, target) {
    const bd = actor?.system?.derived?.mechanicsBreakdown;
    let base = 0;
    if (bd) {
        switch (kind) {
            case 'attack':
                base = bd.totals.rollDice.attack;
                break;
            case 'skill':
                base = bd.totals.rollDice.skill;
                break;
            case 'damage':
                base = bd.totals.rollDice.damage;
                break;
            case 'saveBody':
                base = bd.totals.saveDice.body;
                break;
            case 'saveMind':
                base = bd.totals.saveDice.mind;
                break;
            case 'saveSpirit':
                base = bd.totals.saveDice.spirit;
                break;
        }
    }
    if (!target)
        return base;
    // Fold in conditional rollDice that are gated by a target-facing condition.
    const contrib = collectMechanicsContributions(actor);
    let extra = 0;
    for (const { mechanics } of contrib) {
        const gate = mechanicsConditionGate(mechanics);
        if (!gate)
            continue;
        if (!evaluateConditionGate(actor, target, gate))
            continue;
        if (kind === 'attack')
            extra += mechanics.rollDice?.attack ?? 0;
        else if (kind === 'skill')
            extra += mechanics.rollDice?.skill ?? 0;
        else if (kind === 'damage')
            extra += mechanics.rollDice?.damage ?? 0;
        else if (kind === 'saveBody')
            extra += mechanics.saveDice?.body ?? 0;
        else if (kind === 'saveMind')
            extra += mechanics.saveDice?.mind ?? 0;
        else if (kind === 'saveSpirit')
            extra += mechanics.saveDice?.spirit ?? 0;
    }
    return base + extra;
}
// ---------------------------------------------------------------------------
// Conditional Engine
// ---------------------------------------------------------------------------
/**
 * Normalize a condition key or name to a canonical lowercase keyword the
 * checker understands (e.g. "Bleeding(3)" -> "bleeding"; "Target Hexed" ->
 * "hexed"; "targetIgnited" -> "ignited").
 */
function canonicalConditionName(raw) {
    return String(raw || '')
        .toLowerCase()
        .replace(/^target[-_\s]*/i, '')
        .replace(/\(.*\)$/, '')
        .replace(/[^a-z]/g, '')
        .trim();
}
/** Known condition synonym -> canonical key. */
const CONDITION_SYNONYMS = {
    marked: 'marked',
    ignited: 'ignited',
    ignite: 'ignited',
    burning: 'ignited',
    onfire: 'ignited',
    shocked: 'shocked',
    shock: 'shocked',
    frozen: 'frozen',
    freeze: 'frozen',
    hexed: 'hexed',
    hex: 'hexed',
    bleeding: 'bleeding',
    bleed: 'bleeding',
    prone: 'prone',
    stunned: 'stunned',
    disoriented: 'disoriented',
};
function toCanonicalCondition(raw) {
    const k = canonicalConditionName(raw);
    return CONDITION_SYNONYMS[k] ?? k;
}
/**
 * Check whether an actor carries a given condition. Checks (in order):
 *   1. actor.statuses (Foundry v13 Set of status ids)
 *   2. actor.effects (ActiveEffect collection) – name/label match
 *   3. actor.flags['mastery-system'].conditions
 *   4. actor.system.conditions
 *   5. actor.system.specials (array of strings like "Bleeding(3)")
 *
 * This is defensive and works whether the GM tags conditions as Foundry
 * status tokens, applies ActiveEffects via our buff system, or stores them
 * as a system flag.
 */
export function hasCondition(actor, condition) {
    if (!actor)
        return false;
    const want = toCanonicalCondition(condition);
    if (!want)
        return false;
    // 1. actor.statuses (Set<string>)
    try {
        const statuses = actor.statuses;
        if (statuses) {
            if (typeof statuses.has === 'function') {
                if (statuses.has(want))
                    return true;
            }
            if (typeof statuses[Symbol.iterator] === 'function') {
                for (const s of statuses) {
                    const key = toCanonicalCondition(typeof s === 'string' ? s : s?.id || s?.name);
                    if (key === want)
                        return true;
                }
            }
        }
    }
    catch { /* ignore */ }
    // 2. Iterate active effects
    try {
        const effects = actor?.effects;
        const iter = effects
            ? (typeof effects[Symbol.iterator] === 'function' ? Array.from(effects) : Array.isArray(effects) ? effects : [])
            : [];
        for (const e of iter) {
            const disabled = e?.disabled ?? e?.isSuppressed;
            if (disabled)
                continue;
            const n = toCanonicalCondition(e?.name || e?.label || '');
            if (n === want)
                return true;
            const sts = e?.statuses;
            if (sts && typeof sts.has === 'function' && sts.has(want))
                return true;
        }
    }
    catch { /* ignore */ }
    // 3. Flags
    const masteryFlags = actor?.flags?.['mastery-system'] || {};
    const fc = masteryFlags.conditions;
    if (fc && typeof fc === 'object' && fc[want] === true)
        return true;
    if (masteryFlags[want] === true)
        return true;
    // 4. system.conditions
    const sys = actor?.system || {};
    if (sys?.conditions && typeof sys.conditions === 'object' && sys.conditions[want] === true)
        return true;
    if (sys?.status && typeof sys.status === 'object' && sys.status[want] === true)
        return true;
    // 5. system.specials array (power-applied specials)
    const specials = Array.isArray(sys?.specials) ? sys.specials : [];
    for (const s of specials) {
        const key = toCanonicalCondition(typeof s === 'string' ? s : s?.name || s?.id);
        if (key === want)
            return true;
    }
    return false;
}
/**
 * Evaluate a PowerMechanics.condition gate. Returns true when the gate is
 * satisfied (or null/absent). Supports both target-facing (`targetHexed`,
 * `targetMarked`, …) and self-facing (`self-hp-below-50`) flavors.
 */
export function evaluateConditionGate(self, target, condition) {
    if (!condition)
        return true;
    const cond = String(condition);
    if (cond.startsWith('target')) {
        return hasCondition(target, cond);
    }
    if (cond === 'self-hp-below-50') {
        const hp = self?.system?.health;
        const currentBar = Number(hp?.currentBar ?? 0);
        const bars = Array.isArray(hp?.bars) ? hp.bars : [];
        if (!bars.length)
            return false;
        // Health bar index is 0=Healthy..4=Incapacitated, so "below 50%" -> currentBar >= bars.length/2.
        return currentBar >= Math.floor(bars.length / 2);
    }
    return hasCondition(self, cond);
}
function normalizeRiderDice(raw) {
    if (!raw)
        return null;
    const trimmed = String(raw).trim().replace(/^\+\s*/, '');
    if (!trimmed)
        return null;
    if (!/^\d*d\d+(\s*[+-]\s*\d+)?$/i.test(trimmed) && !/^\d+$/.test(trimmed))
        return null;
    return trimmed;
}
/**
 * Collect conditional damage riders that apply to a single attack made by
 * `attacker` against `target`. Walks the attacker's slot-activated passives
 * and active buffs (same pool the aggregator uses) plus the currently
 * selected power's own mechanics. A rider fires when the mechanics block's
 * condition / damageRider.vsCondition matches the target.
 */
export function collectConditionalDamageRiders(attacker, target, selectedPower) {
    if (!attacker || !target)
        return [];
    const out = [];
    // 1) All slot-activated passives + live active buffs.
    const contributions = collectMechanicsContributions(attacker);
    for (const { source, mechanics } of contributions) {
        pushRidersFromMechanics(out, source, mechanics, attacker, target);
    }
    // 2) The selected power itself (only if it has its own mechanics block,
    //    and its gate matches). This handles attack-rider powers that declare
    //    vsCondition directly on themselves.
    if (selectedPower) {
        const sys = selectedPower.system ?? selectedPower;
        const rank = Math.max(1, Math.min(4, Number(sys.rank ?? 1)));
        const rankBlock = sys.levels?.[String(rank)] ?? null;
        const mech = rankBlock?.mechanics ?? sys.mechanics;
        if (mech) {
            pushRidersFromMechanics(out, `${selectedPower.name ?? 'Power'} (attack)`, mech, attacker, target);
        }
    }
    return out;
}
function pushRidersFromMechanics(out, source, mechanics, attacker, target) {
    const rider = mechanics.damageRider;
    if (!rider)
        return;
    // Per-target conditional rider: damageRider.vsCondition + vsConditionDamage
    if (rider.vsCondition) {
        const cond = toCanonicalCondition(rider.vsCondition);
        if (hasCondition(target, cond)) {
            const dice = normalizeRiderDice(rider.vsConditionDamage ?? rider.flat);
            if (dice)
                out.push({ source, condition: cond, dice });
        }
        return;
    }
    // Flat rider on a block with a gating condition (e.g. passive "+1d8 vs hexed")
    const gate = mechanicsConditionGate(mechanics);
    if (gate && rider.flat) {
        if (evaluateConditionGate(attacker, target, gate)) {
            const cond = toCanonicalCondition(gate);
            const dice = normalizeRiderDice(rider.flat);
            if (dice)
                out.push({ source, condition: cond, dice });
        }
    }
}
//# sourceMappingURL=power-mechanics.js.map