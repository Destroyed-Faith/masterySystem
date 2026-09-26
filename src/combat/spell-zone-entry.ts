/**
 * When a creature moves, compare each stored Spell zone Casting result to
 * that creature's current Final Spell TN. No new Casting Roll. No Stress.
 * Each creature is affected at most once per Round.
 */

import { spellResistanceAfterPenetration } from './target-defenses.js';
import {
  markZoneApplied,
  readSpellZones,
  zoneAlreadyApplied,
  zoneApplicationOutcome,
  type PersistentSpellZone,
} from './spell-zones.js';

function actorList(): any[] {
  const actors = (globalThis as any).game?.actors;
  if (!actors) return [];
  if (typeof actors.values === 'function') return Array.from(actors.values());
  if (Array.isArray(actors.contents)) return actors.contents;
  return [];
}

function metersBetween(scene: any, x1: number, y1: number, x2: number, y2: number): number {
  const grid = scene?.grid?.size || 100;
  const distance = scene?.grid?.distance || 1;
  const dx = (x2 - x1) / grid;
  const dy = (y2 - y1) / grid;
  return Math.hypot(dx, dy) * distance;
}

export async function applyStoredSpellZonesOnEnter(
  creature: any,
  tokenDoc: any,
  combat: any,
): Promise<void> {
  if (!creature || !combat) return;
  const roundKey = `${String(combat.id ?? '')}:${Number(combat.round) || 0}`;
  const creatureId = String(creature.id ?? '');
  const x = Number(tokenDoc?.x);
  const y = Number(tokenDoc?.y);
  const scene = tokenDoc?.parent;

  for (const caster of actorList()) {
    const zones = readSpellZones(caster);
    if (!zones.length) continue;
    let changed = false;
    const next: PersistentSpellZone[] = [];
    for (const zone of zones) {
      const hasCenter = zone.centerX != null && zone.centerY != null && (zone.radiusMeters ?? 0) > 0;
      if (!hasCenter || !Number.isFinite(x) || !Number.isFinite(y)) {
        next.push(zone);
        continue;
      }
      const dist = metersBetween(scene, zone.centerX as number, zone.centerY as number, x, y);
      if (dist > (zone.radiusMeters ?? 0)) {
        next.push(zone);
        continue;
      }
      if (zoneAlreadyApplied(zone, roundKey, creatureId)) {
        next.push(zone);
        continue;
      }
      const sr = spellResistanceAfterPenetration(creature, caster);
      const finalTn = Math.floor(zone.spellBaseTn) + sr;
      const outcome = zoneApplicationOutcome(zone.castingTotal, finalTn);
      const updated = markZoneApplied(zone, roundKey, creatureId);
      changed = true;
      next.push(updated);
      const name = String(creature.name ?? 'Creature');
      const verb = outcome === 'affect' ? 'is affected' : 'resists';
      try {
        await (globalThis as any).ChatMessage?.create?.({
          speaker: (globalThis as any).ChatMessage?.getSpeaker?.({ actor: creature }),
          content: `<p><strong>${name}</strong> ${verb} <strong>${zone.name}</strong> (stored Casting ${zone.castingTotal} vs Final Spell TN ${finalTn}). The zone stays. No new Casting Roll.</p>`,
        });
      } catch {
        /* Chat is informational. The stored result still stands. */
      }
    }
    if (changed && typeof caster.setFlag === 'function') {
      await caster.setFlag('mastery-system', 'spellZones', next);
    }
  }
}
