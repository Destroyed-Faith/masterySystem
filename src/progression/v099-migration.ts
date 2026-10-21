/**
 * Quiet v0.9.9 schema ensure for player characters.
 *
 * Attribute / Stone rules are already live. This no longer opens a respec
 * dialog or sets `needsV099Respec`. It only stamps prepared + Stones-on and
 * clears any leftover migration flags from older worlds.
 */

import { earnedAttributeXpInvestment, deriveLifetimeXp, readAttributeValues, V099_SCHEMA_VERSION } from './v099-rules.js';

export const V099_PREPARED_FLAG = 'v099CorePrepared';
/** @deprecated Cleared on load; migration UI is retired. */
export const V099_RESPEC_FLAG = 'needsV099Respec';
/** @deprecated Cleared on load; migration UI is retired. */
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
      needsLifetimeInput: false,
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
    needsLifetimeInput: false,
  };
}

/**
 * Ensure the actor is on live Stone rules with no pending migration UI.
 * Does not rewrite Attribute values.
 */
export function v099PrepareUpdate(actor: any): Record<string, unknown> | null {
  if (actor?.type && actor.type !== 'character') return null;

  const system = actor?.system ?? {};
  const prepared = flag(actor, V099_PREPARED_FLAG) === true || system?.progression?.v099Prepared === true;
  const stonesOn = system?.progression?.v099Stones === true;
  const needsRespec = flag(actor, V099_RESPEC_FLAG) === true;
  const needsLife = flag(actor, V099_LIFETIME_FLAG) === true;

  if (prepared && stonesOn && !needsRespec && !needsLife) return null;

  const plan = planV099Migration(actor);
  const storedLife = system?.progression?.lifetimeXp;
  const lifetimeXp =
    typeof storedLife === 'number' && Number.isFinite(storedLife)
      ? Math.max(0, Math.floor(storedLife))
      : plan.lifetimeXp != null
        ? plan.lifetimeXp
        : 0;
  const lifetimeSource =
    typeof storedLife === 'number' && Number.isFinite(storedLife)
      ? String(system?.progression?.lifetimeXpSource || 'stored')
      : plan.lifetimeSource || 'derived';

  const progression = {
    ...(system.progression ?? {}),
    rulesVersion: V099_SCHEMA_VERSION,
    v099Prepared: true,
    v099Stones: true,
    earnedAttributeXp: prepared
      ? Math.max(0, Math.floor(Number(system?.progression?.earnedAttributeXp) || 0))
      : plan.earnedAttributeXp,
    earnedAttributeXpSource: prepared
      ? String(system?.progression?.earnedAttributeXpSource || 'stored')
      : plan.earnedSource,
    lifetimeXp,
    lifetimeXpSource: lifetimeSource,
  };

  return {
    'system.progression': progression,
    'flags.mastery-system.schemaVersion': V099_SCHEMA_VERSION,
    [`flags.mastery-system.${V099_PREPARED_FLAG}`]: true,
    [`flags.mastery-system.${V099_RESPEC_FLAG}`]: false,
    [`flags.mastery-system.${V099_LIFETIME_FLAG}`]: false,
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
      console.warn('Mastery System | v0.9.9 schema ensure failed', actor?.name, err);
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
