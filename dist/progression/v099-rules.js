/**
 * Destroyed Faith DF Core. Schema stays v0.9.9.0 so the attribute migration
 * does not replay. The live rules label is DF Core v0.9.9.1.
 * Guaranteed Eight, Target Numbers, Martial Damage, and Stone Ability tier cap.
 *
 * Skill XP costs stay on the existing 1–32 band table. Do not route Skills
 * through `attributeBandCost`.
 */
import { deriveMasteryRankFromStones } from '../utils/mastery-rank-sync.js';
import { standardTnForMasteryRank as standardTnFromConstants } from '../utils/constants.js';
export const V099_SCHEMA_VERSION = '0.9.9.0';
/** Rules text currently implemented. Does not replay the 0.9.9.0 migration. */
export const DF_CORE_RULES_VERSION = '0.9.9.1';
export const ATTRIBUTE_KEYS = [
    'might',
    'agility',
    'vitality',
    'intellect',
    'resolve',
    'influence',
    'wits',
];
export const ATTRIBUTE_ABBREV = {
    might: 'MIG',
    agility: 'AGI',
    vitality: 'VIT',
    intellect: 'INT',
    resolve: 'RES',
    influence: 'INF',
    wits: 'WIT',
};
/** Old free starting package 8/8/6/6/4/4/2, valued on the old 1-XP band. */
export const OLD_STARTING_ATTRIBUTE_XP = 38;
/** New free starting package. */
export const NEW_STARTING_PACKAGE = [4, 4, 3, 3, 2, 2, 2];
export const NEW_STARTING_COUNTS = { 4: 2, 3: 2, 2: 3 };
export const STONE_ABILITY_MAX_TIER = 4;
/** First Lifetime XP line on the sheet and the print. Further XP continues on the next line. */
export const PRINT_LIFETIME_XP_SPAN = 660;
/** Old Attribute step cost to reach `nextValue` (1–80 bands of 8). */
export function oldAttributeStepCost(nextValue) {
    const v = Math.max(1, Math.floor(Number(nextValue) || 1));
    return Math.floor((v - 1) / 8) + 1;
}
/** Cumulative old-table XP to raise one Attribute from 0 to `value`. */
export function cumulativeOldAttributeXp(value) {
    const n = Math.max(0, Math.floor(Number(value) || 0));
    let sum = 0;
    for (let v = 1; v <= n; v += 1)
        sum += oldAttributeStepCost(v);
    return sum;
}
export function readAttributeValues(source) {
    const out = {};
    for (const key of ATTRIBUTE_KEYS) {
        const raw = source?.[key];
        const value = typeof raw === 'number' ? raw : raw?.value;
        out[key] = Math.max(0, Math.floor(Number(value) || 0));
    }
    return out;
}
/**
 * Post-creation Attribute XP on the old cost table.
 * Uses the creation snapshot when it exists (exact purchased increases).
 * Otherwise cumulative current value minus the free 38 XP package.
 */
