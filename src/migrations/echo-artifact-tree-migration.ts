/**
 * Echo Artifact → Builder-Tree migration (one-shot, GM-only, guarded).
 *
 * Earlier worlds granted Echo Artifacts as a single embedded `artifact` item
 * (flagged `echoBound` / `echoArtifactKey`, no evolution wiring). The new model
 * hands out the *root* of a seeded 10-level Builder-Tree instead, wired through
 * `evolutionRootItemId` / `evolutionNodeId` so the artifact can be evolved.
 *
 * This migration upgrades every legacy single-item Echo Artifact on every actor
 * to a tree-linked grant, then removes the legacy item. It is:
 *   • GM-only and idempotent (gated by a world setting),
 *   • dependent on the Echo Artifact library already being seeded (seeding runs
 *     earlier in the same `ready` hook), and
 *   • non-destructive on failure — the legacy item is only deleted after a
 *     successful tree grant.
 */

import { grantEchoArtifactTreeToActor } from '../utils/seed-artifact-library.js';
const SETTING_NAMESPACE = 'mastery-system';
const SETTING_KEY = 'echoArtifactTreeMigrationRun';

export function registerEchoArtifactTreeMigrationSetting(): void {
  try {
    (game as any).settings.register(SETTING_NAMESPACE, SETTING_KEY, {
      name: 'Echo Artifact Tree Migration Ran',
      hint: 'Internal flag: true after legacy single-item Echo Artifacts were upgraded to Builder-Trees for this world.',
      scope: 'world',
      config: false,
      type: Boolean,
      default: false,
    });
  } catch (err) {
    console.warn('Mastery System | echo-artifact-tree-migration: settings.register failed', err);
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
    console.warn('Mastery System | echo-artifact-tree-migration: settings.set failed', err);
  }
}

/** A legacy single-item Echo Artifact = echo-bound, but not yet wired to a tree. */
function isLegacyEchoArtifactItem(item: any): boolean {
  if (!item || item.type !== 'artifact') return false;
  const echoKey = item.getFlag?.(SETTING_NAMESPACE, 'echoArtifactKey');
  if (typeof echoKey !== 'string' || !echoKey) return false;
  const rootId = item.getFlag?.(SETTING_NAMESPACE, 'evolutionRootItemId');
  return !rootId; // already-wired items carry an evolution root id
}

/** Execute the one-shot Echo Artifact tree migration. Idempotent per world. */
export async function runEchoArtifactTreeMigration(): Promise<void> {
  if (!game.user?.isGM) return;
  if (hasAlreadyRun()) return;

  let upgraded = 0;
  let failed = 0;

  const actors = (game as any).actors?.contents ?? [];
  for (const actor of actors) {
    const legacy: any[] = Array.from(actor?.items ?? []).filter(isLegacyEchoArtifactItem);
    for (const item of legacy) {
      const echoKey = String(item.getFlag(SETTING_NAMESPACE, 'echoArtifactKey'));
      try {
        const granted = await grantEchoArtifactTreeToActor(actor as Actor, echoKey);
        if (!granted) {
          failed += 1;
          continue; // world library not seeded for this key — keep legacy item
        }
        // Preserve any equipment placement from the legacy item.
        const equip = item.getFlag?.(SETTING_NAMESPACE, 'equipment');
        if (equip) {
          try {
            await granted.setFlag(SETTING_NAMESPACE, 'equipment', equip);
          } catch {
            // non-fatal
          }
        }
        await (actor as any).deleteEmbeddedDocuments('Item', [item.id], {
          masterySystemForceDelete: true,
        });
        upgraded += 1;
      } catch (err) {
        failed += 1;
        console.warn(
          `Mastery System | echo-artifact-tree-migration: failed for "${item?.name}" on "${actor?.name}"`,
          err,
        );
      }
    }
  }

  // Only mark complete when nothing was left behind, so a later world load
  // (after the library is seeded) can finish any deferred upgrades.
  if (failed === 0) {
    await markRun();
  }

  if (upgraded > 0 || failed > 0) {
    const msg = `Mastery System | Echo Artifact tree migration: upgraded ${upgraded} artifact(s)${failed ? `, ${failed} deferred (library not seeded yet)` : ''}.`;
    try {
      if (upgraded > 0) ui.notifications?.info(msg);
    } catch {
      // UI may not be ready.
    }
  }
}
