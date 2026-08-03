/**
 * One-shot GM migration (v0.9.23): Echo artifact activation flags + stale embed sync.
 *
 * • Sets `artifactActivated` on embedded echo items (false unless already true).
 * • Clears legacy auto-`linked: true` on world roots for echo artifacts.
 * • Syncs embedded copies missing baseValues / levelProgression from world tree.
 */

import {
  getArtifactBindingKind,
  readActorArtifactProgress,
  serializeActorArtifactProgress,
} from '../utils/artifact-actor-rules.js';
import {
  echoEmbeddedArtifactNeedsSync,
  repairActorEchoArtifacts,
  syncEmbeddedArtifactFromWorldNode,
} from '../utils/artifact-echo-repair.js';

import { log } from '../utils/logger.js';
const SETTING_NAMESPACE = 'mastery-system';
const SETTING_KEY = 'artifactEchoActivationV2Run';

export function registerArtifactEchoActivationMigrationSetting(): void {
  try {
    (game as any).settings.register(SETTING_NAMESPACE, SETTING_KEY, {
      name: 'Artifact Echo Activation V2 Ran',
      hint: 'Internal flag: true after echo artifact activation flags were normalized.',
      scope: 'world',
      config: false,
      type: Boolean,
      default: false,
    });
  } catch (err) {
    console.warn('Mastery System | artifact-echo-activation-migration: settings.register failed', err);
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
    console.warn('Mastery System | artifact-echo-activation-migration: settings.set failed', err);
  }
}

export async function runArtifactEchoActivationMigration(): Promise<void> {
  if (!game.user?.isGM) return;
  if (hasAlreadyRun()) return;

  let flagUpdates = 0;
  let linkResets = 0;
  let syncUpdates = 0;

  const actors = (game as any).actors?.contents ?? [];

  for (const actor of actors) {
    const artifacts: any[] = Array.from(actor.items ?? []).filter((it: any) => it.type === 'artifact');

    for (const emb of artifacts) {
      if (getArtifactBindingKind(emb) !== 'echo') continue;

      const activated = emb.getFlag?.('mastery-system', 'artifactActivated');
      if (activated !== true) {
        await emb.setFlag('mastery-system', 'artifactActivated', false);
        flagUpdates++;
      }

      const rootWorldId = emb.getFlag?.('mastery-system', 'evolutionRootItemId') as string | undefined;
      if (rootWorldId) {
        const root = (game as any).items?.get(rootWorldId);
        const rootNodeId = root?.getFlag?.('mastery-system', 'nodeId') as string | undefined;
        if (root && rootNodeId && activated !== true) {
          const levels = {
            ...((root.getFlag('mastery-system', 'actorLevels') || {}) as Record<string, unknown>),
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
        if (await syncEmbeddedArtifactFromWorldNode(emb, actor)) syncUpdates++;
      }
    }

    await repairActorEchoArtifacts(actor);
  }

  await markRun();

  const total = flagUpdates + linkResets + syncUpdates;
  if (total > 0) {
    const msg =
      `Mastery System | Echo artifact activation: normalized ${flagUpdates} flag(s), ` +
      `reset ${linkResets} legacy link(s), synced ${syncUpdates} stale item(s).`;
    log.debug(msg);
    try {
      ui.notifications?.info(msg);
    } catch {
      // ignore
    }
  }
}