export function earnedAttributeXpInvestment(current, snapshot) {
    if (snapshot && typeof snapshot === 'object') {
        let sum = 0;
        for (const key of ATTRIBUTE_KEYS) {
            const base = Math.max(0, Math.floor(Number(snapshot[key]) || 0));
            const cur = Math.max(0, Math.floor(Number(current[key]) || 0));
            for (let v = base + 1; v <= cur; v += 1)
                sum += oldAttributeStepCost(v);
        }
        return { xp: sum, source: 'snapshot' };
    }
    let total = 0;
    for (const key of ATTRIBUTE_KEYS)
        total += cumulativeOldAttributeXp(current[key] ?? 0);
    return { xp: Math.max(0, total - OLD_STARTING_ATTRIBUTE_XP), source: 'package' };
}
export function startingPackageIsValid(values) {
    const counts = { 2: 0, 3: 0, 4: 0 };
    for (const key of ATTRIBUTE_KEYS) {
        const v = Math.floor(Number(values[key]) || 0);
        if (!(v in counts))
            return false;
        counts[v] += 1;
    }
    return counts[2] === 3 && counts[3] === 2 && counts[4] === 2;
}
/** New compressed Attribute cost to reach `nextValue` (1–40). */
export function compressedAttributeStepCost(nextValue) {
    const v = Math.max(1, Math.floor(Number(nextValue) || 1));
    if (v > 40)
        return 0;
    return Math.floor((v - 1) / 4) * 2 + 2;
}
/** XP to raise Attributes from `base` to `target` on the compressed table. */
export function compressedAttributeXpBetween(base, target) {
    let sum = 0;
    for (const key of ATTRIBUTE_KEYS) {
        const from = Math.max(0, Math.floor(Number(base[key]) || 0));
        const to = Math.max(0, Math.floor(Number(target[key]) || 0));
        if (to < from)
            return Number.POSITIVE_INFINITY;
        for (let v = from + 1; v <= to; v += 1)
            sum += compressedAttributeStepCost(v);
    }
    return sum;
}
/**
 * Lifetime XP never decreases. Prefer an already stored value, then the
 * system's earned counters, then spent + unspent. Never invent a number.
 */
export function deriveLifetimeXp(system) {
    const stored = system?.progression?.lifetimeXp;
    if (typeof stored === 'number' && Number.isFinite(stored)) {
        return { lifetimeXp: Math.max(0, Math.floor(stored)), source: 'stored' };
    }
    const xp = system?.xp;
    const earnedPresent = xp && (typeof xp.totalEarned === 'number' || typeof xp.freeEarned === 'number');
    if (earnedPresent) {
        const regular = Math.max(0, Math.floor(Number(xp.totalEarned) || 0));
        const free = Math.max(0, Math.floor(Number(xp.freeEarned) || 0));
        return { lifetimeXp: regular + free, source: 'earnedCounters' };
    }
    const spentPresent = xp && (typeof xp.totalSpent === 'number' || typeof xp.freeSpent === 'number');
    const unspentPresent = system?.points && (typeof system.points.xp === 'number' || typeof system.points.xpFree === 'number');
    if (spentPresent || unspentPresent) {
        const spent = Math.max(0, Math.floor(Number(xp?.totalSpent) || 0)) +
            Math.max(0, Math.floor(Number(xp?.freeSpent) || 0));
        const unspent = Math.max(0, Math.floor(Number(system?.points?.xp) || 0)) +
            Math.max(0, Math.floor(Number(system?.points?.xpFree) || 0));
        return { lifetimeXp: spent + unspent, source: 'spentPlusUnspent' };
    }
    return { lifetimeXp: null, source: 'unknown' };
}
export function nextLifetimeXp(system, amount) {
    const current = system?.progression?.lifetimeXp;
    if (typeof current !== 'number' || !Number.isFinite(current))
        return null;
    const add = Math.max(0, Math.floor(Number(amount) || 0));
    return Math.max(0, Math.floor(current) + add);
}
/** Permanent Stones = 2 + floor(Lifetime XP / 20). */
export function permanentStonesFromLifetimeXp(lifetimeXp) {
    const xp = Math.max(0, Math.floor(Number(lifetimeXp) || 0));
    return 2 + Math.floor(xp / 20);
}
/**
 * MR × 2 Stones on one Attribute.
 *
 * Mastery Rank for this limit is the rank earned by Mastery Stone Value
 * (2 + floor(Lifetime XP / 20)). A higher rank stored on the sheet does not
 * raise it: MR2 stays at 4 until the stone total itself reaches the next
 * bracket. `storedRank` remains in the signature for existing callers.
 */
