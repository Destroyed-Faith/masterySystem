/**
 * Power Mechanics Engine — Aggregator
 *
 * Reads structured `mechanics` blocks from owned Passive powers (always-on) and
 * active-buff effects, sums them into per-actor totals, and builds a
 * breakdown list ("Armor +1 from Dragon Scales") that the
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
import { ALL_POWER_TEMPLATES } from './powers/index.js';
import { targetPerceivedByNonSightSense, targetUnseenByObserver, } from '../combat/perception-gate.js';
import { countAdjacentHostileTokenCount, countAdjacentAllyTokenCount, getPrimaryTokenForActor, } from './mechanics-adjacency.js';
/** Empty breakdown skeleton (all arrays/objects present, all totals zero). */
export function emptyBreakdown() {
    return {
        armor: [],
        evade: [],
        initiative: [],
        initiativeD8: [],
        movementBonus: [],
        regen: [],
        spellResistance: [],
        cleanseMaintenance: [],
        wardIncoming: [],
        tempHP: [],
        healing: [],
        modifySpecialDeclared: [],
        grantNextHitDeclared: [],
        rollDice: { attack: [], skill: [], damage: [] },
        damageReductionPct: { passive: [], buff: [], reaction: [] },
        totals: {
            armor: 0,
            evade: 0,
            initiative: 0,
            initiativeD8: 0,
            movementBonus: 0,
            regen: 0,
            spellResistance: 0,
            cleanseMaintenance: 0,
            wardIncoming: 0,
            damageReductionPct: 0,
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
 *
 * Backwards-compatibility: power items created before the `mechanics` blocks
 * were added to the canonical tree/school definitions stored a snapshot of
 * `levels` that lacks those blocks. For those legacy items we look the
 * definition up again in the live catalog by `name` (+ `tree` / `isMagicPower`
 * hints) and pull the mechanics from there. Re-adding the power is no longer
 * required for passives/buffs to apply.
 */
/**
 * Resolve a slotted passive / buff source item id on an actor. Foundry's
 * `actor.items` is a Collection (not an Array) — `Array.isArray(items)` is
 * false, so a bare `items.get` miss used to drop all passive mechanics.
 */
export function findPowerItemOnActor(actor, pid) {
    if (!pid || !actor?.items)
        return null;
    const idStr = String(pid).trim();
    if (!idStr)
        return null;
    const items = actor.items;
    try {
        const direct = items.get?.(idStr);
        if (direct)
            return direct;
    }
    catch {
        /* Collection.get may throw on bad ids in some environments */
    }
    try {
        for (const it of items) {
            if (!it)
                continue;
            if (it.id === idStr || it._id === idStr)
                return it;
        }
    }
    catch {
        /* ignore */
    }
    if (Array.isArray(items)) {
        return items.find((it) => it?.id === idStr || it?._id === idStr) ?? null;
    }
    const contents = items.contents;
    if (Array.isArray(contents)) {
        return contents.find((it) => it?.id === idStr || it?._id === idStr) ?? null;
    }
    return null;
}
export function resolvePowerMechanics(powerItem) {
    if (!powerItem)
        return null;
    const sys = powerItem.system ?? {};
    const raw = Number(sys.rank ?? sys.level ?? 1);
    const rank = Math.max(1, Math.min(16, Number.isFinite(raw) ? Math.floor(raw) : 1));
    // Prefer live catalog when templateId matches so template reprices (e.g. Evade)
    // apply immediately without waiting for a baked-levels resync.
    const templateId = sys.templateId ? String(sys.templateId).trim() : '';
    if (templateId) {
        const fromCatalog = resolveMechanicsFromCatalog(powerItem, rank);
        if (fromCatalog)
            return fromCatalog;
    }
    const levels = sys.levels ?? {};
    const rankBlock = levels[String(rank)] ?? null;
    const rankMech = rankBlock?.mechanics;
    if (rankMech && typeof rankMech === 'object')
        return rankMech;
    const topMech = sys.mechanics;
    if (topMech && typeof topMech === 'object')
        return topMech;
    const fromCatalog = resolveMechanicsFromCatalog(powerItem, rank);
    if (fromCatalog)
        return fromCatalog;
    return null;
}
/**
 * How many d8 the power adds as **splash** for melee weapon AoE secondaries,
 * from unconditional `damageRider.flat` (e.g. "+2d8" → 2). Conditional-only
 * riders (`vsCondition`) are ignored for this automatic splash pool.
 */
export function extractMeleeAoePowerBonusD8(powerItem) {
    const mech = resolvePowerMechanics(powerItem);
    const rider = mech?.damageRider;
    if (!rider?.flat || rider.vsCondition)
        return 0;
    const norm = String(rider.flat).trim().replace(/^\+\s*/, '');
    if (!norm)
        return 0;
    const m = /^(\d+)\s*d8\b/i.exec(norm);
    if (m)
        return Math.max(0, parseInt(m[1], 10));
    if (/^d8$/i.test(norm))
        return 1;
    return 0;
}
/**
 * Look the canonical mechanics up in the live template registry. Prefers a
 * `templateId` match (set on new item documents) and falls back to matching
 * the power name for legacy items still living through the transition.
 */
function resolveMechanicsFromCatalog(powerItem, rank) {
    const sys = powerItem.system ?? {};
    const name = powerItem.name ?? sys.name;
    const templateId = sys.templateId ? String(sys.templateId) : undefined;
    if (!name && !templateId)
        return null;
    const stripPowerPrefixes = (raw) => String(raw || '')
        .replace(/^active buff:\s*/i, '')
        .replace(/^passive:\s*/i, '')
        .replace(/^active:\s*/i, '')
        .trim();
    let def = undefined;
    if (templateId) {
        def = ALL_POWER_TEMPLATES.find((t) => t?.templateId === templateId);
    }
    if (!def && name) {
        const stripped = stripPowerPrefixes(name);
        const lower = stripped.toLowerCase();
        def = ALL_POWER_TEMPLATES.find((t) => t?.templateName === name ||
            t?.name === name ||
            t?.templateName === stripped ||
            t?.name === stripped ||
            String(t?.templateName || '')
                .toLowerCase()
                .replace(/^active buff:\s*/i, '')
                .replace(/^passive:\s*/i, '')
                .replace(/^active:\s*/i, '')
                .trim() === lower ||
            String(t?.name || '')
                .toLowerCase()
                .replace(/^active buff:\s*/i, '')
                .replace(/^passive:\s*/i, '')
                .replace(/^active:\s*/i, '')
                .trim() === lower);
    }
    if (!def)
        return null;
    const defLevels = def.levels;
    if (defLevels && typeof defLevels === 'object' && !Array.isArray(defLevels)) {
        const lvl = defLevels[String(rank)] ?? defLevels['1'];
        const m = lvl?.mechanics;
        if (m && typeof m === 'object')
            return m;
    }
    const topM = def.mechanics;
    if (topM && typeof topM === 'object')
        return topM;
    return null;
}
/**
 * Closed-subsystem whitelist for Damage Reduction. Only these three power
 * names (case-insensitive, trimmed) may contribute `damageReductionPct`
 * anywhere in the system. Anything else is dropped by the aggregator with
 * a console warning so rules-violating homebrew cannot leak DR into the
 * game.
 */
const DR_SANCTIONED_POWER_NAMES = {
    passive: 'damage reduction',
    /** Catalog still uses this display name; buff rows match via templateId / substring rules. */
    buff: 'unyielding shell',
    /** Legacy name; catalog reaction is `reaction-damage-reduction` / "Reaction: Damage Reduction". */
    reaction: 'unyielding intercept',
};
/**
 * Closed-subsystem whitelist for Phasing. Same semantics as DR: only these
 * three names may declare `phasing` / `triggers.combatStart.phasingCharges`.
 */
const PHASING_SANCTIONED_POWER_NAMES = {
    passive: 'phasing',
    buff: 'ghost mantle',
    reaction: 'ghost slip',
};
const PHASING_PASSIVE_ALIASES = new Set(['phasing', 'ghostform']);
function normalizePowerName(name) {
    return String(name || '').trim().toLowerCase();
}
/**
 * Verify the contribution is allowed to grant Damage Reduction. Emits a
 * one-shot warning for rule violations so GMs notice misconfigured powers.
 */
function stripBuffPrefixForDrName(name) {
    let s = normalizePowerName(name);
    s = s
        .replace(/^active\s*buff:\s*/i, '')
        .replace(/^active:\s*/i, '')
        .replace(/^passive:\s*/i, '')
        .replace(/^reaction:\s*/i, '')
        .trim();
    return s;
}
function isSanctionedDR(contribution) {
    const expected = DR_SANCTIONED_POWER_NAMES[contribution.sourceKind];
    const actual = normalizePowerName(contribution.powerName);
    const stripped = stripBuffPrefixForDrName(contribution.powerName);
    const buffTid = String(contribution.buffTemplateId || '').trim();
    const powerTid = String(contribution.powerTemplateId || '').trim();
    if (actual === expected || stripped === expected)
        return true;
    if (contribution.sourceKind === 'passive') {
        if (powerTid === 'passive-damage-reduction')
            return true;
        if (stripped === 'damage reduction' || stripped.endsWith('damage reduction'))
            return true;
        if (/\bdamage\s+reduction\b/i.test(stripped))
            return true;
        if (/\b(schadens\s*reduktion|schadensreduktion)\b/i.test(stripped.replace(/\s+/g, ' ')))
            return true;
    }
    // Canonical catalog buff is "Active Buff: Damage Reduction" — match template name.
    if (contribution.sourceKind === 'buff') {
        if (buffTid === 'ab-damage-reduction')
            return true;
        if (stripped === 'damage reduction' || stripped.endsWith('damage reduction'))
            return true;
        // Localized / renamed copies of the catalog buff (parentheticals, em dash, etc.)
        if (/\bdamage\s+reduction\b/i.test(stripped))
            return true;
        // German catalog / sheet naming
        if (/\b(schadens\s*reduktion|schadensreduktion)\b/i.test(stripped.replace(/\s+/g, ' ')))
            return true;
    }
    if (contribution.sourceKind === 'reaction') {
        if (powerTid === 'reaction-damage-reduction')
            return true;
        if (/\bdamage\s+reduction\b/i.test(stripped))
            return true;
        if (/\b(schadens\s*reduktion|schadensreduktion)\b/i.test(stripped.replace(/\s+/g, ' ')))
            return true;
    }
    console.warn(`Mastery System | DR rule violation: power "${contribution.powerName}" ` +
        `(${contribution.sourceKind}) declares damageReductionPct but only ` +
        `"${expected}" may grant DR at this layer. Contribution dropped.`);
    return false;
}
/** Same check for Phasing declarations. Exported so the runtime can reuse. */
export function isSanctionedPhasingName(powerName, sourceKind) {
    const expected = PHASING_SANCTIONED_POWER_NAMES[sourceKind];
    const raw = normalizePowerName(powerName);
    const stripped = stripBuffPrefixForDrName(powerName);
    if (sourceKind === 'passive') {
        return PHASING_PASSIVE_ALIASES.has(raw) || PHASING_PASSIVE_ALIASES.has(stripped);
    }
    return raw === expected || stripped === expected;
}
/**
 * Enumerate every active mechanics contribution for an actor:
 * - owned Passive powers (always-on; Passive Slot Manager removed)
 * - live ActiveEffects flagged as activeBuff whose source power has a mechanics block
 *
 * Conditional passives still flow through; `aggregateMechanics` gates them via
 * `condition` / `conditionExpr`. Active Buffs stay combat-time only.
 */
export function collectMechanicsContributions(actor) {
    const out = [];
    const system = actor?.system ?? {};
    const items = actor?.items;
    const seenPassiveIds = new Set();
    const pushOwnedPassive = (powerItem, displayName) => {
        if (!powerItem || powerItem.type !== 'power')
            return;
        const pid = String(powerItem.id || powerItem._id || '').trim();
        if (pid) {
            if (seenPassiveIds.has(pid))
                return;
            seenPassiveIds.add(pid);
        }
        const mech = resolvePowerMechanics(powerItem);
        if (!mech)
            return;
        const aw = mech.applyWhen;
        const passiveCat = String(powerItem?.system?.category ?? powerItem?.system?.powerType ?? '').toLowerCase();
        const passiveSheetStats = typeof mech.armor === 'number' ||
            typeof mech.evade === 'number' ||
            typeof mech.damageReductionPct === 'number' ||
            typeof mech.regen === 'number' ||
            typeof mech.spellResistance === 'number' ||
            typeof mech.cleanseMaintenance === 'number' ||
            typeof mech.wardIncoming === 'number' ||
            typeof mech.initiative === 'number' ||
            typeof mech.initiativeD8 === 'number' ||
            typeof mech.rollDice?.attack === 'number' ||
            typeof mech.rollDice?.skill === 'number' ||
            typeof mech.rollDice?.damage === 'number' ||
            !!mech.damageRider ||
            !!mech.phasing?.combatStart;
        const looksPassive = passiveCat === 'passive' ||
            aw === 'passive-slotted-active' ||
            (!aw && passiveSheetStats && passiveCat !== 'activebuff' && passiveCat !== 'buff');
        if (!looksPassive)
            return;
        // Explicit non-passive applyWhen (e.g. activeBuff-active) must not leak in.
        if (aw && aw !== 'passive-slotted-active')
            return;
        const pname = String(displayName || powerItem.name || 'Passive')
            .replace(/^passive:\s*/i, '')
            .trim() || 'Passive';
        out.push({
            source: pname,
            powerName: pname,
            sourceKind: 'passive',
            mechanics: mech,
            powerTemplateId: powerItem?.system?.templateId ? String(powerItem.system.templateId) : null,
        });
    };
    // 1) Owned Passive powers (always on) — Foundry Collections are iterable.
    const itemList = (() => {
        if (!items)
            return [];
        if (Array.isArray(items))
            return items;
        if (typeof items[Symbol.iterator] === 'function') {
            try {
                return Array.from(items);
            }
            catch {
                return [];
            }
        }
        if (typeof items.values === 'function') {
            try {
                return Array.from(items.values());
            }
            catch {
                return [];
            }
        }
        return [];
    })();
    for (const powerItem of itemList) {
        pushOwnedPassive(powerItem);
    }
    // 2) Legacy Passive slots — still honor references when items aren't iterable
    //    (unit fixtures) or a slot points at an owned power we haven't seen.
    const passives = system.passives ?? {};
    for (const slotKey of Object.keys(passives)) {
        if (!/^slot\d+$/.test(slotKey))
            continue;
        const slot = passives[slotKey];
        if (!slot || !slot.passive)
            continue;
        const pid = slot.passive.id;
        if (!pid)
            continue;
        if (seenPassiveIds.has(String(pid)))
            continue;
        let powerItem = findPowerItemOnActor(actor, pid);
        if (!powerItem && slot.passive?.name) {
            const nm = String(slot.passive.name).trim();
            for (const it of itemList) {
                if (it?.type === 'power' && String(it.name ?? '').trim() === nm) {
                    powerItem = it;
                    break;
                }
            }
        }
        pushOwnedPassive(powerItem, slot.passive.name);
    }
    // 3) Active Buff effects
    const effects = actor?.effects;
    if (effects) {
        const iter = typeof effects[Symbol.iterator] === 'function'
            ? Array.from(effects)
            : Array.isArray(effects) ? effects : [];
        for (const effect of iter) {
            const flags = readMasterySystemActiveEffectFlags(effect);
            if (!flags || flags.activeBuff !== true)
                continue;
            // Prefer mechanics stored directly on the effect flag (survives power deletion).
            let mech = null;
            if (flags.mechanics && typeof flags.mechanics === 'object') {
                mech = flags.mechanics;
            }
            else if (flags.powerId) {
                const powerItem = findPowerItemOnActor(actor, flags.powerId);
                mech = resolvePowerMechanics(powerItem);
            }
            if (!mech) {
                continue;
            }
            const aw = mech.applyWhen;
            if (aw && String(aw) !== 'activeBuff-active') {
                continue;
            }
            const pname = flags.powerName ?? effect.name ?? 'Active Buff';
            const buffTemplateId = flags.powerTemplateId ||
                (() => {
                    const bpid = flags.powerId;
                    if (!bpid || !actor?.items?.get)
                        return null;
                    try {
                        const it = actor.items.get(bpid) ?? null;
                        const tid = it?.system?.templateId;
                        return tid ? String(tid) : null;
                    }
                    catch {
                        return null;
                    }
                })();
            out.push({
                source: `${pname} (buff)`,
                powerName: pname,
                sourceKind: 'buff',
                mechanics: mech,
                buffTemplateId,
            });
        }
    }
    return out;
}
/**
 * Read `flags.mastery-system` from an ActiveEffect — prefers per-key `getFlag`
 * (Foundry v13) so nested buff payloads stay visible after persistence.
 */
function readMasterySystemActiveEffectFlags(effect) {
    if (!effect)
        return null;
    const nestedRaw = effect?.flags?.['mastery-system'];
    const nestedObj = nestedRaw && typeof nestedRaw === 'object' ? { ...nestedRaw } : {};
    const pick = (key) => {
        try {
            if (typeof effect.getFlag === 'function') {
                const v = effect.getFlag('mastery-system', key);
                if (v !== undefined)
                    return v;
            }
        }
        catch {
            /* use nested */
        }
        return nestedObj[key];
    };
    try {
        if (typeof effect.getFlag === 'function') {
            const activeBuff = effect.getFlag('mastery-system', 'activeBuff');
            if (activeBuff === true) {
                const merged = {
                    ...nestedObj,
                    activeBuff: true,
                    powerId: pick('powerId'),
                    powerName: pick('powerName'),
                    powerTemplateId: pick('powerTemplateId'),
                    mechanics: pick('mechanics'),
                    masteryRank: pick('masteryRank'),
                    activatedRound: pick('activatedRound'),
                    isUtility: pick('isUtility'),
                };
                return merged;
            }
        }
    }
    catch {
        /* fall through */
    }
    return Object.keys(nestedObj).length ? nestedObj : null;
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
 *
 * Pass `actor` so self-facing `conditionExpr` gates (e.g. adjacent enemies)
 * can fold into `totals`; omit it only for pure unit tests of unconditional rows.
 */
export function aggregateMechanics(contributions, actor) {
    const bd = emptyBreakdown();
    for (const contribution of contributions) {
        const { source, mechanics, sourceKind } = contribution;
        const gate = mechanicsConditionGate(mechanics);
        // Target-only gates stay out of sheet totals; self-facing `conditionExpr`
        // (e.g. adjacent enemies) folds in when satisfied.
        if (gate && !evaluateMechanicsGateForActorTotals(actor, gate))
            continue;
        pushNum(bd.armor, source, mechanics.armor);
        pushNum(bd.evade, source, mechanics.evade);
        pushNum(bd.initiative, source, mechanics.initiative);
        pushNum(bd.initiativeD8, source, mechanics.initiativeD8);
        pushNum(bd.movementBonus, source, mechanics.movementBonus);
        pushNum(bd.regen, source, mechanics.regen);
        pushNum(bd.spellResistance, source, mechanics.spellResistance);
        pushNum(bd.cleanseMaintenance, source, mechanics.cleanseMaintenance);
        pushNum(bd.wardIncoming, source, mechanics.wardIncoming);
        // Damage Reduction — closed subsystem, whitelisted by power name.
        const drPctRaw = mechanics.damageReductionPct;
        const drPctNum = typeof drPctRaw === 'number' && Number.isFinite(drPctRaw)
            ? drPctRaw
            : Number(drPctRaw);
        if (Number.isFinite(drPctNum) && drPctNum > 0) {
            const sanctioned = isSanctionedDR(contribution);
            if (sanctioned) {
                const row = { source, value: Math.floor(drPctNum) };
                if (sourceKind === 'passive')
                    bd.damageReductionPct.passive.push(row);
                else if (sourceKind === 'buff')
                    bd.damageReductionPct.buff.push(row);
                else if (sourceKind === 'reaction')
                    bd.damageReductionPct.reaction.push(row);
            }
        }
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
        const rd = mechanics.rollDice ?? {};
        pushNum(bd.rollDice.attack, source, rd.attack);
        pushNum(bd.rollDice.skill, source, rd.skill);
        pushNum(bd.rollDice.damage, source, rd.damage);
    }
    const sum = (arr) => arr.reduce((s, e) => s + (e.value || 0), 0);
    bd.totals.armor = sum(bd.armor);
    bd.totals.evade = sum(bd.evade);
    bd.totals.initiative = sum(bd.initiative);
    bd.totals.initiativeD8 = sum(bd.initiativeD8);
    bd.totals.movementBonus = sum(bd.movementBonus);
    bd.totals.regen = sum(bd.regen);
    bd.totals.spellResistance = sum(bd.spellResistance);
    bd.totals.cleanseMaintenance = sum(bd.cleanseMaintenance);
    bd.totals.wardIncoming = sum(bd.wardIncoming);
    bd.totals.rollDice.attack = sum(bd.rollDice.attack);
    bd.totals.rollDice.skill = sum(bd.rollDice.skill);
    bd.totals.rollDice.damage = sum(bd.rollDice.damage);
    // Damage-Reduction: continuous total is passive DR + buff DR **only** when at
    // least one sanctioned slotted passive contributes DR% (play rule: buffs
    // and other layers build on that base). Reaction DR% stays out of this
    // total (per-hit via defender-reactions + damage dialog).
    const passiveDR = sum(bd.damageReductionPct.passive);
    const buffDR = sum(bd.damageReductionPct.buff);
    const raw = passiveDR > 0 ? passiveDR + buffDR : 0;
    bd.totals.damageReductionPct = Math.max(0, Math.min(100, raw));
    if (passiveDR <= 0) {
        bd.damageReductionPct.buff = [];
        bd.damageReductionPct.reaction = [];
    }
    return bd;
}
/** High-level convenience: contributions + aggregation in one call. */
export function buildActorMechanicsBreakdown(actor) {
    const contributions = collectMechanicsContributions(actor);
    return aggregateMechanics(contributions, actor);
}
/** Owned Passive powers only (excludes active-buff ActiveEffects). */
export function buildPassiveMechanicsBreakdown(actor) {
    const contributions = collectMechanicsContributions(actor).filter((c) => c.sourceKind === 'passive');
    return aggregateMechanics(contributions, actor);
}
/** Active buff ActiveEffects only (combat-time bonuses, not sheet base totals). */
export function buildBuffMechanicsBreakdown(actor) {
    const contributions = collectMechanicsContributions(actor).filter((c) => c.sourceKind === 'buff');
    return aggregateMechanics(contributions, actor);
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
        if (!evaluateMechanicsConditionExpr(actor, target, gate))
            continue;
        if (kind === 'attack')
            extra += mechanics.rollDice?.attack ?? 0;
        else if (kind === 'skill')
            extra += mechanics.rollDice?.skill ?? 0;
        else if (kind === 'damage')
            extra += mechanics.rollDice?.damage ?? 0;
    }
    return base + extra;
}
// ---------------------------------------------------------------------------
// Conditional Engine
// ---------------------------------------------------------------------------
/**
 * Normalize a condition key or name to a canonical lowercase keyword the
 * checker understands (e.g. "Lacerate(3)" -> "lacerate"; "Target Hexed" ->
 * "hex"; "targetRuin" -> "ruin").
 */
function canonicalConditionName(raw) {
    return String(raw || '')
        .toLowerCase()
        .replace(/^target[-_\s]*/i, '')
        .replace(/\(.*\)$/, '')
        .replace(/[^a-z]/g, '')
        .trim();
}
/** Known condition synonym -> canonical key (post-reconciliation ids). */
const CONDITION_SYNONYMS = {
    mark: 'mark',
    marked: 'mark',
    ruin: 'ruin',
    ignited: 'ruin',
    ignite: 'ruin',
    burning: 'ruin',
    onfire: 'ruin',
    challenge: 'challenge',
    challenged: 'challenge',
    slow: 'slow',
    slowed: 'slow',
    frozen: 'slow',
    freeze: 'slow',
    hexed: 'hex',
    hex: 'hex',
    lacerate: 'lacerate',
    lacerated: 'lacerate',
    bleeding: 'lacerate',
    bleed: 'lacerate',
    blight: 'blight',
    blighted: 'blight',
    poisoned: 'blight',
    poison: 'blight',
    sundered: 'sundered',
    prone: 'prone',
    stunned: 'stunned',
    disoriented: 'disoriented',
    blinded: 'disoriented',
    // Removed Specials — map legacy tokens to the closest live Special where
    // condition checks still need a resolvable id (shock/disrupt → disoriented).
    disrupt: 'disoriented',
    disrupted: 'disoriented',
    shocked: 'disoriented',
    shock: 'disoriented',
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
 *   5. actor.system.specials (array of strings like "Lacerate(3)")
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
    // 3. Flags (canonicalize each stored key so legacy names like "hexed" resolve)
    const masteryFlags = actor?.flags?.['mastery-system'] || {};
    const fc = masteryFlags.conditions;
    if (fc && typeof fc === 'object') {
        for (const [key, val] of Object.entries(fc)) {
            if (val && toCanonicalCondition(key) === want)
                return true;
        }
    }
    if (masteryFlags[want] === true)
        return true;
    // 4. system.conditions
    const sys = actor?.system || {};
    const sysCond = sys?.conditions;
    if (sysCond && typeof sysCond === 'object') {
        for (const [key, val] of Object.entries(sysCond)) {
            if (val === true && toCanonicalCondition(key) === want)
                return true;
        }
    }
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
function cmpNum(lhs, op, rhs) {
    switch (op) {
        case '>=':
            return lhs >= rhs;
        case '<=':
            return lhs <= rhs;
        case '>':
            return lhs > rhs;
        case '<':
            return lhs < rhs;
        case '==':
        case '===':
            return lhs === rhs;
        default:
            return false;
    }
}
function readTurnMovedMeters(actor) {
    const f = actor?.flags?.['mastery-system'];
    const n = Number(f?.turnMovedMetersThisRound ??
        f?.mechanicsRuntime?.turnMovedMeters ??
        actor?.system?.combat?.turnMovedMetersThisRound);
    return Number.isFinite(n) ? n : 0;
}
function readLastTurnMovedMeters(actor) {
    const f = actor?.flags?.['mastery-system'];
    const n = Number(f?.lastTurnMovedMeters ??
        f?.mechanicsRuntime?.lastTurnMovedMeters ??
        actor?.system?.combat?.lastTurnMovedMeters);
    return Number.isFinite(n) ? n : 0;
}
function healthStateRankFromActor(actor) {
    const bars = actor?.system?.health?.bars;
    const idx = Math.max(0, Math.floor(Number(actor?.system?.health?.currentBar ?? 0)));
    const name = String(bars?.[idx]?.name ?? `bar${idx}`);
    if (/\b(healthy|unharmed|hale|fine)\b/i.test(name))
        return 0;
    if (/\b(injured|hurt)\b/i.test(name))
        return 1;
    if (/\b(wounded)\b/i.test(name))
        return 2;
    if (/\b(critical|maimed)\b/i.test(name))
        return 3;
    if (/\b(incapacitated|unconscious|dead|dying)\b/i.test(name))
        return 4;
    return idx;
}
function healthKeywordToRank(keyword) {
    const k = keyword.trim().toLowerCase();
    if (/\b(healthy|unharmed|hale)\b/.test(k))
        return 0;
    if (/\b(injured|hurt)\b/.test(k))
        return 1;
    if (/\b(wounded)\b/.test(k))
        return 2;
    if (/\b(critical|maimed)\b/.test(k))
        return 3;
    if (/\b(incap|dead|dying)\b/.test(k))
        return 4;
    return 99;
}
/**
 * Evaluate mechanics `condition` / `conditionExpr` including `self.adjacentEnemies`,
 * movement meters, health state, and `self.hasSpecial.*`. Dot-prefixed `target.*`
 * is reserved for future runtime (returns false). Legacy gates defer to
 * `evaluateConditionGate`.
 */
export function evaluateMechanicsConditionExpr(self, target, expr) {
    const raw = String(expr ?? '').trim();
    if (!raw)
        return true;
    const mEn = raw.match(/self\.adjacentEnemies\s*(>=|<=|==|>|<)\s*(\d+)/i);
    if (mEn) {
        const tok = getPrimaryTokenForActor(self);
        const lhs = countAdjacentHostileTokenCount(tok);
        return cmpNum(lhs, mEn[1], Number(mEn[2]));
    }
    const mAl = raw.match(/self\.adjacentAllies\s*(>=|<=|==|>|<)\s*(\d+)/i);
    if (mAl) {
        const tok = getPrimaryTokenForActor(self);
        const lhs = countAdjacentAllyTokenCount(tok);
        return cmpNum(lhs, mAl[1], Number(mAl[2]));
    }
    const moved = raw.match(/self\.turnMoved\s*(>=|<=|==|>|<)\s*(\d+)/i);
    if (moved)
        return cmpNum(readTurnMovedMeters(self), moved[1], Number(moved[2]));
    const last = raw.match(/self\.lastTurnMoved\s*(>=|<=|==|>|<)\s*(\d+)/i);
    if (last)
        return cmpNum(readLastTurnMovedMeters(self), last[1], Number(last[2]));
    const hs = raw.match(/self\.healthState\s*(<=|>=|<|>|==)\s*([\w-]+)/i);
    if (hs) {
        const cur = healthStateRankFromActor(self);
        const bound = healthKeywordToRank(hs[2]);
        const op = hs[1];
        if (op === '<=')
            return cur <= bound;
        if (op === '>=')
            return cur >= bound;
        if (op === '<')
            return cur < bound;
        if (op === '>')
            return cur > bound;
        return cur === bound;
    }
    const sp = raw.match(/self\.hasSpecial\.(\w+)/i);
    if (sp)
        return hasCondition(self, sp[1]);
    if (/^target\./i.test(raw)) {
        if (!target)
            return false;
        const expr = raw.trim();
        if (/^target\.perceivedByNonSightSense$/i.test(expr)) {
            return targetPerceivedByNonSightSense(self, target);
        }
        if (/^target\.unseenBySelf$/i.test(expr)) {
            return targetUnseenByObserver(self, target);
        }
        return false;
    }
    return evaluateConditionGate(self, target, raw);
}
function evaluateMechanicsGateForActorTotals(actor, gate) {
    if (!actor)
        return false;
    return evaluateMechanicsConditionExpr(actor, null, gate);
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
        if (evaluateMechanicsConditionExpr(attacker, target, gate)) {
            const cond = toCanonicalCondition(gate);
            const dice = normalizeRiderDice(rider.flat);
            if (dice)
                out.push({ source, condition: cond, dice });
        }
    }
}
//# sourceMappingURL=power-mechanics.js.map