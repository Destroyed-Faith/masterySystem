/**
 * Region Behavior: Destroyed Faith — Apply Specials
 *
 * On enter (measured move): TOKEN_MOVE_IN → pause → wait animation → apply → stopMovement
 *   so the token stops at the boundary without sprite/document desync; remaining
 *   Movement Action meters stay usable for a new drag.
 * Non-move enter (create/teleport/behavior activate): TOKEN_ENTER, deferred apply.
 * Round end while inside: TOKEN_ROUND_END.
 */

import {
  applyGmEffect,
  listGmAssignableSpecials,
  matchesSide,
  type GmEffectMode,
  type GmEffectSideFilter,
  type GmEffectTargetRef,
} from '../combat/gm-effect-service.js';
import { ENCOUNTER_SOCKET } from '../combat/combat-permissions.js';
import { getEffectBaseName, getEffectById } from '../utils/special-effects.js';

/** System RegionBehavior subtype (no package prefix — matches system.json documentTypes). */
export const APPLY_SPECIAL_BEHAVIOR_TYPE = 'applySpecial';

export const REGION_APPLY_PAUSE_KEY = 'mastery-applySpecial';

export type RegionSpecialTrigger = 'enter' | 'roundEnd';

export interface ApplySpecialBehaviorSystem {
  specialId?: string;
  value?: number | null;
  sideFilter?: GmEffectSideFilter | string;
  applyOnEnter?: boolean;
  applyOnRoundEnd?: boolean;
  mode?: GmEffectMode | string;
}

/** Pure: whether this trigger should fire given system toggles (default on when undefined). */
export function regionSpecialTriggerEnabled(
  sys: ApplySpecialBehaviorSystem | null | undefined,
  trigger: RegionSpecialTrigger,
): boolean {
  if (!sys) return false;
  if (trigger === 'enter') return sys.applyOnEnter !== false;
  return sys.applyOnRoundEnd !== false;
}

export function regionSpecialPassesSideFilter(
  disposition: number | undefined,
  sideFilter: GmEffectSideFilter | string | undefined,
): boolean {
  const raw = String(sideFilter || 'all') as GmEffectSideFilter;
  const allowed: GmEffectSideFilter[] = ['all', 'friendly', 'neutral', 'hostile'];
  const side = allowed.includes(raw) ? raw : 'all';
  return matchesSide(disposition, side);
}

export function gmEffectTargetFromTokenDoc(token: any): GmEffectTargetRef | null {
  if (!token) return null;
  const actor = token.actor;
  const actorId = String(actor?.id || token.actorId || '');
  const tokenId = String(token.id || '');
  if (!actorId && !tokenId) return null;
  return {
    actorId: actorId || null,
    tokenId: tokenId || null,
    combatantId: null,
    name: String(actor?.name || token.name || ''),
    disposition: Number(token.disposition ?? actor?.token?.disposition ?? 0),
  };
}

export function buildSpecialChoices(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const s of listGmAssignableSpecials()) {
    out[s.id] = getEffectBaseName(s.name);
  }
  if (!Object.keys(out).length) {
    out.ignite = 'Ignite';
  }
  return out;
}

/** True when Foundry reports this enter came from measured movement (prefer MOVE_IN). */
export function regionEventLooksLikeMeasuredMove(event: any): boolean {
  if (!event) return false;
  if (event.data?.movement != null) return true;
  if (event.data?.moved === true) return true;
  return false;
}

const recentMoveInKeys = new Map<string, number>();
const MOVE_IN_DEDUPE_MS = 2500;

export function markRegionMoveInHandled(tokenId: string, regionId: string, at = Date.now()): void {
  const key = `${String(tokenId)}:${String(regionId)}`;
  recentMoveInKeys.set(key, at);
  for (const [k, t] of recentMoveInKeys) {
    if (at - t > MOVE_IN_DEDUPE_MS * 2) recentMoveInKeys.delete(k);
  }
}

export function wasRegionMoveInRecentlyHandled(
  tokenId: string,
  regionId: string,
  now = Date.now(),
): boolean {
  const t = recentMoveInKeys.get(`${String(tokenId)}:${String(regionId)}`);
  return t != null && now - t < MOVE_IN_DEDUPE_MS;
}

