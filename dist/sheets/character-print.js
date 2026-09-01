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
import { buildSkillUseBoxes } from '../utils/skill-use-boxes.js';
import { resolvePowerCategoryFromItem } from '../utils/power-catalog.js';
import { getArtifactStoneFunctionStatus } from '../utils/artifact-stone-functions.js';
import { isArtifactMechanicallyActive } from '../utils/artifact-actor-rules.js';
import { visibleAbilityRows } from '../utils/artifact-visible-abilities.js';
import { formatEffectReference } from '../utils/special-effects.js';
import { specialApplicationLimit } from '../combat/special-application.js';
import { STONE_POWERS_BY_ATTRIBUTE, effectiveStoneSupportPrefillTier, firstEffectiveStonePowerTier, stonePowerSkipsFirstTier, stonePowerWaveCost, } from '../stones/stone-powers.js';
import { orderPowersRampFirst } from '../stones/stone-payment-rules.js';
import { getMinorExpressionDefinition, tierBodyForExpression } from '../utils/minor-expressions.js';
import { colorlessStoneInitiativeCost } from '../stones/colorless-stones.js';
import { getTemplate } from '../utils/powers/index.js';
import { getEcho, getEchoCard, getLicensedEchoCardIds } from '../utils/echos/index.js';
import { parseInventorySize, fitsInGrid, rectsOverlap, findFirstFit, } from '../utils/inventory-grid.js';
import { normalizeSlotKey } from '../utils/equip-slots.js';
import { isEchoArtifactInventoryHidden } from '../utils/echo-artifact-equip.js';
import { isLegacyUnarmedItem } from '../utils/unarmed-fallback.js';
import { peekWeaponSets } from '../utils/weapon-sets.js';
import { formatArtifactWeaponRangeDisplay, resolveArtifactWeaponKind, artifactSystemHasSpellFocus, spellFocusDiceFromSystem, } from '../utils/artifact-rules.js';
import { deriveArtifactWeaponDamage, deriveBaseValueDisplay } from '../utils/artifact-base-derive.js';
import { getDisadvantageDefinition } from '../system/disadvantages.js';
import { getPowerDefinitionRank } from '../utils/power-definition-rank.js';
import { buildPrintCombatPreview, buildPrintCombatPreviewForArtifactRow, buildArtifactRowSpellPrintMeta, buildSpellPrintMeta, buildBasicAttackCompactDamageLines, listPreparedWeaponsByAttackType } from './character-print-combat.js';
import { buildCombatSensesDisplayContext } from '../combat/combat-sense-collection.js';
import { basicAttackMrDamageFormula, basicCombatMrTimesTwo, buildBasicReactionItems, } from '../combat/basic-combat.js';
import { buildConsumablePrintEntries, buildConsumablePrintSlots } from '../utils/consumable-slots.js';
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
const PRINT_TEMPLATE_COMPACT = 'systems/mastery-system/templates/actor/character-print-compact.hbs';
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
    const tid = String(sys?.templateId ?? '').trim();
    if (tid) {
        const tmpl = getTemplate(tid);
        const catalogLevels = tmpl?.levels;
        if (catalogLevels && typeof catalogLevels === 'object') {
            const ckey = String(getPowerDefinitionRank(level, catalogLevels));
            const catalogText = catalogLevels[ckey]?.effect?.text;
            if (typeof catalogText === 'string' && catalogText.trim())
                return catalogText;
        }
    }
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
    const tile = (item) => {
        const ammoContainer = item?.system?.ammoContainer === true;
        const current = Math.max(0, Math.floor(Number(item?.system?.currentAmmunition) || 0));
        const capacity = Math.max(0, Math.floor(Number(item?.system?.capacity) || 0));
        const i18n = globalThis.game?.i18n;
        const ammoLabel = ammoContainer
            ? (i18n?.format?.('MASTERY.ammunition.display', { current, max: capacity })
                || `Ammunition: ${current}/${capacity}`)
            : '';
        return {
            name: String(item?.name ?? ''),
            img: absImg(item?.img),
            qty: num(item?.system?.quantity, 1),
            isGear: String(item?.type) === 'gear' && !ammoContainer,
            isAmmo: item?.system?.ammunition === true,
            ammoLabel,
        };
    };
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
        else if (flags?.weaponSetPrepared === true) {
            continue;
        }
        else if (isEchoArtifactInventoryHidden(item)) {
            continue;
        }
        else if (flags?.consumableSlot != null && Number.isFinite(Number(flags.consumableSlot))) {
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
export function buildCharacterPrintContext(actor, options = {}) {
    const system = actor?.system ?? {};
    const masteryRank = num(system?.mastery?.rank, 2);
    // ── Abilities ─────────────────────────────────────────────────────────
    const abilities = ATTR_ORDER.map((key) => {
        const value = num(system?.attributes?.[key]?.value, 0);
        const stoneCapacity = num(system?.stonePools?.[key]?.max, Math.floor(value / 8));
        const stoneAvailable = Math.max(0, stoneCapacity);
        return {
            key,
            label: cap(key).toUpperCase(),
            value,
            stoneCapacity,
            stoneAvailable,
            blocked: false,
            blockedBy: '',
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
        return { key, label: cap(key).toUpperCase(), max, available: Math.max(0, max) };
    });
    const attrVal = (k) => num(system?.attributes?.[k]?.value, 0);
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
        {
            name: globalThis.game?.i18n?.localize?.('MASTERY.weaponSets.actionName') || 'Weapon Swap',
            effect: globalThis.game?.i18n?.localize?.('MASTERY.weaponSets.actionDescription') ||
                'Switch to the other prepared Weapon Set. Costs a Movement Action in combat.',
            phase: 'Movement',
            baseline: true,
        },
    ];
    const battleActive = [];
    const battleBuffs = [];
    const battleReactions = [];
    // Optional: universal Basic Attack + Basic Reactions (radial / Reaction Window).
    if (options.includeStandardManeuvers) {
        const mrDice = basicAttackMrDamageFormula(actor);
        const mr2 = basicCombatMrTimesTwo(actor);
        battleActive.push({
            name: 'Basic Attack',
            effect: `Weapon Damage + ${mrDice} (MR × 2d8). No Active Power effects. ` +
                `Weapon properties and eligible Passives / Buffs still apply.`,
            phase: 'Active',
            baseline: true,
            battleCompact: true,
            attackKind: 'Melee / Ranged',
            damageRoll: `Weapon + ${mrDice}`,
            rollKind: 'damage',
            rollLabel: 'Damage',
            battleFootnote: 'Universal — not a Power; usable every round.',
            hideRank: true,
        });
        for (const r of buildBasicReactionItems(actor)) {
            const key = String(r.basicReaction || '');
            const entry = {
                name: r.name,
                effect: String(r.system?.description || ''),
                phase: 'Reaction',
                baseline: true,
                hideRank: true,
                battleCompact: true,
                battleFootnote: 'Basic Reaction — not a Power; reusable with extra Reactions.',
            };
            if (key === 'guard') {
                entry.damageRoll = `+${mr2} Armor`;
                entry.rollLabel = 'Effect';
                entry.battleFootnote = 'Basic Reaction — +Armor vs the triggering attack / damage.';
            }
            else if (key === 'evade') {
                entry.damageRoll = `+${mr2} Evade`;
                entry.rollLabel = 'Effect';
                entry.battleFootnote = 'Basic Reaction — may negate the hit if Evade exceeds the attack total.';
            }
            else if (key === 'counterattack') {
                entry.damageRoll = `Weapon + ${mrDice}`;
                entry.rollLabel = 'Damage';
                entry.battleFootnote = 'Basic Reaction — Basic Attack vs the triggering creature.';
            }
            battleReactions.push(entry);
        }
    }
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
    for (const entry of buildConsumablePrintEntries(actor)) {
        battleActive.push(entry);
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
        includeStandardManeuvers: !!options.includeStandardManeuvers,
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
            const uses = buildSkillUseBoxes(rank, 0, masteryRank).map((box) => box.size);
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
    const selectedEchoCardIds = Array.isArray(system?.echo?.selectedCardIds) ? system.echo.selectedCardIds : [];
    const echoCards = getLicensedEchoCardIds(selectedEchoCardIds, masteryRank)
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
            const powerId = String(s.stonePowerId);
            supportByPowerId.set(powerId, {
                tier: effectiveStoneSupportPrefillTier(powerId, num(s.value)),
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
    // Free stones a pool can actually hold = capacity. Attunement no longer
    // reserves a Stone, so leftover activation flags never shrink the printout.
    const freeStonesForAttr = (attr) => {
        const poolMax = num(system?.stonePools?.[attr]?.max, Math.floor(attrVal(attr) / 8));
        return Math.max(0, poolMax);
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
            powers: orderPowersRampFirst(list, (p) => stonePowerSkipsFirstTier(String(p.id))).map((p) => {
                const sup = supportByPowerId.get(String(p.id));
                const supportTier = sup?.tier ?? 0;
                // T2-start powers have no Tier-1 slot — do not render an empty T1 box.
                const isRamp = stonePowerSkipsFirstTier(String(p.id));
                const firstPaid = firstEffectiveStonePowerTier(String(p.id));
                // Tier placement areas (T1=1, T2=2, T3=4). Support gold-fills every
                // published tier above the one the player must pay, up through the
                // effective prefill (Crit + Focus I → T3 filled, T2 empty).
                const tiers = [
                    { label: 'T1', tier: 1, count: 1 },
                    { label: 'T2', tier: 2, count: 2 },
                    { label: 'T3', tier: 3, count: 4 },
                ].filter((g) => !(isRamp && g.tier === 1)).map((g) => ({
                    label: g.label,
                    boxes: Array.from({ length: g.count }, () => ({
                        filled: !!sup && g.tier > firstPaid && g.tier <= supportTier,
                    })),
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
    const iniStoneCost = Math.max(4, masteryRank * 4);
    const technical = {
        stonePowerGroups,
        hasStonePowers: stonePowerGroups.length > 0,
        iniStoneCost,
        colorlessBoxes: Array.from({ length: 10 }, (_, i) => i + 1),
    };
    return {
        name: String(actor?.name ?? ''),
        player: resolvePlayerName(actor),
        echo: resolveEchoName(actor, system),
        masteryRank,
        specialRecovery: masteryRank,
        specialCap: specialApplicationLimit(masteryRank),
        faithFractures: {
            current: num(system?.faithFractures?.current),
            maximum: num(system?.faithFractures?.maximum, 8)
        },
        abilities,
        stonePools,
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
        consumableSlots: buildConsumablePrintSlots(actor),
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
function actorItemList(actor) {
    if (!actor?.items)
        return [];
    if (typeof actor.items.values === 'function')
        return Array.from(actor.items.values());
    if (Array.isArray(actor.items))
        return actor.items;
    try {
        return Array.from(actor.items);
    }
    catch {
        return [];
    }
}
function itemFlag(item, key) {
    if (typeof item?.getFlag === 'function')
        return item.getFlag('mastery-system', key);
    return item?.flags?.['mastery-system']?.[key];
}
function compactOneLine(value, max = 108) {
    const s = stripHtml(value);
    if (!s)
        return '';
    if (s.length <= max)
        return s;
    return `${s.slice(0, max - 1).replace(/\s+\S*$/, '')}…`;
}
/** Short play text without ellipsis — keep the existing compact mechanical lines. */
function compactPlayText(value) {
    return stripHtml(value);
}
function actorItemById(actor, id) {
    if (!id)
        return null;
    const key = String(id);
    if (typeof actor?.items?.get === 'function') {
        const hit = actor.items.get(key);
        if (hit)
            return hit;
    }
    return actorItemList(actor).find((i) => String(i?.id) === key) ?? null;
}
/** True for printable set weapons (plain weapons + wieldable artifact weapons). */
function isCompactSetWeaponItem(item) {
    if (!item)
        return false;
    if (item.type === 'weapon') {
        return !isLegacyUnarmedItem(item) && item.system?.virtualUnarmed !== true;
    }
    if (item.type !== 'artifact')
        return false;
    if (itemFlag(item, 'artifactActivated') === false)
        return false;
    const sys = item.system ?? {};
    if (sys.artifactWeapon)
        return true;
    if (String(sys.artifactKind ?? '') === 'weapon')
        return true;
    if (String(sys.baseTypeKey ?? '').startsWith('weapon:'))
        return true;
    const level = Math.max(1, Math.min(10, num(sys.currentLevel) || num(sys.level) || 1));
    return deriveArtifactWeaponDamage(sys.baseProfile, level) != null;
}
function splitCompactTags(raw) {
    if (raw == null)
        return [];
    if (Array.isArray(raw)) {
        return raw.flatMap((entry) => splitCompactTags(entry));
    }
    if (typeof raw === 'object') {
        const formatted = formatEffectReference({
            specialId: String(raw.specialId ?? raw.key ?? ''),
            value: raw.value,
        });
        return formatted ? [formatted] : [];
    }
    return String(raw)
        .split(/[,·;/|]+/)
        .map((s) => s.trim())
        .filter((s) => s && s !== '—');
}
function extractRangedMetersFromTags(tags) {
    for (const tag of tags) {
        const m = tag.match(/^ranged\s*\(?\s*(\d+)\s*m\s*\)?$/i);
        if (m)
            return Number(m[1]);
    }
    return null;
}
function formatCompactWeaponPiece(item) {
    const sys = item?.system ?? {};
    const isArtifact = item?.type === 'artifact';
    const name = String(item?.name ?? '')
        .replace(/\s*-\s*Level.*$/i, '')
        .trim() || '[CHECK]';
    let damage = '';
    let kindLabel = 'Melee';
    let tags = [];
    let specials = [];
    if (isArtifact) {
        const level = Math.max(1, Math.min(10, num(sys.currentLevel) || num(sys.level) || 1));
        const aw = sys.artifactWeapon ?? {};
        const derived = deriveArtifactWeaponDamage(sys.baseProfile, level);
        const focusDice = spellFocusDiceFromSystem(sys);
        const isSpellFocus = artifactSystemHasSpellFocus(sys);
        damage = isSpellFocus
            ? `Spell Focus +${focusDice}d8`
            : derived || String(aw.damage ?? '').trim() || String(sys.damage ?? '').trim();
        const range = formatArtifactWeaponRangeDisplay(aw, sys.baseProfile);
        kindLabel = range.kind === 'ranged' ? `Ranged ${range.label}` : 'Melee';
        tags = [
            ...splitCompactTags(aw.innateAbilities),
            ...splitCompactTags(sys.freeTrait),
        ].filter((t) => !/^ranged\b/i.test(t) && !/^artifact$/i.test(t));
        tags.push('Artifact');
        specials = splitCompactTags(aw.specials);
    }
    else {
        damage = String(sys.damage ?? '').trim();
        const innates = splitCompactTags(sys.innateAbilities);
        const rangedMeters = extractRangedMetersFromTags(innates) ??
            (sys.weaponType === 'ranged'
                ? (() => {
                    const m = String(sys.range ?? '').match(/(\d+)\s*m/i);
                    return m ? Number(m[1]) : null;
                })()
                : null);
        if (sys.weaponType === 'ranged' || rangedMeters != null) {
            kindLabel = `Ranged ${rangedMeters != null ? rangedMeters : 24} m`;
        }
        else {
            kindLabel = 'Melee';
        }
        tags = innates.filter((t) => !/^ranged\b/i.test(t));
        specials = splitCompactTags(sys.specials);
    }
    const metaParts = [damage, kindLabel, ...tags].filter(Boolean);
    return {
        name,
        meta: metaParts.join(' · '),
        specials: specials.join(' · '),
    };
}
/**
 * Quick Play weapon-set tiles — same side-by-side tile language as Minor
 * Expressions: title + kind in the header, one flowing stats line in the body.
 */
function buildCompactWeaponSetTiles(actor) {
    const state = peekWeaponSets(actor);
    const tiles = [];
    for (const index of [1, 2]) {
        const hands = state.sets[index] || { mainhand: null, offhand: null };
        const orderedIds = [];
        for (const id of [hands.mainhand, hands.offhand]) {
            if (!id)
                continue;
            const key = String(id);
            if (!orderedIds.includes(key))
                orderedIds.push(key);
        }
        const weapons = orderedIds
            .map((id) => actorItemById(actor, id))
            .filter((item) => isCompactSetWeaponItem(item));
        if (weapons.length === 0)
            continue;
        const pieces = weapons.map((w) => formatCompactWeaponPiece(w));
        const kinds = new Set(weapons.map((w) => {
            if (w.type === 'artifact') {
                return resolveArtifactWeaponKind(w.system?.artifactWeapon, w.system?.baseProfile);
            }
            return w.system?.weaponType === 'ranged' ? 'ranged' : 'melee';
        }));
        const kindLabel = [
            kinds.has('melee') ? 'Melee' : null,
            kinds.has('ranged') ? 'Ranged' : null,
            state.active === index ? 'Active' : null,
        ]
            .filter(Boolean)
            .join(' · ');
        // One horizontal line per weapon (meta + specials), joined when dual-wield.
        const body = pieces
            .map((p) => [p.meta, p.specials].filter(Boolean).join(' · '))
            .filter(Boolean)
            .join('  ·  ');
        tiles.push({
            index,
            active: state.active === index,
            title: `SET ${index} — ${pieces.map((p) => p.name.toUpperCase()).join(' + ')}`,
            kindLabel,
            body,
            meta: pieces[0]?.meta ?? '',
            specials: pieces[0]?.specials ?? '',
        });
    }
    return tiles;
}
function missingMark(value, fallback) {
    if (value == null)
        return '[CHECK]';
    const s = String(value).trim();
    if (!s)
        return fallback || '[CHECK]';
    return s;
}
function compactStoneRows(attrKey) {
    const list = STONE_POWERS_BY_ATTRIBUTE[attrKey] ?? [];
    return list.map((power) => {
        const tier = firstEffectiveStonePowerTier(power.id);
        const cost = stonePowerWaveCost(tier);
        const first = power.tiers?.[0];
        return {
            name: power.name,
            tier,
            cost,
            costPips: Array.from({ length: cost }, (_, i) => i + 1),
            effect: compactOneLine(first?.label || first?.description || power.description, 42),
        };
    });
}
function compactArtifactBases(sys, level) {
    const rows = Array.isArray(sys?.baseValues) ? sys.baseValues : [];
    const profile = String(sys?.baseProfile ?? '');
    const out = [];
    for (const bv of rows) {
        if (!bv)
            continue;
        const type = String(bv.type ?? '');
        if (type === 'weaponDamage')
            continue;
        const label = String(bv.label ?? '').trim();
        const raw = bv.value;
        let display = '';
        if (raw != null && String(raw) !== '') {
            const n = Number(raw);
            if (Number.isFinite(n)) {
                if (type === 'evade' || /evade/i.test(label))
                    display = `+${n} Evade`;
                else if (type === 'movement' || /move/i.test(label))
                    display = `+${n} m`;
                else if (type === 'bodyArmor' || type === 'headArmor' || type === 'shieldValue' || /armor/i.test(label)) {
                    display = `+${n} Armor`;
                }
                else {
                    display = String(raw);
                }
            }
            else {
                display = String(raw);
            }
        }
        else {
            display = deriveBaseValueDisplay(type, level, profile).display;
        }
        if (!display)
            continue;
        out.push(compactOneLine(display, 48));
    }
    return out;
}
const HEALTH_TRACK_PENALTY = {
    bruised: '−10%',
    injured: '−20%',
    wounded: '−40%',
    broken: '−50%',
};
function compactTrackBars(bars, names, skipNames = []) {
    const skip = new Set(skipNames.map((n) => n.toLowerCase()));
    return bars
        .filter((b) => !skip.has(String(b?.name ?? '').toLowerCase()))
        .map((b, i) => {
        const max = num(b?.max);
        const current = num(b?.current);
        const name = String(b?.name ?? names[i] ?? `Bar ${i + 1}`);
        const available = current > 0 ? current : max;
        return {
            name,
            available,
            max,
            penalty: HEALTH_TRACK_PENALTY[name.toLowerCase()] ?? '',
        };
    });
}
function compactPhasingBoxes(items) {
    let base = 0;
    let bonus = 0;
    let cap = 0;
    for (const p of items) {
        if (p?.type !== 'power')
            continue;
        const sys = p?.system ?? {};
        const rank = num(sys?.level ?? sys?.rank, 1);
        const tid = String(sys?.templateId ?? '').trim();
        const tmpl = tid ? getTemplate(tid) : undefined;
        const catalogRow = tmpl?.levels
            ? tmpl.levels[String(getPowerDefinitionRank(rank, tmpl.levels))]
            : null;
        const bakedRow = sys?.levels?.[String(getPowerDefinitionRank(rank, sys.levels))];
        const ph = catalogRow?.mechanics?.phasing ?? bakedRow?.mechanics?.phasing;
        const start = num(ph?.combatStart?.charges);
        if (start > 0)
            base = Math.max(base, start);
        const add = num(ph?.augment?.addCharges);
        if (add > 0) {
            bonus += add;
            if (tid === 'ab-phasing') {
                cap = rank >= 15 ? 4 : rank >= 8 ? 3 : rank >= 4 ? 2 : 0;
            }
        }
    }
    const max = cap > 0 ? cap : base + bonus;
    if (max <= 0)
        return [];
    return Array.from({ length: max }, (_, i) => ({ n: i + 1 }));
}
/**
 * One-page Quick Play context — same actor data as the full sheet.
 */
export function buildCharacterCompactPrintContext(actor) {
    const system = actor?.system ?? {};
    const masteryRank = num(system?.mastery?.rank);
    const combat = system?.combat ?? {};
    const allItems = actorItemList(actor);
    const echoKey = String(system?.echo?.key ?? '').trim();
    const echoDef = getEcho(echoKey);
    const echoName = echoDef?.name || missingMark(system?.bio?.echo || echoKey);
    const healthBars = compactTrackBars(Array.isArray(system?.health?.bars) ? system.health.bars : [], ['Healthy', 'Bruised', 'Injured', 'Wounded', 'Broken'], ['Incapacitated']);
    const stressFallback = ['Healthy', 'Stressed', 'Not Well', 'Breaking'];
    const stressBars = compactTrackBars(Array.isArray(system?.stress?.bars) ? system.stress.bars : [], stressFallback);
    const initMr = num(combat?.initiativeMasteryRank, masteryRank);
    const initD8Mech = num(combat?.initiativeD8FromMechanics);
    const initDiceCount = Math.max(0, (initMr > 0 ? initMr : masteryRank) + initD8Mech);
    const initiative = initDiceCount > 0 ? `${initDiceCount}d8` : '[CHECK]';
    const colorlessCost = colorlessStoneInitiativeCost(initMr > 0 ? initMr : masteryRank || 2);
    const faithCurrent = num(system?.faithFractures?.current);
    const faithMax = num(system?.faithFractures?.maximum, faithCurrent);
    const tempHp = num(system?.health?.tempHP);
    const minorExpressionTiles = (Array.isArray(system?.minorExpressions) ? system.minorExpressions : [])
        .map((rawId) => {
        const def = getMinorExpressionDefinition(String(rawId ?? '').trim());
        if (!def)
            return null;
        const attrVal = num(system?.attributes?.[def.attribute]?.value);
        return {
            name: def.name,
            phase: 'Minor Expression',
            phaseClass: 'Minor',
            attr: cap(def.attribute),
            effect: compactPlayText(tierBodyForExpression(def, attrVal)),
        };
    })
        .filter(Boolean);
    const phasingBoxes = compactPhasingBoxes(allItems);
    const attributeModules = ATTR_ORDER.map((key) => {
        const value = num(system?.attributes?.[key]?.value);
        const max = num(system?.stonePools?.[key]?.max, Math.floor(value / 8));
        const current = num(system?.stonePools?.[key]?.current, max);
        const ready = Math.max(0, Math.min(max, current));
        return {
            key,
            label: cap(key),
            value,
            stoneMax: max,
            stoneReady: ready,
            hasStones: max > 0,
            stones: Array.from({ length: max }, (_, i) => ({ ready: i < ready })),
            powers: compactStoneRows(key),
        };
    });
    const generalStones = {
        key: 'generic',
        label: 'General',
        powers: compactStoneRows('generic'),
    };
    const skillsSpent = system?.skillsSpent && typeof system.skillsSpent === 'object' ? system.skillsSpent : {};
    const skills = [];
    const skillMap = system?.skills && typeof system.skills === 'object' ? system.skills : {};
    for (const [key, raw] of Object.entries(skillMap)) {
        const rating = num(raw);
        if (rating <= 0)
            continue;
        const def = SKILLS[key];
        const attrKey = def?.attributes?.[0];
        const pool = attrKey ? num(system?.attributes?.[attrKey]?.value) : 0;
        const boxes = buildSkillUseBoxes(rating, num(skillsSpent[key]), masteryRank || 1)
            .map((b) => ({ size: b.size, state: b.state }));
        skills.push({
            name: def?.name || cap(key),
            attr: attrKey ? cap(attrKey) : '[CHECK]',
            pool: pool > 0 ? pool : '[CHECK]',
            keep: masteryRank > 0 ? `k${masteryRank}` : '[CHECK]',
            rating,
            boxes,
        });
    }
    skills.sort((a, b) => a.name.localeCompare(b.name));
    const weaponSetTiles = buildCompactWeaponSetTiles(actor);
    const powerItems = allItems.filter((i) => i?.type === 'power');
    const powers = {
        Active: [],
        'Active Buff': [],
        Reaction: [],
        Passive: [],
    };
    // Universal Basic Attack — one damage line per prepared weapon kind.
    // A Longbow without Ranged Single Attack still appears here (Basic only).
    const mrBonus = basicAttackMrDamageFormula(actor);
    const basicLines = buildBasicAttackCompactDamageLines(actor, allItems, mrBonus);
    const preparedKinds = listPreparedWeaponsByAttackType(actor, allItems);
    const hasRangedPower = powerItems.some((p) => {
        const sys = p?.system ?? {};
        const tid = String(sys.templateId ?? '');
        const sub = String(sys.subfamily ?? '');
        if (/ranged/i.test(tid) || /ranged/i.test(sub))
            return true;
        const levels = sys.levels;
        if (levels && typeof levels === 'object') {
            const rank = Math.max(1, Math.floor(Number(sys.level ?? sys.rank) || 1));
            const row = levels[String(rank)] ?? levels[rank];
            if (row && /ranged/i.test(String(row.type ?? '')))
                return true;
        }
        return false;
    });
    const basicNoteParts = [
        'Universal — not a Power. Melee powers use melee WD only; Ranged powers use ranged WD only.',
    ];
    if (preparedKinds.ranged && !hasRangedPower) {
        basicNoteParts.push('No Ranged attack power: the ranged set is Basic Attack only (add Ranged Single Attack to use it as a Power).');
    }
    powers.Active.push({
        phase: 'Active',
        phaseClass: 'Active',
        name: 'Basic Attack',
        rank: 0,
        attack: '',
        damage: '',
        damageLines: basicLines,
        effect: basicNoteParts.join(' '),
        hideRank: true,
    });
    for (const p of powerItems) {
        const sys = p?.system ?? {};
        const category = resolvePowerCategoryFromItem(p);
        const rank = num(sys?.level ?? sys?.rank, 1);
        const phase = powerPhaseLabel(category);
        if (!phase || !powers[phase])
            continue;
        const slot = category === 'activeBuff' ? 'activeBuff' : category === 'reaction' ? 'reaction' : 'active';
        const preview = buildPrintCombatPreview(actor, p, allItems, slot);
        powers[phase].push({
            phase,
            phaseClass: phaseCssClass(phase),
            name: prettyPowerName(p, rank).replace(/^(Passive|Active Buff|Reaction|Active|Movement):\s*/i, ''),
            rank,
            attack: preview?.showAttack && preview.attackLabel ? String(preview.attackLabel) : '',
            damage: preview?.showDamage && preview.damage ? String(preview.damage) : '',
            damageLines: [],
            effect: compactPlayText(powerEffectForRank(sys, rank)),
        });
    }
    const artifacts = [];
    for (const a of allItems.filter((i) => i?.type === 'artifact')) {
        if (itemFlag(a, 'artifactActivated') === false)
            continue;
        const sys = a?.system ?? {};
        const level = Math.max(1, Math.min(10, num(sys.currentLevel) || num(sys.level) || 1));
        const isWeapon = sys.artifactKind === 'weapon' || String(sys.baseTypeKey ?? '').startsWith('weapon:');
        let damage = '';
        let kind = '';
        if (isWeapon) {
            const derived = deriveArtifactWeaponDamage(sys.baseProfile, level);
            damage = derived || String(sys.artifactWeapon?.damage ?? '').trim();
            const weapKind = resolveArtifactWeaponKind(sys.artifactWeapon, sys.baseProfile);
            kind = weapKind === 'ranged' ? 'Ranged' : 'Melee';
        }
        else {
            const slot = String(sys.gearSlot || sys.slot || '').trim();
            if (slot)
                kind = cap(slot);
        }
        const bases = compactArtifactBases(sys, level);
        const rows = visibleAbilityRows(Array.isArray(sys.levelProgression) ? sys.levelProgression : [], level);
        const artPowers = rows.map((row) => ({
            name: String(row?.name ?? '').trim() || '[CHECK]',
            type: String(row?.type ?? '').trim(),
            effect: compactPlayText(row?.effect),
        }));
        artifacts.push({
            name: String(a?.name ?? '').replace(/\s*-\s*Level.*$/i, '').trim() || missingMark(a?.name),
            level,
            kind,
            damage,
            trait: String(sys.freeTrait ?? '').trim(),
            bases,
            powers: artPowers,
        });
    }
    const powerGroups = ['Active', 'Active Buff', 'Passive', 'Reaction']
        .map((phase) => ({ phase, items: powers[phase] ?? [] }))
        .filter((g) => g.items.length > 0);
    const powerColumns = [];
    const tallGroups = powerGroups.filter((g) => g.items.length >= 2);
    const shortGroups = powerGroups.filter((g) => g.items.length < 2);
    for (const group of tallGroups)
        powerColumns.push({ groups: [group] });
    for (let i = 0; i < shortGroups.length; i += 2) {
        powerColumns.push({ groups: shortGroups.slice(i, i + 2) });
    }
    const rawImg = String(actor?.img ?? '').trim();
    const portraitSrc = rawImg.replace(/\/Players\/Alaris\.png$/i, '/Players/Alaris/Alaris.png');
    const portrait = absImg(portraitSrc);
    return {
        name: missingMark(actor?.name, '[CHECK]'),
        echoName,
        masteryRank: masteryRank > 0 ? masteryRank : '[CHECK]',
        portrait,
        hasPortrait: !!portrait,
        movement: num(combat?.speed) > 0 ? `${num(combat.speed)} m` : '[CHECK]',
        evade: combat?.evadeTotal != null ? num(combat.evadeTotal) : '[CHECK]',
        armor: combat?.armorTotal != null ? num(combat.armorTotal) : '[CHECK]',
        initiative,
        faithFractures: `${faithMax > 0 || faithCurrent > 0 ? faithCurrent : 0} / ${faithMax > 0 ? faithMax : 8}`,
        hasFaithFractures: faithMax > 0 || faithCurrent > 0,
        tempHp,
        colorlessCost: colorlessCost > 0 ? colorlessCost : 8,
        colorlessBoxes: Array.from({ length: 4 }, (_, i) => i + 1),
        phasingBoxes,
        hasPhasing: phasingBoxes.length > 0,
        minorExpressionTiles,
        hasMinorExpressions: minorExpressionTiles.length > 0,
        healthBars,
        hasHealth: healthBars.length > 0,
        stressBars,
        hasStress: stressBars.length > 0,
        attributeModules,
        generalStones,
        skills,
        hasSkills: skills.length > 0,
        weaponSetTiles,
        hasWeaponSets: weaponSetTiles.length > 0,
        powerGroups,
        powerColumns,
        hasPowerArea: powerGroups.length > 0,
        artifacts,
        hasArtifacts: artifacts.length > 0,
    };
}
/**
 * Render the printable sheet for `actor` and open it in a new window that
 * triggers the browser print dialog (save as PDF).
 */
export async function openCharacterPrintSheet(actor, options = {}) {
    if (!actor || actor.type !== 'character') {
        ui?.notifications?.warn('Druck-Export ist nur für Charaktere verfügbar.');
        return;
    }
    const compact = options.layout === 'compact';
    let body = '';
    try {
        const context = compact
            ? buildCharacterCompactPrintContext(actor)
            : buildCharacterPrintContext(actor, options);
        const template = compact ? PRINT_TEMPLATE_COMPACT : PRINT_TEMPLATE;
        body = await foundry.applications.handlebars.renderTemplate(template, context);
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
    const bodyClass = compact ? 'mastery-print is-compact' : 'mastery-print';
    const doc = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <link rel="stylesheet" href="${cssHref}" />
</head>
<body class="${bodyClass}">
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