/**
 * Artifact → Radial Menu options
 *
 * Surfaces unlocked artifact actives, movement powers, active buffs and
 * Stone Power Supports from every equipped artifact (`system.binding`
 * is `bound` or `echo`) up to the artifact's `currentLevel`.
 *
 * Two data sources are merged:
 *   1. `system.powers` — legacy `EmbeddedPowerData` entries (the
 *      structured power-mechanics editor). Filtered by tree-depth /
 *      level when available.
 *   2. `system.levelProgression` — the new spec's per-level Active /
 *      Active Buff / Movement / Support / Stone Power Support rows.
 *      Filtered by `level <= currentLevel`.
 *
 * The function returns lightweight `RadialCombatOption` entries that
 * carry enough metadata for the radial-menu pipeline to render them
 * even though there is no backing `Item` document. The `item` field
 * points to the artifact item, with a synthetic `system.artifactPowerKey`
 * attached so downstream consumers can identify the row.
 */
import { getEffectiveCircularAoeRadiusBonusMeters } from '../combat/offensive-active-buff-effects.js';
import { artifactPowersUnlocked, getArtifactBindingKind } from '../utils/artifact-actor-rules.js';
import { formatArtifactWeaponRangeDisplay, resolveArtifactWeaponKind } from '../utils/artifact-rules.js';
import { visibleAbilityRows } from '../utils/artifact-visible-abilities.js';
import { artifactCarriesWeaponProfile } from '../utils/unarmed-fallback.js';
import { breathDamageConeMeters, breathRuinConeMeters, breathRuinValue, damageBreathSharedPoolFormula, isBreathWeaponName, } from '../utils/breath-weapon.js';
const REACTION_TYPES = new Set(['Reaction']);
/**
 * Classify a Level Progression row `type` into a radial category. The Type
 * column mixes Player's-Guide labels ("Active", "Active Buff", "Movement",
 * "Stone Power Support") with catalog martial/attack labels ("Ranged AoE",
 * "Melee", "Ranged Zone", "Melee AoE"). Offensive attack rows must surface as
 * usable attacks, not utilities.
 */
function classifyArtifactRowType(rowType) {
    const t = String(rowType || '').trim().toLowerCase();
    if (!t)
        return 'passive';
    if (t.includes('reaction'))
        return 'reaction';
    if (t.includes('movement'))
        return 'movement';
    if (t.includes('active buff') || t.includes('active-buff') || (t.includes('buff') && !t.includes('debuff'))) {
        return 'activeBuff';
    }
    // Titan Growth / size Transformation — activatable utility (not a Passive).
    if (t.includes('transformation'))
        return 'utility';
    // "Support" / "Stone Power Support" rows (e.g. Soul Shell 1) only pre-fill
    // Stone Power lanes. There is nothing to click, so they stay out of the radial.
    if (t.includes('stone') || t.includes('support'))
        return 'support';
    // Offensive / attack-delivering rows (catalog martial + zone/aoe labels).
    if (t.includes('aoe') ||
        t.includes('attack') ||
        t.includes('zone') ||
        t.includes('barrier') ||
        t.includes('damage') ||
        t === 'melee' ||
        t === 'ranged' ||
        t.startsWith('melee ') ||
        t.startsWith('ranged ')) {
        return 'attack';
    }
    // Core handwritten Dragon Head Breath rows use "Artifact Active" (not "Active"
    // and not "Melee AoE"). That label must surface as a combat attack — otherwise
    // Breath Weapon is classified as passive and never reaches the radial menu.
    if (t.includes('artifact active') || t.startsWith('active') || t === 'ultimate') {
        return 'attack';
    }
    return 'passive';
}
/** Parse a range string ("8m", "12 m", "Self", "Touch") to meters. */
function parseRowRange(raw) {
    const s = String(raw || '').trim().toLowerCase();
    if (!s)
        return undefined;
    if (s === 'self' || s === 'touch' || s === 'melee' || s === '0m' || s === '0')
        return 0;
    const m = s.match(/(\d+(?:\.\d+)?)\s*m/);
    if (m)
        return parseFloat(m[1]);
    return undefined;
}
/** Parse AoE shape + radius from a row's `aoe` string (e.g. "Radius 3m", "Cone 6m", "Line 8m"). */
function parseRowAoe(raw) {
    const s = String(raw || '').trim().toLowerCase();
    if (!s || s === '—' || s === 'n/a')
        return { shape: 'none' };
    const num = s.match(/(\d+(?:\.\d+)?)\s*m/);
    const radiusM = num ? parseFloat(num[1]) : undefined;
    if (s.includes('cone'))
        return { shape: 'cone', radiusM };
    if (s.includes('line'))
        return { shape: 'line', radiusM };
    if (s.includes('radius') || s.includes('burst') || s.includes('aura') || s.includes('zone') || radiusM !== undefined) {
        return { shape: 'radius', radiusM };
    }
    return { shape: 'none' };
}
/** True when the actor already has a power they can fire as an attack (e.g. Single Attack). */
function actorHasOwnActivePower(actor) {
    const items = actor?.items ? Array.from(actor.items) : [];
    return items.some((item) => {
        if (item?.type !== 'power')
            return false;
        if (item.system?.showInRadialMenu === false)
            return false;
        const powerType = String(item.system?.powerType || '').toLowerCase();
        return powerType === 'active';
    });
}
/** Natural weapon profile (Dragon Head Bite) — never a leftover 1d8 on armor / staff / lantern. */
function isDeclaredNaturalWeapon(sys) {
    const aw = sys?.artifactWeapon;
    if (sys?.naturalWeapon)
        return true;
    if (aw?.isNatural === true || aw?.naturalWeapon === true)
        return true;
    const profile = String(sys?.baseProfile || '');
    const kind = String(sys?.artifactKind || '');
    if (kind === 'weapon' || kind === 'armor' || kind === 'shield')
        return false;
    return (profile === 'headArmor' || profile === 'head') && !!String(aw?.name || '').trim();
}
/**
 * Standalone "swing this artifact" buttons are opt-in for weapon-kind artifacts
 * only when the actor has no own Active (no Single Attack). Declared natural
 * weapons (Bite) are a free weapon-source toggle, not an Attack Action.
 * Everything else (armor, shield, lantern, staff, feet, missing kind) stays out.
 */