/** Skip TOKEN_ENTER apply when MOVE_IN already handled this crossing. */
export function shouldSkipTokenEnterAfterMoveIn(event: any, regionId: string): boolean {
  const token = event?.data?.token ?? event?.token;
  const tokenId = String(token?.id || '');
  if (!tokenId || !regionId) return false;
  // Only skip when MOVE_IN actually ran — do not blanket-skip measured ENTER
  // (guided updates still rely on ENTER if MOVE_IN did not fire).
  return wasRegionMoveInRecentlyHandled(tokenId, regionId);
}

async function awaitTokenMovementAnimation(token: any): Promise<void> {
  const promise = token?.object?.movementAnimationPromise;
  if (promise && typeof promise.then === 'function') {
    try {
      await promise;
    } catch {
      /* ignore */
    }
  }
}

/** True when this client is the user who triggered the region event (Foundry fires on all users). */
export function isRegionEventSelf(event: any): boolean {
  if (event?.user?.isSelf === true) return true;
  const g = globalThis as any;
  const uid = event?.user?.id;
  if (uid != null && String(uid) === String(g.game?.user?.id)) return true;
  return false;
}

export async function applyFromBehavior(
  behaviorSystem: ApplySpecialBehaviorSystem,
  token: any,
  trigger: RegionSpecialTrigger,
  reason: string,
  opts?: { deferVisuals?: boolean },
): Promise<void> {
  const g = globalThis as any;
  if (!regionSpecialTriggerEnabled(behaviorSystem, trigger)) return;
  const specialId = String(behaviorSystem.specialId || '')
    .trim()
    .toLowerCase();
  if (!specialId) return;
  const ref = gmEffectTargetFromTokenDoc(token);
  if (!ref) return;
  if (!regionSpecialPassesSideFilter(ref.disposition, behaviorSystem.sideFilter)) return;
  const def = getEffectById(specialId);
  const value = def?.hasValue ? Math.max(1, Math.floor(Number(behaviorSystem.value) || 1)) : null;
  const mode = (String(behaviorSystem.mode || 'rules') === 'exact' ? 'exact' : 'rules') as GmEffectMode;

  if (!g.game?.user?.isGM) {
    try {
      g.game?.socket?.emit?.(ENCOUNTER_SOCKET, {
        type: 'regionApplySpecial',
        tokenId: ref.tokenId,
        actorId: ref.actorId,
        sceneId: String(token?.parent?.id || token?.scene?.id || g.canvas?.scene?.id || ''),
        specialId,
        value,
        mode,
        sideFilter: behaviorSystem.sideFilter || 'all',
        reason,
        deferVisuals: !!opts?.deferVisuals,
      });
    } catch (err) {
      console.warn('Mastery System | region apply relay failed', err);
    }
    return;
  }

  try {
    await applyGmEffect({
      targets: [ref],
      specialId,
      value,
      mode,
      reason,
      deferVisuals: !!opts?.deferVisuals,
    });
  } catch (err) {
    console.warn('Mastery System | Region Apply Specials failed', err);
  }
}

/** Handle measured move into region: pause → animate → apply → stop (keep rest meters). */
export async function handleRegionTokenMoveIn(
  sys: ApplySpecialBehaviorSystem,
  event: any,
  regionName: string,
  regionId: string,
): Promise<void> {
  if (!regionSpecialTriggerEnabled(sys, 'enter')) return;
  // Only the moving user may pause/stop; only they should kick off apply (GM path or socket).
  if (!isRegionEventSelf(event)) return;
  const token = event?.data?.token ?? event?.token;
  if (!token) return;
  const tokenId = String(token.id || '');
  markRegionMoveInHandled(tokenId, regionId);

  if (typeof token.pauseMovement === 'function') {
    try {
      token.pauseMovement(REGION_APPLY_PAUSE_KEY);
    } catch (err) {
      console.warn('Mastery System | pauseMovement failed', err);
    }
  }

  await awaitTokenMovementAnimation(token);

  try {
    token.object?.refresh?.();
  } catch {
    /* ignore */
  }

  // Visual sync after animation; deferVisuals avoids a second desync if anything is still tweening.
  await applyFromBehavior(sys, token, 'enter', `Region enter: ${regionName}`, { deferVisuals: true });

  if (typeof token.stopMovement === 'function') {
    try {
      token.stopMovement();
    } catch (err) {
      console.warn('Mastery System | stopMovement failed', err);
    }
  }
}

