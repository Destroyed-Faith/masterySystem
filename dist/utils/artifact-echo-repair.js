/**
 * Repair / sync embedded artifacts against the world Builder-Tree.
 */
import { getWorldArtifactItemsInFolder, resolveWorldItemByNodeId, } from './artifact-actor-tree.js';
import { visibleAbilityRows } from './artifact-visible-abilities.js';
import { wireEmbeddedArtifactToWorldTree, inferArtifactKeyFromName } from './artifact-tree-grant.js';
import { findEchoArtifactRootInWorld } from './seed-artifact-library.js';
/** True when the embedded copy looks stale (missing progression data). */
export function embeddedArtifactNeedsSync(emb) {
    if (!emb || emb.type !== 'artifact')
        return false;
    const sys = emb.system || {};
    const lp = sys.levelProgression;
    const bv = sys.baseValues;
    const hasLp = Array.isArray(lp) && lp.length > 0;
    const hasBv = Array.isArray(bv) && bv.length > 0;
    const echoKey = emb.getFlag?.('mastery-system', 'echoArtifactKey');
    const isTree = !!emb.getFlag?.('mastery-system', 'evolutionRootItemId') ||
        emb.getFlag?.('mastery-system', 'echoBound') ||
        sys.binding === 'echo' ||
        sys.binding === 'bound' ||
        echoKey;
    if (!isTree)
        return false;
    return !hasLp || !hasBv;
}
/** @deprecated Use embeddedArtifactNeedsSync */
export function echoEmbeddedArtifactNeedsSync(emb) {
    return embeddedArtifactNeedsSync(emb);
}
/**
 * Copy name/img/system from the matching world tree node onto the actor item.
 * @returns true when an update was applied.
 */
export async function syncEmbeddedArtifactFromWorldNode(emb, actor) {
    const rootWorldId = emb.getFlag?.('mastery-system', 'evolutionRootItemId');
    const nodeId = emb.getFlag?.('mastery-system', 'evolutionNodeId');
    if (!rootWorldId || !nodeId || !actor?.id)
        return false;
    const root = game.items?.get(rootWorldId);
    if (!root?.folder?.id)
        return false;
    const folderItems = getWorldArtifactItemsInFolder(root.folder.id);
    const worldNode = resolveWorldItemByNodeId(nodeId, folderItems);
    if (!worldNode)
        return false;
    const fi = worldNode;
    await emb.update({
        name: fi.name,
        img: fi.img,
        system: foundry.utils.duplicate(fi.system || {}),
    });
    return true;
}
/**
 * Wire a legacy embedded artifact (no evolution root) to the world tree
 * and refresh its node data.
 */
export async function repairArtifactEvolutionLink(actor, emb) {
    if (emb.getFlag?.('mastery-system', 'evolutionRootItemId'))
        return false;
    const artifactKey = emb.getFlag?.('mastery-system', 'echoArtifactKey') ||
        inferArtifactKeyFromName(emb.name);
    if (artifactKey && !findEchoArtifactRootInWorld(artifactKey)) {
        return false;
    }
    const res = await wireEmbeddedArtifactToWorldTree(actor, emb, { notify: false });
    return res.ok;
}
/** @deprecated Use repairArtifactEvolutionLink */
export async function repairEchoArtifactTreeLink(actor, emb) {
    return repairArtifactEvolutionLink(actor, emb);
}
/**
 * Repair all tree-linked artifacts on an actor: wire missing links, sync stale
 * data from the world library, and ensure activation flags exist.
 */
export async function repairArtifactEvolutionLinks(actor) {
    if (!actor?.items?.filter)
        return 0;
    let fixes = 0;
    const artifacts = Array.from(actor.items.filter((it) => it.type === 'artifact'));
    for (const emb of artifacts) {
        const rootWorldId = emb.getFlag?.('mastery-system', 'evolutionRootItemId');
        if (!rootWorldId) {
            if (await repairArtifactEvolutionLink(actor, emb))
                fixes++;
            continue;
        }
        if (embeddedArtifactNeedsSync(emb)) {
            if (await syncEmbeddedArtifactFromWorldNode(emb, actor))
                fixes++;
        }
        const activated = emb.getFlag?.('mastery-system', 'artifactActivated');
        if (activated !== true && activated !== false) {
            await emb.setFlag('mastery-system', 'artifactActivated', true);
            if (typeof emb.unsetFlag === 'function') {
                await emb.unsetFlag('mastery-system', 'artifactActivationStoneAttr');
            }
            fixes++;
        }
    }
    return fixes;
}
/** @deprecated Use repairArtifactEvolutionLinks */
export async function repairActorEchoArtifacts(actor) {
    return repairArtifactEvolutionLinks(actor);
}
/** Summarize abilities / base values from an embedded artifact for UI panels. */
export function summarizeEmbeddedArtifactDisplay(emb, active) {
    const sys = emb?.system || {};
    const level = Math.max(1, Math.min(10, Number(sys.currentLevel) || Number(sys.level) || 1));
    const baseValues = active
        ? (Array.isArray(sys.baseValues) ? sys.baseValues : []).map((bv) => ({
            label: bv.label || '',
            value: bv.value != null && bv.value !== '' ? String(bv.value) : bv.note || '',
        }))
        : [];
    const abilities = active
        ? visibleAbilityRows(sys.levelProgression, level).map((row) => ({
            name: row.name || '',
            type: row.type || '',
            effect: row.effect || '',
        }))
        : [];
    return { baseValues, abilities, hasBaseValues: baseValues.length > 0, hasAbilities: abilities.length > 0 };
}
//# sourceMappingURL=artifact-echo-repair.js.map