/**
 * Active Power Templates (~46)
 *
 * Source: d:\DestroyedFaith\Powers\Actives.md — Levels 1..16.
 *
 * Categories encoded via subfamily:
 *   damage-single, damage-aoe, persistent-zone, control, support-heal,
 *   support-cleanse, support-dispel, mixed, barrier, hard-control
 *
 * Damage templates (singleg-target + aoe, per tier T3/T4/T5/T6 in melee &
 * ranged flavours) carry a `specialSlot`. The catalog expands each such
 * template into one entry per eligible Special (see _specials.ts and
 * power-catalog.ts buildEntries()).
 *
 * `spellHints` pre-fills Active-as-Spell resolution defaults. Saving throws
 * were removed from the rules — every spell resolves as `spellAttack`
 * (caster roll vs Casting TN / Evade); a successful cast resolves its full
 * listed payload.
 */

import type { PowerTemplate } from './_shared.js';
import { buildLevels, activeRow } from './_shared.js';
import type { ActiveSpecialSlot, ActiveSpecialTier, AoeSpec, RangeSpec, SpellHints } from '../../../types/item.js';
import { getEligibleSpecialsForTier } from './_specials.js';
import { solveDamageRow } from '../pp-budget.js';

const MELEE_RANGE: RangeSpec = { kind: 'melee', note: 'Melee Reach' };
const R_NONE: AoeSpec = { shape: 'none' };

function rangedRange(lvl: number, base = 8): RangeSpec {
    return { kind: 'distance', m: base + (lvl - 1) * 4 };
}

/**
 * Solve damage rider + special rank for one row using the canonical
 * 30 PP / level budget (see `pp-budget.ts`). The helper applies the
 * Damage Anchor at level 4 by default (Actives.md ~79–90 / 600+).
 */
function rowFromBudget(opts: {
    tier: ActiveSpecialTier;
    lvl: number;
    isRanged: boolean;
    aoe?: boolean;
}): { dice: string; rank: number; rangeM: number } {
    const r = solveDamageRow(opts.tier as 3 | 4 | 5 | 6, opts.lvl, {
        isRanged: opts.isRanged,
        aoe: !!opts.aoe,
        anchorLvl: 4,
    });
    return {
        dice: `${Math.max(0, r.damageDice)}d8`,
        rank: r.specialRank,
        rangeM: r.rangeM,
    };
}

// ─── Explicit md progression tables ──────────────────────────────────────
// The PP-budget solver maxes the Special and leaves damage as the remainder,
// which does NOT match Actives.md (damage is a small early-frozen anchor and
// the Special scales with the rest). These tables encode the md spec directly
// for the player-visible damage / radius / range columns. The Special *rank*
// is still derived from the budget solver (it is not shown in the md tables).

/** Single-target damage anchor per tier (dice = min(level, anchor)). */
const SINGLE_DAMAGE_ANCHOR: Record<ActiveSpecialTier, number> = { 3: 1, 4: 1, 5: 3, 6: 2 };

/** Instant Attack Martial Special AoE — printed PL tables (docs/Rules/actives.md). */
const MELEE_AOE_DMG_DICE: Record<ActiveSpecialTier, readonly number[]> = {
    3: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    4: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    5: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    6: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};
const RANGED_AOE_DMG_DICE: Record<ActiveSpecialTier, readonly number[]> = {
    3: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    4: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    5: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    6: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};
