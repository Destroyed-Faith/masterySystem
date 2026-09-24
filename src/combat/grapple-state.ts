/**
 * Grapple — combat state shared by two creatures.
 *
 * A won Grapple contest links grappler and held creature. Both carry the
 * `grappled` catalog status (Speed 0 m, see `actor.ts`) and a pair flag
 * pointing at the partner. Grapple is not Root: it never deals damage, never
 * touches Evade, Armor, Attack Pools or Specials. Hurting the held creature
 * is a separate Unarmed Basic Attack; drawing a weapon means letting go.
 */

export const GRAPPLE_FLAG = 'grapple';
export const GRAPPLED_STATUS_ID = 'grappled';

export type GrappleRole = 'grappler' | 'held';

export interface GrappleState {
  role: GrappleRole;
  partnerActorId: string;
  partnerActorUuid?: string;
  partnerTokenId?: string;
  partnerName: string;
  combatId?: string;
  round?: number;
}

export interface GrappleParticipant {
  actorId: string;
  actorUuid?: string;
  tokenId?: string;
  name: string;
}

function str(value: unknown): string {
  return value == null ? '' : String(value);
}

export function readGrappleState(actor: any): GrappleState | null {
  let raw: any = null;
  try {
    raw = actor?.getFlag?.('mastery-system', GRAPPLE_FLAG);
  } catch {
    raw = null;
  }
  if (raw == null) raw = actor?.flags?.['mastery-system']?.[GRAPPLE_FLAG] ?? null;
  if (!raw || typeof raw !== 'object') return null;
  const role = raw.role === 'grappler' || raw.role === 'held' ? raw.role : null;
  const partnerActorId = str(raw.partnerActorId);
  if (!role || !partnerActorId) return null;
  return {
    role,
    partnerActorId,
    ...(raw.partnerActorUuid ? { partnerActorUuid: str(raw.partnerActorUuid) } : {}),
    ...(raw.partnerTokenId ? { partnerTokenId: str(raw.partnerTokenId) } : {}),
    partnerName: str(raw.partnerName) || 'the other creature',
    ...(raw.combatId ? { combatId: str(raw.combatId) } : {}),
    ...(Number.isFinite(Number(raw.round)) ? { round: Math.floor(Number(raw.round)) } : {}),
  };
}

export function isInGrapple(actor: any): boolean {
  return readGrappleState(actor) !== null;
}

export function grappleRoleOf(actor: any): GrappleRole | null {
  return readGrappleState(actor)?.role ?? null;
}

/**
 * Flag payloads for both participants after a won Grapple contest. Pure so
 * tests can assert that nothing beyond the pair link and the `grappled`
 * status is written — no Root, no damage, no Evade / Armor / pool changes.
 */
export function planGrapplePair(
  grappler: GrappleParticipant,
  held: GrappleParticipant,
  combat?: { id?: string; round?: number } | null,
): { grappler: GrappleState; held: GrappleState } {
  const shared = {
    ...(combat?.id ? { combatId: str(combat.id) } : {}),
    ...(Number.isFinite(Number(combat?.round)) ? { round: Math.floor(Number(combat?.round)) } : {}),
  };
  return {
    grappler: {
      role: 'grappler',
      partnerActorId: held.actorId,
      ...(held.actorUuid ? { partnerActorUuid: held.actorUuid } : {}),
      ...(held.tokenId ? { partnerTokenId: held.tokenId } : {}),
      partnerName: held.name,
      ...shared,
    },
    held: {
      role: 'held',
      partnerActorId: grappler.actorId,
      ...(grappler.actorUuid ? { partnerActorUuid: grappler.actorUuid } : {}),
      ...(grappler.tokenId ? { partnerTokenId: grappler.tokenId } : {}),
      partnerName: grappler.name,
      ...shared,
    },
  };
}

/** Grapple deals no damage of its own — ever. Kept as an explicit rule hook. */
export function grappleDamage(): 0 {
  return 0;
}

/** The only status a Grapple applies. Root is a different Special. */
export function grappleStatusIds(): readonly string[] {
  return [GRAPPLED_STATUS_ID];
}

function isUnarmedBasicAttackOption(actor: any, option: any, unarmedNow: boolean): boolean {
  if (!option) return false;
  const id = str(option.id || option.maneuver?.id);
  if (id !== 'weapon-attack') return false;
  if (option.forcedWeaponItemId) return false;
  return unarmedNow;
}

/**
 * Attacking with a weapon is not part of the Grapple. When the grappler picks
 * a weapon-based attack the hold has to be released first. The unarmed Basic
 * Attack and spells keep the Grapple. The held creature is never gated here —
 * it does not maintain the hold.
 */
