/**
 * Artifact alignment migration (Artefacts catalogue 2026-10-25 + post-alignment fixes).
 *
 * Strategy:
 *   1. World Item library trees whose `seedVersion` ≠ `ECHO_ARTIFACT_SEED_VERSION`
 *      are rebuilt from the catalog generator (preserves node `_id` / folders /
 *      actorLevels) and pushed to embedded Actor copies (world + unlinked tokens).
 *   2. Actor / unlinked-token Artifact embeds with stale seed **or** broken Dragon
 *      Head Breath progression are listed (and, on apply, content-synced then
 *      stamped to the current seed).
 *
 * Why seed alone is not enough: seed 57 stamped embeds whose Breath rows still
 * said `type: "Artifact Active"`. The combat radial classified that label as
 * passive and hid Damage/Ruin Breath even though dry-run reported wouldUpdate: [].
 *
 * Idempotent: healthy embeds already at the current seed are skipped. Dry-run default.
 * Does not wipe Actor XP, custom names, equipment, or Item IDs.
 *
 * Live worlds: GM must export Actors (Lor-Keth, Alaris, Scurry, Oda) before apply.
 */
import { ECHO_ARTIFACT_SEED_VERSION } from '../artifacts/echo-artifact-tree-builder.js';
import { ECHO_ARTIFACTS, getEchoArtifact } from '../utils/echo-artifacts.js';
import { GENERAL_ARTIFACTS } from '../utils/general-artifacts.js';
import { dragonHeadBreathProgressionBroken, isDragonHeadArtifactKey, patchDragonHeadBreathProgression, rebuildDragonHeadVisibleProgression, } from '../utils/dragon-head-breath-repair.js';
import { syncEmbeddedArtifactFromWorldNode } from '../utils/artifact-echo-repair.js';
export const ARTIFACT_ALIGNMENT_MIGRATION_ID = 'artifact-alignment-2026-10-25';
function collectActors() {
    const game = globalThis.game;
    if (!game?.actors)
        return [];
    const world = Array.from(game.actors.values?.() ?? game.actors);
    const tokens = [];
    try {
        for (const scene of game.scenes ?? []) {
            for (const td of scene.tokens ?? []) {
                const a = td.actor;
                if (a?.isToken)
                    tokens.push(a);
            }
        }
    }
    catch {
        /* scenes optional in unit tests */
    }
    return [...world, ...tokens];
}
function artifactKey(item) {
    const key = item?.getFlag?.('mastery-system', 'echoArtifactKey') ??
        item?.flags?.['mastery-system']?.echoArtifactKey ??
        item?.system?.echoArtifactKey;
    if (key && String(key).trim())
        return String(key).trim();
    const name = String(item?.name || '');
    if (/moonlight\s+greatsword/i.test(name))
        return 'moonlightGreatsword';
    if (/titan\s+scars/i.test(name))
        return 'titanScars';
    if (/dragon\s+head/i.test(name))
        return 'dragonHead';
    return null;
}
function readSeed(item) {
    return Number(item?.getFlag?.('mastery-system', 'seedVersion') ??
        item?.flags?.['mastery-system']?.seedVersion ??
        0);
}
function breathContentBroken(item, key, level) {
    if (!isDragonHeadArtifactKey(key))
        return false;
    return dragonHeadBreathProgressionBroken(item?.system?.levelProgression, level);
}
/**
 * Scan (and optionally refresh) Artifact embeds so catalogue progression reaches
 * Actors already stamped at an older seed (including seedVersion 56/57) and
 * Dragon Head embeds whose Breath row is still combat-broken.
 */