export function stoneConcentrationCap(totalPermanentStones, storedRank = 1) {
    void storedRank;
    return deriveMasteryRankFromStones(totalPermanentStones) * 2;
}
export function emptyAssignments() {
    return {
        might: 0,
        agility: 0,
        vitality: 0,
        intellect: 0,
        resolve: 0,
        influence: 0,
        wits: 0,
    };
}
export function readAssignments(source) {
    const out = emptyAssignments();
    const raw = source?.progression?.stoneAssignments ?? source ?? {};
    for (const key of ATTRIBUTE_KEYS) {
        out[key] = Math.max(0, Math.floor(Number(raw[key]) || 0));
    }
    return out;
}
export function sumAssignments(assignments) {
    return ATTRIBUTE_KEYS.reduce((sum, key) => sum + Math.max(0, Math.floor(Number(assignments[key]) || 0)), 0);
}
/** Permanent Colorless Stones owned by this character (2:1 conversion of unassigned Stones). */
export function permanentColorlessCount(system) {
    return Math.max(0, Math.floor(Number(system?.progression?.permanentColorless) || 0));
}
/** A character may possess at most Mastery Rank Permanent Colorless Stones. */
export function permanentColorlessCap(masteryRank) {
    return Math.max(1, Math.floor(Number(masteryRank) || 1));
}
/**
 * Unassigned permanent progression Stones: earned total minus assigned minus
 * the two consumed by each Permanent Colorless Stone conversion.
 */
export function unassignedPermanentStones(args) {
    const total = Math.max(0, Math.floor(Number(args.totalPermanent) || 0));
    const colorless = Math.max(0, Math.floor(Number(args.permanentColorless) || 0));
    return total - sumAssignments(args.assignments) - 2 * colorless;
}
/**
 * Convert 2 unassigned permanent Stones into 1 Permanent Colorless Stone.
 * The conversion is permanent; the cap is Mastery Rank. For Mastery Rank
 * progression a Permanent Colorless Stone keeps the value of the two Stones
 * it replaced (Mastery Stone Value = 2 + floor(Lifetime XP / 20) throughout).
 */
export function canConvertToPermanentColorless(args) {
    const total = Math.max(0, Math.floor(Number(args.totalPermanent) || 0));
    const masteryRank = Math.max(deriveMasteryRankFromStones(total), Math.max(1, Math.floor(Number(args.storedRank) || 1)));
    const cap = permanentColorlessCap(masteryRank);
    const colorless = Math.max(0, Math.floor(Number(args.permanentColorless) || 0));
    if (colorless >= cap) {
        return { ok: false, masteryRank, cap, reason: `Permanent Colorless Stones are capped at Mastery Rank (${cap}).` };
    }
    const unassigned = unassignedPermanentStones({
        assignments: args.assignments,
        totalPermanent: total,
        permanentColorless: colorless,
    });
    if (unassigned < 2) {
        return { ok: false, masteryRank, cap, reason: 'The conversion needs 2 unassigned permanent Stones.' };
    }
    return { ok: true, masteryRank, cap };
}
export function canPlacePermanentStone(args) {
    const total = Math.max(0, Math.floor(Number(args.totalPermanent) || 0));
    const cap = stoneConcentrationCap(total, args.storedRank ?? 1);
    const masteryRank = cap / 2;
    const unassigned = unassignedPermanentStones({
        assignments: args.assignments,
        totalPermanent: total,
        permanentColorless: args.permanentColorless ?? 0,
    });
    if (unassigned <= 0) {
        return { ok: false, cap, masteryRank, reason: 'No unassigned permanent Stones.' };
    }
    const key = args.attribute;
    if (!ATTRIBUTE_KEYS.includes(key)) {
        return { ok: false, cap, masteryRank, reason: 'Unknown Attribute.' };
    }
    const next = Math.max(0, Math.floor(Number(args.assignments[key]) || 0)) + 1;
    if (next > cap) {
        return {
            ok: false,
            cap,
            masteryRank,
            reason: `${key} is at the Mastery Rank × 2 limit (${cap}).`,
        };
    }
    return { ok: true, cap, masteryRank };
}
export function assignmentsAreLegal(assignments, totalPermanent, storedRank = 1, permanentColorless = 0) {
    const total = Math.max(0, Math.floor(totalPermanent));
    const colorless = Math.max(0, Math.floor(Number(permanentColorless) || 0));
    const assignable = total - 2 * colorless;
    if (assignable < 0) {
        return { ok: false, reason: 'More Permanent Colorless Stones than earned progression allows.' };
    }
    if (sumAssignments(assignments) !== assignable) {
        return { ok: false, reason: `Assign exactly ${assignable} permanent Stones.` };
    }
    const cap = stoneConcentrationCap(total, storedRank);
    for (const key of ATTRIBUTE_KEYS) {
        const n = Math.max(0, Math.floor(Number(assignments[key]) || 0));
        if (n > cap)
            return { ok: false, reason: `${key} exceeds MR × 2 (${cap}).` };
    }
    return { ok: true };
}
/** Stone milestones are every 20 Lifetime XP. The full track still runs to {@link PRINT_LIFETIME_XP_SPAN}. */
export const STONE_MILESTONE_XP = 20;
/**
 * First milestone strictly above `lifetimeXp`.
 * 0 and 1 show 20; 84 shows 100; 100 shows 120.
 */
