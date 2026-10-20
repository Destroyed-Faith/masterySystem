/**
 * Passive Power Templates.
 *
 * Canonical source: `docs/passives.md` (Passive Design Rules + Catalog).
 *
 * Structure:
 *   - Base unconditional passives (one axis per template): Armor, Damage
 *     Reduction, Evade, Temporary HP, Healing, Phasing, Damage, Health,
 *     Awareness.
 *   - Conditional passives (one axis, gated on a combat condition): Armor
 *     (Stone Stance / Surrounded Bulwark), Evade (Flowing Step / Duelist
 *     Footwork), Damage (Momentum / Ambusher / Bloodlust / Executioner),
 *     Healing (Blood Feast / Battle Trance / Stillness Recovery).
 *   - Combined passives (two axes, unconditional): 12 entries per spec.
 *   - Conditional Combined passives (two axes, gated): 12 entries per spec.
 *   - Passive Special Aura: fixed +1 step on a chosen eligible Special(X),
 *     radius scales with level.
 *
 * Structural axes without a dedicated mechanics key (extra Health Bars and
 * Combat Senses) are encoded as narrative `effect.text`; the aggregator
 * falls back to descriptive behaviour for rows without a mechanical delta.
 */
import { buildLevels, passiveRow } from './_shared.js';
import { R05_PASSIVE_REGEN_POOL, regenerationCatalogText } from '../../../combat/r05-pools.js';
// ─── Per-spec progression tables ─────────────────────────────────────────
/** Fortified Frame — unconditional Armor (Rules/passives.md, 15 PP per +1). */
const ARMOR_UNCOND = [1, 3, 4, 5, 7, 8, 9, 11, 12, 13, 15, 16, 17, 19, 20, 21];
/** Conditional Armor (Stone Stance / Surrounded Bulwark; 7.5 PP / +1). */
const ARMOR_COND = [3, 5, 8, 10, 13, 16, 19, 21, 24, 27, 29, 32, 35, 37, 40, 43];
/** Conditional Evade (Flowing Step / Duelist Footwork; 15 PP / +1). */
const EVADE_COND = [1, 3, 4, 5, 7, 8, 9, 11, 12, 13, 15, 16, 17, 19, 20, 21];
/** Unconditional Evade curve (20 PP / +1). */
const EVADE_UNCOND = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
/** Initiative curve (10 PP / +1 Initiative). */
const INITIATIVE_UNCOND = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32];
/**
 * Passive: Temporary HP — 5 × PL (Expanded Playtest 2026-10-20).
 * Granted once at Combat start; no per-Round refresh.
 */
const TEMP_HP_UNCOND = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80];
/** ceil(PL / 2) — Enemy Evade Reduction, Self Cleanse, Spell Resistance Piercing. */
export function ceilPassiveHalfLevel(level) {
    const lvl = Math.max(0, Math.min(16, Math.floor(Number(level) || 0)));
    if (lvl <= 0)
        return 0;
    return Math.ceil(lvl / 2);
}
/** ceil(PL / 4) — Special Amplification. */
export function ceilPassiveQuarterLevel(level) {
    const lvl = Math.max(0, Math.min(16, Math.floor(Number(level) || 0)));
    if (lvl <= 0)
        return 0;
    return Math.ceil(lvl / 4);
}
/** Passive: Temporary HP amount at Power Level. */
export function passiveTemporaryHpForLevel(level) {
    const lvl = Math.max(1, Math.min(16, Math.floor(Number(level) || 1)));
    return TEMP_HP_UNCOND[lvl - 1];
}
/** Passive: Speed bonus meters (= PL). */
export function passiveSpeedMetersForLevel(level) {
    const lvl = Math.max(1, Math.min(16, Math.floor(Number(level) || 1)));
    return lvl;
}
/** R-05: ordinary HP-regen tables removed. Passive: Restoration uses R05_PASSIVE_REGEN_POOL. */
const RETIRED_HEAL_NOTE = 'Retired (R-05): ordinary HP healing was removed. Use Scarred Bar Restoration or Passive: Restoration.';
/** Killing Intent — unconditional Damage (banded; L1 empty, L4 = +2d8). */
const DMG_KILLING_INTENT = ['', '+1d8', '+1d8', '+2d8', '+2d8', '+3d8', '+3d8', '+4d8',
    '+4d8', '+5d8', '+5d8', '+6d8', '+6d8', '+7d8', '+7d8', '+8d8'];
/** Conditional Damage dice (Momentum, Ambusher, …; +1d8 per level). */
const DMG_COND = ['+1d8', '+2d8', '+3d8', '+4d8', '+5d8', '+6d8', '+7d8', '+8d8',
    '+9d8', '+10d8', '+11d8', '+12d8', '+13d8', '+14d8', '+15d8', '+16d8'];
/** Ward: Spell Resistance passive curve (15 PP / +1). */
const WARD_SPELL_RESISTANCE = [1, 2, 4, 5, 6, 8, 9, 10, 12, 13, 14, 16, 17, 18, 20, 21];
/** Ward: incoming Special reduction (plateaus per Rules/passive.md). */
const WARD_INCOMING = [1, 2, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10];
/** Thornhide — Thorns Nd8 when you take final HP damage (L1 empty). */
const THORNHIDE_DICE = [0, 1, 2, 2, 3, 4, 4, 5, 6, 6, 7, 8, 8, 9, 10, 10];
/** Passive Invisibility bonus = Power Level (rules: Bonus equals its Power Level). */
const INVIS_PASSIVE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
/** Passive Invisibility: extra Special Combat Sense selections at PL 4 / 8 / 12 / 15. */
const INVIS_PASSIVE_SENSES = [0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 4, 4];
/** Passive: Parry — printed maximum Parry Pool (ceil(5 × Level / 2), capped by the Parry Attribute at runtime). */
const PARRY_POOL = [3, 5, 8, 10, 13, 15, 18, 20, 23, 25, 28, 30, 33, 35, 38, 40];
/** Absorption — Temporary Colorless Stones per Scarred Health Bar (L1–2 = 1 … L15–16 = 8). */
export function absorptionStonesPerTrigger(level) {
    const lvl = Math.max(1, Math.min(16, Math.floor(Number(level) || 1)));
    return Math.ceil(lvl / 2);
}
/** Fortitude — Health Bar multiplier. Levels 1–3 are unavailable (stay ×4). */
export function fortitudeMultiplierForLevel(level) {
    const lvl = Math.max(1, Math.min(16, Math.floor(Number(level) || 1)));
    if (lvl <= 3)
        return 4;
    if (lvl <= 7)
        return 5;
    if (lvl <= 11)
        return 6;
    if (lvl <= 15)
        return 7;
    return 8;
}
/**
 * Damage Negation — combat reserve Damage Dice = 2 × Level
 * (playtest 2026-10-20; previously 4 × Level).
 */
const DAMAGE_NEGATION_RESERVE = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32];
/** Same numeric curve as Passive: Armor — reused by Passive: Armor Reduction. */
export const PASSIVE_ARMOR_CURVE = ARMOR_UNCOND;
function clampPassiveLevel(level) {
    const n = Math.floor(Number(level) || 0);
    return Math.max(1, Math.min(16, n));
}
/** Max Parry Pool dice for Passive: Parry at the given power level. */
export function passiveParryPoolForLevel(level) {
    return PARRY_POOL[clampPassiveLevel(level) - 1] ?? 0;
}
/** Combat Damage Negation reserve for Passive: Damage Negation at level. */
export function passiveDamageNegationReserveForLevel(level) {
    return DAMAGE_NEGATION_RESERVE[clampPassiveLevel(level) - 1] ?? 0;
}
/** Bound Host — Summon Tokens (+2 per level). */
const BOUND_HOST_TOKENS = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32];
/** Telepathy / Mind Link — range label per level. */
const TELEPATHY_RANGE = [
    '8 m', '16 m', '24 m', '32 m', '48 m', '64 m', '80 m', '100 m',
    '120 m', '160 m', '200 m', '300 m', '500 m', '1 km', '5 km', 'Same region, GM permission',
];
/** Telepathy / Mind Link — linked willing creatures label per level. */
const TELEPATHY_LINKS = [
    '1 willing creature', '1 willing creature', '2 willing creatures', '2 willing creatures',
    '3 willing creatures', '3 willing creatures', '4 willing creatures', '4 willing creatures',
    '5 willing creatures', '5 willing creatures', '6 willing creatures', '6 willing creatures',
    'MR + 2 willing creatures', 'MR + 2 willing creatures', 'MR + 3 willing creatures', 'MR + 4 willing creatures',
];
/** Telepathy / Mind Link — feature text per level (Rules/passives.md printed table).
 * Telepathy never reads unwilling minds (that requires Mind Probe); no "Mind Save" exists. */
