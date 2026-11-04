/**
 * Special Aura Active Buffs (Z05 / Batch 8 + 8.1): fourteen catalogue Powers.
 *
 * Moving Self-centered Active Buffs — not Persistent Zones, not Melee Attacks.
 * Automatic Special application via applySpecialStringsToTarget.
 * Once per (owner × templateId × creature × combat Round); tracking survives
 * A→B→A Prep swaps because it is keyed by stable source identity, not effect id.
 */

import { distanceBetweenActorsMeters } from './reaction-eligibility.js';

/** Official Batch 8.1 catalogue — 14 named Special Aura Active Buffs. */
export const SPECIAL_AURA_TEMPLATE_IDS = [
  'ab-blight-aura',
  'ab-challenge-aura',
  'ab-corrode-aura',
  'ab-disoriented-aura',
  'ab-expose-aura',
  'ab-hex-aura',
  'ab-lacerate-aura',
  'ab-mark-aura',
  'ab-root-aura',
  'ab-ruin-aura',
  'ab-slow-aura',
  'ab-soulburn-aura',
  'ab-sundered-aura',
  'ab-weaken-aura',
] as const;

export type SpecialAuraTemplateId = (typeof SPECIAL_AURA_TEMPLATE_IDS)[number];

export type SpecialAuraSpecialKey =
  | 'blight'
  | 'challenge'
  | 'corrode'
  | 'disoriented'
  | 'expose'
  | 'hex'
  | 'lacerate'
  | 'mark'
  | 'root'
  | 'ruin'
  | 'slow'
  | 'soulburn'
  | 'sundered'
  | 'weaken';

export const RETIRED_LEGACY_AURA_TEMPLATE_IDS = [
  'ab-armor-aura',
  'ab-damage-aura',
  'ab-summon-damage-aura',
  'ab-summon-armor-aura',
  'ab-armor-reduction-aura',
  'ab-allied-damage-aura',
] as const;

const FLAG_SCOPE = 'mastery-system';
const APPLIED_FLAG = 'specialAuraAppliedByRound';
const RADIUS_SLACK_M = 0.05;

export interface ActiveSpecialAuraState {
  templateId: SpecialAuraTemplateId;
  special: SpecialAuraSpecialKey;
  rank: number;
  radiusM: number;
  effectId: string | null;
  name: string;
  measuredTemplateId?: string | null;
  sceneId?: string | null;
}

export function isSpecialAuraTemplateId(id: string | null | undefined): id is SpecialAuraTemplateId {
  return (SPECIAL_AURA_TEMPLATE_IDS as readonly string[]).includes(String(id || '').trim());
}

export function isRetiredLegacyAuraTemplateId(id: string | null | undefined): boolean {
  return (RETIRED_LEGACY_AURA_TEMPLATE_IDS as readonly string[]).includes(String(id || '').trim());
}

/** Stable once-per-round source: owner + technical Aura Power (not effect UUID). */
export function specialAuraSourceKey(ownerId: string, templateId: string): string {
  return `${String(ownerId)}:${String(templateId)}`;
}

export function auraRoundKey(combatId: string, round: number): string {
  return `${combatId}:${Math.max(0, Math.floor(Number(round) || 0))}`;
}

export function specialAuraLabel(special: string, rank: number): string {
  const key = String(special || '').trim();
  const r = Math.max(0, Math.floor(Number(rank) || 0));
  if (!key || r <= 0) return '';
  const titled = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
  return `${titled}(${r})`;
}

type AppliedMap = Record<string, Record<string, string[]>>;

function readAppliedMap(combat: any): AppliedMap {
  const raw =
    combat?.getFlag?.(FLAG_SCOPE, APPLIED_FLAG) ??
    combat?.flags?.[FLAG_SCOPE]?.[APPLIED_FLAG] ??
    {};
  return raw && typeof raw === 'object' ? { ...(raw as AppliedMap) } : {};
}

async function writeAppliedMap(combat: any, map: AppliedMap): Promise<void> {
  if (!combat) return;
  try {
    if (typeof combat.setFlag === 'function') {
      await combat.setFlag(FLAG_SCOPE, APPLIED_FLAG, map);
    }
    combat.flags = combat.flags || {};
    combat.flags[FLAG_SCOPE] = { ...(combat.flags[FLAG_SCOPE] || {}), [APPLIED_FLAG]: map };
  } catch (err) {
    console.warn('Mastery System | special aura applied map write failed', err);
  }
}

