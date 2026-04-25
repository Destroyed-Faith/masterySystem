/**
 * Reaction Power Templates (13)
 *
 * Source: d:\DestroyedFaith\Powers\Reaction.md — Levels 1..16.
 * Single-axis defensive answers (Armor / Evade / Temp HP), two-axis combos,
 * Ally Protection variants, closed premium subsystems (DR, Phasing), and
 * retaliatory Counter Damage / Special Increase.
 */
import { buildLevels, reactionRow } from './_shared.js';
const SELF = { kind: 'self' };
const ALLY_4M = { kind: 'distance', m: 4, note: 'ally' };
const NEAR_2M = { kind: 'distance', m: 2, note: 'triggering enemy' };
// Curve tables (L1..L16). Source: Reaction.md level-by-level calculations.
const ARMOR = [2, 5, 8, 10, 13, 16, 18, 21, 24, 26, 29, 32, 34, 37, 40, 42];
const EVADE = [4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64];
const TEMP_HP = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80];
const COMBO_A = { armor: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], temp: [3, 6, 9, 12, 15, 18, 21, 25, 28, 31, 34, 37, 40, 43, 46, 50] };
const COMBO_E = { evade: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32], temp: [2, 5, 7, 10, 12, 15, 17, 20, 22, 25, 27, 30, 32, 35, 37, 40] };
const ALLY_ARMOR = [1, 4, 6, 9, 12, 14, 17, 20, 22, 25, 28, 30, 33, 36, 38, 41];
const ALLY_EVADE = [2, 6, 10, 14, 18, 22, 26, 30, 34, 38, 42, 46, 50, 54, 58, 62];
const ALLY_TEMP = [2, 7, 12, 17, 22, 27, 32, 37, 42, 47, 52, 57, 62, 67, 72, 77];
const COUNTER_DMG = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
const COUNTER_DMG_PUSH_D = [1, 1, 2, 2, 3, 3, 4, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const COUNTER_DMG_PUSH_M = [0, 2, 2, 4, 4, 6, 6, 8, 8, 8, 8, 8, 8, 8, 8, 8];
export const REACTION_TEMPLATES = [
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
        levels: buildLevels((lvl) => reactionRow({
            effectText: `Gain **+${ARMOR[lvl - 1]} Armor** against the triggering attack or damage instance.`,
            mechanics: { armor: ARMOR[lvl - 1] },
        })),
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
        levels: buildLevels((lvl) => reactionRow({
            effectText: `Gain **+${EVADE[lvl - 1]} Evade** against the triggering attack.`,
            mechanics: { evade: EVADE[lvl - 1] },
        })),
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
        levels: buildLevels((lvl) => reactionRow({
            effectText: `Gain **${TEMP_HP[lvl - 1]} Temporary HP** against the triggering damage instance. Remaining Temporary HP disappears at the end of your next turn.`,
            mechanics: { tempHP: String(TEMP_HP[lvl - 1]) },
        })),
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
        levels: buildLevels((lvl) => reactionRow({
            effectText: `Gain **+${COMBO_A.armor[lvl - 1]} Armor** and **${COMBO_A.temp[lvl - 1]} Temporary HP** against the triggering damage instance.`,
            mechanics: { armor: COMBO_A.armor[lvl - 1], tempHP: String(COMBO_A.temp[lvl - 1]) },
        })),
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
        levels: buildLevels((lvl) => reactionRow({
            effectText: `Gain **+${COMBO_E.evade[lvl - 1]} Evade** against the triggering attack. If it still deals damage, gain **${COMBO_E.temp[lvl - 1]} Temporary HP**.`,
            mechanics: { evade: COMBO_E.evade[lvl - 1], tempHP: String(COMBO_E.temp[lvl - 1]) },
        })),
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
        levels: buildLevels((lvl) => reactionRow({
            range: ALLY_4M,
            effectText: `The ally gains **+${ALLY_ARMOR[lvl - 1]} Armor** against the triggering attack or damage instance.`,
            mechanics: { armor: ALLY_ARMOR[lvl - 1] },
        })),
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
        levels: buildLevels((lvl) => reactionRow({
            range: ALLY_4M,
            effectText: `The ally gains **+${ALLY_EVADE[lvl - 1]} Evade** against the triggering attack.`,
            mechanics: { evade: ALLY_EVADE[lvl - 1] },
        })),
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
        levels: buildLevels((lvl) => reactionRow({
            range: ALLY_4M,
            effectText: `The ally gains **${ALLY_TEMP[lvl - 1]} Temporary HP** against the triggering damage instance.`,
            mechanics: { tempHP: String(ALLY_TEMP[lvl - 1]) },
        })),
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
        levels: buildLevels((lvl) => reactionRow({
            range: NEAR_2M,
            effectText: `Deal **${COUNTER_DMG[lvl - 1]}d8 damage** to the triggering creature.`,
            mechanics: { damageRider: { flat: `+${COUNTER_DMG[lvl - 1]}d8` } },
        })),
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
];
//# sourceMappingURL=reaction.js.map