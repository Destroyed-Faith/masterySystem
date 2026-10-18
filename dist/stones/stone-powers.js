/**
 * Canonical Stone Powers Definition — universal four-Rank spec.
 *
 * Every Stone Ability has exactly four Ranks; Rank 4 is the hard cap.
 * Normal Abilities cost 1 / 2 / 4 / 8 additional Stones (1 / 3 / 7 / 15
 * total). The eight Premium Abilities (Extra Attack, Parry, Crit, Damage
 * Negation, Special Boost, Damage Reduction, Not a Target, Phasing) cost
 * 2 / 4 / 6 / 8 additional Stones (2 / 6 / 12 / 20 total).
 *
 * Pool layout: Generic + 7 attribute pools (Might / Agility / Vitality /
 * Intellect / Resolve / Influence / Wits). Every pool has 4 powers. Total 32.
 *
 * Effects live in `apply(ctx)` and write into `roundState.stoneBonuses`
 * or set actor / combatant flags. Cleanup of per-turn bonuses happens
 * in `clearCombatStoneTurnBonusesForActor` (see action-economy.ts).
 */
import { getRulesMasteryRank } from '../utils/mastery-rank-sync.js';
import { getRoundState, setRoundState, syncPcExtraAttackTotal, } from '../combat/action-economy.js';
import { initiativeBoostAmount, isInitiativeBoostUsedThisCombat, isPhasingStoneUsedThisCombat, isTempHpStoneUsedThisCombat, markInitiativeBoostUsedThisCombat, markPhasingStoneUsedThisCombat, markTempHpStoneUsedThisCombat, } from './colorless-stones.js';
import { augmentPhasingCharges } from '../combat/phasing.js';
import { applyRemoveScarEffect } from './remove-scar.js';
import { promptSelectablePlayerTarget } from './ally-stone-target.js';
import { PENDING_SAFE_MOVEMENT_FLAG, safeMovementMeters, } from './agility-movement.js';
/** Ranks shown in the dialog / Players Guide. Rank 4 is the last Rank. */
export const STONE_TIER_VISIBLE = 4;
/** Highest Rank a Stone Ability can reach. */
export const STONE_TIER_PRACTICAL_MAX = 4;
/** Hard cap. There is no Rank 5. */
export const STONE_TIER_HARD_MAX = 4;
/** Retired ids that still resolve to a current Stone Power. */
export const STONE_POWER_ID_ALIASES = {
    'resolve.damageReductionBoost': 'resolve.damageReduction',
    'resolve.specialReduction': 'resolve.ward',
    'generic.exchange passive': 'generic.movementEnhancement',
    'might.ignoreArmor': 'might.armorReduction',
    'agility.slip': 'agility.invisibilityBoost',
    'vitality.extendActiveBuff': 'vitality.damageMaximization',
    'intellect.spellPenetration': 'intellect.rangeAoe',
    'intellect.raiseFocus': 'intellect.raises',
    'intellect.spellRaises': 'intellect.raises',
    'resolve.stressHealing': 'resolve.activeBuffEmpowerment',
    'influence.aidRoll': 'influence.cleanse',
    'influence.regeneration': 'influence.colorlessRecovery',
    'influence.passiveSwap': 'influence.enemyEvadeReduction',
    'wits.readIntent': 'wits.reactionDenial',
    'wits.reactionRange': 'wits.movementReduction',
};
export function resolveStonePowerId(powerId) {
    const id = String(powerId || '').trim();
    return STONE_POWER_ID_ALIASES[id] || id;
}
/**
 * Premium Stone Abilities (PG "Premium Stone Abilities"): 2 / 4 / 6 / 8
 * additional Stones per Rank. All other Abilities are Normal (1 / 2 / 4 / 8).
 */
export const PREMIUM_STONE_POWER_IDS = [
    'generic.extraAttack',
    'might.parry',
    'agility.crit',
    'vitality.damageNegation',
    'intellect.specialBoost',
    'resolve.damageReduction',
    'influence.notATarget',
    'wits.phasing',
];
const PREMIUM_SET = new Set(PREMIUM_STONE_POWER_IDS);
export function isPremiumStonePower(powerId) {
    return PREMIUM_SET.has(resolveStonePowerId(powerId));
}
/**
 * Removed abilities. They are not in the registry. Old saves that still name
 * the id are refused so they do not become Spell Penetration.
 * Extra Attack is the only source of extra attacks (spells, ranged, and martial).
 */
export const RETIRED_STONE_POWER_IDS = ['intellect.spellAction'];
const RETIRED_STONE_POWER_SET = new Set(RETIRED_STONE_POWER_IDS);
export function isRetiredStonePower(powerId) {
    return RETIRED_STONE_POWER_SET.has(resolveStonePowerId(powerId));
}
export const RETIRED_STONE_POWER_MESSAGE = 'Spell Action is retired. Extra Attack covers spells, ranged attacks, and martial attacks.';
/** Additional-Stone cost per Rank (index 0 = Rank 1). */
const NORMAL_RANK_COSTS = [1, 2, 4, 8];
const PREMIUM_RANK_COSTS = [2, 4, 6, 8];
/** Per-Rank payment segment sizes for one Ability (Normal 1/2/4/8, Premium 2/4/6/8). */
export function stonePowerSegmentSizes(powerId) {
    return isPremiumStonePower(powerId) ? PREMIUM_RANK_COSTS : NORMAL_RANK_COSTS;
}
/** Additional Stones to activate `rank` (1..4) of this Ability. 0 outside 1..4. */
export function stonePowerRankCost(powerId, rank) {
    const r = Math.floor(Number(rank) || 0);
    if (r < 1 || r > STONE_TIER_HARD_MAX)
        return 0;
    return stonePowerSegmentSizes(powerId)[r - 1] ?? 0;
}
/** Cumulative Stones to reach `rank` (Normal 1/3/7/15, Premium 2/6/12/20). */
export function cumulativeStoneCostForRank(powerId, rank) {
    const r = Math.max(0, Math.min(STONE_TIER_HARD_MAX, Math.floor(Number(rank) || 0)));
    let total = 0;
    for (let t = 1; t <= r; t += 1)
        total += stonePowerRankCost(powerId, t);
    return total;
}
/**
 * Read a published Rank value. Ranks past the printed sequence, and anything
 * above Rank 4, do not scale.
 */
export function scaleStoneTier(seq, tier) {
    const t = Math.max(1, Math.floor(Number(tier) || 1));
    if (t > STONE_TIER_HARD_MAX || t > seq.length)
        return 0;
    return Number(seq[t - 1]) || 0;
}
/**
 * Highest fully paid Rank on one card given the placed Stone count and this
 * Ability's cost curve. A pre-filled Rank costs nothing; every other Rank up
 * to the result must be covered by the placed Stones in order.
 */
