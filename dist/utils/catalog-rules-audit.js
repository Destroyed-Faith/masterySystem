/**
 * Rules ↔ Foundry catalog audit engine.
 *
 * Compares power / artifact catalogs against docs/Rules/*.md and curated
 * expected manifests. Pure & testable — no Foundry runtime required.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ACTIVE_TEMPLATES, ACTIVE_BUFF_TEMPLATES, PASSIVE_TEMPLATES, REACTION_TEMPLATES, MOVEMENT_TEMPLATES, } from './powers/templates/index.js';
import { ECHO_ARTIFACTS } from './echo-artifacts.js';
import { GENERAL_ARTIFACTS } from './general-artifacts.js';
import { POWER_LEVEL_KEYS } from '../types/power-levels.js';
// ─── Constants ───────────────────────────────────────────────────────────────
/** Awareness / Heightened Senses — retired; Sense Slot replaces them. */
export const RETIRED_AWARENESS_PASSIVE_IDS = [
    'passive-heightened-senses',
    'passive-awareness-evade',
    'passive-awareness-damage',
    'conditional-passive-awareness-evade',
    'conditional-passive-awareness-damage',
];
/**
 * Template IDs corrected against Rules/active-buffs.md in the catalog audit pass
 * (Active Buff Evade pure curve + Evade combinations).
 */
export const AUDIT_CORRECTED_TEMPLATE_IDS = new Set([
    'ab-evade',
    'ab-evade-temp-hp',
    'ab-armor-evade',
]);
/** Expected Rules Active Buff display names → Foundry templateId. */
export const RULES_EXPECTED_ACTIVE_BUFFS = [
    { rulesName: 'Armor', id: 'ab-armor' },
    { rulesName: 'Evade', id: 'ab-evade' },
    { rulesName: 'Armor Aura', id: 'ab-armor-aura' },
    { rulesName: 'Temporary HP', id: 'ab-temp-hp' },
    { rulesName: 'Healing', id: 'ab-healing' },
    { rulesName: 'Damage Reduction', id: 'ab-damage-reduction' },
    { rulesName: 'Phasing', id: 'ab-phasing' },
    { rulesName: 'Armor + Temporary HP', id: 'ab-armor-temp-hp' },
    { rulesName: 'Evade + Temporary HP', id: 'ab-evade-temp-hp' },
    { rulesName: 'Temporary HP + Healing', id: 'ab-temp-hp-healing' },
    { rulesName: 'Armor + Evade', id: 'ab-armor-evade' },
    { rulesName: 'Damage', id: 'ab-damage' },
    { rulesName: 'Penetration', id: 'ab-penetration' },
    { rulesName: 'Damage + Penetration', id: 'ab-damage-penetration' },
    { rulesName: 'Critical', id: 'ab-critical' },
    { rulesName: 'Special Overdrive', id: 'ab-special-overdrive' },
    { rulesName: 'Spell Resistance', id: 'ab-spell-resistance' },
    { rulesName: 'Cleanse Maintenance', id: 'ab-cleanse-maintenance' },
    { rulesName: 'Damage Aura', id: 'ab-damage-aura' },
    { rulesName: 'Healing Aura', id: 'ab-healing-aura' },
    { rulesName: 'Smite Aura', id: 'ab-smite-aura' },
    { rulesName: 'Growth Form', id: 'ab-growth-form' },
    { rulesName: 'Summon Damage Aura', id: 'ab-summon-damage-aura' },
    { rulesName: 'Summon Armor Aura', id: 'ab-summon-armor-aura' },
    { rulesName: 'Thorns', id: 'ab-thorns' },
    { rulesName: 'Invisibility', id: 'ab-invisibility' },
    { rulesName: 'Reinforced Parry', id: 'ab-reinforced-parry' },
    { rulesName: 'Intensified Absorption', id: 'ab-intensified-absorption' },
    { rulesName: 'Reinforced Damage Negation', id: 'ab-reinforced-damage-negation' },
    // Documented in Rules/actives.md as Active Buff — Immovable + Temporary HP
    { rulesName: 'Immovable + Temporary HP', id: 'ab-immovable-temp-hp' },
];
/** Expected Rules Reaction names → Foundry templateId. */
export const RULES_EXPECTED_REACTIONS = [
    { rulesName: 'Armor', id: 'reaction-armor' },
    { rulesName: 'Evade', id: 'reaction-evade' },
    { rulesName: 'Temporary HP', id: 'reaction-temp-hp' },
    { rulesName: 'Armor + Temporary HP', id: 'reaction-armor-temp-hp' },
    { rulesName: 'Evade + Temporary HP', id: 'reaction-evade-temp-hp' },
    { rulesName: 'Ally Armor', id: 'reaction-ally-armor' },
    { rulesName: 'Ally Evade', id: 'reaction-ally-evade' },
    { rulesName: 'Ally Temporary HP', id: 'reaction-ally-temp-hp' },
    { rulesName: 'Damage Reduction', id: 'reaction-damage-reduction' },
    { rulesName: 'Phasing', id: 'reaction-phasing' },
    { rulesName: 'Counter Damage', id: 'reaction-counter-damage' },
    { rulesName: 'Counter Damage + Push', id: 'reaction-counter-damage-push' },
    { rulesName: 'Special Increase', id: 'reaction-special-increase' },
    { rulesName: 'Initiative Gain', id: 'reaction-initiative-gain' },
    { rulesName: 'Reposition', id: 'reaction-reposition' },
    { rulesName: 'Reactive Cleanse', id: 'reaction-reactive-cleanse' },
    { rulesName: 'Riposte', id: 'reaction-riposte' },
    { rulesName: 'Reflection', id: 'reaction-parry-reflection' },
    { rulesName: 'Reactive Overload', id: 'reaction-reactive-overload' },
    // Catalog expansion (CHANGELOG / agent intercept patterns); keep tracked.
    { rulesName: 'Repositioning Intercept', id: 'reaction-repositioning-intercept' },
];
/** Expected Movement Power names. */
export const RULES_EXPECTED_MOVEMENT = [
    { rulesName: 'Ground Dash', id: 'movement-ground-dash' },
    { rulesName: 'Safe Movement', id: 'movement-safe-movement' },
    { rulesName: 'Teleport', id: 'movement-teleport' },
    { rulesName: 'Teleport with Ally', id: 'movement-teleport-with-ally' },
    { rulesName: 'Flight', id: 'movement-flight' },
    { rulesName: 'Leap', id: 'movement-leap' },
    { rulesName: 'Wall Walk', id: 'movement-wall-walk' },
    { rulesName: 'Burrow', id: 'movement-burrow' },
    { rulesName: 'Phase Passage', id: 'movement-phase-passage' },
    { rulesName: 'Trample', id: 'movement-trample' },
];
/**
 * Curated Active families (Rules special-first + named templates).
 * MD parsing alone is ambiguous for Special-slot expansions.
 */
