/**
 * Damage Negation — closed premium defensive subsystem.
 *
 * While the Damage Negation Passive is slotted, the actor gains a per-combat
 * Reserve of `2 × Passive Level` Damage Dice (playtest 2026-10-20; was 4 × PL).
 * Before an eligible Damage Pool is rolled, the defender may spend points 1:1
 * to remove Damage Dice from the pool assigned to them.
 *
 * Pending rule R-01 (2026-10-17): there is no half-pool cap. Caps are only
 * available negation points and the number of incoming damage dice.
 */

import { getActionEconomyActor, getRoundState } from './action-economy.js';
import { coerceNpcPhasesArray } from '../utils/npc-attack-model.js';

const FLAG_SCOPE = 'mastery-system';
const FLAG_RESERVE = 'dnReserve';

function actorItems(actor: any): any[] {
  const items = actor?.items;
  if (!items) return [];
  if (Array.isArray(items)) return items;
  if (items instanceof Map) return Array.from(items.values());
  if (typeof items.values === 'function') return Array.from(items.values());
  return [];
}

/** Find the Damage Negation Passive power item on an actor. */
export function findDamageNegationItem(actor: any): any | null {
  if (!actor) return null;
  for (const item of actorItems(actor)) {
    if (item?.type !== 'power') continue;
    if (String(item.system?.templateId ?? '').toLowerCase() === 'passive-damage-negation') {
      return item;
    }
  }
  return null;
}

/** Reserve size for a Passive level (2 Damage Dice per level; playtest 2026-10-20). */
export function damageNegationReserveForLevel(level: number): number {
  const lvl = Math.max(1, Math.min(16, Math.floor(Number(level) || 1)));
  return 2 * lvl;
}

/** Legacy reserve size before the 2026-10-20 playtest (4 × PL). */
export function legacyDamageNegationReserveForLevel(level: number): number {
  const lvl = Math.max(1, Math.min(16, Math.floor(Number(level) || 1)));
  return 4 * lvl;
}

/**
 * @deprecated R-01 removed the half-pool limit. Kept as alias returning the
 * full original dice count so older callers keep a sensible upper bound.
 */
export function damageNegationHalfPoolCap(originalDice: number): number {
  return Math.max(0, Math.floor(Number(originalDice) || 0));
}

/** Max dice removable for one pool: min(original dice, available points). */
export function damageNegationSpendCap(originalDice: number, available: number): number {
  const dice = Math.max(0, Math.floor(Number(originalDice) || 0));
  const pts = Math.max(0, Math.floor(Number(available) || 0));
  return Math.min(dice, pts);
}

interface ReserveFlag {
  combatId: string;
  remaining: number;
  /** Max used when this combat's flag was written (for mid-combat formula migration). */
  maxAtInit?: number;
}

/**
 * Migrate an in-progress Reserve when the formula changed (4×PL → 2×PL).
 * Preserves spent points: remaining = max(0, newMax − spent).
 */
export function migrateDamageNegationRemaining(opts: {
  level: number;
  remaining: number;
  maxAtInit?: number;
}): number {
  const level = Math.max(1, Math.min(16, Math.floor(Number(opts.level) || 1)));
  const newMax = damageNegationReserveForLevel(level);
  const storedMax = Math.floor(Number(opts.maxAtInit) || 0);
  const priorMax =
    storedMax > 0 ? storedMax : legacyDamageNegationReserveForLevel(level);
  const remaining = Math.max(0, Math.floor(Number(opts.remaining) || 0));
  const spent = Math.max(0, priorMax - remaining);
  return Math.max(0, Math.min(newMax, newMax - spent));
}

/**
 * Remaining passive Reserve for the current combat. Lazily initialized to the
 * full listed value the first time it is read during a combat.
 */
export function getDamageNegationRemaining(actor: any, combat: any): number {
  const owner = getActionEconomyActor(actor) ?? actor;
  const item = findDamageNegationItem(owner);
  if (!item || !combat?.id) return 0;
  const level = Number(item.system?.level) || 1;
  const max = damageNegationReserveForLevel(level);
  const flag = owner?.getFlag?.(FLAG_SCOPE, FLAG_RESERVE) as ReserveFlag | undefined;
  if (!flag || flag.combatId !== String(combat.id)) return max;
  const migrated = migrateDamageNegationRemaining({
    level,
    remaining: Number(flag.remaining) || 0,
    maxAtInit: flag.maxAtInit,
  });
  return migrated;
}

