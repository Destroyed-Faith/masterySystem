/**
 * One-shot GM migration: remove duplicate Echo-bound artifact copies on actors.
 *
 * Keeps the best wired/slotted copy per echoArtifactKey and re-equips orphans.
 */

import { dedupeEchoArtifactsOnActor } from '../utils/echo-artifact-equip.js';

import { log } from '../utils/logger.js';
const SETTING_NAMESPACE = 'mastery-system';
const SETTING_KEY = 'echoArtifactDedupeRun';

export function registerEchoArtifactDedupeMigrationSetting(): void {
  try {
    (game as any).settings.register(SETTING_NAMESPACE, SETTING_KEY, {
      name: 'Echo Artifact Dedupe Ran',
      hint: 'Internal flag: true after duplicate Echo-bound artifacts were removed from actors.',
      scope: 'world',
      config: false,
      type: Boolean,
      default: false,
    });
  } catch (err) {
    console.warn('Mastery System | echo-artifact-dedupe-migration: settings.register failed', err);
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
    console.warn('Mastery System | echo-artifact-dedupe-migration: settings.set failed', err);
  }
}

export async function runEchoArtifactDedupeMigration(): Promise<void> {
  if (!game.user?.isGM) return;
  if (hasAlreadyRun()) return;

  let removed = 0;
  const actors = (game as any).actors?.contents ?? [];
  for (const actor of actors) {
    try {
      removed += await dedupeEchoArtifactsOnActor(actor as Actor);
    } catch (err) {
      console.warn(
        `Mastery System | echo-artifact-dedupe-migration: failed for "${actor?.name}"`,
        err,
      );
    }
  }

  await markRun();

  if (removed > 0) {
    const msg = `Mastery System | Echo artifact dedupe: removed ${removed} duplicate copy/copies from actor inventories.`;
    log.debug(msg);
    try {
      ui.notifications?.info(msg);
    } catch {
      // UI may not be ready.
    }
  }
}
