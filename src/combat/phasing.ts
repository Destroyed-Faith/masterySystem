/**
 * Phasing — Ignore-Hit Charges subsystem.
 *
 * Closed subsystem: only three sanctioned powers may grant or augment phasing
 * charges (enforced at the aggregator layer):
 *
 *   - **Ghostform** (Passive) — `mechanics.phasing.combatStart.charges: N`.
 *     Grants N base charges at combat start. Idempotent per combat (re-firing
 *     the combatStart trigger does not refill).
 *   - **Ghost Mantle** (Active Buff) — `mechanics.phasing.augment.addCharges: M`.
 *     Adds M charges on buff activation *if* a passive base already exists;
 *     Buff-delete removes those augment charges again via per-source tracking.
 *   - **Ghost Slip** (Reaction) — `mechanics.phasing.reactionSingleHit: true`.
 *     Grants exactly one charge for the triggering hit (runtime grants +1 and
 *     consumes it in the same turn).
 *
 * ### Runtime model
 *
 * Charges live under `actor.flags['mastery-system'].phasingCharges`:
 * ```
 * {
 *   max: number,           // aggregated cap (passive + augment sources)
 *   current: number,       // remaining ignore-hit charges
 *   combatId: string,      // combat the pool belongs to; cleared on combatEnd
 *   sources: {             // per-source bookkeeping for augment removal
 *     [key: string]: { ownerKind, ownerId, charges }
 *   }
 * }
 * ```
 *
 * On an incoming hit, `promptPhasingConsume(target, context)` asks the target
 * owner whether to consume one charge. If yes, `consumePhasingCharge(actor)`
 * decrements `current` (and is also invoked automatically inside the damage
 * pipeline once the prompt resolves to `true`).
 *
 * The module is intentionally isolated from the Temp-HP pipeline so that any
 * future defensive subsystem (Mirror Images, Absorption Shield, …) can follow
 * the same shape without coupling.
 */

export interface PhasingChargeSource {
  /** Kind of owner that granted these charges. */
  ownerKind: 'passive' | 'buff' | 'reaction';
  /** Power-item id (passive), ActiveEffect id (buff), or attack-id (reaction). */
  ownerId: string;
  /** Display name for chat logging. */
  name: string;
  /** How many charges this source contributes to `max` (and initially `current`). */
  charges: number;
}

export interface PhasingState {
  max: number;
  current: number;
  combatId: string;
  sources: Record<string, PhasingChargeSource>;
}

const FLAG_KEY = 'flags.mastery-system.phasingCharges';

function emptyState(): PhasingState {
  return { max: 0, current: 0, combatId: '', sources: {} };
}

/** Return a plain-object snapshot of the actor's phasing state (always defined). */
export function getPhasingCharges(actor: any): PhasingState {
  const raw = (actor?.flags?.['mastery-system'] as any)?.phasingCharges;
  if (!raw || typeof raw !== 'object') return emptyState();
  const sources: Record<string, PhasingChargeSource> = {};
  if (raw.sources && typeof raw.sources === 'object') {
    for (const [k, v] of Object.entries(raw.sources as Record<string, PhasingChargeSource>)) {
      if (v && typeof v === 'object') sources[k] = { ...v };
    }
  }
  return {
    max: Math.max(0, Math.floor(Number(raw.max) || 0)),
    current: Math.max(0, Math.floor(Number(raw.current) || 0)),
    combatId: String(raw.combatId ?? ''),
    sources,
  };
}

async function safeUpdate(actor: any, patch: Record<string, unknown>): Promise<void> {
  const u = (actor as any)?.update;
  if (typeof u !== 'function') return;
  try {
    await u.call(actor, patch);
  } catch (err) {
    console.warn('Mastery System | [phasing] actor.update failed', err);
  }
}

/** Serialize a state into an actor.update patch. */
function writeState(state: PhasingState): Record<string, unknown> {
  return {
    [FLAG_KEY]: {
      max: state.max,
      current: state.current,
      combatId: state.combatId,
      sources: state.sources,
    },
  };
}

function sourceKey(ownerKind: PhasingChargeSource['ownerKind'], ownerId: string): string {
  return `${ownerKind}:${ownerId}`;
}

/**
 * Grant base phasing charges from a Passive (Ghostform). Idempotent per
 * combat: if the same passive already granted charges for this combat, the
 * call is a no-op. If the combat changed, the state is reset to this power's
 * declared base (aging across combats is handled by `clearPhasingOnCombatEnd`).
 *
 * Augment contributions are preserved across the reset if they were tagged for
 * the same combat.
 */