const MELEE_AOE_DMG_RADIUS: Record<ActiveSpecialTier, readonly number[]> = {
    3: [2, 2, 3, 3, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 7],
    4: [2, 2, 3, 3, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 7],
    5: [2, 2, 3, 3, 4, 4, 5, 5, 5, 6, 6, 6, 6, 7, 7, 7],
    6: [1, 2, 2, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 6, 6],
};
const RANGED_AOE_DMG_RADIUS: Record<ActiveSpecialTier, readonly number[]> = {
    3: [2, 2, 2, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 6, 6],
    4: [2, 2, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 6, 7, 7],
    5: [2, 2, 3, 3, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 7],
    6: [1, 2, 2, 3, 3, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6],
};
/** Printed Special ranks for Instant Attack Martial Special AoE (full value). */
const MELEE_AOE_DMG_SPECIAL: Record<ActiveSpecialTier, readonly number[]> = {
    3: [2, 4, 4, 6, 6, 7, 7, 8, 9, 9, 10, 10, 10, 11, 11, 12],
    4: [1, 4, 4, 5, 5, 6, 6, 7, 7, 7, 8, 8, 8, 9, 10, 10],
    5: [1, 3, 3, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8],
    6: [2, 2, 3, 3, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 8],
};
const RANGED_AOE_DMG_SPECIAL: Record<ActiveSpecialTier, readonly number[]> = {
    3: [2, 4, 5, 5, 6, 6, 7, 8, 8, 9, 9, 9, 10, 10, 11, 12],
    4: [1, 3, 3, 4, 4, 5, 6, 6, 6, 7, 7, 7, 8, 8, 8, 9],
    5: [1, 2, 2, 3, 3, 4, 4, 4, 5, 6, 6, 6, 6, 7, 7, 7],
    6: [2, 2, 3, 3, 3, 3, 4, 4, 4, 5, 5, 5, 5, 6, 6, 7],
};
/** Persistent-zone radius per tier (0 = no zone available at that rank). */
const ZONE_RADIUS_BY_TIER: Record<ActiveSpecialTier, readonly number[]> = {
    3: [0, 0, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3],
    4: [0, 0, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4],
    5: [0, 0, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4],
    6: [0, 0, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
};

// ─── Factory helpers ─────────────────────────────────────────────────────

function damageSingleTemplate(def: {
    flavour: 'melee' | 'ranged';
    tier: ActiveSpecialTier;
}): PowerTemplate {
    const isRanged = def.flavour === 'ranged';
    const id = `active-${isRanged ? 'ranged' : 'melee'}-damage-t${def.tier}`;
    const name = `${isRanged ? 'Ranged' : 'Melee'} Damage — Tier ${def.tier}`;
    const slot: ActiveSpecialSlot = { tier: def.tier, eligibleSpecialKeys: [...getEligibleSpecialsForTier(def.tier)] };
    const spellHints: SpellHints = { defaultResolution: 'spellAttack' };
    return {
        templateId: id,
        templateName: name,
        name,
        subfamily: 'damage-single',
        category: 'active',
        tags: [],
        specialSlot: slot,
        spellHints,
        fluff: isRanged
            ? `A focused ranged attack that applies a Tier ${def.tier} Special. Element/visuals are flavour — choose your own.`
            : `A close-range attack that applies a Tier ${def.tier} Special. Element/visuals are flavour — choose your own.`,
        cost: { action: 'attack' },
        roll: { kind: 'attack', attribute: isRanged ? 'agility' : 'might' },
        levels: buildLevels((lvl) => {
            const r = rowFromBudget({ tier: def.tier, lvl, isRanged, aoe: false });
            const d = Math.min(lvl, SINGLE_DAMAGE_ANCHOR[def.tier]);
            return activeRow({
                type: isRanged ? 'Ranged' : 'Melee',
                range: isRanged ? rangedRange(lvl) : MELEE_RANGE,
                aoe: R_NONE,
                effectText: `Deal **+${d}d8 damage** on hit.`,
                dice: `${d}d8`,
                specials: [{ key: 'SPECIAL', rank: r.rank, note: 'bound at item-create via chosenSpecial' }],
                mechanics: { damageRider: { flat: `+${d}d8` }, applyWhen: 'attack-rider' },
            });
        }),
    };
}

function damageAoeTemplate(def: {
    flavour: 'melee' | 'ranged';
    tier: ActiveSpecialTier;
}): PowerTemplate {
    const isRanged = def.flavour === 'ranged';
    const id = `active-${isRanged ? 'ranged' : 'melee'}-aoe-damage-t${def.tier}`;
    const name = `${isRanged ? 'Ranged' : 'Melee'} AoE Damage — Tier ${def.tier}`;
    const slot: ActiveSpecialSlot = { tier: def.tier, eligibleSpecialKeys: [...getEligibleSpecialsForTier(def.tier)] };
    const spellHints: SpellHints = { defaultResolution: 'spellAttack' };
    return {
        templateId: id,
        templateName: name,
        name,
        subfamily: 'damage-aoe',
        category: 'active',
        // Players Guide: AoE Actives are inherently magical / counterspell-able
        // when cast as Spells; tag them so Counterspell, anti-magic and the
        // Spell-Focus pipeline can find them.
        tags: ['spell'],
        specialSlot: slot,
        spellHints,
        fluff: `A ${isRanged ? 'ranged' : 'close-range'} area attack that applies a Tier ${def.tier} Special to everything in the area. Element/visuals are flavour — choose your own.`,
        cost: { action: 'attack' },
        roll: { kind: 'attack', attribute: isRanged ? 'agility' : 'might' },
        levels: buildLevels((lvl) => {
            const radius = (isRanged ? RANGED_AOE_DMG_RADIUS : MELEE_AOE_DMG_RADIUS)[def.tier][lvl - 1];
            const d = (isRanged ? RANGED_AOE_DMG_DICE : MELEE_AOE_DMG_DICE)[def.tier][lvl - 1];
            const rank = (isRanged ? RANGED_AOE_DMG_SPECIAL : MELEE_AOE_DMG_SPECIAL)[def.tier][lvl - 1];
            const effectText = d === 0
                ? 'Make one AoE Attack Roll and compare it separately against each creature\'s Evade. Every creature hit takes weapon damage and the full printed Special. Dive for Cover may be used after the hit check and before payload.'
                : `Make one AoE Attack Roll and compare it separately against each creature's Evade. Every creature hit takes weapon damage + **+${d}d8 damage** and the full printed Special. Dive for Cover may be used after the hit check and before payload.`;
            return activeRow({
                type: isRanged ? 'Ranged AoE' : 'Melee AoE',
                range: isRanged ? rangedRange(lvl, 8) : { kind: 'self' },
                aoe: { shape: 'radius', radiusM: radius, center: isRanged ? 'targetPoint' : 'self', targetFilter: 'enemies' },
                effectText,
                dice: d === 0 ? undefined : `${d}d8`,
                specials: [{ key: 'SPECIAL', rank, note: 'bound at item-create via chosenSpecial (full printed Special)' }],
                mechanics: d === 0
                    ? { applyWhen: 'attack-rider' }
                    : { damageRider: { flat: `+${d}d8` }, applyWhen: 'attack-rider' },
            });
        }),
    };
}

/**
 * Persistent Zone — Source: Actives.md ~144–145, ~600+, ~1196+.
 *
 * Rules implemented here:
 *   • No attack roll (auto-applies to creatures inside).
 *   • Fixed duration: 4 Rounds.
 *   • Radius table per Power Level: 1m → 4m (see ZONE_RADIUS_TABLE).
 *   • Special applies once per Round per creature (`usageLimit`).
 *   • Cost uses AoE pricing (T(X+1)). Radius per tier: ZONE_RADIUS_BY_TIER.
 */
function persistentZoneTemplate(tier: ActiveSpecialTier): PowerTemplate {
    const id = `active-ranged-zone-t${tier}`;
    const name = `Ranged Persistent Zone — Tier ${tier}`;
    const slot: ActiveSpecialSlot = { tier, eligibleSpecialKeys: [...getEligibleSpecialsForTier(tier)] };
    const spellHints: SpellHints = { defaultResolution: 'spellAttack' };
    return {
        templateId: id,
        templateName: name,
        name,
        subfamily: 'persistent-zone',
        category: 'active',
        tags: ['spell'],
        specialSlot: slot,
        spellHints,
        fluff: `A lingering hazard zone (4 Rounds) that automatically applies a Tier ${tier} Special to creatures inside, once per Round per creature.`,
        cost: { action: 'attack' },
        // No attack roll — placement is automatic.
        roll: { kind: 'none' },
        levels: buildLevels((lvl) => {
            // Persistent Zone uses AoE pricing (half-value, T(X+1) cost) and pays
            // range like any ranged Active. The zone unlocks at L3 (radius 0 below).
            const r = rowFromBudget({ tier, lvl, isRanged: true, aoe: true });
            const radius = ZONE_RADIUS_BY_TIER[tier][lvl - 1];
            if (radius <= 0) {
                return activeRow({
                    type: 'Ranged Zone',
                    range: rangedRange(lvl, 8),
                    aoe: R_NONE,
                    duration: { kind: 'rounds', rounds: 4 },
                    effectText: 'No persistent zone is available at this Power rank.',
                    specials: [],
                    mechanics: { applyWhen: 'manual', duration: 'untilNextTurn' },
                });
            }
            return activeRow({
                type: 'Ranged Zone',
                range: rangedRange(lvl, 8),
                aoe: { shape: 'zone', radiusM: radius, center: 'targetPoint', targetFilter: 'enemies' },
                duration: { kind: 'rounds', rounds: 4 },
                effectText: `Place a **${radius} m** zone for **4 Rounds**. No attack roll. Each creature inside (including those that enter on later turns) suffers the chosen Tier ${tier} Special at **rank ${r.rank}** — applied **once per Round per creature** (refreshed on the caster's turn-start).`,
                specials: [{ key: 'SPECIAL', rank: r.rank, note: 'persistent-zone: auto-apply, once/round/creature' }],
                mechanics: {
                    applyWhen: 'manual',
                    duration: 'untilNextTurn',
                    usageLimit: { per: 'round', max: 1 },
                },
            });
        }),
    };
}

/**
 * Control templates (push/pull/prone/disarm).
 *
 * Source: Actives.md ~2611–2900.
 *
 *   • **Push / Pull** (single forced-movement axis): the whole budget funds
 *     distance at `30 PP / 2 m`. Melee → `lvl × 2 m`. Ranged → range first,
 *     remainder → distance (rounded down to even metres).
 *   • **Pull + Disarm / Push + Prone**: a binary `60 PP` add-on
 *     (Disarm / Prone) unlocks once the post-range budget reaches 60 PP; the
 *     remaining budget funds the Pull / Push distance.
 *
 * Source: Actives.md control tables (Special column).
 */
/** Forced-movement distance funded by `pp` PP (30 PP / 2 m, even metres). */
function pushPullMeters(pp: number): number {
    return Math.max(0, Math.floor(Math.floor(pp / 15) / 2) * 2);
}

function controlTemplate(def: {
    id: string;
    flavour: 'melee' | 'ranged';
    name: string;
    specials: string[];
}): PowerTemplate {
    const isRanged = def.flavour === 'ranged';
    const hasDisarm = def.specials.includes('disarm');
    const hasProne = def.specials.includes('prone');
    const ADDON_COST = 60; // Disarm / Prone are fixed 60 PP add-ons.
    return {
        templateId: def.id,
        templateName: def.name,
        name: def.name,
        subfamily: 'control',
        category: 'active',
        tags: [],
        spellHints: { defaultResolution: 'spellAttack' },
        fluff: 'Forceful positioning — push, pull, trip, or disarm.',
        cost: { action: 'attack' },
        roll: { kind: 'attack', attribute: isRanged ? 'agility' : 'might' },
        levels: buildLevels((lvl) => {
            const totalPP = lvl * 30;
            const rangeM = isRanged ? 8 + (lvl - 1) * 4 : 0;
            const rangeCostPP = isRanged ? Math.max(0, Math.ceil((rangeM - 8) / 4) * 5) : 0;
            const budget = Math.max(0, totalPP - rangeCostPP);
            const range = isRanged ? rangedRange(lvl, 8) : MELEE_RANGE;
            const type = isRanged ? 'Ranged' : 'Melee';

            if (hasDisarm || hasProne) {
                // Binary add-on must be affordable before any distance.
                if (budget < ADDON_COST) {
                    return activeRow({ type, range, aoe: R_NONE, effectText: '—', specials: [], mechanics: {} });
                }
                const meters = pushPullMeters(budget - ADDON_COST);
                const moveKey = hasDisarm ? 'pull' : 'push';
                const moveWord = hasDisarm ? 'Pull' : 'Push';
                const addonPhrase = hasDisarm ? 'Disarm one held item' : 'target falls Prone';
                const specials: { key: string; rank?: number }[] = [{ key: hasDisarm ? 'disarm' : 'prone' }];
                if (meters > 0) specials.unshift({ key: moveKey, rank: meters });
                const desc = meters > 0
                    ? `${moveWord} **${meters} m** and ${addonPhrase}.`
                    : `${hasDisarm ? 'Disarm one held item' : 'Target falls Prone'}.`;
                return activeRow({
                    type, range, aoe: R_NONE,
                    effectText: `No damage. ${desc}`,
                    specials,
                    mechanics: { applyWhen: 'attack-rider' },
                });
            }

            // Push / Pull — single forced-movement axis funded by the full budget.
            const meters = pushPullMeters(budget);
            return activeRow({
                type, range, aoe: R_NONE,
                effectText: `No damage. **Push ${meters} m** or **Pull ${meters} m**.`,
                specials: [{ key: 'push', rank: meters }, { key: 'pull', rank: meters }],
                mechanics: { applyWhen: 'attack-rider' },
            });
        }),
    };
}

// ─── Support progression tables (per variant) — Source: Actives.md ───────
// Heal HP dice (the value before "d8"), one curve per flavour/shape.
const HEAL_DICE_MELEE_SINGLE: readonly number[] = [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36, 39, 42, 45, 48];
const HEAL_DICE_RANGED_SINGLE: readonly number[] = [3, 5, 8, 10, 13, 15, 18, 20, 23, 25, 28, 30, 33, 35, 38, 40];
const HEAL_DICE_MELEE_AOE: readonly number[] = [1, 4, 7, 10, 13, 13, 16, 18, 18, 21, 24, 27, 28, 28, 31, 34];
const HEAL_DICE_RANGED_AOE: readonly number[] = [1, 3, 6, 8, 11, 13, 15, 15, 18, 20, 21, 21, 24, 24, 24, 26];
const HEAL_AOE_RADIUS_MELEE: readonly number[] = [2, 2, 2, 2, 2, 3, 3, 3, 4, 4, 4, 4, 4, 5, 5, 5];
const HEAL_AOE_RADIUS_RANGED: readonly number[] = [2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 5, 5];
// Cleanse rank (0 = no version available at that Power rank).
const CLEANSE_MELEE_SINGLE: readonly number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
const CLEANSE_RANGED_SINGLE: readonly number[] = [1, 1, 2, 3, 4, 5, 6, 6, 7, 8, 9, 10, 11, 11, 12, 13];
const CLEANSE_MELEE_AOE: readonly number[] = [0, 1, 2, 3, 4, 4, 5, 6, 6, 7, 8, 9, 10, 11, 12, 13];
const CLEANSE_RANGED_AOE: readonly number[] = [0, 1, 2, 2, 3, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9];
const CLEANSE_AOE_RADIUS_MELEE: readonly number[] = [0, 2, 2, 2, 2, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4];
const CLEANSE_AOE_RADIUS_RANGED: readonly number[] = [0, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 4];
// Dispel rank (0 = no version available at that Power rank).
const DISPEL_MELEE_SINGLE: readonly number[] = [0, 1, 2, 3, 3, 4, 5, 6, 6, 7, 8, 9, 9, 10, 11, 12];
const DISPEL_RANGED_SINGLE: readonly number[] = [0, 1, 2, 2, 3, 3, 4, 5, 5, 6, 7, 7, 8, 8, 9, 10];
const DISPEL_MELEE_AOE: readonly number[] = [0, 1, 1, 2, 3, 3, 4, 4, 4, 5, 6, 6, 7, 7, 7, 8];
const DISPEL_RANGED_AOE: readonly number[] = [0, 1, 1, 2, 2, 3, 4, 4, 4, 5, 5, 5, 6, 6, 7, 7];
const DISPEL_AOE_RADIUS_MELEE: readonly number[] = [0, 2, 2, 2, 2, 3, 3, 3, 4, 4, 4, 4, 4, 5, 5, 5];
const DISPEL_AOE_RADIUS_RANGED: readonly number[] = [0, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 4, 4, 4, 4, 4];

/** Health Level Recovery band shared by all healing Actives (none below L4). */
function healthLevelRecovery(lvl: number): number {
    return lvl >= 15 ? 4 : lvl >= 12 ? 3 : lvl >= 8 ? 2 : lvl >= 4 ? 1 : 0;
}
function hlrText(lvl: number, aoe: boolean): string {
    const hl = healthLevelRecovery(lvl);
    if (hl <= 0) return '';
    const noun = hl === 1 ? 'Health Level' : 'Health Levels';
    const base = ` Restore **${hl} ${noun}** per Safe Haven Rest.`;
    return aoe ? `${base} Only one affected creature may receive Health Level Recovery per use.` : base;
}

function supportTemplate(def: {
    id: string;
    flavour: 'melee' | 'ranged';
    aoe: boolean;
    mode: 'heal' | 'cleanse' | 'dispel';
    name: string;
}): PowerTemplate {
    const isRanged = def.flavour === 'ranged';
    const spellHints: SpellHints = { defaultResolution: 'spellAttack' };
    const healTable = def.aoe
        ? (isRanged ? HEAL_DICE_RANGED_AOE : HEAL_DICE_MELEE_AOE)
        : (isRanged ? HEAL_DICE_RANGED_SINGLE : HEAL_DICE_MELEE_SINGLE);
    const cleanseTable = def.aoe
        ? (isRanged ? CLEANSE_RANGED_AOE : CLEANSE_MELEE_AOE)
        : (isRanged ? CLEANSE_RANGED_SINGLE : CLEANSE_MELEE_SINGLE);
    const dispelTable = def.aoe
        ? (isRanged ? DISPEL_RANGED_AOE : DISPEL_MELEE_AOE)
        : (isRanged ? DISPEL_RANGED_SINGLE : DISPEL_MELEE_SINGLE);
    const healRadius = isRanged ? HEAL_AOE_RADIUS_RANGED : HEAL_AOE_RADIUS_MELEE;
    const cleanseRadius = isRanged ? CLEANSE_AOE_RADIUS_RANGED : CLEANSE_AOE_RADIUS_MELEE;
    const dispelRadius = isRanged ? DISPEL_AOE_RADIUS_RANGED : DISPEL_AOE_RADIUS_MELEE;
    const radiusTable = def.mode === 'heal' ? healRadius : def.mode === 'cleanse' ? cleanseRadius : dispelRadius;

    function aoeAt(lvl: number): AoeSpec {
        if (!def.aoe) return R_NONE;
        const radiusM = radiusTable[lvl - 1];
        return { shape: 'radius', radiusM: Math.max(0, radiusM), center: isRanged ? 'targetPoint' : 'self', targetFilter: 'allies' };
    }

    return {
        templateId: def.id,
        templateName: def.name,
        name: def.name,
        subfamily: `support-${def.mode}`,
        category: 'active',
        tags: ['spell'],
        spellHints,
        fluff: `A ${def.aoe ? 'wide' : 'single-target'} ${def.flavour} ${def.mode} effect.`,
        cost: { action: 'attack' },
        roll: { kind: 'none', attribute: 'resolve' },
        levels: buildLevels((lvl) => {
            if (def.mode === 'heal') {
                const dice = healTable[lvl - 1];
                const effect = def.aoe
                    ? `Heal affected creatures for **${dice}d8 HP**.${hlrText(lvl, true)}`
                    : `Heal one creature for **${dice}d8 HP**.${hlrText(lvl, false)}`;
                return activeRow({
                    type: def.aoe ? (isRanged ? 'Ranged AoE' : 'Melee AoE') : isRanged ? 'Ranged' : 'Melee',
                    range: isRanged ? rangedRange(lvl, 8) : MELEE_RANGE,
                    aoe: aoeAt(lvl),
                    effectText: effect,
                    specials: [],
                    mechanics: { healing: { flat: `${dice}d8`, target: def.aoe ? 'aoe' : 'target' } },
                });
            }
            if (def.mode === 'cleanse') {
                const rank = cleanseTable[lvl - 1];
                const effect = rank <= 0
                    ? '—'
                    : def.aoe
                        ? `Remove one negative effect up to **Cleanse(${rank})** from each affected creature.`
                        : `Remove one negative effect up to **Cleanse(${rank})** from one creature.`;
                return activeRow({
                    type: def.aoe ? (isRanged ? 'Ranged AoE' : 'Melee AoE') : isRanged ? 'Ranged' : 'Melee',
                    range: isRanged ? rangedRange(lvl, 8) : MELEE_RANGE,
                    aoe: aoeAt(lvl),
                    effectText: effect,
                    specials: rank > 0 ? [{ key: 'cleanse', rank }] : [],
                    mechanics: {},
                });
            }
            // dispel
            const rank = dispelTable[lvl - 1];
            const effect = rank <= 0
                ? '—'
                : def.aoe
                    ? `Remove ongoing effects up to **Dispel(${rank})** in the area.`
                    : `Remove one ongoing effect up to **Dispel(${rank})**.`;
            return activeRow({
                type: def.aoe ? (isRanged ? 'Ranged AoE' : 'Melee AoE') : isRanged ? 'Ranged' : 'Melee',
                range: isRanged ? rangedRange(lvl, 8) : MELEE_RANGE,
                aoe: aoeAt(lvl),
                effectText: effect,
                specials: rank > 0 ? [{ key: 'dispel-magic', rank }] : [],
                mechanics: {},
            });
        }),
    };
}

function mixedTemplate(def: {
    id: string;
    flavour: 'melee' | 'ranged';
    name: string;
    kind: 'heal-cleanse' | 'damage-dispel';
}): PowerTemplate {
    const isRanged = def.flavour === 'ranged';
    return {
        templateId: def.id,
        templateName: def.name,
        name: def.name,
        subfamily: 'mixed',
        category: 'active',
        tags: ['spell'],
        spellHints: { defaultResolution: 'spellAttack' },
        fluff: def.kind === 'heal-cleanse'
            ? 'A single act of restoration that both heals and clears a lingering affliction.'
            : 'A blow that both damages and strips a magical effect.',
        cost: { action: 'attack' },
        roll: { kind: 'attack', attribute: isRanged ? 'agility' : 'might' },
        levels: buildLevels((lvl) => {
            if (def.kind === 'heal-cleanse') {
                // Heal scales every other level (Melee 3·⌊lvl/2⌋, Ranged 2·⌊lvl/2⌋),
                // Cleanse rank = ⌈lvl/2⌉. Source: Actives.md heal+cleanse tables.
                const heal = (isRanged ? 2 : 3) * Math.floor(lvl / 2);
                const cleanseRank = Math.ceil(lvl / 2);
                // Melee mixed grants Health Level Recovery (1 from L8, 2 from L15);
                // ranged mixed grants none.
                const hl = isRanged ? 0 : lvl >= 15 ? 2 : lvl >= 8 ? 1 : 0;
                const hlText = hl > 0 ? ` Restore **${hl} ${hl === 1 ? 'Health Level' : 'Health Levels'}** per Safe Haven Rest.` : '';
                const effect = heal <= 0
                    ? `Remove one negative effect up to **Cleanse(${cleanseRank})**.`
                    : `Heal one creature for **${heal}d8 HP** and remove one negative effect up to **Cleanse(${cleanseRank})**.${hlText}`;
                return activeRow({
                    type: isRanged ? 'Ranged' : 'Melee',
                    range: isRanged ? rangedRange(lvl, 8) : MELEE_RANGE,
                    aoe: R_NONE,
                    effectText: effect,
                    specials: [{ key: 'cleanse', rank: cleanseRank }],
                    mechanics: heal > 0 ? { healing: { flat: `${heal}d8`, target: 'target' } } : {},
                });
            }
            // damage-dispel — irregular damage curve per Actives.md.
            const MELEE_DD_DICE = [1, 1, 3, 3, 4, 6, 6, 7, 8, 9, 11, 13, 15, 15, 15, 16];
            const RANGED_DD_DICE = [1, 1, 2, 3, 3, 5, 6, 6, 7, 9, 10, 11, 11, 12, 14, 15];
            const d = (isRanged ? RANGED_DD_DICE : MELEE_DD_DICE)[lvl - 1];
            return activeRow({
                type: isRanged ? 'Ranged' : 'Melee',
                range: isRanged ? rangedRange(lvl, 8) : MELEE_RANGE,
                aoe: R_NONE,
                effectText: `Deal **+${d}d8 damage** on hit and dispel one ongoing magical effect of level ≤ ${lvl}.`,
                dice: `${d}d8`,
                specials: [{ key: 'dispel-magic', rank: lvl }],
                mechanics: { damageRider: { flat: `+${d}d8` }, applyWhen: 'attack-rider' },
            });
        }),
    };
}

// ─── Template registry ───────────────────────────────────────────────────
// NB: Uses a lazy build() closure so the registry can reference template
// factories and progression tables declared further down in this file
// without hitting "Cannot access before initialization" TDZ errors. The
// module export is frozen on first use so downstream iterators still see
// a stable array.

function buildActiveTemplates(): PowerTemplate[] {
    return [
    // Damage Single — Melee (4) + Ranged (4)
    damageSingleTemplate({ flavour: 'melee', tier: 3 }),
    damageSingleTemplate({ flavour: 'ranged', tier: 3 }),
    damageSingleTemplate({ flavour: 'melee', tier: 4 }),
    damageSingleTemplate({ flavour: 'ranged', tier: 4 }),
    damageSingleTemplate({ flavour: 'melee', tier: 5 }),
    damageSingleTemplate({ flavour: 'ranged', tier: 5 }),
    damageSingleTemplate({ flavour: 'melee', tier: 6 }),
    damageSingleTemplate({ flavour: 'ranged', tier: 6 }),

    // Damage AoE — Melee (4) + Ranged (4)
    damageAoeTemplate({ flavour: 'melee', tier: 3 }),
    damageAoeTemplate({ flavour: 'ranged', tier: 3 }),
    damageAoeTemplate({ flavour: 'melee', tier: 4 }),
    damageAoeTemplate({ flavour: 'ranged', tier: 4 }),
    damageAoeTemplate({ flavour: 'melee', tier: 5 }),
    damageAoeTemplate({ flavour: 'ranged', tier: 5 }),
    damageAoeTemplate({ flavour: 'melee', tier: 6 }),
    damageAoeTemplate({ flavour: 'ranged', tier: 6 }),

    // Persistent Zone — Ranged only (4)
    persistentZoneTemplate(3),
    persistentZoneTemplate(4),
    persistentZoneTemplate(5),
    persistentZoneTemplate(6),

    // Control — Melee + Ranged × (push-pull, pull-disarm, push-prone) = 6
    controlTemplate({ id: 'active-melee-control-push-pull', flavour: 'melee', name: 'Melee Control — Push + Pull', specials: ['push', 'pull'] }),
    controlTemplate({ id: 'active-ranged-control-push-pull', flavour: 'ranged', name: 'Ranged Control — Push + Pull', specials: ['push', 'pull'] }),
    controlTemplate({ id: 'active-melee-control-pull-disarm', flavour: 'melee', name: 'Melee Control — Pull + Disarm', specials: ['pull', 'disarm'] }),
    controlTemplate({ id: 'active-ranged-control-pull-disarm', flavour: 'ranged', name: 'Ranged Control — Pull + Disarm', specials: ['pull', 'disarm'] }),
    controlTemplate({ id: 'active-melee-control-push-prone', flavour: 'melee', name: 'Melee Control — Push + Prone', specials: ['push', 'prone'] }),
    controlTemplate({ id: 'active-ranged-control-push-prone', flavour: 'ranged', name: 'Ranged Control — Push + Prone', specials: ['push', 'prone'] }),

    // Support — heal / cleanse / dispel × (single-target, aoe) × (melee, ranged) = 12
    supportTemplate({ id: 'active-melee-single-heal', flavour: 'melee', aoe: false, mode: 'heal', name: 'Melee Single-Target Heal' }),
    supportTemplate({ id: 'active-ranged-single-heal', flavour: 'ranged', aoe: false, mode: 'heal', name: 'Ranged Single-Target Heal' }),
    supportTemplate({ id: 'active-melee-aoe-heal', flavour: 'melee', aoe: true, mode: 'heal', name: 'Melee AoE Heal' }),
    supportTemplate({ id: 'active-ranged-aoe-heal', flavour: 'ranged', aoe: true, mode: 'heal', name: 'Ranged AoE Heal' }),
    supportTemplate({ id: 'active-melee-single-cleanse', flavour: 'melee', aoe: false, mode: 'cleanse', name: 'Melee Single-Target Cleanse' }),
    supportTemplate({ id: 'active-ranged-single-cleanse', flavour: 'ranged', aoe: false, mode: 'cleanse', name: 'Ranged Single-Target Cleanse' }),
    supportTemplate({ id: 'active-melee-aoe-cleanse', flavour: 'melee', aoe: true, mode: 'cleanse', name: 'Melee AoE Cleanse' }),
    supportTemplate({ id: 'active-ranged-aoe-cleanse', flavour: 'ranged', aoe: true, mode: 'cleanse', name: 'Ranged AoE Cleanse' }),
    supportTemplate({ id: 'active-melee-single-dispel', flavour: 'melee', aoe: false, mode: 'dispel', name: 'Melee Single-Target Dispel' }),
    supportTemplate({ id: 'active-ranged-single-dispel', flavour: 'ranged', aoe: false, mode: 'dispel', name: 'Ranged Single-Target Dispel' }),
    supportTemplate({ id: 'active-melee-aoe-dispel', flavour: 'melee', aoe: true, mode: 'dispel', name: 'Melee AoE Dispel' }),
    supportTemplate({ id: 'active-ranged-aoe-dispel', flavour: 'ranged', aoe: true, mode: 'dispel', name: 'Ranged AoE Dispel' }),

    // Mixed — heal+cleanse / damage+dispel × (melee, ranged) = 4
    mixedTemplate({ id: 'active-melee-heal-cleanse-mixed', flavour: 'melee', name: 'Melee Heal + Cleanse (Mixed)', kind: 'heal-cleanse' }),
    mixedTemplate({ id: 'active-ranged-heal-cleanse-mixed', flavour: 'ranged', name: 'Ranged Heal + Cleanse (Mixed)', kind: 'heal-cleanse' }),
    mixedTemplate({ id: 'active-melee-damage-dispel-mixed', flavour: 'melee', name: 'Melee Damage + Dispel (Mixed)', kind: 'damage-dispel' }),
    mixedTemplate({ id: 'active-ranged-damage-dispel-mixed', flavour: 'ranged', name: 'Ranged Damage + Dispel (Mixed)', kind: 'damage-dispel' }),

    // Barrier — Ranged (1)
    {
        templateId: 'active-ranged-barrier',
        templateName: 'Ranged Barrier — 4 Rounds',
        name: 'Ranged Barrier — 4 Rounds',
        subfamily: 'barrier',
        category: 'active',
        tags: ['spell'],
        spellHints: { defaultResolution: 'spellAttack' },
        fluff: 'A summoned wall of force, stone, wood, or ice that lasts for several rounds.',
        cost: { action: 'attack' },
        roll: { kind: 'none' },
        levels: buildLevels((lvl) => {
            // Budget-derived irregular HP (range + radius steps eat into HP).
            const BARRIER_HP = [0, 10, 22, 35, 42, 42, 42, 55, 65, 65, 65, 65, 77, 90, 102, 115];
            const BARRIER_RADIUS = [0, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4];
            const hp = BARRIER_HP[lvl - 1];
            const radius = BARRIER_RADIUS[lvl - 1];
            if (hp <= 0) {
                return activeRow({
                    type: 'Ranged Barrier',
                    range: rangedRange(lvl, 8),
                    aoe: R_NONE,
                    duration: { kind: 'rounds', rounds: 4 },
                    effectText: 'No Barrier is available at this Power rank.',
                    mechanics: {},
                });
            }
            return activeRow({
                type: 'Ranged Barrier',
                range: rangedRange(lvl, 8),
                aoe: { shape: 'radius', radiusM: radius, center: 'targetPoint' },
                duration: { kind: 'rounds', rounds: 4 },
                effectText: `Create a **${radius} m radius** Barrier with **${hp} HP** for **4 Rounds**.`,
                mechanics: {},
            });
        }),
    },

    // Hard Control — Stunning Strike: Damage + fixed Stunned × (melee, ranged) = 2
    stunningStrikeTemplate('melee'),
    stunningStrikeTemplate('ranged'),

    // Illusion — Ranged Images (4 Rounds) = 1
    rangedImagesTemplate(),

    // Weapon Attacks — pure attack templates (no Specials) = 7
    singleWeaponAttackTemplate('melee'),
    singleWeaponAttackTemplate('ranged'),
    aoeWeaponAttackTemplate('melee'),
    aoeWeaponAttackTemplate('ranged'),
    splitWeaponAttackTemplate('melee'),
    splitWeaponAttackTemplate('ranged'),
    autofireWeaponAttackTemplate(),

    // Targeted Special Attacks — Exorcism / Requiem (docs/Rules/actives.md)
    targetedSpecialAttackTemplate('melee'),
    targetedSpecialAttackTemplate('ranged'),
    targetedSpecialAoeAttackTemplate('melee'),
    targetedSpecialAoeAttackTemplate('ranged'),

    // Support leftovers + Mental Powers (Rules/actives.md 2026-07)
    healthLevelHealTemplate('melee'),
    healthLevelHealTemplate('ranged'),
    cleanseAbsorptionTemplate(),
    mentalAttackTemplate(),
    mindIllusionTemplate(),
    ];
}

// ─── Targeted Special Attacks (Exorcism / Requiem) ────────────────────────
// Choose Exorcism or Requiem at Power build. Tag-gated at apply time.

const TARGETED_SPECIAL_KEYS = ['exorcism', 'requiem'] as const;
const MELEE_TARGETED_SPECIAL_RANK: readonly number[] = [
    5, 7, 9, 10, 11, 12, 14, 15, 15, 16, 17, 18, 19, 20, 20, 21,
];
const RANGED_TARGETED_SPECIAL_RANK: readonly number[] = [
    5, 6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 16, 17, 18, 19, 19,
];
const MELEE_AOE_TARGETED_RADIUS: readonly number[] = [
    2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 8, 8,
];
const MELEE_AOE_TARGETED_SPECIAL_RANK: readonly number[] = [
    2, 5, 5, 7, 7, 9, 9, 9, 9, 10, 10, 10, 10, 11, 12, 13,
];
const RANGED_AOE_TARGETED_RADIUS: readonly number[] = [
    2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 7, 8, 8, 8,
];
const RANGED_AOE_TARGETED_SPECIAL_RANK: readonly number[] = [
    2, 5, 5, 6, 6, 7, 7, 7, 7, 7, 7, 8, 8, 8, 9, 10,
];

function targetedSpecialSlot(): ActiveSpecialSlot {
    // Start PP 2 Specials — tier field is catalog plumbing only (not a Start-PP group).
    return { tier: 3, eligibleSpecialKeys: [...TARGETED_SPECIAL_KEYS] };
}

function targetedSpecialAttackTemplate(flavour: 'melee' | 'ranged'): PowerTemplate {
    const isRanged = flavour === 'ranged';
    const ranks = isRanged ? RANGED_TARGETED_SPECIAL_RANK : MELEE_TARGETED_SPECIAL_RANK;
    return {
        templateId: isRanged ? 'active-ranged-targeted-special' : 'active-melee-targeted-special',
        templateName: isRanged ? 'Ranged Targeted Special Attack' : 'Melee Targeted Special Attack',
        name: isRanged ? 'Ranged Targeted Special Attack' : 'Melee Targeted Special Attack',
        subfamily: 'targeted-special-attack',
        category: 'active',
        tags: [],
        specialSlot: targetedSpecialSlot(),
        spellHints: { defaultResolution: 'spellAttack' },
        fluff: 'A targeted weapon strike against one supernatural creature type. Choose Exorcism (Fiend) or Requiem (Undead) when the Power is built.',
        cost: { action: 'attack' },
        roll: { kind: 'attack', attribute: isRanged ? 'agility' : 'might' },
        levels: buildLevels((lvl) => {
            const rank = ranks[lvl - 1];
            return activeRow({
                type: isRanged ? 'Ranged' : 'Melee',
                range: isRanged ? rangedRange(lvl) : MELEE_RANGE,
                aoe: R_NONE,
                effectText:
                    'Make one weapon attack. On hit, deal weapon damage. If the target qualifies, it also gains the chosen targeted Special.',
                specials: [{ key: 'SPECIAL', rank, note: 'bound at item-create via chosenSpecial (Exorcism or Requiem)' }],
                mechanics: { applyWhen: 'attack-rider' },
            });
        }),
    };
}

function targetedSpecialAoeAttackTemplate(flavour: 'melee' | 'ranged'): PowerTemplate {
    const isRanged = flavour === 'ranged';
    const radii = isRanged ? RANGED_AOE_TARGETED_RADIUS : MELEE_AOE_TARGETED_RADIUS;
    const ranks = isRanged ? RANGED_AOE_TARGETED_SPECIAL_RANK : MELEE_AOE_TARGETED_SPECIAL_RANK;
    return {
        templateId: isRanged ? 'active-ranged-aoe-targeted-special' : 'active-melee-aoe-targeted-special',
        templateName: isRanged ? 'Ranged AoE Targeted Special Attack' : 'Melee AoE Targeted Special Attack',
        name: isRanged ? 'Ranged AoE Targeted Special Attack' : 'Melee AoE Targeted Special Attack',
        subfamily: 'targeted-special-attack',
        category: 'active',
        tags: [],
        specialSlot: targetedSpecialSlot(),
        spellHints: { defaultResolution: 'spellAttack' },
        fluff: 'A targeted area attack against one supernatural creature type. Choose Exorcism (Fiend) or Requiem (Undead) when the Power is built.',
        cost: { action: 'attack' },
        roll: { kind: 'attack', attribute: isRanged ? 'agility' : 'might' },
        levels: buildLevels((lvl) => {
            const rank = ranks[lvl - 1];
            const radiusM = radii[lvl - 1];
            return activeRow({
                type: isRanged ? 'Ranged AoE' : 'Melee AoE',
                range: isRanged ? rangedRange(lvl) : { kind: 'self' },
                aoe: {
                    shape: 'radius',
                    radiusM,
                    center: isRanged ? 'targetPoint' : 'self',
                    targetFilter: 'enemies',
                },
                effectText:
                    'Make one AoE weapon attack. Every creature hit takes weapon damage. Qualifying targets also gain the chosen targeted Special.',
                specials: [{ key: 'SPECIAL', rank, note: 'bound at item-create via chosenSpecial (Exorcism or Requiem)' }],
                mechanics: { applyWhen: 'attack-rider' },
            });
        }),
    };
}

// ─── Stunning Strike (Damage + fixed Stunned) ────────────────────────────
//
// Stunned is a binary Hard-Control add-on (fixed 120 PP). Damage is the
// scaling axis once the Power can afford Stunned:
//   • Melee  → unlocks at Level 4 (no extra dice), then +2d8 per level.
//   • Ranged → pays Range every level; unlocks at Level 5 (no extra dice),
//     then irregular progression per Actives.md.

const MELEE_STUN_EXTRA_DICE: readonly number[] = [
    0, 0, 0, 0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24,
];
const RANGED_STUN_EXTRA_DICE: readonly number[] = [
    0, 0, 0, 0, 0, 2, 4, 5, 7, 9, 10, 12, 14, 15, 17, 19,
];

function stunningStrikeTemplate(flavour: 'melee' | 'ranged'): PowerTemplate {
    const isRanged = flavour === 'ranged';
    const unlockLvl = isRanged ? 5 : 4;
    return {
        templateId: isRanged ? 'active-ranged-damage-stunned' : 'active-melee-damage-stunned',
        templateName: isRanged ? 'Ranged Damage + Stunned' : 'Melee Damage + Stunned',
        name: isRanged ? 'Ranged Damage + Stunned' : 'Melee Damage + Stunned',
        subfamily: 'hard-control',
        category: 'active',
        tags: [],
        spellHints: { defaultResolution: 'spellAttack' },
        fluff: isRanged
            ? 'A precise ranged strike that staggers the target and briefly denies its ability to attack.'
            : 'A close-range martial blow that staggers the target and briefly denies its ability to attack.',
        cost: { action: 'attack' },
        roll: { kind: 'attack', attribute: isRanged ? 'agility' : 'might' },
        levels: buildLevels((lvl) => {
            if (lvl < unlockLvl) {
                return activeRow({
                    type: isRanged ? 'Ranged' : 'Melee',
                    range: isRanged ? rangedRange(lvl) : MELEE_RANGE,
                    aoe: R_NONE,
                    effectText: 'No Stun version is available at this Power rank.',
                    specials: [],
                    mechanics: {},
                });
            }
            const extra = (isRanged ? RANGED_STUN_EXTRA_DICE : MELEE_STUN_EXTRA_DICE)[lvl - 1];
            const diceText = extra === 0 ? '' : `+${extra}d8`;
            const effectText = extra === 0
                ? 'No damage. Target is **Stunned**.'
                : `Deal **+${extra}d8 damage** on hit. Target is **Stunned**.`;
            return activeRow({
                type: isRanged ? 'Ranged' : 'Melee',
                range: isRanged ? rangedRange(lvl) : MELEE_RANGE,
                aoe: R_NONE,
                duration: { kind: 'untilStartOfNextTurn' },
                effectText,
                dice: diceText || undefined,
                specials: [{ key: 'stunned' }],
                mechanics: extra === 0
                    ? { applyWhen: 'attack-rider' }
                    : { damageRider: { flat: diceText }, applyWhen: 'attack-rider' },
            });
        }),
    };
}

// ─── Ranged Images — Illusion Field (4 Rounds) ───────────────────────────

const RANGED_IMAGES_ROWS: readonly { radiusM: number; imageTier: number; imageLabel: string }[] = [
    { radiusM: 1, imageTier: 1, imageLabel: 'a simple static visual image' },          // L1
    { radiusM: 1, imageTier: 1, imageLabel: 'a simple static visual image' },          // L2
    { radiusM: 1, imageTier: 2, imageLabel: 'a moving visual image' },                 // L3
    { radiusM: 2, imageTier: 2, imageLabel: 'a moving visual image' },                 // L4
    { radiusM: 2, imageTier: 3, imageLabel: 'a sight and sound image' },               // L5
    { radiusM: 2, imageTier: 3, imageLabel: 'a sight and sound image' },               // L6
    { radiusM: 2, imageTier: 4, imageLabel: 'a complex creature or object image' },    // L7
    { radiusM: 2, imageTier: 4, imageLabel: 'a complex creature or object image' },    // L8
    { radiusM: 3, imageTier: 4, imageLabel: 'a complex creature or object image' },    // L9
    { radiusM: 3, imageTier: 4, imageLabel: 'a complex creature or object image' },    // L10
    { radiusM: 3, imageTier: 5, imageLabel: 'a multi-sense image' },                   // L11
    { radiusM: 3, imageTier: 5, imageLabel: 'a multi-sense image' },                   // L12
    { radiusM: 3, imageTier: 6, imageLabel: 'a small scene with several moving parts' }, // L13
    { radiusM: 3, imageTier: 6, imageLabel: 'a small scene with several moving parts' }, // L14
    { radiusM: 3, imageTier: 6, imageLabel: 'a small scene with several moving parts' }, // L15
    { radiusM: 3, imageTier: 7, imageLabel: 'a complex battlefield illusion' },        // L16
];

const IMAGE_ROMAN: readonly string[] = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

function rangedImagesTemplate(): PowerTemplate {
    return {
        templateId: 'active-ranged-illusion-image',
        templateName: 'Ranged Images — 4 Rounds',
        name: 'Ranged Images — 4 Rounds',
        subfamily: 'illusion',
        category: 'active',
        tags: ['spell'],
        spellHints: { defaultResolution: 'spellAttack' },
        fluff: 'A ranged illusion Active that creates false sensory information for 4 Rounds. Images do not deal damage, block movement, or apply Specials — they only make creatures believe things are present.',
        cost: { action: 'attack' },
        roll: { kind: 'none' },
        levels: buildLevels((lvl) => {
            const row = RANGED_IMAGES_ROWS[lvl - 1];
            const aoe: AoeSpec = row.radiusM <= 1
                ? { shape: 'single', note: lvl === 1 ? 'Single Small Image' : 'Single Human-Sized Image' }
                : { shape: 'radius', radiusM: row.radiusM, center: 'targetPoint' };
            return activeRow({
                type: 'Ranged Illusion',
                range: rangedRange(lvl),
                aoe,
                duration: { kind: 'rounds', rounds: 4 },
                effectText: `Create **Image ${IMAGE_ROMAN[row.imageTier]}**: ${row.imageLabel}.`,
                specials: [],
                mechanics: { applyWhen: 'manual' },
            });
        }),
    };
}

// ─── Weapon Attack Templates (pure — no Specials) ────────────────────────

// Single Weapon Attack damage progression.
const MELEE_SINGLE_DICE: readonly number[] = [
    2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32,
];
const RANGED_SINGLE_DICE: readonly number[] = [
    2, 3, 5, 7, 8, 10, 12, 13, 15, 17, 18, 20, 22, 23, 25, 27,
];

function singleWeaponAttackTemplate(flavour: 'melee' | 'ranged'): PowerTemplate {
    const isRanged = flavour === 'ranged';
    const dice = isRanged ? RANGED_SINGLE_DICE : MELEE_SINGLE_DICE;
    return {
        templateId: isRanged ? 'active-ranged-weapon-single' : 'active-melee-weapon-single',
        templateName: isRanged ? 'Ranged Single Attack' : 'Melee Single Attack',
        name: isRanged ? 'Ranged Single Attack' : 'Melee Single Attack',
        subfamily: 'weapon-attack',
        category: 'active',
        tags: [],
        spellHints: { defaultResolution: 'spellAttack' },
        fluff: isRanged
            ? 'A clean ranged weapon attack with no Special, rider, movement, or secondary effect.'
            : 'A clean melee weapon attack with no Special, rider, movement, or secondary effect.',
        cost: { action: 'attack' },
        roll: { kind: 'attack', attribute: isRanged ? 'agility' : 'might' },
        levels: buildLevels((lvl) => {
            const d = dice[lvl - 1];
            return activeRow({
                type: isRanged ? 'Ranged' : 'Melee',
                range: isRanged ? rangedRange(lvl) : MELEE_RANGE,
                aoe: R_NONE,
                effectText: `Make **one ${isRanged ? 'ranged' : 'melee'} weapon attack**. On hit, deal weapon damage + **${d}d8 damage**.`,
                dice: `+${d}d8`,
                specials: [],
                mechanics: { damageRider: { flat: `+${d}d8` }, applyWhen: 'attack-rider' },
            });
        }),
    };
}

// AoE Weapon Attack progression — exact PL tables from docs/Rules/actives.md.
const MELEE_AOE_PROG: readonly { radiusM: number; dice: number }[] = [
    { radiusM: 2, dice: 0 }, { radiusM: 2, dice: 2 }, { radiusM: 3, dice: 2 }, { radiusM: 3, dice: 4 },
    { radiusM: 4, dice: 4 }, { radiusM: 4, dice: 6 }, { radiusM: 5, dice: 6 }, { radiusM: 5, dice: 7 },
    { radiusM: 6, dice: 7 }, { radiusM: 6, dice: 7 }, { radiusM: 7, dice: 7 }, { radiusM: 7, dice: 7 },
    { radiusM: 8, dice: 7 }, { radiusM: 8, dice: 9 }, { radiusM: 8, dice: 11 }, { radiusM: 8, dice: 13 },
];
const RANGED_AOE_PROG: readonly { radiusM: number; dice: number }[] = [
    { radiusM: 2, dice: 0 }, { radiusM: 2, dice: 2 }, { radiusM: 3, dice: 2 }, { radiusM: 3, dice: 3 },
    { radiusM: 4, dice: 3 }, { radiusM: 4, dice: 4 }, { radiusM: 5, dice: 4 }, { radiusM: 5, dice: 4 },
    { radiusM: 6, dice: 4 }, { radiusM: 6, dice: 4 }, { radiusM: 7, dice: 4 }, { radiusM: 7, dice: 5 },
    { radiusM: 7, dice: 5 }, { radiusM: 8, dice: 5 }, { radiusM: 8, dice: 6 }, { radiusM: 8, dice: 8 },
];

function aoeWeaponAttackTemplate(flavour: 'melee' | 'ranged'): PowerTemplate {
    const isRanged = flavour === 'ranged';
    const prog = isRanged ? RANGED_AOE_PROG : MELEE_AOE_PROG;
    return {
        templateId: isRanged ? 'active-ranged-weapon-aoe' : 'active-melee-weapon-aoe',
        templateName: isRanged ? 'Ranged AoE Attack' : 'Melee AoE Attack',
        name: isRanged ? 'Ranged AoE Attack' : 'Melee AoE Attack',
        subfamily: 'weapon-attack',
        category: 'active',
        tags: [],
        spellHints: { defaultResolution: 'spellAttack' },
        fluff: isRanged
            ? 'A ranged weapon attack that bursts around a target point. One roll is compared separately against each creature\'s Evade; every hit takes the full printed payload.'
            : 'A self-centered weapon sweep or burst around the attacker. One roll is compared separately against each creature\'s Evade; every hit takes the full printed payload.',
        cost: { action: 'attack' },
        roll: { kind: 'attack', attribute: isRanged ? 'agility' : 'might' },
        levels: buildLevels((lvl) => {
            const p = prog[lvl - 1];
            const aoe: AoeSpec = {
                shape: 'radius',
                radiusM: p.radiusM,
                center: isRanged ? 'targetPoint' : 'self',
                targetFilter: 'enemies',
            };
            const diceText = p.dice === 0 ? '' : `+${p.dice}d8`;
            const effect = p.dice === 0
                ? `Make one ${isRanged ? 'ranged' : 'melee'} AoE Attack Roll and compare it separately against the Evade of each valid creature in the area. Every creature hit takes weapon damage and may use Dive for Cover before payload.`
                : `Make one ${isRanged ? 'ranged' : 'melee'} AoE Attack Roll and compare it separately against the Evade of each valid creature in the area. Every creature hit takes weapon damage + **${p.dice}d8 damage** and may use Dive for Cover before payload.`;
            return activeRow({
                type: isRanged ? 'Ranged AoE' : 'Melee AoE',
                range: isRanged ? rangedRange(lvl) : { kind: 'self' },
                aoe,
                effectText: effect,
                dice: diceText || undefined,
                specials: [],
                mechanics: p.dice === 0
                    ? { applyWhen: 'attack-rider' }
                    : { damageRider: { flat: diceText }, applyWhen: 'attack-rider' },
            });
        }),
    };
}

// Split Weapon Attack progression: (attack count, bonus dice).
const MELEE_SPLIT_PROG: readonly { attacks: number; dice: number }[] = [
    { attacks: 2, dice: 0 }, { attacks: 2, dice: 2 }, { attacks: 2, dice: 4 }, { attacks: 2, dice: 6 },
    { attacks: 2, dice: 8 }, { attacks: 2, dice: 10 }, { attacks: 3, dice: 10 }, { attacks: 3, dice: 12 },
    { attacks: 3, dice: 14 }, { attacks: 3, dice: 16 }, { attacks: 3, dice: 18 }, { attacks: 3, dice: 20 },
    { attacks: 4, dice: 20 }, { attacks: 4, dice: 22 }, { attacks: 4, dice: 24 }, { attacks: 4, dice: 26 },
];
const RANGED_SPLIT_PROG: readonly { attacks: number; dice: number }[] = [
    { attacks: 2, dice: 0 }, { attacks: 2, dice: 1 }, { attacks: 2, dice: 3 }, { attacks: 2, dice: 5 },
    { attacks: 2, dice: 6 }, { attacks: 2, dice: 8 }, { attacks: 3, dice: 8 }, { attacks: 3, dice: 9 },
    { attacks: 3, dice: 11 }, { attacks: 3, dice: 13 }, { attacks: 3, dice: 14 }, { attacks: 3, dice: 16 },
    { attacks: 4, dice: 16 }, { attacks: 4, dice: 17 }, { attacks: 4, dice: 19 }, { attacks: 4, dice: 21 },
];

function splitWeaponAttackTemplate(flavour: 'melee' | 'ranged'): PowerTemplate {
    const isRanged = flavour === 'ranged';
    const prog = isRanged ? RANGED_SPLIT_PROG : MELEE_SPLIT_PROG;
    return {
        templateId: isRanged ? 'active-ranged-weapon-split' : 'active-melee-weapon-split',
        templateName: isRanged ? 'Ranged Split Attack' : 'Melee Split Attack',
        name: isRanged ? 'Ranged Split Attack' : 'Melee Split Attack',
        subfamily: 'weapon-attack',
        category: 'active',
        tags: [],
        spellHints: { defaultResolution: 'spellAttack' },
        fluff: isRanged
            ? 'A ranged technique that divides one attack sequence between multiple targets.'
            : 'A melee technique that divides one attack sequence between multiple targets.',
        cost: { action: 'attack' },
        roll: { kind: 'attack', attribute: isRanged ? 'agility' : 'might' },
        levels: buildLevels((lvl) => {
            const p = prog[lvl - 1];
            const diceText = p.dice === 0 ? '' : `+${p.dice}d8`;
            const base = `Make up to **${p.attacks} ${isRanged ? 'ranged' : 'melee'} weapon attacks**. Split your Attack Pool between them. Roll one total Damage Pool equal to weapon damage`;
            const effect = p.dice === 0
                ? `${base}, then split that damage between successful hits.`
                : `${base} + **${p.dice}d8 damage**, then split that damage between successful hits.`;
            return activeRow({
                type: isRanged ? 'Ranged' : 'Melee',
                range: isRanged ? rangedRange(lvl) : MELEE_RANGE,
                aoe: { shape: 'weapon', targets: p.attacks },
                effectText: effect,
                dice: diceText || undefined,
                // Split-Attack is an attack *mode*, not a Special: declare via
                // mechanics.splitAttack so the runtime halves the pool, but do
                // NOT expose it in the Raise-Special catalog.
                specials: [],
                mechanics: p.dice === 0
                    ? { applyWhen: 'attack-rider', splitAttack: true }
                    : { damageRider: { flat: diceText }, applyWhen: 'attack-rider', splitAttack: true },
            });
        }),
    };
}

// Autofire progression: (additional targets X, bonus dice); range = 8 + 4*(L-1).
// Matches docs/Rules/actives.md Ranged Autofire (30 PP × X capacity tax).
const AUTOFIRE_PROG: readonly { extra: number; dice: number }[] = [
    { extra: 1, dice: 0 }, { extra: 1, dice: 1 }, { extra: 2, dice: 1 }, { extra: 2, dice: 2 },
    { extra: 3, dice: 2 }, { extra: 3, dice: 4 }, { extra: 4, dice: 4 }, { extra: 4, dice: 5 },
    { extra: 5, dice: 5 }, { extra: 5, dice: 6 }, { extra: 6, dice: 6 }, { extra: 6, dice: 8 },
    { extra: 7, dice: 8 }, { extra: 7, dice: 9 }, { extra: 8, dice: 9 }, { extra: 8, dice: 11 },
];

function autofireWeaponAttackTemplate(): PowerTemplate {
    return {
        templateId: 'active-ranged-weapon-autofire',
        templateName: 'Ranged Autofire',
        name: 'Ranged Autofire',
        subfamily: 'weapon-attack',
        category: 'active',
        tags: [],
        spellHints: { defaultResolution: 'spellAttack' },
        fluff: 'A ranged weapon attack that walks through an ordered chain of targets. One roll is checked against each Evade in order; the first miss ends the chain. Every hit takes the full printed payload.',
        cost: { action: 'attack' },
        roll: { kind: 'attack', attribute: 'agility' },
        levels: buildLevels((lvl) => {
            const p = AUTOFIRE_PROG[lvl - 1];
            const totalTargets = 1 + p.extra;
            const diceText = p.dice === 0 ? '' : `+${p.dice}d8`;
            const payload = p.dice === 0 ? 'weapon damage' : `weapon damage + **${p.dice}d8 damage**`;
            const effect =
                `Autofire up to **${totalTargets} targets**. Each next target must be within **4 m** of the previous target. Make one Attack Roll and check it against each target's Evade in order; the first miss ends the chain. Every hit takes ${payload}. Dive for Cover cannot be used.`;
            return activeRow({
                type: 'Ranged',
                range: rangedRange(lvl),
                aoe: { shape: 'weapon', targets: totalTargets },
                effectText: effect,
                dice: diceText || undefined,
                // Autofire is an attack *mode*, not a Special: declared via
                // mechanics.autofire (ordered chain; no target-count Raises).
                specials: [],
                mechanics: p.dice === 0
                    ? { applyWhen: 'attack-rider', autofire: { extraTargets: p.extra } }
                    : { damageRider: { flat: diceText }, applyWhen: 'attack-rider', autofire: { extraTargets: p.extra } },
            });
        }),
    };
}

// ─── Health Level Heal / Cleanse Absorption / Mental (Rules/actives.md) ───

const HL_HEAL_MELEE_POOL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16] as const;
const HL_HEAL_RANGED_POOL = [1, 1, 2, 3, 4, 5, 6, 6, 7, 8, 9, 10, 11, 11, 12, 13] as const;