/** Non-move enter: apply without blocking animation; skip if MOVE_IN already ran. */
export async function handleRegionTokenEnter(
  sys: ApplySpecialBehaviorSystem,
  event: any,
  regionName: string,
  regionId: string,
): Promise<void> {
  if (!regionSpecialTriggerEnabled(sys, 'enter')) return;
  if (!isRegionEventSelf(event)) return;
  if (shouldSkipTokenEnterAfterMoveIn(event, regionId)) return;
  const token = event?.data?.token ?? event?.token;
  if (!token) return;

  const run = async () => {
    await awaitTokenMovementAnimation(token);
    await applyFromBehavior(sys, token, 'enter', `Region enter: ${regionName}`, {
      deferVisuals: true,
    });
  };
  // Never block the region/enter pipeline with heavy awaits from the sync caller.
  void run().catch((err) => console.warn('Mastery System | Region TOKEN_ENTER apply failed', err));
}

function BehaviorBase(): any {
  return (globalThis as any).foundry?.data?.regionBehaviors?.RegionBehaviorType;
}

export function createApplySpecialRegionBehaviorType(): any {
  const Base = BehaviorBase();
  if (!Base) {
    console.warn('Mastery System | RegionBehaviorType unavailable — Apply Specials not registered');
    return null;
  }

  class ApplySpecialRegionBehaviorType extends Base {
    static LOCALIZATION_PREFIXES = ['MASTERY.regionBehavior.applySpecial'];

    static defineSchema() {
      const fields = (globalThis as any).foundry.data.fields;
      const choices = buildSpecialChoices();
      const first = Object.keys(choices)[0] || 'ignite';
      return {
        specialId: new fields.StringField({
          required: true,
          blank: false,
          initial: first,
          choices,
          label: 'MASTERY.regionBehavior.applySpecial.FIELDS.specialId.label',
          hint: 'MASTERY.regionBehavior.applySpecial.FIELDS.specialId.hint',
        }),
        value: new fields.NumberField({
          required: false,
          nullable: true,
          integer: true,
          initial: 1,
          min: 1,
          max: 40,
          label: 'MASTERY.regionBehavior.applySpecial.FIELDS.value.label',
          hint: 'MASTERY.regionBehavior.applySpecial.FIELDS.value.hint',
        }),
        sideFilter: new fields.StringField({
          required: true,
          blank: false,
          initial: 'all',
          choices: {
            all: 'MASTERY.regionBehavior.applySpecial.SIDE.all',
            friendly: 'MASTERY.regionBehavior.applySpecial.SIDE.friendly',
            neutral: 'MASTERY.regionBehavior.applySpecial.SIDE.neutral',
            hostile: 'MASTERY.regionBehavior.applySpecial.SIDE.hostile',
          },
          label: 'MASTERY.regionBehavior.applySpecial.FIELDS.sideFilter.label',
          hint: 'MASTERY.regionBehavior.applySpecial.FIELDS.sideFilter.hint',
        }),
        applyOnEnter: new fields.BooleanField({
          required: true,
          initial: true,
          label: 'MASTERY.regionBehavior.applySpecial.FIELDS.applyOnEnter.label',
          hint: 'MASTERY.regionBehavior.applySpecial.FIELDS.applyOnEnter.hint',
        }),
        applyOnRoundEnd: new fields.BooleanField({
          required: true,
          initial: true,
          label: 'MASTERY.regionBehavior.applySpecial.FIELDS.applyOnRoundEnd.label',
          hint: 'MASTERY.regionBehavior.applySpecial.FIELDS.applyOnRoundEnd.hint',
        }),
        mode: new fields.StringField({
          required: true,
          blank: false,
          initial: 'rules',
          choices: {
            rules: 'MASTERY.regionBehavior.applySpecial.MODE.rules',
            exact: 'MASTERY.regionBehavior.applySpecial.MODE.exact',
          },
          label: 'MASTERY.regionBehavior.applySpecial.FIELDS.mode.label',
          hint: 'MASTERY.regionBehavior.applySpecial.FIELDS.mode.hint',
        }),
      };
    }

    static events: Record<string, (this: any, event: any) => Promise<void>> = {
      tokenMoveIn: async function (this: any, event: any) {
        const sys = this as ApplySpecialBehaviorSystem;
        const regionName = String(this?.region?.name || this?.behavior?.parent?.name || 'Region');
        const regionId = String(this?.region?.id || this?.behavior?.parent?.id || regionName);
        await handleRegionTokenMoveIn(sys, event, regionName, regionId);
      },
      tokenEnter: async function (this: any, event: any) {
        const sys = this as ApplySpecialBehaviorSystem;
        const regionName = String(this?.region?.name || this?.behavior?.parent?.name || 'Region');
        const regionId = String(this?.region?.id || this?.behavior?.parent?.id || regionName);
        await handleRegionTokenEnter(sys, event, regionName, regionId);
      },
      tokenRoundEnd: async function (this: any, event: any) {
        const g = globalThis as any;
        if (!g.game?.user?.isGM) return;
        const sys = this as ApplySpecialBehaviorSystem;
        if (!regionSpecialTriggerEnabled(sys, 'roundEnd')) return;
        const token = event?.data?.token ?? event?.token;
        const regionName = String(this?.region?.name || this?.behavior?.parent?.name || 'Region');
        await applyFromBehavior(sys, token, 'roundEnd', `Region round end: ${regionName}`);
      },
    };
  }

  const CONST = (globalThis as any).CONST;
  if (CONST?.REGION_EVENTS?.TOKEN_MOVE_IN) {
    ApplySpecialRegionBehaviorType.events[CONST.REGION_EVENTS.TOKEN_MOVE_IN] =
      ApplySpecialRegionBehaviorType.events.tokenMoveIn;
  }
  if (CONST?.REGION_EVENTS?.TOKEN_ENTER) {
    ApplySpecialRegionBehaviorType.events[CONST.REGION_EVENTS.TOKEN_ENTER] =
      ApplySpecialRegionBehaviorType.events.tokenEnter;
  }
  if (CONST?.REGION_EVENTS?.TOKEN_ROUND_END) {
    ApplySpecialRegionBehaviorType.events[CONST.REGION_EVENTS.TOKEN_ROUND_END] =
      ApplySpecialRegionBehaviorType.events.tokenRoundEnd;
  }

  return ApplySpecialRegionBehaviorType;
}