export async function grantPhasingCharges(
  actor: any,
  combat: any,
  amount: number,
  source: { ownerKind: 'passive'; ownerId: string; name: string },
): Promise<void> {
  if (!actor || !(amount > 0)) return;
  const combatId = String(combat?.id ?? '');
  const state = getPhasingCharges(actor);

  // New combat → wipe any stale phasing state first.
  if (state.combatId && state.combatId !== combatId) {
    state.max = 0;
    state.current = 0;
    state.sources = {};
  }

  const key = sourceKey('passive', source.ownerId);
  const existing = state.sources[key];
  if (existing && state.combatId === combatId) {
    // Idempotent — same source in same combat is a no-op.
    return;
  }

  state.combatId = combatId;
  state.sources[key] = {
    ownerKind: 'passive',
    ownerId: source.ownerId,
    name: source.name,
    charges: amount,
  };
  state.max = Math.max(0, state.max + amount);
  state.current = Math.max(0, state.current + amount);
  await safeUpdate(actor, writeState(state));
}

/**
 * Add augment charges from an Active Buff (Ghost Mantle). Refuses if no
 * Passive base currently exists (enforced here as a belt-and-braces guard on
 * top of the aggregator's gating — mid-combat buff activations don't go
 * through the aggregator).
 */
export async function augmentPhasingCharges(
  actor: any,
  combat: any,
  addAmount: number,
  source: { ownerKind: 'buff' | 'reaction'; ownerId: string; name: string },
): Promise<void> {
  if (!actor || !(addAmount > 0)) return;
  const combatId = String(combat?.id ?? '');
  const state = getPhasingCharges(actor);

  // If the combat changed under us, bail — the passive-base must be re-granted
  // for the new combat first.
  if (state.combatId && state.combatId !== combatId) return;

  // Gate: Reactions bypass the passive-base requirement (they supply their own
  // single-hit charge by rule text). Buff augments require a Passive base.
  if (source.ownerKind === 'buff') {
    const hasPassive = Object.values(state.sources).some((s) => s.ownerKind === 'passive');
    if (!hasPassive) {
      console.warn(
        `Mastery System | [phasing] augment "${source.name}" ignored — no Passive base`,
      );
      return;
    }
  }

  const key = sourceKey(source.ownerKind, source.ownerId);
  const existing = state.sources[key];
  if (existing && state.combatId === combatId) {
    return; // idempotent
  }

  state.combatId = combatId || state.combatId;
  state.sources[key] = {
    ownerKind: source.ownerKind,
    ownerId: source.ownerId,
    name: source.name,
    charges: addAmount,
  };
  state.max += addAmount;
  state.current += addAmount;
  await safeUpdate(actor, writeState(state));
}

/**
 * Remove augment charges previously granted by a specific ActiveEffect (buff
 * was deleted/expired). Charges already consumed don't come back — we only
 * deduct the unused remainder, capped at what the source still contributes.
 */
export async function removeAugmentCharges(actor: any, effectId: string): Promise<void> {
  if (!actor || !effectId) return;
  const state = getPhasingCharges(actor);
  const key = sourceKey('buff', effectId);
  const src = state.sources[key];
  if (!src) return;
  delete state.sources[key];
  const remaining = Math.min(src.charges, state.current);
  state.max = Math.max(0, state.max - src.charges);
  state.current = Math.max(0, state.current - remaining);
  await safeUpdate(actor, writeState(state));
}

/**
 * Consume one charge. Returns true if a charge was available (and decremented).
 * Used by the damage pipeline after `promptPhasingConsume` resolves to `true`.
 */
export async function consumePhasingCharge(actor: any): Promise<boolean> {
  if (!actor) return false;
  const state = getPhasingCharges(actor);
  if (state.current <= 0) return false;
  state.current -= 1;
  await safeUpdate(actor, writeState(state));
  return true;
}

/** Reset phasing state at combat end (parallel to Temp-HP cleanup). */
export async function clearPhasingOnCombatEnd(actor: any, combat?: any): Promise<void> {
  if (!actor) return;
  const state = getPhasingCharges(actor);
  if (state.max === 0 && state.current === 0 && Object.keys(state.sources).length === 0) return;
  const combatId = combat?.id ? String(combat.id) : null;
  if (combatId && state.combatId && state.combatId !== combatId) return;
  await safeUpdate(actor, writeState(emptyState()));
}

