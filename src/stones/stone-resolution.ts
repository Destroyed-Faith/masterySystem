/**
 * Stone assignment commit → resolution queue.
 *
 * Placing Stones only plans. Confirm pays once, applies powers whose effect
 * is already determined, and queues powers that still need a target.
 * Tickets are idempotent: the same id is never inserted twice, and a
 * resolved ticket is never rolled again.
 */

import { STONE_POWERS, resolveStonePowerId, scaleStoneTier } from './stone-powers.js';
import { healDamage, healStressFromBars } from '../utils/calculations.js';

export interface StoneBar {
  current: number;
  max: number;
  name?: string;
  penalty?: number;
}

export const STONE_RESOLUTION_QUEUE_FLAG = 'stoneResolutionQueue';

export type StoneResolutionKind = 'passive' | 'automatic' | 'interactive';

/**
 * Powers whose committed rank still needs a target or another player choice.
 * Healing and Stress Healing roll in the queue. The others keep their existing
 * apply (prompt or pending flag) and run only after confirm.
 */
const INTERACTIVE_STONE_POWER_IDS = new Set<string>([
  'resolve.healing',
  'resolve.stressHealing',
  'agility.safeMovement',
  'influence.aidRoll',
  'influence.regeneration',
  'influence.passiveSwap',
  'influence.notATarget',
  'wits.readIntent',
]);

export type StoneResolutionStatus = 'pending' | 'resolved';

export interface StoneResolutionTicket {
  id: string;
  powerId: string;
  tier: number;
  status: StoneResolutionStatus;
}

export interface StoneResolutionQueue {
  combatId: string;
  round: number;
  tickets: StoneResolutionTicket[];
}

export interface PlannedStonePower {
  powerId: string;
  tier: number;
}

export interface AssignmentSimulation {
  locked: boolean;
  /** Automatic and passive powers already applied, `${powerId}:${tier}`. */
  fired: string[];
  queue: StoneResolutionQueue | null;
}

export interface StoneTargetCandidate {
  id: string;
  name: string;
  self: boolean;
  /** Null when the token distance cannot be measured. */
  distanceM: number | null;
}

export interface HealthSnapshot {
  bars: StoneBar[];
  currentBar: number;
}

export function stoneResolutionKind(powerId: string): StoneResolutionKind {
  const id = resolveStonePowerId(powerId);
  if (INTERACTIVE_STONE_POWER_IDS.has(id)) return 'interactive';
  const power = STONE_POWERS[id];
  if (power?.category === 'passive') return 'passive';
  return 'automatic';
}

/** Allocation never executes a power. Confirm is the only commit point. */
export function effectsFromAllocation(): readonly string[] {
  return [];
}

export function stoneResolutionTicketId(
  combatId: string,
  round: number,
  powerId: string,
  tier: number,
): string {
  return `${combatId}:${round}:${resolveStonePowerId(powerId)}:${Math.floor(Number(tier) || 0)}`;
}

export function readStoneResolutionQueue(raw: unknown): StoneResolutionQueue | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Partial<StoneResolutionQueue>;
  if (typeof row.combatId !== 'string' || !Array.isArray(row.tickets)) return null;
  const tickets: StoneResolutionTicket[] = [];
  for (const ticket of row.tickets) {
    if (!ticket || typeof ticket !== 'object') continue;
    const id = String((ticket as StoneResolutionTicket).id || '');
    const powerId = resolveStonePowerId(String((ticket as StoneResolutionTicket).powerId || ''));
    const tier = Math.floor(Number((ticket as StoneResolutionTicket).tier) || 0);
    const status = (ticket as StoneResolutionTicket).status === 'resolved' ? 'resolved' : 'pending';
    if (!id || !powerId || tier < 1) continue;
    tickets.push({ id, powerId, tier, status });
  }
  return {
    combatId: row.combatId,
    round: Math.floor(Number(row.round) || 0),
    tickets,
  };
}