const CLEANSE_ABSORPTION_RANK = [0, 0, 3, 4, 5, 6, 6, 6, 7, 8, 8, 8, 8, 8, 8, 8] as const;
const CLEANSE_ABSORPTION_BONUS = [
    '', '', 'I', 'I', 'I', 'I', 'II', 'III', 'III', 'III', 'III', 'IV', 'V', 'V', 'VI', 'VII',
] as const;

const MIND_ILLUSION_TARGETS = [
    '1 creature', '1 creature', '1 creature', '1 creature',
    '2 creatures', '2 creatures', '2 creatures', '3 creatures',
    '3 creatures', '3 creatures', '4 creatures', '4 creatures',
    '5 creatures', '5 creatures', 'MR + 2 creatures', 'MR + 3 creatures',
] as const;
const MIND_ILLUSION_COMPLEXITY = [
    '1 simple sense', '1 clear sense', '2 simple senses', '2 clear senses',
    '2 clear senses', '3 senses', '3 senses, moving illusion', '3 senses, reactive illusion',
    '4 senses', '4 senses, detailed illusion', '4 senses, reactive illusion', '5 senses',
    '5 senses, detailed moving illusion', '5 senses, reactive false scene',
    'all normal senses', 'all normal senses, complex reactive illusion',
] as const;
const MIND_ILLUSION_EFFECT = [
    'Create a minor false perception, such as a whisper, flicker, smell, touch, or brief image.',
    'Create a clear false sensory detail in one sense.',
    'Combine two simple sensory details, such as image and sound.',
    'Create a believable personal illusion affecting two senses.',
    'Affect two creatures with the same personal illusion.',
    'Create a more complete false perception affecting three senses.',
    "The illusion may move naturally inside the target's perception.",
    "The illusion may react in simple ways to the target's movement or attention.",
    'Create a strong false perception affecting four senses.',
    'The illusion may contain detailed features, such as a creature, object, voice, or false threat.',
    'Affect up to four creatures with a shared but personal mental illusion.',
    "Create a nearly complete sensory illusion inside each target's mind.",
    'The illusion may appear complex, moving, and emotionally convincing.',
    "Create a false scene inside the targets' perception. It still has no real battlefield presence.",
    'Affect all normal senses with a convincing personal illusion.',
    'Create a complex shared mental illusion for affected creatures. It remains mental only and cannot control actions directly.',
] as const;

