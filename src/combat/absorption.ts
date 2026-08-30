/**
 * Absorption — closed premium Passive subsystem (Rules/passives.md).
 *
 * While the Absorption Passive is slotted:
 *  • every normal Health Bar gains +4 Max HP per Passive Level, and
 *  • eligible hostile actual HP loss accumulates as Absorbed Damage. Whenever
 *    the accumulator reaches the character's Vitality, it is reduced by
 *    Vitality and the character gains 1 Temporary Colorless Stone (Ready,
 *    gone at the end of their next turn). Excess carries over; the
 *    accumulator is cleared when combat ends.
 */

import { getActionEconomyActor } from './action-economy.js';

const FLAG_SCOPE = 'mastery-system';
const FLAG_ACCUM = 'absorbedDamage';
const FLAG_TEMP_STONE_EXPIRY = 'absorptionStoneExpiry';

function actorItems(actor: any): any[] {
  const items = actor?.items;
  if (!items) return [];
  if (Array.isArray(items)) return items;
  if (items instanceof Map) return Array.from(items.values());
  if (typeof items.values === 'function') return Array.from(items.values());
  return [];
}

/** Find the Absorption Passive power item on an actor. */
export function findAbsorptionItem(actor: any): any | null {
  if (!actor) return null;
  for (const item of actorItems(actor)) {
    if (item?.type !== 'power') continue;
    if (String(item.system?.templateId ?? '').toLowerCase() === 'passive-absorption') {
      return item;
    }
  }
  return null;
}

/** Additional Max HP per normal Health Bar (4 per Passive Level). */
export function absorptionHpPerBar(actor: any): number {
  const item = findAbsorptionItem(actor);
  if (!item) return 0;
  const lvl = Math.max(1, Math.min(16, Math.floor(Number(item.system?.level) || 1)));
  return 4 * lvl;
}

interface AccumFlag {
  combatId: string;
  value: number;
}

export function getAbsorbedDamage(actor: any, combat: any): number {
  if (!combat?.id) return 0;
  const flag = actor?.getFlag?.(FLAG_SCOPE, FLAG_ACCUM) as AccumFlag | undefined;
  if (!flag || flag.combatId !== String(combat.id)) return 0;
  return Math.max(0, Math.floor(Number(flag.value) || 0));
}

/**
 * PG attack sequence step 18: after the damage instance has fully resolved,
 * accumulate eligible actual HP loss and harvest Temporary Colorless Stones.
 * Call with the HP actually removed from Health Bars (not Temp HP).
 */
export async function accumulateAbsorbedDamage(
  target: any,
  hpLost: number,
  attacker?: any,
): Promise<number> {
  const lost = Math.max(0, Math.floor(Number(hpLost) || 0));
  if (lost <= 0) return 0;
  const owner = getActionEconomyActor(target) ?? target;
  if (!findAbsorptionItem(owner)) return 0;

  const combat = (globalThis as any).game?.combat ?? null;
  if (!combat?.id || !combat.started) return 0; // outside combat no stones are generated

  // Self-inflicted / willing-ally damage is not eligible.
  if (attacker && String(attacker.id ?? '') === String(owner.id ?? '')) return 0;

  const vitality = Math.max(
    1,
    Math.floor(Number(owner.system?.attributes?.vitality?.value) || 1),
  );
  let accum = getAbsorbedDamage(owner, combat) + lost;
  const stones = Math.floor(accum / vitality);
  accum -= stones * vitality;

  await owner.setFlag?.(FLAG_SCOPE, FLAG_ACCUM, {
    combatId: String(combat.id),
    value: accum,
  } satisfies AccumFlag);

  if (stones > 0) {
    try {
      const { addTempColorlessStones } = await import('../stones/colorless-stones.js');
      await addTempColorlessStones(owner, stones);
      // Absorption stones vanish at the end of the character's next turn.
      await owner.setFlag?.(FLAG_SCOPE, FLAG_TEMP_STONE_EXPIRY, {
        combatId: String(combat.id),
        round: combat.round ?? 1,
        count: stones,
      });
      const g = globalThis as any;
      await g.ChatMessage?.create?.({
        user: g.game?.user?.id,
        speaker: g.ChatMessage?.getSpeaker?.({ actor: owner }),
        content:
          `<p class="mastery-reaction-msg"><strong>${String(owner.name ?? 'Character')}</strong> absorbs the pain — ` +
          `gains <strong>${stones} Temporary Colorless Stone${stones === 1 ? '' : 's'}</strong> ` +
          `(1 per ${vitality} actual HP lost; ${accum} Absorbed Damage carries over). ` +
          `Unspent Absorption stones disappear at the end of their next turn.</p>`,
      });
    } catch (e) {
      console.warn('Mastery System | Absorption stone grant failed', e);
    }
  }
  return stones;
}

/**
 * Turn end for the actor: Absorption-granted Temporary Colorless Stones that
 * were gained before this turn expire ("until the end of your next Turn").
 */
export async function expireAbsorptionStonesAtTurnEnd(actor: any, combat: any): Promise<void> {
  const owner = getActionEconomyActor(actor) ?? actor;
  const flag = owner?.getFlag?.(FLAG_SCOPE, FLAG_TEMP_STONE_EXPIRY) as
    | { combatId: string; round: number; count: number }
    | undefined;
  if (!flag || !combat?.id || flag.combatId !== String(combat.id)) return;
  // Stones gained this same turn survive until the end of the NEXT turn.
  const currentRound = Number(combat.round ?? 1);
  if (currentRound <= Number(flag.round ?? 0)) return;
  try {
    const { getTempColorlessStones, setTempColorlessStones } = await import(
      '../stones/colorless-stones.js'
    );
    const have = getTempColorlessStones(owner);
    const drop = Math.min(have, Math.max(0, Math.floor(Number(flag.count) || 0)));
    if (drop > 0) {
      await setTempColorlessStones(owner, have - drop);
      (globalThis as any).ui?.notifications?.info?.(
        `${String(owner.name ?? 'Character')}: ${drop} unspent Absorption Stone${drop === 1 ? '' : 's'} fade${drop === 1 ? 's' : ''} away.`,
      );
    }
    await owner.unsetFlag?.(FLAG_SCOPE, FLAG_TEMP_STONE_EXPIRY);
  } catch (e) {
    console.warn('Mastery System | Absorption stone expiry failed', e);
  }
}

/** Combat end: remaining Absorbed Damage disappears. */
export async function clearAbsorptionForCombat(combat: any): Promise<void> {
  if (!combat?.combatants) return;
  for (const c of combat.combatants) {
    const actor = c?.actor;
    if (!actor) continue;
    try {
      await actor.unsetFlag?.(FLAG_SCOPE, FLAG_ACCUM);
      await actor.unsetFlag?.(FLAG_SCOPE, FLAG_TEMP_STONE_EXPIRY);
    } catch {
      /* best-effort */
    }
  }
}
