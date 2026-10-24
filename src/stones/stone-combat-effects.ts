/**
 * Combat resolution for Stone Abilities that outlive the Preparation click:
 * Reaction Denial, Movement Reduction, Not a Target, Maximization.
 */

import { getActiveBuffMaximizationUses } from '../combat/offensive-active-buff-effects.js';

export const REACTION_DENIAL_FLAG = 'reactionDenial';
export const MOVEMENT_REDUCTION_FLAG = 'movementReduction';
export const NOT_A_TARGET_FLAG = 'notATarget';
/** Flag key kept as damageMaximization for saved character compatibility (R-02). */
export const DAMAGE_MAX_FLAG = 'damageMaximization';
export const MAXIMIZATION_FLAG = DAMAGE_MAX_FLAG;
export const ABSORPTION_PENDING_FLAG = 'absorptionPendingStones';
export const ABSORPTION_READY_FLAG = 'absorptionReadyStones';

export interface ReactionDenialState {
  remaining: number;
  combatId: string;
  round: number;
  denied: Array<{ reactionId: string; triggerId: string }>;
}

export interface MovementReductionState {
  combatId: string;
  round: number;
}

export interface NotATargetState {
  enemyIds: string[];
  usedIds: string[];
  combatId: string;
  round: number;
}

/** Half a metre rounds up: 5 → 3, 7 → 4, 9 → 5. */
export function halveMovementMeters(meters: number): number {
  const n = Math.max(0, Number(meters) || 0);
  if (n <= 0) return 0;
  return Math.round(n / 2);
}

/** Every d8 in a damage/healing formula becomes 8. Flat bonuses stay. Forced 8s do not explode. */
export function maximizeDamageFormula(formula: string): string {
  return String(formula || '').replace(/(\d*)d8(?:x\d+)?/gi, (_match, count) => {
    const n = count ? Math.max(1, parseInt(count, 10) || 1) : 1;
    return String(8 * n);
  });
}

/** Alias — Maximization applies to Damage Rolls and Healing Rolls (R-02). */
export const maximizeDiceFormula = maximizeDamageFormula;

export function getMaximizationRemaining(actor: any): number {
  const raw = actor?.getFlag?.('mastery-system', MAXIMIZATION_FLAG);
  if (!raw) return 0;
  const combat = liveCombat();
  if (combat && raw.combatId && String(raw.combatId) !== combat.id) return 0;
  return Math.max(0, Math.floor(Number(raw.remaining) || 0));
}

export function sameCombatRound(
  state: { combatId?: string; round?: number } | null | undefined,
  combatId: string,
  round: number,
): boolean {
  if (!state) return false;
  if (String(state.combatId || '') !== String(combatId || '')) return false;
  return Math.floor(Number(state.round) || 0) === Math.floor(Number(round) || 0);
}

export function reactionDenialDecision(
  state: ReactionDenialState | null | undefined,
  attempt: { reactionId: string; triggerId: string; combatId: string; round: number },
): { allow: boolean; next: ReactionDenialState | null; reason?: string } {
  if (!state || !sameCombatRound(state, attempt.combatId, attempt.round)) {
    return { allow: true, next: state ?? null };
  }
  const reactionId = String(attempt.reactionId || 'reaction');
  const triggerId = String(attempt.triggerId || 'trigger');
  const already = (state.denied || []).some(
    (row) => row.reactionId === reactionId && row.triggerId === triggerId,
  );
  if (already) {
    return {
      allow: false,
      next: state,
      reason: 'That Reaction was already denied against this trigger.',
    };
  }
  if (state.remaining <= 0) return { allow: true, next: state };
  return {
    allow: false,
    next: {
      ...state,
      remaining: state.remaining - 1,
      denied: [...(state.denied || []), { reactionId, triggerId }],
    },
    reason: 'Reaction Denial: the declaration does not resolve and does not spend a Reaction.',
  };
}

export function notATargetDecision(
  state: NotATargetState | null | undefined,
  attackerId: string,
  otherValidTargets: number,
  combatId: string,
  round: number,
): { block: boolean; next: NotATargetState | null; reason?: string } {
  if (!state || !sameCombatRound(state, combatId, round)) return { block: false, next: state ?? null };
  const id = String(attackerId || '');
  if (!id || !(state.enemyIds || []).includes(id)) return { block: false, next: state };
  if ((state.usedIds || []).includes(id)) return { block: false, next: state };
  if (otherValidTargets <= 0) return { block: false, next: state };
  return {
    block: true,
    next: { ...state, usedIds: [...(state.usedIds || []), id] },
    reason: 'Not a Target: that enemy cannot target you with this attack.',
  };
}