export function auraAlreadyApplied(
  combat: any,
  sourceKey: string,
  roundKey: string,
  creatureId: string,
): boolean {
  const map = readAppliedMap(combat);
  return (map[sourceKey]?.[roundKey] ?? []).includes(String(creatureId));
}

export async function markAuraApplied(
  combat: any,
  sourceKey: string,
  roundKey: string,
  creatureId: string,
): Promise<void> {
  const id = String(creatureId);
  if (!combat || !sourceKey || !roundKey || !id) return;
  if (auraAlreadyApplied(combat, sourceKey, roundKey, id)) return;
  const map = readAppliedMap(combat);
  const byRound = { ...(map[sourceKey] || {}) };
  const prev = byRound[roundKey] ?? [];
  byRound[roundKey] = [...prev, id];
  map[sourceKey] = byRound;
  await writeAppliedMap(combat, map);
}

function masteryEffects(actor: any): any[] {
  const effects = actor?.effects;
  if (!effects) return [];
  if (Array.isArray(effects)) return effects;
  if (Array.isArray(effects?.contents)) return effects.contents;
  if (typeof effects[Symbol.iterator] === 'function') return Array.from(effects);
  return [];
}

function actorList(): any[] {
  const out: any[] = [];
  const seen = new Set<string>();
  const push = (actor: any) => {
    const id = String(actor?.id || '');
    if (!actor || !id || seen.has(id)) return;
    seen.add(id);
    out.push(actor);
  };
  const game = (globalThis as any).game;
  const bag = game?.combat?.combatants;
  const rows = bag
    ? typeof bag.values === 'function'
      ? Array.from(bag.values())
      : Array.isArray(bag)
        ? bag
        : []
    : [];
  for (const row of rows) push(row?.actor);
  const placeables = (globalThis as any).canvas?.tokens?.placeables ?? [];
  for (const token of placeables) push(token?.actor);
  const actors = game?.actors;
  const world = actors?.contents
    ? actors.contents
    : actors && typeof actors.values === 'function'
      ? Array.from(actors.values())
      : [];
  for (const actor of world) push(actor);
  return out;
}

export function readActiveSpecialAura(owner: any): ActiveSpecialAuraState | null {
  if (!owner) return null;
  for (const effect of masteryEffects(owner)) {
    if (effect?.disabled) continue;
    const flags = effect?.flags?.[FLAG_SCOPE];
    if (!flags?.activeBuff) continue;
    const tpl = String(flags.powerTemplateId || flags.templateId || '').trim();
    if (!isSpecialAuraTemplateId(tpl)) continue;
    const mech = flags.mechanics?.activeSpecialAura ?? flags.mechanics?.auraPayload;
    const special = String(mech?.special || tpl.replace(/^ab-|-aura$/g, '') || '')
      .trim()
      .toLowerCase() as SpecialAuraSpecialKey;
    const rank = Math.max(0, Math.floor(Number(mech?.rank ?? mech?.x) || 0));
    const radiusM = Math.max(0, Number(mech?.radiusM) || 0);
    if (rank <= 0 || radiusM <= 0) continue;
    const allowed: ReadonlySet<string> = new Set([
      'blight',
      'challenge',
      'corrode',
      'disoriented',
      'expose',
      'hex',
      'lacerate',
      'mark',
      'root',
      'ruin',
      'slow',
      'soulburn',
      'sundered',
      'weaken',
    ]);
    if (!allowed.has(special)) continue;
    return {
      templateId: tpl,
      special,
      rank,
      radiusM,
      effectId: effect.id ? String(effect.id) : null,
      name: String(effect.name || flags.powerName || tpl),
      measuredTemplateId: flags.specialAuraMeasuredTemplateId
        ? String(flags.specialAuraMeasuredTemplateId)
        : null,
      sceneId: flags.specialAuraSceneId ? String(flags.specialAuraSceneId) : null,
    };
  }
  return null;
}

export function creatureInsideSpecialAura(
  owner: any,
  creature: any,
  radiusM: number,
): boolean {
  if (!owner || !creature) return false;
  if (String(owner.id) === String(creature.id)) return false; // owner immune
  const meters = distanceBetweenActorsMeters(owner, creature);
  if (meters == null || !Number.isFinite(meters)) return false;
  return meters <= Math.max(0, Number(radiusM) || 0) + RADIUS_SLACK_M;
}

async function applyAuraSpecial(
  owner: any,
  creature: any,
  aura: ActiveSpecialAuraState,
): Promise<void> {
  const label = specialAuraLabel(aura.special, aura.rank);
  if (!label || !creature) return;
  try {
    const { applySpecialStringsToTarget } = await import('./apply-special-effects.js');
    await applySpecialStringsToTarget(creature, [label], owner);
  } catch (err) {
    console.warn('Mastery System | Special Aura apply failed', err);
  }
}

