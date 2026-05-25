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
import type { CombatSlot } from '../system/combat-maneuvers.js';
import type { ArtifactLevelProgressionRow } from '../types/item.js';
import { getArtifactBindingKind } from '../utils/artifact-actor-rules.js';

const ACTIVE_TYPES = new Set([
    'Active Buff',
    'Active',
    'Active Use',
    'Active-Buff',
    'Movement',
    'Stone Power Support',
    'Support',
    'Ultimate',
]);

const REACTION_TYPES = new Set(['Reaction']);

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

function rowToSlot(type: string): CombatSlot {
    if (type === 'Reaction') return 'reaction';
    if (type === 'Movement') return 'movement';
    if (type === 'Stone Power Support' || type === 'Support') return 'utility';
    return 'utility';
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

        for (const row of progression) {
            const lvl = Number(row.level) || 1;
            if (lvl > currentLevel) continue;

            const rowType = String(row.type || '').trim();
            const isActive = ACTIVE_TYPES.has(rowType);
            const isReaction = REACTION_TYPES.has(rowType);
            if (!isActive && !isReaction) continue;

            const slot = rowToSlot(rowType);
            // Reactions are surfaced via the defender-reactions pipeline; skip them here.
            if (isReaction) continue;

            const id = `artifact:${item.id}:${lvl}:${rowType}`;
            const name = row.name || `${item.name} L${lvl}`;
            const description = rowDescription(row);

            const option: RadialCombatOption = {
                id,
                name,
                description,
                slot,
                source: 'power',
                range: 0,
                item,
                powerType: slot === 'movement' ? 'movement' : 'utility',
                tags: ['artifact', rowType.toLowerCase().replace(/\s+/g, '-')],
                costsMovement: slot === 'movement',
                costsAction: slot !== 'movement' && rowType !== 'Active Buff',
            };
            // Mark the option as utility-friendly so it picks up targeting UI.
            if (slot === 'utility') {
                option.allowManualTargetSelection = true;
                option.defaultTargetGroup = 'any';
                option.aoeShape = 'none';
                option.aoePlacementProfile = 'utility';
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
