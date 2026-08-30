/**
 * Diminishing Special-Effect runtime: start-of-turn Tick + Decay.
 *
 * At the start of the affected creature's turn, each diminishing Special
 * resolves its Tick (if any) and then decays by 1 (removed at 0), per the
 * Special Effects Reference:
 *   - Ruin(X)         : take X damage (ignores Armor)
 *   - Exorcism(X)     : take X damage (ignores Armor)
 *   - Requiem(X)      : take X damage (ignores Armor)
 *   - Blight(X)       : take X Stress (ignores Stress Armor)
 *   - Regeneration(X) : heal X HP
 *
 * Movement-based ticks (Lacerate, Slow end-of-turn damage) are resolved from
 * movement tracking, not here. Value-based maluses (Corrode, Expose, Slow speed,
 * Soulburn, Weaken, Disoriented, Challenge) are applied in `prepareDerivedData`
 * / roll builders and only decay here. After Ticks, a stored Natural Special
 * Recovery plan (Stone Powers) reduces one or more negative Diminishing
 * Specials. Without a plan the HUD applies one Special by full Mastery Rank.
 * Cleanse Maintenance (Ward / Active Buff) then reduces one eligible Special
 * after Decay.
 *
 * Runs GM-side only so a single client mutates the actor.
 */

import { applyDamage, healDamage, applyStress } from '../utils/calculations.js';
import { getEffectById } from '../utils/special-effects.js';
import { statusEntryId } from '../system/active-specials.js';
import { distributeCleanseAcrossList, formatCleanseDistribution } from '../system/pool-reduction.js';
import { buildActorMechanicsBreakdown } from '../utils/power-mechanics.js';
import {
  applyNaturalRecoveryToValue,
  formatNaturalRecoveryNote,
  resolveNaturalRecoveryPlan,
} from './special-application.js';

interface StatusEffectEntry {
  id?: string;
  name?: string;
  value?: number | null;
  source?: string;
  timestamp?: number;
}

/**
 * Resolve start-of-turn Tick + Decay for one actor's diminishing Specials.
 * Returns a short human summary of what happened (for chat), or ''.
 */