export const RULES_EXPECTED_ACTIVES = [
    // Special-first damage single (tier 3–6 = Start PP 3/4/6/8)
    { rulesName: 'Melee — Damage + Start PP 3 Special', id: 'active-melee-damage-t3' },
    { rulesName: 'Ranged — Damage + Start PP 3 Special', id: 'active-ranged-damage-t3' },
    { rulesName: 'Melee — Damage + Start PP 4 Special', id: 'active-melee-damage-t4' },
    { rulesName: 'Ranged — Damage + Start PP 4 Special', id: 'active-ranged-damage-t4' },
    { rulesName: 'Melee — Damage + Start PP 6 Special', id: 'active-melee-damage-t5' },
    { rulesName: 'Ranged — Damage + Start PP 6 Special', id: 'active-ranged-damage-t5' },
    { rulesName: 'Melee — Damage + Start PP 8 Special', id: 'active-melee-damage-t6' },
    { rulesName: 'Ranged — Damage + Start PP 8 Special', id: 'active-ranged-damage-t6' },
    // AoE
    { rulesName: 'Melee AoE — Damage + Start PP 3 Special', id: 'active-melee-aoe-damage-t3' },
    { rulesName: 'Ranged AoE — Damage + Start PP 3 Special', id: 'active-ranged-aoe-damage-t3' },
    { rulesName: 'Melee AoE — Damage + Start PP 4 Special', id: 'active-melee-aoe-damage-t4' },
    { rulesName: 'Ranged AoE — Damage + Start PP 4 Special', id: 'active-ranged-aoe-damage-t4' },
    { rulesName: 'Melee AoE — Damage + Start PP 6 Special', id: 'active-melee-aoe-damage-t5' },
    { rulesName: 'Ranged AoE — Damage + Start PP 6 Special', id: 'active-ranged-aoe-damage-t5' },
    { rulesName: 'Melee AoE — Damage + Start PP 8 Special', id: 'active-melee-aoe-damage-t6' },
    { rulesName: 'Ranged AoE — Damage + Start PP 8 Special', id: 'active-ranged-aoe-damage-t6' },
    // Persistent zones
    { rulesName: 'Ranged Persistent Zone — Start PP 3 Special', id: 'active-ranged-zone-t3' },
    { rulesName: 'Ranged Persistent Zone — Start PP 4 Special', id: 'active-ranged-zone-t4' },
    { rulesName: 'Ranged Persistent Zone — Start PP 6 Special', id: 'active-ranged-zone-t5' },
    { rulesName: 'Ranged Persistent Zone — Start PP 8 Special', id: 'active-ranged-zone-t6' },
    // Control
    { rulesName: 'Melee — Control: Push / Pull', id: 'active-melee-control-push-pull' },
    { rulesName: 'Ranged — Control: Push / Pull', id: 'active-ranged-control-push-pull' },
    { rulesName: 'Melee — Control: Pull + Disarm', id: 'active-melee-control-pull-disarm' },
    { rulesName: 'Ranged — Control: Pull + Disarm', id: 'active-ranged-control-pull-disarm' },
    { rulesName: 'Melee — Control: Push + Prone', id: 'active-melee-control-push-prone' },
    { rulesName: 'Ranged — Control: Push + Prone', id: 'active-ranged-control-push-prone' },
    // Support
    { rulesName: 'Melee Single Target Heal', id: 'active-melee-single-heal' },
    { rulesName: 'Ranged Single Target Heal', id: 'active-ranged-single-heal' },
    { rulesName: 'Melee AoE Heal', id: 'active-melee-aoe-heal' },
    { rulesName: 'Ranged AoE Heal', id: 'active-ranged-aoe-heal' },
    { rulesName: 'Melee Single Target Cleanse', id: 'active-melee-single-cleanse' },
    { rulesName: 'Ranged Single Target Cleanse', id: 'active-ranged-single-cleanse' },
    { rulesName: 'Melee AoE Cleanse', id: 'active-melee-aoe-cleanse' },
    { rulesName: 'Ranged AoE Cleanse', id: 'active-ranged-aoe-cleanse' },
    { rulesName: 'Melee Single Target Dispel', id: 'active-melee-single-dispel' },
    { rulesName: 'Ranged Single Target Dispel', id: 'active-ranged-single-dispel' },
    { rulesName: 'Melee AoE Dispel', id: 'active-melee-aoe-dispel' },
    { rulesName: 'Ranged AoE Dispel', id: 'active-ranged-aoe-dispel' },
    { rulesName: 'Melee Heal + Cleanse', id: 'active-melee-heal-cleanse-mixed' },
    { rulesName: 'Ranged Heal + Cleanse', id: 'active-ranged-heal-cleanse-mixed' },
    { rulesName: 'Melee Damage + Dispel', id: 'active-melee-damage-dispel-mixed' },
    { rulesName: 'Ranged Damage + Dispel', id: 'active-ranged-damage-dispel-mixed' },
    { rulesName: 'Ranged Barrier — 4 Rounds', id: 'active-ranged-barrier' },
    { rulesName: 'Melee — Damage + Stunned', id: 'active-melee-damage-stunned' },
    { rulesName: 'Ranged — Damage + Stunned', id: 'active-ranged-damage-stunned' },
    { rulesName: 'Ranged Images — 4 Rounds', id: 'active-ranged-illusion-image' },
    { rulesName: 'Melee Single Attack', id: 'active-melee-weapon-single' },
    { rulesName: 'Ranged Single Attack', id: 'active-ranged-weapon-single' },
    { rulesName: 'Melee AoE Weapon Attack', id: 'active-melee-weapon-aoe' },
    { rulesName: 'Ranged AoE Weapon Attack', id: 'active-ranged-weapon-aoe' },
    { rulesName: 'Melee Split Attack', id: 'active-melee-weapon-split' },
    { rulesName: 'Ranged Split Attack', id: 'active-ranged-weapon-split' },
    { rulesName: 'Ranged Autofire', id: 'active-ranged-weapon-autofire' },
    { rulesName: 'Melee Smite Attack', id: 'active-melee-smite-attack' },
    { rulesName: 'Ranged Smite Attack', id: 'active-ranged-smite-attack' },
    { rulesName: 'Ranged AoE Smite Attack', id: 'active-ranged-aoe-smite-attack' },
    { rulesName: 'Melee Health Level Heal', id: 'active-melee-health-level-heal' },
    { rulesName: 'Ranged Health Level Heal', id: 'active-ranged-health-level-heal' },
    { rulesName: 'Cleanse Absorption', id: 'active-cleanse-absorption' },
    { rulesName: 'Mental Attack', id: 'active-mental-attack' },
    { rulesName: 'Mind Illusion', id: 'active-mind-illusion' },
];
/**
 * Foundry support / empowerment passives (not obsolete — system scaffolding
 * for Active Buff empowerment & extension axes).
 */
