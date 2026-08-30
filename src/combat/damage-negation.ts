/**
 * Damage Negation — closed premium defensive subsystem (Rules/passives.md).
 *
 * While the Damage Negation Passive is slotted, the actor gains a per-combat
 * Reserve of `4 × Passive Level` Damage Dice. Before an eligible Damage Pool
 * is rolled, the defender may spend points 1:1 to remove Damage Dice from the
 * pool assigned to them. All Damage Negation combined can never remove more
 * than half of the original Damage Dice (rounded down). The Reserve does not
 * refresh mid-combat and is lost when the combat ends.
 */

import { getActionEconomyActor, getRoundState } from './action-economy.js';

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

/** Reserve size for a Passive level (4 Damage Dice per level). */
export function damageNegationReserveForLevel(level: number): number {
  const lvl = Math.max(1, Math.min(16, Math.floor(Number(level) || 1)));
  return 4 * lvl;
}

/** Maximum removable dice for one Damage Pool: floor(original dice / 2). */
export function damageNegationHalfPoolCap(originalDice: number): number {
  return Math.max(0, Math.floor(Math.max(0, Math.floor(Number(originalDice) || 0)) / 2));
}

interface ReserveFlag {
  combatId: string;
  remaining: number;
}

/**
 * Remaining passive Reserve for the current combat. Lazily initialized to the
 * full listed value the first time it is read during a combat.
 */
export function getDamageNegationRemaining(actor: any, combat: any): number {
  const owner = getActionEconomyActor(actor) ?? actor;
  const item = findDamageNegationItem(owner);
  if (!item || !combat?.id) return 0;
  const max = damageNegationReserveForLevel(Number(item.system?.level) || 1);
  const flag = owner?.getFlag?.(FLAG_SCOPE, FLAG_RESERVE) as ReserveFlag | undefined;
  if (!flag || flag.combatId !== String(combat.id)) return max;
  return Math.max(0, Math.min(max, Math.floor(Number(flag.remaining) || 0)));
}

export async function spendDamageNegation(actor: any, combat: any, amount: number): Promise<boolean> {
  const n = Math.max(0, Math.floor(Number(amount) || 0));
  if (n <= 0) return true;
  const owner = getActionEconomyActor(actor) ?? actor;
  const remaining = getDamageNegationRemaining(owner, combat);
  if (remaining < n || !combat?.id) return false;
  await owner?.setFlag?.(FLAG_SCOPE, FLAG_RESERVE, {
    combatId: String(combat.id),
    remaining: remaining - n,
  } satisfies ReserveFlag);
  return true;
}

/** Stone-granted temporary Damage Negation available this turn (round state). */
export function getTempDamageNegation(actor: any, combat: any): number {
  if (!combat) return 0;
  try {
    const rs = getRoundState(actor, combat);
    return Math.max(0, Math.floor(Number(rs.stoneBonuses?.tempDamageNegation ?? 0) || 0));
  } catch {
    return 0;
  }
}

export interface DamageNegationSpend {
  /** Damage Dice removed from the pool assigned to this defender. */
  diceRemoved: number;
  note: string;
}

/**
 * PG attack sequence step 11: before the Damage Pool is rolled, offer the
 * defender to spend Damage Negation. Returns the number of Damage Dice to
 * remove (0 when declined/unavailable). Never exceeds the Half-Pool Limit.
 */
export async function promptDamageNegationSpend(
  target: any,
  opts: { attacker?: any; totalDice: number },
): Promise<DamageNegationSpend> {
  const none: DamageNegationSpend = { diceRemoved: 0, note: '' };
  try {
    const owner = getActionEconomyActor(target) ?? target;
    const combat = (globalThis as any).game?.combat ?? null;
    const halfCap = damageNegationHalfPoolCap(opts.totalDice);
    if (halfCap <= 0) return none;

    const reserve = getDamageNegationRemaining(owner, combat);
    const tempDn = getTempDamageNegation(owner, combat);
    const available = reserve + tempDn;
    if (available <= 0) return none;

    const cap = Math.min(halfCap, available);
    const name = String(owner?.name ?? 'Defender');
    const attackerName = String(opts.attacker?.name ?? 'the attacker');
    const picked = await new Promise<number>((resolve) => {
      new Dialog({
        title: `Damage Negation — ${name}`,
        content:
          `<p><strong>${name}</strong> is assigned a Damage Pool of <strong>${Math.floor(opts.totalDice)}d8</strong> from ${attackerName}.</p>` +
          `<p>Damage Negation available: <strong>${available}</strong>` +
          (tempDn > 0 ? ` (${reserve} Reserve + ${tempDn} temporary)` : ' (Reserve)') +
          `. Half-Pool Limit: max <strong>${halfCap}</strong> dice may be removed.</p>` +
          `<p><label>Remove Damage Dice: <input type="number" name="dn-spend" value="0" min="0" max="${cap}" step="1" style="width:5em"/></label></p>`,
        buttons: {
          spend: {
            label: 'Remove Dice',
            callback: (html: JQuery) => {
              const v = Math.floor(Number(html.find('[name="dn-spend"]').val()) || 0);
              resolve(Math.max(0, Math.min(cap, v)));
            },
          },
          skip: { label: 'Keep full pool', callback: () => resolve(0) },
        },
        default: 'skip',
        close: () => resolve(0),
      }).render(true);
    });
    if (picked <= 0) return none;

    // Temporary (stone) negation is consumed first, then the passive Reserve.
    let left = picked;
    if (tempDn > 0 && combat) {
      const useTemp = Math.min(tempDn, left);
      left -= useTemp;
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
        // Reserve raced — apply what we could from temp only.
        return {
          diceRemoved: picked - left,
          note: `Damage Negation −${picked - left} dice`,
        };
      }
    }
    return {
      diceRemoved: picked,
      note: `Damage Negation −${picked} Damage Dice (before roll, half-pool cap ${halfCap})`,
    };
  } catch (e) {
    console.warn('Mastery System | Damage Negation prompt failed', e);
    return none;
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
