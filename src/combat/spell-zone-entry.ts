/**
 * Persistent Zone entry on token movement (Z06 B).
 * Applies printed Specials with no Casting / Spell Resistance rolls.
 */

import { applyPersistentZonesOnCreatureEnter } from './persistent-zone-runtime.js';

/**
 * When a creature moves into one or more Persistent Zones, apply each zone's
 * Special at most once per combat Round (zone source × creature × round).
 */
export async function applyStoredSpellZonesOnEnter(
  creature: any,
  tokenDoc: any,
  combat: any,
): Promise<void> {
  await applyPersistentZonesOnCreatureEnter(creature, tokenDoc, combat);
}