/** Convenience: clear phasing state on every combatant. */
export async function clearPhasingForCombat(combat: any): Promise<void> {
  const combatants = combat?.combatants;
  if (!combatants) return;
  const iter: any[] =
    typeof combatants[Symbol.iterator] === 'function'
      ? Array.from(combatants)
      : Array.isArray(combatants)
        ? combatants
        : [];
  const seen = new Set<string>();
  for (const c of iter) {
    const actor = c?.actor;
    if (!actor) continue;
    const id = String(actor.id ?? actor._id ?? '');
    if (seen.has(id)) continue;
    seen.add(id);
    await clearPhasingOnCombatEnd(actor, combat);
  }
}

/**
 * Prompt the owner of `target` whether to consume a phasing charge for the
 * incoming hit. Returns `true` iff the user accepted (or auto-accept is on).
 * In headless environments (no `Dialog` global, tests, GM-driven NPCs without
 * owners) this is a silent no-op (returns `false`) unless the client-side
 * setting `phasingAutoConsume === 'always'` is active for the GM.
 */
export async function promptPhasingConsume(
  target: any,
  context: { attacker?: any; rawDamage?: number } = {},
): Promise<boolean> {
  if (!target) return false;
  const state = getPhasingCharges(target);
  if (state.current <= 0) return false;

  const setting: string | null = (() => {
    try {
      const g = (game as any)?.settings;
      if (!g?.get) return null;
      return String(g.get('mastery-system', 'phasingAutoConsume') ?? 'prompt');
    } catch {
      return null;
    }
  })();

  if (setting === 'always') return true;
  if (setting === 'never') return false;

  const Dialog: any = (globalThis as any).Dialog;
  if (!Dialog?.confirm) {
    // Headless / test environment — default to no, never silently consume.
    return false;
  }

  const attackerName = context.attacker?.name ?? 'Attacker';
  const rawDamageNum = Number(context.rawDamage);
  const hasRawDamage = Number.isFinite(rawDamageNum) && rawDamageNum > 0;
  const charges = state.current;
  const situationLine = hasRawDamage
    ? `<p><strong>${target.name ?? 'Target'}</strong> is about to take
        <strong>${Math.floor(rawDamageNum)}</strong> raw damage from
        <strong>${attackerName}</strong>.</p>`
    : `<p><strong>${target.name ?? 'Target'}</strong> has been hit by
        <strong>${attackerName}</strong> — Phasing resolves <em>before</em> the
        damage is rolled.</p>`;
  try {
    const accepted = await Dialog.confirm({
      title: 'Phasing — Ignore Hit?',
      content: `
        ${situationLine}
        <p>Spend <strong>1 of ${charges}</strong> phasing charge(s) to ignore this
        hit entirely? (No damage, no on-hit effects will apply.)</p>
      `,
      yes: () => true,
      no: () => false,
      defaultYes: false,
    });
    return !!accepted;
  } catch {
    return false;
  }
}

/**
 * Reaction entrypoint for **Ghost Slip** — the reaction-tier phasing power.
 * Grants one charge tied to the triggering attack and immediately decrements
 * it (reaction-style: fire and consume in the same step). The caller
 * (reaction flow / stone-powers-flow hook) is responsible for gating this
 * on the "1 reaction per round" limit.
 *
 * Returns `true` when the hit is successfully phased. Safe to call from a
 * non-combat state (charges are scoped to the current combat id, or an empty
 * string if no combat).
 */
export async function triggerGhostSlipReaction(
  actor: any,
  combat: any,
  effectId: string = 'ghost-slip',
): Promise<boolean> {
  if (!actor) return false;
  await augmentPhasingCharges(actor, combat, 1, {
    ownerKind: 'reaction',
    ownerId: effectId,
    name: 'Ghost Slip',
  });
  const consumed = await consumePhasingCharge(actor);
  return consumed;
}

/**
 * Register the client-side setting for phasing prompt behaviour. Call from
 * `module.ts` during the `init` hook alongside the existing status-effect
 * registration.
 */
export function registerPhasingSettings(): void {
  try {
    const g = (game as any)?.settings;
    if (!g?.register) return;
    g.register('mastery-system', 'phasingAutoConsume', {
      name: 'Phasing: Auto-Consume Charges',
      hint:
        'Controls whether the system prompts when a phasing charge would be consumed. ' +
        'Prompt (default) asks the target owner every hit; Always consumes silently; ' +
        'Never skips phasing even when charges are available.',
      scope: 'client',
      config: true,
      type: String,
      choices: {
        prompt: 'Prompt each hit',
        always: 'Always consume silently',
        never: 'Never consume (manual only)',
      },
      default: 'prompt',
    });
  } catch (err) {
    console.warn('Mastery System | [phasing] could not register settings', err);
  }
}
