/**
 * Unluck — session-start Misfortune Tokens (Players Guide).
 *
 * Rank 1 → 1d8 / 2, Rank 2 → 1d8, Rank 3 → 2d8.
 * Rolls are automatic; the GM menu starts a session and spends tokens.
 */

import { addMisfortuneTokens, FLAG_SCOPE } from './misfortune-tokens.js';

export const UNLUCK_SESSION_SETTING = 'unluckSession';

export const UNLUCK_SPEND_REASONS = [
  { id: 'worsen-fail', label: 'Worsen a failed roll' },
  { id: 'obstacle', label: 'Unlikely narrative obstacle' },
  { id: 'complication', label: 'Inconvenient complication' },
  { id: 'ally', label: 'Affect an ally caught in the bad luck' },
  { id: 'worse', label: 'Make a bad situation worse' },
] as const;

export type UnluckSpendReasonId = (typeof UNLUCK_SPEND_REASONS)[number]['id'];

export interface UnluckDiceSpec {
  formula: string;
  divideBy: number;
  label: string;
}

export interface UnluckCharacter {
  actorId: string;
  name: string;
  rank: number;
}

export interface UnluckSessionRoll {
  actorId: string;
  name: string;
  rank: number;
  formula: string;
  diceTotal: number;
  tokens: number;
}

export interface UnluckSessionState {
  rolled: boolean;
  rolledAt: number;
  rolls: UnluckSessionRoll[];
  added: number;
}

const EMPTY_SESSION: UnluckSessionState = {
  rolled: false,
  rolledAt: 0,
  rolls: [],
  added: 0,
};

export function unluckRankFromDetails(details: unknown): number {
  const raw = details && typeof details === 'object' ? (details as { rank?: unknown }).rank : undefined;
  const n = Math.floor(Number(raw) || 0);
  return Math.max(1, Math.min(3, n || 1));
}

export function unluckDiceSpec(rank: number): UnluckDiceSpec {
  const r = Math.max(1, Math.min(3, Math.floor(Number(rank) || 1)));
  if (r >= 3) return { formula: '2d8', divideBy: 1, label: '2d8' };
  if (r >= 2) return { formula: '1d8', divideBy: 1, label: '1d8' };
  return { formula: '1d8', divideBy: 2, label: '1d8 / 2' };
}

export function tokensFromUnluckDice(diceTotal: number, divideBy: number): number {
  const total = Math.max(0, Math.floor(Number(diceTotal) || 0));
  const div = Math.max(1, Math.floor(Number(divideBy) || 1));
  return Math.max(0, Math.floor(total / div));
}