export async function processTurnStartStatusTick(actor: any): Promise<string> {
  if (!actor || !game.user?.isGM) return '';

  const system = actor.system;
  const list: StatusEffectEntry[] = Array.isArray(system?.statusEffects) ? system.statusEffects : [];
  if (list.length === 0) return '';

  let ruinDamage = 0;
  let blightStress = 0;
  let blightHealReduction = 0;
  let regenHeal = 0;
  const notes: string[] = [];
  const working: StatusEffectEntry[] = [];
  const masteryRank = Math.max(1, Math.floor(Number(system?.mastery?.rank) || 1));

  for (const entry of list) {
    const id = statusEntryId(entry);
    const effect = id ? getEffectById(id) : undefined;

    // Stunned lasts "until the start of your next turn" — clear it here.
    if (id === 'stunned') {
      notes.push('Stunned ended');
      continue;
    }

    // Root(X): at start of turn, reduce by Mastery Rank (Rules v0.9.8 / agent.md).
    if (id === 'root') {
      const value = Math.max(0, Math.floor(Number(entry.value ?? 0)));
      const reduced = Math.max(0, value - masteryRank);
      if (reduced > 0) {
        working.push({ ...entry, id, value: reduced });
        notes.push(`Root(${value}) → Root(${reduced}) (−${masteryRank} MR)`);
      } else if (value > 0) {
        notes.push('Root ended');
      }
      continue;
    }

    // Non-diminishing (timed / until-used / instant) entries are left untouched.
    if (!effect || effect.category !== 'diminishing') {
      working.push(entry);
      continue;
    }

    const value = Math.max(0, Math.floor(Number(entry.value ?? 0)));

    // Tick (before Natural Recovery and Decay).
    if (value > 0) {
      switch (id) {
        case 'ruin':
          ruinDamage += value;
          notes.push(`Ruin(${value}) → ${value} damage`);
          break;
        case 'exorcism':
          ruinDamage += value;
          notes.push(`Exorcism(${value}) → ${value} damage`);
          break;
        case 'requiem':
          ruinDamage += value;
          notes.push(`Requiem(${value}) → ${value} damage`);
          break;
        case 'blight':
          blightStress += value;
          blightHealReduction += value;
          notes.push(`Blight(${value}) → ${value} Stress`);
          break;
        case 'regeneration':
          regenHeal += value;
          notes.push(`Regeneration(${value}) → heal ${value}`);
          break;
        default:
          break;
      }
    }

    working.push({ ...entry, id, value });
  }

  const recoverPlan = resolveNaturalRecoveryPlan(
    actor,
    working.map((e) => ({
      id: statusEntryId(e) || '',
      value: Math.max(0, Math.floor(Number(e.value ?? 0))),
    })),
    (globalThis as any).game?.combat ?? null,
    masteryRank,
  );
  for (const step of recoverPlan) {
    let left = step.reduced;
    for (let i = 0; i < working.length && left > 0; i++) {
      if (statusEntryId(working[i]) !== step.id) continue;
      const entry = working[i]!;
      const before = Math.max(0, Math.floor(Number(entry.value ?? 0)));
      const { after, reduced } = applyNaturalRecoveryToValue(before, left);
      left -= reduced;
      if (after > 0) working[i] = { ...entry, value: after };
      else {
        working.splice(i, 1);
        i -= 1;
      }
    }
    notes.push(formatNaturalRecoveryNote(step.id, step.before, step.after, step.reduced));
  }

  const next: StatusEffectEntry[] = [];
  for (const entry of working) {
    const id = statusEntryId(entry);
    const effect = id ? getEffectById(id) : undefined;
    if (!effect || effect.category !== 'diminishing') {
      next.push(entry);
      continue;
    }
    const value = Math.max(0, Math.floor(Number(entry.value ?? 0)));
    const decayed = value - 1;
    if (decayed > 0) {
      next.push({ ...entry, id, value: decayed });
    } else {
      notes.push(`${effect.name.replace(/\(X\)/, '')} ended`);
    }
  }

  // Cleanse Maintenance — the Cleanse value may be distributed freely across
  // eligible Specials (rulebook Cleanse(X)). Auto-spends greedily: highest
  // stack first, spilling over until the budget is exhausted.
  try {
    const bd = buildActorMechanicsBreakdown(actor);
    const cleanseX = Math.max(0, Math.floor(Number(bd?.totals?.cleanseMaintenance ?? 0) || 0));
    if (cleanseX > 0) {
      const cleansed = distributeCleanseAcrossList(next, cleanseX);
      if (cleansed.applied) {
        next.length = 0;
        next.push(...cleansed.statusEffects);
        notes.push(`Cleanse(${cleanseX}) → ${formatCleanseDistribution(cleansed)}`);
      }
    }
  } catch (err) {
    console.debug?.('Mastery System | Cleanse Maintenance skipped', err);
  }

  const update: Record<string, unknown> = { 'system.statusEffects': next };

  // Blight(X): all healing received is reduced by X — applies to the
  // Regeneration heal resolved in this same Tick.
  if (regenHeal > 0 && blightHealReduction > 0) {
    const reducedHeal = Math.max(0, regenHeal - blightHealReduction);
    notes.push(`Blight reduces healing: ${regenHeal} → ${reducedHeal}`);
    regenHeal = reducedHeal;
  }

  // Apply HP damage (Ruin, ignores Armor) then Regeneration heal to health bars.
  if ((ruinDamage > 0 || regenHeal > 0) && Array.isArray(system?.health?.bars) && system.health.bars.length > 0) {
    const bars = foundry.utils.duplicate(system.health.bars);
    let currentBar = Number(system.health.currentBar ?? 0);
    if (ruinDamage > 0) {
      currentBar = applyDamage(bars, currentBar, ruinDamage);
    }
    if (regenHeal > 0) {
      healDamage(bars, Math.min(Math.max(currentBar, 0), bars.length - 1), regenHeal);
    }
    update['system.health.bars'] = bars;
    update['system.health.currentBar'] = currentBar;
  }

  // Apply Stress (Blight, ignores Stress Armor) to stress bars.
  if (blightStress > 0 && Array.isArray(system?.stress?.bars) && system.stress.bars.length > 0) {
    const bars = foundry.utils.duplicate(system.stress.bars);
    const currentBar = applyStress(bars, Number(system.stress.currentBar ?? 0), blightStress);
    update['system.stress.bars'] = bars;
    update['system.stress.currentBar'] = currentBar;
  }

  try {
    await actor.update(update);
  } catch (err) {
    console.warn('Mastery System | status-tick update failed', actor?.name, err);
    return '';
  }

  return notes.join(', ');
}

/**
 * End-of-turn Special resolution for the creature whose turn just ended.
 * Currently: Brace(X) — "at the end of each of your turns, reduce Brace by 1;
 * if Brace reaches 0, it ends."
 */
export async function processTurnEndSpecials(actor: any): Promise<string> {
  if (!actor) return '';
  const system = actor.system;
  const list: StatusEffectEntry[] = Array.isArray(system?.statusEffects) ? system.statusEffects : [];
  if (list.length === 0) return '';

  const notes: string[] = [];
  let changed = false;
  const next: StatusEffectEntry[] = [];
  for (const entry of list) {
    const id = statusEntryId(entry);
    if (id !== 'brace') {
      next.push(entry);
      continue;
    }
    const value = Math.max(0, Math.floor(Number(entry.value ?? 0)));
    const decayed = value - 1;
    changed = true;
    if (decayed > 0) {
      next.push({ ...entry, id, value: decayed });
      notes.push(`Brace(${value}) → Brace(${decayed})`);
    } else {
      notes.push('Brace ended');
    }
  }
  if (!changed) return '';
  try {
    await actor.update({ 'system.statusEffects': next });
  } catch (err) {
    console.warn('Mastery System | turn-end special update failed', actor?.name, err);
    return '';
  }
  return notes.join(', ');
}

/**
 * Post a compact chat summary of a turn-start Tick, if anything happened.
 */
export async function announceStatusTick(actor: any, summary: string): Promise<void> {
  if (!summary) return;
  try {
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `<div class="mastery-status-tick"><strong>${actor?.name ?? 'Creature'}</strong> — Special Effects: ${summary}.</div>`,
    });
  } catch (err) {
    console.debug?.('Mastery System | status-tick chat skipped', err);
  }
}