function shouldEmitArtifactWeaponAttack(sys, actorHasActivePower) {
    const aw = sys?.artifactWeapon;
    if (!aw?.damage)
        return false;
    if (isDeclaredNaturalWeapon(sys))
        return false;
    if (String(sys?.artifactKind || '') !== 'weapon')
        return false;
    return !actorHasActivePower;
}
function isArtifactEquipped(item) {
    if (!item)
        return false;
    if (getArtifactBindingKind(item) === 'echo')
        return true;
    if (item.system?.equipped === true)
        return true;
    try {
        const flagSlot = item.getFlag?.('mastery-system', 'equipment')?.slot;
        if (typeof flagSlot === 'string' && flagSlot.length > 0)
            return true;
    }
    catch {
        // ignore
    }
    return false;
}
function rowDescription(row) {
    const segs = [];
    if (row.effect)
        segs.push(row.effect);
    if (row.range)
        segs.push(`Range: ${row.range}`);
    if (row.duration)
        segs.push(`Duration: ${row.duration}`);
    if (row.special)
        segs.push(row.special);
    return segs.join(' · ');
}
/** Heal / Cleanse support actives on artifacts (Moonlight Mending, …). */
function artifactRowSupportProfile(row) {
    const tid = String(row.powerTemplateId || '');
    if (/heal-cleanse/i.test(tid) ||
        /aoe-restoration/i.test(tid) ||
        (/\bheal\b/i.test(tid) && !/cleanse|dispel/i.test(tid))) {
        return 'heal';
    }
    if (/\bcleanse\b/i.test(tid) && !/heal/i.test(tid))
        return 'cleanse';
    const blob = `${row.name || ''} ${row.effect || ''} ${row.special || ''}`;
    // R-05: authored Restoration rows (Hearth Circle, Remembered Hands, …) have no template id.
    if (/\b(?:single target|aoe)\s+restoration\b/i.test(blob))
        return 'heal';
    if (/\bcleanse\b/i.test(blob) && !/\bheal\b/i.test(blob))
        return 'cleanse';
    if (/\bheal\b/i.test(blob) && !/\b(requiem|exorcism|damage)\b/i.test(blob))
        return 'heal';
    if (/\bheal\b/i.test(blob) && /\d+\s*d\s*8/i.test(blob))
        return 'heal';
    return null;
}
/**
 * Build radial-menu options derived from every equipped artifact on `actor`.
 * Returns `[]` when the actor has no artifacts or none are equipped.
 */