export const SYSTEM_SUPPORT_PASSIVE_IDS = [
    { rulesName: 'Damage Buff Empowerment', id: 'empower-buff-damage' },
    { rulesName: 'Armor Buff Empowerment', id: 'empower-buff-armor' },
    { rulesName: 'Evade Buff Empowerment', id: 'empower-buff-evade' },
    { rulesName: 'Wind Buff Empowerment', id: 'empower-buff-wind' },
    { rulesName: 'Armor Buff Extension', id: 'extend-buff-armor' },
    { rulesName: 'DR Buff Extension', id: 'extend-buff-damage-reduction' },
    { rulesName: 'Evade Buff Extension', id: 'extend-buff-evade' },
    { rulesName: 'Mobility Buff Extension', id: 'extend-buff-mobility' },
    { rulesName: 'Echo Armor Value', id: 'passive-echo-armor-value' },
];
/** Core Passives expected from Rules/passives.md (non-awareness). */
export const RULES_EXPECTED_PASSIVES = [
    { rulesName: 'Fortified Frame', id: 'passive-fortified-frame' },
    { rulesName: 'Damage Reduction', id: 'passive-damage-reduction' },
    { rulesName: 'Evade', id: 'passive-evade' },
    { rulesName: 'Initiative', id: 'passive-initiative' },
    { rulesName: 'Temporary Hit Points', id: 'passive-temp-hp' },
    { rulesName: 'Regeneration', id: 'passive-regeneration' },
    { rulesName: 'Ghostform', id: 'passive-ghostform' },
    { rulesName: 'Killing Intent', id: 'passive-killing-intent' },
    { rulesName: 'Deep Vitality', id: 'passive-deep-vitality' },
    { rulesName: 'Spell Resistance', id: 'passive-spell-resistance' },
    { rulesName: 'Ward', id: 'passive-ward' },
    { rulesName: 'Stone Stance', id: 'passive-stone-stance' },
    { rulesName: 'Surrounded Bulwark', id: 'passive-surrounded-bulwark' },
    { rulesName: 'Flowing Step', id: 'passive-flowing-step' },
    { rulesName: 'Duelist Footwork', id: 'passive-duelist-footwork' },
    { rulesName: 'Momentum', id: 'passive-momentum' },
    { rulesName: 'Ambusher', id: 'passive-ambusher' },
    { rulesName: 'Bloodlust', id: 'passive-bloodlust' },
    { rulesName: 'Executioner', id: 'passive-executioner' },
    { rulesName: 'Blood Feast', id: 'passive-blood-feast' },
    { rulesName: 'Battle Trance', id: 'passive-battle-trance' },
    { rulesName: 'Stillness Recovery', id: 'passive-stillness-recovery' },
    { rulesName: 'Armor / Temporary HP', id: 'passive-armor-temp-hp' },
    { rulesName: 'Armor / Healing', id: 'passive-armor-healing' },
    { rulesName: 'Armor / Health', id: 'passive-armor-health' },
    { rulesName: 'Evade / Temporary HP', id: 'passive-evade-temp-hp' },
    { rulesName: 'Evade / Healing', id: 'passive-evade-healing' },
    { rulesName: 'Evade / Damage', id: 'passive-evade-damage' },
    { rulesName: 'Damage / Healing', id: 'passive-damage-healing' },
    { rulesName: 'Damage / Temporary HP', id: 'passive-damage-temp-hp' },
    { rulesName: 'Health / Healing', id: 'passive-health-healing' },
    { rulesName: 'Health / Temporary HP', id: 'passive-health-temp-hp' },
    { rulesName: 'Armor / Temporary HP (Conditional)', id: 'conditional-passive-armor-temp-hp' },
    { rulesName: 'Armor / Healing (Conditional)', id: 'conditional-passive-armor-healing' },
    { rulesName: 'Armor / Health (Conditional)', id: 'conditional-passive-armor-health' },
    { rulesName: 'Evade / Temporary HP (Conditional)', id: 'conditional-passive-evade-temp-hp' },
    { rulesName: 'Evade / Healing (Conditional)', id: 'conditional-passive-evade-healing' },
    { rulesName: 'Evade / Damage (Conditional)', id: 'conditional-passive-evade-damage' },
    { rulesName: 'Damage / Healing (Conditional)', id: 'conditional-passive-damage-healing' },
    { rulesName: 'Damage / Temporary HP (Conditional)', id: 'conditional-passive-damage-temp-hp' },
    { rulesName: 'Health / Healing (Conditional)', id: 'conditional-passive-health-healing' },
    { rulesName: 'Health / Temporary HP (Conditional)', id: 'conditional-passive-health-temp-hp' },
    { rulesName: 'Special Aura', id: 'passive-special-aura' },
    { rulesName: 'Telepathy / Mind Link', id: 'passive-telepathy-mind-link' },
    { rulesName: 'Bound Host', id: 'passive-bound-host' },
    { rulesName: 'Thornhide', id: 'passive-thornhide' },
    { rulesName: 'Invisibility', id: 'passive-invisibility' },
    { rulesName: 'Parry', id: 'passive-parry' },
    { rulesName: 'Absorption', id: 'passive-absorption' },
    { rulesName: 'Damage Negation', id: 'passive-damage-negation' },
];
/** Named artifacts expected from Rules/artefacts.md (+ echo set). */
export const RULES_EXPECTED_ARTIFACTS = [
    { rulesName: 'Stonebound Soles', id: 'stoneboundSoles', source: 'echo' },
    { rulesName: 'Elorian Stride', id: 'elorianStride', source: 'echo' },
    { rulesName: 'Wyrm Scales (Heavy)', id: 'wyrmScalesHeavy', source: 'echo' },
    { rulesName: 'Serpent Scales', id: 'wyrmScalesLight', source: 'echo' },
    { rulesName: 'Dragon Claws', id: 'dragonClaws', source: 'echo' },
    { rulesName: 'Dragon Head', id: 'dragonHead', source: 'echo' },
    { rulesName: 'Sentinel Frame', id: 'sentinelFrame', source: 'echo' },
    { rulesName: 'Judicator Frame', id: 'judicatorFrame', source: 'echo' },
    { rulesName: 'Oracle Frame', id: 'oracleFrame', source: 'echo' },
    { rulesName: 'Moonlight Greatsword', id: 'moonlightGreatsword', source: 'general' },
    { rulesName: 'Soul Sigil', id: 'soulSigil', source: 'general' },
    { rulesName: 'Frostbound Returning Axe', id: 'frostboundReturningAxe', source: 'general' },
    { rulesName: 'Shadowgrave Armor', id: 'shadowgraveArmor', source: 'general' },
    { rulesName: 'Staff of the Dark', id: 'staffOfTheDark', source: 'general' },
    { rulesName: 'Starfallen Forceshield', id: 'starfallenForceshield', source: 'general' },
    { rulesName: 'Heart of Winter', id: 'heartOfWinter', source: 'general' },
    { rulesName: 'Heartseeker', id: 'heartseeker', source: 'general' },
    { rulesName: 'Falcon Wide Brim', id: 'falconWideBrim', source: 'general' },
    { rulesName: 'Lantern of the Hollow Star', id: 'lanternOfTheHollowStar', source: 'general' },
    { rulesName: "Lor-Keth's Staff", id: 'lorKethsStaff', source: 'general' },
];
/** Expected Active Buff: Evade L1…L16 values (Rules). */
export const RULES_AB_EVADE_CURVE = [
    8, 14, 20, 26, 32, 38, 44, 50, 56, 62, 68, 74, 80, 86, 92, 98,
];
/** Expected Active Buff: Armor L1…L16 values (Rules). */
export const RULES_AB_ARMOR_CURVE = [
    5, 9, 13, 17, 21, 25, 29, 33, 37, 41, 45, 49, 53, 57, 61, 65,
];
// ─── Rules MD parsing ────────────────────────────────────────────────────────
const HTML_FRAGMENT_RE = /<br|<\/|^\s*$/i;
/** Extract `Active Buff: X` / `Reaction: X` style titles from Rules markdown. */
export function parsePrefixedPowerNames(markdown, prefix) {
    const out = [];
    const re = new RegExp(`^\\s*${escapeRegExp(prefix)}:\\s*(.+?)\\s*$`, 'gim');
    let m;
    while ((m = re.exec(markdown)) !== null) {
        const name = cleanRulesName(m[1] ?? '');
        if (!name || HTML_FRAGMENT_RE.test(name) || name.length > 80)
            continue;
        if (!out.includes(name))
            out.push(name);
    }
    // Also catch <h3>…Active Buff: X…</h3>
    const h3Re = new RegExp(`<h3[^>]*>\\s*${escapeRegExp(prefix)}:\\s*([^<]+)`, 'gi');
    while ((m = h3Re.exec(markdown)) !== null) {
        const name = cleanRulesName(m[1] ?? '');
        if (!name || HTML_FRAGMENT_RE.test(name) || name.length > 80)
            continue;
        if (!out.includes(name))
            out.push(name);
    }
    return out;
}
/** Passive names from `<h3>Name (Passive: …)</h3>` and `Passive: X` headings. */
export function parsePassiveNamesFromRules(markdown) {
    const out = [];
    const h3Re = /<h3[^>]*>\s*([^<]+)/gi;
    let m;
    while ((m = h3Re.exec(markdown)) !== null) {
        let raw = cleanRulesName(m[1] ?? '');
        if (!raw || HTML_FRAGMENT_RE.test(raw))
            continue;
        // "Fortified Frame (Passive: Armor)" → Fortified Frame
        const paren = raw.match(/^(.+?)\s*\(Passive:/i);
        if (paren)
            raw = cleanRulesName(paren[1] ?? '');
        else if (/^Passive:/i.test(raw))
            raw = cleanRulesName(raw.replace(/^Passive:\s*/i, ''));
        else if (/^Conditional Passive:/i.test(raw)) {
            raw = cleanRulesName(raw.replace(/^Conditional Passive:\s*/i, '')) + ' (Conditional)';
        }
        if (!raw || raw.length > 80)
            continue;
        if (!out.includes(raw))
            out.push(raw);
    }
    return out;
}
/** Movement power section titles from Rules/movement.md. */
export function parseMovementNamesFromRules(markdown) {
    const known = new Set(RULES_EXPECTED_MOVEMENT.map((x) => x.rulesName.toLowerCase()));
    const out = [];
    for (const m of markdown.matchAll(/^##\s+(.+)$/gm)) {
        const name = cleanRulesName(m[1] ?? '');
        if (known.has(name.toLowerCase()) && !out.includes(name))
            out.push(name);
    }
    // Also accept bare titles matching expected list even under ### 
    for (const exp of RULES_EXPECTED_MOVEMENT) {
        const re = new RegExp(`^#{2,3}\\s+${escapeRegExp(exp.rulesName)}\\s*$`, 'im');
        if (re.test(markdown) && !out.includes(exp.rulesName))
            out.push(exp.rulesName);
    }
    return out;
}
/** Detect Artifact Summon Token Generator conversion table (4 tokens / stone). */
export function parseArtifactSummonTokenRatio(markdown) {
    const m = markdown.match(/1\s+Summon\s+Stone\s*\|\s*(\d+)\s+Tokens/i);
    if (!m)
        return null;
    return Number(m[1]);
}
function cleanRulesName(s) {
    return s
        .replace(/\{[^}]*\}/g, '')
        .replace(/\s+/g, ' ')
        .replace(/^[\s*#]+|[\s*#]+$/g, '')
        .trim();
}
function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function normalizeName(s) {
    return s
        .toLowerCase()
        .replace(/^active buff:\s*/i, '')
        .replace(/^reaction:\s*/i, '')
        .replace(/^passive:\s*/i, '')
        .replace(/^movement:\s*/i, '')
        .replace(/^conditional passive:\s*/i, '')
        .replace(/[^a-z0-9+/]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
/** Every template must have 16 levels, non-empty name, and a category. */
export function checkTemplateStructure(template) {
    const issues = [];
    const id = template.templateId || '(no-id)';
    const name = template.name || template.templateName || id;
    if (!template.templateId?.trim()) {
        issues.push({ id, name, issue: 'missing templateId' });
    }
    if (!template.name?.trim() && !template.templateName?.trim()) {
        issues.push({ id, name, issue: 'empty name' });
    }
    if (!template.category) {
        issues.push({ id, name, issue: 'missing category' });
    }
    const levels = template.levels ?? {};
    for (const key of POWER_LEVEL_KEYS) {
        if (!levels[key]) {
            issues.push({ id, name, issue: `missing level ${key}` });
        }
    }
    // Mechanics / effect presence on at least one non-empty level
    let anyMechanics = false;
    let anyEffect = false;
    for (const key of POWER_LEVEL_KEYS) {
        const row = levels[key];
        if (!row)
            continue;
        if (row.mechanics && Object.keys(row.mechanics).length > 0)
            anyMechanics = true;
        if (row.effect?.text && String(row.effect.text).trim() && String(row.effect.text).trim() !== '—') {
            anyEffect = true;
        }
    }
    if (!anyMechanics && !anyEffect) {
        issues.push({ id, name, issue: 'no mechanics/values or effect text across levels' });
    }
    return issues;
}
/** Read a curve of a numeric mechanics field across levels 1–16. */
export function readMechanicsCurve(template, field) {
    return POWER_LEVEL_KEYS.map((k) => {
        const m = template.levels?.[k]?.mechanics;
        const v = m?.[field];
        return typeof v === 'number' ? v : undefined;
    });
}
// ─── Audit core ──────────────────────────────────────────────────────────────
function defaultRootDir() {
    try {
        const here = dirname(fileURLToPath(import.meta.url));
        // src/utils → repo root
        return join(here, '..', '..');
    }
    catch {
        return process.cwd();
    }
}
function loadPackageVersion(rootDir) {
    try {
        const pkg = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf8'));
        return pkg.version ?? '0.0.0';
    }
    catch {
        return '0.0.0';
    }
}
function loadRulesBook(rootDir, book, override) {
    if (override?.[book] != null)
        return override[book];
    const path = join(rootDir, 'docs', 'Rules', `${book}.md`);
    if (!existsSync(path))
        return '';
    return readFileSync(path, 'utf8');
}
function emptySummary() {
    return {
        correct: 0,
        corrected: 0,
        missing: 0,
        obsolete: 0,
        'requires-rule-decision': 0,
    };
}
function tally(summary, status) {
    summary[status] += 1;
}
function pushEntry(entries, summary, entry) {
    entries.push(entry);
    tally(summary, entry.status);
}
function statusForMatch(id, correctedIds) {
    return correctedIds.has(id) ? 'corrected' : 'correct';
}
function auditExpectedAgainstCatalog(args) {
    const withStruct = (id, notes) => {
        const struct = args.structuralById?.get(id);
        if (!struct?.length)
            return notes;
        return `${notes} | Structural: ${struct.join('; ')}`;
    };
    const matchedCatalogIds = new Set();
    for (const exp of args.expected) {
        const inCatalog = args.catalogById.get(exp.id);
        const inRules = args.parsedRulesNames.size === 0 ||
            args.parsedRulesNames.has(normalizeName(exp.rulesName)) ||
            [...args.parsedRulesNames].some((n) => n.includes(normalizeName(exp.rulesName)) ||
                normalizeName(exp.rulesName).includes(n));
        if (!inCatalog) {
            pushEntry(args.entries, args.summary, {
                category: args.category,
                id: exp.id,
                name: exp.rulesName,
                status: 'missing',
                notes: inRules
                    ? `Rules lists "${exp.rulesName}" but Foundry catalog has no templateId ${exp.id}`
                    : `Expected "${exp.rulesName}" (${exp.id}) absent from Foundry catalog`,
            });
            continue;
        }
        matchedCatalogIds.add(exp.id);
        if (args.decisionIds?.has(exp.id)) {
            const note = args.notesForId?.(exp.id, exp.rulesName);
            pushEntry(args.entries, args.summary, {
                category: args.category,
                id: exp.id,
                name: inCatalog.name,
                status: 'requires-rule-decision',
                notes: withStruct(exp.id, note ??
                    'Present in catalog; open Rules decision'),
            });
            continue;
        }
        // Curve / value mismatches elevate away from correct
        const note = args.notesForId?.(exp.id, exp.rulesName);
        if (note && /mismatch/i.test(note)) {
            pushEntry(args.entries, args.summary, {
                category: args.category,
                id: exp.id,
                name: inCatalog.name,
                status: 'requires-rule-decision',
                notes: withStruct(exp.id, note),
            });
            continue;
        }
        // Structural failures on an otherwise matched template
        if (args.structuralById?.has(exp.id)) {
            pushEntry(args.entries, args.summary, {
                category: args.category,
                id: exp.id,
                name: inCatalog.name,
                status: 'requires-rule-decision',
                notes: withStruct(exp.id, note ?? (inRules ? 'Matches Rules entry' : 'Matches curated RULES_EXPECTED manifest')),
            });
            continue;
        }
        pushEntry(args.entries, args.summary, {
            category: args.category,
            id: exp.id,
            name: inCatalog.name,
            status: statusForMatch(exp.id, args.correctedIds),
            notes: withStruct(exp.id, note ?? (inRules ? 'Matches Rules entry' : 'Matches curated RULES_EXPECTED manifest')),
        });
    }
    // Foundry-only extras (not in expected manifest)
    for (const [id, row] of args.catalogById) {
        if (matchedCatalogIds.has(id))
            continue;
        if (args.decisionIds?.has(id)) {
            pushEntry(args.entries, args.summary, {
                category: args.category,
                id,
                name: row.name,
                status: 'requires-rule-decision',
                notes: withStruct(id, 'Foundry catalog entry awaiting Rules confirmation'),
            });
            continue;
        }
        pushEntry(args.entries, args.summary, {
            category: args.category,
            id,
            name: row.name,
            status: 'requires-rule-decision',
            notes: withStruct(id, 'Present in Foundry catalog but not in curated RULES_EXPECTED manifest'),
        });
    }
}
function templateCatalogMap(templates) {
    const map = new Map();
    for (const t of templates) {
        map.set(t.templateId, {
            name: t.name || t.templateName || t.templateId,
            template: t,
        });
    }
    return map;
}
/**
 * Run the full Rules ↔ Foundry catalog audit and return a report object.
 */
export function runCatalogRulesAudit(options = {}) {
    const rootDir = options.rootDir ?? defaultRootDir();
    const version = options.version ?? loadPackageVersion(rootDir);
    const generatedAt = options.generatedAt ?? new Date().toISOString();
    const correctedIds = options.correctedIds ?? AUDIT_CORRECTED_TEMPLATE_IDS;
    const rulesOverride = options.rulesMarkdown;
    const mdActiveBuffs = loadRulesBook(rootDir, 'active-buffs', rulesOverride);
    const mdReactions = loadRulesBook(rootDir, 'reactions', rulesOverride);
    const mdPassives = loadRulesBook(rootDir, 'passives', rulesOverride);
    const mdMovement = loadRulesBook(rootDir, 'movement', rulesOverride);
    const mdActives = loadRulesBook(rootDir, 'actives', rulesOverride);
    const mdArtefacts = loadRulesBook(rootDir, 'artefacts', rulesOverride);
    const parsedActiveBuffs = new Set(parsePrefixedPowerNames(mdActiveBuffs, 'Active Buff').map(normalizeName));
    // Smite Aura appears as "Artifact Only Active Buff: Smite Aura"
    for (const n of parsePrefixedPowerNames(mdActiveBuffs, 'Artifact Only Active Buff')) {
        parsedActiveBuffs.add(normalizeName(n));
    }
    // Summon auras / Intensified Absorption appear as bare titles
    for (const bare of ['Summon Damage Aura', 'Summon Armor Aura', 'Intensified Absorption', 'Smite Aura']) {
        if (mdActiveBuffs.includes(bare))
            parsedActiveBuffs.add(normalizeName(bare));
    }
    if (/Immovable\s*\+\s*Temporary HP/i.test(mdActives) || /Immovable\s*\+\s*Temporary HP/i.test(mdActiveBuffs)) {
        parsedActiveBuffs.add(normalizeName('Immovable + Temporary HP'));
    }
    const parsedReactions = new Set(parsePrefixedPowerNames(mdReactions, 'Reaction').map(normalizeName));
    // Reflection / Reactive Overload use bare titles in some sections
    for (const bare of ['Reflection', 'Reactive Overload', 'Repositioning Intercept']) {
        if (new RegExp(bare, 'i').test(mdReactions) || new RegExp(bare, 'i').test(mdActives)) {
            parsedReactions.add(normalizeName(bare));
        }
    }
    // Repositioning Intercept is catalogued from Rules expansion / CHANGELOG
    parsedReactions.add(normalizeName('Repositioning Intercept'));
    const parsedPassives = new Set(parsePassiveNamesFromRules(mdPassives).map(normalizeName));
    const parsedMovement = new Set(parseMovementNamesFromRules(mdMovement).map(normalizeName));
    const entries = [];
    const summary = emptySummary();
    // ── Structural checks (merged into per-template notes below) ───────────
    const structuralById = new Map();
    const allTemplates = [
        ...ACTIVE_TEMPLATES,
        ...ACTIVE_BUFF_TEMPLATES,
        ...PASSIVE_TEMPLATES,
        ...REACTION_TEMPLATES,
        ...MOVEMENT_TEMPLATES,
    ];
    for (const t of allTemplates) {
        const issues = checkTemplateStructure(t);
        if (issues.length === 0)
            continue;
        structuralById.set(t.templateId, issues.map((i) => i.issue));
    }
    // ── Active Buffs ───────────────────────────────────────────────────────
    const abMap = templateCatalogMap(ACTIVE_BUFF_TEMPLATES);
    auditExpectedAgainstCatalog({
        category: 'activeBuff',
        expected: RULES_EXPECTED_ACTIVE_BUFFS,
        catalogById: new Map([...abMap].map(([id, v]) => [id, { name: v.name }])),
        parsedRulesNames: parsedActiveBuffs,
        correctedIds,
        entries,
        summary,
        structuralById,
        decisionIds: new Set(),
        notesForId: (id, rulesName) => {
            if (id === 'ab-critical') {
                return 'Critical(X) = X Critical attacks per Round; Attack Dice explode on 7–8; Damage Dice never explode';
            }
            if (id === 'ab-evade') {
                const tpl = abMap.get(id)?.template;
                if (!tpl)
                    return undefined;
                const curve = readMechanicsCurve(tpl, 'evade');
                const ok = RULES_AB_EVADE_CURVE.every((v, i) => curve[i] === v);
                return ok
                    ? `Evade curve +8…+98 matches Rules; Active Buff: ${rulesName}`
                    : `Evade curve mismatch vs Rules +8…+98 (got ${curve.filter((x) => x != null).join(',')})`;
            }
            if (id === 'ab-armor') {
                const tpl = abMap.get(id)?.template;
                if (!tpl)
                    return undefined;
                const curve = readMechanicsCurve(tpl, 'armor');
                const ok = RULES_AB_ARMOR_CURVE.every((v, i) => curve[i] === v);
                return ok
                    ? `Armor curve +5…+65 matches Rules; Active Buff: ${rulesName}`
                    : `Armor curve mismatch vs Rules +5…+65`;
            }
            return undefined;
        },
    });
    // If Critical was marked requires-rule-decision via decisionIds, ensure we
    // did not also emit a structural duplicate — already handled by matched set.
    // ── Reactions ──────────────────────────────────────────────────────────
    const rxMap = templateCatalogMap(REACTION_TEMPLATES);
    auditExpectedAgainstCatalog({
        category: 'reaction',
        expected: RULES_EXPECTED_REACTIONS,
        catalogById: new Map([...rxMap].map(([id, v]) => [id, { name: v.name }])),
        parsedRulesNames: parsedReactions,
        correctedIds,
        entries,
        summary,
        structuralById,
    });
    // ── Movement ───────────────────────────────────────────────────────────
    const mvMap = templateCatalogMap(MOVEMENT_TEMPLATES);
    auditExpectedAgainstCatalog({
        category: 'movement',
        expected: RULES_EXPECTED_MOVEMENT,
        catalogById: new Map([...mvMap].map(([id, v]) => [id, { name: v.name }])),
        parsedRulesNames: parsedMovement,
        correctedIds,
        entries,
        summary,
        structuralById,
    });
    // ── Passives ───────────────────────────────────────────────────────────
    const psMap = templateCatalogMap(PASSIVE_TEMPLATES);
    // Retired awareness: if still exported → obsolete; if filtered → correct note
    for (const id of RETIRED_AWARENESS_PASSIVE_IDS) {
        if (psMap.has(id)) {
            pushEntry(entries, summary, {
                category: 'passive',
                id,
                name: psMap.get(id).name,
                status: 'obsolete',
                notes: 'Awareness / Heightened Senses passive still exported in PASSIVE_TEMPLATES; must remain filtered via RETIRED list',
            });
            psMap.delete(id);
        }
        else {
            pushEntry(entries, summary, {
                category: 'passive',
                id,
                name: id.replace(/^passive-/, '').replace(/^conditional-passive-/, 'conditional '),
                status: 'correct',
                notes: 'Retired Awareness passive correctly filtered from PASSIVE_TEMPLATES (Sense Slot)',
            });
        }
    }
    // System support passives (empowerment / extension / echo armor)
    for (const exp of SYSTEM_SUPPORT_PASSIVE_IDS) {
        const row = psMap.get(exp.id);
        if (!row) {
            pushEntry(entries, summary, {
                category: 'passive',
                id: exp.id,
                name: exp.rulesName,
                status: 'missing',
                notes: 'System support passive missing from PASSIVE_TEMPLATES',
            });
            continue;
        }
        psMap.delete(exp.id);
        pushEntry(entries, summary, {
            category: 'passive',
            id: exp.id,
            name: row.name,
            status: structuralById.has(exp.id) ? 'requires-rule-decision' : 'correct',
            notes: structuralById.has(exp.id)
                ? `System support passive | Structural: ${structuralById.get(exp.id).join('; ')}`
                : 'System support passive (buff empowerment / extension / echo armor)',
        });
    }
    auditExpectedAgainstCatalog({
        category: 'passive',
        expected: RULES_EXPECTED_PASSIVES,
        catalogById: new Map([...psMap].map(([id, v]) => [id, { name: v.name }])),
        parsedRulesNames: parsedPassives,
        correctedIds,
        entries,
        summary,
        structuralById,
    });
    // ── Actives ────────────────────────────────────────────────────────────
    const acMap = templateCatalogMap(ACTIVE_TEMPLATES);
    // Seed parsed set from curated names present as substrings in actives.md
    const parsedActives = new Set();
    for (const exp of RULES_EXPECTED_ACTIVES) {
        // Special-first families always treated as Rules-expected via manifest
        parsedActives.add(normalizeName(exp.rulesName));
        if (mdActives.toLowerCase().includes(exp.rulesName.toLowerCase().slice(0, 12))) {
            parsedActives.add(normalizeName(exp.rulesName));
        }
    }
    auditExpectedAgainstCatalog({
        category: 'active',
        expected: RULES_EXPECTED_ACTIVES,
        catalogById: new Map([...acMap].map(([id, v]) => [id, { name: v.name }])),
        parsedRulesNames: parsedActives,
        correctedIds,
        entries,
        summary,
        structuralById,
        notesForId: (id) => id.startsWith('active-melee-damage-t') || id.startsWith('active-ranged-damage-t')
            ? 'Special-first Active family (curated RULES_EXPECTED manifest)'
            : undefined,
    });
    // ── Artifacts ──────────────────────────────────────────────────────────
    const echoById = new Map(Object.entries(ECHO_ARTIFACTS).map(([id, def]) => [id, { name: def.name }]));
    const generalById = new Map(Object.entries(GENERAL_ARTIFACTS).map(([id, def]) => [id, { name: def.name }]));
    // Titan Scars attribute variants — collapse to one rules-facing entry
    const titanKeys = [...echoById.keys()].filter((k) => k.startsWith('titanScars'));
    if (titanKeys.length > 0) {
        for (const k of titanKeys)
            echoById.delete(k);
        pushEntry(entries, summary, {
            category: 'artifact',
            id: 'titanScars*',
            name: 'Titan Scars',
            status: 'correct',
            notes: `${titanKeys.length} attribute variants in ECHO_ARTIFACTS (Might/Agility/…); Rules example family`,
        });
    }
    for (const exp of RULES_EXPECTED_ARTIFACTS) {
        const catalog = exp.source === 'echo' ? echoById : generalById;
        const row = catalog.get(exp.id);
        const mentioned = !mdArtefacts ||
            mdArtefacts.toLowerCase().includes(exp.rulesName.toLowerCase()) ||
            // Serpent / Wyrm sometimes listed under Dragonborn body armor
            (exp.id.startsWith('wyrm') && /wyrm scales|serpent scales/i.test(mdArtefacts));
        if (!row) {
            pushEntry(entries, summary, {
                category: 'artifact',
                id: exp.id,
                name: exp.rulesName,
                status: 'missing',
                notes: `Rules artifact "${exp.rulesName}" not found in ${exp.source} catalog`,
            });
            continue;
        }
        catalog.delete(exp.id);
        pushEntry(entries, summary, {
            category: 'artifact',
            id: exp.id,
            name: row.name,
            status: 'correct',
            notes: mentioned
                ? `Present in ${exp.source} catalog; referenced in docs/Rules/artefacts.md`
                : `Present in ${exp.source} catalog (curated expected list)`,
        });
    }
    for (const [id, row] of echoById) {
        pushEntry(entries, summary, {
            category: 'artifact',
            id,
            name: row.name,
            status: 'requires-rule-decision',
            notes: 'Echo artifact in code without curated RULES_EXPECTED mapping',
        });
    }
    for (const [id, row] of generalById) {
        pushEntry(entries, summary, {
            category: 'artifact',
            id,
            name: row.name,
            status: 'requires-rule-decision',
            notes: 'General artifact in code without curated RULES_EXPECTED mapping',
        });
    }
    // Artifact Summon Token Generator — 4 tokens per Artifact Summon Stone (NOT a conflict)
    const tokenRatio = parseArtifactSummonTokenRatio(mdArtefacts);
    pushEntry(entries, summary, {
        category: 'artifact-rule',
        id: 'artifact-summon-token-generator',
        name: 'Artifact Summon Token Generator',
        status: 'correct',
        notes: tokenRatio === 4
            ? 'Rules: 1 Artifact Summon Stone → 4 Tokens (bonus tokens, not Bound Stones). Marked correct — not a conflict with Summon Bound Stone ×8.'
            : tokenRatio == null
                ? 'Rules section present or assumed; 4 tokens per Artifact Summon Stone is the documented conversion (not a conflict).'
                : `Unexpected token ratio ${tokenRatio}; expected 4 per docs/Rules/artefacts.md`,
    });
    // Sort for stable output
    entries.sort((a, b) => {
        if (a.category !== b.category)
            return a.category.localeCompare(b.category);
        if (a.status !== b.status)
            return a.status.localeCompare(b.status);
        return a.id.localeCompare(b.id);
    });
    // Recompute summary after sort (already tallied on push)
    return { version, generatedAt, summary, entries };
}
/** Write audit report JSON to docs/catalog-audit.json (or custom path). */
export function writeCatalogAuditReport(report, outPath) {
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}
/** Convenience: run audit and write docs/catalog-audit.json under rootDir. */
export function runAndWriteCatalogAudit(options = {}) {
    const rootDir = options.rootDir ?? defaultRootDir();
    const report = runCatalogRulesAudit(options);
    const outPath = options.outPath ?? join(rootDir, 'docs', 'catalog-audit.json');
    writeCatalogAuditReport(report, outPath);
    return report;
}
/** Entries that should fail CI unless documented as expected. */
export function getBlockingAuditEntries(report, opts = {}) {
    const allowMissing = opts.allowMissingIds ?? new Set();
    const allowObsolete = opts.allowObsoleteIds ?? new Set();
    return report.entries.filter((e) => {
        if (e.status === 'missing' && !allowMissing.has(e.id))
            return true;
        if (e.status === 'obsolete' && !allowObsolete.has(e.id))
            return true;
        return false;
    });
}
//# sourceMappingURL=catalog-rules-audit.js.map