/**
 * Apply aura Special to every non-owner creature currently inside (activation / owner-move).
 */
export async function applySpecialAuraToCreaturesInRadius(
  owner: any,
  combat: any,
  reason: 'activation' | 'owner-move' | 'entry' | 'turn-start',
): Promise<string[]> {
  const aura = readActiveSpecialAura(owner);
  if (!aura || !combat) return [];
  const sourceKey = specialAuraSourceKey(String(owner.id), aura.templateId);
  const roundKey = auraRoundKey(String(combat.id || ''), Number(combat.round) || 0);
  const notes: string[] = [];
  for (const creature of actorList()) {
    if (String(creature.id) === String(owner.id)) continue;
    if (!creatureInsideSpecialAura(owner, creature, aura.radiusM)) continue;
    const creatureId = String(creature.id);
    if (auraAlreadyApplied(combat, sourceKey, roundKey, creatureId)) continue;
    await applyAuraSpecial(owner, creature, aura);
    await markAuraApplied(combat, sourceKey, roundKey, creatureId);
    notes.push(`${creature.name ?? creatureId}: ${specialAuraLabel(aura.special, aura.rank)}`);
  }
  if (notes.length && reason === 'activation') {
    try {
      await (globalThis as any).ChatMessage?.create?.({
        speaker: (globalThis as any).ChatMessage?.getSpeaker?.({ actor: owner }),
        content: `<p><strong>${aura.name}</strong> (${reason}): ${notes.join('; ')}</p>`,
      });
    } catch {
      /* optional */
    }
  }
  return notes;
}

/** Movement: mover may enter others' auras; if mover owns an aura, refresh coverage. */
export async function applySpecialAurasOnTokenMove(
  mover: any,
  _tokenDoc: any,
  combat: any,
): Promise<void> {
  if (!mover || !combat) return;

  // Owner moved → re-check everyone in the moving aura.
  if (readActiveSpecialAura(mover)) {
    await applySpecialAuraToCreaturesInRadius(mover, combat, 'owner-move');
  }

  // Mover entered other auras.
  const moverId = String(mover.id);
  const roundKey = auraRoundKey(String(combat.id || ''), Number(combat.round) || 0);
  for (const owner of actorList()) {
    if (String(owner.id) === moverId) continue;
    const aura = readActiveSpecialAura(owner);
    if (!aura) continue;
    if (!creatureInsideSpecialAura(owner, mover, aura.radiusM)) continue;
    const sourceKey = specialAuraSourceKey(String(owner.id), aura.templateId);
    if (auraAlreadyApplied(combat, sourceKey, roundKey, moverId)) continue;
    await applyAuraSpecial(owner, mover, aura);
    await markAuraApplied(combat, sourceKey, roundKey, moverId);
  }

  await syncSpecialAuraVisual(mover);
}

/** Target Turn Start — after ticks / recovery / decay / zones. */
export async function applySpecialAurasAtTargetTurnStart(
  creature: any,
  combat: any,
): Promise<void> {
  if (!creature || !combat) return;
  const creatureId = String(creature.id);
  const roundKey = auraRoundKey(String(combat.id || ''), Number(combat.round) || 0);
  for (const owner of actorList()) {
    const aura = readActiveSpecialAura(owner);
    if (!aura) continue;
    if (String(owner.id) === creatureId) continue; // immune to own
    if (!creatureInsideSpecialAura(owner, creature, aura.radiusM)) continue;
    const sourceKey = specialAuraSourceKey(String(owner.id), aura.templateId);
    if (auraAlreadyApplied(combat, sourceKey, roundKey, creatureId)) continue;
    await applyAuraSpecial(owner, creature, aura);
    await markAuraApplied(combat, sourceKey, roundKey, creatureId);
  }
}

async function deleteMeasuredTemplate(sceneId: string | null | undefined, templateId: string | null | undefined) {
  if (!sceneId || !templateId) return;
  try {
    const scene = (globalThis as any).game?.scenes?.get?.(sceneId);
    const tpl = scene?.templates?.get?.(templateId);
    if (tpl && typeof tpl.delete === 'function') await tpl.delete();
  } catch (err) {
    console.warn('Mastery System | Special Aura template cleanup failed', err);
  }
}

