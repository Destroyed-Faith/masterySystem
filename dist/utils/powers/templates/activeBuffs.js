/**
 * Active Buff Power Templates
 *
 * Source: Rules/active-buffs.md — Levels 1..16.
 * Duration: Mastery Rank Rounds unless noted.
 * Active Buff PP curve = 40 / 70 / 100 / 130 PP, then +30 per level (cap L16 = 490 PP).
 */
import { buildLevels, activeBuffRow } from './_shared.js';
// Level-scaled value tables derived from the L1..L16 calculations in the md.
// Rules/active-buffs.md Armor: +5 at L1, +4/level → L16 = +65 (7.5 PP per Armor).
// Rules/active-buffs.md Evade: +8 at L1, +6/level → L16 = +98 (5 PP per Evade).
const AB_ARMOR = [5, 9, 13, 17, 21, 25, 29, 33, 37, 41, 45, 49, 53, 57, 61, 65];
const AB_EVADE = [8, 14, 20, 26, 32, 38, 44, 50, 56, 62, 68, 74, 80, 86, 92, 98];
const AB_TEMP = [10, 17, 25, 32, 40, 47, 55, 62, 70, 77, 85, 92, 100, 107, 115, 122];
// Active Buff: Healing heals FLAT HP at the start of each turn (4 PP / 1 HP).
const AB_HEAL = [10, 17, 25, 32, 40, 47, 55, 62, 70, 77, 85, 92, 100, 107, 115, 122];
// Active Buff: Damage — +1d8 = 15 PP → +3d8 (L1) … +33d8 (L16).
const AB_DAMAGE = ['3d8', '5d8', '7d8', '9d8', '11d8', '13d8', '15d8', '17d8', '19d8', '21d8', '23d8', '25d8', '27d8', '29d8', '31d8', '33d8'];
// Active Buff: Penetration — same curve as Armor (Penetration(5) … Penetration(65)).
const AB_PENETRATION = [5, 9, 13, 17, 21, 25, 29, 33, 37, 41, 45, 49, 53, 57, 61, 65];
/** Active Buff: Spell Resistance (+2 per level). */
const AB_SPELL_RESISTANCE = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32];
/** Active Buff: Cleanse Maintenance (+1 per level). */
const AB_CLEANSE_MAINTENANCE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
const AURA_RADIUS = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32];
const AURA_ARMOR = [4, 6, 9, 12, 14, 17, 20, 22, 25, 28, 30, 33, 36, 38, 41, 44];
// --- Active Buff Aura tables (banded radius L1–7=2m, L8–14=3m, L15–16=4m) ---
const AURA_BAND_RADIUS = [2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4, 4];
const AURA_DAMAGE = ['1d8', '1d8', '2d8', '3d8', '4d8', '4d8', '5d8', '5d8', '6d8', '7d8', '8d8', '9d8', '10d8', '10d8', '10d8', '11d8'];
const AURA_HEALING = ['1d8', '1d8', '2d8', '3d8', '4d8', '4d8', '5d8', '5d8', '6d8', '7d8', '8d8', '9d8', '10d8', '10d8', '10d8', '11d8'];
const AURA_SMITE = ['1d8', '1d8', '2d8', '3d8', '4d8', '5d8', '6d8', '6d8', '7d8', '8d8', '9d8', '10d8', '11d8', '12d8', '12d8', '13d8'];
// --- Growth Form tables ---
const GF_ARMOR = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32];
const GF_EVADE_PEN = [1, 1, 2, 4, 4, 5, 5, 6, 6, 7, 7, 10, 10, 11, 11, 12];
const GF_INIT_PEN = [0, 0, 0, 4, 4, 4, 4, 8, 8, 8, 8, 12, 12, 12, 12, 16];
const GF_PHYS_PEN = [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 2];
/** Summon Damage / Armor Aura — radius bands (Players Guide Summons). */
const SUMMON_AURA_RADIUS = [8, 8, 8, 8, 16, 16, 16, 16, 24, 24, 24, 24, 32, 32, 32, 32];
const SUMMON_DMG_AURA = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8];
const SUMMON_ARMOR_AURA = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32];
/** Reinforced Parry regain cap per Round (2 × Level). */
const REINFORCED_PARRY = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32];
/** Intensified Absorption — extra Temporary Colorless Stones on first harvest. */
const INTENSIFIED_ABSORPTION = [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4];
/** Size-stage package per Growth Form level (footprint / reach / stability / prone band). */
function growthStageForLevel(lvl) {
    const pushReductionM = lvl >= 4 ? lvl : 0;
    if (lvl >= 16)
        return { sizeStage: 'True Giant Form', footprintHexes: 7, reachBonusM: 5, pushReductionM, proneImmunity: 'standard' };
    if (lvl >= 12)
        return { sizeStage: 'Huge Form', footprintHexes: 7, reachBonusM: 4, pushReductionM, proneImmunity: 'standard' };
    if (lvl >= 8)
        return { sizeStage: 'Massive Form', footprintHexes: 3, reachBonusM: 3, pushReductionM, proneImmunity: 'smaller' };
    if (lvl >= 4)
        return { sizeStage: 'Large Form', footprintHexes: 3, reachBonusM: 2, pushReductionM, proneImmunity: 'smaller' };
    return { sizeStage: 'Enlarged Frame', footprintHexes: 1, reachBonusM: 0, pushReductionM: 0, proneImmunity: 'none' };
}
const DURATION_MR_ROUNDS = { kind: 'masteryRankRounds' };
export const ACTIVE_BUFF_TEMPLATES = [
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
        levels: buildLevels((lvl) => activeBuffRow({
            duration: DURATION_MR_ROUNDS,
            effectText: `Gain **+${AB_ARMOR[lvl - 1]} Armor**.`,
            mechanics: { armor: AB_ARMOR[lvl - 1], duration: 'masteryRankRounds' },
        })),
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
        levels: buildLevels((lvl) => activeBuffRow({
            duration: DURATION_MR_ROUNDS,
            effectText: `Gain **+${AB_EVADE[lvl - 1]} Evade**.`,
            mechanics: { evade: AB_EVADE[lvl - 1], duration: 'masteryRankRounds' },
        })),
    },
    {
        templateId: 'ab-spell-resistance',
        templateName: 'Spell Resistance',
        name: 'Active Buff: Spell Resistance',
        subfamily: 'ward',
        category: 'activeBuff',
        tags: [],
        fluff: 'You raise a temporary ward that makes hostile spell structure harder to force through you.',
        cost: { action: 'attack' },
        roll: { kind: 'none' },
        levels: buildLevels((lvl) => activeBuffRow({
            duration: DURATION_MR_ROUNDS,
            effectText: `Gain **+${AB_SPELL_RESISTANCE[lvl - 1]} Spell Resistance**.`,
            mechanics: {
                spellResistance: AB_SPELL_RESISTANCE[lvl - 1],
                duration: 'masteryRankRounds',
            },
        })),
    },
    {
        templateId: 'ab-cleanse-maintenance',
        templateName: 'Cleanse Maintenance',
        name: 'Active Buff: Cleanse Maintenance',
        subfamily: 'ward',
        category: 'activeBuff',
        tags: [],
        fluff: 'You enter a cleansing state that steadily pushes hostile conditions out of you.',
        cost: { action: 'attack' },
        roll: { kind: 'none' },
        levels: buildLevels((lvl) => {
            const amt = AB_CLEANSE_MAINTENANCE[lvl - 1];
            return activeBuffRow({
                duration: DURATION_MR_ROUNDS,
                effectText: `At the start of your turn, reduce **one** eligible negative ongoing creature effect affecting you by **${amt}**.`,
                mechanics: { cleanseMaintenance: amt, duration: 'masteryRankRounds' },
            });
        }),
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
        levels: buildLevels((lvl) => activeBuffRow({
            aoe: { shape: 'aura', radiusM: AURA_RADIUS[lvl - 1], targetFilter: 'allies', center: 'self' },
            duration: DURATION_MR_ROUNDS,
            effectText: `You and allies within **${AURA_RADIUS[lvl - 1]} m** gain **+${AURA_ARMOR[lvl - 1]} Armor**.`,
            mechanics: { armor: AURA_ARMOR[lvl - 1], duration: 'masteryRankRounds' },
        })),
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
        levels: buildLevels((lvl) => activeBuffRow({
            duration: DURATION_MR_ROUNDS,
            effectText: `Gain **${AB_TEMP[lvl - 1]} Temporary HP**.`,
            mechanics: { tempHP: String(AB_TEMP[lvl - 1]), duration: 'masteryRankRounds' },
        })),
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
        levels: buildLevels((lvl) => activeBuffRow({
            duration: DURATION_MR_ROUNDS,
            effectText: `At the start of your turn, heal **${AB_HEAL[lvl - 1]} HP**.`,
            mechanics: { healing: { flat: String(AB_HEAL[lvl - 1]), trigger: 'startOfTurn', target: 'self' }, duration: 'masteryRankRounds' },
        })),
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
            const cap = lvl >= 15 ? 50 : lvl >= 12 ? 40 : lvl >= 8 ? 30 : lvl >= 4 ? 20 : 0;
            return activeBuffRow({
                duration: DURATION_MR_ROUNDS,
                effectText: cap === 0
                    ? '—'
                    : `If you currently have **Damage Reduction from a Passive**, increase that DR by **+10%** while the buff is active, up to a maximum of **${cap}% total DR**.`,
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
            const cap = lvl >= 15 ? 4 : lvl >= 8 ? 3 : lvl >= 4 ? 2 : 0;
            const active = cap > 0;
            return activeBuffRow({
                duration: DURATION_MR_ROUNDS,
                effectText: !active
                    ? '—'
                    : `If you currently have **Phasing from a Passive**, gain **1** additional Phasing charge for the duration, up to a maximum of **${cap}** total Phasing charges this combat.`,
                mechanics: !active ? { duration: 'masteryRankRounds' } : { phasing: { augment: { addCharges: 1 } }, duration: 'masteryRankRounds' },
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
            const armor = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17][lvl - 1];
            const temp = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80][lvl - 1];
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
            const ev = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32][lvl - 1];
            const temp = [8, 12, 17, 22, 28, 32, 38, 42, 48, 52, 58, 62, 68, 72, 78, 82][lvl - 1];
            return activeBuffRow({
                duration: DURATION_MR_ROUNDS,
                effectText: `Gain **+${ev} Evade**. At the start of each of your turns, if you have less than **${temp} Temporary HP**, restore it up to **${temp} Temporary HP**.`,
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
            const temp = [5, 8, 12, 16, 20, 23, 27, 31, 35, 38, 42, 46, 50, 53, 57, 61][lvl - 1];
            const heal = [5, 9, 13, 16, 20, 24, 28, 31, 35, 39, 43, 46, 50, 54, 58, 61][lvl - 1];
            return activeBuffRow({
                duration: DURATION_MR_ROUNDS,
                effectText: `Gain **${temp} Temporary HP**. Recover **${heal} HP** at the start of each of your turns.`,
                mechanics: { tempHP: String(temp), healing: { flat: String(heal), trigger: 'startOfTurn', target: 'self' }, duration: 'masteryRankRounds' },
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
            const armor = [3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33][lvl - 1];
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
        levels: buildLevels((lvl) => activeBuffRow({
            duration: DURATION_MR_ROUNDS,
            effectText: `Your attacks deal **+${AB_DAMAGE[lvl - 1]}** damage while the buff is active.`,
            mechanics: { damageRider: { flat: `+${AB_DAMAGE[lvl - 1]}` }, duration: 'masteryRankRounds' },
        })),
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
        levels: buildLevels((lvl) => activeBuffRow({
            duration: DURATION_MR_ROUNDS,
            effectText: `Your attacks gain **Penetration(${AB_PENETRATION[lvl - 1]})** while the buff is active.`,
            mechanics: { duration: 'masteryRankRounds' },
        })),
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
            const dmg = `${lvl}d8`;
            const pen = 2 * lvl + 1;
            return activeBuffRow({
                duration: DURATION_MR_ROUNDS,
                effectText: `Your attacks deal **+${dmg}** damage and gain **Penetration(${pen})** while the buff is active.`,
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
        fluff: 'While this buff lasts, Critical(X) lets X attacks per Round explode Attack Dice on 7–8. X is the per-round attack quota — never a lower explode threshold.',
        cost: { action: 'attack' },
        roll: { kind: 'none' },
        // SRD: L1–3 no effect; L4–7 Critical(1); L8–11 Critical(2); L12–14 Critical(3); L15–16 Critical(4).
        // Critical(X) = X Critical-capable attacks per Round; explode threshold always 7–8 on Attack Dice.
        levels: buildLevels((lvl) => {
            const criticalTier = lvl >= 15 ? 4 : lvl >= 12 ? 3 : lvl >= 8 ? 2 : lvl >= 4 ? 1 : 0;
            return activeBuffRow({
                duration: DURATION_MR_ROUNDS,
                effectText: criticalTier === 0
                    ? '—'
                    : `Your attacks gain **Critical(${criticalTier})** (${criticalTier} Critical attack${criticalTier === 1 ? '' : 's'} per Round; Attack Dice explode on 7–8).`,
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
            const duration = { kind: 'rounds', rounds: 2 };
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
            const inc = lvl >= 15 ? 4 : lvl >= 12 ? 3 : lvl >= 8 ? 2 : lvl >= 4 ? 1 : 0;
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
    {
        templateId: 'ab-damage-aura',
        templateName: 'Damage Aura',
        name: 'Active Buff: Damage Aura',
        subfamily: 'aura',
        category: 'activeBuff',
        tags: [],
        fluff: 'You radiate harmful force, flame, thorns, shadow, frost, pressure, divine wrath, or other damaging power.',
        cost: { action: 'attack' },
        roll: { kind: 'none' },
        levels: buildLevels((lvl) => {
            const r = AURA_BAND_RADIUS[lvl - 1];
            const dice = AURA_DAMAGE[lvl - 1];
            return activeBuffRow({
                aoe: { shape: 'aura', radiusM: r, targetFilter: 'enemies', center: 'self' },
                duration: DURATION_MR_ROUNDS,
                effectText: `At the end of each of your turns, enemies within **${r} m** take **${dice} damage**.`,
                mechanics: { auraPayload: { kind: 'damage', dice, targets: 'enemies', radiusM: r }, duration: 'masteryRankRounds' },
            });
        }),
    },
    {
        templateId: 'ab-healing-aura',
        templateName: 'Healing Aura',
        name: 'Active Buff: Healing Aura',
        subfamily: 'aura',
        category: 'activeBuff',
        tags: [],
        fluff: 'You radiate restorative force, warmth, blessing, blood magic, life energy, or stabilizing power.',
        cost: { action: 'attack' },
        roll: { kind: 'none' },
        levels: buildLevels((lvl) => {
            const r = AURA_BAND_RADIUS[lvl - 1];
            const dice = AURA_HEALING[lvl - 1];
            return activeBuffRow({
                aoe: { shape: 'aura', radiusM: r, targetFilter: 'allies', center: 'self' },
                duration: DURATION_MR_ROUNDS,
                effectText: `At the end of each of your turns, allies within **${r} m** heal **${dice} HP**.`,
                mechanics: { auraPayload: { kind: 'healing', dice, targets: 'allies', radiusM: r }, duration: 'masteryRankRounds' },
            });
        }),
    },
    // Active Buff Auras never apply or increase Specials (Rules/active-buffs.md).
    // Special interaction is Active Buff: Special Overdrive only; Passive Special Aura lives in passives.
    {
        templateId: 'ab-smite-aura',
        templateName: 'Smite Aura (Artifact Only)',
        name: 'Artifact Only Active Buff: Smite Aura',
        subfamily: 'aura',
        category: 'activeBuff',
        // Artifact-only: must be limited to Mastery Rank uses per Safe Haven Rest
        // by the granting Artifact. Not selectable in normal character creation.
        tags: ['artifact-only'],
        fluff: 'You radiate artifact-bound divine wrath, oathfire, judgment, sacred force, or annihilating light.',
        cost: { action: 'attack' },
        roll: { kind: 'none' },
        levels: buildLevels((lvl) => {
            const r = AURA_BAND_RADIUS[lvl - 1];
            const dice = AURA_SMITE[lvl - 1];
            return activeBuffRow({
                type: 'Artifact Only Active Buff',
                aoe: { shape: 'aura', radiusM: r, targetFilter: 'enemies', center: 'self' },
                duration: DURATION_MR_ROUNDS,
                effectText: `At the end of each of your turns, enemies within **${r} m** take **${dice} Smite**.`,
                mechanics: { auraPayload: { kind: 'smite', dice, targets: 'enemies', radiusM: r }, duration: 'masteryRankRounds' },
            });
        }),
    },
    {
        templateId: 'ab-growth-form',
        templateName: 'Growth Form',
        name: 'Active Buff: Growth Form',
        subfamily: 'form',
        category: 'activeBuff',
        tags: [],
        fluff: 'You swell with titanic mass — bigger, stronger, harder to move, but easier to hit.',
        cost: { action: 'attack' },
        roll: { kind: 'none' },
        // Damage + Armor are paid axes; the size/footprint/reach/stability rider
        // and the Evade/Initiative/Physical-skill drawbacks are the form package.
        // The visible token resize + reach + forced-movement reduction are wired
        // in a follow-up step (mechanics.growthForm carries the data).
        levels: buildLevels((lvl) => {
            const dmg = `${lvl}d8`;
            const armor = GF_ARMOR[lvl - 1];
            const evadePen = GF_EVADE_PEN[lvl - 1];
            const initPen = GF_INIT_PEN[lvl - 1];
            const physPen = GF_PHYS_PEN[lvl - 1];
            const stage = growthStageForLevel(lvl);
            const drawbacks = [`**-${evadePen} Evade**`];
            if (initPen > 0)
                drawbacks.push(`**-${initPen} Initiative**`);
            if (physPen > 0)
                drawbacks.push(`**-${physPen}d8 Physical Skills** (except Strength and Body)`);
            const reachPart = stage.reachBonusM > 0 ? ` **${stage.sizeStage}** (${stage.footprintHexes} hexes, +${stage.reachBonusM} m Reach).` : ` **${stage.sizeStage}** (${stage.footprintHexes} hex).`;
            return activeBuffRow({
                duration: DURATION_MR_ROUNDS,
                effectText: `Gain **+${dmg} Damage** and **+${armor} Armor**.${reachPart} Drawback: ${drawbacks.join(', ')}.`,
                mechanics: {
                    damageRider: { flat: `+${dmg}` },
                    armor,
                    evade: -evadePen,
                    initiativeD8: initPen > 0 ? -initPen : undefined,
                    growthForm: {
                        sizeStage: stage.sizeStage,
                        footprintHexes: stage.footprintHexes,
                        reachBonusM: stage.reachBonusM,
                        pushReductionM: stage.pushReductionM,
                        proneImmunity: stage.proneImmunity,
                        physicalSkillPenaltyD8: physPen,
                    },
                    duration: 'masteryRankRounds',
                },
            });
        }),
    },
    // ─── New catalog lines from Rules/ (2026-07) ─────────────────────────
    {
        templateId: 'ab-summon-damage-aura',
        templateName: 'Summon Damage Aura',
        name: 'Active Buff: Summon Damage Aura',
        subfamily: 'summon-aura',
        category: 'activeBuff',
        tags: [],
        fluff: 'Your summons strike harder while they fight inside your bonded aura.',
        cost: { action: 'attack' },
        roll: { kind: 'none' },
        levels: buildLevels((lvl) => {
            const dice = SUMMON_DMG_AURA[lvl - 1];
            const r = SUMMON_AURA_RADIUS[lvl - 1];
            return activeBuffRow({
                type: 'Active Buff',
                aoe: { shape: 'aura', radiusM: r, targetFilter: 'allies', center: 'self', note: 'own summons only' },
                duration: DURATION_MR_ROUNDS,
                effectText: `Own Summons within **${r} m** gain **+${dice}d8 Damage** on their attacks.`,
                mechanics: { duration: 'masteryRankRounds' },
            });
        }),
    },
    {
        templateId: 'ab-summon-armor-aura',
        templateName: 'Summon Armor Aura',
        name: 'Active Buff: Summon Armor Aura',
        subfamily: 'summon-aura',
        category: 'activeBuff',
        tags: [],
        fluff: 'Your summons harden while they fight inside your bonded aura.',
        cost: { action: 'attack' },
        roll: { kind: 'none' },
        levels: buildLevels((lvl) => {
            const armor = SUMMON_ARMOR_AURA[lvl - 1];
            const r = SUMMON_AURA_RADIUS[lvl - 1];
            return activeBuffRow({
                type: 'Active Buff',
                aoe: { shape: 'aura', radiusM: r, targetFilter: 'allies', center: 'self', note: 'own summons only' },
                duration: DURATION_MR_ROUNDS,
                effectText: `Own Summons within **${r} m** gain **+${armor} Armor**.`,
                mechanics: { duration: 'masteryRankRounds' },
            });
        }),
    },
    {
        templateId: 'ab-thorns',
        templateName: 'Thorns',
        name: 'Active Buff: Thorns',
        subfamily: 'thorns',
        category: 'activeBuff',
        tags: [],
        fluff: 'For a short fight you answer every final wound with sharp retaliation.',
        cost: { action: 'attack' },
        roll: { kind: 'none' },
        levels: buildLevels((lvl) => activeBuffRow({
            duration: DURATION_MR_ROUNDS,
            effectText: `Gain **Thorns ${lvl}d8**. When you take final HP damage, deal that much (capped by the loss) to the source.`,
            mechanics: { duration: 'masteryRankRounds' },
        })),
    },
    {
        templateId: 'ab-invisibility',
        templateName: 'Invisibility',
        name: 'Active Buff: Invisibility',
        subfamily: 'invisibility',
        category: 'activeBuff',
        tags: [],
        fluff: 'A short cloak that blocks Normal Combat Awareness. Stacks with Passive Invisibility.',
        cost: { action: 'attack' },
        roll: { kind: 'none' },
        levels: buildLevels((lvl) => activeBuffRow({
            duration: DURATION_MR_ROUNDS,
            effectText: `Gain **+${lvl} Invisibility Bonus**. Blocks Normal Combat Awareness.`,
            mechanics: { duration: 'masteryRankRounds' },
        })),
    },
    {
        templateId: 'ab-reinforced-parry',
        templateName: 'Reinforced Parry',
        name: 'Active Buff: Reinforced Parry',
        subfamily: 'parry',
        category: 'activeBuff',
        tags: [],
        fluff: 'Requires Parry Passive. Spent Parry returns after resolve, up to a per-round cap.',
        cost: { action: 'attack' },
        roll: { kind: 'none' },
        levels: buildLevels((lvl) => {
            const regain = REINFORCED_PARRY[lvl - 1];
            return activeBuffRow({
                type: 'Active Buff, Parry',
                duration: DURATION_MR_ROUNDS,
                effectText: `Requires **Parry** Passive. After Parry resolves, regain spent Parry up to **${regain}** total per Round; cannot exceed the entered Pool.`,
                mechanics: { duration: 'masteryRankRounds' },
            });
        }),
    },
    {
        templateId: 'ab-intensified-absorption',
        templateName: 'Intensified Absorption',
        name: 'Active Buff: Intensified Absorption',
        subfamily: 'absorption',
        category: 'activeBuff',
        tags: [],
        fluff: 'Requires Absorption Passive. The first harvest each Round yields extra Temporary Colorless Stones.',
        cost: { action: 'attack' },
        roll: { kind: 'none' },
        levels: buildLevels((lvl) => {
            const extra = INTENSIFIED_ABSORPTION[lvl - 1];
            const noun = extra === 1 ? 'Stone' : 'Stones';
            return activeBuffRow({
                type: 'Active Buff, Absorption',
                duration: DURATION_MR_ROUNDS,
                effectText: `Requires **Absorption** Passive. The first Absorption harvest each Round generates **+${extra} Temporary Colorless ${noun}**.`,
                mechanics: { duration: 'masteryRankRounds' },
            });
        }),
    },
    {
        templateId: 'ab-reinforced-damage-negation',
        templateName: 'Reinforced Damage Negation',
        name: 'Active Buff: Reinforced Damage Negation',
        subfamily: 'damage-negation',
        category: 'activeBuff',
        tags: [],
        fluff: 'Requires Damage Negation Passive. A separate per-Round pool spent before the combat reserve.',
        cost: { action: 'attack' },
        roll: { kind: 'none' },
        levels: buildLevels((lvl) => activeBuffRow({
            type: 'Active Buff, Damage Negation',
            duration: DURATION_MR_ROUNDS,
            effectText: `Requires **Damage Negation** Passive. Each Round gain **${lvl} Reinforced Negation Die` +
                `${lvl === 1 ? '' : 'ce'}** (spend before the reserve). Shared half-pool cap with the Passive reserve.`,
            mechanics: { duration: 'masteryRankRounds' },
        })),
    },
];
//# sourceMappingURL=activeBuffs.js.map