function healthLevelHealTemplate(flavour: 'melee' | 'ranged'): PowerTemplate {
    const isRanged = flavour === 'ranged';
    const pool = isRanged ? HL_HEAL_RANGED_POOL : HL_HEAL_MELEE_POOL;
    return {
        templateId: isRanged ? 'active-ranged-health-level-heal' : 'active-melee-health-level-heal',
        templateName: isRanged ? 'Ranged Health Level Heal' : 'Melee Health Level Heal',
        name: isRanged ? 'Ranged Health Level Heal' : 'Melee Health Level Heal',
        subfamily: 'support-heal',
        category: 'active',
        tags: ['spell'],
        spellHints: { defaultResolution: 'spellAttack' },
        fluff:
            'Spend this Power\'s Health Level Recovery pool to restore lost Health Levels. It restores no HP by itself.',
        cost: { action: 'attack' },
        roll: { kind: 'none', attribute: 'resolve' },
        levels: buildLevels((lvl) => {
            const hl = pool[lvl - 1]!;
            const noun = hl === 1 ? 'Health Level' : 'Health Levels';
            const reach = isRanged
                ? 'on one creature within range'
                : 'on one creature you can touch or reach';
            return activeRow({
                type: 'Active, Support',
                range: isRanged ? rangedRange(lvl, 8) : MELEE_RANGE,
                aoe: R_NONE,
                effectText:
                    `You may spend this Power's Health Level Recovery pool to restore lost Health Levels ${reach}. ` +
                    `This Power restores no HP. **Pool:** restore up to **${hl} ${noun}** per Safe Haven Rest.`,
                specials: [],
                mechanics: {},
            });
        }),
    };
}