export async function spendDamageNegation(actor: any, combat: any, amount: number): Promise<boolean> {
  const n = Math.max(0, Math.floor(Number(amount) || 0));
  if (n <= 0) return true;
  const owner = getActionEconomyActor(actor) ?? actor;
  const item = findDamageNegationItem(owner);
  const level = Number(item?.system?.level) || 1;
  const max = damageNegationReserveForLevel(level);
  const remaining = getDamageNegationRemaining(owner, combat);
  if (remaining < n || !combat?.id) return false;
  await owner?.setFlag?.(FLAG_SCOPE, FLAG_RESERVE, {
    combatId: String(combat.id),
    remaining: remaining - n,
    maxAtInit: max,
  } satisfies ReserveFlag);
  return true;
}

/** Stone-granted temporary Damage Negation available this Round (round state). */
export function getTempDamageNegation(actor: any, combat: any): number {
  if (!combat) return 0;
  try {
    const rs = getRoundState(actor, combat);
    return Math.max(0, Math.floor(Number(rs.stoneBonuses?.tempDamageNegation ?? 0) || 0));
  } catch {
    return 0;
  }
}

/** Active Buff temporary Damage Negation (spend before Passive reserve). */
export function getBuffDamageNegation(actor: any): number {
  try {
    const effects = actor?.effects;
    const list = Array.isArray(effects)
      ? effects
      : Array.isArray(effects?.contents)
        ? effects.contents
        : [];
    let best = 0;
    for (const effect of list) {
      if (effect?.disabled) continue;
      const flags = effect?.flags?.['mastery-system'];
      if (!flags?.activeBuff) continue;
      const n = Math.max(0, Math.floor(Number(flags?.mechanics?.damageNegation ?? flags?.damageNegation) || 0));
      if (n > best) best = n;
    }
    return best;
  } catch {
    return 0;
  }
}

/** Resources actually spent by one Negation declaration (for refunds on cancellation). */
export interface DamageNegationSpentBreakdown {
  buff: number;
  buffEffectId?: string;
  temp: number;
  reserve: number;
}

export interface DamageNegationSpend {
  /** Damage Dice removed from the pool assigned to this defender. */
  diceRemoved: number;
  note: string;
  /** Present when points were spent from a resource (not for NPC auto negation). */
  spent?: DamageNegationSpentBreakdown;
}

/**
 * Give back the resources of one Negation declaration (the shared Autofire damage
 * roll was cancelled before any die was revealed). Best-effort; never exceeds the
 * printed pool maximum.
 */
export async function refundDamageNegationSpend(
  actor: any,
  spent: DamageNegationSpentBreakdown | null | undefined,
): Promise<void> {
  if (!actor || !spent) return;
  const owner = getActionEconomyActor(actor) ?? actor;
  const combat = (globalThis as any).game?.combat ?? null;

  const reserve = Math.max(0, Math.floor(Number(spent.reserve) || 0));
  if (reserve > 0 && combat?.id) {
    const item = findDamageNegationItem(owner);
    const max = damageNegationReserveForLevel(Number(item?.system?.level) || 1);
    const remaining = getDamageNegationRemaining(owner, combat);
    await owner?.setFlag?.(FLAG_SCOPE, FLAG_RESERVE, {
      combatId: String(combat.id),
      remaining: Math.min(max, remaining + reserve),
      maxAtInit: max,
    } satisfies ReserveFlag);
  }

  const temp = Math.max(0, Math.floor(Number(spent.temp) || 0));
  if (temp > 0 && combat) {
    try {
      const { getRoundState: grs, setRoundState: srs } = await import('./action-economy.js');
      const rs = grs(owner, combat);
      if (rs.stoneBonuses) {
        rs.stoneBonuses.tempDamageNegation = (rs.stoneBonuses.tempDamageNegation ?? 0) + temp;
        await srs(owner, rs);
      }
    } catch (e) {
      console.warn('Mastery System | temp Damage Negation refund failed', e);
    }
  }

  const buff = Math.max(0, Math.floor(Number(spent.buff) || 0));
  if (buff > 0) {
    try {
      const effects = owner?.effects;
      const list = Array.isArray(effects)
        ? effects
        : Array.isArray(effects?.contents)
          ? effects.contents
          : [];
      const effect =
        list.find((e: any) => spent.buffEffectId && e?.id === spent.buffEffectId) ??
        list.find((e: any) => e?.flags?.['mastery-system']?.activeBuff);
      const flags = effect?.flags?.['mastery-system'];
      if (effect && flags) {
        const cur = Math.max(0, Math.floor(Number(flags?.mechanics?.damageNegation) || 0));
        const poolMax = Math.floor(Number(flags?.mechanics?.damageNegationPoolMax) || 0);
        const next = poolMax > 0 ? Math.min(poolMax, cur + buff) : cur + buff;
        if (flags.mechanics) flags.mechanics.damageNegation = next;
        if (typeof effect.update === 'function') {
          await effect.update({ 'flags.mastery-system.mechanics.damageNegation': next });
        }
      }
    } catch (e) {
      console.warn('Mastery System | buff Damage Negation refund failed', e);
    }
  }
}

