/**
 * Combat resolution for Stone Abilities that outlive the Preparation click:
 * Reaction Denial, Movement Reduction, Not a Target, Maximization.
 */

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

/** Remaining Maximizations for the current combat (0 when none / wrong combat). */
export function remainingMaximizations(actor: any): number {
  return liveMaximizationFlag(actor)?.remaining ?? 0;
}

/**
 * Spend one Maximization charge. No dialog — the Roll / Roll Maximum buttons
 * are the decision. Shared combat pool (`vitality.damageMaximization`) — R-02.
 */
export async function spendMaximization(actor: any): Promise<boolean> {
  const live = liveMaximizationFlag(actor);
  if (!live) return false;
  await actor.setFlag?.('mastery-system', MAXIMIZATION_FLAG, {
    ...live.raw,
    remaining: Math.max(0, live.remaining - 1),
  });
  return true;
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
