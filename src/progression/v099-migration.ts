/**
 * One-time v0.9.9.0 migration for player characters.
 *
 * Computes preserved Attribute XP and Lifetime XP, then flags the actor for
 * a single respec. Running again does not recompute or rewrite Attributes.
 */

import { earnedAttributeXpInvestment, deriveLifetimeXp, readAttributeValues, V099_SCHEMA_VERSION } from './v099-rules.js';

export const V099_PREPARED_FLAG = 'v099CorePrepared';
export const V099_RESPEC_FLAG = 'needsV099Respec';
export const V099_LIFETIME_FLAG = 'needsV099LifetimeXp';
/** GM opened this character's assigned Stones so they can be cleared and placed again. */
export const STONE_REDISTRIBUTE_FLAG = 'stoneRedistribute';

export interface V099PrepareResult {
  changed: boolean;
  alreadyPrepared: boolean;
  earnedAttributeXp: number;
  earnedSource: 'snapshot' | 'package' | 'stored';
  lifetimeXp: number | null;
  lifetimeSource: string;
  needsLifetimeInput: boolean;
}

function flag(actor: any, key: string): unknown {
  try {
    return actor?.getFlag?.('mastery-system', key);
  } catch {
    return actor?.flags?.['mastery-system']?.[key];
  }
}

export function planV099Migration(actor: any): V099PrepareResult {
  const system = actor?.system ?? {};
  if (flag(actor, V099_PREPARED_FLAG) === true || system?.progression?.v099Prepared === true) {
    const storedXp = Math.max(0, Math.floor(Number(system?.progression?.earnedAttributeXp) || 0));
    const life = system?.progression?.lifetimeXp;
    return {
      changed: false,
      alreadyPrepared: true,
      earnedAttributeXp: storedXp,
      earnedSource: 'stored',
      lifetimeXp: typeof life === 'number' ? Math.max(0, Math.floor(life)) : null,
      lifetimeSource: String(system?.progression?.lifetimeXpSource || 'stored'),
      needsLifetimeInput: flag(actor, V099_LIFETIME_FLAG) === true,
    };
  }

  const current = readAttributeValues(system.attributes);
  const snap = system?.xp?.postCreationProgress?.attributes;
  const earned = earnedAttributeXpInvestment(current, snap && typeof snap === 'object' ? snap : null);
  const life = deriveLifetimeXp(system);
  return {
    changed: true,
    alreadyPrepared: false,
    earnedAttributeXp: earned.xp,
    earnedSource: earned.source,
    lifetimeXp: life.lifetimeXp,
    lifetimeSource: life.source,
    needsLifetimeInput: life.lifetimeXp == null,
  };
}

export function v099PrepareUpdate(actor: any): Record<string, unknown> | null {
  if (actor?.type && actor.type !== 'character') return null;
  const plan = planV099Migration(actor);
  if (!plan.changed) return null;
  const progression = {
    ...(actor?.system?.progression ?? {}),
    rulesVersion: V099_SCHEMA_VERSION,
    v099Prepared: true,
    v099Stones: false,
    earnedAttributeXp: plan.earnedAttributeXp,
    earnedAttributeXpSource: plan.earnedSource,
    lifetimeXp: plan.lifetimeXp,
    lifetimeXpSource: plan.lifetimeSource,
  };
  return {
    'system.progression': progression,
    'flags.mastery-system.schemaVersion': V099_SCHEMA_VERSION,
    [`flags.mastery-system.${V099_PREPARED_FLAG}`]: true,
    [`flags.mastery-system.${V099_RESPEC_FLAG}`]: true,
    [`flags.mastery-system.${V099_LIFETIME_FLAG}`]: plan.needsLifetimeInput,
  };
}

export async function runV099CoreMigration(actors: any[]): Promise<number> {
  const user = (globalThis as any).game?.user;
  if (user && user.isGM === false) return 0;
  let migrated = 0;
  for (const actor of actors || []) {
    if (!actor || actor.type !== 'character') continue;
    const update = v099PrepareUpdate(actor);
    if (!update) continue;
    try {
      await actor.update(update);
      migrated += 1;
    } catch (err) {
      console.warn('Mastery System | v0.9.9 migration failed', actor?.name, err);
    }
  }
  try {
    const settings = (globalThis as any).game?.settings;
    if (settings?.set) {
      await settings.set('mastery-system', 'schemaVersion', V099_SCHEMA_VERSION);
    }
  } catch {
    /* setting may not be registered yet */
  }
  return migrated;
}

export function registerV099SchemaSetting(): void {
  try {
    (globalThis as any).game?.settings?.register?.('mastery-system', 'schemaVersion', {
      name: 'Mastery System Schema',
      hint: 'Internal schema version. v0.9.9.0 is the compressed Attribute / Lifetime Stone rules.',
      scope: 'world',
      config: false,
      type: String,
      default: '',
    });
  } catch (err) {
    console.warn('Mastery System | schemaVersion setting failed', err);
  }
}