export function registerApplySpecialRegionBehavior(): boolean {
  const config = (globalThis as any).CONFIG?.RegionBehavior;
  if (!config?.dataModels) {
    console.warn('Mastery System | CONFIG.RegionBehavior.dataModels missing — Apply Specials not registered');
    return false;
  }
  const Type = createApplySpecialRegionBehaviorType();
  if (!Type) return false;
  config.dataModels[APPLY_SPECIAL_BEHAVIOR_TYPE] = Type;
  if (config.typeIcons) config.typeIcons[APPLY_SPECIAL_BEHAVIOR_TYPE] = 'fa-solid fa-bolt';
  if (config.typeLabels) {
    config.typeLabels[APPLY_SPECIAL_BEHAVIOR_TYPE] = 'TYPES.RegionBehavior.applySpecial';
  }
  if (config.typeHints) {
    config.typeHints[APPLY_SPECIAL_BEHAVIOR_TYPE] = 'MASTERY.regionBehavior.applySpecial.TypeHint';
  }
  return true;
}

/** GM socket: player relayed a region apply. */
export async function handleRegionApplySpecialSocket(payload: any): Promise<void> {
  const g = globalThis as any;
  if (!g.game?.user?.isGM) return;
  const specialId = String(payload?.specialId || '')
    .trim()
    .toLowerCase();
  if (!specialId) return;
  const tokenId = String(payload?.tokenId || '');
  const sceneId = String(payload?.sceneId || '');
  const scene =
    (sceneId && g.game?.scenes?.get?.(sceneId)) || g.canvas?.scene || g.game?.scenes?.active;
  const token = tokenId ? scene?.tokens?.get?.(tokenId) : null;
  const ref = token
    ? gmEffectTargetFromTokenDoc(token)
    : {
        actorId: String(payload?.actorId || '') || null,
        tokenId: tokenId || null,
        name: '?',
        disposition: 0,
      };
  if (!ref?.actorId && !ref?.tokenId) return;
  if (!regionSpecialPassesSideFilter(ref.disposition, payload?.sideFilter)) return;
  const mode = (String(payload?.mode || 'rules') === 'exact' ? 'exact' : 'rules') as GmEffectMode;
  const value =
    payload?.value != null && Number.isFinite(Number(payload.value))
      ? Math.max(1, Math.floor(Number(payload.value)))
      : null;
  try {
    await applyGmEffect({
      targets: [ref],
      specialId,
      value,
      mode,
      reason: String(payload?.reason || 'Region enter'),
      deferVisuals: !!payload?.deferVisuals,
    });
  } catch (err) {
    console.warn('Mastery System | regionApplySpecial socket failed', err);
  }
}
