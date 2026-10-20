/**
 * GM dialog: restore Powers already marked used this round.
 */

import {
  listUsedPowersThisRound,
  refundUsedPowerThisRound,
  type UsedPowerRefundEntry,
} from '../combat/action-economy.js';

function esc(text: string): string {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

function kindLabel(kind: UsedPowerRefundEntry['kind']): string {
  if (kind === 'movementPower') return 'Movement';
  if (kind === 'activeBuff') return 'Buff';
  return 'Power';
}

function buildListHtml(entries: UsedPowerRefundEntry[]): string {
  if (!entries.length) {
    return `<p class="md-sublabel">${esc(
      (globalThis as any).game?.i18n?.localize?.('MASTERY.carousel.refundPowersEmpty') ||
        'No used Powers this round.',
    )}</p>`;
  }
  const rows = entries
    .map(
      (e, i) => `<li class="ms-refund-power-row" data-idx="${i}">
        <span class="ms-refund-power-name"><strong>${esc(e.name)}</strong>
          <em class="md-sublabel">(${esc(kindLabel(e.kind))})</em></span>
        <button type="button" class="ms-refund-power-btn" data-idx="${i}">${esc(
          (globalThis as any).game?.i18n?.localize?.('MASTERY.carousel.refundPowersRestore') ||
            'Restore',
        )}</button>
      </li>`,
    )
    .join('');
  return `<ul class="ms-refund-power-list">${rows}</ul>`;
}

/**
 * Open a simple list of used Powers for this combatant. Each Restore clears
 * that Power's "used this round" mark so it can be tried again.
 */
export async function openGmRefundPowersDialog(actor: any, combat: any): Promise<void> {
  const g = globalThis as any;
  if (!g.game?.user?.isGM || !actor) return;
  const DialogCtor = g.Dialog;
  if (typeof DialogCtor !== 'function') return;

  const economy = actor;
  let entries = listUsedPowersThisRound(economy, combat);
  const titleBase =
    g.game?.i18n?.localize?.('MASTERY.carousel.refundPowersTitle') || 'Restore used Powers';
  const name = String(actor.name || 'Combatant');

  await new Promise<void>((resolve) => {
    const dialog = new DialogCtor({
      title: `${titleBase} — ${name}`,
      content: `<form class="ms-refund-powers-dialog">
        <p class="md-sublabel">${esc(
          g.game?.i18n?.localize?.('MASTERY.carousel.refundPowersLead') ||
            'Powers already used this round. Restore one so it can be used again (actions are separate: +A / +M / +R).',
        )}</p>
        <div class="js-refund-powers-body">${buildListHtml(entries)}</div>
      </form>`,
      buttons: {
        close: { label: g.game?.i18n?.localize?.('Close') || 'Close' },
      },
      default: 'close',
      close: () => resolve(),
      render: (html: any) => {
        const $ = g.$;
        const root = $(html);
        const body = root.find('.js-refund-powers-body');

        const bind = () => {
          body.find('.ms-refund-power-btn').off('click.msRefund').on('click.msRefund', async (ev: any) => {
            ev.preventDefault();
            const idx = Math.floor(Number($(ev.currentTarget).attr('data-idx')) || -1);
            const entry = entries[idx];
            if (!entry) return;
            const ok = await refundUsedPowerThisRound(economy, combat, entry);
            if (!ok) {
              g.ui?.notifications?.warn?.(
                g.game?.i18n?.localize?.('MASTERY.carousel.refundPowersFailed') ||
                  'Could not restore that Power.',
              );
              return;
            }
            g.ui?.notifications?.info?.(
              (
                g.game?.i18n?.localize?.('MASTERY.carousel.refundPowersDone') ||
                'Restored {power} for {name}.'
              )
                .replace('{power}', entry.name)
                .replace('{name}', name),
            );
            entries = listUsedPowersThisRound(economy, combat);
            body.html(buildListHtml(entries));
            bind();
            try {
              g.Hooks?.callAll?.('masterySystem.roundStateUpdated', { actorId: economy.id });
            } catch {
              /* ignore */
            }
          });
        };
        bind();
      },
    });
    dialog.render(true);
  });
}
