/**
 * Passive Power Templates (45 + 1 Special Aura)
 *
 * Source: d:\DestroyedFaith\Powers\Passives.md — Levels 1..16.
 *
 * Structure:
 *   - base (20): single-axis canonical passives
 *   - combined (12): two-axis combinations (non-conditional)
 *   - conditional-combined (12): same as combined but gated on a condition
 *   - special-aura (1): grants/applies a Special to nearby creatures
 *
 * Numeric scaling follows the ~1.25× Active Buff curve described in the md.
 * For non-numeric or narrative entries we emit effect.text plus a minimal
 * mechanics block; the aggregator gracefully falls back to descriptive
 * behaviour for rows that carry no mechanical deltas.
 */
import { buildLevels, passiveRow } from './_shared.js';
// Canonical curves for passives (Passive curve = 50 / 90 / 130 / 170 PP then +40/level).
const P_ARMOR = [6, 12, 17, 22, 28, 33, 38, 44, 49, 54, 60, 65, 70, 76, 81, 86];
const P_EVADE = [10, 18, 26, 34, 42, 50, 58, 66, 74, 82, 90, 98, 106, 114, 122, 130];
const P_TEMP = [12, 22, 32, 42, 52, 62, 72, 82, 92, 102, 112, 122, 132, 142, 152, 162];
const P_REGEN = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
const P_HEALTH = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160];
const P_DAMAGE = ['1d8', '1d8', '2d8', '2d8', '3d8', '3d8', '4d8', '4d8', '5d8', '5d8', '6d8', '6d8', '7d8', '7d8', '8d8', '8d8'];
const P_HEAL = P_DAMAGE;
/** Helper that emits a passive template with a single mechanics block per level. */
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
        levels: buildLevels((lvl) => {
            const row = def.perLevel(lvl);
            return passiveRow({
                effectText: row.text,
                mechanics: row.mechanics,
            });
        }),
    };
}
export const PASSIVE_TEMPLATES = [
    // ─── Base (20) ───────────────────────────────────────────────────────
    basePassive({ id: 'passive-fortified-frame', name: 'Fortified Frame', subfamily: 'armor',
        fluff: 'Your frame holds against force that would break ordinary warriors.',
        perLevel: (lvl) => ({ text: `Gain **+${P_ARMOR[lvl - 1]} Armor**.`, mechanics: { armor: P_ARMOR[lvl - 1] } }) }),
    basePassive({ id: 'passive-damage-reduction', name: 'Damage Reduction', subfamily: 'damage-reduction',
        fluff: 'Blows, blasts, and spells find you stubbornly harder to harm.',
        perLevel: (lvl) => {
            const pct = lvl >= 15 ? 50 : lvl >= 12 ? 40 : lvl >= 8 ? 30 : lvl >= 4 ? 20 : 10;
            return { text: `Gain **${pct}% Damage Reduction** against incoming damage (after flat Armor).`, mechanics: { damageReductionPct: pct } };
        } }),
    basePassive({ id: 'passive-evade', name: 'Evade', subfamily: 'evade',
        fluff: 'Attacks slip past you more often than you give them a chance to land.',
        perLevel: (lvl) => ({ text: `Gain **+${P_EVADE[lvl - 1]} Evade**.`, mechanics: { evade: P_EVADE[lvl - 1] } }) }),
    basePassive({ id: 'passive-temp-hp', name: 'Temporary Hit Points', subfamily: 'temp-hp',
        fluff: 'A reserve of protective resilience renews with every fight.',
        perLevel: (lvl) => ({ text: `At the start of each combat, gain **${P_TEMP[lvl - 1]} Temporary HP**.`, mechanics: { triggers: { combatStart: { tempHP: String(P_TEMP[lvl - 1]) } } } }) }),
    basePassive({ id: 'passive-regeneration', name: 'Regeneration', subfamily: 'regen',
        fluff: 'Wounds close on their own as the battle drags on.',
        perLevel: (lvl) => ({ text: `Regenerate **${P_REGEN[lvl - 1]} HP** at the end of each of your turns.`, mechanics: { regen: P_REGEN[lvl - 1] } }) }),
    basePassive({ id: 'passive-ghostform', name: 'Ghostform', subfamily: 'phasing',
        fluff: 'Attacks find you less substantial than you appear.',
        perLevel: (lvl) => {
            const charges = lvl >= 15 ? 4 : lvl >= 12 ? 3 : lvl >= 8 ? 2 : lvl >= 4 ? 1 : 0;
            return { text: charges === 0 ? '—' : `Gain **${charges}** Phasing charge${charges === 1 ? '' : 's'} at the start of each combat.`, mechanics: charges === 0 ? {} : { phasing: { combatStart: { charges } } } };
        } }),
    basePassive({ id: 'passive-killing-intent', name: 'Killing Intent', subfamily: 'damage',
        fluff: 'Your attacks carry a steady edge of lethal pressure.',
        perLevel: (lvl) => ({ text: `Your attacks deal **+${P_DAMAGE[lvl - 1]}** damage.`, mechanics: { damageRider: { flat: `+${P_DAMAGE[lvl - 1]}` } } }) }),
    basePassive({ id: 'passive-deep-vitality', name: 'Deep Vitality', subfamily: 'health',
        fluff: 'Your constitution endures where others break.',
        perLevel: (lvl) => ({ text: `Gain **+${P_HEALTH[lvl - 1]} Max HP**.`, mechanics: {} }) }),
    basePassive({ id: 'passive-heightened-senses', name: 'Heightened Senses', subfamily: 'awareness',
        fluff: 'Nothing escapes your notice for long — footsteps, breath, killing intent.',
        perLevel: (lvl) => ({ text: `Gain **+${lvl}** to perception-style checks and initiative.`, mechanics: { initiativeD8: Math.ceil(lvl / 2) } }) }),
    basePassive({ id: 'passive-stone-stance', name: 'Stone Stance', subfamily: 'armor',
        fluff: 'When you plant your feet, you do not move unless you choose to.',
        perLevel: (lvl) => ({ text: `Gain **+${Math.ceil(P_ARMOR[lvl - 1] / 2)} Armor** while you have not moved this round.`, mechanics: { armor: Math.ceil(P_ARMOR[lvl - 1] / 2) } }) }),
    basePassive({ id: 'passive-surrounded-bulwark', name: 'Surrounded Bulwark', subfamily: 'armor',
        fluff: 'The more that press in on you, the more dangerous you become.',
        perLevel: (lvl) => ({ text: `Gain **+${Math.ceil(P_ARMOR[lvl - 1] / 2)} Armor** while flanked by 2 or more enemies.`, mechanics: { armor: Math.ceil(P_ARMOR[lvl - 1] / 2) } }) }),
    basePassive({ id: 'passive-flowing-step', name: 'Flowing Step', subfamily: 'evade',
        fluff: 'Attacks miss as you flow between the strikes.',
        perLevel: (lvl) => ({ text: `Gain **+${Math.ceil(P_EVADE[lvl - 1] / 2)} Evade** while you moved at least 2 m this round.`, mechanics: { evade: Math.ceil(P_EVADE[lvl - 1] / 2) } }) }),
    basePassive({ id: 'passive-duelist-footwork', name: 'Duelist Footwork', subfamily: 'evade',
        fluff: 'One-on-one, nobody matches your footwork.',
        perLevel: (lvl) => ({ text: `Gain **+${Math.ceil(P_EVADE[lvl - 1] / 2)} Evade** against enemies that are not adjacent to any other enemy of yours.`, mechanics: { evade: Math.ceil(P_EVADE[lvl - 1] / 2) } }) }),
    basePassive({ id: 'passive-momentum', name: 'Momentum', subfamily: 'damage',
        fluff: 'Every step you take feeds the next strike.',
        perLevel: (lvl) => ({ text: `Your attacks deal **+${P_DAMAGE[lvl - 1]}** damage on rounds you moved at least 2 m.`, mechanics: { damageRider: { flat: `+${P_DAMAGE[lvl - 1]}` } } }) }),
    basePassive({ id: 'passive-ambusher', name: 'Ambusher', subfamily: 'damage',
        fluff: 'The first strike is always the worst one.',
        perLevel: (lvl) => ({ text: `Your first attack each combat deals **+${P_DAMAGE[lvl - 1]}** damage.`, mechanics: { damageRider: { flat: `+${P_DAMAGE[lvl - 1]}` }, usageLimit: { per: 'combat', max: 1 } } }) }),
    basePassive({ id: 'passive-bloodlust', name: 'Bloodlust', subfamily: 'damage',
        fluff: 'Low on life, you become frighteningly dangerous.',
        perLevel: (lvl) => ({ text: `While below **50% HP**, your attacks deal **+${P_DAMAGE[lvl - 1]}** damage.`, mechanics: { damageRider: { flat: `+${P_DAMAGE[lvl - 1]}` }, condition: 'self-hp-below-50' } }) }),
    basePassive({ id: 'passive-executioner', name: 'Executioner', subfamily: 'damage',
        fluff: 'When your enemy is wounded, you do not miss the opening.',
        perLevel: (lvl) => ({ text: `Your attacks deal **+${P_DAMAGE[lvl - 1]}** damage against targets at or below 50% HP.`, mechanics: { damageRider: { flat: `+${P_DAMAGE[lvl - 1]}` } } }) }),
    basePassive({ id: 'passive-blood-feast', name: 'Blood Feast', subfamily: 'recovery',
        fluff: 'Every kill restores the strength the fight cost you.',
        perLevel: (lvl) => ({ text: `When you drop an enemy, recover **${P_HEAL[lvl - 1]} HP**.`, mechanics: { healing: { flat: P_HEAL[lvl - 1], trigger: 'onKill', target: 'self' } } }) }),
    basePassive({ id: 'passive-battle-trance', name: 'Battle Trance', subfamily: 'defensive',
        fluff: 'Combat focuses you; chaos slides off your mind.',
        perLevel: (lvl) => ({ text: `Gain **+${lvl}** dice on Mind saves while in combat.`, mechanics: { saveDice: { mind: lvl } } }) }),
    basePassive({ id: 'passive-stillness-recovery', name: 'Stillness Recovery', subfamily: 'recovery',
        fluff: 'Out of combat, your wounds close themselves.',
        perLevel: (lvl) => ({ text: `Between encounters, recover **${P_HEAL[lvl - 1]} HP**.`, mechanics: { healing: { flat: P_HEAL[lvl - 1], trigger: 'scene', target: 'self' } } }) }),
    // ─── Combined (11) ───────────────────────────────────────────────────
    basePassive({ id: 'passive-armor-temp-hp', name: 'Armor + Temporary HP', subfamily: 'combined',
        fluff: 'Hardened frame plus a renewing buffer.',
        perLevel: (lvl) => ({ text: `Gain **+${Math.ceil(P_ARMOR[lvl - 1] / 2)} Armor**. At the start of each combat, gain **${Math.ceil(P_TEMP[lvl - 1] / 2)} Temporary HP**.`,
            mechanics: { armor: Math.ceil(P_ARMOR[lvl - 1] / 2), triggers: { combatStart: { tempHP: String(Math.ceil(P_TEMP[lvl - 1] / 2)) } } } }) }),
    basePassive({ id: 'passive-armor-healing', name: 'Armor + Healing', subfamily: 'combined',
        fluff: 'You are hard to hurt, and you mend what still lands.',
        perLevel: (lvl) => ({ text: `Gain **+${Math.ceil(P_ARMOR[lvl - 1] / 2)} Armor** and regenerate **${Math.ceil(P_REGEN[lvl - 1] / 2)} HP** at the end of each of your turns.`,
            mechanics: { armor: Math.ceil(P_ARMOR[lvl - 1] / 2), regen: Math.ceil(P_REGEN[lvl - 1] / 2) } }) }),
    basePassive({ id: 'passive-armor-health', name: 'Armor + Health', subfamily: 'combined',
        fluff: 'Tough skin, deep reserves.',
        perLevel: (lvl) => ({ text: `Gain **+${Math.ceil(P_ARMOR[lvl - 1] / 2)} Armor** and **+${Math.ceil(P_HEALTH[lvl - 1] / 2)} Max HP**.`,
            mechanics: { armor: Math.ceil(P_ARMOR[lvl - 1] / 2) } }) }),
    basePassive({ id: 'passive-evade-temp-hp', name: 'Evade + Temporary HP', subfamily: 'combined',
        fluff: 'Slip what you can; buffer what you can’t.',
        perLevel: (lvl) => ({ text: `Gain **+${Math.ceil(P_EVADE[lvl - 1] / 2)} Evade**. At the start of each combat, gain **${Math.ceil(P_TEMP[lvl - 1] / 2)} Temporary HP**.`,
            mechanics: { evade: Math.ceil(P_EVADE[lvl - 1] / 2), triggers: { combatStart: { tempHP: String(Math.ceil(P_TEMP[lvl - 1] / 2)) } } } }) }),
    basePassive({ id: 'passive-evade-healing', name: 'Evade + Healing', subfamily: 'combined',
        fluff: 'Hard to hit, quick to heal.',
        perLevel: (lvl) => ({ text: `Gain **+${Math.ceil(P_EVADE[lvl - 1] / 2)} Evade** and regenerate **${Math.ceil(P_REGEN[lvl - 1] / 2)} HP** at the end of each of your turns.`,
            mechanics: { evade: Math.ceil(P_EVADE[lvl - 1] / 2), regen: Math.ceil(P_REGEN[lvl - 1] / 2) } }) }),
    basePassive({ id: 'passive-evade-damage', name: 'Evade + Damage', subfamily: 'combined',
        fluff: 'Nimble fighter, dangerous strikes.',
        perLevel: (lvl) => ({ text: `Gain **+${Math.ceil(P_EVADE[lvl - 1] / 2)} Evade** and your attacks deal **+${P_DAMAGE[Math.max(0, lvl - 2)] || '1d8'}** damage.`,
            mechanics: { evade: Math.ceil(P_EVADE[lvl - 1] / 2), damageRider: { flat: `+${P_DAMAGE[Math.max(0, lvl - 2)] || '1d8'}` } } }) }),
    basePassive({ id: 'passive-damage-healing', name: 'Damage + Healing', subfamily: 'combined',
        fluff: 'You hurt them, you heal yourself.',
        perLevel: (lvl) => ({ text: `Your attacks deal **+${P_DAMAGE[Math.max(0, lvl - 2)] || '1d8'}** damage and heal you for **${P_REGEN[lvl - 1]} HP** on hit.`,
            mechanics: { damageRider: { flat: `+${P_DAMAGE[Math.max(0, lvl - 2)] || '1d8'}` }, healing: { flat: String(P_REGEN[lvl - 1]), trigger: 'onHit', target: 'self' } } }) }),
    basePassive({ id: 'passive-damage-temp-hp', name: 'Damage + Temporary HP', subfamily: 'combined',
        fluff: 'Your aggression steels you against retaliation.',
        perLevel: (lvl) => ({ text: `Your attacks deal **+${P_DAMAGE[Math.max(0, lvl - 2)] || '1d8'}** damage. On hit, gain **${Math.ceil(P_TEMP[lvl - 1] / 4)} Temporary HP**.`,
            mechanics: { damageRider: { flat: `+${P_DAMAGE[Math.max(0, lvl - 2)] || '1d8'}` } } }) }),
    basePassive({ id: 'passive-awareness-evade', name: 'Awareness + Evade', subfamily: 'awareness',
        fluff: 'You see it coming and you’re already gone.',
        perLevel: (lvl) => ({ text: `Gain **+${lvl}** initiative dice and **+${Math.ceil(P_EVADE[lvl - 1] / 2)} Evade**.`,
            mechanics: { initiativeD8: lvl, evade: Math.ceil(P_EVADE[lvl - 1] / 2) } }) }),
    basePassive({ id: 'passive-awareness-damage', name: 'Awareness + Damage', subfamily: 'awareness',
        fluff: 'You see the opening and you take it.',
        perLevel: (lvl) => ({ text: `Gain **+${lvl}** initiative dice. Your attacks deal **+${P_DAMAGE[Math.max(0, lvl - 2)] || '1d8'}** damage.`,
            mechanics: { initiativeD8: lvl, damageRider: { flat: `+${P_DAMAGE[Math.max(0, lvl - 2)] || '1d8'}` } } }) }),
    basePassive({ id: 'passive-health-healing', name: 'Health + Healing', subfamily: 'combined',
        fluff: 'Deep reserves that refill themselves.',
        perLevel: (lvl) => ({ text: `Gain **+${Math.ceil(P_HEALTH[lvl - 1] / 2)} Max HP** and regenerate **${Math.ceil(P_REGEN[lvl - 1] / 2)} HP** at the end of each of your turns.`,
            mechanics: { regen: Math.ceil(P_REGEN[lvl - 1] / 2) } }) }),
    basePassive({ id: 'passive-health-temp-hp', name: 'Health + Temporary HP', subfamily: 'combined',
        fluff: 'More life, more buffer.',
        perLevel: (lvl) => ({ text: `Gain **+${Math.ceil(P_HEALTH[lvl - 1] / 2)} Max HP**. At the start of each combat, gain **${Math.ceil(P_TEMP[lvl - 1] / 2)} Temporary HP**.`,
            mechanics: { triggers: { combatStart: { tempHP: String(Math.ceil(P_TEMP[lvl - 1] / 2)) } } } }) }),
    // ─── Conditional Combined (12) ──────────────────────────────────────
    // Same pairs as Combined but gated on a condition (e.g. "while flanked",
    // "against wounded targets", etc.). Bonuses are ~1.5× because of the gate.
    basePassive({ id: 'conditional-passive-armor-temp-hp', name: 'Armor + Temporary HP (Conditional)', subfamily: 'conditional-combined',
        fluff: 'When the condition is met, you harden and absorb.',
        perLevel: (lvl) => ({ text: `When the chosen condition is met: Gain **+${P_ARMOR[lvl - 1]} Armor** and at combat start gain **${P_TEMP[lvl - 1]} Temporary HP**.`,
            mechanics: { armor: P_ARMOR[lvl - 1], triggers: { combatStart: { tempHP: String(P_TEMP[lvl - 1]) } } } }) }),
    basePassive({ id: 'conditional-passive-armor-healing', name: 'Armor + Healing (Conditional)', subfamily: 'conditional-combined',
        fluff: 'Hardened and mending while the gate holds.',
        perLevel: (lvl) => ({ text: `When the chosen condition is met: Gain **+${P_ARMOR[lvl - 1]} Armor** and regenerate **${P_REGEN[lvl - 1]} HP**/turn.`,
            mechanics: { armor: P_ARMOR[lvl - 1], regen: P_REGEN[lvl - 1] } }) }),
    basePassive({ id: 'conditional-passive-armor-health', name: 'Armor + Health (Conditional)', subfamily: 'conditional-combined',
        fluff: 'Tough and durable when pressed.',
        perLevel: (lvl) => ({ text: `When the chosen condition is met: Gain **+${P_ARMOR[lvl - 1]} Armor** and **+${P_HEALTH[lvl - 1]} Max HP**.`,
            mechanics: { armor: P_ARMOR[lvl - 1] } }) }),
    basePassive({ id: 'conditional-passive-evade-temp-hp', name: 'Evade + Temporary HP (Conditional)', subfamily: 'conditional-combined',
        fluff: 'Nimble with a reserve when the gate fires.',
        perLevel: (lvl) => ({ text: `When the chosen condition is met: Gain **+${P_EVADE[lvl - 1]} Evade** and at combat start gain **${P_TEMP[lvl - 1]} Temporary HP**.`,
            mechanics: { evade: P_EVADE[lvl - 1], triggers: { combatStart: { tempHP: String(P_TEMP[lvl - 1]) } } } }) }),
    basePassive({ id: 'conditional-passive-evade-healing', name: 'Evade + Healing (Conditional)', subfamily: 'conditional-combined',
        fluff: 'Hard to hit and self-mending in the moment.',
        perLevel: (lvl) => ({ text: `When the chosen condition is met: Gain **+${P_EVADE[lvl - 1]} Evade** and regenerate **${P_REGEN[lvl - 1]} HP**/turn.`,
            mechanics: { evade: P_EVADE[lvl - 1], regen: P_REGEN[lvl - 1] } }) }),
    basePassive({ id: 'conditional-passive-evade-damage', name: 'Evade + Damage (Conditional)', subfamily: 'conditional-combined',
        fluff: 'Agile and dangerous under the right circumstance.',
        perLevel: (lvl) => ({ text: `When the chosen condition is met: Gain **+${P_EVADE[lvl - 1]} Evade** and deal **+${P_DAMAGE[lvl - 1]}** damage.`,
            mechanics: { evade: P_EVADE[lvl - 1], damageRider: { flat: `+${P_DAMAGE[lvl - 1]}` } } }) }),
    basePassive({ id: 'conditional-passive-damage-healing', name: 'Damage + Healing (Conditional)', subfamily: 'conditional-combined',
        fluff: 'You hurt and you heal, when the condition is right.',
        perLevel: (lvl) => ({ text: `When the chosen condition is met: Deal **+${P_DAMAGE[lvl - 1]}** damage and heal **${P_REGEN[lvl - 1]} HP** on hit.`,
            mechanics: { damageRider: { flat: `+${P_DAMAGE[lvl - 1]}` }, healing: { flat: String(P_REGEN[lvl - 1]), trigger: 'onHit', target: 'self' } } }) }),
    basePassive({ id: 'conditional-passive-damage-temp-hp', name: 'Damage + Temporary HP (Conditional)', subfamily: 'conditional-combined',
        fluff: 'You strike harder and brace yourself for the return.',
        perLevel: (lvl) => ({ text: `When the chosen condition is met: Deal **+${P_DAMAGE[lvl - 1]}** damage and at combat start gain **${P_TEMP[lvl - 1]} Temporary HP**.`,
            mechanics: { damageRider: { flat: `+${P_DAMAGE[lvl - 1]}` }, triggers: { combatStart: { tempHP: String(P_TEMP[lvl - 1]) } } } }) }),
    basePassive({ id: 'conditional-passive-awareness-evade', name: 'Awareness + Evade (Conditional)', subfamily: 'conditional-combined',
        fluff: 'Your awareness gives you the window to slip away.',
        perLevel: (lvl) => ({ text: `When the chosen condition is met: Gain **+${lvl + 2}** initiative dice and **+${P_EVADE[lvl - 1]} Evade**.`,
            mechanics: { initiativeD8: lvl + 2, evade: P_EVADE[lvl - 1] } }) }),
    basePassive({ id: 'conditional-passive-awareness-damage', name: 'Awareness + Damage (Conditional)', subfamily: 'conditional-combined',
        fluff: 'You see the opening and drive through it.',
        perLevel: (lvl) => ({ text: `When the chosen condition is met: Gain **+${lvl + 2}** initiative dice and deal **+${P_DAMAGE[lvl - 1]}** damage.`,
            mechanics: { initiativeD8: lvl + 2, damageRider: { flat: `+${P_DAMAGE[lvl - 1]}` } } }) }),
    basePassive({ id: 'conditional-passive-health-healing', name: 'Health + Healing (Conditional)', subfamily: 'conditional-combined',
        fluff: 'Reserves that refill themselves under the right pressure.',
        perLevel: (lvl) => ({ text: `When the chosen condition is met: Gain **+${P_HEALTH[lvl - 1]} Max HP** and regenerate **${P_REGEN[lvl - 1]} HP**/turn.`,
            mechanics: { regen: P_REGEN[lvl - 1] } }) }),
    basePassive({ id: 'conditional-passive-health-temp-hp', name: 'Health + Temporary HP (Conditional)', subfamily: 'conditional-combined',
        fluff: 'More life, more buffer — when the condition triggers.',
        perLevel: (lvl) => ({ text: `When the chosen condition is met: Gain **+${P_HEALTH[lvl - 1]} Max HP** and at combat start gain **${P_TEMP[lvl - 1]} Temporary HP**.`,
            mechanics: { triggers: { combatStart: { tempHP: String(P_TEMP[lvl - 1]) } } } }) }),
    // ─── Special Aura (1) ───────────────────────────────────────────────
    basePassive({ id: 'passive-special-aura', name: 'Special Aura', subfamily: 'special-aura',
        fluff: 'You radiate a chosen Special, pushing it onto enemies caught in your presence.',
        perLevel: (lvl) => {
            const radius = [2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10][lvl - 1];
            const rank = Math.ceil(lvl / 2);
            return {
                text: `Enemies that start their turn within **${radius} m** take your chosen Special(X) at **rank ${rank}**.`,
                mechanics: { modifySpecial: { type: 'chosen', mode: 'setIfHigher', amount: rank } },
            };
        } }),
];
//# sourceMappingURL=passives.js.map