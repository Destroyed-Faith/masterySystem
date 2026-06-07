/**
 * One-shot GM migration (v0.9.23): Echo artifact activation flags + stale embed sync.
 *
 * • Sets `artifactActivated` on embedded echo items (false unless already true).
 * • Clears legacy auto-`linked: true` on world roots for echo artifacts.
 * • Syncs embedded copies missing baseValues / levelProgression from world tree.
 */
import { getArtifactBindingKind, readActorArtifactProgress, serializeActorArtifactProgress, } from '../utils/artifact-actor-rules.js';
import { echoEmbeddedArtifactNeedsSync, repairActorEchoArtifacts, syncEmbeddedArtifactFromWorldNode, } from '../utils/artifact-echo-repair.js';
const SETTING_NAMESPACE = 'mastery-system';
const SETTING_KEY = 'artifactEchoActivationV2Run';
export function registerArtifactEchoActivationMigrationSetting() {
    try {
        game.settings.register(SETTING_NAMESPACE, SETTING_KEY, {
            name: 'Artifact Echo Activation V2 Ran',
            hint: 'Internal flag: true after echo artifact activation flags were normalized.',
            scope: 'world',
            config: false,
            type: Boolean,
            default: false,
        });
    }
    catch (err) {
        console.warn('Mastery System | artifact-echo-activation-migration: settings.register failed', err);
    }
}
function hasAlreadyRun() {
    try {
        return game.settings.get(SETTING_NAMESPACE, SETTING_KEY) === true;
    }
    catch {
        return false;
    }
}
async function markRun() {
    try {
        await game.settings.set(SETTING_NAMESPACE, SETTING_KEY, true);
    }
    catch (err) {
        console.warn('Mastery System | artifact-echo-activation-migration: settings.set failed', err);
    }
}
export async function runArtifactEchoActivationMigration() {
    if (!game.user?.isGM)
        return;
    if (hasAlreadyRun())
        return;
    let flagUpdates = 0;
    let linkResets = 0;
    let syncUpdates = 0;
    const actors = game.actors?.contents ?? [];
    for (const actor of actors) {
        const artifacts = Array.from(actor.items ?? []).filter((it) => it.type === 'artifact');
        for (const emb of artifacts) {
            if (getArtifactBindingKind(emb) !== 'echo')
                continue;
            const activated = emb.getFlag?.('mastery-system', 'artifactActivated');
            if (activated !== true) {
                await emb.setFlag('mastery-system', 'artifactActivated', false);
                flagUpdates++;
            }
            const rootWorldId = emb.getFlag?.('mastery-system', 'evolutionRootItemId');
            if (rootWorldId) {
                const root = game.items?.get(rootWorldId);
                const rootNodeId = root?.getFlag?.('mastery-system', 'nodeId');
                if (root && rootNodeId && activated !== true) {
                    const levels = {
                        ...(root.getFlag('mastery-system', 'actorLevels') || {}),
                    };
                    const prog = readActorArtifactProgress(levels[actor.id], rootNodeId);
                    if (prog.linked) {
                        levels[actor.id] = serializeActorArtifactProgress({ ...prog, linked: false });
                        await root.setFlag('mastery-system', 'actorLevels', levels);
                        linkResets++;
                    }
                }
            }
            if (echoEmbeddedArtifactNeedsSync(emb)) {
                if (await syncEmbeddedArtifactFromWorldNode(emb, actor))
                    syncUpdates++;
            }
        }
        await repairActorEchoArtifacts(actor);
    }
    await markRun();
    const total = flagUpdates + linkResets + syncUpdates;
    if (total > 0) {
        const msg = `Mastery System | Echo artifact activation: normalized ${flagUpdates} flag(s), ` +
            `reset ${linkResets} legacy link(s), synced ${syncUpdates} stale item(s).`;
        console.log(msg);
        try {
            ui.notifications?.info(msg);
        }
        catch {
            // ignore
        }
    }
}
//# sourceMappingURL=artifact-echo-activation-migration.js.map