/**
 * Character Print / Export
 *
 * Builds a flat, print-friendly context from a `character` actor and renders it
 * into the 4-page printable sheet (`templates/actor/character-print.hbs`); page
 * 4 is a purely technical, fluff-free summary of powers + weapon attacks +
 * artifacts and the Stone Powers that active artifacts support / discount. The
 * rendered HTML is opened in a new window that links the print stylesheet and
 * triggers `window.print()` so the user can save it as a PDF.
 *
 * Power blocks show each power as a "tile" (Plättchen): a phase label
 * (Movement / Active / Reaction) plus an empty check-box meaning
 * "may be used once per round".
 */
import { SKILLS } from '../utils/skills.js';
import { resolvePowerCategoryFromItem } from '../utils/power-catalog.js';
import { getArtifactStoneFunctionStatus } from '../utils/artifact-stone-functions.js';
import { countArtifactActivationStones, artifactBindingNamesByAttr } from '../utils/artifact-stone-bound.js';
import { isArtifactMechanicallyActive } from '../utils/artifact-actor-rules.js';
import { visibleAbilityRows } from '../utils/artifact-visible-abilities.js';
import { formatEffectReference } from '../utils/special-effects.js';
import { STONE_POWERS_BY_ATTRIBUTE } from '../stones/stone-powers.js';
import { getMinorExpressionDefinition, tierBodyForExpression } from '../utils/minor-expressions.js';
import { getEchoCard } from '../utils/echos/index.js';
import { parseInventorySize, fitsInGrid, rectsOverlap, findFirstFit, } from '../utils/inventory-grid.js';
import { normalizeSlotKey } from '../utils/equip-slots.js';
import { isEchoArtifactInventoryHidden } from '../utils/echo-artifact-equip.js';
import { isLegacyUnarmedItem } from '../utils/unarmed-fallback.js';
import { formatArtifactWeaponRangeDisplay, resolveArtifactWeaponKind, artifactSystemHasSpellFocus, spellFocusDiceFromSystem, } from '../utils/artifact-rules.js';
import { deriveArtifactWeaponDamage } from '../utils/artifact-base-derive.js';
import { getDisadvantageDefinition } from '../system/disadvantages.js';
import { getPowerDefinitionRank } from '../utils/power-definition-rank.js';
import { buildPrintCombatPreview, buildPrintCombatPreviewForArtifactRow, buildArtifactRowSpellPrintMeta, buildSpellPrintMeta } from './character-print-combat.js';
import { buildCombatSensesDisplayContext } from '../combat/combat-sense-collection.js';
/** Human-readable label per Stone Function kind (technical summary). */
const STONE_FN_KIND_LABEL = {
    stonePool: 'Stone Pool',
    stoneBattery: 'Stone Battery',
    stoneRefresh: 'Stone Refresh',
    stonePowerSupport: 'Power Support',
};
/** Stone Power groups in print order (General first, then attribute pools). */
const STONE_GROUPS = [
    { key: 'generic', label: 'General' },
    { key: 'might', label: 'Might' },
    { key: 'agility', label: 'Agility' },
    { key: 'vitality', label: 'Vitality' },
    { key: 'intellect', label: 'Intellect' },
    { key: 'resolve', label: 'Resolve' },
    { key: 'influence', label: 'Influence' },
    { key: 'wits', label: 'Wits' },
];
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
/** Health wound-track pool penalties (dice pool at each penalty tier). */
const HEALTH_POOL_TIERS = [
    { label: '10%', fraction: 0.1 },
    { label: '20%', fraction: 0.2 },
    { label: '40%', fraction: 0.4 },
    { label: '50%', fraction: 0.5 },
];
function poolAtHealthFraction(pool, fraction) {
    if (pool <= 0)
        return 0;
    // −40% matches the engine's flat penalty (pool − floor(pool×f)); other tiers
    // use the remaining-pool display the player expects (16 → 14, 12, …).
    if (fraction === 0.4) {
        return Math.max(1, pool - Math.floor(pool * fraction));
    }
    return Math.max(1, Math.floor(pool * (1 - fraction)));
}
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
function powerPhaseLabel(category) {
    switch (category) {
        case 'movement':
            return 'Movement';
        case 'active':
            return 'Active';
        case 'activeBuff':
            return 'Active Buff';
        case 'reaction':
            return 'Reaction';
        case 'passive':
            return 'Passive';
        default:
            return '';
    }
}
/** Sort order for the Martial/Spell/Form list: Active, Active Buff, Reaction, … */
function powerSortRank(label) {
    const c = String(label || '').toLowerCase();
    if (c.includes('buff'))
        return 1;
    if (c.includes('reaction'))
        return 2;
    if (c.includes('movement'))
        return 3;
    if (c.includes('ultimate'))
        return 4;
    return 0; // active / everything else first
}
function phaseCssClass(phase) {
    const p = String(phase || '').toLowerCase();
    if (p.includes('buff'))
        return 'Buff';
    if (p.includes('reaction'))
        return 'Reaction';
    if (p.includes('movement'))
        return 'Movement';
    if (p.includes('passive'))
        return 'Passive';
    return 'Active';
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
        // Strip inline Markdown emphasis markers (effect text is authored with
        // **bold** / *italic*); the print layout is plain text.
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/\s+/g, ' ')
        .trim();
}
/**
 * Player-facing power name: drop the internal "— Tier N" tag and, for damage
 * actives with a chosen Special, render it as "Base — Special(X)" where X is
 * the Special's value resolved from the power's level table / catalog.
 */
