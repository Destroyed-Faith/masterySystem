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

import type { RadialCombatOption } from './types.js';
import type { ArtifactLevelProgressionRow } from '../types/item.js';
import { getArtifactBindingKind } from '../utils/artifact-actor-rules.js';
import { formatArtifactWeaponRangeDisplay, resolveArtifactWeaponKind } from '../utils/artifact-rules.js';
import { visibleAbilityRows } from '../utils/artifact-visible-abilities.js';

const REACTION_TYPES = new Set(['Reaction']);

type ArtifactRowCategory = 'attack' | 'activeBuff' | 'movement' | 'reaction' | 'utility' | 'passive';

/**
 * Classify a Level Progression row `type` into a radial category. The Type
 * column mixes Player's-Guide labels ("Active", "Active Buff", "Movement",
 * "Stone Power Support") with catalog martial/attack labels ("Ranged AoE",
 * "Melee", "Ranged Zone", "Melee AoE"). Offensive attack rows must surface as
 * usable attacks, not utilities.
 */
function classifyArtifactRowType(rowType: string): ArtifactRowCategory {
    const t = String(rowType || '').trim().toLowerCase();
    if (!t) return 'passive';
    if (t.includes('reaction')) return 'reaction';
    if (t.includes('movement')) return 'movement';
    if (t.includes('active buff') || t.includes('active-buff') || (t.includes('buff') && !t.includes('debuff'))) {
        return 'activeBuff';
    }
    if (t.includes('stone') || t.includes('support')) return 'utility';
    // Offensive / attack-delivering rows (catalog martial + zone/aoe labels).
    if (
        t.includes('aoe') ||
        t.includes('attack') ||
        t.includes('zone') ||
        t.includes('barrier') ||
        t.includes('damage') ||
        t === 'melee' ||
        t === 'ranged' ||
        t.startsWith('melee ') ||
        t.startsWith('ranged ')
    ) {
        return 'attack';
    }
    if (t.startsWith('active') || t === 'ultimate') return 'attack';
    return 'passive';
}

/** Parse a range string ("8m", "12 m", "Self", "Touch") to meters. */
function parseRowRange(raw: string | undefined): number | undefined {
    const s = String(raw || '').trim().toLowerCase();
    if (!s) return undefined;
    if (s === 'self' || s === 'touch' || s === 'melee' || s === '0m' || s === '0') return 0;
    const m = s.match(/(\d+(?:\.\d+)?)\s*m/);
    if (m) return parseFloat(m[1]);
    return undefined;
}

/** Parse AoE shape + radius from a row's `aoe` string (e.g. "Radius 3m", "Cone 6m", "Line 8m"). */
function parseRowAoe(raw: string | undefined): { shape: 'none' | 'radius' | 'cone' | 'line'; radiusM?: number } {
    const s = String(raw || '').trim().toLowerCase();
    if (!s || s === '—' || s === 'n/a') return { shape: 'none' };
    const num = s.match(/(\d+(?:\.\d+)?)\s*m/);
    const radiusM = num ? parseFloat(num[1]) : undefined;
    if (s.includes('cone')) return { shape: 'cone', radiusM };
    if (s.includes('line')) return { shape: 'line', radiusM };
    if (s.includes('radius') || s.includes('burst') || s.includes('aura') || s.includes('zone') || radiusM !== undefined) {
        return { shape: 'radius', radiusM };
    }
    return { shape: 'none' };
}

function isArtifactEquipped(item: any): boolean {
    if (!item) return false;
    if (getArtifactBindingKind(item) === 'echo') return true;
    if ((item.system as any)?.equipped === true) return true;
    try {
        const flagSlot = item.getFlag?.('mastery-system', 'equipment')?.slot;
        if (typeof flagSlot === 'string' && flagSlot.length > 0) return true;
    } catch {
        // ignore
    }
    return false;
}

function rowDescription(row: ArtifactLevelProgressionRow): string {
    const segs: string[] = [];
    if (row.effect) segs.push(row.effect);
    if (row.range) segs.push(`Range: ${row.range}`);
    if (row.duration) segs.push(`Duration: ${row.duration}`);
    if (row.special) segs.push(row.special);
    return segs.join(' · ');
}

