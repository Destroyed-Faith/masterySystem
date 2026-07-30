/**
 * Rules v2 alignment — one-shot world migration.
 *
 * Strips obsolete Saving Throw fields, migrates `spellResolution: saveSpell`
 * → `spellAttack`, deletes removed Special statuses (Dread / Frightened /
 * Disrupt / Shock) after the rename pass has remapped what it can, and clears
 * obsolete Active Buff Special Application template ids from power items.
 *
 * Guard: `game.settings.get('mastery-system', 'rulesV2AlignmentRun') === true`
 */

import { REMOVED_SPECIAL_IDS } from '../utils/special-effects.js';

const SETTING_NAMESPACE = 'mastery-system';
const SETTING_KEY = 'rulesV2AlignmentRun';

/** Retired Active Buff Special Application aura templates (never apply Specials). */
const REMOVED_TEMPLATE_IDS = new Set([
  'ab-special-aura-start-3',
  'ab-special-aura-start-4',
  'ab-special-aura-start-5',
  'ab-special-aura-start-6',
  'ab-special-aura-start-8',
]);

export function registerRulesV2AlignmentMigrationSetting(): void {
  try {
    (game as any).settings.register(SETTING_NAMESPACE, SETTING_KEY, {
      name: 'Rules v2 Alignment Ran',
      hint: 'Internal flag: true after the Rules v2 (saves / Challenge / Cleanse) alignment migration ran.',
      scope: 'world',
      config: false,
      type: Boolean,
      default: false,
    });
  } catch (err) {
    console.warn('Mastery System | rules-v2-alignment: settings.register failed', err);
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
    console.warn('Mastery System | rules-v2-alignment: settings.set failed', err);
  }
}

function stripActorSaves(system: any): boolean {
  let changed = false;
  if (system && typeof system === 'object') {
    if ('savingThrows' in system) {
      delete system.savingThrows;
      changed = true;
    }
    if (system.manual?.rolls?.save) {
      delete system.manual.rolls.save;
      changed = true;
    }
    if (Array.isArray(system.phases)) {
      for (const phase of system.phases) {
        if (phase && typeof phase === 'object' && 'savingThrows' in phase) {
          delete phase.savingThrows;
          changed = true;
        }
      }
    }
    if (Array.isArray(system.statusEffects)) {
      const before = system.statusEffects.length;
      system.statusEffects = system.statusEffects.filter((e: any) => {
        const id = String(e?.id ?? '').toLowerCase();
        const name = String(e?.name ?? '').toLowerCase();
        return !REMOVED_SPECIAL_IDS.includes(id as any) && !REMOVED_SPECIAL_IDS.includes(name as any);
      });
      if (system.statusEffects.length !== before) changed = true;
    }
  }
  return changed;
}

function stripItemLegacy(system: any): boolean {
  let changed = false;
  if (!system || typeof system !== 'object') return false;
  if ('spellSaveType' in system) {
    delete system.spellSaveType;
    changed = true;
  }
  if (system.spellResolution === 'saveSpell') {
    system.spellResolution = 'spellAttack';
    changed = true;
  }
  const tid = String(system.templateId ?? '');
  if (REMOVED_TEMPLATE_IDS.has(tid)) {
    // Mark retired templates so GMs can re-pick; do not auto-delete powers.
    system.legacyRetiredTemplate = tid;
    system.templateId = '';
    changed = true;
    console.warn(
      `Mastery System | rules-v2: retired Active Buff Special Application template "${tid}" — re-pick from catalog`,
    );
  }
  return changed;
}

async function migrateActor(actor: any): Promise<boolean> {
  const system = actor?.system;
  if (!system) return false;
  const clone = foundry.utils.duplicate(system);
  const changed = stripActorSaves(clone);
  if (!changed) return false;
  await actor.update({ system: clone });
  return true;
}

async function migrateItem(item: any): Promise<boolean> {
  const system = item?.system;
  if (!system) return false;
  const clone = foundry.utils.duplicate(system);
  const changed = stripItemLegacy(clone);
  if (!changed) return false;
  await item.update({ system: clone });
  return true;
}

/** Execute the one-shot Rules v2 alignment. Idempotent per world. */
export async function runRulesV2AlignmentMigration(actors: any[]): Promise<void> {
  if (!game.user?.isGM) return;
  if (hasAlreadyRun()) return;

  let migrated = 0;
  for (const actor of actors || []) {
    try {
      if (await migrateActor(actor)) migrated += 1;
    } catch (err) {
      console.warn('Mastery System | rules-v2: actor migration failed', actor?.name, err);
    }
    for (const item of Array.from(actor?.items || []) as any[]) {
      try {
        if (await migrateItem(item)) migrated += 1;
      } catch (err) {
        console.warn('Mastery System | rules-v2: actor item migration failed', item?.name, err);
      }
    }
  }
  for (const item of Array.from((game as any).items || []) as any[]) {
    try {
      if (await migrateItem(item)) migrated += 1;
    } catch (err) {
      console.warn('Mastery System | rules-v2: world item migration failed', item?.name, err);
    }
  }

  await markRun();
  console.log(
    `Mastery System | Rules v2 alignment migration complete (${migrated} document(s) updated).`,
  );
}
