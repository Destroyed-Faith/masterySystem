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

function t(key: string, fallback: string): string {
  return String((globalThis as any).game?.i18n?.localize?.(key) || fallback);
}

function kindLabel(kind: UsedPowerRefundEntry['kind']): string {
  if (kind === 'movementPower') return t('MASTERY.carousel.refundPowersKindMovement', 'Movement');
  if (kind === 'activeBuff') return t('MASTERY.carousel.refundPowersKindBuff', 'Active Buff');
  return t('MASTERY.carousel.refundPowersKindPower', 'Power');
}

function buildListHtml(entries: UsedPowerRefundEntry[]): string {
  if (!entries.length) {
    return `<p class="ms-refund-powers-empty">${esc(t('MASTERY.carousel.refundPowersEmpty', 'No used Powers this round.'))}</p>`;
  }
  return `<ul class="ms-refund-power-list">${entries
    .map(
      (e, i) => `<li class="ms-refund-power-row" data-idx="${i}">
        <span class="ms-refund-power-name">
          <strong>${esc(e.name)}</strong>
          <span class="ms-refund-power-kind">${esc(kindLabel(e.kind))}</span>
        </span>
        <button type="button" class="ms-refund-power-btn" data-idx="${i}">${esc(
          t('MASTERY.carousel.refundPowersRestore', 'Restore'),
        )}</button>
      </li>`,
    )
    .join('')}</ul>`;
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
  const titleBase = t('MASTERY.carousel.refundPowersTitle', 'Restore used Powers');
  const name = String(actor.name || 'Combatant');

  await new Promise<void>((resolve) => {
    const dialog = new DialogCtor({
      title: `${titleBase} — ${name}`,
      content: `<div class="ms-refund-powers-dialog">
        <p class="ms-refund-powers-lead">${esc(
          t(
            'MASTERY.carousel.refundPowersLead',
            'Powers already used this round. Restore one so it can be used again. Attack / Movement / Reaction actions are separate (+A / +M / +R).',
          ),
        )}</p>
        <div class="js-refund-powers-body">${buildListHtml(entries)}</div>
      </div>`,
      buttons: {
        close: { label: g.game?.i18n?.localize?.('Close') || 'Close' },
      },
      default: 'close',
      close: () => resolve(),
      render: (html: any) => {
        const rootEl: HTMLElement | null =
          html?.[0] instanceof HTMLElement
            ? html[0]
            : html instanceof HTMLElement
              ? html
              : typeof html?.find === 'function'
                ? (html.find('.ms-refund-powers-dialog')[0] as HTMLElement) || null
                : null;
        const body =
          rootEl?.querySelector?.('.js-refund-powers-body') ||
          (typeof html?.find === 'function' ? html.find('.js-refund-powers-body')[0] : null);
        if (!body || (body as any)._msRefundBound) return;
        (body as any)._msRefundBound = true;

        const onClick = async (ev: Event) => {
          const target = ev.target as HTMLElement | null;
          const btn = target?.closest?.('.ms-refund-power-btn') as HTMLButtonElement | null;
          if (!btn || !body.contains(btn)) return;
          ev.preventDefault();
          ev.stopPropagation();
          if (btn.disabled) return;
          const idx = Math.floor(Number(btn.getAttribute('data-idx')) || -1);
          const entry = entries[idx];
          if (!entry) return;
          btn.disabled = true;
          try {
            const ok = await refundUsedPowerThisRound(economy, combat, entry);
            if (!ok) {
              g.ui?.notifications?.warn?.(
                t('MASTERY.carousel.refundPowersFailed', 'Could not restore that Power.'),
              );
              btn.disabled = false;
              return;
            }
            g.ui?.notifications?.info?.(
              t('MASTERY.carousel.refundPowersDone', 'Restored {power} for {name}.')
                .replace('{power}', entry.name)
                .replace('{name}', name),
            );
            entries = listUsedPowersThisRound(economy, combat);
            body.innerHTML = buildListHtml(entries);
            try {
              g.Hooks?.callAll?.('masterySystem.roundStateUpdated', { actorId: economy.id });
            } catch {
              /* ignore */
            }
          } catch (err) {
            console.error('Mastery System | GM refund power failed', err);
            g.ui?.notifications?.warn?.(
              t('MASTERY.carousel.refundPowersFailed', 'Could not restore that Power.'),
            );
            btn.disabled = false;
          }
        };

        body.addEventListener('click', onClick);
      },
    }, { width: 480, jQuery: true });
    dialog.render(true);
  });
}