function liveCombat(): { id: string; round: number } | null {
  const combat = (globalThis as any).game?.combat;
  if (!combat?.id) return null;
  return { id: String(combat.id), round: Math.max(1, Math.floor(Number(combat.round) || 1)) };
}

export function readReactionDenial(actor: any): ReactionDenialState | null {
  const raw = actor?.getFlag?.('mastery-system', REACTION_DENIAL_FLAG);
  if (!raw || typeof raw !== 'object') return null;
  return {
    remaining: Math.max(0, Math.floor(Number(raw.remaining) || 0)),
    combatId: String(raw.combatId || ''),
    round: Math.floor(Number(raw.round) || 0),
    denied: Array.isArray(raw.denied) ? raw.denied : [],
  };
}

export async function denyReactionIfMarked(
  actor: any,
  attempt: { reactionId?: string; triggerId?: string } = {},
): Promise<{ denied: boolean; reason?: string }> {
  const combat = liveCombat();
  if (!combat) return { denied: false };
  const decision = reactionDenialDecision(readReactionDenial(actor), {
    reactionId: attempt.reactionId || 'reaction',
    triggerId: attempt.triggerId || 'trigger',
    combatId: combat.id,
    round: combat.round,
  });
  if (decision.allow) return { denied: false };
  if (decision.next) {
    await actor?.setFlag?.('mastery-system', REACTION_DENIAL_FLAG, decision.next);
  }
  return { denied: true, reason: decision.reason };
}

export function movementReductionActive(actor: any): boolean {
  const combat = liveCombat();
  if (!combat) return false;
  const raw = actor?.getFlag?.('mastery-system', MOVEMENT_REDUCTION_FLAG);
  return sameCombatRound(raw, combat.id, combat.round);
}

export function movementMetersAfterStoneEffects(actor: any, meters: number): number {
  if (!movementReductionActive(actor)) return Math.max(0, Number(meters) || 0);
  return halveMovementMeters(meters);
}

/** Write the round-scoped flag on the first `count` chosen enemies. Rank 1–4 is that count. */
export async function markMovementReductionTargets(
  targets: Array<{ setFlag?: (scope: string, key: string, value: unknown) => Promise<unknown> }>,
  count: number,
  combat: { id?: string; round?: number } | null | undefined,
): Promise<number> {
  const cap = Math.max(0, Math.floor(Number(count) || 0));
  const chosen = targets.slice(0, cap);
  const payload = {
    combatId: String(combat?.id || ''),
    round: Math.max(1, Math.floor(Number(combat?.round) || 1)),
  };
  for (const target of chosen) {
    await target?.setFlag?.('mastery-system', MOVEMENT_REDUCTION_FLAG, payload);
  }
  return chosen.length;
}

function liveMaximizationFlag(actor: any): { raw: any; remaining: number; uses: number } | null {
  const raw = actor?.getFlag?.('mastery-system', MAXIMIZATION_FLAG);
  const combat = liveCombat();
  if (!raw || Math.floor(Number(raw.remaining) || 0) <= 0) return null;
  if (combat && raw.combatId && String(raw.combatId) !== combat.id) return null;
  const remaining = Math.floor(Number(raw.remaining) || 0);
  const uses = Math.max(remaining, Math.floor(Number(raw.uses) || 0));
  return { raw, remaining, uses };
}

export type MaximizationSource = 'stone' | 'passive' | 'activeBuff';

/** Remaining stone Maximizations for the current combat. */
export function remainingStoneMaximizations(actor: any): number {
  return liveMaximizationFlag(actor)?.remaining ?? 0;
}

function readPassiveMaximizationRemainingSync(actor: any): number {
  const combat = liveCombat();
  const raw = actor?.getFlag?.('mastery-system', 'passiveMaximizationCharges') as
    | { combatId?: string; remaining?: number }
    | undefined;
  if (!raw) return 0;
  if (combat && raw.combatId && String(raw.combatId) !== String(combat.id)) return 0;
  return Math.max(0, Math.floor(Number(raw.remaining) || 0));
}

