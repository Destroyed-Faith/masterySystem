/**
 * The ten Movement Powers as distinct token movements.
 *
 * A successful use spends one Movement and replaces that Movement's distance
 * and mode. The same technical Power cannot be used twice in one round.
 * Other Movements stay available. Phase Passage travels at Speed; its printed
 * number is material thickness and is not increased by Movement Enhancement.
 *
 * Flight, Leap, Wall Walk, Burrow, and Phase Passage need a player or GM
 * confirmation for height, surface, or material. That confirmation is not an
 * automatic collision or material scan.
 */

import { getRoundState, spendMovementPowerAction } from './action-economy.js';
import {
  enhancementMetersFromActor,
  movementActionMeters,
  sceneMeters,
} from './movement-allowance.js';
import { movementReductionActive } from '../stones/stone-combat-effects.js';
import { planThreatZoneWindows, type ThreatPlan } from './threat-zone.js';
import { MOVEMENT_TEMPLATES } from '../utils/powers/templates/movement.js';

export type MovementPowerMode =
  | 'ground-dash'
  | 'safe'
  | 'teleport'
  | 'teleport-ally'
  | 'flight'
  | 'leap'
  | 'wall-walk'
  | 'burrow'
  | 'phase-passage'
  | 'trample';

export interface MovementPowerLevel {
  templateId: string;
  name: string;
  mode: MovementPowerMode;
  level: number;
  available: boolean;
  /** Printed travel meters. Null for Phase Passage, which uses Speed. */
  travelMeters: number | null;
  verticalMeters: number;
  materialMeters: number;
  trampleDice: number;
  traversal: 'path' | 'teleport' | 'safe';
  /** Height, surface, or material is confirmed, not scanned. */
  needsGuidance: boolean;
}

export interface MovementGuidance {
  destinationVisible?: boolean;
  destinationFree?: boolean;
  landingLegal?: boolean;
  canRemainAloft?: boolean;
  surfaceContact?: boolean;
  suitableMaterial?: boolean;
  materialThicknessMeters?: number;
  endsOutsideSolid?: boolean;
  arcLegal?: boolean;
}

const NAMES: Record<string, string> = {
  'movement-ground-dash': 'Ground Dash',
  'movement-safe-movement': 'Safe Movement',
  'movement-teleport': 'Teleport',
  'movement-teleport-with-ally': 'Teleport with Ally',
  'movement-flight': 'Flight',
  'movement-leap': 'Leap',
  'movement-wall-walk': 'Wall Walk',
  'movement-burrow': 'Burrow',
  'movement-phase-passage': 'Phase Passage',
  'movement-trample': 'Trample',
};

export function movementPowerLevel(templateId: string, level: number): MovementPowerLevel | null {
  const template = MOVEMENT_TEMPLATES.find((row) => row.templateId === templateId);
  if (!template) return null;
  const key = String(Math.max(1, Math.min(16, Math.floor(level))));
  const row = template.levels[key as '1'];
  if (!row) return null;
  const mechanics = row.mechanics as {
    movementMode?: MovementPowerMode;
    movementBonus?: number;
    verticalMeters?: number;
    materialThicknessMeters?: number;
    trampleDice?: number;
    movementUnavailable?: boolean;
  };
  const mode = mechanics.movementMode;
  if (!mode || !NAMES[templateId]) return null;
  const printed = Math.max(0, Number(mechanics.movementBonus) || 0);
  const phase = mode === 'phase-passage';
  return {
    templateId,
    name: NAMES[templateId],
    mode,
    level: Number(key),
    available: mechanics.movementUnavailable !== true,
    travelMeters: phase ? null : printed,
    verticalMeters: Math.max(0, Number(mechanics.verticalMeters) || 0),
    materialMeters: phase ? Math.max(0, Number(mechanics.materialThicknessMeters) || 0) : 0,
    trampleDice: Math.max(0, Number(mechanics.trampleDice) || 0),
    traversal: mode === 'teleport' || mode === 'teleport-ally' ? 'teleport' : mode === 'safe' ? 'safe' : 'path',
    needsGuidance: mode === 'flight' || mode === 'leap' || mode === 'wall-walk' || mode === 'burrow' || phase,
  };
}

