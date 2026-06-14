/**
 * Character Print / Export
 *
 * Builds a flat, print-friendly context from a `character` actor and renders it
 * into the 3-page printable sheet (`templates/actor/character-print.hbs`). The
 * rendered HTML is opened in a new window that links the print stylesheet and
 * triggers `window.print()` so the user can save it as a PDF.
 *
 * Power blocks show each power as a "tile" (Plättchen): a phase label
 * (Movement / Active / Reaction) plus an empty check-box meaning
 * "may be used once per round".
 */
import { SKILLS } from '../utils/skills.js';
import { resolvePowerCategoryFromItem } from '../utils/power-catalog.js';
const PRINT_TEMPLATE = 'systems/mastery-system/templates/actor/character-print.hbs';
const PRINT_CSS = 'systems/mastery-system/styles/character-print.css';
const ATTR_ORDER = [
    'might',
    'agility',
    'vitality',
    'intellect',
    'resolve',
    'influence',
    'wits'
];
/** Stone-threshold ladder printed next to every ability (one cell per 8 points). */
const ABILITY_LADDER = [8, 16, 24, 32, 40, 48, 56, 64, 72, 80];
/** Pip boxes drawn per skill row. */
const SKILL_PIP_COUNT = 6;
/** Skill groups in the order they appear on the printed sheet. */
const SKILL_GROUPS = [
    {
        key: 'martial',
        label: 'Martial Skills',
        skills: ['combatReflexes', 'defensiveCombat', 'handToHand', 'meleeWeapons', 'rangedWeapons']
    },
    {
        key: 'physical',
        label: 'Physical Skills',
        skills: ['athletics', 'acrobatics', 'stealth', 'concealment', 'ride', 'sleightOfHand']
    },
    {
        key: 'knowledge',
        label: 'Knowledge & Craft Skills',
        skills: ['lore', 'alchemy', 'crafting', 'engineering', 'medicine', 'navigation', 'occultism']
    },
    {
        key: 'survival',
        label: 'Survival Skills',
        skills: ['perception', 'survival', 'animalHandling', 'tracking', 'herbalism', 'weatherSense']
    },
    {
        key: 'social',
        label: 'Social Skills',
        skills: [
            'persuasion',
            'deception',
            'intimidation',
            'leadership',
            'performance',
            'empathy',
            'negotiation',
            'seduction',
            'investigation',
            'etiquette',
            'streetwise'
        ]
    }
];
function cap(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
function num(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}
function formatAttrs(attrs) {
    if (!attrs || attrs.length === 0)
        return '';
    return attrs.map((a) => cap(a)).join(' / ');
}
function makePips(rank) {
    const r = Math.max(0, Math.floor(rank));
    const out = [];
    for (let i = 0; i < SKILL_PIP_COUNT; i++)
        out.push({ filled: i < r });
    return out;
}
function powerPhaseLabel(category) {
    switch (category) {
        case 'movement':
            return 'Movement';
        case 'active':
        case 'activeBuff':
            return 'Active';
        case 'reaction':
            return 'Reaction';
        case 'passive':
            return 'Passive';
        default:
            return '';
    }
}
function stripHtml(value) {
    const s = String(value ?? '');
    if (!s)
        return '';
    return s
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\s+/g, ' ')
        .trim();
}
/** Pad an array of card entries with empty placeholders up to `min` slots. */
function padCards(cards, min) {
    const out = [...cards];
    while (out.length < min)
        out.push({ empty: true });
    return out;
}
function resolvePlayerName(actor) {
    try {
        const users = game?.users;
        if (!users?.filter)
            return '';
        const owners = users.filter((u) => !u.isGM && actor?.testUserPermission?.(u, 'OWNER'));
        return owners?.[0]?.name || '';
    }
    catch {
        return '';
    }
}
function resolveEchoName(actor, system) {
    const bioEcho = String(system?.bio?.echo ?? '').trim();
    if (bioEcho)
        return bioEcho;
    const key = String(system?.echo?.key ?? '').trim();
    return key;
}
/**
 * Build the flat data object consumed by `character-print.hbs`.
 */