/**
 * Active combat block for an NPC/summon (active boss phase, else root combat).
 */
export function resolveNpcActiveCombatBlock(actor: any): Record<string, unknown> {
  const system = actor?.system ?? {};
  const phases = coerceNpcPhasesArray(system.phases);
  if (phases.length > 0) {
    const pi = Math.max(
      0,
      Math.min(phases.length - 1, Math.floor(Number(system.npcActivePhaseIndex) || 0)),
    );
    const phaseCombat = phases[pi]?.combat;
    if (phaseCombat && typeof phaseCombat === 'object') return phaseCombat as Record<string, unknown>;
  }
  return (system.combat && typeof system.combat === 'object'
    ? system.combat
    : {}) as Record<string, unknown>;
}

/**
 * NPC/summon sheet Damage Negation (dice removed automatically per incoming
 * Damage Pool). Characters use the Passive reserve + spend dialog instead.
 */
export function getNpcDamageNegationDice(actor: any): number {
  const type = String(actor?.type || '');
  if (type !== 'npc' && type !== 'summon') return 0;
  const block = resolveNpcActiveCombatBlock(actor);
  return Math.max(0, Math.min(20, Math.floor(Number(block.damageNegation) || 0)));
}

export function formatDamageNegationDialogContent(input: {
  defenderName: string;
  attackerName: string;
  totalDice: number;
  available: number;
  reserve: number;
  tempDn: number;
  buffDn?: number;
}): string {
  const dice = Math.max(0, Math.floor(Number(input.totalDice) || 0));
  const available = Math.max(0, Math.floor(Number(input.available) || 0));
  const cap = damageNegationSpendCap(dice, available);
  const parts: string[] = [];
  if (input.buffDn && input.buffDn > 0) parts.push(`${input.buffDn} Buff`);
  if (input.tempDn > 0) parts.push(`${input.tempDn} temporary`);
  if (input.reserve > 0 || parts.length === 0) parts.push(`${input.reserve} Reserve`);
  return (
    `<div class="mastery-dn-dialog">` +
    `<p><strong>${input.defenderName}</strong> vs ${input.attackerName}</p>` +
    `<ul style="list-style:none;padding:0;margin:0.5em 0;">` +
    `<li>Original Damage Pool: <strong>${dice}d8</strong></li>` +
    `<li>Available Damage Negation: <strong>${available}</strong> (${parts.join(' + ')})</li>` +
    `<li>Maximum Dice to Negate: <strong>${cap}</strong></li>` +
    `</ul>` +
    `<p><label>Dice to Negate: ` +
    `<input type="number" name="dn-spend" value="0" min="0" max="${cap}" step="1" ` +
    `style="width:5em" data-original="${dice}"/></label></p>` +
    `<p class="mastery-dn-preview">Remaining Damage Pool: <strong><span data-dn-remaining>${dice}</span>d8</strong> · ` +
    `Negation Points to Spend: <strong><span data-dn-spend>0</span></strong></p>` +
    `</div>`
  );
}

