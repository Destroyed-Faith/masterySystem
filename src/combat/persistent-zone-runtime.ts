/**
 * Persistent Zone runtime (Z02–Z06): create, maintain, apply, end.
 * Uses central applySpecialStringsToTarget — no parallel Special resolver.
 */

import { spendAttackAction, getAvailableAttackActions } from './action-economy.js';
import {
  appendSpellZone,
  createPersistentZone,
  creatureInsideZone,
  markZoneApplied,
  readSpellZones,
  removeSpellZone,
  selectZonesToMaintain,
  spellZonesEntered,
  writeSpellZones,
  zoneAlreadyApplied,
  zoneRoundKey,
  zoneSpecialLabel,
  type PersistentZone,
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

function tokenCenter(tokenDoc: any): { x: number; y: number } | null {
  const x = Number(tokenDoc?.x);
  const y = Number(tokenDoc?.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  const w = Number(tokenDoc?.width) || 1;
  const h = Number(tokenDoc?.height) || 1;
  const grid = Number(tokenDoc?.parent?.grid?.size) || 100;
  return { x: x + (w * grid) / 2, y: y + (h * grid) / 2 };
}

function sceneTokens(scene: any): any[] {
  const tokens = scene?.tokens?.contents ?? scene?.tokens;
  if (!tokens) return [];
  if (typeof tokens.values === 'function') return Array.from(tokens.values());
  if (Array.isArray(tokens)) return tokens;
  return [];
}

function newZoneId(creatorId: string): string {
  return `pz-${creatorId}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

export function isPersistentZonePower(item: any): boolean {
  const sys = item?.system ?? {};
  const tid = String(sys.templateId || '').toLowerCase();
  if (tid.includes('zone') && tid.includes('ranged')) return true;
  if (String(sys.subfamily || '').toLowerCase() === 'persistent-zone') return true;
  const typeStr = String(sys.levels?.[String(sys.rank || sys.level || 1)]?.type || sys.type || '');
  return /persistent\s*zone|ranged\s*zone/i.test(typeStr);
}

export function readZonePlacementProfile(item: any): {
  rangeMeters: number;
  radiusMeters: number;
  specialKey: string;
  specialRank: number;
  delivery: 'martial' | 'spell';
  templateId: string;
  technicalReference: string;
} | null {
  if (!item) return null;
  const sys = item.system ?? {};
  const lvl = Math.max(1, Math.floor(Number(sys.rank ?? sys.level) || 1));
  const row = sys.levels?.[String(lvl)] ?? sys.levels?.[lvl] ?? {};
  const aoe = row.aoe ?? sys.aoe ?? {};
  const radius = Math.max(0, Number(aoe.radiusM ?? aoe.sizeM ?? aoe.m) || 0);
  if (radius <= 0) return null;
  const rangeRaw = row.range ?? sys.range;
  let rangeMeters = 8;
  if (typeof rangeRaw === 'number') rangeMeters = rangeRaw;
  else if (rangeRaw && typeof rangeRaw === 'object') {
    rangeMeters = Math.max(0, Number(rangeRaw.m ?? rangeRaw.meters ?? rangeRaw.maxM) || 8);
  } else if (typeof rangeRaw === 'string') {
    const m = /(\d+(?:\.\d+)?)\s*m/i.exec(rangeRaw);
    if (m) rangeMeters = Number(m[1]);
  }
  const specials = row.specials ?? sys.specials ?? [];
  const chosen = String(sys.chosenSpecial || sys.selectedSpecial || '').trim();
  let specialKey = chosen.toLowerCase() || 'blight';
  let specialRank = 1;
  if (Array.isArray(specials) && specials.length) {
    const bound =
      specials.find((s: any) => String(s.key || '').toLowerCase() === specialKey) ||
      specials.find((s: any) => String(s.key || '').toUpperCase() === 'SPECIAL') ||
      specials[0];
    if (bound) {
      if (String(bound.key || '').toUpperCase() !== 'SPECIAL') {
        specialKey = String(bound.key || specialKey).toLowerCase();
      } else if (chosen) {
        specialKey = chosen.toLowerCase();
      }
      specialRank = Math.max(1, Math.floor(Number(bound.rank) || 1));
    }
  }
  if (sys.chosenSpecialRank != null) {
    specialRank = Math.max(1, Math.floor(Number(sys.chosenSpecialRank) || specialRank));
  }
  const tags = Array.isArray(sys.tags) ? sys.tags.map((t: any) => String(t).toLowerCase()) : [];
  const delivery: 'martial' | 'spell' = tags.includes('spell') ? 'spell' : 'martial';
  const templateId = String(sys.templateId || item.id || '');
  return {
    rangeMeters,
    radiusMeters: radius,
    specialKey,
    specialRank,
    delivery,
    templateId,
    technicalReference: templateId,
  };
}

async function deleteMeasuredTemplate(sceneId: string | null | undefined, templateId: string | null | undefined) {
  if (!sceneId || !templateId) return;
  try {
    const scene = (globalThis as any).game?.scenes?.get?.(sceneId);
    const tpl = scene?.templates?.get?.(templateId);
    if (tpl && typeof tpl.delete === 'function') await tpl.delete();
  } catch (err) {
    console.warn('Mastery System | Persistent Zone template cleanup failed', err);
  }
}

async function createMeasuredTemplate(args: {
  scene: any;
  x: number;
  y: number;
  radiusMeters: number;
  name: string;
}): Promise<string | null> {
  const scene = args.scene;
  if (!scene || typeof scene.createEmbeddedDocuments !== 'function') return null;
  try {
    const gridDistance = Number(scene.grid?.distance) || 1;
    const distance = Math.max(0.5, args.radiusMeters / gridDistance);
    const created = await scene.createEmbeddedDocuments('MeasuredTemplate', [
      {
        t: 'circle',
        user: (globalThis as any).game?.user?.id,
        x: args.x,
        y: args.y,
        distance,
        direction: 0,
        fillColor: '#7e57c2',
        borderColor: '#b39ddb',
        flags: {
          'mastery-system': {
            persistentZone: true,
            zoneName: args.name,
          },
        },
      },
    ]);
    return created?.[0]?.id ? String(created[0].id) : null;
  } catch (err) {
    console.warn('Mastery System | Persistent Zone MeasuredTemplate create failed', err);
    return null;
  }
}

/**
 * Place a Persistent Zone: spend 1 Attack Action, no rolls, apply Specials immediately.
 */
export async function createPersistentZoneFromPower(args: {
  creator: any;
  item: any;
  centerX: number;
  centerY: number;
  combat?: any | null;
  scene?: any | null;
  /** Skip Attack Action spend (tests / already paid). */
  skipActionSpend?: boolean;
}): Promise<{ ok: boolean; zone?: PersistentZone; reason?: string }> {
  const creator = args.creator;
  const profile = readZonePlacementProfile(args.item);
  if (!profile) {
    return { ok: false, reason: 'Not a legal Persistent Zone power (need Ranged zone radius > 0).' };
  }
  if (!Number.isFinite(args.centerX) || !Number.isFinite(args.centerY)) {
    return { ok: false, reason: 'Invalid placement point.' };
  }

  const combat = args.combat ?? (globalThis as any).game?.combat ?? null;
  if (!args.skipActionSpend) {
    const spent = await spendAttackAction(creator, combat);
    if (!spent) return { ok: false, reason: 'No Attack Action available to place the zone.' };
  }

  // Mark power used this Round (creation only — maintenance does not).
  try {
    if (combat && args.item?.id) {
      const { markPowerUsedThisRound } = await import('./action-economy.js');
      await markPowerUsedThisRound(creator, combat, String(args.item.id));
    }
  } catch {
    /* optional */
  }

  const scene = args.scene ?? (globalThis as any).canvas?.scene ?? null;
  const sceneId = scene?.id ? String(scene.id) : null;
  const zoneId = newZoneId(String(creator.id || 'creator'));
  const templateId = scene
    ? await createMeasuredTemplate({
        scene,
        x: args.centerX,
        y: args.centerY,
        radiusMeters: profile.radiusMeters,
        name: String(args.item.name || 'Persistent Zone'),
      })
    : null;

  const zone = createPersistentZone({
    id: zoneId,
    name: String(args.item.name || 'Persistent Zone'),
    creatorId: String(creator.id || ''),
    powerId: args.item.id ?? null,
    templateId: profile.templateId,
    technicalReference: profile.technicalReference,
    specialKey: profile.specialKey,
    specialRank: profile.specialRank,
    delivery: profile.delivery,
    sceneId,
    measuredTemplateId: templateId,
    createdRound: Math.max(1, Math.floor(Number(combat?.round) || 1)),
    centerX: args.centerX,
    centerY: args.centerY,
    radiusMeters: profile.radiusMeters,
  });

  const next = appendSpellZone(readSpellZones(creator), zone);
  await writeSpellZones(creator, next);

  // Immediate application to all creatures already inside (Z06 A) — including creator.
  await applyZoneToCreaturesInArea(creator, zone, combat, 'creation');

  try {
    (globalThis as any).ui?.notifications?.info?.(
      `${zone.name} placed (${profile.radiusMeters} m). Maintenance: 1 Attack Action at your Turn Start.`,
    );
  } catch {
    /* optional */
  }

  return { ok: true, zone };
}

async function applyZoneSpecialToCreature(
  zone: PersistentZone,
  creature: any,
  creator: any | null,
): Promise<void> {
  const label = zoneSpecialLabel(zone);
  if (!label || !creature) return;
  try {
    const { applySpecialStringsToTarget } = await import('./apply-special-effects.js');
    await applySpecialStringsToTarget(creature, [label], creator);
  } catch (err) {
    console.warn('Mastery System | Persistent Zone Special apply failed', err);
  }
}

/**
 * Apply zone Special to every creature currently inside, once per Round.
 */
export async function applyZoneToCreaturesInArea(
  creator: any,
  zone: PersistentZone,
  combat: any,
  _reason: 'creation' | 'entry' | 'turn-start',
): Promise<PersistentZone> {
  const combatId = combat?.id ? String(combat.id) : '';
  const round = Math.max(0, Math.floor(Number(combat?.round) || 0));
  const roundKey = zoneRoundKey(combatId, round);
  const scene =
    (zone.sceneId && (globalThis as any).game?.scenes?.get?.(zone.sceneId)) ||
    (globalThis as any).canvas?.scene ||
    null;
  let updated = zone;
  const tokens = sceneTokens(scene);
  for (const tok of tokens) {
    const actor = tok.actor ?? (globalThis as any).game?.actors?.get?.(tok.actorId);
    if (!actor) continue;
    const center = tokenCenter(tok);
    if (!center) continue;
    const dist = (cx: number, cy: number) => metersBetween(scene, cx, cy, center.x, center.y);
    if (!creatureInsideZone(updated, center.x, center.y, dist)) continue;
    const creatureId = String(actor.id || '');
    if (zoneAlreadyApplied(updated, roundKey, creatureId)) continue;
    await applyZoneSpecialToCreature(updated, actor, creator);
    updated = markZoneApplied(updated, roundKey, creatureId);
  }
  // Persist marks on creator
  const zones = readSpellZones(creator).map((z) => (z.id === updated.id ? updated : z));
  await writeSpellZones(creator, zones);
  return updated;
}

/** Movement entry: apply any zones the creature just entered (Z06 B). */
export async function applyPersistentZonesOnCreatureEnter(
  creature: any,
  tokenDoc: any,
  combat: any,
): Promise<void> {
  if (!creature || !combat) return;
  const center = tokenCenter(tokenDoc);
  if (!center) return;
  const scene = tokenDoc?.parent;
  const roundKey = zoneRoundKey(combat.id, Number(combat.round) || 0);
  const creatureId = String(creature.id ?? '');

  for (const creator of actorList()) {
    const zones = readSpellZones(creator);
    if (!zones.length) continue;
    const hits = spellZonesEntered(zones, {
      x: center.x,
      y: center.y,
      roundKey,
      creatureId,
      distanceMeters: (cx, cy) => metersBetween(scene, cx, cy, center.x, center.y),
    });
    if (!hits.length) continue;
    let next = zones.map((z) => ({ ...z, appliedByRound: { ...z.appliedByRound } }));
    for (const hit of hits) {
      const zone = next.find((z) => z.id === hit.zoneId);
      if (!zone) continue;
      await applyZoneSpecialToCreature(zone, creature, creator);
      next = next.map((z) =>
        z.id === hit.zoneId ? markZoneApplied(z, roundKey, creatureId) : z,
      );
      try {
        await (globalThis as any).ChatMessage?.create?.({
          speaker: (globalThis as any).ChatMessage?.getSpeaker?.({ actor: creature }),
          content: `<p><strong>${creature.name ?? 'Creature'}</strong> enters <strong>${zone.name}</strong> — ${zoneSpecialLabel(zone)} applied (once this Round from this zone).</p>`,
        });
      } catch {
        /* informational */
      }
    }
    await writeSpellZones(creator, next);
  }
}

/**
 * Target Turn Start (Z06 C): after ticks/recovery/decay, apply zones the
 * creature occupies if not yet applied this Round.
 */
export async function applyPersistentZonesAtTargetTurnStart(
  creature: any,
  combat: any,
): Promise<void> {
  if (!creature || !combat) return;
  const token =
    creature.getActiveTokens?.()?.[0]?.document ??
    creature.getActiveTokens?.()?.[0] ??
    null;
  const center = token ? tokenCenter(token) : null;
  if (!center) return;
  const scene = token?.parent ?? (globalThis as any).canvas?.scene;
  const roundKey = zoneRoundKey(combat.id, Number(combat.round) || 0);
  const creatureId = String(creature.id ?? '');

  for (const creator of actorList()) {
    const zones = readSpellZones(creator);
    if (!zones.length) continue;
    let next = zones.map((z) => ({ ...z, appliedByRound: { ...z.appliedByRound } }));
    let changed = false;
    for (const zone of zones) {
      const dist = (cx: number, cy: number) => metersBetween(scene, cx, cy, center.x, center.y);
      if (!creatureInsideZone(zone, center.x, center.y, dist)) continue;
      if (zoneAlreadyApplied(zone, roundKey, creatureId)) continue;
      await applyZoneSpecialToCreature(zone, creature, creator);
      next = next.map((z) =>
        z.id === zone.id ? markZoneApplied(z, roundKey, creatureId) : z,
      );
      changed = true;
    }
    if (changed) await writeSpellZones(creator, next);
  }
}

/** Voluntarily end one zone (no Action refund). */
export async function endPersistentZone(creator: any, zoneId: string): Promise<boolean> {
  const zones = readSpellZones(creator);
  const zone = zones.find((z) => z.id === zoneId);
  if (!zone) return false;
  await deleteMeasuredTemplate(zone.sceneId, zone.measuredTemplateId);
  await writeSpellZones(creator, removeSpellZone(zones, zoneId));
  try {
    (globalThis as any).ui?.notifications?.info?.(`${zone.name} ended.`);
  } catch {
    /* optional */
  }
  return true;
}

/** End all zones for a creator (combat end / incapacitated cleanup). */
export async function endAllPersistentZones(creator: any): Promise<void> {
  const zones = readSpellZones(creator);
  for (const zone of zones) {
    await deleteMeasuredTemplate(zone.sceneId, zone.measuredTemplateId);
  }
  await writeSpellZones(creator, []);
}

/**
 * Creator Turn Start maintenance (Z03).
 * Spends 1 Attack Action per kept zone. Unpaid zones end immediately.
 * Maintenance is NOT a new power activation and does NOT re-apply Specials.
 */
export async function maintainPersistentZonesAtCreatorTurnStart(
  creator: any,
  combat: any,
  preferredKeepIds?: string[] | null,
): Promise<{ kept: string[]; ended: string[] }> {
  const zones = readSpellZones(creator);
  if (!zones.length) return { kept: [], ended: [] };

  const available = getAvailableAttackActions(creator, combat);
  let preferred = preferredKeepIds ?? null;
  if (zones.length > available && available > 0 && (!preferred || !preferred.length)) {
    preferred = (await promptZoneMaintenanceSelection(creator, zones, available)) ?? preferred;
  }
  const { keep, end } = selectZonesToMaintain(
    zones.map((z) => z.id),
    available,
    preferred,
  );

  const kept: string[] = [];
  const ended: string[] = [...end];

  for (const id of keep) {
    const spent = await spendAttackAction(creator, combat);
    if (!spent) {
      ended.push(id);
      continue;
    }
    kept.push(id);
  }

  for (const id of ended) {
    await endPersistentZone(creator, id);
  }

  if (kept.length || ended.length) {
    try {
      const parts: string[] = [];
      if (kept.length) parts.push(`Maintained ${kept.length} zone(s) (−${kept.length} Attack Action)`);
      if (ended.length) parts.push(`Ended ${ended.length} unpaid zone(s)`);
      (globalThis as any).ui?.notifications?.info?.(parts.join('. '));
    } catch {
      /* optional */
    }
  }

  return { kept, ended };
}

/** Alias */
export const runPersistentZoneMaintenance = maintainPersistentZonesAtCreatorTurnStart;
export const maintainZonesAtTurnStart = maintainPersistentZonesAtCreatorTurnStart;

async function promptZoneMaintenanceSelection(
  creator: any,
  zones: PersistentZone[],
  available: number,
): Promise<string[] | null> {
  const DialogCtor = (globalThis as any).Dialog;
  if (!DialogCtor?.confirm && !DialogCtor) return null;
  try {
    const labels = zones
      .map(
        (z, i) =>
          `<label style="display:block;margin:0.25rem 0"><input type="checkbox" name="zone" value="${z.id}" ${i < available ? 'checked' : ''}/> ${z.name} — ${zoneSpecialLabel(z)} (${z.radiusMeters} m)</label>`,
      )
      .join('');
    const content = `<p>${creator.name ?? 'You'} can maintain <strong>${available}</strong> of <strong>${zones.length}</strong> Persistent Zones (1 Attack Action each). Select which to keep:</p>${labels}`;
    return await new Promise((resolve) => {
      new DialogCtor({
        title: 'Maintain Persistent Zones',
        content,
        buttons: {
          ok: {
            label: 'Confirm',
            callback: (html: any) => {
              const root = html?.[0] ?? html;
              const boxes = root?.querySelectorAll?.('input[name="zone"]:checked') ?? [];
              const ids = Array.from(boxes as any[]).map((el: any) => String(el.value));
              resolve(ids.slice(0, available));
            },
          },
          cancel: {
            label: 'Keep first available',
            callback: () => resolve(null),
          },
        },
        default: 'ok',
        close: () => resolve(null),
      }).render(true);
    });
  } catch {
    return null;
  }
}
