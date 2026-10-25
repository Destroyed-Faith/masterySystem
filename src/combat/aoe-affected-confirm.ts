/**
 * Instant AoE — confirm the *affected* creature set before an Attack Card.
 *
 * No Primary Target: every listed token is an equal participant of one shared
 * Attack Roll vs its own Evade. Hits are decided after the roll.
 */

import { highlightHexesInRange, clearHexHighlight } from '../utils/hex-highlighting.js';
import { gridStepsFromMeters } from '../utils/grid-range.js';
import { excludeAlliesFromAoePool } from './aoe-target-filter.js';

const HIGHLIGHT_ID = 'mastery-melee-aoe-affected-preview';

export type AoeAffectedConfirmResult =
  | 'cancelled'
  | { affectedTokenIds: string[] };

/**
 * Show a self-centered radius preview, list affected creatures (not "hits"),
 * and ask the player to confirm. Cancel returns without spending resources.
 */
export async function promptMeleeAoeAffectedConfirm(params: {
  attackerToken: any;
  candidateTokenIds: string[];
  radiusMeters: number;
  powerName: string;
}): Promise<AoeAffectedConfirmResult> {
  const { attackerToken, powerName } = params;
  const radiusMeters = Math.max(0, Number(params.radiusMeters) || 0);
  const filtered = excludeAlliesFromAoePool(attackerToken, params.candidateTokenIds || []);
  if (!filtered.length) {
    ui.notifications?.warn?.('Melee AoE: no valid targets in the area (only allies in range).');
    return 'cancelled';
  }

  try {
    const steps = gridStepsFromMeters(radiusMeters);
    if (attackerToken?.id && steps > 0) {
      highlightHexesInRange(attackerToken.id, steps, HIGHLIGHT_ID, 0xff6644, 0.45);
    }
  } catch {
    /* preview is best-effort */
  }

  const names = filtered.map((id) => {
    const tok = (canvas as any)?.tokens?.get?.(id);
    return String(tok?.name || tok?.actor?.name || id);
  });

  const listHtml = names.map((n) => `<li>${escapeHtml(n)}</li>`).join('');
  const content = `
    <div class="mastery-aoe-affected-confirm">
      <p><strong>${escapeHtml(powerName)}</strong> — Instant Melee AoE</p>
      <p>Radius <strong>${radiusMeters} m</strong> (self-centered). One Attack Roll vs each creature's Evade; equal payload. No Primary Target.</p>
      <p><strong>Affected creatures</strong> (hits decided after the roll):</p>
      <ul style="margin:0.35em 0 0.75em 1.2em; max-height:12em; overflow:auto;">${listHtml}</ul>
    </div>
  `;

  const Dialog = (globalThis as any).Dialog;
  try {
    if (!Dialog?.wait) {
      clearHexHighlight(HIGHLIGHT_ID);
      return { affectedTokenIds: filtered };
    }
    const choice = await Dialog.wait({
      title: `${powerName} — Affected creatures`,
      content,
      buttons: {
        confirm: { label: 'Confirm AoE', callback: () => 'confirm' },
        cancel: { label: 'Cancel', callback: () => 'cancel' },
      },
      default: 'confirm',
      close: () => 'cancel',
    });
    clearHexHighlight(HIGHLIGHT_ID);
    if (choice !== 'confirm') return 'cancelled';
    return { affectedTokenIds: filtered };
  } catch {
    clearHexHighlight(HIGHLIGHT_ID);
    return 'cancelled';
  }
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