export function nextProgressionMilestoneXp(lifetimeXp) {
    const xp = Math.max(0, Math.floor(Number(lifetimeXp) || 0));
    return Math.floor(xp / STONE_MILESTONE_XP) * STONE_MILESTONE_XP + STONE_MILESTONE_XP;
}
export function buildStoneProgressionSlots(lifetimeXp, assignments, throughXp = PRINT_LIFETIME_XP_SPAN, permanentColorless = 0, slotOrder, 
/** `visible` draws reached milestones plus the one upcoming breakpoint. `full` keeps the canonical track. */
spanMode = 'full') {
    const xp = Math.max(0, Math.floor(Number(lifetimeXp) || 0));
    const span = spanMode === 'visible'
        ? nextProgressionMilestoneXp(xp)
        : Math.max(PRINT_LIFETIME_XP_SPAN, Math.ceil(xp / STONE_MILESTONE_XP) * STONE_MILESTONE_XP, Math.max(0, Math.floor(throughXp)));
    const unlocked = permanentStonesFromLifetimeXp(xp);
    const useOrder = Array.isArray(slotOrder);
    const queue = [];
    if (!useOrder) {
        for (const key of ATTRIBUTE_KEYS) {
            const n = Math.max(0, Math.floor(Number(assignments[key]) || 0));
            for (let i = 0; i < n; i += 1)
                queue.push(key);
        }
        // Each Permanent Colorless Stone replaced two earned progression Stones.
        const colorless = Math.max(0, Math.floor(Number(permanentColorless) || 0));
        for (let i = 0; i < colorless * 2; i += 1)
            queue.push('colorless');
    }
    const slots = [];
    const count = 2 + span / 20;
    for (let i = 0; i < count; i += 1) {
        const start = i < 2;
        const milestoneXp = start ? null : (i - 1) * 20;
        const raw = useOrder
            ? (i < slotOrder.length ? slotOrder[i] : null)
            : (i < queue.length ? queue[i] : null);
        const attr = raw ? String(raw) : null;
        slots.push({
            index: i,
            kind: start ? 'start' : 'milestone',
            label: start ? 'Start' : String(milestoneXp),
            milestoneXp,
            unlocked: i < unlocked,
            assigned: i < unlocked && !!attr,
            attribute: i < unlocked ? attr : null,
            abbrev: attr === 'colorless'
                ? 'CLS'
                : attr
                    ? ATTRIBUTE_ABBREV[attr] ?? attr.slice(0, 3).toUpperCase()
                    : '',
        });
    }
    return slots;
}
export function chunkSlots(slots, size) {
    const rows = [];
    const step = Math.max(1, Math.floor(size));
    for (let i = 0; i < slots.length; i += step)
        rows.push(slots.slice(i, i + step));
    return rows;
}
/** Boxes on one Lifetime XP line: two Start Stones, then one box every 20 XP through `span`. */
export function lifetimeLineSlotCount(span = PRINT_LIFETIME_XP_SPAN) {
    const xp = Math.max(0, Math.floor(Number(span) || 0));
    return 2 + Math.floor(xp / 20);
}
/**
 * First line runs through 660 Lifetime XP. XP past that adds boxes on the
 * next line; a full line starts another one instead of reshuffling the first.
 */