function cleanseAbsorptionTemplate(): PowerTemplate {
    return {
        templateId: 'active-cleanse-absorption',
        templateName: 'Cleanse Absorption',
        name: 'Cleanse Absorption',
        subfamily: 'support-cleanse',
        category: 'active',
        tags: ['spell'],
        spellHints: { defaultResolution: 'spellAttack' },
        fluff:
            'Strip eligible negative Specials from a target; if the full Cleanse value is spent, grant a chosen Absorption Bonus until end of combat.',
        cost: { action: 'attack' },
        roll: { kind: 'none', attribute: 'resolve' },
        levels: buildLevels((lvl) => {
            const rank = CLEANSE_ABSORPTION_RANK[lvl - 1]!;
            const bonus = CLEANSE_ABSORPTION_BONUS[lvl - 1]!;
            if (rank <= 0) {
                return activeRow({
                    type: 'Active, Support',
                    range: { kind: 'distance', m: 24 },
                    aoe: R_NONE,
                    effectText: 'No version.',
                    specials: [],
                    mechanics: {},
                });
            }
            return activeRow({
                type: 'Active, Support',
                range: { kind: 'distance', m: 24 },
                aoe: R_NONE,
                effectText:
                    `Reduce one eligible negative Special on the target by **${rank}**. ` +
                    `The Cleanse value cannot be split across several Specials. ` +
                    `If the full Cleanse value is spent, the target gains **Absorption Bonus ${bonus}** until end of combat. ` +
                    `Choose one Absorption type when this Power is learned: Damage, Speed, Armor, or Evade. Stackable.`,
                specials: [{ key: 'cleanse', rank }],
                mechanics: {},
            });
        }),
    };
}

