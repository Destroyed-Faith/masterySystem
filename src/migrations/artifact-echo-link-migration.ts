/**
 * One-shot GM migration: MR1 characters with auto-linked Echo artifacts → inactive.
 *
 * Before v0.9.22, `grantEchoArtifactTreeToActor` wrote `linked: true` on grant.
 * Echo artifacts should stay equipped but inactive until the player spends
 * 1 Stone at MR2+. Characters already at MR2+ are left unchanged.
 */

import {
  readActorArtifactProgress,
  serializeActorArtifactProgress,
} from '../utils/artifact-actor-rules.js';

const SETTING_NAMESPACE = 'mastery-system';
const SETTING_KEY = 'artifactEchoLinkResetRun';

export function registerArtifactEchoLinkMigrationSetting(): void {
  try {
    (game as any).settings.register(SETTING_NAMESPACE, SETTING_KEY, {
      name: 'Artifact Echo Link Reset Ran',
      hint: 'Internal flag: true after MR1 Echo artifact link flags were reset.',
      scope: 'world',
      config: false,
      type: Boolean,
      default: false,
    });
  } catch (err) {
    console.warn('Mastery System | artifact-echo-link-migration: settings.register failed', err);
  }
}

function hasAlreadyRun(): boolean {
  try {
    return (game as any).settings.get(SETTING_NAMESPACE, SETTING_KEY) === true;
  } catch {
    return false;
  }
}

async function markRun(): Promise<void> {
  try {
    await (game as any).settings.set(SETTING_NAMESPACE, SETTING_KEY, true);
  } catch (err) {
    console.warn('Mastery System | artifact-echo-link-migration: settings.set failed', err);
  }
}

/** Reset `linked: true` → `false` on world roots for MR1 actors only. */
export async function runArtifactEchoLinkMigration(): Promise<void> {
  if (!game.user?.isGM) return;
  if (hasAlreadyRun()) return;

  let updated = 0;
  const actors = (game as any).actors?.contents ?? [];

  for (const actor of actors) {
    const mr = Math.max(1, Number((actor.system as any)?.mastery?.rank) || 1);
    if (mr >= 2) continue;

    const artifacts: any[] = Array.from(actor.items ?? []).filter(
      (it: any) => it.type === 'artifact' && it.getFlag?.('mastery-system', 'evolutionRootItemId'),
    );

    for (const emb of artifacts) {
      const rootWorldId = emb.getFlag('mastery-system', 'evolutionRootItemId') as string | undefined;
      if (!rootWorldId) continue;

      const root = (game as any).items?.get(rootWorldId);
      if (!root) continue;

      const rootNodeId = root.getFlag?.('mastery-system', 'nodeId') as string | undefined;
      if (!rootNodeId) continue;

      const levels = { ...((root.getFlag('mastery-system', 'actorLevels') || {}) as Record<string, unknown>) };
      const prog = readActorArtifactProgress(levels[actor.id], rootNodeId);
      if (!prog.linked) continue;

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
    } catch {
      // ignore
    }
  }
}