/**
 * Before the Damage Pool is rolled, apply Damage Negation. NPCs/summons with
 * sheet DN auto-remove that many dice. Characters get a spend prompt.
 * R-01: no half-pool limit — full negation of all damage dice is legal.
 */
export async function promptDamageNegationSpend(
  target: any,
  opts: { attacker?: any; totalDice: number; hitLabel?: string },
): Promise<DamageNegationSpend> {
  const none: DamageNegationSpend = { diceRemoved: 0, note: '' };
  try {
    const owner = getActionEconomyActor(target) ?? target;
    const combat = (globalThis as any).game?.combat ?? null;
    const totalDice = Math.max(0, Math.floor(Number(opts.totalDice) || 0));
    if (totalDice <= 0) return none;

    const npcDn = getNpcDamageNegationDice(owner);
    if (npcDn > 0) {
      const remove = Math.min(totalDice, npcDn);
      if (remove <= 0) return none;
      return {
        diceRemoved: remove,
        note: `Damage Negation −${remove} Damage Dice (NPC auto, before roll)`,
      };
    }

    const reserve = getDamageNegationRemaining(owner, combat);
    const tempDn = getTempDamageNegation(owner, combat);
    const buffDn = getBuffDamageNegation(owner);
    const available = reserve + tempDn + buffDn;
    if (available <= 0) return none;

    const cap = damageNegationSpendCap(totalDice, available);
    const name = String(owner?.name ?? 'Defender');
    const attackerName = String(opts.attacker?.name ?? 'the attacker');
    const content = formatDamageNegationDialogContent({
      defenderName: name,
      attackerName,
      totalDice,
      available,
      reserve,
      tempDn,
      buffDn,
    });

    const picked = await new Promise<number>((resolve) => {
      const DialogCtor = (globalThis as any).Dialog;
      if (typeof DialogCtor !== 'function') {
        resolve(0);
        return;
      }
      const dlg = new DialogCtor({
        title: `Damage Negation — ${name}${opts.hitLabel ? ` (${opts.hitLabel})` : ''}`,
        content,
        buttons: {
          spend: {
            label: 'Remove Dice',
            callback: (html: any) => {
              const root = html?.jquery ? html : (globalThis as any).$(html);
              const v = Math.floor(Number(root.find('[name="dn-spend"]').val()) || 0);
              resolve(Math.max(0, Math.min(cap, v)));
            },
          },
          skip: { label: 'Keep full pool', callback: () => resolve(0) },
        },
        default: 'skip',
        close: () => resolve(0),
        render: (html: any) => {
          const root = html?.jquery ? html : (globalThis as any).$(html);
          const input = root.find('[name="dn-spend"]');
          const update = () => {
            const v = Math.max(0, Math.min(cap, Math.floor(Number(input.val()) || 0)));
            root.find('[data-dn-remaining]').text(String(totalDice - v));
            root.find('[data-dn-spend]').text(String(v));
          };
          input.on('input change', update);
          update();
        },
      });
      dlg.render(true);
    });
    if (picked <= 0) return none;

    // Spend order: Active Buff temp → Stone temp → Passive reserve.
    let left = picked;
    const spent: DamageNegationSpentBreakdown = { buff: 0, temp: 0, reserve: 0 };
    if (buffDn > 0 && left > 0) {
      const useBuff = Math.min(buffDn, left);
      left -= useBuff;
      spent.buff = useBuff;
      try {
        const effects = owner?.effects;
        const list = Array.isArray(effects)
          ? effects
          : Array.isArray(effects?.contents)
            ? effects.contents
            : [];
        for (const effect of list) {
          if (effect?.disabled) continue;
          const flags = effect?.flags?.['mastery-system'];
          if (!flags?.activeBuff) continue;
          const cur = Math.max(0, Math.floor(Number(flags?.mechanics?.damageNegation) || 0));
          if (cur <= 0) continue;
          const next = Math.max(0, cur - useBuff);
          if (flags.mechanics) flags.mechanics.damageNegation = next;
          if (typeof effect.update === 'function') {
            await effect.update({
              'flags.mastery-system.mechanics.damageNegation': next,
            });
          }
          spent.buffEffectId = String(effect?.id ?? '') || undefined;
          break;
        }
      } catch (e) {
        console.warn('Mastery System | buff Damage Negation spend failed', e);
      }
    }
    if (tempDn > 0 && combat && left > 0) {
      const useTemp = Math.min(tempDn, left);
      left -= useTemp;
      spent.temp = useTemp;
      try {
        const { getRoundState: grs, setRoundState: srs } = await import('./action-economy.js');
        const rs = grs(owner, combat);
        if (rs.stoneBonuses) {
          rs.stoneBonuses.tempDamageNegation = Math.max(
            0,
            (rs.stoneBonuses.tempDamageNegation ?? 0) - useTemp,
          );
          await srs(owner, rs);
        }
      } catch (e) {
        console.warn('Mastery System | temp Damage Negation spend failed', e);
      }
    }
    if (left > 0) {
      const ok = await spendDamageNegation(owner, combat, left);
      if (!ok) {
        return {
          diceRemoved: picked - left,
          note: `Damage Negation −${picked - left} dice`,
          spent,
        };
      }
      spent.reserve = left;
    }
    return {
      diceRemoved: picked,
      note: `Damage Negation −${picked} Damage Dice (before roll)`,
      spent,
    };
  } catch (e) {
    console.warn('Mastery System | Damage Negation prompt failed', e);
    return none;
  }
}

