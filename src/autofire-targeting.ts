/**
 * Autofire chain targeting — declare an ordered target list before the roll.
 *
 * Rules: first target in Power Range; each next target within 4 m of the previous
 * and still within Range; no duplicates; up to maxTargets.
 */

import type { RadialCombatOption } from './radial-menu/types.js';
import { isWithinRangeMeters, measureSceneDistanceBetweenPoints } from './utils/grid-range.js';
import { filterPerceivableTargetIds } from './combat/perception-gate.js';
import {
  AUTOFIRE_CHAIN_LINK_M,
  getAutofireMaxTargets,
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

function validNextIds(
  attackerToken: any,
  rangeMeters: number,
  chain: string[],
  allInRange: string[],
): string[] {
  const used = new Set(chain);
  if (chain.length === 0) {
    return allInRange.filter((id) => !used.has(id));
  }
  const prev = (canvas as any)?.tokens?.get(chain[chain.length - 1]);
  if (!prev) return [];
  return allInRange.filter((id) => {
    if (used.has(id)) return false;
    const tok = (canvas as any)?.tokens?.get(id);
    if (!tok) return false;
    if (!isWithinRangeMeters(attackerToken.center, tok.center, rangeMeters)) return false;
    return metersBetweenTokens(prev, tok) <= AUTOFIRE_CHAIN_LINK_M + 0.05;
  });
}

type PickerAction = { type: 'add'; id: string } | { type: 'confirm' } | { type: 'cancel' };

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
            return `${i + 1}. ${tokenLabel(t)}`;
          })
          .join('<br>');

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
        label: chain.length === 0 ? 'Add first target' : 'Add next target',
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
      buttons.confirm = {
        icon: '<i class="fas fa-check"></i>',
        label: `Confirm (${chain.length} target${chain.length === 1 ? '' : 's'})`,
        callback: () => resolve({ type: 'confirm' }),
      };
    }
    buttons.cancel = {
      icon: '<i class="fas fa-times"></i>',
      label: 'Cancel',
      callback: () => resolve({ type: 'cancel' }),
    };

    new DialogCls({
      title: `Autofire chain (${chain.length}/${maxTargets})`,
      content: `
        <div class="mastery-autofire-picker">
          <p><strong>Current chain</strong> (each next ≤ ${AUTOFIRE_CHAIN_LINK_M} m from previous; all within ${rangeMeters} m):</p>
          <p>${chainHtml}</p>
          ${
            nextIds.length
              ? `<p><label>Next target:<br><select id="ms-autofire-next" style="width:100%">${optionsHtml}</select></label></p>`
              : `<p><em>No further legal targets from the current end of the chain.</em></p>`
          }
          <p class="notes">One Attack Roll is checked against each Evade in order. First miss ends the chain. Dive for Cover cannot be used.</p>
        </div>
      `,
      buttons,
      default: nextIds.length ? 'add' : chain.length ? 'confirm' : 'cancel',
      close: () => resolve({ type: 'cancel' }),
    }).render(true);
  });
}

/**
 * Interactive Autofire chain picker. Returns ordered token ids, or null if cancelled.
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

  while (chain.length < maxTargets) {
    const nextIds = validNextIds(attackerToken, rangeMeters, chain, allInRange);
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
    if (action.type === 'confirm') {
      return chain.length ? chain.slice() : null;
    }
    if (action.type === 'add' && nextIds.includes(action.id)) {
      chain.push(action.id);
      if (chain.length >= maxTargets) return chain.slice();
      // If no further legal links, auto-confirm.
      const more = validNextIds(attackerToken, rangeMeters, chain, allInRange);
      if (!more.length) return chain.slice();
    }
  }

  return chain.length ? chain.slice() : null;
}