function prettyPowerName(item, rank) {
    const sys = item?.system ?? {};
    const raw = String(item?.name ?? '').trim();
    const key = sys?.chosenSpecial?.key ? String(sys.chosenSpecial.key) : '';
    if (!key) {
        return raw.replace(/\s*[—-]\s*Tier\s*\d+.*$/i, '').trim() || raw;
    }
    const base = raw.split(/\s*[—-]\s*Tier\b/i)[0].trim() || raw;
    const levels = (sys?.levels ?? {});
    const findRank = (rw) => {
        const sp = Array.isArray(rw?.specials)
            ? rw.specials.find((s) => String(s?.key) === key)
            : null;
        return sp && typeof sp.rank === 'number' ? sp.rank : undefined;
    };
    let value = findRank(levels[String(rank)]);
    for (let i = rank; value === undefined && i >= 1; i--)
        value = findRank(levels[String(i)]);
    if (value === undefined) {
        for (const k of Object.keys(levels)) {
            const v = findRank(levels[k]);
            if (v !== undefined) {
                value = v;
                break;
            }
        }
    }
    const special = formatEffectReference({ specialId: key, value });
    return `${base} — ${special}`;
}
/**
 * Effect text for a power's CURRENT rank.
 *
 * Power items only refresh `system.level`/`system.rank` on level-up — the flat
 * `system.effect` string stays frozen at the rank the item was created with.
 * Read the live row from the per-level table so the printed effect (and its
 * damage dice) always reflects the power's current Stufe.
 */
