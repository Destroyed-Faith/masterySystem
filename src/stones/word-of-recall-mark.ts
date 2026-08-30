/**
 * Word of Recall — mark tracking (PG "Word of Recall (Ritual)").
 *
 * Special Cost Rule: the Stones paid remain Sealed while the mark exists.
 * They return only after the mark is used, dismissed, broken, or removed,
 * followed by a Safe Haven Rest. The mark is stored as an actor flag; the
 * Safe Haven Rest builder keeps the marked Stones Sealed while it is set.
 */

const FLAG_SCOPE = 'mastery-system';
const FLAG_MARK = 'wordOfRecallMark';

export interface WordOfRecallMark {
  /** Sealed stones per stone-pool attribute (placed-stone path). */
  attrCounts: Record<string, number>;
  /** Sealed stones from the generic ready/exhausted path. */
  generic: number;
  raise: number;
  createdAt: number;
}

export function getWordOfRecallMark(actor: any): WordOfRecallMark | null {
  const mark = actor?.getFlag?.(FLAG_SCOPE, FLAG_MARK) as WordOfRecallMark | undefined;
  if (!mark) return null;
  const total =
    Math.max(0, Math.floor(Number(mark.generic) || 0)) +
    Object.values(mark.attrCounts ?? {}).reduce((s, n) => s + Math.max(0, Math.floor(Number(n) || 0)), 0);
  return total > 0 ? mark : null;
}

export async function setWordOfRecallMark(
  actor: any,
  mark: Omit<WordOfRecallMark, 'createdAt'>,
): Promise<void> {
  await actor?.setFlag?.(FLAG_SCOPE, FLAG_MARK, { ...mark, createdAt: Date.now() });
}

/** Mark used / dismissed / broken — the next Safe Haven Rest returns the Stones. */
export async function clearWordOfRecallMark(actor: any): Promise<void> {
  await actor?.unsetFlag?.(FLAG_SCOPE, FLAG_MARK);
}

/** Chat button handler: "Use / Dismiss Mark" on the Word of Recall success card. */
export function registerWordOfRecallChatHandler(): void {
  Hooks.on('renderChatMessageHTML', (_message: any, htmlRaw: HTMLElement | JQuery) => {
    try {
      const htmlEl = htmlRaw instanceof HTMLElement ? $(htmlRaw) : htmlRaw;
      const btn = htmlEl.find('[data-action="word-of-recall-release"]');
      if (btn.length === 0 || btn.data('handler-attached')) return;
      btn.data('handler-attached', true);

      btn.off('click.wor-release').on('click.wor-release', async (event: JQuery.ClickEvent) => {
        event.preventDefault();
        const actorId = String($(event.currentTarget).data('actor-id') ?? '');
        const actor = (globalThis as any).game?.actors?.get?.(actorId);
        if (!actor) return;
        if (!actor.isOwner && !(globalThis as any).game?.user?.isGM) {
          ui.notifications?.warn('Only the owner or GM can release a Word of Recall mark.');
          return;
        }
        const mark = getWordOfRecallMark(actor);
        if (!mark) {
          ui.notifications?.info(`${actor.name} has no active Word of Recall mark.`);
          return;
        }
        await clearWordOfRecallMark(actor);
        await ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ actor }),
          content:
            `<p><strong>${actor.name}</strong>'s Word of Recall mark is used or dismissed. ` +
            `The Sealed Stones return after the next Safe Haven Rest.</p>`,
        } as any);
      });
    } catch (err) {
      console.warn('Mastery System | Word of Recall chat handler failed', err);
    }
  });
}