export async function runArtifactAlignmentMigration(opts) {
    const dryRun = opts?.dryRun !== false; // default dry-run for safety
    const report = {
        migrationId: ARTIFACT_ALIGNMENT_MIGRATION_ID,
        dryRun,
        seedVersion: ECHO_ARTIFACT_SEED_VERSION,
        scannedActors: 0,
        scannedItems: 0,
        wouldUpdate: [],
        libraryRefreshTouched: 0,
        notes: [
            'Default is dry-run. Call with { dryRun: false } only after Actor backup.',
            'Preserves Item _id, equipment flags, currentLevel, custom names, XP.',
            'Unlinked token Actors are scanned separately from world Actors.',
            `Target seedVersion = ${ECHO_ARTIFACT_SEED_VERSION}. Prior 56/57 still refresh when target is higher or Breath content is broken.`,
            'Apply path: seedArtifactLibrary() rebuilds world trees (seed mismatch) then pushes system blobs to embedded Actor + unlinked Token copies.',
            'Dragon Head: embeds with missing Breath or type "Artifact Active" are content-repaired even if seed already matches.',
            `Catalog keys in scope: moonlightGreatsword, titanScars, + ${Object.keys(ECHO_ARTIFACTS).length} echo / ${Object.keys(GENERAL_ARTIFACTS).length} general.`,
        ],
    };
    // Content reconciliation for world library (+ push to actors) happens on apply.
    if (!dryRun) {
        try {
            const { seedArtifactLibrary } = await import('../utils/seed-artifact-library.js');
            report.libraryRefreshTouched = await seedArtifactLibrary({ force: false });
            report.notes.push(`World library seedArtifactLibrary touched ${report.libraryRefreshTouched} node(s).`);
        }
        catch (err) {
            report.notes.push(`seedArtifactLibrary failed: ${String(err)}`);
        }
    }
    else {
        report.notes.push('Dry-run: world library not rewritten. Apply runs seedArtifactLibrary for content reconciliation.');
    }
    const actors = collectActors();
    report.scannedActors = actors.length;
    for (const actor of actors) {
        const items = Array.from(actor.items?.values?.() ?? actor.items ?? []);
        for (const item of items) {
            if (item?.type !== 'artifact')
                continue;
            report.scannedItems += 1;
            const key = artifactKey(item);
            if (!key)
                continue;
            const def = getEchoArtifact(key) || GENERAL_ARTIFACTS[key];
            if (!def)
                continue;
            const level = Math.max(1, Math.min(10, Math.floor(Number(item.system?.currentLevel ?? item.system?.level) || 1)));
            const seed = readSeed(item);
            const seedStale = seed < ECHO_ARTIFACT_SEED_VERSION;
            const breathBroken = breathContentBroken(item, key, level);
            if (!seedStale && !breathBroken)
                continue;
            report.wouldUpdate.push({
                actorId: String(actor.id || actor.uuid || ''),
                itemId: String(item.id || ''),
                key,
                level,
                previousSeed: seed,
                reason: breathBroken && !seedStale ? 'breath-content' : 'seed',
            });
            if (dryRun)
                continue;
            try {
                // Prefer world-node sync (preserves tree wiring). Fall back to pure
                // catalogue rebuild of visible Breath/Roar/Recovery rows.
                let synced = false;
                try {
                    synced = await syncEmbeddedArtifactFromWorldNode(item, actor);
                }
                catch (err) {
                    report.notes.push(`World sync failed for ${actor.id}/${item.id}: ${String(err)}`);
                }
                if (isDragonHeadArtifactKey(key) &&
                    (!synced ||
                        dragonHeadBreathProgressionBroken(item.system?.levelProgression, level))) {
                    const nextRows = rebuildDragonHeadVisibleProgression(level);
                    if (nextRows.length > 0) {
                        if (typeof item.update === 'function') {
                            await item.update({
                                'system.levelProgression': nextRows,
                                'flags.mastery-system.seedVersion': ECHO_ARTIFACT_SEED_VERSION,
                            });
                        }
                        else {
                            patchDragonHeadBreathProgression(item);
                            if (item.flags?.['mastery-system']) {
                                item.flags['mastery-system'].seedVersion = ECHO_ARTIFACT_SEED_VERSION;
                            }
                        }
                        report.notes.push(`Repaired Dragon Head Breath progression on ${actor.id}/${item.id} (catalogue rebuild).`);
                        continue;
                    }
                }
                if (typeof item.update === 'function') {
                    await item.update({
                        'flags.mastery-system.seedVersion': ECHO_ARTIFACT_SEED_VERSION,
                    });
                }
                else if (item.flags?.['mastery-system']) {
                    item.flags['mastery-system'].seedVersion = ECHO_ARTIFACT_SEED_VERSION;
                }
            }
            catch (err) {
                report.notes.push(`Update failed for ${actor.id}/${item.id}: ${String(err)}`);
            }
        }
    }
    return report;
}
//# sourceMappingURL=artifact-alignment-2026-10-25.js.map