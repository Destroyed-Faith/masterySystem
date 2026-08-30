/**
 * Reaction Power Templates
 *
 * Source: Rules/reactions.md — Levels 1..16.
 * Single-axis defensive answers (Armor / Evade / Temp HP), two-axis combos,
 * Ally Protection variants, closed premium subsystems (DR, Phasing),
 * retaliatory Counter Damage / Special Increase, Initiative Gain, Reposition,
 * plus Parry/Absorption/Cleanse utility lines.
 */

import type { PowerTemplate } from './_shared.js';
import { buildLevels, reactionRow } from './_shared.js';
import type { RangeSpec } from '../../../types/item.js';

const SELF: RangeSpec = { kind: 'self' };
const ALLY_4M: RangeSpec = { kind: 'distance', m: 4, note: 'ally' };
const NEAR_2M: RangeSpec = { kind: 'distance', m: 2, note: 'triggering enemy' };

// Curve tables (L1..L16). Source: Reaction.md level-by-level calculations.
const ARMOR = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32];
const EVADE = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32];
const TEMP_HP = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80];

const COMBO_A = { armor: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], temp: [2, 5, 7, 10, 12, 15, 17, 20, 22, 25, 27, 30, 32, 35, 37, 40] };
const COMBO_E = { evade: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], temp: [2, 5, 7, 10, 12, 15, 17, 20, 22, 25, 27, 30, 32, 35, 37, 40] };

const ALLY_ARMOR = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31];
const ALLY_EVADE = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31];
const ALLY_TEMP = [2, 7, 12, 17, 22, 27, 32, 37, 42, 47, 52, 57, 62, 67, 72, 77];

const COUNTER_DMG = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
const COUNTER_DMG_PUSH_D = [1, 1, 2, 2, 3, 3, 4, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const COUNTER_DMG_PUSH_M = [0, 2, 2, 4, 4, 6, 6, 8, 8, 8, 8, 8, 8, 8, 8, 8];
const INITIATIVE_GAIN = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32];
/** Reposition distance (m) — L4=2, L10=4, L16=8 (10 PP / m milestone curve). */
const REPOSITION_M = [0, 0, 0, 2, 2, 3, 3, 4, 4, 4, 5, 5, 6, 6, 7, 8];

/** Repositioning Intercept — pre-resolve movement (m). */
const INTERCEPT_M = [0, 0, 0, 2, 2, 2, 2, 4, 4, 4, 4, 6, 6, 6, 8, 8];

/** Reactive Cleanse — reduce triggering ongoing effect by N. */
const REACTIVE_CLEANSE = [4, 8, 16, 20, 24, 32, 36, 40, 48, 52, 56, 64, 68, 72, 80, 84];

/** Reactive Overload — Absorbed Damage multiplier. */
const OVERLOAD_MULT = [2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5];