function syncActiveBuffMaximizationQuota(actor: any): {
  roundKey: string;
  granted: number;
  remaining: number;
} | null {
  const combat = liveCombat();
  if (!combat?.id || !actor) return null;
  const granted = getActiveBuffMaximizationUses(actor);
  if (granted <= 0) return null;
  const roundKey = String(combat.id);
  let rs: any = null;
  try {
    rs = actor.getFlag?.('mastery-system', 'roundState');
  } catch {
    rs = null;
  }
  const existing = rs?.maximizationQuota as
    | { roundKey?: string; granted?: number; remaining?: number }
    | undefined;
  if (!existing || String(existing.roundKey || '') !== roundKey) {
    return { roundKey, granted, remaining: granted };
  }
  if (granted > Number(existing.granted || 0)) {
    const delta = granted - Math.floor(Number(existing.granted) || 0);
    return {
      roundKey,
      granted,
      remaining: Math.max(0, Math.floor(Number(existing.remaining) || 0)) + delta,
    };
  }
  if (granted < Number(existing.granted || 0)) {
    return {
      roundKey,
      granted,
      remaining: Math.min(Math.max(0, Math.floor(Number(existing.remaining) || 0)), granted),
    };
  }
  return {
    roundKey,
    granted: Math.floor(Number(existing.granted) || 0),
    remaining: Math.max(0, Math.floor(Number(existing.remaining) || 0)),
  };
}

export function remainingActiveBuffMaximizations(actor: any): number {
  return syncActiveBuffMaximizationQuota(actor)?.remaining ?? 0;
}

/** Total Maximizations (stone + Passive + Active Buff) available for UI enablement. */
export function remainingMaximizations(actor: any): number {
  return (
    remainingStoneMaximizations(actor) +
    readPassiveMaximizationRemainingSync(actor) +
    remainingActiveBuffMaximizations(actor)
  );
}

export function listAvailableMaximizationSources(actor: any): Array<{
  source: MaximizationSource;
  remaining: number;
  label: string;
}> {
  const out: Array<{ source: MaximizationSource; remaining: number; label: string }> = [];
  const stone = remainingStoneMaximizations(actor);
  const passive = readPassiveMaximizationRemainingSync(actor);
  const buff = remainingActiveBuffMaximizations(actor);
  if (stone > 0) out.push({ source: 'stone', remaining: stone, label: `Vitality Stone Maximization (${stone})` });
  if (passive > 0) out.push({ source: 'passive', remaining: passive, label: `Passive: Maximization (${passive})` });
  if (buff > 0) out.push({ source: 'activeBuff', remaining: buff, label: `Active Buff: Maximization (${buff})` });
  return out;
}

/**
 * Spend one Maximization charge from exactly one source.
 * Prefer `preferred` when that source still has charges; else stone then Passive.
 */