export function buildArtifactRadialOptions(actor) {
    const out = [];
    if (!actor?.items)
        return out;
    const items = Array.from(actor.items);
    for (const item of items) {
        if (item?.type !== 'artifact')
            continue;
        if (!isArtifactEquipped(item))
            continue;
        // Inactive (not yet activated) artifacts grant NO powers and no own
        // attack entry. Their weapon damage still applies via the normal
        // weapon-resolution pipeline (generic "Weapon Attack" / weapon powers).
        if (!artifactPowersUnlocked(actor, item))
            continue;
        const sys = item.system || {};
        const currentLevel = Number(sys.currentLevel) || Number(sys.level) || 1;
        const progression = Array.isArray(sys.levelProgression)
            ? sys.levelProgression
            : [];
        const hasOwnActivePower = actorHasOwnActivePower(actor);
        // Natural weapons (Bite) are never listed in the radial Attack ring —
        // Breath Weapon on the same artifact carries them via forcedWeaponItemId.
        // Weapon-kind artifacts keep a swing button only when the actor has no
        // Single Attack / another Active.
        const aw = sys.artifactWeapon;
        if (!(isDeclaredNaturalWeapon(sys) && aw?.damage) &&
            shouldEmitArtifactWeaponAttack(sys, hasOwnActivePower)) {
            const isRangedWeapon = resolveArtifactWeaponKind(aw, sys.baseProfile) === 'ranged';
            const isWeaponKind = sys.artifactKind === 'weapon';
            // Strip the generated " - Level N-M" suffix so the radial shows a
            // clean weapon name (e.g. "Dragon Claws" instead of "… - Level 5-1").
            const cleanItemName = String(item.name || '').replace(/\s*-\s*Level\s+\d+-\d+\s*$/i, '').trim();
            const wName = (typeof aw.name === 'string' && aw.name.trim()) ||
                cleanItemName ||
                (isWeaponKind ? 'Artifact Weapon' : 'Natural Weapon');
            const wRange = formatArtifactWeaponRangeDisplay(aw, sys.baseProfile).meters;
            out.push({
                id: `artifact-weapon:${item.id}`,
                name: wName,
                description: `${isRangedWeapon ? 'Ranged' : 'Melee'} ${isWeaponKind ? 'artifact weapon' : 'natural weapon'} · Damage ${aw.damage}`,
                slot: 'attack',
                source: 'power',
                range: wRange,
                forcedWeaponItemId: item.id,
                tags: [
                    'artifact',
                    'attack',
                    isWeaponKind ? 'weapon-artifact-attack' : 'natural-weapon',
                ],
                costsMovement: false,
                costsAction: true,
                defaultTargetGroup: 'enemy',
            });
        }
        // Collapse staged lines to the single best stage per slot (matches the
        // sheet): Titan Growth I/II/III surfaces as just the current stage, not
        // three separate radial entries.
        const rows = visibleAbilityRows(progression, currentLevel);
        for (const row of rows) {
            const lvl = Number(row.level) || 1;
            if (lvl > currentLevel)
                continue;
            const rowType = String(row.type || '').trim();
            const name = row.name || `${item.name} L${lvl}`;
            // Breath Weapon must always be an attack option (Damage + Ruin modes),
            // even when an older embed still carries a non-martial type label.
            let category = classifyArtifactRowType(rowType);
            if (category === 'passive' && isBreathWeaponName(name)) {
                category = 'attack';
            }
            // Passives are descriptive only; Reactions are surfaced via the
            // defender-reactions pipeline; Stone Power Supports have no action
            // at all. None of them belong in the active radial.
            if (category === 'passive' || category === 'reaction' || category === 'support')
                continue;
            const id = `artifact:${item.id}:${lvl}:${rowType}`;
            const description = rowDescription(row);
            const typeTag = rowType.toLowerCase().replace(/\s+/g, '-') || 'active';
            if (category === 'movement') {
                out.push({
                    id,
                    name,
                    description,
                    slot: 'movement',
                    source: 'power',
                    range: parseRowRange(row.range) ?? 0,
                    item,
                    powerType: 'movement',
                    tags: ['artifact', typeTag],
                    costsMovement: true,
                    costsAction: false,
                });
                continue;
            }
            if (category === 'activeBuff') {
                out.push({
                    id,
                    name,
                    description,
                    slot: 'utility',
                    source: 'power',
                    range: 0,
                    item,
                    powerType: 'active-buff',
                    tags: ['artifact', 'active-buff', typeTag],
                    costsMovement: false,
                    costsAction: true,
                    defaultTargetGroup: 'self',
                    artifactRowSpecial: row.special || '',
                    artifactRowLevel: lvl,
                    artifactPowerTemplateId: row.powerTemplateId || undefined,
                });
                continue;
            }
            if (category === 'utility' && /transformation/i.test(rowType)) {
                out.push({
                    id,
                    name,
                    description,
                    slot: 'utility',
                    source: 'power',
                    range: 0,
                    item,
                    powerType: 'utility',
                    tags: ['artifact', 'transformation', typeTag],
                    costsMovement: false,
                    costsAction: true,
                    defaultTargetGroup: 'self',
                    aoeShape: 'none',
                    aoePlacementProfile: 'utility',
                    artifactRowSpecial: row.special || '',
                    artifactRowLevel: lvl,
                });
                continue;
            }
            if (category === 'utility') {
                out.push({
                    id,
                    name,
                    description,
                    slot: 'utility',
                    source: 'power',
                    range: parseRowRange(row.range) ?? 0,
                    item,
                    powerType: 'utility',
                    tags: ['artifact', typeTag],
                    costsMovement: false,
                    costsAction: true,
                    allowManualTargetSelection: true,
                    defaultTargetGroup: 'ally',
                    aoeShape: 'none',
                    aoePlacementProfile: 'utility',
                });
                continue;
            }
            // ── Attack: offensive artifact power (Melee / Ranged / AoE / Zone) ──
            const range = parseRowRange(row.range) ?? 0;
            const aoe = parseRowAoe(row.aoe);
            const option = {
                id,
                name,
                description,
                slot: 'attack',
                source: 'power',
                range,
                item,
                powerType: 'active',
                tags: ['artifact', 'attack', typeTag],
                costsMovement: false,
                costsAction: true,
                artifactRowLevel: lvl,
            };
            // The artifact's own (non-spell) attacks are always delivered
            // through its weapon (melee OR ranged) — force it so a melee
            // artifact weapon's dice also back the artifact's own ranged
            // attack rows. Spell rows keep their own damage instead.
            if (!(row.isSpell && row.powerTemplateId) && artifactCarriesWeaponProfile(item)) {
                option.forcedWeaponItemId = item.id;
            }
            // Limited Instant AoE Spells (Moonlight Judgment): no weapon/focus, Limited dice.
            if (/moonlight\s*judgment/i.test(name) || /limited/i.test(String(row.special || ''))) {
                option.ignoreWeaponDamage = true;
                option.artifactLimited = true;
            }
            if (row.powerTemplateId) {
                option.artifactPowerTemplateId = row.powerTemplateId;
                option.artifactChosenSpecialKey = row.chosenSpecialKey;
                option.artifactRowSpecial = row.special || '';
            }
            if (row.isSpell && row.powerTemplateId) {
                option.artifactIsSpell = true;
                option.artifactCastingAttribute = row.castingAttribute || 'intellect';
                option.artifactSpellResolution = row.spellResolution || 'spellAttack';
            }
            if (aoe.shape !== 'none' && (aoe.radiusM ?? 0) > 0) {
                option.aoeShape = aoe.shape;
                option.aoeRadiusMeters =
                    (aoe.radiusM ?? 0) + getEffectiveCircularAoeRadiusBonusMeters(actor);
                option.defaultTargetGroup = 'enemy';
                // Melee / Self AoE: self-centered burst. Everything else with a
                // cast range (incl. type "Active" + "68 m" + Radius 7 m) is a
                // placeable hostile zone — not cast-range as the AoE footprint.
                const meleeLike = /melee/i.test(rowType) || range === 0 || (row.range || '').trim().toLowerCase() === 'self';
                if (meleeLike) {
                    option.burstMeleeAoE = true;
                    option.burstMeleeRadiusMeters = aoe.radiusM;
                    option.range = aoe.radiusM ?? range;
                    option.rangeMeters = option.range;
                    option.meleeReachMeters = aoe.radiusM;
                }
                else {
                    option.rangeMeters = range > 0 ? range : 0;
                    option.allowManualTargetSelection = true;
                    option.aoePlacementProfile = 'hostile-zone';
                }
                if (row.duration)
                    option.zoneDurationNote = row.duration;
            }
            else {
                option.defaultTargetGroup = 'enemy';
            }
            // Dragon Head Breath: Damage + Ruin (shared use). Cone specialty (aimed from
            // caster) — still Instant Melee AoE: one shared roll vs each Evade, no Primary.
            if (isBreathWeaponName(name)) {
                const dmgL = breathDamageConeMeters(currentLevel);
                const ruinL = breathRuinConeMeters(currentLevel);
                const ruinV = breathRuinValue(currentLevel);
                const poolPreview = damageBreathSharedPoolFormula(currentLevel);
                const stageSuffix = (name.match(/\s(I{1,3})\b/) || [])[1] || '';
                const damageOpt = {
                    ...option,
                    id: `${id}:damage`,
                    name: stageSuffix ? `Damage Breath ${stageSuffix}` : 'Damage Breath',
                    description: `${description} · Damage Breath · shared pool ${poolPreview} · Cone ${dmgL} m · Might or Agility`,
                    aoeShape: 'cone',
                    aoeRadiusMeters: dmgL,
                    range: 0,
                    rangeMeters: 0,
                    burstMeleeAoE: false,
                    burstMeleeRadiusMeters: undefined,
                    meleeReachMeters: undefined,
                    defaultTargetGroup: 'enemy',
                    allowManualTargetSelection: true,
                    aoePlacementProfile: undefined,
                    ignoreWeaponDamage: false,
                    dragonHeadDamageBreath: true,
                    dragonHeadBreathMode: 'damage',
                    forcedWeaponItemId: item.id,
                    artifactRowSpecial: '',
                };
                const ruinOpt = {
                    ...option,
                    id: `${id}:ruin`,
                    name: stageSuffix ? `Ruin Breath ${stageSuffix}` : 'Ruin Breath',
                    description: `${description} · Ruin Breath · Ruin(${ruinV}) · Cone ${ruinL} m · no damage · Might or Agility`,
                    aoeShape: 'cone',
                    aoeRadiusMeters: ruinL,
                    range: 0,
                    rangeMeters: 0,
                    burstMeleeAoE: false,
                    burstMeleeRadiusMeters: undefined,
                    meleeReachMeters: undefined,
                    defaultTargetGroup: 'enemy',
                    allowManualTargetSelection: true,
                    aoePlacementProfile: undefined,
                    ignoreWeaponDamage: true,
                    dragonHeadDamageBreath: false,
                    dragonHeadBreathMode: 'ruin',
                    forcedWeaponItemId: undefined,
                    artifactPowerTemplateId: undefined,
                    artifactRowSpecial: `Ruin(${ruinV})`,
                };
                out.push(damageOpt);
                out.push(ruinOpt);
                continue;
            }
            // Support heals/cleanses are type "Active" but must not use hostile red aim.
            const support = artifactRowSupportProfile(row);
            if (support === 'heal' || support === 'cleanse') {
                option.defaultTargetGroup = 'ally';
                option.allowManualTargetSelection = true;
                option.aoePlacementProfile = support;
                option.tags = [
                    ...(option.tags || []).filter((t) => t !== 'attack'),
                    support,
                ];
                // Melee / Self support AoE: centered on caster (no place-cursor, no hostile burst dialog).
                if (option.burstMeleeAoE || range === 0 || /melee/i.test(rowType)) {
                    option.burstMeleeAoE = false;
                    option.burstMeleeRadiusMeters = undefined;
                    option.rangeMeters = 0;
                    option.range = 0;
                }
            }
            out.push(option);
        }
    }
    return out;
}
/**
 * Build the list of unlocked artifact Reaction rows on `actor`.
 * Returned shape mirrors `RadialCombatOption` with `slot: 'reaction'`
 * so the defender-reactions pipeline can consume it directly.
 */
