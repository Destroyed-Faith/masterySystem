/**
 * Rules for upgrading artifact evolution items on actors (Mastery Rank gates, costs)
 * AND binding rules (Artifact Capacity, Echo-bound, slot blocking).
 *
 * New XP spec — Artifacts:
 *   • Flat 8 XP per +1 artifact level (`ARTIFACT_UPGRADE_XP_COST`).
 *   • Maximum reachable artifact level = `(MR - 1) × 2`, capped at 16
 *     (`getMaxArtifactSystemLevelForMasteryRank`). MR 1 cannot evolve at all.
 *   • All Stone-based costs (link, upgrade, ultimate) and the legacy XP
 *     Ultimate cost have been removed.
 *
 * New Artifact spec (Artefacts.md):
 *   • Artifact Capacity = flat 4 simultaneous bound Artifacts per character
 *     (`ARTIFACT_CAPACITY_DEFAULT`). Echo Artifacts count against this.
 *   • Bindings come in three flavors: `unbound`, `bound`, `echo`.
 *     `echo` bindings cannot be unbound through normal means.
 */
import { ARTIFACT_MAX_LEVEL as SPEC_ARTIFACT_MAX_LEVEL, } from './artifact-rules.js';
export const ARTIFACT_UPGRADE_XP_COST = 8;
export const ARTIFACT_MAX_SYSTEM_LEVEL = 16;
/**
 * New spec: flat Artifact Capacity. Every character can bind up to four
 * Artifacts at the same time, regardless of Mastery Rank. Echo Artifacts
 * count against this number.
 */
export const ARTIFACT_CAPACITY_DEFAULT = 4;
/**
 * Returns the flat Artifact Capacity for a character. The old MR×2 formula
 * has been replaced by a single value; `masteryRank` is kept in the signature
 * so callers that still pass it do not break.
 */
export function getArtifactCapacityForMasteryRank(_masteryRank) {
    return ARTIFACT_CAPACITY_DEFAULT;
}
/**
 * Max artifact system.level the actor may reach:
 *   `(MR - 1) × 2`, capped at `ARTIFACT_MAX_SYSTEM_LEVEL` (16).
 *   MR 1 → 0 (no link / no upgrades).
 */
export function getMaxArtifactSystemLevelForMasteryRank(masteryRank) {
    const mr = Math.max(1, Math.floor(Number(masteryRank) || 1));
    if (mr <= 1)
        return 0;
    return Math.min(ARTIFACT_MAX_SYSTEM_LEVEL, (mr - 1) * 2);
}
/**
 * Max spec-level (1..10) an actor may reach. Mirrors the spec ARTIFACT_MAX_LEVEL
 * but allows MR gating in the future. For now: MR 2+ may reach level 10.
 */
export function getMaxArtifactSpecLevelForMasteryRank(masteryRank) {
    const mr = Math.max(1, Math.floor(Number(masteryRank) || 1));
    if (mr <= 1)
        return 0;
    // Two spec-levels per MR step → MR2 = 2, MR3 = 3, …, MR6+ = 10.
    return Math.min(SPEC_ARTIFACT_MAX_LEVEL, mr);
}
export function canArtifactLink(masteryRank) {
    return getMaxArtifactSystemLevelForMasteryRank(masteryRank) >= 2;
}
/** Read progress from root item flag (supports legacy number = old "level" only). */
export function readActorArtifactProgress(flagVal, rootNodeId) {
    if (flagVal && typeof flagVal === 'object' && !Array.isArray(flagVal) && typeof flagVal.nodeId === 'string') {
        const o = flagVal;
        return {
            nodeId: String(o.nodeId || rootNodeId),
            linked: Boolean(o.linked),
        };
    }
    if (typeof flagVal === 'number' && flagVal >= 1) {
        return { nodeId: rootNodeId, linked: false };
    }
    return { nodeId: rootNodeId, linked: false };
}
export function serializeActorArtifactProgress(p) {
    return {
        nodeId: p.nodeId,
        linked: p.linked,
    };
}
/**
 * Read the binding kind off an embedded artifact item.
 * - `flags['mastery-system'].echoBound` set → `'echo'`
 * - `system.binding === 'bound'` OR linked progress on root → `'bound'`
 * - else `'unbound'`
 */
export function getArtifactBindingKind(item) {
    if (!item)
        return 'unbound';
    const echoBound = item.getFlag?.('mastery-system', 'echoBound');
    if (echoBound)
        return 'echo';
    const sysBinding = item.system?.binding;
    if (sysBinding === 'echo')
        return 'echo';
    if (sysBinding === 'bound')
        return 'bound';
    return 'unbound';
}
/**
 * Count how many of the actor's embedded artifact items currently count
 * against Artifact Capacity. An item counts when its binding is `bound`
 * or `echo`. Unbound items in inventory do not count.
 */