/**
 * Build radial-menu options derived from every equipped artifact on `actor`.
 * Returns `[]` when the actor has no artifacts or none are equipped.
 */
export function buildArtifactRadialOptions(actor: any): RadialCombatOption[] {
    const out: RadialCombatOption[] = [];
    if (!actor?.items) return out;

    const items: any[] = Array.from(actor.items);
    for (const item of items) {
        if (item?.type !== 'artifact') continue;
        if (!isArtifactEquipped(item)) continue;

        const sys = (item.system as any) || {};
        const currentLevel = Number(sys.currentLevel) || Number(sys.level) || 1;
        const progression: ArtifactLevelProgressionRow[] = Array.isArray(sys.levelProgression)
            ? sys.levelProgression
            : [];

        // Artifact / natural weapon → a usable attack that always rolls this
        // weapon's damage (forcedWeaponItemId). Two flavours:
        //   • weapon-kind artifact (Dragon Claws): this IS the actor's weapon, so
        //     it REPLACES the generic "Weapon Attack" (tagged weapon-artifact-attack).
        //   • naturalWeapon on a non-weapon slot (Dragon Head Bite): an EXTRA
        //     natural attack alongside the normal weapon.
        const aw = sys.artifactWeapon;
        if (aw && aw.damage) {
            const isRangedWeapon = resolveArtifactWeaponKind(aw, sys.baseProfile) === 'ranged';
            const isWeaponKind = sys.artifactKind === 'weapon';
            // Strip the generated " - Level N-M" suffix so the radial shows a
            // clean weapon name (e.g. "Dragon Claws" instead of "… - Level 5-1").
            const cleanItemName = String(item.name || '').replace(/\s*-\s*Level\s+\d+-\d+\s*$/i, '').trim();
            const wName =
                (typeof aw.name === 'string' && aw.name.trim()) ||
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
            if (lvl > currentLevel) continue;

            const rowType = String(row.type || '').trim();
            const category = classifyArtifactRowType(rowType);
            // Passives are descriptive only; Reactions are surfaced via the
            // defender-reactions pipeline. Neither belongs in the active radial.
            if (category === 'passive' || category === 'reaction') continue;

            const id = `artifact:${item.id}:${lvl}:${rowType}`;
            const name = row.name || `${item.name} L${lvl}`;
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
            const isRanged = /ranged|zone/i.test(rowType);
            const option: RadialCombatOption = {
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
            if (row.isSpell && row.powerTemplateId) {
                option.artifactIsSpell = true;
                option.artifactCastingAttribute = row.castingAttribute || 'intellect';
                option.artifactSpellResolution = row.spellResolution || 'spellAttack';
                option.artifactPowerTemplateId = row.powerTemplateId;
                option.artifactChosenSpecialKey = row.chosenSpecialKey;
            }
            if (aoe.shape !== 'none') {
                option.aoeShape = aoe.shape;
                option.aoeRadiusMeters = aoe.radiusM;
                option.rangeMeters = isRanged ? range : 0;
                option.defaultTargetGroup = 'enemy';
                option.allowManualTargetSelection = true;
                option.aoePlacementProfile = 'hostile-zone';
                if (row.duration) option.zoneDurationNote = row.duration;
            } else {
                option.defaultTargetGroup = 'enemy';
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
export function buildArtifactReactionOptions(actor: any): RadialCombatOption[] {
    const out: RadialCombatOption[] = [];
    if (!actor?.items) return out;

    const items: any[] = Array.from(actor.items);
    for (const item of items) {
        if (item?.type !== 'artifact') continue;
        if (!isArtifactEquipped(item)) continue;

        const sys = (item.system as any) || {};
        const currentLevel = Number(sys.currentLevel) || Number(sys.level) || 1;
        const progression: ArtifactLevelProgressionRow[] = Array.isArray(sys.levelProgression)
            ? sys.levelProgression
            : [];

        for (const row of progression) {
            const lvl = Number(row.level) || 1;
            if (lvl > currentLevel) continue;
            if (!REACTION_TYPES.has(String(row.type || '').trim())) continue;

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