export function movementPowerBudget(input: {
  templateId: string;
  level: number;
  speed: number;
  enhancement?: number;
  reduced?: boolean;
}): { available: boolean; basisMeters: number; allowedMeters: number; materialMeters: number; level: MovementPowerLevel } | null {
  const level = movementPowerLevel(input.templateId, input.level);
  if (!level) return null;
  const speed = Math.max(0, Number(input.speed) || 0);
  const basis = level.travelMeters == null ? speed : level.travelMeters;
  const allowed = movementActionMeters({
    kind: 'power',
    speed,
    enhancement: input.enhancement ?? 0,
    powerMeters: basis,
    reduced: !!input.reduced,
  }).meters;
  return {
    available: level.available,
    basisMeters: basis,
    allowedMeters: allowed,
    materialMeters: level.materialMeters,
    level,
  };
}

function metersBetween(token: any, ax: number, ay: number, bx: number, by: number): number {
  return sceneMeters(token, bx - ax, by - ay);
}

/** Tokens of other creatures currently within `maxMeters` of the mover (top-left). */
export function listTeleportAllyCandidates(
  mover: any,
  tokens: any[],
  maxMeters = 2,
): Array<{ token: any; meters: number; name: string }> {
  const doc = mover?.document ?? mover;
  const from = { x: Number(doc?.x) || 0, y: Number(doc?.y) || 0 };
  const selfId = String(doc?.id || '');
  const out: Array<{ token: any; meters: number; name: string }> = [];
  for (const raw of tokens ?? []) {
    const other = raw?.document ?? raw;
    if (!other || String(other.id || '') === selfId) continue;
    if (!other.actor) continue;
    const ox = Number(other.x) || 0;
    const oy = Number(other.y) || 0;
    const meters = metersBetween(doc, from.x, from.y, ox, oy);
    if (meters > maxMeters + 0.05) continue;
    out.push({
      token: other,
      meters,
      name: String(other.actor?.name || other.name || 'Ally'),
    });
  }
  out.sort((a, b) => a.meters - b.meters || a.name.localeCompare(b.name));
  return out;
}

/**
 * Ask for a willing ally within 2 m and place their destination with the same
 * relative offset as the mover's teleport. Used by the guided movement path.
 */
export async function resolveTeleportAllyForGuidedMove(input: {
  mover: any;
  dest: { x: number; y: number; elevation?: number };
  tokens?: any[];
}): Promise<{ token: any; dest: { x: number; y: number; elevation?: number }; willing: boolean } | null> {
  const mover = input.mover?.document ?? input.mover;
  const tokens = input.tokens ?? (globalThis as any).canvas?.tokens?.placeables ?? [];
  const candidates = listTeleportAllyCandidates(mover, tokens, 2);
  if (!candidates.length) {
    (globalThis as any).ui?.notifications?.warn?.('Teleport with Ally needs a willing ally within 2 m.');
    return null;
  }
  let chosen = candidates[0]!;
  if (candidates.length > 1) {
    const DialogV2 = (globalThis as any).foundry?.applications?.api?.DialogV2;
    const Dialog = (globalThis as any).Dialog;
    if (typeof DialogV2?.prompt === 'function') {
      try {
        const optionsHtml = candidates
          .map((c, i) => `<option value="${i}">${c.name} (${c.meters.toFixed(1)} m)</option>`)
          .join('');
        const picked = await DialogV2.prompt({
          window: { title: 'Teleport with Ally' },
          content: `<form><p>Choose one willing ally within 2 m.</p><select name="ally">${optionsHtml}</select></form>`,
          ok: {
            label: 'Teleport',
            callback: (_e: unknown, button: any) => String(button?.form?.elements?.ally?.value ?? '0'),
          },
        });
        const idx = Math.max(0, Math.min(candidates.length - 1, Math.floor(Number(picked) || 0)));
        chosen = candidates[idx]!;
      } catch {
        return null;
      }
    } else if (typeof Dialog?.confirm === 'function') {
      const ok = await Dialog.confirm({
        title: 'Teleport with Ally',
        content: `<p>Teleport with <strong>${chosen.name}</strong>?</p>`,
      });
      if (!ok) return null;
    }
  }
  const allyDoc = chosen.token;
  const from = { x: Number(mover.x) || 0, y: Number(mover.y) || 0 };
  const allyFrom = { x: Number(allyDoc.x) || 0, y: Number(allyDoc.y) || 0 };
  const allyDest = {
    x: Number(input.dest.x) + (allyFrom.x - from.x),
    y: Number(input.dest.y) + (allyFrom.y - from.y),
    elevation:
      input.dest.elevation != null
        ? Number(input.dest.elevation)
        : Number(allyDoc.elevation) || 0,
  };
  return { token: allyDoc, dest: allyDest, willing: true };
}