export function pendingStoneResolutions(queue: StoneResolutionQueue | null | undefined): StoneResolutionTicket[] {
  if (!queue) return [];
  return queue.tickets.filter((ticket) => ticket.status === 'pending');
}

/**
 * Add interactive powers for this combat round. Resolved ids stay resolved.
 * A second confirm with the same power does not create another ticket.
 */
export function enqueueStoneResolutions(
  existing: StoneResolutionQueue | null | undefined,
  combatId: string,
  round: number,
  incoming: readonly PlannedStonePower[],
): StoneResolutionQueue {
  const same =
    !!existing && existing.combatId === combatId && Number(existing.round) === Number(round);
  const tickets = same ? existing.tickets.map((ticket) => ({ ...ticket })) : [];
  for (const row of incoming) {
    if (stoneResolutionKind(row.powerId) !== 'interactive') continue;
    const tier = Math.floor(Number(row.tier) || 0);
    if (tier < 1) continue;
    const id = stoneResolutionTicketId(combatId, round, row.powerId, tier);
    if (tickets.some((ticket) => ticket.id === id)) continue;
    tickets.push({
      id,
      powerId: resolveStonePowerId(row.powerId),
      tier,
      status: 'pending',
    });
  }
  return { combatId, round, tickets };
}

export function markStoneResolutionResolved(
  queue: StoneResolutionQueue,
  ticketId: string,
): StoneResolutionQueue {
  return {
    ...queue,
    tickets: queue.tickets.map((ticket) =>
      ticket.id === ticketId ? { ...ticket, status: 'resolved' } : { ...ticket },
    ),
  };
}

export function splitCommitEffects(powers: readonly PlannedStonePower[]): {
  onCommit: PlannedStonePower[];
  interactive: PlannedStonePower[];
} {
  const onCommit: PlannedStonePower[] = [];
  const interactive: PlannedStonePower[] = [];
  for (const power of powers) {
    if (stoneResolutionKind(power.powerId) === 'interactive') interactive.push(power);
    else onCommit.push(power);
  }
  return { onCommit, interactive };
}

/**
 * Confirm applies each automatic/passive power once and locks the assignment.
 * A later call (view-only reopen, refresh) does not fire them again.
 */
export function simulateConfirmAssignment(
  state: AssignmentSimulation,
  args: {
    combatId: string;
    round: number;
    powers: readonly PlannedStonePower[];
    onAutomatic: (power: PlannedStonePower) => void;
  },
): AssignmentSimulation {
  if (state.locked) {
    return {
      locked: true,
      fired: [...state.fired],
      queue: state.queue
        ? { ...state.queue, tickets: state.queue.tickets.map((ticket) => ({ ...ticket })) }
        : null,
    };
  }
  const { onCommit, interactive } = splitCommitEffects(args.powers);
  const fired = [...state.fired];
  for (const power of onCommit) {
    const key = `${resolveStonePowerId(power.powerId)}:${power.tier}`;
    if (fired.includes(key)) continue;
    args.onAutomatic(power);
    fired.push(key);
  }
  return {
    locked: true,
    fired,
    queue: enqueueStoneResolutions(state.queue, args.combatId, args.round, interactive),
  };
}

export function healingRankProfile(tier: number): { dice: number; rangeM: number } {
  return {
    dice: scaleStoneTier([4, 8, 12, 16], tier),
    rangeM: scaleStoneTier([2, 4, 8, 16], tier),
  };
}

export function stressHealingRankProfile(tier: number): { dice: number; rangeM: number } {
  return {
    dice: scaleStoneTier([1, 2, 3, 4], tier),
    rangeM: scaleStoneTier([2, 4, 8, 16], tier),
  };
}

/** Self is always legal. An ally counts only when the measured distance is inside range. */
export function isLegalStoneTarget(candidate: StoneTargetCandidate, rangeM: number): boolean {
  if (candidate.self) return true;
  if (candidate.distanceM == null || !Number.isFinite(candidate.distanceM)) return false;
  return candidate.distanceM <= rangeM;
}