/**
 * Refresh Active Buff: Damage Negation Pool to its printed max for every
 * maintained buff on the actor. Called at Preparation / Round advance so the
 * new Round's temporary pool is available; unused prior-Round points do not carry.
 */
export async function refreshBuffDamageNegationPools(actor: any): Promise<void> {
  if (!actor) return;
  try {
    const effects = actor?.effects;
    const list = Array.isArray(effects)
      ? effects
      : Array.isArray(effects?.contents)
        ? effects.contents
        : typeof effects?.values === 'function'
          ? Array.from(effects.values())
          : [];
    for (const effect of list) {
      if (effect?.disabled) continue;
      const flags = effect?.flags?.['mastery-system'];
      if (!flags?.activeBuff) continue;
      const tid = String(flags.powerTemplateId ?? flags.templateId ?? '').toLowerCase();
      const name = String(effect?.name ?? flags.powerName ?? '').toLowerCase();
      const isDnBuff =
        tid === 'ab-reinforced-damage-negation' ||
        name.includes('damage negation pool') ||
        name.includes('reinforced damage negation');
      if (!isDnBuff) continue;
      const mech = flags.mechanics && typeof flags.mechanics === 'object' ? flags.mechanics : {};
      const max = Math.max(
        0,
        Math.floor(
          Number(mech.damageNegationPoolMax ?? mech.damageNegation ?? flags.damageNegationPoolMax) || 0,
        ),
      );
      if (max <= 0) continue;
      if (typeof effect.update === 'function') {
        await effect.update({
          'flags.mastery-system.mechanics.damageNegation': max,
          'flags.mastery-system.mechanics.damageNegationPoolMax': max,
        });
      } else if (mech) {
        mech.damageNegation = max;
        mech.damageNegationPoolMax = max;
      }
    }
  } catch (err) {
    console.warn('Mastery System | refresh Buff Damage Negation pools failed', err);
  }
}

/** Refresh Buff DN pools for every combatant (Preparation / Round advance). */
export async function refreshBuffDamageNegationPoolsForCombat(combat: any): Promise<void> {
  if (!combat?.combatants) return;
  for (const c of combat.combatants) {
    const actor = c?.actor;
    if (!actor) continue;
    await refreshBuffDamageNegationPools(actor);
  }
}

/** Combat end: the Reserve is lost; a fresh one is gained next combat. */
export async function clearDamageNegationForCombat(combat: any): Promise<void> {
  if (!combat?.combatants) return;
  for (const c of combat.combatants) {
    const actor = c?.actor;
    if (!actor) continue;
    try {
      await actor.unsetFlag?.(FLAG_SCOPE, FLAG_RESERVE);
    } catch {
      /* best-effort */
    }
  }
}
