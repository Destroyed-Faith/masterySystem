/**
 * Active Buff Power Templates (16)
 *
 * Source: d:\DestroyedFaith\Powers\Active Buffs.md — Levels 1..16.
 * Duration: Mastery Rank Rounds unless noted.
 * Active Buff PP curve = 40 / 70 / 100 / 130 PP, then +30 per level (cap L16 = 490 PP).
 */

import type { PowerTemplate } from './_shared.js';
import { buildLevels, activeBuffRow } from './_shared.js';

// Level-scaled value tables derived from the L1..L16 calculations in the md.
const AB_ARMOR = [5, 9, 13, 17, 21, 25, 29, 33, 37, 41, 45, 49, 53, 57, 61, 65];
const AB_EVADE = [8, 14, 20, 26, 32, 38, 44, 50, 56, 62, 68, 74, 80, 86, 92, 98];
const AB_TEMP = [10, 17, 25, 32, 40, 47, 55, 62, 70, 77, 85, 92, 100, 107, 115, 122];
const AB_HEAL = ['1d8', '2d8', '2d8', '3d8', '4d8', '4d8', '5d8', '6d8', '7d8', '7d8', '8d8', '9d8', '10d8', '10d8', '11d8', '12d8'];
const AB_DAMAGE = ['1d8', '2d8', '2d8', '3d8', '4d8', '4d8', '5d8', '6d8', '7d8', '7d8', '8d8', '9d8', '10d8', '10d8', '11d8', '12d8'];
const AB_PENETRATION = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32];
const AURA_RADIUS = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32];
const AURA_ARMOR = [3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33];

const DURATION_MR_ROUNDS = { kind: 'masteryRankRounds' as const };

