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
            ladder: ABILITY_LADDER.map((n) => ({ n, filled: value >= n }))
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
        shieldValue: num(combat?.shield)
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
    // ── Artifact Weapons ──────────────────────────────────────────────────
    // Plain weapons are intentionally omitted; artifact weapons show directly
    // what they do (damage, range, innate abilities, specials).
    const allItems = actor?.items ? Array.from(actor.items.values?.() ?? actor.items) : [];
    const artifactItems = allItems.filter((i) => i?.type === 'artifact');
    function formatWeaponProfile(prof, level) {
        const isRanged = prof?.weaponType === 'ranged';
        const type = isRanged ? 'Ranged' : 'Melee';
        const damage = String(prof?.damage ?? '').trim();
        const innate = Array.isArray(prof?.innateAbilities)
            ? prof.innateAbilities.map((a) => String(a)).filter(Boolean)
            : [];
        // Use the canonical effect formatter so each special shows its proper name
        // and (X) value (e.g. "Ignite(3)"), matching the item info dialog.
        const specials = Array.isArray(prof?.specials)
            ? prof.specials
                .map((s) => typeof s === 'string'
                ? s
                : formatEffectReference({ specialId: String(s?.specialId ?? ''), value: s?.value }))
                .filter(Boolean)
            : [];
        // Melee range is always 1 m unless the weapon has a Reach ability. Ranged
        // weapons show their real range; a comma list (a stale per-level scaling
        // table) collapses to the value for the current artifact level.
        const hasReach = [...innate, ...specials].some((t) => /reach/i.test(String(t)));
        let range;
        if (!isRanged) {
            range = hasReach ? 'Reach' : '1 m';
        }
        else {
            let raw = String(prof?.range ?? '').trim();
            if (raw.includes(',')) {
                const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
                const idx = Math.min(parts.length - 1, Math.max(0, level - 1));
                raw = parts[idx] ?? parts[parts.length - 1] ?? '';
            }
            range = !raw || raw === '0m' || raw === '0' ? '—' : /m$/i.test(raw) ? raw : `${raw} m`;
        }
        return { type, damage, range, tags: [...innate, ...specials].filter(Boolean).join(', ') };
    }
    const artifactLevel = (a) => Math.max(1, Math.min(10, num(a?.system?.currentLevel) || num(a?.system?.level) || 1));
    const artifactWeapons = artifactItems
        .filter((a) => a?.system?.artifactWeapon)
        .map((a) => {
        const prof = formatWeaponProfile(a.system.artifactWeapon, artifactLevel(a));
        return {
            name: String(a?.name ?? ''),
            type: prof.type,
            damage: prof.damage,
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
        const entry = {
            name: prettyPowerName(p, rank),
            effect: stripHtml(sys?.effect || sys?.description || ''),
            phase,
            stones: num(sys?.cost?.stones),
            rank,
            sortKey: powerSortRank(category || phase)
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
            activePowers.push({
                name,
                effect: stripHtml(row?.effect),
                phase: type || 'Active',
                stones: 0,
                rank: 1,
                fromArtifact: true,
                source: String(a?.name ?? ''),
                sortKey: powerSortRank(type)
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
    for (const p of activePowers) {
        switch (classifyBattleSlot(p.phase)) {
            case 'movement':
                battleMovement.push(p);
                break;
            case 'activeBuff':
                battleBuffs.push(p);
                break;
            case 'reaction':
                battleReactions.push(p);
                break;
            default: battleActive.push(p);
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
                // Tier placement areas (T1=1, T2=2, T3=4). When an artifact Support
                // pre-fills a tier, those boxes are shown already filled.
                const tiers = [
                    { label: 'T1', tier: 1, count: 1 },
                    { label: 'T2', tier: 2, count: 2 },
                    { label: 'T3', tier: 3, count: 4 },
                ].map((g) => ({
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
        stress,
        artifactWeapons,
        hasArtifactWeapons: artifactWeapons.length > 0,
        martialPowers,
        passivePowerCards,
        battle,
        skillsByGroup,
        disadvantages,
        disadvantagePoints,
        familiars,
        gear,
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
        console.error('Mastery System | Failed to build character print sheet', error);
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