export function buildCharacterPrintContext(actor) {
    const system = actor?.system ?? {};
    const masteryRank = num(system?.mastery?.rank, 2);
    // ── Abilities ─────────────────────────────────────────────────────────
    const abilities = ATTR_ORDER.map((key) => {
        const value = num(system?.attributes?.[key]?.value, 0);
        const stoneCapacity = Math.floor(value / 8);
        return {
            key,
            label: cap(key).toUpperCase(),
            value,
            stoneCapacity,
            ladder: ABILITY_LADDER.map((n) => ({ n, filled: value >= n }))
        };
    });
    // ── Stone Powers (per-attribute capacity overview) ────────────────────
    const stonePools = ATTR_ORDER.map((key) => {
        const pool = system?.stonePools?.[key] ?? {};
        const max = num(pool?.max, Math.floor(num(system?.attributes?.[key]?.value, 0) / 8));
        return { key, label: cap(key).toUpperCase(), max };
    });
    // ── Saving throws ─────────────────────────────────────────────────────
    const saves = system?.savingThrows ?? {};
    const savingThrows = [
        { label: 'MIND', sub: 'Intellect / Wits', values: [num(saves?.intellect), num(saves?.wits)] },
        { label: 'BODY', sub: 'Might / Agility', values: [num(saves?.might), num(saves?.agility)] },
        { label: 'SPIRIT', sub: 'Resolve / Influence', values: [num(saves?.resolve), num(saves?.influence)] }
    ];
    const vitalitySave = num(saves?.vitality);
    // ── Combat / defenses ─────────────────────────────────────────────────
    const combat = system?.combat ?? {};
    const defense = {
        evadeBase: masteryRank * 4,
        evadeTotal: num(combat?.evadeTotal, masteryRank * 4),
        armorTotal: num(combat?.armorTotal),
        initiative: num(combat?.initiative),
        initiativeEquipment: num(combat?.initiativeEquipmentTotal),
        armorName: String(combat?.armorName ?? ''),
        armorValue: num(combat?.armor),
        shieldName: String(combat?.shieldName ?? ''),
        shieldValue: num(combat?.shield)
    };
    // ── Health ────────────────────────────────────────────────────────────
    const healthBars = Array.isArray(system?.health?.bars)
        ? system.health.bars.map((b) => ({
            name: String(b?.name ?? ''),
            max: num(b?.max),
            current: num(b?.current),
            penalty: num(b?.penalty)
        }))
        : [];
    const tempHP = num(system?.health?.tempHP);
    // ── Stress (supports both bar-based and scalar models) ────────────────
    const stressBars = Array.isArray(system?.stress?.bars)
        ? system.stress.bars.map((b) => ({
            name: String(b?.name ?? ''),
            max: num(b?.max),
            current: num(b?.current)
        }))
        : [];
    const stress = {
        current: num(system?.stress?.current),
        maximum: num(system?.stress?.maximum)
    };
    // ── Weapons ───────────────────────────────────────────────────────────
    const allItems = actor?.items ? Array.from(actor.items.values?.() ?? actor.items) : [];
    const weaponItems = allItems.filter((i) => i?.type === 'weapon');
    const weapons = padCards(weaponItems.map((w) => {
        const sys = w?.system ?? {};
        const specials = Array.isArray(sys?.specials)
            ? sys.specials
                .map((s) => (typeof s === 'string' ? s : s?.key ?? ''))
                .filter(Boolean)
                .join(', ')
            : '';
        return {
            name: String(w?.name ?? ''),
            damage: String(sys?.damage ?? sys?.baseDamage ?? ''),
            specials
        };
    }), 4);
    // ── Powers (split into active tiles and passive tiles) ────────────────
    const powerItems = allItems.filter((i) => i?.type === 'power');
    const activePowers = [];
    const passivePowers = [];
    for (const p of powerItems) {
        const sys = p?.system ?? {};
        const category = resolvePowerCategoryFromItem(p);
        const entry = {
            name: String(p?.name ?? ''),
            effect: stripHtml(sys?.effect || sys?.description || ''),
            phase: powerPhaseLabel(category),
            stones: num(sys?.cost?.stones),
            rank: num(sys?.level ?? sys?.rank, 1)
        };
        if (category === 'passive')
            passivePowers.push(entry);
        else
            activePowers.push(entry);
    }
    const martialPowers = padCards(activePowers, 6);
    const passivePowerCards = padCards(passivePowers, 6);
    // ── Skills ────────────────────────────────────────────────────────────
    const skillsByGroup = SKILL_GROUPS.map((group) => ({
        key: group.key,
        label: group.label,
        skills: group.skills
            .filter((sk) => !!SKILLS[sk])
            .map((sk) => {
            const def = SKILLS[sk];
            const rank = num(system?.skills?.[sk]);
            return {
                key: sk,
                name: def.name,
                attrs: formatAttrs(def.attributes),
                rank,
                pips: makePips(rank)
            };
        })
    }));
    // ── Disadvantages ─────────────────────────────────────────────────────
    const disadvantages = Array.isArray(system?.disadvantages)
        ? system.disadvantages.map((d) => ({
            label: String(d?.label ?? d?.name ?? ''),
            points: num(d?.points)
        }))
        : [];
    const disadvantagePoints = disadvantages.reduce((sum, d) => sum + num(d.points), 0);
    // ── Familiars ─────────────────────────────────────────────────────────
    const familiars = Array.isArray(system?.familiars)
        ? system.familiars
            .map((f) => String(f?.name ?? f?.bio?.name ?? ''))
            .filter(Boolean)
        : [];
    // ── Equipment (gear names; the grid itself stays blank for table play) ─
    const gearItems = allItems.filter((i) => i?.type === 'gear');
    const gear = gearItems.map((g) => ({
        name: String(g?.name ?? ''),
        quantity: num(g?.system?.quantity, 1)
    }));
    return {
        name: String(actor?.name ?? ''),
        player: resolvePlayerName(actor),
        echo: resolveEchoName(actor, system),
        masteryRank,
        faithFractures: {
            current: num(system?.faithFractures?.current),
            maximum: num(system?.faithFractures?.maximum, 8)
        },
        abilities,
        stonePools,
        savingThrows,
        vitalitySave,
        defense,
        healthBars,
        tempHP,
        stressBars,
        stress,
        weapons,
        martialPowers,
        passivePowerCards,
        skillsByGroup,
        disadvantages,
        disadvantagePoints,
        familiars,
        gear
    };
}
/** Resolve a Foundry-routed URL (respects a configured route prefix). */
function routed(path) {
    try {
        const getRoute = foundry?.utils?.getRoute;
        if (typeof getRoute === 'function')
            return getRoute(path);
    }
    catch {
        /* ignore */
    }
    return `${window.location.origin}/${path.replace(/^\//, '')}`;
}
/**
 * Render the printable sheet for `actor` and open it in a new window that
 * triggers the browser print dialog (save as PDF).
 */
