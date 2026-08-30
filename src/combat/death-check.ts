/**
 * Incapacitation & Death Checks (Players Guide "Incapacitation & Death").
 *
 * When all Health Bars are depleted the creature is Incapacitated. At the end
 * of each of its turns the GM rolls a Death Check:
 *   - Pool: the higher of Vitality or Resolve, keep dice equal to Mastery Rank.
 *   - TN = 8 × Mastery Rank.
 *   - Success → +1 Success (4 Successes → Stabilized).
 *   - Failure → +1 Death Mark (4 Death Marks → dead).
 *
 * Skill Points, Vitality spends and health penalties never modify the pool.
 * The state lives in `flags.mastery-system.deathState` and resets as soon as
 * the creature has any HP again (healing wakes it immediately).
 */

export const DEATH_STATE_FLAG = 'deathState';

export interface DeathState {
  successes: number;
  marks: number;
  stabilized: boolean;
  dead: boolean;
}

export function emptyDeathState(): DeathState {
  return { successes: 0, marks: 0, stabilized: false, dead: false };
}

export function readDeathState(actor: any): DeathState {
  const raw =
    typeof actor?.getFlag === 'function'
      ? actor.getFlag('mastery-system', DEATH_STATE_FLAG)
      : actor?.flags?.['mastery-system']?.[DEATH_STATE_FLAG];
  if (!raw || typeof raw !== 'object') return emptyDeathState();
  return {
    successes: Math.max(0, Math.floor(Number((raw as any).successes) || 0)),
    marks: Math.max(0, Math.floor(Number((raw as any).marks) || 0)),
    stabilized: (raw as any).stabilized === true,
    dead: (raw as any).dead === true,
  };
}

async function writeDeathState(actor: any, state: DeathState): Promise<void> {
  await actor.setFlag?.('mastery-system', DEATH_STATE_FLAG, state);
}

export async function clearDeathState(actor: any): Promise<void> {
  try {
    if (actor?.getFlag?.('mastery-system', DEATH_STATE_FLAG) != null) {
      await actor.unsetFlag?.('mastery-system', DEATH_STATE_FLAG);
    }
  } catch {
    /* ignore */
  }
}

/** All Health Bars fully depleted. */
export function isIncapacitated(actor: any): boolean {
  const bars = actor?.system?.health?.bars;
  if (!Array.isArray(bars) || bars.length === 0) return false;
  return bars.every((b: any) => (Number(b?.current) || 0) <= 0);
}

/** Pool attribute: the higher of Vitality or Resolve. */
export function deathCheckPool(actor: any): { attribute: string; dice: number; keep: number; tn: number } {
  const vit = Math.max(0, Math.floor(Number(actor?.system?.attributes?.vitality?.value) || 0));
  const res = Math.max(0, Math.floor(Number(actor?.system?.attributes?.resolve?.value) || 0));
  const mr = Math.max(1, Math.floor(Number(actor?.system?.mastery?.rank) || 1));
  const useVit = vit >= res;
  return {
    attribute: useVit ? 'Vitality' : 'Resolve',
    dice: Math.max(1, useVit ? vit : res),
    keep: Math.min(mr, Math.max(1, useVit ? vit : res)),
    tn: 8 * mr,
  };
}

export interface DeathCheckResult {
  rolled: boolean;
  total?: number;
  tn?: number;
  success?: boolean;
  state?: DeathState;
}

/**
 * Roll one Death Check for an Incapacitated creature and update its state.
 * Posts a GM-whispered chat card. No-op if the creature is not incapacitated,
 * already Stabilized, or already dead.
 */
export async function maybeRollDeathCheck(actor: any): Promise<DeathCheckResult> {
  if (!actor || (actor as any).type !== 'character') return { rolled: false };
  if (!isIncapacitated(actor)) {
    // Healing reopened a bar — the death spiral ends.
    await clearDeathState(actor);
    return { rolled: false };
  }
  const state = readDeathState(actor);
  if (state.stabilized || state.dead) return { rolled: false };

  const pool = deathCheckPool(actor);
  const RollCls = (globalThis as any).Roll;
  const roll = new RollCls(`${pool.dice}d8kh${pool.keep}`);
  await roll.evaluate();
  const total = Number(roll.total) || 0;
  const success = total >= pool.tn;

  const next: DeathState = { ...state };
  if (success) next.successes += 1;
  else next.marks += 1;
  if (next.successes >= 4) next.stabilized = true;
  if (next.marks >= 4) next.dead = true;
  await writeDeathState(actor, next);

  const gmIds = ((globalThis as any).game?.users ?? [])
    .filter((u: any) => u.isGM)
    .map((u: any) => u.id);
  const outcomeLine = next.dead
    ? '<strong>4 Death Marks — the creature dies.</strong>'
    : next.stabilized
      ? '<strong>4 Successes — Stabilized</strong> (unconscious, no further Death Checks).'
      : `Successes ${next.successes} / 4 · Death Marks ${next.marks} / 4`;
  try {
    await (globalThis as any).ChatMessage?.create?.({
      speaker: (globalThis as any).ChatMessage?.getSpeaker?.({ actor }),
      whisper: gmIds,
      rolls: [roll],
      content:
        `<div class="mastery-death-check"><strong>${actor.name}</strong> — Death Check ` +
        `(${pool.attribute} ${pool.dice}d8 keep ${pool.keep} vs TN ${pool.tn}): ` +
        `<strong>${total}</strong> → ${success ? 'Success' : 'Failure'}.<br>${outcomeLine}</div>`,
    });
  } catch (err) {
    console.warn('Mastery System | Death Check chat failed', err);
  }

  return { rolled: true, total, tn: pool.tn, success, state: next };
}

/**
 * Ally stabilization (Medicine, 1 Attack Action): on success the patient
 * counts as having 4 Successes. TN = 12 × patient Mastery Rank (handled by
 * the Medicine roll itself — this helper only records the result).
 */
export async function markStabilized(actor: any): Promise<void> {
  const state = readDeathState(actor);
  await writeDeathState(actor, { ...state, successes: Math.max(4, state.successes), stabilized: true });
}
