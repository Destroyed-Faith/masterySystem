/**
 * Gate-free GM resync: embedded Echo-Artifact Stone Power Support data.
 *
 * Echo artifact items bake `extraStoneFunctions` (support stages) and their
 * Level Progression rows at creation time. The v0.9.9 four-Rank Stone model
 * changed the Kept from Sight / Elorian Focus support rows, so existing
 * copies keep stale stages and "pay Tier …" text until re-seeded.
 *
 * This resync refreshes, for every embedded artifact whose `echoArtifactKey`
 * matches the catalog:
 *   - `system.extraStoneFunctions` (verbatim from the catalog definition);
 *   - Level Progression rows (and nested `progressionPicks` authored stages)
 *     whose `name` matches a catalog row: type / effect / special only.
 *
 * Custom names and rows without a catalog match are never touched. The pass
 * is idempotent: items are only written when the rebuilt data differs.
 */

import { ECHO_ARTIFACTS } from '../utils/echo-artifacts.js';

type AnyRecord = Record<string, unknown>;

function catalogRowByName(def: { levelProgression?: { name?: string }[] }, name: string) {
  const rows = Array.isArray(def.levelProgression) ? def.levelProgression : [];
  return rows.find((r) => String(r?.name ?? '') === name) ?? null;
}

function syncedRow(def: any, row: AnyRecord): AnyRecord {
  const name = String(row?.name ?? '');
  if (!name) return row;
  const cat: any = catalogRowByName(def, name);
  if (!cat) return row;
  const next: AnyRecord = { ...row };
  if (typeof cat.type === 'string') next.type = cat.type;
  if (typeof cat.effect === 'string') next.effect = cat.effect;
  if (typeof cat.special === 'string') next.special = cat.special;
  return next;
}

function buildEchoSupportUpdates(item: any, def: any): AnyRecord {
  const sys = item?.system ?? {};
  const updates: AnyRecord = {};

  const wantExtras = (def.extraStoneFunctions ?? []).map((fn: AnyRecord) => ({ ...fn }));
  const haveExtras = Array.isArray(sys.extraStoneFunctions) ? sys.extraStoneFunctions : [];
  if (JSON.stringify(haveExtras) !== JSON.stringify(wantExtras)) {
    updates['system.extraStoneFunctions'] = wantExtras;
  }

  if (Array.isArray(sys.levelProgression)) {
    const next = sys.levelProgression.map((row: AnyRecord) => syncedRow(def, row));
    if (JSON.stringify(next) !== JSON.stringify(sys.levelProgression)) {
      updates['system.levelProgression'] = next;
    }
  }

  if (Array.isArray(sys.progressionPicks)) {
    const nextPicks = sys.progressionPicks.map((pick: AnyRecord) => {
      const stages = (pick as { authoredStages?: AnyRecord[] }).authoredStages;
      if (!Array.isArray(stages)) return pick;
      const nextStages = stages.map((row) => syncedRow(def, row));
      if (JSON.stringify(nextStages) === JSON.stringify(stages)) return pick;
      return { ...pick, authoredStages: nextStages };
    });
    if (JSON.stringify(nextPicks) !== JSON.stringify(sys.progressionPicks)) {
      updates['system.progressionPicks'] = nextPicks;
    }
  }

  return updates;
}

/** Resync one actor's embedded echo artifacts. Returns updated item count. */
export async function resyncActorEchoStoneSupport(actor: any): Promise<number> {
  if (!actor?.items) return 0;
  let updated = 0;
  for (const item of Array.from(actor.items) as any[]) {
    if (item?.type !== 'artifact') continue;
    const key = String(item.getFlag?.('mastery-system', 'echoArtifactKey') || '').trim();
    if (!key) continue;
    const def = (ECHO_ARTIFACTS as Record<string, unknown>)[key];
    if (!def) continue;
    const updates = buildEchoSupportUpdates(item, def);
    if (!Object.keys(updates).length) continue;
    try {
      await item.update(updates);
      updated++;
    } catch (err) {
      console.warn(`Mastery System | echo stone-support resync failed for "${item.name}"`, err);
    }
  }
  return updated;
}

/** World-load GM pass over every actor. Idempotent (diff-checked). */
export async function runEchoStoneSupportResyncMigration(): Promise<number> {
  if (!game.user?.isGM) return 0;
  const actors = (game as any).actors?.contents ?? [];
  let updated = 0;
  for (const actor of actors) {
    updated += await resyncActorEchoStoneSupport(actor);
  }
  if (updated > 0) {
    console.log(`Mastery System | echo stone-support resync updated ${updated} artifact item(s).`);
  }
  return updated;
}
