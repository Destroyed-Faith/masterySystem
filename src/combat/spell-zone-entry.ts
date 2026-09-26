/**
 * When a creature moves, compare each stored Spell zone Casting result to
 * that creature's current Final Spell TN. No new Casting Roll. No Stress.
 * Each creature is affected at most once per Round.
 */

import { spellResistanceAfterPenetration } from './target-defenses.js';
import {
  markZoneApplied,
  readSpellZones,
  retainActiveSpellZones,
  spellZonesEntered,
  writeSpellZones,
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
    const currentRound = Number(combat.round) || 0;
    const active = retainActiveSpellZones(zones, currentRound);
    const sr = spellResistanceAfterPenetration(creature, caster);
    const hits = spellZonesEntered(active, {
      x,
      y,
      roundKey,
      creatureId,
      spellResistance: sr,
      distanceMeters: (cx, cy) => metersBetween(scene, cx, cy, x, y),
    });
    const hitById = new Map(hits.map((hit) => [hit.zoneId, hit]));
    const next: PersistentSpellZone[] = active.map((zone) => {
      if (!hitById.has(zone.id)) return zone;
      return markZoneApplied(zone, roundKey, creatureId);
    });
    const changed = active.length !== zones.length || hits.length > 0;
    for (const hit of hits) {
      const zone = active.find((entry) => entry.id === hit.zoneId);
      const name = String(creature.name ?? 'Creature');
      const verb = hit.outcome === 'affect' ? 'is affected by' : 'resists';
      try {
        await (globalThis as any).ChatMessage?.create?.({
          speaker: (globalThis as any).ChatMessage?.getSpeaker?.({ actor: creature }),
          content: `<p><strong>${name}</strong> ${verb} <strong>${zone?.name ?? 'Spell Zone'}</strong> (stored Casting ${hit.castingTotal} vs Final Spell TN ${hit.finalTn}). The zone stays. No new Casting Roll.</p>`,
        });
      } catch {
        /* Chat is informational. The stored result still stands. */
      }
    }
    if (changed) await writeSpellZones(caster, next);
  }
}