export function buildArtifactReactionOptions(actor) {
    const out = [];
    if (!actor?.items)
        return out;
    const items = Array.from(actor.items);
    for (const item of items) {
        if (item?.type !== 'artifact')
            continue;
        if (!isArtifactEquipped(item))
            continue;
        // Inactive artifacts grant no reactions either.
        if (!artifactPowersUnlocked(actor, item))
            continue;
        const sys = item.system || {};
        const currentLevel = Number(sys.currentLevel) || Number(sys.level) || 1;
        const progression = Array.isArray(sys.levelProgression)
            ? sys.levelProgression
            : [];
        for (const row of progression) {
            const lvl = Number(row.level) || 1;
            if (lvl > currentLevel)
                continue;
            if (!REACTION_TYPES.has(String(row.type || '').trim()))
                continue;
            const id = `artifact-reaction:${item.id}:${lvl}`;
            const name = row.name || `${item.name} Reaction L${lvl}`;
            const description = rowDescription(row);
            out.push({
                id,
                name,
                description,
                slot: 'reaction',
                source: 'power',
                range: 0,
                item,
                powerType: 'reaction',
                tags: ['artifact', 'reaction'],
                costsAction: false,
                costsMovement: false,
            });
        }
    }
    return out;
}
//# sourceMappingURL=artifact-options.js.map