export async function openCharacterPrintSheet(actor) {
    if (!actor || actor.type !== 'character') {
        ui?.notifications?.warn('Druck-Export ist nur für Charaktere verfügbar.');
        return;
    }
    let body = '';
    try {
        const context = buildCharacterPrintContext(actor);
        body = await foundry.applications.handlebars.renderTemplate(PRINT_TEMPLATE, context);
    }
    catch (error) {
        console.error('Mastery System | Failed to build character print sheet', error);
        ui?.notifications?.error('Charakterbogen konnte nicht erstellt werden.');
        return;
    }
    const win = window.open('', '_blank', 'width=900,height=1200');
    if (!win) {
        ui?.notifications?.warn('Druckfenster wurde blockiert. Bitte Pop-ups für Foundry erlauben.');
        return;
    }
    const cssHref = routed(PRINT_CSS);
    const title = String(actor?.name ?? 'Character');
    const doc = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <link rel="stylesheet" href="${cssHref}" />
</head>
<body class="mastery-print">
${body}
<script>
  window.addEventListener('load', function () {
    setTimeout(function () {
      window.focus();
      window.print();
    }, 350);
  });
</script>
</body>
</html>`;
    win.document.open();
    win.document.write(doc);
    win.document.close();
}
//# sourceMappingURL=character-print.js.map