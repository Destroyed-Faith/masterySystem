/**
 * Autofire chain targeting — declare ordered attack slots before the roll.
 *
 * Stepped Attack Chain: first slot in Power Range; each next slot's target is
 * within 4 m of the preceding slot's target (the same creature may be chosen again,
 * 0 m) and still within Range; up to Attack Capacity. Each slot adds +4 TN
 * (slot 1: +0, slot 2: +4, slot 3: +8 …) — not a Paid Raise.
 */

import type { RadialCombatOption } from './radial-menu/types.js';
import { isWithinRangeMeters, measureSceneDistanceBetweenPoints } from './utils/grid-range.js';
import { filterPerceivableTargetIds } from './combat/perception-gate.js';
import {
  AUTOFIRE_CHAIN_LINK_M,
  autofireSlotTnSurcharge,
  getAutofireMaxTargets,
  isAutofireSlotLegal,
} from './combat/autofire.js';

function tokenLabel(tok: any): string {
  return String(tok?.name || tok?.actor?.name || tok?.id || '?');
}

function metersBetweenTokens(a: any, b: any): number {
  const ca = a?.center;
  const cb = b?.center;
  if (!ca || !cb) return Infinity;
  try {
    return measureSceneDistanceBetweenPoints(ca, cb);
  } catch {
    const dx = Number(ca.x) - Number(cb.x);
    const dy = Number(ca.y) - Number(cb.y);
    const grid = (canvas as any)?.grid;
    const size = Number(grid?.size) || 100;
    const dist = Number(grid?.distance) || 1;
    return (Math.hypot(dx, dy) / size) * dist;
  }
}

function collectInRangeHostileIds(attackerToken: any, rangeMeters: number): string[] {
  const ids: string[] = [];
  const tokens = (canvas as any)?.tokens?.placeables ?? [];
  const attackerCenter = attackerToken?.center;
  if (!attackerCenter) return ids;
  const attackerActor = attackerToken.actor;
  const atkDisp = attackerActor?.disposition ?? attackerToken.document?.disposition;

  for (const token of tokens) {
    if (!token?.id || token.id === attackerToken.id) continue;
    if (!token.actor) continue;
    const disp = token.actor.disposition ?? token.document?.disposition;
    if (atkDisp != null && disp != null && disp === atkDisp) continue;
    if (!isWithinRangeMeters(attackerCenter, token.center, rangeMeters)) continue;
    ids.push(token.id);
  }

  if (!attackerActor) return ids;
  return [...filterPerceivableTargetIds(attackerActor, new Set(ids), attackerToken)];
}

/**
 * Legal next slots. Repeats are allowed: the previous slot's own target is always
 * legal (0 m), so a creature can fill many slots.
 */
function validNextIds(
  attackerToken: any,
  rangeMeters: number,
  chain: string[],
  allInRange: string[],
  capacity: number,
): string[] {
  if (chain.length >= capacity) return [];
  if (chain.length === 0) {
    return allInRange.filter((id) =>
      isAutofireSlotLegal({ slotCount: 0, capacity, previousTargetId: null, candidateId: id }),
    );
  }
  const prevId = chain[chain.length - 1]!;
  const prev = (canvas as any)?.tokens?.get(prevId);
  if (!prev) return [];
  return allInRange.filter((id) => {
    const tok = (canvas as any)?.tokens?.get(id);
    if (!tok) return false;
    if (!isWithinRangeMeters(attackerToken.center, tok.center, rangeMeters)) return false;
    return isAutofireSlotLegal({
      slotCount: chain.length,
      capacity,
      previousTargetId: prevId,
      candidateId: id,
      distanceFromPreviousM: id === prevId ? 0 : metersBetweenTokens(prev, tok),
    });
  });
}

type PickerAction =
  | { type: 'add'; id: string }
  | { type: 'removeLast' }
  | { type: 'clear' }
  | { type: 'confirm' }
  | { type: 'cancel' };

function surchargeLabel(slotIndex0: number): string {
  return `+${autofireSlotTnSurcharge(slotIndex0)} TN`;
}

