/**
 * One-shot GM migration: MR1 characters with auto-linked Echo artifacts → inactive.
 *
 * Before v0.9.22, `grantEchoArtifactTreeToActor` wrote `linked: true` on grant.
 * Echo artifacts should stay equipped but inactive until the player spends
 * 1 Stone at MR2+. Characters already at MR2+ are left unchanged.
 */
import { readActorArtifactProgress, serializeActorArtifactProgress, } from '../utils/artifact-actor-rules.js';
const SETTING_NAMESPACE = 'mastery-system';
const SETTING_KEY = 'artifactEchoLinkResetRun';
export function registerArtifactEchoLinkMigrationSetting() {
    try {
        game.settings.register(SETTING_NAMESPACE, SETTING_KEY, {
            name: 'Artifact Echo Link Reset Ran',
            hint: 'Internal flag: true after MR1 Echo artifact link flags were reset.',
            scope: 'world',
            config: false,
            type: Boolean,
            default: false,
        });
    }
    catch (err) {
        console.warn('Mastery System | artifact-echo-link-migration: settings.register failed', err);
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
        console.warn('Mastery System | artifact-echo-link-migration: settings.set failed', err);
    }
}
/** Reset `linked: true` → `false` on world roots for MR1 actors only. */
export async function runArtifactEchoLinkMigration() {
    if (!game.user?.isGM)
        return;
    if (hasAlreadyRun())
        return;
    let updated = 0;
    const actors = game.actors?.contents ?? [];
    for (const actor of actors) {
        const mr = Math.max(1, Number(actor.system?.mastery?.rank) || 1);
        if (mr >= 2)
            continue;
        const artifacts = Array.from(actor.items ?? []).filter((it) => it.type === 'artifact' && it.getFlag?.('mastery-system', 'evolutionRootItemId'));
        for (const emb of artifacts) {
            const rootWorldId = emb.getFlag('mastery-system', 'evolutionRootItemId');
            if (!rootWorldId)
                continue;
            const root = game.items?.get(rootWorldId);
            if (!root)
                continue;
            const rootNodeId = root.getFlag?.('mastery-system', 'nodeId');
            if (!rootNodeId)
                continue;
            const levels = { ...(root.getFlag('mastery-system', 'actorLevels') || {}) };
            const prog = readActorArtifactProgress(levels[actor.id], rootNodeId);
            if (!prog.linked)
                continue;
            levels[actor.id] = serializeActorArtifactProgress({ ...prog, linked: false });
            await root.setFlag('mastery-system', 'actorLevels', levels);
            updated++;
        }
    }
    await markRun();
    if (updated > 0) {
        const msg = `Mastery System | Echo artifact activation: reset ${updated} auto-linked artifact(s) on MR1 characters to inactive.`;
        console.log(msg);
        try {
            ui.notifications?.info(msg);
        }
        catch {
            // ignore
        }
    }
}
//# sourceMappingURL=artifact-echo-link-migration.js.map