export function countBoundArtifacts(actor) {
    if (!actor)
        return 0;
    let count = 0;
    const items = actor.items;
    if (!items?.filter)
        return 0;
    const list = Array.from(items.filter((it) => it.type === 'artifact'));
    for (const it of list) {
        const kind = getArtifactBindingKind(it);
        if (kind === 'bound' || kind === 'echo')
            count++;
    }
    return count;
}
/**
 * True if the actor can bind one more Artifact. Echo-bound artifacts
 * still count against capacity but can never be unbound, so we treat
 * them as occupying a permanent capacity slot.
 */
export function canBindMoreArtifacts(actor) {
    return countBoundArtifacts(actor) < ARTIFACT_CAPACITY_DEFAULT;
}
/**
 * True if the actor can equip an artifact that occupies the given slot keys
 * (paperdoll keys, e.g. `['mainhand','offhand']` for a two-handed weapon).
 * Returns false when any of the requested slots is already occupied by a
 * different artifact / equipped item.
 */
export function canEquipArtifactInSlots(actor, slotKeys) {
    if (!actor || !Array.isArray(slotKeys) || slotKeys.length === 0)
        return false;
    const items = actor.items;
    if (!items?.filter)
        return true;
    const occupied = new Set();
    for (const it of Array.from(items)) {
        const flagSlot = it.getFlag?.('mastery-system', 'equipment')?.slot;
        if (typeof flagSlot === 'string' && flagSlot)
            occupied.add(flagSlot);
        const sysEq = it.system?.equipped;
        if (sysEq && Array.isArray(it.system?.equipSlots)) {
            for (const s of it.system.equipSlots) {
                if (typeof s === 'string')
                    occupied.add(s);
            }
        }
    }
    return slotKeys.every((s) => !occupied.has(s));
}
/**
 * Look up the canonical artifact slot stored on an item. Falls back to
 * inferring from artifactKind / gearSlot if the new `slot` field is missing.
 */
export function getArtifactSlot(item) {
    if (!item)
        return null;
    const sys = item.system;
    const explicit = sys?.slot;
    if (typeof explicit === 'string' && explicit) {
        return explicit;
    }
    // Legacy fallback — map old artifactKind/gearSlot to canonical slot.
    const kind = String(sys?.artifactKind || 'weapon');
    const hands = Number(sys?.artifactWeapon?.hands || 1);
    if (kind === 'weapon')
        return hands >= 2 ? 'mainHand' : 'mainHand';
    if (kind === 'shield')
        return 'offHand';
    if (kind === 'armor')
        return 'body';
    if (kind === 'gear') {
        const g = String(sys?.gearSlot || '');
        // Canonical paperdoll keys
        if (g === 'head' || g === 'helmet')
            return 'head';
        if (g === 'feet' || g === 'boot')
            return 'feet';
        if (g === 'amulet' || g === 'necklace')
            return 'amulet';
        if (g === 'ring' || g === 'ring1' || g === 'ring2')
            return 'ring';
        if (g === 'body' || g === 'chest')
            return 'body';
    }
    return null;
}
export const TAINT_STAGES = [
    {
        stage: 0,
        name: 'Harmony',
        trigger: 'The bearer lives in alignment with the Taint.',
        effect: 'The item grows as intended. New powers unlock normally.',
    },
    {
        stage: 1,
        name: 'Irritation',
        trigger: 'The Taint is ignored for an extended period.',
        effect: 'No new powers. The item "goes silent."',
    },
    {
        stage: 2,
        name: 'Fracture',
        trigger: 'Repeated, active disobedience or contradictory behavior.',
        effect: 'One ability of the item is blocked or shut down.',
    },
    {
        stage: 3,
        name: 'Wrath',
        trigger: 'Mockery, cleansing, or rejection of the Taint.',
        effect: 'The item harms the bearer (e.g. 1d10 psychic), inflicts nightmares, or imposes disadvantage on checks.',
    },
    {
        stage: 4,
        name: 'Collapse / Corruption',
        trigger: 'Permanent disobedience.',
        effect: 'The item breaks and becomes unusable for this bearer.',
    },
];
export function getTaintStage(stage) {
    const idx = Math.min(4, Math.max(0, Math.floor(Number(stage) || 0)));
    return TAINT_STAGES[idx];
}
//# sourceMappingURL=artifact-actor-rules.js.map