export function attackRequiresGrappleRelease(
  actor: any,
  option: any,
  deps: { unarmedNow: boolean },
): boolean {
  if (!option || option.slot !== 'attack') return false;
  if (grappleRoleOf(actor) !== 'grappler') return false;
  if (isUnarmedBasicAttackOption(actor, option, deps.unarmedNow)) return false;
  const source = str(option.source);
  if (source === 'maneuver') {
    const id = str(option.id || option.maneuver?.id);
    // Grapple-family maneuvers and stances are not weapon attacks.
    if (id !== 'weapon-attack') return false;
    return true;
  }
  if (source === 'power') {
    const sys = option.item?.system ?? {};
    const isSpell = sys.isSpell === true || option.artifactIsSpell === true;
    if (isSpell) return false;
    const powerType = str(sys.powerType || option.powerType);
    if (powerType && powerType !== 'active') return false;
    return true;
  }
  // NPC sheet attacks (`npc-attack`) are the creature's own claws / bite /
  // body — NPCs have no separate unarmed Basic Attack, so the GM adjudicates.
  return false;
}

/* -------------------------------------------- */
/*  Foundry-facing helpers                       */
/* -------------------------------------------- */

function resolveTokenById(tokenId: string): any {
  if (!tokenId) return null;
  const canvasRef = (globalThis as any).canvas;
  return canvasRef?.tokens?.get?.(tokenId) ?? null;
}

/** Live partner actor: scene token first (unlinked NPCs), then world actor. */
export async function resolveGrapplePartner(state: GrappleState | null): Promise<any | null> {
  if (!state) return null;
  const tok = resolveTokenById(state.partnerTokenId || '');
  if (tok?.actor) return tok.actor;
  const g = (globalThis as any);
  if (state.partnerActorUuid && typeof g.fromUuid === 'function') {
    try {
      const doc = await g.fromUuid(state.partnerActorUuid);
      if (doc?.documentName === 'Actor') return doc;
      if (doc?.actor) return doc.actor;
    } catch {
      /* fall through */
    }
  }
  return g.game?.actors?.get?.(state.partnerActorId) ?? null;
}

async function writeGrappleFlag(actor: any, state: GrappleState | null): Promise<void> {
  if (!actor) return;
  const { updateActorViaGm } = await import('./gm-relay.js');
  if (state) {
    await updateActorViaGm(actor, { [`flags.mastery-system.${GRAPPLE_FLAG}`]: state });
  } else {
    await updateActorViaGm(actor, { [`flags.mastery-system.-=${GRAPPLE_FLAG}`]: null });
  }
}

async function setGrappledStatus(actor: any, active: boolean): Promise<void> {
  if (!actor) return;
  const { setActorCatalogStatus } = await import('../system/assign-status.js');
  await setActorCatalogStatus(actor, GRAPPLED_STATUS_ID, active);
}

export function grappleParticipantOf(actor: any, token?: any): GrappleParticipant {
  const tokenId = str(token?.id ?? token?.document?.id ?? actor?.token?.id ?? '');
  return {
    actorId: str(actor?.id ?? ''),
    ...(actor?.uuid ? { actorUuid: str(actor.uuid) } : {}),
    ...(tokenId ? { tokenId } : {}),
    name: str(actor?.name || 'Creature'),
  };
}

/** Won Grapple: link both creatures and put `grappled` on each. */
export async function applyGrapple(
  grappler: any,
  held: any,
  opts: { grapplerToken?: any; heldToken?: any; combat?: any } = {},
): Promise<void> {
  const plan = planGrapplePair(
    grappleParticipantOf(grappler, opts.grapplerToken),
    grappleParticipantOf(held, opts.heldToken),
    opts.combat ? { id: opts.combat.id, round: opts.combat.round } : null,
  );
  await writeGrappleFlag(grappler, plan.grappler);
  await writeGrappleFlag(held, plan.held);
  await setGrappledStatus(grappler, true);
  await setGrappledStatus(held, true);
}

/** End the Grapple for both participants (release, escape, cleanup). */
export async function endGrapple(actor: any): Promise<{ partner: any | null }> {
  const state = readGrappleState(actor);
  const partner = await resolveGrapplePartner(state);
  await writeGrappleFlag(actor, null);
  await setGrappledStatus(actor, false);
  if (partner) {
    await writeGrappleFlag(partner, null);
    await setGrappledStatus(partner, false);
  }
  return { partner };
}

/** Combat end: no Grapple survives the fight. */
export async function clearGrappleAfterCombat(actors: any[]): Promise<void> {
  for (const actor of actors) {
    if (!readGrappleState(actor)) continue;
    try {
      await writeGrappleFlag(actor, null);
    } catch (err) {
      console.warn('Mastery System | Grapple cleanup after combat failed', err);
    }
  }
}