export function highestCompleteStoneTierFromPlaced(powerId, placed, prefillRank = 0, maxTier = STONE_TIER_HARD_MAX) {
    const n = Math.max(0, Math.floor(Number(placed) || 0));
    const cap = Math.max(1, Math.min(STONE_TIER_HARD_MAX, Math.floor(Number(maxTier) || STONE_TIER_HARD_MAX)));
    const prefill = Math.max(0, Math.min(STONE_TIER_HARD_MAX, Math.floor(Number(prefillRank) || 0)));
    let best = 0;
    let cost = 0;
    for (let r = 1; r <= cap; r += 1) {
        if (r !== prefill)
            cost += stonePowerRankCost(powerId, r);
        if (n < cost)
            break;
        best = r;
    }
    return best;
}
export function completeStoneRankPayment(powerId, placed, usesBefore = 0, prefillRank = 0) {
    const n = Math.max(0, Math.floor(Number(placed) || 0));
    const start = Math.max(0, Math.min(STONE_TIER_HARD_MAX, Math.floor(Number(usesBefore) || 0)));
    const prefill = effectiveStoneSupportPrefillTier(powerId, prefillRank);
    if (start >= STONE_TIER_HARD_MAX)
        return null;
    let remaining = n;
    let tier = start;
    let spend = 0;
    for (let r = start + 1; r <= STONE_TIER_HARD_MAX; r += 1) {
        const cost = r === prefill ? 0 : stonePowerRankCost(powerId, r);
        if (remaining < cost)
            break;
        remaining -= cost;
        spend += cost;
        tier = r;
    }
    if (tier <= start)
        return null;
    return { tier, spendCount: spend, ranksGained: tier - start };
}
/** Payable lane indexes for Ranks `fromRank`..`toRank` (the pre-filled Rank is omitted). */
export function paidLaneSetForStoneRanks(powerId, fromRank, toRank, prefillRank = 0) {
    const prefill = effectiveStoneSupportPrefillTier(powerId, prefillRank);
    const from = Math.max(1, Math.floor(Number(fromRank) || 1));
    const to = Math.min(STONE_TIER_HARD_MAX, Math.floor(Number(toRank) || 0));
    const set = new Set();
    for (let r = from; r <= to; r += 1) {
        if (r === prefill)
            continue;
        for (const lane of stonePaymentLanesForTier(powerId, r))
            set.add(lane);
    }
    return set;
}
/**
 * Split occupied lanes into the complete Rank prefix and the leftover.
 * Returns null when the stone count would pay a Rank but those lanes are
 * not actually filled (a gap). That pile must not be charged.
 */
export function partitionStoneLanesByCompleteRanks(powerId, lanes, usesBefore = 0, prefillRank = 0) {
    const payment = completeStoneRankPayment(powerId, lanes.length, usesBefore, prefillRank);
    if (!payment)
        return null;
    const covered = paidLaneSetForStoneRanks(powerId, Math.max(0, Math.floor(Number(usesBefore) || 0)) + 1, payment.tier, prefillRank);
    const spend = [];
    const leftover = [];
    for (const row of lanes) {
        if (covered.has(row.lane))
            spend.push(row);
        else
            leftover.push(row);
    }
    if (spend.length !== payment.spendCount)
        return null;
    return { payment, spend, leftover };
}
/**
 * Once-per-combat powers apply the highest complete cluster once. A Support
 * prefill makes its named Rank free; every other Rank is paid from the
 * placed Stones in order.
 */
