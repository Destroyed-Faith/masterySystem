/**
 * Rules for upgrading artifact evolution items on actors (Mastery Rank gates, costs)
 * AND binding rules (Artifact Capacity, Echo-bound, slot blocking).
 *
 * New XP spec — Artifacts:
 *   • Flat 8 XP per +1 artifact level (`ARTIFACT_UPGRADE_XP_COST`).
 *   • Maximum reachable artifact level = `(MR - 1) × 2`, capped at 16
 *     (`getMaxArtifactSystemLevelForMasteryRank`). MR 1 cannot evolve at all.
 *   • Link / activation: 1 Stone once per artifact (`ARTIFACT_LINK_STONE_COST`).
 *   • Per-upgrade Stone costs and the legacy XP Ultimate cost have been removed.
 *
 * New Artifact spec (Artefacts.md):
 *   • Artifact Capacity = flat 4 simultaneous bound Artifacts per character
 *     (`ARTIFACT_CAPACITY_DEFAULT`). Echo Artifacts count against this.
 *   • Bindings come in three flavors: `unbound`, `bound`, `echo`.
 *     `echo` bindings cannot be unbound through normal means.
 */
import { getActionEconomyActor, STONE_POOL_ATTRIBUTE_KEYS, } from '../combat/action-economy.js';
import { getStoneGemStyle } from './stone-attribute-ui.js';
import { countArtifactActivationStones } from './artifact-stone-bound.js';
import { ARTIFACT_MAX_LEVEL as SPEC_ARTIFACT_MAX_LEVEL, } from './artifact-rules.js';
const STONE_POOL_LABELS = {
    might: 'Might',
    agility: 'Agility',
    vitality: 'Vitality',
    intellect: 'Intellect',
    resolve: 'Resolve',
    influence: 'Influence',
    wits: 'Wits',
};
export const ARTIFACT_UPGRADE_XP_COST = 8;
export const ARTIFACT_LINK_STONE_COST = 1;
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
function economyActor(actor) {
    return getActionEconomyActor(actor) ?? actor;
}
/** Spendable stones in one attribute pool (`current − sustained − artifact-bound`). */
export function poolSpendableStones(actor, attr) {
    const sys = economyActor(actor)?.system || {};
    const pool = sys.stonePools?.[attr];
    if (!pool)
        return 0;
    const max = Math.max(0, Number(pool.max) || 0);
    if (max <= 0)
        return 0;
    const current = Math.max(0, Number(pool.current) || 0);
    const sustained = Math.max(0, Number(pool.sustained) || 0);
    const artifactBound = countArtifactActivationStones(actor, attr);
    return Math.max(0, current - sustained - artifactBound);
}
/** Total spendable stones across all attribute pools (falls back to legacy `stones.current`). */
export function actorStonesCurrent(actor) {
    const sys = economyActor(actor)?.system || {};
    const pools = sys.stonePools;
    if (pools && typeof pools === 'object' && Object.keys(pools).length > 0) {
        let total = 0;
        for (const attr of STONE_POOL_ATTRIBUTE_KEYS) {
            total += poolSpendableStones(actor, attr);
        }
        return total;
    }
    return Math.max(0, Number(sys.stones?.current) || 0);
}
/** True when the actor uses per-attribute `stonePools` (not legacy `stones.current` only). */
export function usesStonePoolEconomy(actor) {
    const pools = economyActor(actor)?.system?.stonePools;
    return !!(pools && typeof pools === 'object' && Object.keys(pools).length > 0);
}
/** Pools the player may choose from when activating an artifact. */
export function listArtifactSpendableStonePools(actor) {
    if (!usesStonePoolEconomy(actor))
        return [];
    const sys = economyActor(actor)?.system || {};
    const pools = sys.stonePools || {};
    const out = [];
    for (const attr of STONE_POOL_ATTRIBUTE_KEYS) {
        const spendable = poolSpendableStones(actor, attr);
        const max = Math.max(0, Number(pools[attr]?.max) || 0);
        if (max <= 0 && spendable <= 0)
            continue;
        const style = getStoneGemStyle(attr) ?? { fill: '#888888', stroke: '#aaaaaa' };
        out.push({
            key: attr,
            label: STONE_POOL_LABELS[attr] || attr,
            spendable,
            fill: style.fill,
            stroke: style.stroke,
            canSpend: spendable >= ARTIFACT_LINK_STONE_COST,
        });
    }
    return out;
}
export function canSpendArtifactLinkStone(actor) {
    return actorStonesCurrent(actor) >= ARTIFACT_LINK_STONE_COST;
}
export function canSpendArtifactLinkStoneFromPool(actor, stoneAttr) {
    return poolSpendableStones(actor, stoneAttr) >= ARTIFACT_LINK_STONE_COST;
}
export function getArtifactStonePoolLabel(attr) {
    return STONE_POOL_LABELS[attr] || attr;
}
/** Deduct one Stone from the chosen attribute pool (or legacy `stones.current`). */
export async function spendArtifactLinkStone(actor, stoneAttr) {
    if (usesStonePoolEconomy(actor)) {
        if (!stoneAttr || !canSpendArtifactLinkStoneFromPool(actor, stoneAttr))
            return false;
        // Permanent commitment is tracked on the artifact via `artifactActivationStoneAttr`;
        // pool refills and the Stone Powers dialog subtract bound stones from spendable.
        return true;
    }
    if (!canSpendArtifactLinkStone(actor))
        return false;
    const sys = economyActor(actor)?.system || {};
    const next = Math.max(0, Number(sys.stones?.current) || 0) - ARTIFACT_LINK_STONE_COST;
    await actor.update({ 'system.stones.current': next });
    return true;
}
/** Refund one activation Stone to the pool it was spent from (GM reset). */
export async function refundArtifactLinkStone(actor, stoneAttr) {
    if (usesStonePoolEconomy(actor)) {
        if (!stoneAttr)
            return false;
        // Bound stone is released when `artifactActivationStoneAttr` is cleared on deactivate.
        return true;
    }
    const sys = economyActor(actor)?.system || {};
    const cur = Math.max(0, Number(sys.stones?.current) || 0);
    const max = Math.max(0, Number(sys.stones?.maximum) || cur + ARTIFACT_LINK_STONE_COST);
    await actor.update({ 'system.stones.current': Math.min(max, cur + ARTIFACT_LINK_STONE_COST) });
    return true;
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
/** True when the artifact occupies a paperdoll slot or is echo-bound (always worn). */
export function isArtifactEquippedOnActor(item) {
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
/**
 * Read whether this embedded artifact is activated for the actor.
 * Echo artifacts use `artifactActivated` on the item; legacy world `linked`
 * alone does not activate Echo items (prevents auto-linked grant state).
 */
export function isArtifactLinkedOnActor(actor, item) {
    if (!item || !actor?.id)
        return false;
    const activated = item.getFlag?.('mastery-system', 'artifactActivated');
    if (activated === true)
        return true;
    if (activated === false)
        return false;
    const kind = getArtifactBindingKind(item);
    if (kind === 'echo')
        return false;
    const rootWorldId = item.getFlag?.('mastery-system', 'evolutionRootItemId');
    if (!rootWorldId)
        return false;
    const root = (typeof game !== 'undefined' ? game?.items?.get(rootWorldId) : null);
    if (!root)
        return false;
    const rootNodeId = root.getFlag?.('mastery-system', 'nodeId');
    if (!rootNodeId)
        return false;
    const actorLevels = (root.getFlag?.('mastery-system', 'actorLevels') || {});
    return readActorArtifactProgress(actorLevels[actor.id], rootNodeId).linked;
}
/** Equipped and activated — required for mechanical artifact benefits. */
export function isArtifactMechanicallyActive(actor, item) {
    if (!item || item.type !== 'artifact')
        return false;
    return isArtifactEquippedOnActor(item) && isArtifactLinkedOnActor(actor, item);
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