export const REACTION_TEMPLATES: PowerTemplate[] = [
    {
        templateId: 'reaction-armor',
        templateName: 'Armor',
        name: 'Reaction: Armor',
        subfamily: 'armor',
        category: 'reaction',
        tags: [],
        fluff: 'You harden, brace, block, deflect, or reinforce yourself against one incoming strike.',
        trigger: 'When you are hit or would take damage',
        cost: { action: 'reaction' },
        roll: { kind: 'none' },
        levels: buildLevels((lvl) =>
            reactionRow({
                effectText: `Gain **+${ARMOR[lvl - 1]} Armor** against the triggering attack or damage instance.`,
                mechanics: { armor: ARMOR[lvl - 1] },
            }),
        ),
    },
    {
        templateId: 'reaction-evade',
        templateName: 'Evade',
        name: 'Reaction: Evade',
        subfamily: 'evade',
        category: 'reaction',
        tags: [],
        fluff: 'You slip, twist, blur, or move just enough to make one attack fail to find you cleanly.',
        trigger: 'When you are targeted by an attack',
        cost: { action: 'reaction' },
        roll: { kind: 'none' },
        levels: buildLevels((lvl) =>
            reactionRow({
                effectText: `Gain **+${EVADE[lvl - 1]} Evade** against the triggering attack.`,
                mechanics: { evade: EVADE[lvl - 1] },
            }),
        ),
    },
    {
        templateId: 'reaction-temp-hp',
        templateName: 'Temporary HP',
        name: 'Reaction: Temporary HP',
        subfamily: 'temp-hp',
        category: 'reaction',
        tags: [],
        fluff: 'A sudden buffer forms between you and the incoming harm.',
        trigger: 'When you would take damage',
        cost: { action: 'reaction' },
        roll: { kind: 'none' },
        levels: buildLevels((lvl) =>
            reactionRow({
                effectText: `Gain **${TEMP_HP[lvl - 1]} Temporary HP** against the triggering damage instance. Remaining Temporary HP disappears at the end of your next turn.`,
                mechanics: { tempHP: String(TEMP_HP[lvl - 1]) },
            }),
        ),
    },
    {
        templateId: 'reaction-armor-temp-hp',
        templateName: 'Armor + Temporary HP',
        name: 'Reaction: Armor + Temporary HP',
        subfamily: 'combined',
        category: 'reaction',
        tags: [],
        fluff: 'You both harden yourself and absorb the force that still breaks through.',
        trigger: 'When you would take damage',
        cost: { action: 'reaction' },
        roll: { kind: 'none' },
        levels: buildLevels((lvl) =>
            reactionRow({
                effectText: `Gain **+${COMBO_A.armor[lvl - 1]} Armor** and **${COMBO_A.temp[lvl - 1]} Temporary HP** against the triggering damage instance.`,
                mechanics: { armor: COMBO_A.armor[lvl - 1], tempHP: String(COMBO_A.temp[lvl - 1]) },
            }),
        ),
    },
    {
        templateId: 'reaction-evade-temp-hp',
        templateName: 'Evade + Temporary HP',
        name: 'Reaction: Evade + Temporary HP',
        subfamily: 'combined',
        category: 'reaction',
        tags: [],
        fluff: 'You slip the worst angle of the attack and form a sudden buffer against whatever still connects.',
        trigger: 'When you are targeted by an attack',
        cost: { action: 'reaction' },
        roll: { kind: 'none' },
        levels: buildLevels((lvl) =>
            reactionRow({
                effectText: `Gain **+${COMBO_E.evade[lvl - 1]} Evade** against the triggering attack. If it still deals damage, gain **${COMBO_E.temp[lvl - 1]} Temporary HP**.`,
                mechanics: { evade: COMBO_E.evade[lvl - 1], tempHP: String(COMBO_E.temp[lvl - 1]) },
            }),
        ),
    },
    {
        templateId: 'reaction-ally-armor',
        templateName: 'Ally Armor',
        name: 'Reaction: Ally Armor',
        subfamily: 'ally',
        category: 'reaction',
        tags: [],
        fluff: 'You interpose protection, force, shieldwork, magic, or a guarding stance between an ally and harm.',
        trigger: 'When an ally within 4 m is hit or would take damage',
        cost: { action: 'reaction' },
        roll: { kind: 'none' },
        levels: buildLevels((lvl) =>
            reactionRow({
                range: ALLY_4M,
                effectText: `The ally gains **+${ALLY_ARMOR[lvl - 1]} Armor** against the triggering attack or damage instance.`,
                mechanics: { armor: ALLY_ARMOR[lvl - 1] },
            }),
        ),
    },
    {
        templateId: 'reaction-ally-evade',
        templateName: 'Ally Evade',
        name: 'Reaction: Ally Evade',
        subfamily: 'ally',
        category: 'reaction',
        tags: [],
        fluff: "You pull an ally out of the clean line of attack, distort the angle, warn them, shield their movement, or disrupt the enemy's aim.",
        trigger: 'When an ally within 4 m is targeted by an attack',
        cost: { action: 'reaction' },
        roll: { kind: 'none' },
        levels: buildLevels((lvl) =>
            reactionRow({
                range: ALLY_4M,
                effectText: `The ally gains **+${ALLY_EVADE[lvl - 1]} Evade** against the triggering attack.`,
                mechanics: { evade: ALLY_EVADE[lvl - 1] },
            }),
        ),
    },
    {
        templateId: 'reaction-ally-temp-hp',
        templateName: 'Ally Temporary HP',
        name: 'Reaction: Ally Temporary HP',
        subfamily: 'ally',
        category: 'reaction',
        tags: [],
        fluff: 'You throw a ward, shield, blessing, barrier, or protective impulse over an ally at the last possible moment.',
        trigger: 'When an ally within 4 m would take damage',
        cost: { action: 'reaction' },
        roll: { kind: 'none' },
        levels: buildLevels((lvl) =>
            reactionRow({
                range: ALLY_4M,
                effectText: `The ally gains **${ALLY_TEMP[lvl - 1]} Temporary HP** against the triggering damage instance.`,
                mechanics: { tempHP: String(ALLY_TEMP[lvl - 1]) },
            }),
        ),
    },
    {
        templateId: 'reaction-damage-reduction',
        templateName: 'Damage Reduction',
        name: 'Reaction: Damage Reduction',
        subfamily: 'damage-reduction',
        category: 'reaction',
        tags: [],
        fluff: 'Your existing damage resistance spikes for one decisive hit.',
        trigger: 'When you would take damage',
        cost: { action: 'reaction' },
        roll: { kind: 'none' },
        levels: buildLevels((lvl) => {
            const totalCap = lvl >= 15 ? 60 : lvl >= 12 ? 50 : lvl >= 8 ? 40 : lvl >= 4 ? 30 : 0;
            const empty = totalCap === 0;
            return reactionRow({
                range: SELF,
                effectText: empty
                    ? '—'
                    : `If you currently have **Damage Reduction from a Passive**, increase that DR by **+10%** against the triggering damage instance, up to **${totalCap}% total DR**.`,
                mechanics: empty ? {} : { damageReductionPct: 10 },
            });
        }),
    },
    {
        templateId: 'reaction-phasing',
        templateName: 'Phasing',
        name: 'Reaction: Phasing',
        subfamily: 'phasing',
        category: 'reaction',
        tags: [],
        fluff: 'You vanish from the hit at the last possible instant.',
        trigger: 'When you would be hit',
        cost: { action: 'reaction' },
        roll: { kind: 'none' },
        levels: buildLevels((lvl) => {
            const maxCharges = lvl >= 15 ? 4 : lvl >= 8 ? 3 : lvl >= 4 ? 2 : 0;
            const empty = maxCharges === 0;
            return reactionRow({
                range: SELF,
                effectText: empty
                    ? '—'
                    : `If you currently have **Phasing from a Passive**, ignore the triggering hit, up to a maximum of **${maxCharges} total Phasing charges this combat**.`,
                mechanics: empty ? {} : { phasing: { reactionSingleHit: true } },
            });
        }),
    },
    {
        templateId: 'reaction-counter-damage',
        templateName: 'Counter Damage',
        name: 'Reaction: Counter Damage',
        subfamily: 'counter',
        category: 'reaction',
        tags: [],
        fluff: 'The enemy hits you and is punished by backlash, thorns, flame, force, pain, blood, warding magic, or a brutal counter-impact.',
        trigger: 'When a creature within 2 m hits you with an attack',
        cost: { action: 'reaction' },
        roll: { kind: 'none' },
        levels: buildLevels((lvl) =>
            reactionRow({
                range: NEAR_2M,
                effectText: `Deal **${COUNTER_DMG[lvl - 1]}d8 damage** to the triggering creature.`,
                mechanics: { damageRider: { flat: `+${COUNTER_DMG[lvl - 1]}d8` } },
            }),
        ),
    },
    {
        templateId: 'reaction-counter-damage-push',
        templateName: 'Counter Damage + Push',
        name: 'Reaction: Counter Damage + Push',
        subfamily: 'counter',
        category: 'reaction',
        tags: [],
        fluff: 'The enemy strikes you and is thrown back by impact, force, shieldwork, thunder, recoil, kinetic pressure, or a violent defensive burst.',
        trigger: 'When a creature within 2 m hits you with an attack',
        cost: { action: 'reaction' },
        roll: { kind: 'none' },
        levels: buildLevels((lvl) => {
            const d = COUNTER_DMG_PUSH_D[lvl - 1];
            const m = COUNTER_DMG_PUSH_M[lvl - 1];
            const text = m > 0
                ? `Deal **${d}d8 damage** to the triggering creature and push it **${m} m** directly away from you.`
                : `Deal **${d}d8 damage** to the triggering creature.`;
            return reactionRow({
                range: NEAR_2M,
                effectText: text,
                specials: m > 0 ? [{ key: 'push', rank: m }] : [],
                mechanics: { damageRider: { flat: `+${d}d8` } },
            });
        }),
    },
    {
        templateId: 'reaction-counter-damage-pull',
        templateName: 'Counter Damage + Pull',
        name: 'Reaction: Counter Damage + Pull',
        subfamily: 'counter',
        category: 'reaction',
        tags: [],
        fluff: 'The enemy strikes or leaves your Threat Zone and the chain, hook, or lash yanks them back into reach.',
        trigger: 'When a creature in your Threat Zone hits you or leaves your Threat Zone',
        cost: { action: 'reaction' },
        roll: { kind: 'none' },
        levels: buildLevels((lvl) => {
            const d = COUNTER_DMG_PUSH_D[lvl - 1];
            const m = COUNTER_DMG_PUSH_M[lvl - 1];
            const text = m > 0
                ? `Deal **${d}d8 damage** to the triggering creature and pull it **${m} m** directly toward you.`
                : `Deal **${d}d8 damage** to the triggering creature.`;
            return reactionRow({
                range: NEAR_2M,
                effectText: text,
                specials: m > 0 ? [{ key: 'pull', rank: m }] : [],
                mechanics: { damageRider: { flat: `+${d}d8` } },
            });
        }),
    },
    {
        templateId: 'reaction-special-increase',
        templateName: 'Special Increase',
        name: 'Reaction: Special Increase',
        subfamily: 'special-increase',
        category: 'reaction',
        tags: [],
        fluff: 'The enemy strikes you and drives an existing condition deeper into itself.',
        trigger: 'When a creature within 2 m hits you with an attack',
        cost: { action: 'reaction' },
        roll: { kind: 'none' },
        levels: buildLevels((lvl) => {
            const inc = lvl >= 16 ? 3 : lvl >= 8 ? 2 : lvl >= 4 ? 1 : 0;
            return reactionRow({
                range: NEAR_2M,
                effectText: inc === 0
                    ? '—'
                    : `If the triggering creature is already affected by your chosen eligible **Special(X)**, increase that Special by **+${inc}**.`,
                mechanics: inc === 0
                    ? {}
                    : { modifySpecial: { type: 'chosen', mode: 'increaseExisting', amount: inc } },
            });
        }),
    },
    {
        templateId: 'reaction-initiative-gain',
        templateName: 'Initiative Gain',
        name: 'Reaction: Initiative Gain',
        subfamily: 'initiative',
        category: 'reaction',
        tags: [],
        fluff: 'You seize the pressure of an incoming attack and turn it into immediate combat momentum.',
        trigger: 'When you are targeted by an attack',
        cost: { action: 'reaction' },
        roll: { kind: 'none' },
        levels: buildLevels((lvl) =>
            reactionRow({
                effectText: `After the triggering attack fully resolves, gain **+${INITIATIVE_GAIN[lvl - 1]} Initiative**.`,
                mechanics: { initiativeGain: INITIATIVE_GAIN[lvl - 1] },
            }),
        ),
    },
    {
        templateId: 'reaction-reposition',
        templateName: 'Reposition',
        name: 'Reaction: Reposition',
        subfamily: 'reposition',
        category: 'reaction',
        tags: [],
        fluff: 'You slip out of the line of danger the instant the threat passes, claiming a better angle before the fight settles again.',
        trigger: 'When you are targeted by an attack or would take damage',
        cost: { action: 'reaction' },
        roll: { kind: 'none' },
        levels: buildLevels((lvl) => {
            const m = REPOSITION_M[lvl - 1];
            const empty = m === 0;
            return reactionRow({
                effectText: empty
                    ? '—'
                    : `After the triggering event fully resolves, move up to **${m} m** using normal legal movement.`,
                mechanics: empty ? {} : { movementBonus: m },
            });
        }),
    },

    // ─── New catalog lines from Rules/ (2026-07) ─────────────────────────
    {
        templateId: 'reaction-repositioning-intercept',
        templateName: 'Repositioning Intercept',
        name: 'Reaction: Repositioning Intercept',
        subfamily: 'reposition-intercept',
        category: 'reaction',
        tags: [],
        fluff: 'Move before the attack lands — leave its legal line, or step in and take it for an ally.',
        trigger: 'When you or an ally within movement range is targeted by an attack',
        cost: { action: 'reaction' },
        roll: { kind: 'none' },
        levels: buildLevels((lvl) => {
            const m = INTERCEPT_M[lvl - 1]!;
            if (m <= 0) {
                return reactionRow({ effectText: '—', mechanics: {} });
            }
            return reactionRow({
                effectText:
                    `Move up to **${m} m** before the triggering attack resolves. ` +
                    `If you leave its legal targeting position, the attack loses you as a target. ` +
                    `If an ally triggered this and you enter a legal targeting position, you become the target instead.`,
                mechanics: { movementBonus: m },
            });
        }),
    },
    {
        templateId: 'reaction-reactive-cleanse',
        templateName: 'Reactive Cleanse',
        name: 'Reaction: Reactive Cleanse',
        subfamily: 'cleanse',
        category: 'reaction',
        tags: [],
        fluff: 'Self only. Strip value from one triggering eligible ongoing effect.',
        trigger: 'When an eligible ongoing effect would apply to you or is already affecting you',
        cost: { action: 'reaction' },
        roll: { kind: 'none' },
        levels: buildLevels((lvl) => {
            const amt = REACTIVE_CLEANSE[lvl - 1]!;
            return reactionRow({
                effectText: `Reduce the triggering eligible ongoing effect by **${amt}**.`,
                specials: [{ key: 'cleanse', rank: amt }],
                mechanics: { modifySpecial: { type: 'triggering', mode: 'decreaseExisting', amount: amt } },
            });
        }),
    },
    {
        templateId: 'reaction-damage-negation',
        templateName: 'Damage Negation',
        name: 'Reaction: Damage Negation',
        subfamily: 'damage-negation',
        category: 'reaction',
        tags: [],
        fluff: 'Spend extra Damage Negation dice against one incoming hit.',
        trigger: 'When you would take damage',
        cost: { action: 'reaction' },
        roll: { kind: 'none' },
        levels: buildLevels((lvl) => {
            const extra = lvl >= 12 ? 4 : lvl >= 8 ? 3 : lvl >= 4 ? 2 : 0;
            const empty = extra === 0;
            return reactionRow({
                range: SELF,
                effectText: empty
                    ? '—'
                    : `If you currently have **Damage Negation from a Passive**, spend up to **${extra} additional Negation Dice** against the triggering damage instance (shared half-pool cap).`,
                mechanics: empty ? {} : {},
            });
        }),
    },
    {
        templateId: 'reaction-riposte',
        templateName: 'Riposte',
        name: 'Reaction: Riposte',
        subfamily: 'parry',
        category: 'reaction',
        tags: [],
        fluff: 'Requires Parry Passive and a melee implement. After a Full Parry of a melee Attack, strike back without a new attack roll.',
        trigger: 'When you Fully Parry a melee Attack',
        cost: { action: 'reaction' },
        roll: { kind: 'none' },
        levels: buildLevels((lvl) =>
            reactionRow({
                type: 'Reaction, Parry',
                range: { kind: 'melee', note: 'Melee Reach' },
                effectText: `Deal **Weapon Damage + ${lvl}d8 damage**. No attack roll, Raises, or Critical. Once per Reaction spend.`,
                mechanics: { damageRider: { flat: `+${lvl}d8` } },
            }),
        ),
    },
    {
        templateId: 'reaction-parry-reflection',
        templateName: 'Reflection',
        name: 'Reaction: Reflection',
        subfamily: 'parry',
        category: 'reaction',
        tags: [],
        fluff: 'Requires Parry Passive. After Fully Parrying a single-target Attack, send the damage back at its source.',
        trigger: 'When you Fully Parry a single-target Attack and would take its damage',
        cost: { action: 'reaction' },
        roll: { kind: 'none' },
        levels: buildLevels((lvl) =>
            reactionRow({
                type: 'Reaction, Reflection',
                range: { kind: 'distance', m: 0, note: 'source of triggering Attack' },
                effectText:
                    `Prevent the triggering damage and deal that damage **+${lvl}d8** to its source. No new attack roll.`,
                mechanics: { damageRider: { flat: `+${lvl}d8` } },
            }),
        ),
    },
    {
        templateId: 'reaction-reactive-overload',
        templateName: 'Reactive Overload',
        name: 'Reaction: Reactive Overload',
        subfamily: 'absorption',
        category: 'reaction',
        tags: [],
        fluff: 'Requires Absorption Passive. Multiply how much of the HP loss counts as Absorbed Damage — real HP lost is unchanged.',
        trigger: 'When you lose actual HP from an eligible damage instance',
        cost: { action: 'reaction' },
        roll: { kind: 'none' },
        levels: buildLevels((lvl) => {
            const mult = OVERLOAD_MULT[lvl - 1]!;
            const word = ({ 2: 'twice', 3: 'three times', 4: 'four times', 5: 'five times' } as Record<number, string>)[mult]!;
            return reactionRow({
                type: 'Reaction, Absorption',
                effectText:
                    `The actual HP lost from the triggering damage instance counts **${word}** as Absorbed Damage.`,
                mechanics: {},
            });
        }),
    },
];