export const ACTIVE_BUFF_TEMPLATES: PowerTemplate[] = [
    {
        templateId: 'ab-armor',
        templateName: 'Armor',
        name: 'Active Buff: Armor',
        subfamily: 'defensive-single',
        category: 'activeBuff',
        tags: [],
        fluff: 'You reinforce your body, armor, stance, magic, skin, or guard with a temporary defensive layer.',
        cost: { action: 'attack' },
        roll: { kind: 'none' },
        levels: buildLevels((lvl) =>
            activeBuffRow({
                duration: DURATION_MR_ROUNDS,
                effectText: `Gain **+${AB_ARMOR[lvl - 1]} Armor**.`,
                mechanics: { armor: AB_ARMOR[lvl - 1], duration: 'masteryRankRounds' },
            }),
        ),
    },
    {
        templateId: 'ab-evade',
        templateName: 'Evade',
        name: 'Active Buff: Evade',
        subfamily: 'defensive-single',
        category: 'activeBuff',
        tags: [],
        fluff: 'You become harder to target, harder to read, harder to pin down, or harder to strike cleanly.',
        cost: { action: 'attack' },
        roll: { kind: 'none' },
        levels: buildLevels((lvl) =>
            activeBuffRow({
                duration: DURATION_MR_ROUNDS,
                effectText: `Gain **+${AB_EVADE[lvl - 1]} Evade**.`,
                mechanics: { evade: AB_EVADE[lvl - 1], duration: 'masteryRankRounds' },
            }),
        ),
    },
    {
        templateId: 'ab-armor-aura',
        templateName: 'Armor Aura',
        name: 'Active Buff: Armor Aura',
        subfamily: 'aura',
        category: 'activeBuff',
        tags: [],
        fluff: 'You radiate a shared defensive presence that strengthens allies nearby.',
        cost: { action: 'attack' },
        roll: { kind: 'none' },
        levels: buildLevels((lvl) =>
            activeBuffRow({
                aoe: { shape: 'aura', radiusM: AURA_RADIUS[lvl - 1], targetFilter: 'allies', center: 'self' },
                duration: DURATION_MR_ROUNDS,
                effectText: `You and allies within **${AURA_RADIUS[lvl - 1]} m** gain **+${AURA_ARMOR[lvl - 1]} Armor**.`,
                mechanics: { armor: AURA_ARMOR[lvl - 1], duration: 'masteryRankRounds' },
            }),
        ),
    },
    {
        templateId: 'ab-temp-hp',
        templateName: 'Temporary HP',
        name: 'Active Buff: Temporary HP',
        subfamily: 'defensive-single',
        category: 'activeBuff',
        tags: [],
        fluff: 'A protective reserve layers over your life.',
        cost: { action: 'attack' },
        roll: { kind: 'none' },
        levels: buildLevels((lvl) =>
            activeBuffRow({
                duration: DURATION_MR_ROUNDS,
                effectText: `Gain **${AB_TEMP[lvl - 1]} Temporary HP**.`,
                mechanics: { tempHP: String(AB_TEMP[lvl - 1]), duration: 'masteryRankRounds' },
            }),
        ),
    },
    {
        templateId: 'ab-healing',
        templateName: 'Healing',
        name: 'Active Buff: Healing',
        subfamily: 'recovery',
        category: 'activeBuff',
        tags: [],
        fluff: 'You draw out rest, vitality, fortitude, or sustaining magic across the duration of the buff.',
        cost: { action: 'attack' },
        roll: { kind: 'none' },
        levels: buildLevels((lvl) =>
            activeBuffRow({
                duration: DURATION_MR_ROUNDS,
                effectText: `Recover **${AB_HEAL[lvl - 1]} HP** at the start of each of your turns while the buff is active.`,
                mechanics: { healing: { flat: AB_HEAL[lvl - 1], trigger: 'startOfTurn', target: 'self' }, duration: 'masteryRankRounds' },
            }),
        ),
    },
    {
        templateId: 'ab-damage-reduction',
        templateName: 'Damage Reduction',
        name: 'Active Buff: Damage Reduction',
        subfamily: 'damage-reduction',
        category: 'activeBuff',
        tags: [],
        fluff: 'Incoming force glances off. Only works if a Passive already grants DR.',
        cost: { action: 'attack' },
        roll: { kind: 'none' },
        levels: buildLevels((lvl) => {
            const cap = lvl >= 15 ? 60 : lvl >= 12 ? 50 : lvl >= 8 ? 40 : lvl >= 4 ? 30 : 0;
            return activeBuffRow({
                duration: DURATION_MR_ROUNDS,
                effectText: cap === 0
                    ? '—'
                    : `If you currently have **Damage Reduction from a Passive**, increase that DR by **+10%** while the buff is active, up to **${cap}% total DR**.`,
                // +10% is aggregated only when a sanctioned passive DR line exists
                // (`aggregateMechanics`); mechanics stay on the buff for snapshots / UI.
                mechanics: { damageReductionPct: 10, duration: 'masteryRankRounds' },
            });
        }),
    },
    {
        templateId: 'ab-phasing',
        templateName: 'Phasing',
        name: 'Active Buff: Phasing',
        subfamily: 'phasing',
        category: 'activeBuff',
        tags: [],
        fluff: 'Your defensive phasing becomes more available for this short window.',
        cost: { action: 'attack' },
        roll: { kind: 'none' },
        levels: buildLevels((lvl) => {
            const add = lvl >= 15 ? 3 : lvl >= 8 ? 2 : lvl >= 4 ? 1 : 0;
            return activeBuffRow({
                duration: DURATION_MR_ROUNDS,
                effectText: add === 0
                    ? '—'
                    : `If you currently have **Phasing from a Passive**, gain **+${add}** Phasing charge${add === 1 ? '' : 's'} while the buff is active.`,
                mechanics: add === 0 ? { duration: 'masteryRankRounds' } : { phasing: { augment: { addCharges: add } }, duration: 'masteryRankRounds' },
            });
        }),
    },
    {
        templateId: 'ab-armor-temp-hp',
        templateName: 'Armor + Temporary HP',
        name: 'Active Buff: Armor + Temporary HP',
        subfamily: 'combined',
        category: 'activeBuff',
        tags: [],
        fluff: 'Layered hardening plus a reserve of protective force.',
        cost: { action: 'attack' },
        roll: { kind: 'none' },
        levels: buildLevels((lvl) => {
            const armor = [3, 5, 8, 10, 13, 16, 18, 21, 24, 26, 29, 32, 34, 37, 40, 42][lvl - 1];
            const temp = [3, 6, 8, 11, 14, 16, 19, 22, 24, 27, 30, 32, 35, 38, 40, 43][lvl - 1];
            return activeBuffRow({
                duration: DURATION_MR_ROUNDS,
                effectText: `Gain **+${armor} Armor** and **${temp} Temporary HP**.`,
                mechanics: { armor, tempHP: String(temp), duration: 'masteryRankRounds' },
            });
        }),
    },
    {
        templateId: 'ab-evade-temp-hp',
        templateName: 'Evade + Temporary HP',
        name: 'Active Buff: Evade + Temporary HP',
        subfamily: 'combined',
        category: 'activeBuff',
        tags: [],
        fluff: 'Avoidance paired with a buffer against the hit that still lands.',
        cost: { action: 'attack' },
        roll: { kind: 'none' },
        levels: buildLevels((lvl) => {
            const ev = [4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34, 37, 40, 43, 46, 49][lvl - 1];
            const temp = [5, 9, 13, 16, 20, 24, 28, 31, 35, 39, 43, 46, 50, 54, 58, 61][lvl - 1];
            return activeBuffRow({
                duration: DURATION_MR_ROUNDS,
                effectText: `Gain **+${ev} Evade** and **${temp} Temporary HP**.`,
                mechanics: { evade: ev, tempHP: String(temp), duration: 'masteryRankRounds' },
            });
        }),
    },
    {
        templateId: 'ab-temp-hp-healing',
        templateName: 'Temporary HP + Healing',
        name: 'Active Buff: Temporary HP + Healing',
        subfamily: 'combined',
        category: 'activeBuff',
        tags: [],
        fluff: 'A buffer and sustained recovery, woven together.',
        cost: { action: 'attack' },
        roll: { kind: 'none' },
        levels: buildLevels((lvl) => {
            const temp = [5, 9, 13, 16, 20, 24, 28, 31, 35, 39, 43, 46, 50, 54, 58, 61][lvl - 1];
            const heal = AB_HEAL[lvl - 1];
            return activeBuffRow({
                duration: DURATION_MR_ROUNDS,
                effectText: `Gain **${temp} Temporary HP**. Recover **${heal} HP** at the start of each of your turns.`,
                mechanics: { tempHP: String(temp), healing: { flat: heal, trigger: 'startOfTurn', target: 'self' }, duration: 'masteryRankRounds' },
            });
        }),
    },
    {
        templateId: 'ab-armor-evade',
        templateName: 'Armor + Evade',
        name: 'Active Buff: Armor + Evade',
        subfamily: 'combined',
        category: 'activeBuff',
        tags: [],
        fluff: 'Hardening and elusiveness in a single stance.',
        cost: { action: 'attack' },
        roll: { kind: 'none' },
        levels: buildLevels((lvl) => {
            const armor = [2, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33][lvl - 1];
            const evade = [4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34, 37, 40, 43, 46, 49][lvl - 1];
            return activeBuffRow({
                duration: DURATION_MR_ROUNDS,
                effectText: `Gain **+${armor} Armor** and **+${evade} Evade**.`,
                mechanics: { armor, evade, duration: 'masteryRankRounds' },
            });
        }),
    },
    {
        templateId: 'ab-damage',
        templateName: 'Damage',
        name: 'Active Buff: Damage',
        subfamily: 'offensive',
        category: 'activeBuff',
        tags: [],
        fluff: 'Your strikes carry added cut, burn, force, bite, or weight.',
        cost: { action: 'attack' },
        roll: { kind: 'none' },
        levels: buildLevels((lvl) =>
            activeBuffRow({
                duration: DURATION_MR_ROUNDS,
                effectText: `Your attacks deal **+${AB_DAMAGE[lvl - 1]}** damage while the buff is active.`,
                mechanics: { damageRider: { flat: `+${AB_DAMAGE[lvl - 1]}` }, duration: 'masteryRankRounds' },
            }),
        ),
    },
    {
        templateId: 'ab-penetration',
        templateName: 'Penetration',
        name: 'Active Buff: Penetration',
        subfamily: 'offensive',
        category: 'activeBuff',
        tags: [],
        fluff: 'Your strikes bypass a share of the target’s Armor.',
        cost: { action: 'attack' },
        roll: { kind: 'none' },
        levels: buildLevels((lvl) =>
            activeBuffRow({
                duration: DURATION_MR_ROUNDS,
                effectText: `Your attacks ignore **${AB_PENETRATION[lvl - 1]} Armor** while the buff is active.`,
                mechanics: { duration: 'masteryRankRounds' },
            }),
        ),
    },
    {
        templateId: 'ab-damage-penetration',
        templateName: 'Damage + Penetration',
        name: 'Active Buff: Damage + Penetration',
        subfamily: 'offensive',
        category: 'activeBuff',
        tags: [],
        fluff: 'Your attacks land harder and find the gaps in armor.',
        cost: { action: 'attack' },
        roll: { kind: 'none' },
        levels: buildLevels((lvl) => {
            const dmg = ['1d8', '1d8', '2d8', '2d8', '3d8', '3d8', '4d8', '4d8', '5d8', '5d8', '6d8', '6d8', '7d8', '7d8', '8d8', '8d8'][lvl - 1];
            const pen = [1, 2, 3, 4, 5, 7, 8, 9, 10, 12, 13, 14, 16, 17, 18, 20][lvl - 1];
            return activeBuffRow({
                duration: DURATION_MR_ROUNDS,
                effectText: `Your attacks deal **+${dmg}** damage and ignore **${pen} Armor** while the buff is active.`,
                mechanics: { damageRider: { flat: `+${dmg}` }, duration: 'masteryRankRounds' },
            });
        }),
    },
    {
        templateId: 'ab-critical',
        templateName: 'Critical',
        name: 'Active Buff: Critical',
        subfamily: 'offensive',
        category: 'activeBuff',
        tags: [],
        fluff: 'While this buff lasts, your qualifying attacks gain Critical at milestone ranks — not linear crit bonuses or filler riders.',
        cost: { action: 'attack' },
        roll: { kind: 'none' },
        // SRD: L1–3 no effect; L4–7 Critical(1); L8–11 Critical(2); L12–14 Critical(3); L15–16 Critical(4).
        levels: buildLevels((lvl) => {
            const criticalTier = lvl >= 15 ? 4 : lvl >= 12 ? 3 : lvl >= 8 ? 2 : lvl >= 4 ? 1 : 0;
            return activeBuffRow({
                duration: DURATION_MR_ROUNDS,
                effectText: criticalTier === 0
                    ? '—'
                    : `Your attacks gain **Critical(${criticalTier})**.`,
                mechanics: criticalTier === 0
                    ? { duration: 'masteryRankRounds' }
                    : { critical: criticalTier, duration: 'masteryRankRounds' },
            });
        }),
    },
    {
        templateId: 'ab-immovable-temp-hp',
        templateName: 'Immovable + Temporary HP',
        name: 'Active Buff: Immovable + Temporary HP',
        subfamily: 'defensive-control',
        category: 'activeBuff',
        tags: [],
        fluff: 'You root yourself in place: forced movement, knockdown, and grapple slip past you, while a buffer of Temporary HP holds the line.',
        cost: { action: 'attack' },
        roll: { kind: 'none' },
        // Source: Actives.md ~5238–5414. Immovable is a fixed 80 PP rider
        // (no scaling). Levels 1–2 cannot afford it; from L3 the leftover
        // PP fund Temporary HP. Duration is fixed at 2 Rounds.
        levels: buildLevels((lvl) => {
            const budget = lvl * 30;
            const IMMOVABLE_COST = 80;
            const tempHpFromLeftover = Math.max(0, budget - IMMOVABLE_COST);
            const hasImmovable = budget >= IMMOVABLE_COST;
            const duration = { kind: 'rounds' as const, rounds: 2 };
            if (!hasImmovable) {
                return activeBuffRow({
                    duration,
                    effectText: 'No effect at this Power rank — Immovable costs 80 PP and the budget is too low.',
                    mechanics: { duration: 'untilNextTurn' },
                });
            }
            return activeBuffRow({
                duration,
                effectText: `For **2 Rounds** you become **Immovable** and gain **${tempHpFromLeftover} Temporary HP**. While Immovable you ignore Push, Pull, Prone, forced movement, and grapple-based forced moves.`,
                specials: [{ key: 'immovable', target: 'self' }],
                mechanics: {
                    tempHP: String(tempHpFromLeftover),
                    duration: 'untilNextTurn',
                },
            });
        }),
    },
    {
        templateId: 'ab-special-overdrive',
        templateName: 'Special Overdrive',
        name: 'Active Buff: Special Overdrive',
        subfamily: 'special-overdrive',
        category: 'activeBuff',
        tags: [],
        fluff: 'A chosen Special on your attacks presses harder while the buff is active.',
        cost: { action: 'attack' },
        roll: { kind: 'none' },
        levels: buildLevels((lvl) => {
            const inc = lvl >= 15 ? 3 : lvl >= 8 ? 2 : lvl >= 4 ? 1 : 0;
            return activeBuffRow({
                duration: DURATION_MR_ROUNDS,
                effectText: inc === 0
                    ? '—'
                    : `Choose one eligible Special(X). While the buff is active, any such Special you apply is increased by **+${inc}**.`,
                mechanics: inc === 0
                    ? { duration: 'masteryRankRounds' }
                    : { modifySpecial: { type: 'chosen', mode: 'increaseExisting', amount: inc }, duration: 'masteryRankRounds' },
            });
        }),
    },
];