function powerEffectForRank(sys, level) {
    const levels = sys?.levels;
    if (levels && typeof levels === 'object' && !Array.isArray(levels)) {
        const key = String(getPowerDefinitionRank(level, levels));
        const text = levels[key]?.effect?.text;
        if (typeof text === 'string' && text.trim())
            return text;
    }
    return String(sys?.effect || sys?.description || '');
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
/** Inventory grid dimensions on the printed sheet (mirrors the live sheet). */
const PRINT_GRID_COLS = 24;
const PRINT_GRID_ROWS = 9;
/**
 * Resolve an item image path to an absolute URL the standalone print window can
 * load (the window is a blank `about:` document, so root-relative paths break).
 */
function absImg(img) {
    const s = String(img ?? '').trim();
    if (!s)
        return '';
    if (/^(https?:|data:)/i.test(s))
        return s;
    const r = routed(s);
    if (/^https?:/i.test(r))
        return r;
    return `${window.location.origin}/${String(r).replace(/^\//, '')}`;
}
/** Read the `mastery-system.equipment` flag from an embedded item. */
function equipmentFlag(item) {
    return (item?.getFlag?.('mastery-system', 'equipment') ||
        item?.flags?.['mastery-system']?.equipment ||
        {});
}
/**
 * Build the printable equipment layout: the equipped paperdoll slots plus the
 * carry inventory laid out on a 24×9 token grid. Mirrors the live sheet's
 * `#prepareEquipmentUi` placement (saved grid flag first, then auto-pack) so the
 * printed grid matches what the player sees in Foundry.
 */
function buildPrintEquipment(allItems) {
    const cols = PRINT_GRID_COLS;
    const rows = PRINT_GRID_ROWS;
    const equipmentItems = allItems.filter((i) => ['weapon', 'armor', 'shield', 'gear', 'artifact'].includes(String(i?.type)) &&
        !isLegacyUnarmedItem(i));
    const tile = (item) => ({
        name: String(item?.name ?? ''),
        img: absImg(item?.img),
        qty: num(item?.system?.quantity, 1),
        isGear: String(item?.type) === 'gear',
    });
    // Split into paperdoll slots vs. carried inventory (same rules as live sheet).
    const slotMap = {};
    const carry = [];
    for (const item of equipmentItems) {
        const flags = equipmentFlag(item);
        const slot = normalizeSlotKey(flags?.slot);
        if (!slot && item?.system?.equipped === true) {
            if (item.type === 'weapon') {
                if (!slotMap['mainhand'])
                    slotMap['mainhand'] = item;
                continue;
            }
            if (item.type === 'shield') {
                if (!slotMap['offhand'])
                    slotMap['offhand'] = item;
                continue;
            }
            if (item.type === 'armor') {
                if (!slotMap['body'])
                    slotMap['body'] = item;
                continue;
            }
        }
        if (slot) {
            if (!slotMap[slot])
                slotMap[slot] = item;
        }
        else if (isEchoArtifactInventoryHidden(item)) {
            continue;
        }
        else {
            carry.push(item);
        }
    }
    // Empty 24×9 cell matrix.
    const cells = [];
    for (let row = 1; row <= rows; row++) {
        for (let col = 1; col <= cols; col++) {
            cells.push({ row, col, item: null, occupied: false, spanW: 1, spanH: 1 });
        }
    }
    const cellIndex = (col, row) => (row - 1) * cols + (col - 1);
    const rects = [];
    const place = (item, x, y, w, h) => {
        rects.push({ x, y, w, h });
        const top = cells[cellIndex(x, y)];
        if (top) {
            top.item = tile(item);
            top.spanW = w;
            top.spanH = h;
        }
        for (let dy = 0; dy < h; dy++) {
            for (let dx = 0; dx < w; dx++) {
                if (dx === 0 && dy === 0)
                    continue;
                const c = cells[cellIndex(x + dx, y + dy)];
                if (c)
                    c.occupied = true;
            }
        }
    };
    // Pass 1: honour saved positions; Pass 2: auto-pack the rest.
    const unplaced = [];
    for (const item of carry) {
        const size = parseInventorySize(item?.system?.inventorySize);
        const w = Math.min(cols, size.w);
        const h = Math.min(rows, size.h);
        const grid = equipmentFlag(item)?.grid;
        if (grid?.x && grid?.y && fitsInGrid(grid.x, grid.y, w, h, cols, rows)) {
            const candidate = { x: grid.x, y: grid.y, w, h };
            if (!rects.some((r) => rectsOverlap(r, candidate))) {
                place(item, grid.x, grid.y, w, h);
                continue;
            }
        }
        unplaced.push(item);
    }
    for (const item of unplaced) {
        const size = parseInventorySize(item?.system?.inventorySize);
        const w = Math.min(cols, size.w);
        const h = Math.min(rows, size.h);
        const pos = findFirstFit(rects, w, h, cols, rows);
        if (!pos)
            continue;
        place(item, pos.x, pos.y, w, h);
    }
    const slotDefs = [
        { key: 'mainhand', label: 'Main Hand' },
        { key: 'offhand', label: 'Off Hand' },
        { key: 'body', label: 'Body' },
        { key: 'head', label: 'Head' },
        { key: 'feet', label: 'Feet' },
        { key: 'amulet', label: 'Amulet' },
        { key: 'ring', label: 'Ring' },
    ];
    const slots = slotDefs.map((d) => {
        const item = slotMap[d.key] || null;
        return { key: d.key, label: d.label, item: item ? tile(item) : null };
    });
    return {
        cols,
        rows,
        cells,
        slots,
        hasItems: carry.length > 0 || Object.keys(slotMap).length > 0,
    };
}
/**
 * Build the flat data object consumed by `character-print.hbs`.
 */
export function buildCharacterPrintContext(actor) {
    const system = actor?.system ?? {};
    const masteryRank = num(system?.mastery?.rank, 2);
    // Stones bound into artifacts (blocked) — used to show real availability.
    const bindingNamesByAttr = artifactBindingNamesByAttr(actor);
    // ── Abilities ─────────────────────────────────────────────────────────
    const abilities = ATTR_ORDER.map((key) => {
        const value = num(system?.attributes?.[key]?.value, 0);
        const stoneCapacity = num(system?.stonePools?.[key]?.max, Math.floor(value / 8));
        const bound = countArtifactActivationStones(actor, key);
        const stoneAvailable = Math.max(0, stoneCapacity - bound);
        const blockedBy = bindingNamesByAttr[key] ?? [];
        return {
            key,
            label: cap(key).toUpperCase(),
            value,
            stoneCapacity,
            stoneAvailable,
            blocked: blockedBy.length > 0,
            blockedBy: blockedBy.join(', '),
            slots: Array.from({ length: stoneAvailable }, (_, i) => i + 1),
            ladder: ABILITY_LADDER.map((n) => ({ n, filled: value >= n })),
            poolTiers: HEALTH_POOL_TIERS.map((t) => ({
                label: t.label,
                pool: poolAtHealthFraction(value, t.fraction),
            })),
        };
    });
    // ── Stone Powers (per-attribute capacity overview) ────────────────────
    const stonePools = ATTR_ORDER.map((key) => {
        const max = num(system?.stonePools?.[key]?.max, Math.floor(num(system?.attributes?.[key]?.value, 0) / 8));
        const bound = countArtifactActivationStones(actor, key);
        return { key, label: cap(key).toUpperCase(), max, available: Math.max(0, max - bound) };
    });
    // ── Saving throws ─────────────────────────────────────────────────────
    // Saves are Roll & Keep pools built from attribute pairs (kept at Mastery
    // Rank): Body = max(Might, Agility), Mind = max(Intellect, Wits),
    // Spirit = max(Resolve, Influence). We print both attribute values plus the
    // resolved pool (higher of the pair) "k" Mastery Rank.
    const attrVal = (k) => num(system?.attributes?.[k]?.value, 0);
    const savePool = (a, b) => `${Math.max(attrVal(a), attrVal(b))}d8 k ${masteryRank}`;
    const savingThrows = [
        { label: 'MIND', sub: 'Intellect / Wits', values: [attrVal('intellect'), attrVal('wits')], pool: savePool('intellect', 'wits') },
        { label: 'BODY', sub: 'Might / Agility', values: [attrVal('might'), attrVal('agility')], pool: savePool('might', 'agility') },
        { label: 'SPIRIT', sub: 'Resolve / Influence', values: [attrVal('resolve'), attrVal('influence')], pool: savePool('resolve', 'influence') }
    ];
    const vitalitySave = attrVal('vitality');
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
        shieldValue: num(combat?.shield),
        // Full soak breakdown (Mastery Rank, equipped armor, artifact armor, …)
        // so the printed sheet shows how Total Armor is reached. Drop rows that
        // contribute nothing (not equipped / zero) to keep it readable.
        armorBreakdown: Array.isArray(combat?.armorBreakdownRows)
            ? combat.armorBreakdownRows
                .filter((r) => r && r.value != null && num(r.value) !== 0)
                .map((r) => ({
                label: String(r?.label ?? ''),
                detail: String(r?.detail ?? ''),
                display: String(r?.display ?? r?.value ?? '')
            }))
            : [],
        evadeBreakdown: Array.isArray(combat?.evadeBreakdownRows)
            ? combat.evadeBreakdownRows
                .filter((r) => r && r.value != null && num(r.value) !== 0)
                .map((r) => ({
                label: String(r?.label ?? ''),
                detail: String(r?.detail ?? ''),
                display: String(r?.display ?? r?.value ?? '')
            }))
            : []
    };
    // ── Health ────────────────────────────────────────────────────────────
    // Six-level wound track. Penalties scale as a percentage of the active dice
    // pool: Bruised −10%, Injured −20%, Wounded −40%, Broken −50%, and
    // Incapacitated (the character is down). The penalty label is derived from
    // the stored flat `penalty` value so legacy actors render correctly.
    const healthPenaltyLabel = (penalty) => {
        switch (penalty) {
            case 0: return 'No penalty';
            case -1: return '−10% pool';
            case -2: return '−20% pool';
            case -4: return '−40% pool';
            case -5: return '−50% pool';
            case -6: return 'Out';
            default: return penalty ? `${penalty} dice` : 'No penalty';
        }
    };
    const healthBars = Array.isArray(system?.health?.bars)
        ? system.health.bars.map((b) => {
            const max = num(b?.max);
            const current = num(b?.current);
            return {
                name: String(b?.name ?? ''),
                max,
                current,
                penalty: num(b?.penalty),
                penaltyLabel: healthPenaltyLabel(num(b?.penalty)),
                // Physical checkboxes for the printout — one per box, pre-filled to
                // mirror the actor's current HP in that level.
                boxes: Array.from({ length: Math.max(0, max) }, (_unused, i) => ({ filled: i < current }))
            };
        })
        : [];
    const tempHP = num(system?.health?.tempHP);
    // ── Stress (mirrors Health: named levels with box tracks) ────────────
    // Each stress bar (Healthy / Stressed / Not Well / Breaking) holds
    // Resolve + Intellect boxes and carries no dice penalty. A terminal
    // "Breakdown" level — analogous to Health's Incapacitated — adds a single
    // box that marks mental collapse.
    const stressBars = Array.isArray(system?.stress?.bars)
        ? system.stress.bars.map((b) => {
            const max = num(b?.max);
            const current = num(b?.current);
            return {
                name: String(b?.name ?? ''),
                max,
                current,
                penaltyLabel: 'No penalty',
                boxes: Array.from({ length: Math.max(0, max) }, (_unused, i) => ({ filled: i < current }))
            };
        })
        : [];
    const stressBreakdown = { name: 'Breakdown', boxes: [{ filled: false }] };
    const stress = {
        current: num(system?.stress?.current),
        maximum: num(system?.stress?.maximum)
    };
    // ── Artifact Weapons ──────────────────────────────────────────────────
    // Plain weapons are intentionally omitted; artifact weapons show directly
    // what they do (damage, range, innate abilities, specials).
    const allItems = actor?.items ? Array.from(actor.items.values?.() ?? actor.items) : [];
    const artifactItems = allItems.filter((i) => i?.type === 'artifact');
    function attachBattlePreview(entry, powerItem, slot, artifactRow) {
        let preview = powerItem ? buildPrintCombatPreview(actor, powerItem, allItems, slot) : null;
        if (!preview && artifactRow) {
            preview = buildPrintCombatPreviewForArtifactRow(actor, artifactRow, allItems, slot);
        }
        if (!preview)
            return;
        entry.battleCompact = true;
        if (preview.attackKind)
            entry.attackKind = preview.attackKind;
        if (preview.showAttack && preview.attackLabel)
            entry.attackRoll = preview.attackLabel;
        if (preview.showDamage && preview.damage) {
            entry.rollKind = preview.rollKind ?? 'damage';
            entry.damageRoll = preview.damage;
        }
        if (preview.footnote)
            entry.battleFootnote = preview.footnote;
    }
    function formatWeaponProfile(prof, baseProfile) {
        const kind = resolveArtifactWeaponKind(prof, baseProfile);
        const type = kind === 'ranged' ? 'Ranged' : 'Melee';
        const damage = String(prof?.damage ?? '').trim();
        const innate = Array.isArray(prof?.innateAbilities)
            ? prof.innateAbilities.map((a) => String(a)).filter(Boolean)
            : [];
        const specials = Array.isArray(prof?.specials)
            ? prof.specials
                .map((s) => typeof s === 'string'
                ? s
                : formatEffectReference({ specialId: String(s?.specialId ?? ''), value: s?.value }))
                .filter(Boolean)
            : [];
        const rangeDisplay = formatArtifactWeaponRangeDisplay(prof, baseProfile);
        return { type, damage, range: rangeDisplay.label, tags: [...innate, ...specials].filter(Boolean).join(', ') };
    }
    const artifactWeapons = artifactItems
        .filter((a) => {
        const sys = a?.system ?? {};
        if (sys.artifactWeapon)
            return true;
        const artifactLevel = Math.max(1, Math.min(10, num(sys.currentLevel) || num(sys.level) || 1));
        return deriveArtifactWeaponDamage(sys.baseProfile, artifactLevel) != null;
    })
        .map((a) => {
        const prof = formatWeaponProfile(a.system.artifactWeapon, a.system?.baseProfile);
        // Spell Focus weapons deal no normal weapon damage — their dice boost
        // Spell damage instead. Show that clearly in the Damage column.
        const focusDice = spellFocusDiceFromSystem(a.system);
        const isSpellFocus = artifactSystemHasSpellFocus(a.system);
        // Derive the base+level damage live so the printed value always reflects
        // the current rule (2d8/4d8 base + 1d8/level) even when the item's baked
        // `artifactWeapon.damage` predates the base-profile scaling fix.
        const artifactLevel = Math.max(1, Math.min(10, num(a.system?.currentLevel) || num(a.system?.level) || 1));
        const derivedDamage = deriveArtifactWeaponDamage(a.system?.baseProfile, artifactLevel);
        return {
            name: String(a?.name ?? ''),
            type: prof.type,
            damage: isSpellFocus ? `Spell Focus +${focusDice}d8` : (derivedDamage ?? prof.damage),
            range: prof.range,
            tags: prof.tags,
        };
    });
    // ── Powers (split into active tiles and passive tiles) ────────────────
    const powerItems = allItems.filter((i) => i?.type === 'power');
    const activePowers = [];
    const passivePowers = [];
    for (const p of powerItems) {
        const sys = p?.system ?? {};
        const category = resolvePowerCategoryFromItem(p);
        const rank = num(sys?.level ?? sys?.rank, 1);
        const phase = powerPhaseLabel(category);
        const spellMeta = buildSpellPrintMeta(sys);
        const entry = {
            name: prettyPowerName(p, rank),
            effect: stripHtml(powerEffectForRank(sys, rank)),
            phase,
            phaseClass: phaseCssClass(phase),
            stones: num(sys?.cost?.stones),
            rank,
            sortKey: powerSortRank(category || phase),
            powerItemId: p.id,
            ...spellMeta,
        };
        if (category === 'passive')
            passivePowers.push(entry);
        else
            activePowers.push(entry);
    }
    // Artifact-granted active powers — merged into the Martial/Spell/Form list and
    // flagged as coming from the artifact. Stone-function rows (Support / Stone
    // Pool / Battery / Refresh) belong to the Stone Powers page and passives stay
    // out of the active list.
    for (const a of artifactItems) {
        if (!isArtifactMechanicallyActive(actor, a))
            continue;
        const sys = a?.system ?? {};
        const level = Math.max(1, Math.min(10, num(sys?.currentLevel) || num(sys?.level) || 1));
        const rows = visibleAbilityRows(Array.isArray(sys?.levelProgression) ? sys.levelProgression : [], level);
        for (const row of rows) {
            const type = String(row?.type ?? '').trim();
            const t = type.toLowerCase();
            if (t === 'passive' || /stone|support/.test(t))
                continue;
            const name = String(row?.name ?? '').replace(/\s*[—-]\s*Tier\s*\d+\s*[—-]\s*/i, ' — ').trim();
            const phase = type || 'Active';
            const spellMeta = buildArtifactRowSpellPrintMeta(row);
            activePowers.push({
                name,
                effect: stripHtml(row?.effect),
                phase,
                phaseClass: phaseCssClass(phase),
                stones: 0,
                rank: 1,
                fromArtifact: true,
                source: String(a?.name ?? ''),
                sortKey: powerSortRank(type),
                artifactRow: row,
                hideRank: true,
                ...spellMeta,
            });
        }
    }
    activePowers.sort((a, b) => a.sortKey - b.sortKey);
    const martialPowers = padCards(activePowers, 6);
    const passivePowerCards = padCards(passivePowers, 6);
    // ── Battle Cheat (rotation planner) ───────────────────────────────────
    // Split the active power list into the four combat "slots" so the dedicated
    // landscape page can lay them out as a plannable rotation:
    //   Movement → Active(s) → Active Buffs → Reactions.
    const classifyBattleSlot = (phase) => {
        const c = String(phase || '').toLowerCase();
        if (c.includes('movement'))
            return 'movement';
        if (c.includes('buff'))
            return 'activeBuff';
        if (c.includes('reaction'))
            return 'reaction';
        return 'active';
    };
    const speedMeters = num(combat?.speed);
    const battleMovement = [
        // Every character always has the standard Movement action — seed it so the
        // rotation always begins with a checkable movement step.
        {
            name: 'Move',
            effect: speedMeters ? `Standard movement — ${speedMeters} m.` : 'Standard movement action.',
            phase: 'Movement',
            baseline: true,
        },
    ];
    const battleActive = [];
    const battleBuffs = [];
    const battleReactions = [];
    const powerItemById = new Map(powerItems.map((p) => [p.id, p]));
    for (const p of activePowers) {
        const slot = classifyBattleSlot(p.phase);
        const powerItem = p.powerItemId ? powerItemById.get(p.powerItemId) ?? null : null;
        const artifactRow = p.artifactRow ?? null;
        switch (slot) {
            case 'movement':
                battleMovement.push(p);
                break;
            case 'activeBuff':
                attachBattlePreview(p, powerItem, 'activeBuff', artifactRow);
                battleBuffs.push(p);
                break;
            case 'reaction':
                attachBattlePreview(p, powerItem, 'reaction', artifactRow);
                battleReactions.push(p);
                break;
            default:
                attachBattlePreview(p, powerItem, 'active', artifactRow);
                battleActive.push(p);
        }
    }
    const battle = {
        movement: battleMovement,
        active: battleActive,
        activeBuffs: battleBuffs,
        reactions: battleReactions,
        passives: passivePowers,
        hasActive: battleActive.length > 0,
        hasBuffs: battleBuffs.length > 0,
        hasReactions: battleReactions.length > 0,
        hasPassives: passivePowers.length > 0,
    };
    // ── Skills ────────────────────────────────────────────────────────────
    const skillsByGroup = SKILL_GROUPS.map((group) => ({
        key: group.key,
        label: group.label,
        skills: group.skills
            .filter((sk) => !!SKILLS[sk])
            .map((sk) => {
            const def = SKILLS[sk];
            const rank = num(system?.skills?.[sk]);
            // Skills are used in Mastery-Rank jumps: up to 4 uses per Safe Haven
            // Rest. Spend the skill rank across the 4 boxes left to right, each
            // box taking min(MR, remaining); once depleted the boxes read 0.
            let remaining = Math.max(0, rank);
            const uses = Array.from({ length: 4 }, () => {
                const v = Math.min(masteryRank, remaining);
                remaining -= v;
                return v;
            });
            return {
                key: sk,
                name: def.name,
                attrs: formatAttrs(def.attributes),
                rank,
                uses
            };
        })
    }));
    // ── Disadvantages ─────────────────────────────────────────────────────
    // Show more than just the name: a player-specific line (who hunts you, the
    // substance, the oath/limitation title + note) plus the concise mechanical
    // effect from the definition, so a reader understands what the disadvantage
    // actually does at the table.
    const disadvantages = Array.isArray(system?.disadvantages)
        ? system.disadvantages.map((d) => {
            const def = getDisadvantageDefinition(String(d?.id ?? ''));
            const details = (d?.details ?? {});
            const detailParts = [];
            const title = String(details?.sheetTitle ?? '').trim();
            const context = stripHtml(details?.context ?? '').trim();
            const hunter = String(details?.hunter ?? '').trim();
            const substance = String(details?.substance ?? '').trim();
            const vulnerability = String(details?.vulnerability ?? '').trim();
            if (title)
                detailParts.push(title);
            if (hunter)
                detailParts.push(`Hunter: ${hunter}`);
            if (substance)
                detailParts.push(`Substance: ${substance}`);
            if (vulnerability)
                detailParts.push(`Type: ${vulnerability}`);
            if (context)
                detailParts.push(context);
            const detail = detailParts.join(' — ');
            const effect = stripHtml(def?.effect ?? def?.description ?? '').trim();
            const description = [detail, effect].filter(Boolean).join(' · ');
            return {
                label: String(d?.label ?? d?.name ?? def?.name ?? ''),
                points: num(d?.points),
                detail,
                effect,
                description,
            };
        })
        : [];
    const disadvantagePoints = disadvantages.reduce((sum, d) => sum + num(d.points), 0);
    // ── Minor Expressions (cantrips) — only the ones the character owns ────
    // Printed above the Disadvantages on page 1. Each shows its current-tier
    // effect text (resolved from the governing attribute value).
    const minorExpressions = (Array.isArray(system?.minorExpressions) ? system.minorExpressions : [])
        .map((rawId) => {
        const def = getMinorExpressionDefinition(String(rawId ?? '').trim());
        if (!def)
            return null;
        const attrVal = num(system?.attributes?.[def.attribute]?.value, 0);
        return {
            name: def.name,
            attribute: cap(def.attribute),
            body: tierBodyForExpression(def, attrVal)
        };
    })
        .filter(Boolean);
    // ── Echo Cards — the deck cards the character has actually unlocked ────
    // Printed near Social Combat on page 2. Each card lists its trigger and its
    // four skill-keyed options.
    const echoKey = String(system?.echo?.key ?? '').trim();
    const echoCards = (Array.isArray(system?.echo?.selectedCardIds) ? system.echo.selectedCardIds : [])
        .map((rawId) => {
        const card = getEchoCard(echoKey, String(rawId ?? '').trim());
        if (!card)
            return null;
        return {
            name: card.name,
            trigger: card.trigger,
            options: card.options.map((o) => ({
                label: String(o?.label ?? ''),
                skill: SKILLS[String(o?.skill ?? '')]?.name ?? cap(String(o?.skill ?? '')),
                description: String(o?.description ?? '')
            }))
        };
    })
        .filter(Boolean);
    // ── Familiars / Summons ───────────────────────────────────────────────
    // The Summons page is only printed when at least one familiar/summon has
    // actually been bound (bought) — `system.familiars` holds those bindings.
    const familiars = Array.isArray(system?.familiars)
        ? system.familiars
            .map((f) => String(f?.name ?? f?.bio?.name ?? ''))
            .filter(Boolean)
        : [];
    const hasFamiliars = familiars.length > 0;
    // ── Equipment ─────────────────────────────────────────────────────────
    // Equipped paperdoll slots + carry inventory rendered as a 24×9 token grid
    // (mirrors the live sheet), so players can print the grid instead of a list.
    const gearItems = allItems.filter((i) => i?.type === 'gear');
    const gear = gearItems.map((g) => ({
        name: String(g?.name ?? ''),
        quantity: num(g?.system?.quantity, 1)
    }));
    const equipment = buildPrintEquipment(allItems);
    // ── Stone Powers reference (replaces the old "technical summary") ──────
    // Full available catalog (General + per-attribute pools), marked with any
    // artifact support / pool / battery / refresh boosts.
    const stoneStatus = getArtifactStoneFunctionStatus(actor);
    const supportByPowerId = new Map();
    for (const s of stoneStatus.supports ?? []) {
        if (s?.stonePowerId) {
            supportByPowerId.set(String(s.stonePowerId), {
                tier: num(s.value),
                source: String(s.source ?? ''),
            });
        }
    }
    const boostsByAttr = new Map();
    for (const r of stoneStatus.records ?? []) {
        if (r.kind === 'stonePool' || r.kind === 'stoneBattery' || r.kind === 'stoneRefresh') {
            const attr = String(r.attribute ?? '');
            const arr = boostsByAttr.get(attr) ?? [];
            arr.push({ kind: STONE_FN_KIND_LABEL[r.kind] || r.kind, value: num(r.value), source: String(r.source ?? '') });
            boostsByAttr.set(attr, arr);
        }
    }
    // Free stones a pool can actually hold = capacity (max) − stones bound into
    // artifacts. A pool reads 0 when the attribute is below 8 (max 0) and/or all
    // its stones are locked into artifacts.
    const freeStonesForAttr = (attr) => {
        const poolMax = num(system?.stonePools?.[attr]?.max, Math.floor(attrVal(attr) / 8));
        const bound = countArtifactActivationStones(actor, attr);
        return Math.max(0, poolMax - bound);
    };
    const allStoneGroups = STONE_GROUPS.map(({ key, label }) => {
        const list = STONE_POWERS_BY_ATTRIBUTE[key] ?? [];
        const isGeneral = key === 'generic';
        const freeStones = isGeneral ? 0 : freeStonesForAttr(key);
        return {
            key,
            label,
            isGeneral,
            freeStones,
            slots: Array.from({ length: freeStones }, (_, i) => i + 1),
            boosts: boostsByAttr.get(key) ?? [],
            powers: list.map((p) => {
                const sup = supportByPowerId.get(String(p.id));
                const supportTier = sup?.tier ?? 0;
                // Ramp powers (e.g. Extra Attack) have a no-op Tier 1 step — their
                // first usable effect starts at Tier 2 (2 stones), so hide the T1 box.
                const isRamp = Array.isArray(p?.tiers) && p.tiers.length > 0 && p.tiers[0]?.label == null;
                // Tier placement areas (T1=1, T2=2, T3=4). When an artifact Support
                // pre-fills a tier, those boxes are shown already filled.
                const tiers = [
                    { label: 'T1', tier: 1, count: 1 },
                    { label: 'T2', tier: 2, count: 2 },
                    { label: 'T3', tier: 3, count: 4 },
                ].filter((g) => !(isRamp && g.tier === 1)).map((g) => ({
                    label: g.label,
                    // Only the supported tier is pre-filled — the player still pays the
                    // lower tiers themselves.
                    boxes: Array.from({ length: g.count }, () => ({ filled: !!sup && g.tier === supportTier })),
                }));
                return {
                    name: String(p?.name ?? ''),
                    category: cap(String(p?.category ?? '')),
                    effect: String(p?.description ?? ''),
                    supported: !!sup,
                    tier: supportTier,
                    source: sup?.source ?? '',
                    tiers,
                };
            }),
        };
    });
    // Total spendable capacity across attribute pools — used to decide whether the
    // (pool-less) General group is worth printing at all.
    const totalFreeStones = allStoneGroups.reduce((s, g) => s + g.freeStones, 0);
    // Hide attribute pools with 0 free stones; keep General only if some pool has
    // stones to pay generic powers with.
    const stonePowerGroups = allStoneGroups.filter((g) => g.isGeneral ? totalFreeStones > 0 : g.freeStones > 0);
    const technical = {
        stonePowerGroups,
        hasStonePowers: stonePowerGroups.length > 0,
    };
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
        stressBreakdown,
        stress,
        artifactWeapons,
        hasArtifactWeapons: artifactWeapons.length > 0,
        martialPowers,
        passivePowerCards,
        battle,
        combatSensesDisplay: buildCombatSensesDisplayContext(actor),
        skillsByGroup,
        disadvantages,
        disadvantagePoints,
        // One strike-off square per Disadvantage point (rerolls earned).
        rerollBoxes: Array.from({ length: Math.max(0, disadvantagePoints) }, () => true),
        minorExpressions,
        hasMinorExpressions: minorExpressions.length > 0,
        // One strike-off square per Minor Expression use per Safe Haven Rest
        // (Mastery Rank × 2 uses total).
        minorExpressionUseBoxes: Array.from({ length: Math.max(0, masteryRank * 2) }, () => true),
        echoCards,
        hasEchoCards: echoCards.length > 0,
        familiars,
        hasFamiliars,
        // 6 pages with a summon (equip + stone + summons + battle), 5 without.
        pageTotal: hasFamiliars ? 6 : 5,
        gear,
        equipment,
        technical
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
        const message = error instanceof Error ? error.message : String(error);
        console.error('Mastery System | Failed to build character print sheet', message, error);
        ui?.notifications?.error('Charakterbogen konnte nicht erstellt werden.');
        return;
    }
    const win = window.open('', '_blank', 'width=900,height=1200');
    if (!win) {
        ui?.notifications?.warn('Druckfenster wurde blockiert. Bitte Pop-ups für Foundry erlauben.');
        return;
    }
    // Cache-bust the stylesheet with the system version so CSS changes (e.g. the
    // landscape Battle Cheat page) are never served stale from the print window.
    const cssVersion = String(game?.system?.version ?? Date.now());
    const cssHref = `${routed(PRINT_CSS)}?v=${encodeURIComponent(cssVersion)}`;
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