export function chunkLifetimeSlots(slots, lineSize = lifetimeLineSlotCount()) {
    return chunkSlots(slots, lineSize);
}
/** v0.9.9 characters store assignments. Older actors still derive Stones from Attributes until respec. */
export function usesV099Stones(system) {
    return system?.progression?.v099Stones === true;
}
export function resolvedStonePoolMax(system, attr, attributeValue) {
    if (usesV099Stones(system)) {
        return Math.max(0, Math.floor(Number(system?.progression?.stoneAssignments?.[attr]) || 0));
    }
    return Math.floor(Math.max(0, Number(attributeValue) || 0) / 8);
}
export function resolvedPermanentStoneTotal(system, attributeDerivedTotal) {
    if (!usesV099Stones(system))
        return attributeDerivedTotal;
    return permanentStonesFromLifetimeXp(Number(system?.progression?.lifetimeXp) || 0);
}
/** Standard / Spell Base / Attribute Check / Death / Stress / Ritual base TN. */
export function standardTnForMasteryRank(masteryRank) {
    return standardTnFromConstants(masteryRank);
}
export function maxGuaranteedEights(finalDicePool, masteryRank) {
    const pool = Math.max(0, Math.floor(Number(finalDicePool) || 0));
    const mr = Math.max(1, Math.floor(Number(masteryRank) || 1));
    return Math.max(0, Math.floor((pool - mr) / 8));
}
export function applyGuaranteedEightExchange(finalDicePool, masteryRank, requested) {
    const pool = Math.max(0, Math.floor(Number(finalDicePool) || 0));
    const max = maxGuaranteedEights(pool, masteryRank);
    const n = Math.max(0, Math.floor(Number(requested) || 0));
    if (n > max) {
        return {
            ok: false,
            rolledDice: pool,
            guaranteedEights: 0,
            reason: `At most ${max} Guaranteed Eight${max === 1 ? '' : 's'} for this pool.`,
        };
    }
    return { ok: true, rolledDice: pool - n * 8, guaranteedEights: n };
}
/** A Guaranteed Eight starts at natural 8 and explodes; it is not auto-kept. */
export function rollGuaranteedEightChain(rollD8) {
    const faces = [8];
    while (true) {
        const face = Math.max(1, Math.min(8, Math.floor(Number(rollD8()) || 1)));
        faces.push(face);
        if (face !== 8)
            break;
    }
    return { faces, total: faces.reduce((sum, face) => sum + face, 0) };
}
export function highestKeptIndices(totals, keep) {
    const indexed = totals.map((total, index) => ({ total, index }));
    indexed.sort((a, b) => b.total - a.total || a.index - b.index);
    const n = Math.max(0, Math.min(totals.length, Math.floor(keep)));
    return indexed.slice(0, n).map((row) => row.index);
}
export function martialDamageApplies(opts) {
    if (opts.powerIsSpell || opts.npcIsSpell)
        return false;
    const kind = String(opts.attackKind || '').toLowerCase();
    if (kind === 'spell' || kind === 'spellattack')
        return false;
    return true;
}
/** Total Stones for Rank 4: Normal 1+2+4+8 = 15, Premium 2+4+6+8 = 20. */
export function maxStoneCommitment(premium) {
    return premium ? 20 : 15;
}
/** Passive Skill Value on the compressed scale. */
export function passiveSkillValue(attributeValue) {
    return 2 * Math.max(0, Math.floor(Number(attributeValue) || 0));
}
//# sourceMappingURL=v099-rules.js.map