export function resolveOncePerCombatStoneTier(powerId, placedCount, prefillTier = 0) {
    const prefill = effectiveStoneSupportPrefillTier(powerId, prefillTier);
    const playerTier = highestCompleteStoneTierFromPlaced(powerId, placedCount, 0);
    const tier = prefill > 0 ? highestCompleteStoneTierFromPlaced(powerId, placedCount, prefill) : playerTier;
    return { tier, playerTier };
}
/** Compile the multi-Rank tooltip with this Ability's cost curve. */
function compileEffectText(name, tiers, powerId) {
    const lines = tiers.map((t, i) => {
        const rank = i + 1;
        const cost = stonePowerRankCost(powerId, rank);
        return `R${rank} (${cost}): ${t.description || t.label}`;
    });
    return `${name}\n${lines.join('\n')}`;
}
/** Shared helper — ensure `stoneBonuses` exists with required defaults. */
function ensureStoneBonuses(rs) {
    if (!rs.stoneBonuses) {
        rs.stoneBonuses = { extraAttacks: 0, extraReactions: 0, extraMoveMeters: 0 };
    }
    return rs.stoneBonuses;
}
// ---------------------------------------------------------------------------
// Generic Powers — any pool can pay. 4 powers per spec.
// ---------------------------------------------------------------------------
const GENERIC_POWERS_RAW = [
    {
        id: 'generic.extraAttack',
        name: 'Extra Attack',
        attribute: 'generic',
        category: 'action',
        description: 'Premium. Gain additional Attack Actions this round (R1–R4: +1/+2/+3/+4).',
        tiers: [
            { label: '+1 Attack Action', description: 'Gain 1 additional Attack Action this round.', value: 1 },
            { label: '+2 Attack Actions', description: 'Gain 2 additional Attack Actions this round.', value: 2 },
            { label: '+3 Attack Actions', description: 'Gain 3 additional Attack Actions this round.', value: 3 },
            { label: '+4 Attack Actions', description: 'Gain 4 additional Attack Actions this round.', value: 4 },
        ],
        apply: async ({ actor, tier }) => {
            const combat = game.combat;
            const bonus = scaleStoneTier([1, 2, 3, 4], tier);
            if (bonus <= 0)
                return;
            const roundState = getRoundState(actor, combat);
            const sb = ensureStoneBonuses(roundState);
            // Rank value is the grant. A second activation or Artifact support of the
            // same ability keeps the highest rank, it does not add another pile.
            sb.extraAttacks = Math.max(sb.extraAttacks ?? 0, bonus);
            syncPcExtraAttackTotal(roundState);
            await setRoundState(actor, roundState);
        },
    },
    {
        id: 'generic.extraMovement',
        name: 'Extra Movement',
        attribute: 'generic',
        category: 'action',
        description: 'Gain additional Movement actions this round (T1..T4: +1/+2/+3/+4).',
        tiers: [
            { label: '+1 Movement', description: 'Gain 1 additional Movement this round.', value: 1 },
            { label: '+2 Movement', description: 'Gain 2 additional Movements this round.', value: 2 },
            { label: '+3 Movement', description: 'Gain 3 additional Movements this round.', value: 3 },
            { label: '+4 Movement', description: 'Gain 4 additional Movements this round.', value: 4 },
        ],
        apply: async ({ actor, tier }) => {
            const combat = game.combat;
            const bonus = Math.max(0, tier);
            const roundState = getRoundState(actor, combat);
            roundState.movementActions.total += bonus;
            await setRoundState(actor, roundState);
        },
    },
    {
        id: 'generic.extraReaction',
        name: 'Extra Reaction',
        attribute: 'generic',
        category: 'reaction',
        description: 'Gain additional Reactions this round (T1..T4: +1/+2/+3/+4).',
        tiers: [
            { label: '+1 Reaction', description: 'Gain 1 additional Reaction this round.', value: 1 },
            { label: '+2 Reactions', description: 'Gain 2 additional Reactions this round.', value: 2 },
            { label: '+3 Reactions', description: 'Gain 3 additional Reactions this round.', value: 3 },
            { label: '+4 Reactions', description: 'Gain 4 additional Reactions this round.', value: 4 },
        ],
        apply: async ({ actor, tier }) => {
            const combat = game.combat;
            const bonus = Math.max(0, tier);
            const roundState = getRoundState(actor, combat);
            roundState.reactionActions.total += bonus;
            const sb = ensureStoneBonuses(roundState);
            sb.extraReactions = (sb.extraReactions ?? 0) + bonus;
            await setRoundState(actor, roundState);
        },
    },
    {
        id: 'generic.movementEnhancement',
        name: 'Movement Enhancement',
        attribute: 'generic',
        category: 'action',
        description: 'Add 4/8/12/16 m to every Movement Action this round (Move, Dash, Disengage, Movement Power). Dash doubles Speed first, then this bonus is added once. It does not grant actions, change base Speed, overcome Root or Immovable, or benefit Quick Load.',
        tiers: [
            { label: '+4 m', description: 'Every Movement Action this round gains +4 m.', value: 4 },
            { label: '+8 m', description: 'Every Movement Action this round gains +8 m.', value: 8 },
            { label: '+12 m', description: 'Every Movement Action this round gains +12 m.', value: 12 },
            { label: '+16 m', description: 'Every Movement Action this round gains +16 m.', value: 16 },
        ],
        apply: async ({ actor, tier }) => {
            const combat = game.combat;
            const bonus = scaleStoneTier([4, 8, 12, 16], tier);
            if (bonus <= 0)
                return;
            const roundState = getRoundState(actor, combat);
            const sb = ensureStoneBonuses(roundState);
            sb.extraMoveMeters = Math.max(sb.extraMoveMeters ?? 0, bonus);
            await setRoundState(actor, roundState);
        },
    },
];
// ---------------------------------------------------------------------------
// Might
// ---------------------------------------------------------------------------
const MIGHT_POWERS_RAW = [
    {
        id: 'might.meleeDamage',
        name: 'Damage',
        attribute: 'might',
        category: 'action',
        description: 'Add bonus damage dice to your next Martial Attack this turn (+2/+4/+8/+16). Melee, ranged, natural weapons, and Martial AoE all qualify. Spell Attacks do not.',
        tiers: [
            { label: '+2 Damage Dice', description: 'Add +2 Damage Dice to your next Martial Attack this turn.', value: 2 },
            { label: '+4 Damage Dice', description: 'Add +4 Damage Dice to your next Martial Attack this turn.', value: 4 },
            { label: '+8 Damage Dice', description: 'Add +8 Damage Dice to your next Martial Attack this turn.', value: 8 },
            { label: '+16 Damage Dice', description: 'Add +16 Damage Dice to your next Martial Attack this turn.', value: 16 },
        ],
        apply: async ({ actor, tier }) => {
            const combat = game.combat;
            const dice = scaleStoneTier([2, 4, 8, 16], tier);
            if (dice <= 0)
                return;
            const roundState = getRoundState(actor, combat);
            const sb = ensureStoneBonuses(roundState);
            // Rank value is the grant (R1=+2, R2=+4, R3=+8, R4=+16). Re-activation
            // or Artifact Support of the same ability keeps the highest rank — it
            // must not stack (3 Stones = Rank 2 = +4d8, never +2 then +4 = +6 or
            // a doubled +8).
            sb.meleeDamageBonusDice = Math.max(sb.meleeDamageBonusDice ?? 0, dice);
            sb.damageBonus = Math.max(sb.damageBonus ?? 0, dice);
            await setRoundState(actor, roundState);
        },
    },
    {
        id: 'might.armor',
        name: 'Armor',
        attribute: 'might',
        category: 'passive',
        description: 'Gain flat temporary Armor until the start of your next turn (+4/+8/+16/+32).',
        tiers: [
            { label: '+4 Armor', description: 'Gain +4 Armor until the start of your next turn.', value: 4 },
            { label: '+8 Armor', description: 'Gain +8 Armor until the start of your next turn.', value: 8 },
            { label: '+16 Armor', description: 'Gain +16 Armor until the start of your next turn.', value: 16 },
            { label: '+32 Armor', description: 'Gain +32 Armor until the start of your next turn.', value: 32 },
        ],
        apply: async ({ actor, tier }) => {
            const combat = game.combat;
            // Re-activation ADDs (PG "Temporary Defensive Stone Values").
            const bonus = scaleStoneTier([4, 8, 16, 32], tier);
            const roundState = getRoundState(actor, combat);
            const sb = ensureStoneBonuses(roundState);
            sb.tempArmor = (sb.tempArmor ?? 0) + bonus;
            await setRoundState(actor, roundState);
        },
    },
    {
        id: 'might.armorReduction',
        name: 'Armor Reduction',
        attribute: 'might',
        category: 'action',
        description: 'All your damaging attacks this round ignore 4/8/16/32 Armor. Highest rank wins. Stacks with Corrode and Weapon Penetration. Effective Armor cannot fall below 0. Listed Armor does not change.',
        tiers: [
            { label: 'Ignore 4 Armor', description: 'Damaging attacks this round ignore 4 Armor.', value: 4 },
            { label: 'Ignore 8 Armor', description: 'Damaging attacks this round ignore 8 Armor.', value: 8 },
            { label: 'Ignore 16 Armor', description: 'Damaging attacks this round ignore 16 Armor.', value: 16 },
            { label: 'Ignore 32 Armor', description: 'Damaging attacks this round ignore 32 Armor.', value: 32 },
        ],
        apply: async ({ actor, tier }) => {
            const combat = game.combat;
            const bonus = scaleStoneTier([4, 8, 16, 32], tier);
            if (bonus <= 0)
                return;
            const roundState = getRoundState(actor, combat);
            const sb = ensureStoneBonuses(roundState);
            sb.armorPenetration = Math.max(sb.armorPenetration ?? 0, bonus);
            sb.meleeIgnoreArmor = Math.max(sb.meleeIgnoreArmor ?? 0, bonus);
            await setRoundState(actor, roundState);
        },
    },
    {
        id: 'might.parry',
        name: 'Parry',
        attribute: 'might',
        category: 'passive',
        description: 'Premium. Gain Parry Pool until the start of your next turn (R1–R4: +2/+4/+6/+8). Creates Parry if you do not have it.',
        tiers: [
            { label: '+2 Parry Pool', description: 'Gain +2 Parry Pool until the start of your next turn.', value: 2 },
            { label: '+4 Parry Pool', description: 'Gain +4 Parry Pool until the start of your next turn.', value: 4 },
            { label: '+6 Parry Pool', description: 'Gain +6 Parry Pool until the start of your next turn.', value: 6 },
            { label: '+8 Parry Pool', description: 'Gain +8 Parry Pool until the start of your next turn.', value: 8 },
        ],
        apply: async ({ actor, tier }) => {
            const combat = game.combat;
            const bonus = scaleStoneTier([2, 4, 6, 8], tier);
            if (bonus <= 0)
                return;
            const roundState = getRoundState(actor, combat);
            const sb = ensureStoneBonuses(roundState);
            // Re-activation ADDs (PG "Temporary Defensive Stone Values").
            sb.tempParryPool = (sb.tempParryPool ?? 0) + bonus;
            await setRoundState(actor, roundState);
        },
    },
];
// ---------------------------------------------------------------------------
// Agility
// ---------------------------------------------------------------------------
const AGILITY_POWERS_RAW = [
    {
        id: 'agility.crit',
        name: 'Crit',
        attribute: 'agility',
        category: 'action',
        description: 'Premium. A number of your damaging attacks or Spells this round can have Crit(1) (R1–R4: 1/2/3/4). Declare it before the Attack Roll or Casting Roll.',
        tiers: [
            { label: '1 attack: Crit(1)', description: 'One damaging attack or Spell this round can have Crit(1). Declare it before the Attack Roll or Casting Roll.', value: 1 },
            { label: '2 attacks: Crit(1)', description: 'Two damaging attacks or Spells this round can have Crit(1). Declare each before the Attack Roll or Casting Roll.', value: 2 },
            { label: '3 attacks: Crit(1)', description: 'Three damaging attacks or Spells this round can have Crit(1). Declare each before the Attack Roll or Casting Roll.', value: 3 },
            { label: '4 attacks: Crit(1)', description: 'Four damaging attacks or Spells this round can have Crit(1). Declare each before the Attack Roll or Casting Roll.', value: 4 },
        ],
        apply: async ({ actor, tier }) => {
            const combat = game.combat;
            const charges = scaleStoneTier([1, 2, 3, 4], tier);
            if (charges <= 0)
                return;
            const roundState = getRoundState(actor, combat);
            const sb = ensureStoneBonuses(roundState);
            sb.critRaises = (sb.critRaises ?? 0) + charges;
            await setRoundState(actor, roundState);
        },
    },
    {
        id: 'agility.evade',
        name: 'Evade',
        attribute: 'agility',
        category: 'passive',
        description: 'Gain Evade until the start of your next turn (+8/+16/+24/+32).',
        tiers: [
            { label: '+8 Evade', description: 'Gain +8 Evade until the start of your next turn.', value: 8 },
            { label: '+16 Evade', description: 'Gain +16 Evade until the start of your next turn.', value: 16 },
            { label: '+24 Evade', description: 'Gain +24 Evade until the start of your next turn.', value: 24 },
            { label: '+32 Evade', description: 'Gain +32 Evade until the start of your next turn.', value: 32 },
        ],
        apply: async ({ actor, tier }) => {
            const combat = game.combat;
            const bonus = scaleStoneTier([8, 16, 24, 32], tier);
            const roundState = getRoundState(actor, combat);
            const sb = ensureStoneBonuses(roundState);
            sb.evadeBonus = (sb.evadeBonus ?? 0) + bonus;
            await setRoundState(actor, roundState);
        },
    },
    {
        id: 'agility.safeMovement',
        name: 'Safe Movement',
        attribute: 'agility',
        category: 'action',
        description: 'Replace your normal Movement with a move of 4/8/12/16 m. This does not provoke movement-triggered Reactions and does not cost an Attack Action or a Reaction.',
        tiers: [
            { label: 'Move 4 m, no movement-triggered Reactions', description: 'Use your Movement to move up to 4 m. This replaces normal Movement and does not provoke movement-triggered Reactions.', value: 4 },
            { label: 'Move 8 m, no movement-triggered Reactions', description: 'Use your Movement to move up to 8 m. This replaces normal Movement and does not provoke movement-triggered Reactions.', value: 8 },
            { label: 'Move 12 m, no movement-triggered Reactions', description: 'Use your Movement to move up to 12 m. This replaces normal Movement and does not provoke movement-triggered Reactions.', value: 12 },
            { label: 'Move 16 m, no movement-triggered Reactions', description: 'Use your Movement to move up to 16 m. This replaces normal Movement and does not provoke movement-triggered Reactions.', value: 16 },
        ],
        apply: async ({ actor, tier }) => {
            const meters = safeMovementMeters(tier);
            if (meters <= 0)
                return;
            await actor.setFlag?.('mastery-system', PENDING_SAFE_MOVEMENT_FLAG, { meters });
        },
    },
    {
        id: 'agility.invisibilityBoost',
        name: 'Invisibility Boost',
        attribute: 'agility',
        category: 'action',
        description: 'Add +1/+2/+4/+8 to an existing Invisibility Bonus this round. Does not grant Invisibility and does not change which senses are Obscured.',
        tiers: [
            { label: '+1 Invisibility', description: 'Add +1 to your existing Invisibility Bonus this round.', value: 1 },
            { label: '+2 Invisibility', description: 'Add +2 to your existing Invisibility Bonus this round.', value: 2 },
            { label: '+4 Invisibility', description: 'Add +4 to your existing Invisibility Bonus this round.', value: 4 },
            { label: '+8 Invisibility', description: 'Add +8 to your existing Invisibility Bonus this round.', value: 8 },
        ],
        apply: async ({ actor, tier }) => {
            const combat = game.combat;
            const bonus = scaleStoneTier([1, 2, 4, 8], tier);
            if (bonus <= 0)
                return;
            const roundState = getRoundState(actor, combat);
            const sb = ensureStoneBonuses(roundState);
            sb.invisibilityBonus = Math.max(sb.invisibilityBonus ?? 0, bonus);
            await setRoundState(actor, roundState);
        },
    },
];
// ---------------------------------------------------------------------------
// Vitality
// ---------------------------------------------------------------------------
const VITALITY_POWERS_RAW = [
    {
        id: 'vitality.tempHp',
        name: 'Temporary HP',
        attribute: 'vitality',
        category: 'passive',
        oncePerCombat: true,
        description: 'Gain Temporary HP that lasts until depleted or combat ends (20 / 40 / 80 / 160). Once per combat; regenerated Stones do not allow a second activation.',
        tiers: [
            { label: '20 Temp HP', description: 'Gain 20 Temporary HP until depleted or combat ends. Once per combat.', value: 20 },
            { label: '40 Temp HP', description: 'Gain 40 Temporary HP until depleted or combat ends. Once per combat.', value: 40 },
            { label: '80 Temp HP', description: 'Gain 80 Temporary HP until depleted or combat ends. Once per combat.', value: 80 },
            { label: '160 Temp HP', description: 'Gain 160 Temporary HP until depleted or combat ends. Once per combat.', value: 160 },
        ],
        apply: async ({ actor, combatant, tier }) => {
            const c = combatant ??
                game.combat?.combatants?.find((x) => x.actor?.id === actor.id);
            if (isTempHpStoneUsedThisCombat(c, actor)) {
                ui.notifications?.warn(`${actor.name}: Temporary HP already used this combat.`);
                return;
            }
            // Tiers are cumulative TOTALS (20/40/80/160), not per-wave increments.
            const hp = scaleStoneTier([20, 40, 80, 160], tier);
            // Canonical field is `tempHP` (capital P) — the damage pipeline and all
            // health math read/consume that. Persists until depleted or combat ends.
            const current = Math.max(0, Number(actor.system?.health?.tempHP ?? 0) || 0);
            await actor.update?.({ 'system.health.tempHP': current + hp });
            await markTempHpStoneUsedThisCombat(c, actor);
            ui.notifications?.info(`${actor.name}: ${hp} Temp HP until depleted or combat ends.`);
        },
    },
    {
        id: 'vitality.damageNegation',
        name: 'Damage Negation',
        attribute: 'vitality',
        category: 'passive',
        description: 'Premium. Gain Damage Negation until the start of your next turn (R1–R4: +4/+8/+12/+16). Creates it if you do not have it.',
        tiers: [
            { label: '+4 Damage Negation', description: 'Gain +4 Damage Negation until the start of your next turn.', value: 4 },
            { label: '+8 Damage Negation', description: 'Gain +8 Damage Negation until the start of your next turn.', value: 8 },
            { label: '+12 Damage Negation', description: 'Gain +12 Damage Negation until the start of your next turn.', value: 12 },
            { label: '+16 Damage Negation', description: 'Gain +16 Damage Negation until the start of your next turn.', value: 16 },
        ],
        apply: async ({ actor, tier }) => {
            const combat = game.combat;
            const bonus = scaleStoneTier([4, 8, 12, 16], tier);
            if (bonus <= 0)
                return;
            const roundState = getRoundState(actor, combat);
            const sb = ensureStoneBonuses(roundState);
            // Re-activation ADDs (PG "Temporary Defensive Stone Values").
            sb.tempDamageNegation = (sb.tempDamageNegation ?? 0) + bonus;
            await setRoundState(actor, roundState);
        },
    },
    {
        id: 'vitality.removeScar',
        name: 'Remove Scar',
        attribute: 'vitality',
        category: 'action',
        description: 'Seal Vitality Stones to resolve Tiers (1 / 2 / 4 / 8, cumulative). Each newly resolved Tier recovers 1 Scarred Health Bar. Tiers already resolved since the last Daily Reset are not paid again. Colorless Stones cannot pay this cost.',
        tiers: [
            { label: 'Seal 1 / 1 Scar', description: 'Seal 1 Vitality Stone. Recover 1 Scarred Health Bar (Tier 1).', value: 1 },
            { label: 'Seal 3 / 2 Scars', description: 'Resolve Tiers 1–2 (Seal 3 total). Recover 1 Scarred Health Bar per newly resolved Tier.', value: 2 },
            { label: 'Seal 7 / 3 Scars', description: 'Resolve Tiers 1–3 (Seal 7 total). Recover 1 Scarred Health Bar per newly resolved Tier.', value: 3 },
            { label: 'Seal 15 / 4 Scars', description: 'Resolve Tiers 1–4 (Seal 15 total). Recover 1 Scarred Health Bar per newly resolved Tier.', value: 4 },
        ],
        apply: async ({ actor, tier }) => {
            // Heal + Daily resolved flag only. Sealing is done by payAndApplyRemoveScar /
            // spendStoneAbility — never Exhaust for this ability.
            await applyRemoveScarEffect(actor, tier);
        },
    },
    {
        // Technical id kept for saved characters / Hunter's Scourge (R-02 rename).
        id: 'vitality.damageMaximization',
        name: 'Maximization',
        attribute: 'vitality',
        category: 'action',
        oncePerCombat: true,
        description: 'Once per combat, at the first Preparation Phase, gain 1/2/3/4 Maximizations shared between complete Damage Rolls and Healing Rolls (every die is 8). Forced 8s are not natural 8s and do not explode. Cannot be activated again this combat.',
        tiers: [
            { label: '1 Maximization', description: 'Maximize 1 complete Damage or Healing Roll this combat.', value: 1 },
            { label: '2 Maximizations', description: 'Maximize 2 complete Damage or Healing Rolls this combat.', value: 2 },
            { label: '3 Maximizations', description: 'Maximize 3 complete Damage or Healing Rolls this combat.', value: 3 },
            { label: '4 Maximizations', description: 'Maximize 4 complete Damage or Healing Rolls this combat.', value: 4 },
        ],
        apply: async ({ actor, tier }) => {
            const combat = game.combat;
            const combatId = String(combat?.id || '');
            const prior = actor.getFlag?.('mastery-system', 'damageMaximization');
            if (prior?.used && (!combatId || prior.combatId === combatId)) {
                ui.notifications?.warn(`${actor.name}: Maximization was already activated this combat.`);
                return;
            }
            const uses = scaleStoneTier([1, 2, 3, 4], tier);
            if (uses <= 0)
                return;
            const round = Math.max(1, Math.floor(Number(combat?.round) || 1));
            if (combat?.started && round > 1) {
                ui.notifications?.warn(`${actor.name}: Maximization can only be activated in the first Preparation Phase.`);
                return;
            }
            await actor.setFlag?.('mastery-system', 'damageMaximization', {
                uses,
                remaining: uses,
                combatId,
                used: true,
            });
        },
    },
];
// ---------------------------------------------------------------------------
// Intellect
// ---------------------------------------------------------------------------
const INTELLECT_POWERS_RAW = [
    {
        id: 'intellect.rangeAoe',
        name: 'Range & AoE Boost',
        attribute: 'intellect',
        category: 'action',
        description: 'This round: +10/+20/+30/+40 m Range, +2/+4/+6/+8 m Melee Reach, and +1/+2/+3/+4 m to an existing AoE radius. Does not create range or an AoE.',
        tiers: [
            { label: '+10 m / +2 m / +1 m', description: '+10 m Range, +2 m Melee Reach, +1 m existing AoE radius.', value: 10 },
            { label: '+20 m / +4 m / +2 m', description: '+20 m Range, +4 m Melee Reach, +2 m existing AoE radius.', value: 20 },
            { label: '+30 m / +6 m / +3 m', description: '+30 m Range, +6 m Melee Reach, +3 m existing AoE radius.', value: 30 },
            { label: '+40 m / +8 m / +4 m', description: '+40 m Range, +8 m Melee Reach, +4 m existing AoE radius.', value: 40 },
        ],
        apply: async ({ actor, tier }) => {
            const combat = game.combat;
            const range = scaleStoneTier([10, 20, 30, 40], tier);
            if (range <= 0)
                return;
            const roundState = getRoundState(actor, combat);
            const sb = ensureStoneBonuses(roundState);
            sb.rangeBonusM = Math.max(sb.rangeBonusM ?? 0, range);
            sb.meleeReachBonusM = Math.max(sb.meleeReachBonusM ?? 0, scaleStoneTier([2, 4, 6, 8], tier));
            sb.aoeRadiusBonusM = Math.max(sb.aoeRadiusBonusM ?? 0, scaleStoneTier([1, 2, 3, 4], tier));
            await setRoundState(actor, roundState);
        },
    },
    {
        id: 'intellect.raises',
        name: 'Raises',
        attribute: 'intellect',
        category: 'action',
        description: 'A shared allowance of 2/4/6/8 Raises this round. They do not increase the TN. Unused Raises expire at the end of the Round. Spent whether the roll succeeds or fails.',
        tiers: [
            { label: '2 Raises', description: '2 Raises this round. They do not increase the TN.', value: 2 },
            { label: '4 Raises', description: '4 Raises this round. They do not increase the TN.', value: 4 },
            { label: '6 Raises', description: '6 Raises this round. They do not increase the TN.', value: 6 },
            { label: '8 Raises', description: '8 Raises this round. They do not increase the TN.', value: 8 },
        ],
        apply: async ({ actor, tier }) => {
            const combat = game.combat;
            const bonus = scaleStoneTier([2, 4, 6, 8], tier);
            if (bonus <= 0)
                return;
            const roundState = getRoundState(actor, combat);
            const sb = ensureStoneBonuses(roundState);
            sb.freeRaises = Math.max(sb.freeRaises ?? 0, bonus);
            await setRoundState(actor, roundState);
        },
    },
    {
        id: 'intellect.spellResistance',
        name: 'Spell Resistance',
        attribute: 'intellect',
        category: 'passive',
        description: 'Until the start of your next turn, gain +4 / +8 / +12 / +16 Spell Resistance. This increases the Final Spell TN of both direct Spells and Spell AoEs checked against you.',
        tiers: [
            { label: '+4 Spell Resistance', description: 'Gain +4 Spell Resistance until the start of your next turn (direct Spells and Spell AoEs).', value: 4 },
            { label: '+8 Spell Resistance', description: 'Gain +8 Spell Resistance until the start of your next turn (direct Spells and Spell AoEs).', value: 8 },
            { label: '+12 Spell Resistance', description: 'Gain +12 Spell Resistance until the start of your next turn (direct Spells and Spell AoEs).', value: 12 },
            { label: '+16 Spell Resistance', description: 'Gain +16 Spell Resistance until the start of your next turn (direct Spells and Spell AoEs).', value: 16 },
        ],
        apply: async ({ actor, tier }) => {
            const combat = game.combat;
            const bonus = scaleStoneTier([4, 8, 12, 16], tier);
            const roundState = getRoundState(actor, combat);
            const sb = ensureStoneBonuses(roundState);
            sb.spellResistanceBonus = (sb.spellResistanceBonus ?? 0) + bonus;
            await setRoundState(actor, roundState);
        },
    },
    {
        id: 'intellect.specialBoost',
        name: 'Special Boost',
        attribute: 'intellect',
        category: 'action',
        description: 'Premium. Every numeric Special(X) you successfully apply this round, Martial or Spell, increases by +2 / +4 / +8 / +12. ' +
            'This is not Active Buff: Special Increase.',
        tiers: [
            { label: '+2 Special(X)', description: 'Every numeric Special(X) you apply this round increases by +2.', value: 2 },
            { label: '+4 Special(X)', description: 'Every numeric Special(X) you apply this round increases by +4.', value: 4 },
            { label: '+8 Special(X)', description: 'Every numeric Special(X) you apply this round increases by +8.', value: 8 },
            { label: '+12 Special(X)', description: 'Every numeric Special(X) you apply this round increases by +12.', value: 12 },
        ],
        apply: async ({ actor, tier }) => {
            const combat = game.combat;
            const bonus = scaleStoneTier([2, 4, 8, 12], tier);
            const roundState = getRoundState(actor, combat);
            const sb = ensureStoneBonuses(roundState);
            const next = Math.max(sb.specialBoost ?? 0, sb.spellSpecialBoost ?? 0, bonus);
            sb.specialBoost = next;
            sb.spellSpecialBoost = next;
            await setRoundState(actor, roundState);
        },
    },
];
// ---------------------------------------------------------------------------
// Resolve
// ---------------------------------------------------------------------------
const RESOLVE_POWERS_RAW = [
    {
        id: 'resolve.healing',
        name: 'Healing',
        attribute: 'resolve',
        category: 'action',
        description: 'You or one ally within range heals HP in their current Health Bar. ' +
            'T1: 4d8@2 m, T2: 8d8@4 m, T3: 12d8@8 m, T4: 16d8@16 m.',
        tiers: [
            { label: 'Heal 4d8 (2 m)', description: 'You or one ally within 2 m heals 4d8 HP in their current Health Bar.', value: 4 },
            { label: 'Heal 8d8 (4 m)', description: 'You or one ally within 4 m heals 8d8 HP in their current Health Bar.', value: 8 },
            { label: 'Heal 12d8 (8 m)', description: 'You or one ally within 8 m heals 12d8 HP in their current Health Bar.', value: 12 },
            { label: 'Heal 16d8 (16 m)', description: 'You or one ally within 16 m heals 16d8 HP in their current Health Bar.', value: 16 },
        ],
        apply: async () => {
            // Target, roll, cap, and chat belong to the post-commit resolution queue.
        },
    },
    {
        id: 'resolve.activeBuffEmpowerment',
        name: 'Active Buff Empowerment',
        attribute: 'resolve',
        category: 'action',
        description: 'One Active Buff this round gains +1/+2/+3/+4 Power Level and +1/+2/+3/+4 Rounds. Power Level still caps at 16. Multiple sources do not stack.',
        tiers: [
            { label: '+1 PL, +1 Round', description: 'One Active Buff this round gains +1 Power Level and +1 Round.', value: 1 },
            { label: '+2 PL, +2 Rounds', description: 'One Active Buff this round gains +2 Power Level and +2 Rounds.', value: 2 },
            { label: '+3 PL, +3 Rounds', description: 'One Active Buff this round gains +3 Power Level and +3 Rounds.', value: 3 },
            { label: '+4 PL, +4 Rounds', description: 'One Active Buff this round gains +4 Power Level and +4 Rounds.', value: 4 },
        ],
        apply: async ({ actor, tier }) => {
            const combat = game.combat;
            const bonus = scaleStoneTier([1, 2, 3, 4], tier);
            if (bonus <= 0)
                return;
            const roundState = getRoundState(actor, combat);
            const sb = ensureStoneBonuses(roundState);
            sb.extendActiveBuffRounds = Math.max(sb.extendActiveBuffRounds ?? 0, bonus);
            sb.activeBuffPlBonus = Math.max(sb.activeBuffPlBonus ?? 0, bonus);
            await setRoundState(actor, roundState);
        },
    },
    {
        id: 'resolve.damageReduction',
        name: 'Damage Reduction',
        attribute: 'resolve',
        category: 'passive',
        description: 'Premium. Gain Damage Reduction until the start of your next turn (R1–R4: +10%/+20%/+30%/+40%). Creates it if you do not have it.',
        tiers: [
            { label: '+10% DR', description: 'Gain +10% Damage Reduction until the start of your next turn.', value: 10 },
            { label: '+20% DR', description: 'Gain +20% Damage Reduction until the start of your next turn.', value: 20 },
            { label: '+30% DR', description: 'Gain +30% Damage Reduction until the start of your next turn.', value: 30 },
            { label: '+40% DR', description: 'Gain +40% Damage Reduction until the start of your next turn.', value: 40 },
        ],
        apply: async ({ actor, tier }) => {
            const combat = game.combat;
            // Re-activation ADDs (PG "Temporary Defensive Stone Values").
            const pct = scaleStoneTier([10, 20, 30, 40], tier);
            if (pct <= 0)
                return;
            const roundState = getRoundState(actor, combat);
            const sb = ensureStoneBonuses(roundState);
            sb.damageReductionBoostPct = (sb.damageReductionBoostPct ?? 0) + pct;
            await setRoundState(actor, roundState);
        },
    },
    {
        id: 'resolve.ward',
        name: 'Special Negation',
        attribute: 'resolve',
        category: 'passive',
        description: 'Ward reduces every incoming hostile Special(X) by this value until the start of your next turn (+2 / +4 / +8 / +12). Creates Ward if you do not have it. Positive effects such as Regeneration are not reduced.',
        tiers: [
            { label: 'Specials −2', description: 'Until the start of your next turn, every incoming hostile Special(X) is reduced by 2. Positive effects are not reduced.', value: 2 },
            { label: 'Specials −4', description: 'Until the start of your next turn, every incoming hostile Special(X) is reduced by 4. Positive effects are not reduced.', value: 4 },
            { label: 'Specials −8', description: 'Until the start of your next turn, every incoming hostile Special(X) is reduced by 8. Positive effects are not reduced.', value: 8 },
            { label: 'Specials −12', description: 'Until the start of your next turn, every incoming hostile Special(X) is reduced by 12. Positive effects are not reduced.', value: 12 },
        ],
        apply: async ({ actor, tier }) => {
            const combat = game.combat;
            const bonus = scaleStoneTier([2, 4, 8, 12], tier);
            const roundState = getRoundState(actor, combat);
            const sb = ensureStoneBonuses(roundState);
            // Re-activation ADDs (PG "Temporary Defensive Stone Values").
            sb.tempWard = (sb.tempWard ?? 0) + bonus;
            sb.incomingSpecialReduction = (sb.incomingSpecialReduction ?? 0) + bonus;
            await setRoundState(actor, roundState);
        },
    },
];
// ---------------------------------------------------------------------------
// Influence
// ---------------------------------------------------------------------------
const INFLUENCE_POWERS_RAW = [
    {
        id: 'influence.cleanse',
        name: 'Cleanse',
        attribute: 'influence',
        category: 'action',
        description: 'Cleanse(2/4/8/16) on one creature within 20 m.',
        tiers: [
            { label: 'Cleanse(2)', description: 'Cleanse(2) on one creature within 20 m.', value: 2 },
            { label: 'Cleanse(4)', description: 'Cleanse(4) on one creature within 20 m.', value: 4 },
            { label: 'Cleanse(8)', description: 'Cleanse(8) on one creature within 20 m.', value: 8 },
            { label: 'Cleanse(16)', description: 'Cleanse(16) on one creature within 20 m.', value: 16 },
        ],
        apply: async ({ actor, tier }) => {
            const value = scaleStoneTier([2, 4, 8, 16], tier);
            if (value <= 0)
                return;
            await actor.setFlag?.('mastery-system', 'pendingCleanse', { value, range: 20 });
            const target = await promptSelectablePlayerTarget({
                caster: actor,
                title: 'Cleanse',
                hint: `Cleanse(${value}) on one creature within 20 m.`,
                anyCreature: true,
            });
            if (!target)
                return;
            try {
                const { distanceBetweenActorsMeters } = await import('../combat/reaction-eligibility.js');
                const meters = distanceBetweenActorsMeters(actor, target);
                if (meters != null && meters > 20.05) {
                    ui.notifications?.warn(`${actor.name}: Cleanse only reaches 20 m.`);
                    return;
                }
            }
            catch {
                /* distance unknown — still apply */
            }
            const { applyCleanseToActor } = await import('../system/pool-reduction.js');
            await applyCleanseToActor(target, value);
            await actor.unsetFlag?.('mastery-system', 'pendingCleanse');
        },
    },
    {
        id: 'influence.colorlessRecovery',
        name: 'Colorless Recovery',
        attribute: 'influence',
        category: 'action',
        oncePerCombat: true,
        description: 'Once per combat, make 2/4/8/16 Colorless Stones eligible for the existing Mastery Rank recovery until combat ends. Activation stones are Exhausted, not Sealed. Does not recover them immediately and cannot be raised or used again.',
        tiers: [
            { label: '2 Colorless Stones', description: '2 Colorless Stones may be recovered with Stone Recovery until combat ends.', value: 2 },
            { label: '4 Colorless Stones', description: '4 Colorless Stones may be recovered with Stone Recovery until combat ends.', value: 4 },
            { label: '8 Colorless Stones', description: '8 Colorless Stones may be recovered with Stone Recovery until combat ends.', value: 8 },
            { label: '16 Colorless Stones', description: '16 Colorless Stones may be recovered with Stone Recovery until combat ends.', value: 16 },
        ],
        apply: async ({ actor, tier }) => {
            const { recordColorlessRecoveryActivation } = await import('./colorless-recovery.js');
            await recordColorlessRecoveryActivation(actor, tier);
        },
    },
    {
        id: 'influence.enemyEvadeReduction',
        name: 'Enemy Evade Reduction',
        attribute: 'influence',
        category: 'action',
        description: 'Enemies have −1/−2/−4/−8 Evade against your attacks only. This is not a Special on the target.',
        tiers: [
            { label: '−1 Evade', description: 'Your attacks this round treat enemy Evade as 1 lower.', value: 1 },
            { label: '−2 Evade', description: 'Your attacks this round treat enemy Evade as 2 lower.', value: 2 },
            { label: '−4 Evade', description: 'Your attacks this round treat enemy Evade as 4 lower.', value: 4 },
            { label: '−8 Evade', description: 'Your attacks this round treat enemy Evade as 8 lower.', value: 8 },
        ],
        apply: async ({ actor, tier }) => {
            const combat = game.combat;
            const bonus = scaleStoneTier([1, 2, 4, 8], tier);
            if (bonus <= 0)
                return;
            const roundState = getRoundState(actor, combat);
            const sb = ensureStoneBonuses(roundState);
            sb.enemyEvadeReduction = Math.max(sb.enemyEvadeReduction ?? 0, bonus);
            await setRoundState(actor, roundState);
        },
    },
    {
        id: 'influence.notATarget',
        name: 'Not a Target',
        attribute: 'influence',
        category: 'reaction',
        description: 'Premium. Enemies cannot target you with their next attack before the start of your next turn unless you are the only valid target. R1: 1@8 m, R2: 2@16 m, R3: 3@24 m, R4: 4@32 m.',
        tiers: [
            { label: '1 enemy @ 8 m', description: 'One enemy within 8 m cannot target you with its next attack before the start of your next turn unless you are the only valid target.', value: 1 },
            { label: '2 enemies @ 16 m', description: 'Up to 2 enemies within 16 m cannot target you with their next attack before the start of your next turn unless you are the only valid target.', value: 2 },
            { label: '3 enemies @ 24 m', description: 'Up to 3 enemies within 24 m cannot target you with their next attack before the start of your next turn unless you are the only valid target.', value: 3 },
            { label: '4 enemies @ 32 m', description: 'Up to 4 enemies within 32 m cannot target you with their next attack before the start of your next turn unless you are the only valid target.', value: 4 },
        ],
        apply: async ({ actor, tier }) => {
            const enemies = scaleStoneTier([1, 2, 3, 4], tier);
            const meters = scaleStoneTier([8, 16, 24, 32], tier);
            if (enemies <= 0)
                return;
            const { chooseCombatantActors, NOT_A_TARGET_FLAG } = await import('./stone-combat-effects.js');
            const picked = await chooseCombatantActors({
                title: 'Not a Target',
                hint: `Choose up to ${enemies} enemies within ${meters} m.`,
                caster: actor,
                max: enemies,
                maxRangeM: meters,
            });
            const combat = game.combat;
            await actor.setFlag?.('mastery-system', NOT_A_TARGET_FLAG, {
                enemyIds: picked.map((target) => String(target.id || '')).filter(Boolean),
                usedIds: [],
                range: meters,
                combatId: String(combat?.id || ''),
                round: Math.max(1, Math.floor(Number(combat?.round) || 1)),
            });
        },
    },
];
// ---------------------------------------------------------------------------
// Wits
// ---------------------------------------------------------------------------
const WITS_POWERS_RAW = [
    {
        id: 'wits.initiativeBoost',
        name: 'Initiative Boost',
        attribute: 'wits',
        category: 'reaction',
        oncePerCombat: true,
        description: 'During Preparation, before Initiative Exchange, once per combat, spend Wits Stones up to the highest complete tier (1 / 2 / 4 / 8 × Mastery Rank). Colorless Stones cannot pay this cost. The Initiative increase is applied before Initiative is converted, and the Colorless Stones bought from it are Ready in that same Preparation Phase. After that activation, no further Initiative Boost this combat.',
        tiers: [
            { label: '+1 × MR Initiative', description: 'Gain Initiative equal to your Mastery Rank.', value: 1 },
            { label: '+2 × MR Initiative', description: 'Gain Initiative equal to 2 × your Mastery Rank.', value: 2 },
            { label: '+4 × MR Initiative', description: 'Gain Initiative equal to 4 × your Mastery Rank.', value: 4 },
            { label: '+8 × MR Initiative', description: 'Gain Initiative equal to 8 × your Mastery Rank.', value: 8 },
        ],
        apply: async ({ actor, combatant, tier }) => {
            const combat = game.combat;
            const c = combatant ?? combat?.combatants?.find((x) => x.actor?.id === actor.id);
            if (isInitiativeBoostUsedThisCombat(c, actor)) {
                ui.notifications?.warn(`${actor.name}: Initiative Boost already used this combat.`);
                return;
            }
            const mr = getRulesMasteryRank(actor);
            const bonus = initiativeBoostAmount(tier, mr);
            const roundState = getRoundState(actor, combat);
            const sb = ensureStoneBonuses(roundState);
            sb.initiativeBonus = bonus;
            await setRoundState(actor, roundState);
            if (c && c.initiative !== null && c.initiative !== undefined) {
                const cur = Number(c.initiative) || 0;
                await c.update({ initiative: cur + bonus });
                await c.setFlag('mastery-system', 'msInitiativeValue', cur + bonus);
            }
            await markInitiativeBoostUsedThisCombat(c, actor);
            ui.notifications?.info(`${actor.name}: Initiative Boost +${bonus} (MR ${mr} × ${2 ** (tier - 1)}).`);
            try {
                const ChatMessage = globalThis.ChatMessage;
                if (typeof ChatMessage?.create === 'function') {
                    const source = String(actor.name || 'Someone')
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;');
                    await ChatMessage.create({
                        content: `<div class="mastery-stone-resolution"><p><strong>${source}</strong> — Initiative Boost</p><p>+${bonus} Initiative (Mastery Rank ${mr} × ${2 ** (tier - 1)}).</p></div>`,
                    });
                }
            }
            catch {
                /* the bonus is already on the combatant */
            }
        },
    },
    {
        id: 'wits.phasing',
        name: 'Phasing',
        attribute: 'wits',
        category: 'reaction',
        oncePerCombat: true,
        description: 'Premium. Once per combat, gain Phasing Charges that persist until spent or combat ends (R1–R4: 1/2/3/4).',
        tiers: [
            { label: '1 Phasing Charge', description: 'Gain 1 Phasing Charge (once per combat).', value: 1 },
            { label: '2 Phasing Charges', description: 'Gain 2 Phasing Charges (once per combat).', value: 2 },
            { label: '3 Phasing Charges', description: 'Gain 3 Phasing Charges (once per combat).', value: 3 },
            { label: '4 Phasing Charges', description: 'Gain 4 Phasing Charges (once per combat).', value: 4 },
        ],
        apply: async ({ actor, combatant, tier }) => {
            if (isPhasingStoneUsedThisCombat(combatant, actor)) {
                ui.notifications?.warn(`${actor.name}: Phasing already used this combat.`);
                return;
            }
            const charges = scaleStoneTier([1, 2, 3, 4], tier);
            if (charges <= 0)
                return;
            const combat = game.combat;
            await augmentPhasingCharges(actor, combat, charges, {
                ownerKind: 'reaction',
                ownerId: 'wits.phasing',
                name: 'Phasing (Stone Power)',
            });
            await markPhasingStoneUsedThisCombat(combatant, actor);
            ui.notifications?.info(`${actor.name}: Phasing — ${charges} charge(s) (once per combat).`);
        },
    },
    {
        id: 'wits.reactionDenial',
        name: 'Reaction Denial',
        attribute: 'wits',
        category: 'action',
        description: 'Prevent the next 1/2/3/4 Reactions of one chosen enemy this round. A denied declaration does not consume their Reaction, and they cannot declare that same Reaction against the same trigger.',
        tiers: [
            { label: 'Deny 1 Reaction', description: 'One chosen enemy loses their next Reaction this round.', value: 1 },
            { label: 'Deny 2 Reactions', description: 'One chosen enemy loses their next 2 Reactions this round.', value: 2 },
            { label: 'Deny 3 Reactions', description: 'One chosen enemy loses their next 3 Reactions this round.', value: 3 },
            { label: 'Deny 4 Reactions', description: 'One chosen enemy loses their next 4 Reactions this round.', value: 4 },
        ],
        apply: async ({ actor, tier }) => {
            const count = scaleStoneTier([1, 2, 3, 4], tier);
            if (count <= 0)
                return;
            const { chooseCombatantActors, REACTION_DENIAL_FLAG } = await import('./stone-combat-effects.js');
            const [enemy] = await chooseCombatantActors({
                title: 'Reaction Denial',
                hint: `Choose one enemy. Their next ${count} Reactions this Round are denied.`,
                caster: actor,
                max: 1,
            });
            if (!enemy) {
                await actor.setFlag?.('mastery-system', 'pendingReactionDenial', { count });
                return;
            }
            const combat = game.combat;
            await enemy.setFlag?.('mastery-system', REACTION_DENIAL_FLAG, {
                remaining: count,
                combatId: String(combat?.id || ''),
                round: Math.max(1, Math.floor(Number(combat?.round) || 1)),
                denied: [],
            });
        },
    },
    {
        id: 'wits.movementReduction',
        name: 'Movement Reduction',
        attribute: 'wits',
        category: 'action',
        description: 'Halve each Movement Action of 1/2/3/4 chosen enemies this round. Round a half-metre up (5→3, 7→4, 9→5).',
        tiers: [
            { label: '1 enemy', description: 'Halve each Movement Action of 1 chosen enemy this round.', value: 1 },
            { label: '2 enemies', description: 'Halve each Movement Action of 2 chosen enemies this round.', value: 2 },
            { label: '3 enemies', description: 'Halve each Movement Action of 3 chosen enemies this round.', value: 3 },
            { label: '4 enemies', description: 'Halve each Movement Action of 4 chosen enemies this round.', value: 4 },
        ],
        apply: async ({ actor, tier }) => {
            const count = scaleStoneTier([1, 2, 3, 4], tier);
            if (count <= 0)
                return;
            const { chooseCombatantActors, markMovementReductionTargets } = await import('./stone-combat-effects.js');
            const picked = await chooseCombatantActors({
                title: 'Movement Reduction',
                hint: `Choose up to ${count} enemies. Each of their Movement Actions is halved this Round.`,
                caster: actor,
                max: count,
            });
            if (!picked.length) {
                await actor.setFlag?.('mastery-system', 'pendingMovementReduction', { count });
                return;
            }
            await markMovementReductionTargets(picked, count, game.combat);
        },
    },
];
// ---------------------------------------------------------------------------
// Registry + finalization (auto-compile `.effect`)
// ---------------------------------------------------------------------------
function finalize(list) {
    return list.map((p) => ({
        ...p,
        premium: isPremiumStonePower(p.id),
        effect: compileEffectText(p.name, p.tiers, p.id),
    }));
}
function leadPremium(list) {
    const lead = list.filter((p) => p.premium && !p.oncePerCombat);
    const mid = list.filter((p) => !p.premium && !p.oncePerCombat);
    const once = list.filter((p) => p.oncePerCombat);
    return [...lead, ...mid, ...once];
}
const GENERIC_POWERS = finalize(GENERIC_POWERS_RAW);
const MIGHT_POWERS = finalize(MIGHT_POWERS_RAW);
const AGILITY_POWERS = finalize(AGILITY_POWERS_RAW);
const VITALITY_POWERS = finalize(VITALITY_POWERS_RAW);
const INTELLECT_POWERS = finalize(INTELLECT_POWERS_RAW);
const RESOLVE_POWERS = finalize(RESOLVE_POWERS_RAW);
const INFLUENCE_POWERS = finalize(INFLUENCE_POWERS_RAW);
const WITS_POWERS = finalize(WITS_POWERS_RAW);
export const STONE_POWERS = {};
[
    ...GENERIC_POWERS,
    ...MIGHT_POWERS,
    ...AGILITY_POWERS,
    ...VITALITY_POWERS,
    ...INTELLECT_POWERS,
    ...RESOLVE_POWERS,
    ...INFLUENCE_POWERS,
    ...WITS_POWERS,
].forEach((power) => {
    STONE_POWERS[power.id] = power;
});
/** Stone Powers dialog: Premium Phasing leads. Initiative Boost is last and not a drop target. */
export const WITS_DIALOG_COLUMN_ORDER = [
    'wits.phasing',
    'wits.reactionDenial',
    'wits.movementReduction',
    'wits.initiativeBoost',
];
export function orderWitsDialogColumn(defs) {
    const rank = new Map(WITS_DIALOG_COLUMN_ORDER.map((id, index) => [id, index]));
    return [...defs].sort((a, b) => (rank.get(a.id) ?? 50) - (rank.get(b.id) ?? 50));
}
export const STONE_POWERS_BY_ATTRIBUTE = {
    generic: leadPremium(GENERIC_POWERS),
    might: leadPremium(MIGHT_POWERS),
    agility: leadPremium(AGILITY_POWERS),
    vitality: leadPremium(VITALITY_POWERS),
    intellect: leadPremium(INTELLECT_POWERS),
    resolve: leadPremium(RESOLVE_POWERS),
    influence: leadPremium(INFLUENCE_POWERS),
    wits: leadPremium(WITS_POWERS),
};
/**
 * Convert a usage count (0-indexed; activations this turn BEFORE this one)
 * to the matching tier. Tier 4 is the last tier.
 */
export function tierForUseIndex(usesBefore) {
    return Math.max(1, Math.min(STONE_TIER_HARD_MAX, Math.floor(usesBefore) + 1));
}
/** Printed Support Rank, clamped to the real Rank range (0 = no Support). */
export function effectiveStoneSupportPrefillTier(powerId, printedTier) {
    void powerId;
    const printed = Math.max(0, Math.floor(Number(printedTier) || 0));
    return Math.min(STONE_TIER_HARD_MAX, printed);
}
/** Lane indices for one Rank of this Ability (segments sized by its cost curve). */
export function stonePaymentLanesForTier(powerId, rank) {
    const r = Math.floor(Number(rank) || 0);
    if (r < 1 || r > STONE_TIER_HARD_MAX)
        return [];
    const sizes = stonePowerSegmentSizes(powerId);
    let start = 0;
    for (let i = 0; i < r - 1; i += 1)
        start += sizes[i] ?? 0;
    const size = sizes[r - 1] ?? 0;
    return Array.from({ length: size }, (_, i) => start + i);
}
/** Total payment lanes for this Ability (Normal 15, Premium 20). */
export function stonePaymentLaneCount(powerId) {
    return stonePowerSegmentSizes(powerId).reduce((sum, n) => sum + n, 0);
}
/**
 * Gold Artifact Support Stone lanes: exactly the pre-filled Rank. Every other
 * Rank keeps its normal payable lanes.
 */
export function stoneSupportPrefillLanes(powerId, printedTier) {
    const rank = effectiveStoneSupportPrefillTier(powerId, printedTier);
    if (rank <= 0)
        return [];
    return stonePaymentLanesForTier(powerId, rank);
}
/** True when a Support prefill exists (Rank 1–4). The named Rank costs no Stones. */
export function stonePowerSupportPrefillApplies(powerId, printedTier) {
    return effectiveStoneSupportPrefillTier(powerId, printedTier) > 0;
}
/**
 * Per-power adjustment applied to Artifact Stone Power Support pre-fill Ranks.
 * No power is currently shifted: printed support Ranks are used as-is. Kept
 * as a map in case a future table diverges.
 */
export const STONE_POWER_SUPPORT_TIER_SHIFT = {};
/** Retired Stone Power ids that have no successor (cannot auto-remap). */
export const UNRESOLVED_STONE_POWER_IDS = [
    'might.attackPoolReduction',
    'vitality.endureSpecial',
    'wits.initiativeShop',
];
//# sourceMappingURL=stone-powers.js.map