function tokenCenter(actor: any): { x: number; y: number; scene: any } | null {
  try {
    const token =
      actor?.getActiveTokens?.(true, true)?.[0] ??
      actor?.getActiveTokens?.()?.[0] ??
      null;
    const doc = token?.document ?? token;
    if (!doc) return null;
    const scene = doc.parent ?? (globalThis as any).canvas?.scene;
    const x = Number(doc.x);
    const y = Number(doc.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    const w = Number(doc.width) || 1;
    const h = Number(doc.height) || 1;
    const grid = Number(scene?.grid?.size) || 100;
    return { x: x + (w * grid) / 2, y: y + (h * grid) / 2, scene };
  } catch {
    return null;
  }
}

/** Create or move the visual circle with the owner token (not a second runtime aura). */
export async function syncSpecialAuraVisual(owner: any): Promise<void> {
  const aura = readActiveSpecialAura(owner);
  const effect = masteryEffects(owner).find((e) => {
    const flags = e?.flags?.[FLAG_SCOPE];
    return flags?.activeBuff && isSpecialAuraTemplateId(flags?.powerTemplateId);
  });
  if (!aura || !effect) {
    // Clean orphan templates flagged on any buff effects
    for (const e of masteryEffects(owner)) {
      const flags = e?.flags?.[FLAG_SCOPE];
      if (flags?.specialAuraMeasuredTemplateId) {
        await deleteMeasuredTemplate(flags.specialAuraSceneId, flags.specialAuraMeasuredTemplateId);
      }
    }
    return;
  }
  const center = tokenCenter(owner);
  if (!center?.scene) return;
  const flags = effect.flags?.[FLAG_SCOPE] ?? {};
  let templateId = flags.specialAuraMeasuredTemplateId ? String(flags.specialAuraMeasuredTemplateId) : null;
  const sceneId = String(center.scene.id || '');
  if (templateId) {
    try {
      const tpl = center.scene.templates?.get?.(templateId);
      if (tpl && typeof tpl.update === 'function') {
        await tpl.update({ x: center.x, y: center.y });
        return;
      }
    } catch {
      templateId = null;
    }
  }
  try {
    const gridDistance = Number(center.scene.grid?.distance) || 1;
    const distance = Math.max(0.5, aura.radiusM / gridDistance);
    const created = await center.scene.createEmbeddedDocuments?.('MeasuredTemplate', [
      {
        t: 'circle',
        user: (globalThis as any).game?.user?.id,
        x: center.x,
        y: center.y,
        distance,
        direction: 0,
        fillColor: '#c62828',
        borderColor: '#ef9a9a',
        flags: {
          [FLAG_SCOPE]: {
            specialAura: true,
            ownerId: String(owner.id),
            templateId: aura.templateId,
          },
        },
      },
    ]);
    const id = created?.[0]?.id ? String(created[0].id) : null;
    if (id && typeof effect.setFlag === 'function') {
      await effect.setFlag(FLAG_SCOPE, 'specialAuraMeasuredTemplateId', id);
      await effect.setFlag(FLAG_SCOPE, 'specialAuraSceneId', sceneId);
    } else if (id && effect.flags) {
      effect.flags[FLAG_SCOPE] = {
        ...effect.flags[FLAG_SCOPE],
        specialAuraMeasuredTemplateId: id,
        specialAuraSceneId: sceneId,
      };
    }
  } catch (err) {
    console.warn('Mastery System | Special Aura visual create failed', err);
  }
}

/** Buff end / replace — drop visual only; applied Specials and round marks remain. */
export async function cleanupSpecialAuraVisual(owner: any, effect?: any): Promise<void> {
  const targets = effect ? [effect] : masteryEffects(owner);
  for (const e of targets) {
    const flags = e?.flags?.[FLAG_SCOPE];
    if (!flags?.specialAuraMeasuredTemplateId) continue;
    await deleteMeasuredTemplate(flags.specialAuraSceneId, flags.specialAuraMeasuredTemplateId);
    try {
      if (typeof e.unsetFlag === 'function') {
        await e.unsetFlag(FLAG_SCOPE, 'specialAuraMeasuredTemplateId');
        await e.unsetFlag(FLAG_SCOPE, 'specialAuraSceneId');
      }
    } catch {
      /* best-effort */
    }
  }
}

/** After successful Active Buff activation of a Special Aura. */
export async function onSpecialAuraActivated(owner: any, combat: any): Promise<void> {
  if (!readActiveSpecialAura(owner)) return;
  await syncSpecialAuraVisual(owner);
  if (combat) {
    await applySpecialAuraToCreaturesInRadius(owner, combat, 'activation');
  }
}
