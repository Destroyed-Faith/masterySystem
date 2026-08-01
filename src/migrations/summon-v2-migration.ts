/**
 * One-shot: migrate V1 familiars → Summons V2 summonBonds.
 */

import { migrateFamiliarToBond, getSummonBondsFromActor } from '../stones/summon-bond-bind.js';

const SETTING_NAMESPACE = 'mastery-system';
const SETTING_KEY = 'summonV2MigrationRun';

export function registerSummonV2MigrationSetting(): void {
  try {
    (game as any).settings.register(SETTING_NAMESPACE, SETTING_KEY, {
      name: 'Summon V2 Migration Ran',
      hint: 'Internal flag: true after familiars→summonBonds migration ran.',
      scope: 'world',
      config: false,
      type: Boolean,
      default: false,
    });
  } catch (err) {
    console.warn('Mastery System | summon-v2: settings.register failed', err);
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
    console.warn('Mastery System | summon-v2: settings.set failed', err);
  }
}

export async function runSummonV2Migration(actors: any[]): Promise<void> {
  if (hasAlreadyRun()) return;
  let migrated = 0;
  for (const actor of actors) {
    if (actor?.type !== 'character') continue;
    try {
      const familiars = Array.isArray(actor.system?.familiars) ? actor.system.familiars : [];
      const existing = getSummonBondsFromActor(actor);
      if (familiars.length === 0) continue;

      const existingIds = new Set(existing.map((b) => b.id));
      const converted = familiars
        .filter((f: any) => f?.id && !existingIds.has(f.id))
        .map((f: any) => migrateFamiliarToBond(f, actor.id));

      if (converted.length === 0 && existing.length > 0) {
        // Already migrated bonds; clear legacy list
        await actor.update({ 'system.familiars': [] });
        migrated += 1;
        continue;
      }

      const nextBonds = [...existing, ...converted];
      await actor.update({
        'system.summonBonds': nextBonds,
        'system.familiars': [],
      });
      migrated += 1;
    } catch (err) {
      console.warn('Mastery System | summon-v2: actor failed', actor?.name, err);
    }
  }
  await markRun();
  console.log(`Mastery System | summon-v2 migration complete (${migrated} characters)`);
}