function pointToSegmentMeters(
  token: any,
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const abx = bx - ax;
  const aby = by - ay;
  const len2 = abx * abx + aby * aby;
  const t = len2 <= 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / len2));
  return metersBetween(token, px, py, ax + abx * t, ay + aby * t);
}

function tokenCenter(token: any): { x: number; y: number } {
  const doc = token?.document ?? token;
  const width = Number(doc.width) || 1;
  const height = Number(doc.height) || 1;
  const grid = Number(doc.parent?.grid?.size) || 100;
  return {
    x: (Number(doc.x) || 0) + (width * grid) / 2,
    y: (Number(doc.y) || 0) + (height * grid) / 2,
  };
}

export function creaturesOnMovementPath(
  mover: any,
  from: { x: number; y: number },
  to: { x: number; y: number },
  tokens: any[],
): any[] {
  const seen = new Set<string>();
  const hits: any[] = [];
  const moverId = String((mover?.document ?? mover)?.id || '');
  for (const token of tokens) {
    const doc = token?.document ?? token;
    const id = String(doc?.id || '');
    if (!id || id === moverId || seen.has(id)) continue;
    const center = tokenCenter(doc);
    const gap = pointToSegmentMeters(mover, center.x, center.y, from.x, from.y, to.x, to.y);
    if (gap > 1.05) continue;
    seen.add(id);
    hits.push(doc);
  }
  return hits;
}

function pathCrossesWall(token: any, from: { x: number; y: number }, to: { x: number; y: number }): boolean {
  const walls = token?.parent?.walls ?? (globalThis as any).canvas?.walls?.placeables ?? [];
  if (!Array.isArray(walls) || walls.length === 0) return false;
  for (const wall of walls) {
    const c = wall?.c ?? wall?.document?.c;
    if (!Array.isArray(c) || c.length < 4) continue;
    if (segmentsCross(from.x, from.y, to.x, to.y, c[0], c[1], c[2], c[3])) return true;
  }
  return false;
}

function segmentsCross(ax: number, ay: number, bx: number, by: number, cx: number, cy: number, dx: number, dy: number): boolean {
  const d = (bx - ax) * (dy - cy) - (by - ay) * (dx - cx);
  if (d === 0) return false;
  const t = ((cx - ax) * (dy - cy) - (cy - ay) * (dx - cx)) / d;
  const u = ((cx - ax) * (by - ay) - (cy - ay) * (bx - ax)) / d;
  return t > 0.02 && t < 0.98 && u > 0.02 && u < 0.98;
}

function spaceOccupied(dest: { x: number; y: number }, tokens: any[], ignore: Set<string>): boolean {
  for (const token of tokens) {
    const doc = token?.document ?? token;
    const id = String(doc?.id || '');
    if (!id || ignore.has(id)) continue;
    const gap = sceneMeters(
      { parent: token?.parent },
      (Number(doc.x) || 0) - dest.x,
      (Number(doc.y) || 0) - dest.y,
    );
    if (gap < 0.75) return true;
  }
  return false;
}