export function legalStoneTargets(
  candidates: readonly StoneTargetCandidate[],
  rangeM: number,
): StoneTargetCandidate[] {
  return candidates.filter((candidate) => isLegalStoneTarget(candidate, rangeM));
}

export function hpRestoredFromRoll(current: number, max: number, rolled: number): number {
  const cur = Math.max(0, Math.floor(Number(current) || 0));
  const cap = Math.max(cur, Math.floor(Number(max) || 0));
  const roll = Math.max(0, Math.floor(Number(rolled) || 0));
  return Math.max(0, Math.min(roll, cap - cur));
}

export function applyHealingToCurrentBar(
  health: HealthSnapshot,
  rolled: number,
): { bars: StoneBar[]; currentBar: number; restored: number; rolled: number } {
  const bars = (health.bars || []).map((bar) => ({ ...bar }));
  const currentBar = Math.max(0, Math.min(bars.length - 1, Math.floor(Number(health.currentBar) || 0)));
  const before = bars[currentBar] ? Math.floor(Number(bars[currentBar].current) || 0) : 0;
  const roll = Math.max(0, Math.floor(Number(rolled) || 0));
  if (bars[currentBar]) healDamage(bars as any, currentBar, roll);
  const restored = bars[currentBar] ? Math.floor(Number(bars[currentBar].current) || 0) - before : 0;
  return { bars, currentBar, restored: Math.max(0, restored), rolled: roll };
}

export function stressRestoredFromBars(before: readonly StoneBar[], after: readonly StoneBar[]): number {
  const sum = (bars: readonly StoneBar[]) =>
    bars.reduce((total, bar) => total + Math.max(0, Math.floor(Number(bar?.current) || 0)), 0);
  return Math.max(0, sum(after) - sum(before));
}

export function applyStressHealingToBars(
  bars: readonly StoneBar[],
  currentBar: number,
  rolled: number,
): { bars: StoneBar[]; currentBar: number; restored: number; rolled: number } {
  const before = bars.map((bar) => ({ ...bar }));
  const roll = Math.max(0, Math.floor(Number(rolled) || 0));
  const healed = healStressFromBars(before as any, currentBar, roll);
  return {
    bars: healed.bars,
    currentBar: healed.currentBar,
    restored: stressRestoredFromBars(before, healed.bars),
    rolled: roll,
  };
}