const TELEPATHY_FEATURE = [
    'Send simple silent words to one willing creature within range.',
    'You and the linked creature may communicate silently in both directions.',
    'Maintain a small Mind Link between yourself and up to two willing creatures.',
    'Simple meaning, emotion, direction, and intent no longer require a shared spoken language.',
    'Send one simple image, emotion, sensation, or sensory impression through the link.',
    'All linked willing creatures may communicate silently through you.',
    'A willing linked creature may deliberately share one simple sensory impression with you.',
    'Detect the presence of thinking minds within range. This reveals presence only, not identity, exact thoughts, creature type, or precise location.',
    'A willing linked creature may share one brief memory fragment lasting only a few seconds as it remembers it.',
    'A willing linked creature may share one active sense with you, such as sight or hearing, while the link is maintained.',
    'A Mind Link may pass through normal walls or obstacles if you know the linked creature and it remains within range.',
    'Share sight and hearing with one willing linked creature while the link is maintained.',
    'Your Mind Link becomes a mental conference. All linked willing creatures may communicate silently with each other.',
    'Maintain a link to a known willing creature at long range if the link was willingly established.',
    'A willing linked creature may deliberately share one complete remembered scene, including its sensory and emotional impressions.',
    'Maintain a wide Mind Link with known willing creatures across a large area. Wards, planar separation, divine interference, or narrative barriers may still block it.',
];
function deepVitalityBars(lvl) {
    if (lvl <= 3)
        return { wounded: 1, injured: 0, bruised: 0, healthy: 0 };
    if (lvl <= 7)
        return { wounded: 1, injured: 1, bruised: 0, healthy: 0 };
    if (lvl <= 11)
        return { wounded: 1, injured: 1, bruised: 1, healthy: 0 };
    return { wounded: 1, injured: 1, bruised: 1, healthy: 1 };
}
function combinedHealthBars(lvl) {
    if (lvl <= 3)
        return { wounded: 0, injured: 0, bruised: 0, healthy: 0 };
    if (lvl <= 7)
        return { wounded: 1, injured: 0, bruised: 0, healthy: 0 };
    if (lvl <= 11)
        return { wounded: 1, injured: 1, bruised: 0, healthy: 0 };
    return { wounded: 1, injured: 1, bruised: 1, healthy: 0 };
}
function healthBarText(h) {
    const parts = [];
    if (h.wounded)
        parts.push(`**+${h.wounded} Wounded Health Bar${h.wounded > 1 ? 's' : ''}**`);
    if (h.injured)
        parts.push(`**+${h.injured} Injured Health Bar${h.injured > 1 ? 's' : ''}**`);
    if (h.bruised)
        parts.push(`**+${h.bruised} Bruised Health Bar${h.bruised > 1 ? 's' : ''}**`);
    if (h.healthy)
        parts.push(`**+${h.healthy} Healthy Health Bar${h.healthy > 1 ? 's' : ''}**`);
    if (parts.length === 0)
        return '';
    if (parts.length === 1)
        return parts[0];
    if (parts.length === 2)
        return `${parts[0]} and ${parts[1]}`;
    return `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`;
}
// Awareness / Combat Sense progression (Heightened Senses unconditional).
function combatSenseCount(lvl) {
    if (lvl <= 3)
        return { count: 0, presence: false };
    if (lvl <= 7)
        return { count: 1, presence: false };
    if (lvl <= 11)
        return { count: 2, presence: false };
    if (lvl <= 14)
        return { count: 3, presence: true };
    return { count: 4, presence: true };
}
// Combined Awareness progression (fewer milestones vs the pure Heightened Senses).
function combinedSenseCount(lvl) {
    if (lvl <= 3)
        return { count: 0, presence: false };
    if (lvl <= 11)
        return { count: 1, presence: false };
    return { count: 2, presence: true };
}
/** Conditional Awareness combined passives (L4+ sense milestones). */
function conditionalSenseCount(lvl) {
    return combinedSenseCount(lvl);
}
/** Damage Reduction step by level per spec (closed subsystem). */
function damageReductionPct(lvl) {
    if (lvl <= 2)
        return 0;
    if (lvl <= 7)
        return 10;
    if (lvl <= 14)
        return 20;
    return 30;
}
/**
 * Ghostform Phasing / Passive Critical / Passive Maximization combat charges.
 * PL 1–3 unavailable (0); PL 4–7 → 1; PL 8–14 → 2; PL 15–16 → 3.
 */
export function phasingStyleCombatCharges(lvl) {
    const level = Math.max(1, Math.min(16, Math.floor(Number(lvl) || 1)));
    if (level <= 3)
        return 0;
    if (level <= 7)
        return 1;
    if (level <= 14)
        return 2;
    return 3;
}
/** @deprecated Prefer {@link phasingStyleCombatCharges}. */
function phasingCharges(lvl) {
    return phasingStyleCombatCharges(lvl);
}
/** Armor Reduction ignored against the holder's eligible damaging attacks. */
export function passiveArmorReductionForLevel(level) {
    return PASSIVE_ARMOR_CURVE[clampPassiveLevel(level) - 1] ?? 0;
}
/** Special Aura radius (meters) by level. */
function specialAuraRadius(lvl) {
    const table = [0, 0, 0, 2, 3, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 8];
    return table[lvl - 1];
}
// ─── Factory helper ──────────────────────────────────────────────────────
function basePassive(def) {
    return {
        templateId: def.id,
        templateName: def.name,
        name: `Passive: ${def.name}`,
        subfamily: def.subfamily,
        category: 'passive',
        tags: def.tags ?? [],
        fluff: def.fluff,
        cost: { action: 'none' },
        roll: { kind: 'none' },
        ...(def.requiresEcho ? { requiresEcho: def.requiresEcho } : {}),
        levels: buildLevels((lvl) => {
            const row = def.perLevel(lvl);
            return passiveRow({
                type: def.passiveType,
                effectText: row.text,
                mechanics: row.mechanics,
            });
        }),
    };
}
// ─── Combined Passive per-level tables (spec) ────────────────────────────
// Combined passive half-axis tables (L1 often single-axis only; see Passives.md).
/** Evade half for Evade+THP / Evade+Healing (20 PP / +1; L1 often Evade 0). */
const COMB_EVADE_HALF = [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8];
/** Evade half for Evade+Damage (starts at +1 Evade on L1). */
const COMB_EVADE_DMG_EV = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8];
const THP_5 = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80];
/** Healing paired with Evade+Healing (half-budget 8 PP / HP). */
const COMB_EVADE_HEAL_HP = [1, 2, 3, 5, 6, 7, 8, 10, 11, 12, 13, 15, 16, 17, 18, 20];
const COMB_HEAL = [2, 5, 7, 10, 12, 15, 17, 20, 22, 25, 27, 30, 32, 35, 37, 40];
const COMB_DMG_BANDED = ['', '', '', '+2d8', '+2d8', '+3d8', '+3d8', '+4d8', '+4d8', '+5d8', '+5d8', '+6d8', '+6d8', '+7d8', '+7d8', '+8d8'];
/** Damage paired with Evade+Damage (40 PP / +1d8 half-budget). */
const COMB_EVADE_DMG_DMG = ['', '', '', '+1d8', '+1d8', '+1d8', '+1d8', '+2d8', '+2d8', '+2d8', '+2d8', '+3d8', '+3d8', '+3d8', '+3d8', '+4d8'];
/** Conditional-combined Evade half (15 PP / +1). Shared by Evade+THP/Healing CC (L1 = 0). */
const CC_EVADE_HALF = [0, 1, 2, 2, 3, 4, 4, 5, 6, 6, 7, 8, 8, 9, 10, 10];
/** Conditional Evade+Damage evade half — L1 starts at +1. */
const CC_EVADE_DMG_EV = [1, 1, 2, 2, 3, 4, 4, 5, 6, 6, 7, 8, 8, 9, 10, 10];
const CC_HALF = [1, 2, 4, 5, 6, 8, 9, 10, 12, 13, 14, 16, 17, 18, 20, 21];
const CC_HEAL = [3, 6, 10, 13, 16, 20, 23, 26, 30, 33, 36, 40, 43, 46, 50, 53];
/** Healing for conditional Evade+Healing (4 PP / HP half-budget). */
const CC_EVADE_HEAL_HP = [2, 5, 7, 10, 12, 15, 17, 20, 22, 25, 27, 30, 32, 35, 37, 40];
const CC_DMG_BANDED = ['', '+1d8', '+2d8', '+2d8', '+3d8', '+4d8', '+4d8', '+5d8', '+6d8', '+6d8', '+7d8', '+8d8', '+8d8', '+9d8', '+10d8', '+10d8'];
/** Damage for conditional Evade+Damage (20 PP / +1d8 half-budget). */
const CC_EVADE_DMG_DMG = ['', '+1d8', '+1d8', '+2d8', '+2d8', '+3d8', '+3d8', '+4d8', '+4d8', '+5d8', '+5d8', '+6d8', '+6d8', '+7d8', '+7d8', '+8d8'];
/** Rules/passives.md Armor + Healing / Armor + Temporary HP / Armor + Health. */
const COMB_ARMOR_HALF = [1, 1, 2, 3, 3, 4, 5, 5, 6, 7, 7, 8, 9, 9, 10, 11];
const COMB_ARMOR_HEAL_HP = [1, 2, 3, 5, 6, 7, 8, 10, 11, 12, 13, 15, 16, 17, 18, 20];
const COMB_ARMOR_THP = { armor: COMB_ARMOR_HALF, thp: THP_5 };
const COMB_ARMOR_HEAL = { armor: COMB_ARMOR_HALF, heal: COMB_ARMOR_HEAL_HP };
const COMB_ARMOR_HEALTH = { armor: COMB_ARMOR_HALF };
const COMB_EVADE_THP = { evade: COMB_EVADE_HALF, thp: THP_5 };
const COMB_EVADE_HEAL = { evade: COMB_EVADE_HALF, heal: COMB_EVADE_HEAL_HP };
const COMB_EVADE_DMG = { evade: COMB_EVADE_DMG_EV, dmg: COMB_EVADE_DMG_DMG };
const COMB_DMG_HEAL = { dmg: COMB_DMG_BANDED, heal: COMB_HEAL };
const COMB_DMG_THP = { dmg: COMB_DMG_BANDED, thp: THP_5 };
const COMB_AWARE_EVADE = { evade: COMB_EVADE_HALF };
const COMB_AWARE_DMG = { dmg: COMB_DMG_BANDED };
const COMB_HEALTH_THP = { thp: THP_5 };
const CC_ARMOR_THP = { armor: CC_HALF, thp: THP_5 };
const CC_ARMOR_HEAL = { armor: CC_HALF, heal: CC_HEAL };
const CC_ARMOR_HEALTH = { armor: CC_HALF };
const CC_EVADE_THP = { evade: CC_EVADE_HALF, thp: THP_5 };
const CC_EVADE_HEAL = { evade: CC_EVADE_HALF, heal: CC_EVADE_HEAL_HP };
const CC_EVADE_DMG = { evade: CC_EVADE_DMG_EV, dmg: CC_EVADE_DMG_DMG };
const CC_DMG_HEAL = { dmg: CC_DMG_BANDED, heal: CC_HEAL };
const CC_DMG_THP = { dmg: CC_DMG_BANDED, thp: THP_5 };
const CC_AWARE_EVADE = { evade: CC_EVADE_HALF };
const CC_AWARE_DMG = { dmg: CC_DMG_BANDED };
const CC_HEALTH_THP = { thp: THP_5 };
// ─── Helpers for sense-milestone text ────────────────────────────────────
function senseText(info) {
    if (info.count === 0)
        return '';
    const plural = info.count === 1 ? '' : 's total';
    const presence = info.presence ? ' **Presence Sense** is available.' : '';
    return `Choose **${info.count} Combat Sense${plural}**.${presence}`;
}
// ─── Buff Empowerment (artifact lineage meta-passives) ───────────────────
/**
 * Empower amount per Power Level. Banded so an artifact's Stage I / II / III
 * (which read PL 4 / 10 / 16) resolve to +1 / +2 / +3 — matching the authored
 * Elven Stride lineage lines (Ember Surge / Stoneweave Guard / Tidal Slip /
 * Wind-First). These are artifact-only meta-passives with no stat delta of
 * their own; they raise the Power Level + duration of a matching Active Buff.
 */
