/**
 * Melee weapon AoE — pick the primary target (full payload) vs secondary targets (power AoE only).
 */

import type { RadialCombatOption } from './token-radial-menu.js';

export type MeleeAoePrimaryChoice =
  | 'cancelled'
  | {
      primaryTokenId: string | null;
      /** Burst pool after the ally filter — secondaries must come from this list. */
      effectiveBurstTokenIds: string[];
    };

/**
 * True when `token` counts as allied with the attacker for the AoE ally filter:
 * same actor, matching disposition side (FRIENDLY↔FRIENDLY or HOSTILE↔HOSTILE),
 * or both actors sharing a player owner.
 */
function isAlliedWithAttacker(attackerToken: any, token: any): boolean {
  const attackerActor = attackerToken?.actor;
  const targetActor = token?.actor;
  if (!attackerActor || !targetActor) return false;
  if (attackerActor.id === targetActor.id) return true;

  const ad = attackerToken?.document?.disposition ?? attackerToken?.disposition;
  const od = token?.document?.disposition ?? token?.disposition;
  const F = (CONST as any).TOKEN_DISPOSITIONS.FRIENDLY;
  const H = (CONST as any).TOKEN_DISPOSITIONS.HOSTILE;
  if (ad === F && od === F) return true;
  if (ad === H && od === H) return true;

  if (attackerActor.hasPlayerOwner && targetActor.hasPlayerOwner) {
    const a = attackerActor.ownership || {};
    const b = targetActor.ownership || {};
    for (const userId in a) {
      if (userId !== 'default' && a[userId] > 0 && b[userId] > 0) return true;
    }
  }
  return false;
}

/**
 * Prompt for primary token when multiple hostiles are in the burst.
 * Returns `cancelled` if the user closes without confirming.
 * `primaryTokenId: null` = no primary (all targets take AoE-only damage — no attack roll path).
 *
 * The dialog carries a pre-checked "Exclude allies/players" filter: allied
 * tokens are removed from the primary dropdown AND from the effective burst
 * pool (secondaries). Unchecking re-allows friendly fire.
 */
export function promptMeleeAoePrimaryChoice(
  burstTokenIds: string[],
  attackerTokenId: string,
  _option: RadialCombatOption,
): Promise<MeleeAoePrimaryChoice> {
  if (burstTokenIds.length === 0) {
    return Promise.resolve('cancelled');
  }

  const attackerToken = (canvas as any)?.tokens?.get?.(attackerTokenId);
  const allyIds = new Set<string>(
    burstTokenIds.filter((id) => {
      const t = (canvas as any)?.tokens?.get?.(id);
      return t ? isAlliedWithAttacker(attackerToken, t) : false;
    }),
  );

  // Single non-ally target: nothing to choose.
  if (burstTokenIds.length === 1 && !allyIds.has(burstTokenIds[0]!)) {
    return Promise.resolve({
      primaryTokenId: burstTokenIds[0]!,
      effectiveBurstTokenIds: [...burstTokenIds],
    });
  }

  const esc = (s: string) =>
    String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const tokenName = (id: string): string => {
    const t = (canvas as any)?.tokens?.get?.(id);
    return String(t?.name ?? id);
  };

  const buildOptionsHtml = (excludeAllies: boolean): string => {
    const ids = excludeAllies ? burstTokenIds.filter((id) => !allyIds.has(id)) : burstTokenIds;
    if (!ids.length) {
      return `<option value="">— no valid targets (allies excluded) —</option>`;
    }
    return ids
      .map((id) => `<option value="${id}">${esc(tokenName(id))}${allyIds.has(id) ? ' (ally)' : ''}</option>`)
      .join('');
  };

  return new Promise((resolve) => {
    const dlg = new Dialog({
      title: 'Melee AoE — Primary target',
      content: `<p style="margin-bottom:0.5em">One attack roll is made against the <strong>primary</strong> target (full hit). Other enemies in the burst take only the power’s AoE damage after optional Body saves.</p>
        <label for="ms-aoe-exclude-allies" style="display:flex;align-items:center;gap:0.35em;margin:0.35em 0" title="Verbündete und Spieler-Charaktere werden weder Primärziel noch Sekundärziel, solange aktiv.">
          <input type="checkbox" id="ms-aoe-exclude-allies" checked />
          <span>Exclude allies/players (Verbündete ausnehmen)</span>
        </label>
        <label for="ms-aoe-primary" style="display:block;margin:0.35em 0 0.15em 0">Primary (fully in the AoE):</label>
        <select id="ms-aoe-primary" style="width:100%;margin-bottom:0.75em">${buildOptionsHtml(true)}</select>
        <p style="font-size:0.85em;opacity:0.85;margin:0">Pick <strong>(No primary)</strong> if nobody takes the direct hit — then only listed AoE damage applies to everyone (no attack roll).</p>
        <label for="ms-aoe-primary-none" style="display:flex;align-items:center;gap:0.35em;margin-top:0.35em">
          <input type="checkbox" id="ms-aoe-primary-none" />
          <span>No primary (AoE pressure only)</span>
        </label>`,
      buttons: {
        ok: {
          icon: '<i class="fas fa-check"></i>',
          label: 'Confirm',
          callback: (html: JQuery) => {
            const excludeAllies = html.find('#ms-aoe-exclude-allies').is(':checked');
            const effectiveBurstTokenIds = excludeAllies
              ? burstTokenIds.filter((id) => !allyIds.has(id))
              : [...burstTokenIds];
            if (!effectiveBurstTokenIds.length) {
              ui.notifications?.warn?.(
                'Melee AoE: no valid targets — only allies are in the burst (uncheck the ally filter for friendly fire).',
              );
              resolve('cancelled');
              return;
            }
            const noPri = html.find('#ms-aoe-primary-none').is(':checked');
            if (noPri) {
              resolve({ primaryTokenId: null, effectiveBurstTokenIds });
              return;
            }
            const id = String(html.find('#ms-aoe-primary').val() || '').trim();
            if (!id || !effectiveBurstTokenIds.includes(id)) {
              resolve('cancelled');
              return;
            }
            resolve({ primaryTokenId: id, effectiveBurstTokenIds });
          },
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: 'Cancel',
          callback: () => resolve('cancelled'),
        },
      },
      default: 'ok',
      render: (html: JQuery) => {
        html.find('#ms-aoe-exclude-allies').on('change', (ev: any) => {
          const checked = !!ev.currentTarget.checked;
          html.find('#ms-aoe-primary').html(buildOptionsHtml(checked));
        });
      },
    } as any);
    dlg.render(true);
  });
}