export async function spendMaximization(
  actor: any,
  preferred?: MaximizationSource | null,
): Promise<boolean> {
  const stoneLive = liveMaximizationFlag(actor);
  const stoneLeft = stoneLive?.remaining ?? 0;
  let passiveLeft = 0;
  try {
    const { getPassiveMaximizationRemaining, grantPassiveCombatCharges } = await import(
      '../combat/passive-combat-charges.js'
    );
    const combat = liveCombat();
    if (combat?.id) await grantPassiveCombatCharges(actor, combat);
    passiveLeft = getPassiveMaximizationRemaining(actor, combat);
  } catch {
    passiveLeft = 0;
  }
  const buffQuota = syncActiveBuffMaximizationQuota(actor);
  const buffLeft = buffQuota?.remaining ?? 0;

  let pick: MaximizationSource | null = null;
  if (preferred === 'stone' && stoneLeft > 0) pick = 'stone';
  else if (preferred === 'passive' && passiveLeft > 0) pick = 'passive';
  else if (preferred === 'activeBuff' && buffLeft > 0) pick = 'activeBuff';
  else if (stoneLeft > 0) pick = 'stone';
  else if (passiveLeft > 0) pick = 'passive';
  else if (buffLeft > 0) pick = 'activeBuff';
  if (!pick) return false;

  if (pick === 'stone' && stoneLive) {
    await actor.setFlag?.('mastery-system', MAXIMIZATION_FLAG, {
      ...stoneLive.raw,
      remaining: Math.max(0, stoneLive.remaining - 1),
    });
    return true;
  }
  if (pick === 'passive') {
    const { spendPassiveMaximizationCharge } = await import('../combat/passive-combat-charges.js');
    return spendPassiveMaximizationCharge(actor, liveCombat());
  }
  if (pick === 'activeBuff' && buffQuota) {
    try {
      const { getRoundState, setRoundState } = await import('../combat/action-economy.js');
      const combat = liveCombat();
      const rs = getRoundState(actor, combat);
      rs.maximizationQuota = {
        roundKey: buffQuota.roundKey,
        granted: buffQuota.granted,
        remaining: Math.max(0, buffQuota.remaining - 1),
      };
      await setRoundState(actor, rs);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * @deprecated Prefer Roll / Roll Maximum buttons + {@link spendMaximization}.
 * Kept for tests and any legacy callers that still expect a confirm dialog.
 */
export async function offerMaximization(
  actor: any,
  kind: 'damage' | 'healing' = 'damage',
): Promise<boolean> {
  const live = liveMaximizationFlag(actor);
  if (!live) return false;
  const DialogCtor = (globalThis as any).Dialog;
  let yes = false;
  const rollLabel = kind === 'healing' ? 'Healing Roll' : 'Damage Roll';
  if (typeof DialogCtor?.confirm === 'function') {
    yes = await DialogCtor.confirm({
      title: 'Maximization',
      content:
        `<p>Maximize this complete ${rollLabel}? Every d8 becomes 8. Forced 8s are not natural 8s and do not explode.</p>` +
        `<p><strong>Maximization: ${live.remaining} / ${live.uses || live.remaining} remaining</strong></p>`,
    });
  }
  if (!yes) return false;
  return spendMaximization(actor);
}

/** @deprecated Use spendMaximization — kept for callers / Hunter's Scourge. */
export async function offerDamageMaximization(actor: any): Promise<boolean> {
  return spendMaximization(actor);
}

export async function chooseCombatantActors(opts: {
  title: string;
  hint: string;
  caster: any;
  max: number;
  maxRangeM?: number;
}): Promise<any[]> {
  const combat = (globalThis as any).game?.combat;
  const bag = combat?.combatants;
  const rows: any[] = bag
    ? typeof bag.values === 'function'
      ? Array.from(bag.values())
      : Array.isArray(bag)
        ? bag
        : []
    : [];
  const casterId = String(opts.caster?.id || '');
  const maxRange = Math.max(0, Number(opts.maxRangeM) || 0);
  let distanceBetween: ((a: any, b: any) => number | null) | null = null;
  if (maxRange > 0) {
    try {
      const mod = await import('../combat/reaction-eligibility.js');
      distanceBetween = mod.distanceBetweenActorsMeters;
    } catch {
      distanceBetween = null;
    }
  }
  const choices = rows
    .map((c) => c?.actor)
    .filter((actor) => {
      if (!actor || String(actor.id || '') === casterId) return false;
      if (!distanceBetween || maxRange <= 0) return true;
      const meters = distanceBetween(opts.caster, actor);
      return meters == null || meters <= maxRange + 0.05;
    });
  if (!choices.length) return [];
  const DialogCtor = (globalThis as any).Dialog;
  if (typeof DialogCtor !== 'function') return [];
  const picked: any[] = [];
  const max = Math.max(1, Math.floor(opts.max) || 1);
  let remaining = choices.slice();
  while (picked.length < max && remaining.length) {
    const buttons = remaining
      .map(
        (actor, index) =>
          `<button type="button" class="stone-target-pick" data-index="${index}">${String(actor.name || 'Creature')}</button>`,
      )
      .join('');
    const choice = await new Promise<number | null>((resolve) => {
      let settled = false;
      const finish = (value: number | null) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };
      const dialog = new DialogCtor(
        {
          title: opts.title,
          content: `<form class="mastery-stone-target" onsubmit="return false;"><p>${opts.hint}</p><div>${buttons}</div></form>`,
          buttons: { cancel: { label: 'Done', callback: () => finish(null) } },
          default: 'cancel',
          close: () => finish(null),
        },
        { width: 420 },
      );
      dialog.activateListeners = function activate(html: any) {
        DialogCtor.prototype?.activateListeners?.call(dialog, html);
        const root = html?.jquery ? html[0] : html;
        root?.querySelectorAll?.('.stone-target-pick')?.forEach((btn: HTMLElement) => {
          btn.addEventListener('click', (ev) => {
            ev.preventDefault();
            finish(Math.floor(Number(btn.dataset.index)));
            dialog.close();
          });
        });
      };
      dialog.render(true);
    });
    if (choice == null || !remaining[choice]) break;
    picked.push(remaining[choice]);
    remaining = remaining.filter((_, index) => index !== choice);
  }
  return picked;
}
