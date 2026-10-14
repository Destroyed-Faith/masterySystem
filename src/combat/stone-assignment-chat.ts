/**
 * Chat summaries for Stone Powers assignments — per combatant on confirm,
 * plus a round rollup when everyone is done.
 */

import { STONE_POWERS } from '../stones/stone-powers.js';
import { getActionEconomyActor } from './action-economy.js';
import { formatNaturalRecoveryReceiptLines } from './special-application.js';

export const STONE_POWERS_ROUND_PLAN_FLAG = 'stonePowersRoundPlan';

export interface StonePowersLaneSnapshot {
  accKey: string;
  value: unknown;
}

function parseAccKey(accKey: string): { powerId: string; middle: string; uses: number } | null {
  const j = accKey.lastIndexOf(':');
  if (j <= 0) return null;
  const uses = Number(accKey.slice(j + 1));
  if (!Number.isFinite(uses)) return null;
  const rest = accKey.slice(0, j);
  const i = rest.lastIndexOf(':');
  if (i <= 0) return null;
  return { powerId: rest.slice(0, i), middle: rest.slice(i + 1), uses };
}

function stonesInLane(accKey: string, value: unknown): number {
  if (!Array.isArray(value) || value.length === 0) return 0;
  return value.length;
}

function powerLabel(powerId: string): string {
  const def = STONE_POWERS[powerId];
  return def?.name || powerId;
}

/** Human lines from a paid stone receipt (accKey → stones). */
export function formatStoneReceiptLines(receipt: StonePowersLaneSnapshot[] | null | undefined): string[] {
  if (!Array.isArray(receipt) || receipt.length === 0) return [];
  const byPower = new Map<string, number>();
  for (const row of receipt) {
    const parsed = parseAccKey(String(row?.accKey || ''));
    if (!parsed) continue;
    const count = stonesInLane(String(row.accKey || ''), row.value);
    if (count <= 0) continue;
    byPower.set(parsed.powerId, (byPower.get(parsed.powerId) || 0) + count);
  }
  return [...byPower.entries()]
    .sort((a, b) => powerLabel(a[0]).localeCompare(powerLabel(b[0])))
    .map(([id, n]) => `${powerLabel(id)} (${n} stone${n === 1 ? '' : 's'})`);
}

function escapeChat(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatCombatantStoneBlock(
  actor: any,
  combat: Combat | null | undefined,
  receipt: StonePowersLaneSnapshot[] | null | undefined,
): { stoneLines: string[]; recoveryLines: string[]; htmlLi: string } {
  const name = escapeChat(actor?.name || 'Combatant');
  const stoneLines = formatStoneReceiptLines(receipt);
  const recoveryLines = formatNaturalRecoveryReceiptLines(actor, combat);
  const stonePart =
    stoneLines.length > 0
      ? stoneLines.map((l) => escapeChat(l)).join('; ')
      : '<em>no stones</em>';
  const recoveryPart =
    recoveryLines.length > 0
      ? recoveryLines
          .map((l) => {
            const auto = /auto \(only one Special\)/i.test(l);
            return `<span class="ms-stone-nr-line${auto ? ' ms-stone-nr-auto' : ''}">${escapeChat(l)}</span>`;
          })
          .join('; ')
      : '';
  const recoveryHtml = recoveryPart ? ` · ${recoveryPart}` : '';
  return {
    stoneLines,
    recoveryLines,
    htmlLi: `<li><strong>${name}</strong>: ${stonePart}${recoveryHtml}</li>`,
  };
}

export async function announceActorStoneAssignment(
  actor: any,
  receipt: StonePowersLaneSnapshot[] | null | undefined,
  round: number,
): Promise<void> {
  const combat = (globalThis as any).game?.combat as Combat | null | undefined;
  const name = String(actor?.name || 'Combatant');
  const stoneLines = formatStoneReceiptLines(receipt);
  const recoveryLines = formatNaturalRecoveryReceiptLines(actor, combat);
  const stoneBody =
    stoneLines.length > 0
      ? `<ul>${stoneLines.map((l) => `<li>${escapeChat(l)}</li>`).join('')}</ul>`
      : `<p><em>No stone powers activated this round.</em></p>`;
  const recoveryBody =
    recoveryLines.length > 0
      ? `<div class="ms-stone-nr-block${recoveryLines.some((l) => /auto \(only one Special\)/i.test(l)) ? ' ms-stone-nr-auto' : ''}"><strong>Natural Special Recovery</strong><ul>${recoveryLines
          .map((l) => `<li>${escapeChat(l)}</li>`)
          .join('')}</ul></div>`
      : '';
  try {
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `<div class="mastery-stone-assignment-summary"><strong>${escapeChat(name)}</strong> — Stones (Round ${round}):${stoneBody}${recoveryBody}</div>`,
    });
  } catch (err) {
    console.warn('Mastery System | stone assignment chat failed', err);
  }
}

const ROUND_STONE_SUMMARY_FLAG = 'stoneRoundSummaryPosted';

/**
 * After every PC/NPC with stone flow is done: one chat card listing who spent what
 * and Natural Special Recovery plans (incl. auto single-effect).
 * Idempotent per combat round (safe if multiple complete paths fire).
 */
export async function announceRoundStoneAssignments(combat: Combat, round: number): Promise<void> {
  if (!combat) return;
  const posted =
    ((combat as any).getFlag?.('mastery-system', ROUND_STONE_SUMMARY_FLAG) as Record<string, boolean>) ||
    {};
  if (posted[String(round)]) return;

  // Last confirm: auto-fill Natural Recovery for any PC with only one Special.
  try {
    const { ensureAutoNaturalRecoveryForAllPlayerCharacters } = await import('./special-application.js');
    await ensureAutoNaturalRecoveryForAllPlayerCharacters(combat);
  } catch (err) {
    console.warn('Mastery System | auto Natural Recovery at round end failed', err);
  }

  const blocks: string[] = [];
  const combatants = (combat as any).combatants?.contents ?? (combat as any).combatants ?? [];
  const list = Array.isArray(combatants)
    ? combatants
    : typeof combatants[Symbol.iterator] === 'function'
      ? Array.from(combatants)
      : [];
  for (const c of list) {
    const actor = c?.actor;
    if (!actor) continue;
    // Round summary is for player characters (stone gate); NPCs stay out.
    if (String(actor.type || '') !== 'character') continue;
    const owner = getActionEconomyActor(actor) ?? actor;
    const plan = owner.getFlag?.('mastery-system', STONE_POWERS_ROUND_PLAN_FLAG) as
      | { combatId?: string; round?: number; receipt?: StonePowersLaneSnapshot[] }
      | null
      | undefined;
    const receipt =
      plan &&
      String(plan.combatId || '') === String(combat.id || '') &&
      Math.max(1, Math.floor(Number(plan.round) || 0)) === round
        ? plan.receipt
        : null;
    blocks.push(formatCombatantStoneBlock(actor, combat, receipt).htmlLi);
  }
  if (blocks.length === 0) return;
  try {
    if (typeof (combat as any).setFlag === 'function') {
      await (combat as any).setFlag('mastery-system', ROUND_STONE_SUMMARY_FLAG, {
        ...posted,
        [String(round)]: true,
      });
    }
    await ChatMessage.create({
      content: `<div class="mastery-stone-round-summary"><strong>Round ${round} — Stones &amp; Natural Recovery</strong><ul>${blocks.join('')}</ul></div>`,
    });
  } catch (err) {
    console.warn('Mastery System | round stone summary chat failed', err);
  }
}