export function escapeStoneChat(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function healingChatContent(args: {
  sourceName: string;
  targetName: string;
  dice: number;
  rolled: number;
  restored: number;
}): string {
  const source = escapeStoneChat(args.sourceName);
  const target = escapeStoneChat(args.targetName);
  const cap =
    args.restored < args.rolled
      ? `<p>Rolled <strong>${args.rolled}</strong> (${args.dice}d8). <strong>${args.restored} HP restored</strong> — the current Health Bar was only ${args.restored} HP short of maximum.</p>`
      : `<p>Rolled <strong>${args.rolled}</strong> (${args.dice}d8). <strong>${args.restored} HP restored</strong>.</p>`;
  return `<div class="mastery-stone-resolution"><p><strong>${source}</strong> — Healing</p><p>Target: <strong>${target}</strong></p>${cap}</div>`;
}

export function stressHealingChatContent(args: {
  sourceName: string;
  targetName: string;
  dice: number;
  rolled: number;
  restored: number;
  rangeM: number;
}): string {
  const source = escapeStoneChat(args.sourceName);
  const target = escapeStoneChat(args.targetName);
  const cap =
    args.restored < args.rolled
      ? `<p>Rolled <strong>${args.rolled}</strong> (${args.dice}d8, ${args.rangeM} m). <strong>${args.restored} Stress removed</strong> — only ${args.restored} fit in the Stress bars.</p>`
      : `<p>Rolled <strong>${args.rolled}</strong> (${args.dice}d8, ${args.rangeM} m). <strong>${args.restored} Stress removed</strong>.</p>`;
  return `<div class="mastery-stone-resolution"><p><strong>${source}</strong> — Stress Healing</p><p>Target: <strong>${target}</strong></p>${cap}</div>`;
}

export async function resolveHealingSelection(args: {
  sourceName: string;
  tier: number;
  candidates: readonly StoneTargetCandidate[];
  choose: (legal: readonly StoneTargetCandidate[]) => Promise<string | null>;
  roll: (formula: string) => Promise<number>;
  healthOf: (targetId: string) => HealthSnapshot | null;
  writeHealth: (targetId: string, health: HealthSnapshot) => Promise<void> | void;
  chat: (content: string) => Promise<void> | void;
}): Promise<{ ok: boolean; restored: number; targetId: string | null }> {
  const profile = healingRankProfile(args.tier);
  if (profile.dice <= 0) return { ok: false, restored: 0, targetId: null };
  const legal = legalStoneTargets(args.candidates, profile.rangeM);
  const picked = String((await args.choose(legal)) || '').trim();
  if (!picked || !legal.some((candidate) => candidate.id === picked)) {
    return { ok: false, restored: 0, targetId: null };
  }
  const rolled = Math.max(0, Math.floor(Number(await args.roll(`${profile.dice}d8`)) || 0));
  const health = args.healthOf(picked);
  const applied = health
    ? applyHealingToCurrentBar(health, rolled)
    : { bars: [], currentBar: 0, restored: 0, rolled };
  if (health) {
    await args.writeHealth(picked, { bars: applied.bars, currentBar: applied.currentBar });
  }
  const targetName = legal.find((candidate) => candidate.id === picked)?.name || picked;
  try {
    await args.chat(
      healingChatContent({
        sourceName: args.sourceName,
        targetName,
        dice: profile.dice,
        rolled: applied.rolled,
        restored: applied.restored,
      }),
    );
  } catch {
    /* the HP write already happened; chat must not cause a second heal */
  }
  return { ok: true, restored: applied.restored, targetId: picked };
}

export async function resolveStressHealingSelection(args: {
  sourceName: string;
  tier: number;
  candidates: readonly StoneTargetCandidate[];
  choose: (legal: readonly StoneTargetCandidate[]) => Promise<string | null>;
  roll: (formula: string) => Promise<number>;
  stressOf: (targetId: string) => HealthSnapshot | null;
  writeStress: (targetId: string, stress: HealthSnapshot) => Promise<void> | void;
  chat: (content: string) => Promise<void> | void;
}): Promise<{ ok: boolean; restored: number; targetId: string | null }> {
  const profile = stressHealingRankProfile(args.tier);
  if (profile.dice <= 0) return { ok: false, restored: 0, targetId: null };
  const legal = legalStoneTargets(args.candidates, profile.rangeM);
  const picked = String((await args.choose(legal)) || '').trim();
  if (!picked || !legal.some((candidate) => candidate.id === picked)) {
    return { ok: false, restored: 0, targetId: null };
  }
  const rolled = Math.max(0, Math.floor(Number(await args.roll(`${profile.dice}d8`)) || 0));
  const stress = args.stressOf(picked);
  const applied = stress
    ? applyStressHealingToBars(stress.bars, stress.currentBar, rolled)
    : { bars: [], currentBar: 0, restored: 0, rolled };
  if (stress) {
    await args.writeStress(picked, { bars: applied.bars, currentBar: applied.currentBar });
  }
  const targetName = legal.find((candidate) => candidate.id === picked)?.name || picked;
  try {
    await args.chat(
      stressHealingChatContent({
        sourceName: args.sourceName,
        targetName,
        dice: profile.dice,
        rolled: applied.rolled,
        restored: applied.restored,
        rangeM: profile.rangeM,
      }),
    );
  } catch {
    /* Stress is already written */
  }
  return { ok: true, restored: applied.restored, targetId: picked };
}