async function confirmGuidance(level: MovementPowerLevel, guidance?: MovementGuidance): Promise<string | null> {
  if (!level.needsGuidance) return null;
  if (!guidance) {
    const Dialog = (globalThis as any).Dialog;
    if (typeof Dialog?.confirm !== 'function') {
      return `${level.name} needs a player or GM confirmation. Foundry has no automatic check for this.`;
    }
    const ok = await Dialog.confirm({
      title: level.name,
      content:
        `<p><strong>${level.name}</strong> cannot be fully checked from the map.</p>` +
        `<p>Confirm the legal height, surface, material, or landing. This is not an automatic collision scan.</p>`,
    });
    return ok ? null : `${level.name} was not confirmed.`;
  }
  if (level.mode === 'flight') {
    return null;
  }
  if (level.mode === 'leap' && guidance.arcLegal !== true) {
    return 'Leap needs a confirmed legal arc and landing point.';
  }
  if (level.mode === 'wall-walk' && guidance.surfaceContact !== true) {
    return 'Wall Walk needs contact with a solid surface.';
  }
  if (level.mode === 'burrow' && guidance.suitableMaterial !== true) {
    return 'Burrow only moves through suitable soft material.';
  }
  if (level.mode === 'phase-passage') {
    if (guidance.endsOutsideSolid !== true) return 'Phase Passage must end outside solid material.';
    if (guidance.materialThicknessMeters == null) return 'Phase Passage needs the material thickness of this route.';
    if (guidance.materialThicknessMeters > level.materialMeters + 0.001) {
      return `Phase Passage material thickness is capped at ${level.materialMeters} m.`;
    }
  }
  return null;
}

