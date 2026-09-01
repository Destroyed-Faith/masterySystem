/**
 * One-shot GM migration: artifacts start active at Level 1; leftover
 * Link-Stone reservation flags are cleared.
 *
 * Older grants / echo-activation migrations stamped `artifactActivated: false`
 * and sometimes `artifactActivationStoneAttr`. Attunement no longer reserves a
 * Stone, and Level 1 is free — so existing worlds should wake those items up.
 * Players can still deactivate an artifact afterwards as an exception.
 */
import { readActorArtifactProgress, serializeActorArtifactProgress, } from '../utils/artifact-actor-rules.js';
const SETTING_NAMESPACE = 'mastery-system';
const SETTING_KEY = 'artifactDefaultActiveV1Run';
export function registerArtifactDefaultActiveMigrationSetting() {
    try {
        game.settings.register(SETTING_NAMESPACE, SETTING_KEY, {
            name: 'Artifact Default Active Ran',
            hint: 'Internal flag: true after artifacts were defaulted to active L1.',
            scope: 'world',
            config: false,
            type: Boolean,
            default: false,
        });
    }
    catch (err) {
        console.warn('Mastery System | artifact-default-active-migration: settings.register failed', err);
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
        console.warn('Mastery System | artifact-default-active-migration: settings.set failed', err);
    }
}
export async function runArtifactDefaultActiveMigration() {
    if (!game.user?.isGM)
        return;
    if (hasAlreadyRun())
        return;
    let activated = 0;
    let stonesCleared = 0;
    let levelsFixed = 0;
    let linksSet = 0;
    const actors = game.actors?.contents ?? [];
    for (const actor of actors) {
        const artifacts = Array.from(actor.items ?? []).filter((it) => it.type === 'artifact');
        for (const emb of artifacts) {
            if (emb.getFlag?.('mastery-system', 'artifactActivationStoneAttr') != null) {
                await emb.unsetFlag('mastery-system', 'artifactActivationStoneAttr');
                stonesCleared++;
            }
            if (emb.getFlag?.('mastery-system', 'artifactActivated') !== true) {
                await emb.setFlag('mastery-system', 'artifactActivated', true);
                activated++;
            }
            const sys = emb.system || {};
            const curLevel = Math.max(0, Number(sys.currentLevel ?? sys.level ?? 0) || 0);
            if (curLevel < 1) {
                try {
                    await emb.update({ 'system.currentLevel': 1, 'system.level': 1 });
                    levelsFixed++;
                }
                catch (err) {
                    console.warn('Mastery System | artifact-default-active-migration: level patch failed', err);
                }
            }
            const rootWorldId = emb.getFlag?.('mastery-system', 'evolutionRootItemId');
            if (!rootWorldId)
                continue;
            const root = game.items?.get(rootWorldId);
            const rootNodeId = root?.getFlag?.('mastery-system', 'nodeId');
            if (!root || !rootNodeId)
                continue;
            const levels = {
                ...(root.getFlag('mastery-system', 'actorLevels') || {}),
            };
            const nodeId = emb.getFlag?.('mastery-system', 'evolutionNodeId') || rootNodeId;
            const prog = readActorArtifactProgress(levels[actor.id], nodeId);
            if (!prog.linked) {
                levels[actor.id] = serializeActorArtifactProgress({ ...prog, nodeId, linked: true });
                await root.setFlag('mastery-system', 'actorLevels', levels);
                linksSet++;
            }
        }
    }
    await markRun();
    const total = activated + stonesCleared + levelsFixed + linksSet;
    if (total > 0) {
        const msg = `Mastery System | Artifacts default-active: woke ${activated} item(s), ` +
            `cleared ${stonesCleared} leftover stone flag(s), set ${levelsFixed} to L1, ` +
            `linked ${linksSet} tree(s).`;
        try {
            ui.notifications?.info(msg);
        }
        catch {
            // ignore
        }
    }
}
//# sourceMappingURL=artifact-default-active-migration.js.map