function askPickerStep(opts: {
  chain: string[];
  maxTargets: number;
  rangeMeters: number;
  nextIds: string[];
}): Promise<PickerAction> {
  const DialogCls: any = (globalThis as any).Dialog;
  const { chain, maxTargets, rangeMeters, nextIds } = opts;

  const chainHtml =
    chain.length === 0
      ? '<em>none yet</em>'
      : chain
          .map((id, i) => {
            const t = (canvas as any)?.tokens?.get(id);
            return `Slot ${i + 1}: ${tokenLabel(t)} <small>(${surchargeLabel(i)})</small>`;
          })
          .join('<br>');

  const nextSurcharge = surchargeLabel(chain.length);
  const optionsHtml = nextIds
    .map((id) => {
      const t = (canvas as any)?.tokens?.get(id);
      return `<option value="${id}">${tokenLabel(t)}</option>`;
    })
    .join('');

  return new Promise((resolve) => {
    if (!DialogCls) {
      resolve(nextIds[0] ? { type: 'add', id: nextIds[0] } : { type: 'cancel' });
      return;
    }

    const buttons: Record<string, any> = {};
    if (nextIds.length) {
      buttons.add = {
        icon: '<i class="fas fa-plus"></i>',
        label: `Add slot ${chain.length + 1} (${nextSurcharge})`,
        callback: (html: any) => {
          const root = html?.[0] ?? html;
          const sel =
            root?.querySelector?.('#ms-autofire-next') ??
            root?.find?.('#ms-autofire-next')?.[0];
          const id = String(sel?.value || nextIds[0]);
          resolve({ type: 'add', id });
        },
      };
    }
    if (chain.length >= 1) {
      buttons.removeLast = {
        icon: '<i class="fas fa-undo"></i>',
        label: 'Remove last',
        callback: () => resolve({ type: 'removeLast' }),
      };
      buttons.clear = {
        icon: '<i class="fas fa-trash"></i>',
        label: 'Clear',
        callback: () => resolve({ type: 'clear' }),
      };
      buttons.confirm = {
        icon: '<i class="fas fa-check"></i>',
        label: `Confirm (${chain.length} slot${chain.length === 1 ? '' : 's'})`,
        callback: () => resolve({ type: 'confirm' }),
      };
    }
    buttons.cancel = {
      icon: '<i class="fas fa-times"></i>',
      label: 'Cancel',
      callback: () => resolve({ type: 'cancel' }),
    };

    new DialogCls({
      title: `Autofire chain (${chain.length}/${maxTargets} slots)`,
      content: `
        <div class="mastery-autofire-picker">
          <p><strong>Attack slots</strong> (each next target ≤ ${AUTOFIRE_CHAIN_LINK_M} m from the previous slot's target; the same creature may repeat; all within ${rangeMeters} m):</p>
          <p>${chainHtml}</p>
          ${
            nextIds.length
              ? `<p><label>Slot ${chain.length + 1} target (${nextSurcharge}):<br><select id="ms-autofire-next" style="width:100%">${optionsHtml}</select></label></p>`
              : chain.length >= maxTargets
                ? `<p><em>Attack Capacity reached.</em></p>`
                : `<p><em>No further legal targets from the current end of the chain.</em></p>`
          }
          <p class="notes">One Attack Roll. Slot TN = Defense + 4 × (slot − 1) + 4 per Paid Raise (Autofire steps are not Raises). First miss ends the chain; earlier hits stay. One shared Damage Roll is reused for every hit. Dive for Cover cannot be used.</p>
        </div>
      `,
      buttons,
      default: nextIds.length ? 'add' : chain.length ? 'confirm' : 'cancel',
      close: () => resolve({ type: 'cancel' }),
    }).render(true);
  });
}

/**
 * Interactive Autofire chain picker. Returns ordered token ids — one entry per
 * attack slot, so the same id may appear several times — or null if cancelled.
 */
export async function promptAutofireChain(
  attackerToken: any,
  option: RadialCombatOption,
): Promise<string[] | null> {
  const maxTargets = getAutofireMaxTargets(option);
  const rangeMeters =
    typeof option.range === 'number' && option.range > 0 ? option.range : 30;
  const allInRange = collectInRangeHostileIds(attackerToken, rangeMeters);

  if (!allInRange.length) {
    ui.notifications?.warn?.('Autofire: no valid targets in range.');
    return null;
  }

  const chain: string[] = [];

  // Loop until the player confirms or cancels. Reaching capacity keeps the dialog
  // open so the declaration can still be adjusted (Remove last / Clear) before the roll.
  for (;;) {
    const nextIds = validNextIds(attackerToken, rangeMeters, chain, allInRange, maxTargets);
    if (!nextIds.length && chain.length === 0) {
      ui.notifications?.warn?.('Autofire: no valid targets in range.');
      return null;
    }

    const action = await askPickerStep({
      chain,
      maxTargets,
      rangeMeters,
      nextIds,
    });

    if (action.type === 'cancel') return null;
    if (action.type === 'confirm') return chain.length ? chain.slice() : null;
    if (action.type === 'removeLast') {
      chain.pop();
      continue;
    }
    if (action.type === 'clear') {
      chain.length = 0;
      continue;
    }
    if (action.type === 'add' && nextIds.includes(action.id)) {
      chain.push(action.id);
    }
  }
}