export function collectUnluckCharacters(actors: Iterable<any>): UnluckCharacter[] {
  const out: UnluckCharacter[] = [];
  for (const actor of actors ?? []) {
    if (String(actor?.type || '') !== 'character') continue;
    const list = actor?.system?.disadvantages;
    if (!Array.isArray(list)) continue;
    const entry = list.find((d: any) => String(d?.id || '') === 'unluck');
    if (!entry) continue;
    const id = String(actor.id || '').trim();
    if (!id) continue;
    out.push({
      actorId: id,
      name: String(actor.name || 'Character'),
      rank: unluckRankFromDetails(entry.details),
    });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

export function registerUnluckSettings(): void {
  const g = globalThis as any;
  if (!g.game?.settings?.register) return;
  try {
    g.game.settings.register(FLAG_SCOPE, UNLUCK_SESSION_SETTING, {
      name: 'Unluck Session',
      hint: 'Last automatic Unluck roll for this play session.',
      scope: 'world',
      config: false,
      type: Object,
      default: EMPTY_SESSION,
    });
  } catch (err) {
    console.warn('Mastery System | unluckSession setting register failed', err);
  }
}

export function readUnluckSession(): UnluckSessionState {
  const g = globalThis as any;
  try {
    const raw = g.game?.settings?.get?.(FLAG_SCOPE, UNLUCK_SESSION_SETTING);
    if (!raw || typeof raw !== 'object') return { ...EMPTY_SESSION };
    const rolls = Array.isArray((raw as UnluckSessionState).rolls)
      ? (raw as UnluckSessionState).rolls
      : [];
    return {
      rolled: !!(raw as UnluckSessionState).rolled,
      rolledAt: Math.max(0, Math.floor(Number((raw as UnluckSessionState).rolledAt) || 0)),
      rolls,
      added: Math.max(0, Math.floor(Number((raw as UnluckSessionState).added) || 0)),
    };
  } catch {
    return { ...EMPTY_SESSION };
  }
}

async function writeUnluckSession(state: UnluckSessionState): Promise<void> {
  const g = globalThis as any;
  try {
    await g.game?.settings?.set?.(FLAG_SCOPE, UNLUCK_SESSION_SETTING, state);
  } catch (err) {
    console.warn('Mastery System | unluckSession set failed', err);
  }
}

export async function clearUnluckSession(): Promise<void> {
  await writeUnluckSession({ ...EMPTY_SESSION });
}

export function spendReasonLabel(reasonId: string): string {
  return UNLUCK_SPEND_REASONS.find((r) => r.id === reasonId)?.label || 'Complication';
}

async function rollFormula(formula: string): Promise<{ total: number; roll?: any }> {
  const g = globalThis as any;
  if (typeof g.Roll === 'function') {
    const roll = await new g.Roll(formula).evaluate({ async: true });
    return { total: Math.max(0, Math.floor(Number(roll?.total) || 0)), roll };
  }
  const count = formula.startsWith('2') ? 2 : 1;
  let total = 0;
  for (let i = 0; i < count; i++) total += 1 + Math.floor(Math.random() * 8);
  return { total };
}

export async function rollUnluckForSession(opts?: {
  actors?: Iterable<any>;
  force?: boolean;
}): Promise<{
  alreadyRolled: boolean;
  added: number;
  rolls: UnluckSessionRoll[];
  totalTokens: number;
}> {
  const existing = readUnluckSession();
  if (existing.rolled && !opts?.force) {
    return { alreadyRolled: true, added: 0, rolls: existing.rolls, totalTokens: 0 };
  }

  const g = globalThis as any;
  const actors = opts?.actors ?? g.game?.actors ?? [];
  const characters = collectUnluckCharacters(actors);
  const rolls: UnluckSessionRoll[] = [];
  let added = 0;

  for (const ch of characters) {
    const spec = unluckDiceSpec(ch.rank);
    const { total, roll } = await rollFormula(spec.formula);
    const tokens = tokensFromUnluckDice(total, spec.divideBy);
    added += tokens;
    rolls.push({
      actorId: ch.actorId,
      name: ch.name,
      rank: ch.rank,
      formula: spec.label,
      diceTotal: total,
      tokens,
    });
    if (roll?.toMessage) {
      try {
        const actor = g.game?.actors?.get?.(ch.actorId);
        await roll.toMessage({
          speaker: g.ChatMessage?.getSpeaker?.({ actor }) ?? {},
          flavor: `Unluck Rank ${ch.rank} — ${spec.label}`,
        });
      } catch {
        /* chat is optional */
      }
    }
  }

  const pool = await addMisfortuneTokens(added);
  await writeUnluckSession({
    rolled: true,
    rolledAt: Date.now(),
    rolls,
    added,
  });

  if (g.ChatMessage?.create) {
    const lines = rolls.length
      ? rolls
          .map((r) => `<li><strong>${esc(r.name)}</strong> Rank ${r.rank} (${r.formula}): ${r.diceTotal} → <strong>${r.tokens}</strong></li>`)
          .join('')
      : '<li>No character has Unluck.</li>';
    await g.ChatMessage.create({
      user: g.game?.user?.id,
      content: `<div class="mastery-unluck-chat">
        <strong>Unluck — Session Start</strong>
        <ul>${lines}</ul>
        <p>GM gains <strong>${added}</strong> Misfortune Token(s) (pool now <strong>${pool}</strong>).</p>
      </div>`,
    });
  }

  return { alreadyRolled: false, added, rolls, totalTokens: pool };
}

function esc(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