export async function executeMovementPower(input: {
  token: any;
  templateId: string;
  level: number;
  dest: { x: number; y: number; elevation?: number };
  ally?: { token: any; dest: { x: number; y: number; elevation?: number }; willing: boolean };
  tokens?: any[];
  guidance?: MovementGuidance;
  /** Already-rolled Trample total. Omitted totals are rolled as plain d8s. */
  trampleTotal?: number;
  combat?: { id?: string; round?: number; started?: boolean; combatant?: any } | null;
}): Promise<{
  ok: boolean;
  reason: string;
  spent: boolean;
  traversal: string;
  allowedMeters: number;
  threat: ThreatPlan | null;
  trample: Array<{ id: string; raw: number; applied: number }>;
}> {
  const fail = (reason: string, traversal = 'path') => ({
    ok: false,
    reason,
    spent: false,
    traversal,
    allowedMeters: 0,
    threat: null,
    trample: [] as Array<{ id: string; raw: number; applied: number }>,
  });
  const token = input.token?.document ?? input.token;
  const actor = token?.actor;
  if (!token || !actor) return fail('No token.');
  const spec = movementPowerLevel(input.templateId, input.level);
  if (!spec) return fail('Unknown Movement Power.');
  if (!spec.available) return fail(`${spec.name} has no effect at Power Level ${spec.level}.`);

  const combat = input.combat !== undefined ? input.combat : (globalThis as any).game?.combat ?? null;
  const round = getRoundState(actor, combat as any);
  if ((round.usedMovementPowerIds ?? []).includes(spec.templateId)) {
    return fail(`${spec.name} was already used this round.`, spec.traversal);
  }
  if (round.movementActions.used >= round.movementActions.total) {
    return fail('No Movement actions left.', spec.traversal);
  }

  const speed = Number(actor?.system?.combat?.speed) || 0;
  const reduced = movementReductionActive(actor);
  const budget = movementPowerBudget({
    templateId: spec.templateId,
    level: spec.level,
    speed,
    enhancement: enhancementMetersFromActor(actor),
    reduced,
  });
  if (!budget) return fail('No budget.', spec.traversal);

  const from = { x: Number(token.x) || 0, y: Number(token.y) || 0 };
  const dest = { x: Number(input.dest.x), y: Number(input.dest.y) };
  const horizontal = metersBetween(token, from.x, from.y, dest.x, dest.y);
  const elevationFrom = Number(token.elevation) || 0;
  const elevationTo = input.dest.elevation != null ? Number(input.dest.elevation) : elevationFrom;
  const vertical = Math.abs(elevationTo - elevationFrom);
  if (horizontal <= 0.01 && vertical <= 0.01 && spec.mode !== 'teleport-ally') {
    return fail('No movement.', spec.traversal);
  }

  if (spec.mode === 'leap') {
    if (horizontal > budget.allowedMeters + 0.05) return fail('Leap horizontal distance exceeds the Power.', spec.traversal);
    const verticalCap = reduced
      ? Math.round(spec.verticalMeters / 2)
      : spec.verticalMeters;
    if (vertical > verticalCap + 0.05) return fail('Leap vertical distance exceeds the Power.', spec.traversal);
  } else if (spec.mode === 'flight') {
    const flown = Math.hypot(horizontal, vertical);
    if (flown > budget.allowedMeters + 0.05) return fail('Flight distance exceeds the Power.', spec.traversal);
    if (elevationTo !== 0 && input.guidance?.canRemainAloft !== true && input.guidance?.landingLegal !== true) {
      return fail('Flight must end where the creature can remain, or on the ground.', spec.traversal);
    }
  } else if (horizontal > budget.allowedMeters + 0.05) {
    return fail(`${spec.name} distance exceeds the Power.`, spec.traversal);
  }

  const guideError = await confirmGuidance(spec, input.guidance);
  if (guideError) return fail(guideError, spec.traversal);

  if (spec.mode === 'phase-passage' && input.guidance) {
    const thickness = Number(input.guidance.materialThicknessMeters) || 0;
    if (thickness > spec.materialMeters + 0.001) {
      return fail(`Phase Passage material thickness is capped at ${spec.materialMeters} m.`, spec.traversal);
    }
  }

  const others = input.tokens ?? (globalThis as any).canvas?.tokens?.placeables ?? [];
  const ignore = new Set<string>([String(token.id || '')]);
  if (spec.traversal !== 'teleport' && pathCrossesWall(token, from, dest)) {
    return fail(`${spec.name} cannot pass through a wall.`, spec.traversal);
  }
  if (spec.mode === 'teleport' || spec.mode === 'teleport-ally') {
    let visible = input.guidance?.destinationVisible;
    if (visible == null) {
      const visibility = (globalThis as any).canvas?.visibility;
      if (typeof visibility?.testVisibility === 'function') {
        visible = !!visibility.testVisibility(dest);
      } else {
        const Dialog = (globalThis as any).Dialog;
        visible = typeof Dialog?.confirm === 'function'
          ? await Dialog.confirm({
              title: spec.name,
              content: '<p>Confirm that the destination is visible. The map did not report vision.</p>',
            })
          : false;
      }
    }
    if (visible !== true) return fail('Teleport needs a visible destination.', spec.traversal);
  }
  if (spaceOccupied(dest, others, ignore) || input.guidance?.destinationFree === false) {
    return fail('The destination is not a free space.', spec.traversal);
  }

  let allyDoc: any = null;
  let allyFrom = { x: 0, y: 0 };
  if (spec.mode === 'teleport-ally') {
    if (!input.ally?.willing) return fail('Teleport with Ally needs one willing ally.', spec.traversal);
    allyDoc = input.ally.token?.document ?? input.ally.token;
    if (!allyDoc) return fail('Teleport with Ally needs one willing ally.', spec.traversal);
    allyFrom = { x: Number(allyDoc.x) || 0, y: Number(allyDoc.y) || 0 };
    if (metersBetween(token, from.x, from.y, allyFrom.x, allyFrom.y) > 2.05) {
      return fail('The ally must be within 2 m.', spec.traversal);
    }
    const allyDest = { x: Number(input.ally.dest.x), y: Number(input.ally.dest.y) };
    if (metersBetween(token, allyFrom.x, allyFrom.y, allyDest.x, allyDest.y) > budget.allowedMeters + 0.05) {
      return fail('The ally destination is out of range.', spec.traversal);
    }
    const allyIgnore = new Set<string>([String(token.id || ''), String(allyDoc.id || '')]);
    if (spaceOccupied(allyDest, others, allyIgnore)) return fail('The ally destination is not free.', spec.traversal);
  }

  const flags = token.flags ?? (token.flags = {});
  const bag = flags['mastery-system'] ?? (flags['mastery-system'] = {});
  bag.movementTraversal = spec.traversal;
  bag.currentAction = {
    category: 'movement',
    optionId: spec.templateId,
    powerType: 'movement',
    basisMeters: budget.basisMeters,
  };
  if (typeof token.setFlag === 'function') {
    await token.setFlag('mastery-system', 'movementTraversal', spec.traversal);
    await token.setFlag('mastery-system', 'currentAction', bag.currentAction);
  }

  const spent = await spendMovementPowerAction(actor, combat as any, spec.templateId);
  if (!spent) return fail('The Movement could not be spent.', spec.traversal);

  const { MASTERY_AUTHORIZED_MOVE } = await import('./token-move-gate.js');
  const auth = { [MASTERY_AUTHORIZED_MOVE]: true };
  const write = typeof token.update === 'function'
    ? token.update.bind(token)
    : null;
  if (write) await write({ x: dest.x, y: dest.y, elevation: elevationTo }, auth);
  else {
    token.x = dest.x;
    token.y = dest.y;
    token.elevation = elevationTo;
  }

  if (spec.mode === 'teleport-ally' && allyDoc && input.ally) {
    const allyDest = { x: Number(input.ally.dest.x), y: Number(input.ally.dest.y) };
    if (typeof allyDoc.update === 'function') {
      await allyDoc.update(
        { x: allyDest.x, y: allyDest.y, elevation: input.ally.dest.elevation ?? allyDoc.elevation },
        auth,
      );
    } else {
      allyDoc.x = allyDest.x;
      allyDoc.y = allyDest.y;
    }
    if (typeof allyDoc.setFlag === 'function') {
      await allyDoc.setFlag('mastery-system', 'movementTraversal', 'teleport');
    }
  }

  const trample: Array<{ id: string; raw: number; applied: number }> = [];
  if (spec.mode === 'trample') {
    const raw = input.trampleTotal != null
      ? Math.max(0, Math.floor(input.trampleTotal))
      : await rollD8s(spec.trampleDice);
    const crossed = creaturesOnMovementPath(token, from, dest, others);
    const { applyDamageToTarget } = await import('../dice/damage-dialog.js');
    for (const creature of crossed) {
      const targetActor = creature.actor;
      if (!targetActor) continue;
      const summary = await applyDamageToTarget(targetActor, raw, actor, 0, {
        skipPhasing: true,
        skipReactionPrompt: true,
        attackSucceeded: true,
        damageInstanceId: `${spec.templateId}:${token.id}:${creature.id}`,
      });
      trample.push({
        id: String(creature.id),
        raw,
        applied: summary.barDamage,
      });
    }
  }

  const threat = planThreatZoneWindows(
    {
      moverId: String(token.id || ''),
      fromX: from.x,
      fromY: from.y,
      toX: dest.x,
      toY: dest.y,
      width: Number(token.width) || 1,
      height: Number(token.height) || 1,
      disposition: Number(token.disposition) || 0,
      traversal: spec.traversal === 'teleport' ? 'teleport' : 'path',
      protectedFromReactions: spec.traversal === 'safe',
    },
    [],
  );

  try {
    const { handleTokenMovement } = await import('./movement-tracker.js');
    token._source = token._source ?? { x: from.x, y: from.y };
    await handleTokenMovement(token, { x: dest.x, y: dest.y });
  } catch {
    /* lacerate is best-effort when the combat hook is not the caller */
  }

  return {
    ok: true,
    reason: '',
    spent: true,
    traversal: spec.traversal,
    allowedMeters: budget.allowedMeters,
    threat,
    trample,
  };
}

async function rollD8s(count: number): Promise<number> {
  let total = 0;
  for (let i = 0; i < count; i++) total += 1 + Math.floor(Math.random() * 8);
  return total;
}