function mentalAttackTemplate(): PowerTemplate {
    return {
        templateId: 'active-mental-attack',
        templateName: 'Mental Attack',
        name: 'Mental Attack',
        subfamily: 'mental',
        category: 'active',
        tags: ['spell', 'mental'],
        spellHints: { defaultResolution: 'spellAttack' },
        fluff:
            'Requires Telepathic Access. Psychic assault vs Mind Save; Mental Damage ignores Armor and does not target Evade.',
        cost: { action: 'attack' },
        roll: { kind: 'none', attribute: 'resolve' },
        levels: buildLevels((lvl) =>
            activeRow({
                type: 'Active, Mental',
                range: { kind: 'distance', m: 0, note: 'Telepathic Access' },
                aoe: R_NONE,
                effectText:
                    `Deal **${lvl}d8 Mental Damage**. On a successful Mind Save, the target takes half damage.`,
                dice: `${lvl}d8`,
                specials: [],
                mechanics: { damageRider: { flat: `+${lvl}d8` } },
            }),
        ),
    };
}

function mindIllusionTemplate(): PowerTemplate {
    return {
        templateId: 'active-mind-illusion',
        templateName: 'Mind Illusion',
        name: 'Mind Illusion',
        subfamily: 'mental',
        category: 'active',
        tags: ['spell', 'mental'],
        spellHints: { defaultResolution: 'spellAttack' },
        fluff:
            'Requires Telepathic Access. Personal false perceptions only — no real battlefield objects or direct control.',
        cost: { action: 'attack' },
        roll: { kind: 'none', attribute: 'resolve' },
        levels: buildLevels((lvl) => {
            const targets = MIND_ILLUSION_TARGETS[lvl - 1]!;
            const complexity = MIND_ILLUSION_COMPLEXITY[lvl - 1]!;
            const effect = MIND_ILLUSION_EFFECT[lvl - 1]!;
            return activeRow({
                type: 'Active, Mental',
                range: { kind: 'distance', m: 0, note: 'Telepathic Access' },
                aoe: { shape: 'none', targets: undefined, note: targets },
                duration: { kind: 'masteryRankRounds' },
                effectText:
                    `${effect} **Targets:** ${targets}. **Senses / Complexity:** ${complexity}. **Duration:** Mastery Rank rounds.`,
                specials: [],
                mechanics: { duration: 'masteryRankRounds' },
            });
        }),
    };
}

// Frozen, lazily-built export so TDZ issues don't strike at module load.
export const ACTIVE_TEMPLATES: PowerTemplate[] = buildActiveTemplates();