const BUFF_EMPOWER = [1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3];
/**
 * Artifact lineage meta — not Combat Passive Slot picks and not Add-Power
 * catalog entries (`artifact-only`). Names omit redundant "Buff" (the effect
 * always targets an Active Buff axis).
 */
function empowermentPassive(def) {
    return {
        templateId: def.id,
        templateName: def.name,
        name: `Artifact: ${def.name}`,
        subfamily: 'buff-empowerment',
        category: 'passive',
        tags: ['artifact-only'],
        fluff: 'A lineage gift that pushes one kind of Active Buff past its normal limits.',
        cost: { action: 'none' },
        roll: { kind: 'none' },
        levels: buildLevels((lvl) => {
            const amt = BUFF_EMPOWER[lvl - 1];
            const rounds = amt === 1 ? '1 round' : `${amt} rounds`;
            return passiveRow({
                type: 'Support',
                effectText: `When you activate an Active Buff that grants ${def.axisLabel} as one of its effects, ` +
                    `you may increase that Buff's effective Power Level by +${amt} and its duration by +${rounds}. ` +
                    `Uses per Safe Haven Rest: half Mastery Rank, rounded up. The Active Buff cannot exceed Power Level 16.`,
            });
        }),
    };
}
/** Damage / Armor / Evade / Wind empowerment lineage (artifact grants only). */
const EMPOWER_BUFF_TEMPLATES = [
    empowermentPassive({ id: 'empower-buff-damage', name: 'Damage Empowerment', axisLabel: 'Damage' }),
    empowermentPassive({ id: 'empower-buff-armor', name: 'Armor Empowerment', axisLabel: 'Armor' }),
    empowermentPassive({ id: 'empower-buff-evade', name: 'Evade Empowerment', axisLabel: 'Evade' }),
    empowermentPassive({
        id: 'empower-buff-wind',
        name: 'Wind Empowerment',
        axisLabel: 'Evade or movement-related positioning',
    }),
];
/** Duration extension only (Wyrm / Serpent Scales). Same PL banding as empowerment. */
function buffExtensionPassive(def) {
    return {
        templateId: def.id,
        templateName: def.name,
        name: `Artifact: ${def.name}`,
        subfamily: 'buff-extension',
        category: 'passive',
        tags: ['artifact-only'],
        fluff: 'Extends how long a matching Active Buff stays active.',
        cost: { action: 'none' },
        roll: { kind: 'none' },
        levels: buildLevels((lvl) => {
            const rounds = BUFF_EMPOWER[lvl - 1];
            const roundText = rounds === 1 ? '1 round' : `${rounds} rounds`;
            return passiveRow({
                type: 'Support',
                effectText: `${def.axisLabel} Active Buffs gain +${roundText} duration.`,
            });
        }),
    };
}
const BUFF_EXTENSION_TEMPLATES = [
    buffExtensionPassive({
        id: 'extend-buff-armor',
        name: 'Armor Extension',
        axisLabel: 'Armor',
    }),
    buffExtensionPassive({
        id: 'extend-buff-damage-reduction',
        // Extends Active Buff: Damage Reduction — not Passive: Damage Reduction.
        name: 'Damage Reduction Extension',
        axisLabel: 'Damage Reduction',
    }),
    buffExtensionPassive({
        id: 'extend-buff-evade',
        name: 'Evade Extension',
        axisLabel: 'Evade',
    }),
];
function mobilityBuffExtensionPassive() {
    return {
        templateId: 'extend-buff-mobility',
        templateName: 'Mobility Extension',
        name: 'Artifact: Mobility Extension',
        subfamily: 'buff-extension',
        category: 'passive',
        tags: ['artifact-only'],
        fluff: 'Extends Evade- and Movement-granting Active Buffs without increasing their value.',
        cost: { action: 'none' },
        roll: { kind: 'none' },
        levels: buildLevels((lvl) => {
            const rounds = BUFF_EMPOWER[lvl - 1];
            const roundText = rounds === 1 ? '1 round' : `${rounds} rounds`;
            return passiveRow({
                type: 'Support',
                effectText: `Whenever you activate an Active Buff that grants Evade or Movement as one of its effects, increase that Buff's duration by **+${roundText}**. This does not increase the Buff's value. This does not allow you to maintain a second Active Buff.`,
            });
        }),
    };
}
/** Permanent shared Echo Armor value on body frames (Oracle / Sentinel / Judicator). */
const ECHO_ARMOR_VALUE_PASSIVE = {
    templateId: 'passive-echo-armor-value',
    templateName: 'Echo Armor Value',
    name: 'Artifact: Echo Armor Value',
    subfamily: 'armor',
    category: 'passive',
    tags: ['artifact-only'],
    fluff: 'The artifact’s permanent body armor bonus scales with its level.',
    cost: { action: 'none' },
    roll: { kind: 'none' },
    levels: buildLevels(() => passiveRow({
        type: 'Support',
        effectText: 'Gain the shared Echo Armor value for this Artifact Level (see Base Values). This is permanent body armor, not an Active Buff.',
    })),
};
// ─── Templates ───────────────────────────────────────────────────────────
/** Retired: Combat Senses use the Sense Slot — not Awareness Passives (Rules v0.9.8 / agent.md). */
const RETIRED_AWARENESS_PASSIVE_IDS = new Set([
    'passive-heightened-senses',
    'passive-awareness-evade',
    'passive-awareness-damage',
    'conditional-passive-awareness-evade',
    'conditional-passive-awareness-damage',
]);
/** v0.9.9.5: Combined and Conditional Passives are retired. Templates stay defined so owned items still resolve. */
const RETIRED_COMBINED_PASSIVE_IDS = new Set([
    'passive-stone-stance',
    'passive-surrounded-bulwark',
    'passive-flowing-step',
    'passive-duelist-footwork',
    'passive-momentum',
    'passive-ambusher',
    'passive-bloodlust',
    'passive-executioner',
    'passive-blood-feast',
    'passive-battle-trance',
    'passive-stillness-recovery',
    'passive-armor-temp-hp',
    'passive-armor-healing',
    'passive-armor-health',
    'passive-evade-temp-hp',
    'passive-evade-healing',
    'passive-evade-damage',
    'passive-damage-healing',
    'passive-damage-temp-hp',
    'passive-health-healing',
    'passive-health-temp-hp',
    'conditional-passive-armor-temp-hp',
    'conditional-passive-armor-healing',
    'conditional-passive-armor-health',
    'conditional-passive-evade-temp-hp',
    'conditional-passive-evade-healing',
    'conditional-passive-evade-damage',
    'conditional-passive-damage-healing',
    'conditional-passive-damage-temp-hp',
    'conditional-passive-health-healing',
    'conditional-passive-health-temp-hp',
]);
const RAW_PASSIVE_TEMPLATES = [
    // ─── Base unconditional (Armor / DR / Evade / THP / Healing / Phasing / Damage / Health) ───
    basePassive({
        id: 'passive-fortified-frame', name: 'Armor', subfamily: 'armor',
        fluff: 'Your body learns to carry steel as if it were a second skin.',
        perLevel: (lvl) => ({
            text: `Gain **+${ARMOR_UNCOND[lvl - 1]} Armor**.`,
            mechanics: { armor: ARMOR_UNCOND[lvl - 1] },
        }),
    }),
    basePassive({
        id: 'passive-damage-reduction', name: 'Damage Reduction', subfamily: 'damage-reduction',
        fluff: 'Blows, blasts, and spells find you stubbornly harder to harm.',
        perLevel: (lvl) => {
            const pct = damageReductionPct(lvl);
            return pct === 0
                ? {
                    text: 'Damage Reduction starts at Level 3 (10%).',
                    mechanics: { damageReductionPct: 0 },
                }
                : { text: `Gain **${pct}% Damage Reduction**.`, mechanics: { damageReductionPct: pct } };
        },
    }),
    basePassive({
        id: 'passive-evade', name: 'Evade', subfamily: 'evade',
        fluff: 'You are not faster in one moment. You are harder to catch in every moment.',
        perLevel: (lvl) => ({
            text: `Gain **+${EVADE_UNCOND[lvl - 1]} Evade**.`,
            mechanics: { evade: EVADE_UNCOND[lvl - 1] },
        }),
    }),
    basePassive({
        id: 'passive-initiative', name: 'Initiative', subfamily: 'initiative',
        passiveType: 'Initiative',
        fluff: 'You enter combat already moving through possibilities that others have not yet recognized.',
        perLevel: (lvl) => ({
            text: `Gain **+${INITIATIVE_UNCOND[lvl - 1]} Initiative**.`,
            mechanics: { initiative: INITIATIVE_UNCOND[lvl - 1] },
        }),
    }),
    basePassive({
        id: 'passive-temp-hp', name: 'Temporary HP', subfamily: 'temp-hp',
        fluff: 'A distinct Temporary HP buffer granted once at Combat start while slotted. It lasts until depleted or Combat end and never refreshes from Active Buff Preparation.',
        perLevel: (lvl) => {
            const thp = TEMP_HP_UNCOND[lvl - 1];
            return {
                text: `While slotted, at Combat start (before any legal combat damage), gain **${thp} Temporary HP** (5 × Power Level). ` +
                    `The pool remains until depleted or Combat end. Does not heal real HP, restore Scarred Bars, or trigger Absorption. ` +
                    `Distinct from Active Buff / Stone / Reaction Temporary HP sources.`,
                mechanics: { triggers: { combatStart: { tempHP: String(thp) } } },
            };
        },
    }),
    basePassive({
        // Short name only — basePassive prefixes `Passive: ` (never put Passive: here).
        id: 'passive-regeneration', name: 'Regeneration', subfamily: 'regen',
        fluff: 'Your body reclaims what was lost: scarred vitality knits back to full strength, a few times each Tyhran Day.',
        perLevel: (lvl) => {
            const pool = R05_PASSIVE_REGEN_POOL[lvl - 1] ?? 0;
            return {
                text: regenerationCatalogText(lvl),
                mechanics: pool > 0
                    ? { scarredBarRestoration: { pool, period: 'tyhranDay', target: 'self' } }
                    : {},
            };
        },
    }),
    basePassive({
        id: 'passive-ghostform', name: 'Phasing', subfamily: 'phasing',
        fluff: 'Your body no longer fully agrees to be where the world says it is.',
        perLevel: (lvl) => {
            const charges = phasingCharges(lvl);
            return charges === 0
                ? { text: '—', mechanics: {} }
                : {
                    text: `At the start of combat, gain **${charges} Phasing charge${charges === 1 ? '' : 's'}**. Each charge lets you ignore one hit against you.`,
                    mechanics: { phasing: { combatStart: { charges } } },
                };
        },
    }),
    basePassive({
        id: 'passive-killing-intent', name: 'Damage', subfamily: 'damage',
        fluff: 'Your blows carry more weight because your intent no longer wavers.',
        perLevel: (lvl) => {
            const dice = DMG_KILLING_INTENT[lvl - 1];
            return dice
                ? { text: `Gain **${dice} Damage** on all damage rolls you make.`,
                    mechanics: { damageRider: { flat: dice } } }
                : { text: '—', mechanics: {} };
        },
    }),
    basePassive({
        id: 'passive-deep-vitality', name: 'Health', subfamily: 'health',
        fluff: 'Your body does not merely endure more punishment. It learns to fail more slowly.',
        perLevel: (lvl) => ({
            text: `Gain ${healthBarText(deepVitalityBars(lvl))}.`,
            mechanics: {},
        }),
    }),
    basePassive({
        id: 'passive-fortitude', name: 'Fortitude', subfamily: 'health',
        passiveType: 'Passive, Health',
        fluff: 'Fortitude enlarges each normal Health Bar. It does not add bars, heal, or reopen Scarred bars. Cannot be slotted with Passive: Health.',
        perLevel: (lvl) => {
            const mult = fortitudeMultiplierForLevel(lvl);
            if (lvl <= 3) {
                return { text: 'Unavailable. No effect at this Power Level.', mechanics: {} };
            }
            return {
                text: `Each normal Health Bar holds **Vitality × ${mult}** while this Passive is slotted.`,
                mechanics: { healthBarMultiplier: mult },
            };
        },
    }),
    basePassive({
        id: 'passive-heightened-senses', name: 'Heightened Senses', subfamily: 'awareness',
        fluff: 'You no longer trust only your eyes. The world reaches you through sound, pressure, breath, and presence.',
        perLevel: (lvl) => {
            const info = combatSenseCount(lvl);
            return info.count === 0
                ? { text: '—', mechanics: {} }
                : { text: senseText(info), mechanics: {} };
        },
    }),
    // ─── Ward passives (Spell Resistance / Ward) ───────────────────────────
    basePassive({
        id: 'passive-spell-resistance', name: 'Spell Resistance', subfamily: 'ward',
        passiveType: 'Passive, Ward',
        fluff: 'Your body, mind, soul, or warding pattern rejects hostile spell structure.',
        perLevel: (lvl) => ({
            text: `Gain **+${WARD_SPELL_RESISTANCE[lvl - 1]} Spell Resistance**.`,
            mechanics: { spellResistance: WARD_SPELL_RESISTANCE[lvl - 1] },
        }),
    }),
    basePassive({
        id: 'passive-ward', name: 'Special Negation', subfamily: 'ward',
        passiveType: 'Passive, Special Negation',
        fluff: 'Whenever an eligible hostile Special(X) would be applied, reduce its value by Special Negation before it is applied.',
        perLevel: (lvl) => {
            const amt = WARD_INCOMING[lvl - 1];
            return {
                text: `Reduce every incoming eligible hostile Special by **${amt}**.`,
                mechanics: { wardIncoming: amt },
            };
        },
    }),
    // ─── Conditional base passives (Armor / Evade / Damage / Healing) ───
    basePassive({
        id: 'passive-stone-stance', name: 'Armor (Moved 0 m Last Turn)', subfamily: 'armor',
        fluff: 'You become hardest to break when you refuse to yield even a step.',
        perLevel: (lvl) => ({
            text: `If you moved **0 m** on your last turn, gain **+${ARMOR_COND[lvl - 1]} Armor** until the start of your next turn.`,
            mechanics: { armor: ARMOR_COND[lvl - 1], conditionExpr: 'self.lastTurnMoved == 0' },
        }),
    }),
    basePassive({
        id: 'passive-surrounded-bulwark', name: 'Armor (Adjacent to 2+ Enemies)', subfamily: 'armor',
        fluff: 'A single enemy can test you. A crowd only gives you something to brace against.',
        perLevel: (lvl) => ({
            text: `While adjacent to at least **two enemies**, gain **+${ARMOR_COND[lvl - 1]} Armor**.`,
            mechanics: { armor: ARMOR_COND[lvl - 1], conditionExpr: 'self.adjacentEnemies >= 2' },
        }),
    }),
    basePassive({
        id: 'passive-flowing-step', name: 'Evade (Moved 8+ m This Turn)', subfamily: 'evade',
        fluff: 'You are safest when you refuse to become a fixed point.',
        perLevel: (lvl) => ({
            text: `If you moved at least **8 m** on your turn, gain **+${EVADE_COND[lvl - 1]} Evade** until the start of your next turn.`,
            mechanics: { evade: EVADE_COND[lvl - 1], conditionExpr: 'self.turnMoved >= 8' },
        }),
    }),
    basePassive({
        id: 'passive-duelist-footwork', name: 'Evade (Exactly 1 Adjacent Enemy)', subfamily: 'evade',
        fluff: 'You do not dodge the battlefield. You reduce it to a duel.',
        perLevel: (lvl) => ({
            text: `While exactly **one enemy** is adjacent to you, gain **+${EVADE_COND[lvl - 1]} Evade**.`,
            mechanics: { evade: EVADE_COND[lvl - 1], conditionExpr: 'self.adjacentEnemies == 1' },
        }),
    }),
    basePassive({
        id: 'passive-momentum', name: 'Damage (Moved 8+ m This Turn)', subfamily: 'damage',
        fluff: 'Speed becomes weight. Weight becomes impact.',
        perLevel: (lvl) => ({
            text: `If you moved at least **8 m** this turn, gain **${DMG_COND[lvl - 1]} Damage** on all damage rolls you make until the end of your turn.`,
            mechanics: { damageRider: { flat: DMG_COND[lvl - 1] }, conditionExpr: 'self.turnMoved >= 8' },
        }),
    }),
    basePassive({
        id: 'passive-ambusher', name: 'Damage (Target Cannot Perceive You)', subfamily: 'damage',
        fluff: 'The wound arrives before the enemy understands where you are.',
        perLevel: (lvl) => ({
            text: `Against a target that cannot see or otherwise perceive you, gain **${DMG_COND[lvl - 1]} Damage** on damage rolls you make.`,
            mechanics: { damageRider: { flat: DMG_COND[lvl - 1] }, conditionExpr: 'target.unseenBySelf' },
        }),
    }),
    basePassive({
        id: 'passive-bloodlust', name: 'Damage (Affected by Lacerate)', subfamily: 'damage',
        fluff: 'Your own blood teaches your hands to stop hesitating.',
        perLevel: (lvl) => ({
            text: `While you are affected by **Lacerate**, gain **${DMG_COND[lvl - 1]} Damage** on all damage rolls you make.`,
            mechanics: { damageRider: { flat: DMG_COND[lvl - 1] }, conditionExpr: 'self.hasSpecial.lacerate' },
        }),
    }),
    basePassive({
        id: 'passive-executioner', name: 'Damage (Target Injured or Worse)', subfamily: 'damage',
        fluff: 'You do not waste strength on enemies who have not started dying.',
        perLevel: (lvl) => ({
            text: `Against targets that are **Injured or worse**, gain **${DMG_COND[lvl - 1]} Damage** on damage rolls you make.`,
            mechanics: { damageRider: { flat: DMG_COND[lvl - 1] }, conditionExpr: 'target.healthState <= injured' },
        }),
    }),
    basePassive({
        id: 'passive-blood-feast', name: 'Blood Feast (Retired)', subfamily: 'recovery',
        fluff: 'Pain opens the hunger that keeps you standing. (Retired in R-05.)',
        perLevel: () => ({
            text: RETIRED_HEAL_NOTE,
            mechanics: {},
        }),
    }),
    basePassive({
        id: 'passive-battle-trance', name: 'Battle Trance (Retired)', subfamily: 'recovery',
        fluff: 'The closer death stands, the clearer your body remembers how to live. (Retired in R-05.)',
        perLevel: () => ({
            text: RETIRED_HEAL_NOTE,
            mechanics: {},
        }),
    }),
    basePassive({
        id: 'passive-stillness-recovery', name: 'Stillness Recovery (Retired)', subfamily: 'recovery',
        fluff: 'Breath returns where motion ends. (Retired in R-05.)',
        perLevel: () => ({
            text: RETIRED_HEAL_NOTE,
            mechanics: {},
        }),
    }),
    // ─── Combined (unconditional) ────────────────────────────────────────
    basePassive({
        id: 'passive-armor-temp-hp', name: 'Armor + Temporary HP', subfamily: 'combined',
        fluff: 'Hardened frame plus a renewing buffer.',
        perLevel: (lvl) => {
            const thp = COMB_ARMOR_THP.thp[lvl - 1];
            const arm = COMB_ARMOR_THP.armor[lvl - 1];
            const text = arm > 0
                ? `Gain **+${arm} Armor**. At the start of combat, gain **${thp} Temporary HP**.`
                : `At the start of combat, gain **${thp} Temporary HP**.`;
            return {
                text,
                mechanics: {
                    ...(arm > 0 ? { armor: arm } : {}),
                    triggers: { combatStart: { tempHP: String(thp) } },
                },
            };
        },
    }),
    basePassive({
        id: 'passive-armor-healing', name: 'Armor (R-05 Retired Combo)', subfamily: 'combined',
        fluff: 'You are hard to hurt. (HP-regen half retired in R-05.)',
        perLevel: (lvl) => {
            const arm = COMB_ARMOR_HEAL.armor[lvl - 1];
            return {
                text: arm > 0 ? `Gain **+${arm} Armor**. HP regen retired (R-05).` : RETIRED_HEAL_NOTE,
                mechanics: arm > 0 ? { armor: arm } : {},
            };
        },
    }),
    basePassive({
        id: 'passive-armor-health', name: 'Armor + Health', subfamily: 'combined',
        fluff: 'Tough skin, deep reserves.',
        perLevel: (lvl) => {
            const arm = COMB_ARMOR_HEALTH.armor[lvl - 1];
            if (arm <= 0)
                return { text: '—', mechanics: {} };
            const bars = combinedHealthBars(lvl);
            const barStr = healthBarText(bars);
            const armorStr = `**+${arm} Armor**`;
            const text = barStr ? `Gain ${armorStr} and ${barStr}.` : `Gain ${armorStr}.`;
            return { text, mechanics: { armor: arm } };
        },
    }),
    basePassive({
        id: 'passive-evade-temp-hp', name: 'Evade + Temporary HP', subfamily: 'combined',
        fluff: 'Slip what you can; buffer what you can’t.',
        perLevel: (lvl) => {
            const thp = COMB_EVADE_THP.thp[lvl - 1];
            const ev = COMB_EVADE_THP.evade[lvl - 1];
            const text = ev > 0
                ? `Gain **+${ev} Evade**. At the start of combat, gain **${thp} Temporary HP**.`
                : `At the start of combat, gain **${thp} Temporary HP**.`;
            return {
                text,
                mechanics: {
                    ...(ev > 0 ? { evade: ev } : {}),
                    triggers: { combatStart: { tempHP: String(thp) } },
                },
            };
        },
    }),
    basePassive({
        id: 'passive-evade-healing', name: 'Evade (R-05 Retired Combo)', subfamily: 'combined',
        fluff: 'Hard to hit. (HP-regen half retired in R-05.)',
        perLevel: (lvl) => {
            const ev = COMB_EVADE_HEAL.evade[lvl - 1];
            return {
                text: ev > 0 ? `Gain **+${ev} Evade**. HP regen retired (R-05).` : RETIRED_HEAL_NOTE,
                mechanics: ev > 0 ? { evade: ev } : {},
            };
        },
    }),
    basePassive({
        id: 'passive-evade-damage', name: 'Evade + Damage', subfamily: 'combined',
        fluff: 'Nimble fighter, dangerous strikes.',
        perLevel: (lvl) => {
            const ev = COMB_EVADE_DMG.evade[lvl - 1];
            const dmg = COMB_EVADE_DMG.dmg[lvl - 1];
            if (ev <= 0)
                return { text: '—', mechanics: {} };
            const tailText = dmg ? ` and **${dmg} Damage** on all damage rolls you make` : '';
            return {
                text: `Gain **+${ev} Evade**${tailText}.`,
                mechanics: {
                    evade: ev,
                    ...(dmg ? { damageRider: { flat: dmg } } : {}),
                },
            };
        },
    }),
    basePassive({
        id: 'passive-damage-healing', name: 'Damage (R-05 Retired Combo)', subfamily: 'combined',
        fluff: 'You hurt them. (HP-regen half retired in R-05.)',
        perLevel: (lvl) => {
            const dmg = COMB_DMG_HEAL.dmg[lvl - 1];
            return {
                text: dmg ? `Gain **${dmg} Damage** on all damage rolls you make. HP regen retired (R-05).` : RETIRED_HEAL_NOTE,
                mechanics: dmg ? { damageRider: { flat: dmg } } : {},
            };
        },
    }),
    basePassive({
        id: 'passive-damage-temp-hp', name: 'Damage + Temporary HP', subfamily: 'combined',
        fluff: 'Your aggression steels you against retaliation.',
        perLevel: (lvl) => {
            const dmg = COMB_DMG_THP.dmg[lvl - 1];
            const thp = COMB_DMG_THP.thp[lvl - 1];
            const head = dmg ? `Gain **${dmg} Damage** on all damage rolls you make. ` : '';
            return {
                text: `${head}At the start of combat, gain **${thp} Temporary HP**.`,
                mechanics: {
                    ...(dmg ? { damageRider: { flat: dmg } } : {}),
                    triggers: { combatStart: { tempHP: String(thp) } },
                },
            };
        },
    }),
    basePassive({
        id: 'passive-awareness-evade', name: 'Awareness / Evade', subfamily: 'combined',
        fluff: 'You see it coming and you’re already gone.',
        perLevel: (lvl) => {
            const ev = COMB_AWARE_EVADE.evade[lvl - 1];
            if (ev <= 0)
                return { text: '—', mechanics: {} };
            const sense = combinedSenseCount(lvl);
            const tail = sense.count > 0 ? ` ${senseText(sense)}` : '';
            return {
                text: `Gain **+${ev} Evade**.${tail}`,
                mechanics: { evade: ev },
            };
        },
    }),
    basePassive({
        id: 'passive-awareness-damage', name: 'Awareness / Damage', subfamily: 'combined',
        fluff: 'You see the opening and you take it.',
        perLevel: (lvl) => {
            const dmg = COMB_AWARE_DMG.dmg[lvl - 1];
            const sense = combinedSenseCount(lvl);
            const head = dmg ? `Gain **${dmg} Damage** on all damage rolls you make.` : '';
            const tail = sense.count > 0 ? ` ${senseText(sense)}` : '';
            const text = (head + tail).trim() || '—';
            return {
                text,
                mechanics: dmg ? { damageRider: { flat: dmg } } : {},
            };
        },
    }),
    basePassive({
        id: 'passive-health-healing', name: 'Health (R-05 Retired Combo)', subfamily: 'combined',
        fluff: 'Deep reserves. (HP-regen half retired in R-05.)',
        perLevel: (lvl) => {
            const bars = combinedHealthBars(lvl);
            const barStr = healthBarText(bars);
            return {
                text: barStr ? `Gain ${barStr}. HP regen retired (R-05).` : RETIRED_HEAL_NOTE,
                mechanics: {},
            };
        },
    }),
    basePassive({
        id: 'passive-health-temp-hp', name: 'Health + Temporary HP', subfamily: 'combined',
        fluff: 'More life, more buffer.',
        perLevel: (lvl) => {
            const bars = combinedHealthBars(lvl);
            const barStr = healthBarText(bars);
            const thp = COMB_HEALTH_THP.thp[lvl - 1];
            const head = barStr ? `Gain ${barStr}. ` : '';
            return {
                text: `${head}At the start of combat, gain **${thp} Temporary HP**.`,
                mechanics: { triggers: { combatStart: { tempHP: String(thp) } } },
            };
        },
    }),
    // ─── Conditional Combined (gated) ───────────────────────────────────
    basePassive({
        id: 'conditional-passive-armor-temp-hp', name: 'Armor / Temporary HP (Conditional)', subfamily: 'conditional-combined',
        fluff: 'An ally beside you turns your frame into a bulwark.',
        perLevel: (lvl) => ({
            text: `While adjacent to at least one ally, gain **+${CC_ARMOR_THP.armor[lvl - 1]} Armor**. At the start of combat, if you are adjacent to at least one ally, gain **${CC_ARMOR_THP.thp[lvl - 1]} Temporary HP**.`,
            mechanics: {
                armor: CC_ARMOR_THP.armor[lvl - 1],
                triggers: { combatStart: { tempHP: String(CC_ARMOR_THP.thp[lvl - 1]) } },
                conditionExpr: 'self.adjacentAllies >= 1',
            },
        }),
    }),
    basePassive({
        id: 'conditional-passive-armor-healing', name: 'Armor (Conditional, R-05 Retired Combo)', subfamily: 'conditional-combined',
        fluff: 'Plant your feet and the world cannot move you. (HP-regen half retired in R-05.)',
        perLevel: (lvl) => ({
            text: `If you moved **0 m** on your last turn, gain **+${CC_ARMOR_HEAL.armor[lvl - 1]} Armor**. HP regen retired (R-05).`,
            mechanics: {
                armor: CC_ARMOR_HEAL.armor[lvl - 1],
                conditionExpr: 'self.lastTurnMoved == 0',
            },
        }),
    }),
    basePassive({
        id: 'conditional-passive-armor-health', name: 'Armor / Health (Conditional)', subfamily: 'conditional-combined',
        fluff: 'Beside an ally, your body becomes its own second wall.',
        perLevel: (lvl) => {
            const bars = combinedHealthBars(lvl);
            const barStr = healthBarText(bars);
            const base = `While adjacent to at least one ally, gain **+${CC_ARMOR_HEALTH.armor[lvl - 1]} Armor**.`;
            const tail = barStr
                ? ` At the start of combat, if you are adjacent to at least one ally, gain ${barStr} for that combat.`
                : '';
            return {
                text: base + tail,
                mechanics: {
                    armor: CC_ARMOR_HEALTH.armor[lvl - 1],
                    conditionExpr: 'self.adjacentAllies >= 1',
                },
            };
        },
    }),
    basePassive({
        id: 'conditional-passive-evade-temp-hp', name: 'Evade / Temporary HP (Conditional)', subfamily: 'conditional-combined',
        fluff: 'Motion buys you space and a heartbeat’s worth of armor.',
        perLevel: (lvl) => {
            const ev = CC_EVADE_THP.evade[lvl - 1];
            const thp = CC_EVADE_THP.thp[lvl - 1];
            const evadeClause = ev > 0
                ? `If you moved at least **8 m** on your turn, gain **+${ev} Evade** until the start of your next turn. `
                : '';
            return {
                text: `${evadeClause}Once per combat, after you first move at least **8 m**, gain **${thp} Temporary HP**.`,
                mechanics: {
                    ...(ev > 0 ? { evade: ev } : {}),
                    triggers: { combatStart: { tempHP: String(thp) } },
                    conditionExpr: 'self.turnMoved >= 8',
                },
            };
        },
    }),
    basePassive({
        id: 'conditional-passive-evade-healing', name: 'Evade (Conditional, R-05 Retired Combo)', subfamily: 'conditional-combined',
        fluff: 'You move, you slip away. (HP-regen half retired in R-05.)',
        perLevel: (lvl) => {
            const ev = CC_EVADE_HEAL.evade[lvl - 1];
            return {
                text: ev > 0
                    ? `If you moved at least **8 m** on your last turn, gain **+${ev} Evade**. HP regen retired (R-05).`
                    : RETIRED_HEAL_NOTE,
                mechanics: ev > 0
                    ? { evade: ev, conditionExpr: 'self.lastTurnMoved >= 8' }
                    : {},
            };
        },
    }),
    basePassive({
        id: 'conditional-passive-evade-damage', name: 'Evade / Damage (Conditional)', subfamily: 'conditional-combined',
        fluff: 'Speed sharpens into a blade.',
        perLevel: (lvl) => {
            const ev = CC_EVADE_DMG.evade[lvl - 1];
            const dmg = CC_EVADE_DMG.dmg[lvl - 1];
            const base = `If you moved at least **8 m** this turn, gain **+${ev} Evade** until the start of your next turn`;
            const tail = dmg ? ` and **${dmg} Damage** on all damage rolls you make until the end of your turn` : '';
            return {
                text: `${base}${tail}.`,
                mechanics: {
                    evade: ev,
                    ...(dmg ? { damageRider: { flat: dmg } } : {}),
                    conditionExpr: 'self.turnMoved >= 8',
                },
            };
        },
    }),
    basePassive({
        id: 'conditional-passive-damage-healing', name: 'Damage (Conditional, R-05 Retired Combo)', subfamily: 'conditional-combined',
        fluff: 'Your own blood teaches you how to strike. (HP-regen half retired in R-05.)',
        perLevel: (lvl) => {
            const dmg = CC_DMG_HEAL.dmg[lvl - 1];
            return {
                text: dmg
                    ? `While you are affected by **Lacerate**, gain **${dmg} Damage** on all damage rolls you make. HP regen retired (R-05).`
                    : RETIRED_HEAL_NOTE,
                mechanics: dmg
                    ? { damageRider: { flat: dmg }, conditionExpr: 'self.hasSpecial.lacerate' }
                    : {},
            };
        },
    }),
    basePassive({
        id: 'conditional-passive-damage-temp-hp', name: 'Damage / Temporary HP (Conditional)', subfamily: 'conditional-combined',
        fluff: 'Charge in; the shock buffers you on the way.',
        perLevel: (lvl) => {
            const dmg = CC_DMG_THP.dmg[lvl - 1];
            const thp = CC_DMG_THP.thp[lvl - 1];
            const head = dmg
                ? `If you moved at least **8 m** this turn, gain **${dmg} Damage** on all damage rolls you make until the end of your turn. `
                : '';
            return {
                text: `${head}Once per combat, after you first move at least **8 m**, gain **${thp} Temporary HP**.`,
                mechanics: {
                    ...(dmg ? { damageRider: { flat: dmg } } : {}),
                    triggers: { combatStart: { tempHP: String(thp) } },
                    conditionExpr: 'self.turnMoved >= 8',
                },
            };
        },
    }),
    basePassive({
        id: 'conditional-passive-awareness-evade', name: 'Awareness / Evade (Conditional)', subfamily: 'conditional-combined',
        fluff: 'Your extra senses bend your body out of the blow.',
        perLevel: (lvl) => {
            const sense = conditionalSenseCount(lvl);
            const senseStr = sense.count > 0 ? `${senseText(sense)} ` : '';
            return {
                text: `${senseStr}Against creatures you perceive through a Combat Sense other than sight, gain **+${CC_AWARE_EVADE.evade[lvl - 1]} Evade**.`,
                mechanics: {
                    evade: CC_AWARE_EVADE.evade[lvl - 1],
                    conditionExpr: 'target.perceivedByNonSightSense',
                },
            };
        },
    }),
    basePassive({
        id: 'conditional-passive-awareness-damage', name: 'Awareness / Damage (Conditional)', subfamily: 'conditional-combined',
        fluff: 'You hear, smell, feel the target — and the blow lands clean.',
        perLevel: (lvl) => {
            const dmg = CC_AWARE_DMG.dmg[lvl - 1];
            const sense = conditionalSenseCount(lvl);
            const senseStr = sense.count > 0 ? `${senseText(sense)} ` : '';
            if (!dmg) {
                return {
                    text: senseStr.trim() || '—',
                    mechanics: {},
                };
            }
            return {
                text: `${senseStr}Against targets you perceive through a Combat Sense other than sight, gain **${dmg} Damage** on damage rolls you make.`,
                mechanics: {
                    damageRider: { flat: dmg },
                    conditionExpr: 'target.perceivedByNonSightSense',
                },
            };
        },
    }),
    basePassive({
        id: 'conditional-passive-health-healing', name: 'Health (Conditional, R-05 Retired Combo)', subfamily: 'conditional-combined',
        fluff: 'The worse it gets, the deeper your reserves run. (HP-regen half retired in R-05.)',
        perLevel: (lvl) => {
            const bars = combinedHealthBars(lvl);
            const barStr = healthBarText(bars);
            return {
                text: barStr
                    ? `At the start of combat, if you are Wounded or worse, gain ${barStr} for that combat. HP regen retired (R-05).`
                    : RETIRED_HEAL_NOTE,
                mechanics: {},
            };
        },
    }),
    basePassive({
        id: 'conditional-passive-health-temp-hp', name: 'Health / Temporary HP (Conditional)', subfamily: 'conditional-combined',
        fluff: 'Allies at your side, extra life in your bones.',
        perLevel: (lvl) => {
            const bars = combinedHealthBars(lvl);
            const barStr = healthBarText(bars);
            const thp = CC_HEALTH_THP.thp[lvl - 1];
            const barTail = barStr ? `gain ${barStr} for that combat and ` : '';
            return {
                text: `At the start of combat, if you are adjacent to at least one ally, ${barTail}gain **${thp} Temporary HP**.`,
                mechanics: {
                    triggers: { combatStart: { tempHP: String(thp) } },
                    conditionExpr: 'self.adjacentAllies >= 1',
                },
            };
        },
    }),
    // ─── Passive Special Aura (fixed +1 step on chosen Special(X)) ───────
    basePassive({
        id: 'passive-special-aura', name: 'Special Aura', subfamily: 'special-aura',
        fluff: 'Choose one eligible diminishing Special(X). Inside your aura, it bites a little deeper.',
        perLevel: (lvl) => {
            const radius = specialAuraRadius(lvl);
            if (radius === 0) {
                return { text: 'No effect at this PL; unavailable for selection.', mechanics: { specialAuraUnavailable: true } };
            }
            return {
                text: `While a creature inside your **${radius} m** aura is already affected by your chosen eligible **Special(X)**, increase that Special by **+1 step**. This aura never applies, refreshes, extends, spreads, or triggers the Special.`,
                mechanics: {
                    specialAura: { radiusM: radius, step: 1 },
                    modifySpecial: { type: 'chosen', mode: 'increaseExisting', amount: 1 },
                },
            };
        },
    }),
    // ─── New catalog lines from Rules/ (2026-07) ─────────────────────────
    basePassive({
        id: 'passive-telepathy-mind-link', name: 'Telepathy', subfamily: 'telepathy',
        passiveType: 'Passive',
        fluff: 'You open silent Mind Links and grant Telepathic Access for Mental Powers.',
        perLevel: (lvl) => ({
            text: `**Range:** ${TELEPATHY_RANGE[lvl - 1]}. **Links:** ${TELEPATHY_LINKS[lvl - 1]}. ` +
                `${TELEPATHY_FEATURE[lvl - 1]} Grants Telepathic Access; Mental Active level is capped by this Passive.`,
            mechanics: {},
        }),
    }),
    basePassive({
        id: 'passive-bound-host', name: 'Summon Tokens', subfamily: 'summon',
        passiveType: 'Passive, Summon',
        fluff: 'Extra Summon Tokens for bonds you already unlocked — never new summons from nothing.',
        perLevel: (lvl) => ({
            text: `Gain **+${BOUND_HOST_TOKENS[lvl - 1]} Summon Tokens** for existing bonds only.`,
            mechanics: {},
        }),
    }),
    basePassive({
        id: 'passive-thornhide', name: 'Thorns', subfamily: 'damage',
        passiveType: 'Passive',
        requiresEcho: ['bane-greenwarden'],
        fluff: 'When final HP damage lands on you, thorns bite back — capped by that loss. Exclusive to Green Wardens.',
        perLevel: (lvl) => {
            const d = THORNHIDE_DICE[lvl - 1];
            if (d <= 0)
                return { text: '—', mechanics: {} };
            return {
                text: `Gain **Thorns ${d}d8**. When you take final HP damage, deal that much (capped by the loss) to the source.`,
                mechanics: { thornsDice: d },
            };
        },
    }),
    basePassive({
        id: 'passive-invisibility', name: 'Invisibility', subfamily: 'invisibility',
        passiveType: 'Passive',
        fluff: 'Always on once you have this Passive. Obscures Normal Combat Awareness (and Darkvision); higher levels add Special Combat Sense selections. ' +
            'Perception TN = (4 × MR) + Invisibility Bonus − (Lost Health Bars × MR) + Stealth Spent. ' +
            'Uncovered Senses ignore Invisibility. Attacking does not interrupt Invisibility — observers use normal Perception. ' +
            'Ordinary Stealth hiding ends when attacking. ' +
            'Does not grant Evade, Armor, DR, Temp HP, or Healing. Stacks with Active Buff: Invisibility.',
        perLevel: (lvl) => {
            const bonus = INVIS_PASSIVE[lvl - 1];
            const senses = INVIS_PASSIVE_SENSES[lvl - 1];
            const sensePart = senses <= 0
                ? 'Obscures **Normal Combat Awareness** (and Darkvision).'
                : senses === 1
                    ? 'Obscures **Normal Combat Awareness** (and Darkvision) and **1** chosen Special Combat Sense.'
                    : `Obscures **Normal Combat Awareness** (and Darkvision) and **${senses}** chosen Special Combat Senses.`;
            return {
                text: `Always on. Gain **+${bonus} Invisibility Bonus** (Power Level). ` +
                    `${sensePart} ` +
                    `Perception TN = **(4 × MR) + ${bonus} − (Lost Health Bars × MR) + Stealth Spent**. ` +
                    `Uncovered Special Combat Senses perceive you normally (no Invisibility TN). ` +
                    `Attacking does not interrupt Invisibility; observers use normal Perception to locate and target you. ` +
                    `Ordinary Stealth hiding ends when attacking. ` +
                    `Incapacitated suppresses Invisibility until you recover.`,
                mechanics: {
                    invisibilityBonus: bonus,
                    blockedSpecialSenseSlots: senses,
                },
            };
        },
    }),
    basePassive({
        id: 'passive-parry', name: 'Parry', subfamily: 'parry',
        passiveType: 'Passive, Parry',
        fluff: 'Enter Parry by spending the base Attack Action. Extra Attacks remain. One pool, Martial or Spell delivery.',
        perLevel: (lvl) => {
            const pool = PARRY_POOL[lvl - 1];
            return {
                text: `Entering Parry spends the base Attack Action. Extra Attacks remain. Maximum Parry Pool **${pool}** ` +
                    `(chosen Parry Attribute, limited by ceil(5 × Level / 2)). ` +
                    `Martial (Might or Agility) removes Attack Dice; 0 dice = Fully Parried. ` +
                    `Spell (Intellect, Resolve, or Influence) removes Casting Dice from a direct Spell whose origin is within 22 m; 0 dice = Fully Countered.`,
                mechanics: {},
            };
        },
    }),
    basePassive({
        id: 'passive-absorption', name: 'Absorption', subfamily: 'absorption',
        passiveType: 'Passive, Absorption',
        fluff: 'Scarred Health Bars from hostile damage become Temporary Colorless Stones. No extra HP.',
        perLevel: (lvl) => {
            const stones = absorptionStonesPerTrigger(lvl);
            return {
                text: `**${stones} Temporary Colorless Stone${stones === 1 ? '' : 's'}** per Scarred Health Bar ` +
                    `(max 4 triggers per combat). Stones arrive Ready at the next Preparation Phase and expire at combat end. No extra HP.`,
                mechanics: { absorptionStonesPerTrigger: stones },
            };
        },
    }),
    basePassive({
        id: 'passive-damage-negation', name: 'Damage Negation', subfamily: 'damage-negation',
        passiveType: 'Passive, Damage Negation',
        fluff: 'A closed combat reserve of Damage Dice you spend before damage is rolled.',
        perLevel: (lvl) => {
            const dice = DAMAGE_NEGATION_RESERVE[lvl - 1];
            return {
                text: `Combat reserve **${dice} Damage Dice** (2 × Power Level). Spend 1:1 to remove Damage Dice after a hit is established but before they are rolled. ` +
                    `Shared across the Combat; does not refresh each Round. Nominal catalogue cost 10 PP per removed Die; purchase is still 20 PP per PL. ` +
                    `Does not alter the hit, Specials, flat damage, or on-hit effects. Distinct from Vitality Stone Ability: Damage Negation (temporary).`,
                mechanics: {},
            };
        },
    }),
    basePassive({
        id: 'passive-armor-reduction', name: 'Armor Reduction', subfamily: 'armor-reduction',
        passiveType: 'Passive, Armor Reduction',
        fluff: 'Your strikes ignore a slice of the Armor that would otherwise blunt them — without changing the target\'s listed Armor.',
        perLevel: (lvl) => {
            const amount = PASSIVE_ARMOR_CURVE[lvl - 1];
            return {
                text: `On each eligible damaging Attack or damaging Spell you make, ignore **${amount} Armor** counted against that attack only ` +
                    `(same curve as Passive: Armor). Does not lower listed Armor, does not help allies, does not apply Corrode/Expose, ` +
                    `and does not change Attack TN, Casting TN, or Raises. Combines with legal Corrode, Might Stone Armor Reduction, and Weapon Penetration(X); effective Armor never below 0.`,
                mechanics: { armorReduction: amount },
            };
        },
    }),
    basePassive({
        id: 'passive-critical', name: 'Critical', subfamily: 'critical',
        passiveType: 'Passive, Critical',
        fluff: 'Free Critical(1) roll designations each Combat — separate from Active Buff Critical and Agility Stone Crit.',
        perLevel: (lvl) => {
            const charges = phasingStyleCombatCharges(lvl);
            return charges === 0
                ? { text: 'Unavailable.', mechanics: {} }
                : {
                    text: `At the start of combat, gain **${charges} free Critical(1) roll${charges === 1 ? '' : 's'}** for this Combat. ` +
                        `Before one eligible Martial Attack Roll or damaging Spell Casting Roll, spend one charge to designate that complete roll as Critical(1): natural 7s and 8s explode in the Attack/Casting Pool. ` +
                        `Not a Damage Die bonus. A miss still spends the charge. One shared AoE roll costs one charge. ` +
                        `Does not require Agility Stone Crit or Active Buff: Critical. Choose exactly one Critical source per roll.`,
                    mechanics: { passiveCritical: { combatStart: { charges } } },
                };
        },
    }),
    basePassive({
        id: 'passive-maximization', name: 'Maximization', subfamily: 'maximization',
        passiveType: 'Passive, Maximization',
        fluff: 'Free Maximization uses each Combat for Damage or Healing Rolls — separate from Vitality Stone Maximization.',
        perLevel: (lvl) => {
            const charges = phasingStyleCombatCharges(lvl);
            return charges === 0
                ? { text: 'Unavailable.', mechanics: {} }
                : {
                    text: `At the start of combat, gain **${charges} free Maximization use${charges === 1 ? '' : 's'}** shared between complete Damage Rolls and Healing Rolls this Combat. ` +
                        `Declare immediately before an eligible Damage or Healing Roll (after Damage Negation for damage). Remaining d8s become artificial 8s — not natural 8s. ` +
                        `A miss with no Damage Roll does not spend a use. One shared AoE Damage Roll costs one use. ` +
                        `Does not require Vitality Stone Maximization. Choose exactly one Maximization source per roll.`,
                    mechanics: { passiveMaximization: { combatStart: { charges } } },
                };
        },
    }),
    // ─── Expanded Playtest 2026-10-20 — five new catalogue Passives ───────
    basePassive({
        id: 'passive-enemy-evade-reduction',
        name: 'Enemy Evade Reduction',
        subfamily: 'enemy-evade-reduction',
        passiveType: 'Passive, Enemy Evade Reduction',
        fluff: 'Your Martial Attack Rolls treat the targeted enemy as slightly easier to hit. Only your attacks; never changes their stored Evade.',
        perLevel: (lvl) => {
            const cut = ceilPassiveHalfLevel(lvl);
            return {
                text: `Against your own eligible Martial Attack Rolls (including Martial AoE targets and Martial Reaction attacks that use a Martial Attack Roll), ` +
                    `reduce the target's effective Evade by **${cut}** (minimum 0). Does not modify stored Evade, create Expose, add Attack Dice, or change Spell Final TN.`,
                mechanics: { enemyEvadeReduction: cut },
            };
        },
    }),
    basePassive({
        id: 'passive-self-cleanse',
        name: 'Self Cleanse',
        subfamily: 'self-cleanse',
        passiveType: 'Passive, Self Cleanse',
        fluff: 'At the start of each of your Turns, after Tick, Natural Special Recovery and Diminishing Decay, cleanse yourself once more.',
        perLevel: (lvl) => {
            const amt = ceilPassiveHalfLevel(lvl);
            return {
                text: `At the start of each of your Turns — after Special Ticks, Natural Special Recovery and Diminishing Decay, and before Persistent Zone start-of-Turn applications — ` +
                    `gain an additional **Cleanse(${amt})** on yourself. Freely distribute among eligible negative Specials (including Cleanse-eligible Root). ` +
                    `Does not replace Natural Special Recovery, heal HP, cost an Action, or cleanse non-eligible effects.`,
                mechanics: { cleanseMaintenance: amt },
            };
        },
    }),
    basePassive({
        id: 'passive-speed',
        name: 'Speed',
        subfamily: 'speed',
        passiveType: 'Passive, Speed',
        fluff: 'Your normal Speed statistic increases. Dash doubles the increased Speed.',
        perLevel: (lvl) => {
            const meters = passiveSpeedMetersForLevel(lvl);
            return {
                text: `Increase your normal Speed by **+${meters} m**. Applied once to the Speed statistic (not as a separate per-Movement-Action bonus). ` +
                    `Dash doubles the increased Speed. Stone Movement Enhancement is added once after the Movement Action distance (including Dash). ` +
                    `Slow, Root, Immovable and other restrictions apply normally; minimum effective Speed 0.`,
                mechanics: { speedBonus: meters },
            };
        },
    }),
    basePassive({
        id: 'passive-spell-resistance-piercing',
        name: 'Spell Resistance Piercing',
        subfamily: 'spell-resistance-piercing',
        passiveType: 'Passive, Spell Resistance Piercing',
        fluff: 'Your Spells ignore a slice of the target\'s Spell Resistance. Shared Casting Rolls still use per-target Final Spell TN.',
        perLevel: (lvl) => {
            const pierce = ceilPassiveHalfLevel(lvl);
            return {
                text: `When you cast a Spell, ignore **${pierce}** of each target's Spell Resistance against that Spell ` +
                    `(remaining SR = max(0, target SR − piercing)). Final Spell TN = Spell Base TN + remaining SR. ` +
                    `Does not reduce Spell Base TN, stored SR, Evade, or SR against other casters. AoE Spells keep one Casting Roll with per-target Final TN.`,
                mechanics: { spellResistancePiercing: pierce },
            };
        },
    }),
    basePassive({
        id: 'passive-special-amplification',
        name: 'Special Amplification',
        subfamily: 'special-amplification',
        passiveType: 'Passive, Special Amplification',
        fluff: 'Increases eligible numeric Special(X) values you successfully deliver with your own Martial/Spell Attacks. Distinct from Special Aura.',
        perLevel: (lvl) => {
            const amp = ceilPassiveQuarterLevel(lvl);
            return {
                text: `When your qualifying successful Martial or Spell Attack delivers an eligible numeric Special(X), increase that Special by **+${amp}** ` +
                    `after printed X, successful Raise Special Increase and Intellect Stone Special Boost, and before target Vulnerability, Special Negation and the 4 × MR application limit. ` +
                    `Does not create Specials, amplify aura ticks, ongoing damage, ally/Summon attacks, binary Specials or hard control.`,
                mechanics: { specialAmplification: amp },
            };
        },
    }),
    // ─── Buff Empowerment (artifact lineage meta-passives) ───────────────
    EMPOWER_BUFF_TEMPLATES[0],
    EMPOWER_BUFF_TEMPLATES[1],
    EMPOWER_BUFF_TEMPLATES[2],
    EMPOWER_BUFF_TEMPLATES[3],
    BUFF_EXTENSION_TEMPLATES[0],
    BUFF_EXTENSION_TEMPLATES[1],
    BUFF_EXTENSION_TEMPLATES[2],
    mobilityBuffExtensionPassive(),
    ECHO_ARMOR_VALUE_PASSIVE,
];
export const PASSIVE_TEMPLATES = RAW_PASSIVE_TEMPLATES.filter((t) => !RETIRED_AWARENESS_PASSIVE_IDS.has(t.templateId) && !RETIRED_COMBINED_PASSIVE_IDS.has(t.templateId));
//# sourceMappingURL=passives.js.map