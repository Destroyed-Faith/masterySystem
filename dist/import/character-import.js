/**
 * Import homepage character JSON into Foundry actors.
 */
import { repairArtifactEvolutionLinks } from '../utils/artifact-echo-repair.js';
import { getWorldArtifactItemsInFolder, resolveWorldItemByNodeId, } from '../utils/artifact-actor-tree.js';
import { grantArtifactTreeToActor } from '../utils/artifact-tree-grant.js';
import { findEchoArtifactRootInWorld } from '../utils/seed-artifact-library.js';
import { upsertRootActorProgress } from '../utils/world-artifact-flag-sync.js';
import { grantPowerSpecs } from '../utils/power-item-builder.js';
import { buildActorCreateDataFromPayload, buildGearItemData, resolvePowerGrantSpecs, } from './character-import-build.js';
import { CHARACTER_IMPORT_EXPORT_KIND, FOUNDRY_ACTOR_IMPORT_EXPORT_KIND, } from './character-import-types.js';
import { parseCharacterImportJson, validateCharacterImportDocument, validateCharacterImportJson, } from './character-import-validation.js';
function deepClone(value) {
    return foundry.utils.deepClone(value);
}
function sanitizeFoundryActorImportData(actorData) {
    const clone = deepClone(actorData);
    delete clone._id;
    delete clone.id;
    const items = Array.isArray(clone.items)
        ? clone.items.map((item) => {
            const ic = deepClone(item);
            delete ic._id;
            delete ic.id;
            return ic;
        })
        : [];
    delete clone.items;
    clone.type = 'character';
    if (!clone.system || typeof clone.system !== 'object') {
        clone.system = {};
    }
    const system = clone.system;
    if (!system.creation || typeof system.creation !== 'object') {
        system.creation = { complete: true, importSource: 'homepage' };
    }
    else {
        system.creation.importSource = 'homepage';
    }
    return { actor: clone, items };
}
async function setEmbeddedArtifactToLevel(actor, emb, artifactKey, level, linked) {
    const clamped = Math.max(1, Math.min(10, Math.floor(level)));
    const targetNodeId = `${artifactKey}-l${clamped}`;
    let rootWorldId = emb.getFlag?.('mastery-system', 'evolutionRootItemId');
    let root = rootWorldId ? game.items?.get(rootWorldId) : null;
    if (!root) {
        root = findEchoArtifactRootInWorld(artifactKey);
        rootWorldId = root?.id;
    }
    if (!root?.folder?.id) {
        throw new Error(`Artifact world tree for "${artifactKey}" not found. Seed the artifact library first.`);
    }
    const folderItems = getWorldArtifactItemsInFolder(root.folder.id);
    const targetWorld = resolveWorldItemByNodeId(targetNodeId, folderItems);
    if (!targetWorld) {
        throw new Error(`Artifact node "${targetNodeId}" not found in world library.`);
    }
    await emb.update({
        name: targetWorld.name,
        img: targetWorld.img,
        system: deepClone(targetWorld.system || {}),
    });
    await emb.setFlag('mastery-system', 'evolutionRootItemId', root.id);
    await emb.setFlag('mastery-system', 'evolutionNodeId', targetNodeId);
    await emb.setFlag('mastery-system', 'echoArtifactKey', artifactKey);
    await upsertRootActorProgress(root, actor.id, {
        nodeId: targetNodeId,
        linked,
    });
}
async function importArtifactSpec(actor, spec) {
    const key = String(spec.key).trim();
    const level = Math.max(1, Math.min(10, Math.floor(Number(spec.level) || 1)));
    const activated = spec.activated === true;
    const stoneAttr = String(spec.activationStoneAttribute ?? '').trim().toLowerCase();
    let emb = await grantArtifactTreeToActor(actor, key);
    if (!emb) {
        throw new Error(`Could not grant artifact "${key}". Ensure the GM has seeded the artifact library.`);
    }
    if (level > 1) {
        await setEmbeddedArtifactToLevel(actor, emb, key, level, activated);
        emb = actor.items.get(emb.id) ?? emb;
    }
    if (activated) {
        await emb.setFlag('mastery-system', 'artifactActivated', true);
        if (stoneAttr) {
            await emb.setFlag('mastery-system', 'artifactActivationStoneAttr', stoneAttr);
        }
        const rootWorldId = emb.getFlag?.('mastery-system', 'evolutionRootItemId');
        const root = rootWorldId ? game.items?.get(rootWorldId) : findEchoArtifactRootInWorld(key);
        const nodeId = emb.getFlag?.('mastery-system', 'evolutionNodeId') ||
            `${key}-l${level}`;
        if (root) {
            await upsertRootActorProgress(root, actor.id, { nodeId, linked: true });
        }
    }
    if (spec.equipped !== false) {
        const sys = emb.system ?? {};
        const slots = Array.isArray(sys.equipSlots) ? sys.equipSlots : [];
        const slot = slots[0] ?? (sys.slot === 'bothHands' ? 'mainhand' : String(sys.gearSlot || 'body'));
        if (slot) {
            await emb.setFlag('mastery-system', 'equipment', { slot });
            if (sys.equipped !== true) {
                await emb.update({ 'system.equipped': true });
            }
        }
    }
}
async function importCharacterPayload(payload, warnings) {
    const specs = resolvePowerGrantSpecs(payload);
    if (!specs || specs.length === 0) {
        throw new Error('No power grants could be resolved.');
    }
    const actorData = buildActorCreateDataFromPayload(payload);
    const actor = await Actor.create(actorData);
    if (!actor)
        throw new Error('Actor.create failed.');
    await grantPowerSpecs(actor, specs);
    const gear = payload.equipment?.gear ?? [];
    if (gear.length > 0) {
        const gearItems = gear.map((g) => buildGearItemData(g));
        await actor.createEmbeddedDocuments('Item', gearItems);
    }
    for (const art of payload.artifacts ?? []) {
        try {
            await importArtifactSpec(actor, art);
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            warnings.push(`Artifact "${art.key}": ${msg}`);
        }
    }
    await repairArtifactEvolutionLinks(actor);
    return actor;
}
async function importFoundryActorDocument(doc, warnings) {
    const { actor: actorData, items } = sanitizeFoundryActorImportData(doc.actor);
    const actor = await Actor.create(actorData);
    if (!actor)
        throw new Error('Actor.create failed.');
    if (items.length > 0) {
        await actor.createEmbeddedDocuments('Item', items);
    }
    const artifactWarnings = await repairArtifactEvolutionLinks(actor);
    if (artifactWarnings > 0) {
        warnings.push(`Repaired ${artifactWarnings} artifact link(s) after import.`);
    }
    return actor;
}
export { parseCharacterImportJson, validateCharacterImportDocument, validateCharacterImportJson };
/**
 * Import a parsed document and create a new character actor.
 * Requires a GM-connected client with permission to create actors.
 */
export async function importMasteryCharacter(doc) {
    const validation = validateCharacterImportDocument(doc);
    if (!validation.ok) {
        return { ok: false, errors: validation.errors, warnings: validation.warnings };
    }
    if (!game.user?.isGM) {
        return { ok: false, errors: ['Only the GM can import characters.'] };
    }
    const warnings = [...validation.warnings];
    try {
        let actor;
        const kind = String(doc.exportKind ?? '');
        if (kind === FOUNDRY_ACTOR_IMPORT_EXPORT_KIND) {
            actor = await importFoundryActorDocument(doc, warnings);
        }
        else if (kind === CHARACTER_IMPORT_EXPORT_KIND) {
            actor = await importCharacterPayload(doc.character, warnings);
        }
        else {
            return { ok: false, errors: [`Unsupported exportKind "${kind}".`] };
        }
        ui.notifications?.info(`Character "${actor.name}" imported.`);
        return { ok: true, actor, warnings };
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { ok: false, errors: [msg], warnings };
    }
}
/** Parse JSON text and import. */
export async function importMasteryCharacterFromJson(text) {
    const doc = parseCharacterImportJson(text);
    return importMasteryCharacter(doc);
}
export async function importMasteryCharacterFromFile(file) {
    const text = await file.text();
    return importMasteryCharacterFromJson(text);
}
//# sourceMappingURL=character-import.js.map