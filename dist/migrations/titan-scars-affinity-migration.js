/**
 * One-shot GM migration: legacy single-key `titanScars` embedded items → one of
 * the seven Attribute-affinity Titan Scars variants (Might / Agility / Vitality /
 * Intellect / Resolve / Influence / Wits).
 *
 * The Titan Scars body artifact now lets the player bind its Stone Pool to any of
 * the 7 Attributes at creation (chosen via the Titanborn `subChoices`). Legacy
 * characters carry the old fixed-Might artifact under the `titanScars` key. This
 * migration:
 *   1. Resolves the affinity from the actor's `system.echo.subChoiceKey` (an
 *      Attribute key), else defaults to `might` (the old fixed pool).
 *   2. Remaps the embedded item to the matching variant tree, preserving the
 *      current evolution node (`titanScars-lN` → `titanScars{Attr}-lN`).
 *   3. Backfills an empty `system.echo.subChoiceKey` to the resolved Attribute so
 *      the creation picker / validation stay consistent.
 */
import { findEchoArtifactRootInWorld, findEchoArtifactWorldItem, } from '../utils/seed-artifact-library.js';
import { readActorArtifactProgress, serializeActorArtifactProgress, } from '../utils/artifact-actor-rules.js';
import { log } from '../utils/logger.js';
const SETTING_NAMESPACE = 'mastery-system';
const ATTR_TO_TITAN_KEY = {
    might: 'titanScarsMight',
    agility: 'titanScarsAgility',
    vitality: 'titanScarsVitality',
    intellect: 'titanScarsIntellect',
    resolve: 'titanScarsResolve',
    influence: 'titanScarsInfluence',
    wits: 'titanScarsWits',
};
/** Resolve the affinity variant key from the actor's chosen sub-choice (else Might). */
function resolveTitanKey(actor) {
    const sub = String(actor.system?.echo?.subChoiceKey || '').toLowerCase();
    const attr = ATTR_TO_TITAN_KEY[sub] ? sub : 'might';
    return { attr, key: ATTR_TO_TITAN_KEY[attr] };
}
function isLegacyTitanScarsItem(item) {
    return (item?.type === 'artifact' &&
        item.getFlag?.(SETTING_NAMESPACE, 'echoArtifactKey') === 'titanScars');
}
/** Migrate legacy `titanScars` actor copies to an Attribute-affinity tree. */
export async function runTitanScarsAffinityMigration(actors) {
    if (!game.user?.isGM)
        return;
    let migrated = 0;
    for (const actor of actors) {
        const legacyItems = Array.from(actor.items || []).filter(isLegacyTitanScarsItem);
        if (legacyItems.length === 0)
            continue;
        const { attr, key: newKey } = resolveTitanKey(actor);
        const newRoot = findEchoArtifactRootInWorld(newKey);
        if (!newRoot)
            continue;
        for (const legacy of legacyItems) {
            const oldNodeId = String(legacy.getFlag(SETTING_NAMESPACE, 'evolutionNodeId') || 'titanScars-l1');
            const levelSuffix = oldNodeId.replace(/^titanScars-/, '');
            const newNodeId = `${newKey}-${levelSuffix}`;
            const targetWorld = findEchoArtifactWorldItem(newKey, (it) => it.getFlag(SETTING_NAMESPACE, 'nodeId') === newNodeId) ||
                newRoot;
            const equip = legacy.getFlag(SETTING_NAMESPACE, 'equipment');
            const sys = foundry.utils.duplicate(targetWorld.system || {});
            await legacy.update({
                name: targetWorld.name,
                img: targetWorld.img,
                system: sys,
                'flags.mastery-system.echoArtifactKey': newKey,
                'flags.mastery-system.echoBound': true,
                'flags.mastery-system.evolutionRootItemId': newRoot.id,
                'flags.mastery-system.evolutionNodeId': newNodeId,
            });
            if (equip) {
                await legacy.setFlag(SETTING_NAMESPACE, 'equipment', equip);
            }
            const actorId = actor.id;
            const levels = { ...(newRoot.getFlag(SETTING_NAMESPACE, 'actorLevels') || {}) };
            const prev = readActorArtifactProgress(levels[actorId], newNodeId);
            levels[actorId] = serializeActorArtifactProgress({
                nodeId: newNodeId,
                linked: prev.linked !== false,
            });
            await newRoot.setFlag(SETTING_NAMESPACE, 'actorLevels', levels);
            migrated += 1;
        }
        // Backfill an empty sub-choice so the creation picker / validation stay valid.
        const echo = actor.system?.echo || {};
        if (echo.key === 'titanborn' && !String(echo.subChoiceKey || '').trim()) {
            try {
                await actor.update({ 'system.echo.subChoiceKey': attr });
            }
            catch (err) {
                console.warn(`Mastery System | Titan Scars migration: could not backfill subChoiceKey on ${actor.name}`, err);
            }
        }
    }
    if (migrated > 0) {
        log.debug(`Migrated ${migrated} legacy Titan Scars item(s) to Attribute-affinity trees.`);
    }
}
//# sourceMappingURL=titan-scars